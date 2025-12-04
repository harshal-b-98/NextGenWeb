/**
 * Feedback Engine
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Story #148: Core service for processing user feedback, classifying intent,
 * identifying target sections, and generating proposed changes using AI.
 */

import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { untypedFrom } from '@/lib/supabase/untyped';
import { completeJSON } from '@/lib/ai/client';
import type { PopulatedContent } from '@/lib/content/types';
import type {
  FeedbackInput,
  FeedbackType,
  SectionFeedback,
  ProposedChange,
  FeedbackProcessingRequest,
  FeedbackProcessingResponse,
  ApplyChangesRequest,
  ApplyChangesResponse,
  PageContentSnapshot,
  SectionSnapshot,
} from './types';

// ============================================================================
// PROMPTS
// ============================================================================

const FEEDBACK_CLASSIFICATION_SYSTEM_PROMPT = `You are an AI assistant that classifies user feedback on website sections.
Your task is to:
1. Identify the type of feedback (content, style, layout, remove, add, reorder)
2. Determine the target section if not explicitly specified
3. Identify the specific field being targeted (e.g., 'headline', 'description', 'primaryCTA.text')
4. Provide an interpretation of what the user wants changed

Feedback types:
- content: Changes to text, headlines, descriptions, bullet points, CTAs
- style: Changes to colors, fonts, spacing, backgrounds
- layout: Changes to arrangement, alignment, component structure
- remove: Remove a section entirely
- add: Add a new section
- reorder: Change the order of sections

Respond with valid JSON only.`;

const CHANGE_GENERATION_SYSTEM_PROMPT = `You are an AI assistant that generates content changes for marketing website sections.
Your task is to:
1. Analyze the user's feedback
2. Generate refined content that addresses the feedback
3. Keep the brand voice consistent
4. Only modify what the user asked for
5. Provide a clear description of changes

Rules:
- Maintain professional marketing tone
- Keep copy concise and impactful
- Preserve existing structure unless explicitly asked to change
- Return valid JSON matching the provided schema

Respond with valid JSON only.`;

// ============================================================================
// FEEDBACK ENGINE CLASS
// ============================================================================

export class FeedbackEngine {
  /**
   * Process feedback items and generate proposed changes
   */
  async processFeedback(
    request: FeedbackProcessingRequest
  ): Promise<FeedbackProcessingResponse> {
    const startTime = Date.now();
    let totalTokensUsed = 0;
    const errors: string[] = [];
    const proposedChanges: ProposedChange[] = [];

    try {
      // Get current page state
      const pageSnapshot = await this.getPageSnapshot(request.pageId);
      if (!pageSnapshot) {
        return {
          success: false,
          proposedChanges: [],
          aiSummary: 'Failed to load page content',
          suggestedFollowUps: [],
          processingTimeMs: Date.now() - startTime,
          tokensUsed: 0,
          errors: ['Page not found'],
        };
      }

      // Get knowledge base context for grounding
      const knowledgeContext = await this.getKnowledgeContext(request.workspaceId);

      // Process each feedback item
      for (const feedbackInput of request.feedbackItems) {
        try {
          // Step 1: Classify and interpret the feedback
          const classification = await this.classifyFeedback(
            feedbackInput,
            pageSnapshot
          );
          totalTokensUsed += classification.tokensUsed;

          // Step 2: Generate proposed changes
          const changes = await this.generateChanges(
            feedbackInput,
            classification,
            pageSnapshot,
            knowledgeContext
          );
          totalTokensUsed += changes.tokensUsed;

          // Store feedback in database
          await this.storeFeedback({
            ...feedbackInput,
            feedbackType: classification.feedbackType,
            sectionId: classification.targetSectionId || feedbackInput.sectionId || '',
            targetField: classification.targetField ?? undefined,
          }, {
            aiInterpretation: classification.interpretation,
            aiConfidence: classification.confidence,
            proposedChanges: changes.change,
          }, request.userId);

          if (changes.change) {
            proposedChanges.push(changes.change);
          }
        } catch (error) {
          errors.push(
            `Failed to process feedback: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Generate summary and follow-ups
      const summary = this.generateSummary(proposedChanges);
      const followUps = this.suggestFollowUps(proposedChanges, pageSnapshot);

      return {
        success: errors.length === 0,
        proposedChanges,
        aiSummary: summary,
        suggestedFollowUps: followUps,
        processingTimeMs: Date.now() - startTime,
        tokensUsed: totalTokensUsed,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        proposedChanges: [],
        aiSummary: 'Failed to process feedback',
        suggestedFollowUps: [],
        processingTimeMs: Date.now() - startTime,
        tokensUsed: totalTokensUsed,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Apply proposed changes to the page
   */
  async applyChanges(request: ApplyChangesRequest): Promise<ApplyChangesResponse> {
    const supabase = await createClient();
    const appliedChanges: string[] = [];
    const failedChanges: { id: string; reason: string }[] = [];

    try {
      // Get current page state
      const pageSnapshot = await this.getPageSnapshot(request.pageId);
      if (!pageSnapshot) {
        return {
          success: false,
          appliedChanges: [],
          failedChanges: [{ id: 'all', reason: 'Page not found' }],
          updatedPage: {} as PageContentSnapshot,
        };
      }

      // Get proposed changes from database using untyped query
      const feedbackTable = await untypedFrom('section_feedback');
      const { data: feedbackItems } = await feedbackTable
        .select('*')
        .in('id', request.proposedChangeIds)
        .eq('page_id', request.pageId);

      if (!feedbackItems || feedbackItems.length === 0) {
        return {
          success: false,
          appliedChanges: [],
          failedChanges: request.proposedChangeIds.map(id => ({
            id,
            reason: 'Proposed change not found',
          })),
          updatedPage: pageSnapshot,
        };
      }

      // Apply each change
      const updatedSections = [...pageSnapshot.sections];

      for (const feedback of feedbackItems) {
        try {
          const proposedChanges = feedback.proposed_changes as ProposedChange | null;
          if (!proposedChanges) {
            failedChanges.push({ id: feedback.id, reason: 'No proposed changes' });
            continue;
          }

          const sectionIndex = updatedSections.findIndex(
            s => s.sectionId === proposedChanges.sectionId
          );

          if (sectionIndex === -1 && proposedChanges.changeType !== 'add') {
            failedChanges.push({ id: feedback.id, reason: 'Section not found' });
            continue;
          }

          // Apply the change based on type
          switch (proposedChanges.changeType) {
            case 'content':
            case 'style':
              if (sectionIndex !== -1) {
                updatedSections[sectionIndex] = {
                  ...updatedSections[sectionIndex],
                  content: {
                    ...updatedSections[sectionIndex].content,
                    ...proposedChanges.after,
                  },
                };
              }
              break;

            case 'remove':
              if (sectionIndex !== -1) {
                updatedSections.splice(sectionIndex, 1);
              }
              break;

            case 'add':
              // Add new section handling would go here
              break;

            case 'reorder':
              // Reorder handling would go here
              break;
          }

          // Mark feedback as applied using untyped query
          const updateFeedbackTable = await untypedFrom('section_feedback');
          await updateFeedbackTable
            .update({
              status: 'applied',
              resolved_at: new Date().toISOString(),
              resolved_by: request.userId,
            })
            .eq('id', feedback.id);

          appliedChanges.push(feedback.id);
        } catch (error) {
          failedChanges.push({
            id: feedback.id,
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Update page content in database
      const updatedPageSnapshot: PageContentSnapshot = {
        ...pageSnapshot,
        sections: updatedSections,
      };

      // Prepare content JSON for database
      const contentJson = {
        sections: updatedSections.map(s => ({
          id: s.sectionId,
          componentId: s.componentId,
          order: s.order,
          narrativeRole: s.narrativeRole,
          content: s.content,
          styling: s.styling,
        })),
      };

      await supabase
        .from('pages')
        .update({
          content: JSON.parse(JSON.stringify(contentJson)), // Cast to JSON
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.pageId);

      // Create revision if requested
      let revision;
      if (request.createRevision) {
        const { createRevision } = await import('./version-manager');
        revision = await createRevision({
          pageId: request.pageId,
          revisionType: 'feedback',
          changeSummary:
            request.revisionSummary ||
            `Applied ${appliedChanges.length} feedback changes`,
          sectionsModified: appliedChanges.map(id => {
            const feedback = (feedbackItems as Array<{ id: string; section_id: string }>).find(f => f.id === id);
            return feedback?.section_id || '';
          }).filter(Boolean),
          feedbackIds: appliedChanges,
          userId: request.userId,
        });
      }

      return {
        success: failedChanges.length === 0,
        revision,
        appliedChanges,
        failedChanges,
        updatedPage: updatedPageSnapshot,
      };
    } catch (error) {
      return {
        success: false,
        appliedChanges,
        failedChanges: [
          ...failedChanges,
          { id: 'system', reason: error instanceof Error ? error.message : 'Unknown error' },
        ],
        updatedPage: {} as PageContentSnapshot,
      };
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Get the current page snapshot
   */
  private async getPageSnapshot(pageId: string): Promise<PageContentSnapshot | null> {
    const supabase = await createClient();

    const { data: page, error } = await supabase
      .from('pages')
      .select('id, title, slug, content')
      .eq('id', pageId)
      .single();

    if (error || !page) {
      return null;
    }

    const content = page.content as Record<string, unknown>;
    const sectionsData = (content?.sections || []) as Array<{
      id: string;
      componentId: string;
      order: number;
      narrativeRole: string;
      content: PopulatedContent;
      styling?: Record<string, unknown>;
    }>;

    const sections: SectionSnapshot[] = sectionsData.map(s => ({
      sectionId: s.id,
      componentId: s.componentId as SectionSnapshot['componentId'],
      order: s.order,
      narrativeRole: s.narrativeRole,
      content: s.content,
      styling: s.styling as SectionSnapshot['styling'],
    }));

    return {
      pageId: page.id,
      title: page.title,
      slug: page.slug,
      sections,
      metadata: {
        title: page.title,
        description: '',
      },
    };
  }

  /**
   * Get knowledge base context for grounding content
   */
  private async getKnowledgeContext(workspaceId: string): Promise<string> {
    const supabase = await createClient();

    // Get relevant knowledge items
    const { data: items } = await supabase
      .from('knowledge_base_items')
      .select('content, entity_type')
      .eq('workspace_id', workspaceId)
      .limit(5);

    if (!items || items.length === 0) {
      return 'No specific knowledge base context available.';
    }

    return items
      .map(item => `[${item.entity_type}]: ${(item.content as string).slice(0, 500)}`)
      .join('\n\n');
  }

  /**
   * Classify feedback intent
   */
  private async classifyFeedback(
    input: FeedbackInput,
    pageSnapshot: PageContentSnapshot
  ): Promise<{
    feedbackType: FeedbackType;
    targetSectionId: string | null;
    targetField: string | null;
    interpretation: string;
    confidence: number;
    tokensUsed: number;
  }> {
    const sectionsList = pageSnapshot.sections
      .map(s => `- ${s.sectionId} (${s.componentId}): ${s.content.headline || 'No headline'}`)
      .join('\n');

    const prompt = `
Classify the following user feedback:

FEEDBACK: "${input.feedbackText}"
${input.sectionId ? `TARGET SECTION: ${input.sectionId}` : ''}
${input.targetField ? `TARGET FIELD: ${input.targetField}` : ''}

AVAILABLE SECTIONS:
${sectionsList}

Respond with JSON:
{
  "feedbackType": "content" | "style" | "layout" | "remove" | "add" | "reorder",
  "targetSectionId": "section_id or null if unclear",
  "targetField": "specific field like 'headline', 'description', 'primaryCTA.text' or null",
  "interpretation": "what the user wants to change",
  "confidence": 0.0-1.0
}
`;

    const result = await completeJSON<{
      feedbackType: FeedbackType;
      targetSectionId: string | null;
      targetField: string | null;
      interpretation: string;
      confidence: number;
    }>({
      messages: [
        { role: 'system', content: FEEDBACK_CLASSIFICATION_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    return {
      ...result.data,
      tokensUsed: result.tokensUsed,
    };
  }

  /**
   * Generate proposed changes based on feedback
   */
  private async generateChanges(
    input: FeedbackInput,
    classification: {
      feedbackType: FeedbackType;
      targetSectionId: string | null;
      targetField: string | null;
      interpretation: string;
    },
    pageSnapshot: PageContentSnapshot,
    knowledgeContext: string
  ): Promise<{
    change: ProposedChange | null;
    tokensUsed: number;
  }> {
    const targetSection = pageSnapshot.sections.find(
      s => s.sectionId === (classification.targetSectionId || input.sectionId)
    );

    if (!targetSection && classification.feedbackType !== 'add') {
      return { change: null, tokensUsed: 0 };
    }

    const prompt = `
Generate content changes based on user feedback.

SECTION TYPE: ${targetSection?.componentId || 'new section'}
CURRENT CONTENT: ${JSON.stringify(targetSection?.content || {}, null, 2)}

USER FEEDBACK: "${input.feedbackText}"
INTERPRETATION: ${classification.interpretation}
CHANGE TYPE: ${classification.feedbackType}
TARGET FIELD: ${classification.targetField || 'multiple fields'}

KNOWLEDGE BASE CONTEXT:
${knowledgeContext}

Rules:
1. Only modify what the user asked for
2. Keep brand voice consistent
3. Ground content in knowledge base when possible
4. Return valid JSON matching the schema

Respond with JSON:
{
  "sectionId": "${targetSection?.sectionId || 'new_section'}",
  "changeType": "${classification.feedbackType}",
  "description": "Brief description of changes",
  "before": { partial content that will change },
  "after": { partial content with changes applied },
  "confidence": 0.0-1.0,
  "reasoning": "Why these changes address the feedback"
}
`;

    const result = await completeJSON<{
      sectionId: string;
      changeType: FeedbackType;
      description: string;
      before: Partial<PopulatedContent>;
      after: Partial<PopulatedContent>;
      confidence: number;
      reasoning: string;
    }>({
      messages: [
        { role: 'system', content: CHANGE_GENERATION_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    return {
      change: {
        id: uuidv4(),
        ...result.data,
      },
      tokensUsed: result.tokensUsed,
    };
  }

  /**
   * Store feedback in database
   */
  private async storeFeedback(
    input: FeedbackInput & { feedbackType: FeedbackType; sectionId: string; targetField?: string },
    aiResults: {
      aiInterpretation: string;
      aiConfidence: number;
      proposedChanges: ProposedChange | null;
    },
    userId?: string
  ): Promise<SectionFeedback> {
    // Use untypedFrom for new table
    const feedbackTable = await untypedFrom('section_feedback');

    const { data, error } = await feedbackTable
      .insert({
        page_id: input.pageId,
        section_id: input.sectionId,
        feedback_type: input.feedbackType,
        feedback_text: input.feedbackText,
        target_field: input.targetField,
        status: 'pending',
        ai_interpretation: aiResults.aiInterpretation,
        ai_confidence: aiResults.aiConfidence,
        proposed_changes: aiResults.proposedChanges,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store feedback: ${error.message}`);
    }

    return {
      id: data.id,
      pageId: data.page_id,
      sectionId: data.section_id,
      feedbackType: data.feedback_type as FeedbackType,
      feedbackText: data.feedback_text,
      targetField: data.target_field,
      status: data.status as SectionFeedback['status'],
      aiInterpretation: data.ai_interpretation,
      aiConfidence: data.ai_confidence,
      proposedChanges: data.proposed_changes as ProposedChange | undefined,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }

  /**
   * Generate a summary of proposed changes
   */
  private generateSummary(changes: ProposedChange[]): string {
    if (changes.length === 0) {
      return 'No changes were generated from the feedback.';
    }

    const changeTypes = changes.reduce((acc, c) => {
      acc[c.changeType] = (acc[c.changeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const parts = Object.entries(changeTypes).map(
      ([type, count]) => `${count} ${type} change${count > 1 ? 's' : ''}`
    );

    return `Generated ${changes.length} proposed changes: ${parts.join(', ')}.`;
  }

  /**
   * Suggest follow-up actions
   */
  private suggestFollowUps(
    changes: ProposedChange[],
    pageSnapshot: PageContentSnapshot
  ): string[] {
    const followUps: string[] = [];

    // Check for common follow-up scenarios
    const hasContentChanges = changes.some(c => c.changeType === 'content');
    const hasStyleChanges = changes.some(c => c.changeType === 'style');

    if (hasContentChanges) {
      followUps.push('Review the updated copy for brand voice consistency');
    }

    if (hasStyleChanges) {
      followUps.push('Check the visual appearance in different viewport sizes');
    }

    if (changes.length > 0) {
      followUps.push('Preview the changes before applying them');
    }

    // Check if important sections are missing content
    const hasHero = pageSnapshot.sections.some(s => s.componentId.includes('hero'));
    const hasCTA = pageSnapshot.sections.some(s => s.componentId.includes('cta'));

    if (!hasHero) {
      followUps.push('Consider adding a hero section to capture attention');
    }

    if (!hasCTA) {
      followUps.push('Consider adding a call-to-action section');
    }

    return followUps.slice(0, 5); // Limit to 5 suggestions
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const feedbackEngine = new FeedbackEngine();

/**
 * Process feedback and generate proposed changes
 */
export async function processFeedback(
  request: FeedbackProcessingRequest
): Promise<FeedbackProcessingResponse> {
  return feedbackEngine.processFeedback(request);
}

/**
 * Apply proposed changes to a page
 */
export async function applyChanges(
  request: ApplyChangesRequest
): Promise<ApplyChangesResponse> {
  return feedbackEngine.applyChanges(request);
}
