import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TestimonialsGrid } from './TestimonialsGrid';

const sampleTestimonials = [
  {
    quote: 'This platform has completely transformed how we handle our projects. The efficiency gains have been remarkable.',
    author: {
      name: 'Sarah Chen',
      title: 'CTO',
      company: 'TechFlow Inc.',
      avatarSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    },
    rating: 5,
  },
  {
    quote: 'Outstanding customer service and an incredibly intuitive interface. Our team was up and running within hours.',
    author: {
      name: 'Michael Rodriguez',
      title: 'Product Manager',
      company: 'Innovate Labs',
      avatarSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    rating: 5,
  },
  {
    quote: 'The best investment we\'ve made this year. ROI was visible within the first month.',
    author: {
      name: 'Emily Thompson',
      title: 'CEO',
      company: 'GrowthStack',
      avatarSrc: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    },
    rating: 4,
  },
  {
    quote: 'Seamless integration with our existing tools. The API documentation is comprehensive and well-maintained.',
    author: {
      name: 'David Park',
      title: 'Lead Developer',
      company: 'CodeCraft',
      avatarSrc: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    },
    rating: 5,
  },
  {
    quote: 'We\'ve reduced our development time by 40%. The component library is exceptionally well-designed.',
    author: {
      name: 'Lisa Wang',
      title: 'Engineering Manager',
      company: 'ScaleUp',
      avatarSrc: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    },
    rating: 5,
  },
  {
    quote: 'The analytics features alone are worth the subscription. We finally understand our users.',
    author: {
      name: 'James Miller',
      title: 'Data Analyst',
      company: 'InsightCo',
      avatarSrc: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
    rating: 4,
  },
];

const meta: Meta<typeof TestimonialsGrid> = {
  title: 'Marketing/Testimonials/TestimonialsGrid',
  component: TestimonialsGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A grid layout displaying multiple testimonials with author info and optional ratings. Great for showcasing social proof from multiple customers.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    columns: {
      control: 'radio',
      options: [2, 3],
      description: 'Number of columns in the grid',
    },
    showRating: {
      control: 'boolean',
      description: 'Show star ratings',
    },
    showLogos: {
      control: 'boolean',
      description: 'Show company logos',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TestimonialsGrid>;

export const Default: Story = {
  args: {
    headline: 'Loved by teams worldwide',
    subheadline: 'See what our customers have to say about their experience.',
    testimonials: sampleTestimonials,
    columns: 3,
    showRating: true,
    showLogos: false,
  },
};

export const TwoColumns: Story = {
  args: {
    headline: 'Customer Stories',
    subheadline: 'Real feedback from real users.',
    testimonials: sampleTestimonials.slice(0, 4),
    columns: 2,
    showRating: true,
    showLogos: false,
  },
};

export const WithoutRatings: Story = {
  args: {
    headline: 'What People Are Saying',
    testimonials: sampleTestimonials.slice(0, 3),
    columns: 3,
    showRating: false,
    showLogos: false,
  },
};

export const WithoutHeader: Story = {
  args: {
    testimonials: sampleTestimonials.slice(0, 3),
    columns: 3,
    showRating: true,
    showLogos: false,
  },
};

export const WithoutAvatars: Story = {
  args: {
    headline: 'Testimonials',
    testimonials: sampleTestimonials.map(t => ({
      ...t,
      author: {
        ...t.author,
        avatarSrc: undefined,
      },
    })).slice(0, 3),
    columns: 3,
    showRating: true,
    showLogos: false,
  },
};
