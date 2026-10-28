'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useBuilderStore } from '../store/builderStore';
import type { FieldsResponse } from '@/types/api.types';
import { getSectionGridClass } from '../constants/layout.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker, TimePicker, DateTimePicker } from '@/components/common';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Star,
  UploadCloud,
  AlertCircle,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';

export const FormPreview: React.FC = () => {
  const {
    fields,
    sections,
    title,
    description,
    formType,
    formSettings,
    quizSettings,
    setActiveBuilderTab,
  } = useBuilderStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<Record<string, unknown>>();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const getContainerWidth = () => {
    switch (device) {
      case 'mobile':
        return 'max-w-[390px]';
      case 'tablet':
        return 'max-w-[720px]';
      case 'desktop':
      default:
        return 'max-w-3xl';
    }
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedValues = watch();
  const filledCount = Object.values(watchedValues || {}).filter(
    (v) => v !== undefined && v !== '' && v !== false
  ).length;

  // Only count fields in visible sections
  const visibleFields = fields.filter((f) => {
    if (!f.section_id) return true;
    const sec = sections.find((s) => s.id === f.section_id);
    return !sec || sec.is_visible !== false;
  });

  const progressPercent = visibleFields.length > 0 ? Math.round((filledCount / visibleFields.length) * 100) : 0;

  const onSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitted(true);
    toast.success('Form response submitted successfully!', {
      description: `Collected ${Object.keys(data).length} responses.`,
    });
  };

  const handleReset = () => {
    reset();
    setIsSubmitted(false);
  };

  const renderField = (field: FieldsResponse) => {
    const hasError = !!errors[field.id];
    const errorMessage = errors[field.id]?.message as string | undefined;
    const fieldOptions =
      Array.isArray(field.values) && field.values.length > 0
        ? field.values
        : Array.isArray(field.settings?.options)
        ? (field.settings.options as string[])
        : ['Option 1', 'Option 2', 'Option 3'];

    switch (field.field_type) {
      case 'SECTION_HEADING':
        return (
          <div key={field.id} className="pt-2 pb-1 border-b border-border/60 col-span-full">
            <h3 className="font-heading text-base font-semibold text-foreground">
              {field.label}
            </h3>
            {field.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {field.description}
              </p>
            )}
          </div>
        );

      case 'SHORT_TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
      case 'NUMBER': {
        let inputType = 'text';
        if (field.field_type === 'EMAIL') inputType = 'email';
        if (field.field_type === 'PHONE') inputType = 'tel';
        if (field.field_type === 'URL') inputType = 'url';
        if (field.field_type === 'NUMBER') inputType = 'number';

        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs font-medium">
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-[11px] text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.id}
              type={inputType}
              placeholder={field.placeholder || undefined}
              {...register(field.id, {
                required: field.is_required ? `${field.label} is required` : false,
              })}
              className={hasError ? 'border-destructive' : ''}
            />
            {hasError && (
              <span className="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errorMessage}
              </span>
            )}
          </div>
        );
      }

      case 'DATE':
        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs font-medium">
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-[11px] text-muted-foreground">{field.description}</p>
            )}
            <Controller
              name={field.id}
              control={control}
              rules={{
                required: field.is_required ? `${field.label} is required` : false,
              }}
              render={({ field: formField }) => (
                <DatePicker
                  id={field.id}
                  value={typeof formField.value === 'string' ? formField.value : ''}
                  onChange={(val) => formField.onChange(val)}
                  placeholder={field.placeholder || 'Select date...'}
                  className={hasError ? 'border-destructive ring-1 ring-destructive' : ''}
                />
              )}
            />
            {hasError && (
              <span className="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errorMessage}
              </span>
            )}
          </div>
        );

      case 'TIME':
        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs font-medium">
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-[11px] text-muted-foreground">{field.description}</p>
            )}
            <Controller
              name={field.id}
              control={control}
              rules={{
                required: field.is_required ? `${field.label} is required` : false,
              }}
              render={({ field: formField }) => (
                <TimePicker
                  id={field.id}
                  value={typeof formField.value === 'string' ? formField.value : ''}
                  onChange={(val) => formField.onChange(val)}
                  placeholder={field.placeholder || 'Select time...'}
                  className={hasError ? 'border-destructive ring-1 ring-destructive' : ''}
                />
              )}
            />
            {hasError && (
              <span className="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errorMessage}
              </span>
            )}
          </div>
        );

      case 'DATE_TIME':
        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs font-medium">
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-[11px] text-muted-foreground">{field.description}</p>
            )}
            <Controller
              name={field.id}
              control={control}
              rules={{
                required: field.is_required ? `${field.label} is required` : false,
              }}
              render={({ field: formField }) => (
                <DateTimePicker
                  id={field.id}
                  value={typeof formField.value === 'string' ? formField.value : ''}
                  onChange={(val) => formField.onChange(val)}
                  placeholder={field.placeholder || 'Select date & time...'}
                  className={hasError ? 'border-destructive ring-1 ring-destructive' : ''}
                />
              )}
            />
            {hasError && (
              <span className="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errorMessage}
              </span>
            )}
          </div>
        );

      case 'LONG_TEXT':
        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs font-medium">
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-[11px] text-muted-foreground">{field.description}</p>
            )}
            <Textarea
              id={field.id}
              rows={4}
              placeholder={field.placeholder || undefined}
              {...register(field.id, {
                required: field.is_required ? `${field.label} is required` : false,
              })}
              className={hasError ? 'border-destructive' : ''}
            />
            {hasError && (
              <span className="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errorMessage}
              </span>
            )}
          </div>
        );

      case 'DROPDOWN':
        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs font-medium">
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-[11px] text-muted-foreground">{field.description}</p>
            )}
            <Controller
              name={field.id}
              control={control}
              rules={{
                required: field.is_required ? `${field.label} is required` : false,
              }}
              render={({ field: formField }) => (
                <Select
                  value={formField.value || ''}
                  onValueChange={(val) => formField.onChange(val)}
                >
                  <SelectTrigger
                    id={field.id}
                    className={`w-full text-[13px] h-10 bg-card ${hasError ? 'border-destructive ring-1 ring-destructive' : ''}`}
                  >
                    <SelectValue placeholder={field.placeholder || 'Select an option...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOptions.map((opt, i) => (
                      <SelectItem key={i} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {hasError && (
              <span className="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errorMessage}
              </span>
            )}
          </div>
        );

      case 'SINGLE_CHOICE':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-xs font-medium">
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-[11px] text-muted-foreground">{field.description}</p>
            )}
            <div className="space-y-1.5 pt-1">
              {fieldOptions.map((opt, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer p-2 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <input
                    type="radio"
                    value={opt}
                    {...register(field.id, {
                      required: field.is_required ? `${field.label} is required` : false,
                    })}
                    className="size-3.5 accent-primary text-primary"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {hasError && (
              <span className="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errorMessage}
              </span>
            )}
          </div>
        );

      case 'MULTIPLE_CHOICE':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-xs font-medium">
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-[11px] text-muted-foreground">{field.description}</p>
            )}
            <div className="space-y-1.5 pt-1">
              {fieldOptions.map((opt, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer p-2 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <input
                    type="checkbox"
                    value={opt}
                    {...register(`${field.id}.${opt}`)}
                    className="size-3.5 rounded accent-primary text-primary"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'CHECKBOX':
        return (
          <div key={field.id} className="space-y-1.5">
            <label className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer p-3 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors">
              <input
                type="checkbox"
                {...register(field.id, {
                  required: field.is_required ? `${field.label} is required` : false,
                })}
                className="size-4 mt-0.5 rounded accent-primary text-primary"
              />
              <div className="space-y-0.5">
                <span className="font-medium">
                  {field.label}
                  {field.is_required && <span className="text-destructive ml-1">*</span>}
                </span>
                {field.description && (
                  <p className="text-[11px] text-muted-foreground">{field.description}</p>
                )}
              </div>
            </label>
            {hasError && (
              <span className="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errorMessage}
              </span>
            )}
          </div>
        );

      case 'RATING':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-xs font-medium">
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-[11px] text-muted-foreground">{field.description}</p>
            )}
            <Controller
              control={control}
              name={field.id}
              rules={{ required: field.is_required ? `${field.label} is required` : false }}
              render={({ field: ratingField }) => {
                const currentRating = Number(ratingField.value || 0);
                const maxStars = Number(field.settings?.max_stars || 5);
                return (
                  <div className="flex items-center gap-1.5 pt-1">
                    {Array.from({ length: maxStars }).map((_, idx) => {
                      const starVal = idx + 1;
                      const isFilled = starVal <= currentRating;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => ratingField.onChange(starVal)}
                          className="cursor-pointer p-1 rounded hover:scale-110 transition-transform focus:outline-none"
                        >
                          <Star
                            className={`size-6 ${
                              isFilled
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-muted-foreground/30 hover:text-amber-500/50'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                );
              }}
            />
            {hasError && (
              <span className="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errorMessage}
              </span>
            )}
          </div>
        );

      case 'FILE_UPLOAD':
        return (
          <div key={field.id} className="space-y-1.5">
            <Label className="text-xs font-medium">
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-[11px] text-muted-foreground">{field.description}</p>
            )}
            <div className="border-2 border-dashed border-border rounded-xl p-5 text-center bg-card/40 hover:bg-accent/30 transition-colors">
              <UploadCloud className="size-8 mx-auto text-muted-foreground/60 mb-1.5" />
              <p className="text-xs font-medium text-foreground">
                Drag &amp; drop file here, or click to browse
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                PDF, PNG, JPG up to 10MB
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
    if (a.type !== b.type) return a.type === 'section' ? -1 : 1;
    return 0;
  });

  return (
    <div className={`mx-auto transition-all duration-300 w-full space-y-6 ${getContainerWidth()}`}>
      {/* Top Banner Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveBuilderTab('canvas')}
          className="gap-2 text-xs"
        >
          <ArrowLeft className="size-3.5" />
          Back to Builder
        </Button>

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

        <div className="flex items-center gap-2">
          {formType === 'QUIZ' && quizSettings.time_limit && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono font-medium border border-amber-500/20">
              <Clock className="size-3" />
              <span>{quizSettings.time_limit}:00 min limit</span>
            </div>
          )}
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {formType} Live Preview
          </Badge>
        </div>
      </div>

      {/* Progress Bar (if enabled in settings) */}
      {formSettings.show_progress_bar && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
            <span>Completion Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Card */}
      <div
        className={`card-surface space-y-6 rounded-md transition-all ${
          device === 'mobile' ? 'p-4' : 'p-6 sm:p-8'
        }`}
      >
        {isSubmitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="size-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-8" />
            </div>
            <div>
              <h3 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Submission Received!
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {formSettings.confirmation_message ||
                  'Thank you! Your response has been recorded successfully.'}
              </p>
            </div>

            {formType === 'QUIZ' && quizSettings.show_score_after_submissions && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border max-w-sm mx-auto text-center space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                  Preliminary Score
                </span>
                <div className="text-3xl font-extrabold text-foreground font-heading">
                  85%
                </div>
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600">
                  PASSED (Threshold: {quizSettings.passing_score}%)
                </span>
              </div>
            )}

            <div className="pt-4 flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                Submit Another Response
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 border-b border-border pb-4">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                {title || 'Untitled Form'}
              </h2>
              {description && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Root Items (Interleaved Sections and Direct Questions) */}
              {rootItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md">
                  This form currently has no questions or sections.
                </div>
              ) : (
                <div className="space-y-6">
                  {rootItems.map((item) => {
                    if (item.type === 'section') {
                      const section = item.section;
                      if (section.is_visible === false) return null;
                      const sectionFields = fields
                        .filter((f) => f.section_id === section.id)
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
                      if (sectionFields.length === 0) return null;

                      const gridClass = getSectionGridClass(
                        section.layout_type,
                        section.column_count || 1,
                        (section.layout_config as { gap?: string })?.gap || 'md',
                        device
                      );

                      return (
                        <div
                          key={section.id}
                          className="space-y-4 pt-4 border-t border-border/70 first:border-t-0 first:pt-0"
                        >
                          <div>
                            <h3 className="font-heading text-base font-bold text-foreground">
                              {section.title}
                            </h3>
                            {section.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {section.description}
                              </p>
                            )}
                          </div>

                          <div className={gridClass}>
                            {sectionFields.map((field) => renderField(field))}
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

              <div className="pt-4 border-t border-border flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto gap-2">
                  <CheckCircle2 className="size-4" />
                  Submit Response
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
