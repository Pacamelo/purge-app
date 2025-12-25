/**
 * useOfflineEnforcement Hook
 *
 * Encourages offline mode for maximum privacy assurance during processing.
 * While offline mode provides strong indication of no network activity,
 * it cannot guarantee complete protection (extensions, etc. may still access data).
 *
 * States:
 * - online_blocked: Recommends user go offline for better assurance
 * - online_acknowledged: User explicitly accepted online risk (bypass with warning)
 * - offline_ready: Offline detected, ready to accept files
 * - processing: Currently processing files
 * - reconnected_abort: Connection detected mid-process, processing stopped
 * - complete: Done processing, prompts to download before reconnecting
 * - reconnected_warning: Reconnected before download, shows reminder
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { secureWarn, secureError } from '@/core/utils/secureLogger';

export type OfflineEnforcementStatus =
  | 'online_blocked'
  | 'online_acknowledged' // User explicitly accepted online risk
  | 'offline_ready'
  | 'sw_blocked' // Service workers detected in offline mode - can't guarantee privacy
  | 'processing'
  | 'awaiting_download' // Processing complete, waiting for user to download
  | 'reconnected_abort'
  | 'complete' // Downloaded, ready to close (offline mode only)
  | 'reconnected_warning';

/**
 * State object representing the current offline enforcement status
 */
export interface OfflineEnforcementState {
  /** Current state machine status */
  status: OfflineEnforcementStatus;
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Whether processing can proceed (offline and ready) */
  canProcess: boolean;
  /** Countdown seconds remaining (null when not counting) */
  countdownSeconds: number | null;
  /** Whether the user has downloaded processed files */
  hasDownloaded: boolean;
  /** Number of countdown extensions used */
  extensionsUsed: number;
  /** Maximum allowed countdown extensions */
  maxExtensions: number;
  /** Whether processing started in online (acknowledged) mode - affects close behavior */
  startedOnline: boolean;
  /** Whether demo mode is enabled (bypasses offline requirement) */
  demoModeEnabled: boolean;
}

/**
 * Actions available for controlling offline enforcement behavior
 */
export interface OfflineEnforcementActions {
  /** Transition to processing state when files are dropped. Async because it checks for service workers in offline mode. */
  startProcessing: () => Promise<void>;
  /** Mark processing as complete and start countdown timer */
  completeProcessing: () => void;
  /** Mark that the user has downloaded their processed files */
  markDownloaded: () => void;
  /** Extend countdown by 30 seconds (max 2 times). Returns false if extensions exhausted. */
  extendCountdown: () => boolean;
  /** Force close the tab immediately by navigating to about:blank */
  forceClose: () => void;
  /** Reset state machine to initial state based on current online status */
  reset: () => void;
  /** User explicitly acknowledges online risk and wants to proceed anyway */
  acknowledgeOnlineRisk: () => void;
  /** Toggle demo mode on/off (persists to sessionStorage) */
  toggleDemoMode: () => void;
}

/**
 * Result object returned by the useOfflineEnforcement hook
 */
export interface UseOfflineEnforcementResult {
  /** Current enforcement state */
  state: OfflineEnforcementState;
  /** Actions to control enforcement behavior */
  actions: OfflineEnforcementActions;
}

// Constants
const EXTENSION_SECONDS = 30;
const MAX_EXTENSIONS = 2;
const WARNING_COUNTDOWN_SECONDS = 5;
const ONLINE_CHECK_INTERVAL = 100; // ms - reduced from 500ms for faster reconnection detection

/**
 * Force close the tab by navigating to about:blank
 * This works even when window.close() doesn't (tabs not opened by script)
 */
function forceCloseTab(): void {
  // Clear any sensitive data from memory first
  if (typeof window !== 'undefined') {
    // Navigate away - this effectively "closes" the tab's content
    window.location.href = 'about:blank';
  }
}

/**
 * Get initial online state safely
 */
function getInitialOnlineState(): boolean {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true; // Assume online if we can't detect
}

/**
 * Get initial demo mode state from sessionStorage (SSR-safe)
 */
function getInitialDemoModeState(): boolean {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem('purge_demo_mode') === 'true';
  }
  return false;
}

export function useOfflineEnforcement(): UseOfflineEnforcementResult {
  // Core state
  const [status, setStatus] = useState<OfflineEnforcementStatus>(
    getInitialOnlineState() ? 'online_blocked' : 'offline_ready'
  );
  const [isOnline, setIsOnline] = useState(getInitialOnlineState());
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [extensionsUsed, setExtensionsUsed] = useState(0);
  const [startedOnline, setStartedOnline] = useState(false); // Track if started in online mode
  const [demoModeEnabled, setDemoModeEnabled] = useState(getInitialDemoModeState);

  // Refs for cleanup
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onlineCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // H-2 FIX: Processing lock to prevent race conditions in startProcessing
  const isStartingProcessingRef = useRef(false);

  // Derived state - online_acknowledged also allows processing (with trust warning)
  const canProcess =
    status === 'offline_ready' ||
    status === 'online_acknowledged' ||
    status === 'processing';

  /**
   * Clear countdown interval
   */
  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  /**
   * Start countdown timer
   */
  const startCountdown = useCallback((seconds: number) => {
    clearCountdownInterval();
    setCountdownSeconds(seconds);

    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearCountdownInterval();
          forceCloseTab();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearCountdownInterval]);

  /**
   * Handle online state change
   */
  const handleOnlineChange = useCallback((online: boolean) => {
    setIsOnline(online);

    if (online) {
      // User went online
      switch (status) {
        case 'offline_ready':
          // Went online before starting - just block
          setStatus('online_blocked');
          break;

        case 'processing':
          // CRITICAL: Connection detected during processing - ABORT
          // Only if they started offline (online_acknowledged mode allows reconnection)
          if (!startedOnline) {
            setStatus('reconnected_abort');
            clearCountdownInterval();
          }
          break;

        case 'awaiting_download':
          // Reconnected before downloading - warning (only for offline mode)
          if (!startedOnline) {
            setStatus('reconnected_warning');
            startCountdown(WARNING_COUNTDOWN_SECONDS);
          }
          break;

        case 'complete':
          // Reconnected before tab closed - aggressive warning
          setStatus('reconnected_warning');
          startCountdown(WARNING_COUNTDOWN_SECONDS);
          break;

        default:
          // Already in blocked/abort/warning state
          break;
      }
    } else {
      // User went offline
      switch (status) {
        case 'online_blocked':
          // Good - now they can use the tool
          setStatus('offline_ready');
          break;

        case 'reconnected_warning':
          // They went back offline - return to awaiting_download state
          setStatus('awaiting_download');
          clearCountdownInterval();
          setCountdownSeconds(null);
          break;

        default:
          // Already offline or in abort state
          break;
      }
    }
  }, [status, startedOnline, clearCountdownInterval, startCountdown]);

  /**
   * Monitor online/offline status
   */
  useEffect(() => {
    // Event listeners for online/offline
    const handleOnline = () => handleOnlineChange(true);
    const handleOffline = () => handleOnlineChange(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also poll navigator.onLine as backup (some browsers don't fire events reliably)
    onlineCheckIntervalRef.current = setInterval(() => {
      const currentOnline = navigator.onLine;
      if (currentOnline !== isOnline) {
        handleOnlineChange(currentOnline);
      }
    }, ONLINE_CHECK_INTERVAL);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (onlineCheckIntervalRef.current) {
        clearInterval(onlineCheckIntervalRef.current);
      }
    };
  }, [isOnline, handleOnlineChange]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearCountdownInterval();
      if (onlineCheckIntervalRef.current) {
        clearInterval(onlineCheckIntervalRef.current);
      }
    };
  }, [clearCountdownInterval]);

  // Actions
  const actions: OfflineEnforcementActions = {
    startProcessing: useCallback(async () => {
      // H-2 FIX: Prevent concurrent execution via processing lock
      if (isStartingProcessingRef.current) {
        secureWarn('startProcessing already in progress, ignoring duplicate call');
        return;
      }

      isStartingProcessingRef.current = true;

      try {
        // For offline mode, check for service workers which could intercept data
        if (status === 'offline_ready' && !isOnline) {
          // Check for active service workers in offline mode
          if ('serviceWorker' in navigator) {
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              if (registrations.length > 0) {
                secureError('Service workers detected - blocking processing for privacy');
                setStatus('sw_blocked');
                return;
              }
            } catch (e) {
              // If we can't check, log warning but allow processing
              secureWarn('Could not check service workers', e);
            }
          }
          setStartedOnline(false);
          setStatus('processing');
        } else if (status === 'online_acknowledged') {
          // Online mode: user already trusts the site, no need to check service workers
          setStartedOnline(true);
          setStatus('processing');
        }
      } finally {
        isStartingProcessingRef.current = false;
      }
    }, [status, isOnline]),

    completeProcessing: useCallback(() => {
      if (status === 'processing') {
        // Go to awaiting_download - no countdown, wait for user to download
        setStatus('awaiting_download');
      }
    }, [status]),

    markDownloaded: useCallback(() => {
      setHasDownloaded(true);
      // For offline mode: immediately close after download
      // For online mode: don't force close (they're already online, closing is security theater)
      if (!startedOnline) {
        // Transition to complete briefly, then force close
        setStatus('complete');
        // Immediate close - no delay needed since user initiated download
        forceCloseTab();
      }
    }, [startedOnline]),

    extendCountdown: useCallback(() => {
      if (extensionsUsed >= MAX_EXTENSIONS) {
        return false; // No more extensions allowed
      }

      setExtensionsUsed((prev) => prev + 1);
      clearCountdownInterval();
      startCountdown(EXTENSION_SECONDS);
      return true;
    }, [extensionsUsed, clearCountdownInterval, startCountdown]),

    forceClose: useCallback(() => {
      forceCloseTab();
    }, []),

    reset: useCallback(() => {
      clearCountdownInterval();
      setStatus(navigator.onLine ? 'online_blocked' : 'offline_ready');
      setCountdownSeconds(null);
      setHasDownloaded(false);
      setExtensionsUsed(0);
      setStartedOnline(false);
    }, [clearCountdownInterval]),

    acknowledgeOnlineRisk: useCallback(() => {
      // User explicitly accepts processing while online
      // Only allow from online_blocked state
      if (status === 'online_blocked' && isOnline) {
        setStatus('online_acknowledged');
      }
    }, [status, isOnline]),

    toggleDemoMode: useCallback(() => {
      const newValue = !demoModeEnabled;
      setDemoModeEnabled(newValue);

      if (newValue) {
        // Enabling demo mode
        sessionStorage.setItem('purge_demo_mode', 'true');
        // Auto-acknowledge online risk if currently blocked
        if (status === 'online_blocked' && isOnline) {
          setStatus('online_acknowledged');
        }
      } else {
        // Disabling demo mode
        sessionStorage.removeItem('purge_demo_mode');
        // Return to blocked state if online and was acknowledged
        if (isOnline && status === 'online_acknowledged') {
          setStatus('online_blocked');
        }
      }
    }, [demoModeEnabled, status, isOnline]),
  };

  return {
    state: {
      status,
      isOnline,
      canProcess,
      countdownSeconds,
      hasDownloaded,
      extensionsUsed,
      maxExtensions: MAX_EXTENSIONS,
      startedOnline,
      demoModeEnabled,
    },
    actions,
  };
}
