'use client';

import * as React from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface MultiSelectProps {
  id?: string;
  options: string[];
  selected?: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  id,
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select options...',
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const currentSelected = Array.isArray(selected) ? selected : [];

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(search.toLowerCase().trim())
    );
  }, [options, search]);

  const toggleOption = (opt: string) => {
    if (currentSelected.includes(opt)) {
      onChange(currentSelected.filter((item) => item !== opt));
    } else {
      onChange([...currentSelected, opt]);
    }
  };

  const selectAll = () => {
    onChange([...options]);
  };

  const clearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative w-full">
        <PopoverTrigger
          id={id}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            'flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-2 text-[13px] text-foreground transition-colors hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left',
            className
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 pr-6">
            {currentSelected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : currentSelected.length <= 2 ? (
              currentSelected.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary font-medium text-xs px-2 py-0.5 rounded-sm"
                >
                  <span className="truncate max-w-[120px]">{item}</span>
                </span>
              ))
            ) : (
              <>
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-medium text-xs px-2 py-0.5 rounded-sm">
                  <span className="truncate max-w-[100px]">{currentSelected[0]}</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-medium text-xs px-2 py-0.5 rounded-sm">
                  <span className="truncate max-w-[100px]">{currentSelected[1]}</span>
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  +{currentSelected.length - 2} more
                </span>
              </>
            )}
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </PopoverTrigger>

        {currentSelected.length > 0 && !disabled && (
          <button
            type="button"
            onClick={clearAll}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80 z-10 transition-colors"
            title="Clear all selected"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <PopoverContent className="w-[var(--radix-popover-trigger-width,300px)] min-w-[240px] p-2 space-y-2" align="start">
        {options.length > 5 && (
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search options..."
              className="w-full bg-muted/30 border border-input rounded-md pl-8 pr-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        )}

        <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <span>{currentSelected.length} selected</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Select All
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => clearAll()}
              className="hover:text-destructive transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="max-h-52 overflow-y-auto space-y-0.5">
          {filteredOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No options found</p>
          ) : (
            filteredOptions.map((opt) => {
              const isChecked = currentSelected.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-sm text-xs cursor-pointer select-none transition-colors',
                    isChecked
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted/60 text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'size-3.5 rounded-xs border flex items-center justify-center shrink-0 transition-colors',
                      isChecked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40'
                    )}
                  >
                    {isChecked && <Check className="size-2.5 stroke-[3]" />}
                  </div>
                  <span className="truncate flex-1">{opt}</span>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
