import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HeroVideo } from './HeroVideo';

const meta: Meta<typeof HeroVideo> = {
  title: 'Marketing/Heroes/HeroVideo',
  component: HeroVideo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A hero section with video background for maximum visual engagement. Perfect for immersive brand experiences.',
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
    videoSrc: {
      control: 'text',
      description: 'Video source URL',
    },
    videoPoster: {
      control: 'text',
      description: 'Poster image shown while video loads',
    },
    overlayOpacity: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
      description: 'Opacity of the dark overlay (0-100)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeroVideo>;

// Using sample video URLs - in production, these would be real video files
const sampleVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
const samplePosterUrl = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=1080&fit=crop';

export const Default: Story = {
  args: {
    headline: 'Experience the extraordinary',
    subheadline: 'Where moments become memories',
    description:
      'Immerse yourself in stunning visuals and unforgettable experiences. Our platform brings your vision to life.',
    videoSrc: sampleVideoUrl,
    videoPoster: samplePosterUrl,
    overlayOpacity: 50,
    primaryButton: {
      text: 'Watch Story',
      href: '#',
    },
    secondaryButton: {
      text: 'Explore More',
      href: '#',
    },
  },
};

export const LightOverlay: Story = {
  args: {
    headline: 'Capture every moment',
    subheadline: 'Professional video production made simple',
    videoSrc: sampleVideoUrl,
    videoPoster: samplePosterUrl,
    overlayOpacity: 30,
    primaryButton: {
      text: 'Start Recording',
      href: '#',
    },
  },
};

export const DarkOverlay: Story = {
  args: {
    headline: 'Bold stories deserve bold visuals',
    subheadline: 'Create cinematic experiences',
    description:
      'From concept to final cut, our tools help you tell stories that captivate audiences.',
    videoSrc: sampleVideoUrl,
    videoPoster: samplePosterUrl,
    overlayOpacity: 70,
    primaryButton: {
      text: 'Get Started',
      href: '#',
    },
    secondaryButton: {
      text: 'View Portfolio',
      href: '#',
    },
  },
};

export const MinimalContent: Story = {
  args: {
    headline: 'Adventure awaits',
    videoSrc: sampleVideoUrl,
    videoPoster: samplePosterUrl,
    overlayOpacity: 40,
    primaryButton: {
      text: 'Begin Journey',
      href: '#',
    },
  },
};

export const FullContent: Story = {
  args: {
    headline: 'Redefine what\'s possible',
    subheadline: 'Push the boundaries of creativity',
    description:
      'Join a community of innovators and dreamers. Together, we\'re building the future of digital experiences.',
    videoSrc: sampleVideoUrl,
    videoPoster: samplePosterUrl,
    overlayOpacity: 55,
    primaryButton: {
      text: 'Join Now',
      href: '#',
    },
    secondaryButton: {
      text: 'Learn More',
      href: '#',
    },
  },
};
