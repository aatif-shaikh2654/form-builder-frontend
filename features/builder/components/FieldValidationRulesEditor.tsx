'use client';

import React, { useState } from 'react';
import type { FieldsResponse } from '@/types/api.types';
import type { FieldValidationRules } from '@/features/forms/utils/fieldValidation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertCircle,
  FileCode,
  Hash,
  Calendar,
  Layers,
  Upload,
} from 'lucide-react';

interface FieldValidationRulesEditorProps {
  field: FieldsResponse;
  onUpdateRules: (newRules: Record<string, unknown>) => void;
}

export const FieldValidationRulesEditor: React.FC<FieldValidationRulesEditorProps> = ({
  field,
  onUpdateRules,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rules = (field.validation_rules || {}) as FieldValidationRules;

  // Count active non-empty rules
  const activeRulesCount = Object.entries(rules).filter(
    ([, val]) => val !== undefined && val !== null && val !== '' && val !== false
  ).length;

  const handleRuleChange = (key: keyof FieldValidationRules, val: unknown) => {
    const nextRules = { ...rules };
    if (val === '' || val === null || val === undefined || val === false) {
      delete nextRules[key];
    } else {
      (nextRules as Record<string, unknown>)[key] = val;
    }
    onUpdateRules(nextRules as Record<string, unknown>);
  };

  const handleClearAllRules = () => {
    onUpdateRules({});
  };

  // Heading fields have no inputs, so no validation rules needed
  if (field.field_type === 'SECTION_HEADING') {
    return null;
  }

  const isText = ['SHORT_TEXT', 'LONG_TEXT'].includes(field.field_type);
  const isEmail = field.field_type === 'EMAIL';
  const isPhone = field.field_type === 'PHONE';
  const isUrl = field.field_type === 'URL';
  const isNumber = field.field_type === 'NUMBER';
  const isRating = field.field_type === 'RATING';
  const isDate = ['DATE', 'DATE_TIME'].includes(field.field_type);
  const isMultiChoice =
    field.is_multiple &&
    ['DROPDOWN', 'MULTIPLE_CHOICE', 'CHECKBOX'].includes(field.field_type);
  const isFileUpload = field.field_type === 'FILE_UPLOAD';

  return (
    <div className="pt-3 border-t border-border">
      {/* Header Accordion Toggle */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className="w-full flex items-center justify-between py-2 px-1.5 -mx-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
          <ShieldCheck className="size-3.5 text-primary" />
          <span>Validation Rules</span>
          {activeRulesCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">
              {activeRulesCount} active
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {activeRulesCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAllRules();
              }}
              title="Clear all validation rules"
              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <RotateCcw className="size-3 mr-1" />
              Reset
            </Button>
          )}

          <div className="p-1 text-muted-foreground group-hover:text-foreground transition-colors">
            {isOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </div>
        </div>
      </div>

      {/* Expanded Rule Configuration */}
      {isOpen && (
        <div className="space-y-3.5 pt-3 animate-in fade-in slide-in-from-top-1">
          {/* 1. Text Length & Pattern Rules */}
          {(isText || isEmail || isPhone || isUrl) && (
            <div className="space-y-2.5 p-2.5 rounded-md bg-muted/30 border border-border/60">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <FileCode className="size-3 text-primary" />
                <span>Length &amp; Character Constraints</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="val-min-len" className="text-[10px] text-muted-foreground">
                    Min Characters
                  </Label>
                  <Input
                    id="val-min-len"
                    type="number"
                    min={0}
                    placeholder="None"
                    value={rules.min_length ?? ''}
                    onChange={(e) =>
                      handleRuleChange(
                        'min_length',
                        e.target.value === '' ? null : Number(e.target.value)
                      )
                    }
                    className="h-7 text-xs bg-card"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="val-max-len" className="text-[10px] text-muted-foreground">
                    Max Characters
                  </Label>
                  <Input
                    id="val-max-len"
                    type="number"
                    min={1}
                    placeholder="None"
                    value={rules.max_length ?? ''}
                    onChange={(e) =>
                      handleRuleChange(
                        'max_length',
                        e.target.value === '' ? null : Number(e.target.value)
                      )
                    }
                    className="h-7 text-xs bg-card"
                  />
                </div>
              </div>

              {(isText || isEmail) && (
                <div className="space-y-1 pt-1">
                  <Label htmlFor="val-regex" className="text-[10px] text-muted-foreground">
                    Custom Regex Pattern
                  </Label>
                  <Input
                    id="val-regex"
                    placeholder="e.g. ^[A-Z0-9_-]+$"
                    value={rules.regex_pattern ?? ''}
                    onChange={(e) => handleRuleChange('regex_pattern', e.target.value || null)}
                    className="h-7 text-xs font-mono bg-card"
                  />
                </div>
              )}

              {rules.regex_pattern && (
                <div className="space-y-1">
                  <Label htmlFor="val-regex-msg" className="text-[10px] text-muted-foreground">
                    Pattern Error Hint
                  </Label>
                  <Input
                    id="val-regex-msg"
                    placeholder="e.g. Only capital alphanumeric characters permitted"
                    value={rules.regex_message ?? ''}
                    onChange={(e) => handleRuleChange('regex_message', e.target.value || null)}
                    className="h-7 text-xs bg-card"
                  />
                </div>
              )}
            </div>
          )}

          {/* 2. Numeric Boundaries & Int checks */}
          {isNumber && (
            <div className="space-y-2.5 p-2.5 rounded-md bg-muted/30 border border-border/60">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <Hash className="size-3 text-primary" />
                <span>Value Bounds &amp; Types</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="val-min-val" className="text-[10px] text-muted-foreground">
                    Min Value
                  </Label>
                  <Input
                    id="val-min-val"
                    type="number"
                    placeholder="No min"
                    value={rules.min_value ?? ''}
                    onChange={(e) =>
                      handleRuleChange(
                        'min_value',
                        e.target.value === '' ? null : Number(e.target.value)
                      )
                    }
                    className="h-7 text-xs bg-card"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="val-max-val" className="text-[10px] text-muted-foreground">
                    Max Value
                  </Label>
                  <Input
                    id="val-max-val"
                    type="number"
                    placeholder="No max"
                    value={rules.max_value ?? ''}
                    onChange={(e) =>
                      handleRuleChange(
                        'max_value',
                        e.target.value === '' ? null : Number(e.target.value)
                      )
                    }
                    className="h-7 text-xs bg-card"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Label htmlFor="val-int-only" className="text-xs font-medium cursor-pointer">
                  Integers Only
                </Label>
                <Switch
                  id="val-int-only"
                  checked={Boolean(rules.integer_only)}
                  onCheckedChange={(checked) => handleRuleChange('integer_only', checked)}
                />
              </div>
            </div>
          )}

          {/* 3. Rating Boundaries */}
          {isRating && (
            <div className="space-y-2 p-2.5 rounded-md bg-muted/30 border border-border/60">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="val-min-rating" className="text-[10px] text-muted-foreground">
                    Min Rating Required
                  </Label>
                  <Input
                    id="val-min-rating"
                    type="number"
                    min={1}
                    max={5}
                    placeholder="1"
                    value={rules.min_value ?? ''}
                    onChange={(e) =>
                      handleRuleChange(
                        'min_value',
                        e.target.value === '' ? null : Number(e.target.value)
                      )
                    }
                    className="h-7 text-xs bg-card"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="val-max-rating" className="text-[10px] text-muted-foreground">
                    Max Rating Cap
                  </Label>
                  <Input
                    id="val-max-rating"
                    type="number"
                    min={1}
                    max={5}
                    placeholder="5"
                    value={rules.max_value ?? ''}
                    onChange={(e) =>
                      handleRuleChange(
                        'max_value',
                        e.target.value === '' ? null : Number(e.target.value)
                      )
                    }
                    className="h-7 text-xs bg-card"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Date Constraints */}
          {isDate && (
            <div className="space-y-2.5 p-2.5 rounded-md bg-muted/30 border border-border/60">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <Calendar className="size-3 text-primary" />
                <span>Date Range &amp; Availability</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="val-disable-past" className="text-xs font-medium cursor-pointer">
                      Disallow Past Dates
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Only accept dates starting from today
                    </p>
                  </div>
                  <Switch
                    id="val-disable-past"
                    checked={Boolean(rules.disable_past)}
                    onCheckedChange={(checked) => handleRuleChange('disable_past', checked)}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="val-disable-future"
                      className="text-xs font-medium cursor-pointer"
                    >
                      Disallow Future Dates
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Only accept dates up to today
                    </p>
                  </div>
                  <Switch
                    id="val-disable-future"
                    checked={Boolean(rules.disable_future)}
                    onCheckedChange={(checked) => handleRuleChange('disable_future', checked)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                  <div className="space-y-1">
                    <Label htmlFor="val-min-date" className="text-[10px] text-muted-foreground">
                      Earliest Date
                    </Label>
                    <Input
                      id="val-min-date"
                      type="date"
                      value={rules.min_date ?? ''}
                      onChange={(e) => handleRuleChange('min_date', e.target.value || null)}
                      className="h-7 text-xs bg-card"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="val-max-date" className="text-[10px] text-muted-foreground">
                      Latest Date
                    </Label>
                    <Input
                      id="val-max-date"
                      type="date"
                      value={rules.max_date ?? ''}
                      onChange={(e) => handleRuleChange('max_date', e.target.value || null)}
                      className="h-7 text-xs bg-card"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Choice Selections Count */}
          {isMultiChoice && (
            <div className="space-y-2.5 p-2.5 rounded-md bg-muted/30 border border-border/60">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <Layers className="size-3 text-primary" />
                <span>Selection Count Limits</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="val-min-sel" className="text-[10px] text-muted-foreground">
                    Min Selected
                  </Label>
                  <Input
                    id="val-min-sel"
                    type="number"
                    min={1}
                    placeholder="1"
                    value={rules.min_select ?? ''}
                    onChange={(e) =>
                      handleRuleChange(
                        'min_select',
                        e.target.value === '' ? null : Number(e.target.value)
                      )
                    }
                    className="h-7 text-xs bg-card"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="val-max-sel" className="text-[10px] text-muted-foreground">
                    Max Selected
                  </Label>
                  <Input
                    id="val-max-sel"
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={rules.max_select ?? ''}
                    onChange={(e) =>
                      handleRuleChange(
                        'max_select',
                        e.target.value === '' ? null : Number(e.target.value)
                      )
                    }
                    className="h-7 text-xs bg-card"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. File Upload Constraints */}
          {isFileUpload && (
            <div className="space-y-2.5 p-2.5 rounded-md bg-muted/30 border border-border/60">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <Upload className="size-3 text-primary" />
                <span>File Upload Restrictions</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="val-file-size" className="text-[10px] text-muted-foreground">
                    Max File Size (MB)
                  </Label>
                  <Input
                    id="val-file-size"
                    type="number"
                    min={1}
                    placeholder="e.g. 10"
                    value={rules.max_file_size_mb ?? ''}
                    onChange={(e) =>
                      handleRuleChange(
                        'max_file_size_mb',
                        e.target.value === '' ? null : Number(e.target.value)
                      )
                    }
                    className="h-7 text-xs bg-card"
                  />
                </div>

                {field.is_multiple && (
                  <div className="space-y-1">
                    <Label htmlFor="val-max-files" className="text-[10px] text-muted-foreground">
                      Max Files Count
                    </Label>
                    <Input
                      id="val-max-files"
                      type="number"
                      min={1}
                      placeholder="e.g. 5"
                      value={rules.max_files ?? ''}
                      onChange={(e) =>
                        handleRuleChange(
                          'max_files',
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      className="h-7 text-xs bg-card"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="val-exts" className="text-[10px] text-muted-foreground">
                  Allowed Extensions (comma-separated)
                </Label>
                <Input
                  id="val-exts"
                  placeholder="pdf, png, jpg, docx"
                  value={rules.allowed_extensions ?? ''}
                  onChange={(e) => handleRuleChange('allowed_extensions', e.target.value || null)}
                  className="h-7 text-xs font-mono bg-card"
                />
                <p className="text-[9px] text-muted-foreground">
                  Leave empty to allow all supported types
                </p>
              </div>
            </div>
          )}

          {/* 7. Custom Error Message (Applicable for all fields) */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="size-3 text-muted-foreground" />
              <Label htmlFor="val-custom-msg" className="text-[11px] font-medium text-foreground">
                Custom Error Message
              </Label>
            </div>
            <Input
              id="val-custom-msg"
              placeholder="e.g. Please enter a valid 10-digit mobile number"
              value={rules.custom_error_message ?? ''}
              onChange={(e) => handleRuleChange('custom_error_message', e.target.value || null)}
              className="text-xs h-8 bg-card"
            />
            <p className="text-[10px] text-muted-foreground">
              Overrides default validation error alert when this field fails check.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

