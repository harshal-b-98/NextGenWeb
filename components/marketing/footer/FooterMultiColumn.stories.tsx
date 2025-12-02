import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FooterMultiColumn } from './FooterMultiColumn';

const meta: Meta<typeof FooterMultiColumn> = {
  title: 'Marketing/Footer/FooterMultiColumn',
  component: FooterMultiColumn,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A comprehensive footer with multiple link columns, newsletter signup, and social links.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    background: {
      control: 'radio',
      options: ['light', 'dark'],
      description: 'Background style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FooterMultiColumn>;

const defaultLinkGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Documentation', href: '/docs' },
      { label: 'Contact', href: '/contact' },
      { label: 'Status', href: '/status' },
    ],
  },
];

export const Default: Story = {
  args: {
    companyName: 'Acme Inc',
    description: 'Building the future of work with innovative tools and solutions for modern teams.',
    linkGroups: defaultLinkGroups,
    socialLinks: [
      { platform: 'twitter', href: 'https://twitter.com' },
      { platform: 'github', href: 'https://github.com' },
      { platform: 'linkedin', href: 'https://linkedin.com' },
    ],
    newsletter: {
      headline: 'Subscribe to our newsletter',
      description: 'Get the latest news and updates.',
      placeholder: 'Enter your email',
      buttonText: 'Subscribe',
    },
    bottomLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookies', href: '/cookies' },
    ],
    background: 'dark',
  },
};

export const LightBackground: Story = {
  args: {
    companyName: 'Startup',
    description: 'Empowering businesses with cutting-edge technology solutions.',
    linkGroups: defaultLinkGroups,
    socialLinks: [
      { platform: 'twitter', href: 'https://twitter.com' },
      { platform: 'instagram', href: 'https://instagram.com' },
      { platform: 'linkedin', href: 'https://linkedin.com' },
    ],
    newsletter: {
      headline: 'Stay updated',
      description: 'Weekly insights delivered to your inbox.',
      placeholder: 'you@example.com',
      buttonText: 'Join',
    },
    bottomLinks: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
    background: 'light',
  },
};

export const WithoutNewsletter: Story = {
  args: {
    companyName: 'TechCorp',
    description: 'Leading innovation in enterprise software since 2010.',
    linkGroups: [
      {
        title: 'Solutions',
        links: [
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Small Business', href: '/small-business' },
          { label: 'Startups', href: '/startups' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'Documentation', href: '/docs' },
          { label: 'API Reference', href: '/api' },
          { label: 'Guides', href: '/guides' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About Us', href: '/about' },
          { label: 'Careers', href: '/careers' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ],
    socialLinks: [
      { platform: 'twitter', href: 'https://twitter.com' },
      { platform: 'github', href: 'https://github.com' },
      { platform: 'youtube', href: 'https://youtube.com' },
    ],
    bottomLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Security', href: '/security' },
    ],
    background: 'dark',
  },
};

export const MinimalLinks: Story = {
  args: {
    companyName: 'Simple',
    description: 'Simple solutions for complex problems.',
    linkGroups: [
      {
        title: 'Quick Links',
        links: [
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ],
    socialLinks: [
      { platform: 'twitter', href: 'https://twitter.com' },
      { platform: 'linkedin', href: 'https://linkedin.com' },
    ],
    newsletter: {
      headline: 'Newsletter',
      placeholder: 'Email address',
      buttonText: 'Sign up',
    },
    bottomLinks: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
    background: 'dark',
  },
};

export const SaaSFooter: Story = {
  args: {
    companyName: 'CloudApp',
    description: 'The all-in-one platform for building, deploying, and scaling your applications.',
    linkGroups: [
      {
        title: 'Product',
        links: [
          { label: 'Features', href: '/features' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Security', href: '/security' },
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Changelog', href: '/changelog' },
        ],
      },
      {
        title: 'Developers',
        links: [
          { label: 'Documentation', href: '/docs' },
          { label: 'API Reference', href: '/api' },
          { label: 'SDKs', href: '/sdks' },
          { label: 'CLI', href: '/cli' },
          { label: 'Examples', href: '/examples' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Blog', href: '/blog' },
          { label: 'Careers', href: '/careers' },
          { label: 'Press Kit', href: '/press' },
          { label: 'Partners', href: '/partners' },
        ],
      },
    ],
    socialLinks: [
      { platform: 'twitter', href: 'https://twitter.com' },
      { platform: 'github', href: 'https://github.com' },
      { platform: 'linkedin', href: 'https://linkedin.com' },
      { platform: 'youtube', href: 'https://youtube.com' },
    ],
    newsletter: {
      headline: 'Product updates',
      description: 'Get notified about new features and releases.',
      placeholder: 'developer@company.com',
      buttonText: 'Subscribe',
    },
    bottomLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Settings', href: '/cookies' },
      { label: 'Sitemap', href: '/sitemap' },
    ],
    background: 'dark',
  },
};

export const EcommerceFooter: Story = {
  args: {
    companyName: 'ShopNow',
    description: 'Your one-stop destination for quality products at affordable prices.',
    linkGroups: [
      {
        title: 'Shop',
        links: [
          { label: 'New Arrivals', href: '/new' },
          { label: 'Best Sellers', href: '/best-sellers' },
          { label: 'Sale', href: '/sale' },
          { label: 'Gift Cards', href: '/gift-cards' },
        ],
      },
      {
        title: 'Help',
        links: [
          { label: 'FAQ', href: '/faq' },
          { label: 'Shipping', href: '/shipping' },
          { label: 'Returns', href: '/returns' },
          { label: 'Size Guide', href: '/size-guide' },
        ],
      },
      {
        title: 'About',
        links: [
          { label: 'Our Story', href: '/about' },
          { label: 'Sustainability', href: '/sustainability' },
          { label: 'Stores', href: '/stores' },
          { label: 'Careers', href: '/careers' },
        ],
      },
    ],
    socialLinks: [
      { platform: 'instagram', href: 'https://instagram.com' },
      { platform: 'facebook', href: 'https://facebook.com' },
      { platform: 'twitter', href: 'https://twitter.com' },
    ],
    newsletter: {
      headline: 'Get 10% off your first order',
      description: 'Subscribe for exclusive deals and new arrival alerts.',
      placeholder: 'Your email',
      buttonText: 'Join',
    },
    bottomLinks: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Accessibility', href: '/accessibility' },
    ],
    background: 'light',
  },
};
