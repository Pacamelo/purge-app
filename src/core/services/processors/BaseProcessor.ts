/**
 * BaseProcessor
 * Abstract base class for document processors
 */

import type {
  DocumentProcessor,
  ParsedDocument,
  Redaction,
  SupportedFileType,
  ContentSection,
} from '@/core/types';
import { generatePrefixedId } from '@/core/utils/secureRandom';

/**
 * Generate unique section ID using cryptographically secure random
 */
export function generateSectionId(): string {
  return generatePrefixedId('section');
}

/**
 * Abstract base class for document processors
 */
export abstract class BaseProcessor implements DocumentProcessor {
  abstract readonly fileType: SupportedFileType;
  abstract readonly mimeTypes: string[];
  abstract readonly extensions: string[];

  /**
   * Check if this processor can handle the file
   */
  canProcess(file: File): boolean {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return this.extensions.includes(ext) || this.mimeTypes.includes(file.type);
  }

  /**
   * Parse the document and extract text content
   */
  abstract parse(file: File): Promise<ParsedDocument>;

  /**
   * Apply redactions and generate output
   */
  abstract applyRedactions(
    document: ParsedDocument,
    redactions: Redaction[]
  ): Promise<Blob>;

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return this.mimeTypes;
  }

  /**
   * Helper to create a content section
   */
  protected createSection(
    text: string,
    type: ContentSection['type'],
    location: ContentSection['location']
  ): ContentSection {
    return {
      id: generateSectionId(),
      text,
      type,
      location,
    };
  }

  /**
   * Apply text replacements to a string
   */
  protected applyTextRedactions(
    text: string,
    redactions: Redaction[],
    sectionId: string
  ): string {
    // Sort redactions by offset (descending) to apply from end first
    const sectionRedactions = redactions
      .filter((r) => r.sectionId === sectionId)
      .sort((a, b) => b.startOffset - a.startOffset);

    let result = text;
    for (const redaction of sectionRedactions) {
      result =
        result.slice(0, redaction.startOffset) +
        redaction.replacement +
        result.slice(redaction.endOffset);
    }

    return result;
  }
}
