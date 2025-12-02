'use client';

/**
 * File Upload Component
 * Drag-and-drop file upload with progress indicator
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateFile, formatFileSize } from '@/lib/documents/upload';
import { getAcceptedMimeTypes, getSupportedFileTypes } from '@/lib/documents/parsers';
import { cn } from '@/lib/utils';

export interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  documentId?: string;
}

interface FileUploadProps {
  workspaceId: string;
  onUploadComplete?: (documentId: string, fileName: string) => void;
  onUploadError?: (fileName: string, error: string) => void;
  maxFiles?: number;
  className?: string;
}

export function FileUpload({
  workspaceId,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (uploadedFile: UploadedFile) => {
    const formData = new FormData();
    formData.append('file', uploadedFile.file);
    formData.append('workspaceId', workspaceId);

    try {
      // Update status to uploading
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id ? { ...f, status: 'uploading', progress: 0 } : f
        )
      );

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update status to success
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? { ...f, status: 'success', progress: 100, documentId: result.document?.id }
            : f
        )
      );

      onUploadComplete?.(result.document?.id, uploadedFile.file.name);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      // Update status to error
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id ? { ...f, status: 'error', error: errorMessage } : f
        )
      );

      onUploadError?.(uploadedFile.file.name, errorMessage);
    }
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);

    const pendingFiles = files.filter(f => f.status === 'pending');

    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles
        .slice(0, maxFiles - files.length)
        .map(file => {
          const validation = validateFile(file);
          return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            status: validation.valid ? 'pending' : 'error',
            progress: 0,
            error: validation.error,
          } as UploadedFile;
        });

      setFiles(prev => [...prev, ...newFiles]);
    },
    [files.length, maxFiles]
  );

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/html': ['.html', '.htm'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: maxFiles - files.length,
    disabled: isUploading || files.length >= maxFiles,
  });

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          !isDragActive && 'border-neutral-300 hover:border-primary/50',
          (isUploading || files.length >= maxFiles) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">
            {isDragReject ? 'Unsupported file type' : 'Drop files here'}
          </p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-neutral-500">
              Supports PDF, DOCX, TXT, MD, HTML, XLSX, CSV (max 50MB each)
            </p>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Files ({files.length}/{maxFiles})
            </h3>
            {successCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                Clear completed
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map(uploadedFile => (
              <div
                key={uploadedFile.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  uploadedFile.status === 'error' && 'border-destructive/50 bg-destructive/5',
                  uploadedFile.status === 'success' && 'border-green-500/50 bg-green-50',
                  uploadedFile.status === 'uploading' && 'border-primary/50 bg-primary/5',
                  uploadedFile.status === 'pending' && 'border-neutral-200'
                )}
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {uploadedFile.status === 'uploading' ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : uploadedFile.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : uploadedFile.status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <File className="h-5 w-5 text-neutral-400" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                  <p className="text-xs text-neutral-500">
                    {uploadedFile.error || formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                {uploadedFile.status !== 'uploading' && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeFile(uploadedFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {pendingCount > 0 && (
        <Button
          onClick={uploadAllFiles}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
