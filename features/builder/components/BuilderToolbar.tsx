'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBuilderStore, type BuilderActiveTab } from '../store/builderStore';
import { useSingleForm, useCreateFormMutation } from '@/features/forms/hooks/useForms';
import { useUser } from '@/context/UserContext';
import { FORM_STATUS_STYLES } from '@/features/forms/constants/forms.constants';
import { useConfirmationStore } from '@/store/useConfirmationStore';
import type { SaveFormPayload, FieldsResponse } from '@/types/api.types';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { toast } from 'sonner';

export const BuilderToolbar: React.FC = () => {
  const router = useRouter();
  const {
    formId,
    title,
    description,
    formType,
    status,
    setStatus,
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
  } = useBuilderStore();

  const { mutateAsync: createForm } = useCreateFormMutation();
  const { saveDraft, isSavingDraft, publishForm, isPublishing } = useSingleForm(formId);
  const { isAuthenticated } = useUser();
  const confirm = useConfirmationStore((s) => s.confirm);
  const [isSaving, setIsSaving] = useState(false);

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

        const values: string[] | null = isChoiceField
          ? rawValues || ['Option 1', 'Option 2', 'Option 3']
          : null;

        return {
          ...f,
          form_id: sectionId ? null : currentFormId!,
          section_id: sectionId,
          position,
          values,
        };
      };

      // Only pass fields that do NOT belong to any section in the top-level form fields array
      const rootOnlyFields = fields.filter(
        (f) => !f.section_id || !sections.some((s) => s.id === f.section_id)
      );

      const payload: SaveFormPayload = {
        title: isTitleEdited ? (title.trim() || null) : null,
        description: isDescriptionEdited ? (description.trim() || null) : null,
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

      // Always save draft before publishing to guarantee latest canvas state is persisted
      if (isDirty || !currentFormId) {
        const savedId = await handleSaveDraft();
        if (savedId) {
          currentFormId = savedId;
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

      await publishForm(currentFormId);
      setStatus('PUBLISHED');
      markSaved();

      toast.success('Form published live!', {
        description: 'Your form is ready for respondents with no app header.',
        action: {
          label: 'View Live Form',
          onClick: () => window.open(`/f/${currentFormId}`, '_blank'),
        },
      });
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
        handleSaveDraft();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveDraft]);

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

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-card rounded-md border border-border">
      {/* Top Bar: Back to forms + Form Title & Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/forms" onClick={handleReturnToWorkspace}>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-foreground h-7.5 px-2 rounded-md"
              title="Return to Forms Workspace"
            >
              <ArrowLeft className="size-3.5" />
              <span>Workspace</span>
            </Button>
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
              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-xs ${
                FORM_STATUS_STYLES[status] || FORM_STATUS_STYLES.DRAFT
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
            disabled={isSaving || isSavingDraft}
            className="cursor-pointer gap-1.5 text-xs h-7.5 px-3 rounded-md border-border hover:border-primary/50 text-foreground"
            title="Save all sections, fields, and changes (Cmd+S)"
          >
            {isSaving || isSavingDraft ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Save className="size-3" />
            )}
            <span>Save Draft</span>
          </Button>

          {/* Open in New Tab Preview */}
          <Link
            href={formId ? `/preview?id=${formId}` : '/preview'}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer gap-1.5 text-xs h-7.5 px-3 rounded-md border-border hover:border-primary/50 text-foreground"
              title="Open full form preview in a new browser tab"
            >
              <ExternalLink className="size-3" />
              <span>Live Preview</span>
            </Button>
          </Link>

          {/* Publish Live Button */}
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isSaving || isPublishing}
            className="cursor-pointer gap-1.5 text-xs h-7.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isPublishing ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Send className="size-3" />
            )}
            Publish
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
              className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
                isActive
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
    </div>
  );
};
