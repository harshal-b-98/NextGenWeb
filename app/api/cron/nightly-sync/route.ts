/**
 * Nightly Sync Cron Job API
 *
 * This endpoint is designed to be called by a cron job (e.g., Vercel Cron)
 * to sync website layouts and brand configurations nightly.
 *
 * Schedule: Daily at 2:00 AM UTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { nightlySyncService, aiNotificationService } from '@/lib/knowledge/auto-layout-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for sync

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');

    // In production, verify the cron secret
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[NightlySync] Starting nightly sync...');

    // Run the nightly sync
    const syncResult = await nightlySyncService.runNightlySync();

    console.log('[NightlySync] Sync completed:', syncResult);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...syncResult,
    });
  } catch (error) {
    console.error('[NightlySync] Cron job failed:', error);
    return NextResponse.json(
      {
        error: 'Nightly sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint for manual trigger
export async function POST(request: NextRequest) {
  try {
    // Get workspace ID from body (optional - if not provided, sync all)
    const body = await request.json().catch(() => ({}));
    const { workspaceId } = body;

    console.log('[NightlySync] Manual sync triggered', workspaceId ? `for workspace: ${workspaceId}` : 'for all workspaces');

    if (workspaceId) {
      // Sync specific workspace
      const { autoLayoutGenerator } = await import('@/lib/knowledge/auto-layout-generator');
      const result = await autoLayoutGenerator.generateLayoutsForWorkspace(workspaceId);

      // Also generate clarifications
      await aiNotificationService.generateClarifications(workspaceId);

      return NextResponse.json({
        success: result.success,
        workspaceId,
        sectionsGenerated: result.sectionsGenerated,
        improvements: result.improvements,
        error: result.error,
      });
    }

    // Full sync for all workspaces
    const syncResult = await nightlySyncService.runNightlySync();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...syncResult,
    });
  } catch (error) {
    console.error('[NightlySync] Manual sync failed:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
