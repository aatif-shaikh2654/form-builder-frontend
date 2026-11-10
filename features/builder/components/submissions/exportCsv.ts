import { format } from 'date-fns';
import type { SubmissionResponse, SubmissionAnswerResponse } from '@/types/api.types';
import type { QuestionColumn } from './types';
import { formatDateTimeAnswer } from './types';
import { toast } from 'sonner';

export function exportSubmissionsToCsv(
  submissions: SubmissionResponse[],
  dynamicColumns: QuestionColumn[],
  formTitle: string
) {
  if (submissions.length === 0) {
    toast.info('No submissions to export.');
    return;
  }

  try {
    const headers = [
      '#',
      'Submission ID',
      'Submitted At',
      'Status',
      ...dynamicColumns.map((col) => `"${col.label.replace(/"/g, '""')}"`),
      'User Agent',
      'Screen Resolution',
    ];

    const rows = submissions.map((sub, idx) => {
      const answersByField = new Map<string, SubmissionAnswerResponse>();
      (sub.submission_answers || []).forEach((a) => answersByField.set(a.field_id, a));

      const questionValues = dynamicColumns.map((col) => {
        const ans = answersByField.get(col.field_id);
        if (!ans) return '""';
        let val = ans.answer_text || '';
        if (
          col.field_type === 'DATE' ||
          col.field_type === 'TIME' ||
          col.field_type === 'DATE_TIME'
        ) {
          val = formatDateTimeAnswer(val, col.field_type).formatted;
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      });

      const meta = sub.respondent_metadata || {};
      const submittedDate = sub.submitted_at
        ? format(new Date(sub.submitted_at), 'yyyy-MM-dd HH:mm:ss')
        : '';

      return [
        sub.response_number || idx + 1,
        sub.id,
        `"${submittedDate}"`,
        sub.status,
        ...questionValues,
        `"${String(meta.user_agent || '').replace(/"/g, '""')}"`,
        `"${String(meta.screen_resolution || '')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${(formTitle || 'form').replace(/[^a-z0-9_-]/gi, '_')}-submissions.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Submissions exported to CSV successfully!');
  } catch (err) {
    console.error('Failed to export CSV:', err);
    toast.error('Failed to export submissions.');
  }
}

