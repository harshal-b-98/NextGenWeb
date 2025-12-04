/**
 * Preview Workspace - Split-View Studio
 *
 * 30% Chat Panel (left) + 70% Preview Canvas (right)
 * Interactive preview environment with conversational feedback
 *
 * Features:
 * - Full conversation history
 * - Review-then-apply workflow
 * - Multi-page rendering
 * - Version selector
 * - Section selection
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SiteRenderer } from '@/components/site/site-renderer';
import { ChatPanel } from '@/components/studio';
import type { ConversationMessage, ProposedChange } from '@/components/studio';
import Link from 'next/link';

interface Website {
  id: string;
  name: string;
  slug: string;
  brandConfig: any;
  draftVersionId: string | null;
  productionVersionId: string | null;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  path: string;
  content: any;
  is_homepage: boolean;
  sort_order: number;
  current_revision_id: string | null;
}

interface Version {
  id: string;
  version_number: number;
  version_name: string | null;
  status: string;
  created_at: string;
  trigger_type: string | null;
}

interface GlobalComponents {
  header: any;
  footer: any;
}

interface PreviewWorkspaceProps {
  website: Website;
  pages: Page[];
  globalComponents: GlobalComponents;
  versions: Version[];
  currentVersion: any;
  workspaceId: string;
  userId: string;
}

export function PreviewWorkspace({
  website,
  pages,
  globalComponents,
  versions,
  currentVersion,
  workspaceId,
  userId,
}: PreviewWorkspaceProps) {
  const router = useRouter();
  const [activePage, setActivePage] = useState<Page>(
    pages.find((p) => p.is_homepage) || pages[0]
  );
  const [selectedVersion, setSelectedVersion] = useState<string | null>(
    currentVersion?.id || website.draftVersionId
  );
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Conversation state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [proposedChanges, setProposedChanges] = useState<ProposedChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle version switch
  const handleVersionSwitch = async (versionId: string) => {
    setSelectedVersion(versionId);
    router.push(`/workspaces/${workspaceId}/websites/${website.id}/preview?versionId=${versionId}`);
  };

  // Handle page navigation
  const handlePageChange = (page: Page) => {
    setActivePage(page);
    setSelectedSection(null);
  };

  // Handle section selection
  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId);
  };

  // Handle send message
  const handleSendMessage = async (text: string, sectionId?: string) => {
    setIsLoading(true);

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
        sequence_number: prev.length + 1,
      },
    ]);

    // Add processing indicator
    const processingMessageId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: processingMessageId,
        role: 'assistant',
        content: '🤖 Analyzing your feedback...',
        created_at: new Date().toISOString(),
        sequence_number: prev.length + 2,
      },
    ]);

    try {
      const response = await fetch('/api/conversation/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          websiteId: website.id,
          pageId: activePage.id,
          sectionId,
          sessionId: conversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(`Failed to send message: ${response.status} - ${errorData.error || 'Unknown'}`);
      }

      const data = await response.json();

      // Update conversation state
      setConversationId(data.sessionId);

      // Add AI response if no changes to auto-apply
      if (data.message && (!data.proposedChanges || data.proposedChanges.length === 0)) {
        // Remove processing indicator
        setMessages((prev) => prev.filter((m) => m.id !== processingMessageId));

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.message,
            created_at: new Date().toISOString(),
            sequence_number: prev.length + 1,
          },
        ]);
      }

      // Add proposed changes and auto-apply them
      if (data.proposedChanges && data.proposedChanges.length > 0) {
        setProposedChanges((prev) => [...prev, ...data.proposedChanges]);

        // AUTO-APPLY all proposed changes immediately
        // Processing message will be replaced by autoApplyChanges
        await autoApplyChanges(data.proposedChanges, processingMessageId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Apply change to local state (optimistic update)
  const applyChangeLocally = (page: Page, change: any): Page => {
    return {
      ...page,
      content: {
        ...page.content,
        sections: page.content.sections.map((section: any) => {
          if (section.id !== change.sectionId) return section;

          switch (change.changeType) {
            case 'content':
              return {
                ...section,
                content: {
                  ...section.content,
                  [change.field]: change.preview.after
                }
              };

            case 'style':
              return {
                ...section,
                styles: {
                  ...(section.styles || {}),
                  ...change.styleUpdates
                }
              };

            case 'layout':
              return {
                ...section,
                layout: {
                  ...(section.layout || {}),
                  ...change.layoutUpdate
                }
              };

            default:
              return section;
          }
        })
      }
    };
  };

  // Auto-apply all proposed changes immediately after generation
  const autoApplyChanges = async (changes: ProposedChange[], processingMsgId: string) => {
    let updatedPage = activePage;
    const failedChanges: string[] = [];

    for (const change of changes) {
      try {
        // 1. Apply optimistically to UI
        updatedPage = applyChangeLocally(updatedPage, change);

        // 2. Persist to database
        const response = await fetch('/api/conversation/apply-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ change, pageId: activePage.id }),
        });

        if (!response.ok) {
          failedChanges.push(change.id);
        }
      } catch (error) {
        failedChanges.push(change.id);
        console.error('Failed to apply change:', error);
      }
    }

    // Update UI with all applied changes at once
    setActivePage(updatedPage);

    // Remove processing indicator and show success/failure message
    setMessages((prev) => {
      const filtered = prev.filter((m) => m.id !== processingMsgId);
      const successMsg = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        created_at: new Date().toISOString(),
        sequence_number: filtered.length + 1,
        content: failedChanges.length === 0
          ? `✅ Applied ${changes.length} change(s) to preview!`
          : `⚠️ Applied ${changes.length - failedChanges.length}/${changes.length} changes. Some changes failed to save.`,
      };
      return [...filtered, successMsg];
    });
  };

  // Handle apply change with optimistic UI updates
  const handleApplyChange = async (changeId: string) => {
    const change = proposedChanges.find((c) => c.id === changeId);
    if (!change) {
      console.error('Change not found:', changeId);
      return;
    }

    // Store original page for rollback
    const originalPage = activePage;

    try {
      // 1. INSTANT: Apply change to UI immediately (optimistic update)
      const optimisticPage = applyChangeLocally(activePage, change);
      setActivePage(optimisticPage);

      // Remove the applied change from proposed changes immediately
      setProposedChanges((prev) => prev.filter((c) => c.id !== changeId));

      // Add immediate confirmation
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '✅ Change applied! Saving to database...',
          created_at: new Date().toISOString(),
          sequence_number: prev.length + 1,
        },
      ]);

      // 2. BACKGROUND: Send to server to persist
      const response = await fetch('/api/conversation/apply-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          change: change,
          pageId: activePage.id,
        }),
      });

      if (!response.ok) {
        // Rollback optimistic update on server error
        setActivePage(originalPage);
        setProposedChanges((prev) => [...prev, change]);

        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to save: ${errorData.error}`);
      }

      // Success! Optimistic update was correct
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '✅ Saved to database successfully!',
          created_at: new Date().toISOString(),
          sequence_number: prev.length + 1,
        },
      ]);

    } catch (error) {
      console.error('Error applying change:', error);
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ Failed to apply change: ${error instanceof Error ? error.message : 'Unknown error'}`,
          created_at: new Date().toISOString(),
          sequence_number: prev.length + 1,
        },
      ]);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT: Chat Panel (30%) */}
      <div className="w-[30%] border-r border-gray-200">
        <ChatPanel
          conversationId={conversationId}
          messages={messages}
          proposedChanges={proposedChanges}
          selectedSection={selectedSection}
          onSendMessage={handleSendMessage}
          onApplyChange={handleApplyChange}
          isLoading={isLoading}
        />
      </div>

      {/* RIGHT: Preview Canvas (70%) */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Left: Back to Dashboard */}
            <div className="flex items-center space-x-4">
              <Link
                href={`/workspaces/${workspaceId}/websites/${website.id}`}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Dashboard
              </Link>
              <div className="h-4 w-px bg-gray-300" />
              <h1 className="text-sm font-semibold text-gray-900">{website.name} - Studio</h1>
            </div>

            {/* Center: Version Selector */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500">Version:</span>
              <select
                value={selectedVersion || ''}
                onChange={(e) => handleVersionSwitch(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    v{version.version_number} - {version.version_name || 'Untitled'}{' '}
                    {version.id === website.draftVersionId && '(Draft)'}
                    {version.id === website.productionVersionId && '(Production)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Right: View Live Site */}
            <button
              onClick={() => window.open(`/sites/${website.slug}`, '_blank')}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              View Live Site
            </button>
          </div>

          {/* Page Navigation */}
          {pages.length > 1 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-2">
              <div className="flex items-center space-x-1 overflow-x-auto">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                      activePage.id === page.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {page.title}
                    {page.is_homepage && (
                      <span className="ml-1 text-xs text-gray-400">(Home)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="max-w-7xl mx-auto">
            <SiteRenderer
              website={{
                id: website.id,
                slug: website.slug,
                name: website.name,
                brand_config: website.brandConfig,
              }}
              page={activePage}
              pages={pages}
              headerContent={globalComponents.header}
              footerContent={globalComponents.footer}
              previewMode={true}
              feedbackMode={true}
              onSectionClick={handleSectionClick}
              selectedSection={selectedSection}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
