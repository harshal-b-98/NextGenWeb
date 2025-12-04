/**
 * KB Addition from Feedback API
 * Story 7.7: KB Addition from Feedback
 *
 * Allows users to add content directly to the knowledge base
 * from the feedback panel when content is missing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { storeEntity } from '@/lib/knowledge/entities/store';
import type { EntityType, Entity } from '@/lib/ai/types';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AddKBContentSchema = z.object({
  /** Entity type to add */
  entityType: z.enum([
    'product', 'service', 'feature', 'benefit', 'pricing',
    'testimonial', 'company', 'person', 'statistic', 'faq',
    'cta', 'process_step', 'use_case', 'integration', 'contact',
    'company_name', 'company_tagline', 'company_description',
    'mission_statement', 'social_link', 'nav_category', 'brand_voice',
  ]) as z.ZodType<EntityType>,

  /** Content to add */
  content: z.object({
    /** Primary name/title */
    name: z.string().min(1).max(500),
    /** Optional description */
    description: z.string().max(2000).optional(),
    /** Additional metadata based on entity type */
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),

  /** Optional source context */
  sourceContext: z.object({
    /** Where this content came from in feedback */
    feedbackId: z.string().uuid().optional(),
    /** Section this relates to */
    sectionId: z.string().optional(),
    /** User's notes */
    userNotes: z.string().max(1000).optional(),
  }).optional(),
});

type AddKBContentInput = z.infer<typeof AddKBContentSchema>;

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verify workspace membership
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // 3. Parse and validate input
    const body = await request.json();
    const parseResult = AddKBContentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // 4. Create entity based on type
    const entity = createEntityFromInput(input);

    // 5. Get or create a manual knowledge item for user-added content
    const manualKBItem = await getOrCreateManualKBItem(supabase, workspaceId, user.id);

    // 6. Store the entity (confidence is embedded in the entity object)
    const storedEntityId = await storeEntity(
      workspaceId,
      manualKBItem.id,
      entity,
    );

    // 7. Track the addition (for analytics)
    await trackKBAddition(supabase, workspaceId, user.id, input, storedEntityId);

    return NextResponse.json({
      success: true,
      entity: {
        id: storedEntityId,
        type: entity.type,
        name: entity.name,
      },
      message: `Successfully added ${entity.type.replace(/_/g, ' ')} to knowledge base`,
    });

  } catch (error) {
    console.error('Error adding KB content from feedback:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add content' },
      { status: 500 }
    );
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create an entity object from the input
 * Uses type assertion to bypass strict TypeScript checks since entity
 * structures vary and will be validated by storeEntity
 */
function createEntityFromInput(input: AddKBContentInput): Entity {
  const { entityType, content } = input;
  // Generate a temporary ID - storeEntity will assign the real ID
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Build entity with base fields + type-specific metadata
  const entity = {
    id: tempId,
    type: entityType,
    name: content.name,
    description: content.description,
    confidence: 0.95,
    sourceChunkIds: [], // User-added content doesn't come from chunks
    // Spread any additional metadata
    ...content.metadata,
  };

  // Handle special cases that need field mapping
  switch (entityType) {
    case 'testimonial':
      return {
        ...entity,
        quote: content.description || content.name,
        author: (content.metadata?.author as string) || 'Anonymous',
      } as Entity;
    case 'faq':
      return {
        ...entity,
        question: content.name,
        answer: content.description || '',
      } as Entity;
    case 'statistic':
      return {
        ...entity,
        value: content.name,
        context: content.description,
      } as Entity;
    case 'social_link': {
      const validPlatforms = ['linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'other'] as const;
      const platform = validPlatforms.includes(content.metadata?.platform as typeof validPlatforms[number])
        ? (content.metadata?.platform as typeof validPlatforms[number])
        : 'other';
      return {
        ...entity,
        platform,
        url: content.name,
      } as Entity;
    }
    case 'brand_voice': {
      const validTones = ['formal', 'conversational', 'bold', 'friendly', 'professional', 'innovative', 'trustworthy', 'playful'] as const;
      const tone = validTones.includes(content.metadata?.tone as typeof validTones[number])
        ? (content.metadata?.tone as typeof validTones[number])
        : 'professional';
      return {
        ...entity,
        tone,
        characteristics: (content.metadata?.characteristics as string[]) || [],
        avoidTerms: (content.metadata?.avoidTerms as string[]) || [],
      } as Entity;
    }
    default:
      return entity as Entity;
  }
}

/**
 * Get or create a manual KB item for user-added content
 */
async function getOrCreateManualKBItem(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  _userId: string
) {
  const { untypedFrom } = await import('@/lib/supabase/untyped');

  // Look for existing manual KB item
  const kbTable = await untypedFrom('knowledge_base_items');
  const { data: existing } = await kbTable
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('title', 'User-Added Content')
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // Create a new manual KB item using the existing table structure
  const { data: newItem, error } = await kbTable
    .insert({
      workspace_id: workspaceId,
      entity_type: 'manual',
      content: 'Content added directly by users through the feedback panel.',
      title: 'User-Added Content',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create manual KB item: ${error.message}`);
  }

  return newItem;
}

/**
 * Track KB additions for analytics
 */
async function trackKBAddition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string,
  input: AddKBContentInput,
  entityId: string
) {
  try {
    const { untypedFrom } = await import('@/lib/supabase/untyped');
    const activityTable = await untypedFrom('activity_feed');

    await activityTable.insert({
      workspace_id: workspaceId,
      event_type: 'kb_content_added',
      event_data: {
        entityType: input.entityType,
        entityId,
        entityName: input.content.name,
        source: 'feedback_panel',
        feedbackId: input.sourceContext?.feedbackId,
        sectionId: input.sourceContext?.sectionId,
      },
      created_by: userId,
    });
  } catch {
    // Non-critical, don't fail the request
    console.warn('Failed to track KB addition');
  }
}

// =============================================================================
// BULK ADD ENDPOINT
// =============================================================================

/**
 * Bulk add multiple KB items at once
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify membership
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    // Parse bulk input
    const body = await request.json();
    const BulkSchema = z.object({
      items: z.array(AddKBContentSchema).min(1).max(20),
    });

    const parseResult = BulkSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { items } = parseResult.data;
    const manualKBItem = await getOrCreateManualKBItem(supabase, workspaceId, user.id);

    const results: Array<{ success: boolean; entityId?: string; error?: string }> = [];

    for (const input of items) {
      try {
        const entity = createEntityFromInput(input);
        const storedId = await storeEntity(workspaceId, manualKBItem.id, entity);
        results.push({ success: true, entityId: storedId });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: successCount === items.length,
      added: successCount,
      total: items.length,
      results,
    });

  } catch (error) {
    console.error('Error bulk adding KB content:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add content' },
      { status: 500 }
    );
  }
}
