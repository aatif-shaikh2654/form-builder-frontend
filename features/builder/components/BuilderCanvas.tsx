'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DropAnimation,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  pointerWithin,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useBuilderStore } from '../store/builderStore';
import { useConfirmationStore } from '@/store/useConfirmationStore';
import { SortableElementItem } from './SortableElementItem';
import { SortableSectionCard } from './SortableSectionCard';
import type { SectionResponse, LayoutType, FieldType } from '@/types/api.types';
import { createDefaultField } from '../constants/builder.constants';
import {
  SECTION_LAYOUT_PRESETS,
  DEFAULT_SECTION_LAYOUT,
  generateSectionId,
} from '../constants/layout.constants';
import { LayoutWireframe } from './LayoutWireframe';
import {
  Sparkles,
  Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CanvasDropZoneProps {
  id: string;
  onDropItem: (e: React.DragEvent) => void;
  label?: string;
}

const CanvasBottomDropZone: React.FC<CanvasDropZoneProps> = ({ id, onDropItem, label }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [isHtmlDragOver, setIsHtmlDragOver] = useState(false);

  const active = isOver || isHtmlDragOver;

  return (
    <div
      ref={setNodeRef}
      id={id}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/json')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          setIsHtmlDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsHtmlDragOver(false);
        }
      }}
      onDrop={(e) => {
        setIsHtmlDragOver(false);
        onDropItem(e);
      }}
      className={`rounded-lg border-2 border-dashed transition-all duration-200 flex items-center justify-center py-5 text-center cursor-pointer ${
        active
          ? 'border-primary bg-primary/10 text-primary scale-[1.01] shadow-xs'
          : 'border-border/60 hover:border-primary/40 hover:bg-muted/30 text-muted-foreground/70'
      }`}
    >
      <div className="flex items-center gap-2 text-xs pointer-events-none">
        <Plus className="size-3.5 text-primary" />
        <span className="font-medium">
          {active
            ? 'Release to drop on canvas'
            : label || 'Drop sections or questions here to add to canvas'}
        </span>
      </div>
    </div>
  );
};

interface CanvasEmptyDropZoneProps {
  onAddSection: (layoutType: LayoutType, columnCount: number) => void;
  onDropItem: (e: React.DragEvent) => void;
}

const CanvasEmptyDropZone: React.FC<CanvasEmptyDropZoneProps> = ({ onAddSection, onDropItem }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-empty-drop' });
  const [isHtmlDragOver, setIsHtmlDragOver] = useState(false);

  const active = isOver || isHtmlDragOver;

  return (
    <div
      ref={setNodeRef}
      id="canvas-empty-drop"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/json')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          setIsHtmlDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsHtmlDragOver(false);
        }
      }}
      onDrop={(e) => {
        setIsHtmlDragOver(false);
        onDropItem(e);
      }}
      className={`rounded-xl border-2 border-dashed p-10 sm:p-14 flex flex-col items-center justify-center text-center transition-all duration-200 ${
        active
          ? 'border-primary bg-primary/10 text-primary scale-[1.01] shadow-sm'
          : 'border-border/80 bg-card/40 hover:border-primary/50'
      }`}
    >
      <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 pointer-events-none">
        <Sparkles className="size-6" />
      </div>
      <h3 className="font-heading text-base font-semibold text-foreground">
        {active ? 'Release to drop on canvas' : 'Draggable Canvas Area'}
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1">
        Drag sections or question fields from the left palette and drop them anywhere here to start building your form.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-6 max-w-md w-full">
        {SECTION_LAYOUT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onAddSection(preset.layout_type, preset.column_count)}
            className="p-2.5 rounded-lg border border-border bg-card hover:border-primary/60 hover:bg-primary/5 transition-all text-left flex flex-col gap-1.5 group cursor-pointer shadow-2xs"
          >
            <LayoutWireframe columns={preset.iconColumns} className="h-6 w-full" />
            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
              {preset.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const BuilderCanvas: React.FC = () => {
  const {
    formId,
    fields,
    sections,
    title,
    description,
    setTitle,
    setDescription,
    selectedSectionId,
    setSelectedSectionId,
    reorderFields,
    reorderRootItems,
    moveFieldToSection,
    addSection,
    updateSection,
    removeSection,
    addField,
  } = useBuilderStore();

  const confirm = useConfirmationStore((s) => s.confirm);
  const [activeDropIndex, setActiveDropIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Direct / unassigned fields belonging to the form root
  const rootFields = fields.filter(
    (f) => !f.section_id || !sections.some((s) => s.id === f.section_id)
  );

  // Unified list of root canvas items (both sections and root fields interleaved)
  const rootItems = [
    ...sections.map((s) => ({
      type: 'section' as const,
      id: s.id,
      position: s.position ?? 0,
      section: s,
    })),
    ...rootFields.map((f) => ({
      type: 'field' as const,
      id: f.id,
      position: f.position ?? 0,
      field: f,
    })),
  ].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    if (a.type !== b.type) return a.type === 'section' ? -1 : 1;
    return 0;
  });

  const customCollisionDetection = React.useCallback(
    (args: Parameters<typeof pointerWithin>[0]) => {
      const activeId = String(args.active.id);
      const isFieldDrag = fields.some((f) => f.id === activeId);
      const isSectionDrag = sections.some((s) => s.id === activeId);

      // 1. First get all droppables that intersect with pointer
      const pointerCollisions = pointerWithin(args);

      if (isFieldDrag) {
        // When dragging a field:
        // Priority 1: Another Question Field
        const fieldCollisions = pointerCollisions.filter((c) =>
          fields.some((f) => f.id === c.id && f.id !== activeId)
        );
        if (fieldCollisions.length > 0) {
          return fieldCollisions;
        }

        // Priority 2: Section internal drop zones (section-drop-*)
        const dropZoneCollisions = pointerCollisions.filter((c) =>
          String(c.id).startsWith('section-drop-')
        );
        if (dropZoneCollisions.length > 0) {
          return dropZoneCollisions;
        }

        // Priority 3: Canvas bottom or empty drop zones
        const canvasDropCollisions = pointerCollisions.filter(
          (c) => c.id === 'canvas-bottom-drop' || c.id === 'canvas-empty-drop'
        );
        if (canvasDropCollisions.length > 0) {
          return canvasDropCollisions;
        }

        // Priority 4: Section card itself (if pointer is over section header or empty space)
        const sectionCollisions = pointerCollisions.filter((c) =>
          sections.some((s) => s.id === c.id)
        );
        if (sectionCollisions.length > 0) {
          return sectionCollisions;
        }

        // Fallback to closestCenter prioritizing fields
        const closest = closestCenter(args);
        const closestField = closest.filter((c) =>
          fields.some((f) => f.id === c.id && f.id !== activeId)
        );
        if (closestField.length > 0) {
          return closestField;
        }
        return closest;
      }

      if (isSectionDrag) {
        // When dragging a section:
        // Priority: other root items (sections or root fields) and canvas bottom drop zone
        const rootItemCollisions = pointerCollisions.filter(
          (c) =>
            rootItems.some((item) => item.id === c.id && item.id !== activeId) ||
            c.id === 'canvas-bottom-drop' ||
            c.id === 'canvas-empty-drop'
        );
        if (rootItemCollisions.length > 0) {
          return rootItemCollisions;
        }

        const closest = closestCenter(args);
        const closestRoot = closest.filter(
          (c) =>
            rootItems.some((item) => item.id === c.id && item.id !== activeId) ||
            c.id === 'canvas-bottom-drop'
        );
        if (closestRoot.length > 0) {
          return closestRoot;
        }
        return closest;
      }

      // Default fallback
      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }
      return closestCenter(args);
    },
    [fields, sections, rootItems]
  );

  const dropAnimationConfig: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
    duration: 250,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
  };

  const activeField = fields.find((f) => f.id === activeId);
  const activeSection = sections.find((s) => s.id === activeId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentActiveId = String(active.id);
    const overId = String(over.id);

    const draggedField = fields.find((f) => f.id === currentActiveId);
    if (!draggedField) return;

    const overField = fields.find((f) => f.id === overId);
    if (overField) {
      if (draggedField.section_id !== overField.section_id) {
        const targetSecId = overField.section_id;
        const secFields = fields.filter((f) => f.section_id === targetSecId);
        const overIdx = secFields.findIndex((f) => f.id === overId);
        moveFieldToSection(currentActiveId, targetSecId, overIdx >= 0 ? overIdx : undefined);
      }
      return;
    }

    const overSection =
      sections.find((s) => s.id === overId) ||
      sections.find((s) => `section-drop-${s.id}` === overId);

    if (overSection && draggedField.section_id !== overSection.id) {
      moveFieldToSection(currentActiveId, overSection.id);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // 1. Is a Section being dragged?
    const isSectionDrag = sections.some((s) => s.id === activeId);
    if (isSectionDrag) {
      if (overId === 'canvas-bottom-drop' || overId === 'canvas-empty-drop') {
        const lastRootItem = rootItems[rootItems.length - 1];
        if (lastRootItem && lastRootItem.id !== activeId) {
          reorderRootItems(activeId, lastRootItem.id);
        }
        return;
      }

      // Check if dropped over a root item (section or root field)
      const isOverRootItem = rootItems.some((item) => item.id === overId);
      if (isOverRootItem) {
        reorderRootItems(activeId, overId);
        return;
      }

      // If dropped over a field inside another section, reorder with that section
      const overField = fields.find((f) => f.id === overId);
      if (overField && overField.section_id && overField.section_id !== activeId) {
        reorderRootItems(activeId, overField.section_id);
        return;
      }
      return;
    }

    // 2. Is a Field being dragged?
    const activeField = fields.find((f) => f.id === activeId);
    if (activeField) {
      // 2A. Dropped directly on a section's dedicated internal drop zone (e.g. section-drop-secId)
      const targetSectionFromDropZone = sections.find(
        (s) => `section-drop-${s.id}` === overId
      );
      if (targetSectionFromDropZone) {
        moveFieldToSection(activeId, targetSectionFromDropZone.id);
        return;
      }

      // 2B. Dropped on bottom canvas drop zone
      if (overId === 'canvas-bottom-drop' || overId === 'canvas-empty-drop') {
        if (activeField.section_id) {
          moveFieldToSection(activeId, null);
        }
        const lastRootItem = rootItems[rootItems.length - 1];
        if (lastRootItem && lastRootItem.id !== activeId) {
          reorderRootItems(activeId, lastRootItem.id);
        }
        return;
      }

      // 2C. Dropped on another Section card directly in root list -> move into that section
      const overSection = sections.find((s) => s.id === overId);
      if (overSection) {
        if (activeField.section_id !== overSection.id) {
          moveFieldToSection(activeId, overSection.id);
        }
        return;
      }

      // 2D. Dropped over another Field
      const overField = fields.find((f) => f.id === overId);
      if (overField) {
        // Both in the same section -> reorder inside section
        if (activeField.section_id && activeField.section_id === overField.section_id) {
          reorderFields(activeId, overId);
          return;
        }

        // Both at root -> reorder at root level
        const isBothRoot =
          (!activeField.section_id || !sections.some((s) => s.id === activeField.section_id)) &&
          (!overField.section_id || !sections.some((s) => s.id === overField.section_id));
        if (isBothRoot) {
          reorderRootItems(activeId, overId);
          return;
        }

        // Active was at root, overField is inside a section -> move into section at overField's index
        if (overField.section_id) {
          const secFields = fields.filter((f) => f.section_id === overField.section_id);
          const overIdx = secFields.findIndex((f) => f.id === overId);
          moveFieldToSection(activeId, overField.section_id, overIdx);
          return;
        }

        // Active was inside a section, overField is at root -> move out to root next to overField
        if (activeField.section_id) {
          moveFieldToSection(activeId, null);
        }
        reorderRootItems(activeId, overId);
        return;
      }
    }
  };

  const handleAddSectionWithLayout = async (
    layoutType: LayoutType = DEFAULT_SECTION_LAYOUT.layout_type,
    columnCount: number = DEFAULT_SECTION_LAYOUT.column_count,
    insertIndex?: number
  ) => {
    const tempId = generateSectionId();
    const newSection: SectionResponse = {
      id: tempId,
      form_id: formId || '',
      title: `Section ${sections.length + 1}`,
      description: null,
      position: insertIndex !== undefined ? insertIndex : rootItems.length,
      layout_type: layoutType,
      column_count: columnCount,
      layout_config: { gap: 'md', collapse_on_mobile: true },
      is_visible: true,
      fields: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addSection(newSection, insertIndex);
    setSelectedSectionId(tempId);
    toast.success(`Added ${layoutType === 'GRID' ? `${columnCount}-Column Grid` : 'Single Column'} Section`);
  };

  const handleDeleteSection = async (sectionId: string, sectionTitle: string) => {
    const ok = await confirm({
      title: 'Delete Section?',
      description: `Are you sure you want to delete "${sectionTitle || 'this section'}"? Questions in this section will become unassigned and remain on your canvas.`,
      confirmText: 'Delete Section',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (ok) {
      removeSection(sectionId);
      toast.success('Section removed');
    }
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<SectionResponse>) => {
    updateSection(sectionId, updates);
  };

  const handleAddFieldToSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
  };

  const handleDropField = (sectionId: string | null, type: FieldType, insertIndex?: number) => {
    const position =
      insertIndex !== undefined
        ? insertIndex
        : sectionId
        ? fields.filter((f) => f.section_id === sectionId).length
        : rootItems.length;
    const newField = createDefaultField(type, formId, sectionId, position);

    addField(newField, insertIndex);
    toast.success(`Added ${type.replace(/_/g, ' ').toLowerCase()} question`);
  };

  const handleDropFieldAt = (
    type: FieldType,
    targetFieldId: string,
    position: 'before' | 'after'
  ) => {
    const targetField = fields.find((f) => f.id === targetFieldId);
    if (!targetField) return;

    if (targetField.section_id) {
      const secFields = fields
        .filter((f) => f.section_id === targetField.section_id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      const targetIdx = secFields.findIndex((f) => f.id === targetFieldId);
      const insertIdx = position === 'before' ? Math.max(0, targetIdx) : targetIdx + 1;
      handleDropField(targetField.section_id, type, insertIdx);
    } else {
      const rootIdx = rootItems.findIndex((i) => i.id === targetFieldId);
      const insertIdx = position === 'before' ? Math.max(0, rootIdx) : rootIdx + 1;
      handleDropField(null, type, insertIdx);
    }
  };

  const handlePresetDrop = (e: React.DragEvent, atIndex: number) => {
    e.preventDefault();
    setActiveDropIndex(null);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data.type === 'section-layout') {
        handleAddSectionWithLayout(data.layout_type, data.column_count, atIndex);
      } else if (data.type === 'field' && data.fieldType) {
        handleDropField(null, data.fieldType as FieldType, atIndex);
      }
    } catch {
      // not a recognized drop
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data.type === 'section-layout') {
        handleAddSectionWithLayout(data.layout_type, data.column_count);
      } else if (data.type === 'field' && data.fieldType) {
        handleDropField(null, data.fieldType as FieldType);
      }
    } catch {
      // not a recognized drop
    }
  };

  return (
    <div className="flex-1 min-w-0 w-full space-y-4">
      {/* Form Title Banner with Form Overview (Editable) */}
      <div className="bg-card rounded-md border border-border p-4 sm:p-6 shadow-xs">
        <div className="space-y-1.5">
          {/* Editable Form Title */}
          <div className="relative group/title">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Form"
              className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground bg-transparent border border-transparent hover:border-border/60 focus:border-input focus:bg-background/80 transition-all px-2 py-1 -ml-2 rounded-md w-full outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/40"
              title="Click to edit form title"
            />
            <span className="sr-only">Form title</span>
          </div>

          {/* Editable Form Description */}
          <div className="relative group/desc">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add an optional form description or instructions for respondents..."
              rows={Math.max(1, (description || '').split('\n').length)}
              className="text-xs text-muted-foreground leading-relaxed bg-transparent border border-transparent hover:border-border/60 focus:border-input focus:bg-background/80 transition-all px-2 py-1 -ml-2 rounded-md w-full outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none placeholder:text-muted-foreground/40 placeholder:italic"
              title="Click to edit form description"
            />
            <span className="sr-only">Form description</span>
          </div>
        </div>
      </div>

      {/* Unified Draggable Canvas Area */}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="space-y-4">
          {rootItems.length === 0 ? (
            <CanvasEmptyDropZone
              onAddSection={handleAddSectionWithLayout}
              onDropItem={handleCanvasDrop}
            />
          ) : (
            <div className="space-y-4">
              <SortableContext
                items={rootItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {rootItems.map((item, index) => {
                    const isOverThisTop = activeDropIndex === index;

                    if (item.type === 'section') {
                      const section = item.section;
                      const sectionFields = fields
                        .filter((f) => f.section_id === section.id)
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
                      const sectionIndex = sections.findIndex((s) => s.id === section.id);

                      return (
                        <React.Fragment key={section.id}>
                          {/* Drop slot indicator above root item */}
                          <div
                            onDragOver={(e) => {
                              if (e.dataTransfer.types.includes('application/json')) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'copy';
                                if (activeDropIndex !== index) setActiveDropIndex(index);
                              }
                            }}
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                setActiveDropIndex(null);
                              }
                            }}
                            onDrop={(e) => handlePresetDrop(e, index)}
                            className={`transition-all duration-200 rounded-md flex items-center justify-center overflow-hidden ${
                              isOverThisTop
                                ? 'h-11 border-2 border-dashed border-primary bg-primary/10 text-primary text-xs font-semibold my-2 shadow-xs'
                                : 'h-2 -my-1 opacity-0 hover:opacity-100 hover:h-6 hover:border-dashed hover:border hover:border-primary/40'
                            }`}
                          >
                            {isOverThisTop && (
                              <span className="flex items-center gap-1.5 animate-pulse text-xs font-semibold pointer-events-none">
                                <Plus className="size-3.5" />
                                Drop here to insert before {section.title || `Section ${sectionIndex + 1}`}
                              </span>
                            )}
                          </div>

                          <SortableSectionCard
                            section={section}
                            sectionIndex={sectionIndex >= 0 ? sectionIndex : index}
                            totalSections={sections.length}
                            fields={sectionFields}
                            isSelected={selectedSectionId === section.id}
                            forceCollapsed={null}
                            onSelectSection={setSelectedSectionId}
                            onDeleteSection={handleDeleteSection}
                            onUpdateSection={handleUpdateSection}
                            onAddFieldToSection={handleAddFieldToSection}
                            onDropField={handleDropField}
                            onDropFieldAt={handleDropFieldAt}
                          />
                        </React.Fragment>
                      );
                    } else {
                      const field = item.field;
                      return (
                        <React.Fragment key={field.id}>
                          {/* Drop slot indicator above root item */}
                          <div
                            onDragOver={(e) => {
                              if (e.dataTransfer.types.includes('application/json')) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'copy';
                                if (activeDropIndex !== index) setActiveDropIndex(index);
                              }
                            }}
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                setActiveDropIndex(null);
                              }
                            }}
                            onDrop={(e) => handlePresetDrop(e, index)}
                            className={`transition-all duration-200 rounded-md flex items-center justify-center overflow-hidden ${
                              isOverThisTop
                                ? 'h-11 border-2 border-dashed border-primary bg-primary/10 text-primary text-xs font-semibold my-2 shadow-xs'
                                : 'h-2 -my-1 opacity-0 hover:opacity-100 hover:h-6 hover:border-dashed hover:border hover:border-primary/40'
                            }`}
                          >
                            {isOverThisTop && (
                              <span className="flex items-center gap-1.5 animate-pulse text-xs font-semibold pointer-events-none">
                                <Plus className="size-3.5" />
                                Drop here to insert before {field.label || 'Question'}
                              </span>
                            )}
                          </div>

                          <SortableElementItem
                            field={field}
                            onDropFieldAt={handleDropFieldAt}
                          />
                        </React.Fragment>
                      );
                    }
                  })}
                </div>
              </SortableContext>

              {/* Bottom Canvas Droppable Area to append sections or questions */}
              <CanvasBottomDropZone
                id="canvas-bottom-drop"
                onDropItem={handleCanvasDrop}
                label="Drop sections or questions here to append to canvas"
              />
            </div>
          )}
        </div>

        {/* Drag Overlay: Renders floating drag preview with dropAnimation */}
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeField ? (
            <div className="rounded-lg border-2 border-primary bg-card p-4 sm:p-5 shadow-2xl scale-[1.02] rotate-1 cursor-grabbing ring-4 ring-primary/15 select-none opacity-95 pointer-events-none">
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-semibold text-xs sm:text-sm text-foreground">
                  {activeField.label || 'Question'}
                </span>
                <Badge variant="outline" className="text-[10px] font-mono uppercase bg-muted/80">
                  {activeField.field_type.replace(/_/g, ' ')}
                </Badge>
              </div>
              {activeField.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                  {activeField.description}
                </p>
              )}
              <div className="h-8 rounded border border-dashed border-border/80 bg-muted/30 flex items-center px-3 text-xs text-muted-foreground/60">
                {activeField.placeholder || 'Input field preview...'}
              </div>
            </div>
          ) : activeSection ? (
            <div className="rounded-lg border-2 border-primary bg-card p-4 shadow-2xl scale-[1.02] rotate-1 cursor-grabbing ring-4 ring-primary/15 select-none opacity-95 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="font-heading font-semibold text-sm text-foreground">
                  {activeSection.title || 'Section'}
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {activeSection.column_count || 1} cols
                </Badge>
              </div>
              {activeSection.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {activeSection.description}
                </p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
