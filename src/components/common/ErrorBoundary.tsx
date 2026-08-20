import React from 'react';
import { AlertTriangle, FileUp, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * Changing this value clears a captured error. Feed it whatever identifies
   * "the thing being rendered" (the file plus the active category) so moving to
   * an unaffected part of the document recovers on its own, instead of leaving
   * the fallback stuck on screen.
   */
  resetKey?: string | number;
  /** Invoked by the "Load a different file" affordance in the fallback. */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * A render crash anywhere below this boundary used to white-screen the whole
 * app: React unmounts the entire tree when nothing catches. A malformed
 * document producing one unexpected value is not a reason to lose the header,
 * the sidebar and the loaded file, so the fallback stays inside the layout and
 * offers a way forward.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Client-side only app: the console is the whole reporting pipeline.
    console.error('Render error caught by ErrorBoundary:', error, errorInfo.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.error !== null && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  private handleLoadDifferentFile = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    const { error } = this.state;
    const { children, onReset } = this.props;

    if (!error) {
      return children;
    }

    const message = error.message?.trim() || 'The view threw an error with no message.';

    return (
      <div
        role="alert"
        className="w-full max-w-2xl mx-auto rounded-lg border border-status-danger/40 bg-surface-raised p-6 sm:p-8 shadow-deep"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 shrink-0 rounded-md bg-status-danger/15 text-status-danger flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-content-primary font-heading">
              This view stopped rendering
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">
              Your document was read, but one of the values it contains could not be displayed. The failure is
              contained here - the file never left your browser and the rest of the specification is still
              loaded.
            </p>

            <div className="mt-4 rounded-md border border-line-subtle bg-surface-inset p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
                What went wrong
              </div>
              <p className="mt-1 font-mono text-xs leading-relaxed text-content-secondary break-words">
                {message}
              </p>
            </div>

            <ul className="mt-4 space-y-1.5 text-xs leading-relaxed text-content-muted">
              <li>Pick another category in the sidebar - the rest of the document is unaffected.</li>
              <li>Reload this view if the failure looked transient.</li>
              <li>Load a different file if this document is malformed.</li>
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-xs font-bold text-accent-contrast transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reload this view</span>
              </button>

              {onReset && (
                <button
                  type="button"
                  onClick={this.handleLoadDifferentFile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-surface-overlay hover:bg-surface-inset border border-line hover:border-accent/40 text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors"
                >
                  <FileUp className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Load a different file</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
