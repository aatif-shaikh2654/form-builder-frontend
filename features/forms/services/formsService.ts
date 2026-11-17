import { clientHttp, createServerFetcher } from '@/lib/api';
import type {
  FormResponse,
  SingleForm,
  CreateFormPayload,
  GenerateFormWithAIPayload,
  EditFormPayload,
  UpdateQuizSettingsPayload,
  QuizSettingsResponse,
  AddSectionPayload,
  EditSectionPayload,
  SectionResponse,
  AddFieldPayload,
  EditFieldPayload,
  FieldsResponse,
  SaveFormPayload,
  GetFormsParams,
  PaginatedFormsResponse,
  DraftFormType,
  SubmissionPayload,
  APIResponse,
  UploadedFileResponse,
  SubmissionResponse,
  FormAnalyticsResponse,
  GetSubmissionsParams,
} from '@/types/api.types';

export {
  normalizeFieldsList,
  normalizePublishedForm,
  normalizeDraftForm,
} from '../utils/formNormalization';

/**
 * Helper to unwrap boolean success from delete API responses
 */
const unwrapSuccess = (res: unknown): boolean =>
  typeof res === 'object' && res !== null && 'success' in res
    ? Boolean((res as { success: boolean }).success)
    : Boolean(res);

export const formsService = {
  /**
   * GET /api/v1/form/all - Fetch forms from backend with required page and limit query params
   */
  async getAllForms(params?: GetFormsParams): Promise<PaginatedFormsResponse> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 12;
    const search = params?.search?.trim() || undefined;
    const form_type = params?.form_type && params.form_type !== 'ALL' ? params.form_type : undefined;

    const raw = await clientHttp.get<PaginatedFormsResponse | FormResponse[]>('/form/all', {
      params: { page, limit, search, form_type },
    });

    if (Array.isArray(raw)) {
      return {
        items: raw,
        stats: null,
        page,
        limit: raw.length || limit,
        total: raw.length,
        total_pages: 1,
      };
    }

    const items = Array.isArray(raw?.items) ? raw.items : [];
    const total = raw?.total ?? items.length;
    const total_pages = raw?.total_pages ?? (limit > 0 ? Math.ceil(total / limit) : 1);

    return {
      items,
      stats: raw?.stats ?? null,
      page: raw?.page ?? page,
      limit: raw?.limit ?? limit,
      total,
      total_pages,
    };
  },

  /**
   * GET /api/v1/form/{form_id} - Fetch single complete form with sections and fields
   */
  getSingleForm(formId: string): Promise<SingleForm> {
    return clientHttp.get<SingleForm>(`/form/${formId}`);
  },

  /**
   * PUT /api/v1/form/{form_id}/save-draft - Save entire draft form with sections & fields
   */
  saveDraft(formId: string, payload: SaveFormPayload): Promise<SingleForm> {
    return clientHttp.put<SingleForm>(`/form/${formId}/save-draft`, payload);
  },

  /**
   * GET /api/v1/form/{form_id}/get-draft - Fetch latest draft version from form versioning
   */
  getDraft(formId: string): Promise<DraftFormType> {
    return clientHttp.get<DraftFormType>(`/form/${formId}/get-draft`);
  },

  /**
   * POST /api/v1/form/{form_id}/publish - Publish form live
   */
  publishForm(formId: string): Promise<FormResponse> {
    return clientHttp.post<FormResponse>(`/form/${formId}/publish`);
  },

  /**
   * GET /api/v1/form/{slug}/form - Fetch published form version by unique slug
   */
  getPublishedForm(slug: string): Promise<DraftFormType | SingleForm> {
    return clientHttp.get<DraftFormType | SingleForm>(`/form/${slug}/form`);
  },

  /**
   * POST /api/v1/form/{form_id}/submit - Submit respondent answers for a form
   */
  submitForm(formId: string, payload: SubmissionPayload): Promise<APIResponse> {
    return clientHttp.post<APIResponse>(`/form/${formId}/submit`, payload);
  },

  /**
   * POST /api/v1/form/upload - Upload file(s) array
   */
  async uploadFiles(files: File[]): Promise<UploadedFileResponse[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return clientHttp.post<UploadedFileResponse[]>('/form/upload', formData);
  },

  /**
   * GET /api/v1/form/{form_id}/download-url?file_id={file_id}&submission_id={submission_id}
   * Retrieves the secure view/download URL for an uploaded file
   */
  async getFileUploadUrl(
    formId: string,
    fileId?: string | null,
    submissionId?: string | null,
    storageKey?: string | null
  ): Promise<string> {
    const extractUrl = (raw: unknown): string => {
      if (!raw) return '';
      if (typeof raw === 'string') return raw;
      if (typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        const nested =
          obj.data && typeof obj.data === 'object'
            ? (obj.data as Record<string, unknown>)
            : null;

        const candidate =
          obj.download_url ||
          obj.url ||
          obj.file_url ||
          obj.presigned_url ||
          obj.signed_url ||
          nested?.download_url ||
          nested?.url ||
          nested?.file_url ||
          nested?.presigned_url ||
          obj.path ||
          '';

        return candidate ? String(candidate) : '';
      }
      return '';
    };

    const effectiveFileId = fileId || storageKey || '';
    const params: Record<string, string> = {};

    if (effectiveFileId) {
      params.file_id = effectiveFileId;
    }
    if (submissionId) {
      params.submission_id = submissionId;
    }

    try {
      const res = await clientHttp.get<
        string | { url?: string; download_url?: string; file_url?: string; presigned_url?: string; path?: string }
      >(`/form/${formId}/download-url`, {
        params,
        skipErrorToast: true,
      });
      const url = extractUrl(res);
      if (!url) {
        throw new Error('File not found');
      }
      return url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      const isFileNotFound = msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('file not found');

      // If the error explicitly indicates "File not found", throw directly without calling fallback
      if (isFileNotFound) {
        throw new Error(msg || 'File not found');
      }

      // Fallback only if the endpoint /download-url itself returned 404 (route not found on backend)
      const status =
        (err as { status?: number; response?: { status?: number }; statusCode?: number })?.statusCode ||
        (err as { status?: number; response?: { status?: number } })?.status ||
        (err as { response?: { status?: number } })?.response?.status;

      if (status === 404) {
        try {
          const fallbackRes = await clientHttp.get<
            string | { url?: string; download_url?: string; file_url?: string; presigned_url?: string; path?: string }
          >(`/form/${formId}/upload`, {
            params,
            skipErrorToast: true,
          });
          const fallbackUrl = extractUrl(fallbackRes);
          if (fallbackUrl) return fallbackUrl;
        } catch (fallbackErr: unknown) {
          const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : '';
          if (fallbackMsg.toLowerCase().includes('not found')) {
            throw new Error('File not found');
          }
        }
      }

      throw err;
    }
  },

  /**
   * GET /api/v1/analytics/{form_id}/submits - Fetch submitted responses for a form with page, limit, and search
   */
  async getFormSubmissions(
    formId: string,
    params?: GetSubmissionsParams
  ): Promise<FormAnalyticsResponse> {
    const page = params?.page ?? 1;
    const limit = params?.limit;
    const search = params?.search?.trim() || undefined;

    const res = await clientHttp.get<FormAnalyticsResponse | SubmissionResponse[]>(
      `/analytics/${formId}/submits`,
      { params: { page: params?.page !== undefined ? page : undefined, limit, search } }
    );

    if (Array.isArray(res)) {
      return {
        items: res,
        page,
        limit: limit ?? res.length,
        total: res.length,
        total_pages: 1,
      };
    }
    return res;
  },

  /**
   * POST /api/v1/form/create - Create a new form
   */
  createForm(payload: CreateFormPayload): Promise<FormResponse> {
    return clientHttp.post<FormResponse>('/form/create', payload);
  },

  /**
   * POST /api/v1/ai/generate-form - Generate a full form using AI with a natural language prompt
   */
  generateFormWithAI(payload: GenerateFormWithAIPayload): Promise<SingleForm> {
    return clientHttp.post<SingleForm>('/ai/generate-form', payload, {
      timeout: 120000,
    });
  },

  /**
   * PATCH /api/v1/form/{form_id} - Edit form metadata & settings
   */
  editForm(formId: string, payload: EditFormPayload): Promise<EditFormPayload> {
    return clientHttp.patch<EditFormPayload>(`/form/${formId}`, {
      title: payload.title ?? null,
      description: payload.description ?? null,
      form_type: payload.form_type ?? null,
      status: payload.status ?? null,
      confirmation_message: payload.confirmation_message ?? null,
      allow_multiple_submission: Boolean(payload.allow_multiple_submission ?? true),
      require_login: Boolean(payload.require_login ?? false),
      show_progress_bar: Boolean(payload.show_progress_bar ?? true),
      shuffle_questions: Boolean(payload.shuffle_questions ?? false),
      submission_limit: payload.submission_limit ?? null,
      start_at: payload.start_at ?? null,
      end_at: payload.end_at ?? null,
    });
  },

  /**
   * DELETE /api/v1/form/{form_id} - Delete form
   */
  deleteForm(formId: string): Promise<boolean> {
    return clientHttp.delete<{ success?: boolean } | boolean>(`/form/${formId}`).then(unwrapSuccess);
  },

  /**
   * PATCH /api/v1/form/{form_id}/quiz-settings - Update Quiz Settings
   */
  updateQuizSettings(
    formId: string,
    payload: UpdateQuizSettingsPayload
  ): Promise<QuizSettingsResponse> {
    return clientHttp.patch<QuizSettingsResponse>(`/form/${formId}/quiz-settings`, payload);
  },

  /**
   * POST /api/v1/form/{form_id}/section - Add a section
   */
  addSection(formId: string, payload: AddSectionPayload): Promise<SectionResponse> {
    return clientHttp.post<SectionResponse>(`/form/${formId}/section`, payload);
  },

  /**
   * PATCH /api/v1/form/section/{section_id} - Update a section
   */
  updateSection(sectionId: string, payload: EditSectionPayload): Promise<SectionResponse> {
    return clientHttp.patch<SectionResponse>(`/form/section/${sectionId}`, payload);
  },

  /**
   * DELETE /api/v1/form/section/{section_id} - Delete a section
   */
  deleteSection(sectionId: string): Promise<boolean> {
    return clientHttp.delete<{ success?: boolean } | boolean>(`/form/section/${sectionId}`).then(unwrapSuccess);
  },

  /**
   * POST /api/v1/form/field - Add a form field
   */
  addField(payload: AddFieldPayload): Promise<FieldsResponse> {
    return clientHttp.post<FieldsResponse>('/form/field', payload);
  },

  /**
   * PATCH /api/v1/form/field/{field_id} - Update a form field
   */
  updateField(fieldId: string, payload: EditFieldPayload): Promise<FieldsResponse> {
    return clientHttp.patch<FieldsResponse>(`/form/field/${fieldId}`, payload);
  },

  /**
   * DELETE /api/v1/form/field/{field_id} - Delete a form field
   */
  deleteField(fieldId: string): Promise<boolean> {
    return clientHttp.delete<{ success?: boolean } | boolean>(`/form/field/${fieldId}`).then(unwrapSuccess);
  },

  /**
   * Server-side fetch for published form by slug with full cookies forwarding (SSR)
   */
  getServerPublishedForm: createServerFetcher<DraftFormType, [slug: string]>(
    (slug) => `/form/${encodeURIComponent(slug)}/form`
  ),

  /**
   * Server-side fetch for draft form by formId with full cookies forwarding (SSR)
   */
  getServerDraftForm: createServerFetcher<DraftFormType, [formId: string]>(
    (formId) => `/form/${encodeURIComponent(formId)}/get-draft`
  ),

  /**
   * Server-side fetch for single form by ID with full cookies forwarding (SSR fallback)
   */
  getServerFormById: createServerFetcher<SingleForm, [formId: string]>(
    (formId) => `/form/${encodeURIComponent(formId)}`
  ),

  /**
   * Server-side fetch for all forms with full cookies forwarding (SSR)
   */
  async getServerAllForms(cookiesHeader?: string): Promise<FormResponse[]> {
    const fetcher = createServerFetcher<PaginatedFormsResponse | FormResponse[]>(
      () => '/form/all?page=1&limit=50',
      []
    );
    const raw = await fetcher(cookiesHeader);
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && 'items' in raw && Array.isArray(raw.items)) {
      return raw.items;
    }
    return [];
  },
};

