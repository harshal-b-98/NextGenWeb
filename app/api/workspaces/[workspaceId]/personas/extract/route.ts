import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractPersonas, savePersonas } from '@/lib/personas/extraction';

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

    // Extract personas
    const result = await extractPersonas(workspaceId, {
      maxPersonas: 5,
      minConfidence: 0.5,
      includeDetectionRules: true,
    });

    // Save personas to database
    if (result.personas.length > 0) {
      await savePersonas(result.personas);
    }

    return NextResponse.json({
      success: true,
      personas: result.personas.length,
      tokensUsed: result.tokensUsed,
      processingTime: result.processingTime,
    });
  } catch (error) {
    console.error('Error extracting personas:', error);
    return NextResponse.json(
      { error: 'Failed to extract personas' },
      { status: 500 }
    );
  }
}
