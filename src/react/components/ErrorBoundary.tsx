import { Component as ReactComponent, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * ErrorBoundary component to catch and display React rendering errors
 *
 * Wraps the application to provide a fallback UI when component errors occur.
 * Prevents the entire app from crashing due to component errors.
 */
export class ErrorBoundary extends ReactComponent<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log error to console in development
		// console.error("React Error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: 20, color: "red", background: "white" }}>
					<h2>Something went wrong:</h2>
					<pre>{this.state.error?.message}</pre>
					<pre>{this.state.error?.stack}</pre>
				</div>
			);
		}

		return this.props.children;
	}
}
