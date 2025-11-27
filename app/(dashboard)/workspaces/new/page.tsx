'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, useToast } from '@/components/ui';

export default function NewWorkspacePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    // Generate slug: lowercase, replace spaces with hyphens, remove special chars
    const generatedSlug = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        addToast({
          title: 'Authentication error',
          description: 'Please sign in to create a workspace.',
          variant: 'error',
        });
        router.push('/login');
        return;
      }

      // Check if slug is unique
      const { data: existingWorkspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existingWorkspace) {
        addToast({
          title: 'Slug already taken',
          description: 'Please choose a different workspace name.',
          variant: 'error',
        });
        setLoading(false);
        return;
      }

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name,
          slug,
          description: description || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (workspaceError) {
        throw workspaceError;
      }

      // Add owner as workspace member
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        throw memberError;
      }

      addToast({
        title: 'Workspace created!',
        description: `${name} has been created successfully.`,
        variant: 'success',
      });

      // Redirect to the new workspace
      router.push(`/workspaces/${workspace.id}`);
    } catch (error) {
      console.error('Error creating workspace:', error);
      addToast({
        title: 'Failed to create workspace',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <Link
          href="/workspaces"
          className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] inline-flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to workspaces
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a new workspace</CardTitle>
          <CardDescription>
            Workspaces help you organize your websites and collaborate with your team.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <Input
              label="Workspace name"
              placeholder="My Awesome Project"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
                Workspace URL
              </label>
              <div className="flex items-center">
                <span className="text-sm text-[var(--color-muted-foreground)] bg-[var(--color-muted)] px-3 py-2 rounded-l-lg border border-r-0 border-[var(--color-border)]">
                  nextgenweb.app/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-r-lg bg-[var(--color-background)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-ring)] focus:border-transparent outline-none"
                  placeholder="my-awesome-project"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                This will be used in your workspace URL. Only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-ring)] focus:border-transparent outline-none resize-none"
                rows={3}
                placeholder="A brief description of your workspace..."
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Link href="/workspaces">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={loading} disabled={!name || !slug}>
              Create workspace
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
