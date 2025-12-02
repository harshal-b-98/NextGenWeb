'use client';

/**
 * Page Preview
 * Phase 5.2: Preview System
 *
 * Full-featured preview with device modes, persona simulation, and live updates.
 */

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { DynamicPageRenderer } from '@/components/runtime';
import { ComponentInspector } from '@/components/preview';
import { usePreviewHotReload, formatTimeSince } from '@/lib/preview';
import type { RuntimePageData } from '@/lib/runtime/types';

// Device presets
const DEVICE_PRESETS = {
  desktop: { name: 'Desktop', width: '100%', height: '100%', icon: 'monitor' },
  tablet: { name: 'Tablet', width: '768px', height: '1024px', icon: 'tablet' },
  mobile: { name: 'Mobile', width: '375px', height: '812px', icon: 'smartphone' },
} as const;

type DeviceMode = keyof typeof DEVICE_PRESETS;

interface Persona {
  id: string;
  name: string;
  title?: string;
  description?: string;
}

interface PreviewData {
  pageData: RuntimePageData;
  availablePersonas: Persona[];
  websiteStatus: string;
  pageStatus: string;
}

export default function PreviewPage({
  params,
}: {
  params: Promise<{ workspaceId: string; pageId: string }>;
}) {
  const { workspaceId, pageId } = use(params);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preview controls state
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [hotReloadEnabled, setHotReloadEnabled] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Hot reload hook
  const hotReload = usePreviewHotReload({
    workspaceId,
    pageId,
    enabled: hotReloadEnabled && !loading,
    pollInterval: 3000,
    onDataChange: (data) => {
      setPreviewData(data);
    },
    onError: (err) => {
      console.warn('Hot reload error:', err);
    },
  });

  const fetchPreview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/workspaces/${workspaceId}/preview/${pageId}`
      );

      if (!response.ok) {
        throw new Error('Failed to load preview');
      }

      const data = await response.json();
      setPreviewData(data.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, pageId]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen();
      }
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '1') {
          e.preventDefault();
          setDeviceMode('desktop');
        } else if (e.key === '2') {
          e.preventDefault();
          setDeviceMode('tablet');
        } else if (e.key === '3') {
          e.preventDefault();
          setDeviceMode('mobile');
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(100);
        } else if (e.key === '=') {
          e.preventDefault();
          setZoom((z) => Math.min(z + 10, 200));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom((z) => Math.max(z - 10, 50));
        } else if (e.key === 'i') {
          e.preventDefault();
          setShowInspector((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || !previewData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Preview Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Unable to load page preview'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchPreview}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              href={`/workspaces/${workspaceId}/websites`}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Back to Websites
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const device = DEVICE_PRESETS[deviceMode];

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Preview Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        {/* Left: Navigation & Title */}
        <div className="flex items-center gap-4">
          <Link
            href={`/workspaces/${workspaceId}/websites`}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-white font-medium">{previewData.pageData.title}</h1>
            <p className="text-xs text-gray-400">/{previewData.pageData.slug}</p>
          </div>
          <StatusBadge status={previewData.pageStatus} />
        </div>

        {/* Center: Device Controls */}
        <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
          {(Object.keys(DEVICE_PRESETS) as DeviceMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setDeviceMode(mode)}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                deviceMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title={`${DEVICE_PRESETS[mode].name} (Cmd+${mode === 'desktop' ? '1' : mode === 'tablet' ? '2' : '3'})`}
            >
              <DeviceIcon type={DEVICE_PRESETS[mode].icon} />
              <span className="text-sm hidden md:inline">{DEVICE_PRESETS[mode].name}</span>
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-2 py-1">
            <button
              onClick={() => setZoom((z) => Math.max(z - 10, 50))}
              className="text-gray-400 hover:text-white p-1"
              title="Zoom Out (Cmd+-)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm text-gray-300 w-12 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(z + 10, 200))}
              className="text-gray-400 hover:text-white p-1"
              title="Zoom In (Cmd+=)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${
              showGrid ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
            title="Toggle Grid"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </button>

          {/* Inspector Toggle */}
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`p-2 rounded-lg transition-colors ${
              showInspector ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
            title="Toggle Inspector (Cmd+I)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-white rounded-lg"
            title="Toggle Fullscreen (Esc to exit)"
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>

          {/* Hot Reload Toggle */}
          <div className="flex items-center gap-2 px-2 py-1 bg-gray-700 rounded-lg">
            <button
              onClick={() => setHotReloadEnabled(!hotReloadEnabled)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                hotReloadEnabled
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-gray-600 text-gray-400'
              }`}
              title={hotReloadEnabled ? 'Disable Hot Reload' : 'Enable Hot Reload'}
            >
              <div className={`w-2 h-2 rounded-full ${
                hotReload.isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
              }`} />
              <span className="text-xs">
                {hotReloadEnabled ? 'Live' : 'Off'}
              </span>
            </button>
            {hotReload.lastUpdate && (
              <span className="text-xs text-gray-500">
                {formatTimeSince(hotReload.lastUpdate)}
              </span>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={hotReload.refresh}
            className="p-2 text-gray-400 hover:text-white rounded-lg"
            title="Refresh Preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Frame */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <div
            className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
              showGrid ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              width: device.width,
              height: device.height,
              maxWidth: deviceMode === 'desktop' ? '100%' : device.width,
              maxHeight: deviceMode === 'desktop' ? '100%' : device.height,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center center',
            }}
          >
            <div className="w-full h-full overflow-auto">
              <PreviewRenderer
                pageData={previewData.pageData}
                selectedPersona={selectedPersona}
                showGrid={showGrid}
              />
            </div>
          </div>
        </div>

        {/* Sidebar - Persona Selection */}
        <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Persona Simulation Panel */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Persona Simulation
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Preview how the page appears to different personas
            </p>

            {/* Default/None */}
            <button
              onClick={() => setSelectedPersona(null)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
                selectedPersona === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-medium">Default View</div>
              <div className="text-xs opacity-70">No persona selected</div>
            </button>

            {/* Persona List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {previewData.availablePersonas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedPersona === persona.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-medium">{persona.name}</div>
                  {persona.title && (
                    <div className="text-xs opacity-70">{persona.title}</div>
                  )}
                </button>
              ))}
            </div>

            {previewData.availablePersonas.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">
                No personas configured
              </div>
            )}
          </div>

          {/* Page Info Panel */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Page Info
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Title</dt>
                <dd className="text-gray-200">{previewData.pageData.title}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Path</dt>
                <dd className="text-gray-200 font-mono">{previewData.pageData.path}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Sections</dt>
                <dd className="text-gray-200">{previewData.pageData.sections.length}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Persona Variants</dt>
                <dd className="text-gray-200">{previewData.pageData.availablePersonas.length}</dd>
              </div>
            </dl>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="p-4 mt-auto">
            <h4 className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">
              Shortcuts
            </h4>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Desktop</span>
                <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">⌘1</kbd>
              </div>
              <div className="flex justify-between">
                <span>Tablet</span>
                <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">⌘2</kbd>
              </div>
              <div className="flex justify-between">
                <span>Mobile</span>
                <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">⌘3</kbd>
              </div>
              <div className="flex justify-between">
                <span>Reset Zoom</span>
                <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">⌘0</kbd>
              </div>
              <div className="flex justify-between">
                <span>Zoom In/Out</span>
                <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">⌘+/-</kbd>
              </div>
              <div className="flex justify-between">
                <span>Inspector</span>
                <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">⌘I</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Component Inspector Panel */}
      <ComponentInspector
        sections={previewData.pageData.sections}
        selectedSectionId={selectedSectionId}
        activeVariant={selectedPersona || 'default'}
        onSectionSelect={setSelectedSectionId}
        isVisible={showInspector}
        onToggle={() => setShowInspector(false)}
      />
    </div>
  );
}

// Preview Renderer Component
function PreviewRenderer({
  pageData,
  selectedPersona,
  showGrid,
}: {
  pageData: RuntimePageData;
  selectedPersona: string | null;
  showGrid: boolean;
}) {
  return (
    <div className={showGrid ? 'debug-grid' : ''}>
      <style jsx global>{`
        .debug-grid > * {
          outline: 1px dashed rgba(59, 130, 246, 0.3);
        }
        .debug-grid > *:hover {
          outline: 2px solid rgba(59, 130, 246, 0.6);
        }
      `}</style>
      <DynamicPageRenderer
        pageData={pageData}
        autoInitTracking={false}
        forcedPersonaId={selectedPersona || undefined}
      />
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStyles = () => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'generating':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'archived':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border capitalize ${getStyles()}`}>
      {status}
    </span>
  );
}

// Device Icon Component
function DeviceIcon({ type }: { type: string }) {
  switch (type) {
    case 'monitor':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'tablet':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'smartphone':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    default:
      return null;
  }
}
