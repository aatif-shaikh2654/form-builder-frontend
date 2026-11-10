'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from 'cn';
import {
  Download,
  ExternalLink,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  Film,
  Music,
  Copy,
  Check,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export interface FileItemData {
  id?: string;
  original_name?: string;
  name?: string;
  stored_filename?: string;
  path?: string;
  mime_type?: string | null;
  size?: number;
}

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItemData | null;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileExtension(filename?: string): string {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function getFileCategory(
  ext: string
): 'image' | 'pdf' | 'document' | 'spreadsheet' | 'archive' | 'video' | 'audio' | 'code' | 'other' {
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return 'document';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'spreadsheet';
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return 'archive';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio';
  if (['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'py', 'sql', 'md'].includes(ext))
    return 'code';
  return 'other';
}

export function getFileBadgeVariant(category: ReturnType<typeof getFileCategory>) {
  switch (category) {
    case 'image':
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    case 'pdf':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    case 'spreadsheet':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'document':
      return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
    case 'archive':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'video':
    case 'audio':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function getFileIcon(category: ReturnType<typeof getFileCategory>) {
  switch (category) {
    case 'image':
      return ImageIcon;
    case 'pdf':
    case 'document':
      return FileText;
    case 'spreadsheet':
      return FileSpreadsheet;
    case 'archive':
      return FileArchive;
    case 'video':
      return Film;
    case 'audio':
      return Music;
    case 'code':
      return FileCode;
    default:
      return FileIcon;
  }
}

export function getFileUrl(pathOrFilename?: string): string {
  if (!pathOrFilename) return '';
  if (pathOrFilename.startsWith('http://') || pathOrFilename.startsWith('https://')) {
    return pathOrFilename;
  }
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(
    /\/api\/v1\/?$/,
    ''
  );
  const cleanPath = pathOrFilename.startsWith('/') ? pathOrFilename.slice(1) : pathOrFilename;
  return `${apiBase}/${cleanPath}`;
}

export const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  open,
  onOpenChange,
  file,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const [imgZoomed, setImgZoomed] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
    setImgZoomed(false);
  }, [file]);

  if (!file) return null;

  const fileName = file.original_name || file.name || file.stored_filename || 'Uploaded File';
  const ext = getFileExtension(fileName);
  const category = getFileCategory(ext);
  const IconComponent = getFileIcon(category);
  const fileUrl = getFileUrl(file.path || file.stored_filename);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fileUrl);
      setCopied(true);
      toast.success('File link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy file link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[70] bg-black/60 backdrop-blur-xs cursor-pointer"
        className="max-w-2xl sm:max-w-3xl lg:max-w-4xl p-5 space-y-4 max-h-[92vh] overflow-y-auto z-[75]"
        onOverlayClick={() => onOpenChange(false)}
      >
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`size-9 rounded-md flex items-center justify-center shrink-0 border ${getFileBadgeVariant(
                  category
                )}`}
              >
                <IconComponent className="size-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm sm:text-base font-semibold truncate leading-tight">
                  {fileName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                  {ext && (
                    <span className="font-mono uppercase font-semibold text-[10px]">
                      {ext}
                    </span>
                  )}
                  {file.size ? (
                    <>
                      <span>•</span>
                      <span>{formatBytes(file.size)}</span>
                    </>
                  ) : null}
                  {file.mime_type && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[10px]">{file.mime_type}</span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>

            {ext && (
              <Badge
                variant="outline"
                className={`font-mono text-[10px] uppercase shrink-0 ${getFileBadgeVariant(
                  category
                )}`}
              >
                {ext}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Live Preview Area */}
        <div className="bg-muted/15 border border-border/80 rounded-lg overflow-hidden flex flex-col items-center justify-center min-h-[320px] p-2 relative">
          {/* Image View */}
          {category === 'image' && fileUrl && !imgError ? (
            <div className="relative w-full flex flex-col items-center justify-center">
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background/80 backdrop-blur-xs p-1 rounded-md border border-border shadow-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setImgZoomed(!imgZoomed)}
                  className="size-7 cursor-pointer"
                  title={imgZoomed ? 'Fit to window' : 'Zoom 100%'}
                >
                  {imgZoomed ? <ZoomOut className="size-3.5" /> : <ZoomIn className="size-3.5" />}
                </Button>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                    'size-7 cursor-pointer'
                  )}
                  title="Open full resolution"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </div>

              <div
                className={`w-full overflow-auto flex items-center justify-center rounded p-2 transition-all ${
                  imgZoomed ? 'max-h-none' : 'max-h-[62vh]'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl}
                  alt={fileName}
                  onError={() => setImgError(true)}
                  className={`rounded object-contain transition-all duration-200 ${
                    imgZoomed ? 'w-auto max-w-none' : 'max-h-[60vh] w-auto max-w-full shadow-xs'
                  }`}
                />
              </div>
            </div>
          ) : category === 'image' && imgError ? (
            <div className="p-8 text-center space-y-2">
              <AlertCircle className="size-8 text-amber-500 mx-auto" />
              <p className="text-xs font-semibold text-foreground">Could not preview image</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                The image file may not be directly reachable or the upload storage is external.
              </p>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'h-7 text-xs mt-2 cursor-pointer'
                  )}
                >
                  Try Opening in New Window
                </a>
              )}
            </div>
          ) : null}

          {/* PDF View */}
          {category === 'pdf' && fileUrl ? (
            <div className="w-full h-[65vh] min-h-[480px] rounded overflow-hidden border border-border">
              <iframe
                src={`${fileUrl}#toolbar=0`}
                title={fileName}
                className="w-full h-full bg-background"
              />
            </div>
          ) : null}

          {/* Video View */}
          {category === 'video' && fileUrl ? (
            <div className="w-full p-4 flex items-center justify-center">
              <video
                src={fileUrl}
                controls
                className="w-full max-h-[55vh] rounded-md shadow-md bg-black"
              >
                Your browser does not support HTML5 video preview.
              </video>
            </div>
          ) : null}

          {/* Audio View */}
          {category === 'audio' && fileUrl ? (
            <div className="w-full p-8 flex flex-col items-center justify-center space-y-4">
              <div className="size-16 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <IconComponent className="size-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <audio src={fileUrl} controls className="w-full max-w-md">
                Your browser does not support HTML5 audio preview.
              </audio>
            </div>
          ) : null}

          {/* Document / Spreadsheet / Other Fallback */}
          {category !== 'image' && category !== 'pdf' && category !== 'video' && category !== 'audio' ? (
            <div className="text-center p-8 space-y-3 max-w-md mx-auto">
              <div
                className={`size-16 rounded-2xl mx-auto flex items-center justify-center border shadow-xs ${getFileBadgeVariant(
                  category
                )}`}
              >
                <IconComponent className="size-8" />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground break-all">{fileName}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Preview not directly embeddable for this format ({ext.toUpperCase() || 'FILE'}).
                  You can open or download it to view in your application.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2">
                {fileUrl && (
                  <a
                    href={fileUrl}
                    download={fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: 'default', size: 'sm' }),
                      'h-8 text-xs gap-1.5 cursor-pointer'
                    )}
                  >
                    <Download className="size-3.5" />
                    <span>Download File</span>
                  </a>
                )}
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'h-8 text-xs gap-1.5 cursor-pointer'
                    )}
                  >
                    <ExternalLink className="size-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="cursor-pointer text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            <span>{copied ? 'Link Copied' : 'Copy URL'}</span>
          </Button>

          <div className="flex items-center gap-2">
            {fileUrl && (
              <a
                href={fileUrl}
                download={fileName}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'h-8 text-xs gap-1.5 cursor-pointer'
                )}
              >
                <Download className="size-3.5" />
                <span>Download</span>
              </a>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer text-xs h-8"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
