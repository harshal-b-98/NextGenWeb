/**
 * AI Notifications API
 * Phase 6: Conversational Marketing Platform
 *
 * Manages AI-generated clarification questions and notifications
 * for workspace owners.
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiNotificationService } from '@/lib/knowledge/auto-layout-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch all notifications for a workspace
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

    const notifications = await aiNotificationService.getNotifications(workspaceId);

    return NextResponse.json({
      success: true,
      notifications,
      stats: {
        total: notifications.length,
        pending: notifications.filter(n => !n.answered).length,
        answered: notifications.filter(n => n.answered).length,
        byType: {
          clarification: notifications.filter(n => n.type === 'clarification').length,
          suggestion: notifications.filter(n => n.type === 'suggestion').length,
          warning: notifications.filter(n => n.type === 'warning').length,
          info: notifications.filter(n => n.type === 'info').length,
        },
      },
    });
  } catch (error) {
    console.error('[Notifications API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new notification or answer an existing one
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const body = await request.json();
    const { action, notificationId, answer, type, title, message, question, options } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'answer': {
        if (!notificationId || !answer) {
          return NextResponse.json(
            { success: false, error: 'Notification ID and answer are required' },
            { status: 400 }
          );
        }

        await aiNotificationService.answerNotification(workspaceId, notificationId, answer);
        const notifications = await aiNotificationService.getNotifications(workspaceId);
        return NextResponse.json({
          success: true,
          message: 'Notification answered',
          notifications,
        });
      }

      case 'create': {
        if (!type || !title || !message) {
          return NextResponse.json(
            { success: false, error: 'Type, title, and message are required' },
            { status: 400 }
          );
        }

        const notification = await aiNotificationService.createNotification(
          workspaceId,
          type,
          title,
          message,
          question,
          options
        );
        return NextResponse.json({
          success: true,
          notification,
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

      case 'dismiss': {
        if (!notificationId) {
          return NextResponse.json(
            { success: false, error: 'Notification ID is required' },
            { status: 400 }
          );
        }

        // Mark as answered with a dismiss response
        await aiNotificationService.answerNotification(workspaceId, notificationId, '__dismissed__');
        const notifications = await aiNotificationService.getNotifications(workspaceId);
        return NextResponse.json({
          success: true,
          message: 'Notification dismissed',
          notifications,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: answer, create, generate_clarifications, or dismiss' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Notifications API] Error:', error);
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
