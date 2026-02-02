import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiHome, FiFileText, FiCheckCircle, FiUsers, FiPackage,
  FiBox, FiPieChart, FiSettings, FiBell, FiMenu, FiX,
  FiLogOut, FiGlobe, FiChevronDown, FiUser, FiMoon, FiSun, FiActivity, FiLayers
} from 'react-icons/fi'
import { useStore } from '../store/useStore'
import { shortenAddress, getRoleName, getRoleColorClass, hasFeatureAccess } from '../utils/helpers'
import { disableDevMode } from '../utils/devMode'
import { useBlockchain } from '../hooks/useBlockchain'

const Layout = ({ children }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const {
    account, user, role, logout,
    language, toggleLanguage,
    theme, toggleTheme,
    sidebarOpen, toggleSidebar,
    notifications, unreadCount
  } = useStore()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { connected, networkName, isDevMode: devMode, refresh } = useBlockchain()

  const handleLogout = () => {
    // Disable Dev Mode if enabled
    try {
      disableDevMode()
    } catch (e) {
      console.log('Error disabling dev mode:', e)
    }
    
    // Clear logout
    logout()
    
    // Navigate to login
    navigate('/')
  }

  const navItems = [
    { path: '/', icon: FiHome, label: t('nav.dashboard'), roles: [1, 2, 3, 4, 5, 6], accessControl: null },
    { path: '/prescription/create', icon: FiFileText, label: t('nav.createPrescription'), roles: [1, 2], accessControl: 'canCreatePrescription' },
    { path: '/templates', icon: FiLayers, label: 'Templates', roles: [1, 2], accessControl: 'canCreatePrescription' },
    { path: '/pharmacy', icon: FiCheckCircle, label: t('nav.verification'), roles: [1, 2, 3, 5], accessControl: 'canDispense' },
    { path: '/patient-history', icon: FiUser, label: 'Patient History (NID)', roles: [1, 2, 3, 5], accessControl: null },
    { path: '/patient', icon: FiUser, label: t('nav.patients'), roles: [1, 2, 5], accessControl: null },
    { path: '/medicines', icon: FiPackage, label: t('nav.medicines'), roles: [1, 2, 3], accessControl: null },
    { path: '/batches', icon: FiBox, label: t('nav.batches'), roles: [1, 4, 6], accessControl: 'canCreateBatch' },
    { path: '/users', icon: FiUsers, label: t('nav.users'), roles: [1], accessControl: 'canManageUsers' }, // Super Admin only
    { path: '/analytics', icon: FiPieChart, label: t('nav.analytics'), roles: [1, 6], accessControl: 'canViewAnalytics' },
    { path: '/activity', icon: FiActivity, label: 'Activity Log', roles: [1, 2, 3, 4, 5, 6], accessControl: null },
    { path: '/settings', icon: FiSettings, label: t('nav.settings'), roles: [1, 2, 3, 4, 5, 6], accessControl: null },
  ]

  // Filter nav items based on role and access control
  const filteredNavItems = navItems.filter(item => {
    // Check role
    if (role && !item.roles.includes(role) && role !== 1) return false
    
    // Check access control
    if (item.accessControl && account) {
      return hasFeatureAccess(account, item.accessControl)
    }
    
    return true
  })

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed lg:static inset-y-0 left-0 z-40 w-[280px] glass-dark border-r border-white/10"
          >
            {/* Logo */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-xl shadow-neon">
                  🏥
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">BlockMed</h1>
                  <p className="text-xs text-gray-400">V2.0</p>
                </div>
              </Link>
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path
                
                if (item.disabled) {
                  return (
                    <div
                      key={item.path}
                      className="nav-item opacity-50 cursor-not-allowed"
                      title="Coming Soon"
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )
                }
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full"
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* User Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-dark-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                  {user?.name?.[0] || account?.[2]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {shortenAddress(account)}
                  </p>
                </div>
                <span className={`badge ${getRoleColorClass(role)} text-xs`}>
                  {getRoleName(role)}
                </span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 glass-dark border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 lg:hidden"
            >
              <FiMenu size={24} />
            </button>
            
            {/* Breadcrumb / Page Title */}
            <div>
              <h2 className="text-lg font-semibold text-white">
                {filteredNavItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Blockchain connection status - trust indicator */}
            {account && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                  connected ? 'bg-primary-500/10 border-primary-500/30' : 'bg-amber-500/10 border-amber-500/30'
                }`}
                title={connected ? `Verified on blockchain • ${networkName}` : 'Reconnecting...'}
              >
                <FiLayers size={14} className={connected ? 'text-primary-400' : 'text-amber-400 animate-pulse'} />
                <span className={`text-xs font-medium hidden sm:inline ${
                  connected ? 'text-primary-300' : 'text-amber-300'
                }`}>
                  {connected ? (devMode ? 'Hardhat • On-chain' : `${networkName} • Verified`) : '…'}
                </span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  connected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
                }`} />
              </div>
            )}
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn-icon"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {/* Language Toggle - Disabled for now
            <button
              onClick={toggleLanguage}
              className="btn-icon flex items-center gap-2"
              title={language === 'en' ? 'Switch to Bangla' : 'Switch to English'}
            >
              <FiGlobe size={18} />
              <span className="text-sm font-medium">{language === 'en' ? 'EN' : 'বাং'}</span>
            </button>
            */}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn-icon relative"
              >
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/10">
                      <h3 className="font-semibold text-white">{t('nav.notifications')}</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-400">
                          <FiBell size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b border-white/5 hover:bg-white/5 ${
                              !notif.read ? 'bg-primary-500/10' : ''
                            }`}
                          >
                            <p className="text-sm text-white">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notif.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.[0] || account?.[2]?.toUpperCase() || '?'}
                </div>
                <FiChevronDown size={16} className="text-gray-400" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/10">
                      <p className="font-medium text-white">{user?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400 mt-1 truncate">{account}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-gray-300"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FiSettings size={16} />
                        <span>{t('nav.settings')}</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-400"
                      >
                        <FiLogOut size={16} />
                        <span>{t('auth.disconnect')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default Layout

