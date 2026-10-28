'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBuilderStore } from '@/features/builder/store/builderStore';
import { useSingleForm } from '@/features/forms/hooks/useForms';
import { FormBuilderView } from '@/features/builder/components/FormBuilderView';
import { BuilderSkeleton } from '@/features/builder/components/BuilderSkeleton';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, Layers } from 'lucide-react';

function BuilderContent() {
  const searchParams = useSearchParams();
  const formIdParam = searchParams.get('id');
  const { formId, fields, syncFormFromServer, isDirty, setSelectedFieldId, setEditingSectionId } = useBuilderStore();
  const { form, isLoading } = useSingleForm(formIdParam || formId);
  const loadedFormIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Ensure inspection or settings sheets are never opened automatically on redirect/load
    setSelectedFieldId(null);
    setEditingSectionId(null);
  }, [formIdParam, setSelectedFieldId, setEditingSectionId]);

  useEffect(() => {
    // Only auto-sync from server on first load of a form, or when transitioning to a different formId,
    // or when the local state is clean (not dirty). This prevents background refetches from wiping local unsaved changes.
    if (form && (!loadedFormIdRef.current || loadedFormIdRef.current !== form.id || !isDirty)) {
      syncFormFromServer(form);
      loadedFormIdRef.current = form.id;
    }
  }, [form, syncFormFromServer, isDirty]);

  if (Boolean(formIdParam) && isLoading) {
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
