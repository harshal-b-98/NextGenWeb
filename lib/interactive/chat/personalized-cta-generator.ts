/**
 * Personalized CTA Generator
 * Phase 6: Conversational Marketing Platform
 *
 * Generates workspace-specific CTAs based on knowledge base content.
 * Analyzes the knowledge base to identify key topics, features, and value props
 * then creates CTAs tailored to the specific business.
 */

import { completeJSON } from '@/lib/ai/client';
import { similaritySearch } from '@/lib/knowledge/embeddings/store';
import { generateEmbedding } from '@/lib/knowledge/embeddings/client';

// ============================================================================
// TYPES
// ============================================================================

export interface PersonalizedCTA {
  id: string;
  text: string;
  topic: string;
  description?: string;
  icon?: string;
  variant: 'primary' | 'secondary' | 'tertiary';
  category: 'sales' | 'marketing' | 'product' | 'support' | 'general' | 'deep-dive';
  /** Additional metadata for special CTAs like deep-dives */
  metadata?: {
    isDeepDive?: boolean;
    sourceSectionType?: string;
    itemTitle?: string;
    itemDescription?: string;
    [key: string]: unknown;
  };
}

export interface WorkspaceConfig {
  name: string;
  tagline?: string;
  description?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface CTAGenerationResult {
  ctas: PersonalizedCTA[];
  workspaceConfig: WorkspaceConfig;
  knowledgeTopics: string[];
}

// ============================================================================
// CTA GENERATOR SERVICE
// ============================================================================

export class PersonalizedCTAGenerator {
  /**
   * Generate personalized CTAs for a workspace
   */
  async generateCTAs(
    workspaceId: string,
    websiteName: string,
    existingBrandConfig?: Partial<WorkspaceConfig>
  ): Promise<CTAGenerationResult> {
    // Step 1: Sample knowledge base to understand the business
    const knowledgeSample = await this.sampleKnowledgeBase(workspaceId);

    // Step 2: Extract key topics and themes
    const { topics, businessType, valueProps } =
      await this.analyzeKnowledge(knowledgeSample);

    // Step 3: Generate personalized CTAs
    const ctas = await this.generatePersonalizedCTAs({
      websiteName,
      businessType,
      topics,
      valueProps,
      knowledgeSample,
    });

    // Step 4: Build workspace config
    const workspaceConfig = await this.buildWorkspaceConfig({
      websiteName,
      businessType,
      valueProps,
      existingBrandConfig,
    });

    return {
      ctas,
      workspaceConfig,
      knowledgeTopics: topics,
    };
  }

  /**
   * Sample the knowledge base to get representative content
   */
  private async sampleKnowledgeBase(workspaceId: string): Promise<string[]> {
    // Use broad queries to sample different aspects of the knowledge base
    const sampleQueries = [
      'What are the main features and capabilities?',
      'How does this product help businesses?',
      'What are the key benefits and value propositions?',
      'What industries or use cases does this serve?',
      'How does implementation or getting started work?',
    ];

    const samples: string[] = [];

    for (const query of sampleQueries) {
      try {
        const embeddingResult = await generateEmbedding(query);
        const results = await similaritySearch(
          {
            workspaceId,
            query,
            limit: 3,
            threshold: 0.3, // Lower threshold to get broader sample
          },
          embeddingResult.embedding
        );

        samples.push(...results.map((r) => r.content));
      } catch (error) {
        console.error('Knowledge sampling error:', error);
      }
    }

    // Deduplicate and limit
    return [...new Set(samples)].slice(0, 15);
  }

  /**
   * Analyze knowledge to extract topics and themes
   */
  private async analyzeKnowledge(knowledgeSample: string[]): Promise<{
    topics: string[];
    businessType: string;
    valueProps: string[];
  }> {
    if (knowledgeSample.length === 0) {
      return {
        topics: ['products', 'services', 'solutions'],
        businessType: 'general',
        valueProps: ['quality', 'reliability', 'innovation'],
      };
    }

    const sampleText = knowledgeSample.join('\n\n---\n\n').slice(0, 8000);

    try {
      const { data } = await completeJSON<{
        businessType: string;
        industry: string;
        mainTopics: string[];
        valuePropositions: string[];
        targetAudience: string[];
        keyFeatures: string[];
      }>({
        messages: [
          {
            role: 'system',
            content: `You are analyzing a company's knowledge base to understand their business.
Extract key information to help generate personalized marketing CTAs.

Respond in JSON:
{
  "businessType": "Brief description of what the business does (e.g., 'beverage analytics platform', 'e-commerce solution')",
  "industry": "Primary industry vertical",
  "mainTopics": ["List of 5-8 main topics/themes in the knowledge base"],
  "valuePropositions": ["List of 3-5 key value props/benefits"],
  "targetAudience": ["List of target customer personas"],
  "keyFeatures": ["List of 5-8 key product features"]
}`,
          },
          {
            role: 'user',
            content: `Analyze this knowledge base content:\n\n${sampleText}`,
          },
        ],
        config: { maxTokens: 1000 },
      });

      return {
        topics: [...data.mainTopics, ...data.keyFeatures].slice(0, 10),
        businessType: `${data.businessType} in ${data.industry}`,
        valueProps: data.valuePropositions,
      };
    } catch (error) {
      console.error('Knowledge analysis error:', error);
      return {
        topics: ['products', 'services', 'solutions', 'features'],
        businessType: 'business solution',
        valueProps: ['efficiency', 'innovation', 'results'],
      };
    }
  }

  /**
   * Generate personalized CTAs based on analysis
   */
  private async generatePersonalizedCTAs(params: {
    websiteName: string;
    businessType: string;
    topics: string[];
    valueProps: string[];
    knowledgeSample: string[];
  }): Promise<PersonalizedCTA[]> {
    const context = params.knowledgeSample.join('\n\n').slice(0, 5000);

    try {
      const { data } = await completeJSON<{
        ctas: Array<{
          text: string;
          topic: string;
          description: string;
          category: 'sales' | 'marketing' | 'product' | 'support' | 'general';
          variant: 'primary' | 'secondary' | 'tertiary';
          icon?: string;
        }>;
      }>({
        messages: [
          {
            role: 'system',
            content: `You are creating personalized CTAs for a conversational marketing landing page.
The landing page has a minimal hero with the company name, tagline, and interactive CTAs.
When users click a CTA, it generates a new content section below (not navigation).

Business: ${params.websiteName}
Type: ${params.businessType}
Key Topics: ${params.topics.join(', ')}
Value Props: ${params.valueProps.join(', ')}

Generate 6-8 CTAs that:
1. Are specific to THIS business (not generic)
2. Address different parts of the buyer journey
3. Cover: product info, value/ROI, how it works, use cases, getting started
4. Use action-oriented, compelling language
5. Are relevant to the knowledge base content

Respond in JSON:
{
  "ctas": [
    {
      "text": "CTA button text (short, actionable)",
      "topic": "internal topic identifier for content generation",
      "description": "Brief description of what this CTA reveals",
      "category": "sales|marketing|product|support|general",
      "variant": "primary (1-2 main CTAs) | secondary (2-3 supporting) | tertiary (remaining)",
      "icon": "optional emoji icon"
    }
  ]
}

Order by importance: primary CTAs first, then secondary, then tertiary.`,
          },
          {
            role: 'user',
            content: `Generate CTAs based on this knowledge:\n\n${context}`,
          },
        ],
        config: { maxTokens: 1500 },
      });

      // Add unique IDs
      return data.ctas.map((cta, index) => ({
        ...cta,
        id: `cta-${index}-${Date.now()}`,
      }));
    } catch (error) {
      console.error('CTA generation error:', error);
      // Return default CTAs
      return this.getDefaultCTAs(params.websiteName);
    }
  }

  /**
   * Build workspace config (tagline, description, etc.)
   */
  private async buildWorkspaceConfig(params: {
    websiteName: string;
    businessType: string;
    valueProps: string[];
    existingBrandConfig?: Partial<WorkspaceConfig>;
  }): Promise<WorkspaceConfig> {
    // If we have existing brand config, use it
    if (params.existingBrandConfig?.tagline) {
      return {
        name: params.websiteName,
        ...params.existingBrandConfig,
      };
    }

    try {
      const { data } = await completeJSON<{
        tagline: string;
        description: string;
      }>({
        messages: [
          {
            role: 'system',
            content: `Generate a tagline and brief description for a company.

Business: ${params.websiteName}
Type: ${params.businessType}
Value Props: ${params.valueProps.join(', ')}

Respond in JSON:
{
  "tagline": "Short, memorable tagline (5-10 words)",
  "description": "Brief description (1-2 sentences, max 30 words)"
}`,
          },
          {
            role: 'user',
            content: 'Generate tagline and description.',
          },
        ],
        config: { maxTokens: 200 },
      });

      return {
        name: params.websiteName,
        tagline: data.tagline,
        description: data.description,
        ...params.existingBrandConfig,
      };
    } catch (error) {
      console.error('Config generation error:', error);
      return {
        name: params.websiteName,
        tagline: `Discover ${params.websiteName}`,
        description: `Explore our solutions and see how we can help your business.`,
        ...params.existingBrandConfig,
      };
    }
  }

  /**
   * Default CTAs fallback
   */
  private getDefaultCTAs(websiteName: string): PersonalizedCTA[] {
    return [
      {
        id: 'cta-default-1',
        text: 'See How It Works',
        topic: 'how-it-works',
        description: 'Learn about our process',
        category: 'product',
        variant: 'primary',
        icon: '🚀',
      },
      {
        id: 'cta-default-2',
        text: 'Explore Features',
        topic: 'features',
        description: 'Discover our capabilities',
        category: 'product',
        variant: 'primary',
        icon: '✨',
      },
      {
        id: 'cta-default-3',
        text: 'View Pricing',
        topic: 'pricing',
        description: 'See our pricing plans',
        category: 'sales',
        variant: 'secondary',
        icon: '💰',
      },
      {
        id: 'cta-default-4',
        text: 'Success Stories',
        topic: 'testimonials',
        description: 'Read customer success stories',
        category: 'marketing',
        variant: 'secondary',
        icon: '⭐',
      },
      {
        id: 'cta-default-5',
        text: 'Get Started',
        topic: 'getting-started',
        description: 'Start your journey',
        category: 'sales',
        variant: 'tertiary',
      },
      {
        id: 'cta-default-6',
        text: 'Contact Us',
        topic: 'contact',
        description: 'Speak with our team',
        category: 'support',
        variant: 'tertiary',
      },
    ];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let ctaGeneratorInstance: PersonalizedCTAGenerator | null = null;

export function getCTAGenerator(): PersonalizedCTAGenerator {
  if (!ctaGeneratorInstance) {
    ctaGeneratorInstance = new PersonalizedCTAGenerator();
  }
  return ctaGeneratorInstance;
}
