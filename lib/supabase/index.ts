/**
 * Supabase utilities - re-export all client types
 */

export { createClient, getClient } from './client';
export { createClient as createServerClient, createServiceClient } from './server';
export { updateSession } from './middleware';
