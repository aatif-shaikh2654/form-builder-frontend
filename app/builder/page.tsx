'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBuilderStore } from '@/features/builder/store/builderStore';
import { useSingleForm, isFormDeleted } from '@/features/forms/hooks/useForms';
import { FormBuilderView } from '@/features/builder/components/FormBuilderView';
import { BuilderSkeleton } from '@/features/builder/components/BuilderSkeleton';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, Layers, FileQuestion, RotateCcw } from 'lucide-react';

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formIdParam = searchParams.get('id')?.trim() || null;
  const {
    formId,
    fields,
    loadForm,
    syncFormFromServer,
    resetBuilder,
    isDirty,
    setSelectedFieldId,
    setEditingSectionId,
  } = useBuilderStore();

  const isDeleted = Boolean(formIdParam && isFormDeleted(formIdParam));
  // Only query the form when an id is explicitly in searchParams and not deleted
  const { form, isLoading, isError, error, refetch, isFetching } = useSingleForm(
    !isDeleted && formIdParam ? formIdParam : null
  );
  const loadedFormIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    // If the form in URL was deleted, redirect to /forms immediately
    if (isDeleted) {
      router.replace('/forms');
    }
  }, [isDeleted, router]);

  useEffect(() => {
    // If navigating to /builder with no ID, and the store previously had a server form loaded, reset it
    if (!formIdParam && formId && loadedFormIdRef.current) {
      resetBuilder();
      loadedFormIdRef.current = null;
    }
  }, [formIdParam, formId, resetBuilder]);

  useEffect(() => {
    // Ensure inspection or settings sheets are never opened automatically on redirect/load
    setSelectedFieldId(null);
    setEditingSectionId(null);
  }, [formIdParam, setSelectedFieldId, setEditingSectionId]);

  useEffect(() => {
    if (isDeleted || !formIdParam || !form) return;

    // Check if we are loading a different form or if the store doesn't have this form loaded yet
    const isNewForm = form.id !== formId || loadedFormIdRef.current !== form.id;

    if (isNewForm) {
      loadForm(form);
      loadedFormIdRef.current = form.id;
      return;
    }

    // For background refetches of the SAME form that is already loaded:
    // only auto-sync if local state is clean (not dirty), to avoid overwriting unsaved user changes.
    if (!isDirty) {
      syncFormFromServer(form);
    }
  }, [form, formId, formIdParam, loadForm, syncFormFromServer, isDirty, isDeleted]);

  if (isDeleted) {
    return <BuilderSkeleton />;
  }

  // When loading a specific form from URL, display skeleton while initial request is in-flight or retrying
  if (Boolean(formIdParam) && (isLoading || (isFetching && !form))) {
    return <BuilderSkeleton />;
  }

  // Error handling: if form query failed or form does not exist on server
  if (Boolean(formIdParam) && (isError || (!isLoading && !isFetching && (!form || !form.id)))) {
    const isNotFound =
      (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) ||
      (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404) ||
      (error && typeof error === 'object' && 'message' in error && String((error as { message: unknown }).message).toLowerCase().includes('not found')) ||
      (!isLoading && !form);

    return (
      <div className="card-surface p-8 sm:p-12 text-center max-w-lg mx-auto mt-12 space-y-4 rounded-md border border-border shadow-xs">
        <div className="size-12 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
          <FileQuestion className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {isNotFound ? 'Form Not Found' : 'Unable to Load Form'}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            {isNotFound
              ? `The form with ID "${formIdParam}" could not be found. It may have been permanently deleted, or the link may be invalid.`
              : (error && typeof error === 'object' && 'message' in error
                  ? String((error as { message: unknown }).message)
                  : 'An error occurred while fetching the form from the server. Please check your network connection and try again.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="cursor-pointer text-xs font-semibold h-8 rounded-md gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
          <Link href="/forms">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer text-xs font-semibold h-8 rounded-md gap-1.5"
            >
              <LayoutGrid className="size-3.5" />
              Forms Workspace
            </Button>
          </Link>
          <Link href="/forms/new">
            <Button
              size="sm"
              className="cursor-pointer text-xs font-semibold h-8 rounded-md gap-1.5"
            >
              <Plus className="size-3.5" />
              Create New Form
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // When loading a specific form from URL, wait until loaded AND synced to store so child components don't query old formId
  const isCurrentFormLoaded = Boolean(form && formId && (formId === form.id || formId === formIdParam));
  if (Boolean(formIdParam) && !isCurrentFormLoaded) {
    return <BuilderSkeleton />;
  }

  // "only the created form will have builder"
  if (!formIdParam && !formId && fields.length === 0) {
    return (
      <div className="card-surface p-12 text-center max-w-lg mx-auto mt-12 space-y-4 rounded-md">
        <div className="size-12 rounded-md bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Layers className="size-6" />
        </div>
        <h2 className="font-heading text-lg font-bold text-foreground">
          No Form Selected
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The builder operates on existing forms. Select a form from your workspace or create a new form to begin editing questions.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link href="/forms">
            <Button variant="outline" size="sm" className="cursor-pointer text-xs font-semibold h-8 rounded-md">
              <LayoutGrid className="size-3.5 mr-1.5" />
              Forms Workspace
            </Button>
          </Link>
          <Link href="/forms/new">
            <Button size="sm" className="cursor-pointer text-xs font-semibold h-8 rounded-md gap-1.5">
              <Plus className="size-3.5" />
              Create New Form
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <FormBuilderView />;
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <BuilderContent />
    </Suspense>
  );
}
