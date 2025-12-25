/**
 * PURGE Module Types
 * Private/Universal Redaction & Governance Engine
 */

// ============================================================================
// State Machine
// ============================================================================

export type PurgeState =
  | 'idle'           // Shredder ready, awaiting documents
  | 'loaded'         // Documents in feed slot
  | 'column_select'  // User selecting columns (XLSX only)
  | 'configuring'    // User adjusting settings
  | 'scanning'       // Detecting PII (motor warming up)
  | 'preview'        // Showing detections for review
  | 'shredding'      // Active redaction (main animation)
  | 'complete'       // Files in output bin
  | 'jammed';        // Error state

// ============================================================================
// File Types
// ============================================================================

export type SupportedFileType = 'docx' | 'xlsx' | 'pptx' | 'pdf';

export interface QueuedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: SupportedFileType;
  status: 'queued' | 'scanning' | 'detected' | 'shredding' | 'complete' | 'error';
  error?: string;
}

export interface ProcessedFile {
  id: string;
  originalName: string;
  purgedName: string;
  originalSize: number;
  purgedSize: number;
  type: SupportedFileType;
  blob: Blob;
  detectionsRemoved: number;
  timestamp: number;
}

// ============================================================================
// Detection Types
// ============================================================================

export type PIICategory =
  | 'person_name'
  | 'email'
  | 'phone'
  | 'address'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'date_of_birth'
  | 'custom';

export interface Detection {
  id: string;
  fileId: string;
  sectionId: string;
  category: PIICategory;
  value: string;
  startOffset: number;
  endOffset: number;
  confidence: number;  // 0-1
  context: string;     // Surrounding text for display
}

export interface DetectionResult {
  detections: Detection[];
  processingTimeMs: number;
  engineVersion: string;
}

// ============================================================================
// Document Processing Types
// ============================================================================

export interface ContentSection {
  id: string;
  text: string;
  type: 'paragraph' | 'cell' | 'slide' | 'heading' | 'footer' | 'header';
  location: {
    page?: number;
    sheet?: string;
    cell?: string;
    slide?: number;
    paragraph?: number;
  };
}

export interface DocumentContent {
  fileId: string;
  fileName: string;
  fileType: SupportedFileType;
  sections: ContentSection[];
}

export interface ParsedDocument {
  content: DocumentContent;
  metadata: Record<string, unknown>;
  rawData: unknown; // Format-specific parsed data for regeneration
}

// ============================================================================
// Configuration Types
// ============================================================================

export type RedactionStyle = 'blackout' | 'replacement' | 'pseudonym' | 'partial';

export interface CustomPattern {
  id: string;
  name: string;
  regex: string;
  category: 'custom';
  enabled: boolean;
}

export interface ScrubConfig {
  categories: Record<PIICategory, boolean>;
  redactionStyle: RedactionStyle;
  replacementText: string;
  customPatterns: CustomPattern[];
  sensitivity: 'low' | 'medium' | 'high';
}

// ============================================================================
// Processing Progress
// ============================================================================

export interface ProcessingProgress {
  currentFileIndex: number;
  totalFiles: number;
  currentFileName: string;
  phase: 'detecting' | 'redacting' | 'finalizing';
  percent: number;
}

// ============================================================================
// Trust Panel Types
// ============================================================================

export interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  size: number;
  status: number;
  timestamp: number;
}

export interface StorageSnapshot {
  localStorage: number;
  sessionStorage: number;
  indexedDB: number;
  cookies: number;
  cacheAPI: number; // Service Worker cache storage
  watermarkPlanted: boolean;
  watermarkVerified: boolean;
}

export interface MemoryStats {
  allocated: number;
  wiped: number;
  buffersCleared: number;
  totalBuffers: number;
}

// ============================================================================
// Detection Engine Interface (for AI backend)
// ============================================================================

export interface DetectionCapabilities {
  supportedCategories: PIICategory[];
  supportsCustomPatterns: boolean;
  supportsContextualDetection: boolean;
  maxFileSizeMB: number;
}

export interface DetectionEngine {
  detect(content: DocumentContent, config: ScrubConfig): Promise<DetectionResult>;
  isAvailable(): Promise<boolean>;
  getCapabilities(): DetectionCapabilities;
}

// ============================================================================
// Document Processor Interface
// ============================================================================

export interface Redaction {
  detectionId: string;
  sectionId: string;
  startOffset: number;
  endOffset: number;
  replacement: string;
}

export interface DocumentProcessor {
  canProcess(file: File): boolean;
  parse(file: File): Promise<ParsedDocument>;
  applyRedactions(document: ParsedDocument, redactions: Redaction[]): Promise<Blob>;
  getSupportedMimeTypes(): string[];
}

// ============================================================================
// Entropy Visualization Types
// ============================================================================

/**
 * A single block of file data with its entropy measurement.
 * Used for heat map visualization.
 */
export interface EntropyBlock {
  /** Block index in the file */
  index: number;
  /** Shannon entropy value (0-8 bits) */
  entropy: number;
  /** Normalized entropy for color mapping (0-1) */
  normalizedEntropy: number;
  /** Byte offset in the original file */
  offset: number;
  /** Size of this block in bytes */
  size: number;
  /** Whether this block overlaps with a PII detection */
  containsPII: boolean;
}

/**
 * Complete entropy analysis of a file.
 */
export interface EntropyData {
  /** Array of entropy blocks */
  blocks: EntropyBlock[];
  /** Overall file entropy */
  globalEntropy: number;
  /** Highest block entropy */
  maxEntropy: number;
  /** Lowest block entropy */
  minEntropy: number;
  /** Total bytes analyzed */
  totalBytes: number;
  /** Block size used for analysis */
  blockSize: number;
}

/**
 * Animation state for entropy visualization transitions.
 */
export interface EntropyAnimationState {
  /** Current animation phase */
  phase: 'idle' | 'scanning' | 'comparing' | 'complete';
  /** Animation progress (0-100) */
  progress: number;
  /** Currently highlighted block index */
  currentBlockIndex: number;
  /** Detection IDs being highlighted */
  highlightedPII: string[];
}

/**
 * Comparison data for before/after visualization.
 */
export interface EntropyComparison {
  /** Entropy data before redaction */
  before: EntropyData | null;
  /** Entropy data after redaction */
  after: EntropyData | null;
  /** Regions where entropy changed significantly */
  changedRegions: Array<{
    startBlock: number;
    endBlock: number;
    entropyDrop: number;
  }>;
}

// ============================================================================
// Column Selection Types (for XLSX pre-scan column isolation)
// ============================================================================

/**
 * Configuration for which columns to process in XLSX files.
 * Enables "column isolation" where non-selected columns are never read.
 */
export interface ColumnSelectionConfig {
  /** Processing mode: 'all' scans everything, 'selected' only scans specified columns */
  mode: 'all' | 'selected';
  /** Set of column letters to process (e.g., 'A', 'B', 'C') */
  selectedColumns: Set<string>;
  /** Set of sheet names to process */
  selectedSheets: Set<string>;
}

/**
 * Cryptographic attestation proving a column was never accessed.
 * The hash is computed from column metadata WITHOUT reading cell values.
 */
export interface ColumnAttestation {
  /** Column letter (A, B, C, etc.) */
  column: string;
  /** Sheet name */
  sheet: string;
  /** Number of cells in the column */
  cellCount: number;
  /** SHA-256 hash of column metadata (proves we didn't modify it) */
  rawBytesHash: string;
  /** Always false - indicates this column was skipped */
  wasAccessed: false;
}

/**
 * Metadata about a single sheet in the spreadsheet.
 * Extracted without reading sensitive cell values.
 */
export interface SheetMetadata {
  /** Sheet name */
  name: string;
  /** Array of column letters present (e.g., ['A', 'B', 'C']) */
  columns: string[];
  /** Total row count */
  rowCount: number;
  /** Total column count */
  columnCount: number;
  /** Optional first-row values as column headers (can be disabled for privacy) */
  sampleHeaders?: string[];
}

/**
 * Complete spreadsheet structure metadata.
 * Allows column selection UI without exposing sensitive data.
 */
export interface SpreadsheetMetadata {
  /** Array of sheet metadata */
  sheets: SheetMetadata[];
  /** Total cell count across all sheets */
  totalCells: number;
  /** Column range (first and last column letters) */
  columnRange: { min: string; max: string };
}

/**
 * Record of which columns were skipped during processing.
 * Displayed in TrustPanel for user visibility.
 * Note: This is a self-reported indicator, not a cryptographic proof.
 */
export interface ColumnAccessProof {
  /** Attestations for each skipped column */
  attestations: ColumnAttestation[];
  /** When the record was generated */
  timestamp: string;
  /** Hash of all attestations combined */
  verificationHash: string;
  /** Whether post-processing verification passed */
  verified: boolean;
}

// ============================================================================
// Adversarial Verification Types
// ============================================================================

/**
 * Attributes leaked through context that could identify a person.
 * Each attribute narrows the potential population of matches.
 */
export interface LeakedAttribute {
  /** Type of attribute detected */
  type:
    | 'profession'
    | 'affiliation'
    | 'temporal_marker'
    | 'geographic_signal'
    | 'relational_context'
    | 'unique_event'
    | 'demographic'
    | 'achievement'
    | 'public_role';
  /** The phrase or context that reveals this attribute */
  phrase: string;
  /** Estimated population narrowing factor (smaller = more identifying) */
  narrowingFactor: number;
  /** Human-readable explanation */
  explanation: string;
  /** Suggested generalization to reduce risk */
  suggestion?: string;
  /** Location in the redacted text */
  location: {
    sectionId: string;
    startOffset: number;
    endOffset: number;
  };
}

/**
 * A phrase that could be searched to find the person.
 */
export interface SearchableFragment {
  /** The searchable text */
  fragment: string;
  /** How easy it would be to find the person via search */
  searchability: 'trivial' | 'moderate' | 'difficult';
  /** Why this is searchable */
  reason: string;
  /** What search would likely return */
  predictedResults: string;
}

/**
 * Semantic fingerprint - how uniquely identifying is the redacted text?
 */
export interface SemanticFingerprint {
  /** Estimated population size that matches this description */
  estimatedPopulationSize: number;
  /** Human-readable population description */
  populationDescription: string;
  /** Primary factors driving uniqueness */
  uniquenessDrivers: Array<{
    phrase: string;
    impact: 'critical' | 'high' | 'medium' | 'low';
    narrowingFactor: number;
    suggestion: string;
  }>;
  /** Combined re-identification risk score (0-100) */
  riskScore: number;
  /** Risk level classification */
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
}

/**
 * Cross-reference vulnerability assessment.
 */
export interface CrossReferenceRisk {
  /** Fragments that could be used to search/identify */
  searchableFragments: SearchableFragment[];
  /** Databases/sources that could be cross-referenced */
  vulnerableSources: Array<{
    source: string;
    matchLikelihood: 'certain' | 'likely' | 'possible' | 'unlikely';
    dataPoints: string[];
  }>;
  /** Overall cross-reference risk score (0-100) */
  riskScore: number;
}

/**
 * Result of an adversarial analysis pass.
 */
export interface AdversarialAnalysis {
  /** Unique ID for this analysis */
  id: string;
  /** When the analysis was performed */
  timestamp: number;
  /** Overall re-identification confidence (0-100) */
  reidentificationConfidence: number;
  /** Risk classification */
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  /** Leaked attributes found in the text */
  leakedAttributes: LeakedAttribute[];
  /** Semantic fingerprint analysis */
  semanticFingerprint: SemanticFingerprint;
  /** Cross-reference vulnerability */
  crossReferenceRisk: CrossReferenceRisk;
  /** Sections analyzed */
  sectionsAnalyzed: string[];
  /** Processing time in ms */
  processingTimeMs: number;
}

/**
 * Suggested action to reduce re-identification risk.
 */
export interface AdversarialSuggestion {
  /** Unique ID */
  id: string;
  /** Type of suggestion */
  type: 'redact' | 'generalize' | 'rephrase' | 'remove';
  /** Priority (1 = highest) */
  priority: number;
  /** The problematic phrase */
  originalPhrase: string;
  /** Suggested replacement */
  suggestedReplacement: string;
  /** Expected risk reduction (percentage points) */
  expectedRiskReduction: number;
  /** Location in document */
  location: {
    sectionId: string;
    startOffset: number;
    endOffset: number;
  };
  /** Why this change helps */
  rationale: string;
  /** Whether user has accepted this suggestion */
  accepted: boolean;
}

/**
 * Complete adversarial verification result.
 */
export interface AdversarialVerificationResult {
  /** The analysis performed */
  analysis: AdversarialAnalysis;
  /** Suggested actions to reduce risk */
  suggestions: AdversarialSuggestion[];
  /** Whether the document passes the risk threshold */
  passesThreshold: boolean;
  /** Configured risk threshold */
  riskThreshold: number;
  /** Iteration number (for adversarial loop) */
  iteration: number;
  /** Previous iteration's confidence (to show improvement) */
  previousConfidence?: number;
}

/**
 * Configuration for adversarial verification.
 */
export interface AdversarialConfig {
  /** Enable adversarial verification */
  enabled: boolean;
  /** Risk threshold (0-100) - fail if reidentification confidence exceeds this */
  riskThreshold: number;
  /** Maximum iterations of the adversarial loop */
  maxIterations: number;
  /** Whether to auto-apply low-risk suggestions */
  autoApplyLowRisk: boolean;
  /** Analysis depth */
  analysisDepth: 'quick' | 'standard' | 'thorough';
  /** Categories of analysis to perform */
  enabledAnalyses: {
    attributeLeakage: boolean;
    semanticFingerprinting: boolean;
    crossReferenceCheck: boolean;
  };
}
