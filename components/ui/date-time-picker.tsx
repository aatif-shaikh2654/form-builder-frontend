'use client';

import * as React from 'react';
import { format, parseISO, isValid, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, X, Check } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface DateTimePickerProps {
  value?: Date | string | null;
  onChange?: (isoString: string, date?: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  clearable?: boolean;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string; // Display format, defaults to 'PPP, p' (e.g. Oct 25, 2026, 2:30 PM)
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date & time...',
  disabled = false,
  className,
  id,
  clearable = true,
  minDate,
  maxDate,
  dateFormat = 'PPP, p',
}: DateTimePickerProps) {
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

  // Extract hours, minutes, period from parsed date
  const { currentHour, currentMinute, currentPeriod } = React.useMemo(() => {
    if (parsedDate) {
      let h = parsedDate.getHours();
      const m = String(parsedDate.getMinutes()).padStart(2, '0');
      const p = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return {
        currentHour: String(h).padStart(2, '0'),
        currentMinute: m,
        currentPeriod: p,
      };
    }
    return { currentHour: '12', currentMinute: '00', currentPeriod: 'PM' };
  }, [parsedDate]);

  const assembleDate = (d: Date, h: string, m: string, p: string): Date => {
    let numH = parseInt(h, 10);
    if (p === 'PM' && numH < 12) numH += 12;
    if (p === 'AM' && numH === 12) numH = 0;

    const newDate = new Date(d);
    newDate.setHours(numH);
    newDate.setMinutes(parseInt(m, 10));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    return newDate;
  };

  const handleDateSelect = (selectedDay: Date | undefined) => {
    if (!selectedDay) {
      onChange?.('', undefined);
      return;
    }
    const combined = assembleDate(selectedDay, currentHour, currentMinute, currentPeriod);
    onChange?.(combined.toISOString(), combined);
  };

  const handleTimeChange = (h?: string, m?: string, p?: string) => {
    const baseDate = parsedDate || new Date();
    const newH = h ?? currentHour;
    const newM = m ?? currentMinute;
    const newP = p ?? currentPeriod;

    const combined = assembleDate(baseDate, newH, newM, newP);
    onChange?.(combined.toISOString(), combined);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('', undefined);
  };

  const handleQuickPreset = (type: 'now' | 'today-9am' | 'tomorrow-9am') => {
    const now = new Date();
    let target = new Date();
    if (type === 'now') {
      target = now;
    } else if (type === 'today-9am') {
      target.setHours(9, 0, 0, 0);
    } else if (type === 'tomorrow-9am') {
      target = addDays(now, 1);
      target.setHours(9, 0, 0, 0);
    }
    onChange?.(target.toISOString(), target);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen, eventDetails?: { reason?: string; event?: Event }) => {
        if (!nextOpen && eventDetails?.reason === 'outsidePress') {
          const target = eventDetails.event?.target as HTMLElement | null;
          if (
            target?.closest?.(
              '[data-slot="select-content"], [data-slot="select-item"], [data-slot="select-trigger"], [role="listbox"], [role="option"]'
            )
          ) {
            return;
          }
        }
        setOpen(nextOpen);
      }}
    >
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
            title="Clear date & time"
            aria-label="Clear date & time"
          >
            <X className="size-3.5" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
        {/* Header Summary */}
        <div className="p-3 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
              Date &amp; Time
            </span>
            <span className="text-xs font-semibold text-foreground">
              {parsedDate ? format(parsedDate, 'PPP, p') : 'No date selected'}
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickPreset('now')}
              className="cursor-pointer text-[10px] h-6 px-1.5"
            >
              Now
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickPreset('tomorrow-9am')}
              className="cursor-pointer text-[10px] h-6 px-1.5"
            >
              Tomorrow
            </Button>
          </div>
        </div>

        {/* Calendar Day Picker */}
        <div className="p-1">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            autoFocus
          />
        </div>

        {/* Time Selector Footer */}
        <div className="p-3 border-t border-border bg-muted/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              Time
            </span>
            <div className="flex items-center gap-1">
              {/* Hour Select */}
              <Select
                modal={false}
                value={currentHour}
                onValueChange={(val) => handleTimeChange(val ?? undefined, undefined, undefined)}
              >
                <SelectTrigger size="sm" className="w-16 text-xs font-mono h-7 bg-background">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent portal={false} side="top" align="center" className="min-w-20 w-20 max-h-48 z-50">
                  {HOURS_12.map((h) => (
                    <SelectItem key={h} value={h} className="text-xs font-mono">
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-muted-foreground font-bold">:</span>

              {/* Minute Select */}
              <Select
                modal={false}
                value={currentMinute}
                onValueChange={(val) => handleTimeChange(undefined, val ?? undefined, undefined)}
              >
                <SelectTrigger size="sm" className="w-16 text-xs font-mono h-7 bg-background">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent portal={false} side="top" align="center" className="min-w-20 w-20 max-h-48 z-50">
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs font-mono">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* AM/PM Select */}
              <Select
                modal={false}
                value={currentPeriod}
                onValueChange={(val) => handleTimeChange(undefined, undefined, val ?? undefined)}
              >
                <SelectTrigger size="sm" className="w-16 text-xs font-semibold h-7 bg-background">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent portal={false} side="top" align="center" className="min-w-20 w-20 z-50">
                  <SelectItem value="AM" className="text-xs font-semibold">
                    AM
                  </SelectItem>
                  <SelectItem value="PM" className="text-xs font-semibold">
                    PM
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-border/60">
            {clearable && parsedDate ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="cursor-pointer text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
              >
                Clear
              </Button>
            ) : (
              <div />
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              className="cursor-pointer text-xs h-7 px-3 bg-primary text-primary-foreground font-medium gap-1"
            >
              <Check className="size-3" />
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
