'use client';

import React, { useState } from 'react';
import { useBuilderStore } from '../store/builderStore';
import { useConfirmationStore } from '@/store/useConfirmationStore';
import type { SectionResponse, LayoutType } from '@/types/api.types';
import {
  SECTION_LAYOUT_PRESETS,
  generateSectionId,
} from '../constants/layout.constants';
import { LayoutWireframe } from './LayoutWireframe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  Eye,
  EyeOff,
  LayoutGrid,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const SectionsManager: React.FC = () => {
  const {
    formId,
    sections,
    addSection: addSectionStore,
    updateSection: updateSectionStore,
    removeSection: removeSectionStore,
    fields,
  } = useBuilderStore();

  const confirm = useConfirmationStore((s) => s.confirm);

  // New Section State
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLayoutType, setNewLayoutType] = useState<LayoutType>('SINGLE_COLUMN');
  const [newColumnCount, setNewColumnCount] = useState<number>(1);
  const [newGap, setNewGap] = useState<'sm' | 'md' | 'lg'>('md');
  const [newIsVisible, setNewIsVisible] = useState<boolean>(true);

  // Editing Section State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLayoutType, setEditLayoutType] = useState<LayoutType>('SINGLE_COLUMN');
  const [editColumnCount, setEditColumnCount] = useState<number>(1);
  const [editGap, setEditGap] = useState<'sm' | 'md' | 'lg'>('md');
  const [editIsVisible, setEditIsVisible] = useState<boolean>(true);

  const resetNewForm = () => {
    setIsAdding(false);
    setNewTitle('');
    setNewDescription('');
    setNewLayoutType('SINGLE_COLUMN');
    setNewColumnCount(1);
    setNewGap('md');
    setNewIsVisible(true);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.error('Section title is required');
      return;
    }

    const position = sections.length;
    const tempSection: SectionResponse = {
      id: generateSectionId(),
      form_id: formId || '',
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      position,
      layout_type: newLayoutType,
      column_count: newColumnCount,
      layout_config: { gap: newGap, collapse_on_mobile: true },
      is_visible: newIsVisible,
      fields: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addSectionStore(tempSection);
    resetNewForm();
    toast.success('Section created');
  };

  const startEdit = (sec: SectionResponse) => {
    setEditingId(sec.id);
    setEditTitle(sec.title);
    setEditDescription(sec.description || '');
    setEditLayoutType(sec.layout_type || 'SINGLE_COLUMN');
    setEditColumnCount(sec.column_count || 1);
    const config = (sec.layout_config as { gap?: 'sm' | 'md' | 'lg' }) || {};
    setEditGap(config.gap || 'md');
    setEditIsVisible(sec.is_visible !== false);
  };

  const handleSaveEdit = async (sectionId: string) => {
    if (!editTitle.trim()) return;

    const existing = sections.find((s) => s.id === sectionId);

    const updates: Partial<SectionResponse> = {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      layout_type: editLayoutType,
      column_count: editColumnCount,
      layout_config: {
        ...(existing?.layout_config || {}),
        gap: editGap,
        collapse_on_mobile: true,
      },
      is_visible: editIsVisible,
    };

    updateSectionStore(sectionId, updates);
    setEditingId(null);
    toast.success('Section updated');
  };

  const handleDelete = async (sectionId: string, sectionTitle: string) => {
    const ok = await confirm({
      title: 'Delete Section?',
      description: `Are you sure you want to remove "${sectionTitle}"? Questions assigned to this section will remain in the form but become unsectioned.`,
      confirmText: 'Delete Section',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (ok) {
      removeSectionStore(sectionId);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Form Sections &amp; Layouts
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Divide your forms into logical sections, customize multi-column grids, and control visibility.
          </p>
        </div>

        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="cursor-pointer gap-1.5 text-xs font-semibold">
            <Plus className="size-3.5" />
            Add Section
          </Button>
        )}
      </div>

      {/* New Section Form */}
      {isAdding && (
        <div className="card-surface p-5 border-primary/40 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Plus className="size-3.5" />
              </div>
              <h3 className="font-heading font-semibold text-sm">Create New Section</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetNewForm}
              className="cursor-pointer text-xs text-muted-foreground h-7 px-2"
            >
              Cancel
            </Button>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1">
              <Label htmlFor="sec-title" className="text-xs font-medium">
                Section Title
              </Label>
              <Input
                id="sec-title"
                placeholder="e.g. Part 1: Personal Information"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-xs"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sec-desc" className="text-xs">
                Description / Context (Optional)
              </Label>
              <Textarea
                id="sec-desc"
                rows={2}
                placeholder="Explain the purpose of this section..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Layout Presets Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium block">
                Layout Preset
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SECTION_LAYOUT_PRESETS.map((preset) => {
                  const isSelected =
                    (newLayoutType === 'SINGLE_COLUMN' && preset.column_count === 1) ||
                    (newLayoutType === 'GRID' && newColumnCount === preset.column_count);

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setNewLayoutType(preset.layout_type);
                        setNewColumnCount(preset.column_count);
                      }}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                          : 'border-border bg-card hover:border-primary/40'
                      }`}
                    >
                      <LayoutWireframe columns={preset.iconColumns} isActive={isSelected} className="h-6 w-full" />
                      <div>
                        <span className="text-xs font-semibold text-foreground block">{preset.shortLabel}</span>
                        <span className="text-[10px] text-muted-foreground block">{preset.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-muted/20">
              <div className="flex items-center gap-2">
                {newIsVisible ? <Eye className="size-4 text-primary" /> : <EyeOff className="size-4 text-amber-500" />}
                <div>
                  <Label htmlFor="new-visibility" className="text-xs font-semibold cursor-pointer">
                    {newIsVisible ? 'Section is Visible' : 'Section is Hidden'}
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    {newIsVisible ? 'Respondents will see this section.' : 'Hidden from respondents.'}
                  </p>
                </div>
              </div>
              <Switch id="new-visibility" checked={newIsVisible} onCheckedChange={setNewIsVisible} />
            </div>

            <div className="flex justify-end pt-2 gap-2">
              <Button variant="ghost" size="sm" onClick={resetNewForm} className="cursor-pointer text-xs">
                Cancel
              </Button>
              <Button onClick={handleCreate} size="sm" className="cursor-pointer text-xs font-semibold">
                Save Section
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Sections List */}
      <div className="space-y-3">
        {sections.length === 0 && !isAdding ? (
          <div className="card-surface p-8 text-center text-muted-foreground">
            <Layers className="size-10 stroke-[1.25] mx-auto mb-2 opacity-40 text-primary" />
            <p className="font-heading text-sm font-semibold text-foreground">
              No sections created yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Your fields currently belong to a single continuous form. You can add sections with multi-column grid layouts to organize your questions.
            </p>
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              size="sm"
              className="cursor-pointer mt-4 gap-1.5 text-xs font-semibold"
            >
              <Plus className="size-3.5" />
              Create First Section
            </Button>
          </div>
        ) : (
          sections.map((sec, idx) => {
            const sectionFieldCount = fields.filter((f) => f.section_id === sec.id).length;
            const isEditing = editingId === sec.id;
            const isVisible = sec.is_visible !== false;
            const columnCount = sec.column_count || 1;

            return (
              <div
                key={sec.id}
                className={`card-surface p-5 space-y-3 group transition-all ${
                  !isVisible ? 'border-dashed border-border/80 bg-muted/15' : ''
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Section Title</Label>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-sm font-semibold"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Description</Label>
                      <Textarea
                        rows={2}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    {/* Edit Layout Presets */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium block">Column Layout</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {SECTION_LAYOUT_PRESETS.map((preset) => {
                          const isSelected =
                            (editLayoutType === 'SINGLE_COLUMN' && preset.column_count === 1) ||
                            (editLayoutType === 'GRID' && editColumnCount === preset.column_count);

                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setEditLayoutType(preset.layout_type);
                                setEditColumnCount(preset.column_count);
                              }}
                              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                                isSelected
                                  ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                                  : 'border-border bg-card hover:border-primary/40'
                              }`}
                            >
                              <LayoutWireframe columns={preset.iconColumns} isActive={isSelected} className="h-5 w-full" />
                              <span className="text-xs font-semibold text-foreground">{preset.shortLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Edit Visibility */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-muted/20">
                      <div className="flex items-center gap-2">
                        {editIsVisible ? <Eye className="size-4 text-primary" /> : <EyeOff className="size-4 text-amber-500" />}
                        <div>
                          <Label htmlFor="edit-visibility" className="text-xs font-semibold cursor-pointer">
                            {editIsVisible ? 'Section is Visible' : 'Section is Hidden'}
                          </Label>
                          <p className="text-[10px] text-muted-foreground">
                            {editIsVisible ? 'Visible to respondents.' : 'Hidden from respondents.'}
                          </p>
                        </div>
                      </div>
                      <Switch id="edit-visibility" checked={editIsVisible} onCheckedChange={setEditIsVisible} />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        className="cursor-pointer text-xs h-7"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(sec.id)}
                        className="cursor-pointer text-xs h-7 gap-1 font-semibold"
                      >
                        <Check className="size-3" />
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-primary/20">
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-heading font-semibold text-sm text-foreground">
                            {sec.title}
                          </h4>
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-border bg-muted/50">
                            {sectionFieldCount} field{sectionFieldCount === 1 ? '' : 's'}
                          </Badge>

                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-primary/30 bg-primary/5 text-primary gap-1">
                            <LayoutGrid className="size-2.5" />
                            {sec.layout_type === 'GRID' ? `${columnCount} Columns` : 'Single Column'}
                          </Badge>

                          {!isVisible && (
                            <Badge variant="outline" className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30 gap-1 px-1.5 py-0">
                              <EyeOff className="size-2.5" />
                              Hidden
                            </Badge>
                          )}
                        </div>

                        {sec.description && (
                          <p className="text-xs text-muted-foreground">
                            {sec.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(sec)}
                        className="cursor-pointer size-7 text-muted-foreground hover:text-foreground"
                        title="Edit section"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sec.id, sec.title)}
                        className="cursor-pointer size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete section"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
