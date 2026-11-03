import { clientHttp } from '@/lib/api';
import type {
  FormResponse,
  SingleForm,
  CreateFormPayload,
  EditFormPayload,
  UpdateSettingsPayload,
  FormSettingsResponse,
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
} from '@/types/api.types';

export const formsService = {
  /**
   * GET /api/v1/form/all - Fetch forms from backend with required page and limit query params
   */
  async getAllForms(params?: GetFormsParams): Promise<PaginatedFormsResponse> {
    const queryParams: Record<string, unknown> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 12,
    };

    if (params?.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }
    if (params?.form_type && params.form_type !== 'ALL') {
      queryParams.form_type = params.form_type;
    }

    const raw = await clientHttp.get<PaginatedFormsResponse | FormResponse[]>('/form/all', {
      params: queryParams,
    });

    if (Array.isArray(raw)) {
      return {
        items: raw,
        stats: null,
        page: (queryParams.page as number) || 1,
        limit: (queryParams.limit as number) || raw.length,
        total: raw.length,
        total_pages: 1,
      };
    }

    const items = Array.isArray(raw?.items) ? raw.items : [];
    const stats = raw?.stats ?? null;
    const page = raw?.page ?? (queryParams.page as number) ?? 1;
    const limit = raw?.limit ?? (queryParams.limit as number) ?? 12;
    const total = raw?.total ?? items.length;

    let total_pages = raw?.total_pages;
    if (total_pages == null && typeof total === 'number' && limit > 0) {
      total_pages = Math.ceil(total / limit);
    }

    return {
      items,
      stats,
      page,
      limit,
      total,
      total_pages: total_pages ?? 1,
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
  getPublishedForm(slug: string): Promise<DraftFormType> {
    return clientHttp.get<DraftFormType>(`/form/${slug}/form`);
  },

  /**
   * POST /api/v1/form/{form_id}/submit - Submit respondent answers for a form
   */
  submitForm(formId: string, payload: SubmissionPayload): Promise<APIResponse> {
    return clientHttp.post<APIResponse>(`/form/${formId}/submit`, payload);
  },

  /**
   * POST /api/v1/form/create - Create a new form
   */
  createForm(payload: CreateFormPayload): Promise<FormResponse> {
    return clientHttp.post<FormResponse>('/form/create', payload);
  },

  /**
   * PATCH /api/v1/form/{form_id} - Edit form metadata
   */
  editForm(formId: string, payload: EditFormPayload): Promise<EditFormPayload> {
    return clientHttp.patch<EditFormPayload>(`/form/${formId}`, payload);
  },

  /**
   * DELETE /api/v1/form/{form_id} - Delete form
   */
  async deleteForm(formId: string): Promise<boolean> {
    const res = await clientHttp.delete<{ success?: boolean } | boolean>(`/form/${formId}`);
    return typeof res === 'object' && res !== null ? Boolean(res.success) : Boolean(res);
  },

  /**
   * PATCH /api/v1/form/{form_id}/settings - Update Form Settings
   */
  updateSettings(formId: string, payload: UpdateSettingsPayload): Promise<FormSettingsResponse> {
    return clientHttp.patch<FormSettingsResponse>(`/form/${formId}/settings`, payload);
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
  async deleteSection(sectionId: string): Promise<boolean> {
    const res = await clientHttp.delete<{ success?: boolean } | boolean>(`/form/section/${sectionId}`);
    return typeof res === 'object' && res !== null ? Boolean(res.success) : Boolean(res);
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
  async deleteField(fieldId: string): Promise<boolean> {
    const res = await clientHttp.delete<{ success?: boolean } | boolean>(`/form/field/${fieldId}`);
    return typeof res === 'object' && res !== null ? Boolean(res.success) : Boolean(res);
  },

  /**
   * Server-side fetch for published form by slug with full cookies forwarding (SSR)
   */
  async getServerPublishedForm(
    slug: string,
    cookiesHeader?: string
  ): Promise<DraftFormType | null> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      if (cookiesHeader) {
        headers['Cookie'] = cookiesHeader;

        const sessionMatch = cookiesHeader.match(/(?:^|;\s*)(?:x-session-token|session_token)=([^;]+)/);
        if (sessionMatch) {
          headers['x-session-token'] = decodeURIComponent(sessionMatch[1]);
        }
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_BASE_URL ||
        'http://localhost:8000/api/v1';

      const res = await fetch(`${baseUrl}/form/${encodeURIComponent(slug)}/form`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!res.ok) {
        return null;
      }

      const json = await res.json();
      if (json && typeof json === 'object') {
        if ('data' in json && json.data) {
          return json.data as DraftFormType;
        }
        return json as DraftFormType;
      }
      return null;
    } catch (err) {
      console.error(`Failed to fetch published form on server for slug "${slug}":`, err);
      return null;
    }
  },

  /**
   * Server-side fetch for draft form by formId with full cookies forwarding (SSR)
   */
  async getServerDraftForm(
    formId: string,
    cookiesHeader?: string
  ): Promise<DraftFormType | null> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      if (cookiesHeader) {
        headers['Cookie'] = cookiesHeader;

        const sessionMatch = cookiesHeader.match(/(?:^|;\s*)(?:x-session-token|session_token)=([^;]+)/);
        if (sessionMatch) {
          headers['x-session-token'] = decodeURIComponent(sessionMatch[1]);
        }
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_BASE_URL ||
        'http://localhost:8000/api/v1';

      const res = await fetch(`${baseUrl}/form/${encodeURIComponent(formId)}/get-draft`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!res.ok) {
        return null;
      }

      const json = await res.json();
      if (json && typeof json === 'object') {
        if ('data' in json && json.data) {
          return json.data as DraftFormType;
        }
        return json as DraftFormType;
      }
      return null;
    } catch (err) {
      console.error(`Failed to fetch draft form on server for formId "${formId}":`, err);
      return null;
    }
  },

  /**
   * Server-side fetch for single form by ID with full cookies forwarding (SSR fallback)
   */
  async getServerFormById(
    formId: string,
    cookiesHeader?: string
  ): Promise<SingleForm | null> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      if (cookiesHeader) {
        headers['Cookie'] = cookiesHeader;

        const sessionMatch = cookiesHeader.match(/(?:^|;\s*)(?:x-session-token|session_token)=([^;]+)/);
        if (sessionMatch) {
          headers['x-session-token'] = decodeURIComponent(sessionMatch[1]);
        }
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_BASE_URL ||
        'http://localhost:8000/api/v1';

      const res = await fetch(`${baseUrl}/form/${encodeURIComponent(formId)}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!res.ok) {
        return null;
      }

      const json = await res.json();
      if (json && typeof json === 'object') {
        if ('data' in json && json.data) {
          return json.data as SingleForm;
        }
        return json as SingleForm;
      }
      return null;
    } catch (err) {
      console.error(`Failed to fetch form by ID on server for formId "${formId}":`, err);
      return null;
    }
  },

  /**
   * Server-side fetch (SSR)
   */
  async getServerAllForms(cookiesHeader?: string): Promise<FormResponse[]> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (cookiesHeader) {
        headers['Cookie'] = cookiesHeader;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_BASE_URL ||
        'http://localhost:8000/api/v1';

      const res = await fetch(`${baseUrl}/form/all?page=1&limit=50`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!res.ok) return [];

      const json = await res.json();
      const raw = json?.data ?? json;
      if (Array.isArray(raw)) return raw;
      if (raw && Array.isArray(raw.items)) return raw.items;
      return [];
    } catch {
      return [];
    }
  },
};

/**
 * Normalizes backend form versioning data (DraftFormType) or SingleForm response
 * into a standard SingleForm interface.
 */
export function normalizePublishedForm(
  data: DraftFormType | SingleForm | null | undefined,
  slugOrId: string
): SingleForm | null {
  if (!data) return null;

  // Direct SingleForm (already contains fields/sections arrays directly at root and no content field)
  if ('fields' in data && Array.isArray((data as SingleForm).fields) && !('content' in data)) {
    return data as SingleForm;
  }

  const draft = data as DraftFormType;
  const content = (draft.content || {}) as Record<string, unknown>;

  const resolvedSections = (
    Array.isArray(content.sections) ? content.sections : []
  ) as SectionResponse[];

  const resolvedFields = (
    Array.isArray(content.fields) ? content.fields : []
  ) as FieldsResponse[];

  return {
    id: draft.form_id || draft.id || slugOrId,
    created_at: draft.created_at || new Date().toISOString(),
    updated_at: draft.updated_at || new Date().toISOString(),
    owner_id: null,
    guest_session_id: null,
    title: (content.title as string) || 'Published Form',
    description: (content.description as string) || null,
    form_type: ((content.form_type as string) || 'FORM') as SingleForm['form_type'],
    status: 'PUBLISHED',
    slug: slugOrId,
    published_at: draft.published_at,
    form_settings: (content.form_settings as FormSettingsResponse) || null,
    quiz_settings: (content.quiz_settings as QuizSettingsResponse) || null,
    sections: resolvedSections,
    fields: resolvedFields,
  };
}

/**
 * Normalizes backend draft form versioning data (DraftFormType) or SingleForm response
 * into a standard SingleForm interface for draft previews.
 */
export function normalizeDraftForm(
  data: DraftFormType | SingleForm | null | undefined,
  formId?: string
): SingleForm | null {
  if (!data) return null;

  // Direct SingleForm (already contains fields/sections arrays directly at root and no content field)
  if ('fields' in data && Array.isArray((data as SingleForm).fields) && !('content' in data)) {
    return data as SingleForm;
  }

  const draft = data as DraftFormType;
  const content = (draft.content || {}) as Record<string, unknown>;

  const resolvedSections = (
    Array.isArray(content.sections) ? content.sections : []
  ) as SectionResponse[];

  const resolvedFields = (
    Array.isArray(content.fields) ? content.fields : []
  ) as FieldsResponse[];

  return {
    id: draft.form_id || draft.id || formId || '',
    created_at: draft.created_at || new Date().toISOString(),
    updated_at: draft.updated_at || new Date().toISOString(),
    owner_id: null,
    guest_session_id: null,
    title: (content.title as string) || 'Preview Form',
    description: (content.description as string) || null,
    form_type: ((content.form_type as string) || 'FORM') as SingleForm['form_type'],
    status: draft.published_at ? 'PUBLISHED' : 'DRAFT',
    slug: formId || null,
    published_at: draft.published_at || null,
    form_settings: (content.form_settings as FormSettingsResponse) || null,
    quiz_settings: (content.quiz_settings as QuizSettingsResponse) || null,
    sections: resolvedSections,
    fields: resolvedFields,
  };
}
