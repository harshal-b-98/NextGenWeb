'use client';

/**
 * Websites Management Page
 * Phase 5.1: Admin Dashboard
 *
 * List, create, edit, and manage websites within a workspace.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  Plus,
  MoreVertical,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  FileText,
  Loader2,
  Search,
  RefreshCw,
  Home,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { WebsiteStatus } from '@/types/database';

type GenerationStatus = 'draft' | 'generating' | 'generated' | 'published';

interface Website {
  id: string;
  name: string;
  slug: string;
  status: WebsiteStatus;
  generation_status: GenerationStatus;
  domain: string | null;
  pageCount: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  last_generated_at: string | null;
}

const statusColors: Record<WebsiteStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  generating: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-red-100 text-red-700',
};

const statusLabels: Record<WebsiteStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  published: 'Published',
  archived: 'Archived',
};

const generationStatusColors: Record<GenerationStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  generating: 'bg-blue-100 text-blue-700',
  generated: 'bg-green-100 text-green-700',
  published: 'bg-purple-100 text-purple-700',
};

const generationStatusLabels: Record<GenerationStatus, string> = {
  draft: 'No Layout',
  generating: 'Generating...',
  generated: 'Layout Ready',
  published: 'Published',
};

export default function WebsitesPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const workspaceId = params.workspaceId as string;

  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const fetchWebsites = useCallback(async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/websites`);
      const data = await response.json();

      if (data.success) {
        setWebsites(data.websites);
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to load websites',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
      addToast({
        title: 'Error',
        description: 'Failed to load websites',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, addToast]);

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  const handleDeleteWebsite = async (websiteId: string) => {
    if (!confirm('Are you sure you want to delete this website? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/websites/${websiteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        addToast({
          title: 'Success',
          description: 'Website deleted successfully',
          variant: 'success',
        });
        setWebsites(websites.filter(w => w.id !== websiteId));
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to delete website',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting website:', error);
      addToast({
        title: 'Error',
        description: 'Failed to delete website',
        variant: 'error',
      });
    }

    setActiveMenu(null);
  };

  const handleGenerateLayout = async (websiteId: string) => {
    // Update UI immediately to show generating status
    setWebsites(websites.map(w =>
      w.id === websiteId
        ? { ...w, generation_status: 'generating' as GenerationStatus }
        : w
    ));

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/layout/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId }),
      });

      const data = await response.json();

      if (data.success) {
        addToast({
          title: 'Success',
          description: `Layout generated with ${data.sectionsGenerated} sections`,
          variant: 'success',
        });
        // Update the website status
        setWebsites(websites.map(w =>
          w.id === websiteId
            ? { ...w, generation_status: 'generated' as GenerationStatus, last_generated_at: new Date().toISOString() }
            : w
        ));
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to generate layout',
          variant: 'error',
        });
        // Revert status
        setWebsites(websites.map(w =>
          w.id === websiteId
            ? { ...w, generation_status: 'draft' as GenerationStatus }
            : w
        ));
      }
    } catch (error) {
      console.error('Error generating layout:', error);
      addToast({
        title: 'Error',
        description: 'Failed to generate layout',
        variant: 'error',
      });
      // Revert status
      setWebsites(websites.map(w =>
        w.id === websiteId
          ? { ...w, generation_status: 'draft' as GenerationStatus }
          : w
      ));
    }

    setActiveMenu(null);
  };

  const filteredWebsites = websites.filter(website =>
    website.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    website.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
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
        <span className="text-neutral-900 font-medium">Websites</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Websites</h1>
          <p className="text-neutral-500">
            Manage your marketing websites and landing pages
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Website
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search websites..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchWebsites}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Websites grid */}
      {filteredWebsites.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Globe className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No websites yet</h3>
            <p className="text-neutral-500 mb-4">
              {searchQuery
                ? 'No websites match your search'
                : 'Create your first AI-powered marketing website'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Website
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWebsites.map(website => (
            <Card key={website.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Globe className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{website.name}</CardTitle>
                      <p className="text-sm text-neutral-500">/{website.slug}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setActiveMenu(activeMenu === website.id ? null : website.id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {activeMenu === website.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border z-10">
                        <div className="py-1">
                          <Link
                            href={`/workspaces/${workspaceId}/websites/${website.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Website
                          </Link>
                          <Link
                            href={`/sites/${website.slug}`}
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Live Site
                          </Link>
                          <button
                            onClick={() => handleGenerateLayout(website.id)}
                            disabled={website.generation_status === 'generating'}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left disabled:opacity-50"
                          >
                            {website.generation_status === 'generating' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            {website.generation_status === 'generating' ? 'Generating...' : 'Generate Layout'}
                          </button>
                          <button
                            onClick={() => handleDeleteWebsite(website.id)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Website
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[website.status]}`}>
                      {statusLabels[website.status]}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${generationStatusColors[website.generation_status || 'draft']}`}>
                      {website.generation_status === 'generating' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : website.generation_status === 'generated' ? (
                        <Zap className="h-3 w-3" />
                      ) : null}
                      {generationStatusLabels[website.generation_status || 'draft']}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-neutral-500">
                    <FileText className="h-4 w-4 mr-1" />
                    {website.pageCount} pages
                  </div>
                </div>

                {website.domain && (
                  <p className="text-sm text-neutral-500 mb-3 truncate">
                    {website.domain}
                  </p>
                )}

                {website.last_generated_at && (
                  <p className="text-xs text-neutral-400 mb-3">
                    Last generated: {new Date(website.last_generated_at).toLocaleDateString()}
                  </p>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/workspaces/${workspaceId}/websites/${website.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Manage
                    </Button>
                  </Link>
                  <Link
                    href={`/sites/${website.slug}`}
                    target="_blank"
                  >
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Website Modal */}
      {showCreateModal && (
        <CreateWebsiteModal
          workspaceId={workspaceId}
          onClose={() => setShowCreateModal(false)}
          onCreated={(website) => {
            setWebsites([website, ...websites]);
            setShowCreateModal(false);
            addToast({
              title: 'Success',
              description: 'Website created successfully',
              variant: 'success',
            });
          }}
        />
      )}

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}

/**
 * Create Website Modal Component
 */
function CreateWebsiteModal({
  workspaceId,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  onClose: () => void;
  onCreated: (website: Website) => void;
}) {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !slug) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  }, [name, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/websites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });

      const data = await response.json();

      if (data.success) {
        onCreated({ ...data.website, pageCount: 0 });
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to create website',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error creating website:', error);
      addToast({
        title: 'Error',
        description: 'Failed to create website',
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
          <CardTitle>Create New Website</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Website Name
              </label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="My Marketing Site"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                URL Slug
              </label>
              <Input
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-marketing-site"
                required
              />
              <p className="text-xs text-neutral-500 mt-1">
                Your site will be available at /sites/{slug || 'your-slug'}
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !name || !slug}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Website'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
