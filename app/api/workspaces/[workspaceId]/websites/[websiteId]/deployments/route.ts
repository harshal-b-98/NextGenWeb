/**
 * Deployments API
 * Phase 3.6: Hosting & Deployment
 *
 * Manage website deployments to Vercel.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createVercelService,
  CreateDeploymentSchema,
  type Deployment,
  type DeploymentStatus,
} from '@/lib/deployment';
import {
  generateNextJsProject,
  type WebsiteExportData,
} from '@/lib/export';
import type { RuntimePageData, RuntimeSection, RuntimeBrandConfig, PageMetadata } from '@/lib/runtime/types';
import type { PopulatedSection } from '@/lib/content/types';
import {
  trackDeploymentStarted,
  trackDeploymentSucceeded,
  trackDeploymentFailed,
} from '@/lib/activity';

/**
 * GET /api/workspaces/[workspaceId]/websites/[websiteId]/deployments
 * List deployments for a website
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  try {
    const { workspaceId, websiteId } = await params;
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

    // Fetch deployments
    const { data: deployments, error: deploymentsError } = await supabase
      .from('deployments')
      .select('*')
      .eq('website_id', websiteId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (deploymentsError) {
      console.error('Error fetching deployments:', deploymentsError);
      return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deployments: deployments || [],
    });
  } catch (error) {
    console.error('Error in deployments GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/workspaces/[workspaceId]/websites/[websiteId]/deployments
 * Create a new deployment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  try {
    const { workspaceId, websiteId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership (need admin or owner role for deployment)
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const validationResult = CreateDeploymentSchema.safeParse({
      ...body,
      websiteId,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { provider, config } = validationResult.data;

    // Get Vercel token from workspace settings or environment
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      return NextResponse.json(
        { error: 'Vercel integration not configured. Please add VERCEL_TOKEN to environment.' },
        { status: 400 }
      );
    }

    // Fetch website with pages
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select(`
        *,
        pages(*)
      `)
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (websiteError || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Transform to export format
    const websiteData = transformToExportData(website);
    const projectName = config?.projectName || slugify(website.name);

    // Generate the Next.js project
    const exportResult = generateNextJsProject(websiteData, {
      projectName,
      typescript: true,
      tailwind: true,
    });

    // Create deployment record
    const { data: deployment, error: createError } = await supabase
      .from('deployments')
      .insert({
        website_id: websiteId,
        provider,
        status: 'pending' as DeploymentStatus,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError || !deployment) {
      console.error('Error creating deployment record:', createError);
      return NextResponse.json({ error: 'Failed to create deployment' }, { status: 500 });
    }

    // Track deployment started
    await trackDeploymentStarted(workspaceId, user.id, deployment.id, website.name);

    // Deploy to Vercel asynchronously
    deployToVercel(
      supabase,
      deployment.id,
      vercelToken,
      config?.teamId,
      projectName,
      exportResult.files,
      { workspaceId, userId: user.id, websiteName: website.name }
    ).catch(error => {
      console.error('Deployment error:', error);
    });

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id,
        status: deployment.status,
        provider: deployment.provider,
        createdAt: deployment.created_at,
      },
      message: 'Deployment started',
    });
  } catch (error) {
    console.error('Error in deployments POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Deploy to Vercel (async operation)
 */
async function deployToVercel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  deploymentId: string,
  token: string,
  teamId: string | undefined,
  projectName: string,
  files: { path: string; content?: string; isDirectory?: boolean }[],
  activityContext: { workspaceId: string; userId: string; websiteName: string }
) {
  try {
    // Update status to building
    await supabase
      .from('deployments')
      .update({ status: 'building' as DeploymentStatus })
      .eq('id', deploymentId);

    // Create Vercel service
    const vercel = createVercelService(token, teamId);

    // Check if project exists, create if not
    let project = await vercel.getProject(projectName);
    if (!project) {
      project = await vercel.createProject({
        name: projectName,
        framework: 'nextjs',
      });
    }

    // Update status to deploying
    await supabase
      .from('deployments')
      .update({
        status: 'deploying' as DeploymentStatus,
        project_id: project.id,
      })
      .eq('id', deploymentId);

    // Deploy files
    const result = await vercel.deploy(projectName, files, {
      target: 'production',
      meta: { deploymentId },
    });

    // Update with deployment result
    await supabase
      .from('deployments')
      .update({
        deployment_id: result.deploymentId,
        url: result.url,
        status: result.status,
        inspector_url: result.inspectorUrl,
      })
      .eq('id', deploymentId);

    // Poll for completion if not ready
    if (result.status !== 'ready') {
      pollDeploymentStatus(supabase, deploymentId, vercel, result.deploymentId, activityContext);
    } else {
      // Track successful deployment
      await trackDeploymentSucceeded(
        activityContext.workspaceId,
        activityContext.userId,
        deploymentId,
        activityContext.websiteName,
        result.url
      );
    }
  } catch (error) {
    console.error('Vercel deployment error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('deployments')
      .update({
        status: 'error' as DeploymentStatus,
        error: errorMessage,
      })
      .eq('id', deploymentId);

    // Track failed deployment
    await trackDeploymentFailed(
      activityContext.workspaceId,
      activityContext.userId,
      deploymentId,
      activityContext.websiteName,
      errorMessage
    );
  }
}

/**
 * Poll deployment status until complete
 */
async function pollDeploymentStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  deploymentId: string,
  vercel: ReturnType<typeof createVercelService>,
  vercelDeploymentId: string,
  activityContext: { workspaceId: string; userId: string; websiteName: string }
) {
  const maxAttempts = 60; // 5 minutes max
  let attempts = 0;

  const poll = async () => {
    try {
      const status = await vercel.getDeploymentStatus(vercelDeploymentId);

      await supabase
        .from('deployments')
        .update({
          status: status.status,
          url: status.url,
          error: status.error,
          completed_at: ['ready', 'error', 'canceled'].includes(status.status)
            ? new Date().toISOString()
            : null,
        })
        .eq('id', deploymentId);

      // Track completion events
      if (status.status === 'ready' && status.url) {
        await trackDeploymentSucceeded(
          activityContext.workspaceId,
          activityContext.userId,
          deploymentId,
          activityContext.websiteName,
          status.url
        );
      } else if (status.status === 'error') {
        await trackDeploymentFailed(
          activityContext.workspaceId,
          activityContext.userId,
          deploymentId,
          activityContext.websiteName,
          status.error || 'Deployment failed'
        );
      }

      if (!['ready', 'error', 'canceled'].includes(status.status) && attempts < maxAttempts) {
        attempts++;
        setTimeout(poll, 5000); // Poll every 5 seconds
      }
    } catch (error) {
      console.error('Error polling deployment status:', error);
    }
  };

  setTimeout(poll, 5000);
}

/**
 * Transform database website to export format
 */
function transformToExportData(website: any): WebsiteExportData {
  const pages: RuntimePageData[] = (website.pages || []).map((page: any) => {
    const content = page.content || {};
    const generatedContent = content.generatedContent || {};
    const sections = generatedContent.sections || [];

    const runtimeSections: RuntimeSection[] = sections.map(
      (section: PopulatedSection, index: number) => ({
        sectionId: section.sectionId || `section-${index}`,
        componentId: section.componentId || 'generic-section',
        order: section.order ?? index,
        narrativeRole: section.narrativeRole || 'content',
        defaultContent: section.content || {},
        personaVariants: {},
        variantFields: [],
      })
    );

    const metadata: PageMetadata = {
      title: generatedContent.pageMetadata?.title || page.title || 'Untitled',
      description: generatedContent.pageMetadata?.description || page.seo_description || '',
      keywords: generatedContent.pageMetadata?.keywords || page.seo_keywords || [],
      ogImage: generatedContent.pageMetadata?.ogImage,
      canonicalUrl: page.canonical_url,
    };

    return {
      pageId: page.id,
      websiteId: website.id,
      title: page.title || 'Untitled',
      slug: page.slug || 'page',
      path: page.path || '/',
      sections: runtimeSections,
      metadata,
      availablePersonas: [],
    };
  });

  const brandConfig: RuntimeBrandConfig | undefined = website.brand_config
    ? {
        primaryColor: website.brand_config.primary_color || website.brand_config.primaryColor || '#3B82F6',
        secondaryColor: website.brand_config.secondary_color || website.brand_config.secondaryColor || '#10B981',
        accentColor: website.brand_config.accent_color || website.brand_config.accentColor || '#F59E0B',
        fontFamily: website.brand_config.font_family || website.brand_config.fontFamily || 'Inter',
        headingFont: website.brand_config.heading_font || website.brand_config.headingFont,
        logoUrl: website.brand_config.logo_url || website.brand_config.logoUrl,
      }
    : undefined;

  return {
    websiteId: website.id,
    websiteName: website.name,
    domain: website.domain,
    brandConfig,
    pages,
  };
}

/**
 * Convert string to URL-safe slug
 */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
