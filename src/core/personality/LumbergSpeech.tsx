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

      {/* Attribution with avatar */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-forge-border/50">
        <div className="w-6 h-6 rounded-full bg-forge-bg-secondary border border-forge-border flex items-center justify-center">
          <LumbergAvatar />
        </div>
        <div>
          <p className="text-[10px] text-forge-text-dim uppercase tracking-wider">
            Bill Lumbergh
          </p>
          <p className="text-[9px] text-forge-text-dim/70">
            Document Shredder • Office Space
          </p>
        </div>
      </div>

      {/* Milton easter egg at rage level */}
      {jamCount >= 5 && (
        <div className="absolute -bottom-6 right-4 text-xs text-forge-error animate-pulse">
          Have you seen my stapler?
        </div>
      )}
    </div>
  );
});

/** Simple avatar icon representing Lumbergh */
function LumbergAvatar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forge-text-dim">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    </svg>
  );
}
