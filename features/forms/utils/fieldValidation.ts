import type { FieldsResponse } from '@/types/api.types';
import { computeFieldVisibility } from './fieldConditions';

export interface FieldValidationRules {
  custom_error_message?: string | null;

  // Text types (SHORT_TEXT, LONG_TEXT, EMAIL, PHONE, URL)
  min_length?: number | null;
  max_length?: number | null;
  regex_pattern?: string | null;
  regex_message?: string | null;

  // Number & Rating (NUMBER, RATING)
  min_value?: number | null;
  max_value?: number | null;
  integer_only?: boolean | null;

  // Date / Time types (DATE, TIME, DATE_TIME)
  min_date?: string | null;
  max_date?: string | null;
  disable_past?: boolean | null;
  disable_future?: boolean | null;

  // Multi-choice & Dropdown selections (DROPDOWN, MULTIPLE_CHOICE, CHECKBOX)
  min_select?: number | null;
  max_select?: number | null;

  // File Upload (FILE_UPLOAD)
  max_file_size_mb?: number | null;
  allowed_extensions?: string | null;
  max_files?: number | null;
}

/**
 * Validates a single field against its required state and validation_rules object.
 * Returns error message string if invalid, or null if valid.
 */
export function validateSingleField(
  field: FieldsResponse,
  value: unknown
): string | null {
  const rules = (field.validation_rules || {}) as FieldValidationRules;
  const customError = rules.custom_error_message?.trim() || null;

  // 1. Check Required Status
  const isValueEmpty =
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0);

  if (field.is_required && isValueEmpty) {
    return customError || `${field.label || 'This field'} is required`;
  }

  // If empty and optional, validation passes
  if (isValueEmpty) {
    return null;
  }

  // 2. Field Type Specific Rules
  switch (field.field_type) {
    case 'SHORT_TEXT':
    case 'LONG_TEXT': {
      const str = String(value).trim();
      if (rules.min_length != null && str.length < Number(rules.min_length)) {
        return (
          customError ||
          `Must be at least ${rules.min_length} characters (currently ${str.length})`
        );
      }
      if (rules.max_length != null && str.length > Number(rules.max_length)) {
        return (
          customError ||
          `Cannot exceed ${rules.max_length} characters (currently ${str.length})`
        );
      }
      if (rules.regex_pattern) {
        try {
          const reg = new RegExp(rules.regex_pattern);
          if (!reg.test(str)) {
            return rules.regex_message || customError || 'Input does not match required format';
          }
        } catch {
          // Ignore invalid regex
        }
      }
      break;
    }

    case 'EMAIL': {
      const email = String(value).trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return customError || 'Please enter a valid email address';
      }
      if (rules.regex_pattern) {
        try {
          const reg = new RegExp(rules.regex_pattern);
          if (!reg.test(email)) {
            return rules.regex_message || customError || 'Email domain or pattern is not allowed';
          }
        } catch {
          // Ignore
        }
      }
      break;
    }

    case 'PHONE': {
      const phone = String(value).trim();
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,20}$/;
      if (!phoneRegex.test(phone)) {
        return customError || 'Please enter a valid phone number (at least 7 digits)';
      }
      if (rules.min_length != null && phone.length < Number(rules.min_length)) {
        return customError || `Phone must be at least ${rules.min_length} digits`;
      }
      if (rules.max_length != null && phone.length > Number(rules.max_length)) {
        return customError || `Phone cannot exceed ${rules.max_length} digits`;
      }
      break;
    }

    case 'URL': {
      const urlStr = String(value).trim();
      try {
        const fullUrl =
          urlStr.startsWith('http://') || urlStr.startsWith('https://')
            ? urlStr
            : `https://${urlStr}`;
        const parsed = new URL(fullUrl);
        if (!parsed.hostname || !parsed.hostname.includes('.')) {
          return customError || 'Please enter a valid web URL (e.g. https://example.com)';
        }
      } catch {
        return customError || 'Please enter a valid web URL (e.g. https://example.com)';
      }
      break;
    }

    case 'NUMBER': {
      const num = Number(value);
      if (isNaN(num)) {
        return customError || 'Please enter a valid number';
      }
      if (rules.integer_only && !Number.isInteger(num)) {
        return customError || 'Must be a whole integer number';
      }
      if (rules.min_value != null && num < Number(rules.min_value)) {
        return customError || `Must be at least ${rules.min_value}`;
      }
      if (rules.max_value != null && num > Number(rules.max_value)) {
        return customError || `Cannot exceed ${rules.max_value}`;
      }
      break;
    }

    case 'RATING': {
      const rating = Number(value);
      if (rules.min_value != null && rating < Number(rules.min_value)) {
        return customError || `Minimum rating is ${rules.min_value} star(s)`;
      }
      if (rules.max_value != null && rating > Number(rules.max_value)) {
        return customError || `Maximum rating is ${rules.max_value} star(s)`;
      }
      break;
    }

    case 'DATE':
    case 'DATE_TIME': {
      const date = new Date(String(value));
      if (isNaN(date.getTime())) {
        return customError || 'Please select a valid date';
      }

      if (rules.disable_past) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
          return customError || 'Past dates are not allowed';
        }
      }

      if (rules.disable_future) {
        const now = new Date();
        if (date > now) {
          return customError || 'Future dates are not allowed';
        }
      }

      if (rules.min_date) {
        const minD = new Date(rules.min_date);
        if (!isNaN(minD.getTime()) && date < minD) {
          return customError || `Date must be on or after ${rules.min_date}`;
        }
      }

      if (rules.max_date) {
        const maxD = new Date(rules.max_date);
        if (!isNaN(maxD.getTime()) && date > maxD) {
          return customError || `Date must be on or before ${rules.max_date}`;
        }
      }
      break;
    }

    case 'DROPDOWN':
    case 'MULTIPLE_CHOICE':
    case 'CHECKBOX': {
      if (Array.isArray(value)) {
        if (rules.min_select != null && value.length < Number(rules.min_select)) {
          return (
            customError ||
            `Please select at least ${rules.min_select} option(s) (currently ${value.length})`
          );
        }
        if (rules.max_select != null && value.length > Number(rules.max_select)) {
          return (
            customError ||
            `You can select at most ${rules.max_select} option(s) (currently ${value.length})`
          );
        }
      }
      break;
    }

    case 'FILE_UPLOAD': {
      const files = Array.isArray(value) ? value : [value];
      if (rules.max_files != null && files.length > Number(rules.max_files)) {
        return (
          customError ||
          `You can upload at most ${rules.max_files} file(s) (currently ${files.length})`
        );
      }

      const allowedExts = rules.allowed_extensions
        ? rules.allowed_extensions
            .toLowerCase()
            .split(',')
            .map((e) => e.trim().replace(/^\./, ''))
            .filter(Boolean)
        : [];

      for (const item of files) {
        if (!item || typeof item !== 'object') continue;
        const fileObj = item as Record<string, unknown>;

        // Size check
        const size =
          typeof fileObj.size === 'number'
            ? fileObj.size
            : 'file' in fileObj && fileObj.file instanceof File
            ? (fileObj.file as File).size
            : 0;

        if (rules.max_file_size_mb != null && size > 0) {
          const maxBytes = Number(rules.max_file_size_mb) * 1024 * 1024;
          if (size > maxBytes) {
            return (
              customError ||
              `File exceeds maximum allowed size of ${rules.max_file_size_mb} MB`
            );
          }
        }

        // Extension check
        if (allowedExts.length > 0) {
          const name =
            typeof fileObj.name === 'string'
              ? fileObj.name
              : typeof fileObj.original_name === 'string'
              ? fileObj.original_name
              : 'file' in fileObj && fileObj.file instanceof File
              ? (fileObj.file as File).name
              : '';

          if (name) {
            const ext = name.split('.').pop()?.toLowerCase() || '';
            if (!allowedExts.includes(ext)) {
              return (
                customError ||
                `Only files with extension .${allowedExts.join(', .')} are allowed`
              );
            }
          }
        }
      }
      break;
    }

    default:
      break;
  }

  return null;
}

/**
 * Validates all form fields against given respondent answers.
 * Returns { isValid, errors, firstErrorField, firstErrorMessage }
 */
export function validateAllFormFields(
  fields: FieldsResponse[],
  answers: Record<string, unknown>,
  visibleMap?: Record<string, boolean>
): {
  isValid: boolean;
  errors: Record<string, string>;
  firstErrorField?: FieldsResponse;
  firstErrorMessage?: string;
} {
  const errors: Record<string, string> = {};
  let firstErrorField: FieldsResponse | undefined;
  let firstErrorMessage: string | undefined;

  const visibility = visibleMap || computeFieldVisibility(fields, answers);

  for (const field of fields) {
    // Skip section headings as they have no inputs
    if (field.field_type === 'SECTION_HEADING') continue;

    // Skip fields hidden by conditional logic
    if (visibility[field.id] === false) continue;

    const error = validateSingleField(field, answers[field.id]);
    if (error) {
      errors[field.id] = error;
      if (!firstErrorField) {
        firstErrorField = field;
        firstErrorMessage = error;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstErrorField,
    firstErrorMessage,
  };
}

