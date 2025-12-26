/**
 * LEDIndicator Component
 * Individual LED light with label
 */

import { memo } from 'react';

type LEDStatus = 'off' | 'on' | 'ready' | 'processing' | 'jam';

interface LEDIndicatorProps {
  label: string;
  status: LEDStatus;
}

const statusClasses: Record<LEDStatus, string> = {
  off: 'led-off',
  on: 'led-power',
  ready: 'led-ready',
  processing: 'led-processing',
  jam: 'led-jam',
};

export const LEDIndicator = memo(function LEDIndicator({
  label,
  status,
}: LEDIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`led ${statusClasses[status]}`} />
      <span className="text-[10px] uppercase tracking-wider text-forge-text-dim">
        {label}
      </span>
    </div>
  );
});
