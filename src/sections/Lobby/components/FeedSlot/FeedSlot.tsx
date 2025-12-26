/**
 * FeedSlot Component
 * Drag-and-drop zone styled as a shredder feed slot
 */

import { useState, useRef, memo, useId, type DragEvent, type ChangeEvent } from 'react';
import type { QueuedFile, SupportedFileType } from '@/core/types';
import { DocumentCard } from './DocumentCard';

// Accessibility labels
const ARIA_LABELS = {
  dropZone: 'Document drop zone. Drop files here or click to browse.',
  dropZoneActive: 'Release to add files for processing.',
  dropZoneDisabled: 'Document drop zone is disabled.',
  fileInput: 'Choose files to process',
} as const;

interface FeedSlotProps {
  onFilesDropped: (files: File[]) => void;
  queuedFiles: QueuedFile[];
  onRemoveFile: (id: string) => void;
  disabled?: boolean;
  maxFiles?: number;
}

// MIME types for supported files
const ACCEPTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/pdf', // .pdf
];

const ACCEPTED_EXTENSIONS = ['.docx', '.xlsx', '.pptx', '.pdf'];

// File type icons and colors
const FILE_TYPE_CONFIG: Record<SupportedFileType, { icon: string; color: string; bgColor: string }> = {
  docx: { icon: 'W', color: 'text-[#2b579a]', bgColor: 'bg-[#2b579a]/20' },
  xlsx: { icon: 'X', color: 'text-[#217346]', bgColor: 'bg-[#217346]/20' },
  pptx: { icon: 'P', color: 'text-[#d24726]', bgColor: 'bg-[#d24726]/20' },
  pdf: { icon: 'PDF', color: 'text-[#ff0000]', bgColor: 'bg-[#ff0000]/20' },
};

// Legacy export for DocumentCard
const FILE_ICONS: Record<SupportedFileType, string> = {
  docx: 'W',
  xlsx: 'X',
  pptx: 'P',
  pdf: 'PDF',
};

export const FeedSlot = memo(function FeedSlot({
  onFilesDropped,
  queuedFiles,
  onRemoveFile,
  disabled = false,
  maxFiles = 10,
}: FeedSlotProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneId = useId();
  const fileInputId = useId();

  const remainingSlots = maxFiles - queuedFiles.length;
  const canAcceptMore = remainingSlots > 0 && !disabled;

  // Compute ARIA label based on state
  const ariaLabel = disabled
    ? ARIA_LABELS.dropZoneDisabled
    : isDragging
      ? ARIA_LABELS.dropZoneActive
      : ARIA_LABELS.dropZone;

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canAcceptMore) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!canAcceptMore) return;

    const files = Array.from(e.dataTransfer.files).filter((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      return ACCEPTED_EXTENSIONS.includes(ext);
    });

    const filesToAdd = files.slice(0, remainingSlots);
    if (filesToAdd.length > 0) {
      onFilesDropped(filesToAdd);
    }
  };

  const handleClick = () => {
    if (canAcceptMore) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length > 0) {
      onFilesDropped(filesToAdd);
    }

    // Reset input for re-selection
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      {/* Feed slot visual */}
      <div
        id={dropZoneId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        aria-describedby={`${dropZoneId}-description`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className={`
          feed-slot
          min-h-[120px] p-4
          cursor-pointer
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-forge-accent focus:ring-offset-2 focus:ring-offset-forge-bg-primary
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDragging ? 'feed-slot-active' : ''}
        `}
      >
        {/* Screen reader description */}
        <span id={`${dropZoneId}-description`} className="sr-only">
          Accepts files: {ACCEPTED_EXTENSIONS.join(', ')}.
          {queuedFiles.length > 0
            ? ` ${queuedFiles.length} file(s) queued. ${remainingSlots} slots remaining.`
            : ' No files queued.'}
        </span>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          id={fileInputId}
          type="file"
          accept={ACCEPTED_MIME_TYPES.join(',')}
          multiple={remainingSlots > 1}
          onChange={handleFileChange}
          className="sr-only"
          disabled={disabled}
          aria-label={ARIA_LABELS.fileInput}
        />

        {/* Empty state */}
        {queuedFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6">
            {/* Animated feed slot icon */}
            <div
              className={`
                relative mb-4 transition-all duration-300
                ${isDragging ? 'scale-110' : ''}
              `}
            >
              {/* Slot opening animation */}
              <div className={`
                flex items-center gap-1 text-3xl font-mono
                ${isDragging ? 'text-forge-accent' : 'text-forge-text-dim'}
              `}>
                <span className={`transition-transform duration-200 ${isDragging ? '-translate-x-1' : ''}`}>[</span>
                <span className={`transition-all duration-200 ${isDragging ? 'text-forge-accent animate-bounce' : ''}`}>
                  {isDragging ? '↓' : '▼'}
                </span>
                <span className={`transition-transform duration-200 ${isDragging ? 'translate-x-1' : ''}`}>]</span>
              </div>
              {/* Slot lines that "open" on drag */}
              <div className={`
                absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5
                transition-all duration-200
                ${isDragging ? 'bg-forge-accent w-20' : 'bg-forge-border'}
              `} />
            </div>

            <p
              className={`
                text-sm uppercase tracking-wider text-center font-mono
                transition-colors duration-200
                ${isDragging ? 'text-forge-accent' : 'text-forge-text-secondary'}
              `}
            >
              {isDragging ? 'RELEASE TO FEED' : 'DROP DOCUMENTS TO SHRED'}
            </p>
            <p className="text-xs text-forge-text-dim mt-1">
              or click to browse
            </p>

            {/* File type badges with colors */}
            <div className="flex items-center gap-2 mt-4">
              {(['docx', 'xlsx', 'pptx', 'pdf'] as const).map((type) => {
                const config = FILE_TYPE_CONFIG[type];
                return (
                  <span
                    key={type}
                    className={`
                      px-2 py-1 text-[10px] font-mono uppercase tracking-wider
                      border rounded-sm transition-all duration-200
                      ${config.bgColor} ${config.color}
                      border-current/30
                    `}
                  >
                    .{type}
                  </span>
                );
              })}
            </div>

            {/* Sample file download */}
            <a
              href="/assets/test-data/purge-showcase.xlsx"
              download="purge-showcase.xlsx"
              onClick={(e) => e.stopPropagation()}
              className="
                mt-5 px-4 py-2
                text-[10px] font-mono uppercase tracking-wider
                text-forge-accent hover:text-forge-bg-primary
                border border-forge-accent/50 hover:border-forge-accent
                hover:bg-forge-accent
                transition-all duration-200
              "
              title="Showcase file with varied PII types and confidence levels"
            >
              [ Download Sample PII File ]
            </a>
          </div>
        )}

        {/* Queued files */}
        {queuedFiles.length > 0 && (
          <div className="space-y-2">
            {queuedFiles.map((file) => (
              <DocumentCard
                key={file.id}
                file={file}
                icon={FILE_ICONS[file.type]}
                onRemove={() => onRemoveFile(file.id)}
                disabled={disabled}
              />
            ))}

            {/* Add more hint */}
            {canAcceptMore && (
              <div className="text-center py-2">
                <p className="text-xs text-forge-text-dim">
                  + Drop more files ({remainingSlots} slots remaining)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Drag overlay brackets */}
        {isDragging && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 left-2 text-forge-accent text-lg">
              ┌
            </div>
            <div className="absolute top-2 right-2 text-forge-accent text-lg">
              ┐
            </div>
            <div className="absolute bottom-2 left-2 text-forge-accent text-lg">
              └
            </div>
            <div className="absolute bottom-2 right-2 text-forge-accent text-lg">
              ┘
            </div>
          </div>
        )}
      </div>

      {/* Slot edge detail */}
      <div className="h-1 bg-gradient-to-b from-black/30 to-transparent" />
    </div>
  );
});
