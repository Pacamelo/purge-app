/**
 * SessionSummaryExport Component
 *
 * Download button for PDF session summary.
 *
 * IMPORTANT: This is NOT a "proof certificate" - the UI must be clear
 * that this is a self-reported summary with disclaimers.
 */

import { memo, useCallback, useState } from 'react';
import {
  downloadSessionSummary,
  generateSessionId,
  type SessionSummaryData,
} from '@/core/services/sessionSummary';
import type { ProcessedFile, MemoryStats } from '@/core/types';

interface SessionSummaryExportProps {
  /** Processed files */
  processedFiles: ProcessedFile[];
  /** Network requests detected */
  networkRequestsCount: number;
  /** Whether storage changed */
  storageChanged: boolean;
  /** Memory stats */
  memoryStats: MemoryStats;
  /** Whether processed offline */
  wasOffline: boolean;
  /** File hashes */
  fileHashes: Map<string, { original: string; processed: string }>;
}

/**
 * Detect browser and platform
 */
function detectEnvironment(): { browser: string; platform: string; userAgent: string } {
  const ua = navigator.userAgent;
  let browser = 'Unknown';

  if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  }

  let platform = navigator.platform || 'Unknown';
  if (ua.includes('Mac')) platform = 'macOS';
  else if (ua.includes('Win')) platform = 'Windows';
  else if (ua.includes('Linux')) platform = 'Linux';

  return { browser, platform, userAgent: ua };
}

export const SessionSummaryExport = memo(function SessionSummaryExport({
  processedFiles,
  networkRequestsCount,
  storageChanged,
  memoryStats,
  wasOffline,
  fileHashes,
}: SessionSummaryExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = useCallback(async () => {
    setIsGenerating(true);

    try {
      const environment = detectEnvironment();

      const summaryData: SessionSummaryData = {
        sessionId: generateSessionId(),
        timestamp: new Date().toISOString(),
        files: processedFiles.map((file) => {
          const hashes = fileHashes.get(file.id) || { original: '', processed: '' };
          return {
            name: file.originalName,
            originalHash: hashes.original,
            processedHash: hashes.processed,
            originalSize: file.originalSize,
            processedSize: file.purgedSize,
            detectionsRemoved: file.detectionsRemoved,
          };
        }),
        selfReportedMetrics: {
          networkRequestsDetected: networkRequestsCount,
          storageChangesDetected: storageChanged,
          memoryWipeCompleted: memoryStats.wiped >= memoryStats.allocated,
          wasOfflineDuringProcessing: wasOffline,
        },
        environment,
      };

      downloadSessionSummary(summaryData);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [processedFiles, networkRequestsCount, storageChanged, memoryStats, wasOffline, fileHashes]);

  // Only show if there are processed files
  if (processedFiles.length === 0) {
    return null;
  }

  return (
    <div className="border border-forge-border bg-forge-bg-tertiary p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">📄</span>
        <div>
          <h3 className="text-sm font-mono font-bold text-forge-text-primary uppercase tracking-wider">
            Export Session Summary
          </h3>
          <p className="text-xs text-forge-text-dim">
            Download a PDF record of this session
          </p>
        </div>
      </div>

      {/* Disclaimer - REQUIRED */}
      <div className="p-3 bg-forge-warning/10 border border-forge-warning/30 mb-4">
        <div className="flex items-start gap-2">
          <span className="text-forge-warning">⚠</span>
          <div className="text-xs text-forge-text-secondary">
            <p className="font-bold text-forge-warning mb-1">
              This is NOT a proof certificate
            </p>
            <p>
              The PDF contains <strong>self-reported metrics</strong> from our app.
              For independent verification, use Airplane Mode or check DevTools.
            </p>
          </div>
        </div>
      </div>

      {/* What's included */}
      <div className="mb-4 text-xs text-forge-text-secondary space-y-1">
        <p className="font-mono text-forge-text-dim uppercase tracking-wider">PDF includes:</p>
        <ul className="space-y-1 pl-4">
          <li>• Session ID and timestamp</li>
          <li>• File names, sizes, and hashes</li>
          <li>• Self-reported network/storage metrics</li>
          <li>• How to verify independently</li>
          <li>• Required disclaimers</li>
        </ul>
      </div>

      {/* Offline badge if applicable */}
      {wasOffline && (
        <div className="mb-4 p-2 bg-forge-success/10 border border-forge-success text-center">
          <p className="text-xs text-forge-success font-mono">
            ✓ PROCESSED OFFLINE - Strongest privacy indication
          </p>
        </div>
      )}

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={isGenerating}
        className={`
          w-full px-4 py-3 text-sm font-mono uppercase tracking-wider
          border transition-all
          ${isGenerating
            ? 'bg-forge-bg-secondary border-forge-border text-forge-text-dim cursor-wait'
            : 'bg-forge-bg-primary border-forge-accent text-forge-accent hover:bg-forge-accent hover:text-white'
          }
        `}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⟳</span>
            Generating PDF...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>↓</span>
            Download Session Summary (PDF)
          </span>
        )}
      </button>

      {/* Footer note */}
      <p className="mt-3 text-xs text-forge-text-dim text-center">
        PDF includes all required disclaimers about self-reported data.
      </p>
    </div>
  );
});
