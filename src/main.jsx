import React from 'react'
import ReactDOM from 'react-dom/client'

// Import CSS first (critical for styling)
import './index.css'

console.log('🚀 BlockMed V2 - Starting application...')
console.log('📦 React version:', React.version)
console.log('📦 ReactDOM available:', !!ReactDOM)

// Import i18n separately to catch any errors
let i18nLoaded = false
try {
  import('./i18n').then(() => {
    i18nLoaded = true
    console.log('✅ i18n loaded')
  }).catch(err => {
    console.error('❌ i18n failed to load:', err)
  })
} catch (err) {
  console.error('❌ i18n import error:', err)
}

// Lazy load other components to isolate issues
let App, ErrorBoundary, Toaster

// Check if root element exists
const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('❌ Root element not found! Check index.html')
  document.body.innerHTML = '<div style="padding: 20px; color: #fff; background: #0f172a; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui;">Error: Root element not found. Check index.html</div>'
} else {
  console.log('✅ Root element found:', rootElement)
  
  // IMMEDIATELY render something to test React
  console.log('🧪 Step 1: Testing if React can render at all...')
  try {
    const root = ReactDOM.createRoot(rootElement)
    console.log('✅ React root created')
    
    // Render a simple test component FIRST
    root.render(
      React.createElement('div', {
        style: {
          padding: '40px',
          color: '#fff',
          background: '#0f172a',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '20px',
          fontFamily: 'system-ui'
        }
      }, [
        React.createElement('h1', {
          key: 'title',
          style: { fontSize: '32px', color: '#22c55e', margin: 0 }
        }, '✅ React is Working!'),
        React.createElement('p', {
          key: 'msg',
          style: { color: '#9ca3af', fontSize: '18px' }
        }, 'Loading BlockMed application...'),
        React.createElement('div', {
          key: 'spinner',
          style: {
            width: '40px',
            height: '40px',
            border: '4px solid rgba(34, 197, 94, 0.3)',
            borderTop: '4px solid #22c55e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }
        })
      ])
    )
    
    // Add spinner animation
    const style = document.createElement('style')
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }'
    document.head.appendChild(style)
    
    console.log('✅ Test render complete - you should see "React is Working!"')
    
    // Now load the actual app components
    Promise.all([
      import('./App').then(m => { App = m.default; console.log('✅ App loaded') }),
      import('./components/ErrorBoundary').then(m => { ErrorBoundary = m.default; console.log('✅ ErrorBoundary loaded') }),
      import('react-hot-toast').then(m => { Toaster = m.Toaster; console.log('✅ Toaster loaded') })
    ]).then(() => {
      console.log('✅ All components loaded, rendering full app...')
      
      // Wait a moment for i18n if it's still loading
      setTimeout(() => {
        try {
          root.render(
            React.createElement(React.StrictMode, null,
              React.createElement(ErrorBoundary, null,
                React.createElement(App),
                React.createElement(Toaster, {
                  position: "top-right",
                  toastOptions: {
                    className: 'custom-toast',
                    duration: 4000,
                    style: {
                      background: 'rgba(15, 23, 42, 0.95)',
                      color: '#fff',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '16px',
                    },
                    success: {
                      iconTheme: {
                        primary: '#22c55e',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }
                })
              )
            )
          )
          console.log('✅ Full app rendered!')
        } catch (renderError) {
          console.error('❌ Error rendering full app:', renderError)
          root.render(
            React.createElement('div', {
              style: {
                padding: '40px',
                color: '#fff',
                background: '#0f172a',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            },
              React.createElement('div', {
                style: { maxWidth: '600px', textAlign: 'center' }
              }, [
                React.createElement('h1', {
                  key: 'error-title',
                  style: { color: '#ef4444', marginBottom: '20px' }
                }, '❌ Render Error'),
                React.createElement('p', {
                  key: 'error-msg',
                  style: { color: '#9ca3af', marginBottom: '16px' }
                }, renderError.message),
                React.createElement('button', {
                  key: 'reload-btn',
                  onClick: () => window.location.reload(),
                  style: {
                    padding: '12px 24px',
                    background: '#22c55e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }
                }, 'Reload')
              ])
            )
          )
        }
      }, 500)
      
    }).catch(err => {
      console.error('❌ Failed to load components:', err)
      root.render(
        React.createElement('div', {
          style: {
            padding: '40px',
            color: '#fff',
            background: '#0f172a',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        },
          React.createElement('div', {
            style: { maxWidth: '600px', textAlign: 'center' }
          }, [
            React.createElement('h1', {
              key: 'error-title',
              style: { color: '#ef4444', marginBottom: '20px' }
            }, '❌ Component Load Error'),
            React.createElement('p', {
              key: 'error-msg',
              style: { color: '#9ca3af', marginBottom: '16px' }
            }, err.message),
            React.createElement('button', {
              key: 'reload-btn',
              onClick: () => window.location.reload(),
              style: {
                padding: '12px 24px',
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }
            }, 'Reload')
          ])
        )
      )
    })
    
  } catch (error) {
    console.error('❌ CRITICAL: Failed to create React root')
    console.error('Error:', error)
    rootElement.innerHTML = `
      <div style="padding: 40px; color: #fff; background: #0f172a; min-height: 100vh; font-family: system-ui; display: flex; align-items: center; justify-content: center;">
        <div style="max-width: 600px; text-align: center;">
          <h1 style="color: #ef4444; margin-bottom: 20px; font-size: 24px;">❌ Critical Error</h1>
          <p style="color: #9ca3af; margin-bottom: 16px;">${error.message}</p>
          <pre style="color: #6b7280; font-size: 12px; text-align: left; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; overflow: auto; max-height: 300px;">${error.stack}</pre>
          <button onclick="window.location.reload()" style="padding: 12px 24px; background: #22c55e; color: #fff; border: none; border-radius: 8px; cursor: pointer; margin-top: 20px; font-size: 14px; font-weight: 600;">
            Reload Page
          </button>
        </div>
      </div>
    `
  }
}
