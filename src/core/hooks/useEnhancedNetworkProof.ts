/**
 * useEnhancedNetworkProof Hook
 *
 * Enhanced network monitoring that covers channels the basic hook misses:
 * - WebSocket connections
 * - WebRTC data channels (RTCPeerConnection)
 * - Service Worker registrations and background sync
 * - Beacon API
 * - sendBeacon
 *
 * SECURITY NOTE: This is monitoring for visibility, not security.
 * Extensions, service workers, and other mechanisms may bypass detection.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateSecureId } from '@/core/utils/secureRandom';

export interface EnhancedNetworkState {
  /** WebSocket connections detected */
  webSocketConnections: WebSocketConnection[];
  /** WebRTC peer connections detected */
  webRTCConnections: WebRTCConnection[];
  /** Service workers registered */
  serviceWorkers: ServiceWorkerInfo[];
  /** Beacon requests detected */
  beaconRequests: BeaconRequest[];
  /** Any concerning activity detected */
  hasConcerningActivity: boolean;
  /** Summary of all activity */
  summary: string;
}

export interface WebSocketConnection {
  id: string;
  url: string;
  timestamp: number;
  state: 'connecting' | 'open' | 'closing' | 'closed';
}

export interface WebRTCConnection {
  id: string;
  timestamp: number;
  type: 'offer' | 'answer' | 'datachannel';
}

export interface ServiceWorkerInfo {
  scriptURL: string;
  state: ServiceWorkerState;
  timestamp: number;
}

export interface BeaconRequest {
  id: string;
  url: string;
  timestamp: number;
}

export interface UseEnhancedNetworkProofResult {
  state: EnhancedNetworkState;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  checkServiceWorkers: () => Promise<void>;
  reset: () => void;
  isMonitoring: boolean;
}

function generateId(): string {
  return generateSecureId();
}

export function useEnhancedNetworkProof(): UseEnhancedNetworkProofResult {
  const [state, setState] = useState<EnhancedNetworkState>({
    webSocketConnections: [],
    webRTCConnections: [],
    serviceWorkers: [],
    beaconRequests: [],
    hasConcerningActivity: false,
    summary: 'Not monitoring',
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  // Store original implementations for restoration
  const originalWebSocket = useRef<typeof WebSocket | null>(null);
  const originalRTCPeerConnection = useRef<typeof RTCPeerConnection | null>(null);
  const originalSendBeacon = useRef<typeof navigator.sendBeacon | null>(null);

  /**
   * Update summary based on current state
   */
  const updateSummary = useCallback((currentState: EnhancedNetworkState): string => {
    const issues: string[] = [];

    if (currentState.webSocketConnections.length > 0) {
      issues.push(`${currentState.webSocketConnections.length} WebSocket connection(s)`);
    }
    if (currentState.webRTCConnections.length > 0) {
      issues.push(`${currentState.webRTCConnections.length} WebRTC connection(s)`);
    }
    if (currentState.serviceWorkers.length > 0) {
      issues.push(`${currentState.serviceWorkers.length} Service Worker(s) registered`);
    }
    if (currentState.beaconRequests.length > 0) {
      issues.push(`${currentState.beaconRequests.length} Beacon request(s)`);
    }

    if (issues.length === 0) {
      return 'No WebSocket, WebRTC, Service Workers, or Beacons detected';
    }

    return `Detected: ${issues.join(', ')}`;
  }, []);

  /**
   * Start monitoring all network channels
   */
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);

    // Monitor WebSocket
    if (!originalWebSocket.current && typeof WebSocket !== 'undefined') {
      originalWebSocket.current = WebSocket;

      const OriginalWebSocket = WebSocket;
      // @ts-expect-error - Monkey-patching WebSocket
      window.WebSocket = function (url: string, protocols?: string | string[]) {
        const ws = new OriginalWebSocket(url, protocols);

        setState((prev) => {
          const newConnections = [
            ...prev.webSocketConnections,
            {
              id: generateId(),
              url,
              timestamp: Date.now(),
              state: 'connecting' as const,
            },
          ];
          return {
            ...prev,
            webSocketConnections: newConnections,
            hasConcerningActivity: true,
            summary: updateSummary({ ...prev, webSocketConnections: newConnections }),
          };
        });

        return ws;
      };
      // Copy static properties
      Object.assign(window.WebSocket, OriginalWebSocket);
    }

    // Monitor RTCPeerConnection (WebRTC)
    if (!originalRTCPeerConnection.current && typeof RTCPeerConnection !== 'undefined') {
      originalRTCPeerConnection.current = RTCPeerConnection;

      const OriginalRTCPeerConnection = RTCPeerConnection;
      // @ts-expect-error - Monkey-patching RTCPeerConnection
      window.RTCPeerConnection = function (config?: RTCConfiguration) {
        const pc = new OriginalRTCPeerConnection(config);

        setState((prev) => {
          const newConnections = [
            ...prev.webRTCConnections,
            {
              id: generateId(),
              timestamp: Date.now(),
              type: 'offer' as const,
            },
          ];
          return {
            ...prev,
            webRTCConnections: newConnections,
            hasConcerningActivity: true,
            summary: updateSummary({ ...prev, webRTCConnections: newConnections }),
          };
        });

        return pc;
      };
      // Copy prototype and static properties
      window.RTCPeerConnection.prototype = OriginalRTCPeerConnection.prototype;
      Object.assign(window.RTCPeerConnection, OriginalRTCPeerConnection);
    }

    // Monitor sendBeacon
    if (!originalSendBeacon.current && typeof navigator.sendBeacon !== 'undefined') {
      originalSendBeacon.current = navigator.sendBeacon.bind(navigator);

      navigator.sendBeacon = (url: string, data?: BodyInit | null) => {
        setState((prev) => {
          const newBeacons = [
            ...prev.beaconRequests,
            {
              id: generateId(),
              url,
              timestamp: Date.now(),
            },
          ];
          return {
            ...prev,
            beaconRequests: newBeacons,
            hasConcerningActivity: true,
            summary: updateSummary({ ...prev, beaconRequests: newBeacons }),
          };
        });

        return originalSendBeacon.current!(url, data);
      };
    }

    setState((prev) => ({
      ...prev,
      summary: 'Monitoring WebSocket, WebRTC, Beacons...',
    }));
  }, [updateSummary]);

  /**
   * Stop monitoring and restore original implementations
   */
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);

    // Restore WebSocket
    if (originalWebSocket.current) {
      window.WebSocket = originalWebSocket.current;
      originalWebSocket.current = null;
    }

    // Restore RTCPeerConnection
    if (originalRTCPeerConnection.current) {
      window.RTCPeerConnection = originalRTCPeerConnection.current;
      originalRTCPeerConnection.current = null;
    }

    // Restore sendBeacon
    if (originalSendBeacon.current) {
      navigator.sendBeacon = originalSendBeacon.current;
      originalSendBeacon.current = null;
    }

    setState((prev) => ({
      ...prev,
      summary: updateSummary(prev),
    }));
  }, [updateSummary]);

  /**
   * Check for registered Service Workers
   */
  const checkServiceWorkers = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      const swInfo: ServiceWorkerInfo[] = registrations.map((reg) => ({
        scriptURL: reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || 'unknown',
        state: reg.active?.state || reg.installing?.state || reg.waiting?.state || 'unknown' as ServiceWorkerState,
        timestamp: Date.now(),
      }));

      setState((prev) => {
        const hasSW = swInfo.length > 0;
        return {
          ...prev,
          serviceWorkers: swInfo,
          hasConcerningActivity: prev.hasConcerningActivity || hasSW,
          summary: updateSummary({ ...prev, serviceWorkers: swInfo }),
        };
      });
    } catch (error) {
      console.warn('Could not check service workers:', error);
    }
  }, [updateSummary]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    stopMonitoring();
    setState({
      webSocketConnections: [],
      webRTCConnections: [],
      serviceWorkers: [],
      beaconRequests: [],
      hasConcerningActivity: false,
      summary: 'Not monitoring',
    });
  }, [stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    state,
    startMonitoring,
    stopMonitoring,
    checkServiceWorkers,
    reset,
    isMonitoring,
  };
}
