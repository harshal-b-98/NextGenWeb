/**
 * Theme Generation System
 *
 * Generates CSS variables, Tailwind configuration, and CSS strings
 * from a BrandSystem.
 */

import type {
  BrandSystem,
  GeneratedTheme,
  CSSVariables,
  TailwindBrandConfig,
  ColorScale,
} from './types';

/**
 * Generate a complete theme from a brand system
 */
export function generateTheme(brand: BrandSystem): GeneratedTheme {
  const cssVariables = generateCSSVariables(brand);
  const tailwindConfig = generateTailwindConfig(brand);
  const cssString = generateCSSString(cssVariables);

  return {
    cssVariables,
    tailwindConfig,
    cssString,
  };
}

/**
 * Generate CSS custom properties from brand system
 */
export function generateCSSVariables(brand: BrandSystem): CSSVariables {
  const variables: CSSVariables = {};

  // Color variables
  addColorScaleVariables(variables, 'primary', brand.colors.primary);
  addColorScaleVariables(variables, 'secondary', brand.colors.secondary);
  addColorScaleVariables(variables, 'accent', brand.colors.accent);
  addColorScaleVariables(variables, 'neutral', brand.colors.neutral);

  // Semantic colors
  variables['--color-success'] = brand.colors.semantic.success;
  variables['--color-success-foreground'] = brand.colors.semantic.successForeground;
  variables['--color-warning'] = brand.colors.semantic.warning;
  variables['--color-warning-foreground'] = brand.colors.semantic.warningForeground;
  variables['--color-error'] = brand.colors.semantic.error;
  variables['--color-error-foreground'] = brand.colors.semantic.errorForeground;
  variables['--color-info'] = brand.colors.semantic.info;
  variables['--color-info-foreground'] = brand.colors.semantic.infoForeground;

  // Common color aliases
  variables['--background'] = brand.colors.neutral[50];
  variables['--foreground'] = brand.colors.neutral[900];
  variables['--muted'] = brand.colors.neutral[100];
  variables['--muted-foreground'] = brand.colors.neutral[500];
  variables['--border'] = brand.colors.neutral[200];
  variables['--input'] = brand.colors.neutral[200];
  variables['--ring'] = brand.colors.primary[500];

  // Typography variables
  variables['--font-heading'] = brand.typography.fontFamily.heading;
  variables['--font-body'] = brand.typography.fontFamily.body;
  variables['--font-mono'] = brand.typography.fontFamily.mono;

  // Font sizes
  Object.entries(brand.typography.fontSize).forEach(([key, value]) => {
    variables[`--font-size-${key}`] = value;
  });

  // Font weights
  Object.entries(brand.typography.fontWeight).forEach(([key, value]) => {
    variables[`--font-weight-${key}`] = String(value);
  });

  // Line heights
  Object.entries(brand.typography.lineHeight).forEach(([key, value]) => {
    variables[`--line-height-${key}`] = String(value);
  });

  // Letter spacing
  Object.entries(brand.typography.letterSpacing).forEach(([key, value]) => {
    variables[`--letter-spacing-${key}`] = value;
  });

  // Spacing
  variables['--spacing-unit'] = `${brand.spacing.unit}px`;
  brand.spacing.scale.forEach((multiplier, index) => {
    variables[`--spacing-${index}`] = `${multiplier * brand.spacing.unit}px`;
  });

  // Border radius
  Object.entries(brand.borderRadius).forEach(([key, value]) => {
    variables[`--radius-${key}`] = value;
  });

  // Shadows
  Object.entries(brand.shadows).forEach(([key, value]) => {
    variables[`--shadow-${key}`] = value;
  });

  // Animation
  Object.entries(brand.animation.duration).forEach(([key, value]) => {
    variables[`--duration-${key}`] = value;
  });

  Object.entries(brand.animation.easing).forEach(([key, value]) => {
    variables[`--easing-${key}`] = value;
  });

  return variables;
}

/**
 * Add color scale variables
 */
function addColorScaleVariables(
  variables: CSSVariables,
  name: string,
  scale: ColorScale
): void {
  Object.entries(scale).forEach(([shade, color]) => {
    variables[`--color-${name}-${shade}`] = color;
  });
}

/**
 * Generate CSS string from variables
 */
export function generateCSSString(variables: CSSVariables): string {
  const variableLines = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `:root {\n${variableLines}\n}\n\n/* Dark mode support */\n.dark {\n  --background: var(--color-neutral-900);\n  --foreground: var(--color-neutral-50);\n  --muted: var(--color-neutral-800);\n  --muted-foreground: var(--color-neutral-400);\n  --border: var(--color-neutral-700);\n  --input: var(--color-neutral-700);\n}`;
}

/**
 * Generate Tailwind configuration from brand system
 */
export function generateTailwindConfig(brand: BrandSystem): TailwindBrandConfig {
  return {
    colors: generateTailwindColors(brand),
    fontFamily: generateTailwindFontFamily(brand),
    fontSize: generateTailwindFontSize(brand),
    spacing: generateTailwindSpacing(brand),
    borderRadius: generateTailwindBorderRadius(brand),
    boxShadow: generateTailwindBoxShadow(brand),
    animation: generateTailwindAnimation(brand),
    keyframes: generateTailwindKeyframes(),
  };
}

/**
 * Generate Tailwind color configuration
 */
function generateTailwindColors(
  brand: BrandSystem
): Record<string, string | Record<string, string>> {
  return {
    primary: colorScaleToTailwind(brand.colors.primary),
    secondary: colorScaleToTailwind(brand.colors.secondary),
    accent: colorScaleToTailwind(brand.colors.accent),
    neutral: colorScaleToTailwind(brand.colors.neutral),
    success: brand.colors.semantic.success,
    warning: brand.colors.semantic.warning,
    error: brand.colors.semantic.error,
    info: brand.colors.semantic.info,
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    muted: {
      DEFAULT: 'var(--muted)',
      foreground: 'var(--muted-foreground)',
    },
    border: 'var(--border)',
    input: 'var(--input)',
    ring: 'var(--ring)',
  };
}

/**
 * Convert color scale to Tailwind format
 */
function colorScaleToTailwind(scale: ColorScale): Record<string, string> {
  return {
    50: scale[50],
    100: scale[100],
    200: scale[200],
    300: scale[300],
    400: scale[400],
    500: scale[500],
    600: scale[600],
    700: scale[700],
    800: scale[800],
    900: scale[900],
    DEFAULT: scale[500],
  };
}

/**
 * Generate Tailwind font family configuration
 */
function generateTailwindFontFamily(brand: BrandSystem): Record<string, string[]> {
  return {
    heading: [brand.typography.fontFamily.heading, 'sans-serif'],
    body: [brand.typography.fontFamily.body, 'sans-serif'],
    mono: [brand.typography.fontFamily.mono, 'monospace'],
    sans: [brand.typography.fontFamily.body, 'sans-serif'],
  };
}

/**
 * Generate Tailwind font size configuration
 */
function generateTailwindFontSize(
  brand: BrandSystem
): Record<string, [string, { lineHeight: string }]> {
  const lineHeight = String(brand.typography.lineHeight.normal);

  return {
    xs: [brand.typography.fontSize.xs, { lineHeight }],
    sm: [brand.typography.fontSize.sm, { lineHeight }],
    base: [brand.typography.fontSize.base, { lineHeight }],
    lg: [brand.typography.fontSize.lg, { lineHeight }],
    xl: [brand.typography.fontSize.xl, { lineHeight }],
    '2xl': [brand.typography.fontSize['2xl'], { lineHeight: String(brand.typography.lineHeight.snug) }],
    '3xl': [brand.typography.fontSize['3xl'], { lineHeight: String(brand.typography.lineHeight.snug) }],
    '4xl': [brand.typography.fontSize['4xl'], { lineHeight: String(brand.typography.lineHeight.tight) }],
    '5xl': [brand.typography.fontSize['5xl'], { lineHeight: String(brand.typography.lineHeight.tight) }],
    '6xl': [brand.typography.fontSize['6xl'], { lineHeight: String(brand.typography.lineHeight.tight) }],
  };
}

/**
 * Generate Tailwind spacing configuration
 */
function generateTailwindSpacing(brand: BrandSystem): Record<string, string> {
  const spacing: Record<string, string> = {};

  brand.spacing.scale.forEach((multiplier, index) => {
    spacing[String(index)] = `${multiplier * brand.spacing.unit}px`;
  });

  // Add common named spacings
  spacing.px = '1px';
  spacing['0.5'] = `${brand.spacing.unit * 0.5}px`;
  spacing['1.5'] = `${brand.spacing.unit * 1.5}px`;
  spacing['2.5'] = `${brand.spacing.unit * 2.5}px`;
  spacing['3.5'] = `${brand.spacing.unit * 3.5}px`;

  return spacing;
}

/**
 * Generate Tailwind border radius configuration
 */
function generateTailwindBorderRadius(brand: BrandSystem): Record<string, string> {
  return { ...brand.borderRadius };
}

/**
 * Generate Tailwind box shadow configuration
 */
function generateTailwindBoxShadow(brand: BrandSystem): Record<string, string> {
  return { ...brand.shadows };
}

/**
 * Generate Tailwind animation configuration
 */
function generateTailwindAnimation(brand: BrandSystem): Record<string, string> {
  const duration = brand.animation.duration.normal;
  const easing = brand.animation.easing.easeInOut;

  return {
    'fade-in': `fadeIn ${duration} ${easing}`,
    'fade-out': `fadeOut ${duration} ${easing}`,
    'slide-in-up': `slideInUp ${duration} ${easing}`,
    'slide-in-down': `slideInDown ${duration} ${easing}`,
    'slide-in-left': `slideInLeft ${duration} ${easing}`,
    'slide-in-right': `slideInRight ${duration} ${easing}`,
    'scale-in': `scaleIn ${duration} ${easing}`,
    'scale-out': `scaleOut ${duration} ${easing}`,
    spin: 'spin 1s linear infinite',
    ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    bounce: `bounce 1s ${brand.animation.easing.bounce} infinite`,
  };
}

/**
 * Generate Tailwind keyframes configuration
 */
function generateTailwindKeyframes(): Record<string, Record<string, Record<string, string>>> {
  return {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    fadeOut: {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    slideInUp: {
      '0%': { transform: 'translateY(10px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideInDown: {
      '0%': { transform: 'translateY(-10px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideInLeft: {
      '0%': { transform: 'translateX(-10px)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    slideInRight: {
      '0%': { transform: 'translateX(10px)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    scaleIn: {
      '0%': { transform: 'scale(0.95)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
    scaleOut: {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '100%': { transform: 'scale(0.95)', opacity: '0' },
    },
    spin: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    ping: {
      '75%, 100%': { transform: 'scale(2)', opacity: '0' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '.5' },
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
      '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
    },
  };
}

/**
 * Export theme as a Tailwind config file string
 */
export function exportTailwindConfigFile(brand: BrandSystem): string {
  const config = generateTailwindConfig(brand);

  return `// Auto-generated Tailwind configuration for ${brand.name}
// Generated at: ${new Date().toISOString()}

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: ${JSON.stringify(config.colors, null, 6).replace(/"/g, "'")},
      fontFamily: ${JSON.stringify(config.fontFamily, null, 6).replace(/"/g, "'")},
      fontSize: ${JSON.stringify(config.fontSize, null, 6).replace(/"/g, "'")},
      spacing: ${JSON.stringify(config.spacing, null, 6).replace(/"/g, "'")},
      borderRadius: ${JSON.stringify(config.borderRadius, null, 6).replace(/"/g, "'")},
      boxShadow: ${JSON.stringify(config.boxShadow, null, 6).replace(/"/g, "'")},
      animation: ${JSON.stringify(config.animation, null, 6).replace(/"/g, "'")},
      keyframes: ${JSON.stringify(config.keyframes, null, 6).replace(/"/g, "'")},
    },
  },
  plugins: [],
};

export default config;
`;
}

/**
 * Export theme as a CSS file string
 */
export function exportCSSFile(brand: BrandSystem): string {
  const { cssString } = generateTheme(brand);

  return `/* Auto-generated CSS variables for ${brand.name} */
/* Generated at: ${new Date().toISOString()} */

${cssString}

/* Utility classes */
.font-heading {
  font-family: var(--font-heading), sans-serif;
}

.font-body {
  font-family: var(--font-body), sans-serif;
}

.font-mono {
  font-family: var(--font-mono), monospace;
}

/* Animation utilities */
.animate-fade-in {
  animation: fadeIn var(--duration-normal) var(--easing-easeInOut);
}

.animate-slide-up {
  animation: slideInUp var(--duration-normal) var(--easing-easeInOut);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
`;
}
