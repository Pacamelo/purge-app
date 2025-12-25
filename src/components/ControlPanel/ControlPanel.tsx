/**
 * ControlPanel Component
 * LED indicators and digital counter for the shredder
 */

import { memo } from 'react';
import type { PurgeState } from '@/core/types';
import { LEDIndicator } from './LEDIndicator';
import { DigitalCounter } from './DigitalCounter';

interface ControlPanelProps {
  state: PurgeState;
  fileCount: number;
  onClearJam?: () => void;
}

export const ControlPanel = memo(function ControlPanel({
  state,
  fileCount,
  onClearJam,
}: ControlPanelProps) {
  const isJammed = state === 'jammed';
  const isProcessing = state === 'scanning' || state === 'shredding';
  const isReady = state === 'idle' || state === 'loaded';

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-forge-bg-tertiary border-b border-forge-border">
      {/* LED Indicators */}
      <div className="flex items-center gap-4">
        <LEDIndicator label="POWER" status="on" />
        <LEDIndicator
          label="READY"
          status={isReady ? 'ready' : 'off'}
        />
        <LEDIndicator
          label="RUN"
          status={isProcessing ? 'processing' : 'off'}
        />
        <LEDIndicator
          label="JAM"
          status={isJammed ? 'jam' : 'off'}
        />
      </div>

      {/* Digital Counter */}
      <div className="flex items-center gap-3">
        <DigitalCounter value={fileCount} digits={4} label="FILES" />

        {/* Clear Jam Button */}
        {isJammed && onClearJam && (
          <button
            onClick={onClearJam}
            className="px-3 py-1 text-xs font-mono uppercase
                       bg-forge-error/20 border border-forge-error
                       text-forge-error hover:bg-forge-error hover:text-white
                       transition-colors"
          >
            CLEAR JAM
          </button>
        )}
      </div>
    </div>
  );
});
