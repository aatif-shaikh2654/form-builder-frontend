'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface SubmissionsSkeletonProps {
  viewMode?: 'table' | 'cards';
  columnsCount?: number;
  rowsCount?: number;
}

export const SubmissionsSkeleton: React.FC<SubmissionsSkeletonProps> = ({
  viewMode = 'table',
  columnsCount = 5,
  rowsCount = 6,
}) => {
  if (viewMode === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full animate-in fade-in-50 duration-150">
        {Array.from({ length: rowsCount }).map((_, idx) => (
          <div
            key={idx}
            className="card-surface p-4 rounded-lg border border-border space-y-3 shadow-2xs"
          >
            {/* Top row */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-8 rounded" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-24 rounded" />
            </div>

            {/* Questions breakdown */}
            <div className="space-y-2.5 py-1">
              {Array.from({ length: 3 }).map((_, qIdx) => (
                <div key={qIdx} className="space-y-1">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton
                    className={`h-4 rounded ${
                      qIdx % 2 === 0 ? 'w-3/4' : 'w-1/2'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="card-surface rounded-lg border border-border overflow-hidden shadow-2xs w-full animate-in fade-in-50 duration-150">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground select-none">
              <th className="py-2.5 px-3 w-14 shrink-0 text-center">
                <Skeleton className="h-3 w-4 mx-auto rounded" />
              </th>
              <th className="py-2.5 px-3 min-w-[150px]">
                <Skeleton className="h-3 w-24 rounded" />
              </th>
              <th className="py-2.5 px-3 w-24">
                <Skeleton className="h-3 w-14 rounded" />
              </th>

              {Array.from({ length: columnsCount }).map((_, colIdx) => (
                <th key={colIdx} className="py-2.5 px-3 min-w-[180px]">
                  <div className="flex items-center gap-1.5">
                    <Skeleton
                      className={`h-3 rounded ${
                        colIdx % 2 === 0 ? 'w-24' : 'w-32'
                      }`}
                    />
                    <Skeleton className="h-2.5 w-12 rounded" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {Array.from({ length: rowsCount }).map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-muted/10 transition-colors">
                <td className="py-3 px-3 text-center">
                  <Skeleton className="h-3.5 w-5 mx-auto rounded" />
                </td>

                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="size-3 rounded-full" />
                    <Skeleton className="h-3 w-28 rounded" />
                  </div>
                </td>

                <td className="py-3 px-3">
                  <Skeleton className="h-4 w-16 rounded-full" />
                </td>

                {Array.from({ length: columnsCount }).map((_, cellIdx) => (
                  <td key={cellIdx} className="py-3 px-3">
                    {cellIdx === 2 ? (
                      /* File upload cell skeleton */
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="size-4.5 rounded" />
                        <Skeleton className="h-4 w-28 rounded" />
                      </div>
                    ) : cellIdx === 3 ? (
                      /* Rating star cell skeleton */
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="h-3 w-6 rounded" />
                      </div>
                    ) : (
                      /* Text answer skeleton */
                      <Skeleton
                        className={`h-3.5 rounded ${
                          (rowIdx + cellIdx) % 3 === 0
                            ? 'w-4/5'
                            : (rowIdx + cellIdx) % 2 === 0
                            ? 'w-1/2'
                            : 'w-2/3'
                        }`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

