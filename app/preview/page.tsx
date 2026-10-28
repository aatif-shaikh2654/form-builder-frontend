'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBuilderStore } from '@/features/builder/store/builderStore';
import { useSingleForm } from '@/features/forms/hooks/useForms';
import type { SingleForm, FieldsResponse } from '@/types/api.types';
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
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  ArrowLeft,
  CheckCircle2,
  Star,
  UploadCloud,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

function PreviewSkeleton() {
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

function PreviewContent() {
  const searchParams = useSearchParams();
  const formIdParam = searchParams.get('id');
  const storeState = useBuilderStore();

  const { form: apiForm, isLoading: isApiLoading } = useSingleForm(formIdParam);

  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Declaratively derive the active form without synchronous setState in useEffect
  const form: SingleForm | null = formIdParam
    ? apiForm || null
    : storeState.formId
    ? {
        id: storeState.formId,
        owner_id: null,
        guest_session_id: null,
        published_at: null,
        title: storeState.title,
        description: storeState.description,
        form_type: storeState.formType,
        status: storeState.status,
        slug: storeState.slug,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sections: storeState.sections,
        fields: storeState.fields,
      }
    : null;

  const isLoading = Boolean(formIdParam) && isApiLoading;

  if (isLoading) {
    return <PreviewSkeleton />;
  }

  if (!form) {
    return (
      <div className="card-surface p-12 text-center max-w-lg mx-auto mt-12 space-y-4 rounded-md">
        <Eye className="size-10 text-muted-foreground/60 mx-auto stroke-[1.5]" />
        <h2 className="font-heading text-lg font-bold text-foreground">No form found to preview</h2>
        <p className="text-xs text-muted-foreground">
          Please select a form from your workspace or create a new form first.
        </p>
        <Link href="/forms">
          <Button size="sm" className="cursor-pointer text-xs font-semibold h-8 rounded-md">
            Go to Forms Workspace
          </Button>
        </Link>
      </div>
    );
  }

  const handleInputChange = (fieldId: string, val: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    toast.success('Form response submitted successfully (Preview Mode)!');
  };

  const handleReset = () => {
    setAnswers({});
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

        {/* Field Type Specific Controls */}
        <div className="pt-1.5">
          {['SHORT_TEXT', 'EMAIL', 'PHONE', 'URL'].includes(field.field_type) && (
            <Input
              type={field.field_type === 'EMAIL' ? 'email' : field.field_type === 'PHONE' ? 'tel' : 'text'}
              placeholder={field.placeholder || 'Type answer here...'}
              value={String(answers[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.is_required}
              className="h-10 text-[13px] py-2 px-3 rounded-md"
            />
          )}

          {field.field_type === 'LONG_TEXT' && (
            <Textarea
              rows={3}
              placeholder={field.placeholder || 'Type long answer here...'}
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

  return (
    <div className="min-h-screen bg-background space-y-6 pb-16 px-4 sm:px-6 lg:px-8 py-4 max-w-6xl mx-auto">
      {/* Top Preview Sticky Toolbar (no app header above it) */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-md border border-border bg-card/95 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            <Eye className="size-3.5" />
            <span>Respondent Preview</span>
          </div>

          <div className="h-4 w-px bg-border" />

          <span className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
            {form.title}
          </span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted border border-border">
          <Button
            type="button"
            variant={device === 'desktop' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setDevice('desktop')}
            className="cursor-pointer size-7 rounded-sm"
            title="Desktop view"
          >
            <Monitor className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant={device === 'tablet' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setDevice('tablet')}
            className="cursor-pointer size-7 rounded-sm"
            title="Tablet view"
          >
            <Tablet className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant={device === 'mobile' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setDevice('mobile')}
            className="cursor-pointer size-7 rounded-sm"
            title="Mobile view"
          >
            <Smartphone className="size-3.5" />
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

          <Link href={form.id ? `/builder?id=${form.id}` : '/builder'}>
            <Button
              type="button"
              size="sm"
              className="cursor-pointer text-xs font-semibold h-7 px-3 rounded-md"
            >
              <ArrowLeft className="size-3 mr-1" />
              Back to Builder
            </Button>
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
            <p className="text-xs text-muted-foreground">
              Thank you for testing your form preview. Your responses were simulated and verified in memory.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="cursor-pointer text-xs font-semibold h-8 rounded-md mt-2"
            >
              Submit Another Response
            </Button>
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

            {/* Questions & Sections List */}
            {rootItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md">
                No questions added to this form yet. Open the builder to add fields.
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
                      (sec.layout_config as { gap?: string })?.gap || 'md',
                      device
                    );

                    return (
                      <div key={sec.id} className="space-y-4 pt-4 border-t border-border/70 first:border-t-0 first:pt-0">
                        <div>
                          <h2 className="font-heading text-lg font-bold text-foreground">
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
                className="cursor-pointer text-sm font-semibold py-3 px-6 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Submit Form
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<PreviewSkeleton />}>
      <PreviewContent />
    </Suspense>
  );
}
