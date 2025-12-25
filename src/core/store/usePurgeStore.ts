/**
 * PURGE Module Store
 * In-memory Zustand store for PURGE module state persistence
 */

import { create } from 'zustand';
import type {
  PurgeState,
  QueuedFile,
  ProcessedFile,
  Detection,
  ScrubConfig,
  ProcessingProgress,
  PIICategory,
  ColumnSelectionConfig,
  SpreadsheetMetadata,
  ColumnAccessProof,
  AdversarialVerificationResult,
  AdversarialConfig,
  AdversarialSuggestion,
} from '@/core/types';

/**
 * Get the confidence threshold for a given sensitivity level.
 * Used for client-side filtering of detections.
 */
export const getSensitivityThreshold = (
  sensitivity: ScrubConfig['sensitivity']
): number => {
  switch (sensitivity) {
    case 'low':
      return 0.9;
    case 'medium':
      return 0.7;
    case 'high':
      return 0.5;
  }
};

// Default configuration
const defaultConfig: ScrubConfig = {
  categories: {
    person_name: true,
    email: true,
    phone: true,
    address: true,
    ssn: true,
    credit_card: true,
    ip_address: false,
    date_of_birth: true,
    custom: false,
  },
  redactionStyle: 'replacement',
  replacementText: '[REDACTED]',
  customPatterns: [],
  sensitivity: 'medium',
};

interface PurgeStore {
  // Machine state
  state: PurgeState;

  // Files
  queuedFiles: QueuedFile[];
  processedFiles: ProcessedFile[];

  // Detection
  detections: Detection[];
  selectedDetections: Set<string>;

  // Configuration
  config: ScrubConfig;

  // Processing
  progress: ProcessingProgress | null;

  // Errors
  jamReason: string | null;
  jamCount: number;

  // Column Selection (XLSX only)
  columnConfig: ColumnSelectionConfig | null;
  spreadsheetMetadata: SpreadsheetMetadata | null;
  columnAccessProof: ColumnAccessProof | null;

  // Adversarial Verification
  adversarialResult: AdversarialVerificationResult | null;
  adversarialConfig: AdversarialConfig;
  isAnalyzingAdversarial: boolean;

  // Actions - State
  setState: (state: PurgeState) => void;

  // Actions - Files
  feedDocuments: (files: QueuedFile[]) => void;
  removeDocument: (id: string) => void;
  updateFileStatus: (id: string, status: QueuedFile['status'], error?: string) => void;
  addProcessedFile: (file: ProcessedFile) => void;
  clearProcessedFiles: () => void;

  // Actions - Detection
  setDetections: (detections: Detection[]) => void;
  toggleDetection: (id: string) => void;
  /**
   * Select all detections. If visibleIds is provided, only select those
   * (used for sensitivity-filtered selection).
   */
  selectAllDetections: (visibleIds?: string[]) => void;
  deselectAllDetections: () => void;
  selectDetectionsByCategory: (category: PIICategory, selected: boolean) => void;
  /**
   * Clear PII values from detection objects after shredding completes.
   * This is a privacy-focused cleanup - the detection metadata (id, category,
   * position) is preserved for UI display, but actual PII values are scrubbed.
   */
  clearDetectionValues: () => void;

  /**
   * M-6 SECURITY FIX: Aggressively clear all sensitive data from store.
   * Use this instead of clearDetectionValues when you want complete cleanup.
   * Clears detections entirely rather than just replacing values.
   */
  secureClear: () => void;

  // Actions - Configuration
  updateConfig: (config: Partial<ScrubConfig>) => void;
  toggleCategory: (category: PIICategory) => void;
  setRedactionStyle: (style: ScrubConfig['redactionStyle']) => void;

  // Actions - Processing
  setProgress: (progress: ProcessingProgress | null) => void;

  // Actions - Errors
  triggerJam: (reason: string) => void;
  clearJam: () => void;

  // Actions - Column Selection
  setColumnConfig: (config: ColumnSelectionConfig | null) => void;
  setSpreadsheetMetadata: (metadata: SpreadsheetMetadata | null) => void;
  setColumnAccessProof: (proof: ColumnAccessProof | null) => void;

  // Actions - Adversarial Verification
  setAdversarialResult: (result: AdversarialVerificationResult | null) => void;
  setAdversarialConfig: (config: Partial<AdversarialConfig>) => void;
  setIsAnalyzingAdversarial: (isAnalyzing: boolean) => void;
  applySuggestion: (suggestion: AdversarialSuggestion) => void;
  clearAdversarialState: () => void;

  // Actions - Reset
  reset: () => void;
}

// Default adversarial configuration
const defaultAdversarialConfig: AdversarialConfig = {
  enabled: true,
  riskThreshold: 30,
  maxIterations: 3,
  autoApplyLowRisk: false,
  analysisDepth: 'standard',
  enabledAnalyses: {
    attributeLeakage: true,
    semanticFingerprinting: true,
    crossReferenceCheck: true,
  },
};

const initialState = {
  state: 'idle' as PurgeState,
  queuedFiles: [] as QueuedFile[],
  processedFiles: [] as ProcessedFile[],
  detections: [] as Detection[],
  selectedDetections: new Set<string>(),
  config: defaultConfig,
  progress: null as ProcessingProgress | null,
  jamReason: null as string | null,
  jamCount: 0,
  // Column selection
  columnConfig: null as ColumnSelectionConfig | null,
  spreadsheetMetadata: null as SpreadsheetMetadata | null,
  columnAccessProof: null as ColumnAccessProof | null,
  // Adversarial verification
  adversarialResult: null as AdversarialVerificationResult | null,
  adversarialConfig: defaultAdversarialConfig,
  isAnalyzingAdversarial: false,
};

export const usePurgeStore = create<PurgeStore>()((set) => ({
  ...initialState,

  // State management
  setState: (state) => set({ state }),

  // File management
  feedDocuments: (files) =>
    set((s) => ({
      queuedFiles: [...s.queuedFiles, ...files],
      state: 'loaded',
    })),

  removeDocument: (id) =>
    set((s) => {
      const queuedFiles = s.queuedFiles.filter((f) => f.id !== id);
      return {
        queuedFiles,
        state: queuedFiles.length === 0 ? 'idle' : s.state,
      };
    }),

  updateFileStatus: (id, status, error) =>
    set((s) => ({
      queuedFiles: s.queuedFiles.map((f) =>
        f.id === id ? { ...f, status, error } : f
      ),
    })),

  addProcessedFile: (file) =>
    set((s) => ({
      processedFiles: [...s.processedFiles, file],
    })),

  clearProcessedFiles: () => set({ processedFiles: [] }),

  // Detection management
  setDetections: (detections) =>
    set({
      detections,
      selectedDetections: new Set(detections.map((d) => d.id)),
    }),

  toggleDetection: (id) =>
    set((s) => {
      const selected = new Set(s.selectedDetections);
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
      return { selectedDetections: selected };
    }),

  selectAllDetections: (visibleIds?: string[]) =>
    set((s) => ({
      selectedDetections: new Set(
        visibleIds ?? s.detections.map((d) => d.id)
      ),
    })),

  deselectAllDetections: () => set({ selectedDetections: new Set() }),

  selectDetectionsByCategory: (category, selected) =>
    set((s) => {
      const newSelected = new Set(s.selectedDetections);
      s.detections
        .filter((d) => d.category === category)
        .forEach((d) => {
          if (selected) {
            newSelected.add(d.id);
          } else {
            newSelected.delete(d.id);
          }
        });
      return { selectedDetections: newSelected };
    }),

  /**
   * M-5 SECURITY FIX: Clear detections entirely after processing.
   * Previously just masked values with '[CLEARED]' which left PII in memory.
   * Now removes all detection data completely.
   */
  clearDetectionValues: () =>
    set({
      detections: [],
      selectedDetections: new Set<string>(),
    }),

  /**
   * M-6 SECURITY FIX: Aggressively clear all sensitive data.
   * Completely removes detections rather than just replacing values.
   * Also clears queued files and spreadsheet metadata.
   */
  secureClear: () =>
    set({
      detections: [],
      selectedDetections: new Set<string>(),
      queuedFiles: [],
      spreadsheetMetadata: null,
      columnConfig: null,
      columnAccessProof: null,
    }),

  // Configuration management
  updateConfig: (config) =>
    set((s) => ({
      config: { ...s.config, ...config },
    })),

  toggleCategory: (category) =>
    set((s) => ({
      config: {
        ...s.config,
        categories: {
          ...s.config.categories,
          [category]: !s.config.categories[category],
        },
      },
    })),

  setRedactionStyle: (style) =>
    set((s) => ({
      config: { ...s.config, redactionStyle: style },
    })),

  // Processing management
  setProgress: (progress) => set({ progress }),

  // Error management
  triggerJam: (reason) =>
    set((s) => ({
      state: 'jammed',
      jamReason: reason,
      jamCount: s.jamCount + 1,
    })),

  clearJam: () =>
    set((s) => ({
      state: s.queuedFiles.length > 0 ? 'loaded' : 'idle',
      jamReason: null,
    })),

  // Column selection management
  setColumnConfig: (columnConfig) => set({ columnConfig }),
  setSpreadsheetMetadata: (spreadsheetMetadata) => set({ spreadsheetMetadata }),
  setColumnAccessProof: (columnAccessProof) => set({ columnAccessProof }),

  // Adversarial verification management
  setAdversarialResult: (adversarialResult) => set({ adversarialResult }),

  setAdversarialConfig: (config) =>
    set((s) => ({
      adversarialConfig: { ...s.adversarialConfig, ...config },
    })),

  setIsAnalyzingAdversarial: (isAnalyzingAdversarial) =>
    set({ isAnalyzingAdversarial }),

  applySuggestion: (suggestion) =>
    set((s) => {
      if (!s.adversarialResult) return s;

      // Mark the suggestion as accepted
      const updatedSuggestions = s.adversarialResult.suggestions.map((sug) =>
        sug.id === suggestion.id ? { ...sug, accepted: true } : sug
      );

      return {
        adversarialResult: {
          ...s.adversarialResult,
          suggestions: updatedSuggestions,
        },
      };
    }),

  clearAdversarialState: () =>
    set({
      adversarialResult: null,
      isAnalyzingAdversarial: false,
    }),

  // Full reset
  reset: () =>
    set({
      ...initialState,
      selectedDetections: new Set(),
      columnConfig: null,
      spreadsheetMetadata: null,
      columnAccessProof: null,
    }),
}));
