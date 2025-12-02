'use client';

/**
 * Conversational CTA Component
 * Phase 6: Conversational Marketing Platform
 *
 * A wrapper component that intercepts CTA clicks and triggers
 * the conversational marketing flow instead of traditional navigation.
 *
 * Features:
 * - Intercepts click events on CTAs
 * - Captures CTA context (text, position, section)
 * - Triggers inline content generation or chat
 * - Supports loading states and animations
 * - Falls back to original action if needed
 */

import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode,
  type MouseEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, MessageSquare, Sparkles } from 'lucide-react';
import {
  useChatContext,
  type CTASource,
  type ConversationalRenderMode,
  type GeneratedSection,
} from '@/lib/interactive/chat';

// ============================================================================
// TYPES
// ============================================================================

export type CTAInterceptMode =
  | 'always'          // Always intercept and trigger conversation
  | 'primary-only'    // Only intercept primary CTAs
  | 'smart'           // Decide based on knowledge depth (requires API check)
  | 'never';          // Never intercept, use original behavior

export interface ConversationalCTAProps {
  /** The CTA content (button, link, etc.) */
  children: ReactNode;
  /** Unique identifier for this CTA */
  ctaId: string;
  /** Type of CTA for categorization */
  ctaType?: CTASource['ctaType'];
  /** Section ID where this CTA is located */
  sectionId?: string;
  /** Topic/context for the CTA (used in AI prompt) */
  topic?: string;
  /** Original href/action (for fallback) */
  href?: string;
  /** How to intercept clicks */
  interceptMode?: CTAInterceptMode;
  /** Preferred render mode for responses */
  renderMode?: ConversationalRenderMode;
  /** Custom message to send (overrides auto-generated) */
  customMessage?: string;
  /** Callback when content is generated */
  onContentGenerated?: (section: GeneratedSection) => void;
  /** Callback when generation starts */
  onGenerationStart?: () => void;
  /** Callback when generation fails */
  onGenerationError?: (error: Error) => void;
  /** Whether to show loading indicator */
  showLoadingIndicator?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Disable the conversational behavior */
  disabled?: boolean;
}

// ============================================================================
// CONVERSATIONAL CTA COMPONENT
// ============================================================================

export function ConversationalCTA({
  children,
  ctaId,
  ctaType = 'button',
  sectionId,
  topic,
  href,
  interceptMode = 'always',
  renderMode = 'inline-section',
  customMessage,
  onContentGenerated,
  onGenerationStart,
  onGenerationError,
  showLoadingIndicator = true,
  loadingComponent,
  className = '',
  disabled = false,
}: ConversationalCTAProps) {
  const chatContext = useChatContext();
  const ctaRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Extract text content from children for CTA context
  const extractTextContent = useCallback((): string => {
    if (typeof children === 'string') return children;

    // Try to extract text from React elements
    const extractText = (node: ReactNode): string => {
      if (typeof node === 'string') return node;
      if (typeof node === 'number') return String(node);
      if (Array.isArray(node)) return node.map(extractText).join(' ');
      if (React.isValidElement(node)) {
        // Type assertion for accessing props.children
        const props = node.props as { children?: ReactNode };
        const childrenProp = props.children;
        return childrenProp ? extractText(childrenProp) : '';
      }
      return '';
    };

    return extractText(children).trim() || 'Learn more';
  }, [children]);

  // Get CTA position for scroll targeting
  const getPosition = useCallback(() => {
    if (!ctaRef.current) return undefined;
    const rect = ctaRef.current.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  // Build CTA source object
  const buildCTASource = useCallback((): CTASource => {
    return {
      ctaId,
      ctaType,
      ctaText: extractTextContent(),
      sectionId,
      position: getPosition(),
      originalAction: href,
      metadata: topic ? { topic } : undefined,
    };
  }, [ctaId, ctaType, extractTextContent, sectionId, getPosition, href, topic]);

  // Register section callback
  useEffect(() => {
    if (!onContentGenerated) return;

    const unregister = chatContext.registerSectionCallback(ctaId, (section) => {
      setIsLoading(false);
      setHasGenerated(true);
      onContentGenerated(section);
    });

    return unregister;
  }, [ctaId, chatContext, onContentGenerated]);

  // Handle click
  const handleClick = useCallback(
    (event: MouseEvent) => {
      // Don't intercept if disabled
      if (disabled) return;

      // Check intercept mode
      if (interceptMode === 'never') return;

      // For primary-only mode, check if this is a primary CTA
      if (interceptMode === 'primary-only' && ctaType !== 'hero-cta') {
        return;
      }

      // Prevent default navigation
      event.preventDefault();
      event.stopPropagation();

      // Build CTA source
      const ctaSource = buildCTASource();

      // Start loading
      setIsLoading(true);
      onGenerationStart?.();

      // Trigger conversational flow
      try {
        chatContext.triggerFromCTA(ctaSource, {
          message: customMessage,
          renderMode,
          autoSend: true,
        });
      } catch (error) {
        setIsLoading(false);
        onGenerationError?.(error instanceof Error ? error : new Error('Unknown error'));
      }
    },
    [
      disabled,
      interceptMode,
      ctaType,
      buildCTASource,
      onGenerationStart,
      chatContext,
      customMessage,
      renderMode,
      onGenerationError,
    ]
  );

  // Reset loading when inline generation completes
  useEffect(() => {
    if (!chatContext.isGeneratingInline && isLoading) {
      // Give a small delay for the content to appear
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [chatContext.isGeneratingInline, isLoading]);

  // Default loading indicator
  const defaultLoadingIndicator = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-lg">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span className="text-sm text-gray-700">Generating...</span>
      </div>
    </motion.div>
  );

  return (
    <div
      ref={ctaRef}
      className={`relative inline-block ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as unknown as MouseEvent);
        }
      }}
      data-cta-id={ctaId}
      data-cta-type={ctaType}
      data-section-id={sectionId}
      aria-busy={isLoading}
    >
      {/* Original CTA content */}
      {children}

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && showLoadingIndicator && (
          loadingComponent || defaultLoadingIndicator
        )}
      </AnimatePresence>

      {/* Generated content indicator */}
      {hasGenerated && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-green-600"
        >
          <Sparkles className="w-3 h-3" />
          <span>Content generated</span>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// CONVERSATIONAL BUTTON COMPONENT
// ============================================================================

export interface ConversationalButtonProps extends Omit<ConversationalCTAProps, 'children' | 'ctaType'> {
  /** Button text */
  text: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Icon to display */
  icon?: ReactNode;
  /** Icon position */
  iconPosition?: 'left' | 'right';
}

export function ConversationalButton({
  text,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  ...ctaProps
}: ConversationalButtonProps) {
  // Variant styles
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-blue-600 hover:bg-blue-50',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const defaultIcon = <MessageSquare className="w-4 h-4" />;
  const displayIcon = icon !== undefined ? icon : defaultIcon;

  return (
    <ConversationalCTA {...ctaProps} ctaType="button">
      <button
        type="button"
        className={`
          inline-flex items-center gap-2 rounded-lg font-medium
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${variantStyles[variant]}
          ${sizeStyles[size]}
        `}
      >
        {iconPosition === 'left' && displayIcon}
        <span>{text}</span>
        {iconPosition === 'right' && displayIcon}
      </button>
    </ConversationalCTA>
  );
}

// ============================================================================
// CONVERSATIONAL LINK COMPONENT
// ============================================================================

export interface ConversationalLinkProps extends Omit<ConversationalCTAProps, 'children' | 'ctaType'> {
  /** Link text */
  text: string;
  /** Show arrow indicator */
  showArrow?: boolean;
}

export function ConversationalLink({
  text,
  showArrow = true,
  ...ctaProps
}: ConversationalLinkProps) {
  return (
    <ConversationalCTA {...ctaProps} ctaType="link">
      <span className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors">
        <span>{text}</span>
        {showArrow && (
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </span>
    </ConversationalCTA>
  );
}

// ============================================================================
// HOOK: useConversationalCTA
// ============================================================================

/**
 * Hook to make any element a conversational CTA
 */
export function useConversationalCTA(options: {
  ctaId: string;
  ctaType?: CTASource['ctaType'];
  sectionId?: string;
  topic?: string;
  href?: string;
  renderMode?: ConversationalRenderMode;
  customMessage?: string;
  onContentGenerated?: (section: GeneratedSection) => void;
}) {
  const chatContext = useChatContext();
  const ref = useRef<HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Register callback
  useEffect(() => {
    if (!options.onContentGenerated) return;

    return chatContext.registerSectionCallback(options.ctaId, (section) => {
      setIsLoading(false);
      options.onContentGenerated?.(section);
    });
  }, [options.ctaId, options.onContentGenerated, chatContext]);

  const triggerConversation = useCallback(() => {
    const element = ref.current;
    const rect = element?.getBoundingClientRect();

    const ctaSource: CTASource = {
      ctaId: options.ctaId,
      ctaType: options.ctaType || 'button',
      ctaText: element?.textContent || 'Learn more',
      sectionId: options.sectionId,
      position: rect
        ? {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
          }
        : undefined,
      originalAction: options.href,
      metadata: options.topic ? { topic: options.topic } : undefined,
    };

    setIsLoading(true);
    chatContext.triggerFromCTA(ctaSource, {
      message: options.customMessage,
      renderMode: options.renderMode,
      autoSend: true,
    });
  }, [chatContext, options]);

  return {
    ref,
    isLoading,
    triggerConversation,
    props: {
      onClick: (e: MouseEvent) => {
        e.preventDefault();
        triggerConversation();
      },
      'data-cta-id': options.ctaId,
      'aria-busy': isLoading,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ConversationalCTA;
