'use client';

import React, { useState } from 'react';
import { useBuilderStore } from '../store/builderStore';
import { DEFAULT_QUIZ_SETTINGS } from '../constants/builder.constants';
import { useSingleForm } from '@/features/forms/hooks/useForms';
import type { UpdateQuizSettingsPayload } from '@/types/api.types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, RotateCcw, CheckCircle2, Award, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuizSettingsViewProps {
  onClose?: () => void;
}

export const QuizSettingsView: React.FC<QuizSettingsViewProps> = ({ onClose }) => {
  const { formId, quizSettings, updateQuizSettings, setFormType } = useBuilderStore();
  const { updateQuizSettings: saveQuizSettingsApi, isUpdatingQuizSettings } = useSingleForm(formId);

  const [timeLimit, setTimeLimit] = useState<number | ''>(
    quizSettings.time_limit ?? DEFAULT_QUIZ_SETTINGS.time_limit ?? 30
  );
  const [passingScore, setPassingScore] = useState<string | number>(
    quizSettings.passing_score ?? DEFAULT_QUIZ_SETTINGS.passing_score ?? 70
  );
  const [totalAttempts, setTotalAttempts] = useState<number | ''>(
    quizSettings.total_attempts ?? DEFAULT_QUIZ_SETTINGS.total_attempts ?? 1
  );
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(
    quizSettings.show_correct_answers ?? DEFAULT_QUIZ_SETTINGS.show_correct_answers ?? true
  );
  const [showScoreAfterSubmissions, setShowScoreAfterSubmissions] = useState(
    quizSettings.show_score_after_submissions ?? DEFAULT_QUIZ_SETTINGS.show_score_after_submissions ?? true
  );

  const handleSave = async () => {
    // Ensure form type is QUIZ
    setFormType('QUIZ');

    const payload: UpdateQuizSettingsPayload = {
      time_limit: timeLimit === '' ? null : Number(timeLimit),
      passing_score: String(passingScore),
      total_attempts: totalAttempts === '' ? null : Number(totalAttempts),
      show_correct_answers: showCorrectAnswers,
      show_score_after_submissions: showScoreAfterSubmissions,
    };

    updateQuizSettings(payload);

    if (formId) {
      try {
        await saveQuizSettingsApi(payload);
        toast.success('Quiz rules updated');
      } catch {
        // Fallback updated local state
      }
    } else {
      toast.success('Quiz settings saved locally');
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="w-full space-y-5 pb-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Trophy className="size-4" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold tracking-tight text-foreground">
              Quiz Scoring & Rules
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Timer limits, passing thresholds, and answer keys.
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isUpdatingQuizSettings}
          size="sm"
          className="cursor-pointer gap-1.5 text-xs h-7.5 px-3 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          {isUpdatingQuizSettings ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          <span>Save Rules</span>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Scoring & Timer Parameters */}
        <div className="card-surface p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Award className="size-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Scoring Thresholds & Timing
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                <Label htmlFor="time-limit" className="text-xs font-medium">
                  Time Limit (Minutes)
                </Label>
              </div>
              <Input
                id="time-limit"
                type="number"
                placeholder="No limit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value === '' ? '' : Number(e.target.value))}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground">e.g. 30 minutes countdown</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Trophy className="size-3.5 text-muted-foreground" />
                <Label htmlFor="passing-score" className="text-xs font-medium">
                  Passing Score (%)
                </Label>
              </div>
              <Input
                id="passing-score"
                type="number"
                min={0}
                max={100}
                placeholder="70"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Percentage required to pass</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <RotateCcw className="size-3.5 text-muted-foreground" />
                <Label htmlFor="total-attempts" className="text-xs font-medium">
                  Maximum Attempts
                </Label>
              </div>
              <Input
                id="total-attempts"
                type="number"
                min={1}
                placeholder="Unlimited"
                value={totalAttempts}
                onChange={(e) => setTotalAttempts(e.target.value === '' ? '' : Number(e.target.value))}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Leave empty for unlimited</p>
            </div>
          </div>
        </div>

        {/* Results & Review Experience */}
        <div className="card-surface p-6 space-y-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Respondent Feedback & Reveal
            </h3>
          </div>

          <div className="divide-y divide-border/60">
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label htmlFor="show-score" className="text-xs font-medium cursor-pointer">
                  Show Score Immediately After Submission
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Displays total points earned and pass/fail banner to the participant
                </p>
              </div>
              <Switch
                id="show-score"
                checked={showScoreAfterSubmissions}
                onCheckedChange={setShowScoreAfterSubmissions}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label htmlFor="show-answers" className="text-xs font-medium cursor-pointer">
                  Reveal Correct Answers
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Allow participant to review mistakes and view the correct answer key
                </p>
              </div>
              <Switch
                id="show-answers"
                checked={showCorrectAnswers}
                onCheckedChange={setShowCorrectAnswers}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
