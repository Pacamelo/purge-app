/**
 * LumbergSpeech Component
 * Speech bubble displaying Lumbergh quotes
 */

import { memo, useState, useEffect } from 'react';
import type { PurgeState } from '@/core/types';
import {
  getQuote,
  getMoodFromJamCount,
  type QuoteEvent,
} from '@/core/constants/lumbergh';

interface LumbergSpeechProps {
  state: PurgeState;
  jamCount: number;
  fileCount: number;
}

/**
 * Map PurgeState to QuoteEvent
 */
function stateToEvent(state: PurgeState): QuoteEvent {
  switch (state) {
    case 'idle':
      return 'idle';
    case 'loaded':
    case 'configuring':
      return 'drop';
    case 'scanning':
      return 'scan';
    case 'preview':
      return 'scan';
    case 'shredding':
      return 'shred';
    case 'complete':
      return 'complete';
    case 'jammed':
      return 'jam';
    default:
      return 'idle';
  }
}

export const LumbergSpeech = memo(function LumbergSpeech({
  state,
  jamCount,
  fileCount,
}: LumbergSpeechProps) {
  const [quote, setQuote] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  // Update quote when state changes
  useEffect(() => {
    const event = stateToEvent(state);
    const mood = getMoodFromJamCount(jamCount);
    const newQuote = getQuote(event, mood, { jamNumber: jamCount, fileCount });

    // Fade out, change quote, fade in
    setIsVisible(false);
    const timer = setTimeout(() => {
      setQuote(newQuote);
      setIsVisible(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [state, jamCount, fileCount]);

  // Initial quote
  useEffect(() => {
    if (!quote) {
      const mood = getMoodFromJamCount(jamCount);
      setQuote(getQuote('idle', mood));
    }
  }, [quote, jamCount]);

  if (!quote) return null;

  return (
    <div
      className={`
        speech-bubble
        transition-opacity duration-200
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <p className="text-sm text-forge-text-secondary italic font-mono">
        "{quote}"
      </p>
      <p className="text-[10px] text-forge-text-dim mt-2 uppercase tracking-wider">
        — Bill Lumbergh, Document Shredder
      </p>

      {/* Milton easter egg at rage level */}
      {jamCount >= 5 && (
        <div className="absolute -bottom-6 right-4 text-xs text-forge-error animate-pulse">
          🔴 Have you seen my stapler?
        </div>
      )}
    </div>
  );
});
