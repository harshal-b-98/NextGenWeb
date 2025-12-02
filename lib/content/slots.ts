/**
 * Component Content Slot Definitions
 * Phase 3.3: Content Generation & Mapping
 *
 * Defines content slots for each component variant, specifying
 * what content is required/optional and constraints for each slot.
 */

import { ContentSlot, ComponentContentRequirements } from './types';

// ============================================================================
// SLOT DEFINITIONS BY COMPONENT CATEGORY
// ============================================================================

/**
 * Hero component slots
 */
const HERO_SLOTS: Record<string, ContentSlot[]> = {
  'hero-centered': [
    { name: 'headline', label: 'Main Headline', type: 'text', required: true, maxLength: 100 },
    { name: 'subheadline', label: 'Subheadline', type: 'text', required: false, maxLength: 150 },
    { name: 'description', label: 'Description', type: 'richtext', required: false, maxLength: 300 },
    { name: 'primaryCTA', label: 'Primary CTA', type: 'object', required: true, children: [
      { name: 'text', label: 'Button Text', type: 'text', required: true, maxLength: 30 },
      { name: 'link', label: 'Button Link', type: 'link', required: true },
    ]},
    { name: 'secondaryCTA', label: 'Secondary CTA', type: 'object', required: false, children: [
      { name: 'text', label: 'Button Text', type: 'text', required: true, maxLength: 30 },
      { name: 'link', label: 'Button Link', type: 'link', required: true },
    ]},
    { name: 'image', label: 'Hero Image', type: 'image', required: false },
    { name: 'backgroundImage', label: 'Background Image', type: 'image', required: false },
  ],
  'hero-split': [
    { name: 'headline', label: 'Main Headline', type: 'text', required: true, maxLength: 80 },
    { name: 'subheadline', label: 'Subheadline', type: 'text', required: false, maxLength: 120 },
    { name: 'description', label: 'Description', type: 'richtext', required: true, maxLength: 400 },
    { name: 'bullets', label: 'Key Points', type: 'array', required: false, minItems: 2, maxItems: 5 },
    { name: 'primaryCTA', label: 'Primary CTA', type: 'object', required: true, children: [
      { name: 'text', label: 'Button Text', type: 'text', required: true, maxLength: 30 },
      { name: 'link', label: 'Button Link', type: 'link', required: true },
    ]},
    { name: 'secondaryCTA', label: 'Secondary CTA', type: 'object', required: false },
    { name: 'image', label: 'Hero Image', type: 'image', required: true },
  ],
  'hero-video': [
    { name: 'headline', label: 'Main Headline', type: 'text', required: true, maxLength: 80 },
    { name: 'subheadline', label: 'Subheadline', type: 'text', required: false, maxLength: 120 },
    { name: 'description', label: 'Description', type: 'richtext', required: false, maxLength: 300 },
    { name: 'primaryCTA', label: 'Primary CTA', type: 'object', required: true },
    { name: 'video', label: 'Hero Video', type: 'video', required: true },
  ],
  'hero-product': [
    { name: 'headline', label: 'Product Name', type: 'text', required: true, maxLength: 60 },
    { name: 'subheadline', label: 'Tagline', type: 'text', required: true, maxLength: 100 },
    { name: 'description', label: 'Description', type: 'richtext', required: true, maxLength: 500 },
    { name: 'features', label: 'Key Features', type: 'array', required: false, minItems: 2, maxItems: 4 },
    { name: 'primaryCTA', label: 'Primary CTA', type: 'object', required: true },
    { name: 'image', label: 'Product Image', type: 'image', required: true },
  ],
  'hero-gradient': [
    { name: 'headline', label: 'Main Headline', type: 'text', required: true, maxLength: 100 },
    { name: 'subheadline', label: 'Subheadline', type: 'text', required: false, maxLength: 150 },
    { name: 'primaryCTA', label: 'Primary CTA', type: 'object', required: true },
    { name: 'secondaryCTA', label: 'Secondary CTA', type: 'object', required: false },
    { name: 'statistics', label: 'Statistics', type: 'array', required: false, minItems: 2, maxItems: 4 },
  ],
};

/**
 * Features component slots
 */
const FEATURES_SLOTS: Record<string, ContentSlot[]> = {
  'features-grid': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: true, maxLength: 80 },
    { name: 'sectionDescription', label: 'Section Description', type: 'text', required: false, maxLength: 200 },
    { name: 'features', label: 'Features', type: 'array', required: true, minItems: 3, maxItems: 12, children: [
      { name: 'title', label: 'Feature Title', type: 'text', required: true, maxLength: 50 },
      { name: 'description', label: 'Feature Description', type: 'text', required: true, maxLength: 150 },
      { name: 'icon', label: 'Icon', type: 'text', required: false },
    ]},
  ],
  'features-alternating': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: false, maxLength: 80 },
    { name: 'features', label: 'Features', type: 'array', required: true, minItems: 2, maxItems: 6, children: [
      { name: 'title', label: 'Feature Title', type: 'text', required: true, maxLength: 60 },
      { name: 'description', label: 'Feature Description', type: 'richtext', required: true, maxLength: 300 },
      { name: 'image', label: 'Feature Image', type: 'image', required: true },
      { name: 'bullets', label: 'Bullet Points', type: 'array', required: false, maxItems: 4 },
    ]},
  ],
  'features-cards': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: true, maxLength: 80 },
    { name: 'sectionDescription', label: 'Section Description', type: 'text', required: false, maxLength: 200 },
    { name: 'features', label: 'Feature Cards', type: 'array', required: true, minItems: 3, maxItems: 9, children: [
      { name: 'title', label: 'Card Title', type: 'text', required: true, maxLength: 50 },
      { name: 'description', label: 'Card Description', type: 'text', required: true, maxLength: 200 },
      { name: 'icon', label: 'Icon', type: 'text', required: false },
      { name: 'link', label: 'Learn More Link', type: 'link', required: false },
    ]},
  ],
  'features-tabs': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: true, maxLength: 80 },
    { name: 'features', label: 'Tab Features', type: 'array', required: true, minItems: 3, maxItems: 6, children: [
      { name: 'title', label: 'Tab Title', type: 'text', required: true, maxLength: 30 },
      { name: 'description', label: 'Content', type: 'richtext', required: true, maxLength: 500 },
      { name: 'image', label: 'Tab Image', type: 'image', required: false },
    ]},
  ],
  'features-icons': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: true, maxLength: 80 },
    { name: 'sectionDescription', label: 'Section Description', type: 'text', required: false, maxLength: 200 },
    { name: 'features', label: 'Features', type: 'array', required: true, minItems: 4, maxItems: 8, children: [
      { name: 'title', label: 'Feature Title', type: 'text', required: true, maxLength: 40 },
      { name: 'description', label: 'Feature Description', type: 'text', required: true, maxLength: 100 },
      { name: 'icon', label: 'Icon', type: 'text', required: true },
    ]},
  ],
};

/**
 * Social proof component slots
 */
const SOCIAL_PROOF_SLOTS: Record<string, ContentSlot[]> = {
  'testimonials-grid': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: false, maxLength: 80 },
    { name: 'testimonials', label: 'Testimonials', type: 'array', required: true, minItems: 3, maxItems: 9, children: [
      { name: 'quote', label: 'Quote', type: 'text', required: true, minLength: 50, maxLength: 300 },
      { name: 'author', label: 'Author Name', type: 'text', required: true, maxLength: 50 },
      { name: 'role', label: 'Role/Title', type: 'text', required: true, maxLength: 50 },
      { name: 'company', label: 'Company', type: 'text', required: false, maxLength: 50 },
      { name: 'avatar', label: 'Avatar', type: 'image', required: false },
    ]},
  ],
  'testimonials-carousel': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: false, maxLength: 80 },
    { name: 'testimonials', label: 'Testimonials', type: 'array', required: true, minItems: 3, maxItems: 10, children: [
      { name: 'quote', label: 'Quote', type: 'text', required: true, minLength: 50, maxLength: 400 },
      { name: 'author', label: 'Author Name', type: 'text', required: true, maxLength: 50 },
      { name: 'role', label: 'Role/Title', type: 'text', required: true, maxLength: 50 },
      { name: 'company', label: 'Company', type: 'text', required: false, maxLength: 50 },
      { name: 'avatar', label: 'Avatar', type: 'image', required: false },
      { name: 'rating', label: 'Star Rating', type: 'text', required: false },
    ]},
  ],
  'testimonials-featured': [
    { name: 'testimonials', label: 'Featured Testimonial', type: 'array', required: true, minItems: 1, maxItems: 1, children: [
      { name: 'quote', label: 'Quote', type: 'text', required: true, minLength: 100, maxLength: 500 },
      { name: 'author', label: 'Author Name', type: 'text', required: true, maxLength: 50 },
      { name: 'role', label: 'Role/Title', type: 'text', required: true, maxLength: 50 },
      { name: 'company', label: 'Company', type: 'text', required: true, maxLength: 50 },
      { name: 'avatar', label: 'Avatar', type: 'image', required: true },
      { name: 'logo', label: 'Company Logo', type: 'image', required: false },
    ]},
  ],
  'logo-cloud': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: false, maxLength: 80 },
    { name: 'logos', label: 'Logos', type: 'array', required: true, minItems: 4, maxItems: 12, children: [
      { name: 'name', label: 'Company Name', type: 'text', required: true, maxLength: 50 },
      { name: 'image', label: 'Logo Image', type: 'image', required: true },
      { name: 'link', label: 'Link', type: 'link', required: false },
    ]},
  ],
  'stats-grid': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: false, maxLength: 80 },
    { name: 'statistics', label: 'Statistics', type: 'array', required: true, minItems: 3, maxItems: 6, children: [
      { name: 'value', label: 'Value', type: 'text', required: true, maxLength: 20 },
      { name: 'label', label: 'Label', type: 'text', required: true, maxLength: 50 },
      { name: 'description', label: 'Description', type: 'text', required: false, maxLength: 100 },
    ]},
  ],
  'case-study-cards': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: true, maxLength: 80 },
    { name: 'sectionDescription', label: 'Section Description', type: 'text', required: false, maxLength: 200 },
    { name: 'testimonials', label: 'Case Studies', type: 'array', required: true, minItems: 2, maxItems: 4, children: [
      { name: 'company', label: 'Company Name', type: 'text', required: true, maxLength: 50 },
      { name: 'quote', label: 'Summary', type: 'text', required: true, maxLength: 200 },
      { name: 'author', label: 'Contact Name', type: 'text', required: false, maxLength: 50 },
      { name: 'role', label: 'Contact Role', type: 'text', required: false, maxLength: 50 },
      { name: 'logo', label: 'Company Logo', type: 'image', required: false },
    ]},
  ],
};

/**
 * Pricing component slots
 */
const PRICING_SLOTS: Record<string, ContentSlot[]> = {
  'pricing-tiers': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: true, maxLength: 80 },
    { name: 'sectionDescription', label: 'Section Description', type: 'text', required: false, maxLength: 200 },
    { name: 'pricingTiers', label: 'Pricing Tiers', type: 'array', required: true, minItems: 2, maxItems: 4, children: [
      { name: 'name', label: 'Tier Name', type: 'text', required: true, maxLength: 30 },
      { name: 'price', label: 'Price', type: 'text', required: true, maxLength: 20 },
      { name: 'period', label: 'Period', type: 'text', required: false, maxLength: 20 },
      { name: 'description', label: 'Description', type: 'text', required: true, maxLength: 100 },
      { name: 'features', label: 'Features', type: 'array', required: true, minItems: 3, maxItems: 10 },
      { name: 'cta', label: 'CTA', type: 'object', required: true },
      { name: 'highlighted', label: 'Highlighted', type: 'text', required: false },
      { name: 'badge', label: 'Badge', type: 'text', required: false },
    ]},
  ],
  'pricing-comparison': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: true, maxLength: 80 },
    { name: 'pricingTiers', label: 'Plans to Compare', type: 'array', required: true, minItems: 2, maxItems: 4 },
    { name: 'features', label: 'Comparison Features', type: 'array', required: true, minItems: 5, maxItems: 20 },
  ],
  'pricing-simple': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: true, maxLength: 80 },
    { name: 'description', label: 'Description', type: 'text', required: false, maxLength: 200 },
    { name: 'pricingTiers', label: 'Single Tier', type: 'array', required: true, minItems: 1, maxItems: 1 },
    { name: 'primaryCTA', label: 'CTA', type: 'object', required: true },
  ],
};

/**
 * CTA component slots
 */
const CTA_SLOTS: Record<string, ContentSlot[]> = {
  'cta-centered': [
    { name: 'headline', label: 'Headline', type: 'text', required: true, maxLength: 80 },
    { name: 'description', label: 'Description', type: 'text', required: false, maxLength: 200 },
    { name: 'primaryCTA', label: 'Primary CTA', type: 'object', required: true, children: [
      { name: 'text', label: 'Button Text', type: 'text', required: true, maxLength: 30 },
      { name: 'link', label: 'Button Link', type: 'link', required: true },
    ]},
    { name: 'secondaryCTA', label: 'Secondary CTA', type: 'object', required: false },
  ],
  'cta-split': [
    { name: 'headline', label: 'Headline', type: 'text', required: true, maxLength: 80 },
    { name: 'description', label: 'Description', type: 'richtext', required: true, maxLength: 300 },
    { name: 'bullets', label: 'Key Points', type: 'array', required: false, maxItems: 4 },
    { name: 'primaryCTA', label: 'Primary CTA', type: 'object', required: true },
    { name: 'image', label: 'Image', type: 'image', required: false },
  ],
  'cta-banner': [
    { name: 'headline', label: 'Headline', type: 'text', required: true, maxLength: 60 },
    { name: 'primaryCTA', label: 'CTA', type: 'object', required: true },
    { name: 'backgroundImage', label: 'Background', type: 'image', required: false },
  ],
  'cta-newsletter': [
    { name: 'headline', label: 'Headline', type: 'text', required: true, maxLength: 60 },
    { name: 'description', label: 'Description', type: 'text', required: false, maxLength: 150 },
    { name: 'primaryCTA', label: 'Submit Button', type: 'object', required: true },
  ],
  'cta-floating': [
    { name: 'headline', label: 'Headline', type: 'text', required: true, maxLength: 40 },
    { name: 'primaryCTA', label: 'CTA', type: 'object', required: true },
  ],
};

/**
 * Content/Process component slots
 */
const CONTENT_SLOTS: Record<string, ContentSlot[]> = {
  'process-steps': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: true, maxLength: 80 },
    { name: 'sectionDescription', label: 'Section Description', type: 'text', required: false, maxLength: 200 },
    { name: 'processSteps', label: 'Steps', type: 'array', required: true, minItems: 3, maxItems: 6, children: [
      { name: 'step', label: 'Step Number', type: 'text', required: true },
      { name: 'title', label: 'Step Title', type: 'text', required: true, maxLength: 50 },
      { name: 'description', label: 'Step Description', type: 'text', required: true, maxLength: 200 },
      { name: 'icon', label: 'Icon', type: 'text', required: false },
    ]},
  ],
  'faq-accordion': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: true, maxLength: 80 },
    { name: 'sectionDescription', label: 'Section Description', type: 'text', required: false, maxLength: 200 },
    { name: 'faqs', label: 'FAQs', type: 'array', required: true, minItems: 3, maxItems: 15, children: [
      { name: 'question', label: 'Question', type: 'text', required: true, maxLength: 150 },
      { name: 'answer', label: 'Answer', type: 'richtext', required: true, maxLength: 500 },
    ]},
  ],
  'content-text': [
    { name: 'headline', label: 'Headline', type: 'text', required: false, maxLength: 80 },
    { name: 'description', label: 'Content', type: 'richtext', required: true },
  ],
  'timeline-vertical': [
    { name: 'sectionTitle', label: 'Section Title', type: 'text', required: true, maxLength: 80 },
    { name: 'processSteps', label: 'Timeline Items', type: 'array', required: true, minItems: 3, maxItems: 8, children: [
      { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 50 },
      { name: 'description', label: 'Description', type: 'text', required: true, maxLength: 200 },
      { name: 'icon', label: 'Icon', type: 'text', required: false },
    ]},
  ],
};

/**
 * Navigation component slots
 */
const NAV_SLOTS: Record<string, ContentSlot[]> = {
  'header-simple': [
    { name: 'custom', label: 'Navigation Items', type: 'object', required: true },
  ],
  'header-mega': [
    { name: 'custom', label: 'Mega Menu Config', type: 'object', required: true },
  ],
  'footer-simple': [
    { name: 'custom', label: 'Footer Links', type: 'object', required: true },
  ],
  'footer-complex': [
    { name: 'custom', label: 'Footer Config', type: 'object', required: true },
  ],
};

// ============================================================================
// COMPONENT SLOT DEFINITIONS MAP
// ============================================================================

export const COMPONENT_SLOT_DEFINITIONS: Record<string, ContentSlot[]> = {
  // Heroes
  ...HERO_SLOTS,
  // Features
  ...FEATURES_SLOTS,
  // Social Proof
  ...SOCIAL_PROOF_SLOTS,
  // Pricing
  ...PRICING_SLOTS,
  // CTAs
  ...CTA_SLOTS,
  // Content
  ...CONTENT_SLOTS,
  // Navigation
  ...NAV_SLOTS,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get content slots for a component variant
 */
export function getComponentSlots(componentId: string): ContentSlot[] {
  return COMPONENT_SLOT_DEFINITIONS[componentId] || [];
}

/**
 * Get required slot names for a component
 */
export function getRequiredSlots(componentId: string): string[] {
  const slots = getComponentSlots(componentId);
  return slots.filter((slot) => slot.required).map((slot) => slot.name);
}

/**
 * Get optional slot names for a component
 */
export function getOptionalSlots(componentId: string): string[] {
  const slots = getComponentSlots(componentId);
  return slots.filter((slot) => !slot.required).map((slot) => slot.name);
}

/**
 * Get slot constraints (length/count) for a component
 */
export function getSlotConstraints(
  componentId: string
): ComponentContentRequirements['lengthConstraints'] {
  const slots = getComponentSlots(componentId);
  const constraints: ComponentContentRequirements['lengthConstraints'] = {};

  for (const slot of slots) {
    if (slot.minLength !== undefined || slot.maxLength !== undefined) {
      constraints[slot.name] = {
        min: slot.minLength,
        max: slot.maxLength,
      };
    }
    if (slot.minItems !== undefined || slot.maxItems !== undefined) {
      constraints[slot.name] = {
        min: slot.minItems,
        max: slot.maxItems,
      };
    }
  }

  return constraints;
}

/**
 * Get full component content requirements
 */
export function getComponentContentRequirements(
  componentId: string
): ComponentContentRequirements {
  const slots = getComponentSlots(componentId);

  return {
    componentId: componentId,
    required: getRequiredSlots(componentId),
    optional: getOptionalSlots(componentId),
    slots,
    lengthConstraints: getSlotConstraints(componentId),
    countConstraints: slots.reduce(
      (acc, slot) => {
        if (slot.minItems !== undefined || slot.maxItems !== undefined) {
          acc[slot.name] = { min: slot.minItems, max: slot.maxItems };
        }
        return acc;
      },
      {} as ComponentContentRequirements['countConstraints']
    ),
  };
}

/**
 * Validate content against slot requirements
 */
export function validateContent(
  content: Record<string, unknown>,
  componentId: string
): { valid: boolean; errors: string[] } {
  const requirements = getComponentContentRequirements(componentId);
  const errors: string[] = [];

  // Check required slots
  for (const required of requirements.required) {
    const value = content[required];
    if (value === undefined || value === null || value === '') {
      errors.push(`Missing required slot: ${required}`);
    }
    if (Array.isArray(value) && value.length === 0) {
      errors.push(`Required slot is empty: ${required}`);
    }
  }

  // Check length constraints
  for (const [slotName, constraint] of Object.entries(requirements.lengthConstraints)) {
    const value = content[slotName];
    if (typeof value === 'string') {
      if (constraint.min && value.length < constraint.min) {
        errors.push(`${slotName} is too short (min: ${constraint.min})`);
      }
      if (constraint.max && value.length > constraint.max) {
        errors.push(`${slotName} is too long (max: ${constraint.max})`);
      }
    }
  }

  // Check count constraints
  for (const [slotName, constraint] of Object.entries(requirements.countConstraints)) {
    const value = content[slotName];
    if (Array.isArray(value)) {
      if (constraint.min && value.length < constraint.min) {
        errors.push(`${slotName} has too few items (min: ${constraint.min})`);
      }
      if (constraint.max && value.length > constraint.max) {
        errors.push(`${slotName} has too many items (max: ${constraint.max})`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get suggested content structure for a component
 */
export function getSuggestedContentStructure(
  componentId: string
): Record<string, unknown> {
  const slots = getComponentSlots(componentId);
  const structure: Record<string, unknown> = {};

  for (const slot of slots) {
    switch (slot.type) {
      case 'text':
      case 'richtext':
        structure[slot.name] = '';
        break;
      case 'link':
        structure[slot.name] = '#';
        break;
      case 'image':
        structure[slot.name] = { src: '', alt: '' };
        break;
      case 'video':
        structure[slot.name] = { src: '', poster: '' };
        break;
      case 'array':
        structure[slot.name] = [];
        break;
      case 'object':
        if (slot.children) {
          const childStructure: Record<string, unknown> = {};
          for (const child of slot.children) {
            childStructure[child.name] = child.type === 'array' ? [] : '';
          }
          structure[slot.name] = childStructure;
        } else {
          structure[slot.name] = {};
        }
        break;
    }
  }

  return structure;
}
