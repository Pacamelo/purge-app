/**
 * ShredderHousing Component
 * Main visual frame for the PURGE shredder
 * Retro 80s/90s beige plastic aesthetic
 */

import { memo, type ReactNode } from 'react';
import type { PurgeState } from '@/core/types';

interface ShredderHousingProps {
  children: ReactNode;
  state: PurgeState;
  isJammed?: boolean;
}

export const ShredderHousing = memo(function ShredderHousing({
  children,
  state,
  isJammed = false,
}: ShredderHousingProps) {
  const isProcessing = state === 'scanning' || state === 'shredding';

  return (
    <div
      className={`
        shredder-housing
        w-full max-w-xl
        rounded-lg overflow-hidden
        ${isProcessing ? 'motor-active' : ''}
      `}
    >
      {/* Top bezel with texture */}
      <div className="shredder-bezel h-3 bg-gradient-to-b from-white/5 to-transparent" />

      {/* Main body */}
      <div className="relative">
        {/* Content area */}
        <div className={isJammed ? 'paper-jammed' : ''}>{children}</div>
      </div>

      {/* Bottom bezel */}
      <div className="shredder-bezel h-2 bg-gradient-to-t from-black/10 to-transparent" />

      {/* Ventilation slots */}
      <div className="flex justify-center gap-1 py-2 bg-forge-bg-tertiary">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-1 bg-black/30 rounded-full"
          />
        ))}
      </div>
    </div>
  );
});
