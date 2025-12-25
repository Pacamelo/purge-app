/**
 * TrustPanel Component
 *
 * Clean, minimal trust indicator that expands to show details.
 * Provides visibility into network and storage activity during processing.
 *
 * NOTE: This panel shows indicators and monitoring data, not security guarantees.
 * For maximum assurance, users should enable Airplane Mode and verify with DevTools.
 */

import { memo, useState } from 'react';
import type { NetworkRequest, MemoryStats, ProcessedFile, EntropyComparison, Detection, ScrubConfig } from '@/core/types';
import type { AirplaneModeState } from '@/core/hooks/useAirplaneMode';
import { QRCertificate } from './QRCertificate';
import { NetworkMonitor } from './NetworkMonitor';
import { BeforeAfterDiff } from './BeforeAfterDiff';
import { SecurityDisclaimer } from './SecurityDisclaimer';

interface TrustPanelProps {
  networkRequests: NetworkRequest[];
  isRecording: boolean;
  totalBytes: number;
  storageDifferent: boolean;
  memoryStats: MemoryStats;
  isWiping: boolean;
  airplaneModeState: AirplaneModeState;
  airplaneModeControls: {
    acceptChallenge: () => void;
    startProcessing: () => void;
    completeProcessing: () => void;
    reset: () => void;
  };
  fileHashes: Map<string, { original: string; processed: string }>;
  timestamp: string | null;
  processedFiles: ProcessedFile[];
  hasStartedProcessing: boolean;
  hasCompletedProcessing: boolean;
  // Entropy visualization (kept for compatibility)
  entropyComparison: EntropyComparison;
  isCalculatingEntropy: boolean;
  // Before/After diff data
  detections?: Detection[];
  selectedDetections?: Set<string>;
  config?: ScrubConfig;
  // Unused but kept for interface compatibility
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
  watermarkStatus?: string;
}

/**
 * Signal bars for WiFi status
 */
const SignalBars = memo(function SignalBars({ isOnline }: { isOnline: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-3">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`
            w-0.5 transition-colors
            ${isOnline ? 'bg-forge-warning' : 'bg-forge-success'}
            ${bar === 1 ? 'h-1' : bar === 2 ? 'h-1.5' : bar === 3 ? 'h-2' : 'h-3'}
            ${!isOnline ? 'opacity-30' : ''}
          `}
        />
      ))}
    </div>
  );
});

/**
 * Platform-specific offline instructions
 */
function getOfflineInstructions(): string {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  if (/iphone|ipad|android/i.test(ua)) {
    return 'Enable Airplane Mode in Control Center';
  }
  if (platform.includes('mac') || ua.includes('mac')) {
    return 'Menu bar → WiFi icon → Turn Wi-Fi Off';
  }
  if (platform.includes('win') || ua.includes('win')) {
    return 'Taskbar → WiFi → Disconnect';
  }
  return 'Disable WiFi in system settings';
}

export const TrustPanel = memo(function TrustPanel({
  networkRequests,
  isRecording,
  totalBytes,
  airplaneModeState,
  airplaneModeControls,
  fileHashes,
  timestamp,
  processedFiles,
  hasStartedProcessing,
  hasCompletedProcessing,
  // BeforeAfterDiff data
  detections = [],
  selectedDetections = new Set(),
  config,
}: TrustPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);

  // Get first file hash for QR certificate
  const firstFileId = processedFiles[0]?.id;
  const firstFileHash = firstFileId ? fileHashes.get(firstFileId) : undefined;

  const { isOnline, stayedOfflineDuringProcessing, proofInvalidated, challengeAccepted } =
    airplaneModeState;

  // Status determination
  const processedOffline = stayedOfflineDuringProcessing && !proofInvalidated;
  const isCurrentlyOffline = !isOnline;

  // What to show
  const showSuccess = processedOffline;
  const showReady = isCurrentlyOffline && !processedOffline;
  // Don't show warning state just for network activity - it's misleading
  // Network requests are normal browser activity (extensions, analytics, etc.)
  // Only show warning if connection changed mid-process (proof invalidated)
  const showWarning = proofInvalidated && !processedOffline;

  // Determine if we have detection data to show
  const hasDetectionData = detections.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* ─────────────────────────────────────────────────────────────────
          PERSISTENT SECURITY WARNING - Always visible
          ───────────────────────────────────────────────────────────────── */}
      <div className="p-3 bg-[var(--forge-warning)]/10 border-b border-[var(--forge-warning)]">
        <p className="text-xs font-mono text-[var(--forge-warning)] leading-relaxed">
          ⚠️ PURGE provides <strong>privacy indicators</strong>, not security guarantees.
          For sensitive data: use airplane mode + verify with DevTools Network tab.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          SECURITY DISCLAIMER - Detailed version before first file drop
          ───────────────────────────────────────────────────────────────── */}
      {!hasStartedProcessing && !disclaimerAcknowledged && (
        <div className="p-4 border-b border-forge-border">
          <SecurityDisclaimer
            collapsible={true}
            onAcknowledge={() => setDisclaimerAcknowledged(true)}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          NETWORK MONITOR - Live packet inspector
          ───────────────────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-forge-border">
        <NetworkMonitor
          requests={networkRequests}
          isRecording={isRecording}
          totalBytes={totalBytes}
          hasStartedProcessing={hasStartedProcessing}
          hasCompletedProcessing={hasCompletedProcessing}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          BEFORE/AFTER DIFF - Show redaction preview
          ───────────────────────────────────────────────────────────────── */}
      {hasDetectionData && config && (
        <div className="p-4 border-b border-forge-border">
          <BeforeAfterDiff
            detections={detections}
            selectedIds={selectedDetections}
            config={config}
            maxHeight={150}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          MAIN STATUS CARD - The one thing that matters
          ───────────────────────────────────────────────────────────────── */}
      <div className="p-4">
        <div
          className={`
            p-4 border-2 transition-all
            ${showSuccess ? 'border-forge-success bg-forge-success/5' : ''}
            ${showReady ? 'border-forge-accent bg-forge-accent/5' : ''}
            ${showWarning ? 'border-forge-error bg-forge-error/5' : ''}
            ${!showSuccess && !showReady && !showWarning ? 'border-forge-border bg-forge-bg-tertiary' : ''}
          `}
        >
          {/* Status Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {showSuccess ? '✓' : showReady ? '✈️' : showWarning ? '⚠' : '🔒'}
              </span>
              <span
                className={`
                  text-sm font-mono font-bold uppercase tracking-wider
                  ${showSuccess ? 'text-forge-success' : ''}
                  ${showReady ? 'text-forge-accent' : ''}
                  ${showWarning ? 'text-forge-error' : ''}
                  ${!showSuccess && !showReady && !showWarning ? 'text-forge-text-primary' : ''}
                `}
              >
                {showSuccess
                  ? 'Verified Offline'
                  : showReady
                    ? 'Offline Ready'
                    : showWarning
                      ? 'Connection Changed'
                      : 'Online Mode'}
              </span>
            </div>
            <SignalBars isOnline={isOnline} />
          </div>

          {/* Status Message */}
          <p className="text-sm text-forge-text-secondary mb-3">
            {showSuccess
              ? 'File processed while offline. No network activity possible.'
              : showReady
                ? 'Offline mode active. Ready to process files securely.'
                : showWarning
                  ? 'Network connection changed during processing. Proof invalidated.'
                  : 'You are online. We process locally, but cannot prove it.'}
          </p>

          {/* Action / CTA */}
          {!showSuccess && !showReady && !challengeAccepted && (
            <button
              onClick={airplaneModeControls.acceptChallenge}
              className="w-full py-2 text-xs font-mono uppercase tracking-wider
                         border border-forge-accent text-forge-accent
                         hover:bg-forge-accent hover:text-forge-bg-primary
                         transition-colors"
            >
              [ Want Proof? Go Offline ]
            </button>
          )}

          {challengeAccepted && isOnline && !showSuccess && (
            <div className="p-2 bg-forge-bg-primary border border-forge-border text-xs text-forge-text-dim">
              {getOfflineInstructions()}
            </div>
          )}

          {showSuccess && hasCompletedProcessing && (
            <div className="flex items-center gap-2 text-xs text-forge-success">
              <span>●</span>
              <span>Screenshot this as proof</span>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          EXPANDABLE DETAILS - For skeptics who want more
          ───────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-4 py-2 flex items-center justify-between text-xs text-forge-text-dim
                     hover:text-forge-text-secondary hover:bg-forge-bg-tertiary transition-colors"
        >
          <span className="uppercase tracking-wider">
            {expanded ? 'Hide details' : 'More verification options'}
          </span>
          <span>{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {/* DevTools hint */}
            <div className="p-3 bg-forge-bg-tertiary border border-forge-border">
              <p className="text-xs font-mono text-forge-text-secondary mb-1">
                🔍 Verify Yourself
              </p>
              <p className="text-xs text-forge-text-dim">
                Press <kbd className="px-1 bg-forge-bg-primary border border-forge-border">F12</kbd> →
                Network tab → Look for uploads
              </p>
            </div>

            {/* Source code link */}
            <div className="p-3 bg-forge-bg-tertiary border border-forge-border">
              <p className="text-xs font-mono text-forge-text-secondary mb-1">
                📖 Read the Code
              </p>
              <p className="text-xs text-forge-text-dim mb-2">
                PURGE runs entirely in your browser. Verify by inspecting:
              </p>
              <ul className="text-xs text-forge-text-dim space-y-1 ml-2">
                <li>• DevTools → Sources → modules/purge/</li>
                <li>• DevTools → Network → No uploads during processing</li>
              </ul>
            </div>

            {/* Connection log if available */}
            {airplaneModeState.connectionLog.length > 0 && (
              <div className="p-3 bg-forge-bg-tertiary border border-forge-border">
                <p className="text-xs font-mono text-forge-text-secondary mb-2">
                  📋 Connection Log
                </p>
                <div className="space-y-1 text-xs font-mono">
                  {airplaneModeState.connectionLog.slice(-5).map((event, i) => (
                    <div key={i} className="flex gap-2 text-forge-text-dim">
                      <span>
                        {new Date(event.timestamp).toLocaleTimeString('en-US', {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      <span
                        className={
                          event.status === 'offline' ? 'text-forge-success' : 'text-forge-warning'
                        }
                      >
                        {event.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Certificate - only after processing */}
            {hasCompletedProcessing && firstFileHash && (
              <QRCertificate
                originalHash={firstFileHash.original}
                processedHash={firstFileHash.processed}
                timestamp={timestamp}
                fileName={processedFiles[0]?.originalName}
              />
            )}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          FOOTER - Subtle trust indicator
          ───────────────────────────────────────────────────────────────── */}
      <div className="p-2 border-t border-forge-border bg-forge-bg-primary">
        <p className="text-[10px] text-forge-text-dim text-center uppercase tracking-widest">
          {isOnline ? 'Online' : 'Offline'} · No cloud processing
        </p>
      </div>
    </div>
  );
});
