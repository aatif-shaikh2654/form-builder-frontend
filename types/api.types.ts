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

export interface GuestUser {
  session_token: string | null;
  expires_at: string | null;
}

export interface GetGuestSessionResponse {
  success: boolean;
  message: string;
  data: GuestUser;
}

export interface SessionData {
  user_id?: string | null;
  session_token: string | null;
  expires_at?: string | null;
}

// ----------------- Field Conditions & Models -----------------

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'EMPTY'
  | 'FILLED';

export type ConditionAction = 'SHOW' | 'HIDE';

export interface ConditionValue {
  value: unknown;
  [key: string]: unknown;
}

export interface FieldConditionTargetField {
  id: string;
  label: string;
  field_type: FieldType | string;
}

export interface FieldCondition {
  id: string;
  target_field_id: string;
  condition_operator: ConditionOperator | string;
  condition_value: ConditionValue;
  action: ConditionAction | string;
  target_field?: FieldConditionTargetField | null;
}

export type FieldOptionItem = string | { label: string; value: string };

export interface FieldsResponse {
  id: string;
  form_id: string | null;
  section_id: string | null;
  label: string;
  description: string | null;
  field_type: FieldType;
  placeholder: string | null;
  is_required: boolean;
  is_multiple?: boolean | null;
  position: number;
  validation_rules: Record<string, unknown>;
  conditions?: FieldCondition[] | null;
  default_values: Record<string, unknown>;
  settings: Record<string, unknown>;
  values?: FieldOptionItem[] | null;
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
  is_multiple?: boolean | null;
  position: number;
  validation_rules: Record<string, unknown>;
  conditions?: FieldCondition[] | null;
  default_values: Record<string, unknown>;
  settings: Record<string, unknown>;
  values?: FieldOptionItem[] | null;
}

export interface EditFieldPayload {
  form_id?: string | null;
  section_id?: string | null;
  label?: string | null;
  description?: string | null;
  field_type?: FieldType | null;
  placeholder?: string | null;
  is_required?: boolean | null;
  is_multiple?: boolean | null;
  position?: number | null;
  validation_rules?: Record<string, unknown> | null;
  conditions?: FieldCondition[] | null;
  default_values?: Record<string, unknown> | null;
  settings?: Record<string, unknown> | null;
  values?: FieldOptionItem[] | null;
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
  current_published_version_id?: string | null;
  published_version?: number | null;
  draft_version?: number | null;
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
  current_published_version_id?: string | null;
  published_version?: number | null;
  draft_version?: number | null;
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

export interface GenerateFormWithAIPayload {
  user_prompt: string;
}

export interface EditFormPayload {
  title?: string | null;
  description?: string | null;
  form_type?: FormType | null;
  status?: FormStatus | null;
  confirmation_message?: string | null;
  allow_multiple_submission?: boolean;
  require_login?: boolean;
  show_progress_bar?: boolean;
  shuffle_questions?: boolean;
  submission_limit?: number | null;
  start_at?: string | null;
  end_at?: string | null;
}

export interface SaveFormPayload {
  title?: string | null;
  description?: string | null;
  form_settings?: Partial<FormSettingsResponse> | Partial<UpdateSettingsPayload> | null;
  quiz_settings?: Partial<QuizSettingsResponse> | Partial<UpdateQuizSettingsPayload> | null;
  sections: SectionResponse[];
  fields: FieldsResponse[];
}

export interface SaveFormResponse {
  success: boolean;
  message: string;
  data: SingleForm;
}

export interface PublishFormResponse {
  success: boolean;
  message: string;
  data: FormResponse;
}

// ----------------- Form Versioning Models -----------------

export interface DraftFormType {
  version_id?: string;
  version_number?: number;
  status?: string;
  id?: string;
  created_at?: string;
  updated_at?: string;
  form_id?: string;
  content: Record<string, unknown> | SingleForm;
  published_at?: string | null;
  published_by_id?: string | null;
}

export interface DraftFormResponse {
  success: boolean;
  message: string;
  data: DraftFormType;
}

export interface GetPublishedFormResponse {
  success: boolean;
  message: string;
  data: DraftFormType | SingleForm;
}

export interface GetLiveFormResponse {
  success: boolean;
  message: string;
  data: SingleForm;
}

// ----------------- Submission Models -----------------

export interface UploadedFileResponse {
  id: string;
  file_id?: string;
  storage_key?: string;
  storageKey?: string;
  formId?: string | null;
  submission_id?: string | null;
  submissionId?: string | null;
  original_name: string;
  stored_filename: string;
  path: string;
  mime_type: string | null;
  size: number;
  url?: string;
}

export interface GetFileUploadUrlResponse {
  url: string;
  file_id?: string;
  expires_in?: number;
}

export interface AnswerResponse {
  field_id: string;
  answer_text?: string | null;
  answer_json?: Record<string, unknown> | unknown[] | null;
}

export interface SubmissionPayload {
  respondent_metadata: Record<string, unknown>;
  answers: AnswerResponse[];
}

// ----------------- Analytics & Submission Models -----------------

export type SubmissionStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED';

export interface SubmissionAnswerResponse {
  id: string;
  created_at: string;
  updated_at: string;
  field_id: string;
  answer_text: string | null;
  answer_json: Record<string, unknown> | unknown[] | null;
  field: FieldsResponse;
}

export interface SubmissionResponse {
  id: string;
  created_at: string;
  updated_at: string;
  form_id: string;
  respondent_id: string | null;
  response_number: number | null;
  status: SubmissionStatus;
  started_at: string | null;
  submitted_at: string;
  respondent_metadata: Record<string, unknown>;
  submission_answers: SubmissionAnswerResponse[];
}

export interface FormAnalyticsResponse {
  items: SubmissionResponse[];
  page?: number | null;
  limit?: number | null;
  total?: number | null;
  total_pages?: number | null;
}

export interface FormAnalyticsQueryResponse {
  success: boolean;
  message: string;
  data: FormAnalyticsResponse;
}

export interface GetSubmissionsParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ----------------- Query & Stats Models -----------------

export interface StatsResponse {
  total_forms?: number | null;
  published?: number | null;
  drafts?: number | null;
  quizes?: number | null;
}

export type FormStatsResponse = StatsResponse;

export interface GetAllFormQueryResponse {
  items: FormResponse[];
  stats?: StatsResponse | null;
  page?: number | null;
  limit?: number | null;
  total?: number | null;
  total_pages?: number | null;
}

export interface GetAllFormsResponse {
  success: boolean;
  message: string;
  data: GetAllFormQueryResponse;
}

export interface GetFormsParams {
  page?: number;
  limit?: number;
  search?: string;
  form_type?: FormType | 'ALL';
}

export interface PaginatedFormsResponse {
  items: FormResponse[];
  stats?: StatsResponse | null;
  page?: number | null;
  limit?: number | null;
  total?: number | null;
  total_pages?: number | null;
}



