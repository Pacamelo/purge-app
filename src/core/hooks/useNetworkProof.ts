/**
 * useNetworkProof Hook
 * Monitors network requests to provide visibility into network activity.
 *
 * SECURITY NOTE: This hook monitors common network APIs (fetch, XHR, sendBeacon,
 * WebSocket, Worker, RTCPeerConnection) but cannot guarantee complete coverage.
 * Browser extensions, service workers, and other mechanisms may bypass monitoring.
 * This is a best-effort indicator, not a security guarantee.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { NetworkRequest } from '@/core/types';
import { generatePrefixedId } from '@/core/utils/secureRandom';

/**
 * Result object returned by the useNetworkProof hook
 */
interface UseNetworkProofResult {
  /** Array of captured network requests */
  requests: NetworkRequest[];
  /** Whether the hook is currently recording requests */
  isRecording: boolean;
  /** Start monitoring network activity (patches global APIs) */
  startRecording: () => void;
  /** Stop monitoring and restore original APIs */
  stopRecording: () => void;
  /** Clear the recorded requests array */
  clearRequests: () => void;
  /** Total bytes transferred across all requests */
  totalBytes: number;
  /** Total number of captured requests */
  requestCount: number;
}

/**
 * Generate unique request ID using cryptographically secure random
 */
function generateId(): string {
  return generatePrefixedId('req');
}

/**
 * Hook to monitor and display network activity.
 *
 * Uses monkey-patching of global APIs (fetch, XHR, WebSocket, Worker, RTCPeerConnection)
 * and PerformanceObserver to intercept network requests. This provides visibility into
 * network activity during document processing.
 *
 * @returns Object containing request data, recording state, and control functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { requests, isRecording, startRecording, stopRecording } = useNetworkProof();
 *
 *   useEffect(() => {
 *     startRecording();
 *     return () => stopRecording();
 *   }, []);
 *
 *   return <div>Requests: {requests.length}</div>;
 * }
 * ```
 */
export function useNetworkProof(): UseNetworkProofResult {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const observerRef = useRef<PerformanceObserver | null>(null);
  const originalFetchRef = useRef<typeof fetch | null>(null);
  const originalXHROpenRef = useRef<typeof XMLHttpRequest.prototype.open | null>(null);
  // Additional API monitoring refs
  const originalBeaconRef = useRef<typeof navigator.sendBeacon | null>(null);
  const originalWebSocketRef = useRef<typeof WebSocket | null>(null);
  const originalWorkerRef = useRef<typeof Worker | null>(null);
  const originalSharedWorkerRef = useRef<typeof SharedWorker | null>(null);
  const originalRTCRef = useRef<typeof RTCPeerConnection | null>(null);

  /**
   * Start recording network requests
   */
  const startRecording = useCallback(() => {
    setRequests([]);
    setIsRecording(true);

    // PerformanceObserver for resource timing
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        entries.forEach((entry) => {
          // Filter out our own monitoring
          if (entry.name.includes('chrome-extension://')) return;

          setRequests((prev) => [
            ...prev,
            {
              id: generateId(),
              method: 'GET', // PerformanceObserver doesn't provide method
              url: entry.name,
              size: entry.transferSize || 0,
              status: 200, // Approximate
              timestamp: entry.startTime,
            },
          ]);
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      observerRef.current = observer;
    } catch {
      console.warn('PerformanceObserver not supported');
    }

    // Monkey-patch fetch for more accurate tracking
    if (!originalFetchRef.current) {
      originalFetchRef.current = window.fetch;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const method = init?.method || 'GET';

        const startTime = performance.now();

        try {
          const response = await originalFetchRef.current!(input, init);

          // Clone to read body size
          const clone = response.clone();
          const body = await clone.blob();

          setRequests((prev) => [
            ...prev,
            {
              id: generateId(),
              method: method.toUpperCase(),
              url,
              size: body.size,
              status: response.status,
              timestamp: startTime,
            },
          ]);

          return response;
        } catch (error) {
          setRequests((prev) => [
            ...prev,
            {
              id: generateId(),
              method: method.toUpperCase(),
              url,
              size: 0,
              status: 0,
              timestamp: startTime,
            },
          ]);
          throw error;
        }
      };
    }

    // Monkey-patch XMLHttpRequest
    if (!originalXHROpenRef.current) {
      originalXHROpenRef.current = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (
        method: string,
        url: string | URL,
        async?: boolean,
        username?: string | null,
        password?: string | null
      ) {
        const startTime = performance.now();

        this.addEventListener('load', () => {
          setRequests((prev) => [
            ...prev,
            {
              id: generateId(),
              method: method.toUpperCase(),
              url: url.toString(),
              size: this.response?.length || 0,
              status: this.status,
              timestamp: startTime,
            },
          ]);
        });

        return originalXHROpenRef.current!.call(this, method, url, async ?? true, username, password);
      };
    }

    // Monitor sendBeacon API (fire-and-forget POST)
    if (!originalBeaconRef.current && typeof navigator.sendBeacon === 'function') {
      originalBeaconRef.current = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = (url: string, data?: BodyInit | null) => {
        const size = data ? (typeof data === 'string' ? data.length : (data as Blob).size || 0) : 0;
        setRequests((prev) => [
          ...prev,
          {
            id: generateId(),
            method: 'BEACON',
            url,
            size,
            status: 0, // Beacon doesn't return status
            timestamp: performance.now(),
          },
        ]);
        return originalBeaconRef.current!(url, data);
      };
    }

    // Monitor WebSocket connections
    if (!originalWebSocketRef.current) {
      originalWebSocketRef.current = window.WebSocket;
      const OriginalWS = window.WebSocket;

      // Create wrapper class that properly extends WebSocket
      const PatchedWebSocket = class extends OriginalWS {
        constructor(url: string | URL, protocols?: string | string[]) {
          super(url, protocols);
          setRequests((prev) => [
            ...prev,
            {
              id: generateId(),
              method: 'WEBSOCKET',
              url: url.toString(),
              size: 0,
              status: 0,
              timestamp: performance.now(),
            },
          ]);
        }
      };

      window.WebSocket = PatchedWebSocket;
    }

    // Monitor Worker creation
    if (!originalWorkerRef.current && typeof Worker !== 'undefined') {
      originalWorkerRef.current = window.Worker;
      const OriginalWorker = window.Worker;

      // Create wrapper class that properly extends Worker
      const PatchedWorker = class extends OriginalWorker {
        constructor(scriptURL: string | URL, options?: WorkerOptions) {
          super(scriptURL, options);
          setRequests((prev) => [
            ...prev,
            {
              id: generateId(),
              method: 'WORKER',
              url: scriptURL.toString(),
              size: 0,
              status: 0,
              timestamp: performance.now(),
            },
          ]);
        }
      };

      window.Worker = PatchedWorker;
    }

    // Monitor SharedWorker creation
    if (!originalSharedWorkerRef.current && typeof SharedWorker !== 'undefined') {
      originalSharedWorkerRef.current = window.SharedWorker;
      const OriginalSharedWorker = window.SharedWorker;

      // Create wrapper class that properly extends SharedWorker
      const PatchedSharedWorker = class extends OriginalSharedWorker {
        constructor(scriptURL: string | URL, options?: string | WorkerOptions) {
          super(scriptURL, options);
          setRequests((prev) => [
            ...prev,
            {
              id: generateId(),
              method: 'SHAREDWORKER',
              url: scriptURL.toString(),
              size: 0,
              status: 0,
              timestamp: performance.now(),
            },
          ]);
        }
      };

      window.SharedWorker = PatchedSharedWorker;
    }

    // Monitor RTCPeerConnection (WebRTC data channels)
    if (!originalRTCRef.current && typeof RTCPeerConnection !== 'undefined') {
      originalRTCRef.current = window.RTCPeerConnection;
      const OriginalRTC = window.RTCPeerConnection;

      // Create wrapper class that properly extends RTCPeerConnection
      const PatchedRTC = class extends OriginalRTC {
        constructor(config?: RTCConfiguration) {
          super(config);
          const iceServers = config?.iceServers?.map(s =>
            Array.isArray(s.urls) ? s.urls.join(', ') : s.urls
          ).join('; ') || 'default';
          setRequests((prev) => [
            ...prev,
            {
              id: generateId(),
              method: 'WEBRTC',
              url: `ICE: ${iceServers}`,
              size: 0,
              status: 0,
              timestamp: performance.now(),
            },
          ]);
        }
      };

      window.RTCPeerConnection = PatchedRTC;
    }
  }, []);

  /**
   * Stop recording network requests
   * Restores all original API implementations
   */
  const stopRecording = useCallback(() => {
    setIsRecording(false);

    // Disconnect observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Restore fetch
    if (originalFetchRef.current) {
      window.fetch = originalFetchRef.current;
      originalFetchRef.current = null;
    }

    // Restore XHR
    if (originalXHROpenRef.current) {
      XMLHttpRequest.prototype.open = originalXHROpenRef.current;
      originalXHROpenRef.current = null;
    }

    // Restore sendBeacon
    if (originalBeaconRef.current) {
      navigator.sendBeacon = originalBeaconRef.current;
      originalBeaconRef.current = null;
    }

    // Restore WebSocket
    if (originalWebSocketRef.current) {
      window.WebSocket = originalWebSocketRef.current;
      originalWebSocketRef.current = null;
    }

    // Restore Worker
    if (originalWorkerRef.current) {
      window.Worker = originalWorkerRef.current;
      originalWorkerRef.current = null;
    }

    // Restore SharedWorker
    if (originalSharedWorkerRef.current) {
      window.SharedWorker = originalSharedWorkerRef.current;
      originalSharedWorkerRef.current = null;
    }

    // Restore RTCPeerConnection
    if (originalRTCRef.current) {
      window.RTCPeerConnection = originalRTCRef.current;
      originalRTCRef.current = null;
    }
  }, []);

  /**
   * Clear recorded requests
   */
  const clearRequests = useCallback(() => {
    setRequests([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  // Calculate totals
  const totalBytes = requests.reduce((sum, r) => sum + r.size, 0);
  const requestCount = requests.length;

  return {
    requests,
    isRecording,
    startRecording,
    stopRecording,
    clearRequests,
    totalBytes,
    requestCount,
  };
}
