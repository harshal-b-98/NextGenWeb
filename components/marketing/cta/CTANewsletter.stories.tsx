import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CTANewsletter } from './CTANewsletter';

const meta: Meta<typeof CTANewsletter> = {
  title: 'Marketing/CTA/CTANewsletter',
  component: CTANewsletter,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A newsletter signup CTA with email input field. Perfect for building email lists and nurturing leads.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    background: {
      control: 'radio',
      options: ['light', 'muted', 'dark'],
      description: 'Background style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CTANewsletter>;

export const Default: Story = {
  args: {
    headline: 'Stay up to date',
    description: 'Get the latest news, updates, and tips delivered straight to your inbox.',
    placeholder: 'Enter your email',
    buttonText: 'Subscribe',
    privacyText: 'We respect your privacy. Unsubscribe at any time.',
    background: 'muted',
  },
};

export const Light: Story = {
  args: {
    headline: 'Subscribe to our newsletter',
    description: 'Join 10,000+ subscribers and get weekly insights on industry trends.',
    placeholder: 'you@example.com',
    buttonText: 'Join Now',
    background: 'light',
  },
};

export const Dark: Story = {
  args: {
    headline: 'Never miss an update',
    description: 'Be the first to know about new features, product updates, and special offers.',
    placeholder: 'Your email address',
    buttonText: 'Get Updates',
    privacyText: 'No spam, ever. Your email is safe with us.',
    background: 'dark',
  },
};

export const Simple: Story = {
  args: {
    headline: 'Get early access',
    placeholder: 'Enter your email',
    buttonText: 'Sign Up',
    background: 'muted',
  },
};

export const WithPrivacy: Story = {
  args: {
    headline: 'Join our community',
    description: 'Get exclusive content, tips, and resources delivered to your inbox weekly.',
    placeholder: 'name@company.com',
    buttonText: 'Subscribe',
    privacyText: 'By subscribing, you agree to our Privacy Policy and consent to receive updates.',
    background: 'light',
  },
};

export const ProductLaunch: Story = {
  args: {
    headline: 'Be the first to know',
    description: 'We\'re launching something big. Sign up to get notified when we go live.',
    placeholder: 'Your best email',
    buttonText: 'Notify Me',
    privacyText: 'We\'ll only email you about the launch. No spam, we promise.',
    background: 'dark',
  },
};

export const WithCallback: Story = {
  args: {
    headline: 'Subscribe for updates',
    description: 'This example demonstrates the submit callback functionality.',
    placeholder: 'Enter your email',
    buttonText: 'Subscribe',
    background: 'muted',
    onSubmit: async (email) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Subscribed:', email);
    },
  },
};
