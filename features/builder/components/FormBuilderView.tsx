'use client';

import React from 'react';
import { useBuilderStore } from '../store/builderStore';
import { ElementPalette } from './ElementPalette';
import { BuilderCanvas } from './BuilderCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { FormPreview } from './FormPreview';
import { BuilderToolbar } from './BuilderToolbar';
import { FormSettingsView } from './FormSettingsView';
import { QuizSettingsView } from './QuizSettingsView';
import { SectionSettingsForm } from './SectionSettingsDialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

export const FormBuilderView: React.FC = () => {
  const {
    formType,
    activeBuilderTab,
    activeDrawer,
    setActiveDrawer,
    selectedFieldId,
    setSelectedFieldId,
    editingSectionId,
    setEditingSectionId,
    sections,
    updateSection,
  } = useBuilderStore();

  const editingSection = sections.find((s) => s.id === editingSectionId) || null;

  return (
    <div className="space-y-4">
      <BuilderToolbar />

      {/* When full preview mode is active */}
      {activeBuilderTab === 'preview' ? (
        <FormPreview />
      ) : (
        /* Main 2-column layout: Left Palette (fields & sections), Right Canvas (extra width) */
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start w-full">
          {/* Left: Element & Section Palette */}
          <ElementPalette />

          {/* Right: Drag-and-drop Canvas taking all remaining width */}
          <BuilderCanvas />
        </div>
      )}

      {/* Slide-over Sheet: Form Settings & Overview */}
      <Sheet
        open={activeDrawer === 'settings'}
        onOpenChange={(open) => {
          if (!open) setActiveDrawer(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl">
          <SheetHeader>
            <SheetTitle>Form Settings &amp; Overview</SheetTitle>
            <SheetDescription>
              Manage form identity, description, status, submission policies, and scheduling.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <FormSettingsView onClose={() => setActiveDrawer(null)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Slide-over Sheet: Quiz Rules & Assessment (Only for QUIZ form type) */}
      {formType === 'QUIZ' && (
        <Sheet
          open={activeDrawer === 'quiz'}
          onOpenChange={(open) => {
            if (!open) setActiveDrawer(null);
          }}
        >
          <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl">
            <SheetHeader>
              <SheetTitle>Quiz Rules &amp; Scoring</SheetTitle>
              <SheetDescription>
                Configure time limits, passing scores, maximum attempts, and answer reveals.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <QuizSettingsView onClose={() => setActiveDrawer(null)} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Slide-over Sheet: Field Inspector */}
      <Sheet
        open={Boolean(selectedFieldId)}
        onOpenChange={(open) => {
          if (!open) setSelectedFieldId(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg">
          <SheetHeader>
            <SheetTitle>Field Inspector</SheetTitle>
            <SheetDescription>
              Customize question label, placeholder, options, validation, and section assignments.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <PropertiesPanel onClose={() => setSelectedFieldId(null)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Slide-over Sheet: Section Settings */}
      <Sheet
        open={Boolean(editingSectionId)}
        onOpenChange={(open) => {
          if (!open) setEditingSectionId(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Section Settings</SheetTitle>
            <SheetDescription>
              Configure columns (1–12), responsive grid layouts, spacing, and visibility rules.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {editingSection && (
              <SectionSettingsForm
                key={editingSection.id}
                section={editingSection}
                onSave={(secId, updates) => {
                  updateSection(secId, updates);
                  setEditingSectionId(null);
                }}
                onCancel={() => setEditingSectionId(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
