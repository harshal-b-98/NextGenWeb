/**
 * Preview Hot Reload Hook
 * Phase 5.2: Preview System
 *
 * Hook for enabling hot reload in preview mode with polling and WebSocket support.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePreviewHotReloadOptions {
  /** Workspace ID */
  workspaceId: string;

  /** Page ID to watch */
  pageId: string;

  /** Polling interval in milliseconds (default: 2000) */
  pollInterval?: number;

  /** Whether hot reload is enabled (default: true) */
  enabled?: boolean;

  /** Callback when data changes */
  onDataChange?: (data: any) => void;

  /** Callback on error */
  onError?: (error: string) => void;
}

interface UsePreviewHotReloadReturn {
  /** Whether hot reload is connected/active */
  isConnected: boolean;

  /** Last update timestamp */
  lastUpdate: Date | null;

  /** Number of updates received */
  updateCount: number;

  /** Manually trigger a refresh */
  refresh: () => Promise<void>;

  /** Enable/disable hot reload */
  setEnabled: (enabled: boolean) => void;

  /** Current enabled state */
  isEnabled: boolean;
}

/**
 * Hook for preview hot reload functionality
 * Uses polling to check for page data changes
 */
export function usePreviewHotReload(
  options: UsePreviewHotReloadOptions
): UsePreviewHotReloadReturn {
  const {
    workspaceId,
    pageId,
    pollInterval = 2000,
    enabled: initialEnabled = true,
    onDataChange,
    onError,
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [isEnabled, setIsEnabled] = useState(initialEnabled);

  // Refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataHashRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Calculate a simple hash of the data to detect changes
   */
  const calculateHash = useCallback((data: any): string => {
    return JSON.stringify(data).length.toString() + '-' + JSON.stringify(data).slice(0, 100);
  }, []);

  /**
   * Fetch preview data
   */
  const fetchData = useCallback(async (): Promise<any | null> => {
    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `/api/workspaces/${workspaceId}/preview/${pageId}`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch preview: ${response.status}`);
      }

      const data = await response.json();
      return data.preview;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Request was cancelled, ignore
        return null;
      }
      throw error;
    }
  }, [workspaceId, pageId]);

  /**
   * Check for updates
   */
  const checkForUpdates = useCallback(async () => {
    try {
      const data = await fetchData();
      if (!data) return;

      const currentHash = calculateHash(data);

      // Check if data has changed
      if (lastDataHashRef.current !== null && lastDataHashRef.current !== currentHash) {
        setLastUpdate(new Date());
        setUpdateCount((prev) => prev + 1);
        onDataChange?.(data);
      }

      lastDataHashRef.current = currentHash;
      setIsConnected(true);
    } catch (error) {
      console.error('Hot reload check failed:', error);
      setIsConnected(false);
      onError?.(error instanceof Error ? error.message : 'Hot reload check failed');
    }
  }, [fetchData, calculateHash, onDataChange, onError]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    try {
      const data = await fetchData();
      if (data) {
        lastDataHashRef.current = calculateHash(data);
        setLastUpdate(new Date());
        setUpdateCount((prev) => prev + 1);
        onDataChange?.(data);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Manual refresh failed:', error);
      onError?.(error instanceof Error ? error.message : 'Refresh failed');
    }
  }, [fetchData, calculateHash, onDataChange, onError]);

  /**
   * Start polling
   */
  useEffect(() => {
    if (!isEnabled) {
      setIsConnected(false);
      return;
    }

    // Initial check
    checkForUpdates();

    // Set up polling interval
    pollIntervalRef.current = setInterval(checkForUpdates, pollInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isEnabled, pollInterval, checkForUpdates]);

  return {
    isConnected,
    lastUpdate,
    updateCount,
    refresh,
    setEnabled: setIsEnabled,
    isEnabled,
  };
}

/**
 * Format time since last update
 */
export function formatTimeSince(date: Date | null): string {
  if (!date) return 'Never';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
