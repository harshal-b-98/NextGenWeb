/**
 * Document Parsers - Type definitions and utilities
 * Server-side parsing is handled in parsers.server.ts
 */

export type SupportedFileType = 'pdf' | 'docx' | 'doc' | 'txt' | 'xlsx' | 'xls' | 'csv' | 'md' | 'html' | 'png' | 'jpg' | 'jpeg' | 'tiff' | 'webp';

export interface ParsedDocument {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    charCount: number;
    title?: string;
    author?: string;
    createdAt?: string;
    modifiedAt?: string;
  };
}

export interface ParserOptions {
  maxPages?: number;
  includeMetadata?: boolean;
}

/**
 * Get file type from MIME type or extension
 */
export function getFileType(mimeType: string, fileName: string): SupportedFileType | null {
  const mimeMap: Record<string, SupportedFileType> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'text/plain': 'txt',
    'text/markdown': 'md',
    'text/html': 'html',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'text/csv': 'csv',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/tiff': 'tiff',
    'image/webp': 'webp',
  };

  if (mimeMap[mimeType]) {
    return mimeMap[mimeType];
  }

  // Fallback to extension
  const ext = fileName.split('.').pop()?.toLowerCase();
  const extMap: Record<string, SupportedFileType> = {
    pdf: 'pdf',
    docx: 'docx',
    doc: 'doc',
    txt: 'txt',
    md: 'md',
    html: 'html',
    htm: 'html',
    xlsx: 'xlsx',
    xls: 'xls',
    csv: 'csv',
    png: 'png',
    jpg: 'jpg',
    jpeg: 'jpeg',
    tiff: 'tiff',
    webp: 'webp',
  };

  return ext ? extMap[ext] || null : null;
}

/**
 * Check if file type is supported
 */
export function isSupportedFileType(mimeType: string, fileName: string): boolean {
  return getFileType(mimeType, fileName) !== null;
}

/**
 * Get supported file types for display
 */
export function getSupportedFileTypes(): { extension: string; mimeType: string; description: string }[] {
  return [
    { extension: '.pdf', mimeType: 'application/pdf', description: 'PDF Document' },
    { extension: '.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Word Document' },
    { extension: '.doc', mimeType: 'application/msword', description: 'Word Document (Legacy)' },
    { extension: '.txt', mimeType: 'text/plain', description: 'Plain Text' },
    { extension: '.md', mimeType: 'text/markdown', description: 'Markdown' },
    { extension: '.html', mimeType: 'text/html', description: 'HTML Document' },
    { extension: '.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Excel Spreadsheet' },
    { extension: '.xls', mimeType: 'application/vnd.ms-excel', description: 'Excel Spreadsheet (Legacy)' },
    { extension: '.csv', mimeType: 'text/csv', description: 'CSV File' },
    { extension: '.png', mimeType: 'image/png', description: 'PNG Image (OCR)' },
    { extension: '.jpg', mimeType: 'image/jpeg', description: 'JPEG Image (OCR)' },
    { extension: '.jpeg', mimeType: 'image/jpeg', description: 'JPEG Image (OCR)' },
    { extension: '.tiff', mimeType: 'image/tiff', description: 'TIFF Image (OCR)' },
    { extension: '.webp', mimeType: 'image/webp', description: 'WebP Image (OCR)' },
  ];
}

/**
 * Check if file type is an image that requires OCR
 */
export function isImageFileType(fileType: SupportedFileType | null): boolean {
  return fileType !== null && ['png', 'jpg', 'jpeg', 'tiff', 'webp'].includes(fileType);
}

/**
 * Get accepted MIME types for file input
 */
export function getAcceptedMimeTypes(): string {
  return getSupportedFileTypes().map(t => t.mimeType).join(',');
}

/**
 * Get accepted extensions for file input
 */
export function getAcceptedExtensions(): string {
  return getSupportedFileTypes().map(t => t.extension).join(',');
}
