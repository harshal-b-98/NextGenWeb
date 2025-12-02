import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HeroGradient } from './HeroGradient';

const meta: Meta<typeof HeroGradient> = {
  title: 'Marketing/Heroes/HeroGradient',
  component: HeroGradient,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A vibrant hero with gradient background and centered content. Creates visual impact for brand-focused pages.',
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
    gradientFrom: {
      control: 'text',
      description: 'Gradient start color (Tailwind class)',
    },
    gradientTo: {
      control: 'text',
      description: 'Gradient end color (Tailwind class)',
    },
    gradientDirection: {
      control: 'select',
      options: ['to-r', 'to-l', 'to-b', 'to-t', 'to-br', 'to-bl'],
      description: 'Gradient direction',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeroGradient>;

export const Default: Story = {
  args: {
    headline: 'Unleash your creative potential',
    subheadline: 'Where imagination meets innovation',
    description:
      'Join millions of creators who use our platform to bring their ideas to life. Start your creative journey today.',
    primaryButton: {
      text: 'Start Creating',
      href: '#',
    },
    secondaryButton: {
      text: 'View Gallery',
      href: '#',
    },
    badge: 'New Features',
  },
};

export const PurpleToBlue: Story = {
  args: {
    headline: 'The future of AI is here',
    subheadline: 'Transform your workflow with intelligent automation',
    description:
      'Experience the power of machine learning without the complexity. Our AI handles the heavy lifting so you can focus on what matters.',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-blue-500',
    gradientDirection: 'to-br',
    primaryButton: {
      text: 'Try AI Assistant',
      href: '#',
    },
    secondaryButton: {
      text: 'See Examples',
      href: '#',
    },
    badge: 'AI Powered',
  },
};

export const OrangeToRed: Story = {
  args: {
    headline: 'Ignite your passion',
    subheadline: 'Bold ideas deserve bold execution',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-600',
    gradientDirection: 'to-r',
    primaryButton: {
      text: 'Get Started',
      href: '#',
    },
  },
};

export const GreenToTeal: Story = {
  args: {
    headline: 'Sustainable solutions for a better tomorrow',
    subheadline: 'Building a greener future together',
    description:
      'Our eco-friendly platform helps businesses reduce their carbon footprint while improving efficiency.',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-teal-400',
    gradientDirection: 'to-br',
    primaryButton: {
      text: 'Learn More',
      href: '#',
    },
    secondaryButton: {
      text: 'See Impact',
      href: '#',
    },
    badge: 'Carbon Neutral',
  },
};

export const DarkGradient: Story = {
  args: {
    headline: 'Premium experiences for discerning users',
    subheadline: 'Luxury meets functionality',
    description:
      'Discover our exclusive collection designed for those who demand the best.',
    gradientFrom: 'from-gray-900',
    gradientTo: 'to-gray-700',
    gradientDirection: 'to-b',
    primaryButton: {
      text: 'Explore Collection',
      href: '#',
    },
    secondaryButton: {
      text: 'Book Consultation',
      href: '#',
    },
    badge: 'Exclusive',
  },
};

export const PinkToViolet: Story = {
  args: {
    headline: 'Where creativity blooms',
    subheadline: 'Express yourself without limits',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-violet-600',
    gradientDirection: 'to-bl',
    primaryButton: {
      text: 'Join Community',
      href: '#',
    },
  },
};
