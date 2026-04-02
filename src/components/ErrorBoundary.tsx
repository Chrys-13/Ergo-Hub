import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Firestore Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-xl border border-primary/10 text-center space-y-6">
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="text-primary" size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-[#1a1a1a]">Something went wrong</h2>
              <p className="text-primary/60 font-serif italic text-sm">
                {isFirestoreError ? "We encountered a permission or data issue." : "The application encountered an unexpected error."}
              </p>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-xl text-left">
              <p className="text-xs font-mono text-primary/80 break-all">
                {errorMessage}
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full bg-primary text-white py-4 rounded-2xl font-serif flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <RefreshCw size={18} />
              Reset Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
