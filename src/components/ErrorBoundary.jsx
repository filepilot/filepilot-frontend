import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '2rem',
          fontFamily: 'Inter, sans-serif', color: '#1a1a2e',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please refresh the page and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.6rem 1.5rem', background: '#4f46e5', color: '#fff',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
