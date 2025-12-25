/**
 * ProgressMeter Component
 * Visual progress indicator for shredding
 */

import { memo } from 'react';
import type { ProcessingProgress } from '@/core/types';

interface ProgressMeterProps {
  progress: ProcessingProgress;
}

const phaseLabels = {
  detecting: 'SCANNING FOR PII',
  redacting: 'SHREDDING DATA',
  finalizing: 'FINALIZING OUTPUT',
};

export const ProgressMeter = memo(function ProgressMeter({
  progress,
}: ProgressMeterProps) {
  return (
    <div className="p-4 bg-forge-bg-secondary border-y border-forge-border">
      {/* Phase label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase text-forge-text-dim">
          {phaseLabels[progress.phase]}
        </span>
        <span className="text-xs font-mono text-forge-accent">
          {progress.currentFileIndex + 1} / {progress.totalFiles} files
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-forge-bg-tertiary border border-forge-border overflow-hidden">
        <div
          className="h-full bg-forge-accent transition-all duration-300 ease-linear"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {/* Current file */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-forge-text-dim truncate max-w-[70%]">
          {progress.currentFileName}
        </span>
        <span className="text-xs font-mono text-forge-text-secondary">
          {progress.percent}%
        </span>
      </div>
    </div>
  );
});
