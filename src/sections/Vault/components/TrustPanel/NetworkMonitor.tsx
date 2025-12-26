/**
 * NetworkMonitor Component
 *
 * Live packet inspector style display showing network activity.
 * Shows "No outbound requests detected" for user confidence.
 *
 * Visual concept:
 * - Terminal-like display with scrolling request logs
 * - Color-coded by request type (GET, POST, etc.)
 * - Animated scanning indicator when recording
 * - Clear "CLEAN" status when no suspicious activity
 */

import { memo, useEffect, useState, useRef } from 'react';
import type { NetworkRequest } from '@/core/types';

interface NetworkMonitorProps {
  /** Array of captured network requests */
  requests: NetworkRequest[];
  /** Whether the hook is currently recording */
  isRecording: boolean;
  /** Total bytes transferred */
  totalBytes: number;
  /** Whether processing has started */
  hasStartedProcessing: boolean;
  /** Whether processing is complete */
  hasCompletedProcessing: boolean;
}

/** Format bytes to human readable */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format timestamp */
function formatTime(timestamp: number): string {
  const date = new Date(performance.timeOrigin + timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Get method badge color - using theme-aware colors */
function getMethodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'text-forge-accent';
    case 'POST':
      return 'text-forge-warning';
    case 'PUT':
    case 'PATCH':
      return 'text-forge-accent'; // Use accent instead of hardcoded blue
    case 'DELETE':
      return 'text-forge-error';
    case 'WEBSOCKET':
    case 'WEBRTC':
      return 'text-forge-text-primary'; // Use primary text instead of hardcoded purple
    case 'BEACON':
      return 'text-[var(--forge-warning)]'; // Use warning instead of hardcoded orange
    case 'WORKER':
    case 'SHAREDWORKER':
      return 'text-[var(--forge-success)]'; // Use success instead of hardcoded cyan
    default:
      return 'text-forge-text-secondary';
  }
}

/** Truncate URL for display */
function truncateUrl(url: string, maxLength: number = 40): string {
  if (url.length <= maxLength) return url;
  const start = url.slice(0, maxLength / 2 - 2);
  const end = url.slice(-(maxLength / 2 - 2));
  return `${start}...${end}`;
}

/** Filter requests to only show relevant ones during processing */
function filterRequests(requests: NetworkRequest[]): NetworkRequest[] {
  return requests.filter((req) => {
    const url = req.url.toLowerCase();
    const method = req.method.toUpperCase();

    // Filter out browser extension requests
    if (url.includes('chrome-extension://')) return false;
    // Filter out hot module reload (dev only)
    if (url.includes('hot-update')) return false;
    if (url.includes('__vite_ping')) return false;
    // Filter out internal workers (not actual network requests)
    if (method === 'WORKER' || method === 'SHAREDWORKER') return false;
    // Filter out WebRTC ICE (connection negotiation, not data transfer)
    if (method === 'WEBRTC') return false;
    // Filter out 0-byte requests (monitoring artifacts)
    if (req.size === 0 && req.status === 0) return false;

    // Only show actual HTTP requests that might transfer data
    return true;
  });
}

/** Scanning animation dots */
const ScanningDots = memo(function ScanningDots() {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <span className="text-forge-accent">{dots}</span>;
});

/** Request row component */
const RequestRow = memo(function RequestRow({ request }: { request: NetworkRequest }) {
  return (
    <div className="flex items-center gap-2 py-1 px-2 text-[10px] font-mono border-b border-forge-border/30 hover:bg-forge-bg-tertiary/50">
      {/* Time */}
      <span className="text-forge-text-dim w-16 flex-shrink-0">
        {formatTime(request.timestamp)}
      </span>
      {/* Method badge */}
      <span
        className={`w-12 flex-shrink-0 uppercase font-bold ${getMethodColor(request.method)}`}
      >
        {request.method.slice(0, 6)}
      </span>
      {/* Status */}
      <span
        className={`w-8 flex-shrink-0 ${
          request.status >= 200 && request.status < 300
            ? 'text-forge-success'
            : request.status >= 400
              ? 'text-forge-error'
              : 'text-forge-text-dim'
        }`}
      >
        {request.status || '---'}
      </span>
      {/* Size */}
      <span className="w-12 flex-shrink-0 text-right text-forge-text-dim">
        {formatBytes(request.size)}
      </span>
      {/* URL */}
      <span className="flex-1 truncate text-forge-text-secondary" title={request.url}>
        {truncateUrl(request.url)}
      </span>
    </div>
  );
});

export const NetworkMonitor = memo(function NetworkMonitor({
  requests,
  isRecording,
  totalBytes,
  hasStartedProcessing,
  hasCompletedProcessing,
}: NetworkMonitorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const filteredRequests = filterRequests(requests);
  const hasRequests = filteredRequests.length > 0;

  // Auto-scroll to bottom when new requests come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredRequests.length]);

  // Determine status
  const getStatus = () => {
    if (!hasStartedProcessing && !isRecording) {
      return { label: 'STANDBY', color: 'text-forge-text-dim', icon: '○' };
    }
    if (isRecording && !hasCompletedProcessing) {
      return { label: 'MONITORING', color: 'text-forge-accent', icon: '◉' };
    }
    if (hasCompletedProcessing && !hasRequests) {
      return { label: 'CLEAN', color: 'text-forge-success', icon: '✓' };
    }
    if (hasCompletedProcessing && hasRequests) {
      return { label: 'ACTIVITY DETECTED', color: 'text-forge-warning', icon: '!' };
    }
    return { label: 'SCANNING', color: 'text-forge-accent', icon: '◉' };
  };

  const status = getStatus();

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-forge-text-secondary uppercase tracking-wider">
          Network Monitor
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono ${status.color}`}>
            {status.icon} {status.label}
            {isRecording && !hasCompletedProcessing && <ScanningDots />}
          </span>
        </div>
      </div>

      {/* Terminal window */}
      <div className="bg-forge-bg-primary border border-forge-border overflow-hidden">
        {/* Terminal header bar */}
        <div className="flex items-center justify-between px-2 py-1 bg-forge-bg-tertiary border-b border-forge-border">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/60" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
            <div className="w-2 h-2 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[10px] font-mono text-forge-text-dim uppercase">
            packet inspector
          </span>
          <span className="text-[10px] font-mono text-forge-text-dim">
            {formatBytes(totalBytes)}
          </span>
        </div>

        {/* Request log */}
        <div
          ref={scrollRef}
          className="h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent"
        >
          {/* Column headers */}
          <div className="sticky top-0 flex items-center gap-2 py-1 px-2 text-[9px] font-mono uppercase text-forge-text-dim bg-forge-bg-secondary border-b border-forge-border">
            <span className="w-16 flex-shrink-0">Time</span>
            <span className="w-12 flex-shrink-0">Method</span>
            <span className="w-8 flex-shrink-0">Code</span>
            <span className="w-12 flex-shrink-0 text-right">Size</span>
            <span className="flex-1">URL</span>
          </div>

          {/* Requests */}
          {hasRequests ? (
            filteredRequests.map((req) => <RequestRow key={req.id} request={req} />)
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-center">
              {isRecording ? (
                <>
                  <span className="text-lg mb-1">👁</span>
                  <span className="text-xs font-mono text-forge-text-secondary">
                    Watching for outbound traffic
                  </span>
                  <span className="text-[10px] font-mono text-forge-text-dim mt-1">
                    No uploads detected
                  </span>
                </>
              ) : hasCompletedProcessing ? (
                <>
                  <span className="text-lg mb-1 text-forge-success">✓</span>
                  <span className="text-xs font-mono text-forge-success">
                    No outbound requests detected
                  </span>
                  <span className="text-[10px] font-mono text-forge-text-dim mt-1">
                    Your data stayed local
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg mb-1 text-forge-text-dim">◌</span>
                  <span className="text-xs font-mono text-forge-text-dim">
                    Waiting for processing to start
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-[10px] font-mono text-forge-text-dim">
        {hasRequests ? (
          <span className="text-forge-warning">
            ⚠ Some network activity detected (may be browser/extension traffic)
          </span>
        ) : (
          <span>Monitors fetch, XHR, WebSocket, Worker, WebRTC</span>
        )}
      </div>
    </div>
  );
});
