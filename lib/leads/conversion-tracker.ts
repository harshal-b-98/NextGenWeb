/**
 * Conversion Tracker (Client-Side)
 * Phase 4.4: Conversion & Lead Tools
 *
 * Client-side utility for tracking conversions with automatic
 * detection of page views, clicks, scroll depth, and time on page.
 */

import type { ConversionGoal, ConversionGoalType } from './types';

/**
 * Conversion tracker configuration
 */
export interface ConversionTrackerConfig {
  websiteId: string;
  sessionId: string;
  visitorId?: string;
  pageId?: string;
  personaId?: string;
  goals: ConversionGoal[];
  apiEndpoint?: string;
  debug?: boolean;
}

/**
 * Tracked metrics state
 */
interface TrackedMetrics {
  scrollDepth: number;
  timeOnPage: number;
  pageViews: Set<string>;
  clickedElements: Set<string>;
  triggeredGoals: Set<string>;
}

/**
 * Conversion Tracker
 *
 * Tracks user interactions and automatically triggers conversion
 * events when goals are met.
 */
export class ConversionTracker {
  private config: ConversionTrackerConfig;
  private metrics: TrackedMetrics;
  private timeInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  constructor(config: ConversionTrackerConfig) {
    this.config = {
      apiEndpoint: '/api/conversions',
      debug: false,
      ...config,
    };

    this.metrics = {
      scrollDepth: 0,
      timeOnPage: 0,
      pageViews: new Set(),
      clickedElements: new Set(),
      triggeredGoals: new Set(),
    };
  }

  /**
   * Initialize the tracker
   */
  initialize(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    this.log('Initializing conversion tracker');

    // Track current page view
    this.trackPageView(window.location.pathname);

    // Set up event listeners
    this.setupScrollTracking();
    this.setupClickTracking();
    this.setupTimeTracking();

    this.initialized = true;
  }

  /**
   * Cleanup the tracker
   */
  cleanup(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll);
      window.removeEventListener('click', this.handleClick);
    }

    this.initialized = false;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ConversionTrackerConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Track a page view
   */
  trackPageView(url: string): void {
    if (this.metrics.pageViews.has(url)) {
      return;
    }

    this.metrics.pageViews.add(url);
    this.log('Page view:', url);

    // Check page view goals
    this.checkGoals('page_view', { url });
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, properties?: Record<string, unknown>): void {
    this.log('Custom event:', eventName, properties);
    this.checkGoals('custom_event', { eventName, eventProperties: properties });
  }

  /**
   * Track form submission
   */
  trackFormSubmission(formId: string): void {
    this.log('Form submission:', formId);
    this.checkGoals('form_submission', { formId });
  }

  /**
   * Set up scroll tracking
   */
  private setupScrollTracking(): void {
    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
  }

  /**
   * Handle scroll event
   */
  private handleScroll = (): void => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    if (scrollPercent > this.metrics.scrollDepth) {
      this.metrics.scrollDepth = scrollPercent;
      this.log('Scroll depth:', scrollPercent);
      this.checkGoals('scroll_depth', { scrollPercentage: scrollPercent });
    }
  };

  /**
   * Set up click tracking
   */
  private setupClickTracking(): void {
    this.handleClick = this.handleClick.bind(this);
    window.addEventListener('click', this.handleClick);
  }

  /**
   * Handle click event
   */
  private handleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Get element identifier
    const selector = this.getElementSelector(target);
    const text = target.textContent?.trim().substring(0, 100);

    if (!this.metrics.clickedElements.has(selector)) {
      this.metrics.clickedElements.add(selector);
      this.log('Click:', selector, text);
      this.checkGoals('click', { elementSelector: selector, elementText: text });
    }
  };

  /**
   * Set up time on page tracking
   */
  private setupTimeTracking(): void {
    this.timeInterval = setInterval(() => {
      this.metrics.timeOnPage += 1;

      // Check time goals every 5 seconds
      if (this.metrics.timeOnPage % 5 === 0) {
        this.checkGoals('time_on_page', { timeOnPage: this.metrics.timeOnPage });
      }
    }, 1000);
  }

  /**
   * Check goals for a specific trigger type
   */
  private checkGoals(
    type: ConversionGoalType,
    data: Record<string, unknown>
  ): void {
    const relevantGoals = this.config.goals.filter(
      (g) => g.type === type && g.isActive && !this.metrics.triggeredGoals.has(g.id)
    );

    for (const goal of relevantGoals) {
      if (this.checkGoalCondition(goal, data)) {
        this.triggerGoal(goal);
      }
    }
  }

  /**
   * Check if a goal condition is met
   */
  private checkGoalCondition(
    goal: ConversionGoal,
    data: Record<string, unknown>
  ): boolean {
    const config = goal.config;

    switch (goal.type) {
      case 'page_view':
        if (!config.targetUrl || !data.url) return false;
        switch (config.urlMatchType) {
          case 'exact':
            return data.url === config.targetUrl;
          case 'contains':
            return String(data.url).includes(config.targetUrl);
          case 'regex':
            return new RegExp(config.targetUrl).test(String(data.url));
          default:
            return false;
        }

      case 'click':
        if (config.selector && data.elementSelector) {
          // Check if selector matches
          if (String(data.elementSelector).includes(config.selector)) {
            return true;
          }
        }
        if (config.elementText && data.elementText) {
          return String(data.elementText)
            .toLowerCase()
            .includes(config.elementText.toLowerCase());
        }
        return false;

      case 'scroll_depth':
        if (!config.scrollPercentage) return false;
        return Number(data.scrollPercentage) >= config.scrollPercentage;

      case 'time_on_page':
        if (!config.timeSeconds) return false;
        return Number(data.timeOnPage) >= config.timeSeconds;

      case 'custom_event':
        if (!config.eventName) return false;
        if (data.eventName !== config.eventName) return false;

        // Check event properties if configured
        if (config.eventProperties && data.eventProperties) {
          const props = data.eventProperties as Record<string, unknown>;
          for (const [key, value] of Object.entries(config.eventProperties)) {
            if (props[key] !== value) return false;
          }
        }
        return true;

      case 'form_submission':
        return data.formId === config.formId;

      default:
        return false;
    }
  }

  /**
   * Trigger a conversion goal
   */
  private async triggerGoal(goal: ConversionGoal): Promise<void> {
    // Mark as triggered to prevent duplicates
    this.metrics.triggeredGoals.add(goal.id);
    this.log('Goal triggered:', goal.name, goal.id);

    try {
      const response = await fetch(this.config.apiEndpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goal.id,
          websiteId: this.config.websiteId,
          sessionId: this.config.sessionId,
          visitorId: this.config.visitorId,
          pageId: this.config.pageId,
          personaId: this.config.personaId,
          value: goal.value,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      this.log('Conversion tracked:', result.eventId);
    } catch (error) {
      console.error('Failed to track conversion:', error);
      // Remove from triggered so it can be retried
      this.metrics.triggeredGoals.delete(goal.id);
    }
  }

  /**
   * Get CSS selector for an element
   */
  private getElementSelector(element: HTMLElement): string {
    const parts: string[] = [];

    // ID
    if (element.id) {
      return `#${element.id}`;
    }

    // Build selector path
    let current: HTMLElement | null = element;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      // Add classes
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ').filter(Boolean).slice(0, 2);
        if (classes.length) {
          selector += `.${classes.join('.')}`;
        }
      }

      parts.unshift(selector);
      current = current.parentElement;

      // Limit depth
      if (parts.length >= 3) break;
    }

    return parts.join(' > ');
  }

  /**
   * Log debug message
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[ConversionTracker]', ...args);
    }
  }
}

/**
 * Create conversion tracker instance
 */
export function createConversionTracker(
  config: ConversionTrackerConfig
): ConversionTracker {
  return new ConversionTracker(config);
}
