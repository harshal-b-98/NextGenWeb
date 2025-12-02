/**
 * Knowledge Extraction API Route
 * POST /api/knowledge/extract - Extract entities from a document
 *
 * This API processes completed documents and extracts knowledge entities
 * using AI, then stores them in the knowledge base tables.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractEntities, extractRelationships } from '@/lib/ai/agents/entity-extraction';
import { reprocessKnowledgeItem } from '@/lib/knowledge/embeddings/pipeline';
import { triggerLayoutGeneration } from '@/lib/knowledge/auto-layout-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Max text length to process at once (to avoid token limits)
const MAX_TEXT_LENGTH = 30000;

/**
 * POST /api/knowledge/extract
 * Body: { documentId: string }
 * Extract entities from a completed document
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document ID from body
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Fetch document
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if document is completed
    if (document.status !== 'completed') {
      return NextResponse.json(
        { error: 'Document must be completed before extraction' },
        { status: 400 }
      );
    }

    // Check if document has extracted text
    if (!document.extracted_text) {
      return NextResponse.json(
        { error: 'Document has no extracted text' },
        { status: 400 }
      );
    }

    // Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', document.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    if (!['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Truncate text if too long
    const text = document.extracted_text.slice(0, MAX_TEXT_LENGTH);

    // Check if we already have a knowledge base item for this document
    const { data: existingItem } = await supabase
      .from('knowledge_base_items')
      .select('id')
      .eq('document_id', documentId)
      .single();

    if (existingItem) {
      // Delete existing entities and relationships for this item
      await supabase
        .from('knowledge_entities')
        .delete()
        .eq('knowledge_item_id', existingItem.id);

      await supabase
        .from('knowledge_base_items')
        .delete()
        .eq('id', existingItem.id);
    }

    // Create knowledge base item
    const { data: knowledgeItem, error: itemError } = await supabase
      .from('knowledge_base_items')
      .insert({
        workspace_id: document.workspace_id,
        document_id: documentId,
        entity_type: 'document',
        content: document.extracted_text,
        metadata: {
          documentName: document.name,
          fileType: document.file_type,
          processedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (itemError) {
      console.error('Knowledge item creation error:', itemError);
      return NextResponse.json(
        { error: 'Failed to create knowledge base item' },
        { status: 500 }
      );
    }

    // Extract entities using AI
    let extractionResult;
    try {
      extractionResult = await extractEntities(
        text,
        [documentId], // Use document ID as chunk ID
        {
          minConfidence: 0.5,
          maxEntities: 50,
        }
      );
    } catch (extractionError) {
      console.error('Entity extraction error:', extractionError);
      // Still return success since we created the knowledge base item
      return NextResponse.json({
        success: true,
        knowledgeItemId: knowledgeItem.id,
        entities: [],
        relationships: [],
        warning: 'Entity extraction failed, but document was added to knowledge base',
        error: extractionError instanceof Error ? extractionError.message : 'Unknown error',
      });
    }

    // Store entities in database
    const storedEntities: Array<{ id: string; entity_type: string; name: string }> = [];

    for (const entity of extractionResult.entities) {
      const { data: storedEntity, error: entityError } = await supabase
        .from('knowledge_entities')
        .insert({
          workspace_id: document.workspace_id,
          knowledge_item_id: knowledgeItem.id,
          entity_type: entity.type,
          name: entity.name,
          description: entity.description || null,
          confidence: entity.confidence,
          metadata: (entity.metadata || {}) as Record<string, string | number | boolean | null>,
        })
        .select()
        .single();

      if (entityError) {
        console.error('Entity storage error:', entityError);
        continue;
      }

      storedEntities.push({
        id: storedEntity.id,
        entity_type: storedEntity.entity_type,
        name: storedEntity.name,
      });
    }

    // Extract and store relationships if we have multiple entities
    const storedRelationships: Array<{ id: string; relationship_type: string }> = [];

    if (storedEntities.length >= 2) {
      try {
        const relationships = await extractRelationships(
          extractionResult.entities.map((e, i) => ({
            ...e,
            id: storedEntities[i]?.id || e.id, // Use stored ID if available
          })),
          { minConfidence: 0.6 }
        );

        // Store relationships
        for (const rel of relationships) {
          // Map the original entity IDs to stored entity IDs
          const sourceIdx = extractionResult.entities.findIndex(e => e.id === rel.sourceEntityId);
          const targetIdx = extractionResult.entities.findIndex(e => e.id === rel.targetEntityId);

          if (sourceIdx === -1 || targetIdx === -1) continue;

          const sourceId = storedEntities[sourceIdx]?.id;
          const targetId = storedEntities[targetIdx]?.id;

          if (!sourceId || !targetId) continue;

          const { data: storedRel, error: relError } = await supabase
            .from('knowledge_entity_relationships')
            .insert({
              workspace_id: document.workspace_id,
              source_entity_id: sourceId,
              target_entity_id: targetId,
              relationship_type: rel.relationshipType,
              confidence: rel.confidence,
              metadata: (rel.metadata || {}) as Record<string, string | number | boolean | null>,
            })
            .select()
            .single();

          if (relError) {
            console.error('Relationship storage error:', relError);
            continue;
          }

          storedRelationships.push({
            id: storedRel.id,
            relationship_type: storedRel.relationship_type,
          });
        }
      } catch (relError) {
        console.error('Relationship extraction error:', relError);
        // Continue without relationships
      }
    }

    // Generate embeddings for the knowledge item
    let embeddingCount = 0;
    let embeddingWarning: string | undefined;
    try {
      console.log(`[Knowledge Extract] Generating embeddings for document ${documentId}...`);
      const embeddingResult = await reprocessKnowledgeItem(
        knowledgeItem.id,
        document.extracted_text,
        {
          documentId: documentId,
          metadata: {
            documentName: document.name,
            fileType: document.file_type,
          },
        }
      );
      embeddingCount = embeddingResult.embeddingCount;
      console.log(`[Knowledge Extract] Generated ${embeddingCount} embeddings for document ${documentId}`);
    } catch (embeddingError) {
      console.error('[Knowledge Extract] Embedding generation error:', embeddingError);
      embeddingWarning = `Embedding generation failed: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`;
    }

    // Trigger layout generation after knowledge extraction
    // This runs asynchronously and doesn't block the response
    triggerLayoutGeneration(document.workspace_id).catch(err => {
      console.error('[Knowledge Extract] Layout generation failed:', err);
    });

    return NextResponse.json({
      success: true,
      knowledgeItemId: knowledgeItem.id,
      entities: storedEntities,
      relationships: storedRelationships,
      stats: {
        entitiesExtracted: storedEntities.length,
        relationshipsExtracted: storedRelationships.length,
        embeddingsGenerated: embeddingCount,
        tokensUsed: extractionResult.tokensUsed,
        processingTime: extractionResult.processingTime,
      },
      ...(embeddingWarning ? { embeddingWarning } : {}),
      layoutGenerationTriggered: true,
    });

  } catch (error) {
    console.error('Knowledge extraction route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
