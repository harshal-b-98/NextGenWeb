/**
 * Entity Extraction Prompts
 *
 * Prompt templates for extracting entities from document content.
 */

/**
 * System prompt for entity extraction
 */
export const ENTITY_EXTRACTION_SYSTEM_PROMPT = `You are an expert entity extraction system for marketing content analysis.
Your task is to identify and extract structured entities from document content that can be used to generate marketing websites.

You must extract entities from the following categories:
- Products: Physical or digital products being sold
- Services: Professional services offered
- Features: Specific capabilities or attributes of products/services
- Benefits: Value propositions and outcomes for customers
- Pricing: Price points, tiers, and pricing structures
- Testimonials: Customer quotes, reviews, and success stories
- Companies: Organizations mentioned (partners, clients, competitors)
- People: Individuals mentioned (team members, executives, customers)
- Statistics: Numbers, metrics, and data points
- FAQs: Common questions and answers
- CTAs: Calls to action found in the content
- Process Steps: Sequential steps in a workflow or procedure
- Use Cases: Specific scenarios where the product/service applies
- Integrations: Third-party platforms or tools mentioned
- Contact: Contact information (email, phone, address, social media)

For each entity, provide:
1. A unique ID (use format: type_index, e.g., "product_1", "feature_3")
2. The entity type
3. A descriptive name
4. An optional description with more context
5. A confidence score (0-1) based on how clearly the entity is defined
6. Source chunk IDs where this entity was found
7. Type-specific metadata

IMPORTANT:
- Only extract entities that are clearly present in the content
- Do not invent or assume information not explicitly stated
- Assign lower confidence scores to implied or partially stated entities
- Group related information into single entities rather than duplicating`;

/**
 * User prompt template for entity extraction
 */
export function createEntityExtractionPrompt(
  content: string,
  chunkIds: string[],
  options?: {
    focusTypes?: string[];
    additionalContext?: string;
  }
): string {
  const focusInstruction = options?.focusTypes?.length
    ? `\n\nFocus primarily on extracting these entity types: ${options.focusTypes.join(', ')}`
    : '';

  const contextInstruction = options?.additionalContext
    ? `\n\nAdditional context: ${options.additionalContext}`
    : '';

  return `Extract all relevant entities from the following document content.

CHUNK IDs: ${chunkIds.join(', ')}

DOCUMENT CONTENT:
${content}
${focusInstruction}${contextInstruction}

Respond with a JSON object in this exact format:
{
  "entities": [
    {
      "id": "string (format: type_index)",
      "type": "string (one of: product, service, feature, benefit, pricing, testimonial, company, person, statistic, faq, cta, process_step, use_case, integration, contact)",
      "name": "string (short descriptive name)",
      "description": "string (optional longer description)",
      "confidence": number (0-1),
      "sourceChunkIds": ["array of chunk IDs where found"],
      "metadata": {
        // Type-specific fields based on entity type
      }
    }
  ],
  "summary": "string (brief summary of what this document is about)",
  "documentType": "string (e.g., 'product_page', 'company_overview', 'pricing_page', 'blog_post')",
  "primaryTopic": "string (main subject of the document)"
}

For metadata, include type-specific fields:
- product: features (array), pricing (string), category (string)
- service: deliverables (array), pricing (string), duration (string)
- feature: benefit (string), category (string)
- benefit: targetAudience (string), supportingEvidence (string)
- pricing: amount (string), currency (string), period (string), tier (string), features (array)
- testimonial: quote (string - REQUIRED), author (string), role (string), company (string), rating (number)
- company: industry (string), size (string), location (string), website (string)
- person: role (string), company (string), email (string), phone (string)
- statistic: value (string - REQUIRED), metric (string), context (string), timeframe (string)
- faq: question (string - REQUIRED), answer (string - REQUIRED), category (string)
- cta: action (string - REQUIRED), urgency (low/medium/high), targetUrl (string)
- process_step: stepNumber (number - REQUIRED), action (string - REQUIRED), outcome (string)
- use_case: scenario (string - REQUIRED), solution (string), outcome (string), industry (string)
- integration: platform (string - REQUIRED), integrationType (string), capabilities (array)
- contact: email (string), phone (string), address (string), socialMedia (object)`;
}

/**
 * Prompt for relationship extraction between entities
 */
export const RELATIONSHIP_EXTRACTION_SYSTEM_PROMPT = `You are an expert at identifying relationships between entities in marketing content.
Given a list of extracted entities, identify meaningful relationships between them.

Relationship types:
- has_feature: A product/service has a specific feature
- provides_benefit: A feature/product provides a benefit
- includes_pricing: A product/service includes a pricing tier
- has_testimonial: A product/service has a testimonial
- belongs_to: An entity belongs to a category or parent entity
- authored_by: Content authored by a person
- related_to: General relationship between entities
- prerequisite_of: One process step is prerequisite of another
- alternative_to: Entities that are alternatives to each other
- integrates_with: Product/service integrates with another platform
- addresses_use_case: Product/service addresses a specific use case

Only identify relationships that are explicitly stated or strongly implied in the source content.`;

/**
 * User prompt for relationship extraction
 */
export function createRelationshipExtractionPrompt(
  entities: Array<{ id: string; type: string; name: string; description?: string }>
): string {
  const entityList = entities
    .map(e => `- ${e.id} (${e.type}): ${e.name}${e.description ? ` - ${e.description}` : ''}`)
    .join('\n');

  return `Identify relationships between the following entities:

ENTITIES:
${entityList}

Respond with a JSON object:
{
  "relationships": [
    {
      "id": "string (format: rel_index)",
      "sourceEntityId": "string (ID of source entity)",
      "targetEntityId": "string (ID of target entity)",
      "relationshipType": "string (one of the relationship types)",
      "confidence": number (0-1)
    }
  ]
}

Only include relationships with confidence >= 0.6.
Avoid redundant or circular relationships.`;
}

/**
 * Prompt for document classification
 */
export const DOCUMENT_CLASSIFICATION_PROMPT = `Analyze the following content and classify it.

Respond with a JSON object:
{
  "documentType": "string (product_page, pricing_page, about_page, blog_post, case_study, faq_page, contact_page, landing_page, comparison_page, other)",
  "primaryTopic": "string (main subject)",
  "secondaryTopics": ["array of secondary topics"],
  "tone": "string (professional, casual, technical, persuasive, informative)",
  "targetAudience": "string (who this content is for)",
  "contentQuality": number (1-10, how well-structured and complete the content is)
}`;
