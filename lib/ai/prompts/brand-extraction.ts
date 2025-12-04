/**
 * Brand Extraction Prompts
 *
 * Prompt templates for extracting and generating brand configurations.
 */

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
  | 'professional-services'
  | 'real-estate'
  | 'hospitality'
  | 'non-profit'
  | 'other';

/**
 * Tone options for brand voice
 */
export type BrandTone =
  | 'professional'
  | 'casual'
  | 'technical'
  | 'friendly'
  | 'authoritative'
  | 'innovative'
  | 'trustworthy';

/**
 * Build brand system generation prompt
 */
export function buildBrandGenerationPrompt(params: {
  businessName: string;
  industry: IndustryCategory;
  dominantTone: BrandTone;
  targetAudience?: string;
  keywords?: string[];
  existingPrimaryColor?: string;
  preferredHeadingFont?: string;
}): string {
  const {
    businessName,
    industry,
    dominantTone,
    targetAudience,
    keywords,
    existingPrimaryColor,
    preferredHeadingFont,
  } = params;

  return `You are a brand design expert. Generate a complete brand system for the following business:

Business Name: ${businessName}
Industry: ${industry}
Tone: ${dominantTone}
Target Audience: ${targetAudience || 'General audience'}
Keywords: ${keywords?.join(', ') || 'modern, professional'}

${existingPrimaryColor ? `Existing Primary Color: ${existingPrimaryColor}` : ''}
${preferredHeadingFont ? `Preferred Heading Font: ${preferredHeadingFont}` : ''}

Generate a complete brand system as a JSON object with the following structure:
{
  "colors": {
    "primary": { "50": "#hex", "100": "#hex", "200": "#hex", "300": "#hex", "400": "#hex", "500": "#hex", "600": "#hex", "700": "#hex", "800": "#hex", "900": "#hex" },
    "secondary": { "50": "#hex", "100": "#hex", "200": "#hex", "300": "#hex", "400": "#hex", "500": "#hex", "600": "#hex", "700": "#hex", "800": "#hex", "900": "#hex" },
    "accent": { "50": "#hex", "100": "#hex", "200": "#hex", "300": "#hex", "400": "#hex", "500": "#hex", "600": "#hex", "700": "#hex", "800": "#hex", "900": "#hex" },
    "neutral": { "50": "#hex", "100": "#hex", "200": "#hex", "300": "#hex", "400": "#hex", "500": "#hex", "600": "#hex", "700": "#hex", "800": "#hex", "900": "#hex" }
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
}

/**
 * Color palette generation instructions
 */
export const COLOR_PALETTE_GUIDELINES = `
Color palette guidelines by industry:
- Technology: Blues, teals, gradients suggesting innovation
- Healthcare: Blues, greens, whites for trust and cleanliness
- Finance: Navy, gold, deep greens for stability and trust
- Education: Blues, oranges, greens for accessibility and growth
- Retail: Vibrant, high-contrast colors for energy and action
- Manufacturing: Industrial grays, blues, oranges for reliability
- Professional Services: Navy, burgundy, charcoal for sophistication
- Real Estate: Earth tones, blues, greens for trust and home
- Hospitality: Warm colors, golds, rich tones for luxury
- Non-profit: Greens, blues, earth tones for compassion

Always ensure:
1. Primary color has strong contrast for accessibility
2. Each shade (50-900) follows consistent lightness progression
3. 500 is the "base" shade for each color
4. Colors work well together in UI contexts
`;

/**
 * Typography pairing suggestions
 */
export const TYPOGRAPHY_PAIRINGS = {
  modern: {
    heading: ['Inter', 'Plus Jakarta Sans', 'DM Sans', 'Outfit'],
    body: ['Inter', 'DM Sans', 'Open Sans', 'Source Sans Pro'],
    mono: ['JetBrains Mono', 'Fira Code', 'Source Code Pro'],
  },
  classic: {
    heading: ['Playfair Display', 'Merriweather', 'Libre Baskerville'],
    body: ['Lora', 'Source Serif Pro', 'PT Serif'],
    mono: ['IBM Plex Mono', 'Roboto Mono'],
  },
  technical: {
    heading: ['Space Grotesk', 'IBM Plex Sans', 'Roboto'],
    body: ['IBM Plex Sans', 'Roboto', 'Source Sans Pro'],
    mono: ['JetBrains Mono', 'Fira Code', 'IBM Plex Mono'],
  },
  friendly: {
    heading: ['Nunito', 'Quicksand', 'Comfortaa'],
    body: ['Nunito', 'Open Sans', 'Lato'],
    mono: ['Source Code Pro', 'Fira Code'],
  },
} as const;
