/**
 * File Magic Byte Validation
 *
 * Validates file types by checking magic bytes (file signatures) in addition
 * to file extensions. This prevents attackers from bypassing file type checks
 * by simply renaming files.
 *
 * SECURITY: Extension-only validation is insufficient. A file named "malware.xlsx"
 * could actually be an executable. Magic bytes provide defense-in-depth.
 */

import type { SupportedFileType } from '@/core/types';

/**
 * Magic byte signatures for supported file formats
 * Key: File type, Value: Array of possible magic byte sequences (hex)
 */
const MAGIC_SIGNATURES: Record<SupportedFileType, number[][]> = {
  // Office Open XML formats (DOCX, XLSX, PPTX) are ZIP archives
  // They all start with PK (0x50 0x4B 0x03 0x04)
  docx: [[0x50, 0x4b, 0x03, 0x04]],
  xlsx: [[0x50, 0x4b, 0x03, 0x04]],
  pptx: [[0x50, 0x4b, 0x03, 0x04]],
  // PDF starts with %PDF-
  pdf: [[0x25, 0x50, 0x44, 0x46, 0x2d]], // %PDF-
};

/**
 * MIME types expected for each file type
 */
const EXPECTED_MIMES: Record<SupportedFileType, string[]> = {
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream', // Some browsers report this
  ],
  xlsx: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream',
  ],
  pptx: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/octet-stream',
  ],
  pdf: [
    'application/pdf',
    'application/octet-stream',
  ],
};

/**
 * Result of file type validation
 */
export interface FileTypeValidation {
  /** Whether the file passed all validation checks */
  valid: boolean;
  /** The detected file type (if valid) */
  fileType: SupportedFileType | null;
  /** Error message if validation failed */
  error?: string;
  /** Warnings that don't prevent processing but should be noted */
  warnings: string[];
}

/**
 * Check if magic bytes match any of the expected signatures
 */
function matchesMagicBytes(bytes: Uint8Array, signatures: number[][]): boolean {
  for (const signature of signatures) {
    if (bytes.length < signature.length) continue;

    let matches = true;
    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  return false;
}

/**
 * Get file extension (lowercase, with dot)
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Map extension to file type
 */
const EXTENSION_MAP: Record<string, SupportedFileType> = {
  '.docx': 'docx',
  '.xlsx': 'xlsx',
  '.pptx': 'pptx',
  '.pdf': 'pdf',
};

/**
 * Validate file type using extension, MIME type, and magic bytes
 *
 * @param file - The file to validate
 * @returns Validation result with file type and any errors/warnings
 */
export async function validateFileType(file: File): Promise<FileTypeValidation> {
  const warnings: string[] = [];

  // Step 1: Check extension
  const ext = getExtension(file.name);
  const typeByExt = EXTENSION_MAP[ext];

  if (!typeByExt) {
    return {
      valid: false,
      fileType: null,
      error: `Unsupported file extension: ${ext}`,
      warnings,
    };
  }

  // Step 2: Check MIME type (warning only - browsers are inconsistent)
  const expectedMimes = EXPECTED_MIMES[typeByExt];
  if (!expectedMimes.includes(file.type) && file.type !== '') {
    warnings.push(`Unexpected MIME type: ${file.type} (expected ${expectedMimes[0]})`);
  }

  // Step 3: Check magic bytes (strict validation)
  try {
    const headerSize = Math.max(...MAGIC_SIGNATURES[typeByExt].map(s => s.length));
    const header = await file.slice(0, headerSize).arrayBuffer();
    const bytes = new Uint8Array(header);

    const expectedSignatures = MAGIC_SIGNATURES[typeByExt];
    if (!matchesMagicBytes(bytes, expectedSignatures)) {
      // Special case: Office formats share ZIP signature
      // Check if it's any Office format when expecting one
      const officeTypes: SupportedFileType[] = ['docx', 'xlsx', 'pptx'];
      if (officeTypes.includes(typeByExt)) {
        const isZip = matchesMagicBytes(bytes, [[0x50, 0x4b, 0x03, 0x04]]);
        if (!isZip) {
          return {
            valid: false,
            fileType: null,
            error: `File header does not match ${ext.toUpperCase()} format. File may be corrupted or misnamed.`,
            warnings,
          };
        }
        // It's a ZIP but we can't verify it's the right Office type without parsing
        // Add a warning but allow processing
        warnings.push('File is a valid ZIP archive but specific Office format cannot be verified without parsing');
      } else {
        return {
          valid: false,
          fileType: null,
          error: `File header does not match ${ext.toUpperCase()} format. File may be corrupted or misnamed.`,
          warnings,
        };
      }
    }
  } catch (error) {
    warnings.push('Could not verify file header (file may be too small or corrupted)');
  }

  return {
    valid: true,
    fileType: typeByExt,
    warnings,
  };
}

/**
 * Quick check if a file is likely valid based on extension only
 * Use validateFileType for full validation with magic bytes
 */
export function hasValidExtension(filename: string): boolean {
  const ext = getExtension(filename);
  return ext in EXTENSION_MAP;
}

/**
 * Get file type from extension (quick check, no magic byte validation)
 */
export function getFileTypeFromExtension(filename: string): SupportedFileType | null {
  const ext = getExtension(filename);
  return EXTENSION_MAP[ext] || null;
}
