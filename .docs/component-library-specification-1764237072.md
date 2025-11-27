# Component Library Specification
## AI-Powered Dynamic Marketing Website Builder

**Version:** 1.0  
**Date:** November 2024

---

## 1. Overview

The Component Library is a comprehensive collection of reusable UI components designed for AI-driven dynamic website generation. Each component is built with:
- Tailwind CSS for styling
- Framer Motion for animations
- TypeScript for type safety
- AI metadata for intelligent selection

---

## 2. Component Categories

| Category | Purpose | Component Count |
|----------|---------|-----------------|
| Hero | Capture attention, establish value | 8 |
| Features | Showcase product capabilities | 10 |
| Social Proof | Build trust and credibility | 6 |
| Pricing | Present pricing options | 5 |
| CTA | Drive conversions | 8 |
| Content | Present information | 12 |
| Navigation | Site navigation | 4 |
| Forms | Data capture | 6 |
| Interactive | Engagement elements | 10 |
| Footer | Site footer | 4 |

---

## 3. Component Schema

### 3.1 Base Component Interface

```typescript
interface ComponentDefinition {
  // Identity
  id: string;
  name: string;
  category: ComponentCategory;
  version: string;
  
  // Configuration
  schema: JSONSchema7;
  defaultProps: Record<string, unknown>;
  variants: ComponentVariant[];
  
  // AI Metadata
  aiMetadata: AIMetadata;
  
  // Technical
  dependencies: string[];
  responsive: ResponsiveConfig;
  accessibility: AccessibilityConfig;
}

interface AIMetadata {
  // When AI should use this component
  useCases: string[];
  
  // Content requirements
  contentRequirements: {
    required: string[];
    optional: string[];
    minLength?: Record<string, number>;
    maxLength?: Record<string, number>;
  };
  
  // Best fits with personas
  personaFit: PersonaFitScore[];
  
  // Position preferences
  positionHints: {
    preferredPosition: 'top' | 'middle' | 'bottom';
    avoidAfter?: string[];
    preferAfter?: string[];
  };
  
  // Storytelling role
  narrativeRole: 'hook' | 'problem' | 'solution' | 'proof' | 'action';
}

interface ComponentVariant {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
  overrides: Partial<Record<string, unknown>>;
}
```

---

## 4. Hero Components

### 4.1 Hero Split (hero-split)

**Description:** Split-screen hero with content on one side and image/video on the other.

```typescript
const heroSplit: ComponentDefinition = {
  id: 'hero-split',
  name: 'Hero Split',
  category: 'hero',
  
  schema: {
    type: 'object',
    properties: {
      headline: { type: 'string', maxLength: 80 },
      subheadline: { type: 'string', maxLength: 200 },
      primaryCTA: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          href: { type: 'string' },
          variant: { enum: ['primary', 'secondary'] }
        }
      },
      secondaryCTA: { /* same as primaryCTA */ },
      media: {
        type: 'object',
        properties: {
          type: { enum: ['image', 'video', 'lottie'] },
          src: { type: 'string' },
          alt: { type: 'string' }
        }
      },
      layout: { enum: ['content-left', 'content-right'] },
      backgroundStyle: { enum: ['solid', 'gradient', 'pattern'] }
    },
    required: ['headline', 'media']
  },
  
  aiMetadata: {
    useCases: [
      'Product launch pages',
      'SaaS landing pages',
      'Feature announcements',
      'High-impact homepages'
    ],
    contentRequirements: {
      required: ['headline', 'media'],
      optional: ['subheadline', 'primaryCTA', 'secondaryCTA'],
      minLength: { headline: 20 },
      maxLength: { headline: 80, subheadline: 200 }
    },
    personaFit: [
      { persona: 'technical', score: 0.8 },
      { persona: 'business', score: 0.9 },
      { persona: 'executive', score: 0.7 }
    ],
    positionHints: {
      preferredPosition: 'top',
      avoidAfter: ['hero-centered', 'hero-video']
    },
    narrativeRole: 'hook'
  },
  
  variants: [
    {
      id: 'hero-split-gradient',
      name: 'Gradient Background',
      overrides: { backgroundStyle: 'gradient' }
    },
    {
      id: 'hero-split-video',
      name: 'Video Background',
      overrides: { media: { type: 'video' } }
    }
  ]
};
```

### 4.2 Hero Centered (hero-centered)

**Description:** Full-width centered hero with prominent headline.

```typescript
const heroCentered: ComponentDefinition = {
  id: 'hero-centered',
  name: 'Hero Centered',
  category: 'hero',
  
  schema: {
    type: 'object',
    properties: {
      badge: { type: 'string', maxLength: 30 },
      headline: { type: 'string', maxLength: 100 },
      subheadline: { type: 'string', maxLength: 250 },
      primaryCTA: { /* CTA schema */ },
      secondaryCTA: { /* CTA schema */ },
      trustedBy: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            logo: { type: 'string' },
            name: { type: 'string' }
          }
        }
      },
      backgroundMedia: { /* media schema */ }
    }
  },
  
  aiMetadata: {
    useCases: [
      'B2B SaaS homepages',
      'Enterprise landing pages',
      'Corporate websites',
      'When social proof is important'
    ],
    narrativeRole: 'hook'
  }
};
```

### 4.3 Hero Video (hero-video)

**Description:** Full-screen video background hero.

### 4.4 Hero Animated (hero-animated)

**Description:** Hero with animated elements and scroll-triggered effects.

### 4.5 Hero Product (hero-product)

**Description:** Hero showcasing product screenshot/mockup prominently.

### 4.6 Hero Minimal (hero-minimal)

**Description:** Clean, minimal hero with focus on typography.

### 4.7 Hero Interactive (hero-interactive)

**Description:** Hero with interactive demo or playground element.

### 4.8 Hero Stats (hero-stats)

**Description:** Hero featuring key statistics/metrics prominently.

---

## 5. Features Components

### 5.1 Features Grid (features-grid)

**Description:** Grid layout of feature cards.

```typescript
const featuresGrid: ComponentDefinition = {
  id: 'features-grid',
  name: 'Features Grid',
  category: 'features',
  
  schema: {
    type: 'object',
    properties: {
      sectionTitle: { type: 'string' },
      sectionDescription: { type: 'string' },
      features: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            icon: { type: 'string' },
            title: { type: 'string', maxLength: 50 },
            description: { type: 'string', maxLength: 150 }
          }
        },
        minItems: 3,
        maxItems: 12
      },
      columns: { enum: [2, 3, 4] },
      cardStyle: { enum: ['elevated', 'bordered', 'flat'] }
    }
  },
  
  aiMetadata: {
    useCases: [
      'Displaying multiple features equally',
      'Product capabilities overview',
      'Service offerings'
    ],
    contentRequirements: {
      required: ['features'],
      optional: ['sectionTitle', 'sectionDescription'],
      minLength: { features: 3 }
    },
    narrativeRole: 'solution'
  }
};
```

### 5.2 Features Alternating (features-alternating)

**Description:** Features displayed in alternating left/right layout.

```typescript
const featuresAlternating: ComponentDefinition = {
  id: 'features-alternating',
  name: 'Features Alternating',
  category: 'features',
  
  schema: {
    type: 'object',
    properties: {
      features: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            media: { /* media schema */ },
            bullets: { type: 'array', items: { type: 'string' } },
            cta: { /* CTA schema */ }
          }
        }
      }
    }
  },
  
  aiMetadata: {
    useCases: [
      'Deep-dive into key features',
      'When features need visual explanation',
      'Feature comparison pages'
    ],
    narrativeRole: 'solution'
  }
};
```

### 5.3 Features Tabs (features-tabs)

**Description:** Tabbed interface for feature categories.

### 5.4 Features Carousel (features-carousel)

**Description:** Carousel/slider for features with rich media.

### 5.5 Features Bento (features-bento)

**Description:** Bento grid layout with varied card sizes.

### 5.6 Features Comparison (features-comparison)

**Description:** Feature comparison table.

### 5.7 Features Timeline (features-timeline)

**Description:** Features presented in timeline format.

### 5.8 Features Showcase (features-showcase)

**Description:** Large feature showcase with interactive elements.

### 5.9 Features Icon List (features-icon-list)

**Description:** Simple icon + text list of features.

### 5.10 Features Accordion (features-accordion)

**Description:** Expandable accordion for feature details.

---

## 6. Social Proof Components

### 6.1 Testimonials Grid (testimonials-grid)

```typescript
const testimonialsGrid: ComponentDefinition = {
  id: 'testimonials-grid',
  name: 'Testimonials Grid',
  category: 'social-proof',
  
  schema: {
    type: 'object',
    properties: {
      sectionTitle: { type: 'string' },
      testimonials: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            quote: { type: 'string' },
            author: { type: 'string' },
            title: { type: 'string' },
            company: { type: 'string' },
            avatar: { type: 'string' },
            companyLogo: { type: 'string' },
            rating: { type: 'number', minimum: 1, maximum: 5 }
          }
        }
      },
      layout: { enum: ['grid', 'masonry'] },
      showRatings: { type: 'boolean' }
    }
  },
  
  aiMetadata: {
    useCases: [
      'Building trust with prospects',
      'Showcasing customer success',
      'B2B credibility building'
    ],
    personaFit: [
      { persona: 'business', score: 0.9 },
      { persona: 'executive', score: 0.95 }
    ],
    narrativeRole: 'proof'
  }
};
```

### 6.2 Testimonials Carousel (testimonials-carousel)

**Description:** Sliding testimonial carousel.

### 6.3 Logos Marquee (logos-marquee)

**Description:** Scrolling logo strip of customers/partners.

### 6.4 Case Studies Preview (case-studies-preview)

**Description:** Featured case study cards.

### 6.5 Stats Counter (stats-counter)

**Description:** Animated statistics counters.

### 6.6 Awards & Recognition (awards)

**Description:** Display awards, certifications, press mentions.

---

## 7. Pricing Components

### 7.1 Pricing Cards (pricing-cards)

```typescript
const pricingCards: ComponentDefinition = {
  id: 'pricing-cards',
  name: 'Pricing Cards',
  category: 'pricing',
  
  schema: {
    type: 'object',
    properties: {
      sectionTitle: { type: 'string' },
      billingToggle: { type: 'boolean' },
      plans: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: {
              type: 'object',
              properties: {
                monthly: { type: 'number' },
                yearly: { type: 'number' },
                currency: { type: 'string' }
              }
            },
            features: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  included: { type: 'boolean' }
                }
              }
            },
            popular: { type: 'boolean' },
            cta: { /* CTA schema */ }
          }
        }
      },
      comparisonLink: { type: 'string' }
    }
  },
  
  aiMetadata: {
    useCases: [
      'SaaS pricing pages',
      'Subscription offerings',
      'Tiered service pricing'
    ],
    narrativeRole: 'action'
  }
};
```

### 7.2 Pricing Table (pricing-table)

**Description:** Detailed comparison table.

### 7.3 Pricing Calculator (pricing-calculator)

**Description:** Interactive pricing calculator.

### 7.4 Pricing Simple (pricing-simple)

**Description:** Single-price or simple pricing display.

### 7.5 Pricing Enterprise (pricing-enterprise)

**Description:** Enterprise/contact sales pricing layout.

---

## 8. CTA Components

### 8.1 CTA Banner (cta-banner)

```typescript
const ctaBanner: ComponentDefinition = {
  id: 'cta-banner',
  name: 'CTA Banner',
  category: 'cta',
  
  schema: {
    type: 'object',
    properties: {
      headline: { type: 'string' },
      description: { type: 'string' },
      primaryCTA: { /* CTA schema */ },
      secondaryCTA: { /* CTA schema */ },
      style: { enum: ['gradient', 'solid', 'image'] },
      backgroundImage: { type: 'string' }
    }
  },
  
  aiMetadata: {
    useCases: [
      'Page section breaks',
      'Conversion focus areas',
      'Newsletter signups'
    ],
    positionHints: {
      preferredPosition: 'bottom',
      preferAfter: ['features-grid', 'testimonials-grid']
    },
    narrativeRole: 'action'
  }
};
```

### 8.2 CTA Inline (cta-inline)

**Description:** Inline CTA within content sections.

### 8.3 CTA Sticky (cta-sticky)

**Description:** Sticky/floating CTA bar.

### 8.4 CTA Card (cta-card)

**Description:** Card-style CTA with icon/image.

### 8.5 CTA Email Capture (cta-email)

**Description:** Email signup focused CTA.

### 8.6 CTA Demo Request (cta-demo)

**Description:** Demo/trial request CTA.

### 8.7 CTA Exit Intent (cta-exit)

**Description:** Popup CTA on exit intent.

### 8.8 CTA Scroll Triggered (cta-scroll)

**Description:** CTA that appears on scroll threshold.

---

## 9. Content Components

### 9.1 Content Rich Text (content-rich)

**Description:** Rich text content block.

### 9.2 Content Two Column (content-two-col)

**Description:** Two-column content layout.

### 9.3 Content Image Text (content-image-text)

**Description:** Image with accompanying text.

### 9.4 Content Video (content-video)

**Description:** Embedded video with context.

### 9.5 Content Quote (content-quote)

**Description:** Pull quote or blockquote.

### 9.6 Content FAQ (content-faq)

```typescript
const contentFaq: ComponentDefinition = {
  id: 'content-faq',
  name: 'FAQ Section',
  category: 'content',
  
  schema: {
    type: 'object',
    properties: {
      sectionTitle: { type: 'string' },
      sectionDescription: { type: 'string' },
      faqs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            answer: { type: 'string' },
            category: { type: 'string' }
          }
        }
      },
      layout: { enum: ['accordion', 'grid', 'two-column'] },
      showCategories: { type: 'boolean' },
      searchable: { type: 'boolean' }
    }
  },
  
  aiMetadata: {
    useCases: [
      'Addressing common questions',
      'Reducing support burden',
      'SEO content'
    ],
    positionHints: {
      preferredPosition: 'bottom',
      preferAfter: ['pricing-cards', 'features-grid']
    },
    narrativeRole: 'proof'
  }
};
```

### 9.7 Content Steps (content-steps)

**Description:** Numbered steps/process visualization.

### 9.8 Content Glossary (content-glossary)

**Description:** Term definitions display.

### 9.9 Content Table (content-table)

**Description:** Data table component.

### 9.10 Content Code Block (content-code)

**Description:** Code snippet display.

### 9.11 Content Callout (content-callout)

**Description:** Highlighted callout/tip box.

### 9.12 Content Divider (content-divider)

**Description:** Section divider with optional content.

---

## 10. Interactive Components

### 10.1 Interactive Quiz (interactive-quiz)

```typescript
const interactiveQuiz: ComponentDefinition = {
  id: 'interactive-quiz',
  name: 'Interactive Quiz',
  category: 'interactive',
  
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            type: { enum: ['single', 'multiple', 'scale'] },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  value: { type: 'string' },
                  personaWeight: {
                    type: 'object',
                    additionalProperties: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      },
      outcomes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            cta: { /* CTA schema */ },
            personaMatch: { type: 'string' }
          }
        }
      },
      showProgress: { type: 'boolean' },
      collectEmail: { type: 'boolean' }
    }
  },
  
  aiMetadata: {
    useCases: [
      'Persona identification',
      'Lead qualification',
      'Product recommendation',
      'Engagement and education'
    ],
    narrativeRole: 'hook'
  }
};
```

### 10.2 Interactive Survey (interactive-survey)

**Description:** Multi-step survey component.

### 10.3 Interactive Calculator (interactive-calculator)

**Description:** ROI/savings calculator.

### 10.4 Interactive Comparison (interactive-comparison)

**Description:** Before/after comparison slider.

### 10.5 Interactive Timeline (interactive-timeline)

**Description:** Scrollable/clickable timeline.

### 10.6 Interactive Carousel (interactive-carousel)

**Description:** Advanced carousel with thumbnails.

### 10.7 Interactive Map (interactive-map)

**Description:** Location map with markers.

### 10.8 Interactive Tabs (interactive-tabs)

**Description:** Tabbed content interface.

### 10.9 Interactive Modal (interactive-modal)

**Description:** Modal/popup component.

### 10.10 Interactive Drawer (interactive-drawer)

**Description:** Slide-out drawer component.

---

## 11. Form Components

### 11.1 Form Contact (form-contact)

```typescript
const formContact: ComponentDefinition = {
  id: 'form-contact',
  name: 'Contact Form',
  category: 'forms',
  
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            label: { type: 'string' },
            type: { enum: ['text', 'email', 'phone', 'textarea', 'select', 'checkbox'] },
            required: { type: 'boolean' },
            placeholder: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      submitText: { type: 'string' },
      successMessage: { type: 'string' },
      layout: { enum: ['single-column', 'two-column'] },
      submitAction: {
        type: 'object',
        properties: {
          type: { enum: ['supabase', 'webhook', 'email'] },
          config: { type: 'object' }
        }
      }
    }
  },
  
  aiMetadata: {
    useCases: [
      'Contact forms',
      'Lead capture',
      'Support requests'
    ],
    narrativeRole: 'action'
  }
};
```

### 11.2 Form Newsletter (form-newsletter)

**Description:** Email newsletter signup.

### 11.3 Form Demo Request (form-demo)

**Description:** Demo/trial request form.

### 11.4 Form Multi-Step (form-multistep)

**Description:** Multi-step wizard form.

### 11.5 Form Inline (form-inline)

**Description:** Inline single-field form.

### 11.6 Form Survey (form-survey)

**Description:** Survey/feedback form.

---

## 12. Navigation Components

### 12.1 Navigation Header (nav-header)

```typescript
const navHeader: ComponentDefinition = {
  id: 'nav-header',
  name: 'Header Navigation',
  category: 'navigation',
  
  schema: {
    type: 'object',
    properties: {
      logo: {
        type: 'object',
        properties: {
          image: { type: 'string' },
          text: { type: 'string' },
          href: { type: 'string' }
        }
      },
      links: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            href: { type: 'string' },
            children: { type: 'array' }
          }
        }
      },
      cta: { /* CTA schema */ },
      sticky: { type: 'boolean' },
      transparent: { type: 'boolean' }
    }
  }
};
```

### 12.2 Navigation Mega Menu (nav-mega)

**Description:** Mega menu dropdown navigation.

### 12.3 Navigation Sidebar (nav-sidebar)

**Description:** Sidebar navigation for documentation.

### 12.4 Navigation Breadcrumb (nav-breadcrumb)

**Description:** Breadcrumb navigation trail.

---

## 13. Footer Components

### 13.1 Footer Standard (footer-standard)

```typescript
const footerStandard: ComponentDefinition = {
  id: 'footer-standard',
  name: 'Standard Footer',
  category: 'footer',
  
  schema: {
    type: 'object',
    properties: {
      logo: { /* logo schema */ },
      description: { type: 'string' },
      columns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            links: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  href: { type: 'string' }
                }
              }
            }
          }
        }
      },
      socialLinks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            href: { type: 'string' }
          }
        }
      },
      newsletter: { type: 'boolean' },
      copyright: { type: 'string' },
      legalLinks: { type: 'array' }
    }
  }
};
```

### 13.2 Footer Minimal (footer-minimal)

**Description:** Simple minimal footer.

### 13.3 Footer CTA (footer-cta)

**Description:** Footer with prominent CTA.

### 13.4 Footer Sitemap (footer-sitemap)

**Description:** Comprehensive sitemap footer.

---

## 14. Component Registry API

```typescript
class ComponentRegistry {
  private components: Map<string, ComponentDefinition>;
  
  // Register a new component
  register(component: ComponentDefinition): void {
    this.validateComponent(component);
    this.components.set(component.id, component);
  }
  
  // Get component by ID
  get(id: string): ComponentDefinition | undefined {
    return this.components.get(id);
  }
  
  // List all components, optionally filtered by category
  list(category?: ComponentCategory): ComponentDefinition[] {
    const all = Array.from(this.components.values());
    return category ? all.filter(c => c.category === category) : all;
  }
  
  // Find best component for given context
  findBestMatch(context: SelectionContext): ComponentDefinition[] {
    const scored = this.list()
      .map(component => ({
        component,
        score: this.calculateScore(component, context)
      }))
      .filter(({ score }) => score > 0.5)
      .sort((a, b) => b.score - a.score);
    
    return scored.slice(0, 5).map(s => s.component);
  }
  
  // Calculate match score for component selection
  private calculateScore(
    component: ComponentDefinition,
    context: SelectionContext
  ): number {
    let score = 0;
    
    // Content match
    const contentScore = this.calculateContentMatch(
      component.aiMetadata.contentRequirements,
      context.availableContent
    );
    score += contentScore * 0.3;
    
    // Use case match
    const useCaseScore = this.calculateUseCaseMatch(
      component.aiMetadata.useCases,
      context.intent
    );
    score += useCaseScore * 0.25;
    
    // Persona fit
    const personaScore = this.calculatePersonaFit(
      component.aiMetadata.personaFit,
      context.targetPersona
    );
    score += personaScore * 0.2;
    
    // Position appropriateness
    const positionScore = this.calculatePositionScore(
      component.aiMetadata.positionHints,
      context.position
    );
    score += positionScore * 0.15;
    
    // Narrative fit
    const narrativeScore = context.currentNarrativeStage === 
      component.aiMetadata.narrativeRole ? 1 : 0.5;
    score += narrativeScore * 0.1;
    
    return score;
  }
}
```

---

## 15. Responsive Design System

```typescript
interface ResponsiveConfig {
  breakpoints: {
    sm: 640;   // Mobile landscape
    md: 768;   // Tablet
    lg: 1024;  // Desktop
    xl: 1280;  // Large desktop
    '2xl': 1536; // Extra large
  };
  
  defaultBehavior: {
    stackOnMobile: boolean;
    hideOnMobile?: string[];  // Elements to hide
    showOnMobile?: string[];  // Mobile-only elements
  };
}

// Grid system
interface GridConfig {
  columns: {
    mobile: 4;
    tablet: 8;
    desktop: 12;
  };
  
  gutter: {
    mobile: '16px';
    tablet: '24px';
    desktop: '32px';
  };
  
  maxWidth: '1280px';
  padding: {
    mobile: '16px';
    tablet: '32px';
    desktop: '64px';
  };
}
```

---

## 16. Animation Presets

```typescript
const animationPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 }
  },
  
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  },
  
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5 }
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  },
  
  staggerChildren: {
    animate: { transition: { staggerChildren: 0.1 } }
  },
  
  hover: {
    scale: { scale: 1.02 },
    lift: { y: -4 },
    glow: { boxShadow: '0 0 20px rgba(0,0,0,0.1)' }
  }
};
```

---

## 17. Accessibility Standards

```typescript
interface AccessibilityConfig {
  // WCAG compliance level
  wcagLevel: 'A' | 'AA' | 'AAA';
  
  // Required accessibility features
  requirements: {
    colorContrast: { minRatio: 4.5 };
    focusIndicators: true;
    ariaLabels: true;
    keyboardNavigation: true;
    screenReaderSupport: true;
    reducedMotion: true;
  };
  
  // Semantic HTML requirements
  semanticHTML: {
    headingHierarchy: true;
    landmarkRegions: true;
    formLabels: true;
    altText: true;
    linkPurpose: true;
  };
}
```

---

## 18. Component Testing

```typescript
interface ComponentTest {
  // Visual regression tests
  visual: {
    variants: string[];
    viewports: ['mobile', 'tablet', 'desktop'];
    themes: ['light', 'dark'];
  };
  
  // Accessibility tests
  accessibility: {
    axeCore: true;
    contrastCheck: true;
    keyboardNav: true;
  };
  
  // Interaction tests
  interaction: {
    clicks: boolean;
    hovers: boolean;
    focus: boolean;
    animations: boolean;
  };
  
  // Performance tests
  performance: {
    renderTime: number;  // Max ms
    bundleSize: number;  // Max KB
  };
}
```
