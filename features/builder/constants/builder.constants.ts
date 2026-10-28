import type {
  FieldType,
  FormSettingsResponse,
  QuizSettingsResponse,
  FieldsResponse,
} from '@/types/api.types';
import type { BuilderActiveTab } from '../store/builderStore';

export const BUILDER_TAB_ITEMS: { id: BuilderActiveTab; label: string }[] = [
  { id: 'canvas', label: 'Canvas' },
  { id: 'settings', label: 'Form Settings' },
  { id: 'quiz', label: 'Quiz Rules' },
];

export const FIELD_CATEGORIES = [
  'Structure',
  'Text',
  'Choice',
  'Advanced',
] as const;

export const DEFAULT_FORM_SETTINGS: Partial<FormSettingsResponse> = {
  confirmation_message: 'Thank you! Your response has been recorded.',
  allow_multiple_submission: true,
  require_login: false,
  show_progress_bar: true,
  shuffle_questions: false,
  submission_limit: null,
  start_at: null,
  end_at: null,
};

export const DEFAULT_QUIZ_SETTINGS: Partial<QuizSettingsResponse> = {
  time_limit: 30,
  passing_score: '70',
  total_attempts: 1,
  show_correct_answers: true,
  show_score_after_submissions: true,
};

export const DEFAULT_FIELD_LABELS: Record<FieldType, string> = {
  SECTION_HEADING: 'Section Title',
  SHORT_TEXT: 'Full Name',
  LONG_TEXT: 'Feedback or Comments',
  NUMBER: 'Age or Quantity',
  EMAIL: 'Email Address',
  PHONE: 'Phone Number',
  URL: 'Portfolio or Website URL',
  DATE: 'Select Date',
  TIME: 'Select Time',
  DATE_TIME: 'Appointment Date & Time',
  DROPDOWN: 'Select Category',
  SINGLE_CHOICE: 'Choose One Option',
  MULTIPLE_CHOICE: 'Select All That Apply',
  CHECKBOX: 'I agree to the terms and privacy policy',
  RATING: 'Satisfaction Score',
  FILE_UPLOAD: 'Upload Supporting Document',
};

export const DEFAULT_FIELD_PLACEHOLDERS: Partial<Record<FieldType, string>> = {
  SHORT_TEXT: 'Enter your answer...',
  LONG_TEXT: 'Type in detail here...',
  NUMBER: '0',
  EMAIL: 'name@domain.com',
  PHONE: '+1 (555) 000-0000',
  URL: 'https://example.com',
  DROPDOWN: 'Select an option...',
};

export const DEFAULT_CHOICE_OPTIONS = ['Option 1', 'Option 2', 'Option 3'];

export const DEFAULT_RATING_MAX_STARS = 5;

export const DEFAULT_FILE_UPLOAD_CONFIG = {
  max_file_size_mb: 10,
  allowed_extensions: ['.pdf', '.png', '.jpg', '.docx'],
};

export function createDefaultField(
  type: FieldType,
  formId: string | null = null,
  sectionId: string | null = null,
  position: number = 0
): FieldsResponse {
  const id = `f_${type.toLowerCase()}_${Math.random().toString(36).slice(2, 9)}`;
  let settings: Record<string, unknown> = {};
  let values: string[] | null = null;

  switch (type) {
    case 'DROPDOWN':
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
    case 'CHECKBOX':
      settings = { options: [...DEFAULT_CHOICE_OPTIONS] };
      values = [...DEFAULT_CHOICE_OPTIONS];
      break;
    case 'RATING':
      settings = { max_stars: DEFAULT_RATING_MAX_STARS };
      break;
    case 'FILE_UPLOAD':
      settings = { ...DEFAULT_FILE_UPLOAD_CONFIG };
      break;
    default:
      settings = {};
  }

  return {
    id,
    form_id: sectionId ? null : formId,
    section_id: sectionId || null,
    label: DEFAULT_FIELD_LABELS[type] || 'Untitled Field',
    description: null,
    field_type: type,
    placeholder: DEFAULT_FIELD_PLACEHOLDERS[type] || null,
    is_required: false,
    position,
    validation_rules: {},
    default_values: {},
    settings,
    values,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
