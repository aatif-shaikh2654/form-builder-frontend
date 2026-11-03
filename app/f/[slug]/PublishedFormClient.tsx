'use client';

import React, { useState } from 'react';
import { useSubmitFormMutation } from '@/features/forms/hooks/useForms';
import type {
  FieldsResponse,
  SingleForm,
  AnswerResponse,
} from '@/types/api.types';
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
import { MultiSelect } from '@/components/ui/multi-select';
import { FileUploadField, type FileMetadata } from '@/components/ui/file-uploader';
import {
  CheckCircle2,
  Star,
  UploadCloud,
  Loader2,
  FileQuestion,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

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
  slug: string;
}

export function PublishedFormClient({ initialForm, slug }: PublishedFormClientProps) {
  const { mutateAsync: submitForm, isPending: isSubmitting } = useSubmitFormMutation();

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = initialForm;

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

  const allFields = React.useMemo(() => {
    const list: FieldsResponse[] = [...(form.fields || [])];
    (form.sections || []).forEach((sec) => {
      (sec.fields || []).forEach((f) => {
        if (!list.some((existing) => existing.id === f.id)) {
          list.push(f);
        }
      });
    });
    return list;
  }, [form.fields, form.sections]);

  const handleInputChange = (fieldId: string, val: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const field of allFields) {
      if (field.is_required) {
        const val = answers[field.id];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          toast.error(`Please answer the required field: "${field.label || 'Question'}"`);
          return;
        }
      }
    }

    try {
      const formattedAnswers: AnswerResponse[] = Object.entries(answers)
        .filter(([_, val]) => {
          if (val === undefined || val === null || val === '') return false;
          if (Array.isArray(val) && val.length === 0) return false;
          return true;
        })
        .map(([fieldId, val]) => {
          const field = allFields.find((f) => f.id === fieldId);
          const isMultiple = Boolean(field?.is_multiple);

          let answer_text: string | null = null;
          let answer_json: Record<string, unknown> | unknown[] | null = null;

          if (Array.isArray(val)) {
            // Array of items (multiple choice strings or file metadata objects)
            answer_text = val
              .map((item) =>
                typeof item === 'object' && item !== null && 'name' in item
                  ? (item as { name: string }).name
                  : String(item)
              )
              .join(', ');
            answer_json = val;
          } else if (val && typeof val === 'object') {
            // Object (e.g. single file upload metadata or dictionary)
            const obj = val as Record<string, unknown>;
            answer_text = typeof obj.name === 'string' ? obj.name : JSON.stringify(obj);
            if (isMultiple) {
              answer_json = [obj];
            } else {
              answer_json = obj;
            }
          } else {
            // Primitive (string, number, boolean)
            answer_text = String(val);
            if (isMultiple) {
              answer_json = [val];
            } else {
              answer_json = null;
            }
          }

          return {
            field_id: fieldId,
            answer_text,
            answer_json,
          };
        });

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
    } catch {
      // Handled with error toast in apiClient
    }
  };

  const handleResetForAnotherResponse = () => {
    setAnswers({});
    setIsSubmitted(false);
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

          {field.field_type === 'DROPDOWN' && (() => {
            const options =
              (Array.isArray(field.values) && field.values.length > 0
                ? field.values
                : (field.settings?.options as string[])) || ['Option 1', 'Option 2', 'Option 3'];

            if (field.is_multiple) {
              const selectedList = Array.isArray(answers[field.id])
                ? (answers[field.id] as string[])
                : answers[field.id]
                ? [String(answers[field.id])]
                : [];
              return (
                <div className="pt-1">
                  <MultiSelect
                    id={field.id}
                    options={options}
                    selected={selectedList}
                    onChange={(val) => handleInputChange(field.id, val)}
                    placeholder={field.placeholder || 'Select options...'}
                  />
                </div>
              );
            }

            return (
              <div className="pt-1">
                <Select
                  value={String(answers[field.id] || '')}
                  onValueChange={(val) => handleInputChange(field.id, val)}
                >
                  <SelectTrigger className="w-full text-[13px] h-10 bg-card">
                    <SelectValue placeholder={field.placeholder || 'Select an option...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt, optIdx) => (
                      <SelectItem key={optIdx} value={opt} className="text-xs sm:text-sm">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}

          {['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'CHECKBOX'].includes(field.field_type) && (() => {
            const options =
              (Array.isArray(field.values) && field.values.length > 0
                ? field.values
                : (field.settings?.options as string[])) || ['Option 1', 'Option 2', 'Option 3'];

            const isMultiple = field.field_type === 'SINGLE_CHOICE' ? false : field.is_multiple !== false;
            const selectedList: string[] = Array.isArray(answers[field.id])
              ? (answers[field.id] as string[])
              : answers[field.id]
              ? [String(answers[field.id])]
              : [];

            return (
              <div className="space-y-1.5 pt-1">
                {options.map((opt, optIdx) => {
                  const isChecked = isMultiple
                    ? selectedList.includes(opt)
                    : answers[field.id] === opt;

                  return (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-2.5 p-2.5 rounded-md border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-primary/50 bg-primary/5 text-foreground'
                          : 'border-border bg-muted/15 hover:bg-muted/30 text-foreground'
                      }`}
                    >
                      <input
                        type={isMultiple ? 'checkbox' : 'radio'}
                        name={`field_${field.id}`}
                        value={opt}
                        checked={isChecked}
                        onChange={() => {
                          if (isMultiple) {
                            const next = isChecked
                              ? selectedList.filter((item) => item !== opt)
                              : [...selectedList, opt];
                            handleInputChange(field.id, next);
                          } else {
                            handleInputChange(field.id, opt);
                          }
                        }}
                        className={`size-3.5 accent-primary cursor-pointer ${isMultiple ? 'rounded-xs' : 'rounded-full'}`}
                      />
                      <span className="text-foreground">{opt}</span>
                    </label>
                  );
                })}
              </div>
            );
          })()}

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
            <FileUploadField
              id={field.id}
              isMultiple={Boolean(field.is_multiple)}
              value={answers[field.id] as FileMetadata[] | FileMetadata | null}
              onChange={(val) => handleInputChange(field.id, val)}
            />
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
            <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {form.form_settings?.confirmation_message ||
                'Your response has been successfully submitted and recorded.'}
            </p>
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

