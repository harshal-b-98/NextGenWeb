import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PricingTable } from './PricingTable';
import type { PricingTier } from './types';

const meta: Meta<typeof PricingTable> = {
  title: 'Marketing/Pricing/PricingTable',
  component: PricingTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A traditional pricing table layout comparing multiple tiers side by side. Best for detailed feature comparisons across plans.',
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
  },
};

export default meta;
type Story = StoryObj<typeof PricingTable>;

const basicTiers: PricingTier[] = [
  {
    name: 'Starter',
    description: 'Perfect for individuals',
    price: { monthly: 9, yearly: 7 },
    features: [
      { text: '5 projects', included: true },
      { text: '10GB storage', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Email support', included: true },
      { text: 'API access', included: false },
      { text: 'Custom integrations', included: false },
    ],
    buttonText: 'Start Free Trial',
    buttonHref: '/signup?plan=starter',
  },
  {
    name: 'Professional',
    description: 'For growing teams',
    price: { monthly: 29, yearly: 24 },
    features: [
      { text: 'Unlimited projects', included: true },
      { text: '100GB storage', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: true },
      { text: 'Custom integrations', included: false },
    ],
    buttonText: 'Start Free Trial',
    buttonHref: '/signup?plan=pro',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    price: { monthly: 99, yearly: 79 },
    features: [
      { text: 'Unlimited projects', included: true },
      { text: 'Unlimited storage', included: true },
      { text: 'Custom analytics', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Full API access', included: true },
      { text: 'Custom integrations', included: true },
    ],
    buttonText: 'Contact Sales',
    buttonHref: '/contact?plan=enterprise',
  },
];

export const Default: Story = {
  args: {
    headline: 'Simple, transparent pricing',
    subheadline: 'Choose the plan that works best for you and your team.',
    tiers: basicTiers,
    showToggle: true,
    defaultBilling: 'monthly',
    yearlyDiscount: 'Save 20%',
  },
};

export const TwoTiers: Story = {
  args: {
    headline: 'Choose your plan',
    subheadline: 'Start free and scale as you grow.',
    tiers: [
      {
        name: 'Free',
        description: 'For hobbyists',
        price: { monthly: 'Free', yearly: 'Free' },
        features: [
          { text: '3 projects', included: true },
          { text: '1GB storage', included: true },
          { text: 'Community support', included: true },
          { text: 'Basic templates', included: true },
          { text: 'Custom domain', included: false },
          { text: 'Remove branding', included: false },
        ],
        buttonText: 'Get Started',
        buttonHref: '/signup?plan=free',
      },
      {
        name: 'Pro',
        description: 'For professionals',
        price: { monthly: 19, yearly: 15 },
        features: [
          { text: 'Unlimited projects', included: true },
          { text: '50GB storage', included: true },
          { text: 'Priority support', included: true },
          { text: 'Premium templates', included: true },
          { text: 'Custom domain', included: true },
          { text: 'Remove branding', included: true },
        ],
        buttonText: 'Upgrade to Pro',
        buttonHref: '/signup?plan=pro',
        highlighted: true,
        badge: 'Recommended',
      },
    ],
    showToggle: true,
    defaultBilling: 'monthly',
  },
};

export const FourTiers: Story = {
  args: {
    headline: 'Plans for every stage',
    subheadline: 'From startup to enterprise, we have you covered.',
    tiers: [
      {
        name: 'Hobby',
        price: { monthly: 0, yearly: 0 },
        features: [
          { text: '1 project', included: true },
          { text: '500MB storage', included: true },
          { text: 'Community support', included: true },
          { text: 'Basic features', included: true },
        ],
        buttonText: 'Start Free',
        buttonHref: '/signup?plan=hobby',
      },
      {
        name: 'Starter',
        price: { monthly: 12, yearly: 10 },
        features: [
          { text: '5 projects', included: true },
          { text: '5GB storage', included: true },
          { text: 'Email support', included: true },
          { text: 'All basic features', included: true },
        ],
        buttonText: 'Get Started',
        buttonHref: '/signup?plan=starter',
      },
      {
        name: 'Growth',
        price: { monthly: 49, yearly: 39 },
        features: [
          { text: '25 projects', included: true },
          { text: '50GB storage', included: true },
          { text: 'Priority support', included: true },
          { text: 'Advanced features', included: true },
        ],
        buttonText: 'Start Growing',
        buttonHref: '/signup?plan=growth',
        highlighted: true,
        badge: 'Best Value',
      },
      {
        name: 'Scale',
        price: { monthly: 149, yearly: 119 },
        features: [
          { text: 'Unlimited projects', included: true },
          { text: 'Unlimited storage', included: true },
          { text: 'Dedicated support', included: true },
          { text: 'Enterprise features', included: true },
        ],
        buttonText: 'Contact Sales',
        buttonHref: '/contact?plan=scale',
      },
    ],
    showToggle: true,
    defaultBilling: 'yearly',
    yearlyDiscount: '2 months free',
  },
};

export const NoToggle: Story = {
  args: {
    headline: 'One simple price',
    subheadline: 'No hidden fees, no surprises.',
    tiers: [
      {
        name: 'Basic',
        price: { monthly: 9 },
        features: [
          { text: '10 projects', included: true },
          { text: '10GB storage', included: true },
          { text: 'Email support', included: true },
        ],
        buttonText: 'Get Basic',
        buttonHref: '/signup?plan=basic',
      },
      {
        name: 'Pro',
        price: { monthly: 29 },
        features: [
          { text: 'Unlimited projects', included: true },
          { text: '100GB storage', included: true },
          { text: 'Priority support', included: true },
        ],
        buttonText: 'Get Pro',
        buttonHref: '/signup?plan=pro',
        highlighted: true,
      },
      {
        name: 'Team',
        price: { monthly: 79 },
        features: [
          { text: 'Unlimited everything', included: true },
          { text: 'Team features', included: true },
          { text: 'Dedicated support', included: true },
        ],
        buttonText: 'Get Team',
        buttonHref: '/signup?plan=team',
      },
    ],
    showToggle: false,
  },
};

export const CustomCurrency: Story = {
  args: {
    headline: 'International pricing',
    subheadline: 'Prices shown in EUR.',
    tiers: [
      {
        name: 'Basic',
        price: { monthly: 8, yearly: 6 },
        currency: '€',
        features: [
          { text: '5 projects', included: true },
          { text: '10GB storage', included: true },
          { text: 'Standard support', included: true },
        ],
        buttonText: 'Choose Basic',
        buttonHref: '/signup?plan=basic',
      },
      {
        name: 'Professional',
        price: { monthly: 25, yearly: 20 },
        currency: '€',
        features: [
          { text: 'Unlimited projects', included: true },
          { text: '100GB storage', included: true },
          { text: 'Priority support', included: true },
        ],
        buttonText: 'Choose Pro',
        buttonHref: '/signup?plan=pro',
        highlighted: true,
        badge: 'Popular',
      },
      {
        name: 'Enterprise',
        price: { monthly: 'Custom', yearly: 'Custom' },
        currency: '',
        features: [
          { text: 'Custom limits', included: true },
          { text: 'Custom storage', included: true },
          { text: 'Dedicated support', included: true },
        ],
        buttonText: 'Contact Us',
        buttonHref: '/contact',
      },
    ],
    showToggle: true,
    defaultBilling: 'monthly',
  },
};

export const SaaSPricing: Story = {
  args: {
    headline: 'Start building today',
    subheadline: 'Flexible plans that grow with your business. All plans include a 14-day free trial.',
    tiers: [
      {
        name: 'Solo',
        description: 'For individual creators',
        price: { monthly: 15, yearly: 12 },
        features: [
          { text: '1 team member', included: true },
          { text: '10 projects', included: true },
          { text: '5GB file storage', included: true },
          { text: 'Basic analytics', included: true },
          { text: 'Email notifications', included: true },
          { text: 'Team collaboration', included: false },
          { text: 'Advanced permissions', included: false },
          { text: 'SSO authentication', included: false },
        ],
        buttonText: 'Start Free Trial',
        buttonHref: '/signup?plan=solo',
      },
      {
        name: 'Team',
        description: 'For small teams',
        price: { monthly: 49, yearly: 39 },
        features: [
          { text: 'Up to 10 members', included: true },
          { text: 'Unlimited projects', included: true },
          { text: '50GB file storage', included: true },
          { text: 'Advanced analytics', included: true },
          { text: 'Slack integration', included: true },
          { text: 'Team collaboration', included: true },
          { text: 'Advanced permissions', included: false },
          { text: 'SSO authentication', included: false },
        ],
        buttonText: 'Start Free Trial',
        buttonHref: '/signup?plan=team',
        highlighted: true,
        badge: 'Most Popular',
      },
      {
        name: 'Business',
        description: 'For growing companies',
        price: { monthly: 149, yearly: 119 },
        features: [
          { text: 'Unlimited members', included: true },
          { text: 'Unlimited projects', included: true },
          { text: '500GB file storage', included: true },
          { text: 'Custom analytics', included: true },
          { text: 'All integrations', included: true },
          { text: 'Team collaboration', included: true },
          { text: 'Advanced permissions', included: true },
          { text: 'SSO authentication', included: true },
        ],
        buttonText: 'Start Free Trial',
        buttonHref: '/signup?plan=business',
      },
    ],
    showToggle: true,
    defaultBilling: 'monthly',
    yearlyDiscount: 'Save 20%',
  },
};
