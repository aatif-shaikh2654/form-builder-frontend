'use client';

import React, { useState } from 'react';
import type { SectionResponse, LayoutType } from '@/types/api.types';
import {
  DEFAULT_SECTION_LAYOUT,
} from '../constants/layout.constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, LayoutGrid, Check, Minus, Plus } from 'lucide-react';

export interface SectionSettingsFormProps {
  section: SectionResponse;
  onSave: (sectionId: string, updates: Partial<SectionResponse>) => void;
  onCancel: () => void;
}

export const SectionSettingsForm: React.FC<SectionSettingsFormProps> = ({
  section,
  onSave,
  onCancel,
}) => {
  const config = (section.layout_config as { gap?: 'sm' | 'md' | 'lg'; collapse_on_mobile?: boolean }) || {};
  const [title, setTitle] = useState(section.title || '');
  const [description, setDescription] = useState(section.description || '');
  const [layoutType, setLayoutType] = useState<LayoutType>(
    section.layout_type || DEFAULT_SECTION_LAYOUT.layout_type
  );
  const [columnCount, setColumnCount] = useState<number>(
    section.column_count || DEFAULT_SECTION_LAYOUT.column_count
  );
  const [gap, setGap] = useState<'sm' | 'md' | 'lg'>(config.gap || 'md');
  const [collapseOnMobile, setCollapseOnMobile] = useState<boolean>(
    config.collapse_on_mobile !== false
  );
  const [isVisible, setIsVisible] = useState<boolean>(section.is_visible !== false);

  const handleSave = () => {
    onSave(section.id, {
      title: title.trim() || section.title,
      description: description.trim() || null,
      layout_type: layoutType,
      column_count: columnCount,
      layout_config: {
        ...(section.layout_config || {}),
        gap,
        collapse_on_mobile: collapseOnMobile,
      },
      is_visible: isVisible,
    });
    onCancel();
  };

  return (
    <>
      <div className="space-y-4 py-2">
        {/* Section Title */}
        <div className="space-y-1.5">
          <Label htmlFor="dialog-sec-title" className="text-xs font-semibold">
            Section Title
          </Label>
          <Input
            id="dialog-sec-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Personal Information"
            className="text-xs"
          />
        </div>

        {/* Section Description */}
        <div className="space-y-1.5">
          <Label htmlFor="dialog-sec-desc" className="text-xs font-medium">
            Description / Instructions (Optional)
          </Label>
          <Textarea
            id="dialog-sec-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide instructions or background for this section..."
            className="text-xs"
          />
        </div>

        {/* Column Layout Controls (1 to 12 columns) */}
        <div className="space-y-3 p-3.5 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="size-4 text-primary" />
              <Label className="text-xs font-semibold text-foreground">
                Section Columns (1 to 12)
              </Label>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-semibold px-2 py-0.5 border-primary/30 bg-primary/10 text-primary">
              {columnCount} {columnCount === 1 ? 'Column (Full Width)' : 'Columns Grid'}
            </Badge>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono uppercase text-muted-foreground mr-1">Presets:</span>
            {[
              { cols: 1, label: '1 Col (100%)' },
              { cols: 2, label: '2 Cols (50/50)' },
              { cols: 3, label: '3 Cols (33%)' },
              { cols: 4, label: '4 Cols (25%)' },
              { cols: 6, label: '6 Cols (16%)' },
              { cols: 12, label: '12 Cols (Max)' },
            ].map((preset) => {
              const isSelected = columnCount === preset.cols;
              return (
                <button
                  key={preset.cols}
                  type="button"
                  onClick={() => {
                    setColumnCount(preset.cols);
                    setLayoutType(preset.cols === 1 ? 'SINGLE_COLUMN' : 'GRID');
                  }}
                  className={`cursor-pointer px-2 py-1 rounded text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Interactive 12-Column Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Click a column division (1–12):</span>
              <span className="font-mono font-bold text-foreground">{columnCount}/12</span>
            </div>
            <div className="grid grid-cols-12 gap-1 p-1 bg-muted/50 rounded-md border border-border/70">
              {Array.from({ length: 12 }).map((_, idx) => {
                const colNum = idx + 1;
                const isFilled = colNum <= columnCount;
                const isExact = colNum === columnCount;
                return (
                  <button
                    key={colNum}
                    type="button"
                    onClick={() => {
                      setColumnCount(colNum);
                      setLayoutType(colNum === 1 ? 'SINGLE_COLUMN' : 'GRID');
                    }}
                    title={`Set to ${colNum} ${colNum === 1 ? 'column' : 'columns'}`}
                    className={`cursor-pointer h-7 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                      isExact
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/40 shadow-xs'
                        : isFilled
                        ? 'bg-primary/25 text-primary hover:bg-primary/35'
                        : 'bg-background/80 text-muted-foreground/60 hover:bg-muted hover:text-foreground border border-border/40'
                    }`}
                  >
                    {colNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider and Stepper Controls */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                const next = Math.max(1, columnCount - 1);
                setColumnCount(next);
                setLayoutType(next === 1 ? 'SINGLE_COLUMN' : 'GRID');
              }}
              disabled={columnCount <= 1}
              className="size-7 rounded cursor-pointer"
              title="Decrease columns"
            >
              <Minus className="size-3" />
            </Button>

            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={columnCount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setColumnCount(val);
                setLayoutType(val === 1 ? 'SINGLE_COLUMN' : 'GRID');
              }}
              className="flex-1 accent-primary cursor-pointer h-2 bg-muted rounded-lg"
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                const next = Math.min(12, columnCount + 1);
                setColumnCount(next);
                setLayoutType('GRID');
              }}
              disabled={columnCount >= 12}
              className="size-7 rounded cursor-pointer"
              title="Increase columns"
            >
              <Plus className="size-3" />
            </Button>
          </div>

          {/* Live Wireframe Visual Preview */}
          <div className="p-2.5 rounded-md border border-border/80 bg-muted/30 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>LIVE LAYOUT PREVIEW</span>
              <span>{columnCount} {columnCount === 1 ? 'Column' : 'Columns'} &bull; Gap: {gap}</span>
            </div>
            <div
              className="grid gap-1.5 p-2 bg-background rounded border border-border/60 min-h-[44px]"
              style={{
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: columnCount }).map((_, i) => (
                <div
                  key={i}
                  className="rounded bg-primary/10 border border-primary/25 p-1 text-center flex items-center justify-center min-w-0"
                >
                  <span className="text-[9px] font-mono font-semibold text-primary truncate">
                    {columnCount <= 6 ? `Col ${i + 1}` : `${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grid Spacing & Responsive options when Grid is selected */}
        {layoutType === 'GRID' && columnCount > 1 && (
          <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-foreground">Column Spacing / Gap</span>
                <p className="text-[10px] text-muted-foreground">Adjust spacing between question columns</p>
              </div>
              <div className="flex items-center gap-1 bg-background border border-border rounded-md p-0.5">
                {(['sm', 'md', 'lg'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setGap(size)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase transition-colors cursor-pointer ${
                      gap === size
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <div>
                <span className="text-xs font-medium text-foreground">Collapse on Mobile</span>
                <p className="text-[10px] text-muted-foreground">
                  Automatically stack columns vertically on smaller screens
                </p>
              </div>
              <Switch
                checked={collapseOnMobile}
                onCheckedChange={setCollapseOnMobile}
              />
            </div>
          </div>
        )}

        {/* Visibility Setting */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/20">
          <div className="flex items-start gap-2.5">
            <div className={`mt-0.5 p-1 rounded ${isVisible ? 'text-primary bg-primary/10' : 'text-amber-500 bg-amber-500/10'}`}>
              {isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </div>
            <div>
              <Label htmlFor="dialog-visibility" className="text-xs font-semibold cursor-pointer">
                {isVisible ? 'Section is Visible' : 'Section is Hidden'}
              </Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isVisible
                  ? 'Questions in this section are visible to form respondents.'
                  : 'Hidden from respondents. Useful for draft sections or internal forms.'}
              </p>
            </div>
          </div>
          <Switch
            id="dialog-visibility"
            checked={isVisible}
            onCheckedChange={setIsVisible}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80 mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="cursor-pointer text-xs h-8"
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          className="cursor-pointer text-xs h-8 font-semibold gap-1.5"
        >
          <Check className="size-3.5" />
          Save Changes
        </Button>
      </div>
    </>
  );
};

interface SectionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: SectionResponse | null;
  onSave: (sectionId: string, updates: Partial<SectionResponse>) => void;
}

export const SectionSettingsDialog: React.FC<SectionSettingsDialogProps> = ({
  open,
  onOpenChange,
  section,
  onSave,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg p-5">
        <DialogHeader className="space-y-1 pb-2 border-b border-border/80">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <LayoutGrid className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-heading font-bold text-foreground">
                Section Layout &amp; Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure layout columns, spacing, and visibility rules.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {section && (
          <SectionSettingsForm
            key={section.id}
            section={section}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
