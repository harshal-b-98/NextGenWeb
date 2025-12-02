/**
 * Lead Capture Form Component
 * Phase 4.4: Conversion & Lead Tools
 *
 * Dynamic form component for capturing leads with validation,
 * tracking, and notifications.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  LeadCaptureFormConfig,
  FormField,
  LeadCaptureInput,
} from '@/lib/leads/types';

/**
 * Props for LeadCaptureForm
 */
export interface LeadCaptureFormProps {
  /** Form configuration */
  config: LeadCaptureFormConfig;

  /** Website ID for lead tracking */
  websiteId: string;

  /** Optional page ID */
  pageId?: string;

  /** Current persona ID if detected */
  personaId?: string;

  /** UTM parameters */
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };

  /** Callback on successful submission */
  onSuccess?: (leadId: string) => void;

  /** Callback on error */
  onError?: (error: string) => void;

  /** Custom class name */
  className?: string;
}

/**
 * Form field values
 */
type FormValues = Record<string, string | number | boolean>;

/**
 * Form field errors
 */
type FormErrors = Record<string, string>;

/**
 * Lead Capture Form Component
 */
export function LeadCaptureForm({
  config,
  websiteId,
  pageId,
  personaId,
  utmParams,
  onSuccess,
  onError,
  className = '',
}: LeadCaptureFormProps) {
  const [values, setValues] = useState<FormValues>(() =>
    getInitialValues(config.fields)
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get styling
  const styling = config.styling || {};

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    (fieldId: string, value: string | number | boolean) => {
      setValues((prev) => ({ ...prev, [fieldId]: value }));

      // Clear error on change
      if (errors[fieldId]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[fieldId];
          return next;
        });
      }

      // Track field interaction
      if (config.tracking?.trackFieldInteractions) {
        trackFieldInteraction(fieldId, 'change');
      }
    },
    [errors, config.tracking]
  );

  /**
   * Handle field blur
   */
  const handleBlur = useCallback(
    (fieldId: string) => {
      setTouched((prev) => ({ ...prev, [fieldId]: true }));

      // Validate on blur
      const field = config.fields.find((f) => f.id === fieldId);
      if (field) {
        const error = validateField(field, values[fieldId]);
        if (error) {
          setErrors((prev) => ({ ...prev, [fieldId]: error }));
        }
      }
    },
    [config.fields, values]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate all fields
      const newErrors: FormErrors = {};
      for (const field of config.fields) {
        const error = validateField(field, values[field.id]);
        if (error) {
          newErrors[field.id] = error;
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setTouched(
          config.fields.reduce(
            (acc, f) => ({ ...acc, [f.id]: true }),
            {} as Record<string, boolean>
          )
        );
        return;
      }

      setIsSubmitting(true);

      try {
        // Build lead capture input
        const emailField = config.fields.find((f) => f.type === 'email');
        const email = emailField ? String(values[emailField.id]) : '';

        if (!email) {
          throw new Error('Email is required');
        }

        const leadInput: LeadCaptureInput = {
          websiteId,
          pageId,
          email,
          name: findFieldValue(values, config.fields, 'name'),
          phone: findFieldValue(values, config.fields, 'phone'),
          company: findFieldValue(values, config.fields, 'company'),
          formData: values,
          personaId,
          source: 'form',
          sourceComponent: config.id,
          utmSource: utmParams?.source,
          utmMedium: utmParams?.medium,
          utmCampaign: utmParams?.campaign,
        };

        // Submit to API
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadInput),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to submit form');
        }

        // Track submission
        if (config.tracking?.trackSubmissions) {
          trackFormSubmission(config.id, result.leadId);
        }

        setIsSuccess(true);
        onSuccess?.(result.leadId);

        // Handle redirect
        if (config.redirectUrl) {
          window.location.href = config.redirectUrl;
        } else if (result.thankYouPageUrl) {
          window.location.href = result.thankYouPageUrl;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Submission failed';
        setErrors({ form: errorMessage });
        onError?.(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [config, values, websiteId, pageId, personaId, utmParams, onSuccess, onError]
  );

  // Form layout class
  const layoutClass = useMemo(() => {
    switch (styling.layout) {
      case 'horizontal':
        return 'flex flex-wrap gap-4 items-end';
      case 'inline':
        return 'flex flex-wrap gap-2 items-center';
      default:
        return 'space-y-4';
    }
  }, [styling.layout]);

  // Field spacing class
  const spacingClass = useMemo(() => {
    switch (styling.fieldSpacing) {
      case 'tight':
        return 'space-y-2';
      case 'relaxed':
        return 'space-y-6';
      default:
        return 'space-y-4';
    }
  }, [styling.fieldSpacing]);

  // If success and has success message, show it
  if (isSuccess && config.successMessage && !config.redirectUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-center p-8 ${className}`}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
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
        </div>
        <p className="text-lg font-medium text-gray-900">
          {config.successMessage}
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`lead-capture-form ${styling.className || ''} ${className}`}
    >
      <div className={layoutClass}>
        {config.fields.map((field) => (
          <FormFieldComponent
            key={field.id}
            field={field}
            value={values[field.id]}
            error={touched[field.id] ? errors[field.id] : undefined}
            onChange={handleChange}
            onBlur={handleBlur}
            styling={styling}
          />
        ))}
      </div>

      {errors.form && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-sm text-red-600"
        >
          {errors.form}
        </motion.p>
      )}

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full px-6 py-3 font-medium rounded-${styling.borderRadius || 'md'}
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            ${getButtonClasses(styling.buttonVariant)}
            ${config.submitButton.className || ''}
          `}
        >
          {isSubmitting
            ? config.submitButton.loadingText || 'Submitting...'
            : config.submitButton.text}
        </button>
      </div>
    </form>
  );
}

/**
 * Form Field Component
 */
interface FormFieldComponentProps {
  field: FormField;
  value: string | number | boolean | undefined;
  error?: string;
  onChange: (fieldId: string, value: string | number | boolean) => void;
  onBlur: (fieldId: string) => void;
  styling: LeadCaptureFormConfig['styling'];
}

function FormFieldComponent({
  field,
  value,
  error,
  onChange,
  onBlur,
  styling,
}: FormFieldComponentProps) {
  const widthClass = useMemo(() => {
    switch (field.width) {
      case 'half':
        return 'w-full md:w-[calc(50%-0.5rem)]';
      case 'third':
        return 'w-full md:w-[calc(33.333%-0.5rem)]';
      default:
        return 'w-full';
    }
  }, [field.width]);

  if (field.hidden || field.type === 'hidden') {
    return (
      <input
        type="hidden"
        name={field.name}
        value={String(value || field.defaultValue || '')}
      />
    );
  }

  const inputClasses = `
    w-full px-4 py-2.5 border rounded-${styling?.borderRadius || 'md'}
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
    ${field.className || ''}
  `;

  const labelClasses = `block text-sm font-medium text-gray-700 mb-1`;

  return (
    <div className={`${widthClass} ${field.className || ''}`}>
      {styling?.showLabels !== false && !styling?.floatingLabels && (
        <label htmlFor={field.id} className={labelClasses}>
          {field.label}
          {field.validation?.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}

      {field.type === 'textarea' ? (
        <textarea
          id={field.id}
          name={field.name}
          value={String(value || '')}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.id, e.target.value)}
          onBlur={() => onBlur(field.id)}
          className={`${inputClasses} min-h-[100px]`}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />
      ) : field.type === 'select' ? (
        <select
          id={field.id}
          name={field.name}
          value={String(value || '')}
          onChange={(e) => onChange(field.id, e.target.value)}
          onBlur={() => onBlur(field.id)}
          className={inputClasses}
          aria-describedby={error ? `${field.id}-error` : undefined}
        >
          <option value="">{field.placeholder || 'Select...'}</option>
          {field.options?.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === 'checkbox' ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            id={field.id}
            name={field.name}
            checked={Boolean(value)}
            onChange={(e) => onChange(field.id, e.target.checked)}
            onBlur={() => onBlur(field.id)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{field.label}</span>
        </label>
      ) : field.type === 'radio' ? (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name={field.name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(field.id, e.target.value)}
                onBlur={() => onBlur(field.id)}
                disabled={option.disabled}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <input
          type={field.type}
          id={field.id}
          name={field.name}
          value={String(value || '')}
          placeholder={field.placeholder}
          onChange={(e) =>
            onChange(
              field.id,
              field.type === 'number' ? Number(e.target.value) : e.target.value
            )
          }
          onBlur={() => onBlur(field.id)}
          className={inputClasses}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />
      )}

      {field.helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            id={`${field.id}-error`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-1 text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get initial form values
 */
function getInitialValues(fields: FormField[]): FormValues {
  return fields.reduce((acc, field) => {
    acc[field.id] = field.defaultValue ?? '';
    return acc;
  }, {} as FormValues);
}

/**
 * Validate a single field
 */
function validateField(
  field: FormField,
  value: string | number | boolean | undefined
): string | null {
  const validation = field.validation;
  if (!validation) return null;

  const strValue = String(value || '');

  // Required check
  if (validation.required && !strValue.trim()) {
    return `${field.label} is required`;
  }

  // Skip other validations if empty and not required
  if (!strValue.trim()) return null;

  // Min length
  if (validation.minLength && strValue.length < validation.minLength) {
    return `${field.label} must be at least ${validation.minLength} characters`;
  }

  // Max length
  if (validation.maxLength && strValue.length > validation.maxLength) {
    return `${field.label} must be no more than ${validation.maxLength} characters`;
  }

  // Pattern
  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(strValue)) {
      return validation.patternMessage || `${field.label} is invalid`;
    }
  }

  // Number min/max
  if (field.type === 'number') {
    const numValue = Number(value);
    if (validation.min !== undefined && numValue < validation.min) {
      return `${field.label} must be at least ${validation.min}`;
    }
    if (validation.max !== undefined && numValue > validation.max) {
      return `${field.label} must be no more than ${validation.max}`;
    }
  }

  // Email validation
  if (field.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(strValue)) {
      return 'Please enter a valid email address';
    }
  }

  // Custom validation
  if (validation.custom) {
    const customError = validation.custom(value);
    if (customError) return customError;
  }

  return null;
}

/**
 * Find field value by type or name hint
 */
function findFieldValue(
  values: FormValues,
  fields: FormField[],
  hint: string
): string | undefined {
  const field = fields.find(
    (f) =>
      f.name.toLowerCase().includes(hint) ||
      f.id.toLowerCase().includes(hint) ||
      f.label.toLowerCase().includes(hint)
  );
  return field ? String(values[field.id] || '') : undefined;
}

/**
 * Get button variant classes
 */
function getButtonClasses(variant?: string): string {
  switch (variant) {
    case 'secondary':
      return 'bg-gray-600 text-white hover:bg-gray-700';
    case 'outline':
      return 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50';
    case 'ghost':
      return 'bg-transparent text-blue-600 hover:bg-blue-50';
    default:
      return 'bg-blue-600 text-white hover:bg-blue-700';
  }
}

/**
 * Track field interaction (placeholder)
 */
function trackFieldInteraction(fieldId: string, action: string) {
  // In production, send to analytics
  console.debug('Field interaction:', { fieldId, action });
}

/**
 * Track form submission (placeholder)
 */
function trackFormSubmission(formId: string, leadId: string) {
  // In production, send to analytics
  console.debug('Form submission:', { formId, leadId });
}

export default LeadCaptureForm;
