'use client';

/**
 * CTANewsletter Component
 *
 * A newsletter signup CTA with email input field.
 * Perfect for building email lists and nurturing leads.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn, container, sectionPadding, focusRing } from '@/lib/design-system';
import type { CTANewsletterProps } from './types';

export function CTANewsletter({
  headline,
  description,
  placeholder = 'Enter your email',
  buttonText = 'Subscribe',
  privacyText,
  background = 'muted',
  onSubmit,
  className,
}: CTANewsletterProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const backgroundStyles = {
    light: 'bg-[var(--color-background)]',
    muted: 'bg-[var(--color-muted)]',
    dark: 'bg-gray-900',
  };

  const textStyles = {
    light: {
      headline: 'text-[var(--color-foreground)]',
      description: 'text-[var(--color-muted-foreground)]',
      privacy: 'text-[var(--color-muted-foreground)]',
    },
    muted: {
      headline: 'text-[var(--color-foreground)]',
      description: 'text-[var(--color-muted-foreground)]',
      privacy: 'text-[var(--color-muted-foreground)]',
    },
    dark: {
      headline: 'text-white',
      description: 'text-gray-300',
      privacy: 'text-gray-400',
    },
  };

  const inputStyles = {
    light: 'bg-white border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]',
    muted: 'bg-white border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]',
    dark: 'bg-white/10 border-white/20 text-white placeholder:text-gray-400',
  };

  const styles = textStyles[background];

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      if (onSubmit) {
        await onSubmit(email);
      }
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <section
      className={cn(backgroundStyles[background], sectionPadding('md'), className)}
    >
      <div className={container('lg')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Headline */}
          <h2
            className={cn(
              'text-3xl font-bold tracking-tight sm:text-4xl',
              styles.headline
            )}
          >
            {headline}
          </h2>

          {/* Description */}
          {description && (
            <p className={cn('mt-4 text-lg', styles.description)}>
              {description}
            </p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder={placeholder}
                disabled={status === 'loading' || status === 'success'}
                className={cn(
                  'flex-1 rounded-lg px-4 py-3',
                  'border text-base',
                  'transition-all duration-200',
                  inputStyles[background],
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className={cn(
                  'rounded-lg px-6 py-3',
                  'bg-[var(--color-primary)] text-white',
                  'text-base font-semibold',
                  'hover:bg-[var(--color-primary-hover)]',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  focusRing()
                )}
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Subscribing...
                  </span>
                ) : status === 'success' ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Subscribed!
                  </span>
                ) : (
                  buttonText
                )}
              </button>
            </div>

            {/* Error Message */}
            {status === 'error' && errorMessage && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-red-500"
              >
                {errorMessage}
              </motion.p>
            )}

            {/* Success Message */}
            {status === 'success' && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-green-500"
              >
                Thanks for subscribing! Check your inbox for confirmation.
              </motion.p>
            )}
          </form>

          {/* Privacy Text */}
          {privacyText && (
            <p className={cn('mt-4 text-sm', styles.privacy)}>
              {privacyText}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

CTANewsletter.displayName = 'CTANewsletter';
