import type { LayoutType } from '@/types/api.types';

export interface LayoutPreset {
  id: string;
  layout_type: LayoutType;
  column_count: number;
  label: string;
  shortLabel: string;
  description: string;
  iconColumns: number;
}

export const SECTION_LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'single',
    layout_type: 'SINGLE_COLUMN',
    column_count: 1,
    label: 'Single Column',
    shortLabel: '1 Col',
    description: 'Full width stacked layout',
    iconColumns: 1,
  },
  {
    id: 'grid-2',
    layout_type: 'GRID',
    column_count: 2,
    label: '2 Columns',
    shortLabel: '2 Cols',
    description: 'Two equal columns (50 / 50)',
    iconColumns: 2,
  },
  {
    id: 'grid-3',
    layout_type: 'GRID',
    column_count: 3,
    label: '3 Columns',
    shortLabel: '3 Cols',
    description: 'Three equal columns (33 / 33 / 33)',
    iconColumns: 3,
  },
  {
    id: 'grid-4',
    layout_type: 'GRID',
    column_count: 4,
    label: '4 Columns',
    shortLabel: '4 Cols',
    description: 'Four equal columns (25 / 25 / 25 / 25)',
    iconColumns: 4,
  },
];

export const DEFAULT_SECTION_LAYOUT = {
  layout_type: 'SINGLE_COLUMN' as LayoutType,
  column_count: 1,
  layout_config: {
    gap: 'md',
    collapse_on_mobile: true,
  },
  is_visible: true,
};

/**
 * Returns Tailwind grid utility classes based on section layout configuration
 */
export function getSectionGridClass(
  layoutType?: LayoutType,
  columnCount: number = 1,
  gap: string = 'md',
  device?: 'desktop' | 'tablet' | 'mobile'
): string {
  if (device === 'mobile' || layoutType === 'SINGLE_COLUMN' || columnCount <= 1) {
    return 'space-y-3';
  }

  const gapClass = gap === 'sm' ? 'gap-2' : gap === 'lg' ? 'gap-4 sm:gap-5' : 'gap-3';

  if (device === 'tablet') {
    return `grid grid-cols-1 sm:grid-cols-2 ${gapClass} items-start`;
  }

  switch (columnCount) {
    case 2:
      return `grid grid-cols-1 md:grid-cols-2 ${gapClass} items-start`;
    case 3:
      return `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gapClass} items-start`;
    case 4:
      return `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${gapClass} items-start`;
    case 5:
      return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 ${gapClass} items-start`;
    case 6:
      return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 ${gapClass} items-start`;
    case 7:
      return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 ${gapClass} items-start`;
    case 8:
      return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 ${gapClass} items-start`;
    case 9:
      return `grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 ${gapClass} items-start`;
    case 10:
      return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-10 ${gapClass} items-start`;
    case 11:
      return `grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-11 ${gapClass} items-start`;
    case 12:
      return `grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 ${gapClass} items-start`;
    default:
      return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${gapClass} items-start`;
  }
}

/**
 * Find matching layout preset from layout_type and column_count
 */
export function findLayoutPreset(layoutType?: LayoutType, columnCount: number = 1): LayoutPreset {
  if (layoutType === 'SINGLE_COLUMN' || columnCount <= 1) {
    return SECTION_LAYOUT_PRESETS[0];
  }
  const match = SECTION_LAYOUT_PRESETS.find(
    (p) => p.layout_type === layoutType && p.column_count === columnCount
  );
  return match || SECTION_LAYOUT_PRESETS[1];
}

let sectionCounter = 0;
export function generateSectionId(): string {
  sectionCounter += 1;
  return `sec_${Date.now().toString(36)}_${sectionCounter}`;
}
