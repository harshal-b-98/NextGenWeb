'use client';

/**
 * HeroVideo Component
 *
 * A hero section with video background for maximum visual engagement.
 * Perfect for immersive brand experiences.
 */

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn, container, focusRing } from '@/lib/design-system';
import type { HeroVideoProps } from './types';

export function HeroVideo({
  headline,
  subheadline,
  description,
  primaryButton,
  secondaryButton,
  videoSrc,
  videoPoster,
  overlayOpacity = 50,
  className,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // Autoplay was prevented, which is fine
      });
    }
  }, []);

  return (
    <section
      className={cn(
        'relative overflow-hidden',
        'min-h-[500px] sm:min-h-[600px] lg:min-h-[700px]',
        'flex items-center',
        className
      )}
    >
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          src={videoSrc}
          poster={videoPoster}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover',
            'transition-opacity duration-700',
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
        {/* Poster fallback while video loads */}
        {videoPoster && !isVideoLoaded && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${videoPoster})` }}
          />
        )}
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity / 100 }}
          aria-hidden="true"
        />
      </div>

      <div className={cn(container('lg'), 'relative z-10 text-center')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl"
        >
          {/* Headline */}
          <h1
            className={cn(
              'text-4xl font-bold tracking-tight text-white',
              'sm:text-5xl lg:text-6xl xl:text-7xl',
              'leading-tight',
              'drop-shadow-lg'
            )}
          >
            {headline}
          </h1>

          {/* Subheadline */}
          {subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={cn(
                'mt-4 text-xl text-white/90',
                'sm:text-2xl',
                'max-w-2xl mx-auto',
                'drop-shadow-md'
              )}
            >
              {subheadline}
            </motion.p>
          )}

          {/* Description */}
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={cn(
                'mt-6 text-base text-white/80',
                'sm:text-lg',
                'max-w-xl mx-auto leading-relaxed',
                'drop-shadow'
              )}
            >
              {description}
            </motion.p>
          )}

          {/* CTA Buttons */}
          {(primaryButton || secondaryButton) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {primaryButton && (
                <a
                  href={primaryButton.href}
                  className={cn(
                    'inline-flex items-center justify-center',
                    'rounded-lg px-8 py-4',
                    'bg-white text-black',
                    'text-base font-semibold',
                    'shadow-xl hover:bg-white/90',
                    'transition-all duration-200',
                    focusRing('white')
                  )}
                >
                  {primaryButton.text}
                </a>
              )}
              {secondaryButton && (
                <a
                  href={secondaryButton.href}
                  className={cn(
                    'inline-flex items-center justify-center',
                    'rounded-lg px-8 py-4',
                    'bg-white/10 text-white backdrop-blur-sm',
                    'text-base font-semibold',
                    'border border-white/30',
                    'hover:bg-white/20 hover:border-white/50',
                    'transition-all duration-200',
                    focusRing('white')
                  )}
                >
                  {secondaryButton.text}
                </a>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/50 flex justify-center pt-2"
        >
          <div className="w-1.5 h-3 bg-white/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

HeroVideo.displayName = 'HeroVideo';
