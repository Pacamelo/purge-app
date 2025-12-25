/**
 * useAdversarialAnalysis Hook
 *
 * Orchestrates adversarial verification analysis on redacted content.
 * Connects the AdversarialVerifier service with the Purge store and UI.
 */

import { useCallback, useEffect, useRef } from 'react';
import { usePurgeStore } from '@/core/store/usePurgeStore';
import { adversarialVerifier } from '@/core/services/adversarial';
import type {
  ContentSection,
  Detection,
  AdversarialSuggestion,
  AdversarialConfig,
  AdversarialVerificationResult,
} from '@/core/types';

interface UseAdversarialAnalysisOptions {
  /** Automatically run analysis when detections change */
  autoAnalyze?: boolean;
  /** Debounce delay in ms for auto-analysis */
  debounceMs?: number;
}

interface UseAdversarialAnalysisReturn {
  /** Current analysis result */
  result: AdversarialVerificationResult | null;
  /** Whether analysis is in progress */
  isAnalyzing: boolean;
  /** Current configuration */
  config: AdversarialConfig;
  /** Run analysis manually */
  analyze: (sections: ContentSection[], selectedDetections: Detection[]) => Promise<void>;
  /** Apply a single suggestion */
  applySuggestion: (suggestion: AdversarialSuggestion) => void;
  /** Apply all suggestions */
  applyAllSuggestions: () => void;
  /** Update configuration */
  updateConfig: (config: Partial<AdversarialConfig>) => void;
  /** Clear analysis state */
  clear: () => void;
  /** Dismiss the analysis panel */
  dismiss: () => void;
}

export function useAdversarialAnalysis(
  options: UseAdversarialAnalysisOptions = {}
): UseAdversarialAnalysisReturn {
  const { autoAnalyze = false, debounceMs = 500 } = options;

  // Store state
  const result = usePurgeStore((s) => s.adversarialResult);
  const isAnalyzing = usePurgeStore((s) => s.isAnalyzingAdversarial);
  const config = usePurgeStore((s) => s.adversarialConfig);
  const detections = usePurgeStore((s) => s.detections);
  const selectedDetections = usePurgeStore((s) => s.selectedDetections);

  // Store actions
  const setResult = usePurgeStore((s) => s.setAdversarialResult);
  const setIsAnalyzing = usePurgeStore((s) => s.setIsAnalyzingAdversarial);
  const setConfig = usePurgeStore((s) => s.setAdversarialConfig);
  const storeSuggestion = usePurgeStore((s) => s.applySuggestion);
  const clearState = usePurgeStore((s) => s.clearAdversarialState);

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Run adversarial analysis on the given content
   */
  const analyze = useCallback(
    async (sections: ContentSection[], selected: Detection[]) => {
      if (!config.enabled) {
        return;
      }

      setIsAnalyzing(true);

      try {
        // Update verifier config
        adversarialVerifier.setConfig(config);

        // Run analysis
        const analysisResult = await adversarialVerifier.analyze(sections, selected);

        // If we have a previous result, track the improvement
        if (result) {
          analysisResult.previousConfidence = result.analysis.reidentificationConfidence;
          analysisResult.iteration = result.iteration + 1;
        }

        setResult(analysisResult);
      } catch (error) {
        console.error('[Adversarial] Analysis failed:', error);
        // Don't set error state - just leave previous result
      } finally {
        setIsAnalyzing(false);
      }
    },
    [config, result, setIsAnalyzing, setResult]
  );

  /**
   * Apply a single suggestion
   */
  const applySuggestion = useCallback(
    (suggestion: AdversarialSuggestion) => {
      storeSuggestion(suggestion);

      // In a full implementation, this would also:
      // 1. Create a new detection for the suggested replacement
      // 2. Add it to selectedDetections
      // 3. Trigger re-analysis
      //
      // For now, we just mark it as accepted in the UI
    },
    [storeSuggestion]
  );

  /**
   * Apply all pending suggestions
   */
  const applyAllSuggestions = useCallback(() => {
    if (!result) return;

    for (const suggestion of result.suggestions) {
      if (!suggestion.accepted) {
        storeSuggestion(suggestion);
      }
    }
  }, [result, storeSuggestion]);

  /**
   * Update adversarial configuration
   */
  const updateConfig = useCallback(
    (newConfig: Partial<AdversarialConfig>) => {
      setConfig(newConfig);
      adversarialVerifier.setConfig(newConfig);
    },
    [setConfig]
  );

  /**
   * Clear analysis state
   */
  const clear = useCallback(() => {
    clearState();
  }, [clearState]);

  /**
   * Dismiss (same as clear for now)
   */
  const dismiss = useCallback(() => {
    clearState();
  }, [clearState]);

  /**
   * Auto-analyze when detections change (if enabled)
   */
  useEffect(() => {
    if (!autoAnalyze || !config.enabled) {
      return;
    }

    // Clear existing timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Only analyze if we have selected detections
    const selected = detections.filter((d) => selectedDetections.has(d.id));
    if (selected.length === 0) {
      return;
    }

    // Debounce the analysis
    debounceRef.current = setTimeout(() => {
      // We'd need the sections here - this is a simplified version
      // In practice, this would need to be called with proper sections
      console.log('[Adversarial] Auto-analyze triggered with', selected.length, 'detections');
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [autoAnalyze, config.enabled, debounceMs, detections, selectedDetections]);

  return {
    result,
    isAnalyzing,
    config,
    analyze,
    applySuggestion,
    applyAllSuggestions,
    updateConfig,
    clear,
    dismiss,
  };
}
