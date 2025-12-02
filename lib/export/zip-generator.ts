/**
 * ZIP Generator
 * Phase 5.3: Export & Deployment
 *
 * Generates ZIP files from exported project files.
 * Uses JSZip library for client-side ZIP generation.
 */

import type { ExportedFile, ExportResult } from './project-exporter';

/**
 * Generate a ZIP blob from exported files
 * This is designed to work on both server and client
 */
export async function generateZipBlob(exportResult: ExportResult): Promise<Blob> {
  // Dynamic import JSZip to avoid SSR issues
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Add all files to the ZIP
  for (const file of exportResult.files) {
    if (!file.isDirectory && file.content) {
      zip.file(file.path, file.content);
    }
  }

  // Generate the ZIP blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  return blob;
}

/**
 * Generate a ZIP as base64 string (useful for API responses)
 */
export async function generateZipBase64(exportResult: ExportResult): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const file of exportResult.files) {
    if (!file.isDirectory && file.content) {
      zip.file(file.path, file.content);
    }
  }

  const base64 = await zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  return base64;
}

/**
 * Generate ZIP as Node.js Buffer (for server-side use)
 */
export async function generateZipBuffer(exportResult: ExportResult): Promise<Buffer> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const file of exportResult.files) {
    if (!file.isDirectory && file.content) {
      zip.file(file.path, file.content);
    }
  }

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  return buffer;
}

/**
 * Trigger download of ZIP file in the browser
 */
export function downloadZip(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
