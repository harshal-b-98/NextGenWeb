import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HeroSplit } from './HeroSplit';

const meta: Meta<typeof HeroSplit> = {
  title: 'Marketing/Heroes/HeroSplit',
  component: HeroSplit,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A split-screen hero with content on one side and an image on the other. Ideal for showcasing products or services visually.',
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
    imageSrc: {
      control: 'text',
      description: 'Image source URL',
    },
    imageAlt: {
      control: 'text',
      description: 'Image alt text for accessibility',
    },
    imagePosition: {
      control: 'radio',
      options: ['left', 'right'],
      description: 'Position of the image',
    },
    imageOverlay: {
      control: 'boolean',
      description: 'Add gradient overlay to image',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeroSplit>;

export const Default: Story = {
  args: {
    headline: 'Design tools for the modern creator',
    subheadline: 'Create stunning visuals in minutes',
    description:
      'Our intuitive design platform empowers teams to create professional graphics, presentations, and marketing materials without any design experience.',
    imageSrc: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
    imageAlt: 'Team collaboration on design project',
    imagePosition: 'right',
    primaryButton: {
      text: 'Start Creating',
      href: '#',
    },
    secondaryButton: {
      text: 'View Templates',
      href: '#',
    },
  },
};

export const ImageLeft: Story = {
  args: {
    headline: 'Collaborate without boundaries',
    subheadline: 'Work together from anywhere in the world',
    description:
      'Real-time collaboration features let your team work together seamlessly, no matter where they are.',
    imageSrc: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
    imageAlt: 'Remote team collaboration',
    imagePosition: 'left',
    primaryButton: {
      text: 'Try Free',
      href: '#',
    },
  },
};

export const WithOverlay: Story = {
  args: {
    headline: 'Professional photography made easy',
    subheadline: 'Capture moments that matter',
    description:
      'Advanced AI-powered editing tools help you achieve professional results with every shot.',
    imageSrc: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=600&fit=crop',
    imageAlt: 'Professional camera setup',
    imagePosition: 'right',
    imageOverlay: true,
    primaryButton: {
      text: 'Learn More',
      href: '#',
    },
    secondaryButton: {
      text: 'See Gallery',
      href: '#',
    },
  },
};

export const ProductShowcase: Story = {
  args: {
    headline: 'The new standard in ergonomic design',
    subheadline: 'Comfort meets productivity',
    imageSrc: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=600&fit=crop',
    imageAlt: 'Ergonomic workspace setup',
    imagePosition: 'right',
    primaryButton: {
      text: 'Shop Now',
      href: '#',
    },
    secondaryButton: {
      text: 'Learn About Design',
      href: '#',
    },
  },
};

export const MinimalContent: Story = {
  args: {
    headline: 'Simplicity in every detail',
    imageSrc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop',
    imageAlt: 'Minimal abstract design',
    imagePosition: 'left',
    primaryButton: {
      text: 'Discover',
      href: '#',
    },
  },
};
