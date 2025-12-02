import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FooterSimple } from './FooterSimple';

const meta: Meta<typeof FooterSimple> = {
  title: 'Marketing/Footer/FooterSimple',
  component: FooterSimple,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A clean, minimal footer with logo, navigation links, and social icons in a single row layout.',
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
type Story = StoryObj<typeof FooterSimple>;

export const Default: Story = {
  args: {
    companyName: 'Acme Inc',
    linkGroups: [
      {
        title: 'Links',
        links: [
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
          { label: 'Features', href: '/features' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ],
    socialLinks: [
      { platform: 'twitter', href: 'https://twitter.com' },
      { platform: 'github', href: 'https://github.com' },
      { platform: 'linkedin', href: 'https://linkedin.com' },
    ],
    bottomLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
    background: 'dark',
  },
};

export const LightBackground: Story = {
  args: {
    companyName: 'Startup',
    linkGroups: [
      {
        title: 'Navigation',
        links: [
          { label: 'Product', href: '/product' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Blog', href: '/blog' },
          { label: 'Support', href: '/support' },
        ],
      },
    ],
    socialLinks: [
      { platform: 'twitter', href: 'https://twitter.com' },
      { platform: 'instagram', href: 'https://instagram.com' },
      { platform: 'youtube', href: 'https://youtube.com' },
    ],
    bottomLinks: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Cookies', href: '/cookies' },
    ],
    background: 'light',
  },
};

export const MinimalLinks: Story = {
  args: {
    companyName: 'Brand',
    linkGroups: [
      {
        title: 'Main',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ],
    socialLinks: [
      { platform: 'twitter', href: 'https://twitter.com' },
      { platform: 'linkedin', href: 'https://linkedin.com' },
    ],
    background: 'dark',
  },
};

export const AllSocialPlatforms: Story = {
  args: {
    companyName: 'Social Co',
    linkGroups: [
      {
        title: 'Links',
        links: [
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ],
    socialLinks: [
      { platform: 'twitter', href: 'https://twitter.com' },
      { platform: 'facebook', href: 'https://facebook.com' },
      { platform: 'instagram', href: 'https://instagram.com' },
      { platform: 'linkedin', href: 'https://linkedin.com' },
      { platform: 'github', href: 'https://github.com' },
      { platform: 'youtube', href: 'https://youtube.com' },
    ],
    bottomLinks: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
    background: 'dark',
  },
};

export const CustomCopyright: Story = {
  args: {
    companyName: 'TechCorp',
    copyright: 'Made with love in San Francisco. All rights reserved.',
    linkGroups: [
      {
        title: 'Navigation',
        links: [
          { label: 'Features', href: '/features' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Blog', href: '/blog' },
        ],
      },
    ],
    socialLinks: [
      { platform: 'twitter', href: 'https://twitter.com' },
      { platform: 'github', href: 'https://github.com' },
    ],
    background: 'dark',
  },
};

export const NoSocialLinks: Story = {
  args: {
    companyName: 'Simple Inc',
    linkGroups: [
      {
        title: 'Main',
        links: [
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
          { label: 'Services', href: '/services' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ],
    bottomLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
    ],
    background: 'light',
  },
};
