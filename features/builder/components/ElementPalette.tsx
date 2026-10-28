'use client';

import React, { useState } from 'react';
import type { FieldType, SectionResponse, LayoutType } from '@/types/api.types';
import { useBuilderStore } from '../store/builderStore';
import {
  FIELD_CATEGORIES,
  createDefaultField,
} from '../constants/builder.constants';
import {
  SECTION_LAYOUT_PRESETS,
  generateSectionId,
} from '../constants/layout.constants';
import { LayoutWireframe } from './LayoutWireframe';
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Link as LinkIcon,
  Calendar,
  Clock,
  CalendarDays,
  ListFilter,
  CheckSquare,
  CircleDot,
  Star,
  UploadCloud,
  ToggleLeft,
  Heading,
  Plus,
  LayoutGrid,
  GripHorizontal,
  Search,
  X,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PaletteItem {
  type: FieldType;
  label: string;
  category: 'Text' | 'Choice' | 'Advanced' | 'Structure';
  icon: React.ComponentType<{ className?: string }>;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Structure & Layout
  { type: 'SECTION_HEADING', label: 'Section Heading', category: 'Structure', icon: Heading },
  // Text Inputs
  { type: 'SHORT_TEXT', label: 'Short Text', category: 'Text', icon: Type },
  { type: 'LONG_TEXT', label: 'Long Text', category: 'Text', icon: AlignLeft },
  { type: 'NUMBER', label: 'Number', category: 'Text', icon: Hash },
  { type: 'EMAIL', label: 'Email', category: 'Text', icon: Mail },
  { type: 'PHONE', label: 'Phone', category: 'Text', icon: Phone },
  { type: 'URL', label: 'Website URL', category: 'Text', icon: LinkIcon },
  // Choice
  { type: 'DROPDOWN', label: 'Dropdown Select', category: 'Choice', icon: ListFilter },
  { type: 'SINGLE_CHOICE', label: 'Single Choice (Radio)', category: 'Choice', icon: CircleDot },
  { type: 'MULTIPLE_CHOICE', label: 'Multiple Choice', category: 'Choice', icon: CheckSquare },
  { type: 'CHECKBOX', label: 'Agreement Checkbox', category: 'Choice', icon: ToggleLeft },
  // Date & Time
  { type: 'DATE', label: 'Date Picker', category: 'Advanced', icon: Calendar },
  { type: 'TIME', label: 'Time Picker', category: 'Advanced', icon: Clock },
  { type: 'DATE_TIME', label: 'Date & Time', category: 'Advanced', icon: CalendarDays },
  // Rating & Media
  { type: 'RATING', label: 'Star Rating', category: 'Advanced', icon: Star },
  { type: 'FILE_UPLOAD', label: 'File Upload', category: 'Advanced', icon: UploadCloud },
];

type PaletteTab = 'fields' | 'sections';

export const ElementPalette: React.FC = () => {
  const {
    addField,
    formId,
    sections,
    fields,
    addSection,
    selectedSectionId,
    setSelectedSectionId,
  } = useBuilderStore();

  const [activeTab, setActiveTab] = useState<PaletteTab>('fields');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const handleAddField = (type: FieldType) => {
    const position = fields.length;
    const newField = createDefaultField(type, formId, selectedSectionId || null, position);

    addField(newField);
  };

  const handleCreateSectionWithLayout = (
    layoutType: LayoutType = 'SINGLE_COLUMN',
    columnCount: number = 1
  ) => {
    const position = sections.length;
    const tempId = generateSectionId();
    const newSection: SectionResponse = {
      id: tempId,
      form_id: formId || '',
      title: `Section ${position + 1}`,
      description: null,
      position,
      layout_type: layoutType,
      column_count: columnCount,
      layout_config: { gap: 'md', collapse_on_mobile: true },
      is_visible: true,
      fields: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addSection(newSection);
    setSelectedSectionId(tempId);
    toast.success(`Added ${layoutType === 'GRID' ? `${columnCount}-Column Grid` : 'Single Column'} Section`);
  };

  const filteredItems = PALETTE_ITEMS.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoriesToShow =
    selectedCategory === 'All'
      ? FIELD_CATEGORIES
      : FIELD_CATEGORIES.filter((c) => c === selectedCategory);

  return (
    <div className="builder-sidebar-panel space-y-3.5 max-h-[calc(100vh-140px)] overflow-y-auto px-3.5 sm:px-4 py-4 pr-3 sticky top-4">
      {/* Sidebar Header */}
      <div className="pb-2 border-b border-border/60">
        <h3 className="font-heading font-semibold text-sm tracking-tight text-foreground">
          Palette &amp; Layouts
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Drag and drop layouts &amp; questions into sections.
        </p>
      </div>

      {/* Clean 2-Tab Navigation: Fields / Sections */}
      <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-lg border border-border/70 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('fields')}
          className={`cursor-pointer flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-medium transition-all ${
            activeTab === 'fields'
              ? 'bg-background text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Open question elements (drag into sections)"
        >
          <Type className="size-3 shrink-0" />
          <span>Fields</span>
          <span className="text-[10px] text-muted-foreground font-mono">({PALETTE_ITEMS.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`cursor-pointer flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-medium transition-all ${
            activeTab === 'sections'
              ? 'bg-background text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Open section layouts"
        >
          <LayoutGrid className="size-3 shrink-0" />
          <span>Sections</span>
          <span className="text-[10px] text-muted-foreground font-mono">({SECTION_LAYOUT_PRESETS.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: SECTIONS */}
      {activeTab === 'sections' && (
        <div className="space-y-3">
          {/* Section Predefined Layouts (Click or Drag & Drop) */}
          <div className="space-y-2 p-2.5 rounded-lg border border-primary/20 bg-primary/[0.03]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <LayoutGrid className="size-3.5 text-primary" />
                <span className="text-[11px] font-heading font-bold text-foreground">
                  Section Layouts
                </span>
              </div>
              <span className="text-[9px] font-mono font-semibold uppercase bg-primary/15 text-primary px-1.5 py-0.2 rounded-xs">
                Drag onto Canvas
              </span>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Drag preset onto canvas or click to append section.
            </p>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {SECTION_LAYOUT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({
                        type: 'section-layout',
                        layout_type: preset.layout_type,
                        column_count: preset.column_count,
                        label: preset.label,
                      })
                    );
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => handleCreateSectionWithLayout(preset.layout_type, preset.column_count)}
                  className="p-2 rounded-md border border-border/80 bg-card hover:bg-primary/5 hover:border-primary/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between gap-1.5 shadow-2xs"
                  title={`Click to add or drag onto canvas: ${preset.label} (${preset.description})`}
                >
                  <div className="flex items-center justify-between">
                    <LayoutWireframe columns={preset.iconColumns} className="h-5 w-12" />
                    <GripHorizontal className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                      {preset.shortLabel}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1 block">
                      {preset.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Add Custom Section Button in Sections Tab */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleCreateSectionWithLayout('SINGLE_COLUMN', 1)}
            className="w-full cursor-pointer gap-1.5 text-xs h-7.5 rounded-md border-dashed border-primary/40 hover:border-primary text-primary hover:bg-primary/5"
          >
            <Plus className="size-3.5" />
            <span>Add Section to Canvas</span>
          </Button>

          {/* Existing Sections List */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-heading font-semibold text-foreground">
                Sections in Form ({sections.length})
              </span>
              <span className="text-[10px] text-muted-foreground">
                Click to focus
              </span>
            </div>

            {sections.length === 0 ? (
              <div className="p-3 text-center rounded-md border border-dashed border-border bg-muted/20 text-muted-foreground text-xs">
                No sections yet. Drag any preset above onto the canvas.
              </div>
            ) : (
              <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                {sections.map((sec, idx) => {
                  const secFieldsCount = fields.filter((f) => f.section_id === sec.id).length;
                  const isSelected = selectedSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setSelectedSectionId(sec.id);
                        const el = document.getElementById(`section-${sec.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className={`cursor-pointer w-full text-left p-2 rounded-md border text-xs transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-medium shadow-2xs'
                          : 'border-border/70 bg-card hover:bg-muted/60 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <span className="truncate font-medium">
                          {sec.title || `Section ${idx + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                          {sec.column_count || 1} col
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {secFieldsCount} {secFieldsCount === 1 ? 'field' : 'fields'}
                        </span>
                        <ChevronRight className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: FIELDS */}
      {activeTab === 'fields' && (
        <div className="space-y-3">
          {/* Quick Search & Category Filters */}
          <div className="space-y-2">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
              {['All', ...FIELD_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`cursor-pointer px-2 py-0.5 rounded-full text-[10px] font-medium transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Draggable Field Items List */}
          <div className="space-y-3.5">
            {categoriesToShow.map((category) => {
              const categoryItems = filteredItems.filter((item) => item.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground/80 tracking-wider">
                      {category}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {categoryItems.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {categoryItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              'application/json',
                              JSON.stringify({
                                type: 'field',
                                fieldType: item.type,
                                label: item.label,
                              })
                            );
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          onClick={() => handleAddField(item.type)}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border border-border/70 bg-card hover:bg-accent/60 hover:border-primary/40 transition-all text-left group cursor-grab active:cursor-grabbing"
                          title={`Drag and drop into a section or click to add: ${item.label}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                              <Icon className="size-3.5" />
                            </div>
                            <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <GripHorizontal className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            <Plus className="size-3 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="p-4 text-center rounded-md border border-dashed border-border bg-muted/20 text-muted-foreground text-xs space-y-2">
                <p>No question elements matching &ldquo;{searchQuery}&rdquo;</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="cursor-pointer text-xs h-7 text-primary hover:text-primary"
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
