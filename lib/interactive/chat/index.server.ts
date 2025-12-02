/**
 * Chat System Server Exports
 * Phase 4.4: AI-Powered Conversational Interface
 * Phase 6: Conversational Marketing Platform
 *
 * This file exports server-only modules that use Supabase server client,
 * knowledge base access, and AI completions.
 *
 * IMPORTANT: Only import this in:
 * - Server Components
 * - API Routes
 * - Server Actions
 *
 * For client components, use './index' instead.
 */

// Re-export client-safe modules
export * from './types';
export * from './chat-context';

// Server-only modules
export * from './chat-engine';
export * from './message-service';
export * from './section-generator';
export * from './knowledge-depth-analyzer';
export * from './smart-cta-generator';
export * from './handoff-detector';
export * from './persona-cta-prioritizer';
