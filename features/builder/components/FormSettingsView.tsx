'use client';

import React, { useState } from 'react';
import { useBuilderStore } from '../store/builderStore';
import { DEFAULT_FORM_SETTINGS } from '../constants/builder.constants';
import { useSingleForm, useEditFormMutation } from '@/features/forms/hooks/useForms';
import type { UpdateSettingsPayload, FormType, FormStatus } from '@/types/api.types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Save, CheckCircle2, Shield, Calendar, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

interface FormSettingsViewProps {
  onClose?: () => void;
}

export const FormSettingsView: React.FC<FormSettingsViewProps> = ({ onClose }) => {
  const {
    formId,
    title,
    setTitle,
    description,
    setDescription,
    formType,
    setFormType,
    status,
    setStatus,
    formSettings,
    updateFormSettings,
  } = useBuilderStore();

  const { updateSettings, isUpdatingSettings } = useSingleForm(formId);
  const { mutateAsync: editForm, isPending: isEditing } = useEditFormMutation();

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

  const isSaving = isUpdatingSettings || isEditing;

  const handleSave = async () => {
    const payload: UpdateSettingsPayload = {
      confirmation_message: confirmationMessage,
      allow_multiple_submission: allowMultiple,
      require_login: requireLogin,
      show_progress_bar: showProgressBar,
      shuffle_questions: shuffleQuestions,
      submission_limit: submissionLimit === '' ? null : Number(submissionLimit),
      start_at: startAt || null,
      end_at: endAt || null,
    };

    updateFormSettings(payload);

    if (formId) {
      try {
        await Promise.all([
          updateSettings(payload),
          editForm({
            formId,
            payload: {
              title,
              description,
              form_type: formType,
              status,
            },
          }),
        ]);
        toast.success('Form settings & overview updated');
      } catch {
        toast.info('Settings saved in active builder session');
      }
    } else {
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Customer Satisfaction Survey"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="form-desc" className="text-xs font-medium">
                Description / Purpose
              </Label>
              <Textarea
                id="form-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                    onClick={() => setFormType(type)}
                    className={`cursor-pointer px-2.5 py-1.5 rounded-md text-xs font-medium border text-left transition-all ${
                      formType === type
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-card hover:bg-accent/50 text-muted-foreground'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label className="text-xs font-medium">Publishing Status</Label>
              <div className="flex gap-2">
                {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as FormStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`cursor-pointer flex-1 py-1 rounded-md text-xs font-mono border transition-all ${
                      status === st
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border text-muted-foreground hover:bg-accent/50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
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
              onChange={(e) => setConfirmationMessage(e.target.value)}
              placeholder="Message shown after respondent clicks submit"
              className="text-xs"
            />
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
                onCheckedChange={setAllowMultiple}
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
                onCheckedChange={setRequireLogin}
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
                onCheckedChange={setShowProgressBar}
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
                onCheckedChange={setShuffleQuestions}
              />
            </div>

            <div className="flex items-center justify-between py-2.5">
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
                onChange={(e) =>
                  setSubmissionLimit(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-28 text-xs"
              />
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
                onChange={(iso) => setStartAt(iso)}
                placeholder="Pick start date & time..."
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="end-at" className="text-xs">
                Close Form At
              </Label>
              <DateTimePicker
                id="end-at"
                value={endAt || ''}
                onChange={(iso) => setEndAt(iso)}
                placeholder="Pick close date & time..."
                minDate={startAt ? new Date(startAt) : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
