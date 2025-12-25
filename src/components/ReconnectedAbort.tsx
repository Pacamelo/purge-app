/**
 * ReconnectedAbort Component
 *
 * Displays when the user reconnects during processing.
 * Processing is immediately aborted as a privacy precaution.
 *
 * Key message: "Connection detected. Processing aborted. Start over."
 */

interface ReconnectedAbortProps {
  onReset: () => void;
}

export function ReconnectedAbort({ onReset }: ReconnectedAbortProps) {
  return (
    <div className="h-full w-full bg-forge-bg-primary flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Warning Icon */}
        <div className="text-6xl mb-6">
          <span className="inline-block">&#9940;</span>
        </div>

        {/* Header */}
        <h1 className="text-2xl font-mono text-forge-error uppercase tracking-wider mb-4">
          Connection Detected
        </h1>

        {/* Explanation */}
        <div className="bg-forge-bg-secondary border border-forge-error/30 p-6 mb-6">
          <p className="text-forge-text-primary font-mono text-sm leading-relaxed mb-4">
            You reconnected during processing.
          </p>
          <p className="text-forge-text-secondary font-mono text-sm leading-relaxed">
            Processing has been <span className="text-forge-error">ABORTED</span>.
            <br />
            Your original file was NOT modified.
          </p>
        </div>

        {/* Reassurance */}
        <div className="bg-forge-bg-tertiary border border-forge-border p-4 mb-6">
          <p className="text-forge-text-dim font-mono text-xs leading-relaxed">
            For your privacy, we immediately halt all operations when network
            connectivity is detected. Our monitoring found no data transmitted,
            though this is a best-effort check.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onReset}
          className="px-6 py-3 font-mono uppercase tracking-wider text-sm
                     bg-forge-error/20 border-2 border-forge-error
                     text-forge-error hover:bg-forge-error hover:text-white
                     shadow-[3px_3px_0px_0px] shadow-forge-error/50
                     active:shadow-none active:translate-x-[3px] active:translate-y-[3px]
                     transition-all"
        >
          Close Tab & Start Over
        </button>

        {/* Additional Note */}
        <p className="mt-6 text-forge-text-dim font-mono text-xs">
          Go offline before dropping files next time.
        </p>
      </div>
    </div>
  );
}
