/**
 * PurgeErrorBoundary Component
 *
 * Error boundary for the PURGE module that catches JavaScript errors
 * and displays a fallback UI instead of crashing the entire application.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { secureError } from '@/core/utils/secureLogger';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class PurgeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log error securely - do NOT log errorInfo as it may contain PII in component stack
    secureError('Module error', error);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full bg-forge-bg-primary flex flex-col items-center justify-center p-8 font-mono">
          {/* Error Icon */}
          <div className="text-6xl text-forge-error mb-6 animate-pulse">
            ⚠
          </div>

          {/* Error Title */}
          <h1 className="text-2xl text-forge-error font-bold uppercase tracking-wider mb-4">
            [ PAPER JAM - CRITICAL ]
          </h1>

          {/* Error Description */}
          <div className="max-w-lg text-center mb-8">
            <p className="text-forge-text-secondary mb-4">
              The shredder has encountered an unexpected error and needs to be reset.
            </p>
            <p className="text-forge-text-dim text-sm">
              Don't worry - your files were never uploaded anywhere. All processing
              happens locally in your browser.
            </p>
          </div>

          {/* Error Details (collapsed by default) */}
          <details className="mb-8 w-full max-w-lg">
            <summary className="cursor-pointer text-forge-text-dim text-sm uppercase tracking-wider hover:text-forge-text-secondary">
              Technical Details
            </summary>
            <div className="mt-4 p-4 bg-forge-bg-secondary border border-forge-border overflow-auto max-h-48">
              <p className="text-forge-error text-sm font-mono mb-2">
                {this.state.error?.message || 'Unknown error'}
              </p>
              {this.state.error?.stack && (
                <pre className="text-forge-text-dim text-xs whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          </details>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={this.handleReset}
              className="px-6 py-3 text-sm font-mono uppercase tracking-wider
                         bg-forge-accent/20 border-2 border-forge-accent
                         text-forge-accent hover:bg-forge-accent hover:text-forge-bg-primary
                         shadow-[3px_3px_0px_0px] shadow-forge-accent/50
                         active:shadow-none active:translate-x-[3px] active:translate-y-[3px]
                         transition-all"
            >
              [ TRY AGAIN ]
            </button>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 text-sm font-mono uppercase tracking-wider
                         bg-forge-bg-tertiary border border-forge-border
                         text-forge-text-secondary hover:text-forge-accent hover:border-forge-accent
                         shadow-[3px_3px_0px_0px] shadow-forge-bg-primary
                         active:shadow-none active:translate-x-[3px] active:translate-y-[3px]
                         transition-all"
            >
              [ RELOAD PAGE ]
            </button>
          </div>

          {/* Privacy Reminder */}
          <div className="mt-8 p-4 border border-forge-border bg-forge-bg-secondary max-w-lg">
            <p className="text-xs text-forge-text-dim text-center">
              <span className="text-forge-success">●</span> No data was transmitted.
              All processing occurred locally in your browser.
              You can verify this in DevTools (F12 → Network tab).
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
