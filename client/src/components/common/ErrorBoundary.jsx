/**
 * Error Boundary Component
 * Catches and displays errors from child components
 */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="w-full max-w-md rounded-2xl border border-danger-200 bg-white shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-danger-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-danger-600 mb-2">
              Application Error
            </p>
            <h1 className="text-2xl font-black text-slate-900 mb-3">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-600 mb-7 leading-relaxed">
              We encountered an unexpected error. Try refreshing the page. If the problem persists, please check the browser console for more details.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-sm font-bold uppercase tracking-wide shadow-md hover:shadow-lg hover:from-sky-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-all duration-200 active:scale-95"
            >
              Reload Page
            </button>
            <details className="mt-6 text-left">
              <summary className="text-xs font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition">
                Error Details
              </summary>
              <pre className="mt-3 p-3 bg-slate-100 rounded-lg text-xs text-slate-700 overflow-auto max-h-40 font-mono">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
