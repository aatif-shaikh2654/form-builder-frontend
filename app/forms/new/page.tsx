'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForms } from '@/features/forms/hooks/useForms';
import { useBuilderStore } from '@/features/builder/store/builderStore';
import type { FormType } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Trophy,
  ClipboardCheck,
  MessageSquare,
  BarChart3,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { FORM_TYPE_CONFIG } from '@/features/forms/constants/forms.constants';

interface FormTypeOption {
  type: FormType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FORM_TYPES: FormTypeOption[] = [
  {
    type: 'FORM',
    label: FORM_TYPE_CONFIG.FORM.label,
    icon: FileText,
  },
  {
    type: 'QUIZ',
    label: FORM_TYPE_CONFIG.QUIZ.label,
    icon: Trophy,
  },
  {
    type: 'SURVEY',
    label: FORM_TYPE_CONFIG.SURVEY.label,
    icon: ClipboardCheck,
  },
  {
    type: 'FEEDBACK',
    label: FORM_TYPE_CONFIG.FEEDBACK.label,
    icon: MessageSquare,
  },
  {
    type: 'POLL',
    label: FORM_TYPE_CONFIG.POLL.label,
    icon: BarChart3,
  },
];

export default function NewFormPage() {
  const router = useRouter();
  const { createForm, isCreating } = useForms();
  const { initNewForm, setTitle, setDescription, setFormType, setActiveBuilderTab } = useBuilderStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<FormType>('FORM');
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');

  const currentTypeMeta = FORM_TYPES.find((f) => f.type === selectedType) || FORM_TYPES[0];
  const CurrentIcon = currentTypeMeta.icon;

  const slugPreview = titleInput.trim()
    ? titleInput
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    : 'untitled-form';

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) {
      toast.error('Please enter a form title to proceed');
      return;
    }

    try {
      const created = await createForm({
        title: titleInput.trim(),
        description: descInput.trim() || '',
        form_type: selectedType,
      });

      // Initialize Zustand store
      initNewForm(selectedType);
      setTitle(created.title);
      setDescription(created.description || '');
      setFormType(created.form_type);
      setActiveBuilderTab('canvas');

      toast.success('Form created! Opening builder...');
      router.push(`/builder?id=${created.id}`);
    } catch {
      // Local builder fallback
      initNewForm(selectedType);
      setTitle(titleInput.trim());
      setDescription(descInput.trim());
      setFormType(selectedType);
      setActiveBuilderTab('canvas');

      toast.info('Form created in local builder');
      router.push('/builder');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/forms">
            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer size-8 rounded-md border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
              title="Back to Forms Workspace"
            >
              <ArrowLeft className="size-3.5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
                Create New Form
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20">
                STEP {step} OF 2
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 1
                ? 'Select the archetype that best matches your objective.'
                : 'Configure title, description, and public respondent settings.'}
            </p>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <div
            className={`size-6 rounded-md flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            1
          </div>
          <div className="w-6 h-0.5 bg-border" />
          <div
            className={`size-6 rounded-md flex items-center justify-center font-bold ${
              step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            2
          </div>
        </div>
      </div>

      {/* Step 1: Select Type */}
      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-foreground font-heading">
              1. Choose a Form Archetype
            </h2>
            <p className="text-xs text-muted-foreground">
              Archetypes come pre-configured with the ideal default scoring rules and inputs.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {FORM_TYPES.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedType === item.type;
              return (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setSelectedType(item.type)}
                  className={`p-4 py-5 rounded-md border transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 relative group outline-none ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40'
                  }`}
                >
                  <div
                    className={`size-11 rounded-md flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-muted/80'
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>

                  <span
                    className={`font-heading font-semibold text-xs sm:text-sm tracking-tight ${
                      isSelected ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {item.label}
                  </span>

                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="size-3.5 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Link href="/forms">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer text-sm font-semibold py-3 px-5 rounded-md border-border"
              >
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              className="cursor-pointer text-sm font-semibold py-3 px-5 gap-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <span>Next: Title &amp; Description</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Title & Description */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground font-heading">
                2. Form Title &amp; Description
              </h2>
              <p className="text-xs text-muted-foreground">
                Provide public details for your respondents and customize the URL slug.
              </p>
            </div>

            {/* Selected Type Badge */}
            <div className="flex items-center gap-2 p-1.5 px-2.5 rounded-md bg-muted border border-border text-xs font-semibold text-foreground">
              <CurrentIcon className="size-3.5 text-primary" />
              <span>{currentTypeMeta.label}</span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[10px] text-primary hover:underline ml-1 cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-md border border-border bg-card p-6">
            <div className="space-y-1.5">
              <Label htmlFor="form-title" className="text-xs font-semibold">
                Form Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-title"
                placeholder="e.g. Employee Engagement Q3 2026"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                required
                className="custom-form-input text-sm font-medium rounded-md py-2.5 px-3.5"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-desc" className="text-xs font-semibold">
                Description / Instructions (Optional)
              </Label>
              <Textarea
                id="form-desc"
                rows={3}
                placeholder="Provide helpful context or instructions for your respondents..."
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            {/* Public Slug URL Preview */}
            <div className="p-3 rounded-md bg-muted/40 border border-border flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 truncate">
                <span className="text-muted-foreground">Public URL Preview:</span>
                <span className="text-primary font-semibold truncate">
                  formcraft.io/f/{slugPreview}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider font-bold">
                {selectedType}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="cursor-pointer text-sm font-semibold py-3 px-5 rounded-md border-border"
            >
              <ArrowLeft className="size-4 mr-1.5" />
              Back to Type Selection
            </Button>

            <Button
              type="submit"
              disabled={isCreating || !titleInput.trim()}
              className="cursor-pointer text-sm font-semibold py-3 px-6 gap-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Creating Form...
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  Create Form &amp; Open Builder
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
