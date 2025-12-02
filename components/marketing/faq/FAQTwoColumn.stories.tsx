import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FAQTwoColumn } from './FAQTwoColumn';
import type { FAQItem } from './types';

const meta: Meta<typeof FAQTwoColumn> = {
  title: 'Marketing/FAQ/FAQTwoColumn',
  component: FAQTwoColumn,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Grid-based FAQ layout showing all questions and answers at once. Perfect for shorter FAQ sections where all content should be visible.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    columns: {
      control: 'radio',
      options: [1, 2],
      description: 'Number of columns',
    },
    background: {
      control: 'radio',
      options: ['light', 'muted', 'dark'],
      description: 'Background style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FAQTwoColumn>;

const basicFAQs: FAQItem[] = [
  {
    question: 'How do I get started?',
    answer:
      'Simply sign up for an account and follow our quick-start guide. You can be up and running in less than 5 minutes.',
  },
  {
    question: 'Is there a free plan?',
    answer:
      'Yes! We offer a generous free tier that includes all core features. Upgrade anytime to unlock advanced capabilities.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      "Absolutely. There are no long-term contracts or cancellation fees. You can cancel your subscription at any time.",
  },
  {
    question: 'Do you offer support?',
    answer:
      'We provide email support for all plans and priority support with live chat for Pro and Enterprise customers.',
  },
];

export const Default: Story = {
  args: {
    headline: 'Frequently Asked Questions',
    subheadline: 'Quick answers to common questions.',
    items: basicFAQs,
    columns: 2,
    background: 'light',
  },
};

export const SingleColumn: Story = {
  args: {
    headline: 'Common Questions',
    subheadline: 'Find answers to frequently asked questions.',
    items: basicFAQs,
    columns: 1,
    background: 'light',
  },
};

export const MutedBackground: Story = {
  args: {
    headline: 'Need Help?',
    subheadline: 'Here are answers to some questions we get asked often.',
    items: basicFAQs,
    columns: 2,
    background: 'muted',
  },
};

export const DarkBackground: Story = {
  args: {
    headline: 'Questions & Answers',
    subheadline: 'Everything you need to know.',
    items: basicFAQs,
    columns: 2,
    background: 'dark',
  },
};

export const WithCategories: Story = {
  args: {
    headline: 'Help Center',
    subheadline: 'Browse by category to find what you need.',
    items: [
      {
        question: 'How do I reset my password?',
        answer:
          'Click the "Forgot Password" link on the login page and enter your email. You\'ll receive a reset link within minutes.',
        category: 'Account',
      },
      {
        question: 'How do I update my billing info?',
        answer:
          'Go to Settings > Billing and click "Update Payment Method" to change your credit card or billing address.',
        category: 'Billing',
      },
      {
        question: 'Can I export my data?',
        answer:
          'Yes, you can export all your data in CSV or JSON format from Settings > Data Export.',
        category: 'Data',
      },
      {
        question: 'How do I invite team members?',
        answer:
          'Navigate to Team Settings and click "Invite Member". Enter their email and select their role.',
        category: 'Team',
      },
      {
        question: 'What integrations are available?',
        answer:
          'We integrate with Slack, Zapier, Google Workspace, Microsoft 365, and 50+ other popular tools.',
        category: 'Integrations',
      },
      {
        question: 'Is my data secure?',
        answer:
          'Yes, we use bank-level encryption and are SOC 2 Type II certified. Your data is always encrypted at rest and in transit.',
        category: 'Security',
      },
    ],
    columns: 2,
    background: 'muted',
  },
};

export const SixItems: Story = {
  args: {
    headline: 'Got Questions?',
    subheadline: 'We have answers.',
    items: [
      {
        question: 'What makes you different?',
        answer:
          'We combine powerful features with an intuitive interface, backed by world-class support.',
      },
      {
        question: 'How long is the free trial?',
        answer: '14 days with full access to all features. No credit card required to start.',
      },
      {
        question: 'Can I change plans later?',
        answer: 'Yes, upgrade or downgrade anytime. Changes take effect immediately.',
      },
      {
        question: 'Do you offer refunds?',
        answer: 'We offer a 30-day money-back guarantee on all annual plans.',
      },
      {
        question: 'Is training included?',
        answer: 'Yes, all plans include access to our video tutorials and documentation.',
      },
      {
        question: 'How do I contact support?',
        answer: 'Email us at support@example.com or use the chat widget in the app.',
      },
    ],
    columns: 2,
    background: 'light',
  },
};

export const NoHeader: Story = {
  args: {
    items: basicFAQs,
    columns: 2,
    background: 'muted',
  },
};

export const ProductFAQs: Story = {
  args: {
    headline: 'Product Questions',
    subheadline: 'Learn more about how our product works.',
    items: [
      {
        question: 'What devices are supported?',
        answer:
          'Our web app works on all modern browsers. We also have native iOS and Android apps available for download.',
        category: 'Platform',
      },
      {
        question: 'Is there an offline mode?',
        answer:
          'Yes, our mobile apps support offline mode. Your changes will sync automatically when you reconnect.',
        category: 'Features',
      },
      {
        question: 'How much storage do I get?',
        answer:
          'Free plans include 1GB of storage. Pro plans get 100GB, and Enterprise plans have unlimited storage.',
        category: 'Storage',
      },
      {
        question: 'Can I use my own domain?',
        answer:
          'Custom domains are available on Pro and Enterprise plans. Setup takes just a few minutes.',
        category: 'Customization',
      },
    ],
    columns: 2,
    background: 'light',
  },
};
