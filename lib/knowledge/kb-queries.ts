/**
 * Knowledge Base Queries
 *
 * Story 7.3: KB-Grounded Global Components
 *
 * Functions for querying entity data from the knowledge base
 * to populate headers, footers, navigation, and other global components.
 */

import { createClient } from '@/lib/supabase/server';
import type { EntityType } from '@/lib/ai/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Company information from KB
 */
export interface KBCompanyInfo {
  name?: string;
  legalName?: string;
  shortName?: string;
  logoUrl?: string;
  tagline?: string;
  description?: string;
  foundedYear?: string;
  industry?: string;
  missionText?: string;
  visionText?: string;
  values?: string[];
  confidence: number;
  sourceEntityIds: string[];
}

/**
 * Social link from KB
 */
export interface KBSocialLink {
  id: string;
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'other';
  url: string;
  handle?: string;
  confidence: number;
}

/**
 * Contact information from KB
 */
export interface KBContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  confidence: number;
  sourceEntityIds: string[];
}

/**
 * Navigation category from KB
 */
export interface KBNavCategory {
  id: string;
  category: string;
  subcategories?: string[];
  priority?: number;
  confidence: number;
}

/**
 * Brand voice from KB
 */
export interface KBBrandVoice {
  tone: 'professional' | 'casual' | 'friendly' | 'bold' | 'technical';
  traits?: string[];
  avoidWords?: string[];
  confidence: number;
  sourceEntityIds: string[];
}

/**
 * Combined KB data for global components
 */
export interface KBGlobalComponentData {
  companyInfo: KBCompanyInfo | null;
  socialLinks: KBSocialLink[];
  contactInfo: KBContactInfo | null;
  navCategories: KBNavCategory[];
  brandVoice: KBBrandVoice | null;
  coverage: {
    hasCompanyName: boolean;
    hasTagline: boolean;
    hasDescription: boolean;
    hasSocialLinks: boolean;
    hasContactInfo: boolean;
    hasNavCategories: boolean;
    hasBrandVoice: boolean;
    overallScore: number;
  };
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get company information from KB entities
 */
export async function getCompanyInfo(workspaceId: string): Promise<KBCompanyInfo | null> {
  const supabase = await createClient();

  // Query for company-related entities
  const entityTypes: EntityType[] = [
    'company_name',
    'company_tagline',
    'company_description',
    'mission_statement',
  ];

  const { data: entities, error } = await supabase
    .from('knowledge_entities')
    .select('id, entity_type, name, description, metadata, confidence')
    .eq('workspace_id', workspaceId)
    .in('entity_type', entityTypes)
    .order('confidence', { ascending: false });

  if (error || !entities || entities.length === 0) {
    return null;
  }

  // Build company info from entities
  const companyInfo: KBCompanyInfo = {
    confidence: 0,
    sourceEntityIds: [],
  };

  let totalConfidence = 0;
  let entityCount = 0;

  for (const entity of entities) {
    const metadata = entity.metadata as Record<string, unknown>;
    companyInfo.sourceEntityIds.push(entity.id);

    switch (entity.entity_type) {
      case 'company_name':
        companyInfo.name = entity.name;
        companyInfo.legalName = metadata?.legalName as string;
        companyInfo.shortName = metadata?.shortName as string;
        companyInfo.logoUrl = metadata?.logoUrl as string;
        break;

      case 'company_tagline':
        companyInfo.tagline = metadata?.slogan as string || entity.name;
        break;

      case 'company_description':
        companyInfo.description = metadata?.aboutText as string || entity.description || undefined;
        companyInfo.foundedYear = metadata?.foundedYear as string;
        companyInfo.industry = metadata?.industry as string;
        break;

      case 'mission_statement':
        companyInfo.missionText = metadata?.missionText as string || entity.description || undefined;
        companyInfo.visionText = metadata?.visionText as string;
        companyInfo.values = metadata?.values as string[];
        break;
    }

    totalConfidence += entity.confidence;
    entityCount++;
  }

  companyInfo.confidence = entityCount > 0 ? totalConfidence / entityCount : 0;

  return companyInfo;
}

/**
 * Get social links from KB entities
 */
export async function getSocialLinks(workspaceId: string): Promise<KBSocialLink[]> {
  const supabase = await createClient();

  const { data: entities, error } = await supabase
    .from('knowledge_entities')
    .select('id, name, metadata, confidence')
    .eq('workspace_id', workspaceId)
    .eq('entity_type', 'social_link')
    .order('confidence', { ascending: false });

  if (error || !entities) {
    return [];
  }

  return entities.map((entity) => {
    const metadata = entity.metadata as Record<string, unknown>;
    const platformValue = metadata?.platform as string;
    const validPlatforms = ['linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'other'] as const;
    const platform = validPlatforms.includes(platformValue as typeof validPlatforms[number])
      ? (platformValue as typeof validPlatforms[number])
      : 'other';

    return {
      id: entity.id,
      platform,
      url: (metadata?.url as string) || '',
      handle: metadata?.handle as string,
      confidence: entity.confidence,
    };
  });
}

/**
 * Get contact information from KB entities
 */
export async function getContactInfo(workspaceId: string): Promise<KBContactInfo | null> {
  const supabase = await createClient();

  const { data: entities, error } = await supabase
    .from('knowledge_entities')
    .select('id, metadata, confidence')
    .eq('workspace_id', workspaceId)
    .eq('entity_type', 'contact')
    .order('confidence', { ascending: false })
    .limit(1);

  if (error || !entities || entities.length === 0) {
    return null;
  }

  const entity = entities[0];
  const metadata = entity.metadata as Record<string, unknown>;

  return {
    email: metadata?.email as string,
    phone: metadata?.phone as string,
    address: metadata?.address as string,
    confidence: entity.confidence,
    sourceEntityIds: [entity.id],
  };
}

/**
 * Get navigation categories from KB entities
 */
export async function getNavCategories(workspaceId: string): Promise<KBNavCategory[]> {
  const supabase = await createClient();

  const { data: entities, error } = await supabase
    .from('knowledge_entities')
    .select('id, name, metadata, confidence')
    .eq('workspace_id', workspaceId)
    .eq('entity_type', 'nav_category')
    .order('confidence', { ascending: false });

  if (error || !entities) {
    return [];
  }

  return entities
    .map((entity) => {
      const metadata = entity.metadata as Record<string, unknown>;
      return {
        id: entity.id,
        category: (metadata?.category as string) || entity.name,
        subcategories: metadata?.subcategories as string[],
        priority: metadata?.priority as number,
        confidence: entity.confidence,
      };
    })
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

/**
 * Get brand voice from KB entities
 */
export async function getBrandVoice(workspaceId: string): Promise<KBBrandVoice | null> {
  const supabase = await createClient();

  const { data: entities, error } = await supabase
    .from('knowledge_entities')
    .select('id, metadata, confidence')
    .eq('workspace_id', workspaceId)
    .eq('entity_type', 'brand_voice')
    .order('confidence', { ascending: false })
    .limit(1);

  if (error || !entities || entities.length === 0) {
    return null;
  }

  const entity = entities[0];
  const metadata = entity.metadata as Record<string, unknown>;
  const toneValue = metadata?.tone as string;
  const validTones = ['professional', 'casual', 'friendly', 'bold', 'technical'] as const;
  const tone = validTones.includes(toneValue as typeof validTones[number])
    ? (toneValue as typeof validTones[number])
    : 'professional';

  return {
    tone,
    traits: metadata?.traits as string[],
    avoidWords: metadata?.avoidWords as string[],
    confidence: entity.confidence,
    sourceEntityIds: [entity.id],
  };
}

/**
 * Get all KB data needed for global components in one call
 */
export async function getKBGlobalComponentData(workspaceId: string): Promise<KBGlobalComponentData> {
  // Fetch all data in parallel for efficiency
  const [companyInfo, socialLinks, contactInfo, navCategories, brandVoice] = await Promise.all([
    getCompanyInfo(workspaceId),
    getSocialLinks(workspaceId),
    getContactInfo(workspaceId),
    getNavCategories(workspaceId),
    getBrandVoice(workspaceId),
  ]);

  // Calculate coverage
  const hasCompanyName = !!companyInfo?.name;
  const hasTagline = !!companyInfo?.tagline;
  const hasDescription = !!companyInfo?.description;
  const hasSocialLinks = socialLinks.length > 0;
  const hasContactInfo = !!contactInfo?.email || !!contactInfo?.phone;
  const hasNavCategories = navCategories.length > 0;
  const hasBrandVoice = !!brandVoice;

  // Weighted coverage score
  const weights = {
    companyName: 25, // Critical
    tagline: 15,
    description: 15,
    socialLinks: 10,
    contactInfo: 10,
    navCategories: 15,
    brandVoice: 10,
  };

  const score =
    (hasCompanyName ? weights.companyName : 0) +
    (hasTagline ? weights.tagline : 0) +
    (hasDescription ? weights.description : 0) +
    (hasSocialLinks ? weights.socialLinks : 0) +
    (hasContactInfo ? weights.contactInfo : 0) +
    (hasNavCategories ? weights.navCategories : 0) +
    (hasBrandVoice ? weights.brandVoice : 0);

  return {
    companyInfo,
    socialLinks,
    contactInfo,
    navCategories,
    brandVoice,
    coverage: {
      hasCompanyName,
      hasTagline,
      hasDescription,
      hasSocialLinks,
      hasContactInfo,
      hasNavCategories,
      hasBrandVoice,
      overallScore: score,
    },
  };
}

/**
 * Get entity IDs used in global components (for traceability)
 */
export function getSourceEntityIds(data: KBGlobalComponentData): string[] {
  const ids: string[] = [];

  if (data.companyInfo) {
    ids.push(...data.companyInfo.sourceEntityIds);
  }

  ids.push(...data.socialLinks.map((s) => s.id));

  if (data.contactInfo) {
    ids.push(...data.contactInfo.sourceEntityIds);
  }

  ids.push(...data.navCategories.map((n) => n.id));

  if (data.brandVoice) {
    ids.push(...data.brandVoice.sourceEntityIds);
  }

  return [...new Set(ids)]; // Deduplicate
}
