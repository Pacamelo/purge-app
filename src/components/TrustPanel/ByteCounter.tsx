/**
 * ByteCounter Component
 *
 * Visual comparison of local processing vs. uploaded bytes.
 *
 * IMPORTANT: This is SELF-REPORTED by the app.
 * The disclaimer is REQUIRED - this is visualization, not proof.
 * For genuine proof, use Airplane Mode or DevTools.
 */

import { memo, useEffect, useState } from 'react';

interface ByteCounterProps {
  /** Bytes processed locally */
  localBytesProcessed: number;
  /** Bytes uploaded (should always be 0 in our case) */
  uploadedBytes: number;
  /** Whether processing is currently active */
  isProcessing: boolean;
  /** Whether processing has completed */
  hasCompleted: boolean;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 bytes';
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Animated counter that counts up
 */
const AnimatedCounter = memo(function AnimatedCounter({
  value,
  isAnimating,
}: {
  value: number;
  isAnimating: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isAnimating) {
      setDisplayValue(value);
      return;
    }

    // Animate counting up
    const duration = 1000; // 1 second
    const steps = 20;
    const increment = value / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value, isAnimating]);

  return <span className="font-mono tabular-nums">{formatBytes(displayValue)}</span>;
});

/**
 * Progress bar visualization
 */
const ProgressBar = memo(function ProgressBar({
  value,
  max,
  color,
  isEmpty,
}: {
  value: number;
  max: number;
  color: 'success' | 'error' | 'dim';
  isEmpty: boolean;
}) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  const colorClasses = {
    success: 'bg-forge-success',
    error: 'bg-forge-error',
    dim: 'bg-forge-text-dim',
  };

  return (
    <div className="h-3 bg-forge-bg-primary border border-forge-border overflow-hidden">
      {isEmpty ? (
        <div className="h-full flex items-center justify-center">
          <span className="text-[8px] text-forge-text-dim uppercase tracking-wider">empty</span>
        </div>
      ) : (
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      )}
    </div>
  );
});

export const ByteCounter = memo(function ByteCounter({
  localBytesProcessed,
  uploadedBytes,
  isProcessing,
  hasCompleted,
}: ByteCounterProps) {
  const maxBytes = Math.max(localBytesProcessed, uploadedBytes, 1);

  return (
    <div className="border border-forge-border bg-forge-bg-tertiary p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📊</span>
        <h3 className="text-sm font-mono font-bold text-forge-text-primary uppercase tracking-wider">
          Processing Summary
        </h3>
        {isProcessing && (
          <span className="text-xs text-forge-accent animate-pulse">LIVE</span>
        )}
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Local Processing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-forge-text-dim uppercase tracking-wider">
              Local Processing
            </span>
            <span className="text-xs text-forge-success">✓</span>
          </div>
          <div className="text-lg font-bold text-forge-success">
            <AnimatedCounter value={localBytesProcessed} isAnimating={isProcessing} />
          </div>
          <ProgressBar
            value={localBytesProcessed}
            max={maxBytes}
            color="success"
            isEmpty={localBytesProcessed === 0}
          />
        </div>

        {/* Uploaded to Cloud */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-forge-text-dim uppercase tracking-wider">
              Uploaded to Cloud
            </span>
            {uploadedBytes === 0 && hasCompleted && (
              <span className="text-xs text-forge-success">✓ NONE</span>
            )}
          </div>
          <div className="text-lg font-bold text-forge-text-dim">
            {uploadedBytes === 0 ? (
              <span className="text-forge-success">0 bytes</span>
            ) : (
              <AnimatedCounter value={uploadedBytes} isAnimating={isProcessing} />
            )}
          </div>
          <ProgressBar
            value={uploadedBytes}
            max={maxBytes}
            color={uploadedBytes > 0 ? 'error' : 'dim'}
            isEmpty={uploadedBytes === 0}
          />
        </div>
      </div>

      {/* Result message */}
      {hasCompleted && (
        <div
          className={`
            p-2 text-center border text-sm font-mono
            ${uploadedBytes === 0 ? 'border-forge-success bg-forge-success/10 text-forge-success' : 'border-forge-error bg-forge-error/10 text-forge-error'}
          `}
        >
          {uploadedBytes === 0
            ? 'All processing happened locally'
            : `Warning: ${formatBytes(uploadedBytes)} was uploaded`}
        </div>
      )}

      {/* REQUIRED DISCLAIMER */}
      <div className="mt-4 p-2 bg-forge-bg-primary border border-forge-warning/30">
        <div className="flex items-start gap-2">
          <span className="text-forge-warning">ⓘ</span>
          <p className="text-xs text-forge-text-secondary">
            <strong className="text-forge-warning">Honesty note:</strong> This counter is
            self-reported by our app. For independent verification, check your browser's{' '}
            <span className="text-forge-accent">Network tab</span> in DevTools, or enable{' '}
            <span className="text-forge-accent">Airplane Mode</span> before processing.
          </p>
        </div>
      </div>
    </div>
  );
});
