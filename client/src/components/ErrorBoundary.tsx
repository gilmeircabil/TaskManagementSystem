import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * H-03: React Error Boundary
 * Catches unhandled runtime exceptions and displays a user-friendly recovery UI
 * rather than unmounting the React tree to a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="full-screen-loader" role="alert">
          <div className="card" style={{ maxWidth: 440, textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.75rem', color: 'var(--danger)' }}>Something went wrong</h2>
            <p className="muted" style={{ marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
              An unexpected application error occurred. We apologize for the inconvenience.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  textAlign: 'left',
                  overflowX: 'auto',
                  marginBottom: '1.5rem',
                  maxHeight: 120,
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <button type="button" className="btn btn-primary btn-block" onClick={this.handleReload}>
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
