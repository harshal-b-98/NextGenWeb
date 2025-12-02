import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generatePageLayout,
  savePageLayout,
  LayoutGenerationInputSchema,
  LayoutGenerationInput,
  ComponentVariant,
} from '@/lib/layout';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // Verify user has access to this workspace
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = LayoutGenerationInputSchema.safeParse({
      ...body,
      workspaceId,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Convert validated data to proper typed input
    const validatedData = validationResult.data;
    const input: LayoutGenerationInput = {
      websiteId: validatedData.websiteId,
      workspaceId: validatedData.workspaceId,
      pageType: validatedData.pageType,
      knowledgeBaseId: validatedData.knowledgeBaseId,
      personas: validatedData.personas,
      brandConfigId: validatedData.brandConfigId,
      contentHints: validatedData.contentHints,
      constraints: validatedData.constraints
        ? {
            maxSections: validatedData.constraints.maxSections,
            minSections: validatedData.constraints.minSections,
            requiredComponents: validatedData.constraints.requiredComponents as
              | ComponentVariant[]
              | undefined,
            excludedComponents: validatedData.constraints.excludedComponents as
              | ComponentVariant[]
              | undefined,
            forcedOrder: validatedData.constraints.forcedOrder as ComponentVariant[] | undefined,
          }
        : undefined,
    };

    // Generate layout
    const result = await generatePageLayout(input);

    // Optionally save to database
    if (body.save !== false) {
      await savePageLayout(result.layout);
    }

    return NextResponse.json({
      success: true,
      layout: result.layout,
      componentSelections: result.componentSelections.length,
      metadata: result.generationMetadata,
    });
  } catch (error) {
    console.error('Error generating layout:', error);
    return NextResponse.json(
      { error: 'Failed to generate layout' },
      { status: 500 }
    );
  }
}
