'use client';

/**
 * Documents List Component
 * Displays a list of documents with status and actions
 */

import { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileType,
  Trash2,
  Eye,
  Download,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/documents/upload';
import { cn } from '@/lib/utils';

export interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  metadata?: {
    wordCount?: number;
    pageCount?: number;
    error?: string;
  };
  knowledgeStatus?: {
    hasKnowledge: boolean;
    itemCount: number;
    embeddingCount: number;
  };
}

interface DocumentsListProps {
  documents: Document[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onRetry?: (id: string) => void;
  onExtractKnowledge?: (id: string) => void;
  onRefresh?: () => void;
  className?: string;
}

function getFileIcon(fileType: string) {
  const type = fileType.toLowerCase();

  if (['pdf', 'docx', 'doc', 'txt'].includes(type)) {
    return FileText;
  }
  if (['xlsx', 'xls', 'csv'].includes(type)) {
    return FileSpreadsheet;
  }
  if (['md', 'html', 'htm'].includes(type)) {
    return FileCode;
  }
  return FileType;
}

function getStatusIcon(status: Document['status']) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-neutral-400" />;
    case 'processing':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
}

function getStatusText(status: Document['status']) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Ready';
    case 'failed':
      return 'Failed';
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DocumentsList({
  documents,
  isLoading,
  onDelete,
  onView,
  onRetry,
  onExtractKnowledge,
  onRefresh,
  className,
}: DocumentsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [extractingId, setExtractingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;

    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (id: string) => {
    if (!onRetry) return;

    setRetryingId(id);
    try {
      await onRetry(id);
    } finally {
      setRetryingId(null);
    }
  };

  const handleExtract = async (id: string) => {
    if (!onExtractKnowledge) return;

    setExtractingId(id);
    try {
      await onExtractKnowledge(id);
    } finally {
      setExtractingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <FileText className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No documents yet</h3>
        <p className="text-neutral-500">
          Upload your first document to start building your knowledge base.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b">
        <span className="text-sm text-neutral-500">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </span>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        )}
      </div>

      {/* Document List */}
      <div className="divide-y">
        {documents.map(doc => {
          const FileIcon = getFileIcon(doc.file_type);
          const isDeleting = deletingId === doc.id;
          const isRetrying = retryingId === doc.id;
          const isExtracting = extractingId === doc.id;

          return (
            <div
              key={doc.id}
              className={cn(
                'flex items-center gap-4 py-3 group',
                (isDeleting || isRetrying || isExtracting) && 'opacity-50'
              )}
            >
              {/* File Icon */}
              <div className="flex-shrink-0 p-2 bg-neutral-100 rounded-lg">
                <FileIcon className="h-6 w-6 text-neutral-600" />
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {doc.name}
                  </p>
                  {getStatusIcon(doc.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>{doc.file_type.toUpperCase()}</span>
                  {doc.metadata?.pageCount && (
                    <span>{doc.metadata.pageCount} pages</span>
                  )}
                  {doc.metadata?.wordCount && (
                    <span>{doc.metadata.wordCount.toLocaleString()} words</span>
                  )}
                </div>
              </div>

              {/* Knowledge Base Status Badge */}
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium',
                  doc.knowledgeStatus?.hasKnowledge
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-neutral-50 text-neutral-400'
                )}
                title={
                  doc.knowledgeStatus?.hasKnowledge
                    ? `${doc.knowledgeStatus.itemCount} knowledge items, ${doc.knowledgeStatus.embeddingCount} embeddings`
                    : 'No knowledge extracted yet'
                }
              >
                <Brain className={cn(
                  'h-3.5 w-3.5',
                  doc.knowledgeStatus?.hasKnowledge ? 'text-purple-600' : 'text-neutral-400'
                )} />
                {doc.knowledgeStatus?.hasKnowledge ? (
                  <span>KB Ready</span>
                ) : (
                  <span>No KB</span>
                )}
              </div>

              {/* Status Badge */}
              <div
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  doc.status === 'completed' && 'bg-green-100 text-green-700',
                  doc.status === 'processing' && 'bg-blue-100 text-blue-700',
                  doc.status === 'pending' && 'bg-neutral-100 text-neutral-700',
                  doc.status === 'failed' && 'bg-red-100 text-red-700'
                )}
              >
                {getStatusText(doc.status)}
              </div>

              {/* Date */}
              <div className="hidden sm:block text-xs text-neutral-500 w-32 text-right">
                {formatDate(doc.created_at)}
              </div>

              {/* Actions */}
              <div className={cn(
                "flex items-center gap-1 transition-opacity",
                (isDeleting || isRetrying || isExtracting) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                {onView && doc.status === 'completed' && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onView(doc.id)}
                    title="View document"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {onExtractKnowledge && doc.status === 'completed' && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleExtract(doc.id)}
                    disabled={isExtracting}
                    title="Extract knowledge"
                  >
                    {isExtracting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 text-purple-600" />
                    )}
                  </Button>
                )}
                {onRetry && doc.status === 'failed' && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRetry(doc.id)}
                    disabled={isRetrying}
                    title="Retry processing"
                  >
                    {isRetrying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-amber-600" />
                    )}
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(doc.id)}
                    disabled={isDeleting}
                    title="Delete document"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
