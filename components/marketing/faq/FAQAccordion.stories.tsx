import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FAQAccordion } from './FAQAccordion';
import type { FAQItem } from './types';

const meta: Meta<typeof FAQAccordion> = {
  title: 'Marketing/FAQ/FAQAccordion',
  component: FAQAccordion,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Expandable FAQ section with smooth animations. Users can click to reveal answers one at a time or multiple simultaneously.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    allowMultiple: {
      control: 'boolean',
      description: 'Allow multiple items to be open at once',
    },
    background: {
      control: 'radio',
      options: ['light', 'muted', 'dark'],
      description: 'Background style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FAQAccordion>;

const basicFAQs: FAQItem[] = [
  {
    question: 'What is your return policy?',
    answer:
      'We offer a 30-day money-back guarantee on all purchases. If you are not satisfied with your purchase, you can return it within 30 days for a full refund. Items must be in original condition with all tags attached.',
  },
  {
    question: 'How long does shipping take?',
    answer:
      'Standard shipping typically takes 5-7 business days. Express shipping is available for 2-3 business day delivery. International shipping times vary by location, usually between 10-21 business days.',
  },
  {
    question: 'Do you offer customer support?',
    answer:
      'Yes! Our customer support team is available 24/7 via email, chat, and phone. We typically respond to inquiries within 2 hours during business hours and within 24 hours outside of business hours.',
  },
  {
    question: 'Can I change or cancel my order?',
    answer:
      "Orders can be modified or cancelled within 1 hour of placement. After that, the order enters our fulfillment process and cannot be changed. Please contact support immediately if you need to make changes.",
  },
  {
    question: 'Is my payment information secure?',
    answer:
      'Absolutely. We use industry-standard SSL encryption to protect your payment information. We never store your full credit card details on our servers. All transactions are processed through PCI-compliant payment processors.',
  },
];

export const Default: Story = {
  args: {
    headline: 'Frequently Asked Questions',
    subheadline: 'Everything you need to know about our product and services.',
    items: basicFAQs,
    allowMultiple: false,
    background: 'light',
  },
};

export const AllowMultiple: Story = {
  args: {
    headline: 'Common Questions',
    subheadline: 'Click on any question to expand the answer.',
    items: basicFAQs,
    allowMultiple: true,
    background: 'light',
  },
};

export const WithDefaultOpen: Story = {
  args: {
    headline: 'Help Center',
    subheadline: 'Find answers to common questions below.',
    items: basicFAQs,
    allowMultiple: false,
    defaultOpen: [0],
    background: 'muted',
  },
};

export const MutedBackground: Story = {
  args: {
    headline: 'Got Questions?',
    subheadline: "We've got answers.",
    items: basicFAQs,
    allowMultiple: false,
    background: 'muted',
  },
};

export const DarkBackground: Story = {
  args: {
    headline: 'Frequently Asked Questions',
    subheadline: 'Find the information you need.',
    items: basicFAQs,
    allowMultiple: false,
    background: 'dark',
  },
};

export const NoHeader: Story = {
  args: {
    items: basicFAQs,
    allowMultiple: true,
    background: 'light',
  },
};

export const SaaSFAQs: Story = {
  args: {
    headline: 'Pricing & Plans',
    subheadline: 'Common questions about our pricing and subscription plans.',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans. Enterprise customers can also pay via invoice.',
      },
      {
        question: 'Can I switch plans at any time?',
        answer:
          "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate takes effect at your next billing cycle.",
      },
      {
        question: 'Is there a free trial?',
        answer:
          "Yes! All paid plans come with a 14-day free trial. No credit card required to start. You'll have full access to all features during the trial period.",
      },
      {
        question: 'What happens when my trial ends?',
        answer:
          "At the end of your trial, you'll be prompted to choose a plan. If you don't select a plan, your account will be downgraded to our free tier with limited features. Your data will be preserved.",
      },
      {
        question: 'Do you offer discounts for nonprofits or education?',
        answer:
          'Yes, we offer 50% off for verified nonprofits and educational institutions. Contact our sales team with proof of status to receive your discount code.',
      },
    ],
    allowMultiple: false,
    background: 'light',
  },
};

export const TechnicalFAQs: Story = {
  args: {
    headline: 'Technical Support',
    subheadline: 'Answers to common technical questions.',
    items: [
      {
        question: 'What browsers are supported?',
        answer:
          'We support the latest versions of Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience and security.',
      },
      {
        question: 'Is there an API available?',
        answer:
          'Yes, we offer a comprehensive REST API for all paid plans. Our API documentation includes examples in multiple languages and a Postman collection for easy testing.',
      },
      {
        question: 'How do I integrate with my existing tools?',
        answer:
          'We offer native integrations with popular tools like Slack, Zapier, and Salesforce. Custom integrations can be built using our API or webhooks.',
      },
      {
        question: 'Where is my data stored?',
        answer:
          'Your data is stored in secure, SOC 2 compliant data centers. We offer data residency options for EU, US, and APAC regions to help meet compliance requirements.',
      },
      {
        question: 'How often do you release updates?',
        answer:
          'We release updates on a continuous basis, with major feature releases every 2-4 weeks. All updates are deployed with zero downtime. You can follow our changelog for details.',
      },
    ],
    allowMultiple: true,
    defaultOpen: [0, 1],
    background: 'muted',
  },
};
