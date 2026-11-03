'use client';

import * as React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, X, Check } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface DatePickerProps {
  value?: Date | string | null;
  onChange?: (dateString: string, date?: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  clearable?: boolean;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string; // Display format, defaults to 'PP' (e.g. Nov 21, 2026)
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date...',
  disabled = false,
  className,
  id,
  clearable = true,
  minDate,
  maxDate,
  dateFormat = 'PP',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse value to Date safely
  const parsedDate = React.useMemo<Date | undefined>(() => {
    if (!value) return undefined;
    if (value instanceof Date) {
      return isValid(value) ? value : undefined;
    }
    if (typeof value === 'string') {
      const parsed = parseISO(value);
      if (isValid(parsed)) return parsed;
      const fallback = new Date(value);
      if (isValid(fallback)) return fallback;
    }
    return undefined;
  }, [value]);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedIso = format(selectedDate, 'yyyy-MM-dd');
      onChange?.(formattedIso, selectedDate);
    } else {
      onChange?.('', undefined);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange?.('', undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative flex items-center w-full">
        <PopoverTrigger
          id={id}
          disabled={disabled}
          className={cn(
            'w-full cursor-pointer flex items-center justify-between text-left font-normal h-10 px-3 py-2 text-[13px] rounded-md border border-input bg-card hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-2xs',
            clearable && parsedDate && !disabled && 'pr-9',
            !parsedDate && 'text-muted-foreground',
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {parsedDate ? format(parsedDate, dateFormat) : placeholder}
            </span>
          </span>
        </PopoverTrigger>
        {clearable && parsedDate && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 z-10"
            title="Clear date"
            aria-label="Clear date"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent
        className="w-[304px] p-0 z-50 bg-popover border border-border shadow-lg rounded-lg overflow-hidden"
        align="start"
      >
        {/* Header Summary */}
        <div className="px-3.5 py-2.5 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
              Date
            </span>
            <span className="text-xs font-semibold text-foreground">
              {parsedDate ? format(parsedDate, dateFormat) : 'No date selected'}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSelect(new Date())}
            className="cursor-pointer text-[11px] font-medium h-6.5 px-2 rounded-md hover:bg-accent border-border"
          >
            Today
          </Button>
        </div>

        {/* Calendar Day Picker */}
        <div className="p-3 pb-1 flex justify-center">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            autoFocus
          />
        </div>

        {/* Footer Actions */}
        <div className="px-3.5 py-2.5 border-t border-border bg-muted/15 flex items-center justify-between">
          {clearable && parsedDate ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="cursor-pointer text-xs h-7.5 px-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
            >
              Clear
            </Button>
          ) : (
            <span className="text-[11px] text-muted-foreground pl-0.5">
              Select date
            </span>
          )}
          <Button
            type="button"
            size="sm"
            onClick={() => setOpen(false)}
            className="cursor-pointer text-xs h-7.5 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md gap-1.5 shadow-2xs"
          >
            <Check className="size-3" />
            <span>Done</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
