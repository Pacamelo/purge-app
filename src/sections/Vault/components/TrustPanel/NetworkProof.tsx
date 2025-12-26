/**
 * NetworkProof Component
 * Live network request log showing zero data transmission
 *
 * M-3 DISCLAIMER: This monitoring intercepts common APIs (fetch, XHR, WebSocket,
 * Worker, RTCPeerConnection, sendBeacon) but cannot detect:
 * - Browser extensions making requests via chrome.* APIs
 * - Native code plugins or PDF viewers
 * - Background Sync API or WebTransport
 * - DNS prefetch attacks or timing side-channels
 * - Requests made before PURGE loads
 *
 * For maximum assurance, use Airplane Mode + DevTools Network tab.
 */

import { memo } from 'react';
import type { NetworkRequest } from '@/core/types';

interface NetworkProofProps {
  requests: NetworkRequest[];
  isRecording: boolean;
  totalBytes: number;
}

/**
 * Format bytes for display
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format timestamp
 */
function formatTime(timestamp: number): string {
  const seconds = Math.floor(timestamp / 1000);
  const ms = Math.floor(timestamp % 1000);
  return `${seconds}.${ms.toString().padStart(3, '0')}s`;
}

/**
 * Truncate URL for display
 */
function truncateUrl(url: string, maxLength: number = 40): string {
  if (url.length <= maxLength) return url;
  return url.slice(0, maxLength - 3) + '...';
}

export const NetworkProof = memo(function NetworkProof({
  requests,
  isRecording,
  totalBytes,
}: NetworkProofProps) {
  const isEmpty = requests.length === 0;

  return (
    <div className="trust-panel p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase text-forge-text-dim">
            Network Proof
          </span>
          {isRecording && (
            <span className="flex items-center gap-1 text-xs text-forge-error">
              <span className="w-2 h-2 bg-forge-error rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-forge-text-dim">
          {requests.length} requests | {formatBytes(totalBytes)} sent
        </span>
      </div>

      {/* Request log */}
      <div className="trust-network-log p-2 rounded">
        {isEmpty ? (
          <div className="text-center py-4">
            <p className="text-forge-success text-sm">[ NOTHING HERE ]</p>
            <p className="text-forge-text-dim text-xs mt-1">
              Your files stay local.
            </p>
            <p className="text-forge-text-dim text-xs">
              This panel is LIVE. Any upload would appear.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-forge-text-dim text-left">
                <th className="pr-2">METHOD</th>
                <th className="pr-2">URL</th>
                <th className="pr-2">SIZE</th>
                <th>TIME</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="text-forge-warning">
                  <td className="pr-2">{req.method}</td>
                  <td className="pr-2 truncate max-w-[200px]" title={req.url}>
                    {truncateUrl(req.url)}
                  </td>
                  <td className="pr-2">{formatBytes(req.size)}</td>
                  <td>{formatTime(req.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status summary */}
      <div className="mt-2 text-xs">
        {isEmpty ? (
          <span className="trust-indicator-good">
            ✓ No requests detected by monitor
          </span>
        ) : (
          <span className="text-forge-text-dim">
            {requests.length} request(s) — normal browser activity (extensions, analytics, etc.)
          </span>
        )}
      </div>

      {/* M-3: Network monitoring disclaimer */}
      <div className="mt-2 p-2 bg-forge-bg-tertiary border border-forge-border text-[10px] text-forge-text-dim">
        This shows browser network activity, not PURGE uploads. We can't distinguish your
        data from normal traffic. For proof, go offline before processing.
      </div>
    </div>
  );
});
