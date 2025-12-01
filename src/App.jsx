import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

// Store
import { useStore } from './store/useStore'

// Layout & Auth
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'

// Pages
import Dashboard from './pages/Dashboard'
import CreatePrescription from './pages/CreatePrescription'
import PharmacyVerification from './pages/PharmacyVerification'
import PatientPortal from './pages/PatientPortal'
import MedicineManagement from './pages/MedicineManagement'
import BatchManagement from './pages/BatchManagement'
import UserManagement from './pages/UserManagement'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

function App() {
  const { i18n } = useTranslation()
  const { account, language, isOnline, setOnlineStatus } = useStore()

  // Update language when store changes
  useEffect(() => {
    i18n.changeLanguage(language)
    document.body.classList.toggle('bn', language === 'bn')
  }, [language, i18n])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnlineStatus])

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
                <Route path="/patient" element={<PatientPortal />} />
                <Route path="/medicines" element={<MedicineManagement />} />
                <Route path="/batches" element={<BatchManagement />} />
                <Route path="/users" element={<UserManagement />} />
                {/* Analytics and Settings disabled - Coming Soon */}
                <Route path="/analytics" element={<Navigate to="/" replace />} />
                <Route path="/settings" element={<Navigate to="/" replace />} />
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
