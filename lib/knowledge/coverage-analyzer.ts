/**
 * KB Coverage Analyzer
 *
 * Analyzes what content exists in the knowledge base and identifies gaps
 * for website generation. Provides suggestions for missing content.
 */

import { getEntityCountsByType, getEntitiesForWorkspace, type EntityRecord } from './entities/store';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Entity type requirements for website generation
 */
export interface EntityTypeRequirement {
  entityType: string;
  minimumRecommended: number;
  importance: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  sectionUsage: string[]; // Which website sections use this type
  examplePrompt: string;  // Question to ask user for this content
}

/**
 * Coverage status for a single entity type
 */
export interface EntityTypeCoverage {
  entityType: string;
  count: number;
  examples: string[];
  adequacy: 'sufficient' | 'limited' | 'missing';
  minimumRecommended: number;
  importance: 'critical' | 'high' | 'medium' | 'low';
  sectionUsage: string[];
}

/**
 * Suggestion for improving KB coverage
 */
export interface KBSuggestion {
  id: string;
  entityType: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  examplePrompt: string;
  priority: number; // Lower = higher priority
}

/**
 * Full KB coverage report
 */
export interface KBCoverageReport {
  workspaceId: string;
  totalEntities: number;
  totalDocuments: number;
  coverageByType: Record<string, EntityTypeCoverage>;
  missingCritical: string[];
  missingHigh: string[];
  overallScore: number; // 0-100
  suggestions: KBSuggestion[];
  generatedAt: string;
}

// ============================================================================
// REQUIREMENTS DEFINITION
// ============================================================================

/**
 * Define minimum requirements for a well-structured marketing website
 */
export const ENTITY_TYPE_REQUIREMENTS: EntityTypeRequirement[] = [
  // Critical - Website can't function well without these
  {
    entityType: 'company_name',
    minimumRecommended: 1,
    importance: 'critical',
    description: 'Company or organization name',
    sectionUsage: ['header', 'footer', 'hero', 'about'],
    examplePrompt: 'What is your company or organization name?',
  },
  {
    entityType: 'company_description',
    minimumRecommended: 1,
    importance: 'critical',
    description: 'About the company, what it does',
    sectionUsage: ['hero', 'about', 'footer'],
    examplePrompt: 'Describe your company in 2-3 sentences. What does it do?',
  },
  {
    entityType: 'product',
    minimumRecommended: 1,
    importance: 'critical',
    description: 'Main products or services offered',
    sectionUsage: ['hero', 'features', 'pricing', 'comparison'],
    examplePrompt: 'What products or services do you offer?',
  },

  // High importance - Significantly improves website quality
  {
    entityType: 'feature',
    minimumRecommended: 3,
    importance: 'high',
    description: 'Product/service features',
    sectionUsage: ['features', 'hero', 'comparison'],
    examplePrompt: 'What are the key features of your product/service?',
  },
  {
    entityType: 'benefit',
    minimumRecommended: 3,
    importance: 'high',
    description: 'Benefits for customers',
    sectionUsage: ['features', 'hero', 'cta'],
    examplePrompt: 'What benefits do customers get from your product/service?',
  },
  {
    entityType: 'company_tagline',
    minimumRecommended: 1,
    importance: 'high',
    description: 'Short catchy tagline or slogan',
    sectionUsage: ['header', 'hero', 'cta'],
    examplePrompt: 'Do you have a company tagline or slogan?',
  },
  {
    entityType: 'contact',
    minimumRecommended: 1,
    importance: 'high',
    description: 'Contact information (email, phone, address)',
    sectionUsage: ['header', 'footer', 'contact', 'cta'],
    examplePrompt: 'What is your contact information (email, phone, address)?',
  },
  {
    entityType: 'cta',
    minimumRecommended: 1,
    importance: 'high',
    description: 'Call-to-action messages',
    sectionUsage: ['hero', 'cta', 'pricing'],
    examplePrompt: 'What action do you want visitors to take? (e.g., "Get Started", "Contact Us")',
  },

  // Medium importance - Adds credibility and depth
  {
    entityType: 'testimonial',
    minimumRecommended: 3,
    importance: 'medium',
    description: 'Customer testimonials and reviews',
    sectionUsage: ['testimonials', 'social-proof'],
    examplePrompt: 'Do you have customer testimonials or reviews you can share?',
  },
  {
    entityType: 'pricing',
    minimumRecommended: 1,
    importance: 'medium',
    description: 'Pricing information',
    sectionUsage: ['pricing', 'comparison'],
    examplePrompt: 'What is your pricing structure?',
  },
  {
    entityType: 'statistic',
    minimumRecommended: 2,
    importance: 'medium',
    description: 'Key metrics and statistics',
    sectionUsage: ['stats', 'hero', 'social-proof'],
    examplePrompt: 'Do you have any impressive statistics? (e.g., customers served, years in business)',
  },
  {
    entityType: 'faq',
    minimumRecommended: 3,
    importance: 'medium',
    description: 'Frequently asked questions',
    sectionUsage: ['faq', 'content'],
    examplePrompt: 'What questions do customers frequently ask?',
  },
  {
    entityType: 'social_link',
    minimumRecommended: 2,
    importance: 'medium',
    description: 'Social media profile links',
    sectionUsage: ['header', 'footer'],
    examplePrompt: 'What are your social media profile URLs?',
  },

  // Low importance - Nice to have
  {
    entityType: 'use_case',
    minimumRecommended: 2,
    importance: 'low',
    description: 'Use cases and scenarios',
    sectionUsage: ['use-cases', 'features'],
    examplePrompt: 'What are some common use cases for your product?',
  },
  {
    entityType: 'process_step',
    minimumRecommended: 3,
    importance: 'low',
    description: 'Process or workflow steps',
    sectionUsage: ['how-it-works', 'timeline'],
    examplePrompt: 'Can you describe your process in steps? (e.g., how to get started)',
  },
  {
    entityType: 'integration',
    minimumRecommended: 2,
    importance: 'low',
    description: 'Integrations with other platforms',
    sectionUsage: ['integrations', 'features'],
    examplePrompt: 'What tools or platforms do you integrate with?',
  },
  {
    entityType: 'company',
    minimumRecommended: 3,
    importance: 'low',
    description: 'Partner or client companies (for logo cloud)',
    sectionUsage: ['logo-cloud', 'social-proof'],
    examplePrompt: 'Which notable companies are your customers or partners?',
  },
  {
    entityType: 'person',
    minimumRecommended: 2,
    importance: 'low',
    description: 'Team members or key people',
    sectionUsage: ['team', 'about'],
    examplePrompt: 'Who are the key team members we should highlight?',
  },
  {
    entityType: 'mission_statement',
    minimumRecommended: 1,
    importance: 'low',
    description: 'Company mission or vision',
    sectionUsage: ['about', 'footer'],
    examplePrompt: 'What is your company\'s mission or vision statement?',
  },
  {
    entityType: 'brand_voice',
    minimumRecommended: 1,
    importance: 'low',
    description: 'Brand tone and voice descriptors',
    sectionUsage: ['all'], // Affects all content generation
    examplePrompt: 'How would you describe your brand voice? (e.g., professional, friendly, innovative)',
  },
  {
    entityType: 'nav_category',
    minimumRecommended: 3,
    importance: 'low',
    description: 'Navigation categories for menu structure',
    sectionUsage: ['header', 'footer'],
    examplePrompt: 'What main categories should appear in your navigation menu?',
  },
];

// ============================================================================
// ANALYZER FUNCTIONS
// ============================================================================

/**
 * Get requirements map for quick lookup
 */
function getRequirementsMap(): Map<string, EntityTypeRequirement> {
  const map = new Map<string, EntityTypeRequirement>();
  for (const req of ENTITY_TYPE_REQUIREMENTS) {
    map.set(req.entityType, req);
  }
  return map;
}

/**
 * Calculate adequacy based on count vs recommended
 */
function calculateAdequacy(
  count: number,
  minimumRecommended: number
): 'sufficient' | 'limited' | 'missing' {
  if (count === 0) return 'missing';
  if (count >= minimumRecommended) return 'sufficient';
  return 'limited';
}

/**
 * Calculate overall coverage score (0-100)
 */
function calculateOverallScore(
  coverageByType: Record<string, EntityTypeCoverage>
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  const importanceWeights = {
    critical: 30,
    high: 20,
    medium: 10,
    low: 5,
  };

  for (const coverage of Object.values(coverageByType)) {
    const weight = importanceWeights[coverage.importance];
    totalWeight += weight;

    // Calculate score for this type (0-1)
    const ratio = Math.min(coverage.count / coverage.minimumRecommended, 1);
    weightedScore += ratio * weight;
  }

  return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
}

/**
 * Generate suggestions based on coverage gaps
 */
function generateSuggestions(
  coverageByType: Record<string, EntityTypeCoverage>
): KBSuggestion[] {
  const suggestions: KBSuggestion[] = [];
  const requirementsMap = getRequirementsMap();

  // Sort by importance and adequacy
  const sortedTypes = Object.entries(coverageByType).sort((a, b) => {
    const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const adequacyOrder = { missing: 0, limited: 1, sufficient: 2 };

    // First by adequacy (missing first)
    const adequacyDiff = adequacyOrder[a[1].adequacy] - adequacyOrder[b[1].adequacy];
    if (adequacyDiff !== 0) return adequacyDiff;

    // Then by importance
    return importanceOrder[a[1].importance] - importanceOrder[b[1].importance];
  });

  let priority = 1;
  for (const [entityType, coverage] of sortedTypes) {
    if (coverage.adequacy === 'sufficient') continue;

    const requirement = requirementsMap.get(entityType);
    if (!requirement) continue;

    const impact = coverage.importance === 'critical' || coverage.importance === 'high'
      ? 'high'
      : coverage.importance === 'medium'
        ? 'medium'
        : 'low';

    const reason = coverage.adequacy === 'missing'
      ? `No ${entityType.replace(/_/g, ' ')} found in your knowledge base`
      : `Only ${coverage.count} ${entityType.replace(/_/g, ' ')}(s) found, ${coverage.minimumRecommended} recommended`;

    suggestions.push({
      id: `suggestion-${entityType}`,
      entityType,
      reason,
      impact,
      examplePrompt: requirement.examplePrompt,
      priority,
    });

    priority++;
  }

  return suggestions;
}

/**
 * Analyze KB coverage for a workspace
 */
export async function analyzeKBCoverage(
  workspaceId: string
): Promise<KBCoverageReport> {
  // Get entity counts by type
  const entityCounts = await getEntityCountsByType(workspaceId);

  // Get sample entities for each type (for examples)
  const entities = await getEntitiesForWorkspace(workspaceId, { limit: 500 });

  // Group entities by type for examples
  const entitiesByType = new Map<string, EntityRecord[]>();
  for (const entity of entities) {
    const existing = entitiesByType.get(entity.entity_type) || [];
    existing.push(entity);
    entitiesByType.set(entity.entity_type, existing);
  }

  // Get requirements map
  const requirementsMap = getRequirementsMap();

  // Build coverage by type
  const coverageByType: Record<string, EntityTypeCoverage> = {};
  const missingCritical: string[] = [];
  const missingHigh: string[] = [];

  for (const requirement of ENTITY_TYPE_REQUIREMENTS) {
    const count = entityCounts[requirement.entityType] || 0;
    const typeEntities = entitiesByType.get(requirement.entityType) || [];
    const examples = typeEntities.slice(0, 3).map(e => e.name);
    const adequacy = calculateAdequacy(count, requirement.minimumRecommended);

    coverageByType[requirement.entityType] = {
      entityType: requirement.entityType,
      count,
      examples,
      adequacy,
      minimumRecommended: requirement.minimumRecommended,
      importance: requirement.importance,
      sectionUsage: requirement.sectionUsage,
    };

    if (adequacy === 'missing') {
      if (requirement.importance === 'critical') {
        missingCritical.push(requirement.entityType);
      } else if (requirement.importance === 'high') {
        missingHigh.push(requirement.entityType);
      }
    }
  }

  // Also include any entity types that exist but aren't in requirements
  for (const [entityType, count] of Object.entries(entityCounts)) {
    if (!coverageByType[entityType]) {
      const typeEntities = entitiesByType.get(entityType) || [];
      const examples = typeEntities.slice(0, 3).map(e => e.name);

      coverageByType[entityType] = {
        entityType,
        count,
        examples,
        adequacy: 'sufficient', // Unknown types are considered sufficient
        minimumRecommended: 0,
        importance: 'low',
        sectionUsage: ['unknown'],
      };
    }
  }

  // Calculate overall score
  const overallScore = calculateOverallScore(coverageByType);

  // Generate suggestions
  const suggestions = generateSuggestions(coverageByType);

  // Count unique documents (estimate from knowledge items)
  const totalDocuments = new Set(entities.map(e => e.knowledge_item_id)).size;

  return {
    workspaceId,
    totalEntities: entities.length,
    totalDocuments,
    coverageByType,
    missingCritical,
    missingHigh,
    overallScore,
    suggestions,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get the minimum requirements for website generation
 */
export function getMinimumRequirements(): EntityTypeRequirement[] {
  return ENTITY_TYPE_REQUIREMENTS;
}

/**
 * Get requirements by importance level
 */
export function getRequirementsByImportance(
  importance: 'critical' | 'high' | 'medium' | 'low'
): EntityTypeRequirement[] {
  return ENTITY_TYPE_REQUIREMENTS.filter(r => r.importance === importance);
}

/**
 * Check if KB has minimum viable content for generation
 */
export async function hasMinimumViableContent(workspaceId: string): Promise<{
  viable: boolean;
  missingCritical: string[];
  score: number;
}> {
  const coverage = await analyzeKBCoverage(workspaceId);

  return {
    viable: coverage.missingCritical.length === 0,
    missingCritical: coverage.missingCritical,
    score: coverage.overallScore,
  };
}

/**
 * Get suggestions for a specific section type
 */
export function getSuggestionsForSection(
  sectionType: string,
  coverage: KBCoverageReport
): KBSuggestion[] {
  const relevantTypes = ENTITY_TYPE_REQUIREMENTS
    .filter(r => r.sectionUsage.includes(sectionType) || r.sectionUsage.includes('all'))
    .map(r => r.entityType);

  return coverage.suggestions.filter(s => relevantTypes.includes(s.entityType));
}

/**
 * Get coverage summary as human-readable text
 */
export function getCoverageSummary(coverage: KBCoverageReport): string {
  const lines: string[] = [];

  lines.push(`Knowledge Base Coverage: ${coverage.overallScore}%`);
  lines.push(`Total Entities: ${coverage.totalEntities}`);
  lines.push(`Documents Processed: ${coverage.totalDocuments}`);
  lines.push('');

  if (coverage.missingCritical.length > 0) {
    lines.push('⚠️ Missing Critical Content:');
    for (const type of coverage.missingCritical) {
      lines.push(`  - ${type.replace(/_/g, ' ')}`);
    }
    lines.push('');
  }

  if (coverage.missingHigh.length > 0) {
    lines.push('📋 Missing High-Priority Content:');
    for (const type of coverage.missingHigh) {
      lines.push(`  - ${type.replace(/_/g, ' ')}`);
    }
    lines.push('');
  }

  if (coverage.suggestions.length > 0) {
    lines.push('💡 Top Suggestions:');
    for (const suggestion of coverage.suggestions.slice(0, 5)) {
      lines.push(`  ${suggestion.priority}. ${suggestion.reason}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Save a coverage snapshot to the database
 */
export async function saveCoverageSnapshot(
  coverage: KBCoverageReport
): Promise<{ id: string }> {
  const { createClient } = await import('@/lib/supabase/server');
  const { untypedFrom } = await import('@/lib/supabase/untyped');

  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const snapshotsTable = await untypedFrom('kb_coverage_snapshots');
  const { data, error } = await snapshotsTable
    .insert({
      workspace_id: coverage.workspaceId,
      coverage_data: JSON.parse(JSON.stringify(coverage)),
      overall_score: coverage.overallScore,
      total_entities: coverage.totalEntities,
      total_documents: coverage.totalDocuments,
      missing_critical: coverage.missingCritical,
      missing_high: coverage.missingHigh,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to save coverage snapshot: ${error.message}`);
  }

  return { id: data.id };
}

/**
 * Get coverage history for a workspace
 */
export async function getCoverageHistory(
  workspaceId: string,
  limit = 10
): Promise<Array<{
  id: string;
  overallScore: number;
  totalEntities: number;
  totalDocuments: number;
  missingCritical: string[];
  missingHigh: string[];
  createdAt: string;
}>> {
  const { untypedFrom } = await import('@/lib/supabase/untyped');

  const snapshotsTable = await untypedFrom('kb_coverage_snapshots');
  const { data, error } = await snapshotsTable
    .select('id, overall_score, total_entities, total_documents, missing_critical, missing_high, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get coverage history: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => ({
    id: row.id,
    overallScore: row.overall_score,
    totalEntities: row.total_entities,
    totalDocuments: row.total_documents,
    missingCritical: row.missing_critical as string[],
    missingHigh: row.missing_high as string[],
    createdAt: row.created_at,
  }));
}

/**
 * Get latest coverage snapshot for a workspace
 */
export async function getLatestCoverageSnapshot(
  workspaceId: string
): Promise<KBCoverageReport | null> {
  const { untypedFrom } = await import('@/lib/supabase/untyped');

  const snapshotsTable = await untypedFrom('kb_coverage_snapshots');
  const { data, error } = await snapshotsTable
    .select('coverage_data')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.coverage_data as KBCoverageReport;
}

/**
 * Save suggestions to the database
 */
export async function saveSuggestions(
  workspaceId: string,
  suggestions: KBSuggestion[]
): Promise<void> {
  const { untypedFrom } = await import('@/lib/supabase/untyped');

  // Delete existing pending suggestions for this workspace
  const suggestionsTable = await untypedFrom('kb_suggestions');
  await suggestionsTable
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending');

  if (suggestions.length === 0) return;

  // Insert new suggestions
  const suggestionsToInsert = suggestions.map(s => ({
    workspace_id: workspaceId,
    entity_type: s.entityType,
    suggestion_text: s.reason,
    example_prompt: s.examplePrompt,
    impact: s.impact,
    priority: s.priority,
    status: 'pending',
  }));

  await suggestionsTable.insert(suggestionsToInsert);
}

/**
 * Get pending suggestions for a workspace
 */
export async function getPendingSuggestions(
  workspaceId: string
): Promise<Array<{
  id: string;
  entityType: string;
  reason: string;
  examplePrompt: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
}>> {
  const { untypedFrom } = await import('@/lib/supabase/untyped');

  const suggestionsTable = await untypedFrom('kb_suggestions');
  const { data, error } = await suggestionsTable
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .order('priority', { ascending: true });

  if (error) {
    throw new Error(`Failed to get suggestions: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => ({
    id: row.id,
    entityType: row.entity_type,
    reason: row.suggestion_text,
    examplePrompt: row.example_prompt,
    impact: row.impact as 'high' | 'medium' | 'low',
    priority: row.priority,
  }));
}

/**
 * Dismiss a suggestion
 */
export async function dismissSuggestion(suggestionId: string): Promise<void> {
  const { createClient } = await import('@/lib/supabase/server');
  const { untypedFrom } = await import('@/lib/supabase/untyped');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const suggestionsTable = await untypedFrom('kb_suggestions');
  await suggestionsTable
    .update({
      status: 'dismissed',
      dismissed_at: new Date().toISOString(),
      dismissed_by: user?.id,
    })
    .eq('id', suggestionId);
}

/**
 * Mark a suggestion as acted upon
 */
export async function markSuggestionActed(suggestionId: string): Promise<void> {
  const { createClient } = await import('@/lib/supabase/server');
  const { untypedFrom } = await import('@/lib/supabase/untyped');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const suggestionsTable = await untypedFrom('kb_suggestions');
  await suggestionsTable
    .update({
      status: 'acted',
      acted_at: new Date().toISOString(),
      acted_by: user?.id,
    })
    .eq('id', suggestionId);
}
