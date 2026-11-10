import type { FormSettingsResponse, QuizSettingsResponse } from '@/types/api.types';

/**
 * Compares two form settings objects for value equality.
 * Defaults are normalized so undefined/null/default representations match.
 */
export function areFormSettingsEqual(
  a?: Partial<FormSettingsResponse> | null,
  b?: Partial<FormSettingsResponse> | null
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;

  const confA = a.confirmation_message ?? null;
  const confB = b.confirmation_message ?? null;

  const multA = a.allow_multiple_submission !== undefined ? Boolean(a.allow_multiple_submission) : true;
  const multB = b.allow_multiple_submission !== undefined ? Boolean(b.allow_multiple_submission) : true;

  const reqA = Boolean(a.require_login);
  const reqB = Boolean(b.require_login);

  const progA = a.show_progress_bar !== undefined ? Boolean(a.show_progress_bar) : true;
  const progB = b.show_progress_bar !== undefined ? Boolean(b.show_progress_bar) : true;

  const shufA = Boolean(a.shuffle_questions);
  const shufB = Boolean(b.shuffle_questions);

  const limA =
    a.submission_limit !== undefined && a.submission_limit !== null
      ? Number(a.submission_limit)
      : null;
  const limB =
    b.submission_limit !== undefined && b.submission_limit !== null
      ? Number(b.submission_limit)
      : null;

  const startA = a.start_at || null;
  const startB = b.start_at || null;

  const endA = a.end_at || null;
  const endB = b.end_at || null;

  return (
    confA === confB &&
    multA === multB &&
    reqA === reqB &&
    progA === progB &&
    shufA === shufB &&
    limA === limB &&
    startA === startB &&
    endA === endB
  );
}

/**
 * Compares two quiz settings objects for value equality.
 * Defaults are normalized so undefined/null/default representations match.
 */
export function areQuizSettingsEqual(
  a?: Partial<QuizSettingsResponse> | null,
  b?: Partial<QuizSettingsResponse> | null
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;

  const timeA =
    a.time_limit !== undefined && a.time_limit !== null
      ? Number(a.time_limit)
      : null;
  const timeB =
    b.time_limit !== undefined && b.time_limit !== null
      ? Number(b.time_limit)
      : null;

  const passA = a.passing_score !== undefined && a.passing_score !== null ? String(a.passing_score) : '70';
  const passB = b.passing_score !== undefined && b.passing_score !== null ? String(b.passing_score) : '70';

  const attA =
    a.total_attempts !== undefined && a.total_attempts !== null
      ? Number(a.total_attempts)
      : null;
  const attB =
    b.total_attempts !== undefined && b.total_attempts !== null
      ? Number(b.total_attempts)
      : null;

  const corrA = a.show_correct_answers !== undefined ? Boolean(a.show_correct_answers) : true;
  const corrB = b.show_correct_answers !== undefined ? Boolean(b.show_correct_answers) : true;

  const scoreA =
    a.show_score_after_submissions !== undefined ? Boolean(a.show_score_after_submissions) : true;
  const scoreB =
    b.show_score_after_submissions !== undefined ? Boolean(b.show_score_after_submissions) : true;

  return (
    timeA === timeB &&
    passA === passB &&
    attA === attB &&
    corrA === corrB &&
    scoreA === scoreB
  );
}
