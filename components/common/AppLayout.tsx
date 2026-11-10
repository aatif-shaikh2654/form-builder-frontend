'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { cn } from 'cn';

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutInner({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/register';

  const isStandaloneFormPage =
    pathname.startsWith('/preview') ||
    pathname.startsWith('/f/') ||
    pathname.startsWith('/published');

  if (isAuthPage || isStandaloneFormPage) {
    return (
      <main className="w-full min-h-screen p-0 m-0 bg-background border-0">
        {children}
      </main>
    );
  }

  const isBuilderPage = pathname.startsWith('/builder');

  return (
    <>
      <Header />
      <main
        className={cn(
          'flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
          isBuilderPage ? 'max-w-none' : 'max-w-[1600px]'
        )}
      >
        {children}
      </main>
    </>
  );
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <Suspense fallback={<main className="w-full min-h-screen bg-background">{children}</main>}>
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  );
};
