import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NavigationMega } from './NavigationMega';

const meta: Meta<typeof NavigationMega> = {
  title: 'Marketing/Navigation/NavigationMega',
  component: NavigationMega,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An advanced navigation with mega dropdown menus, announcement bar, and rich content support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    sticky: {
      control: 'boolean',
      description: 'Make navigation sticky',
    },
    transparent: {
      control: 'boolean',
      description: 'Use transparent background',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavigationMega>;

const defaultIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export const Default: Story = {
  args: {
    companyName: 'TechCorp',
    items: [
      {
        label: 'Products',
        items: [
          {
            label: 'Analytics',
            href: '/products/analytics',
            description: 'Track and analyze your data',
            icon: defaultIcon,
          },
          {
            label: 'Automation',
            href: '/products/automation',
            description: 'Automate your workflows',
            icon: defaultIcon,
          },
          {
            label: 'Integrations',
            href: '/products/integrations',
            description: 'Connect with your tools',
            icon: defaultIcon,
          },
          {
            label: 'Security',
            href: '/products/security',
            description: 'Enterprise-grade protection',
            icon: defaultIcon,
          },
        ],
      },
      {
        label: 'Solutions',
        items: [
          {
            label: 'Enterprise',
            href: '/solutions/enterprise',
            description: 'For large organizations',
            icon: defaultIcon,
          },
          {
            label: 'Small Business',
            href: '/solutions/small-business',
            description: 'For growing teams',
            icon: defaultIcon,
          },
          {
            label: 'Startups',
            href: '/solutions/startups',
            description: 'For early-stage companies',
            icon: defaultIcon,
          },
        ],
      },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Docs', href: '/docs' },
    ],
    buttons: [
      { label: 'Sign In', href: '/login', variant: 'ghost' },
      { label: 'Start Free Trial', href: '/signup', variant: 'primary' },
    ],
    sticky: true,
  },
};

export const WithAnnouncement: Story = {
  args: {
    companyName: 'LaunchCo',
    announcement: {
      text: 'New features released!',
      link: {
        label: 'Learn more',
        href: '/changelog',
      },
      dismissible: true,
    },
    items: [
      {
        label: 'Products',
        items: [
          { label: 'Platform', href: '/platform', description: 'Our core product' },
          { label: 'API', href: '/api', description: 'Developer tools' },
          { label: 'Mobile', href: '/mobile', description: 'iOS and Android apps' },
        ],
      },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
    buttons: [
      { label: 'Log In', href: '/login', variant: 'outline' },
      { label: 'Get Started', href: '/signup', variant: 'primary' },
    ],
    sticky: true,
  },
};

export const SaaSNavigation: Story = {
  args: {
    companyName: 'CloudApp',
    announcement: {
      text: 'Join us at CloudConf 2024 - Early bird tickets available!',
      link: {
        label: 'Register now',
        href: '/cloudconf',
      },
    },
    items: [
      {
        label: 'Platform',
        items: [
          {
            label: 'Compute',
            href: '/platform/compute',
            description: 'Scalable cloud computing',
            icon: defaultIcon,
          },
          {
            label: 'Storage',
            href: '/platform/storage',
            description: 'Secure data storage',
            icon: defaultIcon,
          },
          {
            label: 'Database',
            href: '/platform/database',
            description: 'Managed databases',
            icon: defaultIcon,
          },
          {
            label: 'Networking',
            href: '/platform/networking',
            description: 'Global network infrastructure',
            icon: defaultIcon,
          },
        ],
      },
      {
        label: 'Developers',
        items: [
          {
            label: 'Documentation',
            href: '/docs',
            description: 'Guides and references',
            icon: defaultIcon,
          },
          {
            label: 'API Reference',
            href: '/api',
            description: 'Complete API documentation',
            icon: defaultIcon,
          },
          {
            label: 'SDKs',
            href: '/sdks',
            description: 'Client libraries',
            icon: defaultIcon,
          },
          {
            label: 'Examples',
            href: '/examples',
            description: 'Sample projects',
            icon: defaultIcon,
          },
        ],
      },
      {
        label: 'Resources',
        items: [
          { label: 'Blog', href: '/blog', description: 'News and updates' },
          { label: 'Case Studies', href: '/case-studies', description: 'Customer success stories' },
          { label: 'Webinars', href: '/webinars', description: 'Live and on-demand' },
          { label: 'Community', href: '/community', description: 'Join the discussion' },
        ],
      },
      { label: 'Pricing', href: '/pricing' },
    ],
    buttons: [
      { label: 'Sign In', href: '/login', variant: 'ghost' },
      { label: 'Start Building', href: '/signup', variant: 'primary' },
    ],
    sticky: true,
  },
};

export const MinimalWithDropdown: Story = {
  args: {
    companyName: 'Simple',
    items: [
      {
        label: 'Features',
        items: [
          { label: 'Feature A', href: '/features/a' },
          { label: 'Feature B', href: '/features/b' },
          { label: 'Feature C', href: '/features/c' },
        ],
      },
      { label: 'Pricing', href: '/pricing' },
      { label: 'About', href: '/about' },
    ],
    buttons: [{ label: 'Get Started', href: '/signup', variant: 'primary' }],
    sticky: true,
  },
};

export const EcommerceNavigation: Story = {
  args: {
    companyName: 'MegaStore',
    announcement: {
      text: 'Free shipping on orders over $50!',
      dismissible: false,
    },
    items: [
      {
        label: 'Shop',
        items: [
          {
            label: 'New Arrivals',
            href: '/new',
            description: 'Fresh styles just in',
            icon: defaultIcon,
          },
          {
            label: 'Best Sellers',
            href: '/best-sellers',
            description: 'Customer favorites',
            icon: defaultIcon,
          },
          {
            label: 'Sale',
            href: '/sale',
            description: 'Up to 50% off',
            icon: defaultIcon,
          },
          {
            label: 'Gift Cards',
            href: '/gift-cards',
            description: 'Perfect for any occasion',
            icon: defaultIcon,
          },
        ],
      },
      {
        label: 'Categories',
        items: [
          { label: 'Electronics', href: '/electronics', description: 'Tech & gadgets' },
          { label: 'Clothing', href: '/clothing', description: 'Fashion for all' },
          { label: 'Home & Living', href: '/home', description: 'Decor & essentials' },
          { label: 'Sports', href: '/sports', description: 'Fitness & outdoor' },
        ],
      },
      { label: 'Deals', href: '/deals' },
      { label: 'Support', href: '/support' },
    ],
    buttons: [
      { label: 'Account', href: '/account', variant: 'ghost' },
      { label: 'Cart (3)', href: '/cart', variant: 'primary' },
    ],
    sticky: true,
  },
};

export const NoAnnouncement: Story = {
  args: {
    companyName: 'Enterprise',
    items: [
      {
        label: 'Solutions',
        items: [
          {
            label: 'By Industry',
            href: '/solutions/industry',
            description: 'Healthcare, Finance, Retail',
            icon: defaultIcon,
          },
          {
            label: 'By Size',
            href: '/solutions/size',
            description: 'SMB to Enterprise',
            icon: defaultIcon,
          },
          {
            label: 'By Use Case',
            href: '/solutions/use-case',
            description: 'Common workflows',
            icon: defaultIcon,
          },
        ],
      },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Resources', href: '/resources' },
      { label: 'Partners', href: '/partners' },
    ],
    buttons: [
      { label: 'Contact Sales', href: '/contact', variant: 'outline' },
      { label: 'Request Demo', href: '/demo', variant: 'primary' },
    ],
    sticky: true,
  },
};
