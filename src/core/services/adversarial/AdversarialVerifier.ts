/**
 * Adversarial Verification Engine
 *
 * This service thinks like an attacker - given redacted text, how confident
 * would an adversary be in re-identifying the subject?
 *
 * The engine analyzes:
 * 1. Leaked attributes (profession, affiliation, temporal markers, etc.)
 * 2. Semantic fingerprinting (how unique is this description?)
 * 3. Cross-reference vulnerability (could this be Googled?)
 */

import type {
  AdversarialAnalysis,
  AdversarialConfig,
  AdversarialSuggestion,
  AdversarialVerificationResult,
  ContentSection,
  CrossReferenceRisk,
  Detection,
  LeakedAttribute,
  SearchableFragment,
  SemanticFingerprint,
} from '@/core/types';
import { generateSecureId as generateId } from '@/core/utils/secureRandom';

// ============================================================================
// Attribute Extraction Patterns
// ============================================================================

interface AttributePattern {
  type: LeakedAttribute['type'];
  patterns: RegExp[];
  narrowingFactor: number;
  explanationTemplate: string;
  suggestionTemplate?: string;
}

const ATTRIBUTE_PATTERNS: AttributePattern[] = [
  // Professions - highly identifying
  {
    type: 'profession',
    patterns: [
      /\b(?:CEO|CFO|CTO|COO|CMO|CIO|CISO)\b/gi,
      /\b(?:chief|head|director|vp|vice president)\s+(?:of\s+)?[\w\s]+(?:officer|executive)?\b/gi,
      /\b(?:surgeon|doctor|physician|attorney|lawyer|judge|professor|dean)\b/gi,
      /\b(?:architect|engineer|scientist|researcher)\s+(?:at|for|of)\s+[\w\s]+\b/gi,
      /\bfounder\s+(?:of|and\s+CEO\s+of)\s+[\w\s]+\b/gi,
      /\b(?:partner|principal|managing\s+director)\s+at\s+[\w\s]+\b/gi,
    ],
    narrowingFactor: 0.0001, // Very few people have specific C-suite titles
    explanationTemplate: 'Job title "{phrase}" significantly narrows identification',
    suggestionTemplate: 'a senior executive',
  },
  // Affiliations - companies, universities, organizations
  {
    type: 'affiliation',
    patterns: [
      /\bat\s+(?:Google|Apple|Microsoft|Amazon|Meta|Facebook|Netflix|Tesla|SpaceX)\b/gi,
      /\bat\s+(?:Harvard|Stanford|MIT|Yale|Princeton|Oxford|Cambridge)\b/gi,
      /\b(?:works?|worked|employed)\s+(?:at|for|with)\s+[\w\s]+(?:Inc|Corp|LLC|Ltd|University|College|Hospital)?\b/gi,
      /\b(?:member|fellow|associate)\s+of\s+(?:the\s+)?[\w\s]+(?:Association|Society|Institute|Academy)\b/gi,
    ],
    narrowingFactor: 0.001,
    explanationTemplate: 'Affiliation with "{phrase}" narrows potential matches',
    suggestionTemplate: 'a technology company',
  },
  // Temporal markers - specific dates/events
  {
    type: 'temporal_marker',
    patterns: [
      /\bin\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:of\s+)?(?:19|20)\d{2}\b/gi,
      /\bon\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*(?:19|20)\d{2}\b/gi,
      /\bduring\s+(?:the\s+)?(?:19|20)\d{2}\s+[\w\s]+\b/gi,
      /\b(?:class|batch|cohort)\s+of\s+(?:19|20)\d{2}\b/gi,
      /\bQ[1-4]\s+(?:19|20)\d{2}\b/gi,
    ],
    narrowingFactor: 0.1,
    explanationTemplate: 'Specific time reference "{phrase}" helps narrow search',
    suggestionTemplate: 'during that period',
  },
  // Geographic signals
  {
    type: 'geographic_signal',
    patterns: [
      /\b(?:based|located|headquartered)\s+in\s+[\w\s]+(?:,\s*[A-Z]{2})?\b/gi,
      /\b(?:downtown|midtown|uptown)\s+[\w\s]+\b/gi,
      /\b[\w\s]+(?:office|campus|facility|branch)\b/gi,
      /\bnative\s+of\s+[\w\s]+\b/gi,
      /\bfrom\s+(?:the\s+)?[\w\s]+(?:area|region|district|neighborhood)\b/gi,
    ],
    narrowingFactor: 0.01,
    explanationTemplate: 'Location "{phrase}" limits geographic scope',
    suggestionTemplate: 'a major metropolitan area',
  },
  // Relational context - family, colleagues
  {
    type: 'relational_context',
    patterns: [
      /\b(?:his|her|their)\s+(?:wife|husband|spouse|partner|son|daughter|father|mother|brother|sister)\b/gi,
      /\b(?:married|divorced|widowed)\s+(?:to|from)\s+[\w\s]+\b/gi,
      /\b(?:colleague|mentor|mentee|protégé|advisor)\s+(?:of|to)\s+[\w\s]+\b/gi,
      /\bco-founder\s+with\s+[\w\s]+\b/gi,
    ],
    narrowingFactor: 0.1,
    explanationTemplate: 'Relationship context "{phrase}" provides additional linkage',
    suggestionTemplate: 'a family member',
  },
  // Unique events - testimony, awards, notable occurrences
  {
    type: 'unique_event',
    patterns: [
      /\btestified\s+(?:before|at|to)\s+(?:the\s+)?[\w\s]+(?:Congress|Senate|Committee|Court)\b/gi,
      /\bwon\s+(?:the\s+)?[\w\s]+(?:Award|Prize|Medal|Trophy)\b/gi,
      /\bnamed\s+(?:to|in)\s+(?:the\s+)?[\w\s]+(?:list|ranking|100)\b/gi,
      /\bfirst\s+(?:woman|man|person|African.American|Asian)\s+to\b/gi,
      /\bonly\s+(?:person|individual|one)\s+to\s+(?:have\s+)?[\w\s]+\b/gi,
      /\brecord.setting\b/gi,
      /\bpioneer(?:ed|ing)?\s+[\w\s]+\b/gi,
    ],
    narrowingFactor: 0.00001, // Unique events are extremely identifying
    explanationTemplate:
      'Unique event "{phrase}" likely identifies a single individual',
    suggestionTemplate: 'received recognition',
  },
  // Demographics - age, gender, ethnicity indicators
  {
    type: 'demographic',
    patterns: [
      /\b(?:youngest|oldest|first)\s+(?:female|male|woman|man)\b/gi,
      /\b\d{2}.year.old\b/gi,
      /\bborn\s+in\s+(?:19|20)\d{2}\b/gi,
      /\bgeneration\s+(?:X|Y|Z|Alpha|Boomer|Millennial)\b/gi,
    ],
    narrowingFactor: 0.05,
    explanationTemplate: 'Demographic detail "{phrase}" narrows population',
    suggestionTemplate: 'an individual',
  },
  // Achievements - degrees, certifications, publications
  {
    type: 'achievement',
    patterns: [
      /\bPhD\s+(?:in|from)\s+[\w\s]+\b/gi,
      /\bauthor(?:ed)?\s+(?:of\s+)?["']?[\w\s]+["']?\b/gi,
      /\bpublished\s+(?:in|by)\s+[\w\s]+\b/gi,
      /\bpatent(?:ed|s)?\s+(?:for|on)\s+[\w\s]+\b/gi,
      /\bfounded\s+[\w\s]+\b/gi,
      /\binvented\s+[\w\s]+\b/gi,
    ],
    narrowingFactor: 0.001,
    explanationTemplate: 'Achievement "{phrase}" is potentially searchable',
    suggestionTemplate: 'has relevant credentials',
  },
  // Public roles - elected officials, public figures
  {
    type: 'public_role',
    patterns: [
      /\b(?:senator|congressman|congresswoman|representative|mayor|governor|president)\b/gi,
      /\b(?:elected|appointed|nominated)\s+(?:to|as)\s+[\w\s]+\b/gi,
      /\bserved\s+(?:on|as|in)\s+(?:the\s+)?[\w\s]+(?:board|committee|council|commission)\b/gi,
      /\bformer\s+[\w\s]+(?:secretary|minister|ambassador|director)\b/gi,
    ],
    narrowingFactor: 0.0001,
    explanationTemplate: 'Public role "{phrase}" is easily searchable',
    suggestionTemplate: 'held a public position',
  },
];

// ============================================================================
// Searchability Patterns
// ============================================================================

interface SearchabilityPattern {
  pattern: RegExp;
  searchability: 'trivial' | 'moderate' | 'difficult';
  reason: string;
}

const SEARCHABILITY_PATTERNS: SearchabilityPattern[] = [
  // Trivially searchable - direct quotes, exact events
  {
    pattern: /["'][\w\s]{10,}["']/g,
    searchability: 'trivial',
    reason: 'Exact quote can be searched directly',
  },
  {
    pattern:
      /testified\s+(?:before|at|to)\s+[\w\s]+(?:on|about|regarding)\s+[\w\s]+/gi,
    searchability: 'trivial',
    reason: 'Congressional testimony is public record',
  },
  {
    pattern:
      /(?:filed|settled|won|lost)\s+(?:a\s+)?(?:lawsuit|case|suit)\s+(?:against|with)\s+[\w\s]+/gi,
    searchability: 'trivial',
    reason: 'Legal proceedings are searchable',
  },
  {
    pattern: /(?:awarded|received|won)\s+(?:the\s+)?[\w\s]+(?:Award|Prize|Medal)/gi,
    searchability: 'trivial',
    reason: 'Awards are typically announced publicly',
  },
  // Moderately searchable - combinations of attributes
  {
    pattern: /(?:CEO|CFO|CTO)\s+(?:of|at)\s+[\w\s]+/gi,
    searchability: 'moderate',
    reason: 'Executive titles at named companies are findable',
  },
  {
    pattern: /(?:professor|researcher)\s+(?:of|at)\s+[\w\s]+University/gi,
    searchability: 'moderate',
    reason: 'Academic positions are often listed online',
  },
  // Difficult but possible
  {
    pattern:
      /(?:worked|employed)\s+(?:at|for)\s+[\w\s]+\s+(?:from|during|in)\s+[\w\s]+/gi,
    searchability: 'difficult',
    reason: 'Employment history with dates may appear in professional profiles',
  },
];

// ============================================================================
// Known Database Sources
// ============================================================================

interface VulnerableSource {
  name: string;
  dataTypes: string[];
  matchPatterns: RegExp[];
}

const VULNERABLE_SOURCES: VulnerableSource[] = [
  {
    name: 'LinkedIn',
    dataTypes: ['employment history', 'education', 'skills', 'connections'],
    matchPatterns: [
      /\bworked?\s+(?:at|for)\b/gi,
      /\bemployed\b/gi,
      /\b(?:CEO|CTO|CFO|Director|Manager|Engineer)\b/gi,
    ],
  },
  {
    name: 'Public Records',
    dataTypes: ['property ownership', 'court records', 'voter registration'],
    matchPatterns: [
      /\bowned\s+property\b/gi,
      /\bfiled\s+(?:lawsuit|bankruptcy)\b/gi,
      /\bregistered\s+voter\b/gi,
    ],
  },
  {
    name: 'News Archives',
    dataTypes: ['news mentions', 'press releases', 'interviews'],
    matchPatterns: [
      /\bannounced\b/gi,
      /\bquoted\b/gi,
      /\binterview(?:ed)?\b/gi,
      /\btestified\b/gi,
    ],
  },
  {
    name: 'Academic Databases',
    dataTypes: ['publications', 'citations', 'institutional affiliations'],
    matchPatterns: [
      /\bpublished\b/gi,
      /\bprofessor\b/gi,
      /\bresearcher\b/gi,
      /\bPhD\b/gi,
    ],
  },
  {
    name: 'Corporate Filings',
    dataTypes: ['SEC filings', 'board memberships', 'executive compensation'],
    matchPatterns: [
      /\b(?:CEO|CFO|CTO|COO|board)\b/gi,
      /\bfiled\s+with\b/gi,
      /\bpublic(?:ly)?\s+traded\b/gi,
    ],
  },
];

// ============================================================================
// Population Estimation Constants
// ============================================================================

const WORLD_POPULATION = 8_000_000_000;

const POPULATION_MULTIPLIERS: Record<LeakedAttribute['type'], number> = {
  profession: 0.0001, // ~800,000 for a specific job title
  affiliation: 0.001, // ~8,000,000 for a major company
  temporal_marker: 0.1, // Narrows to a year or period
  geographic_signal: 0.01, // ~80,000,000 for a city
  relational_context: 0.1, // Provides linkage, not direct ID
  unique_event: 0.00001, // ~80,000 or less for unique achievements
  demographic: 0.05, // Age/gender combo
  achievement: 0.001, // Specific degrees/publications
  public_role: 0.0001, // Public figures are findable
};

// ============================================================================
// Core Engine
// ============================================================================

export class AdversarialVerifier {
  private config: AdversarialConfig;

  constructor(config?: Partial<AdversarialConfig>) {
    this.config = {
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
      ...config,
    };
  }

  /**
   * Main entry point: analyze redacted content for re-identification risk
   */
  async analyze(
    sections: ContentSection[],
    appliedRedactions: Detection[]
  ): Promise<AdversarialVerificationResult> {
    const startTime = performance.now();

    // Simulate what the redacted text looks like
    const redactedText = this.simulateRedactedOutput(sections, appliedRedactions);

    // Run all analyses
    const leakedAttributes = this.config.enabledAnalyses.attributeLeakage
      ? this.extractLeakedAttributes(redactedText, sections)
      : [];

    const semanticFingerprint = this.config.enabledAnalyses.semanticFingerprinting
      ? this.calculateSemanticFingerprint(redactedText, leakedAttributes)
      : this.emptySemanticFingerprint();

    const crossReferenceRisk = this.config.enabledAnalyses.crossReferenceCheck
      ? this.assessCrossReferenceRisk(redactedText)
      : this.emptyCrossReferenceRisk();

    // Calculate overall confidence
    const reidentificationConfidence = this.calculateOverallConfidence(
      leakedAttributes,
      semanticFingerprint,
      crossReferenceRisk
    );

    const riskLevel = this.classifyRiskLevel(reidentificationConfidence);

    const analysis: AdversarialAnalysis = {
      id: generateId(),
      timestamp: Date.now(),
      reidentificationConfidence,
      riskLevel,
      leakedAttributes,
      semanticFingerprint,
      crossReferenceRisk,
      sectionsAnalyzed: sections.map((s) => s.id),
      processingTimeMs: performance.now() - startTime,
    };

    // Generate suggestions
    const suggestions = this.generateSuggestions(analysis);

    return {
      analysis,
      suggestions,
      passesThreshold: reidentificationConfidence <= this.config.riskThreshold,
      riskThreshold: this.config.riskThreshold,
      iteration: 1,
    };
  }

  /**
   * Simulate what the document looks like after redaction
   */
  private simulateRedactedOutput(
    sections: ContentSection[],
    redactions: Detection[]
  ): Map<string, string> {
    const result = new Map<string, string>();

    for (const section of sections) {
      let text = section.text;

      // Get redactions for this section, sorted by offset descending
      const sectionRedactions = redactions
        .filter((r) => r.sectionId === section.id)
        .sort((a, b) => b.startOffset - a.startOffset);

      // Apply redactions from end to start to preserve offsets
      for (const redaction of sectionRedactions) {
        text =
          text.slice(0, redaction.startOffset) +
          '[REDACTED]' +
          text.slice(redaction.endOffset);
      }

      result.set(section.id, text);
    }

    return result;
  }

  /**
   * Extract attributes that leak identity from redacted text
   */
  private extractLeakedAttributes(
    redactedText: Map<string, string>,
    _sections: ContentSection[]
  ): LeakedAttribute[] {
    const attributes: LeakedAttribute[] = [];

    for (const [sectionId, text] of redactedText) {
      for (const pattern of ATTRIBUTE_PATTERNS) {
        for (const regex of pattern.patterns) {
          // Reset regex state
          regex.lastIndex = 0;

          let match: RegExpExecArray | null;
          while ((match = regex.exec(text)) !== null) {
            // Skip if this is inside a redaction marker
            if (this.isInsideRedaction(text, match.index)) {
              continue;
            }

            const phrase = match[0].trim();

            // Skip very short matches (likely false positives)
            if (phrase.length < 5) {
              continue;
            }

            attributes.push({
              type: pattern.type,
              phrase,
              narrowingFactor: pattern.narrowingFactor,
              explanation: pattern.explanationTemplate.replace('{phrase}', phrase),
              suggestion: pattern.suggestionTemplate,
              location: {
                sectionId,
                startOffset: match.index,
                endOffset: match.index + match[0].length,
              },
            });
          }
        }
      }
    }

    // Deduplicate by phrase
    const seen = new Set<string>();
    return attributes.filter((attr) => {
      const key = `${attr.type}:${attr.phrase.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Check if a position is inside a [REDACTED] marker
   */
  private isInsideRedaction(text: string, position: number): boolean {
    const redactionPattern = /\[REDACTED\]/g;
    let match: RegExpExecArray | null;
    while ((match = redactionPattern.exec(text)) !== null) {
      if (position >= match.index && position < match.index + match[0].length) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate semantic fingerprint - how unique is this description?
   */
  private calculateSemanticFingerprint(
    _redactedText: Map<string, string>,
    leakedAttributes: LeakedAttribute[]
  ): SemanticFingerprint {
    // Start with world population
    let populationSize = WORLD_POPULATION;

    // Apply each attribute's narrowing factor
    const drivers: SemanticFingerprint['uniquenessDrivers'] = [];

    for (const attr of leakedAttributes) {
      const narrowingFactor =
        POPULATION_MULTIPLIERS[attr.type] || attr.narrowingFactor;
      const newPopulation = populationSize * narrowingFactor;

      drivers.push({
        phrase: attr.phrase,
        impact: this.categorizeImpact(narrowingFactor),
        narrowingFactor,
        suggestion: attr.suggestion || 'Consider generalizing this phrase',
      });

      populationSize = newPopulation;
    }

    // Sort by impact
    drivers.sort((a, b) => {
      const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });

    // Calculate risk score (inverse log of population)
    // More people = lower risk, fewer people = higher risk
    const riskScore = Math.min(
      100,
      Math.max(0, 100 - Math.log10(Math.max(1, populationSize)) * 10)
    );

    return {
      estimatedPopulationSize: Math.max(1, Math.round(populationSize)),
      populationDescription: this.describePopulation(populationSize),
      uniquenessDrivers: drivers.slice(0, 10), // Top 10
      riskScore,
      riskLevel: this.classifyRiskLevel(riskScore),
    };
  }

  /**
   * Categorize the impact of a narrowing factor
   */
  private categorizeImpact(
    factor: number
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (factor <= 0.0001) return 'critical';
    if (factor <= 0.001) return 'high';
    if (factor <= 0.01) return 'medium';
    return 'low';
  }

  /**
   * Create human-readable population description
   */
  private describePopulation(size: number): string {
    if (size <= 1) return 'Single individual identifiable';
    if (size <= 10) return 'Fewer than 10 people match';
    if (size <= 100) return 'Fewer than 100 people match';
    if (size <= 1000) return 'Approximately 1,000 people match';
    if (size <= 10000) return 'Approximately 10,000 people match';
    if (size <= 100000) return 'Approximately 100,000 people match';
    if (size <= 1000000) return 'Approximately 1 million people match';
    return 'Large population matches (lower risk)';
  }

  /**
   * Assess cross-reference vulnerability
   */
  private assessCrossReferenceRisk(
    redactedText: Map<string, string>
  ): CrossReferenceRisk {
    const fullText = Array.from(redactedText.values()).join(' ');
    const searchableFragments: SearchableFragment[] = [];
    const vulnerableSources: CrossReferenceRisk['vulnerableSources'] = [];

    // Find searchable fragments
    for (const pattern of SEARCHABILITY_PATTERNS) {
      pattern.pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.pattern.exec(fullText)) !== null) {
        if (!this.isInsideRedaction(fullText, match.index)) {
          searchableFragments.push({
            fragment: match[0].trim(),
            searchability: pattern.searchability,
            reason: pattern.reason,
            predictedResults: this.predictSearchResults(
              match[0],
              pattern.searchability
            ),
          });
        }
      }
    }

    // Check against vulnerable sources
    for (const source of VULNERABLE_SOURCES) {
      const matchingDataPoints: string[] = [];

      for (const pattern of source.matchPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(fullText)) {
          // Find which data types are relevant
          matchingDataPoints.push(
            ...source.dataTypes.filter((_dt) =>
              source.matchPatterns.some((p) => {
                p.lastIndex = 0;
                return p.test(fullText);
              })
            )
          );
        }
      }

      if (matchingDataPoints.length > 0) {
        vulnerableSources.push({
          source: source.name,
          matchLikelihood: this.assessMatchLikelihood(matchingDataPoints.length),
          dataPoints: [...new Set(matchingDataPoints)],
        });
      }
    }

    // Calculate overall cross-reference risk
    const trivialCount = searchableFragments.filter(
      (f) => f.searchability === 'trivial'
    ).length;
    const moderateCount = searchableFragments.filter(
      (f) => f.searchability === 'moderate'
    ).length;

    const riskScore = Math.min(
      100,
      trivialCount * 30 + moderateCount * 15 + vulnerableSources.length * 10
    );

    return {
      searchableFragments: searchableFragments.slice(0, 10),
      vulnerableSources,
      riskScore,
    };
  }

  /**
   * Predict what a search might return
   */
  private predictSearchResults(
    _fragment: string,
    searchability: 'trivial' | 'moderate' | 'difficult'
  ): string {
    switch (searchability) {
      case 'trivial':
        return 'Direct search likely returns exact match';
      case 'moderate':
        return 'Search combined with other context may identify';
      case 'difficult':
        return 'Requires additional context to narrow results';
    }
  }

  /**
   * Assess likelihood of database match
   */
  private assessMatchLikelihood(
    dataPointCount: number
  ): 'certain' | 'likely' | 'possible' | 'unlikely' {
    if (dataPointCount >= 3) return 'certain';
    if (dataPointCount === 2) return 'likely';
    if (dataPointCount === 1) return 'possible';
    return 'unlikely';
  }

  /**
   * Calculate overall re-identification confidence
   */
  private calculateOverallConfidence(
    leakedAttributes: LeakedAttribute[],
    semanticFingerprint: SemanticFingerprint,
    crossReferenceRisk: CrossReferenceRisk
  ): number {
    // Weighted combination of all risk factors
    const weights = {
      semantic: 0.5, // How unique is the description?
      crossRef: 0.3, // How searchable?
      attributeCount: 0.2, // Raw attribute count factor
    };

    const attributeRisk = Math.min(100, leakedAttributes.length * 10);

    return Math.round(
      weights.semantic * semanticFingerprint.riskScore +
        weights.crossRef * crossReferenceRisk.riskScore +
        weights.attributeCount * attributeRisk
    );
  }

  /**
   * Classify risk level based on confidence score
   */
  private classifyRiskLevel(
    confidence: number
  ): 'critical' | 'high' | 'medium' | 'low' | 'minimal' {
    if (confidence >= 80) return 'critical';
    if (confidence >= 60) return 'high';
    if (confidence >= 40) return 'medium';
    if (confidence >= 20) return 'low';
    return 'minimal';
  }

  /**
   * Generate suggestions for reducing risk
   */
  private generateSuggestions(
    analysis: AdversarialAnalysis
  ): AdversarialSuggestion[] {
    const suggestions: AdversarialSuggestion[] = [];
    let priority = 1;

    // Create suggestions from high-impact uniqueness drivers
    for (const driver of analysis.semanticFingerprint.uniquenessDrivers) {
      if (driver.impact === 'critical' || driver.impact === 'high') {
        // Find the corresponding leaked attribute for location
        const attr = analysis.leakedAttributes.find(
          (a) => a.phrase === driver.phrase
        );

        if (attr) {
          suggestions.push({
            id: generateId(),
            type: 'generalize',
            priority: priority++,
            originalPhrase: driver.phrase,
            suggestedReplacement: driver.suggestion,
            expectedRiskReduction: this.estimateRiskReduction(driver.impact),
            location: attr.location,
            rationale: `This phrase narrows identification to approximately ${Math.round(
              analysis.semanticFingerprint.estimatedPopulationSize *
                driver.narrowingFactor
            ).toLocaleString()} people`,
            accepted: false,
          });
        }
      }
    }

    // Add suggestions for trivially searchable fragments
    for (const fragment of analysis.crossReferenceRisk.searchableFragments) {
      if (fragment.searchability === 'trivial') {
        suggestions.push({
          id: generateId(),
          type: 'redact',
          priority: priority++,
          originalPhrase: fragment.fragment,
          suggestedReplacement: '[CONTEXT REDACTED]',
          expectedRiskReduction: 15,
          location: {
            sectionId: '', // Would need to track this
            startOffset: 0,
            endOffset: 0,
          },
          rationale: fragment.reason,
          accepted: false,
        });
      }
    }

    return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 10);
  }

  /**
   * Estimate risk reduction from applying a suggestion
   */
  private estimateRiskReduction(
    impact: 'critical' | 'high' | 'medium' | 'low'
  ): number {
    switch (impact) {
      case 'critical':
        return 25;
      case 'high':
        return 15;
      case 'medium':
        return 8;
      case 'low':
        return 3;
    }
  }

  /**
   * Empty semantic fingerprint for when analysis is disabled
   */
  private emptySemanticFingerprint(): SemanticFingerprint {
    return {
      estimatedPopulationSize: WORLD_POPULATION,
      populationDescription: 'Analysis disabled',
      uniquenessDrivers: [],
      riskScore: 0,
      riskLevel: 'minimal',
    };
  }

  /**
   * Empty cross-reference risk for when analysis is disabled
   */
  private emptyCrossReferenceRisk(): CrossReferenceRisk {
    return {
      searchableFragments: [],
      vulnerableSources: [],
      riskScore: 0,
    };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<AdversarialConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AdversarialConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const adversarialVerifier = new AdversarialVerifier();