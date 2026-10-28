'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import type { SectionResponse, FieldsResponse, FieldType } from '@/types/api.types';
import { SortableElementItem } from './SortableElementItem';
import {
  getSectionGridClass,
} from '../constants/layout.constants';
import { useBuilderStore } from '../store/builderStore';
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Settings2,
  Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface SortableSectionCardProps {
  section: SectionResponse;
  sectionIndex: number;
  totalSections: number;
  fields: FieldsResponse[];
  isSelected: boolean;
  forceCollapsed?: boolean | null;
  onSelectSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string, sectionTitle: string) => void;
  onUpdateSection: (sectionId: string, updates: Partial<SectionResponse>) => void;
  onAddFieldToSection?: (sectionId: string) => void;
  onDropField?: (sectionId: string, fieldType: FieldType) => void;
  onDropFieldAt?: (fieldType: FieldType, targetFieldId: string, position: 'before' | 'after') => void;
}

interface SectionDropZoneProps {
  sectionId: string;
  sectionTitle?: string;
  isEmpty: boolean;
  onDropField?: (sectionId: string, fieldType: FieldType) => void;
  onSelectSection?: () => void;
}

const SectionDropZone: React.FC<SectionDropZoneProps> = ({
  sectionId,
  sectionTitle,
  isEmpty,
  onDropField,
  onSelectSection,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `section-drop-${sectionId}` });
  const [isHtmlDragOver, setIsHtmlDragOver] = useState(false);

  const active = isOver || isHtmlDragOver;

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/json')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (!isHtmlDragOver) setIsHtmlDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsHtmlDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsHtmlDragOver(false);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data.type === 'field' && data.fieldType && onDropField) {
        e.preventDefault();
        e.stopPropagation();
        onDropField(sectionId, data.fieldType);
      }
    } catch {
      // ignore
    }
  };

  if (isEmpty) {
    return (
      <div
        ref={setNodeRef}
        id={`section-drop-${sectionId}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSection?.();
        }}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-all text-center cursor-pointer ${
          active
            ? 'border-primary bg-primary/10 text-primary scale-[1.01]'
            : 'border-border/80 bg-muted/15 hover:border-primary/50 hover:bg-muted/25'
        }`}
      >
        <div
          className={`size-9 rounded-md flex items-center justify-center mb-2 transition-colors pointer-events-none ${
            active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground/70'
          }`}
        >
          <Plus className="size-4" />
        </div>
        <p className="text-xs font-semibold text-foreground pointer-events-none">
          {active
            ? `Release to add question to ${sectionTitle || 'this section'}`
            : `Drop question here to add to ${sectionTitle || 'this section'}`}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1 max-w-xs pointer-events-none">
          Drag questions from the left palette or click here to focus this section.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      id={`section-drop-${sectionId}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        e.stopPropagation();
        onSelectSection?.();
      }}
      className={`border-2 border-dashed rounded-md transition-all flex items-center justify-center py-3 px-4 text-center cursor-pointer ${
        active
          ? 'border-primary bg-primary/10 text-primary scale-[1.01]'
          : 'border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-muted/20 text-muted-foreground/70'
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium pointer-events-none">
        <Plus className="size-3.5 text-primary" />
        <span>
          {active
            ? `Release to add to ${sectionTitle || 'section'}`
            : `Drop question here to add to ${sectionTitle || 'section'}`}
        </span>
      </div>
    </div>
  );
};

export const SortableSectionCard: React.FC<SortableSectionCardProps> = ({
  section,
  sectionIndex,
  fields,
  isSelected,
  forceCollapsed,
  onSelectSection,
  onDeleteSection,
  onUpdateSection,
  onDropField,
  onDropFieldAt,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(section.title || `Section ${sectionIndex + 1}`);
  const [descriptionText, setDescriptionText] = useState(section.description || '');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [prevForceCollapsed, setPrevForceCollapsed] = useState(forceCollapsed);
  const [isDragOverForField, setIsDragOverForField] = useState(false);
  const setEditingSectionId = useBuilderStore((state) => state.setEditingSectionId);

  if (forceCollapsed !== prevForceCollapsed) {
    setPrevForceCollapsed(forceCollapsed);
    if (forceCollapsed !== undefined && forceCollapsed !== null) {
      setIsCollapsed(forceCollapsed);
    }
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: {
      type: 'section',
      section,
    },
  });

  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    const trimmed = titleText.trim() || `Section ${sectionIndex + 1}`;
    setTitleText(trimmed);
    if (trimmed !== section.title) {
      onUpdateSection(section.id, { title: trimmed });
    }
  };

  const handleDescriptionBlur = () => {
    const trimmed = descriptionText.trim();
    if (trimmed !== (section.description || '')) {
      onUpdateSection(section.id, { description: trimmed || null });
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = section.is_visible !== false ? false : true;
    onUpdateSection(section.id, { is_visible: nextVal });
    if (nextVal) {
      toast.success(`"${section.title}" is now visible to respondents`);
    } else {
      toast.info(`"${section.title}" is now hidden from respondents`);
    }
  };

  const isVisible = section.is_visible !== false;
  const isMultiCol = section.layout_type === 'GRID' && (section.column_count || 1) > 1;
  const columnCount = section.column_count || 1;
  const gap = (section.layout_config as { gap?: string })?.gap || 'md';

  const gridClass = getSectionGridClass(section.layout_type, columnCount, gap);
  const sortingStrategy = isMultiCol ? rectSortingStrategy : verticalListSortingStrategy;

  return (
    <>
      <div
        id={`section-${section.id}`}
        ref={setNodeRef}
        style={style}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('application/json')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            if (!isDragOverForField) setIsDragOverForField(true);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOverForField(false);
          }
        }}
        onDrop={(e) => {
          setIsDragOverForField(false);
          try {
            const dataStr = e.dataTransfer.getData('application/json');
            if (!dataStr) return;
            const data = JSON.parse(dataStr);
            if (data.type === 'field' && data.fieldType && onDropField) {
              e.preventDefault();
              e.stopPropagation();
              onDropField(section.id, data.fieldType);
            }
          } catch {
            // fallback
          }
        }}
        className={`rounded-lg border bg-card transition-all relative group/section ${
          isDragOverForField
            ? 'border-primary ring-2 ring-primary/40 bg-primary/[0.03]'
            : isSelected
            ? 'border-primary/80 ring-1 ring-primary/20'
            : isVisible
            ? 'border-border'
            : 'border-dashed border-border/80 bg-muted/15'
        } ${isDragging ? 'border-dashed border-2 border-primary/60 bg-primary/5 z-20' : ''}`}
        onClick={() => onSelectSection(section.id)}
      >
        {/* Floating Hover Action Overlay: Smoothly slides in from top when hovered or selected */}
        <div
          className={`absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-background/95 backdrop-blur-md border border-border/80 shadow-sm rounded-md p-0.5 transition-all duration-200 ease-out z-10 ${
            isSelected
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-2 pointer-events-none group-hover/section:opacity-100 group-hover/section:translate-y-0 group-hover/section:pointer-events-auto'
          }`}
        >
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing size-6 rounded flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors touch-none select-none"
            title="Drag to rearrange section"
            aria-label="Drag to rearrange section"
          >
            <GripVertical className="size-3.5" />
          </button>

          {/* Quick Visibility Toggle */}
          <button
            type="button"
            onClick={handleToggleVisibility}
            className={`cursor-pointer size-6 rounded flex items-center justify-center transition-colors ${
              !isVisible
                ? 'text-amber-500 bg-amber-500/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={
              isVisible
                ? 'Section is visible (click to hide from respondents)'
                : 'Section is hidden (click to make visible)'
            }
          >
            {isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          </button>

          {/* Section Settings Sheet Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditingSectionId(section.id);
            }}
            className="cursor-pointer size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Open Section Settings (Slide-over Sheet)"
          >
            <Settings2 className="size-3.5" />
          </button>

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="cursor-pointer size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={isCollapsed ? 'Expand section questions' : 'Collapse section questions'}
          >
            {isCollapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSection(section.id, section.title);
            }}
            className="cursor-pointer size-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete this section"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-muted/20 border-b border-border/80 rounded-t-lg pr-36">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Section Title */}
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <Input
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleBlur();
                  }}
                  autoFocus
                  className="h-7 text-xs sm:text-sm font-semibold px-2 py-1 w-full max-w-sm"
                />
              ) : (
                <h3
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="font-heading font-semibold text-xs sm:text-sm text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                  title="Click to edit section title"
                >
                  {section.title || `Section ${sectionIndex + 1}`}
                </h3>
              )}
            </div>

            {/* Visibility Badge if Hidden */}
            {!isVisible && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30 gap-1 px-1.5 py-0 shrink-0"
              >
                <EyeOff className="size-2.5" />
                <span>Hidden</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Section Subtitle / Description */}
        {!isCollapsed && (
          <div className="px-4 sm:px-6 pt-2.5 pb-1">
            <Input
              value={descriptionText}
              placeholder="Optional section description or instructions..."
              onChange={(e) => setDescriptionText(e.target.value)}
              onBlur={handleDescriptionBlur}
              className="h-6.5 text-[11px] bg-transparent border-transparent hover:border-border focus:border-input px-1.5 text-muted-foreground placeholder:text-muted-foreground/60 transition-colors"
            />
          </div>
        )}

        {/* Section Fields Area with Multi-Column Grid & Drop Area */}
        {!isCollapsed && (
          <div className="p-4 sm:p-6 pt-2 space-y-3">
            {fields.length === 0 ? (
              <SectionDropZone
                sectionId={section.id}
                sectionTitle={section.title || `Section ${sectionIndex + 1}`}
                isEmpty={true}
                onDropField={onDropField}
                onSelectSection={() => onSelectSection(section.id)}
              />
            ) : (
              (() => {
                const sortedFields = [...fields].sort(
                  (a, b) => (a.position ?? 0) - (b.position ?? 0)
                );
                return (
                  <>
                    <SortableContext items={sortedFields.map((f) => f.id)} strategy={sortingStrategy}>
                      <div className={gridClass}>
                        {sortedFields.map((field) => (
                          <SortableElementItem
                            key={field.id}
                            field={field}
                            onDropFieldAt={onDropFieldAt}
                          />
                        ))}
                      </div>
                    </SortableContext>

                    {/* Drop area inside section when fields already exist */}
                    <SectionDropZone
                      sectionId={section.id}
                      sectionTitle={section.title || `Section ${sectionIndex + 1}`}
                      isEmpty={false}
                      onDropField={onDropField}
                      onSelectSection={() => onSelectSection(section.id)}
                    />
                  </>
                );
              })()
            )}
          </div>
        )}
      </div>
    </>
  );
};
