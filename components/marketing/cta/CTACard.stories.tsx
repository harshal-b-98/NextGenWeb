import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CTACard } from './CTACard';

const meta: Meta<typeof CTACard> = {
  title: 'Marketing/CTA/CTACard',
  component: CTACard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A prominent card-style CTA with gradient background and optional pattern. Best for high-impact conversion sections.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    background: {
      control: 'radio',
      options: ['gradient', 'primary', 'dark'],
      description: 'Background style',
    },
    pattern: {
      control: 'boolean',
      description: 'Show decorative pattern',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CTACard>;

export const Default: Story = {
  args: {
    headline: 'Start your free trial today',
    description:
      'Get full access to all features for 14 days. No credit card required.',
    primaryButton: { text: 'Get Started Free', href: '#' },
    secondaryButton: { text: 'View Pricing', href: '#' },
    background: 'gradient',
    pattern: true,
  },
};

export const WithBadge: Story = {
  args: {
    headline: 'Join 50,000+ happy customers',
    description:
      'See why teams worldwide choose our platform to power their growth.',
    primaryButton: { text: 'Start Free Trial', href: '#' },
    secondaryButton: { text: 'Book a Demo', href: '#' },
    badge: 'Limited Time Offer',
    background: 'gradient',
    pattern: true,
  },
};

export const Primary: Story = {
  args: {
    headline: 'Ready to scale your business?',
    description:
      'Our enterprise solutions help you grow faster with less friction.',
    primaryButton: { text: 'Contact Sales', href: '#' },
    background: 'primary',
    pattern: true,
  },
};

export const Dark: Story = {
  args: {
    headline: 'Unlock premium features',
    description:
      'Upgrade to Pro and get access to advanced analytics, priority support, and more.',
    primaryButton: { text: 'Upgrade to Pro', href: '#' },
    secondaryButton: { text: 'Compare Plans', href: '#' },
    badge: 'Most Popular',
    background: 'dark',
    pattern: true,
  },
};

export const NoPattern: Story = {
  args: {
    headline: 'Simple pricing, no surprises',
    description:
      'Choose the plan that works for you. Scale up or down anytime.',
    primaryButton: { text: 'See Pricing', href: '#' },
    background: 'gradient',
    pattern: false,
  },
};

export const SingleButton: Story = {
  args: {
    headline: 'Transform how you work',
    description:
      'Join thousands of teams who have revolutionized their workflow with our platform.',
    primaryButton: { text: 'Get Started', href: '#' },
    background: 'primary',
    pattern: true,
  },
};

export const MinimalContent: Story = {
  args: {
    headline: 'Let\'s build something amazing together',
    primaryButton: { text: 'Start Building', href: '#' },
    background: 'gradient',
    pattern: true,
  },
};
