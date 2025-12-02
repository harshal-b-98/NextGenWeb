/**
 * Contact Component Types
 *
 * Shared types and interfaces for all contact component variants.
 */

import type { ComponentMetadata } from '@/lib/design-system/tokens';

export interface ContactFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select fields
}

export interface ContactInfo {
  icon?: 'email' | 'phone' | 'location' | 'clock';
  label: string;
  value: string;
  href?: string;
}

export interface ContactFormProps {
  headline?: string;
  subheadline?: string;
  fields?: ContactFormField[];
  submitText?: string;
  successMessage?: string;
  contactInfo?: ContactInfo[];
  showMap?: boolean;
  mapEmbedUrl?: string;
  layout?: 'stacked' | 'split';
  background?: 'light' | 'muted' | 'dark';
  onSubmit?: (data: Record<string, string>) => Promise<void>;
  className?: string;
}

// Default form fields
export const defaultContactFields: ContactFormField[] = [
  {
    name: 'name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'John Doe',
    required: true,
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'john@example.com',
    required: true,
  },
  {
    name: 'subject',
    label: 'Subject',
    type: 'text',
    placeholder: 'How can we help?',
    required: false,
  },
  {
    name: 'message',
    label: 'Message',
    type: 'textarea',
    placeholder: 'Tell us more about your inquiry...',
    required: true,
  },
];

// AI Component Metadata
export const contactMetadata: Record<string, ComponentMetadata> = {
  'contact-form': {
    id: 'contact-form',
    name: 'Contact Form',
    category: 'contact',
    variant: 'form',
    description:
      'A comprehensive contact form with configurable fields, contact information display, and optional map integration. Supports both stacked and split layouts.',
    bestFor: [
      'Contact pages',
      'Support requests',
      'Sales inquiries',
      'Lead generation',
    ],
    contentRequirements: {
      required: [],
      optional: ['headline', 'subheadline', 'fields', 'contactInfo'],
    },
    styleTags: ['functional', 'professional', 'accessible', 'conversion'],
    conversionFocus: 'lead-capture',
  },
};

// Export all contact component IDs for the AI selection system
export const contactComponentIds = Object.keys(contactMetadata);
