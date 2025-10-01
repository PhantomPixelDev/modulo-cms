import React from 'react';

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Global ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#fff5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: 800,
            width: '100%',
            background: '#fff',
            border: '1px solid #feb2b2',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            padding: 24,
            color: '#742a2a',
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif'
          }}>
            <h1 style={{ marginTop: 0 }}>Rendering error</h1>
            <p>Something crashed while rendering this page.</p>
            <pre style={{
              marginTop: 12,
              background: '#fffaf0',
              border: '1px solid #fbd38d',
              borderRadius: 8,
              padding: 12,
              overflow: 'auto'
            }}>{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
