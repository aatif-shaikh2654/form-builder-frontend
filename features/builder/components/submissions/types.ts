import type { SubmissionAnswerResponse } from '@/types/api.types';
import type { FileItemData } from '@/components/ui/file-preview-dialog';
import { format, parseISO, isValid } from 'date-fns';

export interface QuestionColumn {
  id: string;
  field_id: string;
  label: string;
  field_type: string;
  position: number;
}

export function extractFilesFromAnswer(ans?: SubmissionAnswerResponse): FileItemData[] {
  if (!ans) return [];
  if (Array.isArray(ans.answer_json)) {
    return ans.answer_json as FileItemData[];
  }
  if (ans.answer_json && typeof ans.answer_json === 'object') {
    const obj = ans.answer_json as FileItemData;
    if (obj.stored_filename || obj.original_name || obj.name) {
      return [obj];
    }
  }
  return [];
}

export function formatDateTimeAnswer(
  rawVal?: string | null,
  fieldType?: string
): {
  formatted: string;
  isDateOrTime: boolean;
  type: 'date' | 'time' | 'datetime' | 'text';
} {
  if (!rawVal) return { formatted: '—', isDateOrTime: false, type: 'text' };
  const val = String(rawVal).trim();
  if (!val) return { formatted: '—', isDateOrTime: false, type: 'text' };

  const isTimeField = fieldType === 'TIME';
  const isDateField = fieldType === 'DATE';
  const isDateTimeField = fieldType === 'DATE_TIME';

  // 1. Check for pure time patterns (e.g. "14:30", "09:00", "2:30 pm")
  const timeMatch = val.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
  if (isTimeField || (!isDateField && !isDateTimeField && timeMatch)) {
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2];
      const ampm = timeMatch[3];
      if (ampm) {
        return {
          formatted: `${hours}:${minutes} ${ampm.toUpperCase()}`,
          isDateOrTime: true,
          type: 'time',
        };
      }
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return {
        formatted: `${hours}:${minutes} ${period}`,
        isDateOrTime: true,
        type: 'time',
      };
    }
  }

  // 2. Pure date string (e.g. "2026-11-10")
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [year, month, day] = val.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    if (isValid(localDate)) {
      return {
        formatted: format(localDate, 'MMM d, yyyy'),
        isDateOrTime: true,
        type: 'date',
      };
    }
  }

  // 3. ISO or standard Date string parsing
  try {
    let parsedDate: Date | null = null;
    const isoParsed = parseISO(val);
    if (isValid(isoParsed)) {
      parsedDate = isoParsed;
    } else {
      const fallback = new Date(val);
      if (isValid(fallback)) {
        parsedDate = fallback;
      }
    }

    if (parsedDate && isValid(parsedDate)) {
      if (isTimeField) {
        return {
          formatted: format(parsedDate, 'h:mm a'),
          isDateOrTime: true,
          type: 'time',
        };
      }

      if (isDateField) {
        return {
          formatted: format(parsedDate, 'MMM d, yyyy'),
          isDateOrTime: true,
          type: 'date',
        };
      }

      if (isDateTimeField || val.includes('T') || /\d{2}:\d{2}/.test(val)) {
        return {
          formatted: format(parsedDate, 'MMM d, yyyy, h:mm a'),
          isDateOrTime: true,
          type: 'datetime',
        };
      }

      return {
        formatted: format(parsedDate, 'MMM d, yyyy'),
        isDateOrTime: true,
        type: 'date',
      };
    }
  } catch {
    // If parsing fails, fall through to raw
  }

  return {
    formatted: val,
    isDateOrTime: isTimeField || isDateField || isDateTimeField,
    type: isTimeField ? 'time' : isDateField ? 'date' : isDateTimeField ? 'datetime' : 'text',
  };
}
