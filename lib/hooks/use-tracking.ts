/**
 * Client-side Tracking Hook
 * Phase 4.2: Runtime Persona Detection
 *
 * React hook for visitor behavior tracking on generated websites.
 * Captures clicks, scrolls, navigation, and triggers persona detection.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  TrackingState,
  TrackingConfig,
  TrackingEvent,
  ClickTrackingEvent,
  ScrollTrackingEvent,
  SectionEvent,
  PageViewEvent,
  SessionLifecycleEvent,
  DeviceType,
} from '@/lib/tracking/types';
import { DEFAULT_TRACKING_CONFIG } from '@/lib/tracking/types';

/**
 * Tracking hook options
 */
interface UseTrackingOptions extends Partial<TrackingConfig> {
  onPersonaDetected?: (personaId: string, confidence: number) => void;
  onError?: (error: string) => void;
}

/**
 * Tracking hook return value
 */
interface UseTrackingReturn {
  state: TrackingState;
  isInitialized: boolean;
  detectedPersonaId: string | null;
  personaConfidence: number | null;
  trackClick: (elementId: string, elementType: string, sectionId?: string) => void;
  trackScroll: (scrollDepth: number) => void;
  trackSectionEnter: (sectionId: string, sectionName?: string) => void;
  trackSectionExit: (sectionId: string, visibleTime?: number) => void;
  trackFormStart: (formId: string, formName?: string) => void;
  trackFormFieldFocus: (formId: string, fieldName: string) => void;
  trackFormSubmit: (formId: string, success: boolean) => void;
  trackSearch: (query: string, resultsCount?: number) => void;
  triggerDetection: () => Promise<void>;
  flush: () => Promise<void>;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    if (/tablet|ipad/i.test(ua)) {
      return 'tablet';
    }
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Get or create visitor ID from localStorage
 */
function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return generateId();

  const VISITOR_ID_KEY = 'ngw_visitor_id';
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);

  if (!visitorId) {
    visitorId = generateId();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }

  return visitorId;
}

/**
 * Get browser info
 */
function getBrowserInfo(): { browser: string; os: string } {
  if (typeof window === 'undefined') {
    return { browser: 'unknown', os: 'unknown' };
  }

  const ua = navigator.userAgent;
  let browser = 'unknown';
  let os = 'unknown';

  // Detect browser
  if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Chrome') && !ua.includes('Edge')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Edge')) {
    browser = 'Edge';
  }

  // Detect OS
  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
  }

  return { browser, os };
}

/**
 * Parse UTM parameters from URL
 */
function getUtmParams(): { source?: string; medium?: string; campaign?: string } {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
  };
}

/**
 * Visitor behavior tracking hook
 */
export function useTracking(options: UseTrackingOptions = {}): UseTrackingReturn {
  const config: TrackingConfig = {
    ...DEFAULT_TRACKING_CONFIG,
    ...options,
  };

  const [state, setState] = useState<TrackingState>({
    sessionId: null,
    visitorId: null,
    websiteId: config.websiteId,
    isInitialized: false,
    detectedPersonaId: null,
    personaConfidence: null,
    pendingEvents: [],
    lastSyncTimestamp: null,
  });

  const pendingEventsRef = useRef<TrackingEvent[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollDepthRef = useRef<number>(0);
  const sectionTimersRef = useRef<Map<string, number>>(new Map());

  /**
   * Create a base event object
   */
  const createBaseEvent = useCallback((): Omit<TrackingEvent, 'type'> => {
    return {
      timestamp: new Date().toISOString(),
      sessionId: state.sessionId || '',
      visitorId: state.visitorId || '',
      websiteId: config.websiteId,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    };
  }, [state.sessionId, state.visitorId, config.websiteId]);

  /**
   * Add event to pending queue
   */
  const addEvent = useCallback((event: TrackingEvent) => {
    pendingEventsRef.current.push(event);
    setState((prev) => ({
      ...prev,
      pendingEvents: [...pendingEventsRef.current],
    }));

    if (config.enableDebugMode) {
      console.log('[Tracking] Event:', event.type, event);
    }

    // Schedule batch send if we have enough events
    if (pendingEventsRef.current.length >= config.batchSize) {
      flush();
    }
  }, [config.batchSize, config.enableDebugMode]);

  /**
   * Flush pending events to server
   */
  const flush = useCallback(async () => {
    if (pendingEventsRef.current.length === 0) return;
    if (!state.sessionId || !state.visitorId) return;

    const eventsToSend = [...pendingEventsRef.current];
    pendingEventsRef.current = [];
    setState((prev) => ({ ...prev, pendingEvents: [] }));

    try {
      const response = await fetch('/api/tracking/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          visitorId: state.visitorId,
          websiteId: config.websiteId,
          events: eventsToSend,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send events');
      }

      const result = await response.json();

      setState((prev) => ({
        ...prev,
        lastSyncTimestamp: new Date().toISOString(),
      }));

      // Handle detection result if included
      if (result.detectionTriggered && result.detectedPersonaId) {
        setState((prev) => ({
          ...prev,
          detectedPersonaId: result.detectedPersonaId,
          personaConfidence: result.personaConfidence,
        }));

        options.onPersonaDetected?.(result.detectedPersonaId, result.personaConfidence);
      }

      if (config.enableDebugMode) {
        console.log('[Tracking] Flushed', eventsToSend.length, 'events');
      }
    } catch (error) {
      // Re-add events to queue on failure
      pendingEventsRef.current = [...eventsToSend, ...pendingEventsRef.current];
      setState((prev) => ({
        ...prev,
        pendingEvents: pendingEventsRef.current,
      }));

      console.error('[Tracking] Flush error:', error);
      options.onError?.('Failed to send tracking events');
    }
  }, [state.sessionId, state.visitorId, config.websiteId, config.enableDebugMode, options]);

  /**
   * Initialize session
   */
  const initializeSession = useCallback(async () => {
    if (!config.websiteId) {
      console.warn('[Tracking] No websiteId provided');
      return;
    }

    const visitorId = getOrCreateVisitorId();
    const deviceType = detectDeviceType();
    const { browser, os } = getBrowserInfo();
    const utmParams = getUtmParams();

    try {
      const response = await fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: config.websiteId,
          visitorId,
          referrerUrl: typeof document !== 'undefined' ? document.referrer : undefined,
          utmSource: utmParams.source,
          utmMedium: utmParams.medium,
          utmCampaign: utmParams.campaign,
          deviceType,
          browser,
          os,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize session');
      }

      const result = await response.json();

      setState((prev) => ({
        ...prev,
        sessionId: result.data.sessionId,
        visitorId: result.data.visitorId,
        isInitialized: true,
        detectedPersonaId: result.data.existingPersonaId || null,
        personaConfidence: result.data.existingConfidence || null,
      }));

      // Track initial page view
      const pageViewEvent: PageViewEvent = {
        type: 'page_view',
        timestamp: new Date().toISOString(),
        sessionId: result.data.sessionId,
        visitorId: result.data.visitorId,
        websiteId: config.websiteId,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        pageTitle: typeof document !== 'undefined' ? document.title : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      };

      pendingEventsRef.current.push(pageViewEvent);

      if (config.enableDebugMode) {
        console.log('[Tracking] Session initialized:', result.data.sessionId);
      }
    } catch (error) {
      console.error('[Tracking] Session init error:', error);
      options.onError?.('Failed to initialize tracking session');
    }
  }, [config.websiteId, config.enableDebugMode, options]);

  /**
   * Track click event
   */
  const trackClick = useCallback(
    (elementId: string, elementType: string, sectionId?: string) => {
      if (!state.isInitialized) return;

      const event: ClickTrackingEvent = {
        ...createBaseEvent(),
        type: 'click',
        elementId,
        elementType,
        sectionId,
      } as ClickTrackingEvent;

      addEvent(event);
    },
    [state.isInitialized, createBaseEvent, addEvent]
  );

  /**
   * Track scroll event (debounced)
   */
  const trackScroll = useCallback(
    (scrollDepth: number) => {
      if (!state.isInitialized) return;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Only track if scroll depth increased significantly
      if (scrollDepth <= lastScrollDepthRef.current + 5) return;

      scrollTimeoutRef.current = setTimeout(() => {
        const event: ScrollTrackingEvent = {
          ...createBaseEvent(),
          type: 'scroll',
          scrollDepth,
          viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
          documentHeight: typeof document !== 'undefined' ? document.documentElement.scrollHeight : 0,
        } as ScrollTrackingEvent;

        addEvent(event);
        lastScrollDepthRef.current = scrollDepth;
      }, config.scrollDebounceMs);
    },
    [state.isInitialized, createBaseEvent, addEvent, config.scrollDebounceMs]
  );

  /**
   * Track section enter
   */
  const trackSectionEnter = useCallback(
    (sectionId: string, sectionName?: string) => {
      if (!state.isInitialized) return;

      // Start timer for this section
      sectionTimersRef.current.set(sectionId, Date.now());

      const event: SectionEvent = {
        ...createBaseEvent(),
        type: 'section_enter',
        sectionId,
        sectionName,
      } as SectionEvent;

      addEvent(event);
    },
    [state.isInitialized, createBaseEvent, addEvent]
  );

  /**
   * Track section exit
   */
  const trackSectionExit = useCallback(
    (sectionId: string, visibleTime?: number) => {
      if (!state.isInitialized) return;

      // Calculate time spent if not provided
      let timeSpent = visibleTime;
      const startTime = sectionTimersRef.current.get(sectionId);
      if (!timeSpent && startTime) {
        timeSpent = Math.round((Date.now() - startTime) / 1000);
        sectionTimersRef.current.delete(sectionId);
      }

      const event: SectionEvent = {
        ...createBaseEvent(),
        type: 'section_exit',
        sectionId,
        visibleTime: timeSpent,
      } as SectionEvent;

      addEvent(event);
    },
    [state.isInitialized, createBaseEvent, addEvent]
  );

  /**
   * Track form start
   */
  const trackFormStart = useCallback(
    (formId: string, formName?: string) => {
      if (!state.isInitialized) return;

      const event = {
        ...createBaseEvent(),
        type: 'form_start',
        formId,
        formName,
      };

      addEvent(event as TrackingEvent);
    },
    [state.isInitialized, createBaseEvent, addEvent]
  );

  /**
   * Track form field focus
   */
  const trackFormFieldFocus = useCallback(
    (formId: string, fieldName: string) => {
      if (!state.isInitialized) return;

      const event = {
        ...createBaseEvent(),
        type: 'form_field_focus',
        formId,
        fieldName,
      };

      addEvent(event as TrackingEvent);
    },
    [state.isInitialized, createBaseEvent, addEvent]
  );

  /**
   * Track form submit
   */
  const trackFormSubmit = useCallback(
    (formId: string, success: boolean) => {
      if (!state.isInitialized) return;

      const event = {
        ...createBaseEvent(),
        type: 'form_submit',
        formId,
        success,
      };

      addEvent(event as TrackingEvent);
    },
    [state.isInitialized, createBaseEvent, addEvent]
  );

  /**
   * Track search query
   */
  const trackSearch = useCallback(
    (query: string, resultsCount?: number) => {
      if (!state.isInitialized) return;

      const event = {
        ...createBaseEvent(),
        type: 'search',
        query,
        resultsCount,
      };

      addEvent(event as TrackingEvent);
    },
    [state.isInitialized, createBaseEvent, addEvent]
  );

  /**
   * Trigger persona detection manually
   */
  const triggerDetection = useCallback(async () => {
    if (!state.sessionId || !state.visitorId) return;

    try {
      const response = await fetch('/api/tracking/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          visitorId: state.visitorId,
          websiteId: config.websiteId,
        }),
      });

      if (!response.ok) {
        throw new Error('Detection failed');
      }

      const result = await response.json();

      if (result.data?.personaId) {
        setState((prev) => ({
          ...prev,
          detectedPersonaId: result.data.personaId,
          personaConfidence: result.data.confidence,
        }));

        options.onPersonaDetected?.(result.data.personaId, result.data.confidence);
      }
    } catch (error) {
      console.error('[Tracking] Detection error:', error);
      options.onError?.('Failed to detect persona');
    }
  }, [state.sessionId, state.visitorId, config.websiteId, options]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initializeSession();

    // Set up batch interval
    batchTimeoutRef.current = setInterval(() => {
      if (pendingEventsRef.current.length > 0) {
        flush();
      }
    }, config.batchIntervalMs);

    return () => {
      // Cleanup
      if (batchTimeoutRef.current) {
        clearInterval(batchTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Flush remaining events
      if (pendingEventsRef.current.length > 0) {
        // Use sendBeacon for reliable delivery on unmount
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon(
            '/api/tracking/events',
            JSON.stringify({
              sessionId: state.sessionId,
              visitorId: state.visitorId,
              websiteId: config.websiteId,
              events: pendingEventsRef.current,
              timestamp: new Date().toISOString(),
            })
          );
        }
      }
    };
  }, []);

  /**
   * Track page navigation
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      if (!state.isInitialized) return;

      const event: PageViewEvent = {
        ...createBaseEvent(),
        type: 'page_view',
        pageUrl: window.location.href,
        pageTitle: document.title,
      } as PageViewEvent;

      addEvent(event);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [state.isInitialized, createBaseEvent, addEvent]);

  return {
    state,
    isInitialized: state.isInitialized,
    detectedPersonaId: state.detectedPersonaId,
    personaConfidence: state.personaConfidence,
    trackClick,
    trackScroll,
    trackSectionEnter,
    trackSectionExit,
    trackFormStart,
    trackFormFieldFocus,
    trackFormSubmit,
    trackSearch,
    triggerDetection,
    flush,
  };
}
