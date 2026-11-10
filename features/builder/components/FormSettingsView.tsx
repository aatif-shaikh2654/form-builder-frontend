'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBuilderStore } from '../store/builderStore';
import { DEFAULT_FORM_SETTINGS } from '../constants/builder.constants';
import { validateFormSettings, type FormSettingsErrors } from '../utils/settingsValidation';
import { useSingleForm, useDeleteFormMutation } from '@/features/forms/hooks/useForms';
import { useConfirmationStore } from '@/store/useConfirmationStore';
import type { FormType, FormStatus } from '@/types/api.types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Save, CheckCircle2, Shield, Calendar, Loader2, Settings2, Globe, ExternalLink, Copy, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { toast } from 'sonner';

interface FormSettingsViewProps {
  onClose?: () => void;
}

export const FormSettingsView: React.FC<FormSettingsViewProps> = ({ onClose }) => {
  const router = useRouter();
  const confirm = useConfirmationStore((s) => s.confirm);
  const { mutateAsync: deleteFormApi, isPending: isDeletingForm } = useDeleteFormMutation();
  const {
    formId,
    title,
    description,
    formType,
    status,
    setStatus,
    slug,
    formSettings,
    updateFormSettings,
    resetBuilder,
  } = useBuilderStore();

  const [formTitle, setFormTitle] = useState(title);
  const [formDescription, setFormDescription] = useState(description);
  const [formTypeChoice, setFormTypeChoice] = useState<FormType>(formType);

  const handleDeleteForm = async () => {
    const targetId = formId;
    const ok = await confirm({
      title: targetId ? 'Delete this form?' : 'Discard this form?',
      description: targetId
        ? `Are you sure you want to permanently delete "${formTitle || title || 'Untitled Form'}"? All question fields, settings, and submitted responses will be permanently removed.`
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

  const { form, editForm, isEditing } = useSingleForm(formId);
  const [isArchiving, setIsArchiving] = useState(false);

  const publishedVersion = form?.published_version ?? null;

  const [confirmationMessage, setConfirmationMessage] = useState(
    formSettings.confirmation_message || DEFAULT_FORM_SETTINGS.confirmation_message || ''
  );
  const [allowMultiple, setAllowMultiple] = useState(
    formSettings.allow_multiple_submission ?? DEFAULT_FORM_SETTINGS.allow_multiple_submission ?? true
  );
  const [requireLogin, setRequireLogin] = useState(
    formSettings.require_login ?? DEFAULT_FORM_SETTINGS.require_login ?? false
  );
  const [showProgressBar, setShowProgressBar] = useState(
    formSettings.show_progress_bar ?? DEFAULT_FORM_SETTINGS.show_progress_bar ?? true
  );
  const [shuffleQuestions, setShuffleQuestions] = useState(
    formSettings.shuffle_questions ?? DEFAULT_FORM_SETTINGS.shuffle_questions ?? false
  );
  const [submissionLimit, setSubmissionLimit] = useState<number | ''>(
    formSettings.submission_limit ?? ''
  );
  const [startAt, setStartAt] = useState(formSettings.start_at || '');
  const [endAt, setEndAt] = useState(formSettings.end_at || '');
  const [errors, setErrors] = useState<FormSettingsErrors>({});

  const isSaving = isEditing || isArchiving;

  const handleArchiveToggle = async () => {
    const isCurrentlyArchived = status === 'ARCHIVED';

    if (!isCurrentlyArchived) {
      const ok = await confirm({
        title: 'Archive this form?',
        description: 'Archiving will pause public submissions for this form. You can unarchive it at any time.',
        confirmText: 'Archive Form',
        cancelText: 'Cancel',
      });
      if (!ok) return;
    }

    const nextStatus: FormStatus = isCurrentlyArchived
      ? (publishedVersion && publishedVersion > 0 ? 'PUBLISHED' : 'DRAFT')
      : 'ARCHIVED';

    const prevStatus = status;
    setStatus(nextStatus);

    if (formId) {
      try {
        setIsArchiving(true);
        await editForm({
          formId,
          payload: {
            title: formTitle,
            description: formDescription,
            form_type: formTypeChoice,
            status: nextStatus,
            confirmation_message: confirmationMessage || null,
            allow_multiple_submission: allowMultiple,
            require_login: requireLogin,
            show_progress_bar: showProgressBar,
            shuffle_questions: shuffleQuestions,
            submission_limit: submissionLimit === '' ? null : Number(submissionLimit),
            start_at: startAt || null,
            end_at: endAt || null,
          },
        });
        useBuilderStore.setState({
          status: nextStatus,
          initialStatus: nextStatus,
        });
        toast.success(isCurrentlyArchived ? 'Form unarchived' : 'Form archived successfully');
      } catch (err) {
        console.error('Failed to change archive status:', err);
        setStatus(prevStatus);
        toast.error('Failed to update form status');
      } finally {
        setIsArchiving(false);
      }
    } else {
      toast.info(isCurrentlyArchived ? 'Form unarchived' : 'Form marked as archived');
    }
  };

  const handleSave = async () => {
    const validation = validateFormSettings({
      title: formTitle,
      submission_limit: submissionLimit,
      start_at: startAt,
      end_at: endAt,
      confirmation_message: confirmationMessage,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      const firstMsg = Object.values(validation.errors)[0];
      toast.error(firstMsg);
      return;
    }

    setErrors({});

    const settingsData = {
      confirmation_message: confirmationMessage || null,
      allow_multiple_submission: allowMultiple,
      require_login: requireLogin,
      show_progress_bar: showProgressBar,
      shuffle_questions: shuffleQuestions,
      submission_limit: submissionLimit === '' ? null : Number(submissionLimit),
      start_at: startAt || null,
      end_at: endAt || null,
    };

    updateFormSettings(settingsData);

    if (formId) {
      try {
        await editForm({
          formId,
          payload: {
            title: formTitle,
            description: formDescription,
            form_type: formTypeChoice,
            status,
            ...settingsData,
          },
        });

        // Sync builder store and enable draft/publish
        useBuilderStore.setState({
          title: formTitle,
          description: formDescription,
          formType: formTypeChoice,
          initialTitle: formTitle,
          initialDescription: formDescription,
          initialFormType: formTypeChoice,
          initialStatus: status,
          initialFormSettings: settingsData,
          isTitleEdited: false,
          isDescriptionEdited: false,
          isFormSettingsEdited: false,
          isDirty: true,
        });

        toast.success('Form settings & overview updated');
      } catch (err: unknown) {
        console.error('Failed to update form:', err);
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to update form settings. Please check your inputs and try again.';
        toast.error(msg);
        return; // DO NOT CLOSE SHEET ON ERROR!
      }
    } else {
      useBuilderStore.setState({
        title: formTitle,
        description: formDescription,
        formType: formTypeChoice,
        isTitleEdited: formTitle !== useBuilderStore.getState().initialTitle,
        isDescriptionEdited: formDescription !== useBuilderStore.getState().initialDescription,
        isFormSettingsEdited: true,
        isDirty: true,
      });
      toast.success('Form settings saved locally');
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="w-full space-y-5 pb-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
          Configuration
        </span>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="sm"
          className="cursor-pointer gap-1.5 text-xs h-7.5 px-3 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          <span>Save Changes</span>
        </Button>
      </div>

      <div className="space-y-4">
        {/* Form Overview Section */}
        <div className="card-surface p-4 space-y-3.5 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <Settings2 className="size-4 text-primary" />
            <h3 className="font-heading text-xs sm:text-sm font-semibold text-foreground">
              Form Overview &amp; Identity
            </h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="form-title" className="text-xs font-medium">
                Form Title
              </Label>
              <Input
                id="form-title"
                value={formTitle}
                onChange={(e) => {
                  setFormTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                  useBuilderStore.getState().setIsDirty(true);
                }}
                placeholder="e.g. Customer Satisfaction Survey"
                className={`text-xs ${errors.title ? 'border-destructive ring-1 ring-destructive' : ''}`}
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title && (
                <p className="text-[11px] text-destructive font-medium">{errors.title}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="form-desc" className="text-xs font-medium">
                Description / Purpose
              </Label>
              <Textarea
                id="form-desc"
                value={formDescription}
                onChange={(e) => {
                  setFormDescription(e.target.value);
                  useBuilderStore.getState().setIsDirty(true);
                }}
                placeholder="Brief summary explaining what this form collects..."
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Form Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(['FORM', 'QUIZ', 'SURVEY', 'FEEDBACK', 'POLL'] as FormType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setFormTypeChoice(type);
                      useBuilderStore.getState().setIsDirty(true);
                    }}
                    className={`cursor-pointer px-2.5 py-1.5 rounded-md text-xs font-medium border text-left transition-all ${
                      formTypeChoice === type
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-card hover:bg-accent/50 text-muted-foreground'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Archive Action */}
            <div className="pt-2 border-t border-border">
              {status !== 'ARCHIVED' ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-foreground">Archive Form</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Stop accepting new responses and move this form to archive.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleArchiveToggle}
                    disabled={isArchiving || isEditing}
                    className="cursor-pointer gap-1.5 text-xs h-8 px-3 shrink-0 text-muted-foreground hover:text-foreground border-border hover:bg-accent/60"
                  >
                    {isArchiving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Archive className="size-3.5" />
                    )}
                    <span>Archive</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                  <div className="flex items-center gap-2">
                    <Archive className="size-3.5 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold block">Form is Archived</span>
                      <p className="text-[10px] text-muted-foreground">
                        Public submissions are paused.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleArchiveToggle}
                    disabled={isArchiving || isEditing}
                    className="cursor-pointer gap-1.5 text-xs h-7 px-2.5 border-amber-500/30 hover:bg-amber-500/10 shrink-0 font-medium text-amber-700 dark:text-amber-400"
                  >
                    {isArchiving ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <ArchiveRestore className="size-3.5" />
                    )}
                    <span>Unarchive</span>
                  </Button>
                </div>
              )}
            </div>

            {status === 'PUBLISHED' && (slug || formId) && (
              <div className="flex items-center justify-between p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-1.5 truncate">
                  <Globe className="size-3.5 shrink-0" />
                  <span className="font-mono text-xs truncate">
                    /f/{slug || formId}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const fullUrl = `${window.location.origin}/f/${slug || formId}`;
                      navigator.clipboard.writeText(fullUrl);
                      toast.success('Live URL copied to clipboard');
                    }}
                    className="h-7 px-2 text-xs cursor-pointer gap-1"
                  >
                    <Copy className="size-3" />
                    Copy
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/f/${slug || formId}`, '_blank')}
                    className="h-7 px-2 text-xs border-emerald-500/30 cursor-pointer gap-1"
                  >
                    <ExternalLink className="size-3" />
                    Open
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Experience */}
        <div className="card-surface p-4 space-y-3 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <CheckCircle2 className="size-4 text-primary" />
            <h3 className="font-heading text-xs sm:text-sm font-semibold text-foreground">
              Confirmation Experience
            </h3>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="conf-msg" className="text-xs font-medium">
              Custom Success Message
            </Label>
            <Textarea
              id="conf-msg"
              rows={2}
              value={confirmationMessage}
              onChange={(e) => {
                setConfirmationMessage(e.target.value);
                if (errors.confirmation_message) setErrors((prev) => ({ ...prev, confirmation_message: undefined }));
                useBuilderStore.getState().setIsDirty(true);
              }}
              placeholder="Message shown after respondent clicks submit"
              className={`text-xs ${errors.confirmation_message ? 'border-destructive ring-1 ring-destructive' : ''}`}
              aria-invalid={Boolean(errors.confirmation_message)}
            />
            {errors.confirmation_message && (
              <p className="text-[11px] text-destructive font-medium">{errors.confirmation_message}</p>
            )}
          </div>
        </div>

        {/* Submission Policies */}
        <div className="card-surface p-4 space-y-3 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <Shield className="size-4 text-primary" />
            <h3 className="font-heading text-xs sm:text-sm font-semibold text-foreground">
              Submission Behavior &amp; Policies
            </h3>
          </div>

          <div className="divide-y divide-border/60">
            <div className="flex items-center justify-between py-2.5">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="allow-multiple" className="text-xs font-medium cursor-pointer">
                  Allow Multiple Submissions
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Allow the same user or IP to submit multiple times
                </p>
              </div>
              <Switch
                id="allow-multiple"
                checked={allowMultiple}
                onCheckedChange={(val) => {
                  setAllowMultiple(val);
                  useBuilderStore.getState().setIsDirty(true);
                }}
              />
            </div>

            <div className="flex items-center justify-between py-2.5">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="require-login" className="text-xs font-medium cursor-pointer">
                  Require Authentication
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Respondents must sign in before viewing and submitting
                </p>
              </div>
              <Switch
                id="require-login"
                checked={requireLogin}
                onCheckedChange={(val) => {
                  setRequireLogin(val);
                  useBuilderStore.getState().setIsDirty(true);
                }}
              />
            </div>

            <div className="flex items-center justify-between py-2.5">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="progress-bar" className="text-xs font-medium cursor-pointer">
                  Display Progress Bar
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Show respondents completion percentage as they fill fields
                </p>
              </div>
              <Switch
                id="progress-bar"
                checked={showProgressBar}
                onCheckedChange={(val) => {
                  setShowProgressBar(val);
                  useBuilderStore.getState().setIsDirty(true);
                }}
              />
            </div>

            <div className="flex items-center justify-between py-2.5">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="shuffle-q" className="text-xs font-medium cursor-pointer">
                  Shuffle Question Order
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Randomize question display sequence for every session
                </p>
              </div>
              <Switch
                id="shuffle-q"
                checked={shuffleQuestions}
                onCheckedChange={(val) => {
                  setShuffleQuestions(val);
                  useBuilderStore.getState().setIsDirty(true);
                }}
              />
            </div>

            <div className="flex flex-col py-2.5 gap-1.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-2">
                  <Label htmlFor="submission-limit" className="text-xs font-medium">
                    Total Submission Cap
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Close form once responses reach this number
                  </p>
                </div>
                <Input
                  id="submission-limit"
                  type="number"
                  placeholder="Unlimited"
                  value={submissionLimit}
                  onChange={(e) => {
                    setSubmissionLimit(e.target.value === '' ? '' : Number(e.target.value));
                    if (errors.submission_limit) setErrors((prev) => ({ ...prev, submission_limit: undefined }));
                    useBuilderStore.getState().setIsDirty(true);
                  }}
                  className={`w-28 text-xs ${errors.submission_limit ? 'border-destructive ring-1 ring-destructive' : ''}`}
                  aria-invalid={Boolean(errors.submission_limit)}
                />
              </div>
              {errors.submission_limit && (
                <p className="text-[11px] text-destructive font-medium self-end">{errors.submission_limit}</p>
              )}
            </div>
          </div>
        </div>

        {/* Availability Window */}
        <div className="card-surface p-4 space-y-3 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <Calendar className="size-4 text-primary" />
            <h3 className="font-heading text-xs sm:text-sm font-semibold text-foreground">
              Availability Window
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="start-at" className="text-xs">
                Open Form At
              </Label>
              <DateTimePicker
                id="start-at"
                value={startAt || ''}
                onChange={(iso) => {
                  setStartAt(iso);
                  if (errors.start_at || errors.end_at) {
                    setErrors((prev) => ({ ...prev, start_at: undefined, end_at: undefined }));
                  }
                  useBuilderStore.getState().setIsDirty(true);
                }}
                placeholder="Pick start date & time..."
              />
              {errors.start_at && (
                <p className="text-[11px] text-destructive font-medium">{errors.start_at}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="end-at" className="text-xs">
                Close Form At
              </Label>
              <DateTimePicker
                id="end-at"
                value={endAt || ''}
                onChange={(iso) => {
                  setEndAt(iso);
                  if (errors.end_at) {
                    setErrors((prev) => ({ ...prev, end_at: undefined }));
                  }
                  useBuilderStore.getState().setIsDirty(true);
                }}
                placeholder="Pick close date & time..."
                minDate={startAt ? new Date(startAt) : undefined}
              />
              {errors.end_at && (
                <p className="text-[11px] text-destructive font-medium">{errors.end_at}</p>
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone / Delete Form */}
        <div className="card-surface p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground">
                Delete Form
              </span>
              <p className="text-[11px] text-muted-foreground">
                Permanently delete this form and all its responses. This action cannot be undone.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteForm}
              disabled={isDeletingForm}
              className="cursor-pointer text-xs h-8 px-3 shrink-0 gap-1.5"
            >
              {isDeletingForm ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              <span>Delete Form</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
