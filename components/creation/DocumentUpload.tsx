/**
 * Document Upload Component
 *
 * Step 1 of creation wizard - Upload documents with auto-embedding
 * Simplified interface with clear progress and auto-advance
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 */

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, Loader2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DocumentUploadProps {
  workspaceId: string;
  onUploadComplete: (documentIds: string[]) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export function DocumentUpload({ workspaceId, onUploadComplete }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Add files to state
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        status: 'uploading',
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Upload each file
      const uploadedIds: string[] = [];
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const fileState = newFiles[i];

        try {
          // Upload file
          const formData = new FormData();
          formData.append('file', file);
          formData.append('workspaceId', workspaceId);

          const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const data = await response.json();

          // Update file status
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileState.id
                ? { ...f, id: data.document.id, status: 'processing', progress: 50 }
                : f
            )
          );

          // Auto-trigger embedding generation (background)
          fetch('/api/knowledge/regenerate-embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId }),
          });

          // Mark as completed after brief delay (embedding happens in background)
          setTimeout(() => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === data.document.id
                  ? { ...f, status: 'completed', progress: 100 }
                  : f
              )
            );
          }, 1000);

          uploadedIds.push(data.document.id);
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileState.id
                ? { ...f, status: 'failed', error: 'Upload failed' }
                : f
            )
          );
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // Auto-advance if all uploads succeeded
      if (uploadedIds.length === acceptedFiles.length && uploadedIds.length > 0) {
        setTimeout(() => {
          onUploadComplete(uploadedIds);
        }, 1500);
      }
    },
    [workspaceId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const allCompleted = files.length > 0 && files.every((f) => f.status === 'completed');
  const hasFailures = files.some((f) => f.status === 'failed');

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Your Business Documents
        </h2>
        <p className="text-gray-600">
          Upload documents about your business - brochures, presentations, website content, etc.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop documents here'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          or click to browse files
        </p>
        <p className="text-xs text-gray-400">
          Supports PDF, Word, Excel, TXT (up to 50MB, max 10 files)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Uploaded Files</h3>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex-shrink-0">
                {file.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {file.status === 'uploading' || file.status === 'processing' ? (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                ) : null}
                {file.status === 'failed' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>

              <FileText className="h-5 w-5 text-gray-400" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{file.progress}%</span>
                </div>
                {file.error && <p className="text-xs text-red-600 mt-1">{file.error}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success State - Auto advances */}
      {allCompleted && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">
              All files uploaded! Moving to AI discovery...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
