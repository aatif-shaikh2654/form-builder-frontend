'use client';

import React, { memo } from 'react';
import type { SubmissionAnswerResponse } from '@/types/api.types';
import {
  type FileItemData,
  getFileExtension,
  getFileCategory,
  getFileBadgeVariant,
  getFileIcon,
  formatBytes,
} from '@/components/ui/file-preview-dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Star, Files, Paperclip } from 'lucide-react';
import { extractFilesFromAnswer, formatDateTimeAnswer } from './types';

interface SubmissionCellProps {
  answer?: SubmissionAnswerResponse;
  fieldType?: string;
  formId?: string | null;
  submissionId?: string | null;
  onPreviewFile?: (file: FileItemData, allFiles?: FileItemData[]) => void;
}

export const SubmissionCell: React.FC<SubmissionCellProps> = memo(({
  answer,
  fieldType,
  formId,
  submissionId,
  onPreviewFile,
}) => {
  if (!answer) {
    return <span className="text-muted-foreground/50 text-xs">—</span>;
  }

  const effectiveFieldType = fieldType || answer.field?.field_type;

  // 1. File Upload Cell with a clean single button that opens the uploads sheet
  if (effectiveFieldType === 'FILE_UPLOAD') {
    const files = extractFilesFromAnswer(answer, formId, submissionId);
    if (files.length === 0) {
      return answer.answer_text ? (
        <span className="text-xs text-foreground truncate">{answer.answer_text}</span>
      ) : (
        <span className="text-muted-foreground/50 text-xs">—</span>
      );
    }

    const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
    const firstFile = files[0];
    const isSingle = files.length === 1;
    const firstFileName =
      firstFile.original_name || firstFile.name || firstFile.stored_filename || 'Uploaded File';
    const firstExt = getFileExtension(firstFileName);
    const firstCategory = getFileCategory(firstExt);
    const Icon = getFileIcon(firstCategory);

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPreviewFile?.(firstFile, files);
        }}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium border border-border bg-card hover:bg-accent/70 hover:border-primary/40 transition-all shadow-2xs group cursor-pointer text-left max-w-full"
        title={`Click to open sheet and list all ${files.length} uploaded ${files.length === 1 ? 'file' : 'files'}`}
      >
        <div
          className={`size-5 rounded flex items-center justify-center shrink-0 border ${
            isSingle
              ? getFileBadgeVariant(firstCategory)
              : 'bg-primary/10 text-primary border-primary/25'
          }`}
        >
          {isSingle ? <Icon className="size-3" /> : <Files className="size-3" />}
        </div>

        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="truncate text-foreground group-hover:text-primary transition-colors font-medium text-[11px]">
            {isSingle ? firstFileName : `${files.length} Files`}
          </span>
          {totalSize > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono shrink-0">
              ({formatBytes(totalSize)})
            </span>
          )}
        </div>

        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/70 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 font-mono uppercase shrink-0 transition-colors ml-auto">
          View
        </span>
      </button>
    );
  }

  // 2. Rating Cell with star visual
  if (effectiveFieldType === 'RATING') {
    const rating = Number(answer.answer_text || 0);
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center text-amber-500">
          {Array.from({ length: Math.min(5, Math.max(1, rating)) }).map((_, i) => (
            <Star key={i} className="size-3 fill-amber-500 text-amber-500" />
          ))}
        </div>
        <span className="text-xs font-semibold text-foreground ml-1">{rating}/5</span>
      </div>
    );
  }

  // 3. Dropdown / Checkbox / Multiple Choice tag badges
  if (
    effectiveFieldType === 'DROPDOWN' ||
    effectiveFieldType === 'CHECKBOX' ||
    effectiveFieldType === 'MULTIPLE_CHOICE'
  ) {
    const items = Array.isArray(answer.answer_json)
      ? (answer.answer_json as string[])
      : answer.answer_text
      ? answer.answer_text.split(',').map((s) => s.trim())
      : [];

    if (items.length > 0) {
      return (
        <div className="flex flex-wrap items-center gap-1">
          {items.map((item, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[10px] py-0 px-1.5 font-normal bg-muted/40 border-border text-foreground"
            >
              {item}
            </Badge>
          ))}
        </div>
      );
    }
  }

  // 4. Date / Time / DateTime formatted properly based on field type
  const dateInfo = formatDateTimeAnswer(answer.answer_text, effectiveFieldType);
  if (
    effectiveFieldType === 'DATE' ||
    effectiveFieldType === 'TIME' ||
    effectiveFieldType === 'DATE_TIME' ||
    dateInfo.isDateOrTime
  ) {
    const Icon = dateInfo.type === 'time' ? Clock : Calendar;

    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium"
        title={answer.answer_text || ''}
      >
        <Icon className="size-3.5 text-muted-foreground/80 shrink-0" />
        <span className="truncate">{dateInfo.formatted}</span>
      </span>
    );
  }

  // 5. Default text answer
  return (
    <span
      className="text-xs text-foreground truncate block max-w-[280px]"
      title={answer.answer_text || ''}
    >
      {answer.answer_text || '—'}
    </span>
  );
});

SubmissionCell.displayName = 'SubmissionCell';

