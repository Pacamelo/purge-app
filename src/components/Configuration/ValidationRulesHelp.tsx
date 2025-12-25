/**
 * ValidationRulesHelp Component
 * Explains why certain patterns might not be detected
 */

import { memo } from 'react';

export const ValidationRulesHelp = memo(function ValidationRulesHelp() {
  return (
    <div className="space-y-4 text-xs text-forge-text-secondary">
      {/* SSN Rules */}
      <div>
        <h4 className="font-mono text-forge-accent uppercase tracking-wider mb-2">
          SSN Validation
        </h4>
        <p className="text-forge-text-dim mb-2">
          SSNs are validated against SSA rules. These are <strong>rejected</strong>:
        </p>
        <ul className="space-y-1 ml-2">
          <li>• <code className="text-forge-warning">000-XX-XXXX</code> — Area 000 never assigned</li>
          <li>• <code className="text-forge-warning">666-XX-XXXX</code> — Reserved, never used</li>
          <li>• <code className="text-forge-warning">9XX-XX-XXXX</code> — 900-999 reserved</li>
          <li>• <code className="text-forge-warning">XXX-00-XXXX</code> — Group 00 never assigned</li>
          <li>• <code className="text-forge-warning">XXX-XX-0000</code> — Serial 0000 never assigned</li>
          <li>• <code className="text-forge-warning">987-65-432X</code> — Reserved for advertising</li>
          <li>• <code className="text-forge-warning">078-05-1120</code> — Woolworth wallet SSN</li>
        </ul>
        <p className="text-forge-text-dim mt-2 italic">
          Test data often uses 987-65-4321 which falls in the advertising range.
        </p>
      </div>

      {/* Credit Card Rules */}
      <div>
        <h4 className="font-mono text-forge-accent uppercase tracking-wider mb-2">
          Credit Card Validation
        </h4>
        <p className="text-forge-text-dim mb-2">
          Cards must pass the <strong>Luhn checksum</strong>. Random 16-digit numbers will fail.
        </p>
        <p className="text-forge-text-dim">
          Valid test numbers: <code>4111111111111111</code> (Visa), <code>5500000000000004</code> (MC)
        </p>
      </div>

      {/* Phone Rules */}
      <div>
        <h4 className="font-mono text-forge-accent uppercase tracking-wider mb-2">
          Phone Validation
        </h4>
        <p className="text-forge-text-dim">
          Must have 10-11 digits. Short numbers or extensions may not match.
        </p>
      </div>

      {/* Name Rules */}
      <div>
        <h4 className="font-mono text-forge-accent uppercase tracking-wider mb-2">
          Name Detection
        </h4>
        <p className="text-forge-text-dim mb-2">
          Names require 2+ words, each starting with capital. Filtered out:
        </p>
        <ul className="space-y-1 ml-2 text-forge-text-dim">
          <li>• Place names: "New York", "San Francisco", etc.</li>
          <li>• Company names: "General Electric", etc.</li>
        </ul>
      </div>

      {/* Sensitivity */}
      <div>
        <h4 className="font-mono text-forge-accent uppercase tracking-wider mb-2">
          Sensitivity Levels
        </h4>
        <ul className="space-y-1 ml-2 text-forge-text-dim">
          <li>• <strong>Low:</strong> Only high-confidence (email, SSN, credit card)</li>
          <li>• <strong>Medium:</strong> Most PII types (default)</li>
          <li>• <strong>High:</strong> Maximum detection, more false positives</li>
        </ul>
      </div>
    </div>
  );
});
