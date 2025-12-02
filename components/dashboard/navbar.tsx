'use client';

/**
 * Dashboard Navbar Component
 * Global navigation bar for all dashboard/workspace pages
 * Includes sign out functionality
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';

export function DashboardNavbar() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  const userEmail = user?.email || 'User';
  const userName = user?.user_metadata?.full_name || userEmail.split('@')[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo / Brand */}
        <Link href="/workspaces" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-semibold text-lg hidden sm:inline">NextGenWeb</span>
        </Link>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            disabled={loading}
          >
            <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
              <User className="h-4 w-4 text-neutral-600" />
            </div>
            <span className="text-sm font-medium hidden sm:inline max-w-[150px] truncate">
              {userName}
            </span>
            <ChevronDown className="h-4 w-4 text-neutral-500" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-neutral-200 bg-white shadow-lg z-50">
                <div className="p-3 border-b border-neutral-100">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <p className="text-xs text-neutral-500 truncate">{userEmail}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isSigningOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
