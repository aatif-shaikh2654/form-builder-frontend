'use client';

import React, { useState } from 'react';
import { useBuilderStore } from '../store/builderStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Sliders, Plus, X, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useConfirmationStore } from '@/store/useConfirmationStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PropertiesPanelProps {
  onClose?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ onClose }) => {
  const {
    formId,
    fields,
    selectedFieldId,
    updateField,
    removeField,
    sections,
  } = useBuilderStore();

  const confirm = useConfirmationStore((s) => s.confirm);
  const [newOption, setNewOption] = useState('');

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const handleDeleteField = async () => {
    if (!selectedField) return;
    const ok = await confirm({
      title: 'Delete Question Field?',
      description: `Are you sure you want to delete "${selectedField.label || 'this question'}"? This action will remove it from the canvas.`,
      confirmText: 'Delete Field',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (ok) {
      removeField(selectedField.id);
      if (onClose) onClose();
    }
  };

  if (!selectedField) {
    return null;
  }

  const hasOptions =
    selectedField.field_type === 'DROPDOWN' ||
    selectedField.field_type === 'SINGLE_CHOICE' ||
    selectedField.field_type === 'MULTIPLE_CHOICE' ||
    selectedField.field_type === 'CHECKBOX';

  const currentOptions: string[] =
    Array.isArray(selectedField.values) && selectedField.values.length > 0
      ? selectedField.values
      : Array.isArray(selectedField.settings?.options)
      ? (selectedField.settings.options as string[])
      : [];

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    const updated = [...currentOptions, newOption.trim()];
    const newSettings = { ...selectedField.settings, options: updated };
    updateField(selectedField.id, {
      settings: newSettings,
      values: updated,
    });
    setNewOption('');
  };

  const handleRemoveOption = (index: number) => {
    const updated = currentOptions.filter((_, i) => i !== index);
    const newSettings = { ...selectedField.settings, options: updated };
    updateField(selectedField.id, {
      settings: newSettings,
      values: updated,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="size-4 text-primary" />
          <h3 className="font-heading font-semibold text-sm tracking-tight">Field Inspector</h3>
        </div>
        <Badge variant="outline" className="text-[9px] font-mono capitalize">
          {selectedField.field_type.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="space-y-3.5">
        <div className="space-y-1">
          <Label htmlFor="field-label" className="text-xs font-medium">
            Label
          </Label>
          <Input
            id="field-label"
            value={selectedField.label}
            onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
            className="text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="field-desc" className="text-xs">
            Help Text / Description
          </Label>
          <Input
            id="field-desc"
            value={selectedField.description || ''}
            onChange={(e) =>
              updateField(selectedField.id, {
                description: e.target.value || null,
              })
            }
            placeholder="Helpful hint for respondents"
            className="text-xs"
          />
        </div>

        {selectedField.field_type !== 'SECTION_HEADING' &&
          selectedField.field_type !== 'CHECKBOX' &&
          selectedField.field_type !== 'RATING' && (
            <div className="space-y-1">
              <Label htmlFor="field-placeholder" className="text-xs">
                Placeholder
              </Label>
              <Input
                id="field-placeholder"
                value={selectedField.placeholder || ''}
                onChange={(e) =>
                  updateField(selectedField.id, {
                    placeholder: e.target.value || null,
                  })
                }
                className="text-xs"
              />
            </div>
          )}

        {sections.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="field-section" className="text-xs font-medium">
              Assign to Section
            </Label>
            <Select
              value={selectedField.section_id || 'root'}
              onValueChange={(val) => {
                const newSectionId = val === 'root' ? null : val;
                updateField(selectedField.id, {
                  section_id: newSectionId,
                  form_id: newSectionId ? null : formId,
                });
              }}
            >
              <SelectTrigger id="field-section" className="w-full text-[13px] h-10 bg-background">
                <SelectValue placeholder="Directly in Form (No Section)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root" className="text-xs">
                  Directly in Form (No Section)
                </SelectItem>
                {sections.map((sec) => (
                  <SelectItem key={sec.id} value={sec.id} className="text-xs">
                    {sec.title} ({sec.layout_type === 'GRID' ? `${sec.column_count || 1} cols` : '1 col'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Options list for choices */}
        {hasOptions && (
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-xs font-medium">Choice Options</Label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {currentOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-2 py-1 bg-muted/60 rounded text-xs"
                >
                  <span className="truncate">{opt}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="text-muted-foreground hover:text-destructive p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-1.5 pt-1">
              <Input
                placeholder="Add option..."
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
                className="text-xs h-7"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddOption}
                className="h-7 px-2 text-xs"
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Required switch */}
        {selectedField.field_type !== 'SECTION_HEADING' && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="space-y-0.5">
              <Label htmlFor="field-required" className="text-xs font-medium cursor-pointer">
                Required Field
              </Label>
              <p className="text-[10px] text-muted-foreground">Respondent must answer</p>
            </div>
            <Switch
              id="field-required"
              checked={selectedField.is_required}
              onCheckedChange={(checked) => {
                updateField(selectedField.id, { is_required: checked });
              }}
            />
          </div>
        )}

        {/* Delete field */}
        <div className="pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeleteField}
            className="cursor-pointer w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
          >
            <Trash2 className="size-3.5" />
            Delete this Field
          </Button>
        </div>
      </div>
    </div>
  );
};
