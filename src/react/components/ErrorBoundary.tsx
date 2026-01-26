import { Component as ReactComponent, ErrorInfo, ReactNode } from "react";
import i18n from "i18next";

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to wrap with error handling */
  children: ReactNode;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error object if one was caught */
  error: Error | null;
}

/**
 * ErrorBoundary component - React error boundary
 * Catches and displays React rendering errors to prevent full application crash.
 * Provides a fallback UI with error details when component errors occur.
 *
 * Features:
 * - Catches errors in child component tree
 * - Displays error message and stack trace
 * - Prevents entire app from white-screening
 * - Logs errors to console in development
 *
 * This is a class component because React error boundaries
 * must be class components (no hook equivalent exists).
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends ReactComponent<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * Creates an ErrorBoundary instance
   * @param {ErrorBoundaryProps} props - Component props
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Static lifecycle method to derive state from error
   * Called when an error is thrown in a child component
   *
   * @param {Error} error - The error that was thrown
   * @returns {ErrorBoundaryState} New state with error information
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Lifecycle method called after an error is caught
   * Used for logging and side effects
   *
   * @param {Error} error - The error that was thrown
   * @param {ErrorInfo} errorInfo - React error info with component stack
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    // console.error("React Error:", error, errorInfo);
  }

  /**
   * Renders either the error fallback UI or children
   * @returns {ReactNode} Error UI or children
   */
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: "red", background: "white" }}>
          <h2>{i18n.t("Something went wrong:")}</h2>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
