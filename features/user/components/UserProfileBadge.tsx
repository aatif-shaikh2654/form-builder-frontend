'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useConfirmationStore } from '@/store/useConfirmationStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  LogOut,
  LogIn,
  ChevronDown,
  LayoutGrid,
  PlusCircle,
  UserCheck,
} from 'lucide-react';

export const UserProfileBadge: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUser();
  const confirm = useConfirmationStore((state) => state.confirm);

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Sign Out',
      description: 'Are you sure you want to sign out of your FormCraft session?',
      confirmText: 'Sign Out',
      cancelText: 'Stay Logged In',
      variant: 'default',
    });
    if (ok) {
      await logout();
      router.push('/login');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer text-xs font-medium h-8 rounded-md"
          >
            <LogIn className="size-3.5 mr-1" />
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
    );
  }

  // Safe fallback calculation so missing backend fields never crash the UI
  const displayName =
    user?.full_name?.trim() ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'User';
  const email = user?.email || '';
  const initial = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-border/70 bg-card/60 hover:bg-accent/80 hover:border-border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring select-none text-left shadow-xs">
        {/* Avatar */}
        <div className="size-7 rounded-md bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-bold text-xs shrink-0 group-hover:bg-primary/20 transition-colors">
          {initial}
        </div>

        {/* User Info details */}
        <div className="hidden sm:flex flex-col text-left max-w-[140px]">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-none truncate">
              {displayName}
            </span>
          </div>
        </div>

        {/* Dropdown Chevron */}
        <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 group-data-[popup-open]:rotate-180 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-68 p-1.5 shadow-xl border border-border/80 bg-popover/98 backdrop-blur-md rounded-xl"
      >
        {/* User Header Profile Card */}
        <div className="p-3 bg-muted/40 rounded-lg mb-1 border border-border/40">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold text-sm shrink-0 shadow-xs">
              {initial}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground truncate" title={displayName}>
                {displayName}
              </span>
              {email ? (
                <span className="text-[11px] text-muted-foreground truncate mt-0.5" title={email}>
                  {email}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/70 italic mt-0.5">
                  Authenticated session
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action / Navigation Items */}
        <div className="space-y-0.5">
          <DropdownMenuItem
            render={<Link href="/forms" />}
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-accent focus:bg-accent transition-colors"
          >
            <LayoutGrid className="size-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-foreground">My Forms Workspace</span>
              <span className="text-[10px] text-muted-foreground">Manage and view submissions</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            render={<Link href="/forms/new" />}
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-accent focus:bg-accent transition-colors"
          >
            <PlusCircle className="size-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-foreground">Create New Form</span>
              <span className="text-[10px] text-muted-foreground">Build interactive quizzes or surveys</span>
            </div>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Account Info Status */}
        <div className="px-2.5 py-1 text-[10px] text-muted-foreground flex items-center gap-1.5">
          <UserCheck className="size-3 text-emerald-500" />
          <span>Active Session</span>
        </div>

        <DropdownMenuSeparator className="my-1" />

        {/* Sign Out Button */}
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive transition-colors"
        >
          <LogOut className="size-3.5 text-destructive" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
