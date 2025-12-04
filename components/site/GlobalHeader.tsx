'use client';

/**
 * Global Header Component
 *
 * Renders a dynamic header/navigation based on content from the database.
 * Supports both simple navigation and mega-menu styles.
 *
 * Story #127: Dynamic Header/Footer Rendering Components
 * Task #139: Create GlobalHeader component
 */

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HeaderContent } from '@/lib/layout/global-components';

interface GlobalHeaderProps {
  websiteSlug: string;
  content: HeaderContent;
  navStyle?: 'simple' | 'mega-menu';
  primaryColor?: string;
  currentPath?: string;
}

export function GlobalHeader({
  websiteSlug,
  content,
  navStyle = 'simple',
  primaryColor = '#3B82F6',
  currentPath,
}: GlobalHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const {
    companyName,
    logo,
    navItems = [],
    ctaButton,
    secondaryButton,
    sticky = true,
    transparent = false,
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

  // Check if a path is active
  const isActive = (href: string) => {
    if (!currentPath) return false;
    const resolvedHref = resolveHref(href);
    return currentPath === resolvedHref || currentPath.startsWith(resolvedHref + '/');
  };

  return (
    <nav
      className={`
        ${sticky ? 'sticky top-0' : 'relative'}
        z-50
        ${transparent ? 'bg-transparent' : 'bg-white border-b border-gray-200'}
        transition-all duration-200
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo / Company Name */}
          <div className="flex items-center">
            <Link
              href={`/sites/${websiteSlug}`}
              className="flex items-center space-x-2"
            >
              {logo?.url ? (
                <img
                  src={logo.url}
                  alt={logo.alt || companyName || 'Logo'}
                  width={logo.width || 32}
                  height={logo.height || 32}
                  className="h-8 w-auto"
                />
              ) : null}
              {companyName && (
                <span className="text-xl font-bold text-gray-900">
                  {companyName}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {item.children && item.children.length > 0 ? (
                  // Dropdown nav item
                  <>
                    <button
                      className={`
                        inline-flex items-center px-3 py-2 text-sm font-medium rounded-md
                        transition-colors
                        ${isActive(item.href)
                          ? 'text-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                      style={{
                        color: isActive(item.href) ? primaryColor : undefined,
                      }}
                    >
                      {item.label}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className={`
                            absolute left-0 mt-1
                            ${navStyle === 'mega-menu' ? 'w-80' : 'w-56'}
                            bg-white rounded-lg shadow-lg border border-gray-200
                            py-2 z-50
                          `}
                        >
                          {item.children.map((child, childIndex) => (
                            <Link
                              key={childIndex}
                              href={resolveHref(child.href)}
                              className="block px-4 py-2 hover:bg-gray-50"
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {child.label}
                              </span>
                              {child.description && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {child.description}
                                </p>
                              )}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  // Simple nav link
                  <Link
                    href={resolveHref(item.href)}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive(item.href)
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                    style={{
                      color: isActive(item.href) ? primaryColor : undefined,
                    }}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            {/* CTA Buttons */}
            <div className="flex items-center space-x-3 ml-4">
              {secondaryButton && (
                <Link
                  href={resolveHref(secondaryButton.href)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {secondaryButton.label}
                </Link>
              )}
              {ctaButton && (
                <Link
                  href={resolveHref(ctaButton.href)}
                  className={`
                    px-4 py-2 text-sm font-semibold rounded-lg transition-colors
                    ${ctaButton.variant === 'primary'
                      ? 'text-white hover:opacity-90'
                      : ctaButton.variant === 'outline'
                        ? 'border-2 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }
                  `}
                  style={{
                    backgroundColor: ctaButton.variant === 'primary' ? primaryColor : undefined,
                    borderColor: ctaButton.variant === 'outline' ? primaryColor : undefined,
                    color: ctaButton.variant === 'outline' ? primaryColor : undefined,
                  }}
                >
                  {ctaButton.label}
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-gray-200 bg-white"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item, index) => (
                <div key={index}>
                  {item.children && item.children.length > 0 ? (
                    // Mobile dropdown
                    <div>
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === item.label ? null : item.label
                          )
                        }
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      >
                        {item.label}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            activeDropdown === item.label ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {activeDropdown === item.label && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-4 space-y-1"
                          >
                            {item.children.map((child, childIndex) => (
                              <Link
                                key={childIndex}
                                href={resolveHref(child.href)}
                                className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    // Mobile simple link
                    <Link
                      href={resolveHref(item.href)}
                      className={`
                        block px-3 py-2 rounded-md text-base font-medium
                        ${isActive(item.href)
                          ? 'bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                      style={{
                        color: isActive(item.href) ? primaryColor : undefined,
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              {/* Mobile CTA Buttons */}
              <div className="pt-4 space-y-2">
                {secondaryButton && (
                  <Link
                    href={resolveHref(secondaryButton.href)}
                    className="block w-full px-4 py-2 text-center text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {secondaryButton.label}
                  </Link>
                )}
                {ctaButton && (
                  <Link
                    href={resolveHref(ctaButton.href)}
                    className={`
                      block w-full px-4 py-2 text-center text-sm font-semibold rounded-lg
                      ${ctaButton.variant === 'primary'
                        ? 'text-white'
                        : ctaButton.variant === 'outline'
                          ? 'border-2'
                          : 'bg-gray-100 text-gray-900'
                      }
                    `}
                    style={{
                      backgroundColor: ctaButton.variant === 'primary' ? primaryColor : undefined,
                      borderColor: ctaButton.variant === 'outline' ? primaryColor : undefined,
                      color: ctaButton.variant === 'outline' ? primaryColor : ctaButton.variant === 'primary' ? 'white' : undefined,
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {ctaButton.label}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/**
 * Default header for fallback when no database content exists
 */
export function DefaultHeader({
  websiteSlug,
  websiteName,
  pages,
  primaryColor = '#3B82F6',
  currentPath,
}: {
  websiteSlug: string;
  websiteName: string;
  pages: Array<{ title: string; slug: string; is_homepage?: boolean }>;
  primaryColor?: string;
  currentPath?: string;
}) {
  const headerContent: HeaderContent = {
    companyName: websiteName,
    navItems: pages
      .filter((p) => !p.is_homepage)
      .slice(0, 5)
      .map((p) => ({
        label: p.title,
        href: p.slug.startsWith('/') ? p.slug : `/${p.slug}`,
      })),
    ctaButton: {
      label: 'Get Started',
      href: '/contact',
      variant: 'primary',
    },
    sticky: true,
  };

  return (
    <GlobalHeader
      websiteSlug={websiteSlug}
      content={headerContent}
      navStyle="simple"
      primaryColor={primaryColor}
      currentPath={currentPath}
    />
  );
}
