import { formsService } from '@/features/forms/services/formsService';
import type { CreateFormPayload, EditFormPayload, SaveFormPayload } from '@/types/api.types';

export const builderService = {
  saveDraft: (formId: string, payload: SaveFormPayload) =>
    formsService.saveDraft(formId, payload),

  getDraft: (formId: string) =>
    formsService.getDraft(formId),

  editMetadata: (formId: string, payload: EditFormPayload) =>
    formsService.editForm(formId, payload),

  createForm: (payload: CreateFormPayload) =>
    formsService.createForm(payload),

  getForm: (formId: string) =>
    formsService.getSingleForm(formId),

  publishForm: (formId: string) =>
    formsService.publishForm(formId),
};
