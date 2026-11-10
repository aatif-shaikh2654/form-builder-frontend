'use client';

import React, { memo } from 'react';
import type { SubmissionResponse, SubmissionAnswerResponse } from '@/types/api.types';
import type { QuestionColumn } from './types';
import type { FileItemData } from '@/components/ui/file-preview-dialog';
import { SubmissionCell } from './SubmissionCell';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SubmissionsCardListProps {
  submissions: SubmissionResponse[];
  dynamicColumns: QuestionColumn[];
  onPreviewFile: (file: FileItemData, allFiles?: FileItemData[]) => void;
}

export const SubmissionsCardList: React.FC<SubmissionsCardListProps> = memo(({
  submissions,
  dynamicColumns,
  onPreviewFile,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full">
      {submissions.map((sub, idx) => {
        const answersByField = new Map<string, SubmissionAnswerResponse>();
        (sub.submission_answers || []).forEach((a) => answersByField.set(a.field_id, a));

        return (
          <div
            key={sub.id}
            className="card-surface p-4 rounded-lg border border-border transition-all space-y-3 shadow-2xs group"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-foreground">
                  #{sub.response_number || idx + 1}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                >
                  {sub.status}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {sub.submitted_at ? format(new Date(sub.submitted_at), 'PP, p') : '—'}
              </span>
            </div>

            {/* Question Answers in Card */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {dynamicColumns.map((col) => {
                const ans = answersByField.get(col.field_id);
                return (
                  <div key={col.field_id} className="text-xs space-y-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground truncate block">
                      {col.label}
                    </span>
                    <div>
                      <SubmissionCell
                        answer={ans}
                        fieldType={col.field_type}
                        onPreviewFile={onPreviewFile}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});

SubmissionsCardList.displayName = 'SubmissionsCardList';

