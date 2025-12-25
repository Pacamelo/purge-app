/**
 * DigitalCounter Component
 * 7-segment LED-style display
 */

import { memo } from 'react';

interface DigitalCounterProps {
  value: number;
  digits?: number;
  label?: string;
}

export const DigitalCounter = memo(function DigitalCounter({
  value,
  digits = 4,
  label,
}: DigitalCounterProps) {
  const displayValue = String(value).padStart(digits, '0').slice(-digits);

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-[10px] uppercase tracking-wider text-forge-text-dim">
          {label}
        </span>
      )}
      <div className="digital-counter text-sm">
        {displayValue}
      </div>
    </div>
  );
});
