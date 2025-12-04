/**
 * KB Coverage API
 *
 * GET /api/workspaces/[workspaceId]/kb/coverage
 * Returns the knowledge base coverage analysis for a workspace.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  analyzeKBCoverage,
  getCoverageSummary,
} from '@/lib/knowledge/coverage-analyzer';

type RouteParams = {
  params: Promise<{
    workspaceId: string;
  }>;
};

/**
 * GET /api/workspaces/[workspaceId]/kb/coverage
 * Get KB coverage report for a workspace
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get coverage report
    const coverage = await analyzeKBCoverage(workspaceId);

    // Check if summary format is requested
    const url = new URL(request.url);
    const format = url.searchParams.get('format');

    if (format === 'summary') {
      return NextResponse.json({
        success: true,
        summary: getCoverageSummary(coverage),
        score: coverage.overallScore,
        missingCritical: coverage.missingCritical,
      });
    }

    return NextResponse.json({
      success: true,
      coverage,
    });
  } catch (error) {
    console.error('Error in KB coverage GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
