/**
 * AI-Suggested Interactive Elements
 *
 * Story 7.5: AI-Suggested Interactive Elements
 *
 * Analyzes KB coverage gaps and suggests appropriate interactive elements
 * that can help gather missing information or engage users.
 */

import { createClient } from '@/lib/supabase/server';
import type { EntityType } from '@/lib/ai/types';
import type { InteractiveElementType } from './types';
import { analyzeKBCoverage, type KBCoverageReport } from '@/lib/knowledge/coverage-analyzer';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Suggested interactive element based on KB gap
 */
export interface SuggestedInteractiveElement {
  /** Type of interactive element */
  type: InteractiveElementType;
  /** Why this element is suggested */
  reason: string;
  /** Entity types this element can help collect */
  targetEntityTypes: EntityType[];
  /** Priority score (higher = more important) */
  priority: number;
  /** Sample configuration for the element */
  sampleConfig: InteractiveElementConfig;
  /** KB coverage gap this addresses */
  addressesGap: {
    entityType: EntityType;
    currentCount: number;
    recommendedCount: number;
  };
}

/**
 * Sample configuration for an interactive element
 */
export interface InteractiveElementConfig {
  title: string;
  description: string;
  questions?: Array<{
    id: string;
    text: string;
    type: 'text' | 'select' | 'multiselect' | 'rating' | 'scale';
    options?: string[];
  }>;
  fields?: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
  }>;
}

/**
 * Result of interactive element suggestions
 */
export interface InteractiveSuggestionsResult {
  suggestions: SuggestedInteractiveElement[];
  kbCoverage: KBCoverageReport;
  totalGaps: number;
  highPriorityGaps: number;
}

// =============================================================================
// ENTITY TO INTERACTIVE ELEMENT MAPPING
// =============================================================================

/**
 * Map KB entity types to interactive elements that can help collect them
 */
const ENTITY_TO_INTERACTIVE_MAP: Record<EntityType, {
  elementTypes: InteractiveElementType[];
  priority: number;
  reason: string;
}> = {
  // Core entities
  product: {
    elementTypes: ['comparison', 'configurator'],
    priority: 70,
    reason: 'Product comparison or configurator can help visitors understand product offerings',
  },
  service: {
    elementTypes: ['comparison', 'calculator'],
    priority: 70,
    reason: 'Service comparison or calculator can showcase service value',
  },
  feature: {
    elementTypes: ['tabs', 'carousel'],
    priority: 50,
    reason: 'Feature tabs or carousel can organize and highlight key features',
  },
  benefit: {
    elementTypes: ['quiz', 'survey'],
    priority: 60,
    reason: 'Quiz can help visitors identify relevant benefits for their needs',
  },
  pricing: {
    elementTypes: ['calculator', 'comparison'],
    priority: 80,
    reason: 'Pricing calculator or comparison helps visitors understand costs',
  },
  testimonial: {
    elementTypes: ['carousel', 'survey'],
    priority: 65,
    reason: 'Testimonial carousel showcases social proof; survey can collect new testimonials',
  },
  company: {
    elementTypes: ['timeline'],
    priority: 30,
    reason: 'Company timeline can showcase history and milestones',
  },
  person: {
    elementTypes: ['carousel', 'tabs'],
    priority: 30,
    reason: 'Team carousel or tabs can introduce team members',
  },
  statistic: {
    elementTypes: ['calculator', 'comparison'],
    priority: 55,
    reason: 'Calculator or comparison can dynamically show relevant statistics',
  },
  faq: {
    elementTypes: ['form', 'survey'],
    priority: 75,
    reason: 'Contact form or survey can collect common questions to build FAQ',
  },
  cta: {
    elementTypes: ['modal', 'form'],
    priority: 85,
    reason: 'Modal or form can capture leads and drive conversions',
  },
  process_step: {
    elementTypes: ['timeline', 'tabs'],
    priority: 45,
    reason: 'Process timeline or tabs can visualize workflow steps',
  },
  use_case: {
    elementTypes: ['quiz', 'comparison'],
    priority: 60,
    reason: 'Quiz can match visitors to relevant use cases',
  },
  integration: {
    elementTypes: ['carousel', 'comparison'],
    priority: 40,
    reason: 'Integration carousel or comparison shows ecosystem capabilities',
  },
  contact: {
    elementTypes: ['form', 'modal'],
    priority: 90,
    reason: 'Contact form is essential for lead capture',
  },
  // Phase 7 entities
  company_name: {
    elementTypes: ['form'],
    priority: 20,
    reason: 'Form can help collect company identity information',
  },
  company_tagline: {
    elementTypes: ['survey'],
    priority: 25,
    reason: 'Survey can help refine messaging and taglines',
  },
  company_description: {
    elementTypes: ['form'],
    priority: 20,
    reason: 'Form can collect company description details',
  },
  mission_statement: {
    elementTypes: ['survey'],
    priority: 15,
    reason: 'Survey can help articulate mission and values',
  },
  social_link: {
    elementTypes: ['form'],
    priority: 35,
    reason: 'Form can collect social media links',
  },
  nav_category: {
    elementTypes: ['survey'],
    priority: 10,
    reason: 'Survey can help understand content categorization preferences',
  },
  brand_voice: {
    elementTypes: ['survey', 'quiz'],
    priority: 15,
    reason: 'Quiz or survey can help determine brand voice preferences',
  },
};

// =============================================================================
// MAIN SUGGESTION FUNCTION
// =============================================================================

/**
 * Generate AI suggestions for interactive elements based on KB gaps
 */
export async function suggestInteractiveElements(
  workspaceId: string
): Promise<InteractiveSuggestionsResult> {
  // 1. Analyze KB coverage to identify gaps
  const coverageReport = await analyzeKBCoverage(workspaceId);

  // 2. Generate suggestions based on gaps
  const suggestions: SuggestedInteractiveElement[] = [];

  // Process missing critical entities
  for (const gap of coverageReport.missingCritical) {
    const entityType = gap as EntityType;
    const mapping = ENTITY_TO_INTERACTIVE_MAP[entityType];
    if (mapping) {
      for (const elementType of mapping.elementTypes) {
        suggestions.push({
          type: elementType,
          reason: mapping.reason,
          targetEntityTypes: [entityType],
          priority: mapping.priority + 20, // Boost priority for critical gaps
          sampleConfig: generateSampleConfig(elementType, entityType),
          addressesGap: {
            entityType,
            currentCount: 0,
            recommendedCount: getRecommendedCount(entityType),
          },
        });
      }
    }
  }

  // Process missing high-priority entities
  for (const gap of coverageReport.missingHigh) {
    const entityType = gap as EntityType;
    const mapping = ENTITY_TO_INTERACTIVE_MAP[entityType];
    if (mapping) {
      for (const elementType of mapping.elementTypes) {
        // Avoid duplicates
        const exists = suggestions.some(
          (s) => s.type === elementType && s.targetEntityTypes.includes(entityType)
        );
        if (!exists) {
          suggestions.push({
            type: elementType,
            reason: mapping.reason,
            targetEntityTypes: [entityType],
            priority: mapping.priority + 10,
            sampleConfig: generateSampleConfig(elementType, entityType),
            addressesGap: {
              entityType,
              currentCount: 0,
              recommendedCount: getRecommendedCount(entityType),
            },
          });
        }
      }
    }
  }

  // Process limited coverage entities (from coverage by type)
  for (const [entityType, coverage] of Object.entries(coverageReport.coverageByType)) {
    if (coverage.adequacy === 'limited') {
      const type = entityType as EntityType;
      const mapping = ENTITY_TO_INTERACTIVE_MAP[type];
      if (mapping) {
        const exists = suggestions.some(
          (s) => s.targetEntityTypes.includes(type)
        );
        if (!exists) {
          suggestions.push({
            type: mapping.elementTypes[0],
            reason: `${mapping.reason} (Currently have ${coverage.count}, recommend ${coverage.minimumRecommended})`,
            targetEntityTypes: [type],
            priority: mapping.priority,
            sampleConfig: generateSampleConfig(mapping.elementTypes[0], type),
            addressesGap: {
              entityType: type,
              currentCount: coverage.count,
              recommendedCount: coverage.minimumRecommended,
            },
          });
        }
      }
    }
  }

  // Sort by priority (highest first)
  suggestions.sort((a, b) => b.priority - a.priority);

  // Deduplicate and limit suggestions
  const uniqueSuggestions = deduplicateSuggestions(suggestions).slice(0, 10);

  return {
    suggestions: uniqueSuggestions,
    kbCoverage: coverageReport,
    totalGaps: coverageReport.missingCritical.length + coverageReport.missingHigh.length,
    highPriorityGaps: coverageReport.missingCritical.length,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate sample configuration for an interactive element
 */
function generateSampleConfig(
  elementType: InteractiveElementType,
  targetEntityType: EntityType
): InteractiveElementConfig {
  switch (elementType) {
    case 'quiz':
      return generateQuizConfig(targetEntityType);
    case 'survey':
      return generateSurveyConfig(targetEntityType);
    case 'calculator':
      return generateCalculatorConfig(targetEntityType);
    case 'form':
      return generateFormConfig(targetEntityType);
    case 'comparison':
      return generateComparisonConfig(targetEntityType);
    default:
      return {
        title: `${elementType.charAt(0).toUpperCase() + elementType.slice(1)} Element`,
        description: `Interactive ${elementType} to help gather ${targetEntityType} information`,
      };
  }
}

function generateQuizConfig(entityType: EntityType): InteractiveElementConfig {
  const configs: Record<string, InteractiveElementConfig> = {
    benefit: {
      title: 'Find Your Perfect Solution',
      description: 'Answer a few questions to discover which benefits matter most to you',
      questions: [
        {
          id: 'q1',
          text: 'What is your primary goal?',
          type: 'select',
          options: ['Increase efficiency', 'Reduce costs', 'Scale operations', 'Improve quality'],
        },
        {
          id: 'q2',
          text: 'What challenges are you facing?',
          type: 'multiselect',
          options: ['Time constraints', 'Budget limitations', 'Technical complexity', 'Team capacity'],
        },
        {
          id: 'q3',
          text: 'How urgent is your need?',
          type: 'scale',
        },
      ],
    },
    use_case: {
      title: 'Which Solution Fits Your Needs?',
      description: 'Take our quick assessment to find the right use case for you',
      questions: [
        {
          id: 'q1',
          text: 'What industry are you in?',
          type: 'select',
          options: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Other'],
        },
        {
          id: 'q2',
          text: 'What problem are you trying to solve?',
          type: 'text',
        },
      ],
    },
  };

  return configs[entityType] || {
    title: 'Quick Assessment',
    description: 'Help us understand your needs better',
    questions: [
      { id: 'q1', text: 'What are you looking for?', type: 'text' },
    ],
  };
}

function generateSurveyConfig(entityType: EntityType): InteractiveElementConfig {
  const configs: Record<string, InteractiveElementConfig> = {
    testimonial: {
      title: 'Share Your Experience',
      description: 'Help others by sharing your feedback',
      questions: [
        {
          id: 'q1',
          text: 'How satisfied are you with our product/service?',
          type: 'rating',
        },
        {
          id: 'q2',
          text: 'What did you like most?',
          type: 'text',
        },
        {
          id: 'q3',
          text: 'Would you recommend us to others?',
          type: 'scale',
        },
      ],
    },
    faq: {
      title: 'What Questions Do You Have?',
      description: 'Help us build better resources by sharing your questions',
      questions: [
        {
          id: 'q1',
          text: 'What topic would you like to learn more about?',
          type: 'select',
          options: ['Getting Started', 'Features', 'Pricing', 'Support', 'Other'],
        },
        {
          id: 'q2',
          text: 'What specific question do you have?',
          type: 'text',
        },
      ],
    },
  };

  return configs[entityType] || {
    title: 'Quick Feedback',
    description: 'Help us improve',
    questions: [
      { id: 'q1', text: 'Share your thoughts', type: 'text' },
    ],
  };
}

function generateCalculatorConfig(entityType: EntityType): InteractiveElementConfig {
  const configs: Record<string, InteractiveElementConfig> = {
    pricing: {
      title: 'Price Calculator',
      description: 'Get an instant estimate based on your needs',
      fields: [
        { id: 'users', label: 'Number of Users', type: 'number', required: true },
        { id: 'plan', label: 'Plan Type', type: 'select', required: true },
        { id: 'billing', label: 'Billing Cycle', type: 'select', required: false },
      ],
    },
    statistic: {
      title: 'ROI Calculator',
      description: 'Calculate your potential return on investment',
      fields: [
        { id: 'currentCost', label: 'Current Monthly Cost', type: 'currency', required: true },
        { id: 'timeSpent', label: 'Hours Spent Per Week', type: 'number', required: true },
        { id: 'teamSize', label: 'Team Size', type: 'number', required: false },
      ],
    },
  };

  return configs[entityType] || {
    title: 'Quick Calculator',
    description: 'Get instant results',
    fields: [
      { id: 'input1', label: 'Enter value', type: 'number', required: true },
    ],
  };
}

function generateFormConfig(entityType: EntityType): InteractiveElementConfig {
  const configs: Record<string, InteractiveElementConfig> = {
    contact: {
      title: 'Get in Touch',
      description: 'Fill out the form and we\'ll get back to you shortly',
      fields: [
        { id: 'name', label: 'Full Name', type: 'text', required: true },
        { id: 'email', label: 'Email Address', type: 'email', required: true },
        { id: 'company', label: 'Company', type: 'text', required: false },
        { id: 'message', label: 'Message', type: 'textarea', required: true },
      ],
    },
    cta: {
      title: 'Start Your Free Trial',
      description: 'Get started in minutes',
      fields: [
        { id: 'email', label: 'Work Email', type: 'email', required: true },
        { id: 'company', label: 'Company Name', type: 'text', required: true },
      ],
    },
  };

  return configs[entityType] || {
    title: 'Contact Us',
    description: 'We\'d love to hear from you',
    fields: [
      { id: 'email', label: 'Email', type: 'email', required: true },
    ],
  };
}

function generateComparisonConfig(entityType: EntityType): InteractiveElementConfig {
  return {
    title: entityType === 'product' ? 'Compare Products' : 'Compare Options',
    description: 'See how different options stack up against each other',
  };
}

/**
 * Get recommended count for an entity type
 */
function getRecommendedCount(entityType: EntityType): number {
  const recommendations: Partial<Record<EntityType, number>> = {
    feature: 5,
    benefit: 3,
    testimonial: 3,
    faq: 5,
    pricing: 2,
    use_case: 3,
    statistic: 3,
    cta: 2,
    contact: 1,
    company_name: 1,
    company_description: 1,
  };
  return recommendations[entityType] || 1;
}

/**
 * Deduplicate suggestions, keeping highest priority for each element type
 */
function deduplicateSuggestions(
  suggestions: SuggestedInteractiveElement[]
): SuggestedInteractiveElement[] {
  const seen = new Map<InteractiveElementType, SuggestedInteractiveElement>();

  for (const suggestion of suggestions) {
    const existing = seen.get(suggestion.type);
    if (!existing || suggestion.priority > existing.priority) {
      seen.set(suggestion.type, suggestion);
    }
  }

  return Array.from(seen.values()).sort((a, b) => b.priority - a.priority);
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ENTITY_TO_INTERACTIVE_MAP };
