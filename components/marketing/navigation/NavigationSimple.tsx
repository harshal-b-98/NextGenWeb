'use client';

/**
 * NavigationSimple Component
 *
 * A clean, straightforward navigation bar with logo, links, and CTA buttons.
 * Perfect for most marketing websites.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, container, focusRing } from '@/lib/design-system';
import type { NavigationSimpleProps, NavItem, NavDropdown } from './types';
import { isNavDropdown } from './types';

function DropdownMenu({ item, isOpen }: { item: NavDropdown; isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 top-full pt-2"
        >
          <div className="min-w-[200px] rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-lg">
            {item.items.map((subItem) => (
              <a
                key={subItem.href}
                href={subItem.href}
                className={cn(
                  'block rounded-md px-3 py-2',
                  'text-sm text-[var(--color-foreground)]',
                  'transition-colors hover:bg-[var(--color-muted)]'
                )}
              >
                {subItem.label}
                {subItem.description && (
                  <span className="block text-xs text-[var(--color-muted-foreground)]">
                    {subItem.description}
                  </span>
                )}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavItemComponent({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = useState(false);

  if (isNavDropdown(item)) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <button
          className={cn(
            'flex items-center gap-1 py-2 text-sm font-medium',
            'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            'transition-colors'
          )}
          aria-expanded={isOpen}
        >
          {item.label}
          <svg
            className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <DropdownMenu item={item} isOpen={isOpen} />
      </div>
    );
  }

  return (
    <a
      href={item.href}
      className={cn(
        'py-2 text-sm font-medium',
        'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
        'transition-colors'
      )}
    >
      {item.label}
    </a>
  );
}

export function NavigationSimple({
  logo,
  companyName = 'Company',
  items = [],
  buttons = [],
  sticky = true,
  transparent = false,
  centered = false,
  className,
}: NavigationSimpleProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        'w-full z-50',
        sticky && 'sticky top-0',
        transparent
          ? 'bg-transparent'
          : 'bg-[var(--color-background)] border-b border-[var(--color-border)]',
        className
      )}
    >
      <nav className={container('lg')}>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            {logo || (
              <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)]" />
            )}
            <span className="text-lg font-semibold text-[var(--color-foreground)]">
              {companyName}
            </span>
          </a>

          {/* Desktop Navigation */}
          <div
            className={cn(
              'hidden lg:flex items-center',
              centered ? 'absolute left-1/2 -translate-x-1/2' : 'gap-8'
            )}
          >
            <div className="flex items-center gap-6">
              {items.map((item, index) => (
                <NavItemComponent key={index} item={item} />
              ))}
            </div>
          </div>

          {/* Desktop CTA Buttons */}
          {buttons.length > 0 && (
            <div className="hidden lg:flex items-center gap-3">
              {buttons.map((button, index) => (
                <a
                  key={index}
                  href={button.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium',
                    'transition-colors duration-200',
                    button.variant === 'primary' &&
                      'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
                    button.variant === 'secondary' &&
                      'bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]',
                    button.variant === 'outline' &&
                      'border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
                    button.variant === 'ghost' &&
                      'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
                    !button.variant &&
                      'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
                    focusRing()
                  )}
                >
                  {button.label}
                </a>
              ))}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              'lg:hidden p-2 rounded-lg',
              'text-[var(--color-foreground)]',
              'hover:bg-[var(--color-muted)]',
              focusRing()
            )}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {items.map((item, index) => {
                  if (isNavDropdown(item)) {
                    return (
                      <div key={index} className="space-y-1">
                        <p className="px-3 py-2 text-sm font-medium text-[var(--color-foreground)]">
                          {item.label}
                        </p>
                        {item.items.map((subItem) => (
                          <a
                            key={subItem.href}
                            href={subItem.href}
                            className="block px-6 py-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                          >
                            {subItem.label}
                          </a>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <a
                      key={index}
                      href={item.href}
                      className="block px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                    >
                      {item.label}
                    </a>
                  );
                })}
                {buttons.length > 0 && (
                  <div className="pt-4 space-y-2">
                    {buttons.map((button, index) => (
                      <a
                        key={index}
                        href={button.href}
                        className={cn(
                          'block px-4 py-2 rounded-lg text-sm font-medium text-center',
                          button.variant === 'primary' &&
                            'bg-[var(--color-primary)] text-white',
                          button.variant === 'outline' &&
                            'border border-[var(--color-border)] text-[var(--color-foreground)]',
                          (!button.variant || button.variant === 'ghost' || button.variant === 'secondary') &&
                            'bg-[var(--color-muted)] text-[var(--color-foreground)]'
                        )}
                      >
                        {button.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

NavigationSimple.displayName = 'NavigationSimple';
