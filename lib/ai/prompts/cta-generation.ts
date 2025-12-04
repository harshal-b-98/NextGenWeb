/**
 * CTA Generation Prompts
 *
 * Prompt templates for generating personalized calls-to-action and workspace configurations.
 */

/**
 * CTA variant types
 */
export type CTAVariant = 'primary' | 'secondary' | 'tertiary';

/**
 * CTA category types
 */
export type CTACategory = 'sales' | 'marketing' | 'product' | 'support' | 'general';

/**
 * System prompt for business/knowledge base analysis
 */
export const BUSINESS_ANALYSIS_SYSTEM_PROMPT = `You are analyzing a company's knowledge base to understand their business.
Extract key information to help generate personalized marketing CTAs.

Respond in JSON:
{
  "businessType": "Brief description of what the business does (e.g., 'beverage analytics platform', 'e-commerce solution')",
  "industry": "Primary industry vertical",
  "mainTopics": ["List of 5-8 main topics/themes in the knowledge base"],
  "valuePropositions": ["List of 3-5 key value props/benefits"],
  "targetAudience": ["List of target customer personas"],
  "keyFeatures": ["List of 5-8 key product features"]
}`;

/**
 * Build CTA generation prompt
 */
export function buildCTAGenerationPrompt(params: {
  websiteName: string;
  businessType: string;
  topics: string[];
  valueProps: string[];
  knowledgeSample: string;
}): string {
  const { websiteName, businessType, topics, valueProps, knowledgeSample } = params;

  return `You are creating personalized CTAs for a conversational marketing landing page.
The landing page has a minimal hero with the company name, tagline, and interactive CTAs.
When users click a CTA, it generates a new content section below (not navigation).

Business: ${websiteName}
Type: ${businessType}
Key Topics: ${topics.join(', ')}
Value Props: ${valueProps.join(', ')}

Generate 6-8 CTAs that:
1. Are specific to THIS business (not generic)
2. Address different parts of the buyer journey
3. Cover: product info, value/ROI, how it works, use cases, getting started
4. Use action-oriented, compelling language
5. Are relevant to the knowledge base content

Respond in JSON:
{
  "ctas": [
    {
      "text": "CTA button text (short, actionable)",
      "topic": "internal topic identifier for content generation",
      "description": "Brief description of what this CTA reveals",
      "category": "sales|marketing|product|support|general",
      "variant": "primary (1-2 main CTAs) | secondary (2-3 supporting) | tertiary (remaining)",
      "icon": "optional emoji icon"
    }
  ]
}

Order by importance: primary CTAs first, then secondary, then tertiary.

Knowledge base sample:
${knowledgeSample}`;
}

/**
 * Build workspace config generation prompt
 */
export function buildWorkspaceConfigPrompt(params: {
  websiteName: string;
  businessType: string;
  valueProps: string[];
}): string {
  const { websiteName, businessType, valueProps } = params;

  return `Generate a tagline and brief description for a company.

Business: ${websiteName}
Type: ${businessType}
Value Props: ${valueProps.join(', ')}

Respond in JSON:
{
  "tagline": "Short, memorable tagline (5-10 words)",
  "description": "Brief description (1-2 sentences, max 30 words)"
}`;
}

/**
 * Default CTAs for fallback
 */
export const DEFAULT_CTAS: Array<{
  id: string;
  text: string;
  topic: string;
  description: string;
  category: CTACategory;
  variant: CTAVariant;
  icon: string;
}> = [
  {
    id: 'cta-default-1',
    text: 'See How It Works',
    topic: 'how-it-works',
    description: 'Learn about our process',
    category: 'product',
    variant: 'primary',
    icon: '🚀',
  },
  {
    id: 'cta-default-2',
    text: 'Explore Features',
    topic: 'features',
    description: 'Discover our capabilities',
    category: 'product',
    variant: 'primary',
    icon: '✨',
  },
  {
    id: 'cta-default-3',
    text: 'View Pricing',
    topic: 'pricing',
    description: 'See our pricing plans',
    category: 'sales',
    variant: 'secondary',
    icon: '💰',
  },
  {
    id: 'cta-default-4',
    text: 'Customer Stories',
    topic: 'testimonials',
    description: 'See what others say',
    category: 'marketing',
    variant: 'secondary',
    icon: '⭐',
  },
  {
    id: 'cta-default-5',
    text: 'Get Started',
    topic: 'getting-started',
    description: 'Begin your journey',
    category: 'sales',
    variant: 'tertiary',
    icon: '🎯',
  },
  {
    id: 'cta-default-6',
    text: 'Contact Us',
    topic: 'contact',
    description: 'Speak to our team',
    category: 'support',
    variant: 'tertiary',
    icon: '💬',
  },
];
