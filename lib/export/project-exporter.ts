/**
 * Next.js Project Exporter
 * Phase 5.3: Export & Deployment
 *
 * Generates a complete standalone Next.js project from website data.
 */

import type { RuntimePageData, RuntimeBrandConfig } from '@/lib/runtime/types';

/**
 * Export configuration options
 */
export interface ExportConfig {
  /** Project name (used for package.json) */
  projectName: string;

  /** Project description */
  description?: string;

  /** Include TypeScript configuration */
  typescript: boolean;

  /** Include Tailwind CSS */
  tailwind: boolean;

  /** Include example environment file */
  includeEnvExample: boolean;

  /** Include Docker configuration */
  includeDocker: boolean;

  /** Author name for package.json */
  author?: string;

  /** Version number */
  version?: string;
}

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  projectName: 'my-website',
  typescript: true,
  tailwind: true,
  includeEnvExample: true,
  includeDocker: false,
  version: '0.1.0',
};

/**
 * Exported file structure
 */
export interface ExportedFile {
  path: string;
  content: string;
  isDirectory?: boolean;
}

/**
 * Export result
 */
export interface ExportResult {
  files: ExportedFile[];
  totalSize: number;
  fileCount: number;
}

/**
 * Website data for export
 */
export interface WebsiteExportData {
  websiteId: string;
  websiteName: string;
  domain?: string;
  brandConfig?: RuntimeBrandConfig;
  pages: RuntimePageData[];
}

/**
 * Generate a complete Next.js project from website data
 */
export function generateNextJsProject(
  websiteData: WebsiteExportData,
  config: Partial<ExportConfig> = {}
): ExportResult {
  const fullConfig: ExportConfig = { ...DEFAULT_EXPORT_CONFIG, ...config };
  const files: ExportedFile[] = [];

  // Generate package.json
  files.push(generatePackageJson(fullConfig, websiteData));

  // Generate Next.js config
  files.push(generateNextConfig(fullConfig));

  // Generate TypeScript config
  if (fullConfig.typescript) {
    files.push(generateTsConfig());
  }

  // Generate Tailwind config
  if (fullConfig.tailwind) {
    files.push(generateTailwindConfig(websiteData.brandConfig));
    files.push(generatePostCssConfig());
  }

  // Generate global styles
  files.push(generateGlobalStyles(websiteData.brandConfig, fullConfig.tailwind));

  // Generate layout
  files.push(generateRootLayout(websiteData, fullConfig));

  // Generate pages
  for (const page of websiteData.pages) {
    files.push(generatePage(page, fullConfig));
  }

  // Generate components
  files.push(...generateComponentFiles(websiteData.pages));

  // Generate lib utilities
  files.push(...generateLibFiles());

  // Generate README
  files.push(generateReadme(websiteData, fullConfig));

  // Generate .gitignore
  files.push(generateGitignore());

  // Generate env example
  if (fullConfig.includeEnvExample) {
    files.push(generateEnvExample());
  }

  // Generate Docker files
  if (fullConfig.includeDocker) {
    files.push(...generateDockerFiles(fullConfig));
  }

  // Calculate total size
  const totalSize = files.reduce((sum, f) => sum + (f.content?.length || 0), 0);

  return {
    files,
    totalSize,
    fileCount: files.length,
  };
}

/**
 * Generate package.json
 */
function generatePackageJson(config: ExportConfig, website: WebsiteExportData): ExportedFile {
  const packageJson = {
    name: config.projectName,
    version: config.version,
    description: config.description || `${website.websiteName} - Generated with NextGenWeb`,
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      next: '^14.2.0',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'framer-motion': '^11.0.0',
      ...(config.tailwind ? { tailwindcss: '^3.4.0' } : {}),
    },
    devDependencies: {
      ...(config.typescript
        ? {
            typescript: '^5.3.0',
            '@types/node': '^20.10.0',
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
          }
        : {}),
      ...(config.tailwind
        ? {
            autoprefixer: '^10.4.0',
            postcss: '^8.4.0',
          }
        : {}),
      eslint: '^8.56.0',
      'eslint-config-next': '^14.2.0',
    },
    ...(config.author ? { author: config.author } : {}),
  };

  return {
    path: 'package.json',
    content: JSON.stringify(packageJson, null, 2),
  };
}

/**
 * Generate next.config.js
 */
function generateNextConfig(config: ExportConfig): ExportedFile {
  const ext = config.typescript ? 'mjs' : 'js';
  const content = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    unoptimized: true,
  },
};

export default nextConfig;
`;

  return {
    path: `next.config.${ext}`,
    content,
  };
}

/**
 * Generate tsconfig.json
 */
function generateTsConfig(): ExportedFile {
  const tsconfig = {
    compilerOptions: {
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };

  return {
    path: 'tsconfig.json',
    content: JSON.stringify(tsconfig, null, 2),
  };
}

/**
 * Generate tailwind.config.js
 */
function generateTailwindConfig(brandConfig?: RuntimeBrandConfig): ExportedFile {
  const colors = brandConfig
    ? `
    colors: {
      primary: '${brandConfig.primaryColor}',
      secondary: '${brandConfig.secondaryColor}',
      accent: '${brandConfig.accentColor}',
    },`
    : '';

  const fontFamily = brandConfig?.fontFamily
    ? `
    fontFamily: {
      sans: ['${brandConfig.fontFamily}', 'system-ui', 'sans-serif'],
      ${brandConfig.headingFont ? `heading: ['${brandConfig.headingFont}', 'system-ui', 'sans-serif'],` : ''}
    },`
    : '';

  const content = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {${colors}${fontFamily}
    },
  },
  plugins: [],
};
`;

  return {
    path: 'tailwind.config.js',
    content,
  };
}

/**
 * Generate postcss.config.js
 */
function generatePostCssConfig(): ExportedFile {
  return {
    path: 'postcss.config.js',
    content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
  };
}

/**
 * Generate global styles
 */
function generateGlobalStyles(brandConfig?: RuntimeBrandConfig, tailwind: boolean = true): ExportedFile {
  let content = '';

  if (tailwind) {
    content = `@tailwind base;
@tailwind components;
@tailwind utilities;

`;
  }

  content += `:root {
  --primary-color: ${brandConfig?.primaryColor || '#3B82F6'};
  --secondary-color: ${brandConfig?.secondaryColor || '#10B981'};
  --accent-color: ${brandConfig?.accentColor || '#F59E0B'};
}

body {
  font-family: ${brandConfig?.fontFamily || 'system-ui'}, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;

  return {
    path: 'app/globals.css',
    content,
  };
}

/**
 * Generate root layout
 */
function generateRootLayout(website: WebsiteExportData, config: ExportConfig): ExportedFile {
  const ext = config.typescript ? 'tsx' : 'jsx';
  const typeAnnotation = config.typescript ? ': React.ReactNode' : '';

  const content = `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${website.websiteName}',
  description: '${config.description || 'Generated with NextGenWeb'}',
};

export default function RootLayout({
  children,
}${config.typescript ? ': { children: React.ReactNode }' : ''}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

  return {
    path: `app/layout.${ext}`,
    content,
  };
}

/**
 * Generate a page file
 */
function generatePage(page: RuntimePageData, config: ExportConfig): ExportedFile {
  const ext = config.typescript ? 'tsx' : 'jsx';
  const isHomepage = page.path === '/' || page.slug === 'home' || page.slug === 'index';
  const pagePath = isHomepage ? 'app/page' : `app/${page.slug}/page`;

  // Generate section imports and components
  const sectionComponents = page.sections.map((section, index) => {
    const componentName = `Section${index + 1}`;
    return {
      name: componentName,
      componentId: section.componentId,
      content: section.defaultContent,
    };
  });

  const imports = sectionComponents
    .map((s) => `import ${s.name} from '@/components/sections/${s.name}';`)
    .join('\n');

  const sections = sectionComponents.map((s) => `      <${s.name} />`).join('\n');

  const content = `${imports}

export const metadata = {
  title: '${page.metadata.title}',
  description: '${page.metadata.description}',
};

export default function ${isHomepage ? 'Home' : capitalize(page.slug)}Page() {
  return (
    <main>
${sections}
    </main>
  );
}
`;

  return {
    path: `${pagePath}.${ext}`,
    content,
  };
}

/**
 * Generate component files for all sections
 */
function generateComponentFiles(pages: RuntimePageData[]): ExportedFile[] {
  const files: ExportedFile[] = [];
  let sectionIndex = 0;

  for (const page of pages) {
    for (const section of page.sections) {
      sectionIndex++;
      const componentName = `Section${sectionIndex}`;
      files.push(generateSectionComponent(componentName, section.componentId, section.defaultContent));
    }
  }

  // Generate components index
  files.push({
    path: 'components/sections/index.ts',
    content: Array.from({ length: sectionIndex }, (_, i) => `export { default as Section${i + 1} } from './Section${i + 1}';`).join('\n'),
  });

  return files;
}

/**
 * Generate a section component
 */
function generateSectionComponent(name: string, componentId: string, content: any): ExportedFile {
  // Generate a basic section component based on content
  const headline = content?.headline || content?.title || 'Section Title';
  const subheadline = content?.subheadline || content?.subtitle || content?.description || '';
  const ctaText = content?.cta?.text || content?.ctaText || '';
  const ctaUrl = content?.cta?.url || content?.ctaUrl || '#';

  const componentContent = `'use client';

import { motion } from 'framer-motion';

export default function ${name}() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-16 px-4 md:px-8"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          ${escapeJsx(headline)}
        </h2>
        ${subheadline ? `<p className="text-lg text-gray-600 mb-8">
          ${escapeJsx(subheadline)}
        </p>` : ''}
        ${ctaText ? `<a
          href="${ctaUrl}"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          ${escapeJsx(ctaText)}
        </a>` : ''}
      </div>
    </motion.section>
  );
}
`;

  return {
    path: `components/sections/${name}.tsx`,
    content: componentContent,
  };
}

/**
 * Generate lib utility files
 */
function generateLibFiles(): ExportedFile[] {
  return [
    {
      path: 'lib/utils.ts',
      content: `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
    },
  ];
}

/**
 * Generate README.md
 */
function generateReadme(website: WebsiteExportData, config: ExportConfig): ExportedFile {
  const content = `# ${website.websiteName}

${config.description || 'A website generated with NextGenWeb.'}

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Install dependencies:

\`\`\`bash
npm install
# or
yarn install
\`\`\`

2. Run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

\`\`\`bash
npm run build
npm run start
\`\`\`

## Project Structure

\`\`\`
├── app/                  # Next.js App Router pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/           # React components
│   └── sections/         # Page section components
├── lib/                  # Utility functions
├── public/               # Static assets
└── package.json          # Dependencies
\`\`\`

## Pages

${website.pages.map((p) => `- **${p.title}** (${p.path})`).join('\n')}

## Customization

### Colors

Edit the Tailwind config (\`tailwind.config.js\`) to customize colors:

\`\`\`js
theme: {
  extend: {
    colors: {
      primary: '${website.brandConfig?.primaryColor || '#3B82F6'}',
      secondary: '${website.brandConfig?.secondaryColor || '#10B981'}',
      accent: '${website.brandConfig?.accentColor || '#F59E0B'}',
    },
  },
}
\`\`\`

### Typography

Update the font family in \`tailwind.config.js\` and \`app/globals.css\`.

---

Generated with [NextGenWeb](https://nextgenweb.app)
`;

  return {
    path: 'README.md',
    content,
  };
}

/**
 * Generate .gitignore
 */
function generateGitignore(): ExportedFile {
  return {
    path: '.gitignore',
    content: `# Dependencies
node_modules/
.pnp/
.pnp.js

# Build
.next/
out/
build/
dist/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Misc
*.log
`,
  };
}

/**
 * Generate .env.example
 */
function generateEnvExample(): ExportedFile {
  return {
    path: '.env.example',
    content: `# Environment Variables
# Copy this file to .env.local and fill in your values

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Analytics (optional)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
`,
  };
}

/**
 * Generate Docker files
 */
function generateDockerFiles(config: ExportConfig): ExportedFile[] {
  const dockerfile = `FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
`;

  const dockerignore = `node_modules
.next
.git
.gitignore
README.md
Dockerfile
.dockerignore
`;

  const dockerCompose = `version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
`;

  return [
    { path: 'Dockerfile', content: dockerfile },
    { path: '.dockerignore', content: dockerignore },
    { path: 'docker-compose.yml', content: dockerCompose },
  ];
}

// Helper functions

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, '');
}

function escapeJsx(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, ' ');
}
