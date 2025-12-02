/**
 * Document Parsers - Server-side only
 * Handles extraction of text content from various document formats
 * This file should only be imported in server-side code (API routes, server components)
 */

import 'server-only';
import type { SupportedFileType, ParsedDocument, ParserOptions } from './parsers';

/**
 * Parse PDF document
 * Uses pdf-parse v1.1.1 which has a simpler API without worker requirements
 * We import directly from lib/pdf-parse.js to avoid the debug mode in index.js
 * that tries to read a test file
 */
async function parsePDF(buffer: Buffer, options: ParserOptions = {}): Promise<ParsedDocument> {
  // Import directly from the lib to bypass the debug mode test in index.js
  // The main index.js has a debug mode that tries to read ./test/data/05-versions-space.pdf
  // which doesn't exist when bundled
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;

  // Parse options for pdf-parse v1
  const parseOptions: Record<string, any> = {};
  if (options.maxPages) {
    parseOptions.max = options.maxPages;
  }

  const result = await pdfParse(buffer, parseOptions);

  const text = result.text;

  return {
    text,
    metadata: {
      pageCount: result.numpages,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charCount: text.length,
      title: result.info?.Title,
      author: result.info?.Author,
      createdAt: result.info?.CreationDate,
      modifiedAt: result.info?.ModDate,
    },
  };
}

/**
 * Parse DOCX document
 */
async function parseDOCX(buffer: Buffer): Promise<ParsedDocument> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;

  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charCount: text.length,
    },
  };
}

/**
 * Parse plain text document
 */
async function parseText(buffer: Buffer): Promise<ParsedDocument> {
  const text = buffer.toString('utf-8');

  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charCount: text.length,
    },
  };
}

/**
 * Parse Excel/CSV document
 */
async function parseSpreadsheet(buffer: Buffer, fileType: 'xlsx' | 'xls' | 'csv'): Promise<ParsedDocument> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  let fullText = '';

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    fullText += `\n--- Sheet: ${sheetName} ---\n${csv}\n`;
  }

  const text = fullText.trim();

  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charCount: text.length,
    },
  };
}

/**
 * Parse HTML document - extract text content
 */
async function parseHTML(buffer: Buffer): Promise<ParsedDocument> {
  const html = buffer.toString('utf-8');

  // Simple HTML to text conversion (remove tags)
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charCount: text.length,
    },
  };
}

/**
 * Parse image using OCR (Tesseract.js)
 */
async function parseImage(buffer: Buffer, options: ParserOptions = {}): Promise<ParsedDocument> {
  const Tesseract = await import('tesseract.js');

  // Create a worker for OCR
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: options.includeMetadata ? (m) => console.log(m) : undefined,
  });

  try {
    // Recognize text from image buffer
    const { data } = await worker.recognize(buffer);

    const text = data.text.trim();

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).filter(Boolean).length,
        charCount: text.length,
        // OCR confidence score (0-100)
        ...(data.confidence && { ocrConfidence: Math.round(data.confidence) }),
      },
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Main document parser function
 */
export async function parseDocument(
  buffer: Buffer,
  fileType: SupportedFileType,
  options: ParserOptions = {}
): Promise<ParsedDocument> {
  switch (fileType) {
    case 'pdf':
      return parsePDF(buffer, options);

    case 'docx':
    case 'doc':
      return parseDOCX(buffer);

    case 'txt':
    case 'md':
      return parseText(buffer);

    case 'xlsx':
    case 'xls':
    case 'csv':
      return parseSpreadsheet(buffer, fileType);

    case 'html':
      return parseHTML(buffer);

    // Image types - use OCR
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'tiff':
    case 'webp':
      return parseImage(buffer, options);

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
