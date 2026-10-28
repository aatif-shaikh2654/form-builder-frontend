'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { UserProfileBadge } from '@/features/user/components/UserProfileBadge';
import { Sparkles, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';

function HeaderAuthLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString();
  const fullPath = search ? `${pathname}?${search}` : pathname;
  const isExcluded =
    !fullPath ||
    fullPath === '/' ||
    fullPath.startsWith('/login') ||
    fullPath.startsWith('/signup') ||
    fullPath.startsWith('/register');
  const redirectTarget = isExcluded ? '' : fullPath;
  const loginHref = redirectTarget ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : '/login';
  const signupHref = redirectTarget ? `/signup?redirect=${encodeURIComponent(redirectTarget)}` : '/signup';

  return (
    <div className="flex items-center gap-2">
      <Link href={loginHref}>
        <Button
          variant="ghost"
          size="sm"
          className="cursor-pointer text-xs font-medium h-8 rounded-md"
        >
          Sign In
        </Button>
      </Link>
      <Link href={signupHref}>
        <Button
          size="sm"
          className="cursor-pointer text-xs font-semibold h-8 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Get Started
        </Button>
      </Link>
    </div>
  );
}

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { isAuthenticated } = useUser();

  // Hide header on login, signup, preview, and published form pages
  if (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/register' ||
    pathname.startsWith('/preview') ||
    pathname.startsWith('/f/') ||
    pathname.startsWith('/published')
  ) {
    return null;
  }

  const isWorkspace = pathname.startsWith('/forms');

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="size-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center transition-transform group-hover:scale-105">
              <Sparkles className="size-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
                FormCraft
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-muted text-muted-foreground border border-border">
                Studio
              </span>
            </div>
          </Link>

          {/* Minimalist Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/forms">
              <Button
                variant={isWorkspace ? 'secondary' : 'ghost'}
                size="sm"
                className={`cursor-pointer gap-1.5 text-xs font-medium h-7 rounded-md ${
                  isWorkspace ? 'bg-secondary text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="size-3" />
                Workspace
              </Button>
            </Link>
          </nav>
        </div>

        {/* Right Auth / Profile Controls */}
        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <Suspense
              fallback={
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer text-xs font-medium h-8 rounded-md"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      size="sm"
                      className="cursor-pointer text-xs font-semibold h-8 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              }
            >
              <HeaderAuthLinks />
            </Suspense>
          ) : (
            <UserProfileBadge />
          )}
        </div>
      </div>
    </header>
  );
};
