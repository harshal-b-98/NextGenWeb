/**
 * Thank You Page Component
 * Phase 4.4: Conversion & Lead Tools
 *
 * Displays a thank you page after form submission with
 * personalization and dynamic content support.
 */

'use client';

import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type {
  ThankYouPageConfig,
  ThankYouRecommendation,
  LeadCapture,
} from '@/lib/leads/types';

/**
 * Props for ThankYouPage component
 */
export interface ThankYouPageProps {
  /** Thank you page configuration */
  config: ThankYouPageConfig;

  /** Lead data for personalization */
  lead?: Partial<LeadCapture>;

  /** Brand colors */
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };

  /** Custom class name */
  className?: string;
}

/**
 * Thank You Page Component
 */
export function ThankYouPage({
  config,
  lead,
  brandColors,
  className = '',
}: ThankYouPageProps) {
  const styling = config.styling || {};
  const accentColor = styling.accentColor || brandColors?.primary || '#3B82F6';

  // Personalize content
  const personalizedContent = useMemo(() => {
    let headline = config.headline;
    let message = config.message;
    let recommendations = config.dynamicContent?.recommendations || [];

    // Check for persona-specific content
    if (
      lead?.personaId &&
      config.dynamicContent?.personaSpecificContent?.[lead.personaId]
    ) {
      const personaContent =
        config.dynamicContent.personaSpecificContent[lead.personaId];
      if (personaContent.headline) headline = personaContent.headline;
      if (personaContent.message) message = personaContent.message;
      if (personaContent.recommendations?.length) {
        recommendations = personaContent.recommendations;
      }
    }

    // Personalize greeting
    if (config.dynamicContent?.personalizedGreeting && lead?.name) {
      const firstName = lead.name.split(' ')[0];
      if (headline.toLowerCase().includes('thank you')) {
        headline = headline.replace(/thank you/i, `Thank you, ${firstName}`);
      } else if (headline.toLowerCase().includes('thanks')) {
        headline = headline.replace(/thanks/i, `Thanks, ${firstName}`);
      }
    }

    return { headline, message, recommendations };
  }, [config, lead]);

  // Confetti effect
  useEffect(() => {
    if (styling.showConfetti) {
      triggerConfetti(accentColor);
    }
  }, [styling.showConfetti, accentColor]);

  // Layout classes
  const layoutClasses = useMemo(() => {
    switch (styling.layout) {
      case 'split':
        return 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center';
      case 'full-width':
        return 'w-full';
      default:
        return 'max-w-2xl mx-auto text-center';
    }
  }, [styling.layout]);

  return (
    <div
      className={`thank-you-page min-h-screen flex items-center justify-center p-8 ${className}`}
      style={{ backgroundColor: styling.backgroundColor }}
    >
      <motion.div
        initial={styling.animateEntrance ? { opacity: 0, y: 30 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={layoutClasses}
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: accentColor }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-gray-900"
          >
            {personalizedContent.headline}
          </motion.h1>

          {config.subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600"
            >
              {config.subheadline}
            </motion.p>
          )}

          {personalizedContent.message && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-gray-500 max-w-lg mx-auto"
            >
              {personalizedContent.message}
            </motion.p>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          >
            {config.ctaButton && (
              <Link
                href={config.ctaButton.url}
                target={config.ctaButton.target}
                className={`
                  px-8 py-3 rounded-lg font-medium transition-colors
                  ${getButtonClasses(config.ctaButton.variant, accentColor)}
                `}
              >
                {config.ctaButton.text}
              </Link>
            )}

            {config.secondaryCTA && (
              <Link
                href={config.secondaryCTA.url}
                target={config.secondaryCTA.target}
                className={`
                  px-8 py-3 rounded-lg font-medium transition-colors
                  ${getButtonClasses(config.secondaryCTA.variant, accentColor)}
                `}
              >
                {config.secondaryCTA.text}
              </Link>
            )}
          </motion.div>

          {/* Social Share */}
          {config.showSocialShare && config.socialShareConfig && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center gap-4 mt-8"
            >
              {config.socialShareConfig.platforms.map((platform) => (
                <SocialShareButton
                  key={platform}
                  platform={platform}
                  url={config.socialShareConfig!.shareUrl || window.location.href}
                  text={config.socialShareConfig!.shareText || ''}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Recommendations */}
        {config.dynamicContent?.showRecommendations &&
          personalizedContent.recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-16"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Recommended for you
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {personalizedContent.recommendations.map((rec, index) => (
                  <RecommendationCard
                    key={index}
                    recommendation={rec}
                    accentColor={accentColor}
                  />
                ))}
              </div>
            </motion.div>
          )}
      </motion.div>
    </div>
  );
}

/**
 * Recommendation Card Component
 */
interface RecommendationCardProps {
  recommendation: ThankYouRecommendation;
  accentColor: string;
}

function RecommendationCard({
  recommendation,
  accentColor,
}: RecommendationCardProps) {
  return (
    <Link
      href={recommendation.url}
      className="block p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow group"
    >
      {recommendation.image && (
        <img
          src={recommendation.image}
          alt={recommendation.title}
          className="w-full h-32 object-cover rounded-lg mb-4"
        />
      )}
      <h4
        className="font-semibold text-gray-900 group-hover:text-opacity-80 transition-colors"
        style={{ color: accentColor }}
      >
        {recommendation.title}
      </h4>
      {recommendation.description && (
        <p className="text-sm text-gray-600 mt-2">{recommendation.description}</p>
      )}
    </Link>
  );
}

/**
 * Social Share Button Component
 */
interface SocialShareButtonProps {
  platform: 'twitter' | 'linkedin' | 'facebook';
  url: string;
  text: string;
}

function SocialShareButton({ platform, url, text }: SocialShareButtonProps) {
  const handleShare = () => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const icons = {
    twitter: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    facebook: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  };

  return (
    <button
      onClick={handleShare}
      className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      aria-label={`Share on ${platform}`}
    >
      {icons[platform]}
    </button>
  );
}

/**
 * Get button variant classes
 */
function getButtonClasses(variant?: string, accentColor?: string): string {
  switch (variant) {
    case 'secondary':
      return 'bg-gray-100 text-gray-900 hover:bg-gray-200';
    case 'outline':
      return `border-2 bg-transparent hover:bg-opacity-10`
        + ` border-[${accentColor}] text-[${accentColor}]`;
    default:
      return `text-white hover:opacity-90`
        + ` bg-[${accentColor || '#3B82F6'}]`;
  }
}

/**
 * Trigger confetti animation
 */
function triggerConfetti(accentColor: string) {
  // Simple confetti implementation
  const colors = [accentColor, '#ff6b6b', '#4ecdc4', '#f9ca24', '#6c5ce7'];
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden';
  document.body.appendChild(container);

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 5;
    const left = Math.random() * 100;
    const delay = Math.random() * 500;
    const duration = Math.random() * 2000 + 2000;

    confetti.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size * 1.5}px;
      background: ${color};
      left: ${left}%;
      top: -20px;
      animation: fall ${duration}ms ease-out ${delay}ms forwards;
    `;

    container.appendChild(confetti);
  }

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Cleanup after animation
  setTimeout(() => {
    container.remove();
    style.remove();
  }, 4000);
}

export default ThankYouPage;
