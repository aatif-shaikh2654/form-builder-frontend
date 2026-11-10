'use client';

import React, { memo } from 'react';
import type { SubmissionResponse, SubmissionAnswerResponse } from '@/types/api.types';
import type { QuestionColumn } from './types';
import type { FileItemData } from '@/components/ui/file-preview-dialog';
import { SubmissionCell } from './SubmissionCell';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SubmissionsTableProps {
  submissions: SubmissionResponse[];
  dynamicColumns: QuestionColumn[];
  onPreviewFile: (file: FileItemData, allFiles?: FileItemData[]) => void;
}

export const SubmissionsTable: React.FC<SubmissionsTableProps> = memo(({
  submissions,
  dynamicColumns,
  onPreviewFile,
}) => {
  return (
    <div className="card-surface rounded-lg border border-border overflow-hidden shadow-2xs w-full">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground select-none">
              <th className="py-2.5 px-3 font-semibold text-[11px] font-mono w-14 shrink-0 text-center">
                #
              </th>
              <th className="py-2.5 px-3 font-semibold text-[11px] whitespace-nowrap min-w-[150px]">
                Submitted At
              </th>
              <th className="py-2.5 px-3 font-semibold text-[11px] whitespace-nowrap w-24">
                Status
              </th>

              {/* Dynamic Question Headers */}
              {dynamicColumns.map((col) => (
                <th
                  key={col.field_id}
                  className="py-2.5 px-3 font-semibold text-[11px] whitespace-nowrap min-w-[180px] max-w-[280px]"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate">{col.label}</span>
                    <span className="text-[9px] font-mono text-muted-foreground/70 uppercase">
                      ({col.field_type.replace(/_/g, ' ')})
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {submissions.map((sub, idx) => {
              const answersByField = new Map<string, SubmissionAnswerResponse>();
              (sub.submission_answers || []).forEach((a) => answersByField.set(a.field_id, a));

              return (
                <tr
                  key={sub.id}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-semibold text-foreground text-center">
                    {sub.response_number || idx + 1}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap text-muted-foreground">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="size-3 text-muted-foreground/70" />
                      <span>
                        {sub.submitted_at
                          ? format(new Date(sub.submitted_at), 'PP, p')
                          : '—'}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono py-0 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                    >
                      {sub.status}
                    </Badge>
                  </td>

                  {/* Dynamic Answer Cells */}
                  {dynamicColumns.map((col) => {
                    const ans = answersByField.get(col.field_id);
                    return (
                      <td key={col.field_id} className="py-3 px-3 align-middle max-w-[280px]">
                        <SubmissionCell
                          answer={ans}
                          fieldType={col.field_type}
                          onPreviewFile={onPreviewFile}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

SubmissionsTable.displayName = 'SubmissionsTable';

