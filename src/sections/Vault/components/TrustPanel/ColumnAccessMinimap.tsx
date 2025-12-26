/**
 * ColumnAccessMinimap Component
 * Visual proof showing which columns were accessed vs. attested as untouched.
 * Part of the TrustPanel for XLSX column isolation verification.
 */

import { memo, useMemo } from 'react';
import type { SpreadsheetMetadata, ColumnAttestation } from '@/core/types';

interface ColumnAccessMinimapProps {
  /** Spreadsheet structure metadata */
  metadata: SpreadsheetMetadata;
  /** Which columns were selected for scanning */
  accessedColumns: Set<string>;
  /** Cells that contained redacted PII (format: "Sheet1!A5") */
  redactedCells?: Set<string>;
  /** Attestations for columns that were NOT accessed */
  attestations: ColumnAttestation[];
}

/**
 * Get cell state for visualization
 */
type CellState = 'untouched' | 'scanned' | 'redacted';

export const ColumnAccessMinimap = memo(function ColumnAccessMinimap({
  metadata,
  accessedColumns,
  redactedCells = new Set(),
  attestations,
}: ColumnAccessMinimapProps) {
  // Build a map of column -> attestation for quick lookup
  const attestationMap = useMemo(() => {
    const map = new Map<string, ColumnAttestation>();
    attestations.forEach((a) => {
      map.set(`${a.sheet}:${a.column}`, a);
    });
    return map;
  }, [attestations]);

  // Determine which columns have redacted cells
  const columnsWithRedactions = useMemo(() => {
    const cols = new Set<string>();
    redactedCells.forEach((cellRef) => {
      // Parse "Sheet1!A5" format
      const match = cellRef.match(/^(.+)!([A-Z]+)/);
      if (match) {
        cols.add(match[2]); // Just the column letter
      }
    });
    return cols;
  }, [redactedCells]);

  // Get column state
  const getColumnState = (col: string): CellState => {
    if (columnsWithRedactions.has(col)) return 'redacted';
    if (accessedColumns.has(col)) return 'scanned';
    return 'untouched';
  };

  // Count stats
  const stats = useMemo(() => {
    let untouched = 0;
    let scanned = 0;
    let redacted = 0;

    metadata.sheets.forEach((sheet) => {
      sheet.columns.forEach((col) => {
        const state = getColumnState(col);
        if (state === 'untouched') untouched++;
        else if (state === 'scanned') scanned++;
        else if (state === 'redacted') redacted++;
      });
    });

    return { untouched, scanned, redacted };
  }, [metadata.sheets, accessedColumns, columnsWithRedactions]);

  // First sheet for visualization (simplified view)
  const primarySheet = metadata.sheets[0];

  if (!primarySheet) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-forge-text-dim">
          Column Access Proof
        </span>
        {attestations.length > 0 && (
          <span className="text-xs text-forge-success">
            ✓ {attestations.length} columns verified untouched
          </span>
        )}
      </div>

      {/* Minimap grid */}
      <div className="flex flex-wrap gap-0.5 p-2 bg-forge-bg-tertiary border border-forge-border">
        {primarySheet.columns.map((col) => {
          const state = getColumnState(col);
          const attestation = attestationMap.get(`${primarySheet.name}:${col}`);

          return (
            <div
              key={col}
              title={
                state === 'untouched'
                  ? `Column ${col}: Never accessed\nHash: ${attestation?.rawBytesHash.slice(0, 16)}...`
                  : state === 'redacted'
                    ? `Column ${col}: Scanned, PII redacted`
                    : `Column ${col}: Scanned for PII`
              }
              className={`
                w-6 h-6 flex items-center justify-center
                text-[8px] font-mono border transition-all cursor-help
                ${
                  state === 'untouched'
                    ? 'bg-forge-bg-primary border-forge-success/50 text-forge-success'
                    : state === 'redacted'
                      ? 'bg-forge-error/20 border-forge-error text-forge-error'
                      : 'bg-forge-warning/20 border-forge-warning text-forge-warning'
                }
              `}
            >
              {state === 'untouched' ? '🔒' : state === 'redacted' ? '✗' : '○'}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-forge-bg-primary border border-forge-success/50 flex items-center justify-center text-[8px]">
            🔒
          </span>
          <span className="text-forge-text-secondary">
            Untouched ({stats.untouched})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-forge-warning/20 border border-forge-warning flex items-center justify-center text-[8px]">
            ○
          </span>
          <span className="text-forge-text-secondary">
            Scanned ({stats.scanned})
          </span>
        </div>
        {stats.redacted > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-forge-error/20 border border-forge-error flex items-center justify-center text-[8px]">
              ✗
            </span>
            <span className="text-forge-text-secondary">
              Redacted ({stats.redacted})
            </span>
          </div>
        )}
      </div>

      {/* Attestation details (expandable) */}
      {attestations.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-forge-text-dim hover:text-forge-accent">
            View attestation hashes
          </summary>
          <div className="mt-2 max-h-32 overflow-y-auto bg-forge-bg-primary border border-forge-border p-2 font-mono text-[10px]">
            {attestations.map((a) => (
              <div key={`${a.sheet}:${a.column}`} className="text-forge-text-secondary">
                <span className="text-forge-accent">{a.sheet}:{a.column}</span>
                {' → '}
                <span className="text-forge-success">{a.rawBytesHash.slice(0, 24)}...</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
});

export default ColumnAccessMinimap;
