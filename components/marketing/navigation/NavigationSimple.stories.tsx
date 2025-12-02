import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NavigationSimple } from './NavigationSimple';

const meta: Meta<typeof NavigationSimple> = {
  title: 'Marketing/Navigation/NavigationSimple',
  component: NavigationSimple,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A clean, straightforward navigation bar with logo, links, and CTA buttons.',
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
    centered: {
      control: 'boolean',
      description: 'Center navigation links',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavigationSimple>;

export const Default: Story = {
  args: {
    companyName: 'Acme',
    items: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
    ],
    buttons: [
      { label: 'Sign In', href: '/login', variant: 'ghost' },
      { label: 'Get Started', href: '/signup', variant: 'primary' },
    ],
    sticky: true,
  },
};

export const WithDropdowns: Story = {
  args: {
    companyName: 'TechCorp',
    items: [
      {
        label: 'Products',
        items: [
          { label: 'Analytics', href: '/products/analytics' },
          { label: 'Automation', href: '/products/automation' },
          { label: 'Integrations', href: '/products/integrations' },
        ],
      },
      {
        label: 'Solutions',
        items: [
          { label: 'Enterprise', href: '/solutions/enterprise' },
          { label: 'Small Business', href: '/solutions/small-business' },
          { label: 'Startups', href: '/solutions/startups' },
        ],
      },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Resources', href: '/resources' },
    ],
    buttons: [
      { label: 'Log In', href: '/login', variant: 'outline' },
      { label: 'Start Free Trial', href: '/signup', variant: 'primary' },
    ],
    sticky: true,
  },
};

export const Centered: Story = {
  args: {
    companyName: 'Brand',
    items: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Contact', href: '/contact' },
    ],
    buttons: [{ label: 'Get Quote', href: '/quote', variant: 'primary' }],
    centered: true,
    sticky: true,
  },
};

export const MinimalLinks: Story = {
  args: {
    companyName: 'Simple',
    items: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
    ],
    buttons: [{ label: 'Sign Up', href: '/signup', variant: 'primary' }],
    sticky: true,
  },
};

export const NoButtons: Story = {
  args: {
    companyName: 'InfoSite',
    items: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Portfolio', href: '/portfolio' },
      { label: 'Contact', href: '/contact' },
    ],
    sticky: true,
  },
};

export const MultipleButtons: Story = {
  args: {
    companyName: 'SaaS App',
    items: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Docs', href: '/docs' },
    ],
    buttons: [
      { label: 'Log In', href: '/login', variant: 'ghost' },
      { label: 'Sign Up Free', href: '/signup', variant: 'outline' },
      { label: 'Request Demo', href: '/demo', variant: 'primary' },
    ],
    sticky: true,
  },
};

export const Transparent: Story = {
  args: {
    companyName: 'Hero Site',
    items: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'About', href: '/about' },
    ],
    buttons: [
      { label: 'Log In', href: '/login', variant: 'ghost' },
      { label: 'Get Started', href: '/signup', variant: 'primary' },
    ],
    sticky: false,
    transparent: true,
  },
  decorators: [
    (Story) => (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 min-h-[300px]">
        <Story />
      </div>
    ),
  ],
};

export const EcommerceStyle: Story = {
  args: {
    companyName: 'Shop',
    items: [
      {
        label: 'Categories',
        items: [
          { label: 'Electronics', href: '/electronics' },
          { label: 'Clothing', href: '/clothing' },
          { label: 'Home & Garden', href: '/home-garden' },
          { label: 'Sports', href: '/sports' },
        ],
      },
      { label: 'Deals', href: '/deals' },
      { label: 'New Arrivals', href: '/new' },
      { label: 'Support', href: '/support' },
    ],
    buttons: [
      { label: 'Account', href: '/account', variant: 'ghost' },
      { label: 'Cart (3)', href: '/cart', variant: 'primary' },
    ],
    sticky: true,
  },
};
