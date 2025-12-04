/**
 * Content Transition Components
 *
 * Smooth animations for content updates:
 * - Crossfade: Old content → New content
 * - Shimmer: Gold shimmer effect on changes
 * - Pulse: Section highlight during update
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

// ============================================================================
// Crossfade Transition
// ============================================================================

interface CrossfadeProps {
  children: React.ReactNode;
  contentKey: string | number;
  duration?: number; // milliseconds
}

export function CrossfadeTransition({ children, contentKey, duration = 300 }: CrossfadeProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={contentKey}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0.5 }}
        transition={{ duration: duration / 1000 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// Shimmer Effect
// ============================================================================

interface ShimmerProps {
  isActive: boolean;
  duration?: number; // milliseconds
  color?: string;
  children: React.ReactNode;
}

export function ShimmerEffect({
  isActive,
  duration = 500,
  color = 'rgba(251, 191, 36, 0.4)', // Gold
  children,
}: ShimmerProps) {
  const [showShimmer, setShowShimmer] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowShimmer(true);
      const timer = setTimeout(() => setShowShimmer(false), duration);
      return () => clearTimeout(timer);
    }
  }, [isActive, duration]);

  return (
    <div className="relative">
      {children}

      <AnimatePresence>
        {showShimmer && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            exit={{ opacity: 0 }}
            transition={{
              duration: duration / 1000,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
            style={{ zIndex: 10 }}
          >
            <div
              className="absolute inset-0 -skew-x-12"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Pulse Outline
// ============================================================================

interface PulseOutlineProps {
  isActive: boolean;
  color?: string;
  duration?: number; // milliseconds
  children: React.ReactNode;
}

export function PulseOutline({
  isActive,
  color = 'rgb(59, 130, 246)', // Blue
  duration = 200,
  children,
}: PulseOutlineProps) {
  return (
    <div className="relative">
      {children}

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              boxShadow: `0 0 0 2px ${color}`,
              zIndex: 5,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Combined Content Update Animation
// ============================================================================

interface ContentUpdateAnimationProps {
  isUpdating: boolean;
  contentKey: string | number;
  children: React.ReactNode;
  showShimmer?: boolean;
  showPulse?: boolean;
}

export function ContentUpdateAnimation({
  isUpdating,
  contentKey,
  children,
  showShimmer = true,
  showPulse = true,
}: ContentUpdateAnimationProps) {
  const [showEffects, setShowEffects] = useState(false);

  useEffect(() => {
    if (isUpdating) {
      setShowEffects(true);
      // Hide effects after animation completes
      const timer = setTimeout(() => setShowEffects(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isUpdating]);

  return (
    <PulseOutline isActive={showPulse && showEffects}>
      <ShimmerEffect isActive={showShimmer && showEffects}>
        <CrossfadeTransition contentKey={contentKey}>
          {children}
        </CrossfadeTransition>
      </ShimmerEffect>
    </PulseOutline>
  );
}

// ============================================================================
// Hook: useContentAnimation
// ============================================================================

/**
 * Hook to manage content update animations
 *
 * Usage:
 * ```tsx
 * const { isAnimating, triggerAnimation } = useContentAnimation();
 *
 * // When content updates:
 * useEffect(() => {
 *   if (contentChanged) {
 *     triggerAnimation();
 *   }
 * }, [content]);
 *
 * <ContentUpdateAnimation isUpdating={isAnimating} contentKey={content.id}>
 *   {content}
 * </ContentUpdateAnimation>
 * ```
 */
export function useContentAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1200); // Total animation duration
  };

  return { isAnimating, triggerAnimation };
}

// ============================================================================
// Prefers Reduced Motion Check
// ============================================================================

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
