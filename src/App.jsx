import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

// Store
import { useStore } from './store/useStore'
import { isUserRestricted, getUserRestriction, hasFeatureAccess } from './utils/helpers'

// Layout & Auth
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'

// Pages
import Dashboard from './pages/Dashboard'
import CreatePrescription from './pages/CreatePrescription'
import PharmacyVerification from './pages/PharmacyVerification'
import PatientHistory from './pages/PatientHistory'
import PatientPortal from './pages/PatientPortal'
import MedicineManagement from './pages/MedicineManagement'
import BatchManagement from './pages/BatchManagement'
import UserManagement from './pages/UserManagement'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import ActivityLog from './pages/ActivityLog'
import PrescriptionTemplates from './pages/PrescriptionTemplates'

function App() {
  console.log('🎨 App component rendering...')
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState(null)
  
  // Use hooks unconditionally (React rules) - must be called every render
  const { i18n } = useTranslation()
  const { account, language, theme, isOnline, setOnlineStatus, logout } = useStore()
  
  console.log('✅ Hooks accessed, account:', account ? 'connected' : 'not connected', 'isInitialized:', isInitialized)

  // Check if user is restricted or force-logged out
  useEffect(() => {
    if (account) {
      // Check force logout
      if (sessionStorage.getItem(`blockmed-force-logout-${account}`) === 'true') {
        sessionStorage.removeItem(`blockmed-force-logout-${account}`)
        logout()
        window.location.href = '/'
        return
      }

      // Check restriction
      if (isUserRestricted(account)) {
        const restriction = getUserRestriction(account)
        console.warn('User is restricted:', restriction)
      }
    }
  }, [account, logout])

  // Initialize app
  useEffect(() => {
    console.log('🔄 App useEffect triggered')
    const init = async () => {
      try {
        console.log('🔄 Starting app initialization...')
        // Small delay to ensure all modules are loaded
        await new Promise(resolve => setTimeout(resolve, 50))
        setIsInitialized(true)
        console.log('✅ App initialized successfully, isInitialized set to true')
      } catch (error) {
        console.error('❌ App initialization error:', error)
        setError(error)
        setIsInitialized(true) // Still show app even if there's an error
      }
    }
    init()
  }, [])

  // Update language when store changes
  useEffect(() => {
    try {
      if (i18n && language) {
        i18n.changeLanguage(language)
        document.body.classList.toggle('bn', language === 'bn')
      }
    } catch (error) {
      console.error('Error changing language:', error)
    }
  }, [language, i18n])

  // Update theme when store changes
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme)
      document.body.classList.toggle('light-theme', theme === 'light')
    } catch (error) {
      console.error('Error changing theme:', error)
    }
  }, [theme])

  // Monitor online status
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleOnline = () => {
      try {
        setOnlineStatus(true)
      } catch (e) {
        console.error('Error setting online status:', e)
      }
    }
    const handleOffline = () => {
      try {
        setOnlineStatus(false)
      } catch (e) {
        console.error('Error setting offline status:', e)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnlineStatus])

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#fff',
        padding: '20px',
        fontFamily: 'system-ui'
      }}>
        <div style={{
          maxWidth: '600px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '32px'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '16px', fontSize: '24px' }}>⚠️ Application Error</h1>
          <p style={{ color: '#9ca3af', marginBottom: '12px' }}>
            {error?.message || error?.toString() || 'An error occurred'}
          </p>
          <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '16px' }}>
            Check the browser console (F12) for more details.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '16px',
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

  if (!isInitialized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(34, 197, 94, 0.3)',
            borderTop: '4px solid #22c55e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Loading BlockMed V2...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <Router>
      <AnimatePresence mode="wait">
        {!account ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoginPage />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Layout>
              {/* Offline Banner */}
              {!isOnline && (
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 text-yellow-900 text-center py-2 text-sm font-medium"
                >
                  ⚠️ You are currently offline. Some features may be limited.
                </motion.div>
              )}

              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/prescription/create" element={<CreatePrescription />} />
                <Route path="/pharmacy" element={<PharmacyVerification />} />
                <Route path="/patient-history" element={<PatientHistory />} />
                <Route path="/patient" element={<PatientPortal />} />
                <Route path="/medicines" element={<MedicineManagement />} />
                <Route path="/batches" element={<BatchManagement />} />
                <Route path="/users" element={<UserManagement />} />
                {/* Analytics and Settings enabled */}
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/activity" element={<ActivityLog />} />
                <Route path="/templates" element={<PrescriptionTemplates />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </motion.div>
        )}
      </AnimatePresence>
    </Router>
  )
}

export default App
