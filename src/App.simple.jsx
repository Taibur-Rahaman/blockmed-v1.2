// Simple test version to check if React is working
import React from 'react'

function SimpleApp() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: '#fff',
      padding: '40px',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>✅ React is Working!</h1>
      <p style={{ fontSize: '18px', color: '#9ca3af' }}>
        If you see this, React is rendering correctly.
      </p>
      <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '20px' }}>
        The issue is likely in the App component or its dependencies.
      </p>
      <button
        onClick={() => {
          // Try to load the real app
          window.location.reload()
        }}
        style={{
          marginTop: '30px',
          padding: '12px 24px',
          background: '#22c55e',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Try Loading Full App
      </button>
    </div>
  )
}

export default SimpleApp

