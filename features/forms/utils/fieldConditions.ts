import type { FieldsResponse, FieldCondition } from '@/types/api.types';

export interface NormalizedFieldOption {
  label: string;
  value: string;
}

/**
 * Extracts and normalizes options for single-choice, multiple-choice,
 * checkbox, and dropdown fields into standard { label, value } items.
 */
export function getNormalizedFieldOptions(field: FieldsResponse): NormalizedFieldOption[] {
  const rawValues =
    Array.isArray(field.values) && field.values.length > 0
      ? field.values
      : Array.isArray(field.settings?.options) && (field.settings.options as unknown[]).length > 0
      ? (field.settings.options as unknown[])
      : [];

  return rawValues.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      const obj = opt as { label?: string; value?: string | number };
      const val = obj.value !== undefined ? String(obj.value) : String(obj.label || '');
      const lbl = obj.label ? String(obj.label) : val;
      return { label: lbl, value: val };
    }
    return { label: String(opt), value: String(opt) };
  });
}

/**
 * Evaluates whether a single condition matches the respondent's current answer.
 */
export function evaluateCondition(
  condition: FieldCondition,
  sourceAnswer: unknown
): boolean {
  if (!condition || !condition.condition_operator) return false;

  const operator = String(condition.condition_operator).toUpperCase();
  const expectedRaw = condition.condition_value?.value;

  const extractVal = (val: unknown): string => {
    if (val === undefined || val === null) return '';
    if (typeof val === 'object' && 'value' in val) {
      return String((val as { value: unknown }).value ?? '');
    }
    return String(val);
  };

  const isAnswerEmpty =
    sourceAnswer === undefined ||
    sourceAnswer === null ||
    sourceAnswer === '' ||
    (Array.isArray(sourceAnswer) && sourceAnswer.length === 0);

  // Check EMPTY & FILLED (support IS_EMPTY/IS_NOT_EMPTY for safety)
  if (operator === 'EMPTY' || operator === 'IS_EMPTY') {
    return isAnswerEmpty;
  }
  if (operator === 'FILLED' || operator === 'IS_NOT_EMPTY') {
    return !isAnswerEmpty;
  }

  // If answer is empty and operator requires a value, condition fails
  if (isAnswerEmpty) {
    return false;
  }

  const expectedStr = String(expectedRaw ?? '').trim().toLowerCase();

  // Multi-choice array answers (e.g. MULTIPLE_CHOICE, CHECKBOX, MultiSelect)
  if (Array.isArray(sourceAnswer)) {
    const answerStrs = sourceAnswer.map((item) => extractVal(item).trim().toLowerCase());

    switch (operator) {
      case 'EQUALS':
      case 'CONTAINS':
        return answerStrs.includes(expectedStr);

      case 'NOT_EQUALS':
      case 'NOT_CONTAINS':
        return !answerStrs.includes(expectedStr);

      default:
        break;
    }
  }

  const sourceStr = extractVal(sourceAnswer).trim().toLowerCase();

  switch (operator) {
    case 'EQUALS':
      return sourceStr === expectedStr;

    case 'NOT_EQUALS':
      return sourceStr !== expectedStr;

    case 'CONTAINS':
      return sourceStr.includes(expectedStr);

    case 'NOT_CONTAINS':
      return !sourceStr.includes(expectedStr);

    case 'GREATER_THAN': {
      const numAnswer = Number(sourceStr);
      const numExpected = Number(expectedStr);
      if (isNaN(numAnswer) || isNaN(numExpected)) return false;
      return numAnswer > numExpected;
    }

    case 'LESS_THAN': {
      const numAnswer = Number(sourceStr);
      const numExpected = Number(expectedStr);
      if (isNaN(numAnswer) || isNaN(numExpected)) return false;
      return numAnswer < numExpected;
    }

    case 'GREATER_THAN_OR_EQUALS': {
      const numAnswer = Number(sourceStr);
      const numExpected = Number(expectedStr);
      if (isNaN(numAnswer) || isNaN(numExpected)) return false;
      return numAnswer >= numExpected;
    }

    case 'LESS_THAN_OR_EQUALS': {
      const numAnswer = Number(sourceStr);
      const numExpected = Number(expectedStr);
      if (isNaN(numAnswer) || isNaN(numExpected)) return false;
      return numAnswer <= numExpected;
    }

    default:
      return sourceStr === expectedStr;
  }
}

/**
 * Computes a map of { [fieldId]: isVisible } for all form fields based on
 * source field answers and defined conditional rules.
 *
 * Rules:
 * - A field targeted by at least one 'SHOW' condition is hidden by default,
 *   and becomes visible when any source field's SHOW condition is met.
 * - A field targeted only by 'HIDE' conditions is visible by default,
 *   and becomes hidden when any source field's HIDE condition is met.
 * - Chained dependencies (A shows B shows C) are resolved with fixed-point iteration.
 */
export function computeFieldVisibility(
  fields: FieldsResponse[] = [],
  answers: Record<string, unknown> = {}
): Record<string, boolean> {
  const safeFields = Array.isArray(fields) ? fields : [];

  // Map of target_field_id -> list of incoming conditions
  const incomingMap = new Map<
    string,
    Array<{ sourceField: FieldsResponse; condition: FieldCondition }>
  >();

  for (const field of safeFields) {
    const conditions = Array.isArray(field.conditions) ? field.conditions : [];
    for (const cond of conditions) {
      if (!cond.target_field_id) continue;
      if (cond.target_field_id === field.id) continue; // Avoid self-referencing

      const list = incomingMap.get(cond.target_field_id) || [];
      list.push({ sourceField: field, condition: cond });
      incomingMap.set(cond.target_field_id, list);
    }
  }

  // Initial visibility map
  const visibility: Record<string, boolean> = {};
  for (const f of safeFields) {
    const incoming = incomingMap.get(f.id);
    if (!incoming || incoming.length === 0) {
      visibility[f.id] = true;
    } else {
      const hasShowCondition = incoming.some(
        (item) => String(item.condition.action).toUpperCase() === 'SHOW'
      );
      visibility[f.id] = !hasShowCondition;
    }
  }

  // Fixed-point evaluation for cascading / chained conditions
  let changed = true;
  let iterations = 0;
  const maxIterations = Math.max(safeFields.length, 1);

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const f of safeFields) {
      const incoming = incomingMap.get(f.id);
      if (!incoming || incoming.length === 0) continue;

      const hasShowCondition = incoming.some(
        (item) => String(item.condition.action).toUpperCase() === 'SHOW'
      );

      if (hasShowCondition) {
        let isShown = false;
        for (const { sourceField, condition } of incoming) {
          if (String(condition.action).toUpperCase() !== 'SHOW') continue;
          if (visibility[sourceField.id] === false) continue;

          if (evaluateCondition(condition, answers[sourceField.id])) {
            isShown = true;
            break;
          }
        }

        // HIDE conditions override SHOW conditions if satisfied
        if (isShown) {
          for (const { sourceField, condition } of incoming) {
            if (String(condition.action).toUpperCase() !== 'HIDE') continue;
            if (visibility[sourceField.id] === false) continue;

            if (evaluateCondition(condition, answers[sourceField.id])) {
              isShown = false;
              break;
            }
          }
        }

        if (visibility[f.id] !== isShown) {
          visibility[f.id] = isShown;
          changed = true;
        }
      } else {
        // Targeted exclusively by HIDE conditions
        let isHidden = false;
        for (const { sourceField, condition } of incoming) {
          if (String(condition.action).toUpperCase() !== 'HIDE') continue;
          if (visibility[sourceField.id] === false) continue;

          if (evaluateCondition(condition, answers[sourceField.id])) {
            isHidden = true;
            break;
          }
        }

        const newVisibility = !isHidden;
        if (visibility[f.id] !== newVisibility) {
          visibility[f.id] = newVisibility;
          changed = true;
        }
      }
    }
  }

  return visibility;
}

/**
 * Returns a human-readable summary of a condition for UI badges and card summaries.
 */
export function formatConditionSummary(
  condition: FieldCondition,
  targetField?: FieldsResponse | { label?: string } | null
): string {
  const opMap: Record<string, string> = {
    EQUALS: 'equals',
    NOT_EQUALS: 'is not',
    CONTAINS: 'contains',
    NOT_CONTAINS: 'does not contain',
    EMPTY: 'is empty',
    FILLED: 'is answered',
    IS_EMPTY: 'is empty',
    IS_NOT_EMPTY: 'is answered',
  };

  const op = opMap[condition.condition_operator] || condition.condition_operator;
  const isNoVal =
    condition.condition_operator === 'EMPTY' ||
    condition.condition_operator === 'FILLED' ||
    condition.condition_operator === 'IS_EMPTY' ||
    condition.condition_operator === 'IS_NOT_EMPTY';
  const val = isNoVal ? '' : ` "${String(condition.condition_value?.value ?? '')}"`;
  const action = condition.action?.toUpperCase() === 'HIDE' ? 'Hide' : 'Show';
  const targetLabel =
    (targetField && typeof targetField === 'object' && 'label' in targetField ? targetField.label : '') ||
    condition.target_field?.label ||
    'target';
  const target = `"${targetLabel}"`;

  return `If answer ${op}${val} → ${action} ${target}`;
}

