'use client';

import React, { useState } from 'react';
import type {
  FieldsResponse,
  FieldCondition,
  ConditionOperator,
  ConditionAction,
} from '@/types/api.types';
import {
  getNormalizedFieldOptions,
  formatConditionSummary,
} from '@/features/forms/utils/fieldConditions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface FieldConditionsEditorProps {
  field: FieldsResponse;
  allFields: FieldsResponse[];
  onUpdateConditions: (conditions: FieldCondition[]) => void;
}

const OPERATOR_LABELS: Record<string, string> = {
  EQUALS: 'Equals',
  NOT_EQUALS: 'Does not equal',
  CONTAINS: 'Contains',
  NOT_CONTAINS: 'Does not contain',
  EMPTY: 'Is empty / unanswered',
  FILLED: 'Is answered / filled',
};

const ACTION_LABELS: Record<string, string> = {
  SHOW: 'SHOW',
  HIDE: 'HIDE',
};

function generateConditionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `cond-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export const FieldConditionsEditor: React.FC<FieldConditionsEditorProps> = ({
  field,
  allFields,
  onUpdateConditions,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const conditions: FieldCondition[] = Array.isArray(field.conditions)
    ? field.conditions
    : [];

  const normalizedOptions = getNormalizedFieldOptions(field);
  const hasOptions = normalizedOptions.length > 0;

  // Other fields in the form that can be targeted (excluding current field and headings)
  const candidateTargets = allFields.filter(
    (f) => f.id !== field.id && f.field_type !== 'SECTION_HEADING'
  );

  const targetItems = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const cand of allFields) {
      map[cand.id] = cand.label || 'Untitled Question';
    }
    return map;
  }, [allFields]);

  const optionItems = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const opt of normalizedOptions) {
      map[opt.value] = opt.label;
    }
    return map;
  }, [normalizedOptions]);

  const isNumericField = field.field_type === 'NUMBER' || field.field_type === 'RATING';

  const handleAddCondition = () => {
    if (candidateTargets.length === 0) return;

    const defaultTarget = candidateTargets[0];
    const defaultVal = hasOptions ? normalizedOptions[0]?.value || '' : '';

    const newCond: FieldCondition = {
      id: generateConditionId(),
      target_field_id: defaultTarget.id,
      condition_operator: 'EQUALS',
      condition_value: {
        value: defaultVal,
      },
      action: 'SHOW',
    };

    onUpdateConditions([...conditions, newCond]);
    setIsOpen(true);
  };

  const handleUpdateCondition = (index: number, updates: Partial<FieldCondition>) => {
    const next = conditions.map((c, i) => {
      if (i !== index) return c;
      const updated: FieldCondition = {
        ...c,
        ...updates,
      };
      if (updates.condition_value) {
        updated.condition_value = {
          ...c.condition_value,
          ...updates.condition_value,
        };
      }
      return updated;
    });

    onUpdateConditions(next);
  };

  const handleRemoveCondition = (index: number) => {
    const next = conditions.filter((_, i) => i !== index);
    onUpdateConditions(next);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateConditions([]);
  };

  return (
    <div className="pt-2 border-t border-border">
      {/* Header button toggles open/collapse */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="w-full flex items-center justify-between py-2 px-1.5 -mx-1.5 hover:bg-muted/50 rounded-md transition-colors text-left select-none cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <div className="size-6 rounded flex items-center justify-center bg-primary/10 text-primary">
            <GitBranch className="size-3.5" />
          </div>
          <div>
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                Conditional Logic
              </span>
              <p className="text-[10px] text-muted-foreground font-normal">
                Show or hide other questions
              </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conditions.length > 0 ? (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[10px] font-mono font-medium bg-primary/15 text-primary border border-primary/20"
            >
              {conditions.length} {conditions.length === 1 ? 'rule' : 'rules'}
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground">None</span>
          )}
          {isOpen ? (
            <ChevronUp className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </div>
    </div>

      {
    isOpen && (
      <div className="pt-2 pb-1 space-y-3 animate-in fade-in duration-150">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/60">
          <span className="flex items-center gap-1 leading-tight">
            <Sparkles className="size-3 text-primary shrink-0" />
            Configure rules based on this question&apos;s answer
          </span>
          {conditions.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="cursor-pointer h-6 px-1.5 text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"
            >
              <RotateCcw className="size-2.5" />
              Clear
            </Button>
          )}
        </div>

        {candidateTargets.length === 0 ? (
          <div className="p-3 text-center rounded-md border border-dashed border-border/80 bg-muted/20 space-y-1">
            <AlertCircle className="size-4 text-muted-foreground/80 mx-auto" />
            <p className="text-[11px] text-muted-foreground font-medium">
              No other questions available
            </p>
            <p className="text-[10px] text-muted-foreground/80">
              Add more questions to your form to create conditional logic.
            </p>
          </div>
        ) : conditions.length === 0 ? (
          <div className="p-4 text-center rounded-md border border-dashed border-border/80 bg-muted/15 space-y-2">
            <p className="text-[11px] text-muted-foreground">
              No conditional rules configured for this question yet.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCondition}
              className="cursor-pointer text-xs h-7 gap-1.5 border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="size-3" />
              Add Condition
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {conditions.map((condition, idx) => {
              const targetField = allFields.find(
                (f) => f.id === condition.target_field_id
              );
              const isNoVal =
                condition.condition_operator === 'EMPTY' ||
                condition.condition_operator === 'FILLED' ||
                condition.condition_operator === 'IS_EMPTY' ||
                condition.condition_operator === 'IS_NOT_EMPTY';

              return (
                <div
                  key={condition.id || idx}
                  className="p-3 rounded-lg border border-border/80 bg-card/70 space-y-2.5 shadow-xs transition-colors hover:border-primary/40"
                >
                  {/* Condition Card Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-foreground">
                        Rule #{idx + 1}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                        {formatConditionSummary(condition, targetField)}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCondition(idx)}
                      className="cursor-pointer size-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                      title="Delete condition"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>

                  {/* Rule Phrasing UI */}
                  <div className="space-y-2 text-xs">
                    {/* 1. Condition Operator */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        If this answer:
                      </Label>
                      <Select
                        items={OPERATOR_LABELS}
                        value={condition.condition_operator}
                        onValueChange={(op) => {
                          if (op) {
                            handleUpdateCondition(idx, {
                              condition_operator: op as ConditionOperator,
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-8 text-xs bg-background">
                          <SelectValue placeholder="Select operator...">
                            {(op: unknown) =>
                              typeof op === 'string' && op in OPERATOR_LABELS
                                ? OPERATOR_LABELS[op]
                                : 'Select operator...'
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EQUALS" label="Equals" className="text-xs">
                            Equals
                          </SelectItem>
                          <SelectItem value="NOT_EQUALS" label="Does not equal" className="text-xs">
                            Does not equal
                          </SelectItem>
                          <SelectItem value="CONTAINS" label="Contains" className="text-xs">
                            Contains
                          </SelectItem>
                          <SelectItem value="NOT_CONTAINS" label="Does not contain" className="text-xs">
                            Does not contain
                          </SelectItem>
                          <SelectItem value="EMPTY" label="Is empty / unanswered" className="text-xs">
                            Is empty / unanswered
                          </SelectItem>
                          <SelectItem value="FILLED" label="Is answered / filled" className="text-xs">
                            Is answered / filled
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 2. Condition Value */}
                    {!isNoVal && (
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground font-medium">
                          Value:
                        </Label>
                        {hasOptions ? (
                          <Select
                            items={optionItems}
                            value={String(condition.condition_value?.value ?? '')}
                            onValueChange={(val) => {
                              if (val !== null && val !== undefined) {
                                handleUpdateCondition(idx, {
                                  condition_value: { value: val },
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-full h-8 text-xs bg-background">
                              <SelectValue placeholder="Select option...">
                                {(val: unknown) =>
                                  val !== undefined && val !== null
                                    ? optionItems[String(val)] || String(val)
                                    : 'Select option...'
                                }
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {normalizedOptions.map((opt, optIdx) => (
                                <SelectItem
                                  key={optIdx}
                                  value={opt.value}
                                  label={opt.label}
                                  className="text-xs"
                                >
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : isNumericField ? (
                          <Input
                            type="number"
                            placeholder="0"
                            value={
                              condition.condition_value?.value !== undefined &&
                                condition.condition_value?.value !== null
                                ? String(condition.condition_value.value)
                                : ''
                            }
                            onChange={(e) =>
                              handleUpdateCondition(idx, {
                                condition_value: {
                                  value:
                                    e.target.value === ''
                                      ? ''
                                      : Number(e.target.value),
                                },
                              })
                            }
                            className="h-8 text-xs bg-background"
                          />
                        ) : (
                          <Input
                            type="text"
                            placeholder="Value to match..."
                            value={String(condition.condition_value?.value ?? '')}
                            onChange={(e) =>
                              handleUpdateCondition(idx, {
                                condition_value: { value: e.target.value },
                              })
                            }
                            className="h-8 text-xs bg-background"
                          />
                        )}
                      </div>
                    )}

                    {/* 3. Action and Target Field */}
                    <div className="grid grid-cols-5 gap-2 pt-1 border-t border-border/50">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[11px] text-muted-foreground font-medium">
                          Then:
                        </Label>
                        <Select
                          items={ACTION_LABELS}
                          value={condition.action || 'SHOW'}
                          onValueChange={(act) => {
                            if (act) {
                              handleUpdateCondition(idx, {
                                action: act as ConditionAction,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-full h-8 text-xs bg-background">
                            <SelectValue placeholder="Action">
                              {(act: unknown) =>
                                typeof act === 'string' && act in ACTION_LABELS
                                  ? ACTION_LABELS[act]
                                  : 'Action'
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="SHOW"
                              label="SHOW"
                              className="text-xs font-semibold text-emerald-600"
                            >
                              SHOW
                            </SelectItem>
                            <SelectItem
                              value="HIDE"
                              label="HIDE"
                              className="text-xs font-semibold text-amber-600"
                            >
                              HIDE
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-3 space-y-1">
                        <Label className="text-[11px] text-muted-foreground font-medium">
                          Target:
                        </Label>
                        <Select
                          items={targetItems}
                          value={condition.target_field_id || ''}
                          onValueChange={(targetId) => {
                            if (targetId) {
                              handleUpdateCondition(idx, {
                                target_field_id: targetId,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-full h-8 text-xs bg-background truncate">
                            <SelectValue placeholder="Select target...">
                              {(val: unknown) => {
                                if (!val) return 'Select target...';
                                const targetObj = candidateTargets.find(
                                  (cand) => cand.id === val
                                );
                                return (
                                  targetObj?.label ||
                                  'Untitled Question'
                                );
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {candidateTargets.map((cand) => (
                              <SelectItem
                                key={cand.id}
                                value={cand.id}
                                label={cand.label || 'Untitled Question'}
                                className="text-xs"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="truncate">
                                    {cand.label || 'Untitled Question'}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    [{cand.field_type}]
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCondition}
              className="cursor-pointer w-full text-xs h-7.5 gap-1.5 border-dashed border-border hover:border-primary/50 text-foreground"
            >
              <Plus className="size-3 text-primary" />
              Add Another Condition
            </Button>
          </div>
        )}
      </div>
    )
  }
    </div >
  );
};
