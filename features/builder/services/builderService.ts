import { formsService } from '@/features/forms/services/formsService';
import type { CreateFormPayload, EditFormPayload } from '@/types/api.types';

export const builderService = {
  saveDraft: (formId: string, payload: EditFormPayload) =>
    formsService.editForm(formId, payload),

  createForm: (payload: CreateFormPayload) =>
    formsService.createForm(payload),

  getForm: (formId: string) =>
    formsService.getSingleForm(formId),

  publishForm: (formId: string) =>
    formsService.editForm(formId, { status: 'PUBLISHED' }),
};
