import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FeaturesAlternating } from './FeaturesAlternating';

const RocketIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const PuzzleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const sampleFeatures = [
  {
    title: 'Streamlined Onboarding',
    description: 'Get up and running in minutes with our intuitive setup wizard. Our step-by-step guide walks you through the entire process, from initial configuration to your first deployment. No technical expertise required.',
    icon: <RocketIcon />,
    imageSrc: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
    imageAlt: 'Team working on onboarding process',
    href: '#',
  },
  {
    title: 'Seamless Integrations',
    description: 'Connect with your favorite tools and services effortlessly. Our platform integrates with over 100+ popular applications, enabling you to create powerful automated workflows without writing a single line of code.',
    icon: <PuzzleIcon />,
    imageSrc: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    imageAlt: 'Integration dashboard showing connected apps',
    href: '#',
  },
  {
    title: 'Real-time Analytics',
    description: 'Make data-driven decisions with comprehensive analytics and reporting. Track key metrics, monitor performance, and gain actionable insights with our powerful analytics dashboard.',
    icon: <ChartBarIcon />,
    imageSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    imageAlt: 'Analytics dashboard with charts and graphs',
    href: '#',
  },
];

const meta: Meta<typeof FeaturesAlternating> = {
  title: 'Marketing/Features/FeaturesAlternating',
  component: FeaturesAlternating,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Alternating image and text sections that create visual rhythm. Ideal for detailed feature explanations with supporting visuals.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    imagePosition: {
      control: 'radio',
      options: ['alternating', 'left', 'right'],
      description: 'Position of images relative to content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeaturesAlternating>;

export const Default: Story = {
  args: {
    headline: 'How it works',
    subheadline: 'Our platform makes it easy to go from idea to launch in three simple steps.',
    features: sampleFeatures,
    imagePosition: 'alternating',
  },
};

export const ImagesLeft: Story = {
  args: {
    headline: 'Platform Features',
    subheadline: 'Discover the powerful features that set us apart.',
    features: sampleFeatures,
    imagePosition: 'left',
  },
};

export const ImagesRight: Story = {
  args: {
    headline: 'Why Choose Us',
    subheadline: 'Here\'s what makes our platform the best choice for your business.',
    features: sampleFeatures,
    imagePosition: 'right',
  },
};

export const WithoutImages: Story = {
  args: {
    headline: 'Our Process',
    features: sampleFeatures.map(f => ({ ...f, imageSrc: undefined, imageAlt: undefined })),
    imagePosition: 'alternating',
  },
};

export const WithoutHeader: Story = {
  args: {
    features: sampleFeatures,
    imagePosition: 'alternating',
  },
};

export const SingleFeature: Story = {
  args: {
    headline: 'Key Feature',
    features: [sampleFeatures[0]],
  },
};
