'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowUp,
  Loader2,
  Briefcase,
  Star,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { formsService } from '../services/formsService';
import { useBuilderStore } from '@/features/builder/store/builderStore';

const EXAMPLE_PROMPTS = [
  {
    icon: Briefcase,
    label: 'Job Application',
    prompt:
      'Create a simple job application form for a software developer position with personal information, work experience, technical skills, resume upload, and portfolio URL.',
  },
  {
    icon: Star,
    label: 'Customer Feedback',
    prompt:
      'Build a customer feedback survey with satisfaction rating, product usability questions, feature requests, and recommendation score (NPS).',
  },
  {
    icon: GraduationCap,
    label: 'Developer Assessment',
    prompt:
      'Design a technical developer quiz testing JavaScript, React, and system design concepts with multiple choice questions, passing score, and timer limit.',
  },
  {
    icon: Calendar,
    label: 'Event Registration',
    prompt:
      'Create a conference registration form collecting attendee name, email, dietary preferences, ticket tier selection, and session interest checkboxes.',
  },
];

export const AiFormGeneratorCard: React.FC = () => {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height as content expands
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        Math.max(textareaRef.current.scrollHeight, 60),
        220
      )}px`;
    }
  }, [prompt]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      toast.error('Please enter a description for the form you want to generate.');
      textareaRef.current?.focus();
      return;
    }

    setIsGenerating(true);

    try {
      // POST /api/v1/ai/generate-form
      const form = await formsService.generateFormWithAI({
        user_prompt: cleanPrompt,
      });

      if (!form || !form.id) {
        throw new Error('Form was generated but did not return a valid form ID.');
      }

      // Pre-load into builder store for an instantaneous transition
      useBuilderStore.getState().loadForm(form);

      toast.success('Form generated successfully! Redirecting to Builder...');

      // Redirect directly to the builder with the newly generated form's ID
      router.push(`/builder?id=${form.id}`);
    } catch (err: unknown) {
      setIsGenerating(false);
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate form with AI. Please verify your prompt and try again.';
      toast.error(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift (standard ChatGPT behavior), allow Shift+Enter for newlines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const hasPrompt = Boolean(prompt.trim());

  return (
    <>
      {/* ChatGPT-style AI Form Generation Card - Full Width (max-w-4xl) */}
      <div className="w-full max-w-4xl mx-auto text-left">
        <form
          onSubmit={handleGenerate}
          className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-sm hover:border-border transition-all focus-within:border-foreground/30 focus-within:shadow-md"
        >
          {/* Main Text Input Area */}
          <div className="px-1 pt-1">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder="Describe the form, quiz, or survey you want to build..."
              rows={2}
              className="w-full bg-transparent resize-none border-0 p-0 text-sm sm:text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 min-h-[56px] max-h-[220px] leading-relaxed"
            />
          </div>

          {/* Bottom Toolbar: Quick Action Pills on Left + Upward Arrow Button on Right */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40 mt-2">
            {/* Left: Quick Inspiration Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-[calc(100%-48px)]">
              <button
                type="button"
                className="size-7 sm:size-8 rounded-full border border-border/80 bg-muted/30 hover:bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                title="AI Form Generator"
              >
                <Sparkles className="size-3.5 text-primary" />
              </button>

              {EXAMPLE_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => {
                      setPrompt(item.prompt);
                      textareaRef.current?.focus();
                    }}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/70 bg-muted/20 hover:bg-muted/60 text-xs text-foreground transition-all disabled:opacity-50 select-none whitespace-nowrap shrink-0"
                  >
                    <Icon className="size-3 text-muted-foreground" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Circular Submit Button (ChatGPT-style with ArrowUp) */}
            <button
              type="submit"
              disabled={isGenerating || !hasPrompt}
              aria-label="Generate Form with AI"
              className={`size-8 sm:size-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                hasPrompt && !isGenerating
                  ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-xs'
                  : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin text-white" />
              ) : (
                <ArrowUp className="size-4 sm:size-4.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Clean, Minimalist AI Loading Screen Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200 select-none">
          <div className="relative size-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <Sparkles className="size-5 text-primary animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground animate-pulse">
            Generating your form...
          </p>
        </div>
      )}
    </>
  );
};
