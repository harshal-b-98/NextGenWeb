/**
 * Apply Proposed Change API
 *
 * POST /api/conversation/apply-change
 * Applies a proposed change to the page content and updates the database
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const { change, pageId } = body;

    if (!change || !pageId) {
      return NextResponse.json(
        { error: 'change and pageId are required' },
        { status: 400 }
      );
    }

    // Get current page content
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('content, website_id')
      .eq('id', pageId)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Verify access (check workspace membership)
    const { data: website } = await supabase
      .from('websites')
      .select('workspace_id')
      .eq('id', page.website_id)
      .single();

    if (website) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', website.workspace_id)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Update sections based on change type
    const content = page.content as any;
    if (!content || !content.sections) {
      return NextResponse.json({ error: 'Page has no content' }, { status: 400 });
    }

    let updatedSections = [...content.sections];

    switch (change.changeType) {
      case 'content':
        // Update text content
        updatedSections = updatedSections.map((section: any) => {
          if (section.id === change.sectionId) {
            return {
              ...section,
              content: {
                ...section.content,
                [change.field]: change.preview.after
              }
            };
          }
          return section;
        });
        break;

      case 'style':
        // Update styles
        updatedSections = updatedSections.map((section: any) => {
          if (section.id === change.sectionId) {
            return {
              ...section,
              styles: {
                ...(section.styles || {}),
                ...change.styleUpdates
              }
            };
          }
          return section;
        });
        break;

      case 'layout':
        // Update layout
        updatedSections = updatedSections.map((section: any) => {
          if (section.id === change.sectionId) {
            return {
              ...section,
              layout: {
                ...(section.layout || {}),
                ...change.layoutUpdate
              }
            };
          }
          return section;
        });
        break;

      case 'add':
        // Add new section
        const newSection = {
          id: `section-${Date.now()}`,
          ...change.newSection,
          order: updatedSections.length
        };
        updatedSections.push(newSection);
        break;

      case 'remove':
        // Remove section
        updatedSections = updatedSections.filter(
          (section: any) => section.id !== change.sectionId
        );
        // Re-order remaining sections
        updatedSections = updatedSections.map((s: any, idx: number) => ({
          ...s,
          order: idx
        }));
        break;

      default:
        console.warn('Unknown change type:', change.changeType);
    }

    const updatedContent = {
      ...content,
      sections: updatedSections
    };

    // Update page in database
    const { error: updateError } = await supabase
      .from('pages')
      .update({ content: updatedContent })
      .eq('id', pageId);

    if (updateError) {
      console.error('Error updating page:', updateError);
      return NextResponse.json(
        { error: 'Failed to update page' },
        { status: 500 }
      );
    }

    // TODO: Create revision for history
    // await supabase
    //   .from('page_revisions')
    //   .insert({
    //     page_id: pageId,
    //     revision_type: 'feedback_applied',
    //     change_summary: change.description || 'Applied feedback change',
    //     content_snapshot: content,
    //     created_by: user.id
    //   });

    return NextResponse.json({
      success: true,
      updatedContent: updatedContent
    });
  } catch (error) {
    console.error('Error applying change:', error);
    return NextResponse.json(
      { error: 'Failed to apply change' },
      { status: 500 }
    );
  }
}
