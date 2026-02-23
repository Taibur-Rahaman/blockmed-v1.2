/**
 * Leaderboard - Gamified Reputation & Points System
 * 
 * Shows top doctors and pharmacists based on their activity:
 * - Points for creating prescriptions
 * - Points for dispensing medicines
 * - Points for verifying batches
 * - Achievement badges
 * 
 * Great for teaching tokenomics and incentive design!
 */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  FiTrendingUp, FiAward, FiStar,
  FiUser, FiUserCheck, FiFileText, FiCheckCircle,
  FiPackage, FiShield, FiLock, FiChevronRight, FiAlertTriangle
} from 'react-icons/fi'
import { getReadContract, isBlockchainReady } from '../utils/contractHelper'
import { formatTimestamp, shortenAddress } from '../utils/helpers'

// Achievement badges
const ACHIEVEMENTS = [
  { id: 'first_rx', name: 'First Prescription', icon: FiFileText, color: 'text-green-400', bgColor: 'bg-green-500/20', points: 10, description: 'Created your first prescription' },
  { id: 'hundred_rx', name: 'Century Club', icon: FiAward, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', points: 500, description: 'Created 100 prescriptions' },
  { id: 'first_dispense', name: 'First Dispense', icon: FiCheckCircle, color: 'text-blue-400', bgColor: 'bg-blue-500/20', points: 10, description: 'First medicine dispensed' },
  { id: 'verified_10', name: 'Verifier', icon: FiShield, color: 'text-purple-400', bgColor: 'bg-purple-500/20', points: 50, description: 'Verified 10 batches' },
  { id: 'streak_7', name: 'Weekly Warrior', icon: FiTrendingUp, color: 'text-red-400', bgColor: 'bg-red-500/20', points: 100, description: '7-day activity streak' },
  { id: 'early_adopter', name: 'Early Adopter', icon: FiStar, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', points: 200, description: 'Joined in first week' },
]

// Points configuration
const POINTS_CONFIG = {
  prescriptionCreated: 10,
  prescriptionDispensed: 5,
  batchCreated: 15,
  batchDispensed: 3,
  batchVerified: 2,
  batchFlagged: 20,
}

const Leaderboard = ({ compact = false }) => {
  const { t } = useTranslation()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('doctors')
  const [timeFilter, setTimeFilter] = useState('all')

  useEffect(() => {
    fetchLeaderboard()
  }, [activeTab, timeFilter])

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)

    const ready = await isBlockchainReady()
    if (!ready.ready) {
      // Demo data when blockchain not connected
      setLeaderboard(getDemoLeaderboard())
      setLoading(false)
      return
    }

    try {
      const contract = await getReadContract()
      
      // Get system stats for activity metrics
      const stats = await contract.getSystemStats()
      const totalPrescriptions = Number(stats[1])
      const totalBatches = Number(stats[2])
      const dispensedCount = Number(stats[3])
      
      // Get all users
      const userAddresses = await contract.getAllUsers()
      
      // Build leaderboard data
      const usersData = []
      for (const address of userAddresses) {
        try {
          const user = await contract.getUser(address)
          if (!user.isActive) continue
          
          // Calculate points based on activity
          let points = 0
          let prescriptionsCount = 0
          let dispensesCount = 0
          let batchesCount = 0
          
          if (user.role === 2) { // Doctor
            // Get prescriptions by doctor
            const docPrescriptions = await contract.getPrescriptionsByDoctor(address)
            prescriptionsCount = docPrescriptions.length
            points += prescriptionsCount * POINTS_CONFIG.prescriptionCreated
          }
          
          if (user.role === 2 || user.role === 1 || user.role === 3) { // Doctor, Admin, Pharmacist
            // Get batches for manufacturer
            const manufacturerBatches = await contract.getBatchesByManufacturer(address)
            batchesCount = manufacturerBatches.length
            points += batchesCount * POINTS_CONFIG.batchCreated
          }
          
          // Add dispensed count contribution
          points += Math.floor(dispensedCount / 10) * POINTS_CONFIG.prescriptionDispensed
          
          usersData.push({
            address: address,
            name: user.name,
            role: Number(user.role),
            points,
            prescriptionsCount,
            dispensesCount: Math.floor(dispensedCount / userAddresses.length),
            batchesCount,
            isVerified: user.isVerified,
          })
        } catch (e) {
          console.error('Error fetching user data:', e)
        }
      }
      
      // Sort by points
      usersData.sort((a, b) => b.points - a.points)
      setLeaderboard(usersData.slice(0, 20))
      
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError(err.message)
      setLeaderboard(getDemoLeaderboard())
    } finally {
      setLoading(false)
    }
  }

  const getDemoLeaderboard = () => [
    { address: '0x1234...abcd', name: 'Dr. Sarah Johnson', role: 2, points: 1250, prescriptionsCount: 85, dispensesCount: 42, batchesCount: 0, isVerified: true },
    { address: '0x5678...efgh', name: 'Dr. Michael Chen', role: 2, points: 980, prescriptionsCount: 72, dispensesCount: 35, batchesCount: 0, isVerified: true },
    { address: '0xabcd...1234', name: 'PharmaCare Plus', role: 3, points: 750, prescriptionsCount: 0, dispensesCount: 150, batchesCount: 0, isVerified: true },
    { address: '0xdefg...5678', name: 'MediStore Ltd', role: 3, points: 620, prescriptionsCount: 0, dispensesCount: 124, batchesCount: 0, isVerified: true },
    { address: '0x9012...cdef', name: 'Dr. Emily Rahman', role: 2, points: 540, prescriptionsCount: 48, dispensesCount: 12, batchesCount: 0, isVerified: true },
    { address: '0x3456...7890', name: 'HealthFirst Pharmacy', role: 3, points: 430, prescriptionsCount: 0, dispensesCount: 86, batchesCount: 0, isVerified: true },
    { address: '0x7890...abcd', name: 'Dr. James Wilson', role: 2, points: 380, prescriptionsCount: 35, dispensesCount: 8, batchesCount: 0, isVerified: false },
    { address: '0x2468...aceg', name: 'QuickMeds', role: 3, points: 290, prescriptionsCount: 0, dispensesCount: 58, batchesCount: 0, isVerified: true },
    { address: '0x1357...bdfh', name: 'Dr. Lisa Ahmed', role: 2, points: 220, prescriptionsCount: 20, dispensesCount: 4, batchesCount: 0, isVerified: true },
    { address: '0x9753...eca8', name: 'Community Pharmacy', role: 3, points: 150, prescriptionsCount: 0, dispensesCount: 30, batchesCount: 0, isVerified: true },
  ]

  const getRoleIcon = (role) => {
    switch (role) {
      case 2: return FiUserCheck // Doctor
      case 3: return FiUser // Pharmacist
      case 1: return FiShield // Admin
      case 4: return FiPackage // Manufacturer
      default: return FiUser
    }
  }

  const getRoleName = (role) => {
    switch (role) {
      case 1: return 'Admin'
      case 2: return 'Doctor'
      case 3: return 'Pharmacist'
      case 4: return 'Manufacturer'
      case 5: return 'Patient'
      case 6: return 'Regulator'
      default: return 'Unknown'
    }
  }

  const getMedalColor = (index) => {
    switch (index) {
      case 0: return 'text-yellow-400'
      case 1: return 'text-gray-300'
      case 2: return 'text-amber-600'
      default: return 'text-gray-500'
    }
  }

  const getMedalIcon = (index) => {
    switch (index) {
      case 0: return FiAward
      case 1: return FiStar
      case 2: return FiTrendingUp
      default: return null
    }
  }

  if (compact) {
    // Compact view - just top 3
    return (
      <div className="card p-4">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <FiAward className="text-yellow-400" />
          Top Contributors
        </h3>
        <div className="space-y-2">
          {leaderboard.slice(0, 3).map((user, index) => {
            const MedalIcon = getMedalIcon(index)
            return (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                {MedalIcon ? (
                  <MedalIcon className={getMedalColor(index)} size={20} />
                ) : (
                  <span className="w-5 text-center text-gray-500 font-bold">{index + 1}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-500">{getRoleName(user.role)}</p>
                </div>
                <span className="text-sm font-bold text-primary-400">{user.points} pts</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-r from-primary-500/20 to-purple-500/20 border-primary-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FiAward className="text-yellow-400" />
              Leaderboard
            </h2>
            <p className="text-gray-400 mt-1">
              Top contributors in the BlockMed network
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{leaderboard.length}</p>
            <p className="text-sm text-gray-400">Active Users</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <FiAward className="text-purple-400" />
          Achievements
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const Icon = achievement.icon
            return (
              <motion.div
                key={achievement.id}
                whileHover={{ scale: 1.05 }}
                className={`p-3 rounded-xl ${achievement.bgColor} border border-white/10 text-center cursor-pointer hover:border-white/30 transition-all`}
                title={achievement.description}
              >
                <Icon className={`${achievement.color} mx-auto mb-2`} size={24} />
                <p className={`text-xs font-medium ${achievement.color}`}>{achievement.name}</p>
                <p className="text-xs text-gray-500 mt-1">+{achievement.points} pts</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2">
          {['doctors', 'pharmacists', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tab === 'doctors' && <FiUserCheck className="inline mr-2" />}
              {tab === 'pharmacists' && <FiUser className="inline mr-2" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-gray-700 rounded-lg text-white text-sm"
        >
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="week">This Week</option>
        </select>
      </div>

      {/* Leaderboard Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50 bg-gray-800/50">
                  <th className="p-4 text-left text-gray-400 font-medium">Rank</th>
                  <th className="p-4 text-left text-gray-400 font-medium">User</th>
                  <th className="p-4 text-center text-gray-400 font-medium">Points</th>
                  <th className="p-4 text-center text-gray-400 font-medium">Prescriptions</th>
                  <th className="p-4 text-center text-gray-400 font-medium">Dispensed</th>
                  <th className="p-4 text-center text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard
                  .filter(user => {
                    if (activeTab === 'all') return true
                    if (activeTab === 'doctors') return user.role === 2
                    if (activeTab === 'pharmacists') return user.role === 3
                    return true
                  })
                  .map((user, index) => {
                    const RoleIcon = getRoleIcon(user.role)
                    const MedalIcon = getMedalIcon(index)
                    
                    return (
                      <motion.tr
                        key={user.address}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`border-b border-gray-700/30 hover:bg-white/5 transition-colors ${
                          index < 3 ? 'bg-yellow-500/5' : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center justify-center w-8">
                            {MedalIcon ? (
                              <MedalIcon className={getMedalColor(index)} size={24} />
                            ) : (
                              <span className="text-gray-500 font-bold">#{index + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              user.role === 2 ? 'bg-green-500/20' :
                              user.role === 3 ? 'bg-blue-500/20' :
                              user.role === 1 ? 'bg-purple-500/20' :
                              'bg-gray-500/20'
                            }`}>
                              <RoleIcon className={
                                user.role === 2 ? 'text-green-400' :
                                user.role === 3 ? 'text-blue-400' :
                                user.role === 1 ? 'text-purple-400' :
                                'text-gray-400'
                              } size={16} />
                            </div>
                            <div>
                              <p className="font-medium text-white">{user.name}</p>
                              <p className="text-xs text-gray-500 font-mono">{user.address}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-xl font-bold text-primary-400">{user.points}</span>
                          <p className="text-xs text-gray-500">points</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-white">{user.prescriptionsCount}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-white">{user.dispensesCount}</span>
                        </td>
                        <td className="p-4 text-center">
                          {user.isVerified ? (
                            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                              Verified
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                              Pending
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Points Info */}
      <div className="card bg-gray-800/30">
        <h4 className="font-medium text-white mb-3">How to Earn Points</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FiFileText className="text-green-400" />
            <span className="text-gray-400">Create Prescription:</span>
            <span className="text-white font-medium">+{POINTS_CONFIG.prescriptionCreated} pts</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-blue-400" />
            <span className="text-gray-400">Dispense Prescription:</span>
            <span className="text-white font-medium">+{POINTS_CONFIG.prescriptionDispensed} pts</span>
          </div>
          <div className="flex items-center gap-2">
            <FiPackage className="text-purple-400" />
            <span className="text-gray-400">Create Batch:</span>
            <span className="text-white font-medium">+{POINTS_CONFIG.batchCreated} pts</span>
          </div>
          <div className="flex items-center gap-2">
            <FiShield className="text-yellow-400" />
            <span className="text-gray-400">Verify Batch:</span>
            <span className="text-white font-medium">+{POINTS_CONFIG.batchVerified} pts</span>
          </div>
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="text-red-400" />
            <span className="text-gray-400">Flag Suspicious:</span>
            <span className="text-white font-medium">+{POINTS_CONFIG.batchFlagged} pts</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard

