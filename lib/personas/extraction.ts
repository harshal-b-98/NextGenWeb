/**
 * Persona Extraction Agent
 *
 * Extracts and generates persona profiles from knowledge base content
 * using LLM analysis.
 */

import { createClient } from '@/lib/supabase/server';
import { complete } from '@/lib/ai/client';
import type {
  Persona,
  PersonaSignal,
  SignalCluster,
  PersonaExtractionResult,
  CreatePersonaInput,
  DetectionRule,
  CommunicationStyle,
  BuyerJourneyStage,
  ContentPreference,
} from './types';

/**
 * Database entity record
 */
interface DbEntity {
  id: string;
  workspace_id: string;
  knowledge_item_id: string;
  entity_type: string;
  name: string;
  description: string | null;
  confidence: number;
  source_chunk_ids: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Persona extraction options
 */
export interface ExtractionOptions {
  maxPersonas?: number;
  minConfidence?: number;
  includeDetectionRules?: boolean;
  documentIds?: string[];
}

/**
 * Extract personas from workspace knowledge base
 */
export async function extractPersonas(
  workspaceId: string,
  options: ExtractionOptions = {}
): Promise<PersonaExtractionResult> {
  const startTime = Date.now();
  const {
    maxPersonas = 5,
    minConfidence = 0.6,
    includeDetectionRules = true,
    documentIds,
  } = options;

  const supabase = await createClient();

  // Fetch knowledge entities from the workspace
  let query = supabase
    .from('knowledge_entities')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('confidence', { ascending: false })
    .limit(200);

  if (documentIds && documentIds.length > 0) {
    query = query.in('knowledge_item_id', documentIds);
  }

  const { data: entities, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch entities: ${error.message}`);
  }

  if (!entities || entities.length === 0) {
    return {
      personas: [],
      signals: [],
      clusters: [],
      tokensUsed: 0,
      processingTime: Date.now() - startTime,
    };
  }

  // Extract persona signals from entities
  const signals = await extractPersonaSignals(entities as DbEntity[]);

  // Cluster signals into persona groups
  const clusters = clusterSignals(signals, maxPersonas);

  // Generate persona profiles from clusters
  const personas: Persona[] = [];
  let totalTokens = 0;

  for (const cluster of clusters) {
    if (cluster.signals.length < 2) continue;

    const { persona, tokensUsed } = await generatePersonaProfile(
      workspaceId,
      cluster,
      includeDetectionRules
    );

    if (persona.confidenceScore >= minConfidence) {
      personas.push(persona);
    }
    totalTokens += tokensUsed;
  }

  return {
    personas,
    signals,
    clusters,
    tokensUsed: totalTokens,
    processingTime: Date.now() - startTime,
  };
}

/**
 * Extract persona signals from entities
 */
async function extractPersonaSignals(entities: DbEntity[]): Promise<PersonaSignal[]> {
  const signals: PersonaSignal[] = [];

  // Group entities by type for analysis (using entity_type from DB schema)
  const benefitEntities = entities.filter(e => e.entity_type === 'benefit');
  const useCaseEntities = entities.filter(e => e.entity_type === 'use_case');
  const testimonialEntities = entities.filter(e => e.entity_type === 'testimonial');
  const featureEntities = entities.filter(e => e.entity_type === 'feature');

  // Extract signals from benefits (indicate goals)
  for (const entity of benefitEntities) {
    signals.push({
      type: 'goal',
      value: entity.name,
      confidence: entity.confidence,
      sourceChunkIds: entity.source_chunk_ids,
      context: entity.description ?? undefined,
    });
  }

  // Extract signals from use cases (indicate industry/role)
  for (const entity of useCaseEntities) {
    const metadata = entity.metadata as { industry?: string; scenario?: string } | undefined;
    if (metadata?.industry) {
      signals.push({
        type: 'industry',
        value: metadata.industry,
        confidence: entity.confidence,
        sourceChunkIds: entity.source_chunk_ids,
        context: metadata.scenario,
      });
    }
    signals.push({
      type: 'behavior',
      value: entity.name,
      confidence: entity.confidence,
      sourceChunkIds: entity.source_chunk_ids,
      context: entity.description ?? undefined,
    });
  }

  // Extract signals from testimonials (indicate roles and pain points)
  for (const entity of testimonialEntities) {
    const metadata = entity.metadata as { role?: string; company?: string } | undefined;
    if (metadata?.role) {
      signals.push({
        type: 'role',
        value: metadata.role,
        confidence: entity.confidence,
        sourceChunkIds: entity.source_chunk_ids,
        context: metadata.company,
      });
    }
  }

  // Extract signals from features (indicate preferences)
  for (const entity of featureEntities) {
    signals.push({
      type: 'preference',
      value: entity.name,
      confidence: entity.confidence,
      sourceChunkIds: entity.source_chunk_ids,
      context: entity.description ?? undefined,
    });
  }

  return signals;
}

/**
 * Cluster signals into persona groups
 */
function clusterSignals(signals: PersonaSignal[], maxClusters: number): SignalCluster[] {
  if (signals.length === 0) return [];

  // Simple clustering based on signal types and semantic similarity
  const clusters: SignalCluster[] = [];
  const usedSignals = new Set<number>();

  // Group by dominant signal type first
  const signalsByType = new Map<string, PersonaSignal[]>();
  signals.forEach(signal => {
    const existing = signalsByType.get(signal.type) || [];
    existing.push(signal);
    signalsByType.set(signal.type, existing);
  });

  // Create initial clusters from role signals
  const roleSignals = signalsByType.get('role') || [];
  for (const roleSignal of roleSignals.slice(0, maxClusters)) {
    clusters.push({
      id: `cluster-${clusters.length + 1}`,
      signals: [roleSignal],
      dominantType: 'role',
      cohesion: roleSignal.confidence,
    });
    usedSignals.add(signals.indexOf(roleSignal));
  }

  // If no role signals, create clusters from industry signals
  if (clusters.length === 0) {
    const industrySignals = signalsByType.get('industry') || [];
    for (const industrySignal of industrySignals.slice(0, maxClusters)) {
      clusters.push({
        id: `cluster-${clusters.length + 1}`,
        signals: [industrySignal],
        dominantType: 'industry',
        cohesion: industrySignal.confidence,
      });
      usedSignals.add(signals.indexOf(industrySignal));
    }
  }

  // If still no clusters, create from goals
  if (clusters.length === 0) {
    const goalSignals = signalsByType.get('goal') || [];
    for (const goalSignal of goalSignals.slice(0, maxClusters)) {
      clusters.push({
        id: `cluster-${clusters.length + 1}`,
        signals: [goalSignal],
        dominantType: 'goal',
        cohesion: goalSignal.confidence,
      });
      usedSignals.add(signals.indexOf(goalSignal));
    }
  }

  // Assign remaining signals to closest cluster
  for (let i = 0; i < signals.length; i++) {
    if (usedSignals.has(i)) continue;

    const signal = signals[i];
    let bestCluster: SignalCluster | null = null;
    let bestScore = 0;

    for (const cluster of clusters) {
      const score = calculateSignalClusterAffinity(signal, cluster);
      if (score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    }

    if (bestCluster && bestScore > 0.3) {
      bestCluster.signals.push(signal);
      bestCluster.cohesion = calculateClusterCohesion(bestCluster.signals);
    }
  }

  // Ensure we have at least one cluster
  if (clusters.length === 0 && signals.length > 0) {
    clusters.push({
      id: 'cluster-1',
      signals: signals.slice(0, Math.min(10, signals.length)),
      dominantType: signals[0].type,
      cohesion: 0.5,
    });
  }

  return clusters.sort((a, b) => b.cohesion - a.cohesion);
}

/**
 * Calculate affinity between a signal and a cluster
 */
function calculateSignalClusterAffinity(
  signal: PersonaSignal,
  cluster: SignalCluster
): number {
  // Type matching
  const typeMatch = cluster.signals.some(s => s.type === signal.type) ? 0.3 : 0;

  // Context similarity (simple word overlap)
  let contextSimilarity = 0;
  if (signal.context) {
    const signalWords = new Set(signal.context.toLowerCase().split(/\s+/));
    for (const clusterSignal of cluster.signals) {
      if (clusterSignal.context) {
        const clusterWords = clusterSignal.context.toLowerCase().split(/\s+/);
        const overlap = clusterWords.filter(w => signalWords.has(w)).length;
        contextSimilarity = Math.max(
          contextSimilarity,
          overlap / Math.max(signalWords.size, clusterWords.length)
        );
      }
    }
  }

  return typeMatch + contextSimilarity * 0.7;
}

/**
 * Calculate cluster cohesion
 */
function calculateClusterCohesion(signals: PersonaSignal[]): number {
  if (signals.length <= 1) return signals[0]?.confidence || 0;

  const avgConfidence =
    signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;

  // Type diversity penalty
  const types = new Set(signals.map(s => s.type));
  const typeDiversity = types.size / signals.length;

  return avgConfidence * (1 - typeDiversity * 0.2);
}

/**
 * Generate persona profile from signal cluster
 */
async function generatePersonaProfile(
  workspaceId: string,
  cluster: SignalCluster,
  includeDetectionRules: boolean
): Promise<{ persona: Persona; tokensUsed: number }> {
  const signalSummary = cluster.signals
    .map(s => `- ${s.type}: ${s.value}${s.context ? ` (${s.context})` : ''}`)
    .join('\n');

  const prompt = `Based on the following signals extracted from product documentation, create a detailed buyer persona profile.

Signals:
${signalSummary}

Generate a complete persona including:
1. Name (a realistic persona name like "Technical Tim" or "Marketing Mary")
2. Title/Role (professional title)
3. Industry
4. Company size (startup, small, medium, large, enterprise)
5. Goals (3-5 primary goals)
6. Pain points (3-5 key challenges)
7. Decision criteria (what they consider when evaluating solutions)
8. Objections (common concerns or hesitations)
9. Key metrics they care about
10. Communication style: technical (prefers detailed specs), business (ROI-focused), or executive (high-level overview)
11. Buyer journey stage: awareness, consideration, or decision

Return as JSON with this exact structure:
{
  "name": "string",
  "title": "string",
  "industry": "string",
  "companySize": "string",
  "goals": ["string"],
  "painPoints": ["string"],
  "decisionCriteria": ["string"],
  "objections": ["string"],
  "keyMetrics": ["string"],
  "communicationStyle": "technical" | "business" | "executive",
  "buyerJourneyStage": "awareness" | "consideration" | "decision",
  "confidenceScore": number between 0 and 1
}`;

  const result = await complete({
    messages: [
      { role: 'user', content: prompt },
    ],
    config: {
      temperature: 0.3,
      maxTokens: 1500,
    },
  });

  let personaData: {
    name: string;
    title: string;
    industry?: string;
    companySize?: string;
    goals: string[];
    painPoints: string[];
    decisionCriteria: string[];
    objections: string[];
    keyMetrics: string[];
    communicationStyle: CommunicationStyle;
    buyerJourneyStage: BuyerJourneyStage;
    confidenceScore: number;
  };

  try {
    // Extract JSON from response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    personaData = JSON.parse(jsonMatch[0]);
  } catch {
    // Fallback persona
    personaData = {
      name: 'Generic Prospect',
      title: 'Decision Maker',
      goals: cluster.signals.filter(s => s.type === 'goal').map(s => s.value),
      painPoints: cluster.signals.filter(s => s.type === 'pain_point').map(s => s.value),
      decisionCriteria: [],
      objections: [],
      keyMetrics: [],
      communicationStyle: 'business',
      buyerJourneyStage: 'consideration',
      confidenceScore: 0.5,
    };
  }

  // Generate detection rules if requested
  let detectionRules: DetectionRule[] = [];
  if (includeDetectionRules) {
    detectionRules = generateDetectionRules(personaData);
  }

  const now = new Date().toISOString();
  const persona: Persona = {
    id: crypto.randomUUID(),
    workspaceId,
    name: personaData.name,
    title: personaData.title,
    industry: personaData.industry,
    companySize: personaData.companySize,
    goals: personaData.goals || [],
    painPoints: personaData.painPoints || [],
    decisionCriteria: personaData.decisionCriteria || [],
    objections: personaData.objections || [],
    keyMetrics: personaData.keyMetrics || [],
    communicationStyle: personaData.communicationStyle || 'business',
    buyerJourneyStage: personaData.buyerJourneyStage || 'consideration',
    detectionRules,
    relevantKnowledgeIds: [],
    preferredContentTypes: getPreferredContentTypes(personaData.communicationStyle),
    contentPreferences: [],
    isActive: true,
    isPrimary: false,
    aiGenerated: true,
    confidenceScore: personaData.confidenceScore || cluster.cohesion,
    createdAt: now,
    updatedAt: now,
  };

  return {
    persona,
    tokensUsed: result.tokensUsed || 0,
  };
}

/**
 * Generate detection rules based on persona characteristics
 */
function generateDetectionRules(personaData: {
  communicationStyle: CommunicationStyle;
  buyerJourneyStage: BuyerJourneyStage;
  industry?: string;
  goals?: string[];
}): DetectionRule[] {
  const rules: DetectionRule[] = [];

  // Communication style rules
  if (personaData.communicationStyle === 'technical') {
    rules.push({
      id: crypto.randomUUID(),
      type: 'click_pattern',
      condition: 'clicked_technical_docs',
      weight: 0.8,
      description: 'User clicked on technical documentation',
    });
    rules.push({
      id: crypto.randomUUID(),
      type: 'time_on_page',
      condition: 'time_on_specs_gt_60',
      value: '60',
      weight: 0.6,
      description: 'Spent more than 60 seconds on specs/technical pages',
    });
  } else if (personaData.communicationStyle === 'executive') {
    rules.push({
      id: crypto.randomUUID(),
      type: 'scroll_behavior',
      condition: 'quick_scan_pattern',
      weight: 0.5,
      description: 'Quick scanning behavior (fast scroll)',
    });
    rules.push({
      id: crypto.randomUUID(),
      type: 'click_pattern',
      condition: 'clicked_case_studies',
      weight: 0.7,
      description: 'User clicked on case studies or ROI content',
    });
  }

  // Buyer journey rules
  if (personaData.buyerJourneyStage === 'awareness') {
    rules.push({
      id: crypto.randomUUID(),
      type: 'page_sequence',
      condition: 'visited_educational_content',
      weight: 0.6,
      description: 'Visited educational/informational content first',
    });
  } else if (personaData.buyerJourneyStage === 'decision') {
    rules.push({
      id: crypto.randomUUID(),
      type: 'click_pattern',
      condition: 'clicked_pricing',
      weight: 0.8,
      description: 'User clicked on pricing page',
    });
    rules.push({
      id: crypto.randomUUID(),
      type: 'content_interaction',
      condition: 'interacted_with_comparison',
      weight: 0.7,
      description: 'Interacted with comparison or feature matrix',
    });
  }

  // Industry-based rules
  if (personaData.industry) {
    rules.push({
      id: crypto.randomUUID(),
      type: 'referrer',
      condition: `from_${personaData.industry.toLowerCase().replace(/\s+/g, '_')}_site`,
      weight: 0.4,
      description: `Referred from ${personaData.industry} related site`,
    });
  }

  return rules;
}

/**
 * Get preferred content types based on communication style
 */
function getPreferredContentTypes(style: CommunicationStyle): string[] {
  switch (style) {
    case 'technical':
      return ['feature', 'integration', 'process_step', 'faq'];
    case 'executive':
      return ['benefit', 'testimonial', 'statistic', 'use_case'];
    case 'business':
    default:
      return ['benefit', 'feature', 'pricing', 'testimonial'];
  }
}

/**
 * Save personas to database
 */
export async function savePersonas(personas: Persona[]): Promise<Persona[]> {
  if (personas.length === 0) return [];

  const supabase = await createClient();

  const personaRecords = personas.map(p => ({
    id: p.id,
    workspace_id: p.workspaceId,
    name: p.name,
    title: p.title,
    avatar_url: p.avatarUrl,
    industry: p.industry,
    company_size: p.companySize,
    location: p.location,
    goals: p.goals,
    pain_points: p.painPoints,
    decision_criteria: p.decisionCriteria,
    objections: p.objections,
    communication_style: p.communicationStyle,
    buyer_journey_stage: p.buyerJourneyStage,
    detection_rules: JSON.parse(JSON.stringify(p.detectionRules)) as unknown as import('@/types/database').Json,
    relevant_knowledge_ids: p.relevantKnowledgeIds,
    preferred_content_types: p.preferredContentTypes,
    is_active: p.isActive,
    is_primary: p.isPrimary,
    ai_generated: p.aiGenerated,
    confidence_score: p.confidenceScore,
  }));

  const { data, error } = await supabase
    .from('personas')
    .upsert(personaRecords)
    .select();

  if (error) {
    throw new Error(`Failed to save personas: ${error.message}`);
  }

  return data as unknown as Persona[];
}

/**
 * Create a persona manually
 */
export async function createPersona(input: CreatePersonaInput): Promise<Persona> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const personaRecord = {
    id: crypto.randomUUID(),
    workspace_id: input.workspaceId,
    name: input.name,
    title: input.title,
    avatar_url: input.avatarUrl,
    industry: input.industry,
    company_size: input.companySize,
    location: input.location,
    goals: input.goals,
    pain_points: input.painPoints,
    decision_criteria: input.decisionCriteria || [],
    objections: input.objections || [],
    communication_style: input.communicationStyle,
    buyer_journey_stage: input.buyerJourneyStage,
    detection_rules: JSON.parse(JSON.stringify(input.detectionRules || [])) as unknown as import('@/types/database').Json,
    relevant_knowledge_ids: [],
    preferred_content_types: getPreferredContentTypes(input.communicationStyle),
    is_active: true,
    is_primary: false,
    ai_generated: input.aiGenerated || false,
    confidence_score: input.confidenceScore || 1.0,
  };

  const { data, error } = await supabase
    .from('personas')
    .insert(personaRecord)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create persona: ${error.message}`);
  }

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    name: data.name,
    title: data.title ?? '',
    avatarUrl: data.avatar_url ?? undefined,
    industry: data.industry ?? undefined,
    companySize: data.company_size ?? undefined,
    location: data.location ?? undefined,
    goals: data.goals,
    painPoints: data.pain_points,
    decisionCriteria: data.decision_criteria,
    objections: data.objections,
    keyMetrics: data.key_metrics ?? [],
    communicationStyle: data.communication_style,
    buyerJourneyStage: data.buyer_journey_stage,
    detectionRules: (data.detection_rules ?? []) as unknown as DetectionRule[],
    relevantKnowledgeIds: data.relevant_knowledge_ids,
    preferredContentTypes: data.preferred_content_types,
    contentPreferences: (data.content_preferences ?? []) as unknown as ContentPreference[],
    isActive: data.is_active,
    isPrimary: data.is_primary,
    aiGenerated: data.ai_generated,
    confidenceScore: data.confidence_score,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get personas for a workspace
 */
export async function getPersonas(
  workspaceId: string,
  options: { activeOnly?: boolean } = {}
): Promise<Persona[]> {
  const supabase = await createClient();

  let query = supabase
    .from('personas')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('is_primary', { ascending: false })
    .order('confidence_score', { ascending: false });

  if (options.activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch personas: ${error.message}`);
  }

  return (data || []).map(p => ({
    id: p.id,
    workspaceId: p.workspace_id,
    name: p.name,
    title: p.title ?? '',
    avatarUrl: p.avatar_url ?? undefined,
    industry: p.industry ?? undefined,
    companySize: p.company_size ?? undefined,
    location: p.location ?? undefined,
    goals: p.goals || [],
    painPoints: p.pain_points || [],
    decisionCriteria: p.decision_criteria || [],
    objections: p.objections || [],
    keyMetrics: p.key_metrics ?? [],
    communicationStyle: p.communication_style as CommunicationStyle,
    buyerJourneyStage: p.buyer_journey_stage as BuyerJourneyStage,
    detectionRules: (p.detection_rules ?? []) as unknown as DetectionRule[],
    relevantKnowledgeIds: p.relevant_knowledge_ids || [],
    preferredContentTypes: p.preferred_content_types || [],
    contentPreferences: (p.content_preferences ?? []) as unknown as ContentPreference[],
    isActive: p.is_active,
    isPrimary: p.is_primary,
    aiGenerated: p.ai_generated,
    confidenceScore: p.confidence_score,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
}

/**
 * Delete a persona
 */
export async function deletePersona(personaId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('personas').delete().eq('id', personaId);

  if (error) {
    throw new Error(`Failed to delete persona: ${error.message}`);
  }
}
