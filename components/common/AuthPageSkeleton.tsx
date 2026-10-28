import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const AuthPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Left Showcase Side */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-slate-900 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-md bg-slate-800" />
            <Skeleton className="h-5 w-28 rounded bg-slate-800" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md bg-slate-800" />
        </div>

        <div className="space-y-4 my-auto max-w-md py-12">
          <Skeleton className="h-10 w-3/4 rounded bg-slate-800" />
          <Skeleton className="h-10 w-1/2 rounded bg-slate-800" />
          <Skeleton className="h-4 w-full rounded bg-slate-800 mt-2" />
          <Skeleton className="h-4 w-2/3 rounded bg-slate-800" />
        </div>

        <div className="text-xs text-slate-600 font-mono">
          <Skeleton className="h-3 w-40 rounded bg-slate-800" />
        </div>
      </div>

      {/* Right Form Side */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 bg-background">
        <div className="max-w-md w-full space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>

            <Skeleton className="h-11 w-full rounded-md mt-4" />
          </div>

          <div className="pt-2 flex justify-center">
            <Skeleton className="h-4 w-48 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};
