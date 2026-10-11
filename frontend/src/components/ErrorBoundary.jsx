import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mb-4 text-[#f5a623]">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong loading this section</h2>
          <p className="text-xs text-neutral-400 max-w-md mb-6">
            We encountered an unexpected display issue. Please try refreshing or returning to discovery.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#d48b17] text-black text-xs font-bold transition shadow-lg shadow-[#f5a623]/25 cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
