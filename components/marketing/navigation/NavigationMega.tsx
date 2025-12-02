'use client';

/**
 * NavigationMega Component
 *
 * An advanced navigation with mega dropdown menus, announcement bar,
 * and rich content support. Ideal for complex sites with many pages.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, container, focusRing } from '@/lib/design-system';
import type { NavigationMegaProps, NavItem, NavDropdown } from './types';
import { isNavDropdown } from './types';

function MegaMenu({ item, isOpen }: { item: NavDropdown; isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 right-0 top-full"
        >
          <div className="border-b border-[var(--color-border)] bg-[var(--color-card)] shadow-lg">
            <div className={cn(container('lg'), 'py-8')}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {item.items.map((subItem) => (
                  <a
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      'group flex items-start gap-4 rounded-lg p-3',
                      'transition-colors hover:bg-[var(--color-muted)]'
                    )}
                  >
                    {subItem.icon && (
                      <div className="flex-shrink-0 p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        {subItem.icon}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary)]">
                        {subItem.label}
                      </p>
                      {subItem.description && (
                        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                          {subItem.description}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavItemComponent({
  item,
  isOpen,
  onOpen,
  onClose,
}: {
  item: NavItem;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  if (isNavDropdown(item)) {
    return (
      <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
        <button
          className={cn(
            'flex items-center gap-1 py-2 text-sm font-medium',
            'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            'transition-colors',
            isOpen && 'text-[var(--color-foreground)]'
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

export function NavigationMega({
  logo,
  companyName = 'Company',
  items = [],
  buttons = [],
  announcement,
  sticky = true,
  transparent = false,
  className,
}: NavigationMegaProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(true);

  return (
    <header
      className={cn(
        'w-full z-50',
        sticky && 'sticky top-0',
        className
      )}
    >
      {/* Announcement Bar */}
      {announcement && isAnnouncementVisible && (
        <div className="bg-[var(--color-primary)] text-white">
          <div className={cn(container('lg'), 'py-2 flex items-center justify-center gap-2 text-sm')}>
            <span>{announcement.text}</span>
            {announcement.link && (
              <a
                href={announcement.link.href}
                className="font-medium underline underline-offset-4 hover:no-underline"
              >
                {announcement.link.label}
              </a>
            )}
            {announcement.dismissible && (
              <button
                onClick={() => setIsAnnouncementVisible(false)}
                className="absolute right-4 p-1 hover:bg-white/20 rounded"
                aria-label="Dismiss announcement"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <div
        className={cn(
          transparent
            ? 'bg-transparent'
            : 'bg-[var(--color-background)] border-b border-[var(--color-border)]'
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
            <div className="hidden lg:flex items-center gap-8">
              {items.map((item, index) => (
                <NavItemComponent
                  key={index}
                  item={item}
                  isOpen={openDropdown === index}
                  onOpen={() => setOpenDropdown(index)}
                  onClose={() => setOpenDropdown(null)}
                />
              ))}
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

          {/* Mega Menu (Desktop) */}
          {items.map((item, index) => {
            if (isNavDropdown(item)) {
              return (
                <div
                  key={index}
                  onMouseEnter={() => setOpenDropdown(index)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <MegaMenu item={item} isOpen={openDropdown === index} />
                </div>
              );
            }
            return null;
          })}
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-[var(--color-border)]"
            >
              <div className={cn(container('lg'), 'py-4 space-y-2')}>
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
                            {subItem.description && (
                              <span className="block text-xs text-[var(--color-muted-foreground)]">
                                {subItem.description}
                              </span>
                            )}
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
      </div>
    </header>
  );
}

NavigationMega.displayName = 'NavigationMega';
