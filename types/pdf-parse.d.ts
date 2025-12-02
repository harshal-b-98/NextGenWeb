/**
 * Type declarations for pdf-parse/lib/pdf-parse.js
 */

declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PDFInfo {
    Title?: string;
    Author?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
    [key: string]: unknown;
  }

  interface PDFMetadata {
    _metadata?: unknown;
  }

  interface PDFResult {
    /** Number of pages in the PDF */
    numpages: number;
    /** Total number of pages extracted */
    numrender: number;
    /** PDF info dictionary */
    info: PDFInfo;
    /** PDF metadata */
    metadata: PDFMetadata | null;
    /** Extracted text content */
    text: string;
    /** PDF version */
    version: string;
  }

  interface PDFParseOptions {
    /** Maximum number of pages to parse */
    max?: number;
    /** Page render callback */
    pagerender?: (pageData: unknown) => string;
    /** PDF.js version */
    version?: string;
  }

  function pdfParse(
    dataBuffer: Buffer,
    options?: PDFParseOptions
  ): Promise<PDFResult>;

  export default pdfParse;
}
