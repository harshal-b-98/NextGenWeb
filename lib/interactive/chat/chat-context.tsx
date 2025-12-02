'use client';

/**
 * Chat Context Provider
 * Phase 4.4: AI-Powered Conversational Interface
 * Phase 6: Conversational Marketing Platform Extensions
 *
 * Provides global chat state and methods for triggering chat
 * interactions from anywhere in the site.
 *
 * Extended for Phase 6 to support:
 * - CTA-to-Chat bridge for inline content generation
 * - Section insertion callbacks
 * - Conversation journey tracking
 * - Progressive engagement flow
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * CTA source information for tracking where chat was triggered
 */
export interface CTASource {
  /** Unique ID of the CTA element */
  ctaId: string;
  /** Type of CTA (button, link, card, etc.) */
  ctaType: 'button' | 'link' | 'card' | 'hero-cta' | 'inline-cta' | 'floating-cta';
  /** The text content of the CTA */
  ctaText: string;
  /** Section ID where the CTA is located */
  sectionId?: string;
  /** Position of CTA in viewport for scroll targeting */
  position?: { top: number; left: number; width: number; height: number };
  /** Original href/action if it was a navigation CTA */
  originalAction?: string;
  /** Data attributes from the CTA element */
  metadata?: Record<string, string>;
}

/**
 * Generated section content for inline insertion
 */
export interface GeneratedSection {
  /** Unique ID for the generated section */
  id: string;
  /** The CTA that triggered this generation */
  sourceCtaId: string;
  /** HTML/React content to insert */
  content: React.ReactNode;
  /** Section type (features, comparison, testimonials, etc.) */
  sectionType: string;
  /** Animation state */
  animationState: 'entering' | 'visible' | 'exiting' | 'hidden';
  /** Timestamp of generation */
  createdAt: Date;
}

/**
 * Conversation journey tracking
 */
export interface ConversationJourney {
  /** Unique session ID */
  sessionId: string;
  /** Entry point (CTA that started the conversation) */
  entryPoint: CTASource | null;
  /** All CTAs clicked during this journey */
  ctaPath: CTASource[];
  /** Generated sections during this journey */
  generatedSections: string[];
  /** Engagement depth (number of meaningful interactions) */
  engagementDepth: number;
  /** Journey start time */
  startedAt: Date;
  /** Last activity time */
  lastActivityAt: Date;
  /** Whether user has shown high intent (ready for human handoff) */
  highIntent: boolean;
  /** Topics discussed */
  topics: string[];
}

/**
 * Render mode for AI responses
 */
export type ConversationalRenderMode =
  | 'chat-bubble'      // Traditional chat bubble response
  | 'inline-section'   // Generate section below CTA
  | 'section-replace'  // Replace current section
  | 'modal'            // Open in modal
  | 'side-panel'       // Slide-in panel
  | 'full-page';       // Phase 6: Full page section for conversational landing

export interface ChatTriggerOptions {
  /** Pre-filled message to send */
  message?: string;
  /** Section context for the AI */
  sectionContext?: string;
  /** Detected persona ID */
  personaId?: string;
  /** Persona label for display */
  personaLabel?: string;
  /** Whether to auto-send the message */
  autoSend?: boolean;
  /** CTA source information (Phase 6) */
  ctaSource?: CTASource;
  /** Preferred render mode (Phase 6) */
  renderMode?: ConversationalRenderMode;
  /** Callback when section is generated (Phase 6) */
  onSectionGenerated?: (section: GeneratedSection) => void;
}

export interface ChatContextState {
  /** Whether chat is open */
  isOpen: boolean;
  /** Current persona ID (from role picker) */
  personaId: string | null;
  /** Current persona label */
  personaLabel: string | null;
  /** Current section context */
  sectionContext: string | null;
  /** Pending message to send */
  pendingMessage: string | null;
  /** Whether to auto-send pending message */
  autoSend: boolean;
  /** Current CTA source (Phase 6) */
  ctaSource: CTASource | null;
  /** Current render mode (Phase 6) */
  renderMode: ConversationalRenderMode;
  /** Generated sections waiting to be inserted (Phase 6) */
  pendingSections: GeneratedSection[];
  /** Current conversation journey (Phase 6) */
  journey: ConversationJourney | null;
  /** Whether inline content generation is active (Phase 6) */
  isGeneratingInline: boolean;
}

export interface ChatContextValue extends ChatContextState {
  /** Open the chat widget */
  openChat: () => void;
  /** Close the chat widget */
  closeChat: () => void;
  /** Toggle chat open/closed */
  toggleChat: () => void;
  /** Open chat with options (message, context, etc.) */
  triggerChat: (options: ChatTriggerOptions) => void;
  /** Set persona from role picker */
  setPersona: (personaId: string, personaLabel: string) => void;
  /** Clear persona */
  clearPersona: () => void;
  /** Set section context */
  setSectionContext: (context: string | null) => void;
  /** Clear pending message after sending */
  clearPendingMessage: () => void;
  /** Get persona hint for AI */
  getPersonaHint: () => string | undefined;

  // ========== Phase 6: CTA-to-Chat Bridge Methods ==========

  /**
   * Trigger inline content generation from a CTA click
   * Instead of navigating, generates content below the CTA
   */
  triggerFromCTA: (ctaSource: CTASource, options?: Partial<ChatTriggerOptions>) => void;

  /**
   * Register a section insertion callback for a specific CTA
   * Called when content is generated for that CTA
   */
  registerSectionCallback: (
    ctaId: string,
    callback: (section: GeneratedSection) => void
  ) => () => void;

  /**
   * Add a generated section to the pending list
   */
  addPendingSection: (section: GeneratedSection) => void;

  /**
   * Mark a section as inserted (remove from pending)
   */
  markSectionInserted: (sectionId: string) => void;

  /**
   * Update a section's animation state
   */
  updateSectionAnimation: (
    sectionId: string,
    state: GeneratedSection['animationState']
  ) => void;

  /**
   * Set the render mode for responses
   */
  setRenderMode: (mode: ConversationalRenderMode) => void;

  /**
   * Start or continue a conversation journey
   */
  startJourney: (entryPoint: CTASource) => void;

  /**
   * Add a CTA to the current journey path
   */
  addToJourneyPath: (cta: CTASource) => void;

  /**
   * Update journey engagement depth
   */
  incrementEngagement: () => void;

  /**
   * Mark journey as high intent (ready for human handoff)
   */
  markHighIntent: () => void;

  /**
   * Add a topic to the journey
   */
  addJourneyTopic: (topic: string) => void;

  /**
   * Get the current journey state
   */
  getJourney: () => ConversationJourney | null;

  /**
   * Check if we should suggest human handoff
   */
  shouldSuggestHandoff: () => boolean;

  /**
   * Clear inline generation state
   */
  clearInlineState: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ChatContext = createContext<ChatContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export interface ChatProviderProps {
  children: ReactNode;
}

// Generate unique session ID
function generateSessionId(): string {
  return `journey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Threshold for suggesting human handoff
const HANDOFF_ENGAGEMENT_THRESHOLD = 5;
const HANDOFF_TOPICS_THRESHOLD = 3;

export function ChatProvider({ children }: ChatProviderProps) {
  const [state, setState] = useState<ChatContextState>({
    isOpen: false,
    personaId: null,
    personaLabel: null,
    sectionContext: null,
    pendingMessage: null,
    autoSend: false,
    // Phase 6 state
    ctaSource: null,
    renderMode: 'chat-bubble',
    pendingSections: [],
    journey: null,
    isGeneratingInline: false,
  });

  // Ref to store section callbacks (ctaId -> callback)
  const sectionCallbacksRef = useRef<Map<string, (section: GeneratedSection) => void>>(
    new Map()
  );

  // ========== Original Phase 4.4 Methods ==========

  const openChat = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closeChat = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const toggleChat = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const triggerChat = useCallback((options: ChatTriggerOptions) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      pendingMessage: options.message || null,
      autoSend: options.autoSend ?? false,
      sectionContext: options.sectionContext || prev.sectionContext,
      personaId: options.personaId || prev.personaId,
      personaLabel: options.personaLabel || prev.personaLabel,
      // Phase 6 additions
      ctaSource: options.ctaSource || prev.ctaSource,
      renderMode: options.renderMode || prev.renderMode,
    }));
  }, []);

  const setPersona = useCallback((personaId: string, personaLabel: string) => {
    setState(prev => ({
      ...prev,
      personaId,
      personaLabel,
    }));

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat_persona_id', personaId);
      localStorage.setItem('chat_persona_label', personaLabel);
    }
  }, []);

  const clearPersona = useCallback(() => {
    setState(prev => ({
      ...prev,
      personaId: null,
      personaLabel: null,
    }));

    if (typeof window !== 'undefined') {
      localStorage.removeItem('chat_persona_id');
      localStorage.removeItem('chat_persona_label');
    }
  }, []);

  const setSectionContext = useCallback((context: string | null) => {
    setState(prev => ({ ...prev, sectionContext: context }));
  }, []);

  const clearPendingMessage = useCallback(() => {
    setState(prev => ({
      ...prev,
      pendingMessage: null,
      autoSend: false,
    }));
  }, []);

  const getPersonaHint = useCallback((): string | undefined => {
    if (state.personaLabel) {
      return state.personaLabel;
    }
    return undefined;
  }, [state.personaLabel]);

  // ========== Phase 6: CTA-to-Chat Bridge Methods ==========

  /**
   * Trigger chat/content generation from a CTA click
   * This is the main entry point for the conversational marketing flow
   */
  const triggerFromCTA = useCallback((
    ctaSource: CTASource,
    options?: Partial<ChatTriggerOptions>
  ) => {
    const renderMode = options?.renderMode || 'inline-section';

    setState(prev => {
      // Start or update journey
      const now = new Date();
      const journey: ConversationJourney = prev.journey
        ? {
            ...prev.journey,
            ctaPath: [...prev.journey.ctaPath, ctaSource],
            lastActivityAt: now,
            engagementDepth: prev.journey.engagementDepth + 1,
          }
        : {
            sessionId: generateSessionId(),
            entryPoint: ctaSource,
            ctaPath: [ctaSource],
            generatedSections: [],
            engagementDepth: 1,
            startedAt: now,
            lastActivityAt: now,
            highIntent: false,
            topics: [],
          };

      // Build context message from CTA
      const contextMessage = buildCTAContextMessage(ctaSource);

      return {
        ...prev,
        ctaSource,
        renderMode,
        sectionContext: ctaSource.sectionId || prev.sectionContext,
        pendingMessage: options?.message || contextMessage,
        autoSend: options?.autoSend ?? true,
        isOpen: renderMode === 'chat-bubble',
        isGeneratingInline: renderMode === 'inline-section',
        journey,
      };
    });
  }, []);

  /**
   * Register a callback for when a section is generated for a specific CTA
   */
  const registerSectionCallback = useCallback((
    ctaId: string,
    callback: (section: GeneratedSection) => void
  ) => {
    sectionCallbacksRef.current.set(ctaId, callback);

    // Return cleanup function
    return () => {
      sectionCallbacksRef.current.delete(ctaId);
    };
  }, []);

  /**
   * Add a generated section to the pending list and notify callbacks
   */
  const addPendingSection = useCallback((section: GeneratedSection) => {
    setState(prev => ({
      ...prev,
      pendingSections: [...prev.pendingSections, section],
      isGeneratingInline: false,
      journey: prev.journey
        ? {
            ...prev.journey,
            generatedSections: [...prev.journey.generatedSections, section.id],
            lastActivityAt: new Date(),
          }
        : prev.journey,
    }));

    // Notify the callback if registered
    const callback = sectionCallbacksRef.current.get(section.sourceCtaId);
    if (callback) {
      callback(section);
    }
  }, []);

  /**
   * Mark a section as inserted (remove from pending)
   */
  const markSectionInserted = useCallback((sectionId: string) => {
    setState(prev => ({
      ...prev,
      pendingSections: prev.pendingSections.filter(s => s.id !== sectionId),
    }));
  }, []);

  /**
   * Update a section's animation state
   */
  const updateSectionAnimation = useCallback((
    sectionId: string,
    animationState: GeneratedSection['animationState']
  ) => {
    setState(prev => ({
      ...prev,
      pendingSections: prev.pendingSections.map(s =>
        s.id === sectionId ? { ...s, animationState } : s
      ),
    }));
  }, []);

  /**
   * Set the render mode
   */
  const setRenderMode = useCallback((mode: ConversationalRenderMode) => {
    setState(prev => ({ ...prev, renderMode: mode }));
  }, []);

  /**
   * Start a new conversation journey
   */
  const startJourney = useCallback((entryPoint: CTASource) => {
    const now = new Date();
    setState(prev => ({
      ...prev,
      journey: {
        sessionId: generateSessionId(),
        entryPoint,
        ctaPath: [entryPoint],
        generatedSections: [],
        engagementDepth: 1,
        startedAt: now,
        lastActivityAt: now,
        highIntent: false,
        topics: [],
      },
    }));
  }, []);

  /**
   * Add a CTA to the current journey path
   */
  const addToJourneyPath = useCallback((cta: CTASource) => {
    setState(prev => {
      if (!prev.journey) return prev;
      return {
        ...prev,
        journey: {
          ...prev.journey,
          ctaPath: [...prev.journey.ctaPath, cta],
          lastActivityAt: new Date(),
        },
      };
    });
  }, []);

  /**
   * Increment engagement depth
   */
  const incrementEngagement = useCallback(() => {
    setState(prev => {
      if (!prev.journey) return prev;
      const newDepth = prev.journey.engagementDepth + 1;
      return {
        ...prev,
        journey: {
          ...prev.journey,
          engagementDepth: newDepth,
          lastActivityAt: new Date(),
          // Auto-mark high intent at threshold
          highIntent: prev.journey.highIntent || newDepth >= HANDOFF_ENGAGEMENT_THRESHOLD,
        },
      };
    });
  }, []);

  /**
   * Mark journey as high intent
   */
  const markHighIntent = useCallback(() => {
    setState(prev => {
      if (!prev.journey) return prev;
      return {
        ...prev,
        journey: {
          ...prev.journey,
          highIntent: true,
          lastActivityAt: new Date(),
        },
      };
    });
  }, []);

  /**
   * Add a topic to the journey
   */
  const addJourneyTopic = useCallback((topic: string) => {
    setState(prev => {
      if (!prev.journey) return prev;
      const topics = prev.journey.topics.includes(topic)
        ? prev.journey.topics
        : [...prev.journey.topics, topic];
      return {
        ...prev,
        journey: {
          ...prev.journey,
          topics,
          lastActivityAt: new Date(),
          // Auto-mark high intent if many topics discussed
          highIntent: prev.journey.highIntent || topics.length >= HANDOFF_TOPICS_THRESHOLD,
        },
      };
    });
  }, []);

  /**
   * Get the current journey
   */
  const getJourney = useCallback((): ConversationJourney | null => {
    return state.journey;
  }, [state.journey]);

  /**
   * Check if we should suggest human handoff
   */
  const shouldSuggestHandoff = useCallback((): boolean => {
    if (!state.journey) return false;
    return (
      state.journey.highIntent ||
      state.journey.engagementDepth >= HANDOFF_ENGAGEMENT_THRESHOLD ||
      state.journey.topics.length >= HANDOFF_TOPICS_THRESHOLD
    );
  }, [state.journey]);

  /**
   * Clear inline generation state
   */
  const clearInlineState = useCallback(() => {
    setState(prev => ({
      ...prev,
      ctaSource: null,
      isGeneratingInline: false,
      pendingSections: [],
    }));
  }, []);

  // ========== Build Context Value ==========

  const value: ChatContextValue = {
    ...state,
    // Original methods
    openChat,
    closeChat,
    toggleChat,
    triggerChat,
    setPersona,
    clearPersona,
    setSectionContext,
    clearPendingMessage,
    getPersonaHint,
    // Phase 6 methods
    triggerFromCTA,
    registerSectionCallback,
    addPendingSection,
    markSectionInserted,
    updateSectionAnimation,
    setRenderMode,
    startJourney,
    addToJourneyPath,
    incrementEngagement,
    markHighIntent,
    addJourneyTopic,
    getJourney,
    shouldSuggestHandoff,
    clearInlineState,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build a context message from CTA source for the AI
 */
function buildCTAContextMessage(cta: CTASource): string {
  // Map CTA text to implicit user intent
  const ctaText = cta.ctaText.toLowerCase();

  // Common CTA patterns and their implied questions
  const ctaPatterns: [RegExp, string][] = [
    [/learn more/i, `Tell me more about ${cta.metadata?.topic || 'this'}`],
    [/get started/i, 'How do I get started?'],
    [/see pricing|view pricing/i, 'What are the pricing options?'],
    [/try (it )?free|start free/i, 'How can I try this for free?'],
    [/book (a )?demo|schedule demo/i, 'I would like to see a demo'],
    [/contact (us|sales)/i, 'I would like to speak with someone'],
    [/see (how|why)/i, `Explain ${cta.ctaText.replace(/see /i, '')}`],
    [/explore/i, `Show me ${cta.metadata?.topic || 'what you offer'}`],
    [/compare/i, 'How do you compare to alternatives?'],
    [/features/i, 'What features do you offer?'],
    [/sign up|register/i, 'How do I sign up?'],
    [/download/i, `How do I download ${cta.metadata?.topic || 'this'}?`],
  ];

  for (const [pattern, question] of ctaPatterns) {
    if (pattern.test(ctaText)) {
      return question;
    }
  }

  // Fallback: use the CTA text as the question basis
  return `Tell me about: ${cta.ctaText}`;
}

// ============================================================================
// HOOK
// ============================================================================

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

// ============================================================================
// OPTIONAL HOOK (doesn't throw if outside provider)
// ============================================================================

export function useChatContextOptional(): ChatContextValue | null {
  return useContext(ChatContext);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ChatProvider;
