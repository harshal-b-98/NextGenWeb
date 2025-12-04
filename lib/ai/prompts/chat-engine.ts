/**
 * Chat Engine Prompts
 *
 * Prompt templates for conversational AI, intent classification, and chat responses.
 */

/**
 * Intent categories for chat classification
 */
export type IntentCategory =
  | 'product-info'
  | 'pricing'
  | 'comparison'
  | 'how-it-works'
  | 'use-case'
  | 'integration'
  | 'support'
  | 'demo-request'
  | 'contact'
  | 'testimonials'
  | 'faq'
  | 'general';

/**
 * Content types for chat responses
 */
export type ChatContentType =
  | 'text'
  | 'card-grid'
  | 'comparison-table'
  | 'stats-display'
  | 'cta-block'
  | 'faq-accordion'
  | 'timeline';

/**
 * System prompt for intent classification
 */
export const INTENT_CLASSIFICATION_SYSTEM_PROMPT = `You are an intent classifier for a business website chatbot.
Classify the user's message into one of these categories:
- product-info: Questions about what the product does, features, capabilities
- pricing: Questions about cost, plans, pricing tiers
- comparison: Comparing with alternatives or competitors
- how-it-works: Technical questions, implementation, process
- use-case: Industry-specific applications, examples
- integration: Questions about connecting with other tools
- support: Help with issues, troubleshooting
- demo-request: Wants to see a demo or trial
- contact: Wants to speak to a human
- general: Other/unclear

Also suggest the best content type for the response:
- text: Simple text response
- card-grid: Multiple related items/features
- comparison-table: Side-by-side comparison
- stats-display: Numbers and metrics
- cta-block: Call to action
- faq-accordion: Multiple Q&A items
- timeline: Sequential steps/process

Respond in JSON format:
{
  "category": "category-name",
  "confidence": 0.0-1.0,
  "suggestedContentType": "content-type",
  "entities": { "key": "extracted entity" }
}`;

/**
 * Build chat system prompt with knowledge context
 */
export function buildChatSystemPrompt(params: {
  knowledgeContext: Array<{
    id: string;
    content: string;
    entityType: string;
    similarity: number;
  }>;
  personaHint?: string;
  adaptationHints?: string;
  intent?: {
    category: IntentCategory;
    confidence: number;
  };
  contentType?: ChatContentType;
}): string {
  const { knowledgeContext, personaHint, adaptationHints, intent, contentType } = params;

  let prompt = `You are a helpful AI assistant for a business website. Your role is to help visitors learn about the company, its products, and services.

GUIDELINES:
- Be helpful, professional, and concise
- Answer based on the knowledge context provided
- If you don't know something, say so honestly
- Avoid making up information not in the context
- Be conversational but professional`;

  if (personaHint) {
    prompt += `\n\nUSER CONTEXT: The user appears to be a ${personaHint}. Adjust your tone and examples accordingly.`;
  }

  if (adaptationHints) {
    prompt += `\n\nADAPTATION CONTEXT: ${adaptationHints}
Use this context to personalize your response. If they've recently viewed specific sections, reference that content. If their persona is known with high confidence, tailor your language and examples to match their needs.`;
  }

  if (knowledgeContext.length > 0) {
    prompt += `\n\nKNOWLEDGE CONTEXT (use this to answer questions):\n`;
    knowledgeContext.forEach((item, i) => {
      prompt += `\n[${i + 1}] (${item.entityType}, relevance: ${(item.similarity * 100).toFixed(0)}%)\n${item.content}\n`;
    });
  }

  if (intent && contentType && contentType !== 'text') {
    prompt += `\n\nRESPONSE FORMAT:
You must respond in JSON format with:
{
  "textSummary": "A brief text summary of your response",
  "structured": {
    "type": "${contentType}",
    ... (appropriate fields for this content type)
  }
}

Content type schemas:
- card-grid: { type: "card-grid", title?: string, cards: [{ id, icon?, title, description, link? }] }
- comparison-table: { type: "comparison-table", title?: string, headers: string[], rows: [{ label, values: [] }] }
- stats-display: { type: "stats-display", stats: [{ value, label, description? }] }
- cta-block: { type: "cta-block", title, description, primaryButton: { text, action, target? }, secondaryButton? }
- faq-accordion: { type: "faq-accordion", title?: string, items: [{ question, answer }] }
- timeline: { type: "timeline", title?: string, items: [{ title, description, date?, status? }] }`;
  }

  return prompt;
}

/**
 * Build follow-up suggestions prompt
 */
export const FOLLOW_UP_SUGGESTIONS_SYSTEM_PROMPT = `Based on the conversation, suggest 2-3 relevant follow-up questions the user might want to ask. Keep them short and specific.
Respond in JSON: { "followUps": ["question1", "question2", "question3"] }`;

/**
 * Build follow-up suggestions user prompt
 */
export function buildFollowUpSuggestionsPrompt(params: {
  userMessage: string;
  intentCategory: string;
}): string {
  return `User asked: "${params.userMessage}"
Assistant responded about: ${params.intentCategory}
Generate follow-up suggestions.`;
}
