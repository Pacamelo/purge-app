/**
 * XlsxProcessor
 * Excel document processor using xlsx library
 *
 * SECURITY: This processor rebuilds the output file from scratch rather than
 * modifying the original. This approach strips:
 * - Document properties (author, company, etc.)
 * - Hidden sheets
 * - Comments and notes
 * - Formulas (converted to values only)
 * - Custom XML parts
 * - External links
 *
 * M-8 WARNING: Formula cells are converted to their calculated values.
 * If a formula references hidden cells containing PII (e.g., =A1 where A1
 * contains "John Doe's SSN: 123-45-6789"), the PII will appear in the
 * formula cell's value. Users should review formula cells carefully and
 * ensure hidden columns/sheets don't contain sensitive data that formulas
 * reference.
 */

import * as XLSX from 'xlsx';
import type {
  ParsedDocument,
  Redaction,
  DocumentContent,
  ContentSection,
  ColumnSelectionConfig,
  ColumnAttestation,
} from '@/core/types';
import { BaseProcessor, generateSectionId } from './BaseProcessor';
import { generateSecureId } from '@/core/utils/secureRandom';

/**
 * Options for parsing XLSX files
 */
export interface XlsxParseOptions {
  /** Column selection configuration for selective parsing */
  columnSelection?: ColumnSelectionConfig;
  /** Whether to generate attestations for skipped columns */
  generateAttestation?: boolean;
}

interface XlsxRawData {
  workbook: XLSX.WorkBook;
  sheets: Map<string, XLSX.WorkSheet>;
  /** Attestations proving which columns were never accessed */
  columnAttestations?: ColumnAttestation[];
  /** M-8: Count of formula cells that were converted to values */
  formulaCellCount?: number;
  /** M-8: Warning if formula cells were found */
  formulaWarning?: string;
}

export class XlsxProcessor extends BaseProcessor {
  readonly fileType = 'xlsx' as const;
  readonly mimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  readonly extensions = ['.xlsx', '.xls'];

  /**
   * Parse Excel file and extract text from cells.
   * Supports selective column parsing with attestation generation.
   *
   * @param file - The Excel file to parse
   * @param options - Optional parsing options for column selection
   */
  async parse(file: File, options: XlsxParseOptions = {}): Promise<ParsedDocument> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const sections: ContentSection[] = [];
    const sheets = new Map<string, XLSX.WorkSheet>();
    const attestations: ColumnAttestation[] = [];

    // M-8: Track formula cells for warning
    let formulaCellCount = 0;

    const { columnSelection, generateAttestation = false } = options;
    const processAllColumns = !columnSelection || columnSelection.mode === 'all';

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      // Check if this sheet should be processed
      if (
        columnSelection?.mode === 'selected' &&
        columnSelection.selectedSheets.size > 0 &&
        !columnSelection.selectedSheets.has(sheetName)
      ) {
        continue; // Skip unselected sheets entirely
      }

      const sheet = workbook.Sheets[sheetName];
      sheets.set(sheetName, sheet);

      // Get the range of cells
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

      // Iterate through columns first for selective processing
      for (let col = range.s.c; col <= range.e.c; col++) {
        const colLetter = XLSX.utils.encode_col(col);

        // Check if this column should be processed
        const shouldProcess =
          processAllColumns || columnSelection!.selectedColumns.has(colLetter);

        if (!shouldProcess) {
          // SKIP THIS COLUMN - Generate attestation instead
          if (generateAttestation) {
            const attestation = await this.generateColumnAttestation(
              sheet,
              sheetName,
              col,
              colLetter,
              range
            );
            attestations.push(attestation);
          }
          continue; // CRITICAL: Never read cell values from this column
        }

        // Process selected column cells
        for (let row = range.s.r; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = sheet[cellAddress];

          if (cell && cell.v !== undefined && cell.v !== null) {
            const text = String(cell.v);

            // M-8: Track if this is a formula cell (has 'f' property)
            if (cell.f) {
              formulaCellCount++;
            }

            // Only include non-empty cells
            if (text.trim()) {
              sections.push({
                id: generateSectionId(),
                text,
                type: 'cell',
                location: {
                  sheet: sheetName,
                  cell: cellAddress,
                },
              });
            }
          }
        }
      }
    }

    const content: DocumentContent = {
      fileId: `xlsx-${generateSecureId()}`,
      fileName: file.name,
      fileType: 'xlsx',
      sections,
    };

    // M-8: Generate warning if formula cells were found
    const formulaWarning = formulaCellCount > 0
      ? `Found ${formulaCellCount} formula cell(s). Formula values may contain PII from referenced cells. Review carefully.`
      : undefined;

    return {
      content,
      metadata: {
        sheetCount: workbook.SheetNames.length,
        sheetNames: workbook.SheetNames,
        columnAttestations: attestations.length > 0 ? attestations : undefined,
        formulaCellCount: formulaCellCount > 0 ? formulaCellCount : undefined,
        formulaWarning,
      },
      rawData: {
        workbook,
        sheets,
        columnAttestations: attestations.length > 0 ? attestations : undefined,
        formulaCellCount,
        formulaWarning,
      } as XlsxRawData,
    };
  }

  /**
   * Generate metadata record for a skipped column.
   *
   * NOTE: This does NOT cryptographically prove anything meaningful.
   * It just records column metadata (position, cell count). The hash
   * is of this metadata string, not the actual cell values. This is
   * for internal tracking only - we removed the misleading
   * "cryptographic attestation" claim from the UI.
   */
  private async generateColumnAttestation(
    sheet: XLSX.WorkSheet,
    sheetName: string,
    colIndex: number,
    colLetter: string,
    range: XLSX.Range
  ): Promise<ColumnAttestation> {
    // Count cells in column (checking existence, not reading values)
    let cellCount = 0;
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: colIndex });
      if (sheet[cellAddress]) cellCount++;
    }

    // Create fingerprint from metadata ONLY (no cell values)
    const columnFingerprint = `${sheetName}:${colLetter}:${cellCount}:${range.e.r - range.s.r + 1}:${Date.now()}`;

    // Compute SHA-256 hash
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(columnFingerprint)
    );
    const rawBytesHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      column: colLetter,
      sheet: sheetName,
      cellCount,
      rawBytesHash,
      wasAccessed: false,
    };
  }

  /**
   * Apply redactions and generate new Excel file
   *
   * SECURITY: This method rebuilds the workbook from scratch to strip metadata.
   * Only cell values are copied - no formulas, comments, properties, or hidden sheets.
   */
  async applyRedactions(
    document: ParsedDocument,
    redactions: Redaction[]
  ): Promise<Blob> {
    const { workbook } = document.rawData as XlsxRawData;

    // Create a map of section ID to redaction for quick lookup
    const redactionMap = new Map<string, Redaction>();
    for (const redaction of redactions) {
      redactionMap.set(redaction.sectionId, redaction);
    }

    // Build a map of cell locations to redacted values
    const cellRedactions = new Map<string, string>();
    for (const section of document.content.sections) {
      const redaction = redactionMap.get(section.id);
      if (redaction && section.location.sheet && section.location.cell) {
        const key = `${section.location.sheet}!${section.location.cell}`;
        const newText = this.applyTextRedactions(
          section.text,
          [redaction],
          section.id
        );
        cellRedactions.set(key, newText);
      }
    }

    // Create a brand new workbook (strips all metadata)
    const newWorkbook = XLSX.utils.book_new();

    // Process each visible sheet
    for (const sheetName of workbook.SheetNames) {
      const originalSheet = workbook.Sheets[sheetName];

      // Skip hidden sheets (they might contain sensitive data)
      // SheetNames includes all sheets; we check visibility via !state
      const sheetState = originalSheet['!state'];
      if (sheetState === 'hidden' || sheetState === 'veryHidden') {
        continue;
      }

      // Create new sheet with only cell values (no formulas, comments, etc.)
      const newSheet: XLSX.WorkSheet = {};

      // Get the range of the original sheet
      const ref = originalSheet['!ref'];
      if (!ref) continue;

      const range = XLSX.utils.decode_range(ref);

      // Copy only cell values (not formulas, comments, etc.)
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const originalCell = originalSheet[cellAddress];

          if (originalCell && originalCell.v !== undefined && originalCell.v !== null) {
            // Check if this cell has a redaction
            const redactionKey = `${sheetName}!${cellAddress}`;
            const redactedValue = cellRedactions.get(redactionKey);

            // Use redacted value if available, otherwise use original value (as string)
            const value = redactedValue !== undefined ? redactedValue : String(originalCell.v);

            // Create new cell with value only (no formula, no rich formatting)
            newSheet[cellAddress] = {
              t: 's', // String type
              v: value,
            };
          }
        }
      }

      // Set the sheet range
      newSheet['!ref'] = ref;

      // Copy column widths (not sensitive, improves usability)
      if (originalSheet['!cols']) {
        newSheet['!cols'] = originalSheet['!cols'].map(col => ({
          wch: col?.wch,
          wpx: col?.wpx,
        }));
      }

      // Add sheet to new workbook
      XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
    }

    // Add PURGE metadata (transparent branding, not hidden)
    // This helps users track which files have been processed
    newWorkbook.Props = {
      Title: document.content.fileName.replace(/\.[^/.]+$/, '') + ' (PURGED)',
      Author: 'PURGE - purgedata.app',
      Comments: `Processed locally by PURGE on ${new Date().toISOString()}. No data was transmitted.`,
    };

    // Write to buffer with PURGE metadata
    const output = XLSX.write(newWorkbook, {
      type: 'array',
      bookType: 'xlsx',
    });

    return new Blob([output], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}

// Singleton instance
export const xlsxProcessor = new XlsxProcessor();
