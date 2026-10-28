import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const BuilderSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Builder Toolbar Skeleton */}
      <div className="flex flex-col gap-2.5 p-3 bg-card rounded-md border border-border">
        {/* Top Bar: Return to Workspace + Form Title & Action Buttons */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            {/* Return to workspace button */}
            <div className="flex items-center gap-1.5 h-7.5 px-2">
              <Skeleton className="size-3.5 rounded-xs" />
              <Skeleton className="h-3.5 w-16 rounded" />
            </div>

            <div className="h-4 w-px bg-border" />

            {/* Title & Badges */}
            <div className="flex items-center gap-2 truncate">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-4 w-12 rounded-xs" />
              <Skeleton className="h-4 w-14 rounded-xs" />
              <Skeleton className="h-4 w-14 rounded-xs" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-7.5 w-20 rounded-md" />
            <Skeleton className="h-7.5 w-24 rounded-md" />
            <Skeleton className="h-7.5 w-18 rounded-md" />
          </div>
        </div>

        {/* Tabs Row (Canvas, Settings, Quiz, Preview) */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <Skeleton className="h-7.5 w-24 rounded-md" />
          <Skeleton className="h-7.5 w-20 rounded-md" />
          <Skeleton className="h-7.5 w-24 rounded-md" />
          <Skeleton className="h-7.5 w-20 rounded-md" />
        </div>
      </div>

      {/* Main 2-Column Layout: Left Palette (w-72 sm:w-80), Right Canvas (flex-1) */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start w-full">
        {/* Left: Element & Section Palette */}
        <div className="builder-sidebar-panel space-y-3.5 px-3.5 sm:px-4 py-4 rounded-lg border border-border bg-card w-72 sm:w-80 shrink-0">
          {/* Header */}
          <div className="pb-2 border-b border-border/60 space-y-1">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>

          {/* Fields / Sections Tabs */}
          <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-lg border border-border/70 gap-1">
            <Skeleton className="h-7 w-full rounded-md" />
            <Skeleton className="h-7 w-full rounded-md" />
          </div>

          {/* Search Box */}
          <Skeleton className="h-8 w-full rounded-md" />

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <Skeleton className="h-6 w-10 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          {/* Draggable Element Cards */}
          <div className="space-y-1.5 pt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="builder-element-card p-2.5 rounded-md border border-border bg-card flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-3.5 w-24 rounded" />
                </div>
                <Skeleton className="h-3 w-8 rounded-xs" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Drag-and-drop Canvas taking all remaining width */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Form Title & Description Card */}
          <div className="card-surface p-5 sm:p-6 rounded-lg border border-border space-y-3">
            <Skeleton className="h-7 w-1/2 rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
          </div>

          {/* Section Container Card */}
          <div className="border border-border bg-card rounded-md p-4 space-y-3.5">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3.5 w-16 rounded-xs" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="size-6 rounded" />
                <Skeleton className="size-6 rounded" />
                <Skeleton className="size-6 rounded" />
              </div>
            </div>

            {/* Questions Grid within Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Question Item 1 */}
              <div className="border border-border bg-background p-3.5 rounded-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-28 rounded" />
                  <Skeleton className="size-5 rounded" />
                </div>
                <Skeleton className="h-9 w-full rounded-md" />
              </div>

              {/* Question Item 2 */}
              <div className="border border-border bg-background p-3.5 rounded-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-32 rounded" />
                  <Skeleton className="size-5 rounded" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-6 w-full rounded-md" />
                  <Skeleton className="h-6 w-full rounded-md" />
                </div>
              </div>

              {/* Question Item 3 - Spanning Full Width */}
              <div className="col-span-1 md:col-span-2 border border-border bg-background p-3.5 rounded-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-36 rounded" />
                  <Skeleton className="size-5 rounded" />
                </div>
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
            </div>
          </div>

          {/* Bottom Drop Zone Indicator */}
          <div className="p-8 rounded-lg border-2 border-dashed border-border bg-muted/10 flex items-center justify-center gap-2">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-3.5 w-44 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};
