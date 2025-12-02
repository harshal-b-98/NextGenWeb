'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types for the brand system
interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

interface BrandColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  neutral: ColorScale;
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

interface BrandVoice {
  tone: string;
  formality: string;
  personality: string[];
  keywords: string[];
}

interface BrandSystem {
  id: string;
  websiteId: string;
  name: string;
  colors: BrandColorPalette;
  typography: {
    fontFamily: {
      heading: string;
      body: string;
      mono: string;
    };
  };
  voice: BrandVoice;
  industry?: string;
  aiGenerated: boolean;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

// Industry options
const industries = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'creative', label: 'Creative' },
  { value: 'other', label: 'Other' },
];

// Tone options
const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'playful', label: 'Playful' },
  { value: 'luxurious', label: 'Luxurious' },
  { value: 'technical', label: 'Technical' },
  { value: 'warm', label: 'Warm' },
];

export default function BrandingPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [brand, setBrand] = useState<BrandSystem | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state for brand generation
  const [businessName, setBusinessName] = useState('');
  const [websiteId, setWebsiteId] = useState('');
  const [industry, setIndustry] = useState('technology');
  const [tone, setTone] = useState('professional');
  const [keywords, setKeywords] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  // Websites for selection
  const [websites, setWebsites] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch websites on mount
  useEffect(() => {
    async function fetchWebsites() {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/websites`);
        if (response.ok) {
          const data = await response.json();
          setWebsites(data.websites || []);
          if (data.websites?.length > 0) {
            setWebsiteId(data.websites[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch websites:', error);
      }
    }
    fetchWebsites();
  }, [workspaceId]);

  // Generate brand
  const handleGenerate = async () => {
    if (!businessName || !websiteId) {
      alert('Please enter a business name and select a website');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/brand/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          businessName,
          industry,
          tone,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          targetAudience: targetAudience || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate brand');
      }

      const data = await response.json();
      setBrand(data.brand);
    } catch (error) {
      console.error('Error generating brand:', error);
      alert('Failed to generate brand. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Render color swatch
  const ColorSwatch = ({ color, label }: { color: string; label: string }) => (
    <div className="flex flex-col items-center">
      <div
        className="w-12 h-12 rounded-lg border border-neutral-200 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-neutral-500 mt-1">{label}</span>
    </div>
  );

  // Render color scale
  const ColorScaleRow = ({ name, scale }: { name: string; scale: ColorScale }) => (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-neutral-700 mb-2 capitalize">{name}</h4>
      <div className="flex gap-2">
        {Object.entries(scale).map(([shade, color]) => (
          <ColorSwatch key={shade} color={color} label={shade} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
        <Link
          href={`/workspaces/${workspaceId}`}
          className="hover:text-neutral-700 flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          Workspace
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-900 font-medium">Branding</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Brand & Theme</h1>
        <p className="text-neutral-600 mt-1">
          Generate and manage your brand system including colors, typography, and voice.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Brand Generation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Generate Brand
            </h2>

            <div className="space-y-4">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Enter your business name"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Website Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Website *
                </label>
                {websites.length > 0 ? (
                  <select
                    value={websiteId}
                    onChange={e => setWebsiteId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {websites.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-neutral-500 italic">
                    No websites found. Create a website first.
                  </p>
                )}
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {industries.map(ind => (
                    <option key={ind.value} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Brand Tone
                </label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {tones.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="modern, innovative, trusted"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  placeholder="Small business owners, developers"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={generating || !businessName || !websiteId}
                className="w-full"
              >
                {generating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate Brand'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Brand Preview */}
        <div className="lg:col-span-2">
          {brand ? (
            <div className="space-y-6">
              {/* Brand Info Card */}
              <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">{brand.name}</h2>
                    <p className="text-sm text-neutral-500">
                      {brand.aiGenerated ? 'AI Generated' : 'Custom'} •{' '}
                      {Math.round(brand.confidenceScore * 100)}% confidence
                    </p>
                  </div>
                  {brand.industry && (
                    <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full capitalize">
                      {brand.industry.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Voice */}
                <div className="border-t border-neutral-100 pt-4">
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">Brand Voice</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded capitalize">
                      {brand.voice.tone}
                    </span>
                    <span className="px-2 py-1 bg-secondary-100 text-secondary-700 text-sm rounded capitalize">
                      {brand.voice.formality}
                    </span>
                    {brand.voice.personality.map((trait, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-neutral-100 text-neutral-600 text-sm rounded"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color Palette Card */}
              <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Color Palette</h3>

                <ColorScaleRow name="Primary" scale={brand.colors.primary} />
                <ColorScaleRow name="Secondary" scale={brand.colors.secondary} />
                <ColorScaleRow name="Accent" scale={brand.colors.accent} />
                <ColorScaleRow name="Neutral" scale={brand.colors.neutral} />

                {/* Semantic Colors */}
                <div className="mt-6 pt-4 border-t border-neutral-100">
                  <h4 className="text-sm font-medium text-neutral-700 mb-2">Semantic Colors</h4>
                  <div className="flex gap-4">
                    <ColorSwatch color={brand.colors.semantic.success} label="Success" />
                    <ColorSwatch color={brand.colors.semantic.warning} label="Warning" />
                    <ColorSwatch color={brand.colors.semantic.error} label="Error" />
                    <ColorSwatch color={brand.colors.semantic.info} label="Info" />
                  </div>
                </div>
              </div>

              {/* Typography Card */}
              <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Typography</h3>

                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-neutral-500">Heading Font</span>
                    <p
                      className="text-2xl font-bold"
                      style={{ fontFamily: brand.typography.fontFamily.heading }}
                    >
                      {brand.typography.fontFamily.heading}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Body Font</span>
                    <p
                      className="text-lg"
                      style={{ fontFamily: brand.typography.fontFamily.body }}
                    >
                      {brand.typography.fontFamily.body}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Monospace Font</span>
                    <p
                      className="text-sm font-mono"
                      style={{ fontFamily: brand.typography.fontFamily.mono }}
                    >
                      {brand.typography.fontFamily.mono}
                    </p>
                  </div>
                </div>
              </div>

              {/* Export Actions */}
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1">
                  Export CSS Variables
                </Button>
                <Button variant="outline" className="flex-1">
                  Export Tailwind Config
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-300 p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-neutral-900">No Brand Generated</h3>
              <p className="mt-2 text-neutral-500">
                Fill out the form and click "Generate Brand" to create your brand system.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
