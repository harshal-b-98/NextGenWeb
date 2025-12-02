'use client';

/**
 * Conversational Marketing Demo Page
 * Phase 6: Conversational Marketing Platform
 *
 * A demo page to test the conversational marketing flow.
 * CTAs generate inline content sections instead of navigating.
 */

import { ConversationalPage } from '@/components/interactive';
import type { ConversationalCTAConfig } from '@/components/marketing/heroes';
import type { GeneratedSectionData } from '@/lib/stores';

// Demo website ID - in production this would come from the URL/database
const DEMO_WEBSITE_ID = 'demo-website-001';

// Demo CTAs for the hero section
const DEMO_CTAS: ConversationalCTAConfig[] = [
  {
    text: 'See How It Works',
    topic: 'how-it-works',
    intent: 'how-it-works',
    priority: 1,
    promptOverride: 'Explain how our AI-powered marketing platform works step by step.',
  },
  {
    text: 'View Pricing',
    topic: 'pricing',
    intent: 'pricing',
    priority: 2,
    promptOverride: 'Show me the pricing plans and what each tier includes.',
  },
  {
    text: 'Success Stories',
    topic: 'case-studies',
    intent: 'use-case',
    priority: 3,
    promptOverride: 'Share some customer success stories and case studies.',
  },
  {
    text: 'Request a Demo',
    topic: 'demo',
    intent: 'demo-request',
    priority: 4,
    promptOverride: 'I would like to request a demo of the platform.',
  },
];

export default function ConversationalDemoPage() {
  const handleSectionGenerated = (section: GeneratedSectionData) => {
    console.log('[Demo] Section generated:', {
      id: section.id,
      type: section.sectionType,
      followUps: section.suggestedFollowUps?.length || 0,
    });
  };

  const handleError = (error: Error) => {
    console.error('[Demo] Error:', error.message);
  };

  return (
    <ConversationalPage
      websiteId={DEMO_WEBSITE_ID}
      hero={{
        headline: 'Transform Your Marketing with AI',
        subheadline: 'Generate personalized content that converts',
        description:
          'Our AI-powered platform creates dynamic marketing experiences that adapt to every visitor. Click any button to see AI-generated content appear right here.',
        badge: 'Phase 6 Demo',
        backgroundVariant: 'gradient',
        chatPrompt: 'Ask me anything about our platform...',
        showChatBubble: true,
      }}
      initialCTAs={DEMO_CTAS}
      onSectionGenerated={handleSectionGenerated}
      onError={handleError}
    >
      {/* Footer content */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            Phase 6: Conversational Marketing Platform Demo
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Click the CTAs above to see AI-generated sections appear inline
          </p>
        </div>
      </footer>
    </ConversationalPage>
  );
}
