import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import {
  FiUsers, FiUserCheck, FiUserX, FiSearch, FiFilter,
  FiRefreshCw, FiShield, FiClock, FiLock, FiUnlock,
  FiAlertTriangle, FiX, FiCalendar, FiEdit2, FiSave,
  FiXCircle, FiCheckCircle, FiFileText, FiPackage, FiPieChart
} from 'react-icons/fi'

import { useStore } from '../store/useStore'
import { CONTRACT_ADDRESS, ROLE_NAMES, ROLE_COLORS, ROLES } from '../utils/config'
import contractABI from '../utils/contractABI.json'
import { formatTimestamp, shortenAddress, getRoleName, getRoleColorClass } from '../utils/helpers'
import { getReadContract, getWriteContract, isBlockchainReady } from '../utils/contractHelper'
import { isDevMode } from '../utils/devMode'

const UserManagement = () => {
  const { t } = useTranslation()
  const { account, role } = useStore()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, verified, inactive, restricted
  const [searchQuery, setSearchQuery] = useState('')
  const [processingUser, setProcessingUser] = useState(null)
  const [showRestrictModal, setShowRestrictModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [restrictionForm, setRestrictionForm] = useState({
    reason: '',
    duration: '7', // days
    restrictionType: 'temporary' // temporary, permanent
  })
  const [restrictions, setRestrictions] = useState({}) // userAddress -> restriction data
  const [activeUsers, setActiveUsers] = useState({}) // userAddress -> { lastSeen, loginTime, sessionId }
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showAccessControlModal, setShowAccessControlModal] = useState(false)
  const [accessControlForm, setAccessControlForm] = useState({
    canCreatePrescription: true,
    canDispense: true,
    canCreateBatch: true,
    canViewAnalytics: true,
    canManageUsers: false
  })

  // Check if user is super admin
  const isSuperAdmin = role === ROLES.ADMIN || role === 1

  // Load users
  useEffect(() => {
    loadUsers()
    loadRestrictions()
    loadActiveUsers()
    
    // Set up real-time tracking
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadActiveUsers()
        loadUsers()
      }, 5000) // Refresh every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // Track current user's activity
  useEffect(() => {
    if (account) {
      updateUserActivity(account)
      const activityInterval = setInterval(() => {
        updateUserActivity(account)
      }, 30000) // Update every 30 seconds
      
      return () => clearInterval(activityInterval)
    }
  }, [account])

  // Load restrictions from localStorage
  const loadRestrictions = () => {
    try {
      const stored = localStorage.getItem('blockmed-user-restrictions')
      if (stored) {
        const parsed = JSON.parse(stored)
        setRestrictions(parsed || {})
      }
    } catch (error) {
      console.error('Error loading restrictions:', error)
    }
  }

  // Save restrictions to localStorage
  const saveRestrictions = (newRestrictions) => {
    try {
      localStorage.setItem('blockmed-user-restrictions', JSON.stringify(newRestrictions))
      setRestrictions(newRestrictions)
    } catch (error) {
      console.error('Error saving restrictions:', error)
      toast.error('Failed to save restrictions')
    }
  }

  // Load active users (real-time login tracking)
  const loadActiveUsers = () => {
    try {
      const stored = localStorage.getItem('blockmed-active-users')
      if (stored) {
        const parsed = JSON.parse(stored)
        const now = Date.now()
        
        // Filter out inactive users (no activity for 5 minutes)
        const active = {}
        Object.keys(parsed).forEach(address => {
          const user = parsed[address]
          if (now - user.lastSeen < 300000) { // 5 minutes
            active[address] = user
          }
        })
        
        setActiveUsers(active)
      }
    } catch (error) {
      console.error('Error loading active users:', error)
    }
  }

  // Update user activity (called when user is active)
  const updateUserActivity = (userAddress) => {
    try {
      const stored = localStorage.getItem('blockmed-active-users') || '{}'
      const activeUsers = JSON.parse(stored)
      
      activeUsers[userAddress] = {
        lastSeen: Date.now(),
        loginTime: activeUsers[userAddress]?.loginTime || Date.now(),
        sessionId: activeUsers[userAddress]?.sessionId || `session-${Date.now()}-${Math.random()}`
      }
      
      localStorage.setItem('blockmed-active-users', JSON.stringify(activeUsers))
      setActiveUsers(activeUsers)
    } catch (error) {
      console.error('Error updating user activity:', error)
    }
  }

  // Load access controls
  const loadAccessControls = (userAddress) => {
    try {
      const stored = localStorage.getItem('blockmed-access-controls')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed[userAddress] || {
          canCreatePrescription: true,
          canDispense: true,
          canCreateBatch: true,
          canViewAnalytics: true,
          canManageUsers: false
        }
      }
    } catch (error) {
      console.error('Error loading access controls:', error)
    }
    return {
      canCreatePrescription: true,
      canDispense: true,
      canCreateBatch: true,
      canViewAnalytics: true,
      canManageUsers: false
    }
  }

  // Save access controls
  const saveAccessControls = (userAddress, controls) => {
    try {
      const stored = localStorage.getItem('blockmed-access-controls') || '{}'
      const accessControls = JSON.parse(stored)
      accessControls[userAddress] = {
        ...controls,
        updatedAt: Date.now(),
        updatedBy: account
      }
      localStorage.setItem('blockmed-access-controls', JSON.stringify(accessControls))
      toast.success('Access controls updated successfully')
    } catch (error) {
      console.error('Error saving access controls:', error)
      toast.error('Failed to save access controls')
    }
  }

  const loadUsers = async () => {
    if (!isDevMode() && !window.ethereum) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const contract = await getReadContract()
      
      // Check if getAllUsers exists and user is admin
      let userAddresses = []
      try {
        if (isSuperAdmin) {
          userAddresses = await contract.getAllUsers()
        } else {
          // For non-admin, show empty or limited list
          toast.error('Access denied. Super Admin only.')
          setLoading(false)
          return
        }
      } catch (error) {
        console.warn('getAllUsers not available or access denied:', error)
        // Fallback: try to get users another way or show empty
        setLoading(false)
        return
      }

      const results = []

      for (const address of userAddresses) {
        try {
          const u = await contract.getUser(address)
          const isActiveUser = activeUsers[address] ? true : false
          const lastSeen = activeUsers[address]?.lastSeen || null
          
          results.push({
            address: u.userAddress,
            role: Number(u.role),
            name: u.name,
            licenseNumber: u.licenseNumber,
            isVerified: u.isVerified,
            isActive: u.isActive,
            registeredAt: Number(u.registeredAt),
            isOnline: isActiveUser,
            lastSeen: lastSeen,
            loginTime: activeUsers[address]?.loginTime || null
          })
        } catch (error) {
          console.error(`Error loading user ${address}:`, error)
        }
      }

      setUsers(results.reverse())
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Get user restriction status
  const getUserRestriction = (userAddress) => {
    const restriction = restrictions[userAddress]
    if (!restriction) return null

    const now = Date.now()
    const expiresAt = restriction.expiresAt

    // Check if restriction is expired
    if (restriction.restrictionType === 'temporary' && expiresAt && now > expiresAt) {
      // Auto-remove expired restrictions
      const newRestrictions = { ...restrictions }
      delete newRestrictions[userAddress]
      saveRestrictions(newRestrictions)
      return null
    }

    return restriction
  }

  // Check if user is restricted
  const isUserRestricted = (userAddress) => {
    const restriction = getUserRestriction(userAddress)
    return restriction !== null
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name + user.address + user.licenseNumber)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())

    const isRestricted = isUserRestricted(user.address)

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'pending' && !user.isVerified && user.isActive && !isRestricted) ||
      (filter === 'verified' && user.isVerified && user.isActive && !isRestricted) ||
      (filter === 'inactive' && !user.isActive) ||
      (filter === 'restricted' && isRestricted)

    return matchesSearch && matchesFilter
  })

  // Verify user
  const handleVerify = async (userAddress) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can verify users')
      return
    }

    setProcessingUser(userAddress)

    try {
      const contract = await getWriteContract()
      const tx = await contract.verifyUser(userAddress)
      toast.loading('Verifying user...')
      await tx.wait()
      toast.dismiss()
      toast.success('User verified successfully!')

      await loadUsers()
    } catch (error) {
      console.error('Verify error:', error)
      toast.error(error.message || 'Failed to verify user')
    } finally {
      setProcessingUser(null)
    }
  }

  // Deactivate user
  const handleDeactivate = async (userAddress) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can deactivate users')
      return
    }

    if (!confirm('Are you sure you want to deactivate this user? This will prevent them from using the system.')) return

    setProcessingUser(userAddress)

    try {
      const contract = await getWriteContract()
      const tx = await contract.deactivateUser(userAddress)
      toast.loading('Deactivating user...')
      await tx.wait()
      toast.dismiss()
      toast.success('User deactivated')

      await loadUsers()
    } catch (error) {
      console.error('Deactivate error:', error)
      toast.error(error.message || 'Failed to deactivate user')
    } finally {
      setProcessingUser(null)
    }
  }

  // Restrict user (temporary hold)
  const handleRestrict = (user) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can restrict users')
      return
    }

    setSelectedUser(user)
    const existingRestriction = getUserRestriction(user.address)
    if (existingRestriction) {
      setRestrictionForm({
        reason: existingRestriction.reason || '',
        duration: existingRestriction.duration || '7',
        restrictionType: existingRestriction.restrictionType || 'temporary'
      })
    } else {
      setRestrictionForm({
        reason: '',
        duration: '7',
        restrictionType: 'temporary'
      })
    }
    setShowRestrictModal(true)
  }

  // Save restriction
  const handleSaveRestriction = () => {
    if (!restrictionForm.reason.trim()) {
      toast.error('Please provide a reason for restriction')
      return
    }

    if (!selectedUser) return

    const now = Date.now()
    const durationDays = parseInt(restrictionForm.duration) || 7
    const expiresAt = restrictionForm.restrictionType === 'temporary' 
      ? now + (durationDays * 24 * 60 * 60 * 1000)
      : null

    const restriction = {
      userAddress: selectedUser.address,
      userName: selectedUser.name,
      reason: restrictionForm.reason.trim(),
      duration: restrictionForm.duration,
      restrictionType: restrictionForm.restrictionType,
      restrictedAt: now,
      expiresAt: expiresAt,
      restrictedBy: account,
      isActive: true
    }

    const newRestrictions = {
      ...restrictions,
      [selectedUser.address]: restriction
    }

    saveRestrictions(newRestrictions)
    toast.success(`User ${restrictionForm.restrictionType === 'permanent' ? 'permanently restricted' : 'restricted temporarily'}`)
    setShowRestrictModal(false)
    setSelectedUser(null)
    loadUsers()
  }

  // Remove restriction
  const handleRemoveRestriction = (userAddress) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can remove restrictions')
      return
    }

    if (!confirm('Are you sure you want to remove this restriction?')) return

    const newRestrictions = { ...restrictions }
    delete newRestrictions[userAddress]
    saveRestrictions(newRestrictions)
    toast.success('Restriction removed successfully')
    loadUsers()
  }

  // Activate user (reactivate)
  const handleActivate = async (userAddress) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can activate users')
      return
    }

    try {
      // Note: This would require a reactivateUser function in the contract
      // For now, we'll just show a message
      toast.error('User activation requires contract function. Currently only deactivation is supported.')
    } catch (error) {
      console.error('Activate error:', error)
      toast.error(error.message || 'Failed to activate user')
    }
  }

  // Handle access control
  const handleAccessControl = (user) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can control access')
      return
    }

    setSelectedUser(user)
    const controls = loadAccessControls(user.address)
    setAccessControlForm(controls)
    setShowAccessControlModal(true)
  }

  // Save access control
  const handleSaveAccessControl = () => {
    if (!selectedUser) return
    saveAccessControls(selectedUser.address, accessControlForm)
    setShowAccessControlModal(false)
    setSelectedUser(null)
  }

  // Force logout user
  const handleForceLogout = (userAddress) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can force logout')
      return
    }

    if (!confirm('Force this user to logout? They will need to reconnect.')) return

    try {
      // Remove from active users
      const stored = localStorage.getItem('blockmed-active-users') || '{}'
      const activeUsers = JSON.parse(stored)
      delete activeUsers[userAddress]
      localStorage.setItem('blockmed-active-users', JSON.stringify(activeUsers))
      setActiveUsers(activeUsers)
      
      // Set logout flag for that user
      sessionStorage.setItem(`blockmed-force-logout-${userAddress}`, 'true')
      
      toast.success('User will be logged out on their next action')
    } catch (error) {
      console.error('Error forcing logout:', error)
      toast.error('Failed to force logout')
    }
  }

  // Stats
  const stats = {
    total: users.length,
    pending: users.filter(u => !u.isVerified && u.isActive && !isUserRestricted(u.address)).length,
    verified: users.filter(u => u.isVerified && u.isActive && !isUserRestricted(u.address)).length,
    inactive: users.filter(u => !u.isActive).length,
    restricted: users.filter(u => isUserRestricted(u.address)).length,
    online: users.filter(u => u.isOnline).length,
  }

  // Show access denied if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="card">
          <div className="text-center py-12">
            <FiShield size={64} className="mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-400">
              This page is restricted to Super Admin only.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Your current role: {getRoleName(role)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FiShield className="text-red-400" />
              Super Admin - User Control Portal
            </h1>
            <p className="text-gray-400 mt-1">
              Manage users, verify accounts, and restrict user activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge bg-red-500/20 text-red-400">
              Super Admin Only
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card-stat">
          <p className="text-sm text-gray-400">Total Users</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="card-stat">
          <p className="text-sm text-gray-400">Online Now</p>
          <p className="text-2xl font-bold text-green-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {stats.online}
          </p>
        </div>
        <div className="card-stat">
          <p className="text-sm text-gray-400">{t('user.pendingUsers')}</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
        </div>
        <div className="card-stat">
          <p className="text-sm text-gray-400">{t('user.verified')}</p>
          <p className="text-2xl font-bold text-primary-400">{stats.verified}</p>
        </div>
        <div className="card-stat">
          <p className="text-sm text-gray-400">{t('user.inactive')}</p>
          <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
        </div>
        <div className="card-stat">
          <p className="text-sm text-gray-400">Restricted</p>
          <p className="text-2xl font-bold text-red-400">{stats.restricted}</p>
        </div>
      </div>

      {/* Real-time Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <h2 className="text-lg font-semibold text-white">Real-time Activity</h2>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="form-checkbox"
              />
              <span className="text-sm text-gray-400">Auto-refresh</span>
            </label>
            <button
              onClick={() => {
                loadActiveUsers()
                loadUsers()
              }}
              className="btn-secondary text-sm"
            >
              <FiRefreshCw size={16} />
              Refresh Now
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <p className="text-sm text-gray-400 mb-1">Currently Online</p>
            <p className="text-2xl font-bold text-green-400">{stats.online}</p>
            <p className="text-xs text-gray-500 mt-1">Active in last 5 minutes</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-gray-400 mb-1">Total Sessions</p>
            <p className="text-2xl font-bold text-blue-400">{Object.keys(activeUsers).length}</p>
            <p className="text-xs text-gray-500 mt-1">Active user sessions</p>
          </div>
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-sm text-gray-400 mb-1">Last Update</p>
            <p className="text-lg font-bold text-yellow-400">
              {new Date().toLocaleTimeString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Auto-refreshes every 5s</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:max-w-md relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="form-input pl-10 w-full"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'verified', 'inactive', 'restricted'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? f === 'pending' ? 'bg-yellow-500/20 text-yellow-400'
                    : f === 'verified' ? 'bg-primary-500/20 text-primary-400'
                    : f === 'inactive' ? 'bg-gray-500/20 text-gray-400'
                    : f === 'restricted' ? 'bg-red-500/20 text-red-400'
                    : 'bg-primary-500/20 text-primary-400'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && stats.pending > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-yellow-900 text-xs rounded-full">
                    {stats.pending}
                  </span>
                )}
                {f === 'restricted' && stats.restricted > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-red-900 text-xs rounded-full">
                    {stats.restricted}
                  </span>
                )}
              </button>
            ))}
            <button onClick={loadUsers} className="btn-icon" disabled={loading}>
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('user.name')}</th>
                <th>Address</th>
                <th>{t('user.role')}</th>
                <th>Status</th>
                <th>Activity</th>
                <th>{t('user.registeredAt')}</th>
                <th className="text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="7">
                      <div className="skeleton h-12 w-full rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">
                    <FiUsers size={40} className="mx-auto mb-3 opacity-50" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const restriction = getUserRestriction(user.address)
                  const isRestricted = restriction !== null
                  
                  return (
                    <motion.tr
                      key={user.address}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group ${!user.isActive || isRestricted ? 'opacity-75' : ''} ${
                        isRestricted ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <td className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          {user.name}
                          {isRestricted && (
                            <FiXCircle className="text-red-400" size={14} />
                          )}
                          {user.isOnline && (
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Online Now" />
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-sm text-gray-400">
                        {shortenAddress(user.address)}
                      </td>
                      <td>
                        <span className={`badge ${getRoleColorClass(user.role)}`}>
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          {isRestricted ? (
                            <div className="flex flex-col gap-1">
                              <span className="badge bg-red-500/20 text-red-400">
                                <FiLock size={12} className="mr-1" />
                                {restriction.restrictionType === 'permanent' ? 'Permanently Restricted' : 'Temporarily Restricted'}
                              </span>
                              {restriction.expiresAt && (
                                <span className="text-xs text-gray-500">
                                  Until: {formatTimestamp(restriction.expiresAt / 1000)}
                                </span>
                              )}
                            </div>
                          ) : !user.isActive ? (
                            <span className="badge bg-gray-500/20 text-gray-400">Inactive</span>
                          ) : user.isVerified ? (
                            <span className="badge badge-success">
                              <FiUserCheck size={12} className="mr-1" />
                              Verified
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              <FiClock size={12} className="mr-1" />
                              Pending
                            </span>
                          )}
                          {user.licenseNumber && (
                            <span className="text-xs text-gray-500">{user.licenseNumber}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {user.isOnline ? (
                          <div className="flex flex-col gap-1">
                            <span className="badge bg-green-500/20 text-green-400 text-xs">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block mr-1 animate-pulse" />
                              Online Now
                            </span>
                            {user.lastSeen && (
                              <span className="text-xs text-gray-500">
                                Active {Math.floor((Date.now() - user.lastSeen) / 1000)}s ago
                              </span>
                            )}
                          </div>
                        ) : user.lastSeen ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400">Last seen</span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(user.lastSeen / 1000, 'dd MMM HH:mm')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Never</span>
                        )}
                      </td>
                      <td>
                        {isRestricted ? (
                          <div className="flex flex-col gap-1">
                            <span className="badge bg-red-500/20 text-red-400">
                              <FiLock size={12} className="mr-1" />
                              {restriction.restrictionType === 'permanent' ? 'Permanently Restricted' : 'Temporarily Restricted'}
                            </span>
                            {restriction.expiresAt && (
                              <span className="text-xs text-gray-500">
                                Until: {formatTimestamp(restriction.expiresAt / 1000)}
                              </span>
                            )}
                          </div>
                        ) : !user.isActive ? (
                          <span className="badge bg-gray-500/20 text-gray-400">Inactive</span>
                        ) : user.isVerified ? (
                          <span className="badge badge-success">
                            <FiUserCheck size={12} className="mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            <FiClock size={12} className="mr-1" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="text-gray-400 text-sm">
                        {formatTimestamp(user.registeredAt, 'dd MMM yyyy')}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          {!user.isVerified && user.isActive && !isRestricted && (
                            <button
                              onClick={() => handleVerify(user.address)}
                              disabled={processingUser === user.address}
                              className="p-2 rounded-lg hover:bg-primary-500/20 text-primary-400 transition-colors"
                              title="Verify User"
                            >
                              {processingUser === user.address ? (
                                <span className="loader w-4 h-4" />
                              ) : (
                                <FiUserCheck size={16} />
                              )}
                            </button>
                          )}
                          {user.isActive && user.address !== account && (
                            <button
                              onClick={() => handleAccessControl(user)}
                              className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                              title="Control Access"
                            >
                              <FiShield size={16} />
                            </button>
                          )}
                          {!isRestricted && user.isActive && user.address !== account && (
                            <button
                              onClick={() => handleRestrict(user)}
                              className="p-2 rounded-lg hover:bg-yellow-500/20 text-yellow-400 transition-colors"
                              title="Restrict User"
                            >
                              <FiLock size={16} />
                            </button>
                          )}
                          {isRestricted && (
                            <button
                              onClick={() => handleRemoveRestriction(user.address)}
                              className="p-2 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
                              title="Remove Restriction"
                            >
                              <FiUnlock size={16} />
                            </button>
                          )}
                          {user.isOnline && user.address !== account && (
                            <button
                              onClick={() => handleForceLogout(user.address)}
                              className="p-2 rounded-lg hover:bg-orange-500/20 text-orange-400 transition-colors"
                              title="Force Logout"
                            >
                              <FiUserX size={16} />
                            </button>
                          )}
                          {user.isActive && user.address !== account && (
                            <button
                              onClick={() => handleDeactivate(user.address)}
                              disabled={processingUser === user.address}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Deactivate User"
                            >
                              {processingUser === user.address ? (
                                <span className="loader w-4 h-4" />
                              ) : (
                                <FiUserX size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restriction Modal */}
      <AnimatePresence>
        {showRestrictModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowRestrictModal(false)
              setSelectedUser(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FiLock className="text-yellow-400" />
                  {getUserRestriction(selectedUser.address) ? 'Update Restriction' : 'Restrict User'}
                </h2>
                <button
                  onClick={() => {
                    setShowRestrictModal(false)
                    setSelectedUser(null)
                  }}
                  className="btn-icon"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Info */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-400 mb-1">User</p>
                  <p className="text-white font-semibold">{selectedUser.name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{selectedUser.address}</p>
                  <p className="text-xs text-gray-400 mt-1">Role: {getRoleName(selectedUser.role)}</p>
                </div>

                {/* Restriction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Restriction Type *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="restrictionType"
                        value="temporary"
                        checked={restrictionForm.restrictionType === 'temporary'}
                        onChange={(e) => setRestrictionForm({ ...restrictionForm, restrictionType: e.target.value })}
                        className="form-radio"
                      />
                      <span className="text-white">Temporary Hold</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="restrictionType"
                        value="permanent"
                        checked={restrictionForm.restrictionType === 'permanent'}
                        onChange={(e) => setRestrictionForm({ ...restrictionForm, restrictionType: e.target.value })}
                        className="form-radio"
                      />
                      <span className="text-white">Permanent Restriction</span>
                    </label>
                  </div>
                </div>

                {/* Duration (for temporary) */}
                {restrictionForm.restrictionType === 'temporary' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <FiCalendar className="inline mr-2" />
                      Duration (Days) *
                    </label>
                    <select
                      className="form-select"
                      value={restrictionForm.duration}
                      onChange={(e) => setRestrictionForm({ ...restrictionForm, duration: e.target.value })}
                    >
                      <option value="1">1 Day</option>
                      <option value="3">3 Days</option>
                      <option value="7">7 Days</option>
                      <option value="14">14 Days</option>
                      <option value="30">30 Days</option>
                      <option value="60">60 Days</option>
                      <option value="90">90 Days</option>
                    </select>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FiAlertTriangle className="inline mr-2 text-yellow-400" />
                    Reason for Restriction *
                  </label>
                  <textarea
                    className="form-textarea"
                    rows="4"
                    placeholder="Enter the reason for restricting this user's activity..."
                    value={restrictionForm.reason}
                    onChange={(e) => setRestrictionForm({ ...restrictionForm, reason: e.target.value })}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This reason will be recorded in the restriction log.
                  </p>
                </div>

                {/* Warning */}
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-start gap-3">
                    <FiAlertTriangle className="text-yellow-400 mt-0.5" size={20} />
                    <div>
                      <p className="text-yellow-300 font-medium mb-1">Restriction Effects</p>
                      <p className="text-yellow-200/80 text-sm">
                        Restricted users will be unable to:
                      </p>
                      <ul className="text-yellow-200/80 text-sm mt-2 list-disc list-inside space-y-1">
                        <li>Create new prescriptions (Doctors)</li>
                        <li>Dispense prescriptions (Pharmacists)</li>
                        <li>Create medicine batches (Manufacturers)</li>
                        <li>Access most system features</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowRestrictModal(false)
                    setSelectedUser(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRestriction}
                  className="btn-primary flex-1"
                >
                  <FiSave size={18} />
                  {getUserRestriction(selectedUser.address) ? 'Update Restriction' : 'Apply Restriction'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Access Control Modal */}
      <AnimatePresence>
        {showAccessControlModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowAccessControlModal(false)
              setSelectedUser(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FiShield className="text-blue-400" />
                  Control Access - {selectedUser.name}
                </h2>
                <button
                  onClick={() => {
                    setShowAccessControlModal(false)
                    setSelectedUser(null)
                  }}
                  className="btn-icon"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Info */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-400 mb-1">User</p>
                  <p className="text-white font-semibold">{selectedUser.name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{selectedUser.address}</p>
                  <p className="text-xs text-gray-400 mt-1">Role: {getRoleName(selectedUser.role)}</p>
                </div>

                {/* Access Controls */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white mb-4">Feature Access Controls</h3>
                  
                  <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <FiFileText className="text-primary-400" size={20} />
                      <div>
                        <p className="text-white font-medium">Create Prescriptions</p>
                        <p className="text-xs text-gray-400">Allow user to create new prescriptions</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={accessControlForm.canCreatePrescription}
                      onChange={(e) => setAccessControlForm({ ...accessControlForm, canCreatePrescription: e.target.checked })}
                      className="form-checkbox"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <FiCheckCircle className="text-blue-400" size={20} />
                      <div>
                        <p className="text-white font-medium">Dispense Prescriptions</p>
                        <p className="text-xs text-gray-400">Allow user to dispense prescriptions</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={accessControlForm.canDispense}
                      onChange={(e) => setAccessControlForm({ ...accessControlForm, canDispense: e.target.checked })}
                      className="form-checkbox"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <FiPackage className="text-yellow-400" size={20} />
                      <div>
                        <p className="text-white font-medium">Create Medicine Batches</p>
                        <p className="text-xs text-gray-400">Allow user to create medicine batches</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={accessControlForm.canCreateBatch}
                      onChange={(e) => setAccessControlForm({ ...accessControlForm, canCreateBatch: e.target.checked })}
                      className="form-checkbox"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <FiPieChart className="text-purple-400" size={20} />
                      <div>
                        <p className="text-white font-medium">View Analytics</p>
                        <p className="text-xs text-gray-400">Allow user to access analytics dashboard</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={accessControlForm.canViewAnalytics}
                      onChange={(e) => setAccessControlForm({ ...accessControlForm, canViewAnalytics: e.target.checked })}
                      className="form-checkbox"
                    />
                  </label>

                  {selectedUser.role === ROLES.ADMIN && (
                    <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <FiShield className="text-red-400" size={20} />
                        <div>
                          <p className="text-white font-medium">Manage Users</p>
                          <p className="text-xs text-gray-400">Allow user to manage other users</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={accessControlForm.canManageUsers}
                        onChange={(e) => setAccessControlForm({ ...accessControlForm, canManageUsers: e.target.checked })}
                        className="form-checkbox"
                      />
                    </label>
                  )}
                </div>

                {/* Warning */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <FiAlertTriangle className="text-blue-400 mt-0.5" size={20} />
                    <div>
                      <p className="text-blue-300 font-medium mb-1">Access Control Effects</p>
                      <p className="text-blue-200/80 text-sm">
                        Disabled features will be hidden from the user's navigation and blocked from access.
                        Changes take effect immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowAccessControlModal(false)
                    setSelectedUser(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAccessControl}
                  className="btn-primary flex-1"
                >
                  <FiSave size={18} />
                  Save Access Controls
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserManagement
