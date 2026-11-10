import type {
  DraftFormType,
  SingleForm,
  FieldsResponse,
  FieldOptionItem,
  FieldCondition,
  SectionResponse,
  FormSettingsResponse,
  QuizSettingsResponse,
} from '@/types/api.types';

/**
 * Normalizes field items, ensuring valid values, conditions, and multiple flags
 * without injecting mock or synthetic dummy data.
 */
export function normalizeFieldsList(list: FieldsResponse[]): FieldsResponse[] {
  return list.map((f) => {
    const values =
      Array.isArray(f.values)
        ? f.values
        : Array.isArray(f.settings?.options)
        ? (f.settings.options as FieldOptionItem[])
        : null;

    const isMultiple =
      f.field_type === 'MULTIPLE_CHOICE'
        ? true
        : f.field_type === 'CHECKBOX'
        ? true
        : Boolean(f.is_multiple);

    const conditions: FieldCondition[] = Array.isArray(f.conditions)
      ? f.conditions.map((cond: Partial<FieldCondition>) => ({
          id: cond.id || '',
          target_field_id: cond.target_field_id || '',
          condition_operator: cond.condition_operator || 'EQUALS',
          condition_value: cond.condition_value || { value: '' },
          action: cond.action || 'SHOW',
        }))
      : [];

    return {
      ...f,
      values,
      conditions,
      settings: {
        ...(f.settings || {}),
        ...(values ? { options: values } : {}),
      },
      is_multiple: isMultiple,
    };
  });
}

/**
 * Normalizes backend form versioning data (DraftFormType) or SingleForm response
 * into a standard SingleForm interface.
 */
export function normalizePublishedForm(
  data: DraftFormType | SingleForm | null | undefined,
  slugOrId: string
): SingleForm | null {
  if (!data) return null;

  // Unpack nested { data: ... } wrapper if passed directly
  const raw =
    typeof data === 'object' && 'data' in data && data.data && typeof data.data === 'object'
      ? (data.data as DraftFormType | SingleForm)
      : data;

  // Direct SingleForm (contains fields/sections directly at root without nested content)
  if (
    'sections' in raw ||
    ('fields' in raw && Array.isArray((raw as unknown as SingleForm).fields) && !('content' in raw))
  ) {
    const single = raw as unknown as SingleForm;
    return {
      ...single,
      id: single.id || slugOrId,
      status: 'PUBLISHED',
      slug: single.slug || slugOrId,
      fields: normalizeFieldsList(single.fields || []),
      sections: (single.sections || []).map((sec) => ({
        ...sec,
        fields: normalizeFieldsList(
          (sec.fields || []).map((f) => ({
            ...f,
            section_id: f.section_id || sec.id,
          }))
        ),
      })),
    };
  }

  const draft = raw as DraftFormType;
  const content = (draft.content || {}) as Record<string, unknown>;

  const resolvedSections = (
    Array.isArray(content.sections) ? content.sections : []
  ) as SectionResponse[];

  const resolvedFields = (
    Array.isArray(content.fields) ? content.fields : []
  ) as FieldsResponse[];

  return {
    id: draft.form_id || draft.id || (content.id as string) || slugOrId,
    created_at: draft.created_at || new Date().toISOString(),
    updated_at: draft.updated_at || new Date().toISOString(),
    owner_id: null,
    guest_session_id: null,
    title: (content.title as string) || 'Published Form',
    description: (content.description as string) || null,
    form_type: ((content.form_type as string) || 'FORM') as SingleForm['form_type'],
    status: 'PUBLISHED',
    slug: slugOrId,
    published_at: draft.published_at || null,
    form_settings: (content.form_settings as FormSettingsResponse) || null,
    quiz_settings: (content.quiz_settings as QuizSettingsResponse) || null,
    sections: resolvedSections.map((sec) => ({
      ...sec,
      fields: normalizeFieldsList(
        (sec.fields || []).map((f) => ({
          ...f,
          section_id: f.section_id || sec.id,
        }))
      ),
    })),
    fields: normalizeFieldsList(resolvedFields),
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

  // Unpack nested { data: ... } wrapper if passed directly
  const raw =
    typeof data === 'object' && 'data' in data && data.data && typeof data.data === 'object'
      ? (data.data as DraftFormType | SingleForm)
      : data;

  // Direct SingleForm (contains fields/sections directly at root without nested content)
  if (
    'sections' in raw ||
    ('fields' in raw && Array.isArray((raw as unknown as SingleForm).fields) && !('content' in raw))
  ) {
    const single = raw as unknown as SingleForm;
    return {
      ...single,
      id: single.id || formId || '',
      status: single.status || 'DRAFT',
      fields: normalizeFieldsList(single.fields || []),
      sections: (single.sections || []).map((sec) => ({
        ...sec,
        fields: normalizeFieldsList(
          (sec.fields || []).map((f) => ({
            ...f,
            section_id: f.section_id || sec.id,
          }))
        ),
      })),
    };
  }

  const draft = raw as DraftFormType;
  const content = (draft.content || {}) as Record<string, unknown>;

  const resolvedSections = (
    Array.isArray(content.sections) ? content.sections : []
  ) as SectionResponse[];

  const resolvedFields = (
    Array.isArray(content.fields) ? content.fields : []
  ) as FieldsResponse[];

  return {
    id: (content.id as string) || draft.form_id || draft.id || formId || '',
    created_at: draft.created_at || new Date().toISOString(),
    updated_at: draft.updated_at || new Date().toISOString(),
    owner_id: null,
    guest_session_id: null,
    title: (content.title as string) || 'Preview Form',
    description: (content.description as string) || null,
    form_type: ((content.form_type as string) || 'FORM') as SingleForm['form_type'],
    status: (draft.status as SingleForm['status']) || (draft.published_at ? 'PUBLISHED' : 'DRAFT'),
    slug: formId || null,
    published_at: draft.published_at || null,
    form_settings: (content.form_settings as FormSettingsResponse) || null,
    quiz_settings: (content.quiz_settings as QuizSettingsResponse) || null,
    sections: resolvedSections.map((sec) => ({
      ...sec,
      fields: normalizeFieldsList(
        (sec.fields || []).map((f) => ({
          ...f,
          section_id: f.section_id || sec.id,
        }))
      ),
    })),
    fields: normalizeFieldsList(resolvedFields),
  };
}

