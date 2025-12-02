import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CTABanner } from './CTABanner';

const meta: Meta<typeof CTABanner> = {
  title: 'Marketing/CTA/CTABanner',
  component: CTABanner,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A horizontal call-to-action banner with headline and buttons. Perfect for site-wide promotions or simple conversion points.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    background: {
      control: 'select',
      options: ['primary', 'dark', 'gradient', 'light'],
      description: 'Background style',
    },
    alignment: {
      control: 'radio',
      options: ['left', 'center', 'between'],
      description: 'Content alignment',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CTABanner>;

export const Default: Story = {
  args: {
    headline: 'Ready to get started?',
    description: 'Join thousands of companies already using our platform.',
    primaryButton: { text: 'Start Free Trial', href: '#' },
    secondaryButton: { text: 'Contact Sales', href: '#' },
    background: 'primary',
    alignment: 'center',
  },
};

export const Gradient: Story = {
  args: {
    headline: 'Transform your workflow today',
    description: 'See results in less than 24 hours.',
    primaryButton: { text: 'Get Started', href: '#' },
    background: 'gradient',
    alignment: 'center',
  },
};

export const Dark: Story = {
  args: {
    headline: 'Don\'t miss out on our limited offer',
    description: 'Save 50% when you sign up today.',
    primaryButton: { text: 'Claim Offer', href: '#' },
    secondaryButton: { text: 'Learn More', href: '#' },
    background: 'dark',
    alignment: 'between',
  },
};

export const Light: Story = {
  args: {
    headline: 'Have questions? We\'re here to help.',
    description: 'Our team is available 24/7 to assist you.',
    primaryButton: { text: 'Contact Us', href: '#' },
    background: 'light',
    alignment: 'center',
  },
};

export const SpaceBetween: Story = {
  args: {
    headline: 'Start building for free',
    description: 'No credit card required. Get started in minutes.',
    primaryButton: { text: 'Sign Up Free', href: '#' },
    secondaryButton: { text: 'Watch Demo', href: '#' },
    background: 'primary',
    alignment: 'between',
  },
};

export const LeftAligned: Story = {
  args: {
    headline: 'Upgrade to Pro',
    description: 'Unlock advanced features and priority support.',
    primaryButton: { text: 'Upgrade Now', href: '#' },
    background: 'gradient',
    alignment: 'left',
  },
};

export const Simple: Story = {
  args: {
    headline: 'Try it free for 14 days',
    primaryButton: { text: 'Start Trial', href: '#' },
    background: 'dark',
    alignment: 'center',
  },
};
