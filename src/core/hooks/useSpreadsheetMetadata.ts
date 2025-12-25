/**
 * useSpreadsheetMetadata Hook
 * Extracts spreadsheet structure WITHOUT reading sensitive cell values.
 * This allows column selection UI while maintaining privacy.
 */

import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { SpreadsheetMetadata, SheetMetadata } from '@/core/types';

interface UseSpreadsheetMetadataResult {
  /**
   * Extract metadata from an XLSX file
   * @param file - The File object to analyze
   * @param includeHeaders - Whether to include first row values as sample headers
   * @returns Promise resolving to spreadsheet metadata
   */
  extractMetadata: (
    file: File,
    includeHeaders?: boolean
  ) => Promise<SpreadsheetMetadata>;
}

/**
 * Hook for extracting spreadsheet structure metadata.
 * Used to show column selection UI before scanning.
 */
export function useSpreadsheetMetadata(): UseSpreadsheetMetadataResult {
  const extractMetadata = useCallback(
    async (file: File, includeHeaders = true): Promise<SpreadsheetMetadata> => {
      const arrayBuffer = await file.arrayBuffer();

      // Parse with minimal options - only need structure
      const workbook = XLSX.read(arrayBuffer, {
        type: 'array',
        // Only read first row if headers needed, otherwise just structure
        sheetRows: includeHeaders ? 1 : 0,
      });

      const sheets: SheetMetadata[] = [];
      let totalCells = 0;
      let globalMinCol = 'Z';
      let globalMaxCol = 'A';

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];

        // Skip if no reference (empty sheet)
        if (!sheet['!ref']) {
          sheets.push({
            name: sheetName,
            columns: [],
            rowCount: 0,
            columnCount: 0,
          });
          continue;
        }

        const range = XLSX.utils.decode_range(sheet['!ref']);
        const rowCount = range.e.r - range.s.r + 1;
        const columnCount = range.e.c - range.s.c + 1;

        // Build list of column letters
        const columns: string[] = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          const colLetter = XLSX.utils.encode_col(col);
          columns.push(colLetter);

          // Track global min/max
          if (colLetter < globalMinCol) globalMinCol = colLetter;
          if (colLetter > globalMaxCol) globalMaxCol = colLetter;
        }

        // Extract first row as headers if requested
        let sampleHeaders: string[] | undefined;
        if (includeHeaders && range.s.r <= range.e.r) {
          sampleHeaders = [];
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddr = XLSX.utils.encode_cell({ r: range.s.r, c: col });
            const cell = sheet[cellAddr];
            sampleHeaders.push(
              cell?.v !== undefined ? String(cell.v) : ''
            );
          }
        }

        totalCells += rowCount * columnCount;

        sheets.push({
          name: sheetName,
          columns,
          rowCount,
          columnCount,
          sampleHeaders,
        });
      }

      return {
        sheets,
        totalCells,
        columnRange: {
          min: globalMinCol,
          max: globalMaxCol,
        },
      };
    },
    []
  );

  return { extractMetadata };
}

/**
 * Utility to convert column letter to index (A=0, B=1, etc.)
 */
export function columnLetterToIndex(letter: string): number {
  return XLSX.utils.decode_col(letter);
}

/**
 * Utility to convert column index to letter (0=A, 1=B, etc.)
 */
export function columnIndexToLetter(index: number): string {
  return XLSX.utils.encode_col(index);
}
