import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HeroMinimal } from './HeroMinimal';

const meta: Meta<typeof HeroMinimal> = {
  title: 'Marketing/Heroes/HeroMinimal',
  component: HeroMinimal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A clean, minimal hero focusing on typography and whitespace. Best for content-focused or editorial sites.',
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
    align: {
      control: 'radio',
      options: ['left', 'center', 'right'],
      description: 'Text alignment',
    },
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Maximum width of content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeroMinimal>;

export const Default: Story = {
  args: {
    headline: 'Thoughts on design, technology, and building products',
    subheadline:
      'A collection of essays and insights from our team about creating meaningful digital experiences.',
    align: 'left',
    maxWidth: 'lg',
    primaryButton: {
      text: 'Read Latest',
      href: '#',
    },
  },
};

export const Centered: Story = {
  args: {
    headline: 'Welcome to our documentation',
    subheadline: 'Everything you need to know to get started and build amazing things.',
    align: 'center',
    maxWidth: 'md',
    primaryButton: {
      text: 'Get Started',
      href: '#',
    },
    secondaryButton: {
      text: 'API Reference',
      href: '#',
    },
  },
};

export const RightAligned: Story = {
  args: {
    headline: 'About our studio',
    subheadline: 'We are a small team of designers and developers creating thoughtful digital products.',
    align: 'right',
    maxWidth: 'md',
    primaryButton: {
      text: 'Our Work',
      href: '#',
    },
  },
};

export const LongForm: Story = {
  args: {
    headline: 'The future of sustainable design',
    subheadline:
      'How thoughtful choices in digital product design can contribute to a more sustainable world',
    description:
      'In this series, we explore the intersection of technology and environmental responsibility, examining how design decisions impact energy consumption, user behavior, and planetary health.',
    align: 'left',
    maxWidth: 'lg',
    primaryButton: {
      text: 'Start Reading',
      href: '#',
    },
  },
};

export const HeadlineOnly: Story = {
  args: {
    headline: 'Simple. Elegant. Powerful.',
    align: 'center',
    maxWidth: 'sm',
  },
};

export const Editorial: Story = {
  args: {
    headline: 'Issue 47: The Art of Digital Minimalism',
    subheadline: 'Published March 2024',
    description:
      'An exploration of how reducing digital clutter can lead to more focused, meaningful work and improved well-being.',
    align: 'left',
    maxWidth: 'md',
    primaryButton: {
      text: 'Read Article',
      href: '#',
    },
    secondaryButton: {
      text: 'All Issues',
      href: '#',
    },
  },
};

export const WidthVariations: Story = {
  args: {
    headline: 'Exploring different content widths',
    subheadline: 'The maxWidth prop controls how wide the content can stretch',
    align: 'left',
    maxWidth: 'xl',
    primaryButton: {
      text: 'Learn More',
      href: '#',
    },
  },
};
