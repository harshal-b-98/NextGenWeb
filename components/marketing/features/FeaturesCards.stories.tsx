import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FeaturesCards } from './FeaturesCards';

const CubeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const DatabaseIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const ServerIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

const CloudIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

const cardFeatures = [
  {
    title: 'Components',
    description: 'Pre-built, customizable components for rapid development. Start building faster with our extensive library.',
    icon: <CubeIcon />,
    href: '#components',
  },
  {
    title: 'Database',
    description: 'Scalable database solutions with automatic backups and real-time synchronization across all your devices.',
    icon: <DatabaseIcon />,
    href: '#database',
  },
  {
    title: 'Hosting',
    description: 'Deploy anywhere with one click. Global CDN, auto-scaling, and 99.99% uptime guaranteed.',
    icon: <ServerIcon />,
    href: '#hosting',
  },
  {
    title: 'Cloud Functions',
    description: 'Serverless functions that scale automatically. Pay only for what you use with no infrastructure management.',
    icon: <CloudIcon />,
    href: '#functions',
  },
];

const cardFeaturesWithImages = [
  {
    title: 'Design System',
    description: 'A comprehensive design system with tokens, components, and patterns.',
    imageSrc: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop',
    imageAlt: 'Design system preview',
    href: '#',
  },
  {
    title: 'Developer Tools',
    description: 'Powerful CLI and IDE extensions to boost your productivity.',
    imageSrc: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop',
    imageAlt: 'Developer tools',
    href: '#',
  },
  {
    title: 'Documentation',
    description: 'Comprehensive docs, tutorials, and API references.',
    imageSrc: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop',
    imageAlt: 'Documentation',
    href: '#',
  },
];

const meta: Meta<typeof FeaturesCards> = {
  title: 'Marketing/Features/FeaturesCards',
  component: FeaturesCards,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Card-based feature showcase with hover effects and optional links. Great for clickable feature sections that lead to detail pages.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    columns: {
      control: 'radio',
      options: [2, 3, 4],
      description: 'Number of columns in the grid',
    },
    cardStyle: {
      control: 'radio',
      options: ['elevated', 'bordered', 'filled'],
      description: 'Visual style of the cards',
    },
    showArrows: {
      control: 'boolean',
      description: 'Show arrow indicators on clickable cards',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeaturesCards>;

export const Default: Story = {
  args: {
    headline: 'Platform Features',
    subheadline: 'Everything you need to build modern applications.',
    features: cardFeatures,
    columns: 4,
    cardStyle: 'elevated',
    showArrows: true,
  },
};

export const Bordered: Story = {
  args: {
    headline: 'Our Services',
    subheadline: 'Explore our comprehensive service offerings.',
    features: cardFeatures,
    columns: 4,
    cardStyle: 'bordered',
    showArrows: true,
  },
};

export const Filled: Story = {
  args: {
    headline: 'Solutions',
    features: cardFeatures,
    columns: 2,
    cardStyle: 'filled',
    showArrows: true,
  },
};

export const ThreeColumns: Story = {
  args: {
    headline: 'Developer Resources',
    subheadline: 'Everything you need to get started.',
    features: cardFeaturesWithImages,
    columns: 3,
    cardStyle: 'elevated',
    showArrows: true,
  },
};

export const WithImages: Story = {
  args: {
    headline: 'Featured Resources',
    subheadline: 'Explore our most popular tools and guides.',
    features: cardFeaturesWithImages,
    columns: 3,
    cardStyle: 'bordered',
    showArrows: true,
  },
};

export const NoArrows: Story = {
  args: {
    headline: 'Platform Overview',
    features: cardFeatures.map(f => ({ ...f, href: undefined })),
    columns: 4,
    cardStyle: 'elevated',
    showArrows: false,
  },
};

export const TwoColumnsBordered: Story = {
  args: {
    headline: 'Key Offerings',
    subheadline: 'Choose the solution that fits your needs.',
    features: cardFeatures.slice(0, 2),
    columns: 2,
    cardStyle: 'bordered',
    showArrows: true,
  },
};
