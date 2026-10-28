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

  // Parse existing time into hour, minute, period directly without synchronous effects
  const { hour, minute, period } = React.useMemo(() => {
    if (!value) {
      return { hour: '12', minute: '00', period: 'PM' };
    }

    // Try parsing HH:mm (24h) or hh:mm a
    const match = value.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (!match) {
      return { hour: '12', minute: '00', period: 'PM' };
    }

    let h = parseInt(match[1], 10);
    const m = match[2];
    let p = match[3] ? match[3].toUpperCase() : 'AM';

    if (format === '12h') {
      if (!match[3]) {
        // Assume 24h input, convert to 12h
        p = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
      }
      return {
        hour: String(h).padStart(2, '0'),
        minute: m,
        period: p,
      };
    } else {
      // 24h mode
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

  const commitTime = (h: string, m: string, p: string) => {
    let result = '';
    if (format === '12h') {
      let numH = parseInt(h, 10);
      if (p === 'PM' && numH < 12) numH += 12;
      if (p === 'AM' && numH === 12) numH = 0;
      result = `${String(numH).padStart(2, '0')}:${m}`;
    } else {
      result = `${h}:${m}`;
    }
    onChange?.(result);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
  };

  const handlePresetSelect = (presetVal: string) => {
    onChange?.(presetVal);
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
          !value && 'text-muted-foreground',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{displayTime || placeholder}</span>
        </span>
        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="cursor-pointer ml-1 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title="Clear time"
            aria-label="Clear time"
          >
            <X className="size-3.5" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-68 p-3 z-50 bg-popover space-y-3" align="start">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" />
            Set Time
          </span>
          {value && (
            <span className="text-[11px] font-mono font-medium text-muted-foreground">
              {displayTime}
            </span>
          )}
        </div>

        {/* Hour / Minute / Period Selectors */}
        <div className="flex items-center justify-center gap-1.5">
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
              <SelectTrigger size="sm" className="w-full text-xs font-mono h-8 bg-background">
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

          <span className="text-muted-foreground font-bold pt-4">:</span>

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
              <SelectTrigger size="sm" className="w-full text-xs font-mono h-8 bg-background">
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
            <div className="w-18 shrink-0">
              <label className="text-[10px] text-muted-foreground font-mono block mb-1">Period</label>
              <Select
                modal={false}
                value={period}
                onValueChange={(val) => {
                  commitTime(hour, minute, val || 'AM');
                }}
              >
                <SelectTrigger size="sm" className="w-full text-xs font-semibold h-8 bg-background">
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
        <div className="space-y-1 pt-1 border-t border-border">
          <span className="text-[10px] text-muted-foreground font-medium block">Quick presets:</span>
          <div className="flex flex-wrap gap-1">
            {QUICK_PRESETS_12.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetSelect(preset.value)}
                className="cursor-pointer text-[10px] px-2 py-0.5 rounded border border-border/80 bg-muted/40 hover:bg-muted text-foreground hover:border-primary/40 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          {clearable && value ? (
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
      </PopoverContent>
    </Popover>
  );
}
