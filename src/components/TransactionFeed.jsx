/**
 * TransactionFeed - Live Blockchain Event Stream
 * 
 * Shows real-time events from the BlockMed smart contract:
 * - PrescriptionCreated, PrescriptionDispensed, PrescriptionUpdated, PrescriptionRevoked
 * - BatchCreated, BatchDispensed, BatchRecalled, BatchFlagged, FakeMedicineAlert
 * - UserRegistered, UserVerified, UserDeactivated
 * 
 * Great for teaching - demonstrates immutability & append-only ledger in action!
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ethers } from 'ethers'
import { useTranslation } from 'react-i18next'
import { 
  FiActivity, FiFileText, FiPackage, FiUsers, FiAlertTriangle,
  FiCheckCircle, FiRefreshCw, FiPause, FiPlay, FiFilter,
  FiExternalLink, FiClock, FiArrowUpRight, FiArrowDownRight
} from 'react-icons/fi'
import { getProvider, getContractAddress } from '../utils/contractHelper'
import { formatTimestamp, truncateAddress } from '../utils/helpers'

// Event types with colors and icons
const EVENT_CONFIG = {
  // Prescription events
  PrescriptionCreated: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    icon: FiFileText,
    direction: 'up',
    label: 'Prescription Created'
  },
  PrescriptionDispensed: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    icon: FiCheckCircle,
    direction: 'down',
    label: 'Prescription Dispensed'
  },
  PrescriptionUpdated: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    icon: FiRefreshCw,
    direction: 'up',
    label: 'Prescription Updated'
  },
  PrescriptionRevoked: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    icon: FiAlertTriangle,
    direction: 'down',
    label: 'Prescription Revoked'
  },
  // Batch events
  BatchCreated: {
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    icon: FiPackage,
    direction: 'up',
    label: 'Batch Created'
  },
  BatchDispensed: {
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    icon: FiPackage,
    direction: 'down',
    label: 'Batch Dispensed'
  },
  BatchRecalled: {
    color: 'text-red-500',
    bgColor: 'bg-red-500/30',
    borderColor: 'border-red-500/50',
    icon: FiAlertTriangle,
    direction: 'down',
    label: 'Batch Recalled'
  },
  BatchFlagged: {
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    icon: FiAlertTriangle,
    direction: 'down',
    label: 'Batch Flagged'
  },
  FakeMedicineAlert: {
    color: 'text-red-500',
    bgColor: 'bg-red-500/30',
    borderColor: 'border-red-500/50',
    icon: FiAlertTriangle,
    direction: 'down',
    label: '🚨 FAKE ALERT'
  },
  // User events
  UserRegistered: {
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30',
    icon: FiUsers,
    direction: 'up',
    label: 'User Registered'
  },
  UserVerified: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    icon: FiCheckCircle,
    direction: 'up',
    label: 'User Verified'
  },
  UserDeactivated: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    icon: FiUsers,
    direction: 'down',
    label: 'User Deactivated'
  }
}

// Filter options
const FILTER_OPTIONS = [
  { value: 'all', label: 'All Events' },
  { value: 'prescription', label: 'Prescriptions' },
  { value: 'batch', label: 'Batches' },
  { value: 'user', label: 'Users' },
  { value: 'alert', label: 'Alerts Only' }
]

const TransactionFeed = ({ maxEvents = 50, autoScroll = true, showHeader = true }) => {
  const { t } = useTranslation()
  const [events, setEvents] = useState([])
  const [isPaused, setIsPaused] = useState(false)
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [networkName, setNetworkName] = useState('')
  
  const containerRef = useRef(null)
  const providerRef = useRef(null)

  // Initialize provider and fetch initial events
  useEffect(() => {
    const init = async () => {
      try {
        const provider = await getProvider()
        providerRef.current = provider
        
        const network = await provider.getNetwork()
        const chainId = network?.chainId?.toString()
        
        // Set network name
        if (chainId === '31337') {
          setNetworkName('Hardhat Local')
        } else if (chainId === '80001') {
          setNetworkName('Polygon Mumbai')
        } else if (chainId === '11155111') {
          setNetworkName('Sepolia')
        } else {
          setNetworkName(`Chain ${chainId}`)
        }
        
        setIsLoading(false)
      } catch (err) {
        console.error('Error initializing provider:', err)
        setError(err.message)
        setIsLoading(false)
      }
    }
    
    init()
  }, [])

  // Subscribe to new blocks and filter for events
  useEffect(() => {
    if (!providerRef.current || isPaused) return

    const fetchNewEvents = async () => {
      try {
        const contractAddress = getContractAddress()
        if (!contractAddress) return

        // Get logs from the contract
        // We'll use a simpler approach - query the last few blocks
        const blockNumber = await providerRef.current.getBlockNumber()
        const fromBlock = Math.max(0, blockNumber - 10) // Last 10 blocks

        // Query for events
        const filter = {
          fromBlock,
          toBlock: blockNumber,
          address: contractAddress
        }

        const logs = await providerRef.current.getLogs(filter)
        
        if (logs.length > 0) {
          // Parse event logs
          const parsedEvents = logs.map((log, index) => {
            try {
              // Try to decode the event
              const iface = new ethers.utils.Interface([
                "event PrescriptionCreated(uint256 indexed id, string patientHash, address indexed doctor, uint256 expiresAt, uint256 timestamp)",
                "event PrescriptionDispensed(uint256 indexed id, address indexed pharmacist, uint256 timestamp)",
                "event PrescriptionUpdated(uint256 indexed id, uint256 version, address indexed doctor, string reason, uint256 timestamp)",
                "event PrescriptionRevoked(uint256 indexed id, address indexed revokedBy, string reason, uint256 timestamp)",
                "event BatchCreated(uint256 indexed id, string batchNumber, string medicineName, address indexed manufacturer, uint256 timestamp)",
                "event BatchDispensed(uint256 indexed batchId, string batchNumber, uint256 quantity, uint256 remainingUnits, address indexed dispensedBy, uint256 timestamp)",
                "event BatchRecalled(uint256 indexed id, string batchNumber, string reason, address indexed recalledBy, uint256 timestamp)",
                "event BatchFlagged(uint256 indexed id, string batchNumber, string reason, address indexed flaggedBy, uint256 timestamp)",
                "event FakeMedicineAlert(uint256 indexed batchId, string batchNumber, string alertType, address indexed reportedBy, uint256 timestamp)",
                "event UserRegistered(address indexed user, uint8 role, string name, uint256 timestamp)",
                "event UserVerified(address indexed user, address indexed verifiedBy, uint256 timestamp)",
                "event UserDeactivated(address indexed user, address indexed deactivatedBy, uint256 timestamp)"
              ])
              
              const parsed = iface.parseLog(log)
              const eventType = parsed.name
              
              // Extract relevant data based on event type
              let data = {}
              switch (eventType) {
                case 'PrescriptionCreated':
                  data = { id: parsed.args.id?.toString(), doctor: parsed.args.doctor }
                  break
                case 'PrescriptionDispensed':
                  data = { id: parsed.args.id?.toString(), pharmacist: parsed.args.pharmacist }
                  break
                case 'BatchCreated':
                  data = { id: parsed.args.id?.toString(), batchNumber: parsed.args.batchNumber, medicineName: parsed.args.medicineName }
                  break
                case 'BatchDispensed':
                  data = { batchId: parsed.args.batchId?.toString(), quantity: parsed.args.quantity?.toString() }
                  break
                case 'BatchRecalled':
                case 'BatchFlagged':
                  data = { id: parsed.args.id?.toString(), batchNumber: parsed.args.batchNumber }
                  break
                case 'FakeMedicineAlert':
                  data = { batchId: parsed.args.batchId?.toString(), batchNumber: parsed.args.batchNumber, alertType: parsed.args.alertType }
                  break
                case 'UserRegistered':
                  data = { user: parsed.args.user, role: parsed.args.role?.toString() }
                  break
                case 'UserVerified':
                case 'UserDeactivated':
                  data = { user: parsed.args.user }
                  break
              }
              
              return {
                id: `${blockNumber}-${index}`,
                type: eventType,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
                timestamp: Date.now(), // Approximate
                data
              }
            } catch (e) {
              // Could not parse this log
              return null
            }
          }).filter(Boolean)

          if (parsedEvents.length > 0) {
            setEvents(prev => {
              const newEvents = [...parsedEvents, ...prev]
              return newEvents.slice(0, maxEvents)
            })
          }
        }
      } catch (err) {
        console.error('Error fetching events:', err)
      }
    }

    // Poll for new events every 3 seconds
    const interval = setInterval(fetchNewEvents, 3000)
    fetchNewEvents() // Initial fetch

    return () => clearInterval(interval)
  }, [providerRef.current, isPaused, maxEvents])

  // Filter events
  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    if (filter === 'prescription') return event.type?.startsWith('Prescription')
    if (filter === 'batch') return event.type?.startsWith('Batch')
    if (filter === 'user') return event.type?.startsWith('User')
    if (filter === 'alert') return event.type === 'FakeMedicineAlert' || event.type === 'BatchRecalled'
    return true
  })

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (autoScroll && containerRef.current && !isPaused) {
      containerRef.current.scrollTop = 0
    }
  }, [events, autoScroll, isPaused])

  const getEventLabel = (eventType) => {
    const config = EVENT_CONFIG[eventType]
    return config?.label || eventType
  }

  const getEventIcon = (eventType) => {
    const config = EVENT_CONFIG[eventType]
    return config?.icon || FiActivity
  }

  const getEventColor = (eventType) => {
    const config = EVENT_CONFIG[eventType]
    return config?.color || 'text-gray-400'
  }

  const getEventBgColor = (eventType) => {
    const config = EVENT_CONFIG[eventType]
    return config?.bgColor || 'bg-gray-500/20'
  }

  const getEventBorderColor = (eventType) => {
    const config = EVENT_CONFIG[eventType]
    return config?.borderColor || 'border-gray-500/30'
  }

  const getDirectionIcon = (eventType) => {
    const config = EVENT_CONFIG[eventType]
    return config?.direction === 'up' ? FiArrowUpRight : FiArrowDownRight
  }

  // Block explorer URL
  const getExplorerUrl = (txHash) => {
    if (networkName === 'Hardhat Local') {
      return null // No explorer for local
    }
    if (networkName === 'Polygon Mumbai') {
      return `https://mumbai.polygonscan.com/tx/${txHash}`
    }
    if (networkName === 'Sepolia') {
      return `https://sepolia.etherscan.io/tx/${txHash}`
    }
    return null
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <FiAlertTriangle className="text-red-400 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
          <p className="text-gray-400">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Make sure the blockchain is running!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      {showHeader && (
        <div className="p-4 border-b border-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiActivity className="text-primary-400 text-xl" />
              {!isLoading && !isPaused && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">Live Transaction Feed</h3>
              <p className="text-xs text-gray-400">
                {networkName} • {events.length} events
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Filter dropdown */}
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/5 border border-gray-700 rounded-lg text-sm text-white appearance-none cursor-pointer hover:border-primary-500 focus:outline-none focus:border-primary-500"
              >
                {FILTER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            {/* Pause/Play button */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-2 rounded-lg border transition-colors ${
                isPaused 
                  ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' 
                  : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:text-white'
              }`}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <FiPlay size={16} /> : <FiPause size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Event List */}
      <div 
        ref={containerRef}
        className="max-h-96 overflow-y-auto space-y-2 p-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton h-20 rounded-lg" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <FiActivity className="text-gray-600 text-5xl mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-400 mb-2">No Events Yet</h4>
            <p className="text-sm text-gray-500">
              {isPaused 
                ? 'Feed is paused. Click play to resume.'
                : 'Waiting for blockchain events...'}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Try creating a prescription or batch to see events!
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredEvents.map((event, index) => {
              const EventIcon = getEventIcon(event.type)
              const DirectionIcon = getDirectionIcon(event.type)
              const explorerUrl = getExplorerUrl(event.transactionHash)
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className={`p-4 rounded-xl border ${getEventBgColor(event.type)} ${getEventBorderColor(event.type)} hover:brightness-110 transition-all`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getEventBgColor(event.type)}`}>
                        <EventIcon className={`${getEventColor(event.type)}`} size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {getEventLabel(event.type)}
                          </span>
                          <DirectionIcon className={getEventColor(event.type)} size={14} />
                        </div>
                        
                        {/* Event-specific data */}
                        <div className="mt-1 text-sm text-gray-300 space-x-2">
                          {event.data?.id && (
                            <span className="inline-flex items-center gap-1">
                              <FiFileText size={12} className="text-gray-500" />
                              #{event.data.id}
                            </span>
                          )}
                          {event.data?.batchNumber && (
                            <span className="inline-flex items-center gap-1">
                              <FiPackage size={12} className="text-gray-500" />
                              {event.data.batchNumber}
                            </span>
                          )}
                          {event.data?.medicineName && (
                            <span className="text-primary-300">
                              {event.data.medicineName}
                            </span>
                          )}
                          {event.data?.quantity && (
                            <span className="text-cyan-300">
                              Qty: {event.data.quantity}
                            </span>
                          )}
                          {event.data?.user && (
                            <span className="font-mono text-xs text-gray-400">
                              {truncateAddress(event.data.user)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiClock size={12} />
                            {formatTimestamp(event.timestamp / 1000)}
                          </span>
                          {event.blockNumber && (
                            <span>Block #{event.blockNumber}</span>
                          )}
                          {truncateAddress(event.transactionHash) && (
                            <span className="font-mono">
                              {truncateAddress(event.transactionHash)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Explorer link */}
                    {explorerUrl && (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-primary-400 transition-colors"
                        title="View in Explorer"
                      >
                        <FiExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {filteredEvents.length > 0 && (
        <div className="p-3 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filteredEvents.length} events</span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
            {isPaused ? 'Paused' : 'Live'}
          </span>
        </div>
      )}
    </div>
  )
}

export default TransactionFeed

