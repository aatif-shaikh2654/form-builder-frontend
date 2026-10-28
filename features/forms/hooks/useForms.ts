'use client';

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { formsService } from '../services/formsService';
import type {
  FormResponse,
  CreateFormPayload,
  EditFormPayload,
  UpdateSettingsPayload,
  UpdateQuizSettingsPayload,
  AddSectionPayload,
  EditSectionPayload,
  AddFieldPayload,
  EditFieldPayload,
  SaveFormPayload,
  GetFormsParams,
  PaginatedFormsResponse,
} from '@/types/api.types';
import { toast } from 'sonner';

import {
  FORMS_QUERY_KEY,
  formDetailQueryKey,
  FORMS_STALE_TIME,
  FORMS_GC_TIME,
  FORM_MESSAGES,
} from '../constants/forms.constants';
import { useBuilderStore } from '@/features/builder/store/builderStore';

export { FORMS_QUERY_KEY, formDetailQueryKey, FORMS_STALE_TIME, FORMS_GC_TIME, FORM_MESSAGES };

/**
 * Helper to refetch single form API and sync builder store dynamically,
 * and refetch all forms query.
 */
async function syncSingleFormAndAllForms(
  queryClient: ReturnType<typeof useQueryClient>,
  formId?: string | null
) {
  // Invalidate and refetch all forms
  queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });

  const targetId = formId || useBuilderStore.getState().formId;
  if (targetId) {
    try {
      const freshForm = await formsService.getSingleForm(targetId);
      queryClient.setQueryData(formDetailQueryKey(targetId), freshForm);
      // Update form dynamically from response
      useBuilderStore.getState().syncFormFromServer(freshForm);
      return freshForm;
    } catch (err) {
      console.error('Failed to sync single form after mutation', err);
    }
  }
  return null;
}

/**
 * useAllFormsQuery - GET /api/v1/form/all
 * Fetches all forms using TanStack useQuery with 5-minute stale time
 */
export function useAllFormsQuery(params?: GetFormsParams) {
  return useQuery({
    queryKey: [...FORMS_QUERY_KEY, 'list', params],
    queryFn: () => formsService.getAllForms(params),
    staleTime: FORMS_STALE_TIME,
    gcTime: FORMS_GC_TIME,
  });
}

/**
 * useInfiniteFormsQuery - GET /api/v1/form/all with infinite scrolling pagination
 */
export function useInfiniteFormsQuery(params?: GetFormsParams) {
  const search = params?.search?.trim() || undefined;
  const form_type = params?.form_type && params.form_type !== 'ALL' ? params.form_type : undefined;
  const limit = params?.limit || 12;

  return useInfiniteQuery({
    queryKey: [...FORMS_QUERY_KEY, 'infinite', { search, form_type, limit }],
    queryFn: ({ pageParam = 1 }) =>
      formsService.getAllForms({
        page: pageParam as number,
        limit,
        search,
        form_type,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedFormsResponse) => {
      const currentPage = lastPage?.page ?? 1;
      const items = Array.isArray(lastPage?.items) ? lastPage.items : [];

      // 1. Calculate has_more based on total_pages and current page
      if (lastPage?.total_pages != null && lastPage?.page != null) {
        return lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined;
      }

      // 2. Calculate has_more based on total, limit, and current page
      if (
        typeof lastPage?.total === 'number' &&
        typeof lastPage?.limit === 'number' &&
        lastPage.limit > 0 &&
        lastPage?.page != null
      ) {
        return lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined;
      }

      // 3. Fallback based on limit threshold
      if (lastPage?.limit && items.length >= lastPage.limit) {
        return currentPage + 1;
      }

      return undefined;
    },
    staleTime: FORMS_STALE_TIME,
    gcTime: FORMS_GC_TIME,
  });
}

/**
 * useFormQuery - GET /api/v1/form/{form_id}
 * Fetches single form using TanStack useQuery with 5-minute stale time
 */
export function useFormQuery(formId: string | null) {
  return useQuery({
    queryKey: formDetailQueryKey(formId || ''),
    queryFn: () => formsService.getSingleForm(formId!),
    enabled: Boolean(formId),
    staleTime: FORMS_STALE_TIME,
    gcTime: FORMS_GC_TIME,
  });
}

/**
 * useCreateFormMutation - POST /api/v1/form/create
 * Creates a new form using TanStack useMutation and invalidates forms list
 */
export function useCreateFormMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFormPayload) => formsService.createForm(payload),
    onSuccess: (newForm) => {
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      if (newForm?.id) {
        queryClient.setQueryData(formDetailQueryKey(newForm.id), newForm);
      }
    },
  });
}

/**
 * useEditFormMutation - PATCH /api/v1/form/{form_id}
 * Updates form metadata and invalidates both list and detail queries
 */
export function useEditFormMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formId, payload }: { formId: string; payload: EditFormPayload }) =>
      formsService.editForm(formId, payload),
    onSuccess: async (_, { formId }) => {
      await syncSingleFormAndAllForms(queryClient, formId);
    },
  });
}

/**
 * useSaveDraftMutation - PUT /api/v1/form/{form_id}/save-draft
 * Saves complete form state (sections, fields, metadata) in one single atomic call
 */
export function useSaveDraftMutation(formId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formId: targetId, payload }: { formId: string; payload: SaveFormPayload }) =>
      formsService.saveDraft(targetId, payload),
    onSuccess: (savedForm, variables) => {
      const id = variables.formId || formId;
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      if (savedForm) {
        queryClient.setQueryData(formDetailQueryKey(id || savedForm.id), savedForm);
        useBuilderStore.getState().syncFormFromServer(savedForm);
      }
    },
  });
}

/**
 * usePublishFormMutation - POST /api/v1/form/{form_id}/publish
 * Publishes form live
 */
export function usePublishFormMutation(formId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetId: string) => formsService.publishForm(targetId),
    onSuccess: async (_, targetId) => {
      await syncSingleFormAndAllForms(queryClient, targetId || formId);
    },
  });
}

/**
 * useDeleteFormMutation - DELETE /api/v1/form/{form_id}
 * Deletes form using TanStack useMutation with optimistic cache removal and detail query cleanup
 */
export function useDeleteFormMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formId: string) => formsService.deleteForm(formId),
    onMutate: async (formId) => {
      await queryClient.cancelQueries({ queryKey: FORMS_QUERY_KEY });
      const previousForms = queryClient.getQueryData<FormResponse[]>(FORMS_QUERY_KEY);

      // Optimistically update standard query cache
      if (previousForms) {
        queryClient.setQueryData<FormResponse[]>(
          FORMS_QUERY_KEY,
          previousForms.filter((f) => f.id !== formId)
        );
      }

      // Optimistically update any active infinite query caches
      queryClient.setQueriesData<InfiniteData<PaginatedFormsResponse> | FormResponse[]>(
        { queryKey: FORMS_QUERY_KEY },
        (oldData) => {
          if (!oldData) return oldData;
          if ('pages' in oldData && Array.isArray(oldData.pages)) {
            return {
              ...oldData,
              pages: oldData.pages.map((p) => {
                const updatedItems = Array.isArray(p.items)
                  ? p.items.filter((f) => f.id !== formId)
                  : [];
                return {
                  ...p,
                  items: updatedItems,
                  total: typeof p.total === 'number' ? Math.max(0, p.total - 1) : p.total,
                };
              }),
            };
          }
          if (Array.isArray(oldData)) {
            return oldData.filter((f) => f.id !== formId);
          }
          return oldData;
        }
      );

      return { previousForms };
    },
    onError: (_err: unknown, _variables, context) => {
      if (context?.previousForms) {
        queryClient.setQueryData(FORMS_QUERY_KEY, context.previousForms);
      }
    },
    onSettled: (_data, _error, formId) => {
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      if (formId) {
        queryClient.removeQueries({ queryKey: formDetailQueryKey(formId) });
      }
    },
    onSuccess: () => {
      toast.success('Form deleted');
    },
  });
}

/**
 * useUpdateSettingsMutation - PATCH /api/v1/form/{form_id}/settings
 * Updates form settings and invalidates both detail and list queries
 */
export function useUpdateSettingsMutation(formId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSettingsPayload) =>
      formsService.updateSettings(formId!, payload),
    onSuccess: async () => {
      await syncSingleFormAndAllForms(queryClient, formId);
    },
  });
}

/**
 * useUpdateQuizSettingsMutation - PATCH /api/v1/form/{form_id}/quiz-settings
 * Updates quiz settings and invalidates both detail and list queries
 */
export function useUpdateQuizSettingsMutation(formId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateQuizSettingsPayload) =>
      formsService.updateQuizSettings(formId!, payload),
    onSuccess: async () => {
      await syncSingleFormAndAllForms(queryClient, formId);
    },
  });
}

/**
 * useAddSectionMutation - POST /api/v1/form/{form_id}/section
 * Adds a form section and invalidates detail and list queries
 */
export function useAddSectionMutation(formId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddSectionPayload) => formsService.addSection(formId!, payload),
    onSuccess: async () => {
      await syncSingleFormAndAllForms(queryClient, formId);
    },
  });
}

/**
 * useUpdateSectionMutation - PATCH /api/v1/form/section/{section_id}
 * Updates a form section and invalidates detail query
 */
export function useUpdateSectionMutation(formId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, payload }: { sectionId: string; payload: EditSectionPayload }) =>
      formsService.updateSection(sectionId, payload),
    onSuccess: async () => {
      await syncSingleFormAndAllForms(queryClient, formId);
    },
  });
}

/**
 * useDeleteSectionMutation - DELETE /api/v1/form/section/{section_id}
 * Deletes a form section and invalidates detail and list queries
 */
export function useDeleteSectionMutation(formId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: string) => formsService.deleteSection(sectionId),
    onSuccess: async () => {
      await syncSingleFormAndAllForms(queryClient, formId);
    },
  });
}

/**
 * useAddFieldMutation - POST /api/v1/form/field
 * Adds a form field and invalidates detail and list queries
 */
export function useAddFieldMutation(formId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddFieldPayload) => formsService.addField(payload),
    onSuccess: async (_data, variables) => {
      await syncSingleFormAndAllForms(queryClient, formId || variables.form_id);
    },
  });
}

/**
 * useUpdateFieldMutation - PATCH /api/v1/form/field/{field_id}
 * Updates a form field and invalidates detail query
 */
export function useUpdateFieldMutation(formId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fieldId, payload }: { fieldId: string; payload: EditFieldPayload }) =>
      formsService.updateField(fieldId, payload),
    onSuccess: async (_data, variables) => {
      await syncSingleFormAndAllForms(queryClient, formId || variables?.payload?.form_id);
    },
  });
}

/**
 * useDeleteFieldMutation - DELETE /api/v1/form/field/{field_id}
 * Deletes a form field and invalidates detail and list queries
 */
export function useDeleteFieldMutation(formId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fieldId: string) => formsService.deleteField(fieldId),
    onSuccess: async () => {
      await syncSingleFormAndAllForms(queryClient, formId);
    },
  });
}

/**
 * Unified hook to manage forms collection with infinite scroll pagination and 5-minute stale time
 */
export function useForms(params?: GetFormsParams) {
  const infiniteQuery = useInfiniteFormsQuery(params);
  const createFormMutation = useCreateFormMutation();
  const editFormMutation = useEditFormMutation();
  const deleteFormMutation = useDeleteFormMutation();

  const forms =
    infiniteQuery.data?.pages.flatMap((page) => page.items ?? []) ?? [];
  const total =
    infiniteQuery.data?.pages[0]?.total ??
    infiniteQuery.data?.pages[0]?.items?.length ??
    forms.length;
  const stats = infiniteQuery.data?.pages[0]?.stats ?? null;

  return {
    forms,
    total,
    stats,
    isLoading: infiniteQuery.isLoading,
    isFetching: infiniteQuery.isFetching,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: Boolean(infiniteQuery.hasNextPage),
    fetchNextPage: infiniteQuery.fetchNextPage,
    isError: infiniteQuery.isError,
    error: infiniteQuery.error,
    refetch: infiniteQuery.refetch,
    createForm: createFormMutation.mutateAsync,
    isCreating: createFormMutation.isPending,
    editForm: editFormMutation.mutateAsync,
    isEditing: editFormMutation.isPending,
    deleteForm: deleteFormMutation.mutate,
    isDeleting: deleteFormMutation.isPending,
  };
}

/**
 * Unified hook to fetch a single complete form with sections, fields, and settings
 */
export function useSingleForm(formId: string | null) {
  const query = useFormQuery(formId);
  const saveDraftMutation = useSaveDraftMutation(formId);
  const publishMutation = usePublishFormMutation(formId);
  const updateSettingsMutation = useUpdateSettingsMutation(formId);
  const updateQuizSettingsMutation = useUpdateQuizSettingsMutation(formId);
  const addSectionMutation = useAddSectionMutation(formId);
  const updateSectionMutation = useUpdateSectionMutation(formId);
  const deleteSectionMutation = useDeleteSectionMutation(formId);
  const addFieldMutation = useAddFieldMutation(formId);
  const updateFieldMutation = useUpdateFieldMutation(formId);
  const deleteFieldMutation = useDeleteFieldMutation(formId);

  return {
    form: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    saveDraft: saveDraftMutation.mutateAsync,
    isSavingDraft: saveDraftMutation.isPending,
    publishForm: publishMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdatingSettings: updateSettingsMutation.isPending,
    updateQuizSettings: updateQuizSettingsMutation.mutateAsync,
    isUpdatingQuizSettings: updateQuizSettingsMutation.isPending,
    addSection: addSectionMutation.mutateAsync,
    updateSection: updateSectionMutation.mutateAsync,
    deleteSection: deleteSectionMutation.mutateAsync,
    addField: addFieldMutation.mutateAsync,
    updateField: updateFieldMutation.mutateAsync,
    deleteField: deleteFieldMutation.mutateAsync,
  };
}
