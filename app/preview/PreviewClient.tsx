'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type {
  SingleForm,
} from '@/types/api.types';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import {
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { FormBodyRenderer } from '@/features/forms/components/FormBodyRenderer';
import { getAllFormFields } from '@/features/forms/utils/formRendererUtils';
import {
  validateAllFormFields,
  validateSingleField,
} from '@/features/forms/utils/fieldValidation';
import { computeFieldVisibility } from '@/features/forms/utils/fieldConditions';

export function PreviewSkeleton() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto py-6 px-4">
      {/* Top Device Bar Skeleton */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Preview Card Skeleton */}
      <div className="card-surface p-6 sm:p-8 rounded-lg border border-border space-y-6">
        <div className="space-y-3 pb-4 border-b border-border">
          <Skeleton className="h-7 w-2/3 rounded" />
          <Skeleton className="h-4 w-full rounded" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface PreviewClientProps {
  initialForm?: SingleForm | null;
  formIdParam?: string | null;
}

export function PreviewClient({ initialForm }: PreviewClientProps) {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Directly use the server-fetched draft form. NO fallback to builder store, NO extra calls, NO dummy data.
  const form: SingleForm | null = initialForm ?? null;

  const allFields = useMemo(() => {
    return getAllFormFields(form?.sections, form?.fields);
  }, [form?.sections, form?.fields]);

  if (!form) {
    return (
      <div className="card-surface p-12 text-center max-w-lg mx-auto mt-12 space-y-4 rounded-md">
        <Eye className="size-10 text-muted-foreground/60 mx-auto stroke-[1.5]" />
        <h2 className="font-heading text-lg font-bold text-foreground">No form found to preview</h2>
        <p className="text-xs text-muted-foreground">
          Please select a form from your workspace or create a new form first.
        </p>
        <Link
          href="/forms"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'cursor-pointer text-xs font-semibold h-8 rounded-md'
          )}
        >
          Go to Forms Workspace
        </Link>
      </div>
    );
  }

  const handleInputChange = (fieldId: string, val: unknown) => {
    const nextAnswers = { ...answers, [fieldId]: val };
    setAnswers(nextAnswers);

    const nextVisibility = computeFieldVisibility(allFields, nextAnswers);

    setErrors((prev) => {
      let modified = false;
      const next = { ...prev };

      // Clear any errors for now-hidden fields
      for (const errFieldId of Object.keys(next)) {
        if (nextVisibility[errFieldId] === false) {
          delete next[errFieldId];
          modified = true;
        }
      }

      // Re-validate current field if it had an error
      if (next[fieldId]) {
        const targetField = allFields.find((f) => f.id === fieldId);
        if (targetField) {
          const fieldError = validateSingleField(targetField, val);
          if (!fieldError) {
            delete next[fieldId];
            modified = true;
          } else if (next[fieldId] !== fieldError) {
            next[fieldId] = fieldError;
            modified = true;
          }
        }
      }

      return modified ? next : prev;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all form fields against required state and validation_rules
    const validation = validateAllFormFields(allFields, answers);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error(
        validation.firstErrorMessage || 'Please fix the errors in the form before submitting.'
      );
      return;
    }

    setErrors({});
    setIsSubmitted(true);
    toast.success('Form response submitted successfully (Preview Mode)!');
  };

  const handleReset = () => {
    setAnswers({});
    setErrors({});
    setIsSubmitted(false);
  };

  const getContainerWidth = () => {
    switch (device) {
      case 'mobile':
        return 'max-w-[390px]';
      case 'tablet':
        return 'max-w-[720px]';
      case 'desktop':
      default:
        return 'max-w-[840px]';
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-muted/20 py-6 px-4 space-y-6">
      {/* Top Device Bar & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-card max-w-4xl mx-auto shadow-xs">
        {/* Responsive Device Switcher */}
        <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-md border border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDevice('desktop')}
            className={`cursor-pointer h-7 px-2.5 text-xs font-medium rounded gap-1.5 transition-all ${
              device === 'desktop'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Monitor className="size-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDevice('tablet')}
            className={`cursor-pointer h-7 px-2.5 text-xs font-medium rounded gap-1.5 transition-all ${
              device === 'tablet'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tablet className="size-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDevice('mobile')}
            className={`cursor-pointer h-7 px-2.5 text-xs font-medium rounded gap-1.5 transition-all ${
              device === 'mobile'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smartphone className="size-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </Button>
        </div>

        {/* Builder / Return action */}
        <div className="flex items-center gap-2">
          {isSubmitted && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="cursor-pointer text-xs font-semibold h-7 px-2.5 rounded-md"
            >
              <RotateCcw className="size-3 mr-1" />
              Reset Test
            </Button>
          )}

          {form.status === 'PUBLISHED' && (
            <span className="status-badge-published text-[10px] py-0.5 px-2 font-mono">
              Published Live
            </span>
          )}

          <Link
            href={form.id ? `/builder?id=${form.id}` : '/builder'}
            className={cn(
              buttonVariants({ size: 'sm' }),
              'cursor-pointer text-xs font-semibold h-7 px-3 rounded-md'
            )}
          >
            <ArrowLeft className="size-3 mr-1" />
            Back to Builder
          </Link>
        </div>
      </div>

      {/* Respondent Viewport Container */}
      <div className={`mx-auto transition-all duration-300 w-full ${getContainerWidth()}`}>
        {isSubmitted ? (
          <div className="card-surface p-12 text-center max-w-lg mx-auto space-y-4 rounded-md border-border">
            <div className="size-14 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-8" />
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground">
              Response Submitted!
            </h2>
            <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {form.form_settings?.confirmation_message ||
                'Thank you for testing your form draft preview. Your responses were simulated and verified in memory.'}
            </p>

            {form.form_type === 'QUIZ' && form.quiz_settings?.show_score_after_submissions && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border max-w-sm mx-auto text-center space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                  Test Simulation Score
                </span>
                <div className="text-3xl font-extrabold text-foreground font-heading">
                  100%
                </div>
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600">
                  PASSED (Passing Score: {form.quiz_settings.passing_score}%)
                </span>
              </div>
            )}

            {form.form_settings?.allow_multiple_submission !== false && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="cursor-pointer text-xs font-semibold h-8 rounded-md mt-2"
              >
                Submit Another Response
              </Button>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`card-surface space-y-6 rounded-md border-border transition-all ${
              device === 'mobile' ? 'p-4' : 'p-6 sm:p-8'
            }`}
          >
            {/* Form Header */}
            <div className="space-y-2 border-b border-border pb-4">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                {form.title}
              </h1>
              {form.description && (
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {form.description}
                </p>
              )}
            </div>

            {/* Questions & Sections Body (Modularized) */}
            <FormBodyRenderer
              sections={form.sections}
              fields={allFields}
              answers={answers}
              errors={errors}
              onInputChange={handleInputChange}
              device={device}
            />

            {/* Submit Action */}
            <div className="pt-4 border-t border-border flex items-center justify-end">
              <Button
                type="submit"
                size="default"
                className="cursor-pointer text-xs font-semibold h-9 px-5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                Submit Response (Test)
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
