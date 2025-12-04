/**
 * Website Finalization API Route
 *
 * POST /api/workspaces/[workspaceId]/websites/[websiteId]/finalize
 *      Create production branch from current draft version
 *
 * Runs validation checklist and promotes draft to production.
 * Creates immutable production snapshot while keeping draft editable.
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createWebsiteVersion, publishVersion } from '@/lib/versions/website-version-manager';
import { z } from 'zod';

// ============================================================================
// Request Schema
// ============================================================================

const FinalizeRequestSchema = z.object({
  skipValidation: z.boolean().optional().default(false),
  customDomain: z.string().optional(),
});

// ============================================================================
// Validation Checklist
// ============================================================================

interface ValidationResult {
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

async function runValidationChecklist(
  websiteId: string,
  supabase: any
): Promise<ValidationResult> {
  const checks = [];

  // Check 1: All pages have content
  const { data: pages } = await supabase
    .from('pages')
    .select('id, title, content')
    .eq('website_id', websiteId);

  const pagesWithContent = pages?.filter((p: any) => {
    const content = p.content as any;
    return content?.sections && content.sections.length > 0;
  });

  checks.push({
    name: 'pages_have_content',
    passed: pagesWithContent && pagesWithContent.length === pages?.length,
    message: `${pagesWithContent?.length || 0} of ${pages?.length || 0} pages have content`,
    severity: ((pagesWithContent?.length || 0) < (pages?.length || 0) ? 'error' : 'info') as 'error' | 'warning' | 'info',
  });

  // Check 2: SEO metadata present
  const pagesWithSEO = pages?.filter((p: any) => {
    const content = p.content as any;
    return content?.metadata?.title && content?.metadata?.description;
  });

  checks.push({
    name: 'seo_metadata',
    passed: pagesWithSEO && pagesWithSEO.length === pages?.length,
    message: `${pagesWithSEO?.length || 0} of ${pages?.length || 0} pages have SEO metadata`,
    severity: ((pagesWithSEO?.length || 0) < (pages?.length || 0) ? 'warning' : 'info') as 'error' | 'warning' | 'info',
  });

  // Check 3: At least one page exists
  checks.push({
    name: 'has_pages',
    passed: (pages?.length || 0) > 0,
    message: pages?.length ? `Website has ${pages.length} page(s)` : 'No pages found',
    severity: ((pages?.length || 0) === 0 ? 'error' : 'info') as 'error' | 'warning' | 'info',
  });

  // Check 4: Homepage exists
  const homePage = pages?.find((p: any) => p.is_homepage);
  checks.push({
    name: 'has_homepage',
    passed: !!homePage,
    message: homePage ? 'Homepage is set' : 'No homepage designated',
    severity: (homePage ? 'info' : 'warning') as 'error' | 'warning' | 'info',
  });

  // Check 5: Global components exist
  const { data: globalComponents } = await supabase
    .from('site_global_components')
    .select('component_type')
    .eq('website_id', websiteId);

  const hasHeader = globalComponents?.some((c: any) => c.type === 'header');
  const hasFooter = globalComponents?.some((c: any) => c.type === 'footer');

  checks.push({
    name: 'has_header',
    passed: hasHeader,
    message: hasHeader ? 'Header configured' : 'No header found',
    severity: (hasHeader ? 'info' : 'warning') as 'error' | 'warning' | 'info',
  });

  checks.push({
    name: 'has_footer',
    passed: hasFooter,
    message: hasFooter ? 'Footer configured' : 'No footer found',
    severity: (hasFooter ? 'info' : 'warning') as 'error' | 'warning' | 'info',
  });

  // Overall validation
  const errorChecks = checks.filter((c) => c.severity === 'error' && !c.passed);
  const passed = errorChecks.length === 0;

  return { passed, checks };
}

// ============================================================================
// POST - Finalize Website
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  try {
    const { workspaceId, websiteId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify workspace access (must be owner or admin)
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id, role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Only workspace owners and admins can finalize websites' },
        { status: 403 }
      );
    }

    // Verify website belongs to workspace
    const { data: website } = await supabase
      .from('websites')
      .select('id, name, slug, draft_version_id, production_version_id')
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const validationResult = FinalizeRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { skipValidation, customDomain } = validationResult.data;

    // Run validation checklist (unless skipped)
    let validationResult_data: ValidationResult | null = null;
    if (!skipValidation) {
      validationResult_data = await runValidationChecklist(websiteId, supabase);

      if (!validationResult_data.passed) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            validation: validationResult_data,
            message: 'Please fix the errors before finalizing',
          },
          { status: 400 }
        );
      }
    }

    // Create finalization version if it doesn't already exist
    if (!website.draft_version_id) {
      // No draft version exists, create one
      const { version: newVersion, error: versionError } = await createWebsiteVersion({
        websiteId,
        versionName: 'Production Ready',
        description: 'Initial production version',
        triggerType: 'finalization',
        createdBy: user.id,
      });

      if (versionError || !newVersion) {
        return NextResponse.json(
          { error: 'Failed to create production version' },
          { status: 500 }
        );
      }

      website.draft_version_id = newVersion.id;
    }

    // Publish the draft version to production
    const { success, error: publishError } = await publishVersion(website.draft_version_id);

    if (!success || publishError) {
      return NextResponse.json(
        { error: publishError || 'Failed to publish version' },
        { status: 500 }
      );
    }

    // Update custom domain if provided
    if (customDomain) {
      await supabase
        .from('websites')
        .update({ domain: customDomain })
        .eq('id', websiteId);
    }

    // Get the newly published version
    const { data: productionVersion } = await supabase
      .from('website_versions')
      .select('*')
      .eq('id', website.draft_version_id)
      .single();

    return NextResponse.json({
      message: 'Website finalized successfully',
      productionVersion,
      validation: validationResult_data,
      customDomain: customDomain || null,
    });
  } catch (error) {
    console.error('Unexpected error in POST /finalize:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Validation Status
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  try {
    const { workspaceId, websiteId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Run validation checklist
    const validation = await runValidationChecklist(websiteId, supabase);

    return NextResponse.json({ validation });
  } catch (error) {
    console.error('Unexpected error in GET /finalize:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
