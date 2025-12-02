/**
 * Untyped Supabase Helper
 *
 * Helper for accessing tables that haven't been added to the generated types yet.
 * Use this for new tables until the types are regenerated.
 */

import { createClient } from './server';

/**
 * Get an untyped table reference
 *
 * Usage:
 * ```
 * const { data } = await untypedFrom('new_table')
 *   .select('*')
 *   .eq('id', someId)
 *   .single();
 * ```
 */
export async function untypedFrom(tableName: string) {
  const supabase = await createClient();
  // Use type assertion to bypass TypeScript's strict table type checking
  return (supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  }).from(tableName);
}

/**
 * Tables that are pending type generation
 */
export const UNTYPED_TABLES = [
  'conversion_goals',
  'conversion_events',
  'thank_you_pages',
  'lead_capture_forms',
  'lead_captures', // Extended columns pending type regeneration
] as const;

export type UntypedTable = typeof UNTYPED_TABLES[number];
