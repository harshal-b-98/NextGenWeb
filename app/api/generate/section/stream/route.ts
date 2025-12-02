/**
 * Streaming Section Generation API Route
 * Phase 6: Conversational Marketing Platform
 *
 * Server-Sent Events (SSE) endpoint for real-time section generation.
 * Streams content chunks as they're generated for better UX.
 *
 * Features:
 * - Real-time streaming via SSE
 * - Knowledge-grounded content generation
 * - Intent classification metadata
 * - Progress indicators
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getSectionGenerator,
  getWorkspaceIdForWebsite,
} from '@/lib/interactive/chat/section-generator';
import type { CTASource, ConversationalRenderMode } from '@/lib/interactive/chat/chat-context';

// Enable CORS for public websites
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
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
    'landing-cta',
    'chat-message',
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
  metadata: z.record(z.string(), z.any()).optional(),
});

const StreamSectionRequestSchema = z.object({
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
      'full-page',
    ])
    .default('inline-section'),
  personaHint: z.string().optional(),
  sessionId: z.string().optional(),
  // Fields to avoid content repetition
  excludeTopics: z.array(z.string()).optional(),
  existingSectionTypes: z.array(z.string()).optional(),
});

// ============================================================================
// SSE Event Types
// ============================================================================

type SSEEventType =
  | 'start'      // Generation started
  | 'chunk'      // Content chunk
  | 'metadata'   // Intent/section type info
  | 'sources'    // Knowledge sources used
  | 'complete'   // Generation complete with full result
  | 'error';     // Error occurred

interface SSEEvent {
  type: SSEEventType;
  data: unknown;
}

function formatSSE(event: SSEEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

// ============================================================================
// OPTIONS - CORS preflight
// ============================================================================

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

// ============================================================================
// POST - Stream section generation
// ============================================================================

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await request.json();

    // Validate request
    const parseResult = StreamSectionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        encoder.encode(
          formatSSE({
            type: 'error',
            data: {
              error: 'Invalid request',
              details: parseResult.error.flatten(),
            },
          })
        ),
        { status: 400, headers: corsHeaders }
      );
    }

    const { websiteId, ctaSource, customMessage, renderMode, personaHint, sessionId, excludeTopics, existingSectionTypes } =
      parseResult.data;

    // Get workspace ID from website
    let workspaceId: string;
    try {
      workspaceId = await getWorkspaceIdForWebsite(websiteId);
    } catch (error) {
      console.error('Failed to get workspace ID:', error);
      return new Response(
        encoder.encode(
          formatSSE({
            type: 'error',
            data: {
              error: 'Website not found',
              message: `Could not find workspace for website: ${websiteId}`,
            },
          })
        ),
        { status: 404, headers: corsHeaders }
      );
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const sectionGenerator = getSectionGenerator();
        const startTime = Date.now();

        try {
          // Send start event
          controller.enqueue(
            encoder.encode(
              formatSSE({
                type: 'start',
                data: {
                  sessionId,
                  websiteId,
                  ctaText: ctaSource.ctaText,
                  timestamp: new Date().toISOString(),
                },
              })
            )
          );

          // Stream the section generation
          // Pass excludeTopics and existingSectionTypes to avoid content repetition
          const generator = sectionGenerator.streamSectionGeneration({
            websiteId,
            workspaceId,
            ctaSource: ctaSource as CTASource,
            customMessage,
            renderMode: renderMode as ConversationalRenderMode,
            personaHint,
            sessionId,
            excludeTopics,
            existingSectionTypes,
          });

          let chunkCount = 0;
          let finalResult: Awaited<ReturnType<typeof sectionGenerator.generateSection>> | undefined;

          // Use a manual loop to capture the return value
          while (true) {
            const { value, done } = await generator.next();

            if (done) {
              // Generator completed, value is the return value
              finalResult = value;
              break;
            }

            // value is a chunk (string)
            chunkCount++;
            controller.enqueue(
              encoder.encode(
                formatSSE({
                  type: 'chunk',
                  data: {
                    content: value,
                    index: chunkCount,
                  },
                })
              )
            );
          }

          // Process the final result
          if (finalResult) {

            // Send metadata event
            controller.enqueue(
              encoder.encode(
                formatSSE({
                  type: 'metadata',
                  data: {
                    intent: {
                      category: finalResult.intent.category,
                      confidence: finalResult.intent.confidence,
                    },
                    sectionType: finalResult.section.sectionType,
                    sectionId: finalResult.section.id,
                  },
                })
              )
            );

            // Send sources event (for transparency)
            controller.enqueue(
              encoder.encode(
                formatSSE({
                  type: 'sources',
                  data: {
                    count: finalResult.knowledgeSources.length,
                    sources: finalResult.knowledgeSources.map((s) => ({
                      id: s.id,
                      entityType: s.entityType,
                      relevance: Math.round(s.similarity * 100),
                    })),
                  },
                })
              )
            );

            const duration = Date.now() - startTime;

            // Send complete event with full result
            controller.enqueue(
              encoder.encode(
                formatSSE({
                  type: 'complete',
                  data: {
                    success: true,
                    section: {
                      id: finalResult.section.id,
                      sourceCtaId: finalResult.section.sourceCtaId,
                      sectionType: finalResult.section.sectionType,
                      content: finalResult.section.content,
                      createdAt: finalResult.section.createdAt.toISOString(),
                    },
                    suggestedFollowUps: finalResult.suggestedFollowUps,
                    tokensUsed: finalResult.tokensUsed,
                    duration,
                    chunkCount,
                  },
                })
              )
            );

            // Log for monitoring
            console.log(
              `[Section Stream] Website: ${websiteId}, CTA: ${ctaSource.ctaText}, ` +
                `Intent: ${finalResult.intent.category}, Duration: ${duration}ms, Chunks: ${chunkCount}`
            );
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(
              formatSSE({
                type: 'error',
                data: {
                  error: 'Generation failed',
                  message: error instanceof Error ? error.message : 'Unknown error',
                },
              })
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: corsHeaders });
  } catch (error) {
    console.error('Stream setup error:', error);
    const encoder = new TextEncoder();
    return new Response(
      encoder.encode(
        formatSSE({
          type: 'error',
          data: {
            error: 'Failed to setup stream',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      ),
      { status: 500, headers: corsHeaders }
    );
  }
}

// ============================================================================
// GET - Health check and info
// ============================================================================

export async function GET() {
  return new Response(
    JSON.stringify({
      service: 'section-generation-stream',
      version: '1.0.0',
      status: 'healthy',
      endpoints: {
        POST: 'Stream section generation via SSE',
      },
      eventTypes: ['start', 'chunk', 'metadata', 'sources', 'complete', 'error'],
      requiredFields: ['websiteId', 'ctaSource'],
      optionalFields: ['customMessage', 'renderMode', 'personaHint', 'sessionId'],
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
