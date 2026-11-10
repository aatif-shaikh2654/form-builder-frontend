import type { FormSettingsResponse, QuizSettingsResponse } from '@/types/api.types';

export interface FormSettingsErrors {
  title?: string;
  submission_limit?: string;
  start_at?: string;
  end_at?: string;
  confirmation_message?: string;
}

export interface QuizSettingsErrors {
  passing_score?: string;
  time_limit?: string;
  total_attempts?: string;
}

export function validateFormSettings(data: {
  title?: string | null;
  submission_limit?: number | string | null;
  start_at?: string | null;
  end_at?: string | null;
  confirmation_message?: string | null;
}): { isValid: boolean; errors: FormSettingsErrors } {
  const errors: FormSettingsErrors = {};

  if (data.title !== undefined && data.title !== null) {
    if (data.title.trim() === '') {
      errors.title = 'Form title cannot be empty';
    } else if (data.title.length > 255) {
      errors.title = 'Form title cannot exceed 255 characters';
    }
  }

  if (
    data.submission_limit !== undefined &&
    data.submission_limit !== null &&
    data.submission_limit !== ''
  ) {
    const num = Number(data.submission_limit);
    if (isNaN(num) || !Number.isInteger(num) || num < 1) {
      errors.submission_limit = 'Submission cap must be a whole number of at least 1';
    }
  }

  let startTimestamp: number | null = null;
  if (data.start_at) {
    const start = new Date(data.start_at).getTime();
    if (isNaN(start)) {
      errors.start_at = 'Invalid open date & time format';
    } else {
      startTimestamp = start;
    }
  }

  let endTimestamp: number | null = null;
  if (data.end_at) {
    const end = new Date(data.end_at).getTime();
    if (isNaN(end)) {
      errors.end_at = 'Invalid close date & time format';
    } else {
      endTimestamp = end;
    }
  }

  if (startTimestamp !== null && endTimestamp !== null) {
    if (endTimestamp <= startTimestamp) {
      errors.end_at = 'Close date & time must be strictly after open date & time';
    }
  }

  if (data.confirmation_message && data.confirmation_message.length > 1000) {
    errors.confirmation_message = 'Confirmation message cannot exceed 1000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateQuizSettings(data: {
  passing_score?: number | string | null;
  time_limit?: number | string | null;
  total_attempts?: number | string | null;
}): { isValid: boolean; errors: QuizSettingsErrors } {
  const errors: QuizSettingsErrors = {};

  if (
    data.passing_score === undefined ||
    data.passing_score === null ||
    data.passing_score === ''
  ) {
    errors.passing_score = 'Passing score is required';
  } else {
    const score = Number(data.passing_score);
    if (isNaN(score)) {
      errors.passing_score = 'Passing score must be a valid number';
    } else if (score < 0 || score > 100) {
      errors.passing_score = 'Passing score must be between 0 and 100%';
    }
  }

  if (
    data.time_limit !== undefined &&
    data.time_limit !== null &&
    data.time_limit !== ''
  ) {
    const limit = Number(data.time_limit);
    if (isNaN(limit) || !Number.isInteger(limit) || limit < 1) {
      errors.time_limit = 'Time limit must be a whole number of at least 1 minute';
    }
  }

  if (
    data.total_attempts !== undefined &&
    data.total_attempts !== null &&
    data.total_attempts !== ''
  ) {
    const attempts = Number(data.total_attempts);
    if (isNaN(attempts) || !Number.isInteger(attempts) || attempts < 1) {
      errors.total_attempts = 'Maximum attempts must be a whole number of at least 1';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

