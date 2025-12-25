/**
 * ShredAnimation Component
 * Main shredding visual with paper strips and motor effects
 */

import { memo } from 'react';
import type { ProcessingProgress } from '@/core/types';
import { PaperStrips } from './PaperStrips';
import { ProgressMeter } from './ProgressMeter';
import { LumbergSpeech } from '@/core/personality/LumbergSpeech';

interface ShredAnimationProps {
  progress: ProcessingProgress;
  isActive: boolean;
  jamCount: number;
}

export const ShredAnimation = memo(function ShredAnimation({
  progress,
  isActive,
  jamCount,
}: ShredAnimationProps) {
  // Determine strip intensity based on phase
  const intensity = progress.phase === 'redacting' ? 'high' : 'medium';

  return (
    <div className="relative">
      {/* Lumbergh quote */}
      <div className="p-4">
        <LumbergSpeech
          state="shredding"
          jamCount={jamCount}
          fileCount={progress.totalFiles}
        />
      </div>

      {/* Progress meter */}
      <ProgressMeter progress={progress} />

      {/* Shredder output area with paper strips */}
      <div className="relative h-40 bg-forge-bg-tertiary overflow-hidden">
        {/* Paper strips animation */}
        <PaperStrips isActive={isActive} intensity={intensity} />

        {/* Motor vibration overlay text */}
        <div
          className={`
            absolute inset-0 flex items-center justify-center
            ${isActive ? 'motor-active' : ''}
          `}
        >
          <div className="text-center">
            <div className="text-6xl text-forge-accent opacity-20">
              ║║║║║║║║
            </div>
            <p className="text-xs text-forge-text-dim mt-2 uppercase tracking-widest">
              {isActive ? 'Shredding in Progress' : 'Ready'}
            </p>
          </div>
        </div>

        {/* Bin bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-forge-bg-tertiary to-transparent" />
      </div>
    </div>
  );
});
