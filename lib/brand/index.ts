/**
 * Brand & Theme Engine Module
 *
 * Exports for the brand system including types,
 * extraction, and theme generation.
 */

// Types
export type {
  ColorScale,
  SemanticColors,
  BrandColorPalette,
  FontFamily,
  FontSizeScale,
  FontWeights,
  LineHeights,
  LetterSpacing,
  TypographySystem,
  SpacingScale,
  ContainerWidths,
  BorderRadiusScale,
  ShadowScale,
  AnimationDurations,
  AnimationEasing,
  AnimationSystem,
  LogoConfig,
  BrandTone,
  BrandFormality,
  BrandVoice,
  IndustryCategory,
  BrandSystem,
  BrandGenerationInput,
  BrandExtractionResult,
  BrandSignal,
  CSSVariables,
  GeneratedTheme,
  TailwindBrandConfig,
  BrandPreset,
  CreateBrandInput,
  UpdateBrandInput,
} from './types';

export {
  ColorScaleSchema,
  SemanticColorsSchema,
  BrandColorPaletteSchema,
  FontFamilySchema,
  BrandVoiceSchema,
  BrandGenerationInputSchema,
} from './types';

// Extraction
export {
  extractBrand,
  saveBrandSystem,
  getBrandSystem,
  deleteBrandSystem,
  type ExtractionOptions,
} from './extraction';

// Theme Generation
export {
  generateTheme,
  generateCSSVariables,
  generateCSSString,
  generateTailwindConfig,
  exportTailwindConfigFile,
  exportCSSFile,
} from './theme';
