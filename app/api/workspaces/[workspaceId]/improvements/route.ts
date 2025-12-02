/**
 * Workspace Improvements API
 * Phase 6: Conversational Marketing Platform
 *
 * Provides suggestions and improvements for workspace owners
 * to enhance their knowledge base and content generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { autoLayoutGenerator, aiNotificationService } from '@/lib/knowledge/auto-layout-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    // Get improvements and notifications in parallel
    const [improvements, notifications] = await Promise.all([
      autoLayoutGenerator.analyzeAndGenerateImprovements(workspaceId),
      aiNotificationService.getNotifications(workspaceId),
    ]);

    return NextResponse.json({
      success: true,
      improvements,
      notifications,
      stats: {
        totalImprovements: improvements.length,
        highPriority: improvements.filter(i => i.priority === 'high').length,
        mediumPriority: improvements.filter(i => i.priority === 'medium').length,
        lowPriority: improvements.filter(i => i.priority === 'low').length,
        pendingNotifications: notifications.filter(n => !n.answered).length,
      },
    });
  } catch (error) {
    console.error('[Improvements API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch improvements',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Trigger manual sync or regeneration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const body = await request.json();
    const { action } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'regenerate_layouts': {
        const result = await autoLayoutGenerator.generateLayoutsForWorkspace(workspaceId);
        return NextResponse.json({
          success: result.success,
          message: 'Layouts regenerated',
          sectionsGenerated: result.sectionsGenerated,
          improvements: result.improvements,
        });
      }

      case 'generate_clarifications': {
        await aiNotificationService.generateClarifications(workspaceId);
        const notifications = await aiNotificationService.getNotifications(workspaceId);
        return NextResponse.json({
          success: true,
          message: 'Clarifications generated',
          notifications,
        });
      }

      case 'refresh_improvements': {
        const improvements = await autoLayoutGenerator.analyzeAndGenerateImprovements(workspaceId);
        return NextResponse.json({
          success: true,
          improvements,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Improvements API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Action failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
