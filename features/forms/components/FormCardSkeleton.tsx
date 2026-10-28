import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const FormCardSkeleton: React.FC = () => {
  return (
    <div className="card-surface p-4.5 flex flex-col justify-between rounded-md min-h-[220px]">
      <div>
        {/* Header: Icon, Title & Badge, Status */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Skeleton className="size-8 rounded-md shrink-0" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-16 rounded-xs" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-sm shrink-0" />
        </div>

        {/* Description lines */}
        <div className="space-y-1.5 min-h-[32px] mb-3 mt-3">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-4/5 rounded" />
        </div>

        {/* Metadata row */}
        <div className="grid grid-cols-2 gap-2 py-2.5 border-t border-b border-border/70 mb-3">
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-3 rounded-full shrink-0" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <Skeleton className="size-3 rounded-full shrink-0" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
        <Skeleton className="size-7 rounded-md" />
      </div>
    </div>
  );
};
