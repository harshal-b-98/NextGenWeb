/**
 * Individual Deployment API
 * Phase 3.6: Hosting & Deployment
 *
 * Get, update, or cancel a specific deployment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createVercelService, type DeploymentStatus } from '@/lib/deployment';

/**
 * GET /api/workspaces/[workspaceId]/websites/[websiteId]/deployments/[deploymentId]
 * Get deployment details including status and logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string; deploymentId: string }> }
) {
  try {
    const { workspaceId, websiteId, deploymentId } = await params;
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

    // Fetch deployment
    const { data: deployment, error: deploymentError } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', deploymentId)
      .eq('website_id', websiteId)
      .single();

    if (deploymentError || !deployment) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    // If deployment is in progress, refresh status from Vercel
    if (
      deployment.deployment_id &&
      ['pending', 'building', 'deploying'].includes(deployment.status)
    ) {
      try {
        const vercelToken = process.env.VERCEL_TOKEN;
        if (vercelToken) {
          const vercel = createVercelService(vercelToken);
          const status = await vercel.getDeploymentStatus(deployment.deployment_id);

          // Update if status changed
          if (status.status !== deployment.status) {
            const { data: updatedDeployment } = await supabase
              .from('deployments')
              .update({
                status: status.status,
                url: status.url || deployment.url,
                error: status.error,
                completed_at: ['ready', 'error', 'canceled'].includes(status.status)
                  ? new Date().toISOString()
                  : null,
              })
              .eq('id', deploymentId)
              .select()
              .single();

            if (updatedDeployment) {
              return NextResponse.json({
                success: true,
                deployment: updatedDeployment,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing deployment status:', error);
      }
    }

    return NextResponse.json({
      success: true,
      deployment,
    });
  } catch (error) {
    console.error('Error in deployment GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/websites/[websiteId]/deployments/[deploymentId]
 * Cancel a deployment in progress
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string; deploymentId: string }> }
) {
  try {
    const { workspaceId, websiteId, deploymentId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership (need admin or owner role)
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch deployment
    const { data: deployment, error: deploymentError } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', deploymentId)
      .eq('website_id', websiteId)
      .single();

    if (deploymentError || !deployment) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    // Can only cancel in-progress deployments
    if (!['pending', 'building', 'deploying'].includes(deployment.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel deployment that is not in progress' },
        { status: 400 }
      );
    }

    // Cancel on Vercel if deployment_id exists
    if (deployment.deployment_id) {
      try {
        const vercelToken = process.env.VERCEL_TOKEN;
        if (vercelToken) {
          const vercel = createVercelService(vercelToken);
          await vercel.cancelDeployment(deployment.deployment_id);
        }
      } catch (error) {
        console.error('Error canceling Vercel deployment:', error);
        // Continue to update local status even if Vercel cancel fails
      }
    }

    // Update deployment status
    const { data: updatedDeployment, error: updateError } = await supabase
      .from('deployments')
      .update({
        status: 'canceled' as DeploymentStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', deploymentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating deployment:', updateError);
      return NextResponse.json({ error: 'Failed to cancel deployment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deployment: updatedDeployment,
      message: 'Deployment canceled',
    });
  } catch (error) {
    console.error('Error in deployment DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
