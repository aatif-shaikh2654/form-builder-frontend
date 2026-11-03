'use client';

import * as React from 'react';
import { Clock, X, Check } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
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

export interface TimePickerProps {
  value?: string | null;
  onChange?: (timeString: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  clearable?: boolean;
  format?: '12h' | '24h';
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const QUICK_PRESETS_12 = [
  { label: '9:00 AM', value: '09:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '2:30 PM', value: '14:30' },
  { label: '5:00 PM', value: '17:00' },
  { label: '8:00 PM', value: '20:00' },
];

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select time...',
  disabled = false,
  className,
  id,
  clearable = true,
  format = '12h',
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse existing time into hour, minute, period directly
  const { hour, minute, period } = React.useMemo(() => {
    if (!value) {
      return { hour: '12', minute: '00', period: 'PM' };
    }

    const match = value.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (!match) {
      return { hour: '12', minute: '00', period: 'PM' };
    }

    let h = parseInt(match[1], 10);
    const m = match[2];
    let p = match[3] ? match[3].toUpperCase() : 'AM';

    if (format === '12h') {
      if (!match[3]) {
        p = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
      }
      return {
        hour: String(h).padStart(2, '0'),
        minute: m,
        period: p,
      };
    } else {
      if (p === 'PM' && h < 12) h += 12;
      if (p === 'AM' && h === 12) h = 0;
      return {
        hour: String(h).padStart(2, '0'),
        minute: m,
        period: 'AM',
      };
    }
  }, [value, format]);

  const displayTime = React.useMemo(() => {
    if (!value) return null;
    if (format === '12h') {
      const match = value.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2];
        const p = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${p}`;
      }
      return value;
    }
    return value;
  }, [value, format]);

  const commitTime = (newHour: string, newMinute: string, newPeriod: string) => {
    let finalHour = parseInt(newHour, 10);
    if (format === '12h') {
      if (newPeriod === 'PM' && finalHour < 12) finalHour += 12;
      if (newPeriod === 'AM' && finalHour === 12) finalHour = 0;
    }
    const finalHourStr = String(finalHour).padStart(2, '0');
    const timeStr = `${finalHourStr}:${newMinute}`;
    onChange?.(timeStr);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange?.('');
  };

  const handlePresetClick = (presetValue: string) => {
    onChange?.(presetValue);
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
      <div className="relative flex items-center w-full">
        <PopoverTrigger
          id={id}
          disabled={disabled}
          className={cn(
            'w-full cursor-pointer flex items-center justify-between text-left font-normal h-10 px-3 py-2 text-[13px] rounded-md border border-input bg-card hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-2xs',
            clearable && value && !disabled && 'pr-9',
            !value && 'text-muted-foreground',
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayTime || placeholder}</span>
          </span>
        </PopoverTrigger>
        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 z-10"
            title="Clear time"
            aria-label="Clear time"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent
        className="w-[304px] p-0 z-50 bg-popover border border-border shadow-lg rounded-lg overflow-hidden space-y-0"
        align="start"
      >
        {/* Header Summary */}
        <div className="px-3.5 py-2.5 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
              Time
            </span>
            <span className="text-xs font-semibold text-foreground">
              {displayTime || 'No time selected'}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const now = new Date();
              const h = String(now.getHours()).padStart(2, '0');
              const m = String(now.getMinutes()).padStart(2, '0');
              onChange?.(`${h}:${m}`);
              setOpen(false);
            }}
            className="cursor-pointer text-[11px] font-medium h-6.5 px-2 rounded-md hover:bg-accent border-border"
          >
            Now
          </Button>
        </div>

        <div className="p-3.5 space-y-3.5">
          {/* Selectors */}
          <div className="flex items-center justify-center gap-2">
            {/* Hours */}
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-muted-foreground font-mono block mb-1">Hour</label>
              <Select
                modal={false}
                value={hour}
                onValueChange={(val) => {
                  commitTime(val || '12', minute, period);
                }}
              >
                <SelectTrigger size="sm" className="w-full text-xs font-mono h-8 bg-background justify-between">
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent portal={false} side="bottom" align="center" className="min-w-20 w-20 max-h-48 z-50">
                  {(format === '12h' ? HOURS_12 : HOURS_24).map((h) => (
                    <SelectItem key={h} value={h} className="text-xs font-mono">
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-muted-foreground font-bold pt-4 text-xs select-none">:</span>

            {/* Minutes */}
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-muted-foreground font-mono block mb-1">Minute</label>
              <Select
                modal={false}
                value={minute}
                onValueChange={(val) => {
                  commitTime(hour, val || '00', period);
                }}
              >
                <SelectTrigger size="sm" className="w-full text-xs font-mono h-8 bg-background justify-between">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent portal={false} side="bottom" align="center" className="min-w-20 w-20 max-h-48 z-50">
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs font-mono">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AM / PM (if 12h) */}
            {format === '12h' && (
              <div className="w-20 shrink-0">
                <label className="text-[10px] text-muted-foreground font-mono block mb-1">Period</label>
                <Select
                  modal={false}
                  value={period}
                  onValueChange={(val) => {
                    commitTime(hour, minute, val || 'AM');
                  }}
                >
                  <SelectTrigger size="sm" className="w-full text-xs font-semibold h-8 bg-background justify-between">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent portal={false} side="bottom" align="center" className="min-w-20 w-20 z-50">
                    <SelectItem value="AM" className="text-xs font-semibold">
                      AM
                    </SelectItem>
                    <SelectItem value="PM" className="text-xs font-semibold">
                      PM
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <span className="text-[10px] text-muted-foreground font-medium block">Quick presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS_12.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetClick(preset.value)}
                  className="cursor-pointer text-[11px] font-mono px-2 py-1 rounded border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-3.5 py-2.5 border-t border-border bg-muted/15 flex items-center justify-between">
          {clearable && value ? (
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
              Select time
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
