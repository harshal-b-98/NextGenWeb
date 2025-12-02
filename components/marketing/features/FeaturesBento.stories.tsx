import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FeaturesBento } from './FeaturesBento';

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const LightningIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const bentoFeatures = [
  {
    title: 'AI-Powered Automation',
    description: 'Leverage cutting-edge AI to automate repetitive tasks and boost productivity across your entire organization.',
    imageSrc: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
    imageAlt: 'AI visualization',
    href: '#',
  },
  {
    title: 'Lightning Fast',
    description: 'Built for speed with optimized performance at every level.',
    icon: <LightningIcon />,
    href: '#',
  },
  {
    title: 'Enterprise Security',
    description: 'Bank-grade encryption and compliance certifications.',
    icon: <ShieldIcon />,
    href: '#',
  },
  {
    title: 'Global Scale',
    description: 'Deploy worldwide with our distributed infrastructure.',
    icon: <GlobeIcon />,
  },
  {
    title: 'Magic Features',
    description: 'Discover powerful tools that feel like magic.',
    icon: <SparklesIcon />,
  },
];

const meta: Meta<typeof FeaturesBento> = {
  title: 'Marketing/Features/FeaturesBento',
  component: FeaturesBento,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A modern bento box layout with varying sizes to create visual hierarchy. Perfect for highlighting key features with different levels of importance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'asymmetric', 'hero-left', 'hero-right'],
      description: 'Layout variant for the bento grid',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeaturesBento>;

export const Default: Story = {
  args: {
    headline: 'Powerful Features',
    subheadline: 'Everything you need to build, deploy, and scale your applications.',
    features: bentoFeatures,
    variant: 'default',
  },
};

export const Asymmetric: Story = {
  args: {
    headline: 'Platform Highlights',
    subheadline: 'Discover the features that make us unique.',
    features: bentoFeatures,
    variant: 'asymmetric',
  },
};

export const HeroLeft: Story = {
  args: {
    headline: 'Key Capabilities',
    features: bentoFeatures.slice(0, 4),
    variant: 'hero-left',
  },
};

export const HeroRight: Story = {
  args: {
    headline: 'Why Choose Us',
    subheadline: 'The right tools for the job.',
    features: bentoFeatures.slice(0, 4),
    variant: 'hero-right',
  },
};

export const WithoutImages: Story = {
  args: {
    headline: 'Core Features',
    features: [
      {
        title: 'Smart Automation',
        description: 'Automate workflows and save time with intelligent automation.',
        icon: <SparklesIcon />,
      },
      {
        title: 'Fast Performance',
        description: 'Optimized for speed at every level.',
        icon: <LightningIcon />,
      },
      {
        title: 'Secure by Default',
        description: 'Enterprise-grade security built in.',
        icon: <ShieldIcon />,
      },
      {
        title: 'Global Reach',
        description: 'Deploy anywhere in the world.',
        icon: <GlobeIcon />,
      },
    ],
    variant: 'default',
  },
};

export const AllImages: Story = {
  args: {
    headline: 'Visual Showcase',
    features: [
      {
        title: 'Design Tools',
        description: 'Professional design capabilities at your fingertips.',
        imageSrc: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
        imageAlt: 'Design tools',
        href: '#',
      },
      {
        title: 'Collaboration',
        description: 'Work together in real-time.',
        imageSrc: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
        imageAlt: 'Team collaboration',
        href: '#',
      },
      {
        title: 'Analytics',
        description: 'Insights that drive decisions.',
        imageSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
        imageAlt: 'Analytics dashboard',
        href: '#',
      },
      {
        title: 'Development',
        description: 'Build with modern tools.',
        imageSrc: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
        imageAlt: 'Code editor',
        href: '#',
      },
    ],
    variant: 'asymmetric',
  },
};
