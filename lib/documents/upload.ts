/**
 * Document Upload Utilities
 * Handles file uploads to Supabase Storage
 */

import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { getFileType, isSupportedFileType, type SupportedFileType } from './parsers';

export interface UploadResult {
  success: boolean;
  filePath?: string;
  publicUrl?: string;
  error?: string;
}

export interface DocumentUploadInput {
  file: File;
  workspaceId: string;
  onProgress?: (progress: number) => void;
}

/**
 * Generate a unique file path for storage
 */
export function generateFilePath(workspaceId: string, fileName: string): string {
  const ext = fileName.split('.').pop() || '';
  const uniqueId = uuidv4();
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50);

  return `${workspaceId}/${uniqueId}-${sanitizedName}`;
}

/**
 * Upload a document to Supabase Storage
 */
export async function uploadDocument(input: DocumentUploadInput): Promise<UploadResult> {
  const { file, workspaceId, onProgress } = input;

  // Validate file type
  if (!isSupportedFileType(file.type, file.name)) {
    return {
      success: false,
      error: `Unsupported file type: ${file.type || file.name.split('.').pop()}`,
    };
  }

  // Validate file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      success: false,
      error: `File size exceeds maximum of 50MB`,
    };
  }

  const supabase = createClient();
  const filePath = generateFilePath(workspaceId, file.name);

  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL (for documents bucket, this won't be publicly accessible due to RLS)
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return {
      success: true,
      filePath: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (err) {
    console.error('Upload exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

/**
 * Download a document from Supabase Storage
 */
export async function downloadDocument(filePath: string): Promise<Blob | null> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from('documents')
    .download(filePath);

  if (error) {
    console.error('Download error:', error);
    return null;
  }

  return data;
}

/**
 * Delete a document from Supabase Storage
 */
export async function deleteDocumentFile(filePath: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from('documents')
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error);
    return false;
  }

  return true;
}

/**
 * Get signed URL for temporary access
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!isSupportedFileType(file.type, file.name)) {
    return {
      valid: false,
      error: `Unsupported file type. Supported: PDF, DOCX, DOC, TXT, MD, HTML, XLSX, XLS, CSV`,
    };
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum of 50MB`,
    };
  }

  // Check file name length
  if (file.name.length > 255) {
    return {
      valid: false,
      error: 'File name is too long (max 255 characters)',
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file icon based on type
 */
export function getFileIcon(fileType: SupportedFileType | string): string {
  const icons: Record<string, string> = {
    pdf: 'file-text',
    docx: 'file-text',
    doc: 'file-text',
    txt: 'file-type',
    md: 'file-code',
    html: 'file-code',
    xlsx: 'file-spreadsheet',
    xls: 'file-spreadsheet',
    csv: 'file-spreadsheet',
  };

  return icons[fileType] || 'file';
}
