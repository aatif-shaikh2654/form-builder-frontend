'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from 'cn';
import {
  Download,
  ExternalLink,
  Files,
  Eye,
  FileIcon,
} from 'lucide-react';
import {
  FileItemData,
  formatBytes,
  getFileExtension,
  getFileCategory,
  getFileBadgeVariant,
  getFileIcon,
  getFileUrl,
  FilePreviewDialog,
} from './file-preview-dialog';

export interface FilePreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItemData | null;
  allFiles?: FileItemData[];
  onSelectFile?: (file: FileItemData) => void;
}

export const FilePreviewDrawer: React.FC<FilePreviewDrawerProps> = ({
  open,
  onOpenChange,
  file,
  allFiles = [],
}) => {
  const [modalPreviewFile, setModalPreviewFile] = React.useState<FileItemData | null>(null);

  if (!file && allFiles.length === 0) return null;

  const filesToDisplay = allFiles.length > 0 ? allFiles : file ? [file] : [];
  const totalFiles = filesToDisplay.length;
  const totalSize = filesToDisplay.reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col p-0 gap-0 overflow-hidden bg-card z-[60]"
        >
          {/* Header */}
          <SheetHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-border bg-muted/15 space-y-1">
            <div className="flex items-start justify-between gap-3 pr-8">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-lg flex items-center justify-center shrink-0 border bg-primary/10 text-primary border-primary/20">
                  <Files className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-base font-bold text-foreground truncate leading-snug">
                    {totalFiles > 1 ? `Uploaded Files (${totalFiles})` : 'Uploaded File'}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                    {totalFiles} {totalFiles === 1 ? 'file' : 'files'} attached • Total:{' '}
                    {formatBytes(totalSize)}
                  </SheetDescription>
                </div>
              </div>

              <Badge variant="outline" className="font-mono text-[10px] uppercase shrink-0 py-0.5 px-2">
                {totalFiles} {totalFiles === 1 ? 'Item' : 'Items'}
              </Badge>
            </div>
          </SheetHeader>

          {/* Files List Body */}
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 sm:px-5 sm:pt-3.5 sm:pb-5 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Attached Files
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Click Preview to view
              </span>
            </div>

            <div className="space-y-2.5">
              {filesToDisplay.map((item, idx) => {
                const itemFileName =
                  item.original_name || item.name || item.stored_filename || `File ${idx + 1}`;
                const itemExt = getFileExtension(itemFileName);
                const itemCat = getFileCategory(itemExt);
                const ItemIcon = getFileIcon(itemCat);
                const itemUrl = getFileUrl(item.path || item.stored_filename);

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-muted/30 transition-all shadow-2xs flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`size-9 rounded-md flex items-center justify-center shrink-0 border ${getFileBadgeVariant(
                          itemCat
                        )}`}
                      >
                        <ItemIcon className="size-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors"
                          title={itemFileName}
                        >
                          {itemFileName}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          <span className="uppercase font-semibold">{itemExt || 'FILE'}</span>
                          {item.size ? <span> • {formatBytes(item.size)}</span> : null}
                          {item.mime_type ? (
                            <span className="hidden sm:inline"> • {item.mime_type}</span>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setModalPreviewFile(item)}
                        className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                        title={`Preview ${itemFileName} in modal`}
                      >
                        <Eye className="size-3.5" />
                        <span>Preview</span>
                      </Button>

                      {itemUrl && (
                        <a
                          href={itemUrl}
                          download={itemFileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: 'outline', size: 'icon-sm' }),
                            'size-7 text-muted-foreground hover:text-foreground cursor-pointer'
                          )}
                          title={`Download ${itemFileName}`}
                        >
                          <Download className="size-3.5" />
                        </a>
                      )}

                      {itemUrl && (
                        <a
                          href={itemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                            'size-7 text-muted-foreground hover:text-foreground cursor-pointer'
                          )}
                          title={`Open ${itemFileName} in new tab`}
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drawer Bottom Footer */}
          <div className="p-3 sm:p-4 border-t border-border bg-card flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              {totalFiles} {totalFiles === 1 ? 'file available' : 'files available'}
            </span>

            <SheetClose
              render={
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs cursor-pointer">
                  Close
                </Button>
              }
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Centered Live Preview Modal */}
      <FilePreviewDialog
        open={Boolean(modalPreviewFile)}
        onOpenChange={(open) => !open && setModalPreviewFile(null)}
        file={modalPreviewFile}
      />
    </>
  );
};
