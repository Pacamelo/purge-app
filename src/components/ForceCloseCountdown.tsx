/**
 * ForceCloseCountdown Component
 *
 * Displays countdown timer before force-closing the tab.
 * This ensures the tab is closed before the user can reconnect,
 * preventing any delayed data exfiltration.
 *
 * Two modes:
 * - Normal: After processing complete, user can extend countdown
 * - Warning: User reconnected before close, no extensions, aggressive messaging
 */

interface ForceCloseCountdownProps {
  /** Seconds remaining */
  seconds: number | null;
  /** True if this is a warning (reconnected before close) */
  isWarning: boolean;
  /** Force close immediately */
  onForceClose: () => void;
  /** Extend countdown (null if not allowed) */
  onExtend: (() => boolean) | null;
  /** Number of extensions remaining */
  extensionsRemaining: number;
}

export function ForceCloseCountdown({
  seconds,
  isWarning,
  onForceClose,
  onExtend,
  extensionsRemaining,
}: ForceCloseCountdownProps) {
  if (seconds === null) return null;

  // Warning mode - aggressive styling
  if (isWarning) {
    return (
      <div className="fixed inset-0 bg-forge-error/90 flex items-center justify-center z-50 p-8">
        <div className="max-w-md w-full text-center">
          {/* Warning Icon */}
          <div className="text-6xl mb-4">
            <span className="inline-block animate-pulse">&#9888;&#65039;</span>
          </div>

          {/* Header */}
          <h1 className="text-3xl font-mono text-white uppercase tracking-wider mb-4">
            You Reconnected
          </h1>

          {/* Explanation */}
          <div className="bg-black/30 border border-white/30 p-6 mb-6">
            <p className="text-white font-mono text-sm leading-relaxed mb-2">
              You're back online with this tab still open.
            </p>
            <p className="text-white/80 font-mono text-sm leading-relaxed">
              We have NOT uploaded anything.
              <br />
              But we can't <span className="text-white">PROVE</span> that now.
            </p>
          </div>

          {/* Countdown */}
          <div className="mb-6">
            <p className="text-white/80 font-mono text-sm uppercase tracking-wider mb-2">
              Tab will force-close in:
            </p>
            <div className="text-6xl font-mono text-white font-bold tabular-nums">
              {seconds}
            </div>
          </div>

          {/* Action */}
          <button
            onClick={onForceClose}
            className="px-8 py-4 font-mono uppercase tracking-wider text-lg
                       bg-white text-forge-error border-2 border-white
                       hover:bg-white/90
                       shadow-[4px_4px_0px_0px] shadow-black/30
                       active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
                       transition-all"
          >
            Close This Tab Immediately
          </button>
        </div>
      </div>
    );
  }

  // Normal complete mode - overlay on output
  return (
    <div className="absolute inset-0 bg-forge-bg-primary/95 flex items-center justify-center z-40 p-8">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="text-5xl mb-4">
          <span className="inline-block">&#9989;</span>
        </div>

        {/* Header */}
        <h2 className="text-xl font-mono text-forge-accent uppercase tracking-wider mb-2">
          Complete
        </h2>

        <p className="text-forge-text-secondary font-mono text-sm mb-6">
          Your file has been processed offline.
        </p>

        {/* Countdown Box */}
        <div className="bg-forge-bg-secondary border border-forge-border p-6 mb-6">
          <p className="text-forge-text-dim font-mono text-xs uppercase tracking-wider mb-2">
            This tab will close in:
          </p>
          <div className="text-5xl font-mono text-forge-accent font-bold tabular-nums mb-4">
            {seconds}
          </div>

          <p className="text-forge-text-dim font-mono text-xs leading-relaxed">
            Closing before reconnecting ensures
            <br />
            no delayed upload is possible.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onForceClose}
            className="px-4 py-2 font-mono uppercase tracking-wider text-sm
                       bg-forge-accent/20 border border-forge-accent
                       text-forge-accent hover:bg-forge-accent hover:text-forge-bg-primary
                       transition-colors"
          >
            Close Now
          </button>

          {onExtend && extensionsRemaining > 0 && (
            <button
              onClick={() => onExtend()}
              className="px-4 py-2 font-mono uppercase tracking-wider text-sm
                         bg-forge-bg-tertiary border border-forge-border
                         text-forge-text-secondary hover:text-forge-text-primary hover:border-forge-text-secondary
                         transition-colors"
            >
              I need more time (+30s)
              {extensionsRemaining < 2 && (
                <span className="text-forge-text-dim ml-1">
                  ({extensionsRemaining} left)
                </span>
              )}
            </button>
          )}
        </div>

        {/* No more extensions warning */}
        {onExtend === null && !isWarning && (
          <p className="mt-4 text-forge-warning font-mono text-xs">
            No more extensions available.
          </p>
        )}
      </div>
    </div>
  );
}
