/**
 * CanvasErrorBoundary Component
 *
 * Lightweight error boundary specifically for canvas-based visualizations.
 * Displays a graceful fallback if the canvas fails to render.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { secureWarn } from '@/core/utils/secureLogger';

interface Props {
  children: ReactNode;
  size: number;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    // Log error securely - do NOT log errorInfo as it may contain PII in component stack
    secureWarn('Canvas visualization error', error);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: null });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="bg-forge-bg-tertiary border border-forge-border flex flex-col items-center justify-center p-4"
          style={{ width: this.props.size, height: this.props.size }}
        >
          <div className="text-2xl text-forge-text-dim mb-2">⚠</div>
          <div className="text-xs text-forge-text-secondary font-mono text-center mb-2">
            Visualization unavailable
          </div>
          <button
            onClick={this.handleRetry}
            className="text-xs text-forge-accent hover:underline font-mono"
          >
            [Retry]
          </button>
          {this.state.errorMessage && (
            <div className="mt-2 text-[10px] text-forge-text-dim max-w-full overflow-hidden text-ellipsis">
              {this.state.errorMessage.slice(0, 50)}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
