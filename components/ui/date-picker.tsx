'use client';

import * as React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
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
  dateFormat?: string; // Display format (defaults to 'PPP')
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
  dateFormat = 'PPP',
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
    onChange?.('', undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          'w-full cursor-pointer flex items-center justify-between text-left font-normal h-10 px-3 py-2 text-[13px] rounded-md border border-input bg-card hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-2xs',
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
        {clearable && parsedDate && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="cursor-pointer ml-1 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title="Clear date"
            aria-label="Clear date"
          >
            <X className="size-3.5" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
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
        {parsedDate && clearable && (
          <div className="p-2 border-t border-border flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="cursor-pointer text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
            >
              Clear Date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
