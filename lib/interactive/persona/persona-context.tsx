'use client';

/**
 * Persona Context Provider
 * Phase 4.4: Dynamic UI Generation Based on User Interactions
 *
 * Tracks visitor persona state and enables dynamic content adaptation
 * based on user behavior, self-identification, and interaction patterns.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface PersonaDefinition {
  id: string;
  label: string;
  description?: string;
  /** Keywords that indicate this persona */
  keywords?: string[];
  /** Priority for UI adaptations (higher = more important) */
  priority?: number;
}

export interface InteractionEvent {
  type: 'page_view' | 'section_view' | 'click' | 'chat_message' | 'role_select' | 'scroll';
  target?: string;
  value?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PersonaSignal {
  personaId: string;
  confidence: number; // 0-1
  source: 'self_identified' | 'inferred' | 'chat_analysis' | 'behavior';
  timestamp: number;
}

export interface ContentVariant {
  /** Variant ID */
  id: string;
  /** Target persona IDs */
  targetPersonas: string[];
  /** Content overrides */
  content: Record<string, unknown>;
  /** Priority for selection */
  priority?: number;
}

export interface PersonaState {
  /** Active persona ID (highest confidence) */
  activePersonaId: string | null;
  /** Active persona label */
  activePersonaLabel: string | null;
  /** All detected persona signals */
  signals: PersonaSignal[];
  /** User interactions history */
  interactions: InteractionEvent[];
  /** Whether user self-identified */
  selfIdentified: boolean;
  /** Confidence score for active persona (0-1) */
  confidence: number;
  /** Session ID for tracking */
  sessionId: string;
}

export interface PersonaContextValue extends PersonaState {
  /** Set persona from self-identification */
  setPersona: (personaId: string, personaLabel: string) => void;
  /** Add a persona signal from inference */
  addSignal: (personaId: string, confidence: number, source: PersonaSignal['source']) => void;
  /** Record an interaction event */
  recordInteraction: (event: Omit<InteractionEvent, 'timestamp'>) => void;
  /** Get the best content variant for current persona */
  getContentVariant: <T extends Record<string, unknown>>(
    baseContent: T,
    variants: ContentVariant[]
  ) => T;
  /** Check if current persona matches a target */
  matchesPersona: (targetPersonaIds: string[]) => boolean;
  /** Clear persona (reset) */
  clearPersona: () => void;
  /** Get persona-specific greeting */
  getPersonaGreeting: () => string;
  /** Get adaptation hints for AI */
  getAdaptationHints: () => string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PERSONAS: PersonaDefinition[] = [
  {
    id: 'developer',
    label: 'Developer',
    description: 'Technical users who build software',
    keywords: ['api', 'sdk', 'integration', 'code', 'documentation', 'technical'],
    priority: 1,
  },
  {
    id: 'business-owner',
    label: 'Business Owner',
    description: 'Entrepreneurs and small business owners',
    keywords: ['pricing', 'roi', 'cost', 'growth', 'revenue', 'customers'],
    priority: 1,
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    description: 'Large organization decision makers',
    keywords: ['security', 'compliance', 'scale', 'enterprise', 'sso', 'sla'],
    priority: 2,
  },
  {
    id: 'student',
    label: 'Student',
    description: 'Learners and explorers',
    keywords: ['learn', 'tutorial', 'free', 'educational', 'getting started'],
    priority: 0,
  },
];

const STORAGE_KEY = 'nextgenweb_persona_state';

// ============================================================================
// HELPERS
// ============================================================================

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getStoredState(): Partial<PersonaState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if session is still valid (within 24 hours)
      const lastInteraction = parsed.interactions?.[parsed.interactions.length - 1]?.timestamp;
      if (lastInteraction && Date.now() - lastInteraction < 24 * 60 * 60 * 1000) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading persona state:', e);
  }
  return null;
}

function saveState(state: PersonaState): void {
  if (typeof window === 'undefined') return;
  try {
    // Only save essential state (limit interactions to last 50)
    const toSave = {
      ...state,
      interactions: state.interactions.slice(-50),
      signals: state.signals.slice(-20),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Error saving persona state:', e);
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const PersonaContext = createContext<PersonaContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export interface PersonaProviderProps {
  children: ReactNode;
  /** Custom persona definitions */
  personas?: PersonaDefinition[];
}

export function PersonaProvider({ children, personas = DEFAULT_PERSONAS }: PersonaProviderProps) {
  const [state, setState] = useState<PersonaState>(() => {
    const stored = getStoredState();
    return {
      activePersonaId: stored?.activePersonaId || null,
      activePersonaLabel: stored?.activePersonaLabel || null,
      signals: stored?.signals || [],
      interactions: stored?.interactions || [],
      selfIdentified: stored?.selfIdentified || false,
      confidence: stored?.confidence || 0,
      sessionId: stored?.sessionId || generateSessionId(),
    };
  });

  // Save state changes to localStorage
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Set persona from self-identification
  const setPersona = useCallback((personaId: string, personaLabel: string) => {
    setState(prev => {
      const newSignal: PersonaSignal = {
        personaId,
        confidence: 1.0, // Self-identification is highest confidence
        source: 'self_identified',
        timestamp: Date.now(),
      };

      return {
        ...prev,
        activePersonaId: personaId,
        activePersonaLabel: personaLabel,
        selfIdentified: true,
        confidence: 1.0,
        signals: [...prev.signals, newSignal],
      };
    });
  }, []);

  // Add a persona signal from inference
  const addSignal = useCallback((
    personaId: string,
    confidence: number,
    source: PersonaSignal['source']
  ) => {
    setState(prev => {
      const newSignal: PersonaSignal = {
        personaId,
        confidence: Math.min(1, Math.max(0, confidence)),
        source,
        timestamp: Date.now(),
      };

      const signals = [...prev.signals, newSignal];

      // If not self-identified, calculate best persona from signals
      if (!prev.selfIdentified) {
        const personaScores = new Map<string, number>();

        // Weight signals by recency and confidence
        signals.forEach((signal, index) => {
          const recencyWeight = 0.5 + (index / signals.length) * 0.5; // More recent = higher weight
          const score = signal.confidence * recencyWeight;
          personaScores.set(
            signal.personaId,
            (personaScores.get(signal.personaId) || 0) + score
          );
        });

        // Find best persona
        let bestPersonaId = prev.activePersonaId;
        let bestScore = 0;
        personaScores.forEach((score, id) => {
          if (score > bestScore) {
            bestScore = score;
            bestPersonaId = id;
          }
        });

        const bestPersona = personas.find(p => p.id === bestPersonaId);

        return {
          ...prev,
          signals,
          activePersonaId: bestPersonaId,
          activePersonaLabel: bestPersona?.label || null,
          confidence: Math.min(1, bestScore / signals.length),
        };
      }

      return { ...prev, signals };
    });
  }, [personas]);

  // Record an interaction event
  const recordInteraction = useCallback((event: Omit<InteractionEvent, 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      interactions: [...prev.interactions, { ...event, timestamp: Date.now() }],
    }));

    // Analyze interaction for persona signals
    if (event.type === 'chat_message' && event.value) {
      const message = event.value.toLowerCase();
      personas.forEach(persona => {
        const matchedKeywords = persona.keywords?.filter(kw =>
          message.includes(kw.toLowerCase())
        ) || [];

        if (matchedKeywords.length > 0) {
          const confidence = Math.min(0.8, 0.2 + matchedKeywords.length * 0.15);
          addSignal(persona.id, confidence, 'chat_analysis');
        }
      });
    }
  }, [personas, addSignal]);

  // Get the best content variant for current persona
  const getContentVariant = useCallback(<T extends Record<string, unknown>>(
    baseContent: T,
    variants: ContentVariant[]
  ): T => {
    if (!state.activePersonaId || variants.length === 0) {
      return baseContent;
    }

    // Find matching variants sorted by priority
    const matchingVariants = variants
      .filter(v => v.targetPersonas.includes(state.activePersonaId!))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (matchingVariants.length === 0) {
      return baseContent;
    }

    // Merge base content with variant overrides
    return {
      ...baseContent,
      ...matchingVariants[0].content,
    } as T;
  }, [state.activePersonaId]);

  // Check if current persona matches a target
  const matchesPersona = useCallback((targetPersonaIds: string[]): boolean => {
    if (!state.activePersonaId) return false;
    return targetPersonaIds.includes(state.activePersonaId);
  }, [state.activePersonaId]);

  // Clear persona
  const clearPersona = useCallback(() => {
    setState(prev => ({
      ...prev,
      activePersonaId: null,
      activePersonaLabel: null,
      selfIdentified: false,
      confidence: 0,
      signals: [],
    }));
  }, []);

  // Get persona-specific greeting
  const getPersonaGreeting = useCallback((): string => {
    if (!state.activePersonaId) {
      return "Welcome! How can we help you today?";
    }

    const greetings: Record<string, string> = {
      developer: "Hey there, developer! Ready to dive into the technical details?",
      'business-owner': "Welcome! Let's explore how we can help grow your business.",
      enterprise: "Welcome! We're ready to discuss enterprise-grade solutions.",
      student: "Hi there! Excited to help you learn something new today!",
    };

    return greetings[state.activePersonaId] ||
      `Welcome, ${state.activePersonaLabel}! How can we assist you?`;
  }, [state.activePersonaId, state.activePersonaLabel]);

  // Get adaptation hints for AI
  const getAdaptationHints = useCallback((): string => {
    const hints: string[] = [];

    if (state.activePersonaId && state.activePersonaLabel) {
      hints.push(`User persona: ${state.activePersonaLabel}`);

      if (state.selfIdentified) {
        hints.push('(self-identified)');
      } else {
        hints.push(`(inferred with ${Math.round(state.confidence * 100)}% confidence)`);
      }
    }

    // Add interaction context
    const recentInteractions = state.interactions.slice(-5);
    const sections = recentInteractions
      .filter(i => i.type === 'section_view')
      .map(i => i.target)
      .filter(Boolean);

    if (sections.length > 0) {
      hints.push(`Recently viewed: ${[...new Set(sections)].join(', ')}`);
    }

    return hints.join(' ');
  }, [state]);

  const value: PersonaContextValue = {
    ...state,
    setPersona,
    addSignal,
    recordInteraction,
    getContentVariant,
    matchesPersona,
    clearPersona,
    getPersonaGreeting,
    getAdaptationHints,
  };

  return (
    <PersonaContext.Provider value={value}>
      {children}
    </PersonaContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function usePersonaContext(): PersonaContextValue {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersonaContext must be used within a PersonaProvider');
  }
  return context;
}

export function usePersonaContextOptional(): PersonaContextValue | null {
  return useContext(PersonaContext);
}

// ============================================================================
// CONTENT VARIANT HOOK
// ============================================================================

/**
 * Hook to get persona-adapted content
 */
export function useAdaptedContent<T extends Record<string, unknown>>(
  baseContent: T,
  variants: ContentVariant[]
): T {
  const persona = usePersonaContextOptional();

  if (!persona) {
    return baseContent;
  }

  return persona.getContentVariant(baseContent, variants);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { DEFAULT_PERSONAS };
export default PersonaProvider;
