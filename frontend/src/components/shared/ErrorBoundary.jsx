import { Component } from 'react';
import './ErrorBoundary.css';

/**
 * Class-based Error Boundary — catches render errors in child tree.
 * Displays a friendly recovery UI instead of a blank page.
 *
 * Props:
 *   fallback   {ReactNode}   - Optional custom fallback UI
 *   onError    {Function}    - Optional error reporter callback(error, info)
 *   children   {ReactNode}
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Report to external service in production
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
    if (import.meta.env.PROD) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-inner">
            <div className="error-boundary-icon" aria-hidden="true">⚠️</div>
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-msg">
              An unexpected error occurred. Please try again.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error details</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
            <div className="error-boundary-actions">
              <button className="btn btn-primary" onClick={this.handleReset}>
                Try Again
              </button>
              <button className="btn btn-ghost" onClick={() => window.location.reload()}>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
