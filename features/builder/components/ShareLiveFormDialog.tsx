'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import { Input } from '@/components/ui/input';
import {
  Copy,
  Check,
  ExternalLink,
  Globe,
  Share2,
  QrCode,
} from 'lucide-react';
import { toast } from 'sonner';

interface ShareLiveFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug?: string | null;
  formId?: string | null;
  formTitle?: string;
}

export const ShareLiveFormDialog: React.FC<ShareLiveFormDialogProps> = ({
  open,
  onOpenChange,
  slug,
  formId,
  formTitle,
}) => {
  const [copied, setCopied] = useState(false);

  const identifier = slug || formId || '';
  const relativeUrl = `/f/${identifier}`;
  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${relativeUrl}`
      : `http://localhost:3000${relativeUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Live link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 gap-5 bg-card border border-border">
        <DialogHeader className="space-y-1.5">
          <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
            <Globe className="size-5" />
          </div>
          <DialogTitle className="font-heading text-lg font-bold text-foreground">
            Share Live Form
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Your form is published and actively accepting responses from anyone with this link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Link Box with Copy Button */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Public Live Link
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={fullUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="font-mono text-xs h-9 bg-muted/30 border-border select-all"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCopy}
                className="cursor-pointer shrink-0 h-9 px-3 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Form Details Card */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Form Title:</span>
              <span className="font-semibold text-foreground truncate max-w-[220px]">
                {formTitle || 'Untitled Form'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Public Slug:</span>
              <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                /{identifier}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-1 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer text-xs h-8 px-3 rounded-md"
            >
              Close
            </Button>

            <a
              href={relativeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'cursor-pointer text-xs h-8 px-4 gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium'
              )}
            >
              <ExternalLink className="size-3" />
              <span>Open Live Form</span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

