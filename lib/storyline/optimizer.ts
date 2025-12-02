/**
 * Narrative Flow Optimizer
 *
 * Optimizes the arrangement and flow of content blocks to create
 * the most compelling narrative experience.
 */

import { PageType, NarrativeRole, ComponentVariant } from '@/lib/layout/types';
import {
  ContentBlock,
  EmotionalJourney,
  StorylineGenerationResult,
  PersonaStoryVariation,
} from './types';
import { NARRATIVE_TEMPLATES } from './templates';

// ============================================================================
// OPTIMIZATION RULES
// ============================================================================

/**
 * Rules for narrative flow optimization
 */
export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  check: (blocks: ContentBlock[], pageType: PageType) => OptimizationViolation[];
  autoFix?: (blocks: ContentBlock[]) => ContentBlock[];
}

/**
 * A violation of an optimization rule
 */
export interface OptimizationViolation {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedBlockIds: string[];
  suggestedFix?: string;
}

/**
 * Result of optimization analysis
 */
export interface OptimizationResult {
  isOptimal: boolean;
  score: number; // 0-100
  violations: OptimizationViolation[];
  suggestions: string[];
  optimizedBlocks?: ContentBlock[];
}

// ============================================================================
// OPTIMIZATION RULES IMPLEMENTATION
// ============================================================================

const optimizationRules: OptimizationRule[] = [
  // Rule 1: CTA should not appear before value proposition
  {
    id: 'cta-after-value',
    name: 'CTA After Value Proposition',
    description: 'Call-to-action should appear after the value proposition is established',
    check: (blocks: ContentBlock[], pageType: PageType) => {
      const violations: OptimizationViolation[] = [];
      const hookIndex = blocks.findIndex((b) => b.stage === 'hook');
      const firstCTA = blocks.findIndex(
        (b) => b.stage === 'action' || b.content.contentType === 'cta'
      );

      if (firstCTA !== -1 && firstCTA < hookIndex) {
        violations.push({
          ruleId: 'cta-after-value',
          severity: 'error',
          message: 'CTA appears before the value proposition is established',
          affectedBlockIds: [blocks[firstCTA].id],
          suggestedFix: 'Move CTA to after the solution section',
        });
      }

      return violations;
    },
  },

  // Rule 2: Testimonials should come after problem acknowledgment
  {
    id: 'proof-after-problem',
    name: 'Proof After Problem',
    description: 'Social proof is more effective after the problem has been acknowledged',
    check: (blocks: ContentBlock[]) => {
      const violations: OptimizationViolation[] = [];
      const firstProblem = blocks.findIndex((b) => b.stage === 'problem');
      const firstProof = blocks.findIndex(
        (b) => b.stage === 'proof' || b.content.contentType === 'testimonial'
      );

      if (firstProof !== -1 && firstProblem !== -1 && firstProof < firstProblem) {
        violations.push({
          ruleId: 'proof-after-problem',
          severity: 'warning',
          message: 'Testimonials appear before problem acknowledgment',
          affectedBlockIds: [blocks[firstProof].id],
          suggestedFix: 'Move social proof to after problem section',
        });
      }

      return violations;
    },
  },

  // Rule 3: Avoid two heavy content blocks in sequence
  {
    id: 'content-density-balance',
    name: 'Content Density Balance',
    description: 'Alternate between content-heavy and visual sections',
    check: (blocks: ContentBlock[]) => {
      const violations: OptimizationViolation[] = [];
      const heavyTypes = ['case_study', 'comparison', 'faq', 'process'];

      for (let i = 0; i < blocks.length - 1; i++) {
        const current = blocks[i];
        const next = blocks[i + 1];

        if (
          heavyTypes.includes(current.content.contentType) &&
          heavyTypes.includes(next.content.contentType)
        ) {
          violations.push({
            ruleId: 'content-density-balance',
            severity: 'info',
            message: 'Two content-heavy blocks in sequence may overwhelm readers',
            affectedBlockIds: [current.id, next.id],
            suggestedFix: 'Add a visual break or lighter content between these sections',
          });
        }
      }

      return violations;
    },
  },

  // Rule 4: Ensure required stages are present
  {
    id: 'required-stages',
    name: 'Required Stages Present',
    description: 'Page must include all required narrative stages',
    check: (blocks: ContentBlock[], pageType: PageType) => {
      const violations: OptimizationViolation[] = [];
      const template = NARRATIVE_TEMPLATES[pageType];
      const presentStages = new Set(blocks.map((b) => b.stage));

      for (const required of template.requiredStages) {
        if (!presentStages.has(required)) {
          violations.push({
            ruleId: 'required-stages',
            severity: 'error',
            message: `Missing required stage: ${required}`,
            affectedBlockIds: [],
            suggestedFix: `Add content for the ${required} stage`,
          });
        }
      }

      return violations;
    },
  },

  // Rule 5: Stage order should follow narrative flow
  {
    id: 'stage-order',
    name: 'Narrative Stage Order',
    description: 'Stages should follow the narrative flow order',
    check: (blocks: ContentBlock[], pageType: PageType) => {
      const violations: OptimizationViolation[] = [];
      const template = NARRATIVE_TEMPLATES[pageType];
      const stageOrder = template.stageOrder;

      let lastStageIndex = -1;
      for (const block of blocks) {
        const currentStageIndex = stageOrder.indexOf(block.stage);
        if (currentStageIndex !== -1 && currentStageIndex < lastStageIndex) {
          violations.push({
            ruleId: 'stage-order',
            severity: 'warning',
            message: `Stage "${block.stage}" appears out of order`,
            affectedBlockIds: [block.id],
            suggestedFix: `Consider moving this block to maintain narrative flow`,
          });
        }
        if (currentStageIndex > lastStageIndex) {
          lastStageIndex = currentStageIndex;
        }
      }

      return violations;
    },
  },

  // Rule 6: Hook should be engaging
  {
    id: 'hook-engagement',
    name: 'Hook Engagement',
    description: 'The opening hook should be compelling and action-oriented',
    check: (blocks: ContentBlock[]) => {
      const violations: OptimizationViolation[] = [];
      const hookBlocks = blocks.filter((b) => b.stage === 'hook');

      if (hookBlocks.length === 0) {
        violations.push({
          ruleId: 'hook-engagement',
          severity: 'error',
          message: 'No hook section found - page may not capture attention',
          affectedBlockIds: [],
          suggestedFix: 'Add a compelling opening hook with value proposition',
        });
      } else {
        const hook = hookBlocks[0];
        if (hook.content.description.length < 50) {
          violations.push({
            ruleId: 'hook-engagement',
            severity: 'info',
            message: 'Hook description may be too short to be compelling',
            affectedBlockIds: [hook.id],
            suggestedFix: 'Expand the hook with more engaging details',
          });
        }
      }

      return violations;
    },
  },

  // Rule 7: Action section should have clear CTA
  {
    id: 'clear-cta',
    name: 'Clear CTA Present',
    description: 'Page should end with a clear call-to-action',
    check: (blocks: ContentBlock[]) => {
      const violations: OptimizationViolation[] = [];
      const actionBlocks = blocks.filter((b) => b.stage === 'action');
      const ctaBlocks = blocks.filter((b) => b.content.contentType === 'cta');

      if (actionBlocks.length === 0 && ctaBlocks.length === 0) {
        violations.push({
          ruleId: 'clear-cta',
          severity: 'warning',
          message: 'No clear call-to-action found',
          affectedBlockIds: [],
          suggestedFix: 'Add a clear CTA to guide visitors to take action',
        });
      }

      return violations;
    },
  },

  // Rule 8: Proof section should have variety
  {
    id: 'proof-variety',
    name: 'Proof Variety',
    description: 'Social proof section should include different types of evidence',
    check: (blocks: ContentBlock[]) => {
      const violations: OptimizationViolation[] = [];
      const proofBlocks = blocks.filter((b) => b.stage === 'proof');
      const proofTypes = new Set(proofBlocks.map((b) => b.content.contentType));

      if (proofBlocks.length >= 3 && proofTypes.size === 1) {
        violations.push({
          ruleId: 'proof-variety',
          severity: 'info',
          message: 'Proof section uses only one type of evidence',
          affectedBlockIds: proofBlocks.map((b) => b.id),
          suggestedFix: 'Add different types of proof (testimonials, stats, case studies)',
        });
      }

      return violations;
    },
  },
];

// ============================================================================
// OPTIMIZER CLASS
// ============================================================================

export class NarrativeFlowOptimizer {
  /**
   * Analyze and optimize content block arrangement
   */
  optimize(
    blocks: ContentBlock[],
    pageType: PageType,
    autoFix: boolean = false
  ): OptimizationResult {
    // Run all rules
    const allViolations: OptimizationViolation[] = [];

    for (const rule of optimizationRules) {
      const violations = rule.check(blocks, pageType);
      allViolations.push(...violations);
    }

    // Calculate score
    const score = this.calculateScore(allViolations);

    // Generate suggestions
    const suggestions = this.generateSuggestions(allViolations, pageType);

    // Auto-fix if requested
    let optimizedBlocks: ContentBlock[] | undefined;
    if (autoFix && allViolations.length > 0) {
      optimizedBlocks = this.autoFixBlocks(blocks, pageType);
    }

    return {
      isOptimal: allViolations.filter((v) => v.severity === 'error').length === 0,
      score,
      violations: allViolations,
      suggestions,
      optimizedBlocks,
    };
  }

  /**
   * Calculate optimization score based on violations
   */
  private calculateScore(violations: OptimizationViolation[]): number {
    let score = 100;

    for (const violation of violations) {
      switch (violation.severity) {
        case 'error':
          score -= 20;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          score -= 5;
          break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(
    violations: OptimizationViolation[],
    pageType: PageType
  ): string[] {
    const suggestions: string[] = [];
    const template = NARRATIVE_TEMPLATES[pageType];

    // Add suggestions based on violations
    for (const violation of violations) {
      if (violation.suggestedFix) {
        suggestions.push(violation.suggestedFix);
      }
    }

    // Add general suggestions based on page type
    if (template.recommendedArc === 'urgent') {
      suggestions.push('Consider adding urgency elements to increase conversion');
    }

    if (template.recommendedArc === 'dramatic') {
      suggestions.push('Emphasize the transformation story with before/after contrast');
    }

    // Remove duplicates
    return [...new Set(suggestions)];
  }

  /**
   * Automatically fix block arrangement issues
   */
  private autoFixBlocks(blocks: ContentBlock[], pageType: PageType): ContentBlock[] {
    const template = NARRATIVE_TEMPLATES[pageType];
    const stageOrder = template.stageOrder;

    // Sort blocks by stage order, then by priority within stage
    const sortedBlocks = [...blocks].sort((a, b) => {
      const stageA = stageOrder.indexOf(a.stage);
      const stageB = stageOrder.indexOf(b.stage);

      if (stageA !== stageB) {
        return stageA - stageB;
      }

      return a.priority - b.priority;
    });

    return sortedBlocks;
  }

  /**
   * Optimize emotional flow
   */
  optimizeEmotionalFlow(
    blocks: ContentBlock[],
    targetJourney: EmotionalJourney
  ): ContentBlock[] {
    // Map blocks to journey positions
    const totalBlocks = blocks.length;
    if (totalBlocks === 0) return blocks;

    return blocks.map((block, index) => {
      const position = (index / totalBlocks) * 100;
      const targetPoint = this.findClosestJourneyPoint(position, targetJourney);

      return {
        ...block,
        emotionalTone: targetPoint.primaryEmotion,
      };
    });
  }

  private findClosestJourneyPoint(
    position: number,
    journey: EmotionalJourney
  ): EmotionalJourney['points'][0] {
    let closest = journey.points[0];
    let minDistance = Math.abs(position - closest.position);

    for (const point of journey.points) {
      const distance = Math.abs(position - point.position);
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    }

    return closest;
  }
}

// ============================================================================
// CONTENT BLOCK SORTER
// ============================================================================

/**
 * Sort content blocks for optimal narrative flow
 */
export function sortContentBlocks(
  blocks: ContentBlock[],
  pageType: PageType
): ContentBlock[] {
  const optimizer = new NarrativeFlowOptimizer();
  const result = optimizer.optimize(blocks, pageType, true);
  return result.optimizedBlocks || blocks;
}

/**
 * Validate storyline result
 */
export function validateStoryline(
  result: StorylineGenerationResult,
  pageType: PageType
): OptimizationResult {
  const optimizer = new NarrativeFlowOptimizer();
  return optimizer.optimize(result.contentBlocks, pageType);
}

// ============================================================================
// PERSONA VARIATION OPTIMIZER
// ============================================================================

/**
 * Optimize persona variations for coherence
 */
export function optimizePersonaVariations(
  variations: PersonaStoryVariation[],
  pageType: PageType
): PersonaStoryVariation[] {
  const optimizer = new NarrativeFlowOptimizer();

  return variations.map((variation) => {
    const optimized = optimizer.optimize(variation.contentBlocks, pageType, true);

    return {
      ...variation,
      contentBlocks: optimized.optimizedBlocks || variation.contentBlocks,
    };
  });
}

// ============================================================================
// CONTENT DISTRIBUTION ANALYZER
// ============================================================================

/**
 * Analyze content distribution across stages
 */
export interface ContentDistributionAnalysis {
  totalBlocks: number;
  byStage: Record<NarrativeRole, { count: number; percentage: number }>;
  byContentType: Record<string, number>;
  recommendations: string[];
}

export function analyzeContentDistribution(
  blocks: ContentBlock[],
  pageType: PageType
): ContentDistributionAnalysis {
  const template = NARRATIVE_TEMPLATES[pageType];
  const totalBlocks = blocks.length;

  // Count by stage
  const byStage: Record<NarrativeRole, { count: number; percentage: number }> = {
    hook: { count: 0, percentage: 0 },
    problem: { count: 0, percentage: 0 },
    solution: { count: 0, percentage: 0 },
    proof: { count: 0, percentage: 0 },
    action: { count: 0, percentage: 0 },
  };

  // Count by content type
  const byContentType: Record<string, number> = {};

  for (const block of blocks) {
    byStage[block.stage].count++;
    byContentType[block.content.contentType] =
      (byContentType[block.content.contentType] || 0) + 1;
  }

  // Calculate percentages
  for (const stage of Object.keys(byStage) as NarrativeRole[]) {
    byStage[stage].percentage =
      totalBlocks > 0 ? Math.round((byStage[stage].count / totalBlocks) * 100) : 0;
  }

  // Generate recommendations
  const recommendations: string[] = [];

  for (const stage of Object.keys(byStage) as NarrativeRole[]) {
    const dist = template.contentDistribution[stage];
    const actual = byStage[stage].count;

    if (actual < dist.min) {
      recommendations.push(
        `Add ${dist.min - actual} more ${stage} block(s) (minimum: ${dist.min})`
      );
    } else if (actual > dist.max) {
      recommendations.push(
        `Consider reducing ${stage} blocks from ${actual} to ${dist.max} (maximum)`
      );
    }
  }

  return {
    totalBlocks,
    byStage,
    byContentType,
    recommendations,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { optimizationRules };
