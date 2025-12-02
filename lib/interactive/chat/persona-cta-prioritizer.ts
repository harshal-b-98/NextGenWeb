/**
 * Persona-Aware CTA Prioritization Service
 * Phase 6.3: Rendering & UX (Wave 2)
 *
 * Prioritizes and adapts CTAs based on detected visitor personas.
 * Different personas have different needs, preferences, and conversion paths.
 *
 * Features:
 * - Persona detection from behavior signals
 * - CTA prioritization by persona
 * - Copy/tone adaptation
 * - Intent prediction by persona
 * - Conversion path optimization
 */

import { completeJSON } from '@/lib/ai/client';
import type { SmartCTA, FunnelStage, JourneyContext } from './smart-cta-generator';
import type { IntentCategory } from './types';
import type { TopicCoverage } from './knowledge-depth-analyzer';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Visitor persona categories
 */
export type PersonaCategory =
  | 'decision-maker'      // Executive, budget holder
  | 'technical-evaluator' // Developer, engineer, IT
  | 'end-user'           // Daily user, individual contributor
  | 'researcher'         // Early stage, just learning
  | 'champion'           // Internal advocate, influencer
  | 'unknown';           // Not enough signals

/**
 * Persona profile with preferences
 */
export interface PersonaProfile {
  /** Persona category */
  category: PersonaCategory;
  /** Confidence in detection (0-1) */
  confidence: number;
  /** Primary motivations */
  motivations: string[];
  /** Key objections/concerns */
  objections: string[];
  /** Preferred content types */
  preferredContent: IntentCategory[];
  /** Preferred tone */
  tone: 'formal' | 'casual' | 'technical' | 'friendly';
  /** Typical conversion path */
  conversionPath: FunnelStage[];
  /** Value messaging focus */
  valueFocus: string[];
}

/**
 * Persona detection signals
 */
export interface PersonaSignals {
  /** Topics explored */
  exploredTopics: string[];
  /** Questions asked */
  queries?: string[];
  /** Intents shown */
  intents: IntentCategory[];
  /** Time spent */
  engagementTime?: number;
  /** Section depth */
  sectionDepth?: number;
  /** Referrer source */
  referrer?: string;
  /** URL parameters */
  urlParams?: Record<string, string>;
  /** Company size hint */
  companySizeHint?: string;
  /** Role hint */
  roleHint?: string;
}

/**
 * CTA adaptation result
 */
export interface AdaptedCTA extends SmartCTA {
  /** Original CTA before adaptation */
  originalText: string;
  /** Adaptation confidence */
  adaptationConfidence: number;
  /** Persona-specific value proposition */
  valueProposition?: string;
  /** Why this CTA was prioritized */
  priorityReason: string;
}

/**
 * Persona detection result
 */
export interface PersonaDetectionResult {
  /** Detected persona */
  persona: PersonaProfile;
  /** Signals that led to detection */
  activeSignals: string[];
  /** Alternative personas considered */
  alternatives: Array<{ category: PersonaCategory; confidence: number }>;
  /** Tokens used for AI detection */
  tokensUsed: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Persona profiles with preferences */
const PERSONA_PROFILES: Record<PersonaCategory, Omit<PersonaProfile, 'confidence'>> = {
  'decision-maker': {
    category: 'decision-maker',
    motivations: ['ROI', 'efficiency', 'competitive advantage', 'risk reduction'],
    objections: ['cost', 'implementation time', 'vendor reliability'],
    preferredContent: ['pricing', 'comparison', 'demo-request'],
    tone: 'formal',
    conversionPath: ['awareness', 'decision', 'action'],
    valueFocus: ['business outcomes', 'ROI', 'time savings'],
  },
  'technical-evaluator': {
    category: 'technical-evaluator',
    motivations: ['functionality', 'integration', 'security', 'scalability'],
    objections: ['technical limitations', 'learning curve', 'support quality'],
    preferredContent: ['integration', 'how-it-works', 'support'],
    tone: 'technical',
    conversionPath: ['awareness', 'consideration', 'decision'],
    valueFocus: ['technical capabilities', 'API quality', 'documentation'],
  },
  'end-user': {
    category: 'end-user',
    motivations: ['ease of use', 'time savings', 'daily workflow'],
    objections: ['complexity', 'training required', 'change fatigue'],
    preferredContent: ['product-info', 'use-case', 'how-it-works'],
    tone: 'friendly',
    conversionPath: ['awareness', 'consideration', 'decision', 'action'],
    valueFocus: ['simplicity', 'daily benefits', 'ease of adoption'],
  },
  researcher: {
    category: 'researcher',
    motivations: ['understanding', 'comparison', 'education'],
    objections: ['too early to decide', 'need more information'],
    preferredContent: ['product-info', 'comparison', 'use-case'],
    tone: 'casual',
    conversionPath: ['awareness', 'consideration'],
    valueFocus: ['features', 'differentiation', 'use cases'],
  },
  champion: {
    category: 'champion',
    motivations: ['internal advocacy', 'team success', 'innovation'],
    objections: ['internal buy-in', 'implementation resources'],
    preferredContent: ['use-case', 'comparison', 'demo-request'],
    tone: 'friendly',
    conversionPath: ['consideration', 'decision', 'action'],
    valueFocus: ['team benefits', 'success stories', 'easy rollout'],
  },
  unknown: {
    category: 'unknown',
    motivations: ['general interest'],
    objections: [],
    preferredContent: ['product-info', 'how-it-works'],
    tone: 'friendly',
    conversionPath: ['awareness', 'consideration'],
    valueFocus: ['general value', 'key benefits'],
  },
};

/** Topic indicators for persona detection */
const TOPIC_PERSONA_INDICATORS: Record<string, PersonaCategory[]> = {
  pricing: ['decision-maker', 'champion'],
  integrations: ['technical-evaluator'],
  security: ['technical-evaluator', 'decision-maker'],
  'how-it-works': ['researcher', 'end-user'],
  'use-cases': ['champion', 'end-user'],
  comparisons: ['decision-maker', 'researcher'],
  testimonials: ['champion', 'decision-maker'],
  support: ['technical-evaluator', 'end-user'],
};

/** CTA text adaptations by persona */
const CTA_ADAPTATIONS: Record<PersonaCategory, Record<string, string>> = {
  'decision-maker': {
    'See Features': 'See Business Impact',
    'Learn More': 'Get Executive Summary',
    'View Pricing': 'See ROI Calculator',
    'Request Demo': 'Schedule Executive Briefing',
    'Get Started': 'Start Pilot Program',
  },
  'technical-evaluator': {
    'See Features': 'Explore Technical Specs',
    'Learn More': 'Read Documentation',
    'View Pricing': 'See API Pricing',
    'Request Demo': 'Try Sandbox Environment',
    'Get Started': 'Access Developer Portal',
  },
  'end-user': {
    'See Features': 'See What You Can Do',
    'Learn More': 'Take a Quick Tour',
    'View Pricing': 'See Plans',
    'Request Demo': 'See It in Action',
    'Get Started': 'Start Free',
  },
  researcher: {
    'See Features': 'Explore Features',
    'Learn More': 'Learn the Basics',
    'View Pricing': 'Compare Plans',
    'Request Demo': 'Watch Demo Video',
    'Get Started': 'Create Free Account',
  },
  champion: {
    'See Features': 'See Team Benefits',
    'Learn More': 'Get Resources to Share',
    'View Pricing': 'See Team Plans',
    'Request Demo': 'Get Demo for Your Team',
    'Get Started': 'Start Team Trial',
  },
  unknown: {},
};

// ============================================================================
// PERSONA CTA PRIORITIZER SERVICE
// ============================================================================

export class PersonaCTAPrioritizer {
  /**
   * Detect persona from signals
   */
  async detectPersona(signals: PersonaSignals): Promise<PersonaDetectionResult> {
    let tokensUsed = 0;
    const scores: Record<PersonaCategory, number> = {
      'decision-maker': 0,
      'technical-evaluator': 0,
      'end-user': 0,
      researcher: 0,
      champion: 0,
      unknown: 0.1, // Base score for unknown
    };

    // Score based on explored topics
    for (const topic of signals.exploredTopics) {
      const indicators = TOPIC_PERSONA_INDICATORS[topic];
      if (indicators) {
        for (const persona of indicators) {
          scores[persona] += 0.15;
        }
      }
    }

    // Score based on intents
    this.scoreByIntents(signals.intents, scores);

    // Score based on engagement
    if (signals.engagementTime) {
      if (signals.engagementTime > 300) {
        scores['technical-evaluator'] += 0.1;
        scores.researcher += 0.1;
      }
      if (signals.engagementTime > 120 && signals.sectionDepth && signals.sectionDepth > 2) {
        scores.champion += 0.1;
      }
    }

    // Score based on role hints
    if (signals.roleHint) {
      this.scoreByRole(signals.roleHint, scores);
    }

    // Score based on company size
    if (signals.companySizeHint) {
      this.scoreByCompanySize(signals.companySizeHint, scores);
    }

    // Use AI for complex detection if needed
    if (signals.queries && signals.queries.length > 0) {
      const aiResult = await this.detectWithAI(signals);
      scores[aiResult.persona] += aiResult.confidence * 0.3;
      tokensUsed = aiResult.tokensUsed;
    }

    // Find top persona
    const sortedPersonas = Object.entries(scores)
      .filter(([key]) => key !== 'unknown')
      .sort(([, a], [, b]) => b - a);

    const topPersona = sortedPersonas[0];
    const topScore = topPersona[1];

    // Determine confidence
    const confidence = Math.min(1, topScore);
    const category: PersonaCategory =
      confidence > 0.3 ? (topPersona[0] as PersonaCategory) : 'unknown';

    // Build profile
    const profile: PersonaProfile = {
      ...PERSONA_PROFILES[category],
      confidence,
    };

    // Get active signals
    const activeSignals: string[] = [];
    if (signals.exploredTopics.length > 0) activeSignals.push('topics');
    if (signals.intents.length > 0) activeSignals.push('intents');
    if (signals.roleHint) activeSignals.push('role');
    if (signals.companySizeHint) activeSignals.push('company');
    if (signals.queries) activeSignals.push('queries');

    return {
      persona: profile,
      activeSignals,
      alternatives: sortedPersonas.slice(1, 3).map(([cat, score]) => ({
        category: cat as PersonaCategory,
        confidence: Math.min(1, score),
      })),
      tokensUsed,
    };
  }

  /**
   * Prioritize and adapt CTAs for persona
   */
  prioritizeCTAs(ctas: SmartCTA[], persona: PersonaProfile): AdaptedCTA[] {
    // Score each CTA for this persona
    const scoredCTAs = ctas.map((cta) => {
      let score = 0;

      // Score by preferred content match
      if (persona.preferredContent.includes(cta.intent)) {
        score += 0.3;
      }

      // Score by funnel stage alignment
      if (persona.conversionPath.includes(cta.funnelStage)) {
        const stageIndex = persona.conversionPath.indexOf(cta.funnelStage);
        score += 0.2 - stageIndex * 0.05; // Earlier in path = higher score
      }

      // Score high-intent CTAs for decision-makers
      if (persona.category === 'decision-maker' && cta.isHighIntent) {
        score += 0.2;
      }

      // Score technical content for evaluators
      if (
        persona.category === 'technical-evaluator' &&
        ['integrations', 'security', 'support'].includes(cta.topic)
      ) {
        score += 0.2;
      }

      return { cta, score };
    });

    // Sort by score
    scoredCTAs.sort((a, b) => b.score - a.score);

    // Adapt and return
    return scoredCTAs.map(({ cta, score }, index) => {
      const adaptedText = this.adaptCTAText(cta.text, persona.category);
      const valueProposition = this.getValueProposition(cta.topic, persona);

      return {
        ...cta,
        text: adaptedText,
        originalText: cta.text,
        adaptationConfidence: persona.confidence,
        valueProposition,
        priorityReason: this.getPriorityReason(cta, persona, score),
        variant: index === 0 ? 'primary' : index === 1 ? 'secondary' : 'tertiary',
      } as AdaptedCTA;
    });
  }

  /**
   * Get persona-specific topic recommendations
   */
  getRecommendedTopicsForPersona(
    persona: PersonaProfile,
    availableTopics: TopicCoverage[]
  ): TopicCoverage[] {
    // Filter and sort by persona preference
    return availableTopics
      .filter((topic) => topic.hasRichContent)
      .sort((a, b) => {
        const aPreferred = persona.preferredContent.some((intent) =>
          a.intents.includes(intent)
        );
        const bPreferred = persona.preferredContent.some((intent) =>
          b.intents.includes(intent)
        );

        if (aPreferred !== bPreferred) return aPreferred ? -1 : 1;
        return b.depthScore - a.depthScore;
      });
  }

  /**
   * Score personas by intent signals
   */
  private scoreByIntents(
    intents: IntentCategory[],
    scores: Record<PersonaCategory, number>
  ): void {
    for (const intent of intents) {
      switch (intent) {
        case 'pricing':
          scores['decision-maker'] += 0.2;
          scores.champion += 0.1;
          break;
        case 'integration':
          scores['technical-evaluator'] += 0.25;
          break;
        case 'comparison':
          scores['decision-maker'] += 0.15;
          scores.researcher += 0.15;
          break;
        case 'demo-request':
          scores['decision-maker'] += 0.2;
          scores.champion += 0.15;
          break;
        case 'support':
          scores['technical-evaluator'] += 0.15;
          scores['end-user'] += 0.15;
          break;
        case 'use-case':
          scores.champion += 0.15;
          scores['end-user'] += 0.1;
          break;
        case 'how-it-works':
          scores.researcher += 0.15;
          scores['end-user'] += 0.1;
          break;
        case 'product-info':
          scores.researcher += 0.1;
          break;
      }
    }
  }

  /**
   * Score based on role hint
   */
  private scoreByRole(roleHint: string, scores: Record<PersonaCategory, number>): void {
    const lowerRole = roleHint.toLowerCase();

    if (
      lowerRole.includes('ceo') ||
      lowerRole.includes('cto') ||
      lowerRole.includes('director') ||
      lowerRole.includes('vp') ||
      lowerRole.includes('executive') ||
      lowerRole.includes('manager')
    ) {
      scores['decision-maker'] += 0.3;
    }

    if (
      lowerRole.includes('developer') ||
      lowerRole.includes('engineer') ||
      lowerRole.includes('architect') ||
      lowerRole.includes('technical')
    ) {
      scores['technical-evaluator'] += 0.3;
    }

    if (
      lowerRole.includes('analyst') ||
      lowerRole.includes('specialist') ||
      lowerRole.includes('coordinator')
    ) {
      scores['end-user'] += 0.2;
      scores.champion += 0.15;
    }
  }

  /**
   * Score based on company size
   */
  private scoreByCompanySize(
    sizeHint: string,
    scores: Record<PersonaCategory, number>
  ): void {
    const lowerSize = sizeHint.toLowerCase();

    if (lowerSize.includes('enterprise') || lowerSize.includes('large')) {
      scores['decision-maker'] += 0.15;
      scores['technical-evaluator'] += 0.1;
    }

    if (lowerSize.includes('startup') || lowerSize.includes('small')) {
      scores['end-user'] += 0.1;
      scores.researcher += 0.1;
    }

    if (lowerSize.includes('mid') || lowerSize.includes('growing')) {
      scores.champion += 0.15;
    }
  }

  /**
   * Use AI for persona detection from queries
   */
  private async detectWithAI(signals: PersonaSignals): Promise<{
    persona: PersonaCategory;
    confidence: number;
    tokensUsed: number;
  }> {
    try {
      const { data, tokensUsed } = await completeJSON<{
        persona: PersonaCategory;
        confidence: number;
      }>({
        messages: [
          {
            role: 'system',
            content: `Analyze these visitor signals and detect their persona.

Categories:
- decision-maker: Executive, budget holder, focused on ROI
- technical-evaluator: Developer, engineer, focused on specs
- end-user: Daily user, focused on usability
- researcher: Early stage, just learning
- champion: Internal advocate, team leader

Signals:
- Topics: ${signals.exploredTopics.join(', ')}
- Queries: ${signals.queries?.join(' | ') || 'none'}
- Intents: ${signals.intents.join(', ')}

Respond in JSON: { "persona": "category", "confidence": 0.0-1.0 }`,
          },
        ],
        config: { maxTokens: 100 },
      });

      return {
        persona: data.persona || 'unknown',
        confidence: data.confidence || 0.5,
        tokensUsed,
      };
    } catch (error) {
      console.error('AI persona detection failed:', error);
      return { persona: 'unknown', confidence: 0, tokensUsed: 0 };
    }
  }

  /**
   * Adapt CTA text for persona
   */
  private adaptCTAText(originalText: string, persona: PersonaCategory): string {
    const adaptations = CTA_ADAPTATIONS[persona];

    // Check for direct match
    if (adaptations[originalText]) {
      return adaptations[originalText];
    }

    // Check for partial match
    for (const [original, adapted] of Object.entries(adaptations)) {
      if (originalText.toLowerCase().includes(original.toLowerCase())) {
        return adapted;
      }
    }

    return originalText;
  }

  /**
   * Get value proposition for topic/persona combo
   */
  private getValueProposition(topic: string, persona: PersonaProfile): string {
    const propositions: Record<string, Record<PersonaCategory, string>> = {
      pricing: {
        'decision-maker': 'See ROI potential and cost efficiency',
        'technical-evaluator': 'Understand usage-based pricing',
        'end-user': 'Find the right plan for your needs',
        researcher: 'Compare all available options',
        champion: 'Calculate team costs and savings',
        unknown: 'Find the perfect plan',
      },
      'product-features': {
        'decision-maker': 'Drive measurable business outcomes',
        'technical-evaluator': 'Explore powerful capabilities',
        'end-user': 'Simplify your daily workflow',
        researcher: 'Discover what makes us different',
        champion: 'See benefits for your whole team',
        unknown: 'Explore our features',
      },
      integrations: {
        'decision-maker': 'Connect your entire tech stack',
        'technical-evaluator': 'Robust APIs and native integrations',
        'end-user': 'Works with tools you already use',
        researcher: 'See supported integrations',
        champion: 'Enable team-wide adoption',
        unknown: 'Connect your tools',
      },
    };

    return propositions[topic]?.[persona.category] || '';
  }

  /**
   * Get reason for CTA priority
   */
  private getPriorityReason(
    cta: SmartCTA,
    persona: PersonaProfile,
    score: number
  ): string {
    const reasons: string[] = [];

    if (persona.preferredContent.includes(cta.intent)) {
      reasons.push(`matches ${persona.category} preferences`);
    }

    if (persona.conversionPath.includes(cta.funnelStage)) {
      reasons.push(`aligns with typical ${persona.category} journey`);
    }

    if (cta.isHighIntent && persona.category === 'decision-maker') {
      reasons.push('high-value action for decision-makers');
    }

    if (reasons.length === 0) {
      reasons.push('general relevance');
    }

    return `Prioritized because it ${reasons.join(' and ')}`;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let prioritizerInstance: PersonaCTAPrioritizer | null = null;

export function getPersonaCTAPrioritizer(): PersonaCTAPrioritizer {
  if (!prioritizerInstance) {
    prioritizerInstance = new PersonaCTAPrioritizer();
  }
  return prioritizerInstance;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { PERSONA_PROFILES, CTA_ADAPTATIONS };
