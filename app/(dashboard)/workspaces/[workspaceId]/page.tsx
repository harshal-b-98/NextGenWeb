'use client';

/**
 * Workspace Overview Page
 * Dashboard with quick access to all workspace features
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Brain,
  Globe,
  Palette,
  BarChart3,
  Users,
  Settings,
  ArrowRight,
  Loader2,
  Plus,
  Home,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

interface WorkspaceStats {
  documentCount: number;
  websiteCount: number;
  personaCount: number;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

const quickActions = [
  {
    title: 'Documents',
    description: 'Upload and manage source documents',
    icon: FileText,
    href: 'documents',
    color: 'bg-blue-500',
  },
  {
    title: 'Knowledge Base',
    description: 'View extracted knowledge and entities',
    icon: Brain,
    href: 'knowledge-base',
    color: 'bg-purple-500',
  },
  {
    title: 'Websites',
    description: 'Generate and manage marketing sites',
    icon: Globe,
    href: 'websites',
    color: 'bg-green-500',
  },
  {
    title: 'Branding',
    description: 'Configure brand colors and themes',
    icon: Palette,
    href: 'branding',
    color: 'bg-orange-500',
  },
  {
    title: 'Analytics',
    description: 'View visitor and conversion data',
    icon: BarChart3,
    href: 'analytics',
    color: 'bg-pink-500',
  },
  {
    title: 'Team',
    description: 'Manage workspace members',
    icon: Users,
    href: 'team',
    color: 'bg-cyan-500',
  },
];

export default function WorkspaceOverviewPage() {
  const params = useParams();
  const { addToast } = useToast();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [stats, setStats] = useState<WorkspaceStats>({
    documentCount: 0,
    websiteCount: 0,
    personaCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkspaceData() {
      const supabase = createClient();

      try {
        // Fetch workspace details
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .single();

        if (workspaceError) throw workspaceError;
        setWorkspace(workspaceData);

        // Fetch stats in parallel
        const [documentsRes, websitesRes, personasRes] = await Promise.all([
          supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId),
          supabase
            .from('websites')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId),
          supabase
            .from('personas')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId),
        ]);

        setStats({
          documentCount: documentsRes.count || 0,
          websiteCount: websitesRes.count || 0,
          personaCount: personasRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching workspace data:', error);
        addToast({
          title: 'Error',
          description: 'Failed to load workspace data',
          variant: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkspaceData();
  }, [workspaceId, addToast]);

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
          href="/workspaces"
          className="hover:text-neutral-700 flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          All Workspaces
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-900 font-medium">{workspace?.name || 'Workspace'}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{workspace?.name || 'Workspace'}</h1>
        {workspace?.description && (
          <p className="text-neutral-500">{workspace.description}</p>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Documents</p>
                <p className="text-3xl font-bold">{stats.documentCount}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Websites</p>
                <p className="text-3xl font-bold">{stats.websiteCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Personas</p>
                <p className="text-3xl font-bold">{stats.personaCount}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={`/workspaces/${workspaceId}/${action.href}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-neutral-500">{action.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-neutral-300 group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Getting Started */}
      {stats.documentCount === 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Follow these steps to generate your first AI-powered website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Upload Documents</h4>
                  <p className="text-sm text-neutral-500">
                    Upload your marketing materials, product docs, or any content you want to use.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-neutral-500">Build Knowledge Base</h4>
                  <p className="text-sm text-neutral-400">
                    AI extracts key information and identifies personas from your documents.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-neutral-500">Generate Website</h4>
                  <p className="text-sm text-neutral-400">
                    Create personalized marketing websites that adapt to each visitor.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link href={`/workspaces/${workspaceId}/documents`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Document
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
