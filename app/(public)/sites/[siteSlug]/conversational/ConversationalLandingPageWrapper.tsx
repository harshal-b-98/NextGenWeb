'use client';

/**
 * Client Wrapper for Conversational Landing Page
 * Handles loading personalized CTAs and passing to the main component
 */

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import {
  ConversationalLandingPage,
  type PersonalizedCTA,
  type WorkspaceConfig,
} from '@/components/site/conversational-landing-page';

interface ConversationalLandingPageWrapperProps {
  websiteId: string;
  workspaceId: string;
  websiteName: string;
  slug: string;
  brandConfig: Record<string, unknown> | null;
}

export function ConversationalLandingPageWrapper({
  websiteId,
  workspaceId,
  websiteName,
  slug,
  brandConfig,
}: ConversationalLandingPageWrapperProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ctas, setCtas] = useState<PersonalizedCTA[]>([]);
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>({
    name: websiteName,
    primaryColor: (brandConfig?.primaryColor as string) || '#3B82F6',
  });

  useEffect(() => {
    async function loadPersonalizedData() {
      try {
        const response = await fetch(`/api/generate/landing?websiteId=${websiteId}`);

        if (!response.ok) {
          throw new Error('Failed to load landing page data');
        }

        const data = await response.json();

        if (data.success) {
          setCtas(data.ctas);
          setWorkspaceConfig({
            name: websiteName,
            tagline: data.workspaceConfig.tagline,
            description: data.workspaceConfig.description,
            logo: data.workspaceConfig.logo || (brandConfig?.logo as string),
            primaryColor:
              data.workspaceConfig.primaryColor ||
              (brandConfig?.primaryColor as string) ||
              '#3B82F6',
            secondaryColor:
              data.workspaceConfig.secondaryColor ||
              (brandConfig?.secondaryColor as string),
          });
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error loading landing page data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');

        // Use default CTAs on error
        setCtas(getDefaultCTAs());
        setWorkspaceConfig({
          name: websiteName,
          tagline: 'Discover what we can do for you',
          primaryColor: (brandConfig?.primaryColor as string) || '#3B82F6',
        });
      } finally {
        setLoading(false);
      }
    }

    loadPersonalizedData();
  }, [websiteId, websiteName, brandConfig]);

  // Loading state
  if (loading) {
    return (
      <div
        className="h-screen flex flex-col items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${workspaceConfig.primaryColor} 0%, ${adjustColor(workspaceConfig.primaryColor || '#3B82F6', -30)} 100%)`,
        }}
      >
        <div className="text-center text-white">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold mb-2">{websiteName}</h1>
          <div className="flex items-center justify-center gap-2 text-white/70">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Personalizing your experience...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConversationalLandingPage
      websiteId={websiteId}
      workspaceId={workspaceId}
      workspaceConfig={workspaceConfig}
      personalizedCTAs={ctas}
      slug={slug}
    />
  );
}

// Default CTAs if API fails
function getDefaultCTAs(): PersonalizedCTA[] {
  return [
    {
      id: 'default-1',
      text: 'See How It Works',
      topic: 'how-it-works',
      description: 'Learn about our process',
      category: 'product',
      variant: 'primary',
    },
    {
      id: 'default-2',
      text: 'Explore Features',
      topic: 'features',
      description: 'Discover our capabilities',
      category: 'product',
      variant: 'primary',
    },
    {
      id: 'default-3',
      text: 'View Pricing',
      topic: 'pricing',
      description: 'See pricing options',
      category: 'sales',
      variant: 'secondary',
    },
    {
      id: 'default-4',
      text: 'Success Stories',
      topic: 'testimonials',
      description: 'Customer success stories',
      category: 'marketing',
      variant: 'secondary',
    },
    {
      id: 'default-5',
      text: 'Get Started',
      topic: 'getting-started',
      description: 'Start your journey',
      category: 'sales',
      variant: 'tertiary',
    },
    {
      id: 'default-6',
      text: 'Contact Us',
      topic: 'contact',
      description: 'Speak with our team',
      category: 'support',
      variant: 'tertiary',
    },
  ];
}

// Utility to adjust color brightness
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
