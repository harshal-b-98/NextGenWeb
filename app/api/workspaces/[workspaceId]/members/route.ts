/**
 * Workspace Members API
 * Phase 5.1: Admin Dashboard
 *
 * CRUD operations for workspace team members.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Member invite schema
 */
const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

/**
 * GET /api/workspaces/[workspaceId]/members
 * List all members in a workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
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

    // Fetch members with user info from auth.users
    const { data: members, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    // Get user emails from a separate query (or admin API if available)
    // For now, we'll return member IDs and let the client look up user info
    // In production, you might use a profiles table or admin API

    return NextResponse.json({
      success: true,
      members: members || [],
      currentUserRole: membership.role,
    });
  } catch (error) {
    console.error('Error in members GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/members
 * Invite a new member to the workspace
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
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

    // Check workspace membership with admin permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = InviteMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, role } = validation.data;

    // Note: In a production system with proper Supabase setup, you would:
    // 1. Use Supabase Admin API to look up user by email
    // 2. Create a workspace_invitations table for pending invites
    // 3. Send invitation emails via a service like Resend or SendGrid

    // For this implementation, we'll return a message indicating the limitation
    // The workspace invitations table would need to be created via migration

    // Check if we can look up existing members to prevent duplicates
    const { data: existingMembers } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId);

    // Since we can't look up users by email without admin API,
    // we'll return instructions for manual member addition
    return NextResponse.json(
      {
        success: false,
        message: 'Direct invitations require additional setup. To add team members manually, the user must first create an account and then be added by their user ID.',
        instructions: [
          '1. Ask the user to sign up at your application',
          '2. Get their user ID from the auth system',
          '3. Add them directly to workspace_members table',
        ],
        email,
        requestedRole: role,
        existingMemberCount: existingMembers?.length || 0,
      },
      { status: 501 } // Not Implemented
    );
  } catch (error) {
    console.error('Error in members POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
