/**
 * useAirplaneMode Hook
 * Detects offline status for strong privacy indication
 *
 * When navigator.onLine is false, network uploads are highly unlikely.
 * This provides strong assurance, though not absolute proof due to potential
 * browser extensions, queued requests, or service workers.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AirplaneModeState {
  /** Current connection status */
  isOnline: boolean;
  /** Was offline when processing started */
  processingStartedOffline: boolean;
  /** Connection was maintained offline throughout processing */
  stayedOfflineDuringProcessing: boolean;
  /** User accepted the airplane mode challenge */
  challengeAccepted: boolean;
  /** Processing is currently active */
  isProcessing: boolean;
  /** Timestamped log of connection events */
  connectionLog: ConnectionEvent[];
  /** Connection went online during processing (invalidates proof) */
  proofInvalidated: boolean;
}

export interface ConnectionEvent {
  timestamp: number;
  status: 'online' | 'offline';
  event: 'initial' | 'change' | 'processing_start' | 'processing_end';
}

export interface UseAirplaneModeResult {
  state: AirplaneModeState;
  /** Accept the airplane mode challenge */
  acceptChallenge: () => void;
  /** Mark processing as started (records current state) */
  startProcessing: () => void;
  /** Mark processing as complete */
  endProcessing: () => void;
  /** Reset state for new session */
  reset: () => void;
  /** Get human-readable status */
  getStatusMessage: () => string;
  /** Get platform-specific instructions to go offline */
  getOfflineInstructions: () => string;
}

/**
 * Detect current platform for offline instructions
 */
function detectPlatform(): 'mac' | 'windows' | 'linux' | 'mobile' | 'unknown' {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  if (/iphone|ipad|android/i.test(ua)) return 'mobile';
  if (platform.includes('mac') || ua.includes('mac')) return 'mac';
  if (platform.includes('win') || ua.includes('win')) return 'windows';
  if (platform.includes('linux') || ua.includes('linux')) return 'linux';
  return 'unknown';
}

/**
 * Get platform-specific instructions for going offline
 */
function getOfflineInstructionsForPlatform(platform: ReturnType<typeof detectPlatform>): string {
  switch (platform) {
    case 'mac':
      return 'Click the WiFi icon in your menu bar → Turn Wi-Fi Off, or press Option+click WiFi → Disconnect';
    case 'windows':
      return 'Click the WiFi icon in your taskbar → Click the connection → Disconnect, or enable Airplane Mode';
    case 'linux':
      return 'Click the network icon → Disable Wi-Fi, or run: nmcli radio wifi off';
    case 'mobile':
      return 'Swipe down for Control Center/Quick Settings → Enable Airplane Mode';
    default:
      return 'Disable your WiFi or enable Airplane Mode in your system settings';
  }
}

export function useAirplaneMode(): UseAirplaneModeResult {
  const [state, setState] = useState<AirplaneModeState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    processingStartedOffline: false,
    stayedOfflineDuringProcessing: false,
    challengeAccepted: false,
    isProcessing: false,
    connectionLog: [],
    proofInvalidated: false,
  });

  const platform = useRef(detectPlatform());

  // Add event to connection log
  const logEvent = useCallback((status: 'online' | 'offline', event: ConnectionEvent['event']) => {
    setState((prev) => ({
      ...prev,
      connectionLog: [
        ...prev.connectionLog,
        {
          timestamp: Date.now(),
          status,
          event,
        },
      ],
    }));
  }, []);

  // Track previous online state for change detection
  const prevOnlineRef = useRef<boolean | null>(null);

  // Listen for online/offline events
  useEffect(() => {
    // Log initial state
    const initialOnline = navigator.onLine;
    prevOnlineRef.current = initialOnline;
    logEvent(initialOnline ? 'online' : 'offline', 'initial');

    const handleOnline = () => {
      // Only log change if state actually changed
      if (prevOnlineRef.current === true) return;
      prevOnlineRef.current = true;

      setState((prev) => {
        const newState = { ...prev, isOnline: true };

        // If we went online during processing, proof is invalidated
        if (prev.isProcessing && prev.processingStartedOffline) {
          newState.proofInvalidated = true;
          newState.stayedOfflineDuringProcessing = false;
        }

        return newState;
      });
      logEvent('online', 'change');
    };

    const handleOffline = () => {
      // Only log change if state actually changed
      if (prevOnlineRef.current === false) return;
      prevOnlineRef.current = false;

      setState((prev) => ({ ...prev, isOnline: false }));
      logEvent('offline', 'change');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Polling fallback: navigator.onLine events are unreliable in some browsers
    // Poll every 2 seconds to catch changes the events might miss
    const pollInterval = setInterval(() => {
      const currentOnline = navigator.onLine;
      if (currentOnline !== prevOnlineRef.current) {
        if (currentOnline) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pollInterval);
    };
  }, [logEvent]);

  // Accept the airplane mode challenge
  const acceptChallenge = useCallback(() => {
    setState((prev) => ({ ...prev, challengeAccepted: true }));
  }, []);

  // Mark processing as started
  const startProcessing = useCallback(() => {
    const isCurrentlyOffline = !navigator.onLine;

    setState((prev) => ({
      ...prev,
      isProcessing: true,
      processingStartedOffline: isCurrentlyOffline,
      stayedOfflineDuringProcessing: isCurrentlyOffline,
      proofInvalidated: false,
    }));

    logEvent(isCurrentlyOffline ? 'offline' : 'online', 'processing_start');
  }, [logEvent]);

  // Mark processing as complete
  const endProcessing = useCallback(() => {
    const isCurrentlyOffline = !navigator.onLine;

    setState((prev) => ({
      ...prev,
      isProcessing: false,
      // Only valid if started offline AND still offline
      stayedOfflineDuringProcessing:
        prev.processingStartedOffline && isCurrentlyOffline && !prev.proofInvalidated,
    }));

    logEvent(isCurrentlyOffline ? 'offline' : 'online', 'processing_end');
  }, [logEvent]);

  // Reset for new session
  const reset = useCallback(() => {
    setState({
      isOnline: navigator.onLine,
      processingStartedOffline: false,
      stayedOfflineDuringProcessing: false,
      challengeAccepted: false,
      isProcessing: false,
      connectionLog: [],
      proofInvalidated: false,
    });
  }, []);

  // Get human-readable status message
  const getStatusMessage = useCallback((): string => {
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
  }, [state]);

  // Get platform-specific offline instructions
  const getOfflineInstructions = useCallback((): string => {
    return getOfflineInstructionsForPlatform(platform.current);
  }, []);

  return {
    state,
    acceptChallenge,
    startProcessing,
    endProcessing,
    reset,
    getStatusMessage,
    getOfflineInstructions,
  };
}
