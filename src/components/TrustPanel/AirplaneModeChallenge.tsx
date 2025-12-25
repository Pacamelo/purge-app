/**
 * AirplaneModeChallenge Component
 *
 * Encourages users to process files offline for maximum privacy assurance.
 * When WiFi is off, network uploads are highly unlikely (though not guaranteed
 * due to potential queued requests, service workers, etc.).
 *
 * This provides strong indication of privacy, not absolute proof.
 */

import { memo } from 'react';
import type { AirplaneModeState } from '@/core/hooks/useAirplaneMode';

interface AirplaneModeChallengeProps {
  state: AirplaneModeState;
  onAcceptChallenge: () => void;
  hasStartedProcessing: boolean;
  hasCompletedProcessing: boolean;
}

/**
 * WiFi signal bars visualization
 */
const SignalBars = memo(function SignalBars({ isOnline }: { isOnline: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`
            w-1 transition-all duration-300
            ${isOnline ? 'bg-forge-warning' : 'bg-forge-success'}
            ${bar === 1 ? 'h-1' : bar === 2 ? 'h-2' : bar === 3 ? 'h-3' : 'h-4'}
            ${!isOnline ? 'opacity-30' : ''}
          `}
        />
      ))}
      {!isOnline && (
        <span className="ml-1 text-forge-error text-xs font-bold">OFF</span>
      )}
    </div>
  );
});

/**
 * Airplane icon with optional animation
 */
const AirplaneIcon = memo(function AirplaneIcon({ animated }: { animated: boolean }) {
  return (
    <span
      className={`
        text-2xl
        ${animated ? 'animate-bounce' : ''}
      `}
      role="img"
      aria-label="airplane"
    >
      ✈️
    </span>
  );
});

/**
 * Connection timeline log display
 */
const ConnectionTimeline = memo(function ConnectionTimeline({
  events,
}: {
  events: AirplaneModeState['connectionLog'];
}) {
  if (events.length === 0) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const eventLabels: Record<string, string> = {
    initial: 'Session started',
    change: 'Status changed',
    processing_start: 'Processing started',
    processing_end: 'Processing completed',
  };

  return (
    <div className="mt-3 p-2 bg-forge-bg-primary border border-forge-border text-xs font-mono">
      <p className="text-forge-text-dim mb-1">Connection Timeline (screenshot this):</p>
      <div className="space-y-0.5">
        {events.slice(-6).map((event, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-forge-text-dim">{formatTime(event.timestamp)}</span>
            <span
              className={event.status === 'offline' ? 'text-forge-success' : 'text-forge-warning'}
            >
              {event.status.toUpperCase()}
            </span>
            <span className="text-forge-text-secondary">- {eventLabels[event.event]}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * Get platform-specific instructions for going offline
 */
function getOfflineInstructions(): string {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  if (/iphone|ipad|android/i.test(ua)) {
    return 'Swipe down for Control Center/Quick Settings → Enable Airplane Mode';
  }
  if (platform.includes('mac') || ua.includes('mac')) {
    return 'Click the WiFi icon in your menu bar → Turn Wi-Fi Off';
  }
  if (platform.includes('win') || ua.includes('win')) {
    return 'Click the WiFi icon in your taskbar → Disconnect, or enable Airplane Mode';
  }
  if (platform.includes('linux') || ua.includes('linux')) {
    return 'Click the network icon → Disable Wi-Fi';
  }
  return 'Disable your WiFi or enable Airplane Mode in your system settings';
}

/**
 * Get status message based on current state
 */
function getStatusMessage(state: AirplaneModeState): string {
  if (state.proofInvalidated) {
    return 'Connection was restored during processing - offline proof invalidated';
  }
  if (state.stayedOfflineDuringProcessing) {
    return 'Processed with NO INTERNET CONNECTION - strong privacy assurance';
  }
  if (state.processingStartedOffline && state.isProcessing) {
    return 'Processing offline - stay disconnected for valid proof';
  }
  if (!state.isOnline) {
    return "You're offline - drop your file now for maximum privacy";
  }
  if (state.challengeAccepted) {
    return 'Go offline to prove files stay local';
  }
  return 'Currently online - consider going offline for proof';
}

export const AirplaneModeChallenge = memo(function AirplaneModeChallenge({
  state,
  onAcceptChallenge,
  // These props are reserved for future use (e.g., showing processing-specific UI states)
  hasStartedProcessing: _hasStartedProcessing,
  hasCompletedProcessing: _hasCompletedProcessing,
}: AirplaneModeChallengeProps) {
  void _hasStartedProcessing;
  void _hasCompletedProcessing;

  const { isOnline, challengeAccepted, stayedOfflineDuringProcessing, proofInvalidated, connectionLog } =
    state;

  const offlineInstructions = getOfflineInstructions();
  const statusMessage = getStatusMessage(state);

  // Determine visual state
  const isSuccess = stayedOfflineDuringProcessing && !proofInvalidated;
  const isReady = !isOnline && !stayedOfflineDuringProcessing;
  const isInvalidated = proofInvalidated;

  return (
    <div
      className={`
        border-2 p-4 transition-all
        ${isSuccess ? 'border-forge-success bg-forge-success/10' : ''}
        ${isReady ? 'border-forge-accent bg-forge-accent/10' : ''}
        ${isInvalidated ? 'border-forge-error bg-forge-error/10' : ''}
        ${!isSuccess && !isReady && !isInvalidated ? 'border-forge-accent/50 bg-forge-bg-secondary' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <AirplaneIcon animated={isReady} />
          <div>
            <h3 className="text-sm font-mono font-bold text-forge-text-primary uppercase tracking-wider">
              {isSuccess ? 'OFFLINE PROCESSING COMPLETE' : 'AIRPLANE MODE CHALLENGE'}
            </h3>
            <p className="text-xs text-forge-text-dim">
              {isSuccess ? 'Processed while disconnected' : 'Strongest privacy indicator available'}
            </p>
          </div>
        </div>
        <SignalBars isOnline={isOnline} />
      </div>

      {/* Status Message */}
      <div
        className={`
          p-3 mb-3 border font-mono text-sm bg-forge-bg-primary
          ${isSuccess ? 'border-forge-success text-forge-success' : ''}
          ${isReady ? 'border-forge-accent text-forge-accent' : ''}
          ${isInvalidated ? 'border-forge-error text-forge-error' : ''}
          ${!isSuccess && !isReady && !isInvalidated ? 'border-forge-text-dim/50 text-forge-text-secondary' : ''}
        `}
      >
        {statusMessage}
      </div>

      {/* Success State */}
      {isSuccess && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-forge-success">
            <span className="text-xl">✓</span>
            <span className="font-mono text-sm font-bold">
              File processed with NO INTERNET CONNECTION
            </span>
          </div>
          <p className="text-xs text-forge-text-secondary">
            Your file was processed while completely disconnected from the internet.
            This provides <strong>strong assurance</strong> that data was not uploaded,
            though browser extensions or queued requests could theoretically still access data.
          </p>
          <ConnectionTimeline events={connectionLog} />
        </div>
      )}

      {/* Ready State - User is offline */}
      {isReady && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-forge-accent">
            <span className="text-xl">→</span>
            <span className="font-mono text-sm font-bold">You're offline! Drop your file now.</span>
          </div>
          <p className="text-xs text-forge-text-secondary">
            With no internet connection, network requests are highly unlikely.
            Drop your file for strong assurance it stays local.
          </p>
        </div>
      )}

      {/* Invalidated State */}
      {isInvalidated && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-forge-error">
            <span className="text-xl">✗</span>
            <span className="font-mono text-sm font-bold">Proof invalidated</span>
          </div>
          <p className="text-xs text-forge-text-secondary">
            Your connection was restored during processing. The offline assurance is no longer valid.
            For maximum privacy, stay offline throughout the entire process.
          </p>
          <ConnectionTimeline events={connectionLog} />
        </div>
      )}

      {/* Challenge Prompt - User is online */}
      {isOnline && !challengeAccepted && !isSuccess && (
        <div className="space-y-3">
          <p className="text-xs text-forge-text-secondary">
            Want strong assurance your files stay local?
            Go offline before dropping your file. Processing without internet
            provides the best indication that data cannot be uploaded.
          </p>
          <button
            onClick={onAcceptChallenge}
            className="w-full px-4 py-3 text-sm font-mono uppercase tracking-wider
                       bg-forge-accent/10 border-2 border-forge-accent text-forge-accent
                       hover:bg-forge-accent hover:text-forge-bg-primary
                       shadow-[2px_2px_0px_0px] shadow-forge-accent/50
                       active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
                       transition-all"
          >
            [ PROCESS OFFLINE FOR MAXIMUM PRIVACY ]
          </button>
        </div>
      )}

      {/* Instructions - User accepted challenge but still online */}
      {isOnline && challengeAccepted && !isSuccess && (
        <div className="space-y-3">
          <div className="p-3 bg-forge-bg-primary border border-forge-border">
            <p className="text-xs text-forge-text-dim mb-1">How to go offline:</p>
            <p className="text-sm text-forge-text-primary font-mono">{offlineInstructions}</p>
          </div>
          <p className="text-xs text-forge-text-dim text-center">
            Once you're offline, this panel will update automatically.
          </p>
        </div>
      )}

      {/* Bottom note */}
      <div className="mt-4 pt-3 border-t border-forge-border">
        <p className="text-xs text-forge-text-dim">
          {isSuccess
            ? '💡 Screenshot the timeline above for your records.'
            : '💡 Offline processing provides the strongest privacy indication available.'}
        </p>
      </div>
    </div>
  );
});
