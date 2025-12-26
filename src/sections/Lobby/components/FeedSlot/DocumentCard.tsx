/**
 * DocumentCard Component
 * Display for a queued document in the feed slot
 */

import { memo } from 'react';
import type { QueuedFile } from '@/core/types';

interface DocumentCardProps {
  file: QueuedFile;
  icon: string;
  onRemove: () => void;
  disabled?: boolean;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get status indicator
 */
function getStatusIndicator(status: QueuedFile['status']): {
  text: string;
  className: string;
} {
  switch (status) {
    case 'queued':
      return { text: 'READY', className: 'text-forge-text-dim' };
    case 'scanning':
      return { text: 'SCANNING...', className: 'text-forge-warning animate-pulse' };
    case 'detected':
      return { text: 'PII FOUND', className: 'text-forge-warning' };
    case 'shredding':
      return { text: 'SHREDDING...', className: 'text-forge-accent animate-pulse' };
    case 'complete':
      return { text: 'COMPLETE', className: 'text-forge-success' };
    case 'error':
      return { text: 'ERROR', className: 'text-forge-error' };
    default:
      return { text: '', className: '' };
  }
}

export const DocumentCard = memo(function DocumentCard({
  file,
  icon,
  onRemove,
  disabled = false,
}: DocumentCardProps) {
  const status = getStatusIndicator(file.status);
  const canRemove = !disabled && file.status === 'queued';

  return (
    <div
      className={`
        flex items-center gap-3 p-3
        bg-forge-bg-secondary border border-forge-border
        rounded transition-all
        ${file.status === 'error' ? 'border-forge-error' : ''}
      `}
    >
      {/* File type icon */}
      <div
        className={`
          w-10 h-10 flex items-center justify-center
          bg-forge-bg-tertiary border border-forge-border
          text-xs font-bold text-forge-text-secondary
        `}
      >
        {icon}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-forge-text-primary truncate font-mono">
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-forge-text-dim">
            {formatFileSize(file.size)}
          </span>
          <span className="text-forge-text-dim">•</span>
          <span className={`text-xs uppercase ${status.className}`}>
            {status.text}
          </span>
        </div>
        {file.error && (
          <p className="text-xs text-forge-error mt-1">{file.error}</p>
        )}
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="
            w-6 h-6 flex items-center justify-center
            text-forge-text-dim hover:text-forge-error
            transition-colors
          "
          title="Remove file"
        >
          ×
        </button>
      )}
    </div>
  );
});
