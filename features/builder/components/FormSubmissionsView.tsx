'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useBuilderStore } from '../store/builderStore';
import { useFormSubmissionsQuery } from '@/features/forms/hooks/useForms';
import type { SubmissionResponse, GetSubmissionsParams } from '@/types/api.types';
import type { FileItemData } from '@/components/ui/file-preview-dialog';
import { FilePreviewDrawer } from '@/components/ui/file-preview-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table2,
  Search,
  Download,
  RefreshCw,
  Inbox,
  List,
  LayoutGrid,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  QuestionColumn,
  SubmissionsTable,
  SubmissionsCardList,
  SubmissionsSkeleton,
  exportSubmissionsToCsv,
  formatDateTimeAnswer,
} from './submissions';
import { Skeleton } from '@/components/ui/skeleton';

export const FormSubmissionsView: React.FC = () => {
  const { formId, title, fields, setActiveBuilderTab } = useBuilderStore();

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query to avoid spamming API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page to 1 on search change
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const queryParams = useMemo<GetSubmissionsParams>(() => {
    const p: GetSubmissionsParams = {
      page,
      limit,
    };
    if (debouncedSearch.trim()) {
      p.search = debouncedSearch.trim();
    }
    return p;
  }, [page, limit, debouncedSearch]);

  const {
    data: analyticsData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useFormSubmissionsQuery(formId, queryParams);

  const submissions = useMemo<SubmissionResponse[]>(() => {
    if (!analyticsData) return [];
    if (Array.isArray(analyticsData)) return analyticsData;
    return analyticsData.items || [];
  }, [analyticsData]);

  const totalSubmissions = useMemo<number>(() => {
    if (analyticsData && !Array.isArray(analyticsData) && typeof analyticsData.total === 'number') {
      return analyticsData.total;
    }
    return submissions.length;
  }, [analyticsData, submissions.length]);

  const totalPages = useMemo<number>(() => {
    if (analyticsData && !Array.isArray(analyticsData) && typeof analyticsData.total_pages === 'number') {
      return Math.max(1, analyticsData.total_pages);
    }
    return Math.max(1, Math.ceil(totalSubmissions / limit));
  }, [analyticsData, totalSubmissions, limit]);

  const currentPage = analyticsData && !Array.isArray(analyticsData) && typeof analyticsData.page === 'number'
    ? analyticsData.page
    : page;

  const [previewFile, setPreviewFile] = useState<FileItemData | null>(null);
  const [previewFilesList, setPreviewFilesList] = useState<FileItemData[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const handleOpenPreview = (file: FileItemData, allFiles?: FileItemData[]) => {
    setPreviewFile(file);
    setPreviewFilesList(allFiles && allFiles.length > 0 ? allFiles : [file]);
  };

  // Dynamically extract all unique question columns from builder fields and submissions
  const dynamicColumns = useMemo<QuestionColumn[]>(() => {
    const colMap = new Map<string, QuestionColumn>();

    // 1. First add columns from builder fields to preserve user-defined form order
    fields.forEach((f) => {
      if (f.field_type !== 'SECTION_HEADING') {
        colMap.set(f.id, {
          id: f.id,
          field_id: f.id,
          label: f.label || 'Question',
          field_type: f.field_type,
          position: f.position ?? 0,
        });
      }
    });

    // 2. Also incorporate any answers from submissions that might not be in current fields
    submissions.forEach((sub) => {
      (sub.submission_answers || []).forEach((ans) => {
        const fieldInfo = ans.field;
        const fieldId = ans.field_id || fieldInfo?.id;
        if (fieldId && !colMap.has(fieldId)) {
          colMap.set(fieldId, {
            id: fieldId,
            field_id: fieldId,
            label: fieldInfo?.label || 'Question',
            field_type: fieldInfo?.field_type || 'SHORT_TEXT',
            position: fieldInfo?.position ?? colMap.size,
          });
        }
      });
    });

    return Array.from(colMap.values()).sort((a, b) => a.position - b.position);
  }, [fields, submissions]);

  // Displayed submissions: server handles search & pagination, with client-side fallback if needed
  const displaySubmissions = useMemo(() => {
    if (!debouncedSearch.trim()) return submissions;
    const query = debouncedSearch.toLowerCase().trim();

    const clientFiltered = submissions.filter((sub) => {
      if (String(sub.response_number || '').includes(query)) return true;
      if (sub.status.toLowerCase().includes(query)) return true;

      try {
        const dateStr = format(new Date(sub.submitted_at || sub.created_at), 'PP, p').toLowerCase();
        if (dateStr.includes(query)) return true;
      } catch {
        // ignore
      }

      return (sub.submission_answers || []).some((ans) => {
        if (ans.answer_text) {
          if (ans.answer_text.toLowerCase().includes(query)) return true;
          const formatted = formatDateTimeAnswer(
            ans.answer_text,
            ans.field?.field_type
          ).formatted.toLowerCase();
          if (formatted.includes(query)) return true;
        }
        if (ans.field?.label && ans.field.label.toLowerCase().includes(query)) return true;
        if (ans.answer_json) {
          const jsonStr = JSON.stringify(ans.answer_json).toLowerCase();
          if (jsonStr.includes(query)) return true;
        }
        return false;
      });
    });

    return clientFiltered.length > 0 ? clientFiltered : submissions;
  }, [submissions, debouncedSearch]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handleExportCSV = () => {
    exportSubmissionsToCsv(displaySubmissions, dynamicColumns, title || 'form');
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in-50 duration-200">
      {/* Header Bar */}
      <div className="card-surface p-4 sm:p-5 rounded-lg border border-border space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Table2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                  Submissions
                </h2>
                {isLoading ? (
                  <Skeleton className="h-5 w-20 rounded" />
                ) : (
                  <Badge variant="secondary" className="font-mono text-xs font-semibold">
                    {totalSubmissions} {totalSubmissions === 1 ? 'response' : 'responses'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time responses submitted for this form with dynamic answer columns, side drawer file inspection, and CSV export.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="cursor-pointer text-xs h-8 gap-1.5"
              title="Refresh submissions from server"
            >
              <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={submissions.length === 0}
              className="cursor-pointer text-xs h-8 gap-1.5"
              title="Export all submissions as CSV spreadsheet"
            >
              <Download className="size-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Filter bar and view mode toggle */}
        {submissions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border">
            <div className="relative flex-1 max-w-md">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across answers, dates, or response #..."
                className="pl-9.5 pr-8 text-xs sm:text-[13px] h-10 bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              <span className="text-[11px] text-muted-foreground">
                Showing {displaySubmissions.length} of {totalSubmissions} entries
              </span>

              {/* View Switcher: Table vs Cards for Mobile/Tablet */}
              <div className="flex items-center rounded-md border border-border p-1 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-card text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Table view"
                >
                  <List className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-card text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Card view (optimized for mobile)"
                >
                  <LayoutGrid className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <SubmissionsSkeleton
          viewMode={viewMode}
          columnsCount={Math.max(dynamicColumns.length, 4)}
        />
      ) : isError ? (
        <div className="card-surface p-10 text-center rounded-lg border border-destructive/30 space-y-3 w-full">
          <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <Inbox className="size-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Could not load submissions</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            An error occurred while fetching the submissions for this form. Please verify your connection and try again.
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="cursor-pointer text-xs h-8">
            Retry
          </Button>
        </div>
      ) : submissions.length === 0 ? (
        /* Empty State */
        <div className="card-surface p-12 text-center rounded-lg border border-border space-y-4 w-full">
          <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Inbox className="size-7 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base font-semibold text-foreground">No submissions recorded yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Once respondents fill out and submit your published live form, their answers, attached files, and response metadata will automatically appear here.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveBuilderTab('canvas')}
              className="cursor-pointer text-xs h-8"
            >
              Back to Canvas
            </Button>
          </div>
        </div>
      ) : displaySubmissions.length === 0 ? (
        /* Search Query No Match */
        <div className="card-surface p-10 text-center rounded-lg border border-border space-y-2 w-full">
          <Search className="size-6 text-muted-foreground/60 mx-auto" />
          <h4 className="text-xs font-semibold text-foreground">No matching submissions</h4>
          <p className="text-[11px] text-muted-foreground">
            No entries match your search query &ldquo;{searchQuery}&rdquo;.
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearSearch}
            className="cursor-pointer text-xs h-7 text-primary"
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {viewMode === 'cards' ? (
            /* Mobile-Friendly Card Grid View */
            <SubmissionsCardList
              submissions={displaySubmissions}
              dynamicColumns={dynamicColumns}
              onPreviewFile={handleOpenPreview}
            />
          ) : (
            /* Dynamic Full-Featured Table View taking full width */
            <SubmissionsTable
              submissions={displaySubmissions}
              dynamicColumns={dynamicColumns}
              onPreviewFile={handleOpenPreview}
            />
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 text-xs text-muted-foreground border-t border-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <span className="text-muted-foreground hidden sm:inline">
                Showing{' '}
                <strong className="font-semibold text-foreground">
                  {totalSubmissions === 0 ? 0 : (currentPage - 1) * limit + 1}
                </strong>{' '}
                to{' '}
                <strong className="font-semibold text-foreground">
                  {Math.min(currentPage * limit, totalSubmissions)}
                </strong>{' '}
                of <strong className="font-semibold text-foreground">{totalSubmissions}</strong> entries
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading || isRefetching}
                className="h-8 px-2.5 text-xs gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </Button>

              <div className="px-2 font-mono text-xs text-foreground font-medium">
                Page {currentPage} of {totalPages}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isLoading || isRefetching}
                className="h-8 px-2.5 text-xs gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Side Drawer for Uploaded Files (Smooth slide-out sheet on right) */}
      <FilePreviewDrawer
        open={Boolean(previewFile)}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
        allFiles={previewFilesList}
        onSelectFile={setPreviewFile}
      />
    </div>
  );
};
