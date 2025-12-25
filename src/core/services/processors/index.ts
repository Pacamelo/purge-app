/**
 * Document Processors
 * Export all available processors
 */

export { BaseProcessor } from './BaseProcessor';
export { XlsxProcessor, xlsxProcessor } from './XlsxProcessor';

import type { DocumentProcessor, SupportedFileType } from '@/core/types';
import { xlsxProcessor } from './XlsxProcessor';

/**
 * Map of file types to processors
 */
const processors: Record<SupportedFileType, DocumentProcessor | null> = {
  xlsx: xlsxProcessor,
  docx: null, // TODO: Implement DocxProcessor
  pptx: null, // TODO: Implement PptxProcessor
  pdf: null,  // TODO: Implement PdfProcessor
};

/**
 * Get processor for a file type
 */
export function getProcessor(fileType: SupportedFileType): DocumentProcessor | null {
  return processors[fileType];
}

/**
 * Get processor for a file
 */
export function getProcessorForFile(file: File): DocumentProcessor | null {
  for (const processor of Object.values(processors)) {
    if (processor?.canProcess(file)) {
      return processor;
    }
  }

  return null;
}

/**
 * Check if a file type is supported
 */
export function isSupported(fileType: SupportedFileType): boolean {
  return processors[fileType] !== null;
}

/**
 * Get list of supported file types
 */
export function getSupportedTypes(): SupportedFileType[] {
  return (Object.entries(processors) as [SupportedFileType, DocumentProcessor | null][])
    .filter(([, p]) => p !== null)
    .map(([type]) => type);
}
