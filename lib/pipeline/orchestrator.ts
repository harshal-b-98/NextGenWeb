/**
 * Page Generation Orchestrator
 * Phase 3.4: Full Page Generation Pipeline
 *
 * Orchestrates the complete page generation workflow by sequentially
 * executing Layout, Storyline, and Content generation stages.
 */

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { PageType, NarrativeRole, EmotionalTone, ComponentVariant } from '@/lib/layout/types';
import { generatePageLayout, LayoutGenerationAgent } from '@/lib/layout';
import { generateStoryline } from '@/lib/storyline';
import { generateContent } from '@/lib/content';
import {
  FullPageGenerationInput,
  FullPageGenerationOutput,
  FullPageGenerationSummary,
  LayoutStageResult,
  StorylineStageResult,
  ContentStageResult,
  PageRenderData,
  RenderSection,
  PageContentStructure,
  PipelineStatus,
  GenerationProgress,
} from './types';

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

export class PageGenerationOrchestrator {
  private progress: GenerationProgress;
  private startTime = 0;

  constructor(pageId: string) {
    this.progress = {
      pageId,
      status: 'pending',
      progress: 0,
      currentStage: 'Initializing',
      completedStages: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Execute the full page generation pipeline
   */
  async generate(input: FullPageGenerationInput): Promise<FullPageGenerationOutput> {
    this.startTime = Date.now();
    this.updateProgress('initializing', 5, 'Initializing pipeline');

    const supabase = await createClient();
    let pageId = input.pageId;

    // Create page record if not provided
    if (!pageId) {
      pageId = await this.createPageRecord(input);
    }

    // Stage 1: Layout Generation
    this.updateProgress('layout', 10, 'Generating page layout');
    const layoutResult = await this.executeLayoutStage(input);

    // Stage 2: Storyline Generation
    this.updateProgress('storyline', 35, 'Creating narrative storyline');
    const storylineResult = await this.executeStorylineStage(input);

    // Stage 3: Content Generation
    this.updateProgress('content', 60, 'Generating section content');
    const contentResult = await this.executeContentStage(
      input,
      pageId,
      layoutResult
    );

    // Stage 4: Assemble Render Data
    this.updateProgress('assembling', 85, 'Assembling page data');
    const renderData = this.assembleRenderData(
      layoutResult,
      storylineResult,
      contentResult,
      input.personas || []
    );

    // Stage 5: Save to Database
    if (input.save !== false) {
      this.updateProgress('saving', 95, 'Saving to database');
      await this.saveToDatabase(
        pageId,
        layoutResult,
        storylineResult,
        contentResult,
        renderData
      );
    }

    this.updateProgress('complete', 100, 'Generation complete');

    const totalTimeMs = Date.now() - this.startTime;
    const totalTokensUsed =
      layoutResult.metrics.tokensUsed +
      storylineResult.metrics.tokensUsed +
      contentResult.metrics.tokensUsed;

    // Calculate overall confidence
    const confidenceScores = [
      layoutResult.metrics.confidenceScore,
      contentResult.metrics.averageConfidence,
    ].filter((s) => s > 0);
    const overallConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0;

    // Count completed stages
    const stagesCompleted = [
      layoutResult.status === 'completed',
      storylineResult.status === 'completed',
      contentResult.status === 'completed',
    ].filter(Boolean).length;

    const stagesFailed = [
      layoutResult.status === 'failed',
      storylineResult.status === 'failed',
      contentResult.status === 'failed',
    ].filter(Boolean).length;

    return {
      pageId,
      slug: this.generateSlug(contentResult.pageMetadata?.title || input.pageType),
      layout: layoutResult,
      storyline: storylineResult,
      content: contentResult,
      renderData,
      stats: {
        totalTimeMs,
        totalTokensUsed,
        overallConfidence,
        stagesCompleted,
        stagesFailed,
      },
    };
  }

  /**
   * Get current progress
   */
  getProgress(): GenerationProgress {
    return { ...this.progress };
  }

  // ==========================================================================
  // STAGE EXECUTION
  // ==========================================================================

  private async executeLayoutStage(
    input: FullPageGenerationInput
  ): Promise<LayoutStageResult> {
    const startTime = Date.now();

    try {
      const layoutInput = {
        workspaceId: input.workspaceId,
        websiteId: input.websiteId,
        knowledgeBaseId: input.knowledgeBaseId,
        pageType: input.pageType,
        personas: input.personas || [],
        brandConfigId: input.brandConfigId,
        constraints: input.constraints
          ? {
              maxSections: input.constraints.maxSections,
              minSections: input.constraints.minSections,
              requiredComponents: input.constraints.requiredComponents as ComponentVariant[] | undefined,
              excludedComponents: input.constraints.excludedComponents as ComponentVariant[] | undefined,
              forcedOrder: input.constraints.forcedOrder as ComponentVariant[] | undefined,
            }
          : undefined,
      };

      const result = await generatePageLayout(layoutInput);

      return {
        status: 'completed',
        layout: result.layout,
        metrics: {
          sectionsCount: result.layout.sections.length,
          confidenceScore: result.generationMetadata.confidenceScore || 0.8,
          timeMs: Date.now() - startTime,
          tokensUsed: result.generationMetadata.tokensUsed || 0,
        },
      };
    } catch (error) {
      console.error('Layout generation failed:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Layout generation failed',
        metrics: {
          sectionsCount: 0,
          confidenceScore: 0,
          timeMs: Date.now() - startTime,
          tokensUsed: 0,
        },
      };
    }
  }

  private async executeStorylineStage(
    input: FullPageGenerationInput
  ): Promise<StorylineStageResult> {
    const startTime = Date.now();

    try {
      const storylineInput = {
        workspaceId: input.workspaceId,
        websiteId: input.websiteId,
        knowledgeBaseId: input.knowledgeBaseId,
        pageType: input.pageType,
        personas: input.personas || [],
        brandConfigId: input.brandConfigId,
        contentHints: input.contentHints
          ? {
              focusAreas: input.contentHints.focusAreas,
              avoidTopics: input.contentHints.avoidTopics,
              primaryGoal: 'conversion' as const,
              tonePreference: input.contentHints.tonePreference,
            }
          : undefined,
      };

      const storyline = await generateStoryline(storylineInput);

      return {
        status: 'completed',
        storyline,
        metrics: {
          contentBlocksCount: storyline.contentBlocks.length,
          personaVariationsCount: storyline.personaVariations.length,
          timeMs: Date.now() - startTime,
          tokensUsed: storyline.metadata.tokensUsed,
        },
      };
    } catch (error) {
      console.error('Storyline generation failed:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Storyline generation failed',
        metrics: {
          contentBlocksCount: 0,
          personaVariationsCount: 0,
          timeMs: Date.now() - startTime,
          tokensUsed: 0,
        },
      };
    }
  }

  private async executeContentStage(
    input: FullPageGenerationInput,
    pageId: string,
    layoutResult: LayoutStageResult
  ): Promise<ContentStageResult> {
    const startTime = Date.now();

    try {
      // Build sections input from layout or use defaults
      const sections = layoutResult.layout?.sections.map((section, index) => ({
        sectionId: section.id,
        componentId: section.componentId,
        narrativeRole: section.narrativeRole,
        order: section.order || index,
      })) || this.getDefaultSections(input.pageType);

      const contentInput = {
        workspaceId: input.workspaceId,
        websiteId: input.websiteId,
        pageId,
        pageType: input.pageType,
        knowledgeBaseId: input.knowledgeBaseId,
        sections,
        personas: input.personas || [],
        brandConfigId: input.brandConfigId,
        hints: input.contentHints,
      };

      const result = await generateContent(contentInput);

      return {
        status: 'completed',
        sections: result.sections,
        pageMetadata: result.pageMetadata,
        metrics: {
          sectionsPopulated: result.generationStats.sectionsGenerated,
          averageConfidence: result.generationStats.averageConfidence,
          fallbacksUsed: result.generationStats.fallbacksUsed,
          timeMs: Date.now() - startTime,
          tokensUsed: result.generationStats.totalTokensUsed,
        },
      };
    } catch (error) {
      console.error('Content generation failed:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Content generation failed',
        metrics: {
          sectionsPopulated: 0,
          averageConfidence: 0,
          fallbacksUsed: 0,
          timeMs: Date.now() - startTime,
          tokensUsed: 0,
        },
      };
    }
  }

  // ==========================================================================
  // ASSEMBLY
  // ==========================================================================

  private assembleRenderData(
    layoutResult: LayoutStageResult,
    storylineResult: StorylineStageResult,
    contentResult: ContentStageResult,
    personaIds: string[]
  ): PageRenderData {
    const defaultVariant: RenderSection[] = [];
    const personaVariants: Record<string, RenderSection[]> = {};

    // Initialize persona variants
    for (const personaId of personaIds) {
      personaVariants[personaId] = [];
    }

    // Get layout sections or use content sections
    const layoutSections = layoutResult.layout?.sections || [];
    const contentSections = contentResult.sections || [];

    // Map content to layout sections
    for (const contentSection of contentSections) {
      const layoutSection = layoutSections.find(
        (ls) => ls.id === contentSection.sectionId
      );

      // Build default render section
      const renderSection: RenderSection = {
        sectionId: contentSection.sectionId,
        componentId: contentSection.componentId,
        narrativeRole: contentSection.narrativeRole,
        order: contentSection.order,
        emotionalTone: this.getEmotionalTone(
          contentSection.narrativeRole,
          storylineResult.storyline?.emotionalJourney
        ),
        content: contentSection.content,
        animations: layoutSection?.animations,
        confidenceScore: contentSection.metadata.confidenceScore,
      };

      defaultVariant.push(renderSection);

      // Build persona variants
      for (const personaId of personaIds) {
        const personaContent = contentSection.personaVariations[personaId];
        if (personaContent) {
          personaVariants[personaId].push({
            ...renderSection,
            content: personaContent.content,
            emotionalTone: personaContent.emotionalTone,
          });
        } else {
          // Use default content for this persona
          personaVariants[personaId].push(renderSection);
        }
      }
    }

    // Sort by order
    defaultVariant.sort((a, b) => a.order - b.order);
    for (const personaId of personaIds) {
      personaVariants[personaId].sort((a, b) => a.order - b.order);
    }

    return {
      defaultVariant,
      personaVariants,
      metadata: {
        title: contentResult.pageMetadata?.title || 'Untitled Page',
        description: contentResult.pageMetadata?.description || '',
        keywords: contentResult.pageMetadata?.keywords || [],
      },
    };
  }

  private getEmotionalTone(
    narrativeRole: NarrativeRole,
    emotionalJourney?: { points: { primaryEmotion: EmotionalTone }[] }
  ): EmotionalTone {
    // Default mapping
    const defaultTones: Record<NarrativeRole, EmotionalTone> = {
      hook: 'curiosity',
      problem: 'empathy',
      solution: 'hope',
      proof: 'confidence',
      action: 'excitement',
    };

    return defaultTones[narrativeRole] || 'confidence';
  }

  // ==========================================================================
  // DATABASE OPERATIONS
  // ==========================================================================

  private async createPageRecord(input: FullPageGenerationInput): Promise<string> {
    const supabase = await createClient();
    const pageId = uuidv4();

    const { error } = await supabase.from('pages').insert({
      id: pageId,
      website_id: input.websiteId,
      title: '',
      slug: '',
      path: '/',
      content: {},
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error creating page record:', error);
      throw new Error('Failed to create page record');
    }

    return pageId;
  }

  private async saveToDatabase(
    pageId: string,
    layoutResult: LayoutStageResult,
    storylineResult: StorylineStageResult,
    contentResult: ContentStageResult,
    renderData: PageRenderData
  ): Promise<void> {
    const supabase = await createClient();

    // Build the content structure
    const pageContent: PageContentStructure = {
      sections: layoutResult.layout?.sections || [],
      metadata: layoutResult.layout?.metadata || {
        title: renderData.metadata.title,
        description: renderData.metadata.description,
        keywords: renderData.metadata.keywords,
      },
      personaVariants: layoutResult.layout?.personaVariants,
    };

    // Add storyline data if available
    if (storylineResult.status === 'completed' && storylineResult.storyline) {
      pageContent.storyline = {
        narrative: storylineResult.storyline.narrative,
        defaultFlow: storylineResult.storyline.defaultFlow,
        contentBlocks: storylineResult.storyline.contentBlocks,
        personaVariations: storylineResult.storyline.personaVariations,
        emotionalJourney: storylineResult.storyline.emotionalJourney,
        generationMetadata: {
          generatedAt: storylineResult.storyline.metadata.generatedAt,
          modelUsed: storylineResult.storyline.metadata.modelUsed,
          tokensUsed: storylineResult.storyline.metadata.tokensUsed,
          generationTimeMs: storylineResult.storyline.metadata.generationTimeMs,
        },
      };
    }

    // Add generated content if available
    if (contentResult.status === 'completed' && contentResult.sections) {
      pageContent.generatedContent = {
        sections: contentResult.sections,
        pageMetadata: contentResult.pageMetadata || {
          title: renderData.metadata.title,
          description: renderData.metadata.description,
          keywords: renderData.metadata.keywords,
        },
        generationStats: {
          totalSections: contentResult.sections.length,
          sectionsGenerated: contentResult.metrics.sectionsPopulated,
          totalTokensUsed: contentResult.metrics.tokensUsed,
          totalTimeMs: contentResult.metrics.timeMs,
          averageConfidence: contentResult.metrics.averageConfidence,
          fallbacksUsed: contentResult.metrics.fallbacksUsed,
        },
      };
    }

    // Add pipeline metadata
    pageContent.pipelineMetadata = {
      generatedAt: new Date().toISOString(),
      pipelineVersion: '1.0.0',
      totalTimeMs: Date.now() - this.startTime,
      totalTokensUsed:
        layoutResult.metrics.tokensUsed +
        storylineResult.metrics.tokensUsed +
        contentResult.metrics.tokensUsed,
      overallConfidence:
        (layoutResult.metrics.confidenceScore +
          contentResult.metrics.averageConfidence) /
        2,
      stagesCompleted: [
        layoutResult.status === 'completed' ? 'layout' : null,
        storylineResult.status === 'completed' ? 'storyline' : null,
        contentResult.status === 'completed' ? 'content' : null,
      ].filter(Boolean) as string[],
    };

    // Update the page record
    const { error } = await supabase
      .from('pages')
      .update({
        title: renderData.metadata.title,
        slug: this.generateSlug(renderData.metadata.title),
        content: JSON.parse(JSON.stringify(pageContent)),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId);

    if (error) {
      console.error('Error saving page to database:', error);
      throw new Error('Failed to save page to database');
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private updateProgress(
    status: PipelineStatus,
    progress: number,
    currentStage: string
  ): void {
    if (
      this.progress.status !== 'complete' &&
      this.progress.status !== 'failed'
    ) {
      if (status !== this.progress.status && this.progress.status !== 'pending') {
        this.progress.completedStages.push(this.progress.currentStage);
      }
    }

    this.progress.status = status;
    this.progress.progress = progress;
    this.progress.currentStage = currentStage;
    this.progress.updatedAt = new Date().toISOString();

    if (this.startTime > 0) {
      const elapsed = Date.now() - this.startTime;
      const remaining = ((elapsed / progress) * (100 - progress)) / 1000;
      this.progress.estimatedTimeRemaining = Math.round(remaining);
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);
  }

  private getDefaultSections(pageType: PageType): {
    sectionId: string;
    componentId: string;
    narrativeRole: NarrativeRole;
    order: number;
  }[] {
    // Default sections when layout generation fails
    const defaults: Record<
      string,
      { componentId: string; narrativeRole: NarrativeRole }[]
    > = {
      home: [
        { componentId: 'hero-centered', narrativeRole: 'hook' },
        { componentId: 'features-grid', narrativeRole: 'solution' },
        { componentId: 'testimonials-grid', narrativeRole: 'proof' },
        { componentId: 'cta-centered', narrativeRole: 'action' },
      ],
      landing: [
        { componentId: 'hero-split', narrativeRole: 'hook' },
        { componentId: 'features-alternating', narrativeRole: 'problem' },
        { componentId: 'features-grid', narrativeRole: 'solution' },
        { componentId: 'testimonials-carousel', narrativeRole: 'proof' },
        { componentId: 'cta-centered', narrativeRole: 'action' },
      ],
      product: [
        { componentId: 'hero-product', narrativeRole: 'hook' },
        { componentId: 'features-tabs', narrativeRole: 'solution' },
        { componentId: 'stats-grid', narrativeRole: 'proof' },
        { componentId: 'cta-split', narrativeRole: 'action' },
      ],
      pricing: [
        { componentId: 'hero-centered', narrativeRole: 'hook' },
        { componentId: 'pricing-tiers', narrativeRole: 'solution' },
        { componentId: 'faq-accordion', narrativeRole: 'proof' },
        { componentId: 'cta-centered', narrativeRole: 'action' },
      ],
      about: [
        { componentId: 'hero-centered', narrativeRole: 'hook' },
        { componentId: 'content-text', narrativeRole: 'solution' },
        { componentId: 'stats-grid', narrativeRole: 'proof' },
        { componentId: 'cta-centered', narrativeRole: 'action' },
      ],
      contact: [
        { componentId: 'hero-centered', narrativeRole: 'hook' },
        { componentId: 'cta-split', narrativeRole: 'action' },
      ],
    };

    const sections = defaults[pageType] || defaults.home;

    return sections.map((section, index) => ({
      sectionId: uuidv4(),
      componentId: section.componentId,
      narrativeRole: section.narrativeRole,
      order: index,
    }));
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Generate a full page
 */
export async function generateFullPage(
  input: FullPageGenerationInput
): Promise<FullPageGenerationOutput> {
  const pageId = input.pageId || uuidv4();
  const orchestrator = new PageGenerationOrchestrator(pageId);
  return orchestrator.generate(input);
}

/**
 * Generate a full page and return summary only
 */
export async function generateFullPageSummary(
  input: FullPageGenerationInput
): Promise<FullPageGenerationSummary> {
  const result = await generateFullPage(input);

  return {
    success:
      result.layout.status !== 'failed' ||
      result.storyline.status !== 'failed' ||
      result.content.status !== 'failed',
    pageId: result.pageId,
    slug: result.slug,
    status: {
      layoutGeneration: {
        status: result.layout.status,
        sectionsCount: result.layout.metrics.sectionsCount,
        confidenceScore: result.layout.metrics.confidenceScore,
        timeMs: result.layout.metrics.timeMs,
      },
      storylineGeneration: {
        status: result.storyline.status,
        contentBlocksCount: result.storyline.metrics.contentBlocksCount,
        personaVariationsCount: result.storyline.metrics.personaVariationsCount,
        timeMs: result.storyline.metrics.timeMs,
      },
      contentGeneration: {
        status: result.content.status,
        sectionsPopulated: result.content.metrics.sectionsPopulated,
        averageConfidence: result.content.metrics.averageConfidence,
        fallbacksUsed: result.content.metrics.fallbacksUsed,
        timeMs: result.content.metrics.timeMs,
      },
    },
    pageMetadata: result.renderData.metadata,
    totalTimeMs: result.stats.totalTimeMs,
    totalTokensUsed: result.stats.totalTokensUsed,
  };
}
