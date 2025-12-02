'use client';

/**
 * Adaptive Content Components
 * Phase 4.4: Dynamic UI Generation Based on User Interactions
 *
 * Components that adapt content based on detected persona and user interactions.
 */

import React, { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  usePersonaContextOptional,
  useAdaptedContent,
  type ContentVariant,
} from '@/lib/interactive/persona';

// ============================================================================
// TYPES
// ============================================================================

export interface AdaptiveTextProps {
  /** Base text (default) */
  children: string;
  /** Persona-specific variants */
  variants?: {
    developer?: string;
    'business-owner'?: string;
    enterprise?: string;
    student?: string;
    [key: string]: string | undefined;
  };
  /** Whether to animate the change */
  animate?: boolean;
  /** CSS class name */
  className?: string;
  /** HTML tag to use */
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
}

export interface AdaptiveSectionProps {
  /** Section ID for tracking */
  sectionId: string;
  /** Children to render */
  children: ReactNode;
  /** Base content for the section */
  baseContent?: Record<string, unknown>;
  /** Content variants for different personas */
  variants?: ContentVariant[];
  /** Callback when content changes */
  onContentChange?: (content: Record<string, unknown>) => void;
  /** CSS class name */
  className?: string;
}

export interface PersonaGatedProps {
  /** Target persona IDs that can see this content */
  personas: string[];
  /** Children to render when persona matches */
  children: ReactNode;
  /** Fallback to render when persona doesn't match */
  fallback?: ReactNode;
  /** Show to all if no persona is detected */
  showIfUnknown?: boolean;
}

export interface PersonaBannerProps {
  /** Custom greeting */
  greeting?: string;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Position */
  position?: 'top' | 'inline';
  /** Primary color */
  primaryColor?: string;
}

// ============================================================================
// ADAPTIVE TEXT COMPONENT
// ============================================================================

/**
 * Text that adapts based on detected persona
 */
export function AdaptiveText({
  children,
  variants = {},
  animate = true,
  className = '',
  as: Component = 'span',
}: AdaptiveTextProps) {
  const persona = usePersonaContextOptional();
  const currentPersona = persona?.activePersonaId;

  // Get the appropriate text variant
  const text = (currentPersona && variants[currentPersona]) || children;

  if (animate) {
    return (
      <AnimatePresence mode="wait">
        <motion.span
          key={text}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className={className}
        >
          {Component === 'span' ? text : <Component>{text}</Component>}
        </motion.span>
      </AnimatePresence>
    );
  }

  return <Component className={className}>{text}</Component>;
}

// ============================================================================
// ADAPTIVE SECTION COMPONENT
// ============================================================================

/**
 * Section wrapper that tracks views and adapts content
 */
export function AdaptiveSection({
  sectionId,
  children,
  baseContent = {},
  variants = [],
  onContentChange,
  className = '',
}: AdaptiveSectionProps) {
  const persona = usePersonaContextOptional();
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasTrackedView = useRef(false);

  // Get adapted content
  const adaptedContent = useAdaptedContent(baseContent, variants);

  // Track section view
  useEffect(() => {
    if (!sectionRef.current || !persona || hasTrackedView.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedView.current) {
            hasTrackedView.current = true;
            persona.recordInteraction({
              type: 'section_view',
              target: sectionId,
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, [sectionId, persona]);

  // Notify parent of content changes
  useEffect(() => {
    if (onContentChange && adaptedContent !== baseContent) {
      onContentChange(adaptedContent);
    }
  }, [adaptedContent, baseContent, onContentChange]);

  return (
    <div ref={sectionRef} className={className} data-section-id={sectionId}>
      {children}
    </div>
  );
}

// ============================================================================
// PERSONA GATED COMPONENT
// ============================================================================

/**
 * Only shows content to specific personas
 */
export function PersonaGated({
  personas,
  children,
  fallback = null,
  showIfUnknown = false,
}: PersonaGatedProps) {
  const persona = usePersonaContextOptional();

  // No persona context - show based on showIfUnknown
  if (!persona) {
    return <>{showIfUnknown ? children : fallback}</>;
  }

  // No persona detected - show based on showIfUnknown
  if (!persona.activePersonaId) {
    return <>{showIfUnknown ? children : fallback}</>;
  }

  // Check if current persona matches
  if (persona.matchesPersona(personas)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ============================================================================
// PERSONA BANNER COMPONENT
// ============================================================================

/**
 * Banner showing personalized greeting
 */
export function PersonaBanner({
  greeting,
  dismissible = true,
  position = 'inline',
  primaryColor = '#3B82F6',
}: PersonaBannerProps) {
  const persona = usePersonaContextOptional();
  const [dismissed, setDismissed] = React.useState(false);

  if (!persona?.activePersonaId || dismissed) {
    return null;
  }

  const displayGreeting = greeting || persona.getPersonaGreeting();

  if (position === 'top') {
    return (
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 py-2 px-4 text-white text-center text-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <span>{displayGreeting}</span>
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg p-4 mb-6"
      style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30`, borderWidth: 1 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {persona.activePersonaLabel?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-gray-700">{displayGreeting}</span>
        </div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// ADAPTIVE CTA COMPONENT
// ============================================================================

export interface AdaptiveCTAProps {
  /** Base CTA text */
  baseText: string;
  /** Base CTA href */
  baseHref?: string;
  /** Persona variants */
  variants?: {
    [personaId: string]: {
      text?: string;
      href?: string;
      emphasis?: boolean;
    };
  };
  /** Primary color */
  primaryColor?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * CTA button that adapts based on persona
 */
export function AdaptiveCTA({
  baseText,
  baseHref,
  variants = {},
  primaryColor = '#3B82F6',
  size = 'md',
  className = '',
  onClick,
}: AdaptiveCTAProps) {
  const persona = usePersonaContextOptional();
  const currentPersona = persona?.activePersonaId;

  // Get variant for current persona
  const variant = currentPersona ? variants[currentPersona] : undefined;
  const text = variant?.text || baseText;
  const href = variant?.href || baseHref;
  const emphasis = variant?.emphasis ?? false;

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const buttonContent = (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        rounded-lg font-semibold transition-all
        ${sizeClasses[size]}
        ${emphasis ? 'shadow-lg' : ''}
        ${className}
      `}
      style={{
        backgroundColor: primaryColor,
        color: 'white',
        boxShadow: emphasis ? `0 4px 14px ${primaryColor}40` : undefined,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );

  if (href) {
    return <a href={href}>{buttonContent}</a>;
  }

  return buttonContent;
}

// ============================================================================
// ADAPTIVE HIGHLIGHT COMPONENT
// ============================================================================

export interface AdaptiveHighlightProps {
  /** Content to highlight */
  children: ReactNode;
  /** Personas that should see highlight */
  forPersonas: string[];
  /** Highlight color */
  color?: string;
  /** Highlight style */
  style?: 'background' | 'border' | 'glow';
}

/**
 * Highlights content for specific personas
 */
export function AdaptiveHighlight({
  children,
  forPersonas,
  color = '#3B82F6',
  style = 'background',
}: AdaptiveHighlightProps) {
  const persona = usePersonaContextOptional();
  const shouldHighlight = persona?.matchesPersona(forPersonas) ?? false;

  if (!shouldHighlight) {
    return <>{children}</>;
  }

  const highlightStyles = {
    background: {
      backgroundColor: `${color}15`,
      padding: '2px 6px',
      borderRadius: '4px',
    },
    border: {
      borderLeft: `3px solid ${color}`,
      paddingLeft: '8px',
    },
    glow: {
      boxShadow: `0 0 8px ${color}40`,
      borderRadius: '4px',
    },
  };

  return (
    <motion.span
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      style={highlightStyles[style]}
    >
      {children}
    </motion.span>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  AdaptiveText,
  AdaptiveSection,
  PersonaGated,
  PersonaBanner,
  AdaptiveCTA,
  AdaptiveHighlight,
};
