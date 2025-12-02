import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PricingCards } from './PricingCards';
import type { PricingTier } from './types';

const meta: Meta<typeof PricingCards> = {
  title: 'Marketing/Pricing/PricingCards',
  component: PricingCards,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Card-based pricing display with clear visual hierarchy. Perfect for simple pricing with highlighted recommended plans.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showToggle: {
      control: 'boolean',
      description: 'Show monthly/yearly billing toggle',
    },
    defaultBilling: {
      control: 'radio',
      options: ['monthly', 'yearly'],
      description: 'Default billing period',
    },
    columns: {
      control: 'radio',
      options: [2, 3, 4],
      description: 'Number of columns in grid',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PricingCards>;

const basicTiers: PricingTier[] = [
  {
    name: 'Basic',
    description: 'Everything you need to get started',
    price: { monthly: 9, yearly: 7 },
    features: [
      { text: '5 projects', included: true },
      { text: '10GB storage', included: true },
      { text: 'Basic support', included: true },
      { text: 'Core features', included: true },
      { text: 'API access', included: false },
      { text: 'Custom domain', included: false },
    ],
    buttonText: 'Get Started',
    buttonHref: '/signup?plan=basic',
  },
  {
    name: 'Pro',
    description: 'Best for growing businesses',
    price: { monthly: 29, yearly: 24 },
    features: [
      { text: 'Unlimited projects', included: true },
      { text: '100GB storage', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced features', included: true },
      { text: 'API access', included: true },
      { text: 'Custom domain', included: false },
    ],
    buttonText: 'Go Pro',
    buttonHref: '/signup?plan=pro',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    description: 'For large scale operations',
    price: { monthly: 99, yearly: 79 },
    features: [
      { text: 'Unlimited projects', included: true },
      { text: 'Unlimited storage', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'All features', included: true },
      { text: 'Full API access', included: true },
      { text: 'Custom domain', included: true },
    ],
    buttonText: 'Contact Sales',
    buttonHref: '/contact?plan=enterprise',
  },
];

export const Default: Story = {
  args: {
    headline: 'Choose your plan',
    subheadline: 'Start free, upgrade when you need to. No hidden fees.',
    tiers: basicTiers,
    showToggle: true,
    defaultBilling: 'monthly',
    yearlyDiscount: 'Save 20%',
    columns: 3,
  },
};

export const TwoColumns: Story = {
  args: {
    headline: 'Simple pricing',
    subheadline: 'Two plans to fit your needs.',
    tiers: [
      {
        name: 'Free',
        description: 'Perfect for trying out',
        price: { monthly: 'Free', yearly: 'Free' },
        features: [
          { text: '3 projects', included: true },
          { text: '1GB storage', included: true },
          { text: 'Community support', included: true },
          { text: 'Basic features', included: true },
          { text: 'Priority support', included: false },
          { text: 'Advanced features', included: false },
        ],
        buttonText: 'Start Free',
        buttonHref: '/signup?plan=free',
      },
      {
        name: 'Premium',
        description: 'For serious creators',
        price: { monthly: 19, yearly: 15 },
        features: [
          { text: 'Unlimited projects', included: true },
          { text: '50GB storage', included: true },
          { text: 'Priority support', included: true },
          { text: 'All features', included: true },
          { text: 'Priority support', included: true },
          { text: 'Advanced features', included: true },
        ],
        buttonText: 'Go Premium',
        buttonHref: '/signup?plan=premium',
        highlighted: true,
        badge: 'Best Value',
      },
    ],
    showToggle: true,
    defaultBilling: 'monthly',
    columns: 2,
  },
};

export const FourColumns: Story = {
  args: {
    headline: 'Plans for every team size',
    subheadline: 'From solo creators to large enterprises.',
    tiers: [
      {
        name: 'Hobby',
        description: 'For personal projects',
        price: { monthly: 0, yearly: 0 },
        features: [
          { text: '1 project', included: true },
          { text: '500MB storage', included: true },
          { text: 'Community support', included: true },
        ],
        buttonText: 'Get Started',
        buttonHref: '/signup?plan=hobby',
      },
      {
        name: 'Starter',
        description: 'For small teams',
        price: { monthly: 15, yearly: 12 },
        features: [
          { text: '5 projects', included: true },
          { text: '5GB storage', included: true },
          { text: 'Email support', included: true },
        ],
        buttonText: 'Start Trial',
        buttonHref: '/signup?plan=starter',
      },
      {
        name: 'Professional',
        description: 'For growing businesses',
        price: { monthly: 49, yearly: 39 },
        features: [
          { text: '25 projects', included: true },
          { text: '50GB storage', included: true },
          { text: 'Priority support', included: true },
        ],
        buttonText: 'Start Trial',
        buttonHref: '/signup?plan=pro',
        highlighted: true,
        badge: 'Popular',
      },
      {
        name: 'Enterprise',
        description: 'For large organizations',
        price: { monthly: 149, yearly: 119 },
        features: [
          { text: 'Unlimited projects', included: true },
          { text: 'Unlimited storage', included: true },
          { text: 'Dedicated support', included: true },
        ],
        buttonText: 'Contact Sales',
        buttonHref: '/contact',
      },
    ],
    showToggle: true,
    defaultBilling: 'yearly',
    yearlyDiscount: '2 months free',
    columns: 4,
  },
};

export const NoToggle: Story = {
  args: {
    headline: 'Flat monthly pricing',
    subheadline: 'Simple, predictable pricing with no annual commitment.',
    tiers: [
      {
        name: 'Starter',
        description: 'For individuals',
        price: { monthly: 12 },
        features: [
          { text: '10 projects', included: true },
          { text: '10GB storage', included: true },
          { text: 'Standard support', included: true },
          { text: 'Basic analytics', included: true },
        ],
        buttonText: 'Choose Starter',
        buttonHref: '/signup?plan=starter',
      },
      {
        name: 'Professional',
        description: 'For power users',
        price: { monthly: 39 },
        features: [
          { text: 'Unlimited projects', included: true },
          { text: '100GB storage', included: true },
          { text: 'Priority support', included: true },
          { text: 'Advanced analytics', included: true },
        ],
        buttonText: 'Choose Pro',
        buttonHref: '/signup?plan=pro',
        highlighted: true,
        badge: 'Recommended',
      },
      {
        name: 'Team',
        description: 'For organizations',
        price: { monthly: 99 },
        features: [
          { text: 'Unlimited everything', included: true },
          { text: 'Team collaboration', included: true },
          { text: 'Dedicated support', included: true },
          { text: 'Custom reports', included: true },
        ],
        buttonText: 'Choose Team',
        buttonHref: '/signup?plan=team',
      },
    ],
    showToggle: false,
    columns: 3,
  },
};

export const YearlyDefault: Story = {
  args: {
    headline: 'Save with annual billing',
    subheadline: 'Get 2 months free when you pay annually.',
    tiers: basicTiers,
    showToggle: true,
    defaultBilling: 'yearly',
    yearlyDiscount: '2 months free',
    columns: 3,
  },
};

export const AppSumoStyle: Story = {
  args: {
    headline: 'Lifetime deal',
    subheadline: 'One-time payment, lifetime access. No recurring fees.',
    tiers: [
      {
        name: 'Tier 1',
        description: 'Perfect for solo users',
        price: { monthly: '$49', yearly: '$49' },
        features: [
          { text: '1 user seat', included: true },
          { text: '10 projects', included: true },
          { text: '10GB storage', included: true },
          { text: 'All core features', included: true },
          { text: 'Lifetime updates', included: true },
          { text: 'Priority support', included: false },
        ],
        buttonText: 'Get Tier 1',
        buttonHref: '/checkout?tier=1',
      },
      {
        name: 'Tier 2',
        description: 'For small teams',
        price: { monthly: '$99', yearly: '$99' },
        features: [
          { text: '3 user seats', included: true },
          { text: '50 projects', included: true },
          { text: '50GB storage', included: true },
          { text: 'All core features', included: true },
          { text: 'Lifetime updates', included: true },
          { text: 'Priority support', included: true },
        ],
        buttonText: 'Get Tier 2',
        buttonHref: '/checkout?tier=2',
        highlighted: true,
        badge: 'Best Value',
      },
      {
        name: 'Tier 3',
        description: 'For agencies',
        price: { monthly: '$199', yearly: '$199' },
        features: [
          { text: 'Unlimited seats', included: true },
          { text: 'Unlimited projects', included: true },
          { text: '500GB storage', included: true },
          { text: 'All features', included: true },
          { text: 'Lifetime updates', included: true },
          { text: 'VIP support', included: true },
        ],
        buttonText: 'Get Tier 3',
        buttonHref: '/checkout?tier=3',
      },
    ],
    showToggle: false,
    columns: 3,
  },
};

export const CreatorEconomy: Story = {
  args: {
    headline: 'Monetize your content',
    subheadline: 'Tools for creators, educators, and influencers.',
    tiers: [
      {
        name: 'Creator',
        description: 'Just getting started',
        price: { monthly: 9, yearly: 7 },
        features: [
          { text: '1,000 subscribers', included: true },
          { text: 'Basic analytics', included: true },
          { text: 'Email campaigns', included: true },
          { text: 'Custom landing page', included: true },
          { text: 'Digital downloads', included: false },
          { text: 'Memberships', included: false },
        ],
        buttonText: 'Start Creating',
        buttonHref: '/signup?plan=creator',
      },
      {
        name: 'Professional',
        description: 'Growing your audience',
        price: { monthly: 29, yearly: 24 },
        features: [
          { text: '10,000 subscribers', included: true },
          { text: 'Advanced analytics', included: true },
          { text: 'Automation workflows', included: true },
          { text: 'Custom domains', included: true },
          { text: 'Digital downloads', included: true },
          { text: 'Memberships', included: false },
        ],
        buttonText: 'Go Professional',
        buttonHref: '/signup?plan=professional',
        highlighted: true,
        badge: 'Popular',
      },
      {
        name: 'Business',
        description: 'Full monetization',
        price: { monthly: 79, yearly: 63 },
        features: [
          { text: 'Unlimited subscribers', included: true },
          { text: 'Revenue analytics', included: true },
          { text: 'Advanced automation', included: true },
          { text: 'White-label option', included: true },
          { text: 'Digital products', included: true },
          { text: 'Memberships & courses', included: true },
        ],
        buttonText: 'Start Business',
        buttonHref: '/signup?plan=business',
      },
    ],
    showToggle: true,
    defaultBilling: 'monthly',
    yearlyDiscount: 'Save 20%',
    columns: 3,
  },
};
