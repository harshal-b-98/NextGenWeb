/**
 * Website Generation API
 * POST /api/workspaces/[workspaceId]/websites/[websiteId]/generate
 *
 * Generates a complete marketing website with all pages from the knowledge base.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractEntities } from '@/lib/ai/agents/entity-extraction';
import type { Json } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Max text length for entity extraction
const MAX_TEXT_LENGTH = 30000;

// Page configurations for generation
interface PageConfig {
  type: string;
  title: string;
  slug: string;
  isHomepage: boolean;
}

const MARKETING_PAGES: PageConfig[] = [
  { type: 'home', title: 'Home', slug: 'home', isHomepage: true },
  { type: 'features', title: 'Features', slug: 'features', isHomepage: false },
  { type: 'pricing', title: 'Pricing', slug: 'pricing', isHomepage: false },
  { type: 'about', title: 'About Us', slug: 'about', isHomepage: false },
  { type: 'contact', title: 'Contact', slug: 'contact', isHomepage: false },
];

// Types for knowledge content
interface KnowledgeContent {
  companyName: string;
  tagline: string;
  description: string;
  features: Array<{ title: string; description: string }>;
  benefits: string[];
  testimonials: Array<{ quote: string; author: string; role: string }>;
  stats: Array<{ value: string; label: string }>;
  pricing: Array<{ name: string; price: string; features: string[] }>;
  faqs: Array<{ question: string; answer: string }>;
  contactInfo: { email: string; phone?: string; address?: string };
}

// Extract knowledge content from entities and documents
function extractKnowledgeContent(
  entities: Array<{ entity_type: string; name: string; description?: string; metadata?: Record<string, unknown> }>,
  documents: Array<{ name: string; extracted_text: string }>
): KnowledgeContent {
  const content: KnowledgeContent = {
    companyName: 'Your Company',
    tagline: 'Transform Your Business',
    description: 'We help businesses achieve their goals with innovative solutions.',
    features: [],
    benefits: [],
    testimonials: [],
    stats: [],
    pricing: [],
    faqs: [],
    contactInfo: { email: 'contact@example.com' },
  };

  // Extract from entities
  for (const entity of entities) {
    switch (entity.entity_type) {
      case 'company':
      case 'organization':
        content.companyName = entity.name;
        if (entity.description) content.description = entity.description;
        break;
      case 'tagline':
      case 'slogan':
        content.tagline = entity.name;
        break;
      case 'feature':
      case 'capability':
        content.features.push({
          title: entity.name,
          description: entity.description || `Learn more about ${entity.name}`,
        });
        break;
      case 'benefit':
        content.benefits.push(entity.name);
        break;
      case 'testimonial':
        content.testimonials.push({
          quote: entity.name,
          author: (entity.metadata?.author as string) || 'Customer',
          role: (entity.metadata?.role as string) || 'User',
        });
        break;
      case 'statistic':
      case 'metric':
        content.stats.push({
          value: (entity.metadata?.value as string) || entity.name,
          label: entity.description || entity.name,
        });
        break;
      case 'pricing':
      case 'plan':
        content.pricing.push({
          name: entity.name,
          price: (entity.metadata?.price as string) || 'Contact Us',
          features: (entity.metadata?.features as string[]) || [],
        });
        break;
      case 'faq':
        content.faqs.push({
          question: entity.name,
          answer: entity.description || 'Please contact us for more information.',
        });
        break;
      case 'contact':
      case 'email':
        if (entity.metadata?.email) {
          content.contactInfo.email = entity.metadata.email as string;
        }
        break;
    }
  }

  // Extract key info from document text if entities are sparse
  if (content.features.length === 0 && documents.length > 0) {
    // Try to extract features from document text
    const text = documents[0]?.extracted_text || '';
    const lines = text.split('\n').filter(l => l.trim().length > 10 && l.trim().length < 100);
    const potentialFeatures = lines.slice(0, 6);
    content.features = potentialFeatures.map((line, i) => ({
      title: `Feature ${i + 1}`,
      description: line.trim(),
    }));
  }

  // Set defaults if nothing extracted
  if (content.features.length === 0) {
    content.features = [
      { title: 'Easy to Use', description: 'Intuitive interface that anyone can master quickly.' },
      { title: 'Powerful Features', description: 'Advanced capabilities to help you achieve more.' },
      { title: 'Great Support', description: '24/7 customer support to help you succeed.' },
    ];
  }

  if (content.pricing.length === 0) {
    content.pricing = [
      { name: 'Starter', price: '$9/mo', features: ['Basic features', 'Email support', '1 user'] },
      { name: 'Professional', price: '$29/mo', features: ['All Starter features', 'Priority support', '5 users', 'Advanced analytics'] },
      { name: 'Enterprise', price: 'Contact Us', features: ['All Professional features', 'Dedicated support', 'Unlimited users', 'Custom integrations'] },
    ];
  }

  if (content.stats.length === 0) {
    content.stats = [
      { value: '10K+', label: 'Happy Customers' },
      { value: '99%', label: 'Satisfaction Rate' },
      { value: '24/7', label: 'Support Available' },
    ];
  }

  if (content.faqs.length === 0) {
    content.faqs = [
      { question: 'How do I get started?', answer: 'Simply sign up for a free account and follow our quick start guide.' },
      { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, and bank transfers.' },
      { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel your subscription at any time with no penalties.' },
    ];
  }

  return content;
}

// Generate page sections based on page type and knowledge content
function generatePageSections(
  pageType: string,
  knowledge: KnowledgeContent
): Array<{ id: string; type: string; content: Record<string, unknown>; order: number }> {
  const sections: Array<{ id: string; type: string; content: Record<string, unknown>; order: number }> = [];
  let order = 0;

  switch (pageType) {
    case 'home':
      // Hero section
      sections.push({
        id: `section-${order}`,
        type: 'hero',
        content: {
          headline: knowledge.tagline,
          subheadline: knowledge.description,
          ctaText: 'Get Started',
        },
        order: order++,
      });
      // Features section
      sections.push({
        id: `section-${order}`,
        type: 'features',
        content: {
          title: 'Why Choose Us',
          subtitle: 'Discover what makes us different',
          features: knowledge.features.slice(0, 6),
        },
        order: order++,
      });
      // Stats section
      if (knowledge.stats.length > 0) {
        sections.push({
          id: `section-${order}`,
          type: 'stats',
          content: {
            stats: knowledge.stats,
          },
          order: order++,
        });
      }
      // Testimonials
      if (knowledge.testimonials.length > 0) {
        sections.push({
          id: `section-${order}`,
          type: 'testimonials',
          content: {
            title: 'What Our Customers Say',
            testimonials: knowledge.testimonials,
          },
          order: order++,
        });
      }
      // CTA section
      sections.push({
        id: `section-${order}`,
        type: 'cta',
        content: {
          title: 'Ready to Get Started?',
          subtitle: 'Join thousands of satisfied customers today',
          buttonText: 'Start Free Trial',
        },
        order: order++,
      });
      break;

    case 'features':
      // Hero section
      sections.push({
        id: `section-${order}`,
        type: 'hero',
        content: {
          headline: 'Powerful Features',
          subheadline: 'Everything you need to succeed',
          ctaText: 'Explore Features',
        },
        order: order++,
      });
      // Features grid
      sections.push({
        id: `section-${order}`,
        type: 'features',
        content: {
          title: 'Our Features',
          subtitle: 'Built for modern businesses',
          features: knowledge.features,
        },
        order: order++,
      });
      // FAQ section
      if (knowledge.faqs.length > 0) {
        sections.push({
          id: `section-${order}`,
          type: 'faq',
          content: {
            title: 'Frequently Asked Questions',
            faqs: knowledge.faqs,
          },
          order: order++,
        });
      }
      // CTA
      sections.push({
        id: `section-${order}`,
        type: 'cta',
        content: {
          title: 'See Features in Action',
          subtitle: 'Start your free trial today',
          buttonText: 'Start Free Trial',
        },
        order: order++,
      });
      break;

    case 'pricing':
      // Hero section
      sections.push({
        id: `section-${order}`,
        type: 'hero',
        content: {
          headline: 'Simple, Transparent Pricing',
          subheadline: 'Choose the plan that works for you',
          ctaText: 'View Plans',
        },
        order: order++,
      });
      // Pricing section
      sections.push({
        id: `section-${order}`,
        type: 'pricing',
        content: {
          title: 'Pricing Plans',
          subtitle: 'No hidden fees, cancel anytime',
          plans: knowledge.pricing,
        },
        order: order++,
      });
      // FAQ section
      sections.push({
        id: `section-${order}`,
        type: 'faq',
        content: {
          title: 'Pricing FAQ',
          faqs: knowledge.faqs,
        },
        order: order++,
      });
      // CTA
      sections.push({
        id: `section-${order}`,
        type: 'cta',
        content: {
          title: 'Start Your Free Trial',
          subtitle: 'No credit card required',
          buttonText: 'Get Started Free',
        },
        order: order++,
      });
      break;

    case 'about':
      // Hero section
      sections.push({
        id: `section-${order}`,
        type: 'hero',
        content: {
          headline: `About ${knowledge.companyName}`,
          subheadline: 'Our story and mission',
          ctaText: 'Learn More',
        },
        order: order++,
      });
      // About section
      sections.push({
        id: `section-${order}`,
        type: 'about',
        content: {
          title: 'Who We Are',
          description: knowledge.description,
          mission: `At ${knowledge.companyName}, we are committed to helping businesses achieve their goals through innovative solutions and exceptional service.`,
        },
        order: order++,
      });
      // Stats section
      sections.push({
        id: `section-${order}`,
        type: 'stats',
        content: {
          stats: knowledge.stats,
        },
        order: order++,
      });
      // CTA
      sections.push({
        id: `section-${order}`,
        type: 'cta',
        content: {
          title: 'Join Our Journey',
          subtitle: 'Be part of our success story',
          buttonText: 'Get Started',
        },
        order: order++,
      });
      break;

    case 'contact':
      // Hero section
      sections.push({
        id: `section-${order}`,
        type: 'hero',
        content: {
          headline: 'Get in Touch',
          subheadline: 'We would love to hear from you',
          ctaText: 'Contact Us',
        },
        order: order++,
      });
      // Contact form section
      sections.push({
        id: `section-${order}`,
        type: 'contact',
        content: {
          title: 'Contact Us',
          subtitle: 'Send us a message and we will get back to you shortly',
          email: knowledge.contactInfo.email,
        },
        order: order++,
      });
      // FAQ section
      sections.push({
        id: `section-${order}`,
        type: 'faq',
        content: {
          title: 'Common Questions',
          faqs: knowledge.faqs.slice(0, 4),
        },
        order: order++,
      });
      break;
  }

  return sections;
}

interface GenerationResult {
  pagesGenerated: number;
  pagesUpdated: number;
  entitiesExtracted: number;
  errors: string[];
}

/**
 * POST /api/workspaces/[workspaceId]/websites/[websiteId]/generate
 * Generate complete website from knowledge base
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  const result: GenerationResult = {
    pagesGenerated: 0,
    pagesUpdated: 0,
    entitiesExtracted: 0,
    errors: [],
  };

  try {
    const { workspaceId, websiteId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify website exists and belongs to workspace
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('*')
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (websiteError || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Update website status to generating
    await supabase
      .from('websites')
      .update({ status: 'generating' })
      .eq('id', websiteId);

    // Step 1: Get all documents with extracted text
    const { data: documents } = await supabase
      .from('documents')
      .select('id, name, extracted_text')
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
      .not('extracted_text', 'is', null);

    const docsWithText = (documents || []).map(d => ({
      name: d.name,
      extracted_text: d.extracted_text as string,
    }));

    // Step 2: Extract entities from documents if not already done
    if (documents && documents.length > 0) {
      for (const document of documents) {
        // Check if already has knowledge item
        const { data: existingItem } = await supabase
          .from('knowledge_base_items')
          .select('id')
          .eq('document_id', document.id)
          .single();

        if (existingItem) {
          continue; // Skip if already processed
        }

        try {
          const extractedText = document.extracted_text as string;
          const text = extractedText.slice(0, MAX_TEXT_LENGTH);

          // Create knowledge base item
          const { data: knowledgeItem, error: itemError } = await supabase
            .from('knowledge_base_items')
            .insert({
              workspace_id: workspaceId,
              document_id: document.id,
              entity_type: 'document',
              content: extractedText,
              metadata: {
                documentName: document.name,
                processedAt: new Date().toISOString(),
              },
            })
            .select()
            .single();

          if (itemError) {
            result.errors.push(`Knowledge item creation failed for ${document.name}`);
            continue;
          }

          // Extract entities using AI
          try {
            const extractionResult = await extractEntities(
              text,
              [document.id],
              { minConfidence: 0.5, maxEntities: 50 }
            );

            // Store entities
            for (const entity of extractionResult.entities) {
              const { error: entityError } = await supabase
                .from('knowledge_entities')
                .insert({
                  workspace_id: workspaceId,
                  knowledge_item_id: knowledgeItem.id,
                  entity_type: entity.type,
                  name: entity.name,
                  description: entity.description || null,
                  confidence: entity.confidence,
                  metadata: (entity.metadata || {}) as Record<string, string | number | boolean | null>,
                });

              if (!entityError) {
                result.entitiesExtracted++;
              }
            }
          } catch (extractionError) {
            result.errors.push(
              `Entity extraction failed for ${document.name}: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`
            );
          }
        } catch (docError) {
          result.errors.push(`Processing failed for ${document.name}`);
        }
      }
    }

    // Step 3: Get all extracted entities for content generation
    const { data: entities } = await supabase
      .from('knowledge_entities')
      .select('entity_type, name, description, metadata')
      .eq('workspace_id', workspaceId);

    // Extract knowledge content from entities and documents
    const knowledgeContent = extractKnowledgeContent(
      (entities || []) as Array<{ entity_type: string; name: string; description?: string; metadata?: Record<string, unknown> }>,
      docsWithText
    );

    // Use website name as company name if available
    if (website.name) {
      knowledgeContent.companyName = website.name;
    }

    // Step 4: Get existing pages
    const { data: existingPages } = await supabase
      .from('pages')
      .select('slug, id')
      .eq('website_id', websiteId);

    console.log('[Generate] Existing pages:', existingPages);
    const existingSlugMap = new Map(existingPages?.map(p => [p.slug, p.id]) || []);
    console.log('[Generate] Slug map:', Object.fromEntries(existingSlugMap));

    // Step 5: Generate all marketing pages with proper content
    for (const pageConfig of MARKETING_PAGES) {
      try {
        // Generate page sections with actual content
        const sections = generatePageSections(pageConfig.type, knowledgeContent);

        const pageSlug = pageConfig.isHomepage ? '/' : `/${pageConfig.slug}`;
        const existingPageId = existingSlugMap.get(pageSlug);

        const contentJson = {
          sections,
          metadata: {
            title: pageConfig.title,
            description: knowledgeContent.description,
          },
          generatedAt: new Date().toISOString(),
        };

        if (existingPageId) {
          // Update existing page
          console.log(`[Generate] Updating page ${pageConfig.title} (${existingPageId}) with slug ${pageSlug}`);
          console.log('[Generate] New content sections:', sections.length, 'sections');
          console.log('[Generate] First section:', JSON.stringify(sections[0], null, 2));

          const { error: updateError } = await supabase
            .from('pages')
            .update({
              title: pageConfig.title,
              content: contentJson as Json,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPageId);

          if (updateError) {
            console.error(`[Generate] Update error for ${pageConfig.title}:`, updateError);
            result.errors.push(`Update failed for ${pageConfig.title}: ${updateError.message}`);
          } else {
            console.log(`[Generate] Successfully updated ${pageConfig.title}`);
          }
          result.pagesUpdated++;
        } else {
          // Create new page
          const { error: pageError } = await supabase
            .from('pages')
            .insert({
              website_id: websiteId,
              title: pageConfig.title,
              slug: pageSlug,
              path: pageSlug,
              is_homepage: pageConfig.isHomepage,
              content: contentJson as Json,
            });

          if (pageError) {
            result.errors.push(`Failed to create ${pageConfig.title} page: ${pageError.message}`);
          } else {
            result.pagesGenerated++;
          }
        }
      } catch (pageError) {
        result.errors.push(
          `Failed to generate ${pageConfig.title} page: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`
        );
      }
    }

    // Update website status to published
    await supabase
      .from('websites')
      .update({
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', websiteId);

    const totalPages = result.pagesGenerated + result.pagesUpdated;

    return NextResponse.json({
      success: true,
      result,
      message: `Generated ${totalPages} pages (${result.pagesGenerated} new, ${result.pagesUpdated} updated)${result.entitiesExtracted > 0 ? `, extracted ${result.entitiesExtracted} entities` : ''}`,
    });

  } catch (error) {
    console.error('Website generation error:', error);
    return NextResponse.json(
      {
        error: 'Generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        result,
      },
      { status: 500 }
    );
  }
}
