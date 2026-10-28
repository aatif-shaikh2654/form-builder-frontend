'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FieldType, FieldsResponse } from '@/types/api.types';
import { useBuilderStore } from '../store/builderStore';
import { useConfirmationStore } from '@/store/useConfirmationStore';
import {
  GripVertical,
  Trash2,
  Copy,
  Settings2,
  Asterisk,
  Plus,
  X,
  Star,
  UploadCloud,
  Mail,
  Phone,
  Hash,
  Link as LinkIcon,
  Calendar,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface SortableElementItemProps {
  field: FieldsResponse;
  onDropFieldAt?: (fieldType: FieldType, targetFieldId: string, position: 'before' | 'after') => void;
}

export const SortableElementItem: React.FC<SortableElementItemProps> = ({ field, onDropFieldAt }) => {
  const {
    fields,
    selectedFieldId,
    setSelectedFieldId,
    updateField,
    removeField,
    addField,
  } = useBuilderStore();
  const confirm = useConfirmationStore((s) => s.confirm);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: {
      type: 'field',
      field,
    },
  });

  const isSelected = selectedFieldId === field.id;

  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const [dropSlotPosition, setDropSlotPosition] = useState<'before' | 'after' | null>(null);

  const handleHtmlDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/json')) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const isTopHalf = relativeY < rect.height / 2;
      setDropSlotPosition(isTopHalf ? 'before' : 'after');
    }
  };

  const handleHtmlDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropSlotPosition(null);
    }
  };

  const handleHtmlDrop = (e: React.DragEvent) => {
    if (dropSlotPosition && onDropFieldAt) {
      try {
        const dataStr = e.dataTransfer.getData('application/json');
        if (dataStr) {
          const data = JSON.parse(dataStr);
          if (data.type === 'field' && data.fieldType) {
            e.preventDefault();
            e.stopPropagation();
            onDropFieldAt(data.fieldType as FieldType, field.id, dropSlotPosition);
          }
        }
      } catch {
        // ignore
      }
    }
    setDropSlotPosition(null);
  };

  // Local state for inline label editing with React-recommended prevProp pattern
  const [labelText, setLabelText] = useState(field.label || 'Untitled Question');
  const [prevLabel, setPrevLabel] = useState(field.label);
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  if (field.label !== prevLabel) {
    setPrevLabel(field.label);
    setLabelText(field.label || 'Untitled Question');
  }

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    const trimmed = labelText.trim();
    if (trimmed && trimmed !== field.label) {
      updateField(field.id, { label: trimmed });
    } else {
      setLabelText(field.label || 'Untitled Question');
    }
  };

  // Local state for inline description editing with React-recommended prevProp pattern
  const [descText, setDescText] = useState(field.description || '');
  const [prevDesc, setPrevDesc] = useState(field.description);
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  if (field.description !== prevDesc) {
    setPrevDesc(field.description);
    setDescText(field.description || '');
  }

  const handleDescBlur = () => {
    setIsEditingDesc(false);
    if (descText !== (field.description || '')) {
      updateField(field.id, { description: descText.trim() || null });
    }
  };

  // Local state for inline placeholder editing with React-recommended prevProp pattern
  const [placeholderText, setPlaceholderText] = useState(field.placeholder || '');
  const [prevPlaceholder, setPrevPlaceholder] = useState(field.placeholder);

  if (field.placeholder !== prevPlaceholder) {
    setPrevPlaceholder(field.placeholder);
    setPlaceholderText(field.placeholder || '');
  }

  const handlePlaceholderChange = (newVal: string) => {
    setPlaceholderText(newVal);
    updateField(field.id, { placeholder: newVal });
  };

  // Extract choice options
  const options: string[] =
    Array.isArray(field.values) && field.values.length > 0
      ? field.values
      : Array.isArray(field.settings?.options) && (field.settings.options as string[]).length > 0
      ? (field.settings.options as string[])
      : ['Option 1', 'Option 2', 'Option 3'];

  const handleUpdateOption = (index: number, newText: string) => {
    const updated = [...options];
    updated[index] = newText;
    const newSettings = { ...field.settings, options: updated };
    updateField(field.id, {
      settings: newSettings,
      values: updated,
    });
  };

  const handleAddOption = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...options, `Option ${options.length + 1}`];
    const newSettings = { ...field.settings, options: updated };
    updateField(field.id, {
      settings: newSettings,
      values: updated,
    });
  };

  const handleRemoveOption = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (options.length <= 1) {
      toast.info('A choice question must have at least one option.');
      return;
    }
    const updated = options.filter((_, i) => i !== index);
    const newSettings = { ...field.settings, options: updated };
    updateField(field.id, {
      settings: newSettings,
      values: updated,
    });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = fields.findIndex((f) => f.id === field.id);
    const newField: FieldsResponse = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      label: `${field.label || 'Question'} (Copy)`,
      position: (field.position ?? currentIndex) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addField(newField, currentIndex + 1);
    toast.success(`Duplicated "${field.label || 'question'}"`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete Question Field?',
      description: `Are you sure you want to delete "${field.label || 'this question'}"? Any respondent data collected for this question will be removed.`,
      confirmText: 'Delete Field',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (ok) {
      removeField(field.id);
    }
  };

  const isChoiceField =
    field.field_type === 'SINGLE_CHOICE' ||
    field.field_type === 'MULTIPLE_CHOICE' ||
    field.field_type === 'CHECKBOX';

  return (
    <div
      onDragOver={handleHtmlDragOver}
      onDragLeave={handleHtmlDragLeave}
      onDrop={handleHtmlDrop}
      className="relative transition-all"
    >
      {dropSlotPosition === 'before' && (
        <div className="h-1.5 w-full bg-primary rounded-full my-1.5 animate-pulse shadow-xs shadow-primary/60" />
      )}

      <div
        id={`field-${field.id}`}
        ref={setNodeRef}
        style={style}
        className={`rounded-lg border bg-card p-4 sm:p-5 transition-all shadow-xs relative group/card ${
          isSelected
            ? 'border-primary ring-2 ring-primary/20 bg-card shadow-sm'
            : 'border-border/80 hover:border-border'
        } ${isDragging ? 'border-dashed border-2 border-primary/60 bg-primary/5' : ''}`}
      >
      {/* Floating Hover Action Overlay: Smoothly slides in from top when hovered or selected */}
      <div
        className={`absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-background/95 backdrop-blur-md border border-border/80 shadow-sm rounded-md p-0.5 transition-all duration-200 ease-out z-10 ${
          isSelected
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none group-hover/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:pointer-events-auto'
        }`}
      >
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing size-6 rounded flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors touch-none select-none"
          title="Drag to reorder question"
          aria-label="Drag to reorder question"
        >
          <GripVertical className="size-3.5" />
        </button>

        {/* Required Toggle Icon Button */}
        {field.field_type !== 'SECTION_HEADING' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateField(field.id, { is_required: !field.is_required });
            }}
            className={`cursor-pointer size-6 rounded flex items-center justify-center transition-colors ${
              field.is_required
                ? 'text-destructive bg-destructive/10 font-bold'
                : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted'
            }`}
            title={
              field.is_required
                ? 'Required field (click to make optional)'
                : 'Optional field (click to make required)'
            }
          >
            <Asterisk className="size-3.5" />
          </button>
        )}

        {/* Settings Icon (Icon only) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFieldId(field.id);
          }}
          className="cursor-pointer size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Open Field Inspector (Slide-over)"
        >
          <Settings2 className="size-3.5" />
        </button>

        {/* Duplicate Icon */}
        <button
          type="button"
          onClick={handleDuplicate}
          className="cursor-pointer size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Duplicate question"
        >
          <Copy className="size-3.5" />
        </button>

        {/* Delete Icon */}
        <button
          type="button"
          onClick={handleDelete}
          className="cursor-pointer size-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete question"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Question Header: Editable Label & Description taking full width */}
      <div className="w-full space-y-1 mb-3">
        {/* Question Label with direct inline editing */}
        <div className="flex items-center gap-1.5 w-full">
          {isEditingLabel ? (
            <Input
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={handleLabelBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLabelBlur();
              }}
              autoFocus
              className="h-7 text-xs sm:text-sm font-semibold px-2 py-1 w-full"
            />
          ) : (
            <h4
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingLabel(true);
              }}
              className="font-heading font-semibold text-xs sm:text-sm text-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5 group/label w-full break-words"
              title="Click to edit question text"
            >
              <span>{field.label || 'Untitled Question'}</span>
              {field.is_required && (
                <span className="text-destructive font-bold text-xs" title="Required field">
                  *
                </span>
              )}
            </h4>
          )}
        </div>

        {/* Question Description / Instructions with direct inline editing */}
        {isEditingDesc ? (
          <Input
            value={descText}
            onChange={(e) => setDescText(e.target.value)}
            onBlur={handleDescBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleDescBlur();
            }}
            placeholder="Add a help note or instructions for respondents..."
            autoFocus
            className="h-6 text-[11px] px-2 py-0.5 text-muted-foreground placeholder:text-[11px] placeholder:text-muted-foreground/50 w-full"
          />
        ) : (
          <p
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingDesc(true);
            }}
            className={`text-[11px] cursor-pointer hover:text-foreground transition-colors w-full break-words ${
              field.description
                ? 'text-muted-foreground'
                : 'text-muted-foreground/40 italic hover:text-muted-foreground/70'
            }`}
            title="Click to edit help text"
          >
            {field.description || '+ Add optional description or instructions...'}
          </p>
        )}
      </div>

      {/* Authentic WYSIWYG Form Input Control with Inline Placeholder Editing */}
      <div className="pt-0.5">
        {/* SHORT_TEXT */}
        {field.field_type === 'SHORT_TEXT' && (
          <Input
            value={placeholderText}
            onChange={(e) => handlePlaceholderChange(e.target.value)}
            placeholder="Click to edit placeholder (e.g. Type comments...)"
            title="Click to edit placeholder text shown to respondents"
            className="h-10 text-[13px] py-2 px-3 rounded-md bg-muted/15 hover:bg-background/80 focus:bg-background border-input text-foreground placeholder:text-[13px] placeholder:text-muted-foreground/50 transition-all"
          />
        )}

        {/* LONG_TEXT */}
        {field.field_type === 'LONG_TEXT' && (
          <Textarea
            rows={3}
            value={placeholderText}
            onChange={(e) => handlePlaceholderChange(e.target.value)}
            placeholder="Click to edit placeholder (e.g. Type comments...)"
            title="Click to edit placeholder text shown to respondents"
            className="text-[13px] py-2 px-3 rounded-md bg-muted/15 hover:bg-background/80 focus:bg-background border-input text-foreground placeholder:text-[13px] placeholder:text-muted-foreground/50 resize-none transition-all"
          />
        )}

        {/* EMAIL */}
        {field.field_type === 'EMAIL' && (
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
            <Input
              type="email"
              value={placeholderText}
              onChange={(e) => handlePlaceholderChange(e.target.value)}
              placeholder="e.g. respondent@example.com (click to edit placeholder)"
              title="Click to edit placeholder text shown to respondents"
              className="h-10 text-[13px] py-2 pl-10 pr-3 rounded-md bg-muted/15 hover:bg-background/80 focus:bg-background border-input text-foreground placeholder:text-[13px] placeholder:text-muted-foreground/50 transition-all"
            />
          </div>
        )}

        {/* PHONE */}
        {field.field_type === 'PHONE' && (
          <div className="relative flex items-center">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
            <Input
              type="tel"
              value={placeholderText}
              onChange={(e) => handlePlaceholderChange(e.target.value)}
              placeholder="e.g. +1 (555) 000-0000 (click to edit placeholder)"
              title="Click to edit placeholder text shown to respondents"
              className="h-10 text-[13px] py-2 pl-10 pr-3 rounded-md bg-muted/15 hover:bg-background/80 focus:bg-background border-input text-foreground placeholder:text-[13px] placeholder:text-muted-foreground/50 transition-all"
            />
          </div>
        )}

        {/* NUMBER */}
        {field.field_type === 'NUMBER' && (
          <div className="relative flex items-center">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
            <Input
              type="text"
              value={placeholderText}
              onChange={(e) => handlePlaceholderChange(e.target.value)}
              placeholder="e.g. 0 or enter a number... (click to edit placeholder)"
              title="Click to edit placeholder text shown to respondents"
              className="h-10 text-[13px] py-2 pl-10 pr-3 rounded-md bg-muted/15 hover:bg-background/80 focus:bg-background border-input text-foreground placeholder:text-[13px] placeholder:text-muted-foreground/50 transition-all"
            />
          </div>
        )}

        {/* URL */}
        {field.field_type === 'URL' && (
          <div className="relative flex items-center">
            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
            <Input
              type="url"
              value={placeholderText}
              onChange={(e) => handlePlaceholderChange(e.target.value)}
              placeholder="e.g. https://example.com (click to edit placeholder)"
              title="Click to edit placeholder text shown to respondents"
              className="h-10 text-[13px] py-2 pl-10 pr-3 rounded-md bg-muted/15 hover:bg-background/80 focus:bg-background border-input text-foreground placeholder:text-[13px] placeholder:text-muted-foreground/50 transition-all"
            />
          </div>
        )}

        {/* DATE */}
        {field.field_type === 'DATE' && (
          <div className="relative flex items-center">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-primary/70 pointer-events-none" />
            <Input
              type="text"
              value={placeholderText}
              onChange={(e) => handlePlaceholderChange(e.target.value)}
              placeholder="Select date... (click to customize placeholder)"
              title="Click to edit placeholder text shown in DatePicker"
              className="h-10 text-[13px] py-2 pl-10 pr-24 rounded-md bg-muted/15 hover:bg-background/80 focus:bg-background border-input text-foreground placeholder:text-[13px] placeholder:text-muted-foreground/50 transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60 pointer-events-none">
              DatePicker
            </span>
          </div>
        )}

        {/* TIME */}
        {field.field_type === 'TIME' && (
          <div className="relative flex items-center">
            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-primary/70 pointer-events-none" />
            <Input
              type="text"
              value={placeholderText}
              onChange={(e) => handlePlaceholderChange(e.target.value)}
              placeholder="Select time... (click to customize placeholder)"
              title="Click to edit placeholder text shown in TimePicker"
              className="h-10 text-[13px] py-2 pl-10 pr-24 rounded-md bg-muted/15 hover:bg-background/80 focus:bg-background border-input text-foreground placeholder:text-[13px] placeholder:text-muted-foreground/50 transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60 pointer-events-none">
              TimePicker
            </span>
          </div>
        )}

        {/* DATE_TIME */}
        {field.field_type === 'DATE_TIME' && (
          <div className="relative flex items-center">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-primary/70 pointer-events-none" />
            <Input
              type="text"
              value={placeholderText}
              onChange={(e) => handlePlaceholderChange(e.target.value)}
              placeholder="Select date & time... (click to customize placeholder)"
              title="Click to edit placeholder text shown in DateTimePicker"
              className="h-10 text-[13px] py-2 pl-10 pr-28 rounded-md bg-muted/15 hover:bg-background/80 focus:bg-background border-input text-foreground placeholder:text-[13px] placeholder:text-muted-foreground/50 transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60 pointer-events-none">
              DateTimePicker
            </span>
          </div>
        )}

        {/* DROPDOWN */}
        {field.field_type === 'DROPDOWN' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between h-10 px-3 py-2 rounded-md border border-input bg-muted/15 hover:bg-background/80 focus-within:border-primary focus-within:bg-background text-[13px] transition-all">
              <input
                type="text"
                value={placeholderText}
                onChange={(e) => handlePlaceholderChange(e.target.value)}
                placeholder="Select an option... (click to edit prompt)"
                title="Click to edit placeholder prompt shown to respondents"
                className="bg-transparent border-0 outline-none w-full text-[13px] text-foreground placeholder:text-[13px] placeholder:text-muted-foreground/50"
              />
              <ChevronDown className="size-4 text-muted-foreground shrink-0 ml-2 pointer-events-none" />
            </div>
            <div className="text-[11px] text-muted-foreground/80 flex items-center gap-2 px-1">
              <span>{options.length} options defined</span>
              <span>•</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFieldId(field.id);
                }}
                className="text-primary hover:underline cursor-pointer font-medium"
              >
                Configure options in Settings
              </button>
            </div>
          </div>
        )}

        {/* SINGLE_CHOICE / MULTIPLE_CHOICE / CHECKBOX */}
        {isChoiceField && (
          <div className="space-y-2">
            <div className="space-y-1.5">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 px-3 rounded-md border border-border/70 bg-muted/15 group/opt hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {field.field_type === 'SINGLE_CHOICE' ? (
                      <div className="size-4 rounded-full border border-primary/60 flex items-center justify-center shrink-0">
                        {idx === 0 && <div className="size-2 rounded-full bg-primary" />}
                      </div>
                    ) : (
                      <div className="size-4 rounded-xs border border-primary/60 flex items-center justify-center shrink-0">
                        {idx === 0 && <div className="size-2 rounded-xs bg-primary" />}
                      </div>
                    )}
                    {/* Inline editable option text */}
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleUpdateOption(idx, e.target.value)}
                      className="text-[13px] text-foreground bg-transparent border-0 outline-none w-full"
                    />
                  </div>

                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveOption(idx, e)}
                      className="opacity-0 group-hover/opt:opacity-100 text-muted-foreground hover:text-destructive p-0.5 transition-opacity"
                      title="Remove option"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddOption}
              className="text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5 h-7 px-2 cursor-pointer font-medium"
            >
              <Plus className="size-3" />
              <span>Add Option</span>
            </Button>
          </div>
        )}

        {/* RATING */}
        {field.field_type === 'RATING' && (
          <div className="flex items-center gap-2 py-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <div
                key={star}
                className="size-8 rounded-md border border-border/80 bg-muted/20 flex items-center justify-center hover:bg-amber-500/10 hover:border-amber-500/40 transition-colors cursor-pointer"
              >
                <Star className="size-4 text-amber-500 fill-amber-500/20" />
              </div>
            ))}
            <span className="text-[11px] text-muted-foreground ml-2">1 to 5 scale</span>
          </div>
        )}

        {/* FILE_UPLOAD */}
        {field.field_type === 'FILE_UPLOAD' && (
          <div className="border-2 border-dashed border-border/80 rounded-lg p-5 text-center bg-muted/10 flex flex-col items-center justify-center gap-1.5">
            <UploadCloud className="size-6 text-muted-foreground/60" />
            <p className="text-xs font-medium text-foreground">Click or drag file to upload</p>
            <p className="text-[10px] text-muted-foreground">PDF, DOCX, PNG, JPG up to 10MB</p>
          </div>
        )}

        {/* SECTION_HEADING */}
        {field.field_type === 'SECTION_HEADING' && (
          <div className="border-t border-border pt-2">
            <span className="text-[11px] font-mono uppercase text-muted-foreground">Section Separator</span>
          </div>
        )}
      </div>
    </div>

      {dropSlotPosition === 'after' && (
        <div className="h-1.5 w-full bg-primary rounded-full my-1.5 animate-pulse shadow-xs shadow-primary/60" />
      )}
    </div>
  );
};
