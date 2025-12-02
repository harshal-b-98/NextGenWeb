'use client';

/**
 * ContactForm Component
 *
 * A comprehensive contact form with configurable fields, contact information display,
 * and optional map integration. Supports both stacked and split layouts.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn, container, sectionPadding, focusRing } from '@/lib/design-system';
import type { ContactFormProps, ContactInfo } from './types';
import { defaultContactFields } from './types';

const iconMap = {
  email: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  ),
  phone: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  ),
  location: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  ),
  clock: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

function ContactInfoItem({ info, isDark }: { info: ContactInfo; isDark: boolean }) {
  const content = (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          'flex-shrink-0 p-2 rounded-lg',
          isDark ? 'bg-white/10 text-white' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
        )}
      >
        {info.icon && iconMap[info.icon]}
      </div>
      <div>
        <p
          className={cn(
            'text-sm font-medium',
            isDark ? 'text-white/70' : 'text-[var(--color-muted-foreground)]'
          )}
        >
          {info.label}
        </p>
        <p
          className={cn(
            'mt-1 text-base',
            isDark ? 'text-white' : 'text-[var(--color-foreground)]',
            info.href && 'hover:underline'
          )}
        >
          {info.value}
        </p>
      </div>
    </div>
  );

  if (info.href) {
    return (
      <a href={info.href} className="block transition-opacity hover:opacity-80">
        {content}
      </a>
    );
  }

  return content;
}

export function ContactForm({
  headline = 'Get in Touch',
  subheadline = "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
  fields = defaultContactFields,
  submitText = 'Send Message',
  successMessage = "Thank you for your message! We'll get back to you soon.",
  contactInfo,
  showMap = false,
  mapEmbedUrl,
  layout = 'split',
  background = 'light',
  onSubmit,
  className,
}: ContactFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      setStatus('success');
      setFormData({});
    } catch {
      setStatus('error');
    }
  };

  const bgStyles = {
    light: 'bg-[var(--color-background)]',
    muted: 'bg-[var(--color-muted)]',
    dark: 'bg-[var(--color-foreground)]',
  };

  const isDark = background === 'dark';

  const inputStyles = cn(
    'w-full rounded-lg border px-4 py-3 text-base',
    'transition-colors duration-200',
    isDark
      ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50'
      : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]',
    focusRing()
  );

  const labelStyles = cn(
    'block text-sm font-medium mb-2',
    isDark ? 'text-white' : 'text-[var(--color-foreground)]'
  );

  return (
    <section className={cn(bgStyles[background], sectionPadding('md'), className)}>
      <div className={container('lg')}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={cn(
            'mb-12',
            layout === 'stacked' ? 'text-center max-w-2xl mx-auto' : ''
          )}
        >
          {headline && (
            <h2
              className={cn(
                'text-3xl font-bold tracking-tight sm:text-4xl',
                isDark ? 'text-white' : 'text-[var(--color-foreground)]'
              )}
            >
              {headline}
            </h2>
          )}
          {subheadline && (
            <p
              className={cn(
                'mt-4 text-lg',
                isDark ? 'text-white/70' : 'text-[var(--color-muted-foreground)]'
              )}
            >
              {subheadline}
            </p>
          )}
        </motion.div>

        {/* Content */}
        <div
          className={cn(
            'grid gap-12',
            layout === 'split' && contactInfo ? 'lg:grid-cols-2' : ''
          )}
        >
          {/* Contact Info (for split layout) */}
          {layout === 'split' && contactInfo && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {contactInfo.map((info, index) => (
                <ContactInfoItem key={index} info={info} isDark={isDark} />
              ))}

              {showMap && mapEmbedUrl && (
                <div className="mt-8 rounded-xl overflow-hidden aspect-video">
                  <iframe
                    src={mapEmbedUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location map"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: layout === 'split' ? 20 : 0, y: layout === 'stacked' ? 20 : 0 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {status === 'success' ? (
              <div
                className={cn(
                  'rounded-xl p-8 text-center',
                  isDark ? 'bg-white/10' : 'bg-green-50'
                )}
              >
                <svg
                  className={cn('mx-auto h-12 w-12', isDark ? 'text-green-400' : 'text-green-500')}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p
                  className={cn(
                    'mt-4 text-lg font-medium',
                    isDark ? 'text-white' : 'text-green-800'
                  )}
                >
                  {successMessage}
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className={cn(
                    'mt-6 text-sm font-medium',
                    isDark ? 'text-white/70 hover:text-white' : 'text-green-600 hover:text-green-700'
                  )}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className={cn(
                  'rounded-xl p-6 lg:p-8',
                  isDark ? 'bg-white/5' : 'bg-[var(--color-card)] shadow-sm border border-[var(--color-border)]'
                )}
              >
                <div className="space-y-6">
                  {fields.map((field) => (
                    <div key={field.name}>
                      <label htmlFor={field.name} className={labelStyles}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          id={field.name}
                          name={field.name}
                          placeholder={field.placeholder}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={handleChange}
                          rows={4}
                          className={cn(inputStyles, 'resize-none')}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          id={field.name}
                          name={field.name}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={handleChange}
                          className={inputStyles}
                        >
                          <option value="">{field.placeholder || 'Select an option'}</option>
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={field.name}
                          name={field.name}
                          type={field.type}
                          placeholder={field.placeholder}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={handleChange}
                          className={inputStyles}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {status === 'error' && (
                  <p className="mt-4 text-sm text-red-500">
                    Something went wrong. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className={cn(
                    'mt-6 w-full rounded-lg px-6 py-3',
                    'text-base font-semibold',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isDark
                      ? 'bg-white text-[var(--color-foreground)] hover:bg-white/90'
                      : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
                    focusRing()
                  )}
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    submitText
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>

        {/* Contact Info (for stacked layout) */}
        {layout === 'stacked' && contactInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {contactInfo.map((info, index) => (
              <ContactInfoItem key={index} info={info} isDark={isDark} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

ContactForm.displayName = 'ContactForm';
