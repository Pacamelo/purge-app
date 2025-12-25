/**
 * Regex Detection Engine
 * Client-side PII detection using regex patterns
 *
 * SECURITY NOTE: Uses Web Workers for regex execution to enable true timeout
 * termination. When a regex takes too long, the worker is terminated, killing
 * the regex execution immediately. This prevents ReDoS attacks from freezing
 * the browser tab.
 */

import type {
  DetectionEngine,
  DocumentContent,
  ScrubConfig,
  DetectionResult,
  Detection,
  DetectionCapabilities,
  PIICategory,
} from '@/core/types';
import { getPatternsForCategories } from './patterns';
import { generatePrefixedId } from '@/core/utils/secureRandom';
import { safeCompileRegex } from '@/core/utils/validateRegex';
import { secureWarn } from '@/core/utils/secureLogger';
import { executeRegexInWorker } from '../../workers/regexWorker';

/**
 * Timeout in milliseconds for regex execution per pattern per section.
 * Worker will be terminated if execution exceeds this limit.
 */
const REGEX_TIMEOUT_MS = 100;

/**
 * Whether to use Web Workers for regex execution.
 * Falls back to synchronous execution if workers are unavailable.
 */
const USE_WORKER_REGEX = typeof Worker !== 'undefined';

/**
 * Generate unique detection ID using cryptographically secure random
 */
function generateId(): string {
  return generatePrefixedId('det');
}

/**
 * Execute regex matchAll with true timeout protection.
 *
 * When Web Workers are available, regex runs in a separate thread that can
 * be terminated if it takes too long. This provides genuine protection against
 * ReDoS attacks.
 *
 * Falls back to synchronous execution (best-effort timeout) when workers
 * are unavailable.
 *
 * @param pattern - The regex pattern with global flag
 * @param text - Text to search
 * @param timeoutMs - Timeout in milliseconds (default: REGEX_TIMEOUT_MS)
 * @returns Array of matches, or empty array on timeout/error
 */
async function safeRegexMatchAll(
  pattern: RegExp,
  text: string,
  timeoutMs: number = REGEX_TIMEOUT_MS
): Promise<RegExpMatchArray[]> {
  // Use Web Worker for true timeout protection when available
  if (USE_WORKER_REGEX) {
    try {
      return await executeRegexInWorker(pattern, text, timeoutMs);
    } catch {
      // Fall back to synchronous execution if worker fails
      secureWarn('Worker regex failed, falling back to synchronous');
    }
  }

  // Fallback: synchronous execution with best-effort timeout
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      secureWarn(`Regex pattern timed out after ${timeoutMs}ms (fallback mode)`);
      resolve([]);
    }, timeoutMs);

    try {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      const matches = Array.from(text.matchAll(pattern));
      clearTimeout(timeout);
      resolve(matches);
    } catch (e) {
      clearTimeout(timeout);
      secureWarn('Regex execution error', e);
      resolve([]);
    }
  });
}

/**
 * Extract context around a match
 */
function extractContext(
  text: string,
  startOffset: number,
  endOffset: number,
  contextChars: number = 25
): string {
  const start = Math.max(0, startOffset - contextChars);
  const end = Math.min(text.length, endOffset + contextChars);

  let context = '';

  if (start > 0) {
    context += '...';
  }

  context += text.slice(start, end);

  if (end < text.length) {
    context += '...';
  }

  return context;
}

/**
 * Regex-based detection engine
 * Provides client-side PII detection without network requests
 */
export class RegexDetectionEngine implements DetectionEngine {
  private version = 'regex-v1.0.0';

  async detect(
    content: DocumentContent,
    config: ScrubConfig
  ): Promise<DetectionResult> {
    const startTime = performance.now();
    const detections: Detection[] = [];

    // Get enabled categories
    const enabledCategories = (Object.entries(config.categories) as [PIICategory, boolean][])
      .filter(([, enabled]) => enabled)
      .map(([category]) => category);

    // Get patterns for enabled categories
    const activePatterns = getPatternsForCategories(enabledCategories);

    // Process each section
    for (const section of content.sections) {
      for (const patternDef of activePatterns) {
        // Use safe regex matching with timeout protection
        const matches = await safeRegexMatchAll(patternDef.pattern, section.text);

        for (const match of matches) {
          const value = match[0];

          // Run validator if present
          if (patternDef.validator && !patternDef.validator(value)) {
            continue;
          }

          // Calculate confidence based on pattern priority and match quality
          const confidence = this.calculateConfidence(
            patternDef.category,
            value,
            config.sensitivity
          );

          // Apply sensitivity threshold
          const threshold = this.getSensitivityThreshold(config.sensitivity);
          if (confidence < threshold) {
            continue;
          }

          detections.push({
            id: generateId(),
            fileId: content.fileId,
            sectionId: section.id,
            category: patternDef.category,
            value,
            startOffset: match.index ?? 0,
            endOffset: (match.index ?? 0) + value.length,
            confidence,
            context: extractContext(
              section.text,
              match.index ?? 0,
              (match.index ?? 0) + value.length
            ),
          });
        }
      }

      // Process custom patterns with validation and timeout protection
      if (config.categories.custom) {
        for (const customPattern of config.customPatterns) {
          if (!customPattern.enabled) continue;

          // Validate and compile the custom regex safely
          const { regex, error } = safeCompileRegex(customPattern.regex, 'g');

          if (!regex) {
            // Log validation failure for debugging (pattern name is safe, error message is sanitized)
            secureWarn(`Custom pattern rejected: ${error}`);
            continue;
          }

          // Use safe regex matching with timeout protection
          const matches = await safeRegexMatchAll(regex, section.text);

          for (const match of matches) {
            detections.push({
              id: generateId(),
              fileId: content.fileId,
              sectionId: section.id,
              category: 'custom',
              value: match[0],
              startOffset: match.index ?? 0,
              endOffset: (match.index ?? 0) + match[0].length,
              confidence: 0.9, // Custom patterns get high confidence
              context: extractContext(
                section.text,
                match.index ?? 0,
                (match.index ?? 0) + match[0].length
              ),
            });
          }
        }
      }
    }

    // Remove duplicates (same value at same position)
    const uniqueDetections = this.deduplicateDetections(detections);

    const endTime = performance.now();

    return {
      detections: uniqueDetections,
      processingTimeMs: Math.round(endTime - startTime),
      engineVersion: this.version,
    };
  }

  async isAvailable(): Promise<boolean> {
    // Regex engine is always available client-side
    return true;
  }

  getCapabilities(): DetectionCapabilities {
    return {
      supportedCategories: [
        'person_name',
        'email',
        'phone',
        'address',
        'ssn',
        'credit_card',
        'ip_address',
        'date_of_birth',
        'custom',
      ],
      supportsCustomPatterns: true,
      supportsContextualDetection: false, // AI engine would support this
      maxFileSizeMB: 50,
    };
  }

  /**
   * Calculate confidence score based on pattern and context
   */
  private calculateConfidence(
    category: PIICategory,
    value: string,
    sensitivity: ScrubConfig['sensitivity']
  ): number {
    // Base confidence by category
    // Note: person_name set to 0.75 to pass medium sensitivity threshold (0.7)
    // while still being lower than high-precision categories like email/SSN
    const baseConfidence: Record<PIICategory, number> = {
      email: 0.95,
      ssn: 0.95,
      credit_card: 0.9,
      phone: 0.85,
      ip_address: 0.9,
      date_of_birth: 0.75,
      address: 0.75,
      person_name: 0.75,
      custom: 0.9,
    };

    let confidence = baseConfidence[category] ?? 0.5;

    // Adjust for value characteristics
    if (category === 'email' && value.includes('+')) {
      confidence += 0.02; // Plus addressing is a strong signal
    }

    if (category === 'phone') {
      const digits = value.replace(/\D/g, '');
      if (digits.length === 10) confidence += 0.05;
      if (value.includes('(') && value.includes(')')) confidence += 0.03;
    }

    // Sensitivity adjustment
    if (sensitivity === 'high') {
      confidence += 0.1;
    } else if (sensitivity === 'low') {
      confidence -= 0.1;
    }

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Get minimum confidence threshold for sensitivity level
   */
  private getSensitivityThreshold(
    sensitivity: ScrubConfig['sensitivity']
  ): number {
    switch (sensitivity) {
      case 'low':
        return 0.9;
      case 'medium':
        return 0.7;
      case 'high':
        return 0.5;
      default:
        return 0.7;
    }
  }

  /**
   * Remove duplicate detections at the same position
   */
  private deduplicateDetections(detections: Detection[]): Detection[] {
    const seen = new Set<string>();
    return detections.filter((d) => {
      const key = `${d.sectionId}:${d.startOffset}:${d.endOffset}:${d.category}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Singleton instance
export const regexDetectionEngine = new RegexDetectionEngine();
