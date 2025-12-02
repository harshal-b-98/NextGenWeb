/**
 * Streaming Section Generation Hook
 * Phase 6: Conversational Marketing Platform
 *
 * React hook for consuming streaming section generation via SSE.
 * Provides real-time content updates with progress tracking.
 */

import { useState, useCallback, useRef } from 'react';
import type { CTASource, ConversationalRenderMode } from '@/lib/interactive/chat/chat-context';

// ============================================================================
// TYPES
// ============================================================================

export interface StreamingSectionRequest {
  websiteId: string;
  ctaSource: CTASource;
  customMessage?: string;
  renderMode?: ConversationalRenderMode;
  personaHint?: string;
  sessionId?: string;
}

export interface StreamedSection {
  id: string;
  sourceCtaId: string;
  sectionType: string;
  content: unknown;
  createdAt: string;
}

export interface StreamingMetadata {
  intent: {
    category: string;
    confidence: number;
  };
  sectionType: string;
  sectionId: string;
}

export interface KnowledgeSource {
  id: string;
  entityType: string;
  relevance: number;
}

export interface StreamingState {
  /** Current status of the stream */
  status: 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';
  /** Content chunks accumulated so far */
  content: string;
  /** Parsed section (available on complete) */
  section: StreamedSection | null;
  /** Intent and section type metadata */
  metadata: StreamingMetadata | null;
  /** Knowledge sources used */
  sources: KnowledgeSource[];
  /** Suggested follow-up CTAs */
  suggestedFollowUps: Array<{ text: string; topic: string; priority: string }>;
  /** Number of chunks received */
  chunkCount: number;
  /** Duration in milliseconds */
  duration: number | null;
  /** Error message if failed */
  error: string | null;
}

export interface UseStreamingSectionResult {
  /** Current streaming state */
  state: StreamingState;
  /** Start streaming section generation */
  generate: (request: StreamingSectionRequest) => Promise<void>;
  /** Abort the current stream */
  abort: () => void;
  /** Reset to initial state */
  reset: () => void;
  /** Is currently streaming? */
  isStreaming: boolean;
  /** Has completed successfully? */
  isComplete: boolean;
  /** Has an error? */
  hasError: boolean;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: StreamingState = {
  status: 'idle',
  content: '',
  section: null,
  metadata: null,
  sources: [],
  suggestedFollowUps: [],
  chunkCount: 0,
  duration: null,
  error: null,
};

// ============================================================================
// HOOK
// ============================================================================

export function useStreamingSection(): UseStreamingSectionResult {
  const [state, setState] = useState<StreamingState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(initialState);
  }, []);

  /**
   * Abort the current stream
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setState((prev) => ({
        ...prev,
        status: 'idle',
        error: 'Aborted by user',
      }));
    }
  }, []);

  /**
   * Start streaming section generation
   */
  const generate = useCallback(async (request: StreamingSectionRequest) => {
    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Reset state
    setState({
      ...initialState,
      status: 'connecting',
    });

    const startTime = Date.now();

    try {
      const response = await fetch('/api/generate/section/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      setState((prev) => ({
        ...prev,
        status: 'streaming',
      }));

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let eventType: string | null = null;

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7);
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle different event types
              switch (eventType) {
                case 'start':
                  // Stream started
                  break;

                case 'chunk':
                  accumulatedContent += data.content || '';
                  setState((prev) => ({
                    ...prev,
                    content: accumulatedContent,
                    chunkCount: data.index || prev.chunkCount + 1,
                  }));
                  break;

                case 'metadata':
                  setState((prev) => ({
                    ...prev,
                    metadata: data,
                  }));
                  break;

                case 'sources':
                  setState((prev) => ({
                    ...prev,
                    sources: data.sources || [],
                  }));
                  break;

                case 'complete':
                  setState((prev) => ({
                    ...prev,
                    status: 'complete',
                    section: data.section,
                    suggestedFollowUps: data.suggestedFollowUps || [],
                    duration: data.duration || Date.now() - startTime,
                    chunkCount: data.chunkCount || prev.chunkCount,
                  }));
                  break;

                case 'error':
                  setState((prev) => ({
                    ...prev,
                    status: 'error',
                    error: data.message || data.error || 'Unknown error',
                    duration: Date.now() - startTime,
                  }));
                  break;
              }

              eventType = null;
            } catch (e) {
              console.warn('Failed to parse SSE data:', e);
            }
          }
        }
      }

      // If we finished without a complete event, mark as complete
      setState((prev) => {
        if (prev.status === 'streaming') {
          return {
            ...prev,
            status: 'complete',
            duration: Date.now() - startTime,
          };
        }
        return prev;
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Aborted, don't update state
        return;
      }

      console.error('Streaming error:', error);
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }));
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  return {
    state,
    generate,
    abort,
    reset,
    isStreaming: state.status === 'connecting' || state.status === 'streaming',
    isComplete: state.status === 'complete',
    hasError: state.status === 'error',
  };
}

// ============================================================================
// UTILITY: Parse streaming content as JSON
// ============================================================================

/**
 * Attempt to parse partial JSON content for preview
 */
export function parsePartialContent(content: string): {
  parsed: unknown | null;
  isComplete: boolean;
} {
  if (!content) {
    return { parsed: null, isComplete: false };
  }

  // Try to parse as-is
  try {
    const parsed = JSON.parse(content);
    return { parsed, isComplete: true };
  } catch {
    // Not complete JSON yet
  }

  // Try to repair truncated JSON
  try {
    let repaired = content.trim();

    // Count open brackets and braces
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escapeNext = false;

    for (const char of repaired) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }

    // If we're in the middle of a string, close it
    if (inString) {
      repaired += '"';
    }

    // Remove trailing incomplete values
    repaired = repaired.replace(/,\s*"[^"]*":\s*\.{0,3}$/g, '');
    repaired = repaired.replace(/,\s*"[^"]*":\s*$/g, '');
    repaired = repaired.replace(/,\s*$/g, '');

    // Close open brackets and braces
    while (openBrackets > 0) {
      repaired += ']';
      openBrackets--;
    }
    while (openBraces > 0) {
      repaired += '}';
      openBraces--;
    }

    const parsed = JSON.parse(repaired);
    return { parsed, isComplete: false };
  } catch {
    return { parsed: null, isComplete: false };
  }
}
