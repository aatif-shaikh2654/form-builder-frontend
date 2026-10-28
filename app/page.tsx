'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  LayoutGrid,
  ArrowRight,
  Trophy,
  Layers,
  CheckCircle2,
  Sliders,
  FileText,
  MessageSquare,
  ClipboardCheck,
  Zap,
  ShieldCheck,
  Clock,
  Check,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section - Centered Text UI with Solid Accents */}
      <section className="pt-8 sm:pt-12 pb-4 text-center max-w-4xl mx-auto space-y-6">
        {/* Centered Solid Pill Badge (No Gradients, No Shadow) */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold">
          <Sparkles className="size-3.5 text-blue-600 dark:text-blue-400" />
          <span>FormCraft Studio • Next-Gen Form &amp; Quiz Engine</span>
        </div>

        {/* Big Centered Headline with Solid Primary Accent */}
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.14]">
          Build Forms, Quizzes &amp; Surveys{' '}
          <span className="text-primary">That Convert</span>
        </h1>

        {/* Centered Subtitle */}
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Create dynamic multi-step forms, scored assessments with automated passing logic, customer surveys, and instant polls in minutes.
        </p>

        {/* Centered Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/forms/new">
            <Button
              size="lg"
              className="cursor-pointer gap-2 text-sm font-semibold h-11 px-6 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sparkles className="size-4" />
              Create Your First Form
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>

          <Link href="/forms">
            <Button
              variant="outline"
              size="lg"
              className="cursor-pointer gap-2 text-sm font-semibold h-11 px-6 rounded-md border-border bg-card hover:bg-muted text-foreground"
            >
              <LayoutGrid className="size-4" />
              Open Forms Workspace
            </Button>
          </Link>
        </div>

        {/* Interactive Studio Preview Teaser with Solid Multi-Tone Paneling (No Shadow) */}
        <div className="pt-6">
          <div className="rounded-lg border border-border bg-card p-2 sm:p-3 max-w-5xl mx-auto text-left">
            {/* Title Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs text-muted-foreground font-mono bg-slate-100 dark:bg-slate-900 rounded-t-sm">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-rose-500" />
                <span className="size-2.5 rounded-full bg-amber-500" />
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span className="ml-2 text-foreground font-semibold">formcraft.studio / builder</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-xs bg-emerald-500 text-white text-[10px] font-bold">
                  LIVE SYNC ACTIVE
                </span>
              </div>
            </div>

            {/* Simulated 3-Column Preview with Solid Distinct Panels */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-b-md">
              {/* Palette Column - Solid Light Background */}
              <div className="hidden md:block md:col-span-3 space-y-2 p-3 bg-white dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] font-mono uppercase text-muted-foreground font-bold">Field Palette</p>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded-sm bg-slate-100 dark:bg-slate-900 flex items-center justify-between">
                    <span className="text-foreground">Full Name</span>
                    <span className="text-[9px] font-mono text-muted-foreground">TEXT</span>
                  </div>
                  <div className="p-2 rounded-sm bg-slate-100 dark:bg-slate-900 flex items-center justify-between">
                    <span className="text-foreground">Email Address</span>
                    <span className="text-[9px] font-mono text-muted-foreground">EMAIL</span>
                  </div>
                  <div className="p-2 rounded-sm bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-between border border-blue-200 dark:border-blue-800">
                    <span>Quiz Question</span>
                    <span className="text-[9px] font-mono font-bold">CHOICE</span>
                  </div>
                  <div className="p-2 rounded-sm bg-slate-100 dark:bg-slate-900 flex items-center justify-between">
                    <span className="text-foreground">Satisfaction Score</span>
                    <span className="text-[9px] font-mono text-muted-foreground">RATING</span>
                  </div>
                </div>
              </div>

              {/* Canvas Column - Solid Clean Surface */}
              <div className="md:col-span-6 space-y-3 p-4 bg-white dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-heading text-foreground">Lead &amp; Assessment Survey</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-sm bg-blue-600 text-white font-mono font-bold">
                    STEP 1 OF 3
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Selected Question Card with Solid Tint */}
                  <div className="p-3.5 rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30">
                    <p className="font-semibold text-foreground">1. What is your primary company objective?</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Select one option</p>
                    <div className="mt-2.5 space-y-1.5">
                      <div className="p-2 rounded-sm border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-medium flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Accelerate customer lead generation</span>
                      </div>
                      <div className="p-2 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-muted-foreground flex items-center gap-2">
                        <div className="size-3.5 rounded-full border border-slate-400 dark:border-slate-600" />
                        <span>Automate student test evaluations</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-md border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 flex items-center justify-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-xs">
                    <Sparkles className="size-3.5" />
                    <span>Drop new question field here</span>
                  </div>
                </div>
              </div>

              {/* Inspector Column - Solid Light Background */}
              <div className="hidden md:block md:col-span-3 space-y-2 p-3 bg-white dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] font-mono uppercase text-muted-foreground font-bold">Question Rules</p>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium">Point Value</label>
                    <div className="p-1.5 rounded-sm bg-slate-100 dark:bg-slate-900 text-foreground font-mono font-bold">10 pts</div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium">Passing Score</label>
                    <div className="p-1.5 rounded-sm bg-slate-100 dark:bg-slate-900 text-foreground font-mono font-bold">75% required</div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium">Timer Limit</label>
                    <div className="p-1.5 rounded-sm bg-slate-100 dark:bg-slate-900 text-foreground font-mono font-bold">15 minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solid High-Contrast Stats Banner (No Gradients, No Shadow) */}
      <section className="max-w-6xl mx-auto">
        <div className="bg-slate-900 text-slate-100 dark:bg-slate-900/90 dark:border dark:border-slate-800 rounded-xl p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="inline-flex items-center justify-center size-8 rounded-md bg-blue-500/20 text-blue-400 mb-1">
                <Zap className="size-4" />
              </div>
              <p className="font-heading text-2xl sm:text-3xl font-extrabold text-white">16+</p>
              <p className="text-xs text-slate-400 font-medium">Rich Field Types</p>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center justify-center size-8 rounded-md bg-emerald-500/20 text-emerald-400 mb-1">
                <ShieldCheck className="size-4" />
              </div>
              <p className="font-heading text-2xl sm:text-3xl font-extrabold text-white">100%</p>
              <p className="text-xs text-slate-400 font-medium">Schema Validated</p>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center justify-center size-8 rounded-md bg-amber-500/20 text-amber-400 mb-1">
                <Clock className="size-4" />
              </div>
              <p className="font-heading text-2xl sm:text-3xl font-extrabold text-white">&lt; 100ms</p>
              <p className="text-xs text-slate-400 font-medium">Response Latency</p>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center justify-center size-8 rounded-md bg-purple-500/20 text-purple-400 mb-1">
                <Trophy className="size-4" />
              </div>
              <p className="font-heading text-2xl sm:text-3xl font-extrabold text-white">Auto</p>
              <p className="text-xs text-slate-400 font-medium">Grading Engine</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section with Solid Distinct Pastel Backgrounds (No Shadow) */}
      <section className="space-y-8 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Engineered for Precision &amp; Delight
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Everything you need to collect structured data, grade assessments, and publish in one click.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Solid Sky Blue Tint */}
          <div className="p-6 space-y-3.5 rounded-lg border border-sky-200 dark:border-sky-900 bg-sky-50/70 dark:bg-sky-950/20">
            <div className="size-10 rounded-md bg-sky-600 text-white flex items-center justify-center">
              <Layers className="size-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">
              Dynamic Visual Canvas
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Drag-and-drop 16+ rich field types including short text, radio groups, multi-select checkboxes, star ratings, and file uploads.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-sky-700 dark:text-sky-300 text-xs font-semibold">
              <Check className="size-3.5" />
              <span>Real-time drag reordering</span>
            </div>
          </div>

          {/* Card 2: Solid Amber/Gold Tint */}
          <div className="p-6 space-y-3.5 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20">
            <div className="size-10 rounded-md bg-amber-600 text-white flex items-center justify-center">
              <Trophy className="size-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">
              Scored Assessment Engine
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Define question points, passing thresholds, countdown timers, and instant answer reveals for online tests and certifications.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <Check className="size-3.5" />
              <span>Automated score calculations</span>
            </div>
          </div>

          {/* Card 3: Solid Indigo/Purple Tint */}
          <div className="p-6 space-y-3.5 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/20">
            <div className="size-10 rounded-md bg-indigo-600 text-white flex items-center justify-center">
              <Sliders className="size-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">
              Multi-Step &amp; Sections
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Organize complex surveys into clean chapters and steps with real-time respondent progress indicators and mobile responsiveness.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              <Check className="size-3.5" />
              <span>Step-by-step progress tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* Archetypes Section with Solid Slate Background Container (No Shadow) */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/50 p-8 sm:p-10 space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase text-blue-600 dark:text-blue-400 font-bold">Use Cases</span>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground mt-1">
              Whatever you need to ask, FormCraft handles it.
            </h2>
          </div>
          <Link href="/forms/new">
            <Button size="sm" className="cursor-pointer gap-1.5 text-xs font-semibold h-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
              Start with a Template
              <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Solid White/Slate Card with Blue Accent */}
          <div className="p-5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-950 space-y-3">
            <div className="size-9 rounded-md bg-blue-600 text-white flex items-center justify-center">
              <FileText className="size-4" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground">Standard Forms</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Inquiries, lead gen, registrations, and job applications.</p>
            </div>
            <span className="inline-block px-2 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold">
              FORM ARCHETYPE
            </span>
          </div>

          {/* Card 2: Solid White/Slate Card with Amber Accent */}
          <div className="p-5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-950 space-y-3">
            <div className="size-9 rounded-md bg-amber-600 text-white flex items-center justify-center">
              <Trophy className="size-4" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground">Interactive Quizzes</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Graded evaluations, timed tests, and certifications.</p>
            </div>
            <span className="inline-block px-2 py-0.5 rounded-xs bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold">
              QUIZ ARCHETYPE
            </span>
          </div>

          {/* Card 3: Solid White/Slate Card with Purple Accent */}
          <div className="p-5 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-950 space-y-3">
            <div className="size-9 rounded-md bg-purple-600 text-white flex items-center justify-center">
              <ClipboardCheck className="size-4" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground">Customer Surveys</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">CSAT, Net Promoter Score (NPS), and market research.</p>
            </div>
            <span className="inline-block px-2 py-0.5 rounded-xs bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-bold">
              SURVEY ARCHETYPE
            </span>
          </div>

          {/* Card 4: Solid White/Slate Card with Emerald Accent */}
          <div className="p-5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-950 space-y-3">
            <div className="size-9 rounded-md bg-emerald-600 text-white flex items-center justify-center">
              <MessageSquare className="size-4" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground">Feedback &amp; Polls</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Bug reports, feature upvoting, and instant voting tallies.</p>
            </div>
            <span className="inline-block px-2 py-0.5 rounded-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
              POLL ARCHETYPE
            </span>
          </div>
        </div>
      </section>

      {/* How it Works Section with Solid Distinct Step Cards (No Shadow) */}
      <section className="space-y-8 max-w-5xl mx-auto text-center">
        <div className="space-y-2">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            How FormCraft Works
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Three simple steps from blank canvas to live production submissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Step 1: Solid Light Blue Tint */}
          <div className="p-6 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="size-7 rounded-sm bg-blue-600 text-white flex items-center justify-center text-xs font-mono font-bold">
                01
              </span>
              <span className="text-[10px] font-mono uppercase text-blue-700 dark:text-blue-300 font-bold">SETUP</span>
            </div>
            <h4 className="font-heading text-sm font-bold text-foreground">Pick Archetype</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select standard form, quiz, survey, feedback, or poll to initialize tailored database logic.
            </p>
          </div>

          {/* Step 2: Solid Light Indigo Tint */}
          <div className="p-6 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="size-7 rounded-sm bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">
                02
              </span>
              <span className="text-[10px] font-mono uppercase text-indigo-700 dark:text-indigo-300 font-bold">BUILD</span>
            </div>
            <h4 className="font-heading text-sm font-bold text-foreground">Customize Questions</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Drag fields into place, configure required validations, and organize multi-step chapters.
            </p>
          </div>

          {/* Step 3: Solid Light Emerald Tint */}
          <div className="p-6 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="size-7 rounded-sm bg-emerald-600 text-white flex items-center justify-center text-xs font-mono font-bold">
                03
              </span>
              <span className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-300 font-bold">SHARE</span>
            </div>
            <h4 className="font-heading text-sm font-bold text-foreground">Publish &amp; Preview</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Preview in a dedicated responsive tab and publish live with custom URL slugs and instant results.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section - Solid Deep Navy/Slate Box (No Gradients, No Shadow) */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 dark:bg-slate-950 p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-blue-400 border border-slate-700 text-xs font-semibold">
          <Sparkles className="size-3.5" />
          <span>Instant Setup • No Credit Card Required</span>
        </div>

        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Ready to experience modern form building?
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          Start building forms, quizzes, and surveys with real-time FastAPI integration and automated scoring.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/forms/new">
            <Button size="lg" className="cursor-pointer gap-2 text-xs font-semibold h-10 px-6 rounded-md bg-blue-600 hover:bg-blue-500 text-white">
              <Sparkles className="size-3.5" />
              Create Form Now
            </Button>
          </Link>
          <Link href="/forms">
            <Button variant="outline" size="lg" className="cursor-pointer text-xs font-semibold h-10 px-6 rounded-md border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white">
              Go to Workspace
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer with Solid Tinted Background */}
      <footer className="pt-6 pb-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-foreground">FormCraft Studio</span>
          <span>&copy; 2026 All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/forms" className="hover:text-foreground transition-colors">Workspace</Link>
          <Link href="/forms/new" className="hover:text-foreground transition-colors">New Form</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
        </div>
      </footer>
    </div>
  );
}
