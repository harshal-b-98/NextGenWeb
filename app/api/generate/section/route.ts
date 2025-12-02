/**
 * Section Generation API Route
 * Phase 6: Conversational Marketing Platform
 *
 * API endpoint for generating inline marketing sections in response to CTA clicks.
 * Uses the SectionGeneratorService to create knowledge-grounded content.
 *
 * Features:
 * - CTA-triggered content generation
 * - Knowledge base retrieval for grounded responses
 * - Intent classification for optimal section selection
 * - Persona-aware content adaptation
 * - Support for streaming responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getSectionGenerator,
  getWorkspaceIdForWebsite,
  type SectionGenerationResult,
} from '@/lib/interactive/chat/section-generator';
import type { CTASource, ConversationalRenderMode } from '@/lib/interactive/chat/chat-context';

// Enable CORS for public websites
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const CTASourceSchema = z.object({
  ctaId: z.string(),
  ctaType: z.enum([
    'button',
    'link',
    'card',
    'hero-cta',
    'inline-cta',
    'floating-cta',
    'landing-cta',    // Phase 6: Conversational landing page CTAs
    'chat-message',   // Phase 6: Chat input messages
  ]),
  ctaText: z.string(),
  sectionId: z.string().optional(),
  position: z
    .object({
      top: z.number(),
      left: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  originalAction: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(), // Allow any metadata values
});

const SectionGenerationRequestSchema = z.object({
  websiteId: z.string().min(1),
  ctaSource: CTASourceSchema,
  customMessage: z.string().optional(),
  renderMode: z
    .enum([
      'chat-bubble',
      'inline-section',
      'section-replace',
      'modal',
      'side-panel',
      'full-page',  // Phase 6: Full page section generation for conversational landing
    ])
    .default('inline-section'),
  personaHint: z.string().optional(),
  sessionId: z.string().optional(),
});

export type SectionGenerationRequest = z.infer<typeof SectionGenerationRequestSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface SectionGenerationResponse {
  success: boolean;
  section: {
    id: string;
    sourceCtaId: string;
    sectionType: string;
    content: unknown; // SectionContent from section-generator
    createdAt: string;
  };
  intent: {
    category: string;
    confidence: number;
  };
  suggestedFollowUps: {
    text: string;
    topic: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  knowledgeSourceCount: number;
  tokensUsed: number;
}

// ============================================================================
// OPTIONS - CORS preflight
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

// ============================================================================
// POST - Generate a section from CTA context
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Validate request
    const parseResult = SectionGenerationRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: parseResult.error.flatten(),
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const { websiteId, ctaSource, customMessage, renderMode, personaHint, sessionId } =
      parseResult.data;

    // Get workspace ID from website
    let workspaceId: string;
    try {
      workspaceId = await getWorkspaceIdForWebsite(websiteId);
    } catch (error) {
      console.error('Failed to get workspace ID:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Website not found',
          message: `Could not find workspace for website: ${websiteId}`,
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get section generator
    const sectionGenerator = getSectionGenerator();

    // Generate the section
    const result: SectionGenerationResult = await sectionGenerator.generateSection({
      websiteId,
      workspaceId,
      ctaSource: ctaSource as CTASource,
      customMessage,
      renderMode: renderMode as ConversationalRenderMode,
      personaHint,
      sessionId,
    });

    const duration = Date.now() - startTime;

    // Build response
    const response: SectionGenerationResponse = {
      success: true,
      section: {
        id: result.section.id,
        sourceCtaId: result.section.sourceCtaId,
        sectionType: result.section.sectionType,
        content: result.section.content,
        createdAt: result.section.createdAt.toISOString(),
      },
      intent: {
        category: result.intent.category,
        confidence: result.intent.confidence,
      },
      suggestedFollowUps: result.suggestedFollowUps,
      knowledgeSourceCount: result.knowledgeSources.length,
      tokensUsed: result.tokensUsed,
    };

    // Log for monitoring
    console.log(
      `[Section Generation] Website: ${websiteId}, CTA: ${ctaSource.ctaText}, ` +
        `Intent: ${result.intent.category}, Duration: ${duration}ms, Tokens: ${result.tokensUsed}`
    );

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Section generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate section',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ============================================================================
// GET - Health check and info
// ============================================================================

export async function GET() {
  return NextResponse.json(
    {
      service: 'section-generation',
      version: '1.0.0',
      status: 'healthy',
      endpoints: {
        POST: 'Generate a section from CTA context',
      },
      requiredFields: ['websiteId', 'ctaSource'],
      optionalFields: ['customMessage', 'renderMode', 'personaHint', 'sessionId'],
    },
    { headers: corsHeaders }
  );
}
