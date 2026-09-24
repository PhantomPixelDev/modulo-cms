import React from 'react';

interface ErrorBoundaryProps {
    name?: string;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Log detailed error so we can see which section failed
        console.error(`ErrorBoundary caught in ${this.props.name || 'UnknownSection'}`, {
            error,
            info,
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div className="my-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                        <strong>{this.props.name || 'Section'} failed to render.</strong>
                        <div className="mt-1 text-xs opacity-80">{this.state.error?.toString()}</div>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
