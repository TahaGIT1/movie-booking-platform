import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Catches render-time errors anywhere below it.
 *
 * Without this, a single bad property access in a deeply nested component
 * unmounts the entire React tree and leaves the user staring at a blank white
 * page with no way back. This keeps the failure local and recoverable.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surfacing this to the console is what makes the bug findable in dev.
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null, info: null });
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[#0a0b0e]">
        <div className="w-full max-w-lg bg-[#11131c] border border-white/10 rounded-2xl p-8 text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-xl font-heading font-black text-white">
              This page hit a snag
            </h1>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Something in the page failed to render. The rest of the app is still
              working — you can retry, or head back to the catalogue.
            </p>
          </div>

          {isDev && (
            <pre className="text-left text-[11px] font-mono text-red-300 bg-black/40 border border-red-500/20 rounded-xl p-4 overflow-auto max-h-48 whitespace-pre-wrap break-words">
              {String(error?.message || error)}
            </pre>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black font-semibold text-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;