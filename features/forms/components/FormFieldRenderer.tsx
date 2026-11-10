'use client';

import React from 'react';
import type { FieldsResponse } from '@/types/api.types';
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
import { Star, AlertCircle } from 'lucide-react';

export interface FormFieldRendererProps {
  field: FieldsResponse;
  value: unknown;
  onChange: (fieldId: string, value: unknown) => void;
  disabled?: boolean;
  error?: string | null;
}

export const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
  field,
  value,
  onChange,
  disabled = false,
  error,
}) => {
  // If field is a section heading, render it as title & description banner
  if (field.field_type === 'SECTION_HEADING') {
    return (
      <div className="space-y-1 pt-3 pb-1 border-b border-border/80">
        <h3 className="font-heading text-sm sm:text-base font-bold text-foreground">
          {field.label || 'Section Heading'}
        </h3>
        {field.description && (
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
            {field.description}
          </p>
        )}
      </div>
    );
  }

  const isChoiceField =
    field.field_type === 'DROPDOWN' ||
    field.field_type === 'SINGLE_CHOICE' ||
    field.field_type === 'MULTIPLE_CHOICE' ||
    field.field_type === 'CHECKBOX';

  const rawValues =
    Array.isArray(field.values) && field.values.length > 0
      ? field.values
      : (field.settings?.options as unknown[]) || ['Option 1', 'Option 2', 'Option 3'];

  const options: string[] = isChoiceField
    ? rawValues.map((opt) =>
        typeof opt === 'object' && opt !== null
          ? (opt as { label?: string; value?: string }).label ||
            (opt as { label?: string; value?: string }).value ||
            ''
          : String(opt)
      )
    : [];

  const inputHtmlFor = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'CHECKBOX'].includes(field.field_type)
    ? `${field.id}_opt_0`
    : field.id;

  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-2">
        <Label
          htmlFor={inputHtmlFor}
          className="text-xs font-semibold text-foreground inline-flex items-baseline cursor-pointer"
        >
          <span>{field.label || 'Untitled Question'}</span>
          {field.is_required && (
            <span className="text-destructive ml-0.5 font-bold" title="Required">
              *
            </span>
          )}
        </Label>
      </div>

      {field.description && (
        <p className="text-[11px] text-muted-foreground pb-0.5">{field.description}</p>
      )}

      {/* Field Type Specific Controls */}
      <div>
        {['SHORT_TEXT', 'EMAIL', 'PHONE', 'URL'].includes(field.field_type) && (
          <Input
            id={field.id}
            type={
              field.field_type === 'EMAIL'
                ? 'email'
                : field.field_type === 'PHONE'
                ? 'tel'
                : 'text'
            }
            placeholder={field.placeholder || 'Type your answer here...'}
            value={String(value || '')}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.is_required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={`h-10 text-[13px] py-2 px-3 rounded-md transition-colors ${
              error ? 'border-destructive focus-visible:ring-destructive/30' : ''
            }`}
          />
        )}

        {field.field_type === 'LONG_TEXT' && (
          <Textarea
            id={field.id}
            rows={3}
            placeholder={field.placeholder || 'Type your answer here...'}
            value={String(value || '')}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.is_required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={`text-[13px] py-2 px-3 rounded-md transition-colors ${
              error ? 'border-destructive focus-visible:ring-destructive/30' : ''
            }`}
          />
        )}

        {field.field_type === 'NUMBER' && (
          <Input
            id={field.id}
            type="number"
            placeholder={field.placeholder || '0'}
            value={String(value || '')}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.is_required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={`h-10 text-[13px] py-2 px-3 rounded-md transition-colors ${
              error ? 'border-destructive focus-visible:ring-destructive/30' : ''
            }`}
          />
        )}

        {field.field_type === 'DATE' && (
          <DatePicker
            id={field.id}
            value={String(value || '')}
            onChange={(val) => onChange(field.id, val)}
            placeholder={field.placeholder || 'Select date...'}
            disabled={disabled}
            className={error ? 'border-destructive ring-1 ring-destructive' : ''}
          />
        )}

        {field.field_type === 'TIME' && (
          <TimePicker
            id={field.id}
            value={String(value || '')}
            onChange={(val) => onChange(field.id, val)}
            placeholder={field.placeholder || 'Select time...'}
            disabled={disabled}
            className={error ? 'border-destructive ring-1 ring-destructive' : ''}
          />
        )}

        {field.field_type === 'DATE_TIME' && (
          <DateTimePicker
            id={field.id}
            value={String(value || '')}
            onChange={(val) => onChange(field.id, val)}
            placeholder={field.placeholder || 'Select date & time...'}
            disabled={disabled}
            className={error ? 'border-destructive ring-1 ring-destructive' : ''}
          />
        )}

        {field.field_type === 'DROPDOWN' && (() => {
          if (field.is_multiple) {
            const selectedList = Array.isArray(value)
              ? (value as string[])
              : value
              ? [String(value)]
              : [];
            return (
              <div>
                <MultiSelect
                  id={field.id}
                  options={options}
                  selected={selectedList}
                  onChange={(val) => onChange(field.id, val)}
                  placeholder={field.placeholder || 'Select options...'}
                  disabled={disabled}
                  className={error ? 'border-destructive ring-1 ring-destructive' : ''}
                />
              </div>
            );
          }

          return (
            <div>
              <Select
                value={String(value || '')}
                onValueChange={(val) => onChange(field.id, val)}
                disabled={disabled}
              >
                <SelectTrigger
                  id={field.id}
                  className={`w-full text-[13px] h-10 bg-card transition-colors ${
                    error ? 'border-destructive ring-1 ring-destructive' : ''
                  }`}
                >
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
          const isMultiple =
            field.field_type === 'SINGLE_CHOICE' ? false : field.is_multiple !== false;
          const selectedList: string[] = Array.isArray(value)
            ? (value as string[])
            : value
            ? [String(value)]
            : [];

          return (
            <div
              className={`space-y-1.5 rounded-md transition-colors ${
                error ? 'p-1.5 border border-destructive/30 bg-destructive/5' : ''
              }`}
            >
              {options.map((opt, optIdx) => {
                const isChecked = isMultiple
                  ? selectedList.includes(opt)
                  : value === opt;
                const optId = `${field.id}_opt_${optIdx}`;

                return (
                  <label
                    key={optIdx}
                    htmlFor={optId}
                    className={`flex items-center gap-2.5 p-2.5 px-3 rounded-md border text-xs cursor-pointer transition-colors group select-none ${
                      isChecked
                        ? 'border-primary/50 bg-primary/5 text-foreground'
                        : 'border-border/70 bg-muted/15 hover:bg-muted/30 text-foreground'
                    } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <input
                      id={optId}
                      type={isMultiple ? 'checkbox' : 'radio'}
                      name={`field_${field.id}`}
                      value={opt}
                      checked={isChecked}
                      disabled={disabled}
                      onChange={() => {
                        if (disabled) return;
                        if (isMultiple) {
                          const next = isChecked
                            ? selectedList.filter((item) => item !== opt)
                            : [...selectedList, opt];
                          onChange(field.id, next);
                        } else {
                          onChange(field.id, opt);
                        }
                      }}
                      className="sr-only"
                    />

                    {isMultiple ? (
                      <div
                        className={`size-4 rounded-xs border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'border-primary/80 bg-primary/10'
                            : 'border-primary/60 bg-transparent group-hover:border-primary'
                        }`}
                      >
                        {isChecked && <div className="size-2 rounded-xs bg-primary" />}
                      </div>
                    ) : (
                      <div
                        className={`size-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'border-primary/80 bg-primary/10'
                            : 'border-primary/60 bg-transparent group-hover:border-primary'
                        }`}
                      >
                        {isChecked && <div className="size-2 rounded-full bg-primary" />}
                      </div>
                    )}

                    <span className="text-[13px] text-foreground leading-normal">{opt}</span>
                  </label>
                );
              })}
            </div>
          );
        })()}

        {field.field_type === 'RATING' && (
          <div
            className={`flex items-center gap-2 rounded-md transition-colors ${
              error ? 'p-1.5 border border-destructive/30 bg-destructive/5' : ''
            }`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onChange(field.id, star)}
                className="cursor-pointer p-1 rounded-sm hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Star
                  className={`size-5 ${
                    Number(value || 0) >= star
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
            value={value as FileMetadata[] | FileMetadata | null}
            onChange={(val) => onChange(field.id, val)}
            disabled={disabled}
            className={error ? 'border-destructive ring-1 ring-destructive' : ''}
          />
        )}
      </div>

      {error && (
        <p className="text-[11px] text-destructive font-medium flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

