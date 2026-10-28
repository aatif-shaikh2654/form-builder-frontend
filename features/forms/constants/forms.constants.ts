import type { FormType, FormStatus } from '@/types/api.types';

export const FORMS_QUERY_KEY = ['forms'] as const;
export const formDetailQueryKey = (formId: string) => ['form', formId] as const;

export const FORMS_STALE_TIME = 5 * 60 * 1000; // 5 minutes stale time
export const FORMS_GC_TIME = 10 * 60 * 1000;    // 10 minutes cache garbage collection

export const FORM_FILTER_OPTIONS = [
  { id: 'ALL', label: 'All' },
  { id: 'FORM', label: 'Forms' },
  { id: 'QUIZ', label: 'Quizzes' },
  { id: 'SURVEY', label: 'Surveys' },
  { id: 'FEEDBACK', label: 'Feedback' },
  { id: 'POLL', label: 'Polls' },
] as const;

export const FORM_TYPE_CONFIG: Record<
  FormType,
  { label: string; description: string }
> = {
  FORM: {
    label: 'Standard Form',
    description: 'Collect contact details, lead capture, and registration info.',
  },
  QUIZ: {
    label: 'Interactive Quiz',
    description: 'Create graded tests with time limits, passing scores, and answer logic.',
  },
  SURVEY: {
    label: 'Customer Survey',
    description: 'Run customer satisfaction surveys and multi-question research.',
  },
  FEEDBACK: {
    label: 'Feedback Form',
    description: 'Collect product ratings, reviews, and client impressions.',
  },
  POLL: {
    label: 'Quick Poll',
    description: 'Single-choice voting for community opinions and quick sentiment checks.',
  },
};

export const FORM_STATUS_STYLES: Record<FormStatus, string> = {
  PUBLISHED:
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  DRAFT:
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  ARCHIVED: 'bg-muted text-muted-foreground border border-border',
};

export const FORM_MESSAGES = {
  CREATED: (title: string) => `Form "${title}" created!`,
  UPDATED: 'Form updated successfully',
  DELETED: 'Form deleted',
  SETTINGS_SAVED: 'Form settings saved',
  QUIZ_SETTINGS_SAVED: 'Quiz settings saved',
  SECTION_ADDED: 'Section added',
  SECTION_DELETED: 'Section deleted',
  FIELD_ADDED: 'Field added',
  FIELD_REMOVED: 'Field removed',
} as const;
