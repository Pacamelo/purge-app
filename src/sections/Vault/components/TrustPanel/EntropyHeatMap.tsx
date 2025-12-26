/**
 * EntropyHeatMap Component
 *
 * Canvas-based visualization of file entropy using a Hilbert curve layout.
 * Shows before/after comparison to demonstrate PII redaction.
 *
 * Visual concept:
 * - High entropy (PII) = hot colors (red/orange)
 * - Low entropy (redacted) = cold colors (blue)
 * - PII regions get special highlighting
 */

import { memo, useEffect, useRef, useState, useCallback } from 'react';
import type { EntropyData, EntropyComparison } from '@/core/types';
import { hilbertD2XY, getOptimalGridSize } from '@/core/utils/hilbertCurve';

interface EntropyHeatMapProps {
  /** Entropy comparison data (before/after) */
  comparison: EntropyComparison | null;
  /** Whether entropy is being calculated */
  isCalculating: boolean;
  /** Show side-by-side comparison */
  showComparison: boolean;
  /** Toggle comparison mode */
  onToggleComparison?: () => void;
  /** Canvas size in pixels (width = height) */
  size?: number;
}

/** Convert normalized entropy to HSL color */
function entropyToColor(normalizedEntropy: number, isPII: boolean): string {
  if (isPII) {
    // PII regions: bright red tones
    const lightness = 50 + normalizedEntropy * 30;
    return `hsl(0, 80%, ${lightness}%)`;
  }

  // Standard gradient: blue (low) → cyan → green → yellow → red (high)
  // Hue: 240 (blue) → 0 (red)
  const hue = (1 - normalizedEntropy) * 240;
  const saturation = 70;
  const lightness = 40 + normalizedEntropy * 20;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/** Render entropy blocks to canvas */
function renderEntropyToCanvas(
  ctx: CanvasRenderingContext2D,
  entropyData: EntropyData,
  offsetX: number,
  offsetY: number,
  size: number,
  highlightChanges: boolean = false,
  changedRegions: EntropyComparison['changedRegions'] = []
): void {
  const { blocks } = entropyData;
  if (blocks.length === 0) return;

  const gridSize = getOptimalGridSize(blocks.length);
  const cellSize = size / gridSize;

  // Create set of changed block indices for quick lookup
  const changedBlocks = new Set<number>();
  if (highlightChanges) {
    for (const region of changedRegions) {
      for (let i = region.startBlock; i <= region.endBlock; i++) {
        changedBlocks.add(i);
      }
    }
  }

  // Render each block
  for (const block of blocks) {
    if (block.index >= gridSize * gridSize) break;

    const { x, y } = hilbertD2XY(gridSize, block.index);
    const px = offsetX + x * cellSize;
    const py = offsetY + y * cellSize;

    // Fill with entropy color
    ctx.fillStyle = entropyToColor(block.normalizedEntropy, block.containsPII);
    ctx.fillRect(px, py, cellSize + 0.5, cellSize + 0.5); // +0.5 to avoid gaps

    // Highlight changed regions
    if (highlightChanges && changedBlocks.has(block.index)) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
    }

    // Add subtle grid for PII blocks
    if (block.containsPII) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  }
}

/** Loading skeleton component */
const LoadingSkeleton = memo(function LoadingSkeleton({ size }: { size: number }) {
  return (
    <div
      className="animate-pulse bg-forge-bg-tertiary"
      style={{ width: size, height: size }}
    >
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-xs text-forge-text-dim font-mono">
          ANALYZING...
        </div>
      </div>
    </div>
  );
});

/** Empty state component */
const EmptyState = memo(function EmptyState({ size }: { size: number }) {
  return (
    <div
      className="bg-forge-bg-tertiary border border-forge-border border-dashed flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div className="text-xs text-forge-text-dim font-mono text-center px-4">
        DROP FILE TO<br />SEE ENTROPY
      </div>
    </div>
  );
});

export const EntropyHeatMap = memo(function EntropyHeatMap({
  comparison,
  isCalculating,
  showComparison,
  onToggleComparison,
  size = 200,
}: EntropyHeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'var(--forge-bg-primary, #0a0a0a)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!comparison) return;

    const { before, after, changedRegions } = comparison;

    if (showComparison && before && after) {
      // Side-by-side comparison
      const halfWidth = Math.floor(size / 2) - 4;

      // Before label
      ctx.fillStyle = 'var(--forge-text-dim, #666)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BEFORE', halfWidth / 2, 12);
      ctx.fillText('AFTER', size - halfWidth / 2, 12);

      // Render before
      renderEntropyToCanvas(ctx, before, 0, 20, halfWidth, false, []);

      // Divider
      ctx.strokeStyle = 'var(--forge-border, #333)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(size / 2, 20);
      ctx.lineTo(size / 2, size);
      ctx.stroke();

      // Arrow
      ctx.fillStyle = 'var(--forge-accent, #00ff00)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('→', size / 2, size / 2 + 20);

      // Render after with change highlights
      renderEntropyToCanvas(ctx, after, halfWidth + 8, 20, halfWidth, true, changedRegions);
    } else {
      // Single view (show after if available, otherwise before)
      const dataToShow = after || before;
      if (dataToShow) {
        renderEntropyToCanvas(ctx, dataToShow, 0, 0, size, false, []);
      }
    }
  }, [comparison, showComparison, size]);

  // Re-render when data changes
  useEffect(() => {
    if (!isCalculating) {
      renderCanvas();
    }
  }, [isCalculating, renderCanvas]);

  // Loading state
  if (isCalculating) {
    return <LoadingSkeleton size={size} />;
  }

  // Empty state
  if (!comparison || (!comparison.before && !comparison.after)) {
    return <EmptyState size={size} />;
  }

  const { before, after, changedRegions } = comparison;
  const entropyDrop = before && after
    ? (before.globalEntropy - after.globalEntropy).toFixed(2)
    : null;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-forge-text-secondary uppercase tracking-wider">
          Entropy X-Ray
        </span>
        {before && after && onToggleComparison && (
          <button
            onClick={onToggleComparison}
            className="text-xs text-forge-accent hover:underline font-mono"
          >
            [{showComparison ? 'Single' : 'Compare'}]
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="bg-forge-bg-primary border border-forge-border"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Overlay for reduced motion */}
        {prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none" />
        )}
      </div>

      {/* Stats */}
      {entropyDrop && changedRegions.length > 0 && (
        <div className="text-xs font-mono text-forge-text-dim">
          <span className="text-forge-success">▼</span>{' '}
          {entropyDrop} bits dropped in {changedRegions.length} region(s)
        </div>
      )}

      {/* Explanation tooltip trigger */}
      <details className="text-xs text-forge-text-dim">
        <summary className="cursor-pointer hover:text-forge-text-secondary">
          What's this?
        </summary>
        <p className="mt-1 p-2 bg-forge-bg-tertiary border border-forge-border">
          This heat map shows data randomness (entropy). Personal info like
          names and SSNs appear as <span className="text-red-400">hot spots</span>.
          When redacted, those areas turn <span className="text-blue-400">cold</span>—proving
          your data was transformed.
        </p>
      </details>
    </div>
  );
});
