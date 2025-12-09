import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Error caught by boundary:', error)
    console.error('Error details:', errorInfo)
    console.error('Error stack:', error.stack)
    this.setState({
      error,
      errorInfo
    })
  }
  
  componentDidMount() {
    console.log('✅ ErrorBoundary mounted successfully')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#fff',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#ef4444' }}>
              ⚠️ Application Error
            </h1>
            <p style={{ marginBottom: '16px', color: '#9ca3af' }}>
              Something went wrong. Please check the console for details.
            </p>
            {this.state.error && (
              <details style={{
                marginTop: '16px',
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                  Error Details
                </summary>
                <div style={{ color: '#ef4444', marginBottom: '12px' }}>
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <pre style={{
                    color: '#9ca3af',
                    overflow: 'auto',
                    maxHeight: '300px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null })
                window.location.reload()
              }}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
