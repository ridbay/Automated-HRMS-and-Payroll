import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component tree:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2rem] border border-slate-200 p-8 text-center shadow-xl shadow-slate-100">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-100">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500 font-medium mb-6">
              An unexpected error occurred while rendering this section. You can try refreshing or returning to the dashboard.
            </p>

            {this.state.error?.message && (
              <div className="bg-slate-50 p-4 rounded-xl text-left text-xs font-mono text-slate-600 mb-6 border border-slate-100 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                <Home size={14} /> Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
