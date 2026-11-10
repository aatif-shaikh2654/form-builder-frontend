'use client';

import React, { useState, useMemo } from 'react';
import type {
  SingleForm,
  UploadedFileResponse,
} from '@/types/api.types';
import { useSubmitFormMutation } from '@/features/forms/hooks/useForms';
import { formsService } from '@/features/forms/services/formsService';
import { Button } from '@/components/ui/button';
import type { FileMetadata } from '@/components/ui/file-uploader';
import { CheckCircle2, RotateCcw, Loader2, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { FormBodyRenderer } from '@/features/forms/components/FormBodyRenderer';
import {
  getAllFormFields,
  formatAnswersForSubmission,
} from '@/features/forms/utils/formRendererUtils';
import {
  validateAllFormFields,
  validateSingleField,
} from '@/features/forms/utils/fieldValidation';
import { computeFieldVisibility } from '@/features/forms/utils/fieldConditions';

export function PublicFormSkeleton() {
  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 flex flex-col items-center justify-start">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header Skeleton Card */}
        <div className="card-surface p-6 sm:p-8 rounded-lg border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-7 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>

        {/* Question Fields Skeleton Card */}
        <div className="card-surface p-6 sm:p-8 rounded-lg border border-border space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-48 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface PublishedFormClientProps {
  initialForm: SingleForm | null;
  slug?: string;
}

export function PublishedFormClient({ initialForm }: PublishedFormClientProps) {
  const { mutateAsync: submitForm, isPending: isSubmitting } = useSubmitFormMutation();

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = initialForm;

  const allFields = useMemo(() => {
    return getAllFormFields(form?.sections, form?.fields);
  }, [form?.sections, form?.fields]);

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card-surface p-10 text-center max-w-md w-full space-y-4 rounded-md border border-border shadow-sm">
          <FileQuestion className="size-10 text-muted-foreground/60 mx-auto stroke-[1.5]" />
          <h1 className="font-heading text-lg font-bold text-foreground">Form Not Found</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The form you are looking for does not exist or may have been unpublished.
          </p>
        </div>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const visibility = computeFieldVisibility(allFields, answers);

    // Validate all form fields against required state and validation_rules
    const validation = validateAllFormFields(allFields, answers, visibility);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error(
        validation.firstErrorMessage || 'Please fix the errors in the form before submitting.'
      );
      return;
    }

    setErrors({});

    try {
      // Manage file uploads before form submission (only for visible fields)
      const uploadedMap = new Map<string, UploadedFileResponse[]>();
      const fileUploadFields = allFields.filter(
        (f) => f.field_type === 'FILE_UPLOAD' && visibility[f.id] !== false
      );
      const fieldsToUpload: { fieldId: string; files: File[] }[] = [];

      for (const field of fileUploadFields) {
        const rawVal = answers[field.id];
        const items: FileMetadata[] = Array.isArray(rawVal)
          ? rawVal
          : rawVal && typeof rawVal === 'object'
          ? [rawVal as FileMetadata]
          : [];

        const filesToUpload: File[] = items
          .map((item) => item.file)
          .filter((f): f is File => f instanceof File);

        if (filesToUpload.length > 0) {
          fieldsToUpload.push({ fieldId: field.id, files: filesToUpload });
        } else if (items.length > 0) {
          uploadedMap.set(field.id, items as unknown as UploadedFileResponse[]);
        }
      }

      if (fieldsToUpload.length > 0) {
        setIsUploading(true);
        for (const { fieldId, files } of fieldsToUpload) {
          const uploadRes = await formsService.uploadFiles(files);
          const existing = uploadedMap.get(fieldId) || [];
          uploadedMap.set(fieldId, [
            ...existing,
            ...(Array.isArray(uploadRes) ? uploadRes : [uploadRes]),
          ]);
        }
      }

      const formattedAnswers = formatAnswersForSubmission(
        answers,
        allFields,
        uploadedMap,
        visibility
      );

      await submitForm({
        formId: form.id,
        payload: {
          respondent_metadata: {
            submitted_at: new Date().toISOString(),
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            screen_resolution:
              typeof window !== 'undefined'
                ? `${window.screen.width}x${window.screen.height}`
                : '',
          },
          answers: formattedAnswers,
        },
      });

      setIsSubmitted(true);
      toast.success('Your response has been recorded!');
    } catch (err: unknown) {
      console.error('Submission failed:', err);
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to submit response. Please check your answers and try again.';
      toast.error(msg);
      // DO NOT reset answers or form state on submission failure!
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetForAnotherResponse = () => {
    setAnswers({});
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {isSubmitted ? (
          <div className="card-surface p-12 text-center max-w-lg mx-auto space-y-4 rounded-md border border-border shadow-xs">
            <div className="size-14 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="font-heading text-xl font-bold text-foreground">
              Thank You!
            </h1>
            <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {form.form_settings?.confirmation_message ||
                'Your response has been successfully submitted and recorded.'}
            </p>
            {form.form_type === 'QUIZ' && form.quiz_settings?.show_score_after_submissions && (
              <div className="p-3.5 rounded-xl bg-muted/50 border border-border max-w-sm mx-auto text-center space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                  Submission Status
                </span>
                <div className="text-sm font-semibold text-foreground">
                  Responses Recorded
                </div>
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600">
                  Passing Score Threshold: {form.quiz_settings.passing_score}%
                </span>
              </div>
            )}
            {form.form_settings?.allow_multiple_submission && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetForAnotherResponse}
                  className="cursor-pointer text-xs gap-1.5 h-8 rounded-md"
                >
                  <RotateCcw className="size-3.5" />
                  Submit Another Response
                </Button>
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="card-surface p-4 sm:p-6 md:p-8 space-y-6 rounded-md border border-border shadow-xs"
          >
            {/* Form Title Banner */}
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
              device="desktop"
              disabled={isSubmitting || isUploading}
            />

            {/* Submit Bar */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Never submit passwords through online forms.
              </span>

              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="cursor-pointer text-xs font-semibold py-2.5 px-6 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-3 animate-spin mr-1.5" />
                    Uploading files...
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="size-3 animate-spin mr-1.5" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="text-center">
          <span className="text-[11px] text-muted-foreground font-mono">
            Form powered by <span className="font-semibold text-foreground">FormCraft Studio</span>
          </span>
        </div>
      </div>
    </div>
  );
}
