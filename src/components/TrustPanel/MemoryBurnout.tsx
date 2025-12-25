/**
 * MemoryBurnout Component
 * Visual representation of buffer cleanup after processing.
 *
 * NOTE: This is a visualization only. JavaScript cannot guarantee secure
 * memory wiping. The original file data may persist in browser memory
 * until garbage collected. This provides visual feedback, not security.
 */

import { memo } from 'react';
import type { MemoryStats } from '@/core/types';

interface MemoryBurnoutProps {
  stats: MemoryStats;
  isActive: boolean;
}

/**
 * Format bytes for display
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const MemoryBurnout = memo(function MemoryBurnout({
  stats,
  isActive,
}: MemoryBurnoutProps) {
  const progress = stats.allocated > 0 ? (stats.wiped / stats.allocated) * 100 : 0;
  const isComplete = progress >= 100;

  return (
    <div className="trust-panel p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase text-forge-text-dim">
          Buffer Cleanup
        </span>
        {isActive && (
          <span className="text-xs text-forge-error animate-pulse">
            BURNING...
          </span>
        )}
        {isComplete && (
          <span className="text-xs text-forge-success">✓ COMPLETE</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="memory-bar relative">
        <div
          className="memory-bar-fill"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
        {isActive && progress < 100 && <div className="memory-fire" />}
      </div>

      {/* Stats */}
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-forge-text-dim">Allocated:</span>
          <br />
          <span className="text-forge-text-secondary font-mono">
            {formatBytes(stats.allocated)}
          </span>
        </div>
        <div>
          <span className="text-forge-text-dim">Zeroed:</span>
          <br />
          <span
            className={`font-mono ${
              isComplete ? 'text-forge-success' : 'text-forge-accent'
            }`}
          >
            {formatBytes(stats.wiped)}
          </span>
        </div>
        <div>
          <span className="text-forge-text-dim">Buffers:</span>
          <br />
          <span
            className={`font-mono ${
              stats.buffersCleared === stats.totalBuffers
                ? 'text-forge-success'
                : 'text-forge-text-secondary'
            }`}
          >
            {stats.buffersCleared} / {stats.totalBuffers}
          </span>
        </div>
      </div>

      {/* Status */}
      <div className="mt-2 text-xs">
        {isComplete ? (
          <span className="trust-indicator-good">
            ✓ Processing complete - buffers cleared
          </span>
        ) : isActive ? (
          <span className="text-forge-warning">
            Clearing buffers...
          </span>
        ) : stats.allocated > 0 ? (
          <span className="text-forge-text-dim">
            Ready to clear {formatBytes(stats.allocated)}
          </span>
        ) : (
          <span className="text-forge-text-dim">No tracked buffers</span>
        )}
      </div>

      {/* M-2: Memory wipe disclaimer */}
      {isComplete && (
        <div className="mt-2 p-2 bg-[var(--forge-warning)]/10 border border-[var(--forge-warning)]/30 text-xs text-forge-text-dim">
          Note: Buffer zeroing is best-effort. For sensitive data, close browser after use.
        </div>
      )}
    </div>
  );
});
