/**
 * Contextual Lead Capture Form
 * Phase 6.4: Conversation Journey & Conversion Flow - Task #118
 *
 * A lead capture form that displays conversation context and personalized messaging.
 * Shows: "Based on your interest in [topics]..."
 * Pre-fills fields from persona signals.
 * Includes journey summary in form submission.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useConversationStore,
  useEngagementMetrics,
  useTopicEngagement,
  usePersonaInfo,
} from '@/lib/stores';
import { getTopEngagedTopics, getKeyInterests } from '@/lib/interactive/conversation/engagement-scorer';
import { JourneySummary } from './JourneySummary';
import type { LeadCaptureInput } from '@/lib/leads/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ContextualLeadFormProps {
  websiteId: string;
  formId?: string;
  className?: string;
  onSubmit?: (data: ContextualLeadData) => Promise<void>;
  onSuccess?: (leadId: string) => void;
  onError?: (error: string) => void;
  variant?: 'inline' | 'modal' | 'card' | 'minimal';
  showJourneySummary?: boolean;
  showInterestContext?: boolean;
  customHeadline?: string;
  customSubheadline?: string;
  submitButtonText?: string;
  fields?: FormFieldConfig[];
  personaPresets?: Record<string, PersonaFieldPreset>;
}

export interface ContextualLeadData extends LeadCaptureInput {
  journeyData: {
    sessionId: string;
    engagementScore: number;
    topicsExplored: string[];
    sectionsViewed: number;
    totalTimeSpentMs: number;
    funnelStage: string;
    conversionReadiness: string;
    detectedPersona?: string;
    keyInterests: Array<{ topic: string; score: number }>;
  };
}

export interface FormFieldConfig {
  name: string;
  type: 'text' | 'email' | 'phone' | 'company' | 'textarea' | 'select';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface PersonaFieldPreset {
  company?: string;
  role?: string;
  industry?: string;
  interests?: string[];
}

// ============================================================================
// DEFAULT FIELDS
// ============================================================================

const DEFAULT_FIELDS: FormFieldConfig[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Full Name',
    placeholder: 'Enter your name',
    required: true,
  },
  {
    name: 'email',
    type: 'email',
    label: 'Work Email',
    placeholder: 'you@company.com',
    required: true,
  },
  {
    name: 'company',
    type: 'company',
    label: 'Company',
    placeholder: 'Your company name',
    required: false,
  },
  {
    name: 'phone',
    type: 'phone',
    label: 'Phone (Optional)',
    placeholder: '+1 (555) 000-0000',
    required: false,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ContextualLeadForm({
  websiteId,
  formId,
  className,
  onSubmit,
  onSuccess,
  onError,
  variant = 'card',
  showJourneySummary = true,
  showInterestContext = true,
  customHeadline,
  customSubheadline,
  submitButtonText = 'Get Started',
  fields = DEFAULT_FIELDS,
  personaPresets = {},
}: ContextualLeadFormProps) {
  // State
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conversation state
  const conversationState = useConversationStore((state) => state);
  const { engagementScore, currentFunnelStage, conversionReadiness } = useEngagementMetrics();
  const { topicsExplored, topicOrder } = useTopicEngagement();
  const { detectedPersona, personaConfidence } = usePersonaInfo();
  const trackInteraction = useConversationStore((state) => state.trackInteraction);
  const exportJourneyData = useConversationStore((state) => state.exportJourneyData);
  const funnelStage = currentFunnelStage;

  // Computed values
  const topEngagedTopics = useMemo(
    () => getTopEngagedTopics(topicsExplored, 3),
    [topicsExplored]
  );

  const keyInterests = useMemo(
    () => getKeyInterests(topicsExplored),
    [topicsExplored]
  );

  const topicNames = useMemo(
    () => topEngagedTopics.map((t) => t.topic),
    [topEngagedTopics]
  );

  // Generate personalized headline
  const headline = useMemo(() => {
    if (customHeadline) return customHeadline;

    if (topicNames.length > 0) {
      const topicsText = topicNames.length === 1
        ? topicNames[0]
        : topicNames.length === 2
          ? `${topicNames[0]} and ${topicNames[1]}`
          : `${topicNames.slice(0, -1).join(', ')}, and ${topicNames[topicNames.length - 1]}`;

      return `Based on your interest in ${topicsText}`;
    }

    if (detectedPersona) {
      return `Perfect for ${detectedPersona}s like you`;
    }

    return "Let's continue the conversation";
  }, [customHeadline, topicNames, detectedPersona]);

  // Generate personalized subheadline
  const subheadline = useMemo(() => {
    if (customSubheadline) return customSubheadline;

    if (conversionReadiness === 'ready' || conversionReadiness === 'high') {
      return "You're ready to take the next step. Let us help you get started.";
    }

    if (funnelStage === 'decision') {
      return "Get personalized recommendations and pricing for your needs.";
    }

    if (funnelStage === 'consideration') {
      return "Discover how we can help you achieve your goals.";
    }

    return "Share your details and we'll reach out with tailored information.";
  }, [customSubheadline, conversionReadiness, funnelStage]);

  // Pre-fill from persona
  const prefilledData = useMemo((): Record<string, string> => {
    const preset = detectedPersona ? personaPresets[detectedPersona] : undefined;
    return {
      company: preset?.company || '',
      ...formData,
    };
  }, [detectedPersona, personaPresets, formData]);

  // Handle field change
  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Record form start interaction
    trackInteraction({
      type: 'form-start',
      ctaText: submitButtonText,
      topic: 'lead-capture',
      metadata: { formId },
    });

    try {
      // Validate required fields
      for (const field of fields) {
        if (field.required && !formData[field.name]?.trim()) {
          throw new Error(`${field.label} is required`);
        }
      }

      // Validate email
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Build journey data
      const journeyExport = exportJourneyData();
      const contextualData: ContextualLeadData = {
        websiteId,
        email: formData.email || '',
        name: formData.name,
        phone: formData.phone,
        company: formData.company,
        personaId: detectedPersona || undefined,
        source: 'contextual-form',
        sourceComponent: formId,
        data: {
          ...formData,
          journey: journeyExport,
        },
        formData: {
          ...formData,
          topicsExplored: topicOrder,
          engagementScore,
          funnelStage,
          conversionReadiness,
          personaConfidence,
        },
        journeyData: {
          sessionId: conversationState.sessionId,
          engagementScore,
          topicsExplored: topicOrder,
          sectionsViewed: conversationState.sectionsGenerated,
          totalTimeSpentMs: conversationState.totalTimeSpentMs,
          funnelStage,
          conversionReadiness,
          detectedPersona: detectedPersona || undefined,
          keyInterests: keyInterests.slice(0, 5),
        },
      };

      // Call submit handler
      if (onSubmit) {
        await onSubmit(contextualData);
      } else {
        // Default: POST to leads API
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contextualData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to submit form');
        }

        const result = await response.json();
        if (result.leadId) {
          onSuccess?.(result.leadId);
        }
      }

      // Record form submit interaction
      trackInteraction({
        type: 'form-submit',
        ctaText: submitButtonText,
        topic: 'lead-capture',
        metadata: {
          formId,
          email: formData.email,
          engagementScore,
        },
      });

      setIsSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit form';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    fields,
    websiteId,
    formId,
    submitButtonText,
    detectedPersona,
    topicOrder,
    engagementScore,
    funnelStage,
    conversionReadiness,
    personaConfidence,
    conversationState,
    keyInterests,
    trackInteraction,
    exportJourneyData,
    onSubmit,
    onSuccess,
    onError,
  ]);

  // Render success state
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'rounded-xl p-8 text-center',
          variant === 'card' && 'bg-card border shadow-lg',
          variant === 'inline' && 'bg-muted/50',
          className
        )}
      >
        <div className="mb-4 flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center"
          >
            <svg
              className="h-8 w-8 text-green-600"
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
        <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
        <p className="text-muted-foreground">
          We&apos;ve received your information and will be in touch soon with personalized
          recommendations based on your interests.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl',
        variant === 'card' && 'bg-card border shadow-lg p-6',
        variant === 'inline' && 'bg-transparent',
        variant === 'modal' && 'bg-background p-8',
        variant === 'minimal' && 'bg-transparent p-0',
        className
      )}
    >
      {/* Context Header */}
      {showInterestContext && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{headline}</h2>
          <p className="text-muted-foreground">{subheadline}</p>
        </div>
      )}

      {/* Journey Summary */}
      {showJourneySummary && topicNames.length > 0 && (
        <div className="mb-6">
          <JourneySummary
            topics={topicNames}
            engagementScore={engagementScore}
            sectionsViewed={conversationState.sectionsGenerated}
            variant="compact"
          />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                placeholder={field.placeholder}
                value={prefilledData[field.name] || formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className={cn(
                  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2',
                  'text-sm ring-offset-background placeholder:text-muted-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
                disabled={isSubmitting}
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className={cn(
                  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
                  'text-sm ring-offset-background',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
                disabled={isSubmitting}
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={field.name}
                name={field.name}
                type={field.type === 'phone' ? 'tel' : field.type}
                placeholder={field.placeholder}
                value={prefilledData[field.name] || formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                disabled={isSubmitting}
              />
            )}
          </div>
        ))}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-destructive bg-destructive/10 p-3 rounded-md"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            submitButtonText
          )}
        </Button>

        {/* Privacy Note */}
        <p className="text-xs text-muted-foreground text-center">
          By submitting, you agree to our privacy policy. We&apos;ll use your information
          to provide personalized recommendations.
        </p>
      </form>
    </motion.div>
  );
}

export default ContextualLeadForm;
