/**
 * Thank You Page Service
 * Phase 4.4: Conversion & Lead Tools
 *
 * Service for generating and managing thank you pages.
 */

import { untypedFrom } from '@/lib/supabase/untyped';
import type {
  ThankYouPageConfig,
  ThankYouCTA,
  ThankYouRecommendation,
  PersonaThankYouContent,
  LeadCapture,
} from './types';

/**
 * Thank you page input
 */
export interface ThankYouPageInput {
  name: string;
  websiteId: string;
  formId?: string;
  headline: string;
  subheadline?: string;
  message?: string;
  ctaButton?: ThankYouCTA;
  secondaryCTA?: ThankYouCTA;
  showSocialShare?: boolean;
  socialShareConfig?: {
    platforms: ('twitter' | 'linkedin' | 'facebook')[];
    shareText?: string;
    shareUrl?: string;
  };
  dynamicContent?: {
    personalizedGreeting?: boolean;
    showRecommendations?: boolean;
    recommendations?: ThankYouRecommendation[];
    personaSpecificContent?: Record<string, PersonaThankYouContent>;
  };
  styling?: {
    layout?: 'centered' | 'split' | 'full-width';
    showConfetti?: boolean;
    animateEntrance?: boolean;
    backgroundColor?: string;
    accentColor?: string;
    className?: string;
  };
}

/**
 * Generated thank you page HTML/data
 */
export interface GeneratedThankYouPage {
  config: ThankYouPageConfig;
  html?: string;
  personalizedContent?: {
    headline: string;
    message?: string;
    recommendations: ThankYouRecommendation[];
  };
}

/**
 * Thank You Page Service
 *
 * Creates and manages thank you pages that are shown
 * after form submissions.
 */
export class ThankYouPageService {
  /**
   * Create a thank you page configuration
   */
  async createThankYouPage(
    input: ThankYouPageInput
  ): Promise<ThankYouPageConfig | null> {
    try {
      const table = await untypedFrom('thank_you_pages');

      const { data, error } = await table
        .insert({
          name: input.name,
          website_id: input.websiteId,
          form_id: input.formId || null,
          headline: input.headline,
          subheadline: input.subheadline || null,
          message: input.message || null,
          cta_button: input.ctaButton || null,
          secondary_cta: input.secondaryCTA || null,
          show_social_share: input.showSocialShare ?? false,
          social_share_config: input.socialShareConfig || null,
          dynamic_content: input.dynamicContent || null,
          styling: input.styling || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating thank you page:', error);
        return null;
      }

      return this.transformConfig(data as Record<string, unknown>);
    } catch (error) {
      console.error('Error creating thank you page:', error);
      return null;
    }
  }

  /**
   * Get thank you page by ID
   */
  async getThankYouPage(pageId: string): Promise<ThankYouPageConfig | null> {
    try {
      const table = await untypedFrom('thank_you_pages');

      const { data, error } = await table
        .select()
        .eq('id', pageId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.transformConfig(data as Record<string, unknown>);
    } catch (error) {
      console.error('Error fetching thank you page:', error);
      return null;
    }
  }

  /**
   * Get thank you page by form ID
   */
  async getThankYouPageByForm(formId: string): Promise<ThankYouPageConfig | null> {
    try {
      const table = await untypedFrom('thank_you_pages');

      const { data, error } = await table
        .select()
        .eq('form_id', formId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.transformConfig(data as Record<string, unknown>);
    } catch (error) {
      console.error('Error fetching thank you page:', error);
      return null;
    }
  }

  /**
   * Get all thank you pages for a website
   */
  async getThankYouPages(websiteId: string): Promise<ThankYouPageConfig[]> {
    try {
      const table = await untypedFrom('thank_you_pages');

      const { data, error } = await table
        .select()
        .eq('website_id', websiteId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching thank you pages:', error);
        return [];
      }

      return ((data as Record<string, unknown>[]) || []).map(this.transformConfig);
    } catch (error) {
      console.error('Error fetching thank you pages:', error);
      return [];
    }
  }

  /**
   * Update a thank you page
   */
  async updateThankYouPage(
    pageId: string,
    updates: Partial<ThankYouPageInput>
  ): Promise<ThankYouPageConfig | null> {
    try {
      const table = await untypedFrom('thank_you_pages');

      const updateData: Record<string, unknown> = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.headline) updateData.headline = updates.headline;
      if (updates.subheadline !== undefined)
        updateData.subheadline = updates.subheadline;
      if (updates.message !== undefined) updateData.message = updates.message;
      if (updates.ctaButton !== undefined) updateData.cta_button = updates.ctaButton;
      if (updates.secondaryCTA !== undefined)
        updateData.secondary_cta = updates.secondaryCTA;
      if (updates.showSocialShare !== undefined)
        updateData.show_social_share = updates.showSocialShare;
      if (updates.socialShareConfig !== undefined)
        updateData.social_share_config = updates.socialShareConfig;
      if (updates.dynamicContent !== undefined)
        updateData.dynamic_content = updates.dynamicContent;
      if (updates.styling !== undefined) updateData.styling = updates.styling;

      const { data, error } = await table
        .update(updateData)
        .eq('id', pageId)
        .select()
        .single();

      if (error) {
        console.error('Error updating thank you page:', error);
        return null;
      }

      return this.transformConfig(data as Record<string, unknown>);
    } catch (error) {
      console.error('Error updating thank you page:', error);
      return null;
    }
  }

  /**
   * Delete a thank you page
   */
  async deleteThankYouPage(pageId: string): Promise<boolean> {
    try {
      const table = await untypedFrom('thank_you_pages');

      const { error } = await table
        .delete()
        .eq('id', pageId);

      return !error;
    } catch (error) {
      console.error('Error deleting thank you page:', error);
      return false;
    }
  }

  /**
   * Generate personalized thank you page content for a lead
   */
  async generatePersonalizedContent(
    config: ThankYouPageConfig,
    lead: LeadCapture
  ): Promise<GeneratedThankYouPage> {
    const result: GeneratedThankYouPage = {
      config,
    };

    // Default content
    let headline = config.headline;
    let message = config.message;
    let recommendations = config.dynamicContent?.recommendations || [];

    // Check for persona-specific content
    if (
      lead.personaId &&
      config.dynamicContent?.personaSpecificContent?.[lead.personaId]
    ) {
      const personaContent =
        config.dynamicContent.personaSpecificContent[lead.personaId];

      if (personaContent.headline) {
        headline = personaContent.headline;
      }
      if (personaContent.message) {
        message = personaContent.message;
      }
      if (personaContent.recommendations?.length) {
        recommendations = personaContent.recommendations;
      }
    }

    // Personalize greeting
    if (config.dynamicContent?.personalizedGreeting && lead.name) {
      headline = this.personalizeGreeting(headline, lead.name);
    }

    result.personalizedContent = {
      headline,
      message,
      recommendations: config.dynamicContent?.showRecommendations
        ? recommendations
        : [],
    };

    return result;
  }

  /**
   * Generate default thank you page for a website
   */
  generateDefaultConfig(
    websiteId: string,
    options?: {
      formName?: string;
      brandColor?: string;
    }
  ): ThankYouPageInput {
    return {
      name: options?.formName
        ? `Thank You - ${options.formName}`
        : 'Default Thank You Page',
      websiteId,
      headline: 'Thank You!',
      subheadline: "We've received your submission",
      message:
        "We appreciate your interest and will get back to you shortly. In the meantime, feel free to explore our resources.",
      ctaButton: {
        text: 'Return to Homepage',
        url: '/',
        variant: 'primary',
      },
      showSocialShare: false,
      styling: {
        layout: 'centered',
        showConfetti: true,
        animateEntrance: true,
        accentColor: options?.brandColor || '#3B82F6',
      },
    };
  }

  /**
   * Generate HTML for thank you page (for static export)
   */
  generateHTML(config: ThankYouPageConfig, lead?: LeadCapture): string {
    const styling = config.styling || {};
    const bgColor = styling.backgroundColor || '#ffffff';
    const accentColor = styling.accentColor || '#3B82F6';

    // Personalize if lead provided
    let headline = config.headline;
    if (config.dynamicContent?.personalizedGreeting && lead?.name) {
      headline = this.personalizeGreeting(headline, lead.name);
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${bgColor};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      max-width: 600px;
      text-align: center;
      ${styling.animateEntrance ? 'animation: fadeIn 0.6s ease-out;' : ''}
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .checkmark {
      width: 80px;
      height: 80px;
      margin: 0 auto 2rem;
      background-color: ${accentColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .checkmark svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    h1 {
      font-size: 2.5rem;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }
    .subheadline {
      font-size: 1.25rem;
      color: #6b7280;
      margin-bottom: 1.5rem;
    }
    .message {
      font-size: 1rem;
      color: #4b5563;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .cta-button {
      display: inline-block;
      padding: 0.875rem 2rem;
      background-color: ${accentColor};
      color: white;
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .secondary-cta {
      display: block;
      margin-top: 1rem;
      color: ${accentColor};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="checkmark">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h1>${headline}</h1>
    ${config.subheadline ? `<p class="subheadline">${config.subheadline}</p>` : ''}
    ${config.message ? `<p class="message">${config.message}</p>` : ''}
    ${
      config.ctaButton
        ? `<a href="${config.ctaButton.url}" class="cta-button" ${
            config.ctaButton.target === '_blank'
              ? 'target="_blank" rel="noopener"'
              : ''
          }>${config.ctaButton.text}</a>`
        : ''
    }
    ${
      config.secondaryCTA
        ? `<a href="${config.secondaryCTA.url}" class="secondary-cta">${config.secondaryCTA.text}</a>`
        : ''
    }
  </div>
  ${styling.showConfetti ? this.getConfettiScript() : ''}
</body>
</html>
    `.trim();

    return html;
  }

  /**
   * Personalize greeting with name
   */
  private personalizeGreeting(headline: string, name: string): string {
    // Check if headline already contains name placeholder
    if (headline.includes('{name}')) {
      return headline.replace('{name}', name);
    }

    // Add name to standard greetings
    const firstName = name.split(' ')[0];

    if (headline.toLowerCase().includes('thank you')) {
      return headline.replace(/thank you/i, `Thank you, ${firstName}`);
    }

    if (headline.toLowerCase().includes('thanks')) {
      return headline.replace(/thanks/i, `Thanks, ${firstName}`);
    }

    return `${headline}, ${firstName}`;
  }

  /**
   * Get confetti animation script
   */
  private getConfettiScript(): string {
    return `
<script>
(function() {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
  const confetti = [];
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  for (let i = 0; i < 150; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 2,
      d: Math.random() * 150 + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10
    });
  }

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confetti.forEach((p, i) => {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.r, p.r * 1.5);
      p.y += Math.cos(frame / p.d) + 2;
      p.x += Math.sin(frame / 50);
      if (p.y > canvas.height) {
        confetti[i] = {...p, y: -10, x: Math.random() * canvas.width};
      }
    });
    frame++;
    if (frame < 300) requestAnimationFrame(draw);
    else canvas.remove();
  }
  draw();
})();
</script>
    `;
  }

  /**
   * Transform database record to ThankYouPageConfig
   */
  private transformConfig(record: Record<string, unknown>): ThankYouPageConfig {
    return {
      id: record.id as string,
      name: record.name as string,
      websiteId: record.website_id as string,
      formId: record.form_id as string | undefined,
      headline: record.headline as string,
      subheadline: record.subheadline as string | undefined,
      message: record.message as string | undefined,
      ctaButton: record.cta_button as ThankYouCTA | undefined,
      secondaryCTA: record.secondary_cta as ThankYouCTA | undefined,
      showSocialShare: record.show_social_share as boolean,
      socialShareConfig: record.social_share_config as
        | ThankYouPageConfig['socialShareConfig']
        | undefined,
      dynamicContent: record.dynamic_content as
        | ThankYouPageConfig['dynamicContent']
        | undefined,
      styling: record.styling as ThankYouPageConfig['styling'] | undefined,
    };
  }
}

/**
 * Create thank you page service instance
 */
export function createThankYouPageService(): ThankYouPageService {
  return new ThankYouPageService();
}
