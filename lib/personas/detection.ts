/**
 * Persona Detection Engine
 *
 * Real-time detection of visitor personas based on behavioral signals
 * and rule matching.
 */

import type {
  Persona,
  PersonaMatch,
  UserBehavior,
  BehaviorSignal,
  DetectionRule,
  DetectionOptions,
  DetectionRuleType,
} from './types';

/**
 * Detection result with confidence scoring
 */
interface RuleMatchResult {
  ruleId: string;
  ruleType: DetectionRuleType;
  matched: boolean;
  contribution: number;
  signal?: BehaviorSignal;
}

/**
 * Persona detection engine
 */
export class PersonaDetectionEngine {
  private personas: Persona[];
  private options: Required<DetectionOptions>;

  constructor(personas: Persona[], options: DetectionOptions = {}) {
    this.personas = personas.filter(p => p.isActive);
    this.options = {
      minConfidence: options.minConfidence ?? 0.5,
      maxAlternatives: options.maxAlternatives ?? 2,
      useHistoricalData: options.useHistoricalData ?? true,
      decayFactor: options.decayFactor ?? 0.9,
    };
  }

  /**
   * Detect persona from user behavior
   */
  detectPersona(behavior: UserBehavior): PersonaMatch | null {
    if (this.personas.length === 0) {
      return null;
    }

    // Extract behavioral signals
    const signals = this.extractSignals(behavior);

    // Score each persona against the signals
    const scores = this.personas.map(persona => ({
      personaId: persona.id,
      ...this.scorePersona(persona, signals, behavior),
    }));

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Get best match
    const bestMatch = scores[0];
    if (bestMatch.score < this.options.minConfidence) {
      return null;
    }

    // Get alternative matches
    const alternatives = scores
      .slice(1, this.options.maxAlternatives + 1)
      .filter(s => s.score >= this.options.minConfidence * 0.7)
      .map(s => ({
        personaId: s.personaId,
        confidence: s.score,
      }));

    return {
      personaId: bestMatch.personaId,
      confidence: bestMatch.score,
      matchedRules: bestMatch.matchedRules,
      signals: bestMatch.contributingSignals,
      alternativeMatches: alternatives,
    };
  }

  /**
   * Extract behavioral signals from user behavior
   */
  private extractSignals(behavior: UserBehavior): BehaviorSignal[] {
    const signals: BehaviorSignal[] = [];
    const now = new Date().toISOString();

    // Click patterns
    for (const click of behavior.clickHistory) {
      signals.push({
        type: 'click_pattern',
        value: {
          elementType: click.elementType,
          elementId: click.elementId,
          sectionId: click.sectionId,
        },
        timestamp: click.timestamp,
        weight: 0.8,
        contributed: false,
      });
    }

    // Scroll behavior
    for (const scroll of behavior.scrollBehavior) {
      signals.push({
        type: 'scroll_behavior',
        value: {
          pageId: scroll.pageId,
          maxDepth: scroll.maxDepth,
          duration: scroll.duration,
        },
        timestamp: now,
        weight: 0.5,
        contributed: false,
      });
    }

    // Time on sections
    for (const [sectionId, duration] of Object.entries(behavior.timeOnSections)) {
      signals.push({
        type: 'time_on_page',
        value: { sectionId, duration },
        timestamp: now,
        weight: 0.6,
        contributed: false,
      });
    }

    // Referrer data
    if (behavior.referrerData.url) {
      signals.push({
        type: 'referrer',
        value: behavior.referrerData,
        timestamp: now,
        weight: 0.4,
        contributed: false,
      });
    }

    // UTM parameters
    if (behavior.referrerData.source || behavior.referrerData.campaign) {
      signals.push({
        type: 'utm_parameter',
        value: {
          source: behavior.referrerData.source,
          medium: behavior.referrerData.medium,
          campaign: behavior.referrerData.campaign,
        },
        timestamp: now,
        weight: 0.5,
        contributed: false,
      });
    }

    // Form interactions
    for (const form of behavior.formInteractions) {
      signals.push({
        type: 'form_field',
        value: form,
        timestamp: now,
        weight: form.completed ? 0.9 : 0.4,
        contributed: false,
      });
    }

    // Page sequence
    if (behavior.navigationPath.length > 1) {
      signals.push({
        type: 'page_sequence',
        value: behavior.navigationPath,
        timestamp: now,
        weight: 0.6,
        contributed: false,
      });
    }

    // Device type
    signals.push({
      type: 'device_type',
      value: behavior.deviceType,
      timestamp: now,
      weight: 0.2,
      contributed: false,
    });

    // Search queries
    for (const query of behavior.searchQueries) {
      signals.push({
        type: 'search_query',
        value: query,
        timestamp: now,
        weight: 0.7,
        contributed: false,
      });
    }

    return signals;
  }

  /**
   * Score a persona against behavioral signals
   */
  private scorePersona(
    persona: Persona,
    signals: BehaviorSignal[],
    behavior: UserBehavior
  ): {
    score: number;
    matchedRules: Array<{ ruleId: string; ruleType: DetectionRuleType; contribution: number }>;
    contributingSignals: BehaviorSignal[];
  } {
    const matchResults: RuleMatchResult[] = [];
    const contributingSignals: BehaviorSignal[] = [];

    // Evaluate each detection rule
    for (const rule of persona.detectionRules) {
      const result = this.evaluateRule(rule, signals, behavior);
      matchResults.push(result);

      if (result.matched && result.signal) {
        result.signal.contributed = true;
        contributingSignals.push(result.signal);
      }
    }

    // Calculate weighted score
    const totalWeight = persona.detectionRules.reduce((sum, r) => sum + r.weight, 0);
    const matchedWeight = matchResults
      .filter(r => r.matched)
      .reduce((sum, r) => sum + r.contribution, 0);

    const score = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    // Apply persona confidence as a factor
    const adjustedScore = score * persona.confidenceScore;

    return {
      score: adjustedScore,
      matchedRules: matchResults
        .filter(r => r.matched)
        .map(r => ({
          ruleId: r.ruleId,
          ruleType: r.ruleType,
          contribution: r.contribution,
        })),
      contributingSignals,
    };
  }

  /**
   * Evaluate a single detection rule
   */
  private evaluateRule(
    rule: DetectionRule,
    signals: BehaviorSignal[],
    behavior: UserBehavior
  ): RuleMatchResult {
    const relevantSignals = signals.filter(s => s.type === rule.type);
    let matched = false;
    let matchedSignal: BehaviorSignal | undefined;

    switch (rule.type) {
      case 'click_pattern':
        matched = this.evaluateClickPattern(rule, relevantSignals, behavior);
        matchedSignal = relevantSignals.find(() => matched);
        break;

      case 'scroll_behavior':
        matched = this.evaluateScrollBehavior(rule, relevantSignals);
        matchedSignal = relevantSignals.find(() => matched);
        break;

      case 'time_on_page':
        matched = this.evaluateTimeOnPage(rule, relevantSignals);
        matchedSignal = relevantSignals.find(() => matched);
        break;

      case 'referrer':
        matched = this.evaluateReferrer(rule, relevantSignals);
        matchedSignal = relevantSignals.find(() => matched);
        break;

      case 'utm_parameter':
        matched = this.evaluateUtmParameter(rule, relevantSignals);
        matchedSignal = relevantSignals.find(() => matched);
        break;

      case 'content_interaction':
        matched = this.evaluateContentInteraction(rule, behavior);
        break;

      case 'form_field':
        matched = this.evaluateFormField(rule, relevantSignals);
        matchedSignal = relevantSignals.find(() => matched);
        break;

      case 'page_sequence':
        matched = this.evaluatePageSequence(rule, relevantSignals);
        matchedSignal = relevantSignals.find(() => matched);
        break;

      case 'device_type':
        matched = this.evaluateDeviceType(rule, behavior);
        break;

      case 'search_query':
        matched = this.evaluateSearchQuery(rule, relevantSignals);
        matchedSignal = relevantSignals.find(() => matched);
        break;
    }

    return {
      ruleId: rule.id,
      ruleType: rule.type,
      matched,
      contribution: matched ? rule.weight : 0,
      signal: matchedSignal,
    };
  }

  /**
   * Evaluate click pattern rule
   */
  private evaluateClickPattern(
    rule: DetectionRule,
    signals: BehaviorSignal[],
    behavior: UserBehavior
  ): boolean {
    const condition = rule.condition.toLowerCase();

    // Check for specific click patterns
    if (condition.includes('technical_docs')) {
      return signals.some(s => {
        const value = s.value as { elementType?: string; sectionId?: string };
        return (
          value.elementType === 'link' &&
          (value.sectionId?.includes('docs') || value.sectionId?.includes('technical'))
        );
      });
    }

    if (condition.includes('pricing')) {
      return signals.some(s => {
        const value = s.value as { elementType?: string; sectionId?: string };
        return value.sectionId?.includes('pricing');
      });
    }

    if (condition.includes('case_studies')) {
      return signals.some(s => {
        const value = s.value as { sectionId?: string };
        return (
          value.sectionId?.includes('case') || value.sectionId?.includes('testimonial')
        );
      });
    }

    // Generic click count check
    return behavior.clickHistory.length >= (parseInt(rule.value || '3', 10));
  }

  /**
   * Evaluate scroll behavior rule
   */
  private evaluateScrollBehavior(
    rule: DetectionRule,
    signals: BehaviorSignal[]
  ): boolean {
    const condition = rule.condition.toLowerCase();

    if (condition.includes('quick_scan')) {
      // Quick scan = fast scroll with low engagement
      return signals.some(s => {
        const value = s.value as { maxDepth?: number; duration?: number };
        return value.maxDepth && value.maxDepth > 70 && value.duration && value.duration < 30;
      });
    }

    if (condition.includes('deep_read')) {
      // Deep read = slow scroll with high engagement
      return signals.some(s => {
        const value = s.value as { maxDepth?: number; duration?: number };
        return value.maxDepth && value.maxDepth > 80 && value.duration && value.duration > 120;
      });
    }

    // Check minimum scroll depth
    const minDepth = parseInt(rule.value || '50', 10);
    return signals.some(s => {
      const value = s.value as { maxDepth?: number };
      return value.maxDepth && value.maxDepth >= minDepth;
    });
  }

  /**
   * Evaluate time on page rule
   */
  private evaluateTimeOnPage(
    rule: DetectionRule,
    signals: BehaviorSignal[]
  ): boolean {
    const threshold = parseInt(rule.value || '30', 10);
    const condition = rule.condition.toLowerCase();

    return signals.some(s => {
      const value = s.value as { sectionId?: string; duration?: number };

      // Check if section matches condition
      if (condition.includes('specs') || condition.includes('technical')) {
        if (!value.sectionId?.includes('spec') && !value.sectionId?.includes('tech')) {
          return false;
        }
      }

      return value.duration !== undefined && value.duration >= threshold;
    });
  }

  /**
   * Evaluate referrer rule
   */
  private evaluateReferrer(
    rule: DetectionRule,
    signals: BehaviorSignal[]
  ): boolean {
    const condition = rule.condition.toLowerCase();

    return signals.some(s => {
      const value = s.value as { url?: string; source?: string };
      const referrer = (value.url || value.source || '').toLowerCase();

      if (condition.includes('linkedin')) {
        return referrer.includes('linkedin');
      }
      if (condition.includes('google')) {
        return referrer.includes('google');
      }
      if (condition.includes('twitter') || condition.includes('x.com')) {
        return referrer.includes('twitter') || referrer.includes('x.com');
      }

      // Generic match
      return referrer.includes(condition.replace('from_', '').replace('_site', ''));
    });
  }

  /**
   * Evaluate UTM parameter rule
   */
  private evaluateUtmParameter(
    rule: DetectionRule,
    signals: BehaviorSignal[]
  ): boolean {
    const condition = rule.condition.toLowerCase();
    const targetValue = (rule.value || '').toLowerCase();

    return signals.some(s => {
      const value = s.value as { source?: string; medium?: string; campaign?: string };

      if (condition.includes('source') && value.source) {
        return value.source.toLowerCase().includes(targetValue);
      }
      if (condition.includes('medium') && value.medium) {
        return value.medium.toLowerCase().includes(targetValue);
      }
      if (condition.includes('campaign') && value.campaign) {
        return value.campaign.toLowerCase().includes(targetValue);
      }

      return false;
    });
  }

  /**
   * Evaluate content interaction rule
   */
  private evaluateContentInteraction(
    rule: DetectionRule,
    behavior: UserBehavior
  ): boolean {
    const condition = rule.condition.toLowerCase();

    if (condition.includes('comparison')) {
      // Check if user interacted with comparison content
      return behavior.clickHistory.some(
        c => c.sectionId?.includes('comparison') || c.sectionId?.includes('versus')
      );
    }

    if (condition.includes('demo') || condition.includes('video')) {
      return behavior.clickHistory.some(
        c => c.elementType === 'video' || c.sectionId?.includes('demo')
      );
    }

    return false;
  }

  /**
   * Evaluate form field rule
   */
  private evaluateFormField(
    rule: DetectionRule,
    signals: BehaviorSignal[]
  ): boolean {
    const condition = rule.condition.toLowerCase();

    return signals.some(s => {
      const value = s.value as {
        formId?: string;
        fieldsInteracted?: string[];
        completed?: boolean;
      };

      if (condition.includes('completed')) {
        return value.completed === true;
      }

      if (condition.includes('company_size')) {
        return value.fieldsInteracted?.some(f => f.includes('company') || f.includes('size'));
      }

      return (value.fieldsInteracted?.length || 0) > 0;
    });
  }

  /**
   * Evaluate page sequence rule
   */
  private evaluatePageSequence(
    rule: DetectionRule,
    signals: BehaviorSignal[]
  ): boolean {
    const condition = rule.condition.toLowerCase();

    return signals.some(s => {
      const path = s.value as string[];

      if (condition.includes('educational')) {
        // Started with educational content
        return (
          path[0]?.includes('blog') ||
          path[0]?.includes('guide') ||
          path[0]?.includes('learn')
        );
      }

      if (condition.includes('pricing_first')) {
        return path[0]?.includes('pricing');
      }

      if (condition.includes('features_first')) {
        return path[0]?.includes('features');
      }

      return false;
    });
  }

  /**
   * Evaluate device type rule
   */
  private evaluateDeviceType(
    rule: DetectionRule,
    behavior: UserBehavior
  ): boolean {
    const targetDevice = (rule.value || rule.condition).toLowerCase();
    return behavior.deviceType.toLowerCase() === targetDevice;
  }

  /**
   * Evaluate search query rule
   */
  private evaluateSearchQuery(
    rule: DetectionRule,
    signals: BehaviorSignal[]
  ): boolean {
    const keywords = (rule.value || rule.condition).toLowerCase().split(',');

    return signals.some(s => {
      const query = (s.value as string).toLowerCase();
      return keywords.some(keyword => query.includes(keyword.trim()));
    });
  }

  /**
   * Update personas
   */
  updatePersonas(personas: Persona[]): void {
    this.personas = personas.filter(p => p.isActive);
  }
}

/**
 * Create a detection engine instance
 */
export function createDetectionEngine(
  personas: Persona[],
  options?: DetectionOptions
): PersonaDetectionEngine {
  return new PersonaDetectionEngine(personas, options);
}

/**
 * Simple persona detection without engine instantiation
 */
export function detectPersona(
  behavior: UserBehavior,
  personas: Persona[],
  options?: DetectionOptions
): PersonaMatch | null {
  const engine = new PersonaDetectionEngine(personas, options);
  return engine.detectPersona(behavior);
}
