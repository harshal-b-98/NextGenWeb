import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FeaturesGrid } from './FeaturesGrid';

// Sample icons using SVG
const ZapIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CloudIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const sampleFeatures = [
  {
    title: 'Lightning Fast',
    description: 'Experience blazing fast performance with our optimized infrastructure and smart caching.',
    icon: <ZapIcon />,
    href: '#',
  },
  {
    title: 'Enterprise Security',
    description: 'Bank-grade encryption and security measures to keep your data safe and compliant.',
    icon: <ShieldIcon />,
    href: '#',
  },
  {
    title: 'Advanced Analytics',
    description: 'Gain insights with real-time analytics and customizable dashboards.',
    icon: <ChartIcon />,
    href: '#',
  },
  {
    title: 'Cloud Native',
    description: 'Built for the cloud with auto-scaling and high availability.',
    icon: <CloudIcon />,
  },
  {
    title: 'Developer First',
    description: 'Comprehensive APIs, SDKs, and documentation for seamless integration.',
    icon: <CodeIcon />,
  },
  {
    title: 'Team Collaboration',
    description: 'Work together seamlessly with real-time collaboration features.',
    icon: <UsersIcon />,
  },
];

const meta: Meta<typeof FeaturesGrid> = {
  title: 'Marketing/Features/FeaturesGrid',
  component: FeaturesGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A clean grid layout showcasing features with icons and descriptions. Best for highlighting multiple product features or services.',
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
    iconStyle: {
      control: 'radio',
      options: ['circle', 'square', 'none'],
      description: 'Style of the icon container',
    },
    alignment: {
      control: 'radio',
      options: ['left', 'center'],
      description: 'Text alignment',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeaturesGrid>;

export const Default: Story = {
  args: {
    headline: 'Everything you need to succeed',
    subheadline: 'Our platform provides all the tools and features you need to build, deploy, and scale your applications.',
    features: sampleFeatures,
    columns: 3,
    iconStyle: 'circle',
    alignment: 'center',
  },
};

export const TwoColumns: Story = {
  args: {
    headline: 'Key Features',
    subheadline: 'Discover what makes our platform unique.',
    features: sampleFeatures.slice(0, 4),
    columns: 2,
    iconStyle: 'square',
    alignment: 'left',
  },
};

export const FourColumns: Story = {
  args: {
    headline: 'Platform Capabilities',
    features: sampleFeatures.slice(0, 4),
    columns: 4,
    iconStyle: 'circle',
    alignment: 'center',
  },
};

export const LeftAligned: Story = {
  args: {
    headline: 'Why choose us',
    subheadline: 'Here are the reasons why thousands of companies trust our platform.',
    features: sampleFeatures,
    columns: 3,
    iconStyle: 'square',
    alignment: 'left',
  },
};

export const NoIcons: Story = {
  args: {
    headline: 'Our Services',
    features: sampleFeatures.map(f => ({ ...f, icon: undefined })),
    columns: 3,
    iconStyle: 'none',
    alignment: 'center',
  },
};

export const WithoutHeader: Story = {
  args: {
    features: sampleFeatures,
    columns: 3,
    iconStyle: 'circle',
    alignment: 'center',
  },
};
