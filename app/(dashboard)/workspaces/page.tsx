import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

export default async function WorkspacesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's workspaces
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select(`
      role,
      workspace:workspaces (
        id,
        name,
        slug,
        description,
        logo_url,
        created_at
      )
    `)
    .eq('user_id', user?.id);

  const workspaces = memberships?.map((m) => ({
    ...m.workspace,
    role: m.role,
  })) || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
            Workspaces
          </h1>
          <p className="text-[var(--color-muted-foreground)] mt-1">
            Select a workspace or create a new one
          </p>
        </div>
        <Link href="/workspaces/new">
          <Button>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Workspace
          </Button>
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-[var(--color-muted)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[var(--color-muted-foreground)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">
              No workspaces yet
            </h3>
            <p className="text-[var(--color-muted-foreground)] mb-6 max-w-sm mx-auto">
              Create your first workspace to start building AI-powered marketing websites.
            </p>
            <Link href="/workspaces/new">
              <Button>Create your first workspace</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="group"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {workspace.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs px-2 py-1 bg-[var(--color-muted)] rounded-full text-[var(--color-muted-foreground)] capitalize">
                      {workspace.role}
                    </span>
                  </div>
                  <CardTitle className="mt-4 group-hover:text-[var(--color-primary)] transition-colors">
                    {workspace.name}
                  </CardTitle>
                  <CardDescription>
                    {workspace.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-[var(--color-muted-foreground)]">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Created {new Date(workspace.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
