import { create } from 'zustand';
import type {
  FormType,
  FormStatus,
  FieldsResponse,
  SectionResponse,
  FormSettingsResponse,
  QuizSettingsResponse,
  SingleForm,
} from '@/types/api.types';
import {
  DEFAULT_FORM_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
} from '../constants/builder.constants';

export type BuilderActiveTab = 'canvas' | 'settings' | 'quiz' | 'preview';

interface BuilderState {
  // Current Form Data
  formId: string | null;
  title: string;
  description: string;
  initialTitle: string;
  initialDescription: string;
  isTitleEdited: boolean;
  isDescriptionEdited: boolean;
  formType: FormType;
  status: FormStatus;
  slug: string | null;

  // Children Entities
  sections: SectionResponse[];
  fields: FieldsResponse[];
  formSettings: Partial<FormSettingsResponse>;
  quizSettings: Partial<QuizSettingsResponse>;

  // Selection & UI State
  selectedFieldId: string | null;
  selectedSectionId: string | null;
  editingSectionId: string | null;
  activeBuilderTab: BuilderActiveTab;
  activeDrawer: 'settings' | 'quiz' | null;
  isDirty: boolean;

  // Actions
  initNewForm: (type?: FormType) => void;
  loadForm: (form: SingleForm) => void;
  syncFormFromServer: (form: SingleForm) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setFormType: (type: FormType) => void;
  setStatus: (status: FormStatus) => void;
  setActiveBuilderTab: (tab: BuilderActiveTab) => void;
  setActiveDrawer: (drawer: 'settings' | 'quiz' | null) => void;
  setSelectedFieldId: (id: string | null) => void;
  setSelectedSectionId: (id: string | null) => void;
  setEditingSectionId: (id: string | null) => void;

  // Field Actions
  addField: (field: FieldsResponse, insertIndex?: number) => void;
  updateField: (fieldId: string, updates: Partial<FieldsResponse>) => void;
  removeField: (fieldId: string) => void;
  clearFields: () => void;
  reorderFields: (activeId: string, overId: string) => void;

  // Section & Root Actions
  addSection: (section: SectionResponse, insertIndex?: number) => void;
  updateSection: (sectionId: string, updates: Partial<SectionResponse>) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (activeId: string, overId: string) => void;
  reorderRootItems: (activeId: string, overId: string) => void;
  moveFieldToSection: (fieldId: string, sectionId: string | null, targetIndex?: number) => void;

  // Settings Actions
  updateFormSettings: (settings: Partial<FormSettingsResponse>) => void;
  updateQuizSettings: (settings: Partial<QuizSettingsResponse>) => void;
  resetBuilder: () => void;
  setIsDirty: (dirty: boolean) => void;
  markSaved: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  formId: null,
  title: 'Untitled Form',
  description: '',
  initialTitle: 'Untitled Form',
  initialDescription: '',
  isTitleEdited: false,
  isDescriptionEdited: false,
  formType: 'FORM',
  status: 'DRAFT',
  slug: null,

  sections: [],
  fields: [],
  formSettings: DEFAULT_FORM_SETTINGS,
  quizSettings: DEFAULT_QUIZ_SETTINGS,

  selectedFieldId: null,
  selectedSectionId: null,
  editingSectionId: null,
  activeBuilderTab: 'canvas',
  activeDrawer: null,
  isDirty: false,

  initNewForm: (type = 'FORM') => {
    set({
      formId: null,
      title: 'Untitled Form',
      description: '',
      initialTitle: 'Untitled Form',
      initialDescription: '',
      isTitleEdited: false,
      isDescriptionEdited: false,
      formType: type,
      status: 'DRAFT',
      slug: null,
      sections: [],
      fields: [],
      formSettings: DEFAULT_FORM_SETTINGS,
      quizSettings: DEFAULT_QUIZ_SETTINGS,
      selectedFieldId: null,
      selectedSectionId: null,
      editingSectionId: null,
      activeBuilderTab: 'canvas',
      activeDrawer: null,
      isDirty: false,
    });
  },

  loadForm: (form) => {
    const normalizeField = (f: FieldsResponse, defaultFormId: string | null, sectionId: string | null) => {
      const values =
        Array.isArray(f.values) && f.values.length > 0
          ? f.values
          : Array.isArray(f.settings?.options) && (f.settings.options as string[]).length > 0
          ? (f.settings.options as string[])
          : null;

      const settings = {
        ...(f.settings || {}),
        ...(values ? { options: values } : {}),
      };

      return {
        ...f,
        form_id: sectionId ? null : (f.form_id || defaultFormId),
        section_id: sectionId,
        values,
        settings,
      };
    };

    const formFields = (form.fields || []).map((f) =>
      normalizeField(f, form.id, f.section_id || null)
    );
    const secFields = (form.sections || []).flatMap((sec) =>
      (sec.fields || []).map((f) => normalizeField(f, null, sec.id))
    );
    const fieldMap = new Map<string, FieldsResponse>();
    for (const f of formFields) fieldMap.set(f.id, f);
    for (const f of secFields) fieldMap.set(f.id, f);
    const allFields = Array.from(fieldMap.values());

    set({
      formId: form.id,
      title: form.title,
      description: form.description || '',
      initialTitle: form.title,
      initialDescription: form.description || '',
      isTitleEdited: false,
      isDescriptionEdited: false,
      formType: form.form_type,
      status: form.status,
      slug: form.slug,
      sections: (form.sections || []).map((sec) => ({
        ...sec,
        layout_type: sec.layout_type || 'SINGLE_COLUMN',
        column_count: sec.column_count ?? 1,
        layout_config: sec.layout_config || {},
        is_visible: sec.is_visible !== undefined ? sec.is_visible : true,
      })),
      fields: allFields,
      formSettings: form.form_settings || DEFAULT_FORM_SETTINGS,
      quizSettings: form.quiz_settings || DEFAULT_QUIZ_SETTINGS,
      selectedFieldId: null,
      selectedSectionId: null,
      editingSectionId: null,
      activeDrawer: null,
      isDirty: false,
    });
  },

  syncFormFromServer: (formInput) => {
    set((state) => {
      if (!formInput || typeof formInput !== 'object') return state;

      // Unpack in case of nested data wrapper
      const form =
        'data' in formInput && formInput.data && typeof formInput.data === 'object'
          ? (formInput.data as SingleForm)
          : (formInput as SingleForm);

      if (state.formId && form.id && form.id !== state.formId) return state;

      const normalizeField = (f: FieldsResponse, defaultFormId: string | null, sectionId: string | null) => {
        const values =
          Array.isArray(f.values) && f.values.length > 0
            ? f.values
            : Array.isArray(f.settings?.options) && (f.settings.options as string[]).length > 0
            ? (f.settings.options as string[])
            : null;

        const settings = {
          ...(f.settings || {}),
          ...(values ? { options: values } : {}),
        };

        return {
          ...f,
          form_id: sectionId ? null : (f.form_id || defaultFormId),
          section_id: sectionId,
          values,
          settings,
        };
      };

      const rawServerSections = Array.isArray(form.sections) ? form.sections : [];
      const rawServerFormFields = (Array.isArray(form.fields) ? form.fields : []).map((f) =>
        normalizeField(f, form.id, f.section_id || null)
      );
      const rawServerSecFields = rawServerSections.flatMap((sec) =>
        (Array.isArray(sec.fields) ? sec.fields : []).map((f) =>
          normalizeField(f, null, sec.id)
        )
      );
      const fieldMap = new Map<string, FieldsResponse>();
      for (const f of rawServerFormFields) fieldMap.set(f.id, f);
      for (const f of rawServerSecFields) fieldMap.set(f.id, f);
      const rawCombinedServerFields = Array.from(fieldMap.values());

      // Preserve current user data: if server returns empty list but user added items in local state, NEVER reset!
      const serverFields = rawCombinedServerFields.length > 0 ? rawCombinedServerFields : state.fields;

      const serverSections =
        rawServerSections.length > 0
          ? rawServerSections.map((sec) => ({
              ...sec,
              layout_type: sec.layout_type || 'SINGLE_COLUMN',
              column_count: sec.column_count ?? 1,
              layout_config: sec.layout_config || {},
              is_visible: sec.is_visible !== undefined ? sec.is_visible : true,
            }))
          : state.sections;

      // Retain active field if still present, or transition from optimistic ID
      let newSelectedFieldId = state.selectedFieldId;
      if (newSelectedFieldId && !serverFields.some((f) => f.id === newSelectedFieldId)) {
        const oldField = state.fields.find((f) => f.id === newSelectedFieldId);
        const matchedField = oldField
          ? serverFields.find(
              (sf) => sf.position === oldField.position || sf.label === oldField.label
            )
          : null;
        newSelectedFieldId = matchedField ? matchedField.id : null;
      }

      // Retain active section if still present, or transition from optimistic ID
      let newSelectedSectionId = state.selectedSectionId;
      if (newSelectedSectionId && !serverSections.some((s) => s.id === newSelectedSectionId)) {
        const oldSec = state.sections.find((s) => s.id === newSelectedSectionId);
        const matchedSec = oldSec
          ? serverSections.find(
              (ss) => ss.position === oldSec.position || ss.title === oldSec.title
            )
          : null;
        newSelectedSectionId = matchedSec ? matchedSec.id : null;
      }

      return {
        formId: form.id || state.formId,
        title: form.title || state.title,
        description: form.description !== undefined && form.description !== null ? form.description : state.description,
        initialTitle: form.title || state.title,
        initialDescription: form.description !== undefined && form.description !== null ? form.description : state.description,
        isTitleEdited: false,
        isDescriptionEdited: false,
        formType: form.form_type || state.formType,
        status: form.status || state.status,
        slug: form.slug || state.slug,
        sections: serverSections,
        fields: serverFields,
        formSettings: form.form_settings || state.formSettings,
        quizSettings: form.quiz_settings || state.quizSettings,
        selectedFieldId: newSelectedFieldId,
        selectedSectionId: newSelectedSectionId,
        activeDrawer: state.activeDrawer,
        activeBuilderTab: state.activeBuilderTab,
        isDirty: false,
      };
    });
  },

  setTitle: (title) =>
    set((state) => ({
      title,
      isTitleEdited: title !== state.initialTitle,
      isDirty: true,
    })),
  setDescription: (description) =>
    set((state) => ({
      description,
      isDescriptionEdited: description !== state.initialDescription,
      isDirty: true,
    })),
  setFormType: (formType) =>
    set((state) => ({
      formType,
      activeDrawer: formType !== 'QUIZ' && state.activeDrawer === 'quiz' ? null : state.activeDrawer,
      isDirty: true,
    })),
  setStatus: (status) => set({ status, isDirty: true }),
  setActiveBuilderTab: (activeBuilderTab) => set({ activeBuilderTab }),
  setActiveDrawer: (activeDrawer) => set({ activeDrawer }),
  setSelectedFieldId: (selectedFieldId) => set({ selectedFieldId }),
  setSelectedSectionId: (selectedSectionId) => set({ selectedSectionId }),
  setEditingSectionId: (editingSectionId) => set({ editingSectionId }),

  addField: (field, insertIndex) => {
    set((state) => {
      const targetSectionId =
        field.section_id !== undefined ? field.section_id : state.selectedSectionId;

      if (targetSectionId) {
        // Adding inside a section
        const sectionFields = state.fields
          .filter((f) => f.section_id === targetSectionId)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const targetPos = insertIndex !== undefined ? insertIndex : sectionFields.length;
        const newField: FieldsResponse = {
          ...field,
          section_id: targetSectionId,
          form_id: null,
          position: targetPos,
        };
        const nextSecFields = [...sectionFields];
        nextSecFields.splice(targetPos, 0, newField);
        const otherFields = state.fields.filter((f) => f.section_id !== targetSectionId);
        const updatedSecFields = nextSecFields.map((f, idx) => ({ ...f, position: idx }));

        return {
          fields: [...otherFields, ...updatedSecFields],
          selectedFieldId: null,
          isDirty: true,
        };
      }

      // Adding to form root
      const rootFields = state.fields.filter(
        (f) => !f.section_id || !state.sections.some((s) => s.id === f.section_id)
      );
      const rootItems = [
        ...state.sections.map((s) => ({ type: 'section' as const, id: s.id, position: s.position ?? 0 })),
        ...rootFields.map((f) => ({ type: 'field' as const, id: f.id, position: f.position ?? 0 })),
      ].sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        if (a.type !== b.type) return a.type === 'section' ? -1 : 1;
        return 0;
      });

      const newFieldId = field.id;
      const targetPos = insertIndex !== undefined ? insertIndex : rootItems.length;

      const newField: FieldsResponse = {
        ...field,
        section_id: null,
        form_id: field.form_id || state.formId,
        position: targetPos,
      };

      if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= rootItems.length) {
        const nextRootItems = [
          ...rootItems.slice(0, insertIndex),
          { type: 'field' as const, id: newFieldId, position: insertIndex },
          ...rootItems.slice(insertIndex),
        ];
        const posMap = new Map<string, number>();
        nextRootItems.forEach((item, idx) => posMap.set(item.id, idx));

        const updatedSections = state.sections.map((s) => ({
          ...s,
          position: posMap.has(s.id) ? posMap.get(s.id)! : s.position,
        }));

        const updatedFields = [
          ...state.fields.map((f) => {
            if (!f.section_id || !state.sections.some((s) => s.id === f.section_id)) {
              return {
                ...f,
                position: posMap.has(f.id) ? posMap.get(f.id)! : f.position,
              };
            }
            return f;
          }),
          {
            ...newField,
            position: posMap.get(newFieldId) ?? targetPos,
          },
        ];

        return {
          sections: updatedSections,
          fields: updatedFields,
          selectedFieldId: null,
          isDirty: true,
        };
      }

      return {
        fields: [...state.fields, { ...newField, position: rootItems.length }],
        selectedFieldId: null,
        isDirty: true,
      };
    });
  },

  updateField: (fieldId, updates) => {
    set((state) => ({
      fields: state.fields.map((f) => {
        if (f.id !== fieldId) return f;
        const newSectionId =
          updates.section_id !== undefined ? updates.section_id : f.section_id;
        const newFormId =
          updates.form_id !== undefined
            ? updates.form_id
            : newSectionId
            ? null
            : (f.form_id || state.formId);
        return {
          ...f,
          ...updates,
          section_id: newSectionId || null,
          form_id: newSectionId ? null : newFormId,
          updated_at: new Date().toISOString(),
        };
      }),
      isDirty: true,
    }));
  },

  removeField: (fieldId) => {
    set((state) => ({
      fields: state.fields.filter((f) => f.id !== fieldId),
      selectedFieldId: state.selectedFieldId === fieldId ? null : state.selectedFieldId,
      isDirty: true,
    }));
  },

  clearFields: () => {
    set({
      fields: [],
      selectedFieldId: null,
      isDirty: true,
    });
  },

  reorderFields: (activeId, overId) => {
    set((state) => {
      const activeField = state.fields.find((f) => f.id === activeId);
      const overField = state.fields.find((f) => f.id === overId);
      if (!activeField || !overField) return state;

      // If both are root fields: reorder within root items
      const isBothRoot =
        (!activeField.section_id || !state.sections.some((s) => s.id === activeField.section_id)) &&
        (!overField.section_id || !state.sections.some((s) => s.id === overField.section_id));

      if (isBothRoot) {
        const rootFields = state.fields.filter(
          (f) => !f.section_id || !state.sections.some((s) => s.id === f.section_id)
        );
        const rootItems = [
          ...state.sections.map((s) => ({ type: 'section' as const, id: s.id, position: s.position ?? 0 })),
          ...rootFields.map((f) => ({ type: 'field' as const, id: f.id, position: f.position ?? 0 })),
        ].sort((a, b) => {
          if (a.position !== b.position) return a.position - b.position;
          if (a.type !== b.type) return a.type === 'section' ? -1 : 1;
          return 0;
        });

        const oldIndex = rootItems.findIndex((i) => i.id === activeId);
        const newIndex = rootItems.findIndex((i) => i.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return state;

        const nextRootItems = [...rootItems];
        const [moved] = nextRootItems.splice(oldIndex, 1);
        nextRootItems.splice(newIndex, 0, moved);

        const posMap = new Map<string, number>();
        nextRootItems.forEach((item, idx) => posMap.set(item.id, idx));

        return {
          sections: state.sections.map((s) => ({
            ...s,
            position: posMap.has(s.id) ? posMap.get(s.id)! : s.position,
          })),
          fields: state.fields.map((f) => {
            if (!f.section_id || !state.sections.some((s) => s.id === f.section_id)) {
              return {
                ...f,
                position: posMap.has(f.id) ? posMap.get(f.id)! : f.position,
              };
            }
            return f;
          }),
          isDirty: true,
        };
      }

      // If both are in the SAME section:
      if (activeField.section_id && activeField.section_id === overField.section_id) {
        const secId = activeField.section_id;
        const secFields = state.fields
          .filter((f) => f.section_id === secId)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        const oldIndex = secFields.findIndex((f) => f.id === activeId);
        const newIndex = secFields.findIndex((f) => f.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return state;

        const nextSecFields = [...secFields];
        const [moved] = nextSecFields.splice(oldIndex, 1);
        nextSecFields.splice(newIndex, 0, moved);

        const updatedSecFields = nextSecFields.map((f, idx) => ({
          ...f,
          position: idx,
        }));
        const otherFields = state.fields.filter((f) => f.section_id !== secId);

        return {
          fields: [...otherFields, ...updatedSecFields],
          isDirty: true,
        };
      }

      return state;
    });
  },

  addSection: (section, insertIndex) => {
    set((state) => {
      const rootFields = state.fields.filter(
        (f) => !f.section_id || !state.sections.some((s) => s.id === f.section_id)
      );
      const rootItems = [
        ...state.sections.map((s) => ({ type: 'section' as const, id: s.id, position: s.position ?? 0 })),
        ...rootFields.map((f) => ({ type: 'field' as const, id: f.id, position: f.position ?? 0 })),
      ].sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        if (a.type !== b.type) return a.type === 'section' ? -1 : 1;
        return 0;
      });

      const targetPos = insertIndex !== undefined ? insertIndex : rootItems.length;
      const newSection: SectionResponse = {
        layout_type: 'SINGLE_COLUMN',
        column_count: 1,
        layout_config: {},
        is_visible: true,
        ...section,
        position: targetPos,
      };

      if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= rootItems.length) {
        const nextRootItems = [
          ...rootItems.slice(0, insertIndex),
          { type: 'section' as const, id: newSection.id, position: insertIndex },
          ...rootItems.slice(insertIndex),
        ];
        const posMap = new Map<string, number>();
        nextRootItems.forEach((item, idx) => posMap.set(item.id, idx));

        const updatedSections = [
          ...state.sections.map((s) => ({
            ...s,
            position: posMap.has(s.id) ? posMap.get(s.id)! : s.position,
          })),
          { ...newSection, position: posMap.get(newSection.id) ?? targetPos },
        ];

        const updatedFields = state.fields.map((f) => {
          if (!f.section_id || !state.sections.some((s) => s.id === f.section_id)) {
            return {
              ...f,
              position: posMap.has(f.id) ? posMap.get(f.id)! : f.position,
            };
          }
          return f;
        });

        return {
          sections: updatedSections,
          fields: updatedFields,
          selectedSectionId: newSection.id,
          isDirty: true,
        };
      }

      return {
        sections: [...state.sections, newSection],
        selectedSectionId: newSection.id,
        isDirty: true,
      };
    });
  },

  updateSection: (sectionId, updates) => {
    set((state) => ({
      sections: state.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
      isDirty: true,
    }));
  },

  removeSection: (sectionId) => {
    set((state) => ({
      sections: state.sections.filter((s) => s.id !== sectionId),
      fields: state.fields.map((f) =>
        f.section_id === sectionId
          ? { ...f, section_id: null, form_id: state.formId, updated_at: new Date().toISOString() }
          : f
      ),
      selectedSectionId: state.selectedSectionId === sectionId ? null : state.selectedSectionId,
      editingSectionId: state.editingSectionId === sectionId ? null : state.editingSectionId,
      isDirty: true,
    }));
  },

  reorderSections: (activeId, overId) => {
    useBuilderStore.getState().reorderRootItems(activeId, overId);
  },

  reorderRootItems: (activeId, overId) => {
    set((state) => {
      const activeField = state.fields.find((f) => f.id === activeId);
      const activeSection = state.sections.find((s) => s.id === activeId);
      if (!activeField && !activeSection) return state;

      const rootFields = state.fields.filter(
        (f) => !f.section_id || !state.sections.some((s) => s.id === f.section_id)
      );

      const isDetachingFromSection = !!(activeField && activeField.section_id !== null);

      const currentRootItems: Array<{ type: 'section' | 'field'; id: string; position: number }> = [
        ...state.sections.map((s) => ({
          type: 'section' as const,
          id: s.id,
          position: s.position ?? 0,
        })),
        ...rootFields.map((f) => ({
          type: 'field' as const,
          id: f.id,
          position: f.position ?? 0,
        })),
      ].sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        if (a.type !== b.type) return a.type === 'section' ? -1 : 1;
        return 0;
      });

      let oldIndex = currentRootItems.findIndex((i) => i.id === activeId);
      if (oldIndex === -1 && isDetachingFromSection) {
        currentRootItems.push({
          type: 'field',
          id: activeId,
          position: currentRootItems.length,
        });
        oldIndex = currentRootItems.length - 1;
      }

      const newIndex = currentRootItems.findIndex((i) => i.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return state;

      const nextRootItems = [...currentRootItems];
      const [moved] = nextRootItems.splice(oldIndex, 1);
      nextRootItems.splice(newIndex, 0, moved);

      const posMap = new Map<string, number>();
      nextRootItems.forEach((item, idx) => posMap.set(item.id, idx));

      const updatedSections = state.sections
        .map((s) => ({
          ...s,
          position: posMap.has(s.id) ? posMap.get(s.id)! : s.position,
        }))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      const updatedFields = state.fields.map((f) => {
        if (f.id === activeId && isDetachingFromSection) {
          return {
            ...f,
            section_id: null,
            form_id: state.formId,
            position: posMap.get(f.id) ?? 0,
            updated_at: new Date().toISOString(),
          };
        }
        if (!f.section_id || !state.sections.some((s) => s.id === f.section_id)) {
          return {
            ...f,
            position: posMap.has(f.id) ? posMap.get(f.id)! : f.position,
          };
        }
        return f;
      });

      return {
        sections: updatedSections,
        fields: updatedFields,
        isDirty: true,
      };
    });
  },

  moveFieldToSection: (fieldId, sectionId, targetIndex) => {
    set((state) => {
      const field = state.fields.find((f) => f.id === fieldId);
      if (!field) return state;

      let nextFields = state.fields.map((f) => {
        if (f.id !== fieldId) return f;
        return {
          ...f,
          section_id: sectionId || null,
          form_id: sectionId ? null : state.formId,
          updated_at: new Date().toISOString(),
        };
      });

      if (sectionId) {
        const secFields = nextFields
          .filter((f) => f.section_id === sectionId && f.id !== fieldId)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const insertAt = targetIndex !== undefined ? targetIndex : secFields.length;
        secFields.splice(insertAt, 0, { ...field, section_id: sectionId, form_id: null });
        const secPosMap = new Map<string, number>();
        secFields.forEach((f, idx) => secPosMap.set(f.id, idx));

        nextFields = nextFields.map((f) => {
          if (f.section_id === sectionId && secPosMap.has(f.id)) {
            return { ...f, position: secPosMap.get(f.id)! };
          }
          return f;
        });
      }

      // Re-index root items
      const rootFields = nextFields.filter(
        (f) => !f.section_id || !state.sections.some((s) => s.id === f.section_id)
      );
      const rootItems = [
        ...state.sections.map((s) => ({ type: 'section' as const, id: s.id, position: s.position ?? 0 })),
        ...rootFields.map((f) => ({ type: 'field' as const, id: f.id, position: f.position ?? 0 })),
      ].sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        if (a.type !== b.type) return a.type === 'section' ? -1 : 1;
        return 0;
      });

      const rootPosMap = new Map<string, number>();
      rootItems.forEach((item, idx) => rootPosMap.set(item.id, idx));

      const updatedSections = state.sections.map((s) => ({
        ...s,
        position: rootPosMap.has(s.id) ? rootPosMap.get(s.id)! : s.position,
      }));

      const updatedFields = nextFields.map((f) => {
        if (!f.section_id || !state.sections.some((s) => s.id === f.section_id)) {
          return {
            ...f,
            position: rootPosMap.has(f.id) ? rootPosMap.get(f.id)! : f.position,
          };
        }
        return f;
      });

      return {
        sections: updatedSections,
        fields: updatedFields,
        isDirty: true,
      };
    });
  },

  updateFormSettings: (settings) => {
    set((state) => ({
      formSettings: { ...state.formSettings, ...settings },
      isDirty: true,
    }));
  },

  updateQuizSettings: (settings) => {
    set((state) => ({
      quizSettings: { ...state.quizSettings, ...settings },
      isDirty: true,
    }));
  },

  resetBuilder: () => {
    set({
      formId: null,
      title: 'Untitled Form',
      description: '',
      initialTitle: 'Untitled Form',
      initialDescription: '',
      isTitleEdited: false,
      isDescriptionEdited: false,
      formType: 'FORM',
      status: 'DRAFT',
      slug: null,
      sections: [],
      fields: [],
      formSettings: DEFAULT_FORM_SETTINGS,
      quizSettings: DEFAULT_QUIZ_SETTINGS,
      selectedFieldId: null,
      selectedSectionId: null,
      editingSectionId: null,
      activeBuilderTab: 'canvas',
      isDirty: false,
    });
  },

  setIsDirty: (isDirty) => set({ isDirty }),
  markSaved: () =>
    set((state) => ({
      isDirty: false,
      initialTitle: state.title,
      initialDescription: state.description,
      isTitleEdited: false,
      isDescriptionEdited: false,
    })),
}));
