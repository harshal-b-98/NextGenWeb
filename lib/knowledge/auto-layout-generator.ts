/**
 * Auto Layout Generator Service
 *
 * Automatically generates or updates website layouts when knowledge base is updated.
 * This ensures the website content stays fresh and aligned with the knowledge base.
 *
 * Enhanced Features:
 * - Extensive section types (hero, features, benefits, pricing, testimonials, FAQ, etc.)
 * - AI-powered content analysis for better section recommendations
 * - Workspace improvement suggestions
 * - Nightly sync scheduling
 */

import { createClient } from '@/lib/supabase/server';
import { completeJSON } from '@/lib/ai/client';

// ============================================================================
// TYPES
// ============================================================================

interface ContentSection {
  type: string;
  headline: string;
  subheadline?: string;
  items: ContentItem[];
  topic: string;
  priority: number; // Higher priority sections appear first
  confidence: number; // How confident we are this section is relevant
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  value?: string;
  label?: string;
  image?: string;
  cta?: {
    text: string;
    action: string;
  };
}

interface GeneratedLayout {
  id: string;
  websiteId: string;
  sections: ContentSection[];
  heroSection: HeroSection | null;
  generatedAt: string;
  knowledgeItemIds: string[];
  contentHash: string;
  analysisMetadata: LayoutAnalysisMetadata;
}

interface HeroSection {
  headline: string;
  subheadline: string;
  primaryCta: { text: string; action: string };
  secondaryCta?: { text: string; action: string };
  backgroundStyle: 'gradient' | 'image' | 'pattern' | 'solid';
  features?: string[];
}

interface LayoutAnalysisMetadata {
  totalEntities: number;
  entityTypes: string[];
  coverageScore: number; // 0-100, how well the layout covers the knowledge base
  suggestedImprovements: string[];
  missingContent: string[];
  lastAnalyzedAt: string;
}

interface KnowledgeItem {
  id: string;
  content: string;
  entity_type: string;
  metadata: Record<string, unknown> | null;
}

interface KnowledgeEntity {
  id: string;
  entity_type: string;
  name: string;
  description: string | null;
  confidence: number;
  knowledge_item_id?: string;
}

export interface WorkspaceImprovement {
  id: string;
  type: 'knowledge_gap' | 'content_quality' | 'brand_incomplete' | 'missing_section' | 'clarification_needed';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel: string;
  actionType: 'upload_document' | 'add_content' | 'configure_brand' | 'answer_question' | 'review_content';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AINotification {
  id: string;
  workspaceId: string;
  type: 'clarification' | 'suggestion' | 'warning' | 'info';
  title: string;
  message: string;
  question?: string;
  options?: string[];
  answered: boolean;
  answer?: string;
  createdAt: string;
  expiresAt?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SECTION_TYPE_CONFIG: Record<string, {
  priority: number;
  minItems: number;
  maxItems: number;
  entityTypes: string[];
}> = {
  'hero': { priority: 100, minItems: 0, maxItems: 0, entityTypes: [] },
  'features-grid': { priority: 90, minItems: 3, maxItems: 9, entityTypes: ['feature', 'product', 'capability', 'service'] },
  'benefits-cards': { priority: 85, minItems: 3, maxItems: 6, entityTypes: ['benefit', 'value', 'advantage'] },
  'how-it-works': { priority: 80, minItems: 3, maxItems: 6, entityTypes: ['step', 'process', 'workflow', 'phase'] },
  'stats-display': { priority: 75, minItems: 3, maxItems: 6, entityTypes: ['stat', 'metric', 'achievement', 'number'] },
  'pricing-table': { priority: 70, minItems: 1, maxItems: 4, entityTypes: ['pricing', 'plan', 'tier', 'package'] },
  'testimonials': { priority: 65, minItems: 2, maxItems: 6, entityTypes: ['testimonial', 'review', 'quote', 'case_study'] },
  'use-cases': { priority: 60, minItems: 2, maxItems: 6, entityTypes: ['use_case', 'scenario', 'application', 'industry'] },
  'integrations': { priority: 55, minItems: 4, maxItems: 12, entityTypes: ['integration', 'partner', 'connection', 'api'] },
  'team': { priority: 50, minItems: 2, maxItems: 8, entityTypes: ['team', 'person', 'founder', 'leader'] },
  'faq-accordion': { priority: 45, minItems: 4, maxItems: 12, entityTypes: ['faq', 'question', 'answer'] },
  'comparison-table': { priority: 40, minItems: 2, maxItems: 5, entityTypes: ['comparison', 'alternative', 'competitor'] },
  'cta-block': { priority: 35, minItems: 0, maxItems: 0, entityTypes: [] },
  'contact-form': { priority: 30, minItems: 0, maxItems: 0, entityTypes: ['contact', 'support'] },
};

// Supported entity types for coverage calculation (from EntityType)
const SUPPORTED_ENTITY_TYPES = [
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
] as const;

const ICON_MAP: Record<string, string> = {
  'product': 'layers',
  'feature': 'zap',
  'service': 'settings',
  'pricing': 'credit-card',
  'benefit': 'check-circle',
  'capability': 'sparkles',
  'solution': 'lightbulb',
  'integration': 'plug',
  'security': 'shield',
  'support': 'headphones',
  'performance': 'trending-up',
  'team': 'users',
  'time': 'clock',
  'communication': 'message-circle',
  'goal': 'target',
  'resource': 'book-open',
  'api': 'code',
  'automation': 'cpu',
  'analytics': 'bar-chart',
  'collaboration': 'users',
  'customization': 'sliders',
  'scalability': 'maximize',
  'reliability': 'check-square',
  'speed': 'zap',
  'cost': 'dollar-sign',
  'quality': 'award',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateContentHash(items: KnowledgeItem[]): string {
  const content = items.map(i => `${i.id}:${i.content.slice(0, 100)}`).join('|');
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function getIconForEntity(entityType: string, entityName?: string): string {
  // First try exact match
  if (ICON_MAP[entityType.toLowerCase()]) {
    return ICON_MAP[entityType.toLowerCase()];
  }

  // Try to find icon based on keywords in entity name
  if (entityName) {
    const nameLower = entityName.toLowerCase();
    for (const [keyword, icon] of Object.entries(ICON_MAP)) {
      if (nameLower.includes(keyword)) {
        return icon;
      }
    }
  }

  return 'sparkles';
}

function extractValueFromEntity(entity: KnowledgeEntity): string {
  const text = entity.description || entity.name;
  const numberMatch = text.match(/(\d+[\d,]*%?|\$[\d,]+[KMB]?|\d+[\d,]*\+?)/);
  return numberMatch ? numberMatch[1] : '100+';
}

function calculateCoverageScore(
  entities: KnowledgeEntity[],
  sections: ContentSection[]
): number {
  if (entities.length === 0) return 0;

  const usedEntityIds = new Set<string>();
  sections.forEach(section => {
    section.items.forEach(item => {
      usedEntityIds.add(item.id);
    });
  });

  return Math.round((usedEntityIds.size / entities.length) * 100);
}

function identifyMissingContent(
  entitiesByType: Record<string, KnowledgeEntity[]>,
  sections: ContentSection[]
): string[] {
  const missing: string[] = [];
  const sectionTopics = new Set(sections.map(s => s.topic));

  // Check for important missing sections
  if (!sectionTopics.has('features') && !entitiesByType['feature']?.length) {
    missing.push('Product features - Upload documentation about your product features');
  }
  if (!sectionTopics.has('pricing') && !entitiesByType['pricing']?.length) {
    missing.push('Pricing information - Add pricing details to enable pricing section');
  }
  if (!sectionTopics.has('testimonials') && !entitiesByType['testimonial']?.length) {
    missing.push('Customer testimonials - Add testimonials or case studies');
  }
  if (!sectionTopics.has('faq') && !entitiesByType['faq']?.length) {
    missing.push('FAQ content - Add frequently asked questions');
  }
  if (!sectionTopics.has('how-it-works') && !entitiesByType['step']?.length && !entitiesByType['process']?.length) {
    missing.push('How it works - Document your process or workflow steps');
  }

  return missing;
}

// ============================================================================
// AUTO LAYOUT GENERATOR CLASS
// ============================================================================

export class AutoLayoutGenerator {
  /**
   * Generate extensive layouts for a workspace based on its knowledge base
   */
  async generateLayoutsForWorkspace(workspaceId: string): Promise<{
    success: boolean;
    sectionsGenerated: number;
    layoutId?: string;
    improvements?: WorkspaceImprovement[];
    error?: string;
  }> {
    try {
      const supabase = await createClient();

      // Get all knowledge items for the workspace
      const { data: knowledgeItems, error: itemsError } = await supabase
        .from('knowledge_base_items')
        .select('id, content, entity_type, metadata')
        .eq('workspace_id', workspaceId);

      if (itemsError) {
        console.error('[AutoLayoutGenerator] Failed to fetch knowledge items:', itemsError);
        return { success: false, sectionsGenerated: 0, error: 'Failed to fetch knowledge items' };
      }

      if (!knowledgeItems || knowledgeItems.length === 0) {
        console.log('[AutoLayoutGenerator] No knowledge items found for workspace');
        const improvements = await this.generateImprovementsForEmptyWorkspace(workspaceId);
        return { success: true, sectionsGenerated: 0, improvements };
      }

      // Get all entities for these knowledge items
      const { data: entities, error: entitiesError } = await supabase
        .from('knowledge_entities')
        .select('id, entity_type, name, description, confidence, knowledge_item_id')
        .in('knowledge_item_id', knowledgeItems.map(i => i.id))
        .order('confidence', { ascending: false });

      if (entitiesError) {
        console.error('[AutoLayoutGenerator] Failed to fetch entities:', entitiesError);
      }

      // Get workspace and brand config
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('name, slug')
        .eq('id', workspaceId)
        .single();

      const { data: brandConfig } = await supabase
        .from('brand_configs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      // Group entities by type
      const entitiesByType: Record<string, KnowledgeEntity[]> = {};
      (entities || []).forEach(entity => {
        const type = entity.entity_type.toLowerCase();
        if (!entitiesByType[type]) {
          entitiesByType[type] = [];
        }
        entitiesByType[type].push(entity);
      });

      // Generate hero section
      const heroSection = await this.generateHeroSection(
        workspace?.name || 'Your Company',
        entitiesByType,
        brandConfig
      );

      // Generate all applicable sections
      const sections = await this.generateAllSections(entitiesByType);

      // Calculate coverage and identify missing content
      const coverageScore = calculateCoverageScore(entities || [], sections);
      const missingContent = identifyMissingContent(entitiesByType, sections);

      // Generate improvements
      const improvements = await this.generateImprovementsInternal(
        workspaceId,
        entitiesByType,
        sections,
        coverageScore,
        brandConfig
      );

      // Generate content hash for change detection
      const contentHash = generateContentHash(knowledgeItems as KnowledgeItem[]);

      // Get or create website for this workspace
      let { data: website } = await supabase
        .from('websites')
        .select('id, settings')
        .eq('workspace_id', workspaceId)
        .limit(1)
        .single();

      if (!website) {
        if (workspace) {
          const { data: newWebsite } = await supabase
            .from('websites')
            .insert({
              workspace_id: workspaceId,
              name: workspace.name,
              slug: workspace.slug,
              status: 'draft',
              settings: {},
              brand_config: brandConfig || {},
            })
            .select()
            .single();

          website = newWebsite;
        }
      }

      if (!website) {
        return { success: false, sectionsGenerated: 0, error: 'Failed to get or create website' };
      }

      // Build analysis metadata
      const analysisMetadata: LayoutAnalysisMetadata = {
        totalEntities: entities?.length || 0,
        entityTypes: Object.keys(entitiesByType),
        coverageScore,
        suggestedImprovements: improvements.map(i => i.title),
        missingContent,
        lastAnalyzedAt: new Date().toISOString(),
      };

      // Store the generated layout
      const layoutData: GeneratedLayout = {
        id: `layout-${Date.now()}`,
        websiteId: website.id,
        sections,
        heroSection,
        generatedAt: new Date().toISOString(),
        knowledgeItemIds: knowledgeItems.map(i => i.id),
        contentHash,
        analysisMetadata,
      };

      // Merge with existing settings
      const existingSettings = (website.settings as Record<string, unknown>) || {};

      // Update website with generated layout
      const { error: updateError } = await supabase
        .from('websites')
        .update({
          settings: JSON.parse(JSON.stringify({
            ...existingSettings,
            generatedLayout: layoutData,
            lastKnowledgeSync: new Date().toISOString(),
            improvements: improvements,
          })),
          updated_at: new Date().toISOString(),
        })
        .eq('id', website.id);

      if (updateError) {
        console.error('[AutoLayoutGenerator] Failed to update website:', updateError);
        return { success: false, sectionsGenerated: 0, error: 'Failed to save layout' };
      }

      // Store improvements separately for notifications
      await this.storeImprovements(workspaceId, improvements);

      console.log(`[AutoLayoutGenerator] Generated ${sections.length} sections for workspace ${workspaceId}`);

      return {
        success: true,
        sectionsGenerated: sections.length,
        layoutId: layoutData.id,
        improvements,
      };
    } catch (error) {
      console.error('[AutoLayoutGenerator] Error:', error);
      return {
        success: false,
        sectionsGenerated: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate hero section based on knowledge base
   */
  private async generateHeroSection(
    companyName: string,
    entitiesByType: Record<string, KnowledgeEntity[]>,
    brandConfig: Record<string, unknown> | null
  ): Promise<HeroSection> {
    // Try to extract key value propositions
    const features = entitiesByType['feature']?.slice(0, 3).map(e => e.name) || [];
    const benefits = entitiesByType['benefit']?.slice(0, 3).map(e => e.name) || [];
    const keyPoints = [...features, ...benefits].slice(0, 3);

    // Generate headline using AI if we have enough context
    let headline = `Welcome to ${companyName}`;
    let subheadline = 'Discover what we can do for you';

    if (keyPoints.length > 0) {
      try {
        const { data } = await completeJSON<{ headline: string; subheadline: string }>({
          messages: [
            {
              role: 'system',
              content: `Generate a compelling hero section headline and subheadline for a company.

Company: ${companyName}
Key Features/Benefits: ${keyPoints.join(', ')}

Return JSON: { "headline": "...", "subheadline": "..." }
- Headline should be 5-10 words, compelling and action-oriented
- Subheadline should be 10-20 words, explaining the value proposition`,
            },
            {
              role: 'user',
              content: 'Generate the hero content',
            },
          ],
          config: { maxTokens: 200 },
        });

        if (data.headline) headline = data.headline;
        if (data.subheadline) subheadline = data.subheadline;
      } catch (error) {
        console.error('[AutoLayoutGenerator] Failed to generate hero content:', error);
      }
    }

    return {
      headline,
      subheadline,
      primaryCta: { text: 'Get Started', action: '#get-started' },
      secondaryCta: { text: 'Learn More', action: '#features' },
      backgroundStyle: brandConfig?.primaryColor ? 'gradient' : 'pattern',
      features: keyPoints,
    };
  }

  /**
   * Generate all applicable sections based on available entities
   */
  private async generateAllSections(
    entitiesByType: Record<string, KnowledgeEntity[]>
  ): Promise<ContentSection[]> {
    const sections: ContentSection[] = [];

    // Features Grid
    const featureTypes = ['feature', 'product', 'capability', 'service'];
    const featureEntities = featureTypes
      .flatMap(t => entitiesByType[t] || [])
      .slice(0, 9);

    if (featureEntities.length >= 3) {
      sections.push({
        type: 'features-grid',
        headline: 'Powerful Features',
        subheadline: 'Everything you need to succeed',
        topic: 'features',
        priority: 90,
        confidence: Math.min(...featureEntities.map(e => e.confidence)) || 0.8,
        items: featureEntities.map(e => ({
          id: e.id,
          title: e.name,
          description: e.description || `Discover ${e.name}`,
          icon: getIconForEntity(e.entity_type, e.name),
        })),
      });
    }

    // Benefits Cards
    const benefitTypes = ['benefit', 'value', 'advantage'];
    const benefitEntities = benefitTypes
      .flatMap(t => entitiesByType[t] || [])
      .slice(0, 6);

    if (benefitEntities.length >= 2) {
      sections.push({
        type: 'benefits-cards',
        headline: 'Why Choose Us',
        subheadline: 'Benefits that make a difference',
        topic: 'benefits',
        priority: 85,
        confidence: Math.min(...benefitEntities.map(e => e.confidence)) || 0.8,
        items: benefitEntities.map(e => ({
          id: e.id,
          title: e.name,
          description: e.description || `Benefit: ${e.name}`,
          icon: 'check-circle',
        })),
      });
    }

    // How It Works (Timeline)
    const processTypes = ['step', 'process', 'workflow', 'phase'];
    const processEntities = processTypes
      .flatMap(t => entitiesByType[t] || [])
      .slice(0, 6);

    if (processEntities.length >= 3) {
      sections.push({
        type: 'timeline',
        headline: 'How It Works',
        subheadline: 'Simple steps to get started',
        topic: 'how-it-works',
        priority: 80,
        confidence: Math.min(...processEntities.map(e => e.confidence)) || 0.8,
        items: processEntities.map((e, i) => ({
          id: e.id,
          title: e.name,
          description: e.description || `Step ${i + 1}: ${e.name}`,
          label: String(i + 1),
        })),
      });
    }

    // Stats Display
    const statTypes = ['stat', 'metric', 'achievement', 'number'];
    const statEntities = statTypes
      .flatMap(t => entitiesByType[t] || [])
      .slice(0, 4);

    if (statEntities.length >= 2) {
      sections.push({
        type: 'stats-display',
        headline: 'By The Numbers',
        subheadline: 'Our impact in numbers',
        topic: 'stats',
        priority: 75,
        confidence: Math.min(...statEntities.map(e => e.confidence)) || 0.8,
        items: statEntities.map(e => ({
          id: e.id,
          title: e.name,
          description: e.description || '',
          value: extractValueFromEntity(e),
        })),
      });
    }

    // Pricing Table
    const pricingTypes = ['pricing', 'plan', 'tier', 'package'];
    const pricingEntities = pricingTypes
      .flatMap(t => entitiesByType[t] || [])
      .slice(0, 4);

    if (pricingEntities.length >= 1) {
      sections.push({
        type: 'pricing-table',
        headline: 'Simple, Transparent Pricing',
        subheadline: 'Choose the plan that fits your needs',
        topic: 'pricing',
        priority: 70,
        confidence: Math.min(...pricingEntities.map(e => e.confidence)) || 0.8,
        items: pricingEntities.map((e, i) => ({
          id: e.id,
          title: e.name,
          description: e.description || '',
          value: extractValueFromEntity(e),
          label: i === 1 ? 'Most Popular' : undefined,
        })),
      });
    }

    // Testimonials
    const testimonialTypes = ['testimonial', 'review', 'quote', 'case_study'];
    const testimonialEntities = testimonialTypes
      .flatMap(t => entitiesByType[t] || [])
      .slice(0, 6);

    if (testimonialEntities.length >= 2) {
      sections.push({
        type: 'testimonials',
        headline: 'What Our Customers Say',
        subheadline: 'Trusted by businesses worldwide',
        topic: 'testimonials',
        priority: 65,
        confidence: Math.min(...testimonialEntities.map(e => e.confidence)) || 0.8,
        items: testimonialEntities.map(e => ({
          id: e.id,
          title: e.name,
          description: e.description || '',
        })),
      });
    }

    // Use Cases
    const useCaseTypes = ['use_case', 'scenario', 'application', 'industry'];
    const useCaseEntities = useCaseTypes
      .flatMap(t => entitiesByType[t] || [])
      .slice(0, 6);

    if (useCaseEntities.length >= 2) {
      sections.push({
        type: 'use-cases',
        headline: 'Use Cases',
        subheadline: 'See how others are using our platform',
        topic: 'use-cases',
        priority: 60,
        confidence: Math.min(...useCaseEntities.map(e => e.confidence)) || 0.8,
        items: useCaseEntities.map(e => ({
          id: e.id,
          title: e.name,
          description: e.description || '',
          icon: getIconForEntity(e.entity_type, e.name),
        })),
      });
    }

    // Integrations
    const integrationTypes = ['integration', 'partner', 'connection', 'api'];
    const integrationEntities = integrationTypes
      .flatMap(t => entitiesByType[t] || [])
      .slice(0, 12);

    if (integrationEntities.length >= 4) {
      sections.push({
        type: 'integrations',
        headline: 'Integrations',
        subheadline: 'Connect with your favorite tools',
        topic: 'integrations',
        priority: 55,
        confidence: Math.min(...integrationEntities.map(e => e.confidence)) || 0.8,
        items: integrationEntities.map(e => ({
          id: e.id,
          title: e.name,
          description: e.description || '',
          icon: 'plug',
        })),
      });
    }

    // Team
    const teamTypes = ['team', 'person', 'founder', 'leader'];
    const teamEntities = teamTypes
      .flatMap(t => entitiesByType[t] || [])
      .slice(0, 8);

    if (teamEntities.length >= 2) {
      sections.push({
        type: 'team',
        headline: 'Meet Our Team',
        subheadline: 'The people behind the product',
        topic: 'team',
        priority: 50,
        confidence: Math.min(...teamEntities.map(e => e.confidence)) || 0.8,
        items: teamEntities.map(e => ({
          id: e.id,
          title: e.name,
          description: e.description || '',
          icon: 'user',
        })),
      });
    }

    // FAQ
    const faqTypes = ['faq', 'question', 'answer'];
    const faqEntities = faqTypes
      .flatMap(t => entitiesByType[t] || [])
      .slice(0, 10);

    if (faqEntities.length >= 3) {
      sections.push({
        type: 'faq-accordion',
        headline: 'Frequently Asked Questions',
        subheadline: 'Find answers to common questions',
        topic: 'faq',
        priority: 45,
        confidence: Math.min(...faqEntities.map(e => e.confidence)) || 0.8,
        items: faqEntities.map(e => ({
          id: e.id,
          title: e.name,
          description: e.description || '',
        })),
      });
    }

    // Comparison Table
    const comparisonTypes = ['comparison', 'alternative', 'competitor'];
    const comparisonEntities = comparisonTypes
      .flatMap(t => entitiesByType[t] || [])
      .slice(0, 5);

    if (comparisonEntities.length >= 2) {
      sections.push({
        type: 'comparison-table',
        headline: 'How We Compare',
        subheadline: 'See why customers choose us',
        topic: 'comparison',
        priority: 40,
        confidence: Math.min(...comparisonEntities.map(e => e.confidence)) || 0.8,
        items: comparisonEntities.map(e => ({
          id: e.id,
          title: e.name,
          description: e.description || '',
        })),
      });
    }

    // Sort by priority
    sections.sort((a, b) => b.priority - a.priority);

    return sections;
  }

  /**
   * Generate improvements for empty workspace
   */
  private async generateImprovementsForEmptyWorkspace(
    workspaceId: string
  ): Promise<WorkspaceImprovement[]> {
    const now = new Date().toISOString();

    return [
      {
        id: `imp-${Date.now()}-empty-1`,
        type: 'knowledge_gap',
        priority: 'high',
        title: 'Upload Your First Document',
        description: 'Get started by uploading product documentation, marketing materials, or any content about your business.',
        actionLabel: 'Upload Document',
        actionType: 'upload_document',
        createdAt: now,
      },
      {
        id: `imp-${Date.now()}-empty-2`,
        type: 'brand_incomplete',
        priority: 'high',
        title: 'Set Up Your Brand',
        description: 'Configure your brand colors, logo, and company information to personalize your website.',
        actionLabel: 'Configure Brand',
        actionType: 'configure_brand',
        createdAt: now,
      },
    ];
  }

  /**
   * Store improvements in database
   */
  private async storeImprovements(
    workspaceId: string,
    improvements: WorkspaceImprovement[]
  ): Promise<void> {
    try {
      const supabase = await createClient();

      // Store in workspace settings or a dedicated table
      const { data: workspace, error: fetchError } = await supabase
        .from('workspaces')
        .select('settings')
        .eq('id', workspaceId)
        .single();

      if (fetchError) {
        console.error('[AutoLayoutGenerator] Failed to fetch workspace:', fetchError);
        return;
      }

      const settings = (workspace?.settings as Record<string, unknown>) || {};

      await supabase
        .from('workspaces')
        .update({
          settings: JSON.parse(JSON.stringify({
            ...settings,
            improvements,
            lastImprovementCheck: new Date().toISOString(),
          })),
        })
        .eq('id', workspaceId);
    } catch (error) {
      console.error('[AutoLayoutGenerator] Failed to store improvements:', error);
    }
  }

  /**
   * Public method to analyze workspace and get improvement suggestions
   * This is the public API that fetches all needed data internally
   */
  async analyzeAndGenerateImprovements(workspaceId: string): Promise<WorkspaceImprovement[]> {
    try {
      const supabase = await createClient();

      // Fetch knowledge entities
      const { data: knowledgeItems } = await supabase
        .from('knowledge_base_items')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (!knowledgeItems || knowledgeItems.length === 0) {
        return this.generateImprovementsForEmptyWorkspace(workspaceId);
      }

      // Group entities by type
      const entitiesByType: Record<string, KnowledgeEntity[]> = {};
      for (const item of knowledgeItems) {
        // Extract name from metadata or content
        const metadata = (item.metadata as Record<string, unknown>) || {};
        const name = (metadata.name as string) || (metadata.title as string) || item.content?.substring(0, 50) || '';
        const entity: KnowledgeEntity = {
          id: item.id,
          entity_type: item.entity_type || 'general',
          name,
          description: item.content || '',
          confidence: (metadata.confidence as number) || 0.5,
          knowledge_item_id: item.id,
        };
        if (!entitiesByType[entity.entity_type]) {
          entitiesByType[entity.entity_type] = [];
        }
        entitiesByType[entity.entity_type].push(entity);
      }

      // Fetch brand config
      const { data: website } = await supabase
        .from('websites')
        .select('brand_config')
        .eq('workspace_id', workspaceId)
        .limit(1)
        .single();

      const brandConfig = (website?.brand_config as Record<string, unknown>) || null;

      // Calculate coverage score
      const totalTypes = SUPPORTED_ENTITY_TYPES.length;
      const presentTypes = Object.keys(entitiesByType).length;
      const coverageScore = Math.round((presentTypes / totalTypes) * 100);

      // Generate sections for coverage calculation
      const sections = await this.generateAllSections(entitiesByType);

      // Generate improvements using the private method
      const improvements = await this.generateImprovementsInternal(
        workspaceId,
        entitiesByType,
        sections,
        coverageScore,
        brandConfig
      );

      // Store improvements for later retrieval
      await this.storeImprovements(workspaceId, improvements);

      return improvements;
    } catch (error) {
      console.error('[AutoLayoutGenerator] Error analyzing workspace:', error);
      return this.generateImprovementsForEmptyWorkspace(workspaceId);
    }
  }

  /**
   * Internal method for generating improvements (renamed from private analyzeAndGenerateImprovements)
   */
  private async generateImprovementsInternal(
    workspaceId: string,
    entitiesByType: Record<string, KnowledgeEntity[]>,
    sections: ContentSection[],
    coverageScore: number,
    brandConfig: Record<string, unknown> | null
  ): Promise<WorkspaceImprovement[]> {
    const improvements: WorkspaceImprovement[] = [];
    const now = new Date().toISOString();

    // Check for missing essential content
    if (!entitiesByType['feature']?.length) {
      improvements.push({
        id: `imp-${Date.now()}-1`,
        type: 'knowledge_gap',
        priority: 'high',
        title: 'Add Product Features',
        description: 'Upload documentation about your product features to enable a comprehensive features section on your website.',
        actionLabel: 'Upload Documents',
        actionType: 'upload_document',
        metadata: { targetSection: 'features' },
        createdAt: now,
      });
    }

    if (!entitiesByType['pricing']?.length) {
      improvements.push({
        id: `imp-${Date.now()}-2`,
        type: 'knowledge_gap',
        priority: 'medium',
        title: 'Add Pricing Information',
        description: 'Include pricing details in your documents to automatically generate a pricing section.',
        actionLabel: 'Add Pricing Content',
        actionType: 'add_content',
        metadata: { targetSection: 'pricing' },
        createdAt: now,
      });
    }

    if (!entitiesByType['testimonial']?.length && !entitiesByType['review']?.length) {
      improvements.push({
        id: `imp-${Date.now()}-3`,
        type: 'knowledge_gap',
        priority: 'medium',
        title: 'Add Customer Testimonials',
        description: 'Include customer testimonials or case studies to build trust with potential customers.',
        actionLabel: 'Add Testimonials',
        actionType: 'add_content',
        metadata: { targetSection: 'testimonials' },
        createdAt: now,
      });
    }

    if (!entitiesByType['faq']?.length && !entitiesByType['question']?.length) {
      improvements.push({
        id: `imp-${Date.now()}-4`,
        type: 'knowledge_gap',
        priority: 'low',
        title: 'Add FAQ Content',
        description: 'Upload FAQ documents to automatically generate a FAQ section for your visitors.',
        actionLabel: 'Upload FAQ',
        actionType: 'upload_document',
        metadata: { targetSection: 'faq' },
        createdAt: now,
      });
    }

    // Check brand configuration
    if (!brandConfig || !brandConfig.primaryColor) {
      improvements.push({
        id: `imp-${Date.now()}-5`,
        type: 'brand_incomplete',
        priority: 'high',
        title: 'Configure Brand Colors',
        description: 'Set up your brand colors to ensure your website matches your brand identity.',
        actionLabel: 'Configure Brand',
        actionType: 'configure_brand',
        createdAt: now,
      });
    }

    if (!brandConfig?.logo) {
      improvements.push({
        id: `imp-${Date.now()}-6`,
        type: 'brand_incomplete',
        priority: 'medium',
        title: 'Upload Company Logo',
        description: 'Add your company logo for professional branding across your website.',
        actionLabel: 'Upload Logo',
        actionType: 'configure_brand',
        createdAt: now,
      });
    }

    // Check content quality
    if (coverageScore < 50) {
      improvements.push({
        id: `imp-${Date.now()}-7`,
        type: 'content_quality',
        priority: 'high',
        title: 'Improve Content Coverage',
        description: `Only ${coverageScore}% of your knowledge base is being used. Upload more detailed documents to improve content generation.`,
        actionLabel: 'Upload More Documents',
        actionType: 'upload_document',
        metadata: { coverageScore },
        createdAt: now,
      });
    }

    // Check for low confidence entities
    const lowConfidenceCount = Object.values(entitiesByType)
      .flat()
      .filter(e => e.confidence < 0.6).length;

    if (lowConfidenceCount > 5) {
      improvements.push({
        id: `imp-${Date.now()}-8`,
        type: 'content_quality',
        priority: 'medium',
        title: 'Review Extracted Content',
        description: `${lowConfidenceCount} items have low confidence scores. Review and clarify the content for better results.`,
        actionLabel: 'Review Content',
        actionType: 'review_content',
        metadata: { lowConfidenceCount },
        createdAt: now,
      });
    }

    return improvements;
  }

  /**
   * Check if layout needs regeneration
   */
  async checkForUpdates(workspaceId: string): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { data: knowledgeItems } = await supabase
        .from('knowledge_base_items')
        .select('id, content')
        .eq('workspace_id', workspaceId);

      if (!knowledgeItems || knowledgeItems.length === 0) {
        return false;
      }

      const { data: website } = await supabase
        .from('websites')
        .select('settings')
        .eq('workspace_id', workspaceId)
        .limit(1)
        .single();

      const settings = website?.settings as { generatedLayout?: { contentHash?: string } } | null;
      if (!settings?.generatedLayout) {
        return true;
      }

      const currentHash = generateContentHash(knowledgeItems as KnowledgeItem[]);
      const storedHash = settings.generatedLayout?.contentHash;

      return currentHash !== storedHash;
    } catch (error) {
      console.error('[AutoLayoutGenerator] Error checking for updates:', error);
      return false;
    }
  }

  /**
   * Get used topics from generated sections
   */
  async getUsedTopics(websiteId: string): Promise<string[]> {
    try {
      const supabase = await createClient();

      const { data: website } = await supabase
        .from('websites')
        .select('settings')
        .eq('id', websiteId)
        .single();

      const settings = website?.settings as { generatedLayout?: { sections?: ContentSection[] } } | null;
      if (!settings?.generatedLayout?.sections) {
        return [];
      }

      return settings.generatedLayout.sections.map(s => s.topic);
    } catch (error) {
      console.error('[AutoLayoutGenerator] Error getting used topics:', error);
      return [];
    }
  }

  /**
   * Get workspace improvements
   */
  async getWorkspaceImprovements(workspaceId: string): Promise<WorkspaceImprovement[]> {
    try {
      const supabase = await createClient();

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('settings')
        .eq('id', workspaceId)
        .single();

      const settings = workspace?.settings as { improvements?: WorkspaceImprovement[] } | null;
      return settings?.improvements || [];
    } catch (error) {
      console.error('[AutoLayoutGenerator] Error getting improvements:', error);
      return [];
    }
  }
}

// ============================================================================
// AI NOTIFICATIONS SERVICE
// ============================================================================

export class AINotificationService {
  /**
   * Create a clarification notification
   */
  async createClarificationNotification(
    workspaceId: string,
    question: string,
    options?: string[],
    metadata?: Record<string, unknown>
  ): Promise<AINotification> {
    const supabase = await createClient();

    const notification: AINotification = {
      id: `notif-${Date.now()}`,
      workspaceId,
      type: 'clarification',
      title: 'Clarification Needed',
      message: 'We need some additional information to better generate your website.',
      question,
      options,
      answered: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    // Store notification
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .single();

    const settings = (workspace?.settings as Record<string, unknown>) || {};
    const notifications = (settings.aiNotifications as AINotification[]) || [];

    await supabase
      .from('workspaces')
      .update({
        settings: JSON.parse(JSON.stringify({
          ...settings,
          aiNotifications: [...notifications, notification],
        })),
      })
      .eq('id', workspaceId);

    return notification;
  }

  /**
   * Create a general notification with any type
   */
  async createNotification(
    workspaceId: string,
    type: 'clarification' | 'suggestion' | 'warning' | 'info',
    title: string,
    message: string,
    question?: string,
    options?: string[]
  ): Promise<AINotification> {
    const supabase = await createClient();

    const notification: AINotification = {
      id: `notif-${Date.now()}`,
      workspaceId,
      type,
      title,
      message,
      question,
      options,
      answered: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    // Store notification
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .single();

    const settings = (workspace?.settings as Record<string, unknown>) || {};
    const notifications = (settings.aiNotifications as AINotification[]) || [];

    await supabase
      .from('workspaces')
      .update({
        settings: JSON.parse(JSON.stringify({
          ...settings,
          aiNotifications: [...notifications, notification],
        })),
      })
      .eq('id', workspaceId);

    return notification;
  }

  /**
   * Get all notifications for a workspace
   */
  async getNotifications(workspaceId: string): Promise<AINotification[]> {
    const supabase = await createClient();

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .single();

    const settings = workspace?.settings as { aiNotifications?: AINotification[] } | null;
    return settings?.aiNotifications || [];
  }

  /**
   * Answer a notification
   */
  async answerNotification(
    workspaceId: string,
    notificationId: string,
    answer: string
  ): Promise<void> {
    const supabase = await createClient();

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .single();

    const settings = (workspace?.settings as Record<string, unknown>) || {};
    const notifications = (settings.aiNotifications as AINotification[]) || [];

    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, answered: true, answer } : n
    );

    await supabase
      .from('workspaces')
      .update({
        settings: JSON.parse(JSON.stringify({
          ...settings,
          aiNotifications: updatedNotifications,
        })),
      })
      .eq('id', workspaceId);
  }

  /**
   * Generate clarifications based on knowledge base analysis
   */
  async generateClarifications(workspaceId: string): Promise<AINotification[]> {
    const supabase = await createClient();
    const newNotifications: AINotification[] = [];

    // Get knowledge items
    const { data: knowledgeItems } = await supabase
      .from('knowledge_base_items')
      .select('id, content, entity_type, metadata')
      .eq('workspace_id', workspaceId);

    // If no knowledge items, generate default starter questions
    if (!knowledgeItems?.length) {
      console.log('[AINotificationService] No knowledge items found, generating default questions');
      const defaultQuestions = [
        {
          question: 'What is the primary purpose of your website?',
          options: ['Generate leads', 'Sell products/services', 'Provide information', 'Build brand awareness'],
        },
        {
          question: 'Who is your target audience?',
          options: ['B2B professionals', 'B2C consumers', 'Developers/Technical', 'General public'],
        },
        {
          question: 'What tone should your website have?',
          options: ['Professional & formal', 'Friendly & casual', 'Bold & innovative', 'Trustworthy & reliable'],
        },
      ];

      for (const q of defaultQuestions) {
        const notification = await this.createClarificationNotification(
          workspaceId,
          q.question,
          q.options
        );
        newNotifications.push(notification);
      }

      return newNotifications;
    }

    // Analyze and generate clarification questions using AI
    try {
      console.log('[AINotificationService] Generating AI-powered clarifications for', knowledgeItems.length, 'items');
      const { data } = await completeJSON<{ clarifications: Array<{ question: string; options?: string[] }> }>({
        messages: [
          {
            role: 'system',
            content: `Analyze the following knowledge base content and identify 2-4 clarification questions that would help generate a better website.

Questions should be about:
- Target audience (if unclear)
- Primary call-to-action (what should visitors do)
- Key differentiators (what makes this product unique)
- Tone and style preferences
- Design preferences

Always generate at least 2 questions even if the content seems complete.

Return JSON: { "clarifications": [{ "question": "...", "options": ["option1", "option2", "option3"] }] }`,
          },
          {
            role: 'user',
            content: `Knowledge base content (${knowledgeItems.length} items):\n${knowledgeItems.slice(0, 5).map(i => i.content.slice(0, 500)).join('\n\n')}`,
          },
        ],
        config: { maxTokens: 800 },
      });

      console.log('[AINotificationService] AI response:', data);

      if (data.clarifications && data.clarifications.length > 0) {
        for (const clarification of data.clarifications) {
          const notification = await this.createClarificationNotification(
            workspaceId,
            clarification.question,
            clarification.options
          );
          newNotifications.push(notification);
        }
      } else {
        // Fallback if AI returns empty
        console.log('[AINotificationService] AI returned no clarifications, using fallback');
        const fallbackNotification = await this.createClarificationNotification(
          workspaceId,
          'What is the primary action you want visitors to take on your website?',
          ['Sign up for a free trial', 'Contact sales', 'Learn more about products', 'Make a purchase']
        );
        newNotifications.push(fallbackNotification);
      }
    } catch (error) {
      console.error('[AINotificationService] Failed to generate clarifications:', error);
      // Generate fallback questions on error
      const fallbackQuestions = [
        {
          question: 'What is your primary call-to-action?',
          options: ['Sign up', 'Contact us', 'Learn more', 'Buy now'],
        },
        {
          question: 'What makes your product/service unique?',
          options: ['Price', 'Quality', 'Features', 'Support'],
        },
      ];

      for (const q of fallbackQuestions) {
        const notification = await this.createClarificationNotification(
          workspaceId,
          q.question,
          q.options
        );
        newNotifications.push(notification);
      }
    }

    return newNotifications;
  }
}

// ============================================================================
// NIGHTLY SYNC SERVICE
// ============================================================================

export class NightlySyncService {
  /**
   * Run nightly sync for all active workspaces
   */
  async runNightlySync(): Promise<{
    workspacesProcessed: number;
    layoutsUpdated: number;
    errors: string[];
  }> {
    const supabase = await createClient();
    const errors: string[] = [];
    let workspacesProcessed = 0;
    let layoutsUpdated = 0;

    try {
      // Get all active workspaces
      const { data: workspaces, error: fetchError } = await supabase
        .from('workspaces')
        .select('id, name, settings')
        .order('updated_at', { ascending: false });

      if (fetchError) {
        errors.push(`Failed to fetch workspaces: ${fetchError.message}`);
        return { workspacesProcessed, layoutsUpdated, errors };
      }

      const generator = new AutoLayoutGenerator();

      for (const workspace of workspaces || []) {
        try {
          workspacesProcessed++;

          // Check if layout needs update
          const needsUpdate = await generator.checkForUpdates(workspace.id);

          if (needsUpdate) {
            const result = await generator.generateLayoutsForWorkspace(workspace.id);
            if (result.success) {
              layoutsUpdated++;
              console.log(`[NightlySync] Updated layout for workspace: ${workspace.name}`);
            } else if (result.error) {
              errors.push(`Workspace ${workspace.name}: ${result.error}`);
            }
          }

          // Sync brand config changes
          await this.syncBrandConfig(workspace.id);

          // Update last sync timestamp
          const settings = (workspace.settings as Record<string, unknown>) || {};
          await supabase
            .from('workspaces')
            .update({
              settings: JSON.parse(JSON.stringify({
                ...settings,
                lastNightlySync: new Date().toISOString(),
              })),
            })
            .eq('id', workspace.id);

        } catch (error) {
          errors.push(`Workspace ${workspace.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log(`[NightlySync] Completed. Processed: ${workspacesProcessed}, Updated: ${layoutsUpdated}`);

    } catch (error) {
      errors.push(`Global error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { workspacesProcessed, layoutsUpdated, errors };
  }

  /**
   * Sync brand configuration to website
   */
  private async syncBrandConfig(workspaceId: string): Promise<void> {
    const supabase = await createClient();

    // Get latest brand config
    const { data: brandConfig } = await supabase
      .from('brand_configs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (!brandConfig) return;

    // Get website
    const { data: website } = await supabase
      .from('websites')
      .select('id, brand_config')
      .eq('workspace_id', workspaceId)
      .single();

    if (!website) return;

    // Check if brand config has changed
    const currentConfig = website.brand_config as Record<string, unknown> | null;
    const configHash = JSON.stringify(brandConfig);
    const currentHash = JSON.stringify(currentConfig || {});

    if (configHash !== currentHash) {
      await supabase
        .from('websites')
        .update({
          brand_config: brandConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', website.id);

      console.log(`[NightlySync] Synced brand config for workspace: ${workspaceId}`);
    }
  }

  /**
   * Schedule nightly sync (to be called by cron job or Vercel cron)
   */
  static async scheduleSync(): Promise<void> {
    const service = new NightlySyncService();
    await service.runNightlySync();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const autoLayoutGenerator = new AutoLayoutGenerator();
export const aiNotificationService = new AINotificationService();
export const nightlySyncService = new NightlySyncService();

export async function triggerLayoutGeneration(workspaceId: string): Promise<void> {
  try {
    const needsUpdate = await autoLayoutGenerator.checkForUpdates(workspaceId);

    if (needsUpdate) {
      console.log(`[AutoLayoutGenerator] Triggering layout generation for workspace ${workspaceId}`);
      await autoLayoutGenerator.generateLayoutsForWorkspace(workspaceId);
    }
  } catch (error) {
    console.error('[AutoLayoutGenerator] Failed to trigger layout generation:', error);
  }
}
