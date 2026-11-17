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
  AlertTriangle,
  FileQuestion,
  ZoomIn,
  ZoomOut,
  FileCheck,
  Cloud,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { formsService } from '@/features/forms/services/formsService';

export interface FileItemData {
  id?: string;
  file_id?: string;
  storage_key?: string;
  storageKey?: string;
  formId?: string | null;
  submission_id?: string | null;
  submissionId?: string | null;
  original_name?: string;
  name?: string;
  stored_filename?: string;
  path?: string;
  mime_type?: string | null;
  size?: number;
  url?: string;
}

export interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItemData | null;
  formId?: string | null;
  submissionId?: string | null;
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

// In-memory cache for resolved file download URLs (TTL: 10 minutes)
const fileUrlCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Resolves the actual file download URL by calling GET /api/v1/form/{form_id}/download-url?storage_key={storage_key}&file_id={file_id}&submission_id={submission_id}
 */
export async function resolveR2FileUrl(
  formId?: string | null,
  fileId?: string | null,
  fallbackUrl?: string | null,
  submissionId?: string | null,
  storageKey?: string | null
): Promise<string> {
  // If fallbackUrl is already a fully qualified remote URL, use it directly
  if (
    fallbackUrl &&
    (fallbackUrl.startsWith('http://') ||
      fallbackUrl.startsWith('https://') ||
      fallbackUrl.startsWith('blob:') ||
      fallbackUrl.startsWith('data:'))
  ) {
    return fallbackUrl;
  }

  const effectiveStorageKey =
    storageKey ||
    (fallbackUrl && !fallbackUrl.startsWith('http') ? fallbackUrl : null) ||
    fileId;

  if (formId && (fileId || effectiveStorageKey)) {
    const keyPart = effectiveStorageKey || fileId || '';
    const cacheKey = `${formId}:${submissionId || ''}:${keyPart}`;
    const cached = fileUrlCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.url;
    }

    // Call file download endpoint with formId, fileId, submissionId, and storage_key
    const url = await formsService.getFileUploadUrl(
      formId,
      fileId || effectiveStorageKey || '',
      submissionId,
      effectiveStorageKey
    );
    if (url) {
      fileUrlCache.set(cacheKey, { url, timestamp: Date.now() });
      return url;
    }
    throw new Error('File not found');
  }

  // Only if no formId or fileId was provided at all (e.g. offline/mock local development)
  if (fallbackUrl && !formId && !fileId && !effectiveStorageKey) {
    return getFileUrl(fallbackUrl);
  }

  throw new Error('File not found');
}

export const resolveFileDownloadUrl = resolveR2FileUrl;

export const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  open,
  onOpenChange,
  file,
  formId,
  submissionId,
}) => {
  const [resolvedUrl, setResolvedUrl] = React.useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = React.useState<boolean>(false);
  const [urlError, setUrlError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState<number>(0);
  const [copied, setCopied] = React.useState<boolean>(false);
  const [imgError, setImgError] = React.useState<boolean>(false);
  const [imgZoomed, setImgZoomed] = React.useState<boolean>(false);

  const fileId = file?.id || file?.file_id;
  const storageKey =
    file?.storage_key ||
    file?.storageKey ||
    file?.stored_filename ||
    file?.path ||
    fileId;
  const effectiveFormId = file?.formId || formId;
  const effectiveSubmissionId = file?.submission_id || file?.submissionId || submissionId;

  // Resolve file URL whenever dialog opens or file changes
  React.useEffect(() => {
    let isMounted = true;
    setImgError(false);
    setImgZoomed(false);

    if (!open || !file) {
      setResolvedUrl(null);
      setIsLoadingUrl(false);
      setUrlError(null);
      return;
    }

    // If direct remote URL already exists on the file object
    const directUrl =
      file.url ||
      (file.path &&
      (file.path.startsWith('http://') ||
        file.path.startsWith('https://') ||
        file.path.startsWith('blob:'))
        ? file.path
        : null);
    if (directUrl) {
      setResolvedUrl(directUrl);
      setIsLoadingUrl(false);
      setUrlError(null);
      return;
    }

    if (!effectiveFormId || (!fileId && !storageKey)) {
      if (file.path || file.stored_filename) {
        const fallback = getFileUrl(file.path || file.stored_filename);
        setResolvedUrl(fallback);
        setIsLoadingUrl(false);
        setUrlError(fallback ? null : 'File not found');
      } else {
        setResolvedUrl(null);
        setIsLoadingUrl(false);
        setUrlError('File not found');
      }
      return;
    }

    setIsLoadingUrl(true);
    setUrlError(null);

    resolveR2FileUrl(
      effectiveFormId,
      fileId,
      file.path || file.stored_filename,
      effectiveSubmissionId,
      storageKey
    )
      .then((url) => {
        if (isMounted) {
          if (url) {
            setResolvedUrl(url);
            setUrlError(null);
          } else {
            setResolvedUrl(null);
            setUrlError('File not found');
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setResolvedUrl(null);
          const rawMsg =
            (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail ||
            (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.message ||
            (err as { detail?: string })?.detail ||
            (err instanceof Error ? err.message : '') ||
            'File not found';
          setUrlError(String(rawMsg));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingUrl(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, file, effectiveFormId, fileId, effectiveSubmissionId, storageKey, retryCount]);

  if (!file) return null;

  const fileName = file.original_name || file.name || file.stored_filename || 'Uploaded File';
  const ext = getFileExtension(fileName);
  const category = getFileCategory(ext);
  const IconComponent = getFileIcon(category);

  const handleCopyLink = async () => {
    if (!resolvedUrl) return;
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy file link');
    }
  };

  const handleDownload = () => {
    if (!resolvedUrl) return;
    const link = document.createElement('a');
    link.href = resolvedUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download initiated');
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
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-sm sm:text-base font-semibold truncate leading-tight">
                    {fileName}
                  </DialogTitle>
                </div>
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
          {/* 1. Loading State */}
          {isLoadingUrl ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center min-h-[300px]">
              <div className="relative">
                <div className="size-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs animate-pulse">
                  <Cloud className="size-8" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 size-6 rounded-full bg-background border border-border flex items-center justify-center shadow-xs">
                  <Loader2 className="size-3.5 text-primary animate-spin" />
                </div>
              </div>
              <div className="space-y-1.5 max-w-xs">
                <p className="text-sm font-semibold text-foreground">
                  Loading file preview...
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Connecting to storage for {fileName}
                </p>
              </div>
            </div>
          ) : urlError ? (
            /* 2. Error State directly showing API error message */
            <div className="flex flex-col items-center justify-center p-8 sm:p-10 text-center min-h-[260px] max-w-sm mx-auto space-y-4">
              <div className="size-14 rounded-2xl bg-destructive/10 dark:bg-destructive/15 border border-destructive/25 flex items-center justify-center text-destructive shadow-xs">
                <AlertCircle className="size-7" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                  {urlError}
                </h4>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="cursor-pointer gap-1.5 text-xs h-8"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Retry Request</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer text-xs h-8 text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : category === 'image' && resolvedUrl && !imgError ? (
            /* 3. Image View */
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
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                    'size-7 cursor-pointer'
                  )}
                  title="Open full resolution in new tab"
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
                  src={resolvedUrl}
                  alt={fileName}
                  onError={() => setImgError(true)}
                  className={`rounded object-contain transition-all duration-200 ${
                    imgZoomed ? 'w-auto max-w-none' : 'max-h-[60vh] w-auto max-w-full shadow-xs'
                  }`}
                />
              </div>
            </div>
          ) : category === 'image' && imgError ? (
            /* Image Render Fallback */
            <div className="p-8 text-center space-y-2">
              <AlertCircle className="size-8 text-amber-500 mx-auto" />
              <p className="text-xs font-semibold text-foreground">Could not preview image</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                The image file format or CORS configuration could not be rendered inline.
              </p>
              {resolvedUrl && (
                <a
                  href={resolvedUrl}
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
          ) : category === 'pdf' && resolvedUrl ? (
            /* 4. PDF View */
            <div className="w-full h-[65vh] min-h-[480px] rounded overflow-hidden border border-border">
              <iframe
                src={`${resolvedUrl}#toolbar=0`}
                title={fileName}
                className="w-full h-full bg-background"
              />
            </div>
          ) : category === 'video' && resolvedUrl ? (
            /* 5. Video View */
            <div className="w-full p-4 flex items-center justify-center">
              <video
                src={resolvedUrl}
                controls
                className="w-full max-h-[55vh] rounded-md shadow-md bg-black"
              >
                Your browser does not support HTML5 video preview.
              </video>
            </div>
          ) : category === 'audio' && resolvedUrl ? (
            /* 6. Audio View */
            <div className="w-full p-8 flex flex-col items-center justify-center space-y-4">
              <div className="size-16 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <IconComponent className="size-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <audio src={resolvedUrl} controls className="w-full max-w-md">
                Your browser does not support HTML5 audio preview.
              </audio>
            </div>
          ) : (
            /* 7. Document / Spreadsheet / Other File Type */
            <div className="text-center p-8 space-y-3.5 max-w-md mx-auto">
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
                  Download or open it to view on your device.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!resolvedUrl}
                  className="h-8 text-xs gap-1.5 cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>Download File</span>
                </Button>
                {resolvedUrl && (
                  <a
                    href={resolvedUrl}
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
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            disabled={!resolvedUrl || Boolean(urlError)}
            className="cursor-pointer text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!resolvedUrl || Boolean(urlError)}
              className="cursor-pointer text-xs gap-1.5 h-8 disabled:opacity-40 disabled:cursor-not-allowed"
              title={urlError ? 'File not available' : 'Download file'}
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </Button>
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
