'use client';

/**
 * Client Wrapper for Conversational Landing Page
 * Handles loading personalized CTAs and passing to the main component
 *
 * Story #128: Integrated global components (header/footer) from database
 */

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import {
  ConversationalLandingPage,
  type PersonalizedCTA,
  type WorkspaceConfig,
} from '@/components/site/conversational-landing-page';
import { GlobalHeader, DefaultHeader } from '@/components/site/GlobalHeader';
import { GlobalFooter, DefaultFooter } from '@/components/site/GlobalFooter';
import type { HeaderContent, FooterContent } from '@/lib/layout/global-components';

interface PageInfo {
  id: string;
  title: string;
  slug: string;
  is_homepage: boolean;
}

interface ConversationalLandingPageWrapperProps {
  websiteId: string;
  workspaceId: string;
  websiteName: string;
  slug: string;
  brandConfig: Record<string, unknown> | null;
  headerContent?: HeaderContent;
  footerContent?: FooterContent;
  pages?: PageInfo[];
}

export function ConversationalLandingPageWrapper({
  websiteId,
  workspaceId,
  websiteName,
  slug,
  brandConfig,
  headerContent,
  footerContent,
  pages = [],
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

  const primaryColor = workspaceConfig.primaryColor || '#3B82F6';
  const currentPath = `/sites/${slug}`;

  // Helper to render header
  const renderHeader = () => {
    if (headerContent) {
      return (
        <GlobalHeader
          websiteSlug={slug}
          content={headerContent}
          navStyle="simple"
          primaryColor={primaryColor}
          currentPath={currentPath}
        />
      );
    }
    return (
      <DefaultHeader
        websiteSlug={slug}
        websiteName={websiteName}
        pages={pages.map((p) => ({
          title: p.title,
          slug: p.slug,
          is_homepage: p.is_homepage,
        }))}
        primaryColor={primaryColor}
        currentPath={currentPath}
      />
    );
  };

  // Helper to render footer
  const renderFooter = () => {
    if (footerContent) {
      return (
        <GlobalFooter
          websiteSlug={slug}
          content={footerContent}
          primaryColor={primaryColor}
        />
      );
    }
    return (
      <DefaultFooter
        websiteSlug={slug}
        websiteName={websiteName}
        pages={pages.map((p) => ({
          title: p.title,
          slug: p.slug,
          is_homepage: p.is_homepage,
        }))}
        primaryColor={primaryColor}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      {renderHeader()}

      {/* Main Content */}
      <main className="flex-grow">
        <ConversationalLandingPage
          websiteId={websiteId}
          workspaceId={workspaceId}
          workspaceConfig={workspaceConfig}
          personalizedCTAs={ctas}
          slug={slug}
        />
      </main>

      {/* Footer */}
      {renderFooter()}
    </div>
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
