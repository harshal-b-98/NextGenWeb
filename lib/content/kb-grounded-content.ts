/**
 * KB-Grounded Section Content Generation
 *
 * Story 7.4: Enhanced Section Content Generation
 *
 * Generates section content using KB entities as the primary source,
 * with full traceability of which entities contributed to the content.
 */

import { createClient } from '@/lib/supabase/server';
import { completeJSON } from '@/lib/ai/client';
import type { NarrativeRole } from '@/lib/layout/types';
import type { EntityType, Entity } from '@/lib/ai/types';
import type {
  PopulatedContent,
  FeatureItemContent,
  TestimonialContent,
  StatisticContent,
  FAQContent,
  PricingTierContent,
} from './types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * KB traceability information for a piece of content
 */
export interface KBTraceability {
  /** Entity IDs that contributed to this content */
  sourceEntityIds: string[];
  /** Average confidence from source entities */
  confidence: number;
  /** Whether this content used generic fallback (not from KB) */
  isGenericFallback: boolean;
  /** Entity types used */
  entityTypesUsed: EntityType[];
}

/**
 * KB-grounded content for a section
 */
export interface KBGroundedSectionContent {
  /** The generated content */
  content: PopulatedContent;
  /** KB traceability information */
  traceability: KBTraceability;
  /** Per-field traceability (which entity contributed to which field) */
  fieldSources: Record<string, string[]>;
}

/**
 * Input for KB-grounded section generation
 */
export interface KBGroundedSectionInput {
  workspaceId: string;
  componentId: string;
  narrativeRole: NarrativeRole;
  /** Optional hints for content generation */
  hints?: {
    focusKeywords?: string[];
    tone?: 'formal' | 'conversational' | 'bold';
    maxLength?: number;
  };
}

/**
 * Entity from database
 */
interface KnowledgeEntity {
  id: string;
  workspace_id: string;
  entity_type: EntityType;
  name: string;
  description: string | null;
  metadata: Record<string, unknown>;
  confidence: number;
}

// =============================================================================
// ENTITY TYPE TO NARRATIVE ROLE MAPPING
// =============================================================================

/**
 * Map entity types to their typical narrative roles
 */
const ENTITY_ROLE_MAPPING: Record<EntityType, NarrativeRole[]> = {
  // Core entities
  product: ['solution', 'hook'],
  service: ['solution', 'hook'],
  feature: ['solution', 'proof'],
  benefit: ['solution', 'problem'],
  pricing: ['action', 'solution'],
  testimonial: ['proof'],
  company: ['hook', 'proof'],
  person: ['proof'],
  statistic: ['proof', 'hook'],
  faq: ['action', 'solution'],
  cta: ['action'],
  process_step: ['solution'],
  use_case: ['problem', 'solution'],
  integration: ['solution', 'proof'],
  contact: ['action'],
  // Phase 7 entities (used for global components, but can appear in sections)
  company_name: ['hook'],
  company_tagline: ['hook'],
  company_description: ['hook', 'solution'],
  mission_statement: ['hook', 'proof'],
  social_link: ['action'],
  nav_category: [],
  brand_voice: [],
};

/**
 * Priority of entity types for each narrative role
 */
const ROLE_ENTITY_PRIORITY: Record<NarrativeRole, EntityType[]> = {
  hook: ['company_tagline', 'benefit', 'statistic', 'company_description'],
  problem: ['use_case', 'benefit', 'faq'],
  solution: ['feature', 'product', 'service', 'process_step', 'benefit'],
  proof: ['testimonial', 'statistic', 'company', 'person', 'integration'],
  action: ['cta', 'pricing', 'faq', 'contact'],
};

// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================

/**
 * Generate KB-grounded content for a section
 */
export async function generateKBGroundedSectionContent(
  input: KBGroundedSectionInput
): Promise<KBGroundedSectionContent> {
  const { workspaceId, componentId, narrativeRole, hints } = input;

  // 1. Fetch relevant entities from KB
  const entities = await fetchRelevantEntities(workspaceId, narrativeRole);

  if (entities.length === 0) {
    // No entities found - return fallback content
    return generateFallbackContent(componentId, narrativeRole);
  }

  // 2. Group entities by type
  const entitiesByType = groupEntitiesByType(entities);

  // 3. Generate content based on component type
  const content = await generateContentForComponent(
    componentId,
    narrativeRole,
    entitiesByType,
    hints
  );

  // 4. Build traceability information
  const traceability = buildTraceability(entities, content.usedEntityIds);

  return {
    content: content.content,
    traceability,
    fieldSources: content.fieldSources,
  };
}

// =============================================================================
// ENTITY FETCHING
// =============================================================================

/**
 * Fetch entities relevant to a narrative role
 */
async function fetchRelevantEntities(
  workspaceId: string,
  narrativeRole: NarrativeRole
): Promise<KnowledgeEntity[]> {
  const supabase = await createClient();

  // Get priority entity types for this role
  const priorityTypes = ROLE_ENTITY_PRIORITY[narrativeRole] || [];

  // Also get any entity type that maps to this role
  const additionalTypes = Object.entries(ENTITY_ROLE_MAPPING)
    .filter(([_, roles]) => roles.includes(narrativeRole))
    .map(([type]) => type);

  const allTypes = [...new Set([...priorityTypes, ...additionalTypes])];

  if (allTypes.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('knowledge_entities')
    .select('id, workspace_id, entity_type, name, description, metadata, confidence')
    .eq('workspace_id', workspaceId)
    .in('entity_type', allTypes)
    .gte('confidence', 0.5) // Only use confident entities
    .order('confidence', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[KB-Grounded Content] Error fetching entities:', error);
    return [];
  }

  return (data || []) as KnowledgeEntity[];
}

/**
 * Group entities by their type
 */
function groupEntitiesByType(
  entities: KnowledgeEntity[]
): Record<EntityType, KnowledgeEntity[]> {
  const grouped: Partial<Record<EntityType, KnowledgeEntity[]>> = {};

  for (const entity of entities) {
    const type = entity.entity_type;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type]!.push(entity);
  }

  return grouped as Record<EntityType, KnowledgeEntity[]>;
}

// =============================================================================
// CONTENT GENERATION
// =============================================================================

interface GeneratedContent {
  content: PopulatedContent;
  usedEntityIds: string[];
  fieldSources: Record<string, string[]>;
}

/**
 * Generate content for a specific component type
 */
async function generateContentForComponent(
  componentId: string,
  narrativeRole: NarrativeRole,
  entitiesByType: Record<EntityType, KnowledgeEntity[]>,
  hints?: KBGroundedSectionInput['hints']
): Promise<GeneratedContent> {
  const usedEntityIds: string[] = [];
  const fieldSources: Record<string, string[]> = {};
  const content: PopulatedContent = {};

  // Generate headline from tagline or benefit entities
  const headlineResult = generateHeadline(entitiesByType, narrativeRole);
  if (headlineResult) {
    content.headline = headlineResult.text;
    usedEntityIds.push(...headlineResult.entityIds);
    fieldSources['headline'] = headlineResult.entityIds;
  }

  // Generate description from company_description or benefit entities
  const descriptionResult = generateDescription(entitiesByType, narrativeRole);
  if (descriptionResult) {
    content.description = descriptionResult.text;
    usedEntityIds.push(...descriptionResult.entityIds);
    fieldSources['description'] = descriptionResult.entityIds;
  }

  // Generate features if available
  const featuresResult = generateFeatures(entitiesByType);
  if (featuresResult) {
    content.features = featuresResult.features;
    usedEntityIds.push(...featuresResult.entityIds);
    fieldSources['features'] = featuresResult.entityIds;
  }

  // Generate testimonials if available
  const testimonialsResult = generateTestimonials(entitiesByType);
  if (testimonialsResult) {
    content.testimonials = testimonialsResult.testimonials;
    usedEntityIds.push(...testimonialsResult.entityIds);
    fieldSources['testimonials'] = testimonialsResult.entityIds;
  }

  // Generate statistics if available
  const statisticsResult = generateStatistics(entitiesByType);
  if (statisticsResult) {
    content.statistics = statisticsResult.statistics;
    usedEntityIds.push(...statisticsResult.entityIds);
    fieldSources['statistics'] = statisticsResult.entityIds;
  }

  // Generate FAQs if available
  const faqsResult = generateFAQs(entitiesByType);
  if (faqsResult) {
    content.faqs = faqsResult.faqs;
    usedEntityIds.push(...faqsResult.entityIds);
    fieldSources['faqs'] = faqsResult.entityIds;
  }

  // Generate pricing if available
  const pricingResult = generatePricing(entitiesByType);
  if (pricingResult) {
    content.pricingTiers = pricingResult.tiers;
    usedEntityIds.push(...pricingResult.entityIds);
    fieldSources['pricingTiers'] = pricingResult.entityIds;
  }

  // Generate CTA based on role
  const ctaResult = generateCTA(entitiesByType, narrativeRole);
  if (ctaResult) {
    content.primaryCTA = ctaResult.cta;
    usedEntityIds.push(...ctaResult.entityIds);
    fieldSources['primaryCTA'] = ctaResult.entityIds;
  }

  return {
    content,
    usedEntityIds: [...new Set(usedEntityIds)],
    fieldSources,
  };
}

// =============================================================================
// FIELD GENERATORS
// =============================================================================

interface TextResult {
  text: string;
  entityIds: string[];
}

function generateHeadline(
  entities: Record<EntityType, KnowledgeEntity[]>,
  role: NarrativeRole
): TextResult | null {
  // Priority order for headlines
  const sources: EntityType[] =
    role === 'hook'
      ? ['company_tagline', 'benefit', 'company_description']
      : role === 'problem'
        ? ['use_case', 'benefit']
        : role === 'solution'
          ? ['feature', 'product', 'service']
          : role === 'proof'
            ? ['testimonial', 'statistic']
            : ['cta', 'benefit'];

  for (const type of sources) {
    const typeEntities = entities[type];
    if (typeEntities && typeEntities.length > 0) {
      const entity = typeEntities[0];
      const metadata = entity.metadata;

      // Extract headline text based on entity type
      let text: string | undefined;
      if (type === 'company_tagline') {
        text = (metadata?.slogan as string) || entity.name;
      } else if (type === 'benefit') {
        text = entity.name;
      } else if (type === 'feature') {
        text = entity.name;
      } else if (type === 'product' || type === 'service') {
        text = entity.name;
      } else {
        text = entity.name;
      }

      if (text) {
        return { text, entityIds: [entity.id] };
      }
    }
  }

  return null;
}

function generateDescription(
  entities: Record<EntityType, KnowledgeEntity[]>,
  role: NarrativeRole
): TextResult | null {
  // Look for company description or benefit descriptions
  const sources: EntityType[] = ['company_description', 'mission_statement', 'benefit', 'use_case'];

  for (const type of sources) {
    const typeEntities = entities[type];
    if (typeEntities && typeEntities.length > 0) {
      const entity = typeEntities[0];
      const metadata = entity.metadata;

      let text: string | undefined;
      if (type === 'company_description') {
        text = (metadata?.aboutText as string) || entity.description || undefined;
      } else if (type === 'mission_statement') {
        text = (metadata?.missionText as string) || entity.description || undefined;
      } else {
        text = entity.description || undefined;
      }

      if (text) {
        return { text, entityIds: [entity.id] };
      }
    }
  }

  return null;
}

interface FeaturesResult {
  features: FeatureItemContent[];
  entityIds: string[];
}

function generateFeatures(
  entities: Record<EntityType, KnowledgeEntity[]>
): FeaturesResult | null {
  const featureEntities = entities['feature'] || [];
  if (featureEntities.length === 0) return null;

  const features: FeatureItemContent[] = [];
  const entityIds: string[] = [];

  for (const entity of featureEntities.slice(0, 6)) {
    const metadata = entity.metadata;
    features.push({
      title: entity.name,
      description: entity.description || (metadata?.benefit as string) || '',
      icon: metadata?.icon as string,
    });
    entityIds.push(entity.id);
  }

  return features.length > 0 ? { features, entityIds } : null;
}

interface TestimonialsResult {
  testimonials: TestimonialContent[];
  entityIds: string[];
}

function generateTestimonials(
  entities: Record<EntityType, KnowledgeEntity[]>
): TestimonialsResult | null {
  const testimonialEntities = entities['testimonial'] || [];
  if (testimonialEntities.length === 0) return null;

  const testimonials: TestimonialContent[] = [];
  const entityIds: string[] = [];

  for (const entity of testimonialEntities.slice(0, 4)) {
    const metadata = entity.metadata;
    testimonials.push({
      quote: (metadata?.quote as string) || entity.description || entity.name,
      author: (metadata?.author as string) || 'Customer',
      role: (metadata?.role as string) || '',
      company: (metadata?.company as string) || '',
      rating: metadata?.rating as number,
    });
    entityIds.push(entity.id);
  }

  return testimonials.length > 0 ? { testimonials, entityIds } : null;
}

interface StatisticsResult {
  statistics: StatisticContent[];
  entityIds: string[];
}

function generateStatistics(
  entities: Record<EntityType, KnowledgeEntity[]>
): StatisticsResult | null {
  const statisticEntities = entities['statistic'] || [];
  if (statisticEntities.length === 0) return null;

  const statistics: StatisticContent[] = [];
  const entityIds: string[] = [];

  for (const entity of statisticEntities.slice(0, 4)) {
    const metadata = entity.metadata;
    statistics.push({
      value: (metadata?.value as string) || entity.name,
      label: (metadata?.metric as string) || entity.name,
      description: (metadata?.context as string) || entity.description || undefined,
    });
    entityIds.push(entity.id);
  }

  return statistics.length > 0 ? { statistics, entityIds } : null;
}

interface FAQsResult {
  faqs: FAQContent[];
  entityIds: string[];
}

function generateFAQs(entities: Record<EntityType, KnowledgeEntity[]>): FAQsResult | null {
  const faqEntities = entities['faq'] || [];
  if (faqEntities.length === 0) return null;

  const faqs: FAQContent[] = [];
  const entityIds: string[] = [];

  for (const entity of faqEntities.slice(0, 8)) {
    const metadata = entity.metadata;
    faqs.push({
      question: (metadata?.question as string) || entity.name,
      answer: (metadata?.answer as string) || entity.description || '',
    });
    entityIds.push(entity.id);
  }

  return faqs.length > 0 ? { faqs, entityIds } : null;
}

interface PricingResult {
  tiers: PricingTierContent[];
  entityIds: string[];
}

function generatePricing(entities: Record<EntityType, KnowledgeEntity[]>): PricingResult | null {
  const pricingEntities = entities['pricing'] || [];
  if (pricingEntities.length === 0) return null;

  const tiers: PricingTierContent[] = [];
  const entityIds: string[] = [];

  for (const entity of pricingEntities.slice(0, 4)) {
    const metadata = entity.metadata;
    tiers.push({
      name: (metadata?.tier as string) || entity.name,
      price: (metadata?.amount as string) || '$0',
      period: (metadata?.period as string) || '/month',
      description: entity.description || '',
      features: (metadata?.features as string[]) || [],
      cta: {
        text: 'Get Started',
        link: '#',
        variant: 'primary',
      },
      highlighted: (metadata?.highlighted as boolean) || false,
    });
    entityIds.push(entity.id);
  }

  return tiers.length > 0 ? { tiers, entityIds } : null;
}

interface CTAResult {
  cta: { text: string; link: string; variant: 'primary' | 'secondary' | 'ghost' | 'outline' };
  entityIds: string[];
}

function generateCTA(
  entities: Record<EntityType, KnowledgeEntity[]>,
  role: NarrativeRole
): CTAResult | null {
  const ctaEntities = entities['cta'] || [];

  if (ctaEntities.length > 0) {
    const entity = ctaEntities[0];
    const metadata = entity.metadata;
    return {
      cta: {
        text: (metadata?.action as string) || entity.name,
        link: (metadata?.targetUrl as string) || '#',
        variant: 'primary',
      },
      entityIds: [entity.id],
    };
  }

  // Default CTAs based on role (generic fallback)
  const defaultCTAs: Record<NarrativeRole, string> = {
    hook: 'Learn More',
    problem: 'See How We Help',
    solution: 'Explore Features',
    proof: 'Read Case Studies',
    action: 'Get Started',
  };

  return {
    cta: {
      text: defaultCTAs[role],
      link: '#',
      variant: role === 'action' ? 'primary' : 'secondary',
    },
    entityIds: [], // No KB entity
  };
}

// =============================================================================
// TRACEABILITY
// =============================================================================

function buildTraceability(
  allEntities: KnowledgeEntity[],
  usedEntityIds: string[]
): KBTraceability {
  const usedEntities = allEntities.filter((e) => usedEntityIds.includes(e.id));

  const isGenericFallback = usedEntityIds.length === 0;

  const confidence =
    usedEntities.length > 0
      ? usedEntities.reduce((sum, e) => sum + e.confidence, 0) / usedEntities.length
      : 0;

  const entityTypesUsed = [...new Set(usedEntities.map((e) => e.entity_type))];

  return {
    sourceEntityIds: usedEntityIds,
    confidence,
    isGenericFallback,
    entityTypesUsed,
  };
}

// =============================================================================
// FALLBACK CONTENT
// =============================================================================

function generateFallbackContent(
  componentId: string,
  narrativeRole: NarrativeRole
): KBGroundedSectionContent {
  // Default fallback content based on narrative role
  const fallbackContent: Record<NarrativeRole, PopulatedContent> = {
    hook: {
      headline: 'Transform Your Business Today',
      description: 'Discover how our solutions can help you achieve your goals.',
      primaryCTA: { text: 'Learn More', link: '#', variant: 'primary' },
    },
    problem: {
      headline: 'Facing These Challenges?',
      description: 'Many businesses struggle with common obstacles that prevent growth.',
      primaryCTA: { text: 'See Solutions', link: '#', variant: 'secondary' },
    },
    solution: {
      headline: 'Our Approach',
      description: 'We provide comprehensive solutions tailored to your needs.',
      primaryCTA: { text: 'Explore Features', link: '#', variant: 'primary' },
    },
    proof: {
      headline: 'Trusted by Industry Leaders',
      description: 'See how we\'ve helped businesses like yours succeed.',
      primaryCTA: { text: 'View Case Studies', link: '#', variant: 'secondary' },
    },
    action: {
      headline: 'Ready to Get Started?',
      description: 'Join thousands of satisfied customers today.',
      primaryCTA: { text: 'Start Free Trial', link: '#', variant: 'primary' },
    },
  };

  return {
    content: fallbackContent[narrativeRole],
    traceability: {
      sourceEntityIds: [],
      confidence: 0,
      isGenericFallback: true,
      entityTypesUsed: [],
    },
    fieldSources: {},
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  fetchRelevantEntities,
  groupEntitiesByType,
  ENTITY_ROLE_MAPPING,
  ROLE_ENTITY_PRIORITY,
};
