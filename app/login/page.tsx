'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { AuthPageSkeleton } from '@/components/common/AuthPageSkeleton';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticating, isAuthenticated } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe redirect extraction (prevent open-redirect vulnerabilities)
  const rawRedirect = searchParams.get('redirect');
  const redirectUrl =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/forms';

  // If already logged in, redirect to intended target or workspace
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsSubmitting(true);
      await login({ email, password });
      router.push(redirectUrl);
    } catch {
      // Handled in Axios client / UserContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonLoading = isSubmitting || isAuthenticating;

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background border-0 border-none shadow-none">
      {/* Left Showcase Side - Rich Solid Slate Background, Minimalist & Clean */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-slate-900 text-white border-0 border-none shadow-none">
        {/* Top Logo & Back Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="size-9 rounded-md bg-blue-600 text-white flex items-center justify-center transition-transform group-hover:scale-105 border-0">
              <Sparkles className="size-4.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">
                FormCraft
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-800 text-blue-400 border border-slate-700 font-semibold">
                Studio
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          >
            <span>Back to home</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Center Content: Minimal Headline & Subtitle */}
        <div className="space-y-4 my-auto max-w-md py-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Manage your forms, quizzes &amp; insights.
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Access real-time analytics, configure scoring parameters, and design responsive flows.
          </p>
        </div>

        {/* Bottom Minimal Brand Note */}
        <div className="text-xs text-slate-500 font-mono">
          FormCraft Studio &bull; Precision Form Builder
        </div>
      </div>

      {/* Right Form Side - Full Screen Height, Clean Centered Card, Zero Border, Zero Shadow */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 bg-background border-0 border-none shadow-none">
        <div className="max-w-md w-full space-y-6 border-0 border-none shadow-none">
          <div className="space-y-1.5 text-left">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Sign in to FormCraft
            </h1>
            <p className="text-xs text-muted-foreground">
              Enter your credentials to access your form workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="!pl-11 pr-4 py-3 text-sm rounded-md border-input shadow-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-semibold">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="!pl-11 !pr-11 py-3 text-sm rounded-md border-input shadow-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer p-0.5 rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isButtonLoading}
              className="cursor-pointer w-full text-sm font-semibold py-3 px-5 rounded-md gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-none mt-2"
            >
              {isButtonLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="size-3.5" />
                  Sign In to Workspace
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground pt-2">
            Don&apos;t have an account yet?{' '}
            <Link
              href={rawRedirect ? `/signup?redirect=${encodeURIComponent(rawRedirect)}` : '/signup'}
              className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              Create an account
              <ArrowRight className="size-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <LoginFormContent />
    </Suspense>
  );
}
