'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBuilderStore, type BuilderActiveTab } from '../store/builderStore';
import {
  useSingleForm,
  useCreateFormMutation,
  useDeleteFormMutation,
} from '@/features/forms/hooks/useForms';
import { formsService } from '@/features/forms/services/formsService';
import { useUser } from '@/context/UserContext';
import { FORM_STATUS_STYLES } from '@/features/forms/constants/forms.constants';
import { useConfirmationStore } from '@/store/useConfirmationStore';
import { validateFormSettings, validateQuizSettings } from '../utils/settingsValidation';
import { areFormSettingsEqual, areQuizSettingsEqual } from '../utils/settingsComparison';
import type { SaveFormPayload, FieldsResponse, FieldOptionItem } from '@/types/api.types';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Settings,
  Trophy,
  ExternalLink,
  Send,
  Loader2,
  ArrowLeft,
  RotateCcw,
  Save,
  Check,
  Share2,
  Table2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ShareLiveFormDialog } from './ShareLiveFormDialog';

export const BuilderToolbar: React.FC = () => {
  const router = useRouter();
  const {
    formId,
    title,
    description,
    formType,
    initialFormType,
    status,
    initialStatus,
    setStatus,
    slug,
    formSettings,
    initialFormSettings,
    isFormSettingsEdited,
    quizSettings,
    initialQuizSettings,
    isQuizSettingsEdited,
    activeBuilderTab,
    setActiveBuilderTab,
    activeDrawer,
    setActiveDrawer,
    fields,
    sections,
    clearFields,
    isDirty,
    markSaved,
    isTitleEdited,
    isDescriptionEdited,
    resetBuilder,
  } = useBuilderStore();

  const { mutateAsync: createForm } = useCreateFormMutation();
  const { mutateAsync: deleteFormApi, isPending: isDeletingForm } = useDeleteFormMutation();
  const {
    form,
    saveDraft,
    isSavingDraft,
    publishForm,
    isPublishing,
  } = useSingleForm(formId);

  // Directly check published_version and draft_version from form detail API
  const publishedVersion = form?.published_version ?? null;
  const draftVersion = form?.draft_version ?? null;

  const isVersionsSame = Boolean(
    status === 'PUBLISHED' &&
    publishedVersion !== null &&
    draftVersion !== null &&
    publishedVersion === draftVersion
  );

  const { isAuthenticated } = useUser();
  const confirm = useConfirmationStore((s) => s.confirm);
  const [isSaving, setIsSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Enabled if form is draft, or draft version ID differs from form version ID, or if there are unsaved local edits
  const isPublishDisabled =
    isSaving ||
    isPublishing ||
    (isVersionsSame && !isDirty);

  // Warn user on page refresh or tab close if they have unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const tabs: {
    id: BuilderActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    isActive: boolean;
  }[] = [
      {
        id: 'canvas',
        label: `Canvas (${fields.length})`,
        icon: Layers,
        onClick: () => {
          setActiveBuilderTab('canvas');
          setActiveDrawer(null);
        },
        isActive: activeDrawer === null && activeBuilderTab === 'canvas',
      },
      {
        id: 'submits',
        label: 'Submissions',
        icon: Table2,
        onClick: () => {
          setActiveBuilderTab('submits');
          setActiveDrawer(null);
        },
        isActive: activeDrawer === null && activeBuilderTab === 'submits',
      },
      {
        id: 'settings',
        label: 'Form Settings',
        icon: Settings,
        onClick: () => setActiveDrawer('settings'),
        isActive: activeDrawer === 'settings',
      },
      ...(formType === 'QUIZ'
        ? [
          {
            id: 'quiz' as const,
            label: 'Quiz Rules',
            icon: Trophy,
            onClick: () => setActiveDrawer('quiz'),
            isActive: activeDrawer === 'quiz',
          },
        ]
        : []),
    ];

  const handleSaveDraft = useCallback(async (): Promise<string | null> => {
    setIsSaving(true);
    try {
      // 1. Validate Form Settings & Identity
      const formSettingsValidation = validateFormSettings({
        title,
        submission_limit: formSettings.submission_limit,
        start_at: formSettings.start_at,
        end_at: formSettings.end_at,
        confirmation_message: formSettings.confirmation_message,
      });
      if (!formSettingsValidation.isValid) {
        const firstMsg = Object.values(formSettingsValidation.errors)[0];
        toast.error(`Form Settings: ${firstMsg}`);
        return null;
      }

      // 2. Validate Quiz Rules if QUIZ type
      if (formType === 'QUIZ') {
        const quizSettingsValidation = validateQuizSettings({
          time_limit: quizSettings.time_limit,
          passing_score: quizSettings.passing_score,
          total_attempts: quizSettings.total_attempts,
        });
        if (!quizSettingsValidation.isValid) {
          const firstMsg = Object.values(quizSettingsValidation.errors)[0];
          toast.error(`Quiz Rules: ${firstMsg}`);
          return null;
        }
      }

      let currentFormId = formId;

      if (!currentFormId) {
        // Create the form record first if local new form
        const created = await createForm({
          title: title || 'Untitled Form',
          description: description || null,
          form_type: formType,
        });
        if (created?.id) {
          currentFormId = created.id;
          useBuilderStore.setState({ formId: created.id });
        } else {
          throw new Error('Failed to create form record');
        }
      }

      // Persist form settings and form metadata into the base form record ONLY if changed
      const shouldUpdateFormSettings =
        isFormSettingsEdited ||
        isTitleEdited ||
        isDescriptionEdited ||
        formType !== initialFormType ||
        status !== initialStatus ||
        !areFormSettingsEqual(formSettings, initialFormSettings);

      if (shouldUpdateFormSettings) {
        const settingsPayload = {
          title: isTitleEdited ? (title.trim() || null) : (title || null),
          description: isDescriptionEdited ? (description.trim() || null) : (description || null),
          form_type: formType,
          status,
          confirmation_message: formSettings.confirmation_message ?? null,
          allow_multiple_submission: Boolean(formSettings.allow_multiple_submission ?? true),
          require_login: Boolean(formSettings.require_login ?? false),
          show_progress_bar: Boolean(formSettings.show_progress_bar ?? true),
          shuffle_questions: Boolean(formSettings.shuffle_questions ?? false),
          submission_limit:
            formSettings.submission_limit !== undefined && formSettings.submission_limit !== null
              ? Number(formSettings.submission_limit)
              : null,
          start_at: formSettings.start_at || null,
          end_at: formSettings.end_at || null,
        };

        await formsService.editForm(currentFormId, settingsPayload);
      }

      // If QUIZ, also persist quiz rules ONLY if changed
      const shouldUpdateQuizSettings =
        formType === 'QUIZ' &&
        (isQuizSettingsEdited || !areQuizSettingsEqual(quizSettings, initialQuizSettings));

      if (shouldUpdateQuizSettings) {
        await formsService.updateQuizSettings(currentFormId, {
          time_limit:
            quizSettings.time_limit !== undefined && quizSettings.time_limit !== null
              ? Number(quizSettings.time_limit)
              : null,
          passing_score: String(quizSettings.passing_score ?? '70'),
          total_attempts:
            quizSettings.total_attempts !== undefined && quizSettings.total_attempts !== null
              ? Number(quizSettings.total_attempts)
              : null,
          show_correct_answers: Boolean(quizSettings.show_correct_answers ?? true),
          show_score_after_submissions: Boolean(quizSettings.show_score_after_submissions ?? true),
        });
      }

      const formatFieldForPayload = (f: FieldsResponse, position: number, sectionId: string | null) => {
        const isChoiceField =
          f.field_type === 'DROPDOWN' ||
          f.field_type === 'CHECKBOX' ||
          f.field_type === 'SINGLE_CHOICE' ||
          f.field_type === 'MULTIPLE_CHOICE';

        const rawValues =
          Array.isArray(f.values) && f.values.length > 0
            ? f.values
            : Array.isArray(f.settings?.options) && (f.settings.options as string[]).length > 0
              ? (f.settings.options as string[])
              : null;

        const values: FieldOptionItem[] | null = isChoiceField
          ? (rawValues as FieldOptionItem[]) || []
          : null;

        const isMultiple =
          f.field_type === 'MULTIPLE_CHOICE'
            ? true
            : f.field_type === 'CHECKBOX'
            ? true
            : Boolean(f.is_multiple);

        const conditions = (Array.isArray(f.conditions) ? f.conditions : []).map((c) => ({
          id: c.id,
          target_field_id: c.target_field_id,
          condition_operator: c.condition_operator,
          condition_value: c.condition_value,
          action: c.action,
        }));

        return {
          ...f,
          form_id: sectionId ? null : currentFormId!,
          section_id: sectionId,
          position,
          values,
          conditions,
          settings: {
            ...(f.settings || {}),
            ...(values ? { options: values } : {}),
          },
          is_multiple: isMultiple,
        };
      };

      // Only pass fields that do NOT belong to any section in the top-level form fields array
      const rootOnlyFields = fields.filter(
        (f) => !f.section_id || !sections.some((s) => s.id === f.section_id)
      );

      const payload: SaveFormPayload = {
        title: isTitleEdited ? (title.trim() || null) : null,
        description: isDescriptionEdited ? (description.trim() || null) : null,
        form_settings: {
          confirmation_message: formSettings.confirmation_message ?? null,
          allow_multiple_submission: Boolean(formSettings.allow_multiple_submission ?? true),
          require_login: Boolean(formSettings.require_login ?? false),
          show_progress_bar: Boolean(formSettings.show_progress_bar ?? true),
          shuffle_questions: Boolean(formSettings.shuffle_questions ?? false),
          submission_limit:
            formSettings.submission_limit !== undefined && formSettings.submission_limit !== null
              ? Number(formSettings.submission_limit)
              : null,
          start_at: formSettings.start_at || null,
          end_at: formSettings.end_at || null,
        },
        quiz_settings:
          formType === 'QUIZ'
            ? {
                time_limit:
                  quizSettings.time_limit !== undefined && quizSettings.time_limit !== null
                    ? Number(quizSettings.time_limit)
                    : null,
                passing_score: String(quizSettings.passing_score ?? '70'),
                total_attempts:
                  quizSettings.total_attempts !== undefined && quizSettings.total_attempts !== null
                    ? Number(quizSettings.total_attempts)
                    : null,
                show_correct_answers: Boolean(quizSettings.show_correct_answers ?? true),
                show_score_after_submissions: Boolean(quizSettings.show_score_after_submissions ?? true),
              }
            : null,
        sections: sections.map((sec, idx) => ({
          ...sec,
          form_id: currentFormId!,
          position: sec.position ?? idx,
          fields: fields
            .filter((f) => f.section_id === sec.id)
            .map((f, fIdx) => formatFieldForPayload(f, f.position ?? fIdx, sec.id)),
        })),
        fields: rootOnlyFields.map((f, idx) =>
          formatFieldForPayload(f, f.position ?? idx, null)
        ),
      };

      await saveDraft({ formId: currentFormId, payload });
      markSaved();
      toast.success('Draft saved successfully!');
      return currentFormId;
    } catch (err: unknown) {
      console.error('Failed to save draft:', err);
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to save draft. Please check your inputs and try again.';
      toast.error(msg);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [
    formId,
    title,
    description,
    isTitleEdited,
    isDescriptionEdited,
    formType,
    initialFormType,
    status,
    initialStatus,
    formSettings,
    initialFormSettings,
    isFormSettingsEdited,
    quizSettings,
    initialQuizSettings,
    isQuizSettingsEdited,
    sections,
    fields,
    createForm,
    saveDraft,
    markSaved,
  ]);

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      let currentFormId = formId;

      // Always save draft before publishing to guarantee latest canvas & settings state is persisted
      if (isDirty || !currentFormId) {
        const savedId = await handleSaveDraft();
        if (!savedId) {
          // If draft save or settings validation failed, abort publish
          return;
        }
        currentFormId = savedId;
      } else {
        // Even if not dirty, run settings validation before publishing live
        const formSettingsValidation = validateFormSettings({
          title,
          submission_limit: formSettings.submission_limit,
          start_at: formSettings.start_at,
          end_at: formSettings.end_at,
          confirmation_message: formSettings.confirmation_message,
        });
        if (!formSettingsValidation.isValid) {
          const firstMsg = Object.values(formSettingsValidation.errors)[0];
          toast.error(`Form Settings: ${firstMsg}`);
          return;
        }

        if (formType === 'QUIZ') {
          const quizSettingsValidation = validateQuizSettings({
            time_limit: quizSettings.time_limit,
            passing_score: quizSettings.passing_score,
            total_attempts: quizSettings.total_attempts,
          });
          if (!quizSettingsValidation.isValid) {
            const firstMsg = Object.values(quizSettingsValidation.errors)[0];
            toast.error(`Quiz Rules: ${firstMsg}`);
            return;
          }
        }
      }

      // Check authentication: users must log in or sign up before publishing live
      if (!isAuthenticated) {
        const returnUrl = currentFormId
          ? `/builder?id=${currentFormId}`
          : typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : '/builder';

        toast.info('Please sign in or create an account to publish your form live.');
        router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        return;
      }

      if (!currentFormId) {
        toast.error('Unable to publish: form ID could not be established.');
        return;
      }

      // Check whether this form was already published previously based on published_version
      const wasPreviouslyPublished = Boolean(
        publishedVersion && publishedVersion > 0
      );

      const published = await publishForm(currentFormId);
      setStatus('PUBLISHED');
      markSaved();

      const liveSlug = published?.slug || useBuilderStore.getState().slug || slug || currentFormId;

      toast.success('Form published live!', {
        description: 'Your form is ready for respondents with no app header.',
        action: {
          label: 'View Live Form',
          onClick: () => window.open(`/f/${liveSlug}`, '_blank'),
        },
      });

      // Automatically open the share live popup ONLY on the first publish
      const isFirstPublish =
        !wasPreviouslyPublished &&
        (published?.published_version === 1 ||
          published?.published_version === undefined ||
          published?.published_version === null);

      if (isFirstPublish) {
        setIsShareModalOpen(true);
      }
    } catch (err: unknown) {
      console.error('Failed to publish form:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty) {
          handleSaveDraft();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveDraft, isDirty]);

  const handleReturnToWorkspace = async (e: React.MouseEvent) => {
    if (isDirty) {
      e.preventDefault();
      const ok = await confirm({
        title: 'Unsaved Changes',
        description: 'You have unsaved changes in this form. If you leave without saving draft, your changes will be lost.',
        confirmText: 'Leave without saving',
        cancelText: 'Stay on Builder',
        variant: 'destructive',
      });
      if (ok) {
        router.push('/forms');
      }
    }
  };

  const handleResetCanvas = async () => {
    if (fields.length === 0) return;
    const ok = await confirm({
      title: 'Clear all questions from canvas?',
      description: 'This will remove all current fields and questions from the active builder session.',
      confirmText: 'Clear Canvas',
      cancelText: 'Keep Questions',
      variant: 'destructive',
    });
    if (ok) {
      clearFields();
      toast.info('Canvas cleared');
    }
  };

  const handleDeleteForm = async () => {
    const targetId = formId;
    const ok = await confirm({
      title: targetId ? 'Delete this form?' : 'Discard this form?',
      description: targetId
        ? `Are you sure you want to permanently delete "${title || 'Untitled Form'}"? All question fields, settings, and submitted responses will be permanently removed.`
        : 'Are you sure you want to discard this new form and return to the forms workspace? Any changes you have made will be lost.',
      confirmText: targetId ? 'Delete Form' : 'Discard Form',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: targetId
        ? async () => {
            try {
              await deleteFormApi(targetId);
              resetBuilder();
              router.replace('/forms');
            } catch (err: unknown) {
              console.error('Failed to delete form:', err);
              const msg =
                err && typeof err === 'object' && 'message' in err
                  ? String((err as { message: unknown }).message)
                  : 'Failed to delete form. Please try again.';
              toast.error(msg);
              throw err; // Keeps confirmation modal open on error
            }
          }
        : undefined,
    });
    if (!ok) return;

    if (!targetId) {
      toast.info('New form discarded');
    }

    resetBuilder();
    router.replace('/forms');
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-card rounded-md border border-border">
      {/* Top Bar: Back to forms + Form Title & Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/forms"
            onClick={handleReturnToWorkspace}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-foreground h-7.5 px-2 rounded-md'
            )}
            title="Return to Forms Workspace"
          >
            <ArrowLeft className="size-3.5" />
            <span>Workspace</span>
          </Link>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2 truncate">
            <span className="font-heading font-bold text-sm text-foreground truncate">
              {title || 'Untitled Form'}
            </span>
            <Badge variant="outline" className="text-[9px] font-mono uppercase px-1.5 py-0 border-border bg-muted/60 rounded-xs">
              {formType}
            </Badge>
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-xs ${FORM_STATUS_STYLES[status] || FORM_STATUS_STYLES.DRAFT
                }`}
            >
              {status}
            </span>

            {/* Unsaved vs Saved state indicator */}
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded-xs border border-amber-500/20">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-xs border border-emerald-500/20">
                <Check className="size-2.5" />
                Saved
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Delete Form Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeleteForm}
            disabled={isDeletingForm || isSaving}
            className="cursor-pointer gap-1.5 text-xs h-7.5 px-2.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title={formId ? 'Permanently delete this form' : 'Discard this form'}
          >
            {isDeletingForm ? (
              <Loader2 className="size-3.5 animate-spin text-destructive" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            <span className="hidden sm:inline">Delete</span>
          </Button>

          {fields.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetCanvas}
              title="Clear all fields"
              className="cursor-pointer text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7.5 px-2.5 rounded-md"
            >
              <RotateCcw className="size-3 mr-1" />
              Clear
            </Button>
          )}

          {/* Save Draft Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSaving || isSavingDraft || !isDirty}
            className="cursor-pointer gap-1.5 text-xs h-7.5 px-3 rounded-md border-border hover:border-primary/50 text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            title={!isDirty ? 'No unsaved changes' : 'Save all sections, fields, and changes (Cmd+S)'}
          >
            {isSaving || isSavingDraft ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Save className="size-3" />
            )}
            <span>Save Draft</span>
          </Button>

          {/* Share Button for Live Form URL */}
          {status === 'PUBLISHED' && (slug || form?.slug || formId) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareModalOpen(true)}
              className="cursor-pointer gap-1.5 text-xs h-7.5 px-3 rounded-md text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 font-medium"
              title="Share live form link"
            >
              <Share2 className="size-3" />
              <span>Share</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="cursor-not-allowed gap-1.5 text-xs h-7.5 px-3 rounded-md border-border text-muted-foreground opacity-50"
              title="Publish the form to share the live link"
            >
              <Share2 className="size-3" />
              <span>Share</span>
            </Button>
          )}

          {/* Preview Draft Button */}
          <Link
            href={formId ? `/preview?id=${formId}` : '/preview'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'cursor-pointer gap-1.5 text-xs h-7.5 px-3 rounded-md border-border hover:border-primary/50 text-foreground'
            )}
            title="Preview current draft in a new browser tab"
          >
            <ExternalLink className="size-3" />
            <span>Preview</span>
          </Link>

          {/* Publish Live Button */}
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishDisabled}
            className={`cursor-pointer gap-1.5 text-xs h-7.5 rounded-md font-semibold transition-all ${isPublishDisabled && !isPublishing
              ? 'opacity-55 cursor-not-allowed bg-muted text-muted-foreground hover:bg-muted border border-border shadow-none'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            title={
              isPublishing
                ? 'Publishing form live...'
                : isVersionsSame && !isDirty
                  ? 'Latest draft is already published live (no changes to publish)'
                  : 'Publish latest draft changes live'
            }
          >
            {isPublishing ? (
              <Loader2 className="size-3 animate-spin" />
            ) : isVersionsSame && !isDirty ? (
              <Check className="size-3 text-muted-foreground" />
            ) : (
              <Send className="size-3" />
            )}
            <span>{isVersionsSame && !isDirty ? 'Published' : 'Publish'}</span>
          </Button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.isActive;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={tab.onClick}
              className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${isActive
                ? 'bg-primary/10 text-primary border border-primary/25 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              <Icon className="size-3" />
              <span>{tab.label}</span>
              {tab.id === 'quiz' && formType === 'QUIZ' && (
                <span className="size-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Share Live Form Dialog */}
      <ShareLiveFormDialog
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        slug={slug || form?.slug}
        formId={formId}
        formTitle={title}
      />
    </div>
  );
};
