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
} from '@/types/api.types';

export const formsService = {
  /**
   * GET /api/v1/form/all - Fetch forms from backend with optional query params
   */
  async getAllForms(params?: GetFormsParams): Promise<PaginatedFormsResponse> {
    const raw = await clientHttp.get<PaginatedFormsResponse | FormResponse[]>('/form/all', { params });

    if (Array.isArray(raw)) {
      return {
        items: raw,
        stats: null,
        page: 1,
        limit: raw.length,
        total: raw.length,
        total_pages: 1,
      };
    }

    const items = Array.isArray(raw?.items) ? raw.items : [];
    const stats = raw?.stats ?? null;
    const page = raw?.page ?? params?.page ?? 1;
    const limit = raw?.limit ?? params?.limit ?? 12;
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
   * POST /api/v1/form/{form_id}/publish - Publish form live
   */
  publishForm(formId: string): Promise<FormResponse> {
    return clientHttp.post<FormResponse>(`/form/${formId}/publish`);
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
   * Server-side fetch (SSR)
   */
  async getServerAllForms(): Promise<FormResponse[]> {
    const data = await clientHttp.get<PaginatedFormsResponse | FormResponse[]>('/form/all');
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  },
};
