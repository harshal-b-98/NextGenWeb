import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TestimonialsCarousel } from './TestimonialsCarousel';

const sampleTestimonials = [
  {
    quote: 'This platform has completely transformed how we handle our projects. The efficiency gains have been remarkable and our team couldn\'t be happier with the results.',
    author: {
      name: 'Sarah Chen',
      title: 'Chief Technology Officer',
      company: 'TechFlow Inc.',
      avatarSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    },
  },
  {
    quote: 'Outstanding customer service and an incredibly intuitive interface. Our team was up and running within hours, not days.',
    author: {
      name: 'Michael Rodriguez',
      title: 'Product Manager',
      company: 'Innovate Labs',
      avatarSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
  },
  {
    quote: 'The best investment we\'ve made this year. ROI was visible within the first month and continues to grow.',
    author: {
      name: 'Emily Thompson',
      title: 'CEO',
      company: 'GrowthStack',
      avatarSrc: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    },
  },
  {
    quote: 'Seamless integration with our existing tools. The API documentation is comprehensive and the support team is incredibly responsive.',
    author: {
      name: 'David Park',
      title: 'Lead Developer',
      company: 'CodeCraft',
      avatarSrc: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    },
  },
];

const meta: Meta<typeof TestimonialsCarousel> = {
  title: 'Marketing/Testimonials/TestimonialsCarousel',
  component: TestimonialsCarousel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A carousel/slider showcasing testimonials one at a time with navigation. Perfect for highlighting individual customer stories.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    autoPlay: {
      control: 'boolean',
      description: 'Enable auto-play',
    },
    autoPlayInterval: {
      control: { type: 'number', min: 1000, max: 10000, step: 500 },
      description: 'Auto-play interval in milliseconds',
    },
    showDots: {
      control: 'boolean',
      description: 'Show navigation dots',
    },
    showArrows: {
      control: 'boolean',
      description: 'Show navigation arrows',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TestimonialsCarousel>;

export const Default: Story = {
  args: {
    headline: 'What Our Customers Say',
    subheadline: 'Hear from teams who have transformed their workflow.',
    testimonials: sampleTestimonials,
    autoPlay: true,
    autoPlayInterval: 5000,
    showDots: true,
    showArrows: true,
  },
};

export const NoAutoPlay: Story = {
  args: {
    headline: 'Customer Stories',
    testimonials: sampleTestimonials,
    autoPlay: false,
    showDots: true,
    showArrows: true,
  },
};

export const DotsOnly: Story = {
  args: {
    headline: 'Testimonials',
    testimonials: sampleTestimonials,
    autoPlay: true,
    autoPlayInterval: 4000,
    showDots: true,
    showArrows: false,
  },
};

export const ArrowsOnly: Story = {
  args: {
    headline: 'What People Are Saying',
    testimonials: sampleTestimonials,
    autoPlay: false,
    showDots: false,
    showArrows: true,
  },
};

export const FastAutoPlay: Story = {
  args: {
    headline: 'Happy Customers',
    testimonials: sampleTestimonials,
    autoPlay: true,
    autoPlayInterval: 2000,
    showDots: true,
    showArrows: true,
  },
};

export const WithoutHeader: Story = {
  args: {
    testimonials: sampleTestimonials,
    autoPlay: true,
    showDots: true,
    showArrows: true,
  },
};

export const SingleTestimonial: Story = {
  args: {
    headline: 'Featured Review',
    testimonials: [sampleTestimonials[0]],
    autoPlay: false,
    showDots: false,
    showArrows: false,
  },
};
