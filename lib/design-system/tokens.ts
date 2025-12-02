/**
 * Design System Tokens
 *
 * This file defines all design tokens used throughout the application.
 * These tokens are used by the component library and match the CSS custom properties in globals.css.
 *
 * Based on an 8px grid system with WCAG 2.1 AA compliance.
 */

// Color Palette
export const colors = {
  // Brand Colors
  primary: {
    DEFAULT: 'var(--color-primary)',
    hover: 'var(--color-primary-hover)',
    light: 'var(--color-primary-light)',
  },
  secondary: {
    DEFAULT: 'var(--color-secondary)',
    hover: 'var(--color-secondary-hover)',
  },
  accent: {
    DEFAULT: 'var(--color-accent)',
    hover: 'var(--color-accent-hover)',
  },

  // Semantic Colors
  success: {
    DEFAULT: 'var(--color-success)',
    light: 'var(--color-success-light)',
  },
  warning: {
    DEFAULT: 'var(--color-warning)',
    light: 'var(--color-warning-light)',
  },
  error: {
    DEFAULT: 'var(--color-error)',
    light: 'var(--color-error-light)',
  },
  info: {
    DEFAULT: 'var(--color-info)',
    light: 'var(--color-info-light)',
  },

  // Neutral Colors
  background: 'var(--color-background)',
  foreground: 'var(--color-foreground)',
  muted: {
    DEFAULT: 'var(--color-muted)',
    foreground: 'var(--color-muted-foreground)',
  },
  border: {
    DEFAULT: 'var(--color-border)',
    hover: 'var(--color-border-hover)',
  },
  input: 'var(--color-input)',
  ring: 'var(--color-ring)',

  // Surface Colors
  card: {
    DEFAULT: 'var(--color-card)',
    foreground: 'var(--color-card-foreground)',
  },
  popover: {
    DEFAULT: 'var(--color-popover)',
    foreground: 'var(--color-popover-foreground)',
  },
} as const;

// Spacing (8px grid)
export const spacing = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  44: '11rem',     // 176px
  48: '12rem',     // 192px
  52: '13rem',     // 208px
  56: '14rem',     // 224px
  60: '15rem',     // 240px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem',     // 384px
} as const;

// Typography
export const typography = {
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],       // 72px
    '8xl': ['6rem', { lineHeight: '1' }],         // 96px
    '9xl': ['8rem', { lineHeight: '1' }],         // 128px
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

// Transitions
export const transitions = {
  duration: {
    fast: '150ms',
    DEFAULT: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  timing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Z-Index Scale
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  dropdown: '50',
  sticky: '100',
  fixed: '200',
  modalBackdrop: '300',
  modal: '400',
  popover: '500',
  tooltip: '600',
} as const;

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Container widths
export const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Component-specific tokens
export const components = {
  button: {
    sizes: {
      sm: {
        height: spacing[8],      // 32px
        paddingX: spacing[3],    // 12px
        fontSize: typography.fontSize.sm[0],
      },
      md: {
        height: spacing[10],     // 40px
        paddingX: spacing[4],    // 16px
        fontSize: typography.fontSize.base[0],
      },
      lg: {
        height: spacing[12],     // 48px
        paddingX: spacing[6],    // 24px
        fontSize: typography.fontSize.lg[0],
      },
      xl: {
        height: spacing[14],     // 56px
        paddingX: spacing[8],    // 32px
        fontSize: typography.fontSize.xl[0],
      },
    },
  },
  input: {
    sizes: {
      sm: {
        height: spacing[8],      // 32px
        paddingX: spacing[3],    // 12px
        fontSize: typography.fontSize.sm[0],
      },
      md: {
        height: spacing[10],     // 40px
        paddingX: spacing[4],    // 16px
        fontSize: typography.fontSize.base[0],
      },
      lg: {
        height: spacing[12],     // 48px
        paddingX: spacing[5],    // 20px
        fontSize: typography.fontSize.lg[0],
      },
    },
  },
  card: {
    padding: {
      sm: spacing[4],     // 16px
      md: spacing[6],     // 24px
      lg: spacing[8],     // 32px
    },
    borderRadius: borderRadius.lg,
  },
  section: {
    paddingY: {
      sm: spacing[12],    // 48px
      md: spacing[16],    // 64px
      lg: spacing[24],    // 96px
    },
  },
} as const;

// AI Component Metadata Types
export interface ComponentMetadata {
  id: string;
  name: string;
  category: 'hero' | 'features' | 'testimonials' | 'cta' | 'pricing' | 'faq' | 'contact' | 'footer' | 'navigation';
  variant: string;
  description: string;
  bestFor: string[];
  contentRequirements: {
    required: string[];
    optional: string[];
  };
  styleTags: string[];
  conversionFocus: 'awareness' | 'consideration' | 'decision' | 'support' | 'lead-capture' | 'navigation';
}

// Export all tokens as a single object
export const tokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  containers,
  components,
} as const;

export type Tokens = typeof tokens;
