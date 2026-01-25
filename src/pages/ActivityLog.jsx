import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import {
  FiActivity, FiFilter, FiDownload, FiRefreshCw, FiClock,
  FiFileText, FiCheckCircle, FiPackage, FiUsers, FiAlertTriangle,
  FiXCircle, FiSearch, FiCalendar, FiHash, FiExternalLink
} from 'react-icons/fi'
import { useStore } from '../store/useStore'
import { formatTimestamp, shortenAddress, getRoleName } from '../utils/helpers'
import { getReadContract, getProvider } from '../utils/contractHelper'
import { isDevMode } from '../utils/devMode'
import toast from 'react-hot-toast'

const ActivityLog = () => {
  const { t } = useTranslation()
  const { account, role } = useStore()
  
  const [activities, setActivities] = useState([])
  const [filteredActivities, setFilteredActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    type: 'all',
    dateRange: 'all',
    search: ''
  })
  const [autoRefresh, setAutoRefresh] = useState(false)
  const refreshIntervalRef = useRef(null)

  // Event type configurations
  const eventTypes = {
    'PrescriptionAdded': {
      icon: FiFileText,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/20',
      label: 'Prescription Created'
    },
    'PrescriptionDispensed': {
      icon: FiCheckCircle,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      label: 'Prescription Dispensed'
    },
    'BatchCreated': {
      icon: FiPackage,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      label: 'Batch Created'
    },
    'BatchFlagged': {
      icon: FiAlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      label: 'Batch Flagged'
    },
    'BatchRecalled': {
      icon: FiXCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      label: 'Batch Recalled'
    },
    'UserRegistered': {
      icon: FiUsers,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      label: 'User Registered'
    },
    'UserVerified': {
      icon: FiCheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      label: 'User Verified'
    }
  }

  // Load activities from blockchain events
  const loadActivities = async () => {
    if (!isDevMode() && !window.ethereum) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const contract = await getReadContract()
      const provider = await getProvider()
      
      // Get current block number
      let currentBlock
      try {
        currentBlock = await provider.getBlockNumber()
      } catch (error) {
        console.error('Error getting block number:', error)
        toast.error('Failed to connect to blockchain')
        setLoading(false)
        return
      }
      
      const fromBlock = Math.max(0, currentBlock - 10000) // Last 10k blocks
      const allActivities = []
      
      // Fetch all relevant events
      try {
        // PrescriptionAdded events
        try {
          const prescriptionAddedFilter = contract.filters.PrescriptionAdded()
          const prescriptionAddedEvents = await contract.queryFilter(prescriptionAddedFilter, fromBlock)
        
          prescriptionAddedEvents.forEach((event) => {
            allActivities.push({
              id: `prescription-${event.args.id}-${event.blockNumber}`,
              type: 'PrescriptionAdded',
              timestamp: event.blockNumber, // Will convert to actual timestamp
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
              prescriptionId: Number(event.args.id),
              doctor: event.args.doctor,
              patientHash: event.args.patientHash,
              data: {
                prescriptionId: Number(event.args.id),
                doctor: event.args.doctor,
                patientHash: event.args.patientHash
              }
            })
          })
        } catch (error) {
          console.warn('Error loading PrescriptionAdded events:', error)
        }

        // PrescriptionDispensed events
        try {
          const prescriptionDispensedFilter = contract.filters.PrescriptionDispensed?.()
          if (prescriptionDispensedFilter) {
            const dispensedEvents = await contract.queryFilter(prescriptionDispensedFilter, fromBlock)
            dispensedEvents.forEach((event) => {
              allActivities.push({
                id: `dispensed-${event.args.id}-${event.blockNumber}`,
                type: 'PrescriptionDispensed',
                timestamp: event.blockNumber,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                prescriptionId: Number(event.args.id),
                pharmacist: event.args.pharmacist || event.args.dispensedBy,
                data: {
                  prescriptionId: Number(event.args.id),
                  pharmacist: event.args.pharmacist || event.args.dispensedBy
                }
              })
            })
          }
        } catch (error) {
          console.warn('Error loading PrescriptionDispensed events:', error)
        }

        // BatchCreated events
        try {
          const batchCreatedFilter = contract.filters.BatchCreated?.()
          if (batchCreatedFilter) {
            const batchEvents = await contract.queryFilter(batchCreatedFilter, fromBlock)
            batchEvents.forEach((event) => {
              allActivities.push({
                id: `batch-${event.args.batchNumber}-${event.blockNumber}`,
                type: 'BatchCreated',
                timestamp: event.blockNumber,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                batchNumber: event.args.batchNumber,
                manufacturer: event.args.manufacturer,
                data: {
                  batchNumber: event.args.batchNumber,
                  manufacturer: event.args.manufacturer
                }
              })
            })
          }
        } catch (error) {
          console.warn('Error loading BatchCreated events:', error)
        }

        // BatchFlagged events
        try {
          const batchFlaggedFilter = contract.filters.BatchFlagged?.()
          if (batchFlaggedFilter) {
            const flaggedEvents = await contract.queryFilter(batchFlaggedFilter, fromBlock)
            flaggedEvents.forEach((event) => {
              allActivities.push({
                id: `flagged-${event.args.batchId || event.args.id}-${event.blockNumber}`,
                type: 'BatchFlagged',
                timestamp: event.blockNumber,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                batchId: Number(event.args.batchId || event.args.id),
                flaggedBy: event.args.flaggedBy,
                reason: event.args.reason,
                data: {
                  batchId: Number(event.args.batchId || event.args.id),
                  flaggedBy: event.args.flaggedBy,
                  reason: event.args.reason
                }
              })
            })
          }
        } catch (error) {
          console.warn('Error loading BatchFlagged events:', error)
        }

        // BatchRecalled events
        try {
          const batchRecalledFilter = contract.filters.BatchRecalled?.()
          if (batchRecalledFilter) {
            const recalledEvents = await contract.queryFilter(batchRecalledFilter, fromBlock)
            recalledEvents.forEach((event) => {
              allActivities.push({
                id: `recalled-${event.args.batchId || event.args.id}-${event.blockNumber}`,
                type: 'BatchRecalled',
                timestamp: event.blockNumber,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                batchId: Number(event.args.batchId || event.args.id),
                recalledBy: event.args.recalledBy,
                reason: event.args.reason,
                data: {
                  batchId: Number(event.args.batchId || event.args.id),
                  recalledBy: event.args.recalledBy,
                  reason: event.args.reason
                }
              })
            })
          }
        } catch (error) {
          console.warn('Error loading BatchRecalled events:', error)
        }

        // UserRegistered events
        try {
          const userRegisteredFilter = contract.filters.UserRegistered?.()
          if (userRegisteredFilter) {
            const userEvents = await contract.queryFilter(userRegisteredFilter, fromBlock)
            userEvents.forEach((event) => {
              allActivities.push({
                id: `user-${event.args.user}-${event.blockNumber}`,
                type: 'UserRegistered',
                timestamp: event.blockNumber,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                user: event.args.user,
                userRole: Number(event.args.role),
                data: {
                  user: event.args.user,
                  role: Number(event.args.role)
                }
              })
            })
          }
        } catch (error) {
          console.warn('Error loading UserRegistered events:', error)
        }

        // UserVerified events
        try {
          const userVerifiedFilter = contract.filters.UserVerified?.()
          if (userVerifiedFilter) {
            const verifiedEvents = await contract.queryFilter(userVerifiedFilter, fromBlock)
            verifiedEvents.forEach((event) => {
              allActivities.push({
                id: `verified-${event.args.user}-${event.blockNumber}`,
                type: 'UserVerified',
                timestamp: event.blockNumber,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                user: event.args.user,
                verifiedBy: event.args.verifiedBy,
                data: {
                  user: event.args.user,
                  verifiedBy: event.args.verifiedBy
                }
              })
            })
          }
        } catch (error) {
          console.warn('Error loading UserVerified events:', error)
        }

        // Get block timestamps for all unique blocks
        const uniqueBlocks = [...new Set(allActivities.map(a => a.blockNumber))]
        const blockTimestamps = {}
        
        for (const blockNum of uniqueBlocks) {
          try {
            const block = await provider.getBlock(blockNum)
            if (block) {
              blockTimestamps[blockNum] = block.timestamp
            }
          } catch (error) {
            console.error(`Error fetching block ${blockNum}:`, error)
          }
        }

        // Update activities with actual timestamps
        const activitiesWithTimestamps = allActivities.map(activity => ({
          ...activity,
          timestamp: blockTimestamps[activity.blockNumber] || activity.blockNumber * 12 // Fallback: ~12s per block
        }))

        // Sort by timestamp (newest first)
        activitiesWithTimestamps.sort((a, b) => b.timestamp - a.timestamp)
        
        setActivities(activitiesWithTimestamps)
        applyFilters(activitiesWithTimestamps, filter)
        
        if (activitiesWithTimestamps.length === 0) {
          console.log('No activities found. This is normal if no events have been emitted yet.')
        }
      } catch (error) {
        console.error('Error loading activities:', error)
        toast.error(`Failed to load activity log: ${error.message || error}`)
      }
    } catch (error) {
      console.error('Error initializing activity log:', error)
      toast.error(`Failed to connect to blockchain: ${error.message || error}`)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  const applyFilters = (activitiesToFilter, currentFilter) => {
    let filtered = [...activitiesToFilter]

    // Filter by type
    if (currentFilter.type !== 'all') {
      filtered = filtered.filter(a => a.type === currentFilter.type)
    }

    // Filter by date range
    if (currentFilter.dateRange !== 'all') {
      const now = Date.now() / 1000
      const ranges = {
        'today': 86400, // 24 hours
        'week': 604800, // 7 days
        'month': 2592000 // 30 days
      }
      const rangeSeconds = ranges[currentFilter.dateRange]
      if (rangeSeconds) {
        filtered = filtered.filter(a => (now - a.timestamp) <= rangeSeconds)
      }
    }

    // Filter by search
    if (currentFilter.search) {
      const searchLower = currentFilter.search.toLowerCase()
      filtered = filtered.filter(a => {
        return (
          a.transactionHash?.toLowerCase().includes(searchLower) ||
          a.prescriptionId?.toString().includes(searchLower) ||
          a.batchNumber?.toLowerCase().includes(searchLower) ||
          a.batchId?.toString().includes(searchLower) ||
          a.doctor?.toLowerCase().includes(searchLower) ||
          a.pharmacist?.toLowerCase().includes(searchLower) ||
          a.manufacturer?.toLowerCase().includes(searchLower) ||
          a.user?.toLowerCase().includes(searchLower)
        )
      })
    }

    setFilteredActivities(filtered)
  }

  // Handle filter change
  const handleFilterChange = (key, value) => {
    const newFilter = { ...filter, [key]: value }
    setFilter(newFilter)
    applyFilters(activities, newFilter)
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Type', 'Timestamp', 'Block Number', 'Transaction Hash', 'Details']
    const rows = filteredActivities.map(activity => {
      const eventConfig = eventTypes[activity.type] || {}
      const details = JSON.stringify(activity.data || {})
      return [
        eventConfig.label || activity.type,
        formatTimestamp(activity.timestamp),
        activity.blockNumber,
        activity.transactionHash,
        details
      ]
    })

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blockmed-activity-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Activity log exported successfully')
  }

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadActivities()
      }, 30000) // Refresh every 30 seconds
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [autoRefresh])

  // Load activities on mount
  useEffect(() => {
    loadActivities()
  }, [account])

  // Render activity item
  const renderActivity = (activity) => {
    const eventConfig = eventTypes[activity.type] || {
      icon: FiActivity,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      label: activity.type
    }
    const Icon = eventConfig.icon

    return (
      <motion.div
        key={activity.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${eventConfig.bgColor}`}>
            <Icon size={20} className={eventConfig.color} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="font-semibold text-white">{eventConfig.label}</h3>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <FiClock size={12} />
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Block #{activity.blockNumber}</span>
              </div>
            </div>

            {/* Activity Details */}
            <div className="mt-3 space-y-2">
              {activity.prescriptionId && (
                <div className="flex items-center gap-2 text-sm">
                  <FiFileText size={14} className="text-gray-400" />
                  <span className="text-gray-300">Prescription ID: </span>
                  <span className="text-white font-mono">#{activity.prescriptionId}</span>
                </div>
              )}
              
              {activity.batchNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <FiPackage size={14} className="text-gray-400" />
                  <span className="text-gray-300">Batch: </span>
                  <span className="text-white font-mono">{activity.batchNumber}</span>
                </div>
              )}

              {activity.batchId && (
                <div className="flex items-center gap-2 text-sm">
                  <FiPackage size={14} className="text-gray-400" />
                  <span className="text-gray-300">Batch ID: </span>
                  <span className="text-white font-mono">#{activity.batchId}</span>
                </div>
              )}

              {(activity.doctor || activity.pharmacist || activity.manufacturer || activity.user) && (
                <div className="flex items-center gap-2 text-sm">
                  <FiUsers size={14} className="text-gray-400" />
                  <span className="text-gray-300">
                    {activity.doctor ? 'Doctor' : 
                     activity.pharmacist ? 'Pharmacist' : 
                     activity.manufacturer ? 'Manufacturer' : 
                     activity.verifiedBy ? 'Verified By' : 'User'}: 
                  </span>
                  <span className="text-white font-mono text-xs">
                    {shortenAddress(activity.doctor || activity.pharmacist || activity.manufacturer || activity.user || activity.verifiedBy)}
                  </span>
                </div>
              )}

              {activity.reason && (
                <div className="flex items-center gap-2 text-sm">
                  <FiAlertTriangle size={14} className="text-yellow-400" />
                  <span className="text-gray-300">Reason: </span>
                  <span className="text-yellow-300">{activity.reason}</span>
                </div>
              )}

              {activity.userRole !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <FiUsers size={14} className="text-gray-400" />
                  <span className="text-gray-300">Role: </span>
                  <span className="text-white">{getRoleName(activity.userRole)}</span>
                </div>
              )}

              {/* Transaction Hash */}
              <div className="flex items-center gap-2 text-sm mt-3 pt-3 border-t border-white/10">
                <FiHash size={14} className="text-gray-400" />
                <span className="text-gray-300">Transaction: </span>
                <span className="text-white font-mono text-xs">{shortenAddress(activity.transactionHash, 12)}</span>
                <a
                  href={`#`}
                  onClick={(e) => {
                    e.preventDefault()
                    // In production, link to block explorer
                    navigator.clipboard.writeText(activity.transactionHash)
                    toast.success('Transaction hash copied to clipboard')
                  }}
                  className="text-primary-400 hover:text-primary-300 ml-2"
                  title="Copy transaction hash"
                >
                  <FiExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FiActivity className="text-primary-400" />
              Activity Log
            </h1>
            <p className="text-gray-400 mt-1">
              Complete audit trail of all blockchain events and system activities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`btn-secondary ${autoRefresh ? 'bg-primary-500/20 text-primary-400' : ''}`}
            >
              <FiRefreshCw size={18} className={autoRefresh ? 'animate-spin' : ''} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={loadActivities}
              disabled={loading}
              className="btn-secondary"
            >
              <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredActivities.length === 0}
              className="btn-primary"
            >
              <FiDownload size={18} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Search by transaction hash, ID, or address..."
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select
            className="form-select"
            value={filter.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="all">All Event Types</option>
            {Object.keys(eventTypes).map(type => (
              <option key={type} value={type}>{eventTypes[type].label}</option>
            ))}
          </select>

          {/* Date Range Filter */}
          <select
            className="form-select"
            value={filter.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mb-4"></div>
            <p className="text-gray-400">Loading activity log...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="card p-8 text-center">
            <FiActivity size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400 text-lg mb-2">No activities found</p>
            <p className="text-gray-500 text-sm">
              {activities.length === 0 
                ? 'No blockchain events have been recorded yet.'
                : 'Try adjusting your filters to see more results.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">
                Showing {filteredActivities.length} of {activities.length} activities
              </p>
            </div>
            {filteredActivities.map(activity => renderActivity(activity))}
          </>
        )}
      </div>
    </div>
  )
}

export default ActivityLog
