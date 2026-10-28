/**
 * Exact OpenAPI TypeScript Definitions for FastAPI Backend
 * Base URL: http://127.0.0.1:8000/docs
 */

export type FormType = 'FORM' | 'QUIZ' | 'SURVEY' | 'FEEDBACK' | 'POLL';

export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type FieldType =
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'DROPDOWN'
  | 'NUMBER'
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'DATE'
  | 'TIME'
  | 'DATE_TIME'
  | 'RATING'
  | 'FILE_UPLOAD'
  | 'CHECKBOX'
  | 'SECTION_HEADING';

export type UserRole = 'USER' | 'ADMIN' | 'SUPERADMIN';

export interface BackendResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// ----------------- Auth Models -----------------

export interface UserResponse {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_email_verified: boolean;
  last_login_at: string | null;
}

export interface APIResponse {
  success: boolean;
  message: string;
}

export interface SignupPayload {
  full_name: string;
  email: string;
  password: string;
  session_token?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  session_token?: string | null;
}

export interface RefreshTokenPayload {
  refresh_token: string;
}

export interface SessionData {
  user_id: string | null;
  session_token: string | null;
}

// ----------------- Field Models -----------------

export interface FieldsResponse {
  id: string;
  form_id: string | null;
  section_id: string | null;
  label: string;
  description: string | null;
  field_type: FieldType;
  placeholder: string | null;
  is_required: boolean;
  position: number;
  validation_rules: Record<string, unknown>;
  default_values: Record<string, unknown>;
  settings: Record<string, unknown>;
  values?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface AddFieldPayload {
  form_id: string | null;
  section_id: string | null;
  label: string;
  description?: string | null;
  field_type: FieldType;
  placeholder?: string | null;
  is_required: boolean;
  position: number;
  validation_rules: Record<string, unknown>;
  default_values: Record<string, unknown>;
  settings: Record<string, unknown>;
  values?: string[] | null;
}

export interface EditFieldPayload {
  form_id?: string | null;
  section_id?: string | null;
  label?: string | null;
  description?: string | null;
  field_type?: FieldType | null;
  placeholder?: string | null;
  is_required?: boolean | null;
  position?: number | null;
  validation_rules?: Record<string, unknown> | null;
  default_values?: Record<string, unknown> | null;
  settings?: Record<string, unknown> | null;
  values?: string[] | null;
}

export type LayoutType = 'GRID' | 'SINGLE_COLUMN';

export interface SectionResponse {
  id: string;
  form_id: string;
  title: string;
  description: string | null;
  position: number;
  layout_type?: LayoutType;
  column_count?: number;
  layout_config?: Record<string, unknown>;
  is_visible?: boolean;
  fields: FieldsResponse[];
  created_at: string;
  updated_at: string;
}

export interface AddSectionPayload {
  title: string;
  description?: string | null;
  position: number;
  layout_type?: LayoutType;
  column_count?: number;
  layout_config?: Record<string, unknown>;
  is_visible?: boolean;
}

export interface EditSectionPayload {
  title?: string | null;
  description?: string | null;
  position?: number | null;
  layout_type?: LayoutType | null;
  column_count?: number | null;
  layout_config?: Record<string, unknown> | null;
  is_visible?: boolean | null;
}

// ----------------- Settings Models -----------------

export interface FormSettingsResponse {
  id: string;
  form_id: string;
  confirmation_message: string | null;
  allow_multiple_submission: boolean;
  require_login: boolean;
  show_progress_bar: boolean;
  shuffle_questions: boolean;
  submission_limit: number | null;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsPayload {
  confirmation_message?: string | null;
  allow_multiple_submission: boolean;
  require_login: boolean;
  show_progress_bar: boolean;
  shuffle_questions: boolean;
  submission_limit?: number | null;
  start_at?: string | null;
  end_at?: string | null;
}

export interface QuizSettingsResponse {
  id: string;
  form_id: string;
  time_limit: number | null;
  passing_score: string | number;
  total_attempts: number | null;
  show_correct_answers: boolean;
  show_score_after_submissions: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateQuizSettingsPayload {
  time_limit?: number | null;
  passing_score: number | string;
  total_attempts?: number | null;
  show_correct_answers: boolean;
  show_score_after_submissions: boolean;
}

// ----------------- Form Models -----------------

export interface FormResponse {
  id: string;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  guest_session_id: string | null;
  title: string;
  description: string | null;
  form_type: FormType;
  status: FormStatus;
  slug: string | null;
  published_at: string | null;
}

export interface SingleForm {
  id: string;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  guest_session_id: string | null;
  title: string;
  description: string | null;
  form_type: FormType;
  status: FormStatus;
  slug: string | null;
  published_at: string | null;
  form_settings?: FormSettingsResponse | null;
  quiz_settings?: QuizSettingsResponse | null;
  sections: SectionResponse[];
  fields: FieldsResponse[];
}

export interface CreateFormPayload {
  title: string;
  description?: string | null;
  form_type: FormType;
}

export interface EditFormPayload {
  title?: string | null;
  description?: string | null;
  form_type?: FormType | null;
  status?: FormStatus | null;
}

export interface SaveFormPayload {
  title?: string | null;
  description?: string | null;
  sections: SectionResponse[];
  fields: FieldsResponse[];
}

export interface GetFormsParams {
  page?: number;
  limit?: number;
  search?: string;
  form_type?: FormType | 'ALL';
}

export interface FormStatsResponse {
  total_forms?: number;
  published?: number;
  drafts?: number;
  quizes?: number;
}

export interface PaginatedFormsResponse {
  items: FormResponse[];
  stats?: FormStatsResponse | null;
  page?: number | null;
  limit?: number | null;
  total?: number | null;
  total_pages?: number | null;
}


