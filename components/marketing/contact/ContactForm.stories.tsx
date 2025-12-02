import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ContactForm } from './ContactForm';

const meta: Meta<typeof ContactForm> = {
  title: 'Marketing/Contact/ContactForm',
  component: ContactForm,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A comprehensive contact form with configurable fields, contact information display, and optional map integration.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    layout: {
      control: 'radio',
      options: ['stacked', 'split'],
      description: 'Form layout style',
    },
    background: {
      control: 'radio',
      options: ['light', 'muted', 'dark'],
      description: 'Background style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ContactForm>;

const contactInfo = [
  {
    icon: 'email' as const,
    label: 'Email',
    value: 'hello@example.com',
    href: 'mailto:hello@example.com',
  },
  {
    icon: 'phone' as const,
    label: 'Phone',
    value: '+1 (555) 123-4567',
    href: 'tel:+15551234567',
  },
  {
    icon: 'location' as const,
    label: 'Office',
    value: '123 Main Street, San Francisco, CA 94102',
  },
  {
    icon: 'clock' as const,
    label: 'Hours',
    value: 'Mon-Fri: 9am - 6pm PST',
  },
];

export const Default: Story = {
  args: {
    headline: 'Get in Touch',
    subheadline: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
    contactInfo,
    layout: 'split',
    background: 'light',
  },
};

export const StackedLayout: Story = {
  args: {
    headline: 'Contact Us',
    subheadline: 'Have a question? Fill out the form below and our team will get back to you within 24 hours.',
    contactInfo,
    layout: 'stacked',
    background: 'light',
  },
};

export const MutedBackground: Story = {
  args: {
    headline: 'Send Us a Message',
    subheadline: "We're here to help. Reach out and let us know how we can assist you.",
    contactInfo,
    layout: 'split',
    background: 'muted',
  },
};

export const DarkBackground: Story = {
  args: {
    headline: "Let's Talk",
    subheadline: 'Ready to get started? Contact our team today.',
    contactInfo,
    layout: 'split',
    background: 'dark',
  },
};

export const SimpleForm: Story = {
  args: {
    headline: 'Contact',
    subheadline: 'Fill out the form below.',
    layout: 'stacked',
    background: 'light',
  },
};

export const CustomFields: Story = {
  args: {
    headline: 'Request a Demo',
    subheadline: 'See our platform in action. Fill out the form to schedule a personalized demo.',
    fields: [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        placeholder: 'John',
        required: true,
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        placeholder: 'Doe',
        required: true,
      },
      {
        name: 'email',
        label: 'Work Email',
        type: 'email',
        placeholder: 'john@company.com',
        required: true,
      },
      {
        name: 'company',
        label: 'Company',
        type: 'text',
        placeholder: 'Acme Inc.',
        required: true,
      },
      {
        name: 'companySize',
        label: 'Company Size',
        type: 'select',
        placeholder: 'Select company size',
        required: true,
        options: ['1-10', '11-50', '51-200', '201-500', '500+'],
      },
      {
        name: 'message',
        label: 'What are you looking for?',
        type: 'textarea',
        placeholder: 'Tell us about your needs...',
        required: false,
      },
    ],
    submitText: 'Request Demo',
    successMessage: "Thanks! We'll be in touch within 24 hours to schedule your demo.",
    contactInfo: [
      {
        icon: 'email',
        label: 'Sales',
        value: 'sales@example.com',
        href: 'mailto:sales@example.com',
      },
      {
        icon: 'phone',
        label: 'Call Us',
        value: '+1 (555) 987-6543',
        href: 'tel:+15559876543',
      },
    ],
    layout: 'split',
    background: 'muted',
  },
};

export const SupportForm: Story = {
  args: {
    headline: 'Support Request',
    subheadline: 'Having an issue? Our support team is here to help.',
    fields: [
      {
        name: 'name',
        label: 'Your Name',
        type: 'text',
        placeholder: 'Jane Smith',
        required: true,
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'jane@example.com',
        required: true,
      },
      {
        name: 'category',
        label: 'Issue Category',
        type: 'select',
        placeholder: 'Select a category',
        required: true,
        options: ['Technical Issue', 'Billing Question', 'Feature Request', 'Account Access', 'Other'],
      },
      {
        name: 'priority',
        label: 'Priority',
        type: 'select',
        placeholder: 'Select priority',
        required: true,
        options: ['Low', 'Medium', 'High', 'Urgent'],
      },
      {
        name: 'description',
        label: 'Describe Your Issue',
        type: 'textarea',
        placeholder: 'Please provide as much detail as possible...',
        required: true,
      },
    ],
    submitText: 'Submit Ticket',
    successMessage: "We've received your support request. Ticket #12345 has been created.",
    layout: 'stacked',
    background: 'light',
  },
};

export const WithMap: Story = {
  args: {
    headline: 'Visit Our Office',
    subheadline: "We'd love to meet you in person. Come say hello!",
    contactInfo: [
      {
        icon: 'location',
        label: 'Address',
        value: '123 Market Street, San Francisco, CA 94102',
      },
      {
        icon: 'phone',
        label: 'Phone',
        value: '+1 (555) 123-4567',
        href: 'tel:+15551234567',
      },
      {
        icon: 'clock',
        label: 'Office Hours',
        value: 'Monday - Friday, 9am - 5pm',
      },
    ],
    showMap: true,
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0977400555845!2d-122.4194!3d37.7749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDQ2JzI5LjYiTiAxMjLCsDI1JzA5LjgiVw!5e0!3m2!1sen!2sus!4v1234567890',
    layout: 'split',
    background: 'light',
  },
};

export const MinimalDark: Story = {
  args: {
    headline: 'Get Started',
    subheadline: 'Join thousands of happy customers.',
    fields: [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'you@example.com',
        required: true,
      },
      {
        name: 'message',
        label: 'How can we help?',
        type: 'textarea',
        placeholder: 'Tell us about your project...',
        required: true,
      },
    ],
    submitText: 'Send',
    layout: 'stacked',
    background: 'dark',
  },
};
