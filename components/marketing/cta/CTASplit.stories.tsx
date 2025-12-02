import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CTASplit } from './CTASplit';

const meta: Meta<typeof CTASplit> = {
  title: 'Marketing/CTA/CTASplit',
  component: CTASplit,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A split-layout CTA with content on one side and optional image on the other. Ideal for detailed CTAs with visual support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    imagePosition: {
      control: 'radio',
      options: ['left', 'right'],
      description: 'Position of the image',
    },
    background: {
      control: 'radio',
      options: ['light', 'muted', 'dark'],
      description: 'Background style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CTASplit>;

export const Default: Story = {
  args: {
    headline: 'Take your productivity to the next level',
    description:
      'Our platform helps teams work smarter, not harder. Get started today and see results within the first week.',
    primaryButton: { text: 'Start Free Trial', href: '#' },
    secondaryButton: { text: 'Schedule Demo', href: '#' },
    imageSrc: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
    imageAlt: 'Team collaboration',
    imagePosition: 'right',
    background: 'light',
  },
};

export const ImageLeft: Story = {
  args: {
    headline: 'Built for modern teams',
    description:
      'Whether you\'re a startup or enterprise, our tools scale with your needs. Join 10,000+ companies worldwide.',
    primaryButton: { text: 'Get Started', href: '#' },
    imageSrc: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
    imageAlt: 'Modern workspace',
    imagePosition: 'left',
    background: 'muted',
  },
};

export const DarkBackground: Story = {
  args: {
    headline: 'Enterprise-grade security',
    description:
      'Your data is protected with industry-leading encryption and compliance certifications. Trust us with your most sensitive information.',
    primaryButton: { text: 'Learn More', href: '#' },
    secondaryButton: { text: 'Contact Sales', href: '#' },
    imageSrc: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop',
    imageAlt: 'Security visualization',
    imagePosition: 'right',
    background: 'dark',
  },
};

export const WithoutImage: Story = {
  args: {
    headline: 'Ready to transform your business?',
    description:
      'Join thousands of companies that have already made the switch. Our dedicated team is here to help you every step of the way.',
    primaryButton: { text: 'Get Started Today', href: '#' },
    secondaryButton: { text: 'Talk to an Expert', href: '#' },
    background: 'muted',
  },
};

export const MutedBackground: Story = {
  args: {
    headline: 'See our platform in action',
    description:
      'Watch a quick demo to see how our tools can streamline your workflow and boost your team\'s productivity.',
    primaryButton: { text: 'Watch Demo', href: '#' },
    imageSrc: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    imageAlt: 'Dashboard preview',
    imagePosition: 'left',
    background: 'muted',
  },
};

export const SingleButton: Story = {
  args: {
    headline: 'Join our growing community',
    description:
      'Connect with like-minded professionals, share insights, and grow together.',
    primaryButton: { text: 'Join Now', href: '#' },
    imageSrc: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop',
    imageAlt: 'Community event',
    imagePosition: 'right',
    background: 'light',
  },
};
