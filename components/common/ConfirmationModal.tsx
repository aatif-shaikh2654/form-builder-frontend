'use client';

import React from 'react';
import { useConfirmationStore } from '@/store/useConfirmationStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';

export const ConfirmationModal: React.FC = () => {
  const {
    isOpen,
    title,
    description,
    confirmText,
    cancelText,
    variant,
    isLoading,
    handleConfirm,
    handleCancel,
    setOpen,
  } = useConfirmationStore();

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <Trash2 className="size-4 text-destructive" />,
          iconBg: 'bg-destructive/10 border-destructive/20 text-destructive',
          confirmButtonVariant: 'destructive' as const,
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="size-4 text-amber-500" />,
          iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
          confirmButtonVariant: 'default' as const,
        };
      case 'info':
        return {
          icon: <AlertCircle className="size-4 text-blue-500" />,
          iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
          confirmButtonVariant: 'default' as const,
        };
      default:
        return {
          icon: <HelpCircle className="size-4 text-primary" />,
          iconBg: 'bg-primary/10 border-primary/20 text-primary',
          confirmButtonVariant: 'default' as const,
        };
    }
  };

  const { icon, iconBg, confirmButtonVariant } = getVariantStyles();

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-6 border-border rounded-md">
        <DialogHeader className="gap-3 sm:gap-3">
          <div className="flex items-start gap-3.5">
            <div
              className={`size-9 rounded-md border flex items-center justify-center shrink-0 ${iconBg}`}
            >
              {icon}
            </div>
            <div className="space-y-1 text-left">
              <DialogTitle className="font-heading text-base font-bold text-foreground">
                {title || 'Are you sure?'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {description || 'This action cannot be undone.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
            className="cursor-pointer text-xs font-medium h-8 px-3.5 rounded-md"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={confirmButtonVariant}
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
            className="cursor-pointer text-xs font-semibold h-8 px-4 gap-1.5 rounded-md"
          >
            {isLoading && <Loader2 className="size-3.5 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
