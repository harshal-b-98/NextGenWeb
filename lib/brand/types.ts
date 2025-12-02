/**
 * Brand & Theme Engine Types
 *
 * Comprehensive type definitions for the brand system including
 * colors, typography, spacing, effects, and theme generation.
 */

import { z } from 'zod';

// ============================================================================
// Color System
// ============================================================================

/**
 * Color scale with 10 shades (50-900)
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

/**
 * Semantic colors for consistent UI states
 */
export interface SemanticColors {
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  error: string;
  errorForeground: string;
  info: string;
  infoForeground: string;
}

/**
 * Complete color palette for the brand
 */
export interface BrandColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  neutral: ColorScale;
  semantic: SemanticColors;
}

// ============================================================================
// Typography System
// ============================================================================

/**
 * Font family configuration
 */
export interface FontFamily {
  heading: string;
  body: string;
  mono: string;
}

/**
 * Font size scale
 */
export interface FontSizeScale {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
}

/**
 * Font weight options
 */
export interface FontWeights {
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
}

/**
 * Line height scale
 */
export interface LineHeights {
  tight: number;
  snug: number;
  normal: number;
  relaxed: number;
  loose: number;
}

/**
 * Letter spacing options
 */
export interface LetterSpacing {
  tighter: string;
  tight: string;
  normal: string;
  wide: string;
  wider: string;
}

/**
 * Complete typography system
 */
export interface TypographySystem {
  fontFamily: FontFamily;
  fontSize: FontSizeScale;
  fontWeight: FontWeights;
  lineHeight: LineHeights;
  letterSpacing: LetterSpacing;
}

// ============================================================================
// Spacing & Layout
// ============================================================================

/**
 * Spacing scale (based on 8px grid)
 */
export interface SpacingScale {
  unit: number; // Base unit (8px)
  scale: number[]; // Multipliers [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]
}

/**
 * Container widths
 */
export interface ContainerWidths {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

// ============================================================================
// Effects
// ============================================================================

/**
 * Border radius scale
 */
export interface BorderRadiusScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

/**
 * Box shadow scale
 */
export interface ShadowScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

// ============================================================================
// Animation
// ============================================================================

/**
 * Animation duration presets
 */
export interface AnimationDurations {
  fast: string;
  normal: string;
  slow: string;
}

/**
 * Easing functions
 */
export interface AnimationEasing {
  linear: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
  bounce: string;
}

/**
 * Animation system
 */
export interface AnimationSystem {
  duration: AnimationDurations;
  easing: AnimationEasing;
}

// ============================================================================
// Logo & Assets
// ============================================================================

/**
 * Logo configuration
 */
export interface LogoConfig {
  light: string;
  dark?: string;
  favicon?: string;
  width?: number;
  height?: number;
  alt: string;
}

// ============================================================================
// Brand Voice & Personality
// ============================================================================

/**
 * Brand tone options
 */
export type BrandTone =
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'authoritative'
  | 'playful'
  | 'luxurious'
  | 'technical'
  | 'warm';

/**
 * Brand formality level
 */
export type BrandFormality = 'formal' | 'neutral' | 'informal';

/**
 * Brand voice configuration
 */
export interface BrandVoice {
  tone: BrandTone;
  formality: BrandFormality;
  personality: string[];
  keywords: string[];
}

// ============================================================================
// Industry & Context
// ============================================================================

/**
 * Industry categories for brand generation
 */
export type IndustryCategory =
  | 'technology'
  | 'healthcare'
  | 'finance'
  | 'education'
  | 'retail'
  | 'manufacturing'
  | 'professional_services'
  | 'hospitality'
  | 'real_estate'
  | 'nonprofit'
  | 'entertainment'
  | 'creative'
  | 'other';

// ============================================================================
// Complete Brand System
// ============================================================================

/**
 * Complete brand system configuration
 */
export interface BrandSystem {
  id: string;
  websiteId: string;
  name: string;

  // Visual Identity
  colors: BrandColorPalette;
  typography: TypographySystem;
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
  shadows: ShadowScale;
  animation: AnimationSystem;

  // Assets
  logo?: LogoConfig;

  // Voice & Personality
  voice: BrandVoice;

  // Context
  industry?: IndustryCategory;
  targetAudience?: string;

  // Metadata
  aiGenerated: boolean;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Brand Generation Input
// ============================================================================

/**
 * Input for generating a brand system from scratch
 */
export interface BrandGenerationInput {
  websiteId: string;
  businessName: string;
  industry?: IndustryCategory;
  tone?: BrandTone;
  formality?: BrandFormality;
  keywords?: string[];
  targetAudience?: string;
  existingColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  existingFonts?: {
    heading?: string;
    body?: string;
  };
}

/**
 * Brand extraction result from documents
 */
export interface BrandExtractionResult {
  brand: BrandSystem;
  signals: BrandSignal[];
  tokensUsed: number;
  processingTime: number;
}

/**
 * Individual brand signal extracted from content
 */
export interface BrandSignal {
  type: 'color' | 'font' | 'tone' | 'industry' | 'keyword' | 'audience';
  value: string;
  confidence: number;
  source: string;
  context?: string;
}

// ============================================================================
// Theme Generation
// ============================================================================

/**
 * CSS variable map for theme
 */
export interface CSSVariables {
  [key: string]: string;
}

/**
 * Generated theme output
 */
export interface GeneratedTheme {
  cssVariables: CSSVariables;
  tailwindConfig: TailwindBrandConfig;
  cssString: string;
}

/**
 * Tailwind configuration for brand
 */
export interface TailwindBrandConfig {
  colors: Record<string, string | Record<string, string>>;
  fontFamily: Record<string, string[]>;
  fontSize: Record<string, [string, { lineHeight: string }]>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  boxShadow: Record<string, string>;
  animation: Record<string, string>;
  keyframes: Record<string, Record<string, Record<string, string>>>;
}

// ============================================================================
// Brand Presets
// ============================================================================

/**
 * Pre-defined brand preset
 */
export interface BrandPreset {
  id: string;
  name: string;
  description: string;
  preview: string; // Preview image URL
  industry: IndustryCategory[];
  tone: BrandTone;
  brand: Partial<BrandSystem>;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const ColorScaleSchema = z.object({
  50: z.string(),
  100: z.string(),
  200: z.string(),
  300: z.string(),
  400: z.string(),
  500: z.string(),
  600: z.string(),
  700: z.string(),
  800: z.string(),
  900: z.string(),
});

export const SemanticColorsSchema = z.object({
  success: z.string(),
  successForeground: z.string(),
  warning: z.string(),
  warningForeground: z.string(),
  error: z.string(),
  errorForeground: z.string(),
  info: z.string(),
  infoForeground: z.string(),
});

export const BrandColorPaletteSchema = z.object({
  primary: ColorScaleSchema,
  secondary: ColorScaleSchema,
  accent: ColorScaleSchema,
  neutral: ColorScaleSchema,
  semantic: SemanticColorsSchema,
});

export const FontFamilySchema = z.object({
  heading: z.string(),
  body: z.string(),
  mono: z.string(),
});

export const BrandVoiceSchema = z.object({
  tone: z.enum([
    'professional',
    'casual',
    'friendly',
    'authoritative',
    'playful',
    'luxurious',
    'technical',
    'warm',
  ]),
  formality: z.enum(['formal', 'neutral', 'informal']),
  personality: z.array(z.string()),
  keywords: z.array(z.string()),
});

export const BrandGenerationInputSchema = z.object({
  websiteId: z.string(),
  businessName: z.string(),
  industry: z
    .enum([
      'technology',
      'healthcare',
      'finance',
      'education',
      'retail',
      'manufacturing',
      'professional_services',
      'hospitality',
      'real_estate',
      'nonprofit',
      'entertainment',
      'creative',
      'other',
    ])
    .optional(),
  tone: z
    .enum([
      'professional',
      'casual',
      'friendly',
      'authoritative',
      'playful',
      'luxurious',
      'technical',
      'warm',
    ])
    .optional(),
  formality: z.enum(['formal', 'neutral', 'informal']).optional(),
  keywords: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  existingColors: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
    })
    .optional(),
  existingFonts: z
    .object({
      heading: z.string().optional(),
      body: z.string().optional(),
    })
    .optional(),
});

// ============================================================================
// CRUD Types
// ============================================================================

/**
 * Input for creating a brand configuration
 */
export interface CreateBrandInput {
  websiteId: string;
  name: string;
  colors?: Partial<BrandColorPalette>;
  typography?: Partial<TypographySystem>;
  voice?: Partial<BrandVoice>;
  logo?: Partial<LogoConfig>;
  industry?: IndustryCategory;
}

/**
 * Input for updating a brand configuration
 */
export interface UpdateBrandInput {
  name?: string;
  colors?: Partial<BrandColorPalette>;
  typography?: Partial<TypographySystem>;
  voice?: Partial<BrandVoice>;
  logo?: Partial<LogoConfig>;
  industry?: IndustryCategory;
}
