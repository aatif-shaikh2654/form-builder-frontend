'use client';

import React, { useMemo } from 'react';
import type { FieldsResponse, SectionResponse } from '@/types/api.types';
import { getSectionGridClass } from '@/features/builder/constants/layout.constants';
import { FormFieldRenderer } from './FormFieldRenderer';
import { computeFieldVisibility } from '../utils/fieldConditions';
import { getAllFormFields } from '../utils/formRendererUtils';

export interface FormBodyRendererProps {
  sections?: SectionResponse[] | null;
  fields?: FieldsResponse[] | null;
  answers: Record<string, unknown>;
  onInputChange: (fieldId: string, value: unknown) => void;
  errors?: Record<string, string>;
  device?: 'desktop' | 'tablet' | 'mobile';
  disabled?: boolean;
}

const EMPTY_SECTIONS: SectionResponse[] = [];
const EMPTY_FIELDS: FieldsResponse[] = [];

export const FormBodyRenderer: React.FC<FormBodyRendererProps> = ({
  sections = EMPTY_SECTIONS,
  fields = EMPTY_FIELDS,
  answers,
  onInputChange,
  errors,
  device = 'desktop',
  disabled = false,
}) => {
  const safeSections = sections ?? EMPTY_SECTIONS;
  const safeFields = fields ?? EMPTY_FIELDS;

  // Extract all fields across root and sections, ensuring section_id is consistently populated
  const allExtractedFields = useMemo(() => {
    return getAllFormFields(safeSections, safeFields);
  }, [safeSections, safeFields]);

  const fieldVisibility = useMemo(() => {
    return computeFieldVisibility(allExtractedFields, answers);
  }, [allExtractedFields, answers]);

  const unassignedFields = useMemo(() => {
    return allExtractedFields.filter(
      (f) => !f.section_id || !safeSections.some((s) => s.id === f.section_id)
    );
  }, [allExtractedFields, safeSections]);

  const rootItems = useMemo(() => {
    return [
      ...safeSections.map((s) => ({
        type: 'section' as const,
        id: s.id,
        position: s.position ?? 0,
        section: s,
      })),
      ...unassignedFields.map((f) => ({
        type: 'field' as const,
        id: f.id,
        position: f.position ?? 0,
        field: f,
      })),
    ].sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return a.type === 'section' ? -1 : 1;
    });
  }, [safeSections, unassignedFields]);

  if (rootItems.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md">
        No questions added to this form yet. Open the builder to add fields.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rootItems.map((item) => {
        if (item.type === 'section') {
          const sec = item.section;
          if (sec.is_visible === false) return null;

          const rawSecFields =
            Array.isArray(sec.fields) && sec.fields.length > 0
              ? sec.fields.map((f) => ({ ...f, section_id: f.section_id || sec.id }))
              : allExtractedFields.filter((f) => f.section_id === sec.id);

          const secFields = [...rawSecFields].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0)
          );

          const visibleSecFields = secFields.filter(
            (f) => fieldVisibility[f.id] !== false
          );

          if (visibleSecFields.length === 0) return null;

          const gridClass = getSectionGridClass(
            sec.layout_type,
            sec.column_count || 1,
            (sec.layout_config as { gap?: string })?.gap || 'md',
            device
          );

          return (
            <div
              key={sec.id}
              className="space-y-3.5 p-4 sm:p-5 rounded-lg border border-border/70 bg-card/40"
            >
              {sec.title && (
                <div className="border-b border-border/60 pb-2">
                  <h2 className="font-heading text-sm sm:text-base font-bold text-foreground">
                    {sec.title}
                  </h2>
                  {sec.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line leading-relaxed">
                      {sec.description}
                    </p>
                  )}
                </div>
              )}

              <div className={gridClass}>
                {visibleSecFields.map((field) => (
                  <FormFieldRenderer
                    key={field.id}
                    field={field}
                    value={answers[field.id]}
                    onChange={onInputChange}
                    disabled={disabled}
                    error={errors?.[field.id]}
                  />
                ))}
              </div>
            </div>
          );
        }

        if (fieldVisibility[item.field.id] === false) return null;

        return (
          <FormFieldRenderer
            key={item.field.id}
            field={item.field}
            value={answers[item.field.id]}
            onChange={onInputChange}
            disabled={disabled}
            error={errors?.[item.field.id]}
          />
        );
      })}
    </div>
  );
};
