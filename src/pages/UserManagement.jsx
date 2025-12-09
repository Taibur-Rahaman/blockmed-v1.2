import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import {
  FiUsers, FiUserCheck, FiUserX, FiSearch, FiFilter,
  FiRefreshCw, FiShield, FiClock
} from 'react-icons/fi'

import { useStore } from '../store/useStore'
import { CONTRACT_ADDRESS, ROLE_NAMES, ROLE_COLORS } from '../utils/config'
import contractABI from '../utils/contractABI.json'
import { formatTimestamp, shortenAddress, getRoleName, getRoleColorClass } from '../utils/helpers'

const UserManagement = () => {
  const { t } = useTranslation()
  const { account, role } = useStore()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, verified, inactive
  const [searchQuery, setSearchQuery] = useState('')
  const [processingUser, setProcessingUser] = useState(null)

  // Load users
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    if (!window.ethereum) return

    setLoading(true)
    try {
  const provider = window.__sharedBrowserProvider || new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)

      const userAddresses = await contract.getAllUsers()
      const results = []

      for (const address of userAddresses) {
        const u = await contract.getUser(address)
        results.push({
          address: u.userAddress,
          role: Number(u.role),
          name: u.name,
          licenseNumber: u.licenseNumber,
          isVerified: u.isVerified,
          isActive: u.isActive,
          registeredAt: Number(u.registeredAt),
        })
      }

      setUsers(results.reverse())
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name + user.address + user.licenseNumber)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'pending' && !user.isVerified && user.isActive) ||
      (filter === 'verified' && user.isVerified && user.isActive) ||
      (filter === 'inactive' && !user.isActive)

    return matchesSearch && matchesFilter
  })

  // Verify user
  const handleVerify = async (userAddress) => {
    setProcessingUser(userAddress)

    try {
  const provider = window.__sharedBrowserProvider || new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)

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
    if (!confirm('Are you sure you want to deactivate this user?')) return

    setProcessingUser(userAddress)

    try {
  const provider = window.__sharedBrowserProvider || new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)

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

  // Stats
  const stats = {
    total: users.length,
    pending: users.filter(u => !u.isVerified && u.isActive).length,
    verified: users.filter(u => u.isVerified && u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FiUsers className="text-primary-400" />
          {t('user.title')}
        </h1>
        <p className="text-gray-400 mt-1">{t('user.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-stat">
          <p className="text-sm text-gray-400">Total Users</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
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
          
          <div className="flex gap-2">
            {['all', 'pending', 'verified', 'inactive'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? f === 'pending' ? 'bg-yellow-500/20 text-yellow-400'
                    : f === 'verified' ? 'bg-primary-500/20 text-primary-400'
                    : f === 'inactive' ? 'bg-gray-500/20 text-gray-400'
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
                <th>{t('user.licenseNumber')}</th>
                <th>{t('user.status')}</th>
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
                filteredUsers.map((user) => (
                  <motion.tr
                    key={user.address}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`group ${!user.isActive ? 'opacity-50' : ''}`}
                  >
                    <td className="font-medium text-white">{user.name}</td>
                    <td className="font-mono text-sm text-gray-400">
                      {shortenAddress(user.address)}
                    </td>
                    <td>
                      <span className={`badge ${getRoleColorClass(user.role)}`}>
                        {getRoleName(user.role)}
                      </span>
                    </td>
                    <td className="text-gray-400">{user.licenseNumber || '-'}</td>
                    <td>
                      {!user.isActive ? (
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
                      <div className="flex justify-end gap-2">
                        {!user.isVerified && user.isActive && (
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
                            onClick={() => handleDeactivate(user.address)}
                            disabled={processingUser === user.address}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Deactivate User"
                          >
                            <FiUserX size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UserManagement

