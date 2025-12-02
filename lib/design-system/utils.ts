/**
 * Design System Utilities
 *
 * Helper functions for working with design tokens and styling.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS conflict resolution
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Create responsive class names
 */
export function responsive(
  base: string,
  options: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  }
): string {
  const classes: string[] = [base];

  if (options.sm) classes.push(`sm:${options.sm}`);
  if (options.md) classes.push(`md:${options.md}`);
  if (options.lg) classes.push(`lg:${options.lg}`);
  if (options.xl) classes.push(`xl:${options.xl}`);
  if (options['2xl']) classes.push(`2xl:${options['2xl']}`);

  return classes.join(' ');
}

/**
 * Create spacing utility
 */
export function space(value: number | string): string {
  if (typeof value === 'number') {
    return `${value * 0.25}rem`; // Based on 4px base
  }
  return value;
}

/**
 * Create focus ring styles
 */
export function focusRing(color?: string): string {
  return cn(
    'focus:outline-none focus-visible:ring-2',
    color ? `focus-visible:ring-${color}` : 'focus-visible:ring-[var(--color-ring)]',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]'
  );
}

/**
 * Create transition styles
 */
export function transition(
  properties: ('all' | 'colors' | 'opacity' | 'shadow' | 'transform')[] = ['all'],
  duration: 'fast' | 'default' | 'slow' = 'default'
): string {
  const durationMap = {
    fast: '150',
    default: '200',
    slow: '300',
  };

  const propertyMap = {
    all: 'transition-all',
    colors: 'transition-colors',
    opacity: 'transition-opacity',
    shadow: 'transition-shadow',
    transform: 'transition-transform',
  };

  return cn(
    properties.map((p) => propertyMap[p]).join(' '),
    `duration-${durationMap[duration]}`
  );
}

/**
 * Screen reader only styles
 */
export const srOnly =
  'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';

/**
 * Truncate text with ellipsis
 */
export const truncate = 'overflow-hidden text-ellipsis whitespace-nowrap';

/**
 * Line clamp utility
 */
export function lineClamp(lines: number): string {
  return `overflow-hidden display-[-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:${lines}]`;
}

/**
 * Create aspect ratio utility
 */
export function aspectRatio(ratio: '1/1' | '4/3' | '16/9' | '21/9'): string {
  return `aspect-[${ratio}]`;
}

/**
 * Container utility with max-width
 */
export function container(size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'xl'): string {
  const sizeMap = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
  };

  return cn('mx-auto px-4 sm:px-6 lg:px-8', sizeMap[size]);
}

/**
 * Section padding utility
 */
export function sectionPadding(size: 'sm' | 'md' | 'lg' = 'md'): string {
  const sizeMap = {
    sm: 'py-12 md:py-16',
    md: 'py-16 md:py-24',
    lg: 'py-24 md:py-32',
  };

  return sizeMap[size];
}

/**
 * Grid utility
 */
export function grid(
  cols: 1 | 2 | 3 | 4 | 6 | 12,
  options?: {
    gap?: 'sm' | 'md' | 'lg';
    responsive?: {
      sm?: 1 | 2 | 3 | 4 | 6;
      md?: 1 | 2 | 3 | 4 | 6;
      lg?: 1 | 2 | 3 | 4 | 6 | 12;
    };
  }
): string {
  const gapMap = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  const classes = ['grid', `grid-cols-${cols}`];

  if (options?.gap) {
    classes.push(gapMap[options.gap]);
  } else {
    classes.push('gap-6');
  }

  if (options?.responsive) {
    if (options.responsive.sm) classes.push(`sm:grid-cols-${options.responsive.sm}`);
    if (options.responsive.md) classes.push(`md:grid-cols-${options.responsive.md}`);
    if (options.responsive.lg) classes.push(`lg:grid-cols-${options.responsive.lg}`);
  }

  return classes.join(' ');
}

/**
 * Flex utility
 */
export function flex(
  direction: 'row' | 'col' = 'row',
  options?: {
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    gap?: 'sm' | 'md' | 'lg';
    wrap?: boolean;
  }
): string {
  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  };

  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const gapMap = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const classes = ['flex', direction === 'col' ? 'flex-col' : 'flex-row'];

  if (options?.align) classes.push(alignMap[options.align]);
  if (options?.justify) classes.push(justifyMap[options.justify]);
  if (options?.gap) classes.push(gapMap[options.gap]);
  if (options?.wrap) classes.push('flex-wrap');

  return classes.join(' ');
}

/**
 * Gradient text utility
 */
export function gradientText(
  from: string = 'from-primary',
  to: string = 'to-accent'
): string {
  return cn('bg-gradient-to-r', from, to, 'bg-clip-text text-transparent');
}

/**
 * Card styles utility
 */
export function cardStyles(options?: {
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}): string {
  const paddingMap = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return cn(
    'bg-[var(--color-card)] text-[var(--color-card-foreground)]',
    'border border-[var(--color-border)] rounded-lg',
    'shadow-sm',
    paddingMap[options?.padding || 'md'],
    options?.hover && 'hover:shadow-md hover:border-[var(--color-border-hover)] transition-all duration-200'
  );
}
