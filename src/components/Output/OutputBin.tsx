/**
 * OutputBin Component
 * Display area for processed files ready for download
 *
 * DOWNLOAD BEHAVIOR:
 * - Single file: Direct download button
 * - Multiple files: "Download All (ZIP)" only - hides individual buttons
 * - Offline mode: Download triggers immediate tab closure for privacy
 * - Online mode: No forced closure (user already trusts the site)
 */

import { memo } from 'react';
import type { ProcessedFile, SupportedFileType } from '@/core/types';

interface OutputBinProps {
  files: ProcessedFile[];
  onDownload: (file: ProcessedFile) => void;
  onDownloadAll: () => void;
  /** Whether processing started in offline mode (affects closure behavior) */
  isOfflineMode?: boolean;
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file type icon
 */
const FILE_ICONS: Record<SupportedFileType, string> = {
  docx: 'W',
  xlsx: 'X',
  pptx: 'P',
  pdf: 'PDF',
};

interface OutputFileCardProps {
  file: ProcessedFile;
  onDownload: () => void;
  /** Hide download button (when showing ZIP-only for multi-file) */
  hideDownload?: boolean;
}

const OutputFileCard = memo(function OutputFileCard({
  file,
  onDownload,
  hideDownload = false,
}: OutputFileCardProps) {
  const sizeDiff = file.originalSize - file.purgedSize;
  const percentReduction = Math.round((sizeDiff / file.originalSize) * 100);

  return (
    <div className="flex items-center gap-3 p-3 bg-forge-bg-secondary border border-forge-border">
      {/* File type icon */}
      <div className="w-10 h-10 flex items-center justify-center bg-forge-success/20 border border-forge-success text-forge-success text-xs font-bold">
        {FILE_ICONS[file.type]}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-forge-text-primary font-mono truncate">
          {file.purgedName}
        </p>
        <div className="flex items-center gap-2 text-xs text-forge-text-dim mt-0.5">
          <span>{formatSize(file.purgedSize)}</span>
          <span className="text-forge-success">
            (-{formatSize(sizeDiff)} / {percentReduction}%)
          </span>
          <span>•</span>
          <span>{file.detectionsRemoved} items redacted</span>
        </div>
      </div>

      {/* Download button - hidden when multi-file (ZIP only) */}
      {!hideDownload && (
        <button
          onClick={onDownload}
          className="px-3 py-1.5 text-xs font-mono uppercase bg-forge-accent/20 border border-forge-accent text-forge-accent hover:bg-forge-accent hover:text-white transition-colors"
        >
          DOWNLOAD
        </button>
      )}
    </div>
  );
});

export const OutputBin = memo(function OutputBin({
  files,
  onDownload,
  onDownloadAll,
  isOfflineMode = true,
}: OutputBinProps) {
  const isEmpty = files.length === 0;
  const totalDetections = files.reduce((sum, f) => sum + f.detectionsRemoved, 0);
  const isMultiFile = files.length > 1;
  const isSingleFile = files.length === 1;

  return (
    <div className={`output-bin ${isEmpty ? 'output-bin-empty' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-forge-border">
        <div>
          <span className="text-sm font-mono text-forge-text-primary uppercase">
            Output Bin
          </span>
          {!isEmpty && (
            <span className="text-xs text-forge-text-dim ml-2">
              {files.length} file{files.length !== 1 ? 's' : ''} • {totalDetections} items redacted
            </span>
          )}
        </div>

        {/* Multi-file: Show prominent ZIP download button */}
        {isMultiFile && (
          <button
            onClick={onDownloadAll}
            className="px-4 py-2 text-sm font-mono uppercase bg-forge-accent/20 border-2 border-forge-accent text-forge-accent hover:bg-forge-accent hover:text-white transition-colors"
          >
            DOWNLOAD ALL (ZIP)
          </button>
        )}
      </div>

      {/* File list */}
      <div className="p-4 space-y-2">
        {isEmpty ? (
          <div className="text-center py-8">
            <div className="text-4xl text-forge-text-dim mb-2">▽</div>
            <p className="text-sm text-forge-text-dim">
              Shredded files will appear here
            </p>
          </div>
        ) : (
          <>
            {/* File cards - hide individual download buttons when multi-file */}
            {files.map((file) => (
              <OutputFileCard
                key={file.id}
                file={file}
                onDownload={() => onDownload(file)}
                hideDownload={isMultiFile}
              />
            ))}

            {/* Single file: Show prominent download button below file card */}
            {isSingleFile && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => onDownload(files[0])}
                  className="px-6 py-3 text-lg font-mono uppercase bg-forge-accent/20 border-2 border-forge-accent text-forge-accent hover:bg-forge-accent hover:text-white transition-colors"
                >
                  DOWNLOAD FILE
                </button>
              </div>
            )}

            {/* Session closure notice - only for offline mode */}
            {isOfflineMode && (
              <div className="mt-4 p-3 bg-forge-bg-tertiary border border-forge-border text-center">
                <p className="text-xs text-forge-text-dim font-mono">
                  &#128274; Downloading will securely close this session
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
