/**
 * Website Refinement Conversation API
 *
 * POST /api/conversation/refine
 * Processes refinement feedback and updates website
 * Integrates with FeedbackEngine for AI-powered change generation
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 * Phase 2: Preview Studio & Refinement
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { completeJSON } from '@/lib/ai/client';

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
    const { websiteId, sessionId, message, pageId, sectionId } = body;

    if (!websiteId || !message || !pageId) {
      return NextResponse.json(
        { error: 'websiteId, pageId, and message are required' },
        { status: 400 }
      );
    }

    // Get website (try v2 first, fallback to old table)
    let website = await supabase
      .from('websites_v2')
      .select('workspace_id')
      .eq('id', websiteId)
      .single()
      .then(r => r.data);

    // Fallback to old websites table
    if (!website) {
      website = await supabase
        .from('websites')
        .select('workspace_id')
        .eq('id', websiteId)
        .single()
        .then(r => r.data);
    }

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', website.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get or create refinement session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: newSession } = await supabase
        .from('conversation_sessions')
        .insert({
          workspace_id: website.workspace_id,
          type: 'refinement',
          status: 'active',
          generated_website_id: websiteId,
        })
        .select('id')
        .single();

      currentSessionId = newSession?.id;
    }

    // Get current message count for sequence number
    const { count: messageCount } = await supabase
      .from('conversation_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', currentSessionId);

    // Save user message
    const { data: messageData } = await supabase
      .from('conversation_messages')
      .insert({
        session_id: currentSessionId,
        role: 'user',
        content: message,
        sequence_number: (messageCount || 0) + 1,
      })
      .select('id')
      .single();

    // Get current page content for context
    const { data: page } = await supabase
      .from('pages')
      .select('content, title')
      .eq('id', pageId)
      .single();

    // Get specific section if sectionId provided
    let sectionContent = null;
    const pageContent = page?.content as any;
    if (sectionId && pageContent?.sections) {
      sectionContent = pageContent.sections.find(
        (s: any) => s.id === sectionId
      );
    }

    // Get website brand config for styling context
    const { data: websiteData } = await supabase
      .from('websites')
      .select('brand_config')
      .eq('id', websiteId)
      .single();

    const brandConfig = (websiteData?.brand_config as any) || {};

    // Build enhanced context message for Claude
    const contextMessage = sectionId && sectionContent
      ? `Current Page: ${page?.title || 'Untitled'}

Selected Section (${sectionId}):
Type: ${sectionContent.type}
Content: ${JSON.stringify(sectionContent.content, null, 2)}
Styles: ${JSON.stringify(sectionContent.styles || {}, null, 2)}
Layout: ${JSON.stringify(sectionContent.layout || {}, null, 2)}

Brand Guidelines:
${brandConfig.primaryColor ? `- Primary Color: ${brandConfig.primaryColor}` : ''}
${brandConfig.fontFamily ? `- Font: ${brandConfig.fontFamily}` : ''}

Available Section Types: hero, features, testimonials, pricing, faq, cta, team, timeline

User Feedback: "${message}"

Analyze what type of change is needed (content/style/layout/add/remove) and provide specific implementation.`
      : `Current Page: ${page?.title || 'Untitled'}

All Sections:
${JSON.stringify(pageContent?.sections || [], null, 2)}

User Feedback: "${message}"

Determine the type of change needed and suggest specific improvements.`;

    // Process with Claude Sonnet (JSON mode)
    let aiResponse: string;
    let proposedChanges: any[] = [];

    try {
      const aiResult = await completeJSON<{
        response: string;
        feedbackType: 'content' | 'style' | 'layout' | 'add' | 'remove' | 'reorder';
        changes: Array<{
          changeType: 'content' | 'style' | 'layout' | 'add' | 'remove';
          field?: string;
          currentValue?: string;
          proposedValue?: string;
          styleUpdates?: Record<string, string>;
          layoutUpdate?: Record<string, any>;
          newSection?: any;
          remove?: boolean;
          reasoning: string;
        }>;
      }>({
        messages: [
          {
            role: 'system',
            content: `You are an expert website designer and developer.

You can handle ANY type of website change:

**Content Changes**: Edit text (headlines, descriptions, CTAs)
**Style Changes**: Colors, fonts, spacing, visual effects
**Layout Changes**: Columns, alignment, positioning
**Add Elements**: New sections, images, buttons
**Remove Elements**: Delete sections or components

Return JSON matching this schema:
{
  "response": "Brief acknowledgment (2-3 sentences)",
  "feedbackType": "content|style|layout|add|remove",
  "changes": [{
    "changeType": "content|style|layout|add|remove",

    // For CONTENT changes:
    "field": "headline|subheadline|description",
    "currentValue": "current text",
    "proposedValue": "improved text",

    // For STYLE changes:
    "styleUpdates": {
      "backgroundColor": "#00BCD4",
      "color": "#FFFFFF"
    },

    // For LAYOUT changes:
    "layoutUpdate": {
      "columns": 2,
      "alignment": "center"
    },

    // For ADD changes:
    "newSection": {
      "type": "testimonials",
      "content": {...}
    },

    // For REMOVE:
    "remove": true,

    "reasoning": "why this helps (1 sentence)"
  }]
}

Only return fields relevant to the change type requested.`
          },
          {
            role: 'user',
            content: contextMessage
          }
        ],
        config: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.7,
          maxTokens: 3072
        }
      });

      const parsed = aiResult.data;
      aiResponse = parsed.response;

      // Map Claude's changes to our format (support all change types)
      proposedChanges = parsed.changes.map(c => {
        const baseChange = {
          id: crypto.randomUUID(),
          sectionId,
          changeType: c.changeType,
          description: c.reasoning,
        };

        // Add type-specific fields
        if (c.changeType === 'content') {
          return {
            ...baseChange,
            field: c.field,
            preview: {
              before: c.currentValue,
              after: c.proposedValue
            }
          };
        } else if (c.changeType === 'style') {
          return {
            ...baseChange,
            styleUpdates: c.styleUpdates,
            preview: {
              before: `Current styles: ${JSON.stringify(sectionContent?.styles || {})}`,
              after: `Updated styles: ${JSON.stringify(c.styleUpdates)}`
            }
          };
        } else if (c.changeType === 'layout') {
          return {
            ...baseChange,
            layoutUpdate: c.layoutUpdate,
            preview: {
              before: `Current layout: ${JSON.stringify(sectionContent?.layout || {})}`,
              after: `New layout: ${JSON.stringify(c.layoutUpdate)}`
            }
          };
        } else if (c.changeType === 'add') {
          return {
            ...baseChange,
            newSection: c.newSection,
            preview: {
              before: 'No section',
              after: `Add ${c.newSection?.type} section`
            }
          };
        } else if (c.changeType === 'remove') {
          return {
            ...baseChange,
            remove: true,
            preview: {
              before: `Section: ${sectionContent?.type}`,
              after: 'Removed'
            }
          };
        }

        return baseChange;
      });
    } catch (aiError) {
      console.error('Claude AI error:', aiError);
      aiResponse = `I understand your feedback: "${message}". I'll help you improve this section.`;
      proposedChanges = [];
    }

    // Save AI response
    await supabase.from('conversation_messages').insert({
      session_id: currentSessionId,
      role: 'assistant',
      content: aiResponse,
      sequence_number: (messageCount || 0) + 2,
    });

    return NextResponse.json({
      success: true,
      sessionId: currentSessionId,
      messageId: messageData?.id,
      message: aiResponse,
      proposedChanges: proposedChanges,
    });
  } catch (error) {
    console.error('Error processing refinement:', error);
    return NextResponse.json(
      { error: 'Failed to process refinement' },
      { status: 500 }
    );
  }
}
