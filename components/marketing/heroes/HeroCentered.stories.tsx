import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HeroCentered } from './HeroCentered';

const meta: Meta<typeof HeroCentered> = {
  title: 'Marketing/Heroes/HeroCentered',
  component: HeroCentered,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A centered hero section with headline, subheadline, and CTA buttons. Best for landing pages that need a strong, focused message.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    headline: {
      control: 'text',
      description: 'Main headline text',
    },
    subheadline: {
      control: 'text',
      description: 'Secondary headline text',
    },
    description: {
      control: 'text',
      description: 'Detailed description text',
    },
    badge: {
      control: 'text',
      description: 'Badge text shown above headline',
    },
    backgroundPattern: {
      control: 'boolean',
      description: 'Show background grid pattern',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeroCentered>;

export const Default: Story = {
  args: {
    headline: 'Build better products with AI-powered insights',
    subheadline: 'Transform your data into actionable intelligence',
    description:
      'Our platform helps you understand your customers better, make data-driven decisions, and grow your business faster than ever.',
    primaryButton: {
      text: 'Get Started',
      href: '#',
    },
    secondaryButton: {
      text: 'Learn More',
      href: '#',
    },
    badge: 'New Features Available',
    backgroundPattern: true,
  },
};

export const WithoutBadge: Story = {
  args: {
    headline: 'Simple, powerful, effective',
    subheadline: 'The tools you need to succeed',
    primaryButton: {
      text: 'Start Free Trial',
      href: '#',
    },
    secondaryButton: {
      text: 'Watch Demo',
      href: '#',
    },
    backgroundPattern: true,
  },
};

export const MinimalContent: Story = {
  args: {
    headline: 'Welcome to the future of web development',
    primaryButton: {
      text: 'Explore',
      href: '#',
    },
    backgroundPattern: false,
  },
};

export const FullContent: Story = {
  args: {
    headline: 'Enterprise-grade security for your business',
    subheadline: 'Protect your data with industry-leading encryption',
    description:
      'With SOC 2 compliance, end-to-end encryption, and advanced threat detection, your data is always safe. Join thousands of companies who trust us with their most sensitive information.',
    primaryButton: {
      text: 'Contact Sales',
      href: '#',
    },
    secondaryButton: {
      text: 'View Security Details',
      href: '#',
    },
    badge: 'SOC 2 Certified',
    backgroundPattern: true,
  },
};

export const NoPattern: Story = {
  args: {
    headline: 'Clean and simple design',
    subheadline: 'Sometimes less is more',
    description: 'A minimal hero without the background pattern for a cleaner look.',
    primaryButton: {
      text: 'Get Started',
      href: '#',
    },
    backgroundPattern: false,
  },
};
