'use client';

/**
 * Website Detail Page
 * Phase 5.1: Admin Dashboard
 *
 * Manage website settings, pages, and generation.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  ArrowLeft,
  Plus,
  Settings,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  Home,
  ExternalLink,
  Wand2,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Package,
  Rocket,
  RefreshCw,
  XCircle,
  Palette,
  Upload,
  Image as ImageIcon,
  X,
  Lightbulb,
  Bell,
  MessageSquare,
  HelpCircle,
  FileUp,
  Database,
  Sparkles,
  AlertTriangle,
  Info,
  ChevronRight,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { WebsiteStatus } from '@/types/database';

interface Page {
  id: string;
  title: string;
  slug: string;
  is_homepage: boolean;
  created_at: string;
  updated_at: string;
}

interface Website {
  id: string;
  name: string;
  slug: string;
  status: WebsiteStatus;
  domain: string | null;
  settings: Record<string, unknown>;
  brand_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  pages: Page[];
}

const statusConfig: Record<WebsiteStatus, { color: string; icon: typeof CheckCircle; label: string }> = {
  draft: { color: 'text-gray-500', icon: Clock, label: 'Draft' },
  generating: { color: 'text-yellow-500', icon: Loader2, label: 'Generating' },
  published: { color: 'text-green-500', icon: CheckCircle, label: 'Published' },
  archived: { color: 'text-red-500', icon: AlertCircle, label: 'Archived' },
};

export default function WebsiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const workspaceId = params.workspaceId as string;
  const websiteId = params.websiteId as string;

  const [website, setWebsite] = useState<Website | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pages' | 'branding' | 'settings' | 'suggestions' | 'notifications' | 'export' | 'deploy'>('pages');
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingWebsite, setIsGeneratingWebsite] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');

  const fetchWebsite = useCallback(async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/websites/${websiteId}`);
      const data = await response.json();

      if (data.success) {
        setWebsite(data.website);
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to load website',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching website:', error);
      addToast({
        title: 'Error',
        description: 'Failed to load website',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, websiteId, addToast]);

  useEffect(() => {
    fetchWebsite();
  }, [fetchWebsite]);

  const handleUpdateStatus = async (newStatus: WebsiteStatus) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/websites/${websiteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setWebsite(prev => prev ? { ...prev, ...data.website } : null);
        addToast({
          title: 'Success',
          description: `Website ${newStatus === 'published' ? 'published' : 'updated'} successfully`,
          variant: 'success',
        });
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to update website',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating website:', error);
      addToast({
        title: 'Error',
        description: 'Failed to update website',
        variant: 'error',
      });
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        setWebsite(prev => prev ? {
          ...prev,
          pages: prev.pages.filter(p => p.id !== pageId),
        } : null);
        addToast({
          title: 'Success',
          description: 'Page deleted successfully',
          variant: 'success',
        });
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to delete page',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      addToast({
        title: 'Error',
        description: 'Failed to delete page',
        variant: 'error',
      });
    }

    setActiveMenu(null);
  };

  const handleGeneratePage = async (pageId: string) => {
    setIsGenerating(true);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/pages/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          pageId,
          generateLayout: true,
          generateStoryline: true,
          generateContent: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        addToast({
          title: 'Success',
          description: 'Page generation started',
          variant: 'success',
        });
        // Refresh website data
        fetchWebsite();
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to generate page',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error generating page:', error);
      addToast({
        title: 'Error',
        description: 'Failed to generate page',
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWebsite = async () => {
    setIsGeneratingWebsite(true);
    setGenerationProgress('Starting website generation...');

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/websites/${websiteId}/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (data.success) {
        addToast({
          title: 'Website Generated',
          description: data.message || 'All pages have been generated successfully',
          variant: 'success',
        });
        // Refresh website data to show new pages
        fetchWebsite();
      } else {
        addToast({
          title: 'Generation Failed',
          description: data.error || 'Failed to generate website',
          variant: 'error',
        });
        if (data.result?.errors?.length > 0) {
          console.error('Generation errors:', data.result.errors);
        }
      }
    } catch (error) {
      console.error('Error generating website:', error);
      addToast({
        title: 'Error',
        description: 'Failed to generate website',
        variant: 'error',
      });
    } finally {
      setIsGeneratingWebsite(false);
      setGenerationProgress('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!website) {
    return (
      <div className="container max-w-6xl py-8">
        <Card className="py-12">
          <CardContent className="text-center">
            <AlertCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Website not found</h3>
            <Link href={`/workspaces/${workspaceId}/websites`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Websites
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusConfig[website.status].icon;

  return (
    <div className="container max-w-6xl py-8">
      {/* Back link */}
      <Link
        href={`/workspaces/${workspaceId}/websites`}
        className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Websites
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Globe className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{website.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-neutral-500">/{website.slug}</p>
              <span className={`flex items-center gap-1 text-sm ${statusConfig[website.status].color}`}>
                <StatusIcon className={`h-4 w-4 ${website.status === 'generating' ? 'animate-spin' : ''}`} />
                {statusConfig[website.status].label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={handleGenerateWebsite}
            disabled={isGeneratingWebsite || website.status === 'generating'}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGeneratingWebsite || website.status === 'generating' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {generationProgress || 'Generating...'}
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Website
              </>
            )}
          </Button>
          <Link href={`/sites/${website.slug}`} target="_blank">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </Link>
          {website.status === 'draft' && (
            <Button onClick={() => handleUpdateStatus('published')}>
              Publish
            </Button>
          )}
          {website.status === 'published' && (
            <Button variant="outline" onClick={() => handleUpdateStatus('draft')}>
              Unpublish
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('pages')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'pages'
              ? 'border-primary text-primary'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <FileText className="inline-block mr-2 h-4 w-4" />
          Pages ({website.pages?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'branding'
              ? 'border-primary text-primary'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Palette className="inline-block mr-2 h-4 w-4" />
          Branding
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-primary text-primary'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Settings className="inline-block mr-2 h-4 w-4" />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'suggestions'
              ? 'border-primary text-primary'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Lightbulb className="inline-block mr-2 h-4 w-4" />
          Suggestions
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'notifications'
              ? 'border-primary text-primary'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Bell className="inline-block mr-2 h-4 w-4" />
          AI Questions
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'export'
              ? 'border-primary text-primary'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Download className="inline-block mr-2 h-4 w-4" />
          Export
        </button>
        <button
          onClick={() => setActiveTab('deploy')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'deploy'
              ? 'border-primary text-primary'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Rocket className="inline-block mr-2 h-4 w-4" />
          Deploy
        </button>
      </div>

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pages</h2>
            <Button onClick={() => setShowCreatePageModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Page
            </Button>
          </div>

          {website.pages?.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No pages yet</h3>
                <p className="text-neutral-500 mb-4">
                  Create your first page to get started
                </p>
                <Button onClick={() => setShowCreatePageModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Page
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {website.pages?.map(page => (
                <Card key={page.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${page.is_homepage ? 'bg-primary/10' : 'bg-neutral-100'}`}>
                          {page.is_homepage ? (
                            <Home className={`h-4 w-4 ${page.is_homepage ? 'text-primary' : 'text-neutral-500'}`} />
                          ) : (
                            <FileText className="h-4 w-4 text-neutral-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{page.title}</h3>
                            {page.is_homepage && (
                              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                Homepage
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500">/{page.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGeneratePage(page.id)}
                          disabled={isGenerating}
                        >
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate
                        </Button>
                        <Link href={`/sites/${website.slug}/${page.slug}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveMenu(activeMenu === page.id ? null : page.id)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {activeMenu === page.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg border z-10">
                              <div className="py-1">
                                <Link
                                  href={`/workspaces/${workspaceId}/websites/${websiteId}/pages/${page.id}`}
                                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Page
                                </Link>
                                <button
                                  onClick={() => handleDeletePage(page.id)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <BrandingPanel
          website={website}
          workspaceId={workspaceId}
          onUpdate={(updatedWebsite) => {
            setWebsite(prev => prev ? { ...prev, ...updatedWebsite } : null);
            addToast({
              title: 'Success',
              description: 'Branding updated successfully',
              variant: 'success',
            });
          }}
        />
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <WebsiteSettingsForm
          website={website}
          workspaceId={workspaceId}
          onUpdate={(updatedWebsite) => {
            setWebsite(prev => prev ? { ...prev, ...updatedWebsite } : null);
            addToast({
              title: 'Success',
              description: 'Settings updated successfully',
              variant: 'success',
            });
          }}
        />
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <SuggestionsPanel workspaceId={workspaceId} />
      )}

      {/* AI Notifications Tab */}
      {activeTab === 'notifications' && (
        <AINotificationsPanel workspaceId={workspaceId} />
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <ExportPanel
          workspaceId={workspaceId}
          websiteId={websiteId}
          websiteName={website.name}
          pageCount={website.pages?.length || 0}
        />
      )}

      {/* Deploy Tab */}
      {activeTab === 'deploy' && (
        <DeployPanel
          workspaceId={workspaceId}
          websiteId={websiteId}
          websiteName={website.name}
        />
      )}

      {/* Create Page Modal */}
      {showCreatePageModal && (
        <CreatePageModal
          workspaceId={workspaceId}
          websiteId={websiteId}
          onClose={() => setShowCreatePageModal(false)}
          onCreated={(page) => {
            setWebsite(prev => prev ? {
              ...prev,
              pages: [...prev.pages, page],
            } : null);
            setShowCreatePageModal(false);
            addToast({
              title: 'Success',
              description: 'Page created successfully',
              variant: 'success',
            });
          }}
        />
      )}

      {/* Click outside to close menu */}
      {activeMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setActiveMenu(null)} />
      )}
    </div>
  );
}

/**
 * Website Settings Form
 */
function WebsiteSettingsForm({
  website,
  workspaceId,
  onUpdate,
}: {
  website: Website;
  workspaceId: string;
  onUpdate: (website: Partial<Website>) => void;
}) {
  const { addToast } = useToast();
  const [name, setName] = useState(website.name);
  const [slug, setSlug] = useState(website.slug);
  const [domain, setDomain] = useState(website.domain || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/websites/${website.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          domain: domain || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onUpdate(data.website);
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to update settings',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      addToast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configure your website name, URL, and domain settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Website Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Website"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL Slug</label>
            <Input
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-website"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              Your site will be available at /sites/{slug || 'your-slug'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Custom Domain (Optional)</label>
            <Input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="www.example.com"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Configure DNS to point to our servers to use a custom domain
            </p>
          </div>
          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Export Panel Component
 */
function ExportPanel({
  workspaceId,
  websiteId,
  websiteName,
  pageCount,
}: {
  workspaceId: string;
  websiteId: string;
  websiteName: string;
  pageCount: number;
}) {
  const { addToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [projectName, setProjectName] = useState(
    websiteName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  );
  const [includeTypescript, setIncludeTypescript] = useState(true);
  const [includeTailwind, setIncludeTailwind] = useState(true);
  const [includeDocker, setIncludeDocker] = useState(false);
  const [includeEnvExample, setIncludeEnvExample] = useState(true);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/websites/${websiteId}/export`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName,
            typescript: includeTypescript,
            tailwind: includeTailwind,
            includeDocker,
            includeEnvExample,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Export failed');
      }

      // Download the ZIP file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}-export.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast({
        title: 'Success',
        description: 'Website exported successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Export error:', error);
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export website',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Export as Next.js Project
          </CardTitle>
          <CardDescription>
            Download your website as a standalone Next.js project that you can deploy anywhere.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Info */}
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-500">Website:</span>
                <span className="ml-2 font-medium">{websiteName}</span>
              </div>
              <div>
                <span className="text-neutral-500">Pages:</span>
                <span className="ml-2 font-medium">{pageCount}</span>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Name</label>
              <Input
                value={projectName}
                onChange={e => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-website"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Used for package.json name and folder structure
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Options</label>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="typescript"
                  checked={includeTypescript}
                  onChange={e => setIncludeTypescript(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                <label htmlFor="typescript" className="text-sm">
                  Include TypeScript configuration
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tailwind"
                  checked={includeTailwind}
                  onChange={e => setIncludeTailwind(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                <label htmlFor="tailwind" className="text-sm">
                  Include Tailwind CSS
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="envExample"
                  checked={includeEnvExample}
                  onChange={e => setIncludeEnvExample(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                <label htmlFor="envExample" className="text-sm">
                  Include .env.example file
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="docker"
                  checked={includeDocker}
                  onChange={e => setIncludeDocker(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                <label htmlFor="docker" className="text-sm">
                  Include Dockerfile and docker-compose
                </label>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="pt-4 border-t">
            <Button onClick={handleExport} disabled={isExporting || !projectName} className="w-full">
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Export...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download ZIP
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What's Included</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Complete Next.js 14 project structure with App Router</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>All generated pages with content and sections</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Brand configuration and theme setup</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Ready-to-deploy package.json with dependencies</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>README with setup and deployment instructions</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Deployment status type
 */
type DeploymentStatus = 'pending' | 'building' | 'deploying' | 'ready' | 'error' | 'canceled';

/**
 * Deployment interface
 */
interface Deployment {
  id: string;
  status: DeploymentStatus;
  url?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
}

/**
 * Deploy Panel Component
 */
function DeployPanel({
  workspaceId,
  websiteId,
  websiteName,
}: {
  workspaceId: string;
  websiteId: string;
  websiteName: string;
}) {
  const { addToast } = useToast();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);

  const fetchDeployments = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/websites/${websiteId}/deployments`
      );
      const data = await response.json();

      if (data.success) {
        setDeployments(data.deployments || []);
      }
    } catch (error) {
      console.error('Error fetching deployments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, websiteId]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  // Poll for in-progress deployments
  useEffect(() => {
    const inProgress = deployments.some(d =>
      ['pending', 'building', 'deploying'].includes(d.status)
    );

    if (inProgress) {
      const interval = setInterval(fetchDeployments, 5000);
      return () => clearInterval(interval);
    }
  }, [deployments, fetchDeployments]);

  const handleDeploy = async () => {
    setIsDeploying(true);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/websites/${websiteId}/deployments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'vercel' }),
        }
      );

      const data = await response.json();

      if (data.success) {
        addToast({
          title: 'Deployment Started',
          description: 'Your website is being deployed to Vercel.',
          variant: 'success',
        });
        fetchDeployments();
      } else {
        addToast({
          title: 'Deployment Failed',
          description: data.error || 'Failed to start deployment',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Deployment error:', error);
      addToast({
        title: 'Error',
        description: 'Failed to start deployment',
        variant: 'error',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCancel = async (deploymentId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/websites/${websiteId}/deployments/${deploymentId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        addToast({
          title: 'Deployment Canceled',
          description: 'The deployment has been canceled.',
          variant: 'success',
        });
        fetchDeployments();
      }
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  const getStatusIcon = (status: DeploymentStatus) => {
    switch (status) {
      case 'pending':
      case 'building':
      case 'deploying':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'canceled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: DeploymentStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'building':
        return 'Building';
      case 'deploying':
        return 'Deploying';
      case 'ready':
        return 'Live';
      case 'error':
        return 'Failed';
      case 'canceled':
        return 'Canceled';
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const latestDeployment = deployments[0];
  const hasActiveDeployment = latestDeployment &&
    ['pending', 'building', 'deploying'].includes(latestDeployment.status);

  return (
    <div className="space-y-6">
      {/* Deploy to Vercel Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Deploy to Vercel
          </CardTitle>
          <CardDescription>
            Deploy your website to Vercel with one click. Your site will be live in minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Website Info */}
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="text-sm">
              <span className="text-neutral-500">Website:</span>
              <span className="ml-2 font-medium">{websiteName}</span>
            </div>
            {latestDeployment?.url && latestDeployment.status === 'ready' && (
              <div className="text-sm mt-2">
                <span className="text-neutral-500">Live URL:</span>
                <a
                  href={latestDeployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-primary hover:underline"
                >
                  {latestDeployment.url}
                </a>
              </div>
            )}
          </div>

          {/* Deploy Button */}
          <Button
            onClick={handleDeploy}
            disabled={isDeploying || hasActiveDeployment}
            className="w-full"
          >
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Deployment...
              </>
            ) : hasActiveDeployment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deployment in Progress...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Deploy to Vercel
              </>
            )}
          </Button>

          {!process.env.NEXT_PUBLIC_VERCEL_ENABLED && (
            <p className="text-xs text-neutral-500 text-center">
              Note: Vercel deployment requires VERCEL_TOKEN to be configured.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Deployment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Deployment History</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchDeployments}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : deployments.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <Rocket className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              <p>No deployments yet</p>
              <p className="text-sm">Deploy your website to see history here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deployments.slice(0, 10).map(deployment => (
                <div
                  key={deployment.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(deployment.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {getStatusLabel(deployment.status)}
                        </span>
                        {deployment.url && deployment.status === 'ready' && (
                          <a
                            href={deployment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {formatDate(deployment.created_at)}
                        {deployment.error && (
                          <span className="ml-2 text-red-500">
                            {deployment.error}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {['pending', 'building', 'deploying'].includes(deployment.status) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(deployment.id)}
                      className="text-neutral-500 hover:text-red-500"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What Happens When You Deploy</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Your website is exported as a Next.js project</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Files are uploaded to Vercel&apos;s build system</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Vercel builds and optimizes your site</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Your site goes live on a unique URL</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Free SSL certificate is automatically provisioned</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Create Page Modal
 */
function CreatePageModal({
  workspaceId,
  websiteId,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  websiteId: string;
  onClose: () => void;
  onCreated: (page: Page) => void;
}) {
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isHomepage, setIsHomepage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  }, [title, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/websites/${websiteId}/pages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, slug, is_homepage: isHomepage }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onCreated(data.page);
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to create page',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error creating page:', error);
      addToast({
        title: 'Error',
        description: 'Failed to create page',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Create New Page</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Page Title</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="About Us"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL Slug</label>
              <Input
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="about-us"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHomepage"
                checked={isHomepage}
                onChange={e => setIsHomepage(e.target.checked)}
                className="rounded border-neutral-300"
              />
              <label htmlFor="isHomepage" className="text-sm">
                Set as homepage
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !title || !slug}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Page'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Brand config type for type safety
 */
interface BrandConfig {
  logo?: { url: string } | null;
  tagline?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
}

/**
 * Branding Panel Component
 * Manage logo, colors, and brand theme settings
 */
function BrandingPanel({
  website,
  workspaceId,
  onUpdate,
}: {
  website: Website;
  workspaceId: string;
  onUpdate: (website: Partial<Website>) => void;
}) {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Brand config state with type safety
  const brandConfig = (website.brand_config || {}) as BrandConfig;
  const [logoUrl, setLogoUrl] = useState<string>(brandConfig.logo?.url || '');
  const [primaryColor, setPrimaryColor] = useState(brandConfig.colors?.primary || '#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState(brandConfig.colors?.secondary || '#10B981');
  const [accentColor, setAccentColor] = useState(brandConfig.colors?.accent || '#8B5CF6');
  const [backgroundColor, setBackgroundColor] = useState(brandConfig.colors?.background || '#FFFFFF');
  const [textColor, setTextColor] = useState(brandConfig.colors?.text || '#1F2937');
  const [tagline, setTagline] = useState<string>(brandConfig.tagline || '');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast({
        title: 'Error',
        description: 'Please upload an image file',
        variant: 'error',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      addToast({
        title: 'Error',
        description: 'Logo must be less than 2MB',
        variant: 'error',
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);
      formData.append('websiteId', website.id);

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setLogoUrl(data.url);
        addToast({
          title: 'Success',
          description: 'Logo uploaded successfully',
          variant: 'success',
        });
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to upload logo',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      addToast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'error',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      const updatedBrandConfig = {
        ...brandConfig,
        logo: logoUrl ? { url: logoUrl } : null,
        tagline,
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
          background: backgroundColor,
          text: textColor,
        },
      };

      const response = await fetch(`/api/workspaces/${workspaceId}/websites/${website.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_config: updatedBrandConfig,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onUpdate(data.website);
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to save branding',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error saving branding:', error);
      addToast({
        title: 'Error',
        description: 'Failed to save branding',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo
          </CardTitle>
          <CardDescription>
            Upload your company logo (PNG, JPG, or SVG, max 2MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              {logoUrl ? (
                <div className="relative group">
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center overflow-hidden bg-neutral-50">
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove logo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="w-32 h-32 rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isUploadingLogo}
                  />
                  {isUploadingLogo ? (
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-neutral-400 mb-2" />
                      <span className="text-xs text-neutral-500">Upload Logo</span>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* Logo Info */}
            <div className="flex-1">
              <p className="text-sm text-neutral-600 mb-3">
                Your logo will appear in the website header and can be used throughout generated pages.
              </p>
              {logoUrl && (
                <label className="inline-block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isUploadingLogo}
                  />
                  <span className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Replace Logo
                      </>
                    )}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Tagline */}
          <div className="mt-6">
            <label className="block text-sm font-medium mb-1">Tagline (Optional)</label>
            <Input
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="Your company tagline or slogan"
            />
            <p className="text-xs text-neutral-500 mt-1">
              A short phrase that appears next to your logo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Colors Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Colors
          </CardTitle>
          <CardDescription>
            Define your brand&apos;s color palette for consistent styling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-neutral-200"
                />
                <Input
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#3B82F6"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">Main brand color</p>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-neutral-200"
                />
                <Input
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#10B981"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">Supporting color</p>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-neutral-200"
                />
                <Input
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#8B5CF6"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">Highlights & CTAs</p>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={e => setBackgroundColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-neutral-200"
                />
                <Input
                  value={backgroundColor}
                  onChange={e => setBackgroundColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#FFFFFF"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">Page background</p>
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={e => setTextColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-neutral-200"
                />
                <Input
                  value={textColor}
                  onChange={e => setTextColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#1F2937"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">Body text</p>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-4 rounded-lg border">
            <p className="text-sm font-medium mb-3">Preview</p>
            <div
              className="p-6 rounded-lg"
              style={{ backgroundColor: backgroundColor }}
            >
              <div className="flex items-center gap-3 mb-4">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
                )}
                <span
                  className="font-bold text-lg"
                  style={{ color: primaryColor }}
                >
                  {website.name}
                </span>
              </div>
              <p style={{ color: textColor }} className="mb-3">
                This is how your text will look with the selected colors.
              </p>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: secondaryColor }}
                >
                  Secondary
                </button>
                <button
                  className="px-4 py-2 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: accentColor }}
                >
                  Accent
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Branding'
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Improvement type from the auto-layout-generator
 */
interface WorkspaceImprovement {
  id: string;
  type: 'knowledge_gap' | 'content_quality' | 'brand_incomplete' | 'missing_section' | 'clarification_needed';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel: string;
  actionType: 'upload_document' | 'add_content' | 'configure_brand' | 'answer_question' | 'review_content';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * AI Notification type
 */
interface AINotification {
  id: string;
  workspaceId: string;
  type: 'clarification' | 'suggestion' | 'warning' | 'info';
  title: string;
  message: string;
  question?: string;
  options?: string[];
  answered: boolean;
  answer?: string;
  createdAt: string;
  expiresAt?: string;
}

/**
 * Suggestions Panel Component
 * Shows workspace improvements and recommendations
 */
function SuggestionsPanel({ workspaceId }: { workspaceId: string }) {
  const { addToast } = useToast();
  const router = useRouter();
  const [improvements, setImprovements] = useState<WorkspaceImprovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<{
    totalImprovements: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  } | null>(null);

  const fetchImprovements = useCallback(async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/improvements`);
      const data = await response.json();

      if (data.success) {
        setImprovements(data.improvements || []);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch improvements:', data.error);
      }
    } catch (error) {
      console.error('Error fetching improvements:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchImprovements();
  }, [fetchImprovements]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/improvements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_improvements' }),
      });
      const data = await response.json();
      if (data.success) {
        setImprovements(data.improvements || []);
        addToast({
          title: 'Refreshed',
          description: 'Suggestions have been updated',
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Error refreshing:', error);
      addToast({
        title: 'Error',
        description: 'Failed to refresh suggestions',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRegenerateLayouts = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/improvements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate_layouts' }),
      });
      const data = await response.json();
      if (data.success) {
        addToast({
          title: 'Success',
          description: `Generated ${data.sectionsGenerated} sections`,
          variant: 'success',
        });
        fetchImprovements();
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to regenerate layouts',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error regenerating:', error);
      addToast({
        title: 'Error',
        description: 'Failed to regenerate layouts',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAction = (improvement: WorkspaceImprovement) => {
    switch (improvement.actionType) {
      case 'upload_document':
        router.push(`/workspaces/${workspaceId}/documents`);
        break;
      case 'configure_brand':
        // Switch to branding tab would require lifting state
        addToast({
          title: 'Go to Branding',
          description: 'Click the Branding tab to configure brand settings',
          variant: 'info',
        });
        break;
      case 'add_content':
        router.push(`/workspaces/${workspaceId}/knowledge-base`);
        break;
      case 'answer_question':
        // This would navigate to the notifications tab
        addToast({
          title: 'Answer Questions',
          description: 'Click the AI Questions tab to answer clarification questions',
          variant: 'info',
        });
        break;
      default:
        break;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'knowledge_gap':
        return <Database className="h-5 w-5" />;
      case 'content_quality':
        return <Sparkles className="h-5 w-5" />;
      case 'brand_incomplete':
        return <Palette className="h-5 w-5" />;
      case 'missing_section':
        return <FileText className="h-5 w-5" />;
      case 'clarification_needed':
        return <HelpCircle className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Improvement Suggestions
              </CardTitle>
              <CardDescription>
                AI-powered recommendations to improve your website content and quality
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="default" size="sm" onClick={handleRegenerateLayouts} disabled={isRefreshing}>
                <Wand2 className="h-4 w-4 mr-2" />
                Regenerate Layouts
              </Button>
            </div>
          </div>
        </CardHeader>
        {stats && (
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <div className="text-2xl font-bold">{stats.totalImprovements}</div>
                <div className="text-xs text-neutral-500">Total Suggestions</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
                <div className="text-xs text-red-600">High Priority</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.mediumPriority}</div>
                <div className="text-xs text-yellow-600">Medium Priority</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.lowPriority}</div>
                <div className="text-xs text-green-600">Low Priority</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Improvements List */}
      {improvements.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Looking Great!</h3>
            <p className="text-neutral-500 mb-4">
              No improvements needed at this time. Your workspace is well-configured.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {improvements.map((improvement) => (
            <Card key={improvement.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getPriorityColor(improvement.priority)}`}>
                    {getTypeIcon(improvement.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{improvement.title}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(
                          improvement.priority
                        )}`}
                      >
                        {improvement.priority}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-3">{improvement.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(improvement)}
                    >
                      {improvement.actionLabel}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tips for Better Content Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <FileUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>Upload more documents to expand your knowledge base</span>
            </li>
            <li className="flex items-start gap-2">
              <Palette className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span>Complete your brand configuration for consistent styling</span>
            </li>
            <li className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Answer AI questions to improve content accuracy</span>
            </li>
            <li className="flex items-start gap-2">
              <Database className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <span>Add pricing, testimonials, and FAQ content for richer pages</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * AI Notifications Panel Component
 * Shows AI-generated clarification questions
 */
function AINotificationsPanel({ workspaceId }: { workspaceId: string }) {
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<AINotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    answered: number;
  } | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/notifications`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch notifications:', data.error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleGenerateClarifications = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_clarifications' }),
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        addToast({
          title: 'Generated',
          description: 'New clarification questions have been generated',
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Error generating:', error);
      addToast({
        title: 'Error',
        description: 'Failed to generate clarifications',
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerNotification = async (notificationId: string, answer: string) => {
    if (!answer.trim()) {
      addToast({
        title: 'Error',
        description: 'Please provide an answer',
        variant: 'error',
      });
      return;
    }

    setSubmittingIds(prev => new Set(prev).add(notificationId));
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          notificationId,
          answer: answer.trim(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setAnswerInputs(prev => {
          const updated = { ...prev };
          delete updated[notificationId];
          return updated;
        });
        addToast({
          title: 'Answered',
          description: 'Your response has been saved',
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Error answering:', error);
      addToast({
        title: 'Error',
        description: 'Failed to save answer',
        variant: 'error',
      });
    } finally {
      setSubmittingIds(prev => {
        const updated = new Set(prev);
        updated.delete(notificationId);
        return updated;
      });
    }
  };

  const handleDismiss = async (notificationId: string) => {
    setSubmittingIds(prev => new Set(prev).add(notificationId));
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dismiss',
          notificationId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error dismissing:', error);
    } finally {
      setSubmittingIds(prev => {
        const updated = new Set(prev);
        updated.delete(notificationId);
        return updated;
      });
    }
  };

  const handleSelectOption = async (notificationId: string, option: string) => {
    await handleAnswerNotification(notificationId, option);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'clarification':
        return <HelpCircle className="h-5 w-5 text-blue-500" />;
      case 'suggestion':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'clarification':
        return 'bg-blue-100 text-blue-700';
      case 'suggestion':
        return 'bg-yellow-100 text-yellow-700';
      case 'warning':
        return 'bg-orange-100 text-orange-700';
      case 'info':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const pendingNotifications = notifications.filter(n => !n.answered);
  const answeredNotifications = notifications.filter(n => n.answered && n.answer !== '__dismissed__');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                AI Clarification Questions
              </CardTitle>
              <CardDescription>
                Help the AI understand your preferences by answering these questions
              </CardDescription>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerateClarifications}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Questions
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {stats && (
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-neutral-500">Total Questions</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                <div className="text-xs text-blue-600">Pending</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.answered}</div>
                <div className="text-xs text-green-600">Answered</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Pending Questions */}
      {pendingNotifications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Pending Questions ({pendingNotifications.length})
          </h3>
          <div className="space-y-3">
            {pendingNotifications.map((notification) => (
              <Card key={notification.id} className="border-l-4 border-l-blue-500">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${getTypeBadgeColor(
                            notification.type
                          )}`}
                        >
                          {notification.type}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-3">{notification.message}</p>

                      {notification.question && (
                        <div className="p-3 bg-blue-50 rounded-lg mb-3">
                          <p className="text-sm font-medium text-blue-800">
                            {notification.question}
                          </p>
                        </div>
                      )}

                      {/* Options or Free-form Input */}
                      {notification.options && notification.options.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {notification.options.map((option, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectOption(notification.id, option)}
                              disabled={submittingIds.has(notification.id)}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Type your answer..."
                          value={answerInputs[notification.id] || ''}
                          onChange={(e) =>
                            setAnswerInputs((prev) => ({
                              ...prev,
                              [notification.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAnswerNotification(
                                notification.id,
                                answerInputs[notification.id] || ''
                              );
                            }
                          }}
                          disabled={submittingIds.has(notification.id)}
                        />
                        <Button
                          size="sm"
                          onClick={() =>
                            handleAnswerNotification(
                              notification.id,
                              answerInputs[notification.id] || ''
                            )
                          }
                          disabled={
                            submittingIds.has(notification.id) ||
                            !answerInputs[notification.id]?.trim()
                          }
                        >
                          {submittingIds.has(notification.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(notification.id)}
                          disabled={submittingIds.has(notification.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Pending Questions */}
      {pendingNotifications.length === 0 && (
        <Card className="py-8">
          <CardContent className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
            <p className="text-neutral-500 mb-4">
              No pending questions. Click "Generate Questions" to get AI-powered clarifications.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Answered Questions */}
      {answeredNotifications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Answered ({answeredNotifications.length})
          </h3>
          <div className="space-y-2">
            {answeredNotifications.slice(0, 5).map((notification) => (
              <Card key={notification.id} className="bg-neutral-50">
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      {notification.question && (
                        <p className="text-xs text-neutral-500 mt-1">
                          Q: {notification.question}
                        </p>
                      )}
                      <p className="text-sm text-green-700 mt-1">
                        A: {notification.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {answeredNotifications.length > 5 && (
              <p className="text-sm text-neutral-500 text-center py-2">
                + {answeredNotifications.length - 5} more answered questions
              </p>
            )}
          </div>
        </div>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Why Answer These Questions?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span>Helps AI generate more accurate and relevant content</span>
            </li>
            <li className="flex items-start gap-2">
              <Palette className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>Ensures your brand voice and style are captured correctly</span>
            </li>
            <li className="flex items-start gap-2">
              <Database className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Fills gaps in knowledge that may be missing from documents</span>
            </li>
            <li className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <span>Your answers are used in nightly sync to improve generated pages</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
