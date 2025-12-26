/**
 * AdversarialFeedback Component
 *
 * Displays the results of adversarial verification - showing the user
 * how confident an attacker would be in re-identifying the subject
 * even after redaction.
 *
 * This is the "shadow attacker" UI that makes Purge feel intelligent.
 */

import { memo, useState } from 'react';
import type {
  AdversarialVerificationResult,
  AdversarialSuggestion,
  LeakedAttribute,
} from '@/core/types';

interface AdversarialFeedbackProps {
  result: AdversarialVerificationResult | null;
  isAnalyzing: boolean;
  onApplySuggestion: (suggestion: AdversarialSuggestion) => void;
  onApplyAllSuggestions: () => void;
  onDismiss: () => void;
  onReanalyze: () => void;
}

/**
 * Risk level color mapping
 */
function getRiskColor(
  level: 'critical' | 'high' | 'medium' | 'low' | 'minimal'
): string {
  switch (level) {
    case 'critical':
      return 'text-red-500 border-red-500 bg-red-500/10';
    case 'high':
      return 'text-orange-500 border-orange-500 bg-orange-500/10';
    case 'medium':
      return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
    case 'low':
      return 'text-blue-500 border-blue-500 bg-blue-500/10';
    case 'minimal':
      return 'text-green-500 border-green-500 bg-green-500/10';
  }
}

/**
 * Risk level icon
 */
function getRiskIcon(level: 'critical' | 'high' | 'medium' | 'low' | 'minimal'): string {
  switch (level) {
    case 'critical':
      return '🚨';
    case 'high':
      return '⚠️';
    case 'medium':
      return '⚡';
    case 'low':
      return '📊';
    case 'minimal':
      return '✅';
  }
}

/**
 * Attribute type icon
 */
function getAttributeIcon(type: LeakedAttribute['type']): string {
  switch (type) {
    case 'profession':
      return '💼';
    case 'affiliation':
      return '🏢';
    case 'temporal_marker':
      return '📅';
    case 'geographic_signal':
      return '📍';
    case 'relational_context':
      return '👥';
    case 'unique_event':
      return '⭐';
    case 'demographic':
      return '👤';
    case 'achievement':
      return '🏆';
    case 'public_role':
      return '🎭';
  }
}

/**
 * Risk meter visualization
 */
const RiskMeter = memo(function RiskMeter({
  confidence,
  previousConfidence,
}: {
  confidence: number;
  previousConfidence?: number;
}) {
  const improvement = previousConfidence ? previousConfidence - confidence : 0;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="relative h-4 bg-forge-bg-tertiary border border-forge-border overflow-hidden">
        {/* Previous position indicator */}
        {previousConfidence && previousConfidence !== confidence && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-forge-text-dim opacity-50 z-10"
            style={{ left: `${previousConfidence}%` }}
          />
        )}

        {/* Current fill */}
        <div
          className={`
            h-full transition-all duration-500 ease-out
            ${confidence >= 80 ? 'bg-red-500' : ''}
            ${confidence >= 60 && confidence < 80 ? 'bg-orange-500' : ''}
            ${confidence >= 40 && confidence < 60 ? 'bg-yellow-500' : ''}
            ${confidence >= 20 && confidence < 40 ? 'bg-blue-500' : ''}
            ${confidence < 20 ? 'bg-green-500' : ''}
          `}
          style={{ width: `${confidence}%` }}
        />

        {/* Percentage label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            {confidence}%
          </span>
        </div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-[10px] font-mono text-forge-text-dim">
        <span>SAFE</span>
        <span>MODERATE</span>
        <span>CRITICAL</span>
      </div>

      {/* Improvement indicator */}
      {improvement > 0 && (
        <div className="text-center text-xs text-green-500 font-mono">
          ↓ {improvement}% improvement from previous analysis
        </div>
      )}
    </div>
  );
});

/**
 * Leaked attribute badge
 */
const AttributeBadge = memo(function AttributeBadge({
  attribute,
  onSuggest,
}: {
  attribute: LeakedAttribute;
  onSuggest?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`
        border border-forge-border bg-forge-bg-tertiary
        transition-all cursor-pointer
        ${expanded ? 'p-3' : 'p-2'}
      `}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <span className="text-sm">{getAttributeIcon(attribute.type)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono text-forge-text-primary truncate">
            "{attribute.phrase}"
          </p>
          {expanded && (
            <>
              <p className="text-xs text-forge-text-secondary mt-1">
                {attribute.explanation}
              </p>
              {attribute.suggestion && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-forge-text-dim">Suggest:</span>
                  <code className="text-xs bg-forge-bg-primary px-1 py-0.5 border border-forge-border">
                    {attribute.suggestion}
                  </code>
                  {onSuggest && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSuggest();
                      }}
                      className="text-xs text-forge-accent hover:underline"
                    >
                      Apply
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <span className="text-xs text-forge-text-dim">{expanded ? '▲' : '▼'}</span>
      </div>
    </div>
  );
});

/**
 * Suggestion card
 */
const SuggestionCard = memo(function SuggestionCard({
  suggestion,
  onApply,
}: {
  suggestion: AdversarialSuggestion;
  onApply: () => void;
}) {
  return (
    <div
      className={`
        p-3 border-l-2
        ${suggestion.type === 'redact' ? 'border-l-red-500 bg-red-500/5' : ''}
        ${suggestion.type === 'generalize' ? 'border-l-yellow-500 bg-yellow-500/5' : ''}
        ${suggestion.type === 'rephrase' ? 'border-l-blue-500 bg-blue-500/5' : ''}
        ${suggestion.type === 'remove' ? 'border-l-orange-500 bg-orange-500/5' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Original → Suggested */}
          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="text-forge-text-dim line-through truncate max-w-[120px]">
              {suggestion.originalPhrase}
            </span>
            <span className="text-forge-text-dim">→</span>
            <span className="text-forge-accent truncate max-w-[120px]">
              {suggestion.suggestedReplacement}
            </span>
          </div>

          {/* Rationale */}
          <p className="text-xs text-forge-text-secondary mt-1">{suggestion.rationale}</p>

          {/* Expected impact */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-green-500 font-mono">
              -{suggestion.expectedRiskReduction}% risk
            </span>
            <span className="text-[10px] text-forge-text-dim uppercase">
              {suggestion.type}
            </span>
          </div>
        </div>

        {/* Apply button */}
        <button
          onClick={onApply}
          disabled={suggestion.accepted}
          className={`
            px-3 py-1.5 text-xs font-mono uppercase tracking-wider
            border transition-colors
            ${
              suggestion.accepted
                ? 'border-green-500 text-green-500 bg-green-500/10 cursor-default'
                : 'border-forge-accent text-forge-accent hover:bg-forge-accent hover:text-forge-bg-primary'
            }
          `}
        >
          {suggestion.accepted ? '✓' : 'Apply'}
        </button>
      </div>
    </div>
  );
});

/**
 * Cross-reference source indicator
 */
const VulnerableSourceBadge = memo(function VulnerableSourceBadge({
  source,
  likelihood,
  dataPoints,
}: {
  source: string;
  likelihood: 'certain' | 'likely' | 'possible' | 'unlikely';
  dataPoints: string[];
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-forge-bg-tertiary border border-forge-border">
      <span
        className={`
          w-2 h-2 rounded-full
          ${likelihood === 'certain' ? 'bg-red-500' : ''}
          ${likelihood === 'likely' ? 'bg-orange-500' : ''}
          ${likelihood === 'possible' ? 'bg-yellow-500' : ''}
          ${likelihood === 'unlikely' ? 'bg-green-500' : ''}
        `}
      />
      <span className="text-xs font-mono text-forge-text-primary">{source}</span>
      <span className="text-[10px] text-forge-text-dim">({dataPoints.length} matches)</span>
    </div>
  );
});

/**
 * Main component
 */
export const AdversarialFeedback = memo(function AdversarialFeedback({
  result,
  isAnalyzing,
  onApplySuggestion,
  onApplyAllSuggestions,
  onDismiss,
  onReanalyze,
}: AdversarialFeedbackProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'leaks' | 'suggestions'>('overview');

  // Loading state
  if (isAnalyzing) {
    return (
      <div className="p-6 border border-forge-border bg-forge-bg-secondary">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-forge-accent border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-mono text-forge-text-primary">
              Running adversarial analysis...
            </p>
            <p className="text-xs text-forge-text-dim">
              Simulating attacker perspective on redacted output
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No result yet
  if (!result) {
    return null;
  }

  const { analysis, suggestions, passesThreshold, riskThreshold } = result;

  return (
    <div className="border border-forge-border bg-forge-bg-secondary">
      {/* ─────────────────────────────────────────────────────────────────
          HEADER - Risk level and main metric
          ───────────────────────────────────────────────────────────────── */}
      <div className={`p-4 border-b ${getRiskColor(analysis.riskLevel)}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getRiskIcon(analysis.riskLevel)}</span>
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider">
                Adversarial Analysis
              </h3>
              <p className="text-xs opacity-80">
                {passesThreshold
                  ? `Passes ${riskThreshold}% threshold`
                  : `Exceeds ${riskThreshold}% threshold`}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-xs opacity-60 hover:opacity-100"
            title="Dismiss"
          >
            ✕
          </button>
        </div>

        {/* Main message */}
        <p className="text-sm mb-4">
          After redaction, an attacker could identify this individual with{' '}
          <strong>{analysis.reidentificationConfidence}%</strong> confidence.
        </p>

        {/* Risk meter */}
        <RiskMeter
          confidence={analysis.reidentificationConfidence}
          previousConfidence={result.previousConfidence}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          TABS - Navigate between views
          ───────────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-forge-border">
        {(['overview', 'leaks', 'suggestions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 px-4 py-2 text-xs font-mono uppercase tracking-wider
              transition-colors
              ${
                activeTab === tab
                  ? 'bg-forge-bg-tertiary text-forge-text-primary border-b-2 border-forge-accent'
                  : 'text-forge-text-dim hover:text-forge-text-secondary hover:bg-forge-bg-tertiary'
              }
            `}
          >
            {tab}
            {tab === 'leaks' && (
              <span className="ml-1 opacity-60">({analysis.leakedAttributes.length})</span>
            )}
            {tab === 'suggestions' && (
              <span className="ml-1 opacity-60">({suggestions.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          TAB CONTENT
          ───────────────────────────────────────────────────────────────── */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Population estimate */}
            <div className="p-3 bg-forge-bg-tertiary border border-forge-border">
              <p className="text-xs text-forge-text-dim uppercase tracking-wider mb-1">
                Population Estimate
              </p>
              <p className="text-lg font-mono text-forge-text-primary">
                {analysis.semanticFingerprint.estimatedPopulationSize.toLocaleString()} people
              </p>
              <p className="text-xs text-forge-text-secondary">
                {analysis.semanticFingerprint.populationDescription}
              </p>
            </div>

            {/* Top uniqueness drivers */}
            {analysis.semanticFingerprint.uniquenessDrivers.length > 0 && (
              <div>
                <p className="text-xs text-forge-text-dim uppercase tracking-wider mb-2">
                  What's making this unique
                </p>
                <div className="space-y-2">
                  {analysis.semanticFingerprint.uniquenessDrivers.slice(0, 3).map((driver, i) => (
                    <div
                      key={i}
                      className={`
                        flex items-center gap-2 p-2 border-l-2
                        ${driver.impact === 'critical' ? 'border-l-red-500 bg-red-500/5' : ''}
                        ${driver.impact === 'high' ? 'border-l-orange-500 bg-orange-500/5' : ''}
                        ${driver.impact === 'medium' ? 'border-l-yellow-500 bg-yellow-500/5' : ''}
                        ${driver.impact === 'low' ? 'border-l-blue-500 bg-blue-500/5' : ''}
                      `}
                    >
                      <span
                        className={`
                          text-[10px] font-mono uppercase px-1 py-0.5
                          ${driver.impact === 'critical' ? 'text-red-500' : ''}
                          ${driver.impact === 'high' ? 'text-orange-500' : ''}
                          ${driver.impact === 'medium' ? 'text-yellow-500' : ''}
                          ${driver.impact === 'low' ? 'text-blue-500' : ''}
                        `}
                      >
                        {driver.impact}
                      </span>
                      <span className="text-sm font-mono text-forge-text-primary truncate">
                        "{driver.phrase}"
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vulnerable sources */}
            {analysis.crossReferenceRisk.vulnerableSources.length > 0 && (
              <div>
                <p className="text-xs text-forge-text-dim uppercase tracking-wider mb-2">
                  Cross-reference vulnerability
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.crossReferenceRisk.vulnerableSources.map((source, i) => (
                    <VulnerableSourceBadge
                      key={i}
                      source={source.source}
                      likelihood={source.matchLikelihood}
                      dataPoints={source.dataPoints}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Processing time */}
            <p className="text-[10px] text-forge-text-dim text-right">
              Analysis completed in {analysis.processingTimeMs.toFixed(0)}ms
            </p>
          </div>
        )}

        {/* Leaks Tab */}
        {activeTab === 'leaks' && (
          <div className="space-y-2">
            {analysis.leakedAttributes.length === 0 ? (
              <p className="text-sm text-forge-text-secondary text-center py-4">
                No identifying attributes detected in redacted output.
              </p>
            ) : (
              analysis.leakedAttributes.map((attr, i) => (
                <AttributeBadge key={i} attribute={attr} />
              ))
            )}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-3">
            {suggestions.length === 0 ? (
              <p className="text-sm text-forge-text-secondary text-center py-4">
                No additional suggestions. The current redaction level is acceptable.
              </p>
            ) : (
              <>
                {/* Apply all button */}
                <button
                  onClick={onApplyAllSuggestions}
                  className="w-full py-2 text-xs font-mono uppercase tracking-wider
                             border border-forge-accent text-forge-accent
                             hover:bg-forge-accent hover:text-forge-bg-primary
                             transition-colors"
                >
                  [ Apply All Suggestions ]
                </button>

                {/* Individual suggestions */}
                {suggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onApply={() => onApplySuggestion(suggestion)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          FOOTER - Actions
          ───────────────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-forge-border flex items-center justify-between">
        <button
          onClick={onReanalyze}
          className="text-xs text-forge-text-dim hover:text-forge-text-secondary"
        >
          ↻ Re-analyze
        </button>
        <p className="text-[10px] text-forge-text-dim">
          Iteration {result.iteration} · Threshold: {riskThreshold}%
        </p>
      </div>
    </div>
  );
});
