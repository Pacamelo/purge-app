/**
 * QRCertificate Component
 *
 * Displays file hash as a scannable QR code.
 *
 * IMPORTANT DISTINCTION (displayed in UI):
 * - This PROVES: File integrity (wasn't modified during processing)
 * - This does NOT PROVE: That the file wasn't copied/uploaded
 *
 * The UI must be honest about this limitation.
 */

import { memo, useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { truncateHash } from '@/core/hooks/useFileHash';

interface QRCertificateProps {
  /** SHA-256 hash of the original file */
  originalHash: string | null;
  /** SHA-256 hash of the processed file */
  processedHash: string | null;
  /** Timestamp of processing */
  timestamp: string | null;
  /** File name for reference */
  fileName?: string;
}

interface CertificateData {
  app: string;
  version: string;
  originalHash: string;
  processedHash: string;
  timestamp: string;
  fileName: string;
}

export const QRCertificate = memo(function QRCertificate({
  originalHash,
  processedHash,
  timestamp,
  fileName = 'unknown',
}: QRCertificateProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate QR code when hashes are available
  useEffect(() => {
    if (!originalHash && !processedHash) {
      setQrDataUrl(null);
      return;
    }

    const certificateData: CertificateData = {
      app: 'PURGE',
      version: '1.0',
      originalHash: originalHash || '',
      processedHash: processedHash || '',
      timestamp: timestamp || new Date().toISOString(),
      fileName,
    };

    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(JSON.stringify(certificateData), {
          width: 200,
          margin: 2,
          color: {
            dark: '#00FF00', // Forge green
            light: '#000000', // Black background
          },
        });
        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }
    };

    generateQR();
  }, [originalHash, processedHash, timestamp, fileName]);

  // Copy hash to clipboard
  const copyHash = useCallback(async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  // Nothing to show if no hashes
  if (!originalHash && !processedHash) {
    return null;
  }

  return (
    <div className="border border-forge-border bg-forge-bg-tertiary">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-forge-bg-secondary transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🔐</span>
          <div>
            <h3 className="text-sm font-mono font-bold text-forge-text-primary uppercase tracking-wider">
              Integrity Certificate
            </h3>
            <p className="text-xs text-forge-text-dim">
              File fingerprint (hash verification)
            </p>
          </div>
        </div>
        <span className="text-forge-text-dim text-sm">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-forge-border px-4 py-3 space-y-4">
          {/* IMPORTANT DISCLAIMER - What this proves */}
          <div className="p-3 bg-forge-warning/10 border border-forge-warning/30">
            <div className="flex items-start gap-2">
              <span className="text-forge-warning">⚠</span>
              <div className="text-xs">
                <p className="text-forge-warning font-bold mb-1">What this proves:</p>
                <p className="text-forge-text-secondary">
                  ✓ The file wasn't <strong>modified</strong> during processing
                </p>
                <p className="text-forge-text-secondary mt-1">
                  <strong className="text-forge-warning">What this does NOT prove:</strong>
                </p>
                <p className="text-forge-text-secondary">
                  ✗ That the file wasn't copied or uploaded elsewhere
                </p>
                <p className="text-forge-text-dim mt-2 italic">
                  For proof of no upload, use Airplane Mode or check DevTools.
                </p>
              </div>
            </div>
          </div>

          {/* Hash display */}
          <div className="space-y-3">
            {/* Original hash */}
            {originalHash && (
              <div className="p-3 bg-forge-bg-primary border border-forge-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-forge-text-dim">Original File SHA-256:</span>
                  <button
                    onClick={() => copyHash(originalHash)}
                    className="text-xs text-forge-accent hover:text-forge-success transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono text-sm text-forge-text-primary break-all">
                  {truncateHash(originalHash)}
                </p>
              </div>
            )}

            {/* Processed hash */}
            {processedHash && processedHash !== originalHash && (
              <div className="p-3 bg-forge-bg-primary border border-forge-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-forge-text-dim">Processed File SHA-256:</span>
                  <button
                    onClick={() => copyHash(processedHash)}
                    className="text-xs text-forge-accent hover:text-forge-success transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono text-sm text-forge-text-primary break-all">
                  {truncateHash(processedHash)}
                </p>
              </div>
            )}

            {/* Hash comparison result */}
            {originalHash && processedHash && (
              <div
                className={`
                  p-2 text-center text-xs font-mono
                  ${originalHash === processedHash ? 'bg-forge-success/10 text-forge-success border border-forge-success' : 'bg-forge-accent/10 text-forge-accent border border-forge-accent'}
                `}
              >
                {originalHash === processedHash
                  ? '✓ File unchanged (hashes match)'
                  : '→ File was modified (redactions applied)'}
              </div>
            )}
          </div>

          {/* QR Code */}
          {qrDataUrl && (
            <div className="flex flex-col items-center space-y-2 pt-3 border-t border-forge-border">
              <p className="text-xs text-forge-text-dim text-center">
                Scan to verify on another device:
              </p>
              <div className="p-2 bg-black border border-forge-accent">
                <img
                  src={qrDataUrl}
                  alt="File integrity QR code"
                  className="w-32 h-32"
                />
              </div>
              <p className="text-xs text-forge-text-dim text-center max-w-xs">
                The QR contains: file hashes, timestamp, and app identifier.
                Compare with your records to verify integrity.
              </p>
            </div>
          )}

          {/* Timestamp */}
          {timestamp && (
            <div className="pt-3 border-t border-forge-border text-center">
              <p className="text-xs text-forge-text-dim">
                Generated: {new Date(timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
