/**
 * Section Generation Prompts
 *
 * Prompt templates for generating dynamic website sections in conversational marketing.
 */

/**
 * Section types for dynamic content generation
 */
export type SectionType =
  | 'features-grid'
  | 'features-cards'
  | 'faq-accordion'
  | 'pricing-table'
  | 'comparison-table'
  | 'testimonials'
  | 'timeline'
  | 'stats-display'
  | 'text-block'
  | 'cta-block';

/**
 * Available icons for section items
 */
export const AVAILABLE_ICONS = [
  'check',
  'book',
  'lightbulb',
  'zap',
  'target',
  'users',
  'chart',
  'settings',
  'help',
  'message',
  'dollar',
  'clock',
  'shield',
  'globe',
  'layers',
  'sparkles',
] as const;

/**
 * System prompt for section intent classification
 */
export const SECTION_INTENT_CLASSIFICATION_PROMPT = `You are an intent classifier for a conversational marketing system.
Based on the CTA clicked and the query, classify the user's intent.

Categories:
- product-info: Product features, capabilities, what it does
- pricing: Cost, plans, pricing tiers
- comparison: Comparing with alternatives
- how-it-works: Process, implementation, technical details
- use-case: Industry applications, examples
- integration: Connecting with other tools
- support: Help, troubleshooting
- demo-request: Wants demo or trial
- contact: Speak to human
- testimonials: Customer stories, reviews
- faq: Common questions
- general: Other/unclear

Suggest the best section type for the response:
- features-grid: Multiple features/capabilities
- features-cards: Clickable feature cards
- faq-accordion: Q&A format
- pricing-table: Pricing comparison
- comparison-table: Feature comparison
- testimonials: Customer quotes
- cta-block: Call to action
- timeline: Process steps
- stats-display: Numbers and metrics
- text-block: Narrative text

Respond in JSON:
{
  "category": "category-name",
  "confidence": 0.0-1.0,
  "suggestedSectionType": "section-type",
  "entities": {}
}`;

/**
 * Build section generation prompt
 */
export function buildSectionGenerationPrompt(params: {
  sectionType: SectionType;
  ctaText: string;
  intentCategory: string;
  intentConfidence: number;
  knowledgeContext: Array<{
    content: string;
    entityType: string;
    similarity: number;
  }>;
  personaHint?: string;
  isDeepDive?: boolean;
  itemTitle?: string;
  itemDescription?: string;
  excludeTopics?: string[];
  existingSectionTypes?: string[];
}): string {
  const {
    sectionType,
    ctaText,
    intentCategory,
    intentConfidence,
    knowledgeContext,
    personaHint,
    isDeepDive,
    itemTitle,
    itemDescription,
    excludeTopics,
    existingSectionTypes,
  } = params;

  const hasKnowledge = knowledgeContext.length > 0;
  const avgRelevance = hasKnowledge
    ? knowledgeContext.reduce((sum, k) => sum + k.similarity, 0) / knowledgeContext.length
    : 0;

  let prompt = `You are an expert marketing content generator creating high-converting, visually engaging website sections.
The visitor clicked a CTA and expects compelling, professional content that drives action.

=== CONTENT QUALITY STANDARDS ===
1. HEADLINES: Make them specific, benefit-focused, and action-oriented
   - BAD: "Our Features"
   - GOOD: "Accelerate Your Growth with AI-Powered Tools"

2. DESCRIPTIONS: Use concrete details, not vague claims
   - BAD: "We help businesses succeed"
   - GOOD: "Reduce manual work by 60% with automated workflows"

3. STATISTICS: Use specific numbers when available in knowledge base
   - BAD: "Many customers love us"
   - GOOD: "Trusted by 10,000+ teams worldwide"

4. ICONS: Choose contextually appropriate icons from: ${AVAILABLE_ICONS.join(', ')}

5. VARIETY: Ensure each item has a unique angle and doesn't repeat concepts
=== END QUALITY STANDARDS ===

CONTEXT:
- CTA clicked: "${ctaText}"
- Section type to generate: ${sectionType}
- Intent: ${intentCategory} (confidence: ${intentConfidence})`;

  if (isDeepDive && itemTitle) {
    prompt += `

DEEP-DIVE CONTEXT:
This is a DEEP-DIVE request. The visitor clicked on "${itemTitle}" to learn more details.
${itemDescription ? `- Brief description they saw: "${itemDescription}"` : ''}
- Generate DETAILED, IN-DEPTH content about this specific topic
- Go deeper than the initial overview - provide specifics, examples, use cases
- Use the ${sectionType} format to explain HOW this feature/topic works
- Include practical benefits and real-world applications`;
  }

  if (personaHint) {
    prompt += `\n- Visitor appears to be: ${personaHint}`;
  }

  // Add content uniqueness requirements
  const hasExcludedTopics = excludeTopics && excludeTopics.length > 0;
  const hasExistingSectionTypes = existingSectionTypes && existingSectionTypes.length > 0;

  if (hasExcludedTopics || hasExistingSectionTypes) {
    prompt += `\n\n=== CONTENT UNIQUENESS REQUIREMENTS ===
IMPORTANT: The visitor has already seen content on this page. Generate FRESH, UNIQUE content.`;

    if (hasExcludedTopics) {
      prompt += `\n\nPREVIOUSLY COVERED TOPICS (DO NOT repeat these):
${excludeTopics!.map((t, i) => `${i + 1}. ${t}`).join('\n')}

- Avoid generating content about these topics
- Focus on NEW aspects, angles, or details not yet covered
- If the CTA relates to a covered topic, go DEEPER or explore ADJACENT aspects`;
    }

    if (hasExistingSectionTypes) {
      prompt += `\n\nEXISTING SECTION TYPES ALREADY SHOWN:
${existingSectionTypes!.join(', ')}

- Prefer using DIFFERENT section types when possible
- If the same section type is necessary, ensure the content structure feels fresh
- Vary headlines, item counts, and presentation style`;
    }

    prompt += `\n=== END UNIQUENESS REQUIREMENTS ===`;
  }

  // Add knowledge context
  if (hasKnowledge) {
    prompt += `\n\n=== KNOWLEDGE BASE CONTENT ===
CRITICAL INSTRUCTION: You MUST base your response ONLY on the following knowledge base content.
Do NOT make up information, features, pricing, or claims that are not explicitly stated below.
Average relevance score: ${(avgRelevance * 100).toFixed(0)}%
`;
    knowledgeContext.forEach((item, i) => {
      prompt += `\n[${i + 1}] (${item.entityType}, relevance: ${(item.similarity * 100).toFixed(0)}%)\n${item.content}\n`;
    });
    prompt += `\n=== END KNOWLEDGE BASE ===`;
  } else {
    prompt += `\n\nNOTE: Limited knowledge base content available. Generate helpful, generic content that acknowledges this and encourages the visitor to contact for more specific information.`;
  }

  // Add section type schema
  prompt += `\n\n=== OUTPUT FORMAT ===
Generate content in this JSON structure for ${sectionType}:
${getSectionTypeSchema(sectionType)}
=== END OUTPUT FORMAT ===`;

  return prompt;
}

/**
 * Get JSON schema for a section type
 */
function getSectionTypeSchema(sectionType: SectionType): string {
  const schemas: Record<SectionType, string> = {
    'features-grid': `{
  "type": "features-grid",
  "headline": "Compelling headline",
  "items": [
    { "id": "uuid", "icon": "icon-name", "title": "Feature Name", "description": "Benefit-focused description" }
  ]
}`,
    'features-cards': `{
  "type": "features-cards",
  "headline": "Compelling headline",
  "items": [
    { "id": "uuid", "icon": "icon-name", "title": "Feature Name", "description": "Description", "cta": { "text": "Learn More", "action": "deep-dive" } }
  ]
}`,
    'faq-accordion': `{
  "type": "faq-accordion",
  "headline": "Frequently Asked Questions",
  "items": [
    { "id": "uuid", "question": "Question text?", "answer": "Detailed answer" }
  ]
}`,
    'pricing-table': `{
  "type": "pricing-table",
  "headline": "Pricing Plans",
  "items": [
    { "id": "uuid", "name": "Plan Name", "price": "$XX/mo", "features": ["Feature 1", "Feature 2"], "cta": { "text": "Get Started" } }
  ]
}`,
    'comparison-table': `{
  "type": "comparison-table",
  "headline": "How We Compare",
  "headers": ["Feature", "Us", "Competitor"],
  "rows": [
    { "feature": "Feature name", "values": ["Yes", "No"] }
  ]
}`,
    testimonials: `{
  "type": "testimonials",
  "headline": "What Our Customers Say",
  "items": [
    { "id": "uuid", "quote": "Customer quote", "author": "Name", "role": "Title", "company": "Company" }
  ]
}`,
    timeline: `{
  "type": "timeline",
  "headline": "How It Works",
  "items": [
    { "id": "uuid", "step": 1, "title": "Step Name", "description": "What happens" }
  ]
}`,
    'stats-display': `{
  "type": "stats-display",
  "headline": "By the Numbers",
  "items": [
    { "id": "uuid", "value": "100+", "label": "Metric Name", "description": "Context" }
  ]
}`,
    'text-block': `{
  "type": "text-block",
  "headline": "Section Title",
  "content": "Paragraph content with details...",
  "cta": { "text": "Learn More", "action": "contact" }
}`,
    'cta-block': `{
  "type": "cta-block",
  "headline": "Ready to Get Started?",
  "description": "Supporting text",
  "primaryCta": { "text": "Start Free Trial", "action": "signup" },
  "secondaryCta": { "text": "Contact Sales", "action": "contact" }
}`,
  };

  return schemas[sectionType] || schemas['text-block'];
}
