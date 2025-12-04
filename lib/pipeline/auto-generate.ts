/**
 * Auto-Generate Pipeline
 *
 * Orchestrates the complete pipeline for automatic website generation:
 * 1. Extract knowledge from completed documents
 * 2. Create or update website with generated pages
 * 3. Generate global components (header, footer) for the website
 *
 * Story #129: Pipeline Integration for Global Component Generation
 */

import { createClient } from '@/lib/supabase/server';
import { extractEntities } from '@/lib/ai/agents/entity-extraction';
import { generatePageLayout, savePageLayout, generateGlobalComponentsWithAI } from '@/lib/layout/generation';
import { reprocessKnowledgeItem } from '@/lib/knowledge/embeddings/pipeline';
import { hasGlobalComponents } from '@/lib/layout/global-components';
import { createWebsiteVersion } from '@/lib/versions/website-version-manager';
import type { PageType } from '@/lib/layout/types';

// Max text length for entity extraction
const MAX_TEXT_LENGTH = 30000;

// Default pages to generate for a new website
const DEFAULT_PAGES: PageType[] = ['home', 'features', 'about', 'contact'];

export interface PipelineResult {
  knowledgeExtracted: boolean;
  entitiesCount: number;
  embeddingsGenerated: number;
  websiteCreated: boolean;
  websiteId?: string;
  pagesGenerated: number;
  globalComponentsGenerated: boolean;
  errors: string[];
}

export interface PipelineOptions {
  workspaceId: string;
  documentId?: string;
  skipKnowledgeExtraction?: boolean;
  skipPageGeneration?: boolean;
  skipGlobalComponents?: boolean;
}

/**
 * Run the auto-generate pipeline
 * Extracts knowledge from documents and generates website pages
 */
export async function runAutoGeneratePipeline(
  options: PipelineOptions
): Promise<PipelineResult> {
  const { workspaceId, documentId, skipKnowledgeExtraction, skipPageGeneration, skipGlobalComponents } = options;

  const result: PipelineResult = {
    knowledgeExtracted: false,
    entitiesCount: 0,
    embeddingsGenerated: 0,
    websiteCreated: false,
    pagesGenerated: 0,
    globalComponentsGenerated: false,
    errors: [],
  };

  try {
    const supabase = await createClient();

    // Get workspace details
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name, slug')
      .eq('id', workspaceId)
      .single();

    // Step 1: Get documents to process
    if (!skipKnowledgeExtraction) {
      let documentsQuery = supabase
        .from('documents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'completed')
        .not('extracted_text', 'is', null);

      if (documentId) {
        documentsQuery = documentsQuery.eq('id', documentId);
      }

      const { data: documents } = await documentsQuery;

      // Step 2: Extract knowledge from each document
      if (documents && documents.length > 0) {
        for (const document of documents) {
          try {
            // Check if already has knowledge item
            const { data: existingItem } = await supabase
              .from('knowledge_base_items')
              .select('id')
              .eq('document_id', document.id)
              .single();

            if (existingItem) {
              continue; // Skip if already processed
            }

            const extractedText = document.extracted_text as string;
            const text = extractedText.slice(0, MAX_TEXT_LENGTH);

            // Create knowledge base item
            const { data: knowledgeItem, error: itemError } = await supabase
              .from('knowledge_base_items')
              .insert({
                workspace_id: workspaceId,
                document_id: document.id,
                entity_type: 'document',
                content: extractedText,
                metadata: {
                  documentName: document.name,
                  fileType: document.file_type,
                  processedAt: new Date().toISOString(),
                },
              })
              .select()
              .single();

            if (itemError) {
              result.errors.push(`Knowledge item creation failed for ${document.name}`);
              continue;
            }

            // Generate embeddings for the knowledge item
            try {
              console.log(`[Auto-Generate] Generating embeddings for ${document.name}...`);
              const embeddingResult = await reprocessKnowledgeItem(
                knowledgeItem.id,
                extractedText,
                {
                  documentId: document.id,
                  metadata: {
                    documentName: document.name,
                    fileType: document.file_type,
                  },
                }
              );
              result.embeddingsGenerated += embeddingResult.embeddingCount;
              console.log(`[Auto-Generate] Generated ${embeddingResult.embeddingCount} embeddings for ${document.name}`);
            } catch (embeddingError) {
              console.error(`[Auto-Generate] Embedding generation failed for ${document.name}:`, embeddingError);
              result.errors.push(
                `Embedding generation failed for ${document.name}: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`
              );
              // Continue with entity extraction even if embeddings fail
            }

            // Extract entities
            try {
              const extractionResult = await extractEntities(
                text,
                [document.id],
                { minConfidence: 0.5, maxEntities: 50 }
              );

              // Store entities
              for (const entity of extractionResult.entities) {
                const { error: entityError } = await supabase
                  .from('knowledge_entities')
                  .insert({
                    workspace_id: workspaceId,
                    knowledge_item_id: knowledgeItem.id,
                    entity_type: entity.type,
                    name: entity.name,
                    description: entity.description || null,
                    confidence: entity.confidence,
                    metadata: (entity.metadata || {}) as Record<string, string | number | boolean | null>,
                  });

                if (!entityError) {
                  result.entitiesCount++;
                }
              }

              result.knowledgeExtracted = true;
            } catch (extractionError) {
              result.errors.push(
                `Entity extraction failed for ${document.name}: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`
              );
            }
          } catch (docError) {
            result.errors.push(`Processing failed for ${document.name}`);
          }
        }
      }
    }

    // Step 3: Check if website exists or create one
    if (!skipPageGeneration) {
      let websiteId: string;

      const { data: existingWebsite } = await supabase
        .from('websites')
        .select('id')
        .eq('workspace_id', workspaceId)
        .limit(1)
        .single();

      if (existingWebsite) {
        websiteId = existingWebsite.id;
        result.websiteId = websiteId;
      } else {
        // Create a new website
        const websiteSlug = workspace?.slug || `site-${Date.now()}`;
        const websiteName = workspace?.name || 'My Website';

        const { data: newWebsite, error: createError } = await supabase
          .from('websites')
          .insert({
            workspace_id: workspaceId,
            name: websiteName,
            slug: websiteSlug,
            status: 'draft',
            settings: {},
            brand_config: {},
          })
          .select()
          .single();

        if (createError || !newWebsite) {
          result.errors.push('Failed to create website');
          return result;
        }

        websiteId = newWebsite.id;
        result.websiteId = websiteId;
        result.websiteCreated = true;
      }

      // Step 4: Generate pages using layout agent
      const { data: existingPages } = await supabase
        .from('pages')
        .select('slug')
        .eq('website_id', websiteId);

      const existingSlugs = new Set(existingPages?.map(p => p.slug) || []);

      // Determine which pages to generate
      const pagesToGenerate = DEFAULT_PAGES.filter(pageType => {
        const slug = pageType === 'home' ? '/' : `/${pageType}`;
        return !existingSlugs.has(slug);
      });

      // Generate each page
      for (const pageType of pagesToGenerate) {
        try {
          const layoutResult = await generatePageLayout({
            websiteId,
            workspaceId,
            pageType,
          });

          // Save the page layout
          await savePageLayout(layoutResult.layout);
          result.pagesGenerated++;
        } catch (pageError) {
          result.errors.push(
            `Failed to generate ${pageType} page: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`
          );
        }
      }

      // Update website timestamp
      if (result.pagesGenerated > 0) {
        await supabase
          .from('websites')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', websiteId);
      }

      // Step 5: Generate global components (header, footer) if not already present
      if (!skipGlobalComponents) {
        try {
          // Check if global components already exist for this website
          const alreadyHasComponents = await hasGlobalComponents(websiteId);

          if (!alreadyHasComponents) {
            console.log(`[Auto-Generate] Generating global components for website ${websiteId}...`);

            // Get all pages for this website
            const { data: allPages } = await supabase
              .from('pages')
              .select('id, title, slug, is_homepage')
              .eq('website_id', websiteId)
              .order('is_homepage', { ascending: false });

            // Get website details for brand info
            const { data: websiteDetails } = await supabase
              .from('websites')
              .select('name, slug, brand_config')
              .eq('id', websiteId)
              .single();

            const brandConfig = (websiteDetails?.brand_config || {}) as Record<string, unknown>;

            // Generate global components using AI
            const globalResult = await generateGlobalComponentsWithAI({
              websiteId,
              workspaceId,
              websiteName: websiteDetails?.name || workspace?.name || 'Website',
              pages: (allPages || []).map((p) => ({
                title: p.title,
                slug: p.slug,
                isHomepage: p.is_homepage,
              })),
              industry: (brandConfig.industry as string) || undefined,
              companyDescription: (brandConfig.description as string) || undefined,
            });

            if (globalResult.success) {
              result.globalComponentsGenerated = true;
              console.log(`[Auto-Generate] Successfully generated global components for website ${websiteId}`);
            } else {
              result.errors.push(`Global component generation failed: ${globalResult.error}`);
            }
          } else {
            console.log(`[Auto-Generate] Global components already exist for website ${websiteId}, skipping`);
          }
        } catch (globalError) {
          result.errors.push(
            `Global component generation failed: ${globalError instanceof Error ? globalError.message : 'Unknown error'}`
          );
        }
      }
    }

    // Step 6: Create initial website version if pages were generated
    if (result.pagesGenerated > 0 && result.websiteId) {
      try {
        const { version, error: versionError } = await createWebsiteVersion({
          websiteId: result.websiteId,
          versionName: 'v1 - Initial Generation',
          description: `Initial website generation with ${result.pagesGenerated} pages`,
          triggerType: 'initial',
        });

        if (!versionError && version) {
          console.log(`[Auto-Generate] Created initial version ${version.id} for website ${result.websiteId}`);
        } else {
          console.error('[Auto-Generate] Failed to create initial version:', versionError);
          result.errors.push('Failed to create initial version');
        }
      } catch (versionCreateError) {
        console.error('[Auto-Generate] Version creation error:', versionCreateError);
        result.errors.push('Failed to create initial version');
      }
    }

    return result;
  } catch (error) {
    result.errors.push(`Pipeline error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Build a human-readable message from pipeline results
 */
export function buildResultMessage(result: PipelineResult): string {
  const parts: string[] = [];

  if (result.knowledgeExtracted) {
    parts.push(`Extracted ${result.entitiesCount} entities`);
  }

  if (result.embeddingsGenerated > 0) {
    parts.push(`Generated ${result.embeddingsGenerated} embeddings`);
  }

  if (result.websiteCreated) {
    parts.push('Created new website');
  }

  if (result.pagesGenerated > 0) {
    parts.push(`Generated ${result.pagesGenerated} pages`);
  }

  if (result.globalComponentsGenerated) {
    parts.push('Generated header and footer');
  }

  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} warnings`);
  }

  return parts.length > 0 ? parts.join(', ') : 'No changes made';
}
