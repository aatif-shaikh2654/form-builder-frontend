import type {
  FieldsResponse,
  SectionResponse,
  AnswerResponse,
  UploadedFileResponse,
} from '@/types/api.types';

/**
 * Extracts and flattens all unique fields belonging to root and sections of a form.
 */
export function getAllFormFields(
  sections?: SectionResponse[] | null,
  fields?: FieldsResponse[] | null
): FieldsResponse[] {
  const list: FieldsResponse[] = [...(fields || [])];

  (sections || []).forEach((sec) => {
    (sec.fields || []).forEach((f) => {
      const fieldWithSection: FieldsResponse = {
        ...f,
        section_id: f.section_id || sec.id,
      };
      const existingIdx = list.findIndex((existing) => existing.id === f.id);
      if (existingIdx >= 0) {
        list[existingIdx] = {
          ...list[existingIdx],
          section_id: list[existingIdx].section_id || sec.id,
        };
      } else {
        list.push(fieldWithSection);
      }
    });
  });

  return list;
}

/**
 * Validates that all required fields have answered values.
 * Returns { isValid: true } if valid, or { isValid: false, errorField } with the first failing field.
 */
export function validateRequiredFields(
  fields: FieldsResponse[],
  answers: Record<string, unknown>
): { isValid: boolean; errorField?: FieldsResponse } {
  for (const field of fields) {
    if (field.is_required) {
      const val = answers[field.id];
      const isEmpty =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0);

      if (isEmpty) {
        return { isValid: false, errorField: field };
      }
    }
  }

  return { isValid: true };
}

/**
 * Formats user answers into the backend AnswerResponse[] contract for submission.
 */
export function formatAnswersForSubmission(
  answers: Record<string, unknown>,
  allFields: FieldsResponse[],
  uploadedMap: Map<string, UploadedFileResponse[]>,
  visibleMap?: Record<string, boolean>
): AnswerResponse[] {
  return Object.entries(answers)
    .filter(([fieldId, val]) => {
      if (visibleMap && visibleMap[fieldId] === false) return false;
      if (val === undefined || val === null || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    })
    .map(([fieldId, val]) => {
      const field = allFields.find((f) => f.id === fieldId);
      const isMultiple = Boolean(field?.is_multiple);

      let answer_text: string | null = null;
      let answer_json: Record<string, unknown> | unknown[] | null = null;

      if (field?.field_type === 'FILE_UPLOAD') {
        const uploadedFiles = uploadedMap.get(fieldId) || [];
        answer_text = uploadedFiles
          .map((u) => u.original_name || u.stored_filename || 'File')
          .join(', ');
        answer_json = uploadedFiles;
      } else if (Array.isArray(val)) {
        answer_text = val
          .map((item) =>
            typeof item === 'object' && item !== null && 'name' in item
              ? (item as { name: string }).name
              : String(item)
          )
          .join(', ');
        answer_json = val;
      } else if (val && typeof val === 'object') {
        const obj = val as Record<string, unknown>;
        answer_text = typeof obj.name === 'string' ? obj.name : JSON.stringify(obj);
        answer_json = isMultiple ? [obj] : obj;
      } else {
        answer_text = String(val);
        answer_json = isMultiple ? [val] : null;
      }

      return {
        field_id: fieldId,
        answer_text,
        answer_json,
      };
    });
}
