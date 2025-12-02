import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TestimonialsQuote } from './TestimonialsQuote';

const featuredTestimonial = {
  quote: 'This platform has completely transformed how we approach our work. The intuitive design, powerful features, and exceptional support have made it an indispensable part of our daily operations. I cannot imagine going back to the old way of doing things.',
  author: {
    name: 'Sarah Chen',
    title: 'Chief Technology Officer',
    company: 'TechFlow Inc.',
    avatarSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  },
};

const shortTestimonial = {
  quote: 'Simply the best platform we\'ve ever used. Period.',
  author: {
    name: 'Michael Rodriguez',
    title: 'CEO',
    company: 'Innovate Labs',
    avatarSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  },
};

const noAvatarTestimonial = {
  quote: 'We switched to this platform six months ago and haven\'t looked back. The productivity improvements have been substantial.',
  author: {
    name: 'Emily Thompson',
    title: 'VP of Engineering',
    company: 'GrowthStack',
  },
};

const meta: Meta<typeof TestimonialsQuote> = {
  title: 'Marketing/Testimonials/TestimonialsQuote',
  component: TestimonialsQuote,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A single large, impactful testimonial quote. Ideal for featuring your best customer endorsement prominently.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    background: {
      control: 'radio',
      options: ['light', 'dark', 'gradient'],
      description: 'Background style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TestimonialsQuote>;

export const Default: Story = {
  args: {
    headline: 'Featured Testimonial',
    testimonial: featuredTestimonial,
    background: 'light',
  },
};

export const Dark: Story = {
  args: {
    headline: 'What Our Customers Say',
    testimonial: featuredTestimonial,
    background: 'dark',
  },
};

export const Gradient: Story = {
  args: {
    headline: 'Customer Spotlight',
    testimonial: featuredTestimonial,
    background: 'gradient',
  },
};

export const ShortQuote: Story = {
  args: {
    testimonial: shortTestimonial,
    background: 'light',
  },
};

export const WithoutAvatar: Story = {
  args: {
    headline: 'From Our Community',
    testimonial: noAvatarTestimonial,
    background: 'dark',
  },
};

export const WithoutHeadline: Story = {
  args: {
    testimonial: featuredTestimonial,
    background: 'gradient',
  },
};

export const MinimalInfo: Story = {
  args: {
    testimonial: {
      quote: 'An exceptional product that delivers on every promise.',
      author: {
        name: 'Alex Johnson',
      },
    },
    background: 'light',
  },
};
