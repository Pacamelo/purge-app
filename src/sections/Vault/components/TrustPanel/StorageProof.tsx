/**
 * StorageProof Component
 * Before/after storage comparison proving no data saved
 */

import { memo } from 'react';
import type { StorageSnapshot } from '@/core/types';

interface StorageProofProps {
  beforeSnapshot: StorageSnapshot | null;
  afterSnapshot: StorageSnapshot | null;
  isDifferent: boolean;
  watermarkStatus: 'not_planted' | 'planted' | 'verified' | 'failed';
}

interface StorageRowProps {
  label: string;
  before: number | undefined;
  after: number | undefined;
  changed: boolean;
}

const StorageRow = memo(function StorageRow({
  label,
  before,
  after,
  changed,
}: StorageRowProps) {
  return (
    <tr>
      <td className="pr-4 text-forge-text-dim">{label}</td>
      <td className="pr-4 text-center">{before ?? '-'}</td>
      <td className="pr-4 text-center">{after ?? '-'}</td>
      <td
        className={`text-center ${
          changed ? 'text-forge-warning' : 'text-forge-success'
        }`}
      >
        {after !== undefined
          ? changed
            ? 'CHANGED'
            : 'UNCHANGED'
          : '-'}
      </td>
    </tr>
  );
});

export const StorageProof = memo(function StorageProof({
  beforeSnapshot,
  afterSnapshot,
  isDifferent,
  watermarkStatus,
}: StorageProofProps) {
  const hasSnapshots = beforeSnapshot && afterSnapshot;

  return (
    <div className="trust-panel p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase text-forge-text-dim">
          Storage Integrity Check
        </span>
        {watermarkStatus === 'verified' && (
          <span className="text-xs text-forge-success">✓ WATERMARK VERIFIED</span>
        )}
      </div>

      {/* Storage comparison table */}
      <div className="bg-black/30 p-2 rounded text-xs font-mono">
        <table className="w-full">
          <thead>
            <tr className="text-forge-text-dim">
              <th className="text-left pr-4">Storage</th>
              <th className="text-center pr-4">Before</th>
              <th className="text-center pr-4">After</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <StorageRow
              label="localStorage"
              before={beforeSnapshot?.localStorage}
              after={afterSnapshot?.localStorage}
              changed={
                !!(hasSnapshots &&
                beforeSnapshot.localStorage !== afterSnapshot.localStorage)
              }
            />
            <StorageRow
              label="sessionStorage"
              before={
                beforeSnapshot?.watermarkPlanted
                  ? beforeSnapshot.sessionStorage - 1
                  : beforeSnapshot?.sessionStorage
              }
              after={afterSnapshot?.sessionStorage}
              changed={
                !!(hasSnapshots &&
                (beforeSnapshot.watermarkPlanted
                  ? beforeSnapshot.sessionStorage - 1
                  : beforeSnapshot.sessionStorage) !== afterSnapshot.sessionStorage)
              }
            />
            <StorageRow
              label="IndexedDB"
              before={beforeSnapshot?.indexedDB}
              after={afterSnapshot?.indexedDB}
              changed={
                !!(hasSnapshots &&
                beforeSnapshot.indexedDB !== afterSnapshot.indexedDB)
              }
            />
            <StorageRow
              label="Cookies"
              before={beforeSnapshot?.cookies}
              after={afterSnapshot?.cookies}
              changed={
                !!(hasSnapshots && beforeSnapshot.cookies !== afterSnapshot.cookies)
              }
            />
          </tbody>
        </table>
      </div>

      {/* Watermark status */}
      {watermarkStatus !== 'not_planted' && (
        <div className="mt-2 text-xs">
          <span className="text-forge-text-dim">Watermark: </span>
          {watermarkStatus === 'planted' && (
            <span className="text-forge-warning">PLANTED (pending verification)</span>
          )}
          {watermarkStatus === 'verified' && (
            <span className="text-forge-success">✓ REMOVED (never persisted)</span>
          )}
          {watermarkStatus === 'failed' && (
            <span className="text-forge-error">✗ VERIFICATION FAILED</span>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="mt-2 text-xs">
        {!hasSnapshots ? (
          <span className="text-forge-text-dim">
            Waiting for processing to complete...
          </span>
        ) : isDifferent ? (
          <span className="trust-indicator-warning">
            ⚠ Storage changed during processing
          </span>
        ) : (
          <span className="trust-indicator-good">
            ✓ No data saved to browser storage
          </span>
        )}
      </div>
    </div>
  );
});
