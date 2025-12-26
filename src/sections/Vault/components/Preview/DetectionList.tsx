/**
 * DetectionList Component
 * Scrollable list of detected PII items
 */

import { memo } from 'react';
import type { Detection, PIICategory } from '@/core/types';
import { getCategoryName, getCategoryIcon } from '@/core/constants/categories';

interface DetectionListProps {
  detections: Detection[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  /** Count of selected items that are visible (sensitivity-filtered) */
  visibleSelectedCount: number;
  /** Total detections found (before sensitivity filtering) */
  totalDetectionCount: number;
}

/**
 * Format confidence as percentage
 */
function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Get color class for confidence level
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'text-forge-success';
  if (confidence >= 0.7) return 'text-forge-warning';
  return 'text-forge-error';
}

interface DetectionItemProps {
  detection: Detection;
  isSelected: boolean;
  onToggle: () => void;
}

const DetectionItem = memo(function DetectionItem({
  detection,
  isSelected,
  onToggle,
}: DetectionItemProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        w-full p-3 text-left
        border-b border-forge-border
        hover:bg-forge-bg-tertiary transition-colors
        ${isSelected ? 'bg-forge-accent/10' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className={`
            w-4 h-4 mt-0.5 flex items-center justify-center
            border text-xs
            ${isSelected ? 'bg-forge-accent border-forge-accent text-white' : 'border-forge-border'}
          `}
        >
          {isSelected && '×'}
        </div>

        {/* Category badge */}
        <div
          className={`
            px-1.5 py-0.5 text-[10px] font-mono uppercase
            bg-forge-bg-tertiary border border-forge-border
          `}
        >
          {getCategoryIcon(detection.category)} {getCategoryName(detection.category)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Detected value */}
          <p className="text-sm font-mono text-forge-accent truncate">
            {detection.value}
          </p>

          {/* Context */}
          <p className="text-xs text-forge-text-dim mt-1 line-clamp-2">
            {detection.context}
          </p>
        </div>

        {/* Confidence */}
        <div
          className={`
            text-xs font-mono
            ${getConfidenceColor(detection.confidence)}
          `}
        >
          {formatConfidence(detection.confidence)}
        </div>
      </div>
    </button>
  );
});

export const DetectionList = memo(function DetectionList({
  detections,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  visibleSelectedCount,
  totalDetectionCount,
}: DetectionListProps) {
  const visibleCount = detections.length;

  // Group detections by category
  const groupedDetections = detections.reduce(
    (acc, detection) => {
      const category = detection.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(detection);
      return acc;
    },
    {} as Record<PIICategory, Detection[]>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-forge-border bg-forge-bg-secondary">
        <div>
          <span className="text-sm font-mono text-forge-text-primary">
            {visibleSelectedCount} of {visibleCount} visible selected
          </span>
          {visibleCount < totalDetectionCount && (
            <span className="text-xs text-forge-text-dim ml-2">
              ({totalDetectionCount - visibleCount} hidden by sensitivity)
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="text-xs text-forge-accent hover:underline"
          >
            Select Visible
          </button>
          <span className="text-forge-text-dim">|</span>
          <button
            onClick={onDeselectAll}
            className="text-xs text-forge-text-dim hover:text-forge-accent"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Detection list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {Object.entries(groupedDetections).map(([category, items]) => (
          <div key={category}>
            {/* Category header */}
            <div className="sticky top-0 px-3 py-2 bg-forge-bg-tertiary border-b border-forge-border">
              <span className="text-xs font-mono uppercase text-forge-text-dim">
                {getCategoryName(category as PIICategory)} ({items.length})
              </span>
            </div>

            {/* Items */}
            {items.map((detection) => (
              <DetectionItem
                key={detection.id}
                detection={detection}
                isSelected={selectedIds.has(detection.id)}
                onToggle={() => onToggle(detection.id)}
              />
            ))}
          </div>
        ))}

        {/* Empty state */}
        {detections.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-forge-text-dim">No PII detected</p>
            <p className="text-xs text-forge-text-dim mt-1">
              Try adjusting sensitivity or enabling more categories
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
