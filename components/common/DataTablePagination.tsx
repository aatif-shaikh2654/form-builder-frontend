'use client';

import * as React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from 'cn';

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
  itemLabel?: string;
  className?: string;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  itemLabel = 'entries',
  className,
}) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), safeTotalPages);

  const startEntry = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endEntry = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers with ellipses for rich pagination
  const pageNumbers = React.useMemo(() => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];

    if (safeCurrentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safeCurrentPage < safeTotalPages - 2) {
      pages.push('ellipsis');
    }

    pages.push(safeTotalPages);
    return pages;
  }, [safeCurrentPage, safeTotalPages]);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3.5 pt-3 px-1 text-xs text-muted-foreground border-t border-border select-none',
        className
      )}
    >
      {/* Left: Rows Per Page & Entry Range */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Rows per page:
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              if (val) onPageSizeChange(Number(val));
            }}
            disabled={isLoading}
          >
            <SelectTrigger
              size="sm"
              className="h-8 w-[72px] text-xs font-mono bg-card border-border hover:bg-muted/30 focus-visible:ring-primary/30 cursor-pointer shadow-2xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)} className="text-xs font-mono cursor-pointer">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {totalItems === 0 ? (
            <span>No {itemLabel}</span>
          ) : (
            <>
              Showing <strong className="font-semibold text-foreground font-mono">{startEntry}</strong> to{' '}
              <strong className="font-semibold text-foreground font-mono">{endEntry}</strong> of{' '}
              <strong className="font-semibold text-foreground font-mono">{totalItems}</strong> {itemLabel}
            </>
          )}
        </span>
      </div>

      {/* Right: Shadcn Pagination Controls */}
      <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
        <Pagination className="mx-0 w-auto">
          <PaginationContent className="gap-1">
            {/* Jump to First Page (shown on multi-page lists) */}
            {safeTotalPages > 3 && (
              <PaginationItem className="hidden md:block">
                <PaginationLink
                  aria-label="Go to first page"
                  size="icon-sm"
                  onClick={() => onPageChange(1)}
                  disabled={safeCurrentPage <= 1 || isLoading}
                  className="size-8 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="First page"
                >
                  <ChevronsLeft className="size-3.5" />
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Previous Page */}
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                disabled={safeCurrentPage <= 1 || isLoading}
                className="disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </PaginationItem>

            {/* Numeric Page Buttons (Desktop / Tablet) */}
            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((p, idx) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === safeCurrentPage}
                      onClick={() => onPageChange(p)}
                      disabled={isLoading}
                      className="size-8 text-xs font-mono cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
            </div>

            {/* Compact Indicator for Mobile Only */}
            <PaginationItem className="sm:hidden px-2 font-mono text-xs text-foreground font-medium">
              {safeCurrentPage} / {safeTotalPages}
            </PaginationItem>

            {/* Next Page */}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
                disabled={safeCurrentPage >= safeTotalPages || isLoading}
                className="disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </PaginationItem>

            {/* Jump to Last Page (shown on multi-page lists) */}
            {safeTotalPages > 3 && (
              <PaginationItem className="hidden md:block">
                <PaginationLink
                  aria-label="Go to last page"
                  size="icon-sm"
                  onClick={() => onPageChange(safeTotalPages)}
                  disabled={safeCurrentPage >= safeTotalPages || isLoading}
                  className="size-8 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  <ChevronsRight className="size-3.5" />
                </PaginationLink>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
