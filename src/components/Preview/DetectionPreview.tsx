/**
 * DetectionPreview Component
 * Main preview panel showing detected PII with configuration
 */

import { memo, useCallback, useState } from 'react';
import type {
  Detection,
  ScrubConfig as ScrubConfigType,
  PIICategory,
  ContentSection,
  AdversarialSuggestion,
} from '@/core/types';
import { DetectionList } from './DetectionList';
import { ScrubConfig } from '../Configuration/ScrubConfig';
import { AdversarialFeedback } from '../AdversarialFeedback';
import { useAdversarialAnalysis } from '@/core/hooks/useAdversarialAnalysis';

interface DetectionPreviewProps {
  detections: Detection[];
  selectedIds: Set<string>;
  config: ScrubConfigType;
  onToggleDetection: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleCategory: (category: PIICategory) => void;
  onStyleChange: (style: ScrubConfigType['redactionStyle']) => void;
  onReplacementTextChange: (text: string) => void;
  onSensitivityChange: (sensitivity: ScrubConfigType['sensitivity']) => void;
  onRescan: () => void;
  onProceed: () => void;
  /** Count of selected items that are visible at current sensitivity */
  visibleSelectedCount: number;
  /** Total detections found (before sensitivity filtering) */
  totalDetectionCount: number;
  /** Content sections for adversarial analysis */
  sections?: ContentSection[];
}

export const DetectionPreview = memo(function DetectionPreview({
  detections,
  selectedIds,
  config,
  onToggleDetection,
  onSelectAll,
  onDeselectAll,
  onToggleCategory,
  onStyleChange,
  onReplacementTextChange,
  onSensitivityChange,
  onRescan,
  onProceed,
  visibleSelectedCount,
  totalDetectionCount,
  sections = [],
}: DetectionPreviewProps) {
  const hasSelections = visibleSelectedCount > 0;
  const [showAdversarial, setShowAdversarial] = useState(false);

  // Adversarial analysis hook
  const {
    result: adversarialResult,
    isAnalyzing,
    analyze,
    applySuggestion,
    applyAllSuggestions,
    dismiss: dismissAdversarial,
  } = useAdversarialAnalysis();

  // Run adversarial analysis
  const handleAnalyze = useCallback(() => {
    const selectedDetections = detections.filter((d) => selectedIds.has(d.id));
    if (selectedDetections.length > 0 && sections.length > 0) {
      setShowAdversarial(true);
      analyze(sections, selectedDetections);
    }
  }, [detections, selectedIds, sections, analyze]);

  // Handle suggestion application
  const handleApplySuggestion = useCallback(
    (suggestion: AdversarialSuggestion) => {
      applySuggestion(suggestion);
      // Could trigger re-analysis here
    },
    [applySuggestion]
  );

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setShowAdversarial(false);
    dismissAdversarial();
  }, [dismissAdversarial]);

  // Handle re-analyze
  const handleReanalyze = useCallback(() => {
    const selectedDetections = detections.filter((d) => selectedIds.has(d.id));
    if (selectedDetections.length > 0 && sections.length > 0) {
      analyze(sections, selectedDetections);
    }
  }, [detections, selectedIds, sections, analyze]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel - Configuration */}
      <div className="w-80 flex-shrink-0 min-h-0 border-r border-forge-border bg-forge-bg-secondary overflow-y-auto">
        <div className="p-4">
          <ScrubConfig
            config={config}
            onToggleCategory={onToggleCategory}
            onStyleChange={onStyleChange}
            onReplacementTextChange={onReplacementTextChange}
            onSensitivityChange={onSensitivityChange}
          />

          {/* Rescan button */}
          <button
            onClick={onRescan}
            className="
              w-full mt-4 px-4 py-2
              bg-forge-bg-tertiary border border-forge-border
              text-forge-text-secondary hover:text-forge-accent hover:border-forge-accent
              text-sm font-mono uppercase tracking-wider
              transition-colors
            "
          >
            [ RESCAN ]
          </button>
        </div>
      </div>

      {/* Right panel - Detection list */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-hidden">
          <DetectionList
            detections={detections}
            selectedIds={selectedIds}
            onToggle={onToggleDetection}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            visibleSelectedCount={visibleSelectedCount}
            totalDetectionCount={totalDetectionCount}
          />
        </div>

        {/* Adversarial Feedback Panel */}
        {showAdversarial && (
          <div className="flex-shrink-0 border-t border-forge-border">
            <AdversarialFeedback
              result={adversarialResult}
              isAnalyzing={isAnalyzing}
              onApplySuggestion={handleApplySuggestion}
              onApplyAllSuggestions={applyAllSuggestions}
              onDismiss={handleDismiss}
              onReanalyze={handleReanalyze}
            />
          </div>
        )}

        {/* Action bar - always visible at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-forge-border bg-forge-bg-secondary flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-forge-text-dim">
              {hasSelections
                ? `${visibleSelectedCount} items will be redacted`
                : 'Select items to redact'}
            </div>

            {/* Adversarial analysis button */}
            {hasSelections && sections.length > 0 && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="
                  px-3 py-1
                  text-xs font-mono uppercase tracking-wider
                  border border-forge-accent text-forge-accent
                  hover:bg-forge-accent hover:text-forge-bg-primary
                  transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isAnalyzing ? '[ ANALYZING... ]' : '[ VERIFY SAFETY ]'}
              </button>
            )}
          </div>

          <button
            onClick={onProceed}
            disabled={!hasSelections}
            className={`
              px-6 py-2
              text-sm font-mono uppercase tracking-wider
              border-2 transition-all
              ${
                hasSelections
                  ? 'bg-forge-error/20 border-forge-error text-forge-error hover:bg-forge-error hover:text-white'
                  : 'bg-forge-bg-tertiary border-forge-border text-forge-text-dim cursor-not-allowed'
              }
            `}
          >
            {hasSelections
              ? `[ SHRED ${visibleSelectedCount} ITEMS ]`
              : '[ SELECT ITEMS TO SHRED ]'}
          </button>
        </div>
      </div>
    </div>
  );
});
