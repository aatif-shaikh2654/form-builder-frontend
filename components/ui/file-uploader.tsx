'use client';

import * as React from 'react';
import { UploadCloud, File as FileIcon, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FileMetadata {
  id?: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  original_name?: string;
  stored_filename?: string;
  path?: string;
  mime_type?: string | null;
}

export interface FileUploadFieldProps {
  id?: string;
  isMultiple?: boolean;
  value?: FileMetadata[] | FileMetadata | unknown | null;
  onChange: (value: FileMetadata[] | FileMetadata | null) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  maxSizeMB?: number;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileUploadField({
  id,
  isMultiple = false,
  value,
  onChange,
  disabled = false,
  className,
  maxSizeMB = 10,
}: FileUploadFieldProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const filesList: FileMetadata[] = React.useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && 'name' in value) return [value as FileMetadata];
    return [];
  }, [value]);

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;

    const newItems: FileMetadata[] = Array.from(incomingFiles).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      file,
    }));

    if (isMultiple) {
      // Append unique files by name
      const existingNames = new Set(filesList.map((f) => f.name));
      const filteredNew = newItems.filter((f) => !existingNames.has(f.name));
      onChange([...filesList, ...filteredNew]);
    } else {
      onChange([newItems[0]]);
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMultiple) {
      const updated = filesList.filter((_, i) => i !== index);
      onChange(updated.length > 0 ? updated : null);
    } else {
      onChange(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className={cn('space-y-2 w-full', className)}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple={isMultiple}
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {filesList.length === 0 ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border border-dashed rounded-md p-5 text-center space-y-1.5 transition-colors cursor-pointer select-none',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border/80 bg-muted/15 hover:bg-muted/30 hover:border-border',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="size-9 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <UploadCloud className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">
              {isMultiple ? 'Click or drag files to upload' : 'Click or drag file to upload'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isMultiple ? 'Supports multiple files' : 'Single file'} • Max size {maxSizeMB}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {filesList.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-md border border-border/80 bg-card text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <div className="size-7 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileIcon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(idx, e)}
                    className="p-1 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove file"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {!disabled && (
            <div className="flex items-center justify-between pt-1">
              {isMultiple ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <Plus className="size-3" />
                  <span>Add another file</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <span>Replace file</span>
                </Button>
              )}
              <span className="text-[11px] text-muted-foreground">
                {filesList.length} {filesList.length === 1 ? 'file' : 'files'} attached
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
