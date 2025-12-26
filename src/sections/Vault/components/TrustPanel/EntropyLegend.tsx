/**
 * EntropyLegend Component
 *
 * Color scale legend for the entropy heat map.
 * Shows the gradient from low entropy (cold/blue) to high entropy (hot/red).
 */

import { memo } from 'react';

interface EntropyLegendProps {
  /** Compact mode for tight layouts */
  compact?: boolean;
  /** Show PII indicator */
  showPIIIndicator?: boolean;
}

export const EntropyLegend = memo(function EntropyLegend({
  compact = false,
  showPIIIndicator = true,
}: EntropyLegendProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-mono text-forge-text-dim">
        <span className="text-blue-400">LOW</span>
        <div
          className="flex-1 h-1.5 rounded-full"
          style={{
            background: 'linear-gradient(to right, hsl(240, 70%, 50%), hsl(180, 70%, 50%), hsl(120, 70%, 50%), hsl(60, 70%, 50%), hsl(0, 70%, 50%))',
          }}
        />
        <span className="text-red-400">HIGH</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Gradient bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-forge-text-dim uppercase tracking-wider">
          <span>Low Entropy</span>
          <span>High Entropy</span>
        </div>
        <div
          className="h-3 rounded"
          style={{
            background: 'linear-gradient(to right, hsl(240, 70%, 50%), hsl(180, 70%, 55%), hsl(120, 70%, 50%), hsl(60, 70%, 55%), hsl(0, 70%, 60%))',
          }}
        />
        <div className="flex justify-between text-[9px] font-mono text-forge-text-dim">
          <span>0 bits</span>
          <span>4 bits</span>
          <span>8 bits</span>
        </div>
      </div>

      {/* Legend items */}
      <div className="flex flex-wrap gap-3 text-[10px] font-mono">
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: 'hsl(240, 70%, 50%)' }}
          />
          <span className="text-forge-text-dim">Uniform/Redacted</span>
        </div>

        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: 'hsl(120, 70%, 50%)' }}
          />
          <span className="text-forge-text-dim">Text Data</span>
        </div>

        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: 'hsl(0, 70%, 60%)' }}
          />
          <span className="text-forge-text-dim">High Random</span>
        </div>

        {showPIIIndicator && (
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-sm border border-red-500"
              style={{ background: 'hsl(0, 80%, 60%)' }}
            />
            <span className="text-forge-text-dim">PII Detected</span>
          </div>
        )}
      </div>
    </div>
  );
});
