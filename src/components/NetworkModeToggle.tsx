/**
 * NetworkModeToggle Component
 *
 * Displays network status and demo mode toggle.
 * Two variants:
 * - Full (header): Shows status indicator + demo mode toggle
 * - Compact (blocking screen): Just demo mode toggle
 */

import { memo } from 'react';

interface NetworkModeToggleProps {
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Whether demo mode is enabled */
  demoModeEnabled: boolean;
  /** Called when user toggles demo mode */
  onToggleDemoMode: () => void;
  /** Use compact variant (for blocking screen) */
  compact?: boolean;
  /** Whether toggle is disabled (e.g., during processing) */
  disabled?: boolean;
}

export const NetworkModeToggle = memo(function NetworkModeToggle({
  isOnline,
  demoModeEnabled,
  onToggleDemoMode,
  compact = false,
  disabled = false,
}: NetworkModeToggleProps) {
  if (compact) {
    // Compact variant for blocking screen
    return (
      <button
        onClick={onToggleDemoMode}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-1.5
          font-mono text-xs uppercase tracking-wider
          border transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${demoModeEnabled
            ? 'bg-forge-warning/20 border-forge-warning text-forge-warning'
            : 'bg-forge-bg-tertiary border-forge-border text-forge-text-dim hover:border-forge-text-secondary hover:text-forge-text-secondary'
          }
        `}
        title={demoModeEnabled ? 'Disable demo mode' : 'Enable demo mode to bypass offline requirement'}
      >
        <span>Demo</span>
        <span
          className={`
            px-1.5 py-0.5 text-[10px] border
            ${demoModeEnabled
              ? 'bg-forge-warning/30 border-forge-warning'
              : 'bg-forge-bg-secondary border-forge-border'
            }
          `}
        >
          {demoModeEnabled ? 'ON' : 'OFF'}
        </span>
      </button>
    );
  }

  // Full variant for header
  return (
    <div className="flex items-center gap-3">
      {/* Network status indicator */}
      <div
        className={`
          flex items-center gap-2 px-2 py-1
          font-mono text-xs uppercase tracking-wider
          ${isOnline
            ? 'text-forge-error'
            : 'text-forge-success'
          }
        `}
      >
        <span
          className={`
            w-2 h-2 rounded-full
            ${isOnline
              ? 'bg-forge-error animate-pulse'
              : 'bg-forge-success'
            }
          `}
        />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Demo mode toggle */}
      <button
        onClick={onToggleDemoMode}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-2 py-1
          font-mono text-xs uppercase tracking-wider
          border transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${demoModeEnabled
            ? 'bg-forge-warning/20 border-forge-warning text-forge-warning'
            : 'bg-forge-bg-tertiary border-forge-border text-forge-text-dim hover:border-forge-text-secondary hover:text-forge-text-secondary'
          }
        `}
        title={demoModeEnabled ? 'Disable demo mode' : 'Enable demo mode to bypass offline requirement'}
      >
        <span>Demo</span>
        <span
          className={`
            px-1 py-0.5 text-[10px] border
            ${demoModeEnabled
              ? 'bg-forge-warning/30 border-forge-warning'
              : 'bg-forge-bg-secondary border-forge-border'
            }
          `}
        >
          {demoModeEnabled ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
});
