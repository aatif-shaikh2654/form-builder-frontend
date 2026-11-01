import type { FormElement } from '@/features/builder/types/builder.types';

export interface FormListItem {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  responsesCount: number;
  elementsCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface FormDetail extends FormListItem {
  elements: FormElement[];
  submitButtonText: string;
}

export type {
  GetFormsParams,
  PaginatedFormsResponse,
  FormStatsResponse,
  DraftFormType,
  DraftFormResponse,
  GetPublishedFormResponse,
  PublishFormResponse,
  SaveFormPayload,
  SaveFormResponse,
  SubmissionPayload,
  AnswerResponse,
  StatsResponse,
  GetAllFormQueryResponse,
  GetAllFormsResponse,
} from '@/types/api.types';

