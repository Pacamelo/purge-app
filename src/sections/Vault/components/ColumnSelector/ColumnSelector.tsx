/**
 * ColumnSelector Component
 * Pre-scan column selection UI for XLSX files.
 * Shows spreadsheet structure and lets users choose which columns to scan.
 */

import { memo, useState, useCallback, useMemo } from 'react';
import type { SpreadsheetMetadata, ColumnSelectionConfig } from '@/core/types';

interface ColumnSelectorProps {
  /** Spreadsheet structure metadata */
  metadata: SpreadsheetMetadata;
  /** Current column selection configuration */
  selection: ColumnSelectionConfig;
  /** Callback when selection changes */
  onSelectionChange: (config: ColumnSelectionConfig) => void;
  /** Callback when user confirms selection */
  onConfirm: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** If true, don't show sample headers (maximum privacy) */
  paranoidMode?: boolean;
  /** Callback when paranoid mode changes */
  onParanoidModeChange?: (enabled: boolean) => void;
}

export const ColumnSelector = memo(function ColumnSelector({
  metadata,
  selection,
  onSelectionChange,
  onConfirm,
  onCancel,
  paranoidMode = false,
  onParanoidModeChange,
}: ColumnSelectorProps) {
  // Track which sheet tab is active
  const [activeSheet, setActiveSheet] = useState(metadata.sheets[0]?.name || '');

  // Get the currently active sheet metadata
  const activeSheetMeta = useMemo(
    () => metadata.sheets.find((s) => s.name === activeSheet),
    [metadata.sheets, activeSheet]
  );

  // Toggle a single column
  const toggleColumn = useCallback(
    (colLetter: string) => {
      const newSelected = new Set(selection.selectedColumns);
      if (newSelected.has(colLetter)) {
        newSelected.delete(colLetter);
      } else {
        newSelected.add(colLetter);
      }
      onSelectionChange({
        ...selection,
        mode: 'selected',
        selectedColumns: newSelected,
      });
    },
    [selection, onSelectionChange]
  );

  // Select all columns
  const selectAll = useCallback(() => {
    const allColumns = new Set<string>();
    metadata.sheets.forEach((sheet) => {
      sheet.columns.forEach((col) => allColumns.add(col));
    });
    onSelectionChange({
      ...selection,
      mode: 'selected',
      selectedColumns: allColumns,
    });
  }, [metadata.sheets, selection, onSelectionChange]);

  // Deselect all columns
  const deselectAll = useCallback(() => {
    onSelectionChange({
      ...selection,
      mode: 'selected',
      selectedColumns: new Set(),
    });
  }, [selection, onSelectionChange]);

  // Invert selection
  const invertSelection = useCallback(() => {
    const allColumns = new Set<string>();
    const inverted = new Set<string>();
    metadata.sheets.forEach((sheet) => {
      sheet.columns.forEach((col) => {
        allColumns.add(col);
        if (!selection.selectedColumns.has(col)) {
          inverted.add(col);
        }
      });
    });
    onSelectionChange({
      ...selection,
      mode: 'selected',
      selectedColumns: inverted,
    });
  }, [metadata.sheets, selection, onSelectionChange]);

  // Count excluded columns for display
  const excludedCount = useMemo(() => {
    const allColumns = new Set<string>();
    metadata.sheets.forEach((sheet) => {
      sheet.columns.forEach((col) => allColumns.add(col));
    });
    return allColumns.size - selection.selectedColumns.size;
  }, [metadata.sheets, selection.selectedColumns]);

  const selectedCount = selection.selectedColumns.size;
  const canConfirm = selectedCount > 0;

  return (
    <div className="bg-forge-bg-secondary border border-forge-border p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-forge-accent uppercase tracking-wider">
          Select Columns to Scan
        </h3>
        <p className="text-xs text-forge-text-secondary mt-1">
          Only selected columns will be scanned for PII. Unselected columns are skipped.
        </p>
      </div>

      {/* Sheet tabs (if multiple sheets) */}
      {metadata.sheets.length > 1 && (
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {metadata.sheets.map((sheet) => (
            <button
              key={sheet.name}
              onClick={() => setActiveSheet(sheet.name)}
              className={`
                px-3 py-1 text-xs uppercase tracking-wider whitespace-nowrap
                border transition-colors
                ${
                  activeSheet === sheet.name
                    ? 'bg-forge-accent/20 border-forge-accent text-forge-accent'
                    : 'bg-forge-bg-tertiary border-forge-border text-forge-text-secondary hover:border-forge-accent'
                }
              `}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}

      {/* Column grid */}
      {activeSheetMeta && (
        <div className="mb-4">
          <div className="text-xs text-forge-text-dim mb-2">
            {activeSheetMeta.rowCount} rows × {activeSheetMeta.columnCount} columns
          </div>

          {/* Column checkboxes */}
          <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto p-2 bg-forge-bg-tertiary border border-forge-border">
            {activeSheetMeta.columns.map((col, idx) => {
              const isSelected = selection.selectedColumns.has(col);
              const header = !paranoidMode && activeSheetMeta.sampleHeaders?.[idx];

              return (
                <button
                  key={col}
                  onClick={() => toggleColumn(col)}
                  title={header ? `${col}: ${header}` : `Column ${col}`}
                  className={`
                    w-12 h-12 flex flex-col items-center justify-center
                    border text-xs font-mono transition-all
                    ${
                      isSelected
                        ? 'bg-forge-accent/20 border-forge-accent text-forge-accent'
                        : 'bg-forge-bg-primary border-forge-border text-forge-text-dim hover:border-forge-text-secondary'
                    }
                  `}
                >
                  <span className="font-bold">{col}</span>
                  {header && (
                    <span className="text-[8px] truncate w-full text-center opacity-70">
                      {header.slice(0, 6)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={selectAll}
          className="px-3 py-1 text-xs uppercase tracking-wider bg-forge-bg-tertiary border border-forge-border text-forge-text-secondary hover:border-forge-accent transition-colors"
        >
          Select All
        </button>
        <button
          onClick={deselectAll}
          className="px-3 py-1 text-xs uppercase tracking-wider bg-forge-bg-tertiary border border-forge-border text-forge-text-secondary hover:border-forge-accent transition-colors"
        >
          Deselect All
        </button>
        <button
          onClick={invertSelection}
          className="px-3 py-1 text-xs uppercase tracking-wider bg-forge-bg-tertiary border border-forge-border text-forge-text-secondary hover:border-forge-accent transition-colors"
        >
          Invert
        </button>
      </div>

      {/* Status message */}
      {excludedCount > 0 && (
        <div className="mb-4 p-2 bg-forge-bg-tertiary border border-forge-border text-xs">
          <span className="text-forge-warning">⚠</span>{' '}
          <span className="text-forge-text-secondary">
            {excludedCount} column{excludedCount !== 1 ? 's' : ''} will{' '}
            <strong className="text-forge-text-primary">NOT</strong> be scanned.
            They will be copied to output unchanged (no PII detection).
          </span>
        </div>
      )}

      {/* Paranoid mode toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-xs text-forge-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={paranoidMode}
            onChange={(e) => onParanoidModeChange?.(e.target.checked)}
            className="accent-forge-accent"
            disabled={!onParanoidModeChange}
          />
          <span>Paranoid Mode: Hide sample column headers</span>
        </label>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs uppercase tracking-wider bg-forge-bg-tertiary border border-forge-border text-forge-text-secondary hover:border-forge-accent transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          className={`
            px-4 py-2 text-xs uppercase tracking-wider border transition-colors
            ${
              canConfirm
                ? 'bg-forge-accent/20 border-forge-accent text-forge-accent hover:bg-forge-accent/30'
                : 'bg-forge-bg-tertiary border-forge-border text-forge-text-dim cursor-not-allowed'
            }
          `}
        >
          Scan {selectedCount} Column{selectedCount !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
});

export default ColumnSelector;
