/**
 * Workspace Member Detail API
 * Phase 5.1: Admin Dashboard
 *
 * Individual member operations: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { UserRole } from '@/types/database';

/**
 * Member update schema
 */
const MemberUpdateSchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer']),
});

/**
 * GET /api/workspaces/[workspaceId]/members/[memberId]
 * Get member details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const { workspaceId, memberId } = await params;
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

    // Fetch member
    const { data: member, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      member,
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workspaces/[workspaceId]/members/[memberId]
 * Update member role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const { workspaceId, memberId } = await params;
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
    const { data: currentMembership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!currentMembership || !['owner', 'admin'].includes(currentMembership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the target member
    const { data: targetMember } = await supabase
      .from('workspace_members')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot modify owner role
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot modify workspace owner role' },
        { status: 403 }
      );
    }

    // Admins cannot modify other admins (only owners can)
    if (currentMembership.role === 'admin' && targetMember.role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot modify other admin roles' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = MemberUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { role } = validation.data;

    // Only owners can promote to admin
    if (role === 'admin' && currentMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only workspace owners can promote members to admin' },
        { status: 403 }
      );
    }

    // Update the member role
    const { data: member, error } = await supabase
      .from('workspace_members')
      .update({ role: role as UserRole })
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      return NextResponse.json(
        { error: 'Failed to update member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member,
    });
  } catch (error) {
    console.error('Error in member PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/members/[memberId]
 * Remove a member from the workspace
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const { workspaceId, memberId } = await params;
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
    const { data: currentMembership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!currentMembership || !['owner', 'admin'].includes(currentMembership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the target member
    const { data: targetMember } = await supabase
      .from('workspace_members')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot remove owner
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner' },
        { status: 403 }
      );
    }

    // Admins cannot remove other admins (only owners can)
    if (currentMembership.role === 'admin' && targetMember.role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot remove other admins' },
        { status: 403 }
      );
    }

    // Cannot remove yourself if you're the only admin (besides owner)
    if (targetMember.user_id === user.id) {
      const { count } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .in('role', ['owner', 'admin']);

      if ((count || 0) <= 1) {
        return NextResponse.json(
          { error: 'Cannot leave workspace - you are the only admin' },
          { status: 403 }
        );
      }
    }

    // Remove the member
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error removing member:', error);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error in member DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
