/**
 * DevToolsGuide Component
 *
 * GENUINE PROOF - User performs independent verification.
 * Browser DevTools can't be manipulated by our app code.
 * An empty Network tab IS proof of no requests.
 */

import { memo, useState, useMemo } from 'react';

interface DevToolsGuideProps {
  /** Whether file has been processed */
  hasProcessed: boolean;
  /** Number of requests we detected (should be 0) */
  detectedRequests: number;
}

type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

/**
 * Detect user's platform
 */
function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  if (platform.includes('mac') || ua.includes('mac')) return 'mac';
  if (platform.includes('win') || ua.includes('win')) return 'windows';
  if (platform.includes('linux') || ua.includes('linux')) return 'linux';
  return 'unknown';
}

/**
 * Get keyboard shortcut for opening DevTools
 */
function getDevToolsShortcut(platform: Platform): string {
  switch (platform) {
    case 'mac':
      return '⌘ + Option + I';
    case 'windows':
    case 'linux':
      return 'F12 or Ctrl + Shift + I';
    default:
      return 'F12';
  }
}

/**
 * Get step-by-step instructions
 */
function getInstructions(platform: Platform): string[] {
  const shortcut = getDevToolsShortcut(platform);
  return [
    `Press ${shortcut} to open Developer Tools`,
    'Click the "Network" tab at the top',
    'Make sure "Preserve log" is checked',
    'Drop your file into PURGE and process it',
    'Look for any requests containing your file data',
  ];
}

export const DevToolsGuide = memo(function DevToolsGuide({
  hasProcessed,
  detectedRequests,
}: DevToolsGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const platform = useMemo(() => detectPlatform(), []);
  const shortcut = useMemo(() => getDevToolsShortcut(platform), [platform]);
  const instructions = useMemo(() => getInstructions(platform), [platform]);

  return (
    <div className="border border-forge-border bg-forge-bg-tertiary">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-forge-bg-secondary transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <div>
            <h3 className="text-sm font-mono font-bold text-forge-text-primary uppercase tracking-wider">
              Verify Yourself
            </h3>
            <p className="text-xs text-forge-text-dim">
              Don't trust us - check your browser's Network tab
            </p>
          </div>
        </div>
        <span className="text-forge-text-dim text-sm">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-forge-border px-4 py-3 space-y-4">
          {/* Why this matters */}
          <div className="p-3 bg-forge-bg-primary border border-forge-accent/30">
            <p className="text-xs text-forge-text-primary">
              <strong className="text-forge-accent">Why this is real proof:</strong> Browser Developer
              Tools are part of your browser, not our app. We cannot fake, hide, or manipulate what
              they show. If the Network tab is empty, no data was sent. Period.
            </p>
          </div>

          {/* Platform-specific shortcut */}
          <div className="flex items-center gap-3 p-3 bg-forge-bg-secondary border border-forge-border">
            <span className="text-2xl">⌨️</span>
            <div>
              <p className="text-xs text-forge-text-dim">Your keyboard shortcut:</p>
              <p className="text-lg font-mono text-forge-accent font-bold">{shortcut}</p>
            </div>
          </div>

          {/* Step by step */}
          <div className="space-y-2">
            <p className="text-xs text-forge-text-dim font-mono uppercase tracking-wider">
              Step by Step:
            </p>
            <ol className="space-y-2">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-forge-accent font-mono font-bold">{i + 1}.</span>
                  <span className="text-forge-text-primary">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Result interpretation */}
          {hasProcessed && (
            <div
              className={`
                p-3 border
                ${detectedRequests === 0 ? 'border-forge-success bg-forge-success/10' : 'border-forge-warning bg-forge-warning/10'}
              `}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">
                  {detectedRequests === 0 ? '✓' : '⚠'}
                </span>
                <div>
                  <p
                    className={`text-sm font-bold ${detectedRequests === 0 ? 'text-forge-success' : 'text-forge-warning'}`}
                  >
                    {detectedRequests === 0
                      ? 'We detected 0 network requests'
                      : `We detected ${detectedRequests} request(s)`}
                  </p>
                  <p className="text-xs text-forge-text-secondary mt-1">
                    {detectedRequests === 0
                      ? "Check your browser's Network tab - it should match. If it's empty, your file never left."
                      : 'Check what these requests were. They may be unrelated to your file (analytics, fonts, etc).'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pro tips */}
          <div className="pt-3 border-t border-forge-border space-y-2">
            <p className="text-xs text-forge-text-dim font-mono uppercase tracking-wider">
              Pro Tips:
            </p>
            <ul className="space-y-1 text-xs text-forge-text-secondary">
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  Filter by <code className="text-forge-accent">method:POST</code> to find upload
                  requests
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  Sort by "Size" column to find large requests (your file would be big)
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  Right-click → "Clear" before processing to start fresh
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  Screenshot the Network tab as proof for your records
                </span>
              </li>
            </ul>
          </div>

          {/* Final note */}
          <div className="p-2 bg-forge-bg-primary text-center">
            <p className="text-xs text-forge-text-dim">
              This is independent verification. Your browser is the witness, not us.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
