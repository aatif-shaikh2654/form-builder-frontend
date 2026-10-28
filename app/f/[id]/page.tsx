'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useSingleForm } from '@/features/forms/hooks/useForms';
import type { FieldsResponse } from '@/types/api.types';
import { getSectionGridClass } from '@/features/builder/constants/layout.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker, TimePicker, DateTimePicker } from '@/components/common';
import {
  CheckCircle2,
  Star,
  UploadCloud,
  Loader2,
  FileQuestion,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

function PublicFormSkeleton() {
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

function PublishedFormContent() {
  const params = useParams();
  const formId = typeof params?.id === 'string' ? params.id : '';

  const { form, isLoading } = useSingleForm(formId);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isLoading) {
    return <PublicFormSkeleton />;
  }

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

  const sections = form.sections || [];
  const fields = form.fields || [];
  const unassignedFields = fields.filter(
    (f) => !f.section_id || !sections.some((s) => s.id === f.section_id)
  );

  const rootItems = [
    ...sections.map((s) => ({
      type: 'section' as const,
      id: s.id,
      position: s.position ?? 0,
      section: s,
    })),
    ...unassignedFields.map((f) => ({
      type: 'field' as const,
      id: f.id,
      position: f.position ?? 0,
      field: f,
    })),
  ].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.type === 'section' ? -1 : 1;
  });

  const handleInputChange = (fieldId: string, val: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Simulate submission network call
      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsSubmitted(true);
      toast.success('Your response has been recorded!');
    } catch {
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FieldsResponse) => {
    return (
      <div key={field.id} className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <Label className="text-xs font-semibold text-foreground">
            {field.label || 'Untitled Question'}
            {field.is_required && (
              <span className="text-destructive ml-1" title="Required">*</span>
            )}
          </Label>
        </div>

        {field.description && (
          <p className="text-[11px] text-muted-foreground">{field.description}</p>
        )}

        <div className="pt-1.5">
          {['SHORT_TEXT', 'EMAIL', 'PHONE', 'URL'].includes(field.field_type) && (
            <Input
              type={field.field_type === 'EMAIL' ? 'email' : field.field_type === 'PHONE' ? 'tel' : 'text'}
              placeholder={field.placeholder || 'Type your answer here...'}
              value={String(answers[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.is_required}
              className="h-10 text-[13px] py-2 px-3 rounded-md"
            />
          )}

          {field.field_type === 'LONG_TEXT' && (
            <Textarea
              rows={3}
              placeholder={field.placeholder || 'Type your answer here...'}
              value={String(answers[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.is_required}
              className="text-[13px] py-2 px-3 rounded-md"
            />
          )}

          {field.field_type === 'NUMBER' && (
            <Input
              type="number"
              placeholder={field.placeholder || '0'}
              value={String(answers[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.is_required}
              className="h-10 text-[13px] py-2 px-3 rounded-md"
            />
          )}

          {field.field_type === 'DATE' && (
            <DatePicker
              id={field.id}
              value={String(answers[field.id] || '')}
              onChange={(val) => handleInputChange(field.id, val)}
              placeholder={field.placeholder || 'Select date...'}
            />
          )}

          {field.field_type === 'TIME' && (
            <TimePicker
              id={field.id}
              value={String(answers[field.id] || '')}
              onChange={(val) => handleInputChange(field.id, val)}
              placeholder={field.placeholder || 'Select time...'}
            />
          )}

          {field.field_type === 'DATE_TIME' && (
            <DateTimePicker
              id={field.id}
              value={String(answers[field.id] || '')}
              onChange={(val) => handleInputChange(field.id, val)}
              placeholder={field.placeholder || 'Select date & time...'}
            />
          )}

          {field.field_type === 'DROPDOWN' && (
            <div className="pt-1">
              <Select
                value={String(answers[field.id] || '')}
                onValueChange={(val) => handleInputChange(field.id, val)}
              >
                <SelectTrigger className="w-full text-[13px] h-10 bg-card">
                  <SelectValue placeholder={field.placeholder || 'Select an option...'} />
                </SelectTrigger>
                <SelectContent>
                  {((Array.isArray(field.values) && field.values.length > 0 ? field.values : (field.settings?.options as string[])) || ['Option 1', 'Option 2', 'Option 3']).map(
                    (opt, optIdx) => (
                      <SelectItem key={optIdx} value={opt} className="text-xs sm:text-sm">
                        {opt}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(field.field_type) && (
            <div className="space-y-1.5 pt-1">
              {((Array.isArray(field.values) && field.values.length > 0 ? field.values : (field.settings?.options as string[])) || ['Option 1', 'Option 2', 'Option 3']).map(
                (opt, optIdx) => (
                  <label
                    key={optIdx}
                    className="flex items-center gap-2 p-2 rounded-sm border border-border bg-muted/20 hover:bg-muted/40 text-xs cursor-pointer transition-colors"
                  >
                    <input
                      type={field.field_type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                      name={`field_${field.id}`}
                      value={opt}
                      onChange={() => handleInputChange(field.id, opt)}
                      className="size-3.5 accent-primary cursor-pointer"
                    />
                    <span className="text-foreground">{opt}</span>
                  </label>
                )
              )}
            </div>
          )}

          {field.field_type === 'RATING' && (
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleInputChange(field.id, star)}
                  className="cursor-pointer p-1 rounded-sm hover:scale-110 transition-transform"
                >
                  <Star
                    className={`size-5 ${
                      Number(answers[field.id] || 0) >= star
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-muted-foreground/40'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}

          {field.field_type === 'FILE_UPLOAD' && (
            <div className="border border-dashed border-border rounded-md p-4 text-center space-y-1 cursor-pointer bg-muted/20">
              <UploadCloud className="size-5 text-muted-foreground mx-auto" />
              <p className="text-xs text-foreground font-medium">Click to upload file</p>
              <p className="text-[10px] text-muted-foreground">Max size 10MB</p>
            </div>
          )}
        </div>
      </div>
    );
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
            <p className="text-xs text-muted-foreground">
              Your response has been successfully submitted and recorded.
            </p>
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

            {/* Questions & Sections List */}
            {rootItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md">
                This form currently has no questions.
              </div>
            ) : (
              <div className="space-y-6">
                {rootItems.map((item) => {
                  if (item.type === 'section') {
                    const sec = item.section;
                    if (sec.is_visible === false) return null;
                    const secFields = fields
                      .filter((f) => f.section_id === sec.id)
                      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
                    if (secFields.length === 0) return null;

                    const gridClass = getSectionGridClass(
                      sec.layout_type,
                      sec.column_count || 1,
                      (sec.layout_config as { gap?: string })?.gap || 'md'
                    );

                    return (
                      <div key={sec.id} className="space-y-4 pt-4 border-t border-border/70 first:border-t-0 first:pt-0">
                        <div>
                          <h2 className="font-heading text-base font-bold text-foreground">
                            {sec.title}
                          </h2>
                          {sec.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {sec.description}
                            </p>
                          )}
                        </div>

                        <div className={gridClass}>
                          {secFields.map((field) => renderField(field))}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={item.field.id} className="pt-2 first:pt-0">
                        {renderField(item.field)}
                      </div>
                    );
                  }
                })}
              </div>
            )}

            {/* Submit Bar */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Never submit passwords through online forms.
              </span>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer text-xs font-semibold py-2.5 px-6 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
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

export default function PublishedFormPage() {
  return (
    <React.Suspense fallback={<PublicFormSkeleton />}>
      <PublishedFormContent />
    </React.Suspense>
  );
}
