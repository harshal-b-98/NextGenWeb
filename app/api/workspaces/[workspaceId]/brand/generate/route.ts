import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractBrand, saveBrandSystem } from '@/lib/brand/extraction';
import { BrandGenerationInputSchema } from '@/lib/brand/types';

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
    const validationResult = BrandGenerationInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // Extract brand signals and generate brand system
    const result = await extractBrand(workspaceId, input, {
      includeColorAnalysis: true,
      includeToneAnalysis: true,
      maxSignals: 50,
    });

    // Save brand system to database
    const savedBrand = await saveBrandSystem(result.brand);

    return NextResponse.json({
      success: true,
      brand: savedBrand,
      signals: result.signals.length,
      tokensUsed: result.tokensUsed,
      processingTime: result.processingTime,
    });
  } catch (error) {
    console.error('Error generating brand:', error);
    return NextResponse.json(
      { error: 'Failed to generate brand' },
      { status: 500 }
    );
  }
}
