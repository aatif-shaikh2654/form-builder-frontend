'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useForms } from '../hooks/useForms';
import { FORM_FILTER_OPTIONS } from '../constants/forms.constants';
import { FormCard } from './FormCard';
import { FormCardSkeleton } from './FormCardSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FormType } from '@/types/api.types';
import {
  Plus,
  Sparkles,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  HelpCircle,
  X,
} from 'lucide-react';

export const FormList: React.FC = () => {
  const [filterType, setFilterType] = useState<FormType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input to prevent unnecessary network calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Hook for infinite scrolling, server-side pagination, search, and form_type filtering
  const {
    forms,
    total,
    stats,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    deleteForm,
  } = useForms({
    search: debouncedSearch,
    form_type: filterType,
    limit: 12,
  });

  // IntersectionObserver for seamless infinite scrolling
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isInitialLoading = (isLoading || isFetching) && forms.length === 0;
  const totalFormsCount = stats?.total_forms ?? total;
  const publishedCount = stats?.published ?? forms.filter((f) => f.status === 'PUBLISHED').length;
  const draftCount = stats?.drafts ?? forms.filter((f) => f.status === 'DRAFT').length;
  const quizCount = stats?.quizes ?? forms.filter((f) => f.form_type === 'QUIZ').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Forms Workspace
            </h1>
            {isInitialLoading ? (
              <Skeleton className="h-5 w-16 rounded-sm" />
            ) : (
              <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-semibold border border-primary/20">
                {totalFormsCount} Total
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your live forms, build surveys, configure quizzes, and inspect submissions.
          </p>
        </div>

        <Link href="/forms/new">
          <Button className="cursor-pointer gap-2 text-sm font-semibold py-3 px-5 bg-primary hover:bg-primary/90 text-primary-foreground self-start md:self-auto rounded-md">
            <Plus className="size-4" />
            Create New Form
          </Button>
        </Link>
      </div>

      {/* Metrics Row with Skeleton loading support */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="saas-stat-card rounded-md">
          <div className="flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">Total Forms</p>
            {isInitialLoading ? (
              <Skeleton className="h-6 w-12 rounded mt-1" />
            ) : (
              <p className="font-heading text-xl font-bold text-foreground mt-0.5">{totalFormsCount}</p>
            )}
          </div>
          <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileSpreadsheet className="size-4" />
          </div>
        </div>

        <div className="saas-stat-card rounded-md">
          <div className="flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">Published Live</p>
            {isInitialLoading ? (
              <Skeleton className="h-6 w-12 rounded mt-1" />
            ) : (
              <p className="font-heading text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {publishedCount}
              </p>
            )}
          </div>
          <div className="size-8 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="saas-stat-card rounded-md">
          <div className="flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">Drafts In Progress</p>
            {isInitialLoading ? (
              <Skeleton className="h-6 w-12 rounded mt-1" />
            ) : (
              <p className="font-heading text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {draftCount}
              </p>
            )}
          </div>
          <div className="size-8 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Layers className="size-4" />
          </div>
        </div>

        <div className="saas-stat-card rounded-md">
          <div className="flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">Quizzes / Tests</p>
            {isInitialLoading ? (
              <Skeleton className="h-6 w-12 rounded mt-1" />
            ) : (
              <p className="font-heading text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                {quizCount}
              </p>
            )}
          </div>
          <div className="size-8 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <HelpCircle className="size-4" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Search Input with Debounced Realtime Indicator */}
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search forms by title, slug, or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="!pl-9 pr-8 text-[13px] h-10 bg-card border-border rounded-md"
          />
          {isFetching && !isFetchingNextPage ? (
            <Skeleton className="size-3.5 rounded-full absolute right-3 top-1/2 -translate-y-1/2" />
          ) : searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {FORM_FILTER_OPTIONS.map((item) => {
            const isSelected = filterType === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilterType(item.id as FormType | 'ALL')}
                className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Forms Grid or Skeleton Grid or Empty State */}
      {isInitialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <FormCardSkeleton key={`initial-skeleton-${idx}`} />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="card-surface p-12 text-center text-muted-foreground rounded-md">
          <div className="size-12 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="size-6" />
          </div>
          <h3 className="font-heading text-base font-bold text-foreground">
            No matching forms found
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `No forms match your search query "${searchQuery}". Try adjusting your filters.`
              : filterType === 'ALL'
              ? 'Get started by creating your first form, quiz, or survey.'
              : `No forms of type "${filterType}" exist yet.`}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="cursor-pointer text-xs font-semibold h-8 rounded-md"
              >
                Clear Search
              </Button>
            )}
            <Link href="/forms/new">
              <Button size="sm" className="cursor-pointer gap-1.5 text-xs font-semibold h-8 rounded-md">
                <Plus className="size-3.5" />
                Create New Form
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <FormCard key={form.id} form={form} onDelete={deleteForm} />
            ))}

            {/* Seamless Skeleton Loading Cards for Infinite Scrolling */}
            {isFetchingNextPage &&
              Array.from({ length: 3 }).map((_, idx) => (
                <FormCardSkeleton key={`infinite-skeleton-${idx}`} />
              ))}
          </div>

          {/* Infinite Scroll Sentinel & Status Indicators */}
          <div ref={sentinelRef} className="py-6 flex flex-col items-center justify-center min-h-[56px]">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground py-2">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className="h-3 w-36 rounded" />
              </div>
            ) : hasNextPage ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                className="cursor-pointer text-xs font-semibold h-8 px-5 rounded-md border-border hover:border-primary/50"
              >
                Load More Forms
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70 font-mono py-2">
                <span className="size-1.5 rounded-full bg-emerald-500/80" />
                <span>
                  Showing all {forms.length} {forms.length === 1 ? 'form' : 'forms'} • All caught up
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
