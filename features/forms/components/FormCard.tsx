'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormResponse } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Trophy,
  ClipboardCheck,
  MessageSquare,
  BarChart3,
  Clock,
  Edit3,
  Trash2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { useBuilderStore } from '@/features/builder/store/builderStore';
import { useConfirmationStore } from '@/store/useConfirmationStore';
import { formsService } from '../services/formsService';
import { formDetailQueryKey } from '../hooks/useForms';
import { useQueryClient } from '@tanstack/react-query';

interface FormCardProps {
  form: FormResponse;
  onDelete: (id: string) => void;
}

export const FormCard: React.FC<FormCardProps> = ({ form, onDelete }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { loadForm, setTitle, setDescription, setFormType, setStatus, setActiveBuilderTab } = useBuilderStore();
  const confirm = useConfirmationStore((s) => s.confirm);

  const handleEdit = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const fullForm = await queryClient.fetchQuery({
        queryKey: formDetailQueryKey(form.id),
        queryFn: () => formsService.getSingleForm(form.id),
        staleTime: 5 * 60 * 1000,
      });
      if (fullForm) {
        loadForm(fullForm);
      } else {
        setTitle(form.title);
        setDescription(form.description || '');
        setFormType(form.form_type);
        setStatus(form.status);
      }
    } catch {
      setTitle(form.title);
      setDescription(form.description || '');
      setFormType(form.form_type);
      setStatus(form.status);
    }
    setActiveBuilderTab('canvas');
    router.push(`/builder?id=${form.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete this form?',
      description: `Are you sure you want to permanently delete "${form.title}"? All submitted responses and question elements will be removed immediately.`,
      confirmText: 'Delete Form',
      cancelText: 'Keep Form',
      variant: 'destructive',
    });
    if (ok) {
      onDelete(form.id);
    }
  };

  const getTypeIcon = () => {
    switch (form.form_type) {
      case 'QUIZ':
        return <Trophy className="size-4 text-amber-500" />;
      case 'SURVEY':
        return <ClipboardCheck className="size-4 text-blue-500" />;
      case 'FEEDBACK':
        return <MessageSquare className="size-4 text-emerald-500" />;
      case 'POLL':
        return <BarChart3 className="size-4 text-purple-500" />;
      default:
        return <FileText className="size-4 text-primary" />;
    }
  };

  const getStatusBadge = () => {
    switch (form.status) {
      case 'PUBLISHED':
        return <span className="status-badge-published">Published</span>;
      case 'DRAFT':
        return <span className="status-badge-draft">Draft</span>;
      default:
        return <span className="status-badge-archived">Archived</span>;
    }
  };

  return (
    <div
      onClick={() => handleEdit()}
      className="card-surface-interactive p-4.5 flex flex-col justify-between group hover:border-primary/50 transition-all cursor-pointer rounded-md"
    >
      <div>
        {/* Header: Icon, Title, Status */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              {getTypeIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                {form.title}
              </h3>
              <Badge
                variant="outline"
                className="text-[9px] font-mono uppercase px-1.5 py-0 mt-0.5 border-border bg-muted/60 rounded-xs"
              >
                {form.form_type}
              </Badge>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] mb-3 leading-relaxed">
          {form.description || 'No description provided.'}
        </p>

        {/* Metadata row */}
        <div className="grid grid-cols-2 gap-2 py-2 border-t border-b border-border/70 text-[11px] text-muted-foreground mb-3 font-mono">
          <div className="flex items-center gap-1.5 truncate">
            <Globe className="size-3 text-muted-foreground/80 shrink-0" />
            <span className="truncate">/{form.slug || form.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <Clock className="size-3 text-muted-foreground/80 shrink-0" />
            <span>{new Date(form.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="cursor-pointer gap-1.5 text-xs font-semibold h-7.5 px-3 rounded-md border-border hover:border-primary/50 hover:bg-primary/5 group-hover:text-primary"
          >
            <Edit3 className="size-3" />
            Builder
          </Button>

          <Link
            href={`/preview?id=${form.id}`}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer gap-1 text-xs text-muted-foreground hover:text-foreground h-7.5 px-2 rounded-md"
              title="Open Live Form Preview in New Tab"
            >
              <ExternalLink className="size-3" />
              <span>Preview</span>
            </Button>
          </Link>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="cursor-pointer size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete form"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
};
