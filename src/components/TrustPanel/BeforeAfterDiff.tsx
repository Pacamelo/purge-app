/**
 * BeforeAfterDiff Component
 *
 * Shows detected PII with before/after preview.
 * Uses detection contexts to display samples without needing full document text.
 *
 * Visual concept:
 * - List of detected PII items with context
 * - Shows original value and what it will become after redaction
 * - Color-coded by category
 */

import { memo, useMemo, useState } from 'react';
import type { Detection, ScrubConfig, PIICategory } from '@/core/types';
import { getCategoryName, getCategoryIcon } from '@/core/constants/categories';

interface BeforeAfterDiffProps {
  /** Detections found in the text */
  detections: Detection[];
  /** Selected detection IDs (will be redacted) */
  selectedIds: Set<string>;
  /** Redaction configuration */
  config: ScrubConfig;
  /** Max height of the diff view */
  maxHeight?: number;
}

/**
 * Category colors for highlighting - using theme-aware CSS variables
 * Maps PII categories to semantic color meanings:
 * - High risk (SSN, credit_card): error color
 * - Medium risk (email, phone, address, person_name): warning color
 * - Low risk (ip_address, date_of_birth): accent color
 * - Custom: secondary text color
 */
const CATEGORY_COLORS: Record<PIICategory, { bg: string; border: string; text: string }> = {
  // High risk - use error color
  ssn: { bg: 'bg-[var(--forge-error)]/20', border: 'border-[var(--forge-error)]', text: 'text-[var(--forge-error)]' },
  credit_card: { bg: 'bg-[var(--forge-error)]/20', border: 'border-[var(--forge-error)]', text: 'text-[var(--forge-error)]' },
  // Medium risk - use warning color
  person_name: { bg: 'bg-[var(--forge-warning)]/20', border: 'border-[var(--forge-warning)]', text: 'text-[var(--forge-warning)]' },
  email: { bg: 'bg-[var(--forge-warning)]/20', border: 'border-[var(--forge-warning)]', text: 'text-[var(--forge-warning)]' },
  phone: { bg: 'bg-[var(--forge-warning)]/20', border: 'border-[var(--forge-warning)]', text: 'text-[var(--forge-warning)]' },
  address: { bg: 'bg-[var(--forge-warning)]/20', border: 'border-[var(--forge-warning)]', text: 'text-[var(--forge-warning)]' },
  // Low risk - use accent color (theme primary)
  ip_address: { bg: 'bg-forge-accent/20', border: 'border-forge-accent', text: 'text-forge-accent' },
  date_of_birth: { bg: 'bg-forge-accent/20', border: 'border-forge-accent', text: 'text-forge-accent' },
  // Custom - use success color to differentiate
  custom: { bg: 'bg-[var(--forge-success)]/20', border: 'border-[var(--forge-success)]', text: 'text-[var(--forge-success)]' },
};

/** Get replacement text based on config */
function getReplacementText(detection: Detection, config: ScrubConfig): string {
  switch (config.redactionStyle) {
    case 'blackout':
      return '█'.repeat(Math.min(detection.value.length, 20));
    case 'replacement':
      return config.replacementText || '[REDACTED]';
    case 'pseudonym':
      const pseudonyms: Partial<Record<PIICategory, string>> = {
        person_name: '[NAME]',
        email: '[EMAIL]',
        phone: '[PHONE]',
        address: '[ADDRESS]',
        ssn: '[SSN]',
        credit_card: '[CC]',
        ip_address: '[IP]',
        date_of_birth: '[DOB]',
      };
      return pseudonyms[detection.category] || '[REDACTED]';
    case 'partial':
      if (detection.value.length <= 4) return '***';
      return `${detection.value[0]}${'*'.repeat(detection.value.length - 2)}${detection.value[detection.value.length - 1]}`;
    default:
      return '[REDACTED]';
  }
}

/** Legend showing category colors */
const CategoryLegend = memo(function CategoryLegend({
  detections,
}: {
  detections: Detection[];
}) {
  const categories = useMemo(() => {
    const cats = new Set<PIICategory>();
    detections.forEach((d) => cats.add(d.category));
    return Array.from(cats);
  }, [detections]);

  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {categories.map((cat) => {
        const colors = CATEGORY_COLORS[cat];
        const count = detections.filter((d) => d.category === cat).length;
        return (
          <span
            key={cat}
            className={`
              inline-flex items-center gap-1 px-1 py-0.5
              text-[9px] font-mono uppercase
              ${colors.bg} ${colors.text}
              border border-current/30 rounded
            `}
          >
            {getCategoryIcon(cat)} {count}
          </span>
        );
      })}
    </div>
  );
});

/** Single detection row showing before/after */
const DetectionRow = memo(function DetectionRow({
  detection,
  isSelected,
  config,
}: {
  detection: Detection;
  isSelected: boolean;
  config: ScrubConfig;
}) {
  const colors = CATEGORY_COLORS[detection.category];
  const replacement = getReplacementText(detection, config);

  return (
    <div className="py-1.5 border-b border-forge-border/30 last:border-0">
      {/* Category badge */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`
            text-[9px] font-mono uppercase px-1 py-0.5 rounded
            ${colors.bg} ${colors.text}
          `}
        >
          {getCategoryIcon(detection.category)} {getCategoryName(detection.category)}
        </span>
        {!isSelected && (
          <span className="text-[9px] text-forge-text-dim">(not selected)</span>
        )}
      </div>

      {/* Before/After */}
      <div className="flex items-center gap-2 text-[11px] font-mono">
        {/* Before */}
        <span
          className={`
            px-1 rounded
            ${colors.bg} ${colors.text}
            ${!isSelected ? 'opacity-50' : ''}
          `}
        >
          {detection.value}
        </span>

        {/* Arrow */}
        {isSelected && (
          <>
            <span className="text-forge-text-dim">→</span>
            {/* After */}
            <span className="px-1 rounded bg-forge-success/20 text-forge-success">
              {replacement}
            </span>
          </>
        )}
      </div>
    </div>
  );
});

/** Empty state when no detections */
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <span className="text-xl mb-2 text-forge-text-dim">◌</span>
      <span className="text-[10px] font-mono text-forge-text-dim">
        No PII detected yet
      </span>
    </div>
  );
});

// Note: Not using memo here because selectedIds is a Set that changes reference
// on each selection toggle, and we need the component to re-render accordingly
export function BeforeAfterDiff({
  detections,
  selectedIds,
  config,
  maxHeight = 200,
}: BeforeAfterDiffProps) {
  const [showAll, setShowAll] = useState(false);

  // Limit visible detections for performance
  const visibleDetections = useMemo(() => {
    if (showAll) return detections;
    return detections.slice(0, 8);
  }, [detections, showAll]);

  const selectedCount = detections.filter((d) => selectedIds.has(d.id)).length;
  const hasMore = detections.length > 8;

  // Empty state
  if (detections.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-forge-text-secondary uppercase tracking-wider">
          Redaction Preview
        </span>
        <span className="text-[10px] font-mono text-forge-success">
          {selectedCount}/{detections.length} selected
        </span>
      </div>

      {/* Legend */}
      <CategoryLegend detections={detections} />

      {/* Detection list */}
      <div
        className="overflow-y-auto bg-forge-bg-primary border border-forge-border p-2"
        style={{ maxHeight }}
      >
        {visibleDetections.map((detection) => (
          <DetectionRow
            key={detection.id}
            detection={detection}
            isSelected={selectedIds.has(detection.id)}
            config={config}
          />
        ))}

        {/* Show more button */}
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-2 mt-2 text-[10px] font-mono text-forge-accent hover:underline"
          >
            Show {detections.length - 8} more...
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="text-[10px] font-mono text-forge-text-dim text-center">
        {selectedCount} items will be redacted as{' '}
        <span className="text-forge-accent">{config.redactionStyle}</span>
      </div>
    </div>
  );
}
