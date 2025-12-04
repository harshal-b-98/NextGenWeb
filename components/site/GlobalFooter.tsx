'use client';

/**
 * Global Footer Component
 *
 * Renders a dynamic footer based on content from the database.
 * Supports multiple column layouts, social links, and various background styles.
 *
 * Story #127: Dynamic Header/Footer Rendering Components
 * Task #140: Create GlobalFooter component
 */

import Link from 'next/link';
import {
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Github,
  LucideIcon,
} from 'lucide-react';
import type { FooterContent } from '@/lib/layout/global-components';

interface GlobalFooterProps {
  websiteSlug: string;
  content: FooterContent;
  primaryColor?: string;
}

// Social platform to icon mapping
const socialIcons: Record<string, LucideIcon> = {
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  github: Github,
};

export function GlobalFooter({
  websiteSlug,
  content,
  primaryColor = '#3B82F6',
}: GlobalFooterProps) {
  const {
    companyName,
    logo,
    description,
    columns = [],
    socialLinks = [],
    bottomLinks = [],
    copyright,
    background = 'dark',
  } = content;

  // Resolve href to include website slug prefix
  const resolveHref = (href: string) => {
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return href;
    }
    // For homepage
    if (href === '/' || href === '') {
      return `/sites/${websiteSlug}`;
    }
    // For other pages
    return `/sites/${websiteSlug}${href.startsWith('/') ? href : `/${href}`}`;
  };

  // Background styles
  const bgStyles = {
    dark: 'bg-gray-900 text-white',
    light: 'bg-gray-50 text-gray-900',
    brand: 'text-white',
  };

  const textStyles = {
    dark: {
      primary: 'text-white',
      secondary: 'text-gray-400',
      heading: 'text-white',
      link: 'text-gray-400 hover:text-white',
      border: 'border-gray-800',
    },
    light: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      heading: 'text-gray-900',
      link: 'text-gray-600 hover:text-gray-900',
      border: 'border-gray-200',
    },
    brand: {
      primary: 'text-white',
      secondary: 'text-white/70',
      heading: 'text-white',
      link: 'text-white/70 hover:text-white',
      border: 'border-white/20',
    },
  };

  const styles = textStyles[background];

  return (
    <footer
      className={`py-12 mt-auto ${bgStyles[background]}`}
      style={{
        backgroundColor: background === 'brand' ? primaryColor : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info Column */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            {/* Logo */}
            {logo?.url ? (
              <Link href={`/sites/${websiteSlug}`} className="inline-block mb-4">
                <img
                  src={logo.url}
                  alt={logo.alt || companyName || 'Logo'}
                  className="h-8 w-auto"
                />
              </Link>
            ) : companyName ? (
              <Link
                href={`/sites/${websiteSlug}`}
                className={`text-lg font-bold ${styles.heading} mb-4 inline-block`}
              >
                {companyName}
              </Link>
            ) : null}

            {/* Description */}
            {description && (
              <p className={`${styles.secondary} text-sm mt-4 max-w-xs`}>
                {description}
              </p>
            )}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center space-x-4 mt-6">
                {socialLinks.map((social, index) => {
                  const Icon = socialIcons[social.platform.toLowerCase()];
                  if (!Icon) return null;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.link} transition-colors`}
                      aria-label={social.platform}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link Columns */}
          {columns.map((column, index) => (
            <div key={index}>
              <h4 className={`text-sm font-semibold ${styles.heading} uppercase tracking-wider mb-4`}>
                {column.title}
              </h4>
              <ul className="space-y-3">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={resolveHref(link.href)}
                      className={`text-sm ${styles.link} transition-colors`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className={`border-t ${styles.border} mt-10 pt-8`}>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <p className={`text-sm ${styles.secondary}`}>
              {copyright || `\u00A9 ${new Date().getFullYear()} ${companyName || 'Company'}. All rights reserved.`}
            </p>

            {/* Bottom Links */}
            {bottomLinks.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                {bottomLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={resolveHref(link.href)}
                    className={`text-sm ${styles.link} transition-colors`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Default footer for fallback when no database content exists
 */
export function DefaultFooter({
  websiteSlug,
  websiteName,
  pages,
  primaryColor = '#3B82F6',
}: {
  websiteSlug: string;
  websiteName: string;
  pages: Array<{ title: string; slug: string; is_homepage?: boolean }>;
  primaryColor?: string;
}) {
  // Split pages into columns
  const nonHomepagePages = pages.filter((p) => !p.is_homepage);
  const midpoint = Math.ceil(nonHomepagePages.length / 2);
  const column1Pages = nonHomepagePages.slice(0, Math.min(midpoint, 5));
  const column2Pages = nonHomepagePages.slice(midpoint, midpoint + 5);

  const footerContent: FooterContent = {
    companyName: websiteName,
    description: `${websiteName} - Your trusted partner.`,
    columns: [
      {
        title: 'Pages',
        links: column1Pages.map((p) => ({
          label: p.title,
          href: p.slug.startsWith('/') ? p.slug : `/${p.slug}`,
        })),
      },
      ...(column2Pages.length > 0
        ? [
            {
              title: 'More',
              links: column2Pages.map((p) => ({
                label: p.title,
                href: p.slug.startsWith('/') ? p.slug : `/${p.slug}`,
              })),
            },
          ]
        : []),
      {
        title: 'Legal',
        links: [
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
        ],
      },
    ],
    bottomLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
    copyright: `\u00A9 ${new Date().getFullYear()} ${websiteName}. All rights reserved.`,
    background: 'dark',
  };

  return (
    <GlobalFooter
      websiteSlug={websiteSlug}
      content={footerContent}
      primaryColor={primaryColor}
    />
  );
}
