/**
 * SourceCodeLink Component
 *
 * GENUINE PROOF - Transparency for technical users.
 * Direct link to the exact code that processes files.
 */

import { memo, useState } from 'react';

interface SourceCodeLinkProps {
  /** Whether to show the inline code snippet */
  showSnippet?: boolean;
}

// GitHub repository and file paths
const GITHUB_REPO = 'https://github.com/Pacamelo/forge';
const PROCESSING_FILE = 'apps/forge/src/modules/purge/hooks/useDocumentProcessor.ts';
const DETECTION_FILE = 'apps/forge/src/modules/purge/services/detection/RegexDetectionEngine.ts';
const NETWORK_PROOF_FILE = 'apps/forge/src/modules/purge/hooks/useNetworkProof.ts';

// Inline code snippet showing the core processing logic (simplified)
const CODE_SNIPPET = `// useDocumentProcessor.ts - Core processing logic
// No fetch(), no XMLHttpRequest, no network calls

const processFiles = async (files, detections, config) => {
  const results = [];

  for (const file of files) {
    // 1. Parse file locally using SheetJS (xlsx)
    const parsed = await processor.parse(file.file);

    // 2. Apply redactions to in-memory data
    const redactions = buildRedactions(detections, config);
    const blob = await processor.applyRedactions(parsed, redactions);

    // 3. Track memory for later cleanup
    buffers.push(await blob.arrayBuffer());

    // 4. Return processed blob (stays in browser)
    results.push({ ...file, blob });
  }

  return results; // Never leaves the browser
};`;

export const SourceCodeLink = memo(function SourceCodeLink({
  showSnippet = true,
}: SourceCodeLinkProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const files = [
    {
      name: 'useDocumentProcessor.ts',
      description: 'Core file processing logic',
      path: PROCESSING_FILE,
      highlight: 'No fetch() or network calls',
    },
    {
      name: 'RegexDetectionEngine.ts',
      description: 'PII detection patterns',
      path: DETECTION_FILE,
      highlight: 'Pure regex, no external API',
    },
    {
      name: 'useNetworkProof.ts',
      description: 'Network monitoring code',
      path: NETWORK_PROOF_FILE,
      highlight: 'How we detect requests',
    },
  ];

  return (
    <div className="border border-forge-border bg-forge-bg-tertiary">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-forge-bg-secondary transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📖</span>
          <div>
            <h3 className="text-sm font-mono font-bold text-forge-text-primary uppercase tracking-wider">
              Read The Code
            </h3>
            <p className="text-xs text-forge-text-dim">
              Don't trust us? Audit it yourself.
            </p>
          </div>
        </div>
        <span className="text-forge-text-dim text-sm">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-forge-border px-4 py-3 space-y-4">
          {/* Why this matters */}
          <div className="p-3 bg-forge-bg-primary border border-forge-accent/30">
            <p className="text-xs text-forge-text-primary">
              <strong className="text-forge-accent">Open source = transparency.</strong> Every line
              of code that touches your files is public. You can verify there are no hidden network
              calls, no sneaky uploads, no tracking.
            </p>
          </div>

          {/* Code snippet */}
          {showSnippet && (
            <div className="space-y-2">
              <p className="text-xs text-forge-text-dim font-mono uppercase tracking-wider">
                Core Processing Logic (Simplified):
              </p>
              <pre className="p-3 bg-forge-bg-primary border border-forge-border text-xs font-mono overflow-x-auto">
                <code className="text-forge-text-secondary whitespace-pre">{CODE_SNIPPET}</code>
              </pre>
              <p className="text-xs text-forge-text-dim italic">
                Notice: No fetch(), no XMLHttpRequest, no WebSocket. Just local processing.
              </p>
            </div>
          )}

          {/* File links */}
          <div className="space-y-2">
            <p className="text-xs text-forge-text-dim font-mono uppercase tracking-wider">
              Key Files to Audit:
            </p>
            <div className="space-y-2">
              {files.map((file) => (
                <a
                  key={file.path}
                  href={`${GITHUB_REPO}/blob/main/${file.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-forge-bg-secondary border border-forge-border hover:border-forge-accent transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-mono text-forge-text-primary group-hover:text-forge-accent">
                        {file.name}
                      </p>
                      <p className="text-xs text-forge-text-secondary">{file.description}</p>
                    </div>
                    <span className="text-forge-text-dim group-hover:text-forge-accent">↗</span>
                  </div>
                  <p className="text-xs text-forge-success mt-1">✓ {file.highlight}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Full repo link */}
          <div className="pt-3 border-t border-forge-border">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-forge-bg-primary border border-forge-border hover:border-forge-accent text-sm font-mono text-forge-text-primary hover:text-forge-accent transition-colors"
            >
              <span>View Full Repository on GitHub</span>
              <span>↗</span>
            </a>
          </div>

          {/* Caveat */}
          <div className="p-2 bg-forge-bg-primary">
            <p className="text-xs text-forge-text-dim">
              <strong>Note:</strong> This proves the source code is clean. For production
              verification, you could also compare deployed code hashes with the repository.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
