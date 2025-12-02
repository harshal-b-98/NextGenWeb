/**
 * Brand Extraction Agent
 *
 * Extracts brand signals from knowledge base content and generates
 * complete brand systems using LLM analysis.
 */

import { createClient } from '@/lib/supabase/server';
import { complete } from '@/lib/ai/client';
import type {
  BrandSystem,
  BrandSignal,
  BrandExtractionResult,
  BrandGenerationInput,
  BrandColorPalette,
  TypographySystem,
  BrandVoice,
  BrandTone,
  IndustryCategory,
  ColorScale,
} from './types';

/**
 * Options for brand extraction
 */
export interface ExtractionOptions {
  includeColorAnalysis?: boolean;
  includeToneAnalysis?: boolean;
  maxSignals?: number;
}

/**
 * Database entity type
 */
interface DbEntity {
  id: string;
  entity_type: string;
  name: string;
  description: string | null;
  metadata: unknown;
}

/**
 * Extract brand signals and generate a brand system from workspace content
 */
export async function extractBrand(
  workspaceId: string,
  input: BrandGenerationInput,
  options: ExtractionOptions = {}
): Promise<BrandExtractionResult> {
  const startTime = Date.now();
  const supabase = await createClient();

  // Fetch knowledge base entities for brand signal extraction
  const { data: entities, error } = await supabase
    .from('knowledge_entities')
    .select('*')
    .eq('workspace_id', workspaceId)
    .limit(100);

  if (error) {
    throw new Error(`Failed to fetch knowledge entities: ${error.message}`);
  }

  // Extract brand signals from entities
  const signals = await extractBrandSignals(
    (entities || []) as DbEntity[],
    input,
    options.maxSignals || 50
  );

  // Generate brand system using LLM
  const brand = await generateBrandSystem(input, signals);

  return {
    brand,
    signals,
    tokensUsed: 0, // Would be tracked from LLM response
    processingTime: Date.now() - startTime,
  };
}

/**
 * Extract brand signals from knowledge entities
 */
async function extractBrandSignals(
  entities: DbEntity[],
  input: BrandGenerationInput,
  maxSignals: number
): Promise<BrandSignal[]> {
  const signals: BrandSignal[] = [];

  // Extract industry signals
  if (input.industry) {
    signals.push({
      type: 'industry',
      value: input.industry,
      confidence: 1.0,
      source: 'user_input',
    });
  }

  // Extract tone signals from input
  if (input.tone) {
    signals.push({
      type: 'tone',
      value: input.tone,
      confidence: 1.0,
      source: 'user_input',
    });
  }

  // Extract keyword signals
  for (const keyword of input.keywords || []) {
    signals.push({
      type: 'keyword',
      value: keyword,
      confidence: 0.9,
      source: 'user_input',
    });
  }

  // Extract audience signals
  if (input.targetAudience) {
    signals.push({
      type: 'audience',
      value: input.targetAudience,
      confidence: 1.0,
      source: 'user_input',
    });
  }

  // Extract color signals from existing colors
  if (input.existingColors?.primary) {
    signals.push({
      type: 'color',
      value: input.existingColors.primary,
      confidence: 1.0,
      source: 'user_input',
      context: 'primary',
    });
  }

  // Extract signals from knowledge entities
  for (const entity of entities.slice(0, 30)) {
    // Look for industry hints in entity types and names
    if (
      entity.entity_type === 'company' ||
      entity.entity_type === 'organization'
    ) {
      const industryHint = detectIndustryFromEntity(entity);
      if (industryHint && !signals.find(s => s.type === 'industry')) {
        signals.push({
          type: 'industry',
          value: industryHint,
          confidence: 0.7,
          source: entity.id,
          context: entity.name,
        });
      }
    }

    // Extract tone hints from testimonials and descriptions
    if (entity.entity_type === 'testimonial' || entity.entity_type === 'benefit') {
      const toneHint = detectToneFromText(entity.description || entity.name);
      if (toneHint) {
        signals.push({
          type: 'tone',
          value: toneHint,
          confidence: 0.6,
          source: entity.id,
          context: entity.description || entity.name,
        });
      }
    }

    // Extract keywords from features and benefits
    if (entity.entity_type === 'feature' || entity.entity_type === 'benefit') {
      signals.push({
        type: 'keyword',
        value: entity.name,
        confidence: 0.7,
        source: entity.id,
      });
    }
  }

  return signals.slice(0, maxSignals);
}

/**
 * Detect industry from entity content
 */
function detectIndustryFromEntity(entity: DbEntity): IndustryCategory | null {
  const text = `${entity.name} ${entity.description || ''}`.toLowerCase();

  const industryKeywords: Record<IndustryCategory, string[]> = {
    technology: ['software', 'tech', 'digital', 'app', 'platform', 'saas', 'ai', 'cloud'],
    healthcare: ['health', 'medical', 'patient', 'clinic', 'hospital', 'wellness'],
    finance: ['bank', 'finance', 'investment', 'insurance', 'fintech', 'trading'],
    education: ['education', 'learning', 'school', 'university', 'training', 'course'],
    retail: ['shop', 'store', 'ecommerce', 'product', 'retail', 'merchandise'],
    manufacturing: ['manufacturing', 'factory', 'industrial', 'production'],
    professional_services: ['consulting', 'legal', 'accounting', 'advisory'],
    hospitality: ['hotel', 'restaurant', 'travel', 'tourism', 'hospitality'],
    real_estate: ['real estate', 'property', 'housing', 'realty'],
    nonprofit: ['nonprofit', 'charity', 'foundation', 'ngo'],
    entertainment: ['entertainment', 'media', 'gaming', 'music', 'film'],
    creative: ['design', 'creative', 'agency', 'studio', 'art'],
    other: [],
  };

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      return industry as IndustryCategory;
    }
  }

  return null;
}

/**
 * Detect tone from text content
 */
function detectToneFromText(text: string): BrandTone | null {
  const lowerText = text.toLowerCase();

  const toneIndicators: Record<BrandTone, string[]> = {
    professional: ['enterprise', 'business', 'corporate', 'industry-leading'],
    casual: ['easy', 'simple', 'fun', 'everyday'],
    friendly: ['community', 'together', 'family', 'welcome', 'support'],
    authoritative: ['expert', 'leader', 'trusted', 'proven', 'established'],
    playful: ['exciting', 'adventure', 'creative', 'innovative'],
    luxurious: ['premium', 'exclusive', 'luxury', 'elite', 'finest'],
    technical: ['advanced', 'powerful', 'precision', 'engineered'],
    warm: ['caring', 'personal', 'heart', 'passion', 'dedicated'],
  };

  for (const [tone, indicators] of Object.entries(toneIndicators)) {
    if (indicators.some(ind => lowerText.includes(ind))) {
      return tone as BrandTone;
    }
  }

  return null;
}

/**
 * Generate a complete brand system using LLM
 */
async function generateBrandSystem(
  input: BrandGenerationInput,
  signals: BrandSignal[]
): Promise<BrandSystem> {
  const now = new Date().toISOString();

  // Consolidate signals for prompt
  const industrySignal = signals.find(s => s.type === 'industry');
  const toneSignals = signals.filter(s => s.type === 'tone');
  const keywordSignals = signals.filter(s => s.type === 'keyword');
  const audienceSignal = signals.find(s => s.type === 'audience');

  const dominantTone = getMostFrequentTone(toneSignals) || input.tone || 'professional';
  const industry = (industrySignal?.value as IndustryCategory) || input.industry || 'technology';

  const prompt = `You are a brand design expert. Generate a complete brand system for the following business:

Business Name: ${input.businessName}
Industry: ${industry}
Tone: ${dominantTone}
Target Audience: ${audienceSignal?.value || input.targetAudience || 'General audience'}
Keywords: ${keywordSignals.map(s => s.value).join(', ') || 'modern, professional'}

${input.existingColors?.primary ? `Existing Primary Color: ${input.existingColors.primary}` : ''}
${input.existingFonts?.heading ? `Preferred Heading Font: ${input.existingFonts.heading}` : ''}

Generate a complete brand system as a JSON object with the following structure:
{
  "colors": {
    "primary": { "50": "#hex", "100": "#hex", ..., "900": "#hex" },
    "secondary": { "50": "#hex", ..., "900": "#hex" },
    "accent": { "50": "#hex", ..., "900": "#hex" },
    "neutral": { "50": "#hex", ..., "900": "#hex" }
  },
  "typography": {
    "heading": "Font Name",
    "body": "Font Name",
    "mono": "Font Name"
  },
  "voice": {
    "tone": "${dominantTone}",
    "formality": "formal|neutral|informal",
    "personality": ["trait1", "trait2", "trait3"],
    "keywords": ["keyword1", "keyword2"]
  }
}

Return ONLY the JSON object, no explanation.`;

  try {
    const result = await complete({
      messages: [{ role: 'user', content: prompt }],
      config: {
        temperature: 0.7,
        maxTokens: 2000,
      },
    });

    const content = result.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return buildBrandSystemFromLLMResponse(input, parsed, industry, now);
    }
  } catch (error) {
    console.error('Error generating brand with LLM:', error);
  }

  // Fallback to default brand generation
  return generateDefaultBrandSystem(input, industry, dominantTone, now);
}

/**
 * Get the most frequent tone from signals
 */
function getMostFrequentTone(signals: BrandSignal[]): BrandTone | null {
  if (signals.length === 0) return null;

  const counts = signals.reduce(
    (acc, s) => {
      acc[s.value] = (acc[s.value] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] as BrandTone;
}

/**
 * Build brand system from LLM response
 */
function buildBrandSystemFromLLMResponse(
  input: BrandGenerationInput,
  llmResponse: {
    colors?: {
      primary?: Partial<ColorScale>;
      secondary?: Partial<ColorScale>;
      accent?: Partial<ColorScale>;
      neutral?: Partial<ColorScale>;
    };
    typography?: {
      heading?: string;
      body?: string;
      mono?: string;
    };
    voice?: {
      tone?: string;
      formality?: string;
      personality?: string[];
      keywords?: string[];
    };
  },
  industry: IndustryCategory,
  now: string
): BrandSystem {
  const defaultColors = getDefaultColorPalette(industry);
  const defaultTypography = getDefaultTypography();

  return {
    id: crypto.randomUUID(),
    websiteId: input.websiteId,
    name: `${input.businessName} Brand`,
    colors: {
      primary: { ...defaultColors.primary, ...llmResponse.colors?.primary },
      secondary: { ...defaultColors.secondary, ...llmResponse.colors?.secondary },
      accent: { ...defaultColors.accent, ...llmResponse.colors?.accent },
      neutral: { ...defaultColors.neutral, ...llmResponse.colors?.neutral },
      semantic: defaultColors.semantic,
    },
    typography: {
      fontFamily: {
        heading: llmResponse.typography?.heading || defaultTypography.fontFamily.heading,
        body: llmResponse.typography?.body || defaultTypography.fontFamily.body,
        mono: llmResponse.typography?.mono || defaultTypography.fontFamily.mono,
      },
      fontSize: defaultTypography.fontSize,
      fontWeight: defaultTypography.fontWeight,
      lineHeight: defaultTypography.lineHeight,
      letterSpacing: defaultTypography.letterSpacing,
    },
    spacing: {
      unit: 8,
      scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
    },
    borderRadius: {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '24px',
      full: '9999px',
    },
    shadows: {
      none: 'none',
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    },
    animation: {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        linear: 'linear',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
    voice: {
      tone: (llmResponse.voice?.tone as BrandTone) || 'professional',
      formality: (llmResponse.voice?.formality as 'formal' | 'neutral' | 'informal') || 'neutral',
      personality: llmResponse.voice?.personality || ['innovative', 'trustworthy', 'modern'],
      keywords: llmResponse.voice?.keywords || input.keywords || [],
    },
    industry,
    targetAudience: input.targetAudience,
    aiGenerated: true,
    confidenceScore: 0.85,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Generate default brand system as fallback
 */
function generateDefaultBrandSystem(
  input: BrandGenerationInput,
  industry: IndustryCategory,
  tone: BrandTone,
  now: string
): BrandSystem {
  const colors = getDefaultColorPalette(industry);
  const typography = getDefaultTypography();

  return {
    id: crypto.randomUUID(),
    websiteId: input.websiteId,
    name: `${input.businessName} Brand`,
    colors,
    typography,
    spacing: {
      unit: 8,
      scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
    },
    borderRadius: {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '24px',
      full: '9999px',
    },
    shadows: {
      none: 'none',
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    },
    animation: {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        linear: 'linear',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
    voice: {
      tone,
      formality: 'neutral',
      personality: getPersonalityForTone(tone),
      keywords: input.keywords || [],
    },
    industry,
    targetAudience: input.targetAudience,
    aiGenerated: true,
    confidenceScore: 0.7,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get default color palette based on industry
 */
function getDefaultColorPalette(industry: IndustryCategory): BrandColorPalette {
  const industryPalettes: Record<IndustryCategory, { primary: string; secondary: string; accent: string }> = {
    technology: { primary: '#3b82f6', secondary: '#8b5cf6', accent: '#06b6d4' },
    healthcare: { primary: '#10b981', secondary: '#3b82f6', accent: '#14b8a6' },
    finance: { primary: '#1e40af', secondary: '#059669', accent: '#0891b2' },
    education: { primary: '#7c3aed', secondary: '#2563eb', accent: '#f59e0b' },
    retail: { primary: '#ec4899', secondary: '#f97316', accent: '#8b5cf6' },
    manufacturing: { primary: '#64748b', secondary: '#0ea5e9', accent: '#f59e0b' },
    professional_services: { primary: '#0f172a', secondary: '#3b82f6', accent: '#14b8a6' },
    hospitality: { primary: '#b45309', secondary: '#059669', accent: '#f472b6' },
    real_estate: { primary: '#166534', secondary: '#0369a1', accent: '#ca8a04' },
    nonprofit: { primary: '#059669', secondary: '#7c3aed', accent: '#f97316' },
    entertainment: { primary: '#dc2626', secondary: '#7c3aed', accent: '#f59e0b' },
    creative: { primary: '#ec4899', secondary: '#8b5cf6', accent: '#06b6d4' },
    other: { primary: '#3b82f6', secondary: '#64748b', accent: '#f59e0b' },
  };

  const palette = industryPalettes[industry];

  return {
    primary: generateColorScale(palette.primary),
    secondary: generateColorScale(palette.secondary),
    accent: generateColorScale(palette.accent),
    neutral: generateColorScale('#64748b'),
    semantic: {
      success: '#22c55e',
      successForeground: '#ffffff',
      warning: '#f59e0b',
      warningForeground: '#ffffff',
      error: '#ef4444',
      errorForeground: '#ffffff',
      info: '#3b82f6',
      infoForeground: '#ffffff',
    },
  };
}

/**
 * Generate a color scale from a base color
 */
function generateColorScale(baseColor: string): ColorScale {
  // Simple color scale generation (in production, use a proper color library)
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const lighten = (factor: number) => {
    const nr = Math.round(r + (255 - r) * factor);
    const ng = Math.round(g + (255 - g) * factor);
    const nb = Math.round(b + (255 - b) * factor);
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  };

  const darken = (factor: number) => {
    const nr = Math.round(r * (1 - factor));
    const ng = Math.round(g * (1 - factor));
    const nb = Math.round(b * (1 - factor));
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  };

  return {
    50: lighten(0.95),
    100: lighten(0.9),
    200: lighten(0.7),
    300: lighten(0.5),
    400: lighten(0.25),
    500: baseColor,
    600: darken(0.1),
    700: darken(0.25),
    800: darken(0.4),
    900: darken(0.55),
  };
}

/**
 * Get default typography system
 */
function getDefaultTypography(): TypographySystem {
  return {
    fontFamily: {
      heading: 'Inter',
      body: 'Inter',
      mono: 'JetBrains Mono',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  };
}

/**
 * Get personality traits for a tone
 */
function getPersonalityForTone(tone: BrandTone): string[] {
  const personalities: Record<BrandTone, string[]> = {
    professional: ['reliable', 'competent', 'trustworthy'],
    casual: ['approachable', 'relaxed', 'easy-going'],
    friendly: ['warm', 'helpful', 'welcoming'],
    authoritative: ['expert', 'confident', 'established'],
    playful: ['fun', 'creative', 'energetic'],
    luxurious: ['sophisticated', 'exclusive', 'refined'],
    technical: ['precise', 'innovative', 'cutting-edge'],
    warm: ['caring', 'personal', 'compassionate'],
  };

  return personalities[tone] || ['professional', 'modern', 'innovative'];
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Save brand system to database
 */
export async function saveBrandSystem(brand: BrandSystem): Promise<BrandSystem> {
  const supabase = await createClient();

  const brandRecord = {
    id: brand.id,
    website_id: brand.websiteId,
    name: brand.name,
    colors: JSON.parse(JSON.stringify(brand.colors)),
    typography: JSON.parse(JSON.stringify(brand.typography)),
    spacing: JSON.parse(JSON.stringify(brand.spacing)),
    border_radius: JSON.parse(JSON.stringify(brand.borderRadius)),
    shadows: JSON.parse(JSON.stringify(brand.shadows)),
    animation: JSON.parse(JSON.stringify(brand.animation)),
    logo: brand.logo ? JSON.parse(JSON.stringify(brand.logo)) : null,
    voice: JSON.parse(JSON.stringify(brand.voice)),
    industry: brand.industry,
    target_audience: brand.targetAudience,
    ai_generated: brand.aiGenerated,
    confidence_score: brand.confidenceScore,
  };

  const { data, error } = await supabase
    .from('brand_configs')
    .upsert(brandRecord)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save brand system: ${error.message}`);
  }

  return mapDbToBrandSystem(data);
}

/**
 * Get brand system for a website
 */
export async function getBrandSystem(websiteId: string): Promise<BrandSystem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('brand_configs')
    .select('*')
    .eq('website_id', websiteId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch brand system: ${error.message}`);
  }

  return mapDbToBrandSystem(data);
}

/**
 * Delete brand system
 */
export async function deleteBrandSystem(brandId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('brand_configs').delete().eq('id', brandId);

  if (error) {
    throw new Error(`Failed to delete brand system: ${error.message}`);
  }
}

/**
 * Map database record to BrandSystem
 */
function mapDbToBrandSystem(data: Record<string, unknown>): BrandSystem {
  return {
    id: data.id as string,
    websiteId: data.website_id as string,
    name: data.name as string,
    colors: data.colors as unknown as BrandColorPalette,
    typography: data.typography as unknown as TypographySystem,
    spacing: data.spacing as unknown as BrandSystem['spacing'],
    borderRadius: data.border_radius as unknown as BrandSystem['borderRadius'],
    shadows: data.shadows as unknown as BrandSystem['shadows'],
    animation: data.animation as unknown as BrandSystem['animation'],
    logo: data.logo as unknown as BrandSystem['logo'],
    voice: data.voice as unknown as BrandVoice,
    industry: data.industry as IndustryCategory,
    targetAudience: data.target_audience as string | undefined,
    aiGenerated: data.ai_generated as boolean,
    confidenceScore: data.confidence_score as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}
