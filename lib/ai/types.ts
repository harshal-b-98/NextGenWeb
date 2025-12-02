/**
 * AI Module Types
 *
 * Common types used across AI agents and pipelines.
 */

import { z } from 'zod';

/**
 * Supported LLM providers
 */
export type LLMProvider = 'openai' | 'anthropic';

/**
 * LLM model identifiers
 */
export type LLMModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'claude-sonnet-4-20250514'
  | 'claude-3-7-sonnet-20250219'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-haiku-20240307';

/**
 * LLM configuration
 */
export interface LLMConfig {
  provider: LLMProvider;
  model: LLMModel;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

/**
 * Default LLM configurations for fallback chain
 * Using claude-3-5-sonnet as primary (current recommended model)
 */
export const DEFAULT_LLM_CHAIN: LLMConfig[] = [
  { provider: 'openai', model: 'gpt-4o', temperature: 0.1 },
  { provider: 'openai', model: 'gpt-4o-mini', temperature: 0.1 },
  { provider: 'anthropic', model: 'claude-3-haiku-20240307', temperature: 0.1 },
  { provider: 'openai', model: 'gpt-3.5-turbo', temperature: 0.1 },
];

/**
 * Base agent result
 */
export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed?: number;
  model?: LLMModel;
  processingTime?: number;
}

/**
 * Entity types that can be extracted from documents
 */
export type EntityType =
  | 'product'
  | 'service'
  | 'feature'
  | 'benefit'
  | 'pricing'
  | 'testimonial'
  | 'company'
  | 'person'
  | 'statistic'
  | 'faq'
  | 'cta'
  | 'process_step'
  | 'use_case'
  | 'integration'
  | 'contact';

/**
 * Base entity structure
 */
export interface BaseEntity {
  id: string;
  type: EntityType;
  name: string;
  description?: string;
  confidence: number;
  sourceChunkIds: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Product entity
 */
export interface ProductEntity extends BaseEntity {
  type: 'product';
  features?: string[];
  pricing?: string;
  category?: string;
}

/**
 * Service entity
 */
export interface ServiceEntity extends BaseEntity {
  type: 'service';
  deliverables?: string[];
  pricing?: string;
  duration?: string;
}

/**
 * Feature entity
 */
export interface FeatureEntity extends BaseEntity {
  type: 'feature';
  benefit?: string;
  category?: string;
}

/**
 * Benefit entity
 */
export interface BenefitEntity extends BaseEntity {
  type: 'benefit';
  targetAudience?: string;
  supportingEvidence?: string;
}

/**
 * Pricing entity
 */
export interface PricingEntity extends BaseEntity {
  type: 'pricing';
  amount?: string;
  currency?: string;
  period?: string;
  tier?: string;
  features?: string[];
}

/**
 * Testimonial entity
 */
export interface TestimonialEntity extends BaseEntity {
  type: 'testimonial';
  quote: string;
  author?: string;
  role?: string;
  company?: string;
  rating?: number;
}

/**
 * Company entity
 */
export interface CompanyEntity extends BaseEntity {
  type: 'company';
  industry?: string;
  size?: string;
  location?: string;
  website?: string;
}

/**
 * Person entity
 */
export interface PersonEntity extends BaseEntity {
  type: 'person';
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
}

/**
 * Statistic entity
 */
export interface StatisticEntity extends BaseEntity {
  type: 'statistic';
  value: string;
  metric?: string;
  context?: string;
  timeframe?: string;
}

/**
 * FAQ entity
 */
export interface FAQEntity extends BaseEntity {
  type: 'faq';
  question: string;
  answer: string;
  category?: string;
}

/**
 * CTA (Call to Action) entity
 */
export interface CTAEntity extends BaseEntity {
  type: 'cta';
  action: string;
  urgency?: 'low' | 'medium' | 'high';
  targetUrl?: string;
}

/**
 * Process step entity
 */
export interface ProcessStepEntity extends BaseEntity {
  type: 'process_step';
  stepNumber: number;
  action: string;
  outcome?: string;
}

/**
 * Use case entity
 */
export interface UseCaseEntity extends BaseEntity {
  type: 'use_case';
  scenario: string;
  solution?: string;
  outcome?: string;
  industry?: string;
}

/**
 * Integration entity
 */
export interface IntegrationEntity extends BaseEntity {
  type: 'integration';
  platform: string;
  integrationType?: string;
  capabilities?: string[];
}

/**
 * Contact entity
 */
export interface ContactEntity extends BaseEntity {
  type: 'contact';
  email?: string;
  phone?: string;
  address?: string;
  socialMedia?: Record<string, string>;
}

/**
 * Union type for all entities
 */
export type Entity =
  | ProductEntity
  | ServiceEntity
  | FeatureEntity
  | BenefitEntity
  | PricingEntity
  | TestimonialEntity
  | CompanyEntity
  | PersonEntity
  | StatisticEntity
  | FAQEntity
  | CTAEntity
  | ProcessStepEntity
  | UseCaseEntity
  | IntegrationEntity
  | ContactEntity;

/**
 * Zod schema for entity validation
 */
export const EntitySchema = z.object({
  id: z.string(),
  type: z.enum([
    'product',
    'service',
    'feature',
    'benefit',
    'pricing',
    'testimonial',
    'company',
    'person',
    'statistic',
    'faq',
    'cta',
    'process_step',
    'use_case',
    'integration',
    'contact',
  ]),
  name: z.string(),
  description: z.string().optional(),
  confidence: z.number().min(0).max(1),
  sourceChunkIds: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Entity extraction result
 */
export interface EntityExtractionResult {
  entities: Entity[];
  summary?: string;
  documentType?: string;
  primaryTopic?: string;
  tokensUsed: number;
  processingTime: number;
}

/**
 * Relationship between entities
 */
export interface EntityRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: RelationshipType;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * Types of relationships between entities
 */
export type RelationshipType =
  | 'has_feature'
  | 'provides_benefit'
  | 'includes_pricing'
  | 'has_testimonial'
  | 'belongs_to'
  | 'authored_by'
  | 'related_to'
  | 'prerequisite_of'
  | 'alternative_to'
  | 'integrates_with'
  | 'addresses_use_case';
