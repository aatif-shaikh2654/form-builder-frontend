'use client';

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { formsService } from '../services/formsService';
import { ApiError } from '@/lib/api/types';
import type {
  FormResponse,
  SingleForm,
  CreateFormPayload,
  GenerateFormWithAIPayload,
  EditFormPayload,
  UpdateQuizSettingsPayload,
  AddSectionPayload,
  EditSectionPayload,
  AddFieldPayload,
  EditFieldPayload,
  SaveFormPayload,
  GetFormsParams,
  PaginatedFormsResponse,
  StatsResponse,
  FormType,
  FormStatus,
  SubmissionPayload,
  FormAnalyticsResponse,
  GetSubmissionsParams,
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

export const formDraftQueryKey = (id: string) => ['forms', 'draft', id] as const;
export const formPublishedQueryKey = (slug: string) => ['forms', 'published', slug] as const;

export type DeleteFormVariables =
  | string
  | { id: string; status?: FormStatus; form_type?: FormType };

const deletedFormIds = new Set<string>();

export function markFormAsDeleted(id: string | null | undefined) {
  if (id) deletedFormIds.add(id);
}

export function unmarkFormAsDeleted(id: string | null | undefined) {
  if (id) deletedFormIds.delete(id);
}

export function isFormDeleted(id: string | null | undefined): boolean {
  if (!id) return false;
  return deletedFormIds.has(id);
}

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
    queryClient.invalidateQueries({ queryKey: formDraftQueryKey(targetId) });
    queryClient.invalidateQueries({ queryKey: ['forms', 'published'] });
    try {
      const freshForm = await formsService.getSingleForm(targetId);
      queryClient.setQueryData(formDetailQueryKey(targetId), freshForm);
      // ONLY sync from server if the builder is clean (NOT dirty with unsaved changes)
      const store = useBuilderStore.getState();
      if (!store.isDirty) {
        store.syncFormFromServer(freshForm);
      }
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
    enabled: Boolean(formId) && !isFormDeleted(formId),
    retry: (failureCount, error: unknown) => {
      // Do not retry 404 Not Found errors - fail fast
      if (
        (error instanceof ApiError && error.statusCode === 404) ||
        (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) ||
        (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404) ||
        (error && typeof error === 'object' && 'response' in error && (error as { response?: { status?: number } }).response?.status === 404)
      ) {
        return false;
      }
      return failureCount < 2;
    },
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
 * useGenerateFormWithAIMutation - POST /api/v1/ai/generate-form
 * Generates a full form structure from a natural language prompt and caches the result
 */
export function useGenerateFormWithAIMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateFormWithAIPayload) =>
      formsService.generateFormWithAI(payload),
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
    onError: (error) => {
      // PRESERVE STATE: Do not reset or wipe local state on edit failure
      console.warn('Edit form failed, preserving local builder state:', error);
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
      if (id) {
        queryClient.invalidateQueries({ queryKey: formDraftQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: ['forms', 'published'] });
      }
      if (savedForm) {
        queryClient.setQueryData(formDetailQueryKey(id || savedForm.id), savedForm);
        useBuilderStore.getState().syncFormFromServer(savedForm);
      }
    },
    onError: (error) => {
      // KEEP CURRENT STATE: Do not reset or re-sync anything from the server on failure
      console.warn('Save draft failed, preserving local builder state:', error);
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
    onError: (error) => {
      // PRESERVE STATE: Do not reset or wipe local state on publish failure
      console.warn('Publish form failed, preserving local builder state:', error);
    },
  });
}

/**
 * useDraftFormQuery - GET /api/v1/form/{form_id}/get-draft
 * Fetches latest draft version of the form from form versioning
 */
export function useDraftFormQuery(formId: string | null) {
  return useQuery({
    queryKey: formDraftQueryKey(formId || ''),
    queryFn: () => formsService.getDraft(formId!),
    enabled: Boolean(formId) && !isFormDeleted(formId),
    staleTime: FORMS_STALE_TIME,
    gcTime: FORMS_GC_TIME,
  });
}

/**
 * usePublishedFormQuery - GET /api/v1/form/{slug}/form
 * Fetches published form version by public slug
 */
export function usePublishedFormQuery(slug: string | null) {
  return useQuery({
    queryKey: formPublishedQueryKey(slug || ''),
    queryFn: () => formsService.getPublishedForm(slug!),
    enabled: Boolean(slug),
    staleTime: FORMS_STALE_TIME,
    gcTime: FORMS_GC_TIME,
  });
}

/**
 * useSubmitFormMutation - POST /api/v1/form/{form_id}/submit
 * Submits respondent responses for a live form
 */
export function useSubmitFormMutation(formId?: string | null) {
  return useMutation({
    mutationFn: ({
      formId: targetId,
      payload,
    }: {
      formId?: string;
      payload: SubmissionPayload;
    }) => {
      const activeId = targetId || formId;
      if (!activeId) {
        throw new Error('Form ID is required for submission');
      }
      return formsService.submitForm(activeId, payload);
    },
    onError: (error) => {
      // PRESERVE RESPONSES: Do not clear or reset respondent answers on submission failure
      console.warn('Form submission failed, preserving respondent responses:', error);
    },
  });
}

export const formSubmissionsQueryKey = (id: string, params?: GetSubmissionsParams) =>
  params
    ? (['forms', 'analytics', 'submits', id, params] as const)
    : (['forms', 'analytics', 'submits', id] as const);

/**
 * useFormSubmissionsQuery - GET /api/v1/analytics/{form_id}/submits
 * Fetches submission responses for a form with page, limit, and search query params
 */
export function useFormSubmissionsQuery(
  formId?: string | null,
  params?: GetSubmissionsParams
) {
  return useQuery<FormAnalyticsResponse>({
    queryKey: formId ? formSubmissionsQueryKey(formId, params) : ['forms', 'analytics', 'submits', params],
    queryFn: () => formsService.getFormSubmissions(formId!, params),
    enabled: Boolean(formId) && !isFormDeleted(formId),
    staleTime: 1000 * 30,
  });
}

/**
 * useDeleteFormMutation - DELETE /api/v1/form/{form_id}
 * Deletes form using TanStack useMutation. ONLY removes from UI if the API succeeds!
 * If the API gives an error, the form is preserved in the UI completely intact.
 * When succeeded, client-side query caches and workspace statistics (total_forms, published, drafts, quizes)
 * are immediately decremented without making a redundant API call.
 */
export function useDeleteFormMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: DeleteFormVariables) => {
      const formId = typeof variables === 'string' ? variables : variables.id;
      const ok = await formsService.deleteForm(formId);
      if (!ok) {
        throw new Error('Failed to delete form');
      }
      return ok;
    },
    onSuccess: (isSuccess, variables) => {
      // Only remove from UI if the API actually succeeded
      if (!isSuccess) return;

      const formId = typeof variables === 'string' ? variables : variables.id;
      let formStatus: FormStatus | undefined =
        typeof variables === 'object' ? variables.status : undefined;
      let formType: FormType | undefined =
        typeof variables === 'object' ? variables.form_type : undefined;

      // 1. Detect the form's status and form_type before cache eviction
      if (!formStatus || !formType) {
        const singleCached = queryClient.getQueryData<SingleForm | FormResponse>(
          formDetailQueryKey(formId)
        );
        if (singleCached) {
          if (!formStatus) formStatus = singleCached.status;
          if (!formType) formType = singleCached.form_type;
        }
      }

      const builderState = useBuilderStore.getState();
      if ((!formStatus || !formType) && builderState.formId === formId) {
        if (!formStatus) formStatus = builderState.status;
        if (!formType) formType = builderState.formType;
      }

      if (!formStatus || !formType) {
        const cachedQueries = queryClient.getQueriesData<
          InfiniteData<PaginatedFormsResponse> | PaginatedFormsResponse | FormResponse[]
        >({ queryKey: FORMS_QUERY_KEY });

        for (const [, cacheData] of cachedQueries) {
          if (!cacheData) continue;
          if ('pages' in cacheData && Array.isArray(cacheData.pages)) {
            for (const page of cacheData.pages) {
              const match = page.items?.find((item) => item.id === formId);
              if (match) {
                if (!formStatus) formStatus = match.status;
                if (!formType) formType = match.form_type;
                break;
              }
            }
          } else if ('items' in cacheData && Array.isArray(cacheData.items)) {
            const match = cacheData.items.find((item) => item.id === formId);
            if (match) {
              if (!formStatus) formStatus = match.status;
              if (!formType) formType = match.form_type;
              break;
            }
          } else if (Array.isArray(cacheData)) {
            const match = cacheData.find((item) => item.id === formId);
            if (match) {
              if (!formStatus) formStatus = match.status;
              if (!formType) formType = match.form_type;
              break;
            }
          }
          if (formStatus && formType) break;
        }
      }

      markFormAsDeleted(formId);

      // If builder store holds this form, reset it now
      if (builderState.formId === formId) {
        builderState.resetBuilder();
      }

      // Remove cached queries for this form detail
      queryClient.removeQueries({
        predicate: (query) => query.queryKey.some((k) => k === formId),
      });

      // Update standard flat query cache if present
      const previousForms = queryClient.getQueryData<FormResponse[]>(FORMS_QUERY_KEY);
      if (previousForms) {
        queryClient.setQueryData<FormResponse[]>(
          FORMS_QUERY_KEY,
          previousForms.filter((f) => f.id !== formId)
        );
      }

      // Helper to update global workspace stats object
      const updateStats = (currentStats?: StatsResponse | null): StatsResponse | null | undefined => {
        if (!currentStats) return currentStats;
        return {
          ...currentStats,
          total_forms:
            typeof currentStats.total_forms === 'number'
              ? Math.max(0, currentStats.total_forms - 1)
              : currentStats.total_forms,
          published:
            formStatus === 'PUBLISHED' && typeof currentStats.published === 'number'
              ? Math.max(0, currentStats.published - 1)
              : currentStats.published,
          drafts:
            formStatus === 'DRAFT' && typeof currentStats.drafts === 'number'
              ? Math.max(0, currentStats.drafts - 1)
              : currentStats.drafts,
          quizes:
            formType === 'QUIZ' && typeof currentStats.quizes === 'number'
              ? Math.max(0, currentStats.quizes - 1)
              : currentStats.quizes,
        };
      };

      // Update active infinite and paginated query caches
      queryClient.setQueriesData<
        InfiniteData<PaginatedFormsResponse> | PaginatedFormsResponse | FormResponse[]
      >(
        { queryKey: FORMS_QUERY_KEY },
        (oldData) => {
          if (!oldData) return oldData;

          // Infinite data structure: { pages: PaginatedFormsResponse[], pageParams: ... }
          if ('pages' in oldData && Array.isArray(oldData.pages)) {
            const queryHadItem = oldData.pages.some((page) =>
              Array.isArray(page.items) && page.items.some((f) => f.id === formId)
            );

            return {
              ...oldData,
              pages: oldData.pages.map((p) => {
                const updatedItems = Array.isArray(p.items)
                  ? p.items.filter((f) => f.id !== formId)
                  : [];
                const updatedStats = updateStats(p.stats);
                const newTotal =
                  queryHadItem && typeof p.total === 'number'
                    ? Math.max(0, p.total - 1)
                    : p.total;
                const newTotalPages =
                  typeof p.limit === 'number' && p.limit > 0 && typeof newTotal === 'number'
                    ? Math.max(1, Math.ceil(newTotal / p.limit))
                    : p.total_pages;

                return {
                  ...p,
                  items: updatedItems,
                  stats: updatedStats,
                  total: newTotal,
                  total_pages: newTotalPages,
                };
              }),
            };
          }

          // Single paginated response structure: PaginatedFormsResponse
          if ('items' in oldData && Array.isArray(oldData.items)) {
            const hadItem = oldData.items.some((f) => f.id === formId);
            const updatedItems = oldData.items.filter((f) => f.id !== formId);
            const updatedStats = updateStats(oldData.stats);
            const newTotal =
              hadItem && typeof oldData.total === 'number'
                ? Math.max(0, oldData.total - 1)
                : oldData.total;
            const newTotalPages =
              typeof oldData.limit === 'number' && oldData.limit > 0 && typeof newTotal === 'number'
                ? Math.max(1, Math.ceil(newTotal / oldData.limit))
                : oldData.total_pages;

            return {
              ...oldData,
              items: updatedItems,
              stats: updatedStats,
              total: newTotal,
              total_pages: newTotalPages,
            };
          }

          // Flat list
          if (Array.isArray(oldData)) {
            return oldData.filter((f) => f.id !== formId);
          }

          return oldData;
        }
      );

      toast.success('Form deleted');
    },
    onError: (error, variables) => {
      const formId = typeof variables === 'string' ? variables : variables.id;
      // PRESERVE STATE ON ERROR: Do NOT remove from UI or mark as deleted if API failed!
      unmarkFormAsDeleted(formId);
      console.warn(`Delete form ${formId} failed, preserving in UI:`, error);
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
    onError: (error) => {
      // PRESERVE STATE: Do not reset or wipe local state on quiz settings failure
      console.warn('Quiz settings update failed, preserving local builder state:', error);
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
    onError: (error) => {
      // PRESERVE STATE: Do not reset or wipe local state on section add failure
      console.warn('Section add failed, preserving local builder state:', error);
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
    onError: (error) => {
      // PRESERVE STATE: Do not reset or wipe local state on section update failure
      console.warn('Section update failed, preserving local builder state:', error);
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
    onError: (error) => {
      // PRESERVE STATE: Do not reset or wipe local state on section delete failure
      console.warn('Section delete failed, preserving local builder state:', error);
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
    onError: (error) => {
      // PRESERVE STATE: Do not reset or wipe local state on field add failure
      console.warn('Field add failed, preserving local builder state:', error);
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
    onError: (error) => {
      // PRESERVE STATE: Do not reset or wipe local state on field update failure
      console.warn('Field update failed, preserving local builder state:', error);
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
    onError: (error) => {
      // PRESERVE STATE: Do not reset or wipe local state on field delete failure
      console.warn('Field delete failed, preserving local builder state:', error);
    },
  });
}

/**
 * Unified hook to manage forms collection with infinite scroll pagination and 5-minute stale time
 */
export function useForms(params?: GetFormsParams) {
  const infiniteQuery = useInfiniteFormsQuery(params);
  const createFormMutation = useCreateFormMutation();
  const generateFormWithAIMutation = useGenerateFormWithAIMutation();
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
    generateFormWithAI: generateFormWithAIMutation.mutateAsync,
    isGeneratingAI: generateFormWithAIMutation.isPending,
    editForm: editFormMutation.mutateAsync,
    isEditing: editFormMutation.isPending,
    deleteForm: deleteFormMutation.mutateAsync,
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
  const editFormMutation = useEditFormMutation();
  const updateQuizSettingsMutation = useUpdateQuizSettingsMutation(formId);
  const addSectionMutation = useAddSectionMutation(formId);
  const updateSectionMutation = useUpdateSectionMutation(formId);
  const deleteSectionMutation = useDeleteSectionMutation(formId);
  const addFieldMutation = useAddFieldMutation(formId);
  const updateFieldMutation = useUpdateFieldMutation(formId);
  const deleteFieldMutation = useDeleteFieldMutation(formId);
  const submitMutation = useSubmitFormMutation(formId);

  return {
    form: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveDraft: saveDraftMutation.mutateAsync,
    isSavingDraft: saveDraftMutation.isPending,
    publishForm: publishMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    submitForm: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    editForm: editFormMutation.mutateAsync,
    isEditing: editFormMutation.isPending,
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
