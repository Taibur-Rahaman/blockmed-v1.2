import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  FiFileText, FiCheckCircle, FiUsers, FiPackage, 
  FiAlertTriangle, FiTrendingUp, FiActivity, FiBox,
  FiArrowRight, FiPlus, FiClock
} from 'react-icons/fi'
import { useStore } from '../store/useStore'
import { formatNumber, formatTimestamp, getRoleName, shortenAddress } from '../utils/helpers'
import { getReadContract, getCurrentAccount, isBlockchainReady } from '../utils/contractHelper'
import { isDevMode } from '../utils/devMode'
import { DEV_RPC_URL } from '../utils/config'
import { BlockchainBadge } from '../components/BlockchainInfo'
import TransactionFeed from '../components/TransactionFeed'
import BatchTimeline from '../components/BatchTimeline'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { t } = useTranslation()
  const { account, user, role } = useStore()
  
  const [stats, setStats] = useState({
    totalPrescriptions: 0,
    totalBatches: 0,
    totalUsers: 0,
    dispensedCount: 0,
    flaggedCount: 0,
    recalledCount: 0,
  })
  const [recentPrescriptions, setRecentPrescriptions] = useState([])
  const [allPrescriptions, setAllPrescriptions] = useState([]) // Admin: all prescriptions from network
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [account])

  const fetchDashboardData = async () => {
    const ready = await isBlockchainReady()
    if (!ready.ready) {
      setLoading(false)
      return
    }

    try {
      const contract = await getReadContract()

      // Get system stats
      const systemStats = await contract.getSystemStats()
      setStats({
        totalUsers: Number(systemStats[0]),
        totalPrescriptions: Number(systemStats[1]),
        totalBatches: Number(systemStats[2]),
        dispensedCount: Number(systemStats[3]),
        flaggedCount: Number(systemStats[4]),
        recalledCount: Number(systemStats[5]),
      })

      // Get recent prescriptions for doctor
      if (role === 2) { // Doctor
        const prescriptionIds = await contract.getPrescriptionsByDoctor(account)
        const recent = []
        for (let i = prescriptionIds.length - 1; i >= Math.max(0, prescriptionIds.length - 5); i--) {
          const p = await contract.getPrescription(Number(prescriptionIds[i]))
          recent.push({
            id: Number(p.id),
            patientHash: p.patientHash,
            createdAt: Number(p.createdAt),
            isDispensed: p.isDispensed,
            version: Number(p.version),
          })
        }
        setRecentPrescriptions(recent)
      }

      // Admin/Regulator: fetch ALL prescriptions from network (so you see data from other PCs)
      if (role === 1 || role === 6) {
        const count = Number(systemStats[1]) // totalPrescriptions
        const list = []
        const start = Math.max(1, count - 19)
        for (let id = count; id >= start && id >= 1; id--) {
          try {
            const p = await contract.getPrescription(id)
            list.push({
              id: Number(p.id),
              patientHash: p.patientHash,
              doctor: p.doctor,
              createdAt: Number(p.createdAt),
              isDispensed: p.isDispensed,
              version: Number(p.version),
            })
          } catch (e) {
            console.warn('Prescription', id, e?.message)
          }
        }
        setAllPrescriptions(list)
      }

      // Get alerts (flagged and recalled batches)
      const flaggedBatches = await contract.getFlaggedBatches()
      const recalledBatches = await contract.getRecalledBatches()
      
      const alertItems = []
      for (const batchId of flaggedBatches.slice(-3)) {
        const batch = await contract.getMedicineBatch(Number(batchId))
        alertItems.push({
          type: 'flagged',
          message: `Batch ${batch.batchNumber} flagged: ${batch.flagReason}`,
          timestamp: Number(batch.createdAt),
        })
      }
      for (const batchId of recalledBatches.slice(-3)) {
        const batch = await contract.getMedicineBatch(Number(batchId))
        alertItems.push({
          type: 'recalled',
          message: `Batch ${batch.batchNumber} recalled: ${batch.recallReason}`,
          timestamp: Number(batch.createdAt),
        })
      }
      setAlerts(alertItems)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error(error?.message || 'Failed to load dashboard. Is blockchain running?')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { 
      label: t('nav.createPrescription'), 
      icon: FiPlus, 
      path: '/prescription/create',
      color: 'from-primary-500 to-primary-600',
      roles: [1, 2]
    },
    { 
      label: t('nav.verification'), 
      icon: FiCheckCircle, 
      path: '/pharmacy',
      color: 'from-blue-500 to-blue-600',
      roles: [1, 2, 3, 5]
    },
    { 
      label: t('nav.batches'), 
      icon: FiBox, 
      path: '/batches',
      color: 'from-yellow-500 to-yellow-600',
      roles: [1, 4, 6]
    },
    { 
      label: t('nav.analytics'), 
      icon: FiTrendingUp, 
      path: '/analytics',
      color: 'from-accent-500 to-accent-600',
      roles: [1, 6]
    },
  ]

  const statCards = [
    { 
      label: t('dashboard.totalPrescriptions'), 
      value: stats.totalPrescriptions, 
      icon: FiFileText,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/20'
    },
    { 
      label: 'Dispensed', 
      value: stats.dispensedCount, 
      icon: FiCheckCircle,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    { 
      label: 'Medicine Batches', 
      value: stats.totalBatches, 
      icon: FiPackage,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    { 
      label: t('dashboard.activeAlerts'), 
      value: stats.flaggedCount + stats.recalledCount, 
      icon: FiAlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20'
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                {t('dashboard.welcome')}, {user?.name || 'User'}! 👋
              </h1>
              {!loading && (
                <BlockchainBadge label="Data from blockchain" />
              )}
            </div>
            <p className="text-gray-400 mt-1">
              {loading ? 'Loading from blockchain…' : `${getRoleName(role)} Dashboard`} • {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex gap-3">
            {role === 2 && (
              <Link to="/prescription/create" className="btn-primary">
                <FiPlus size={18} />
                {t('prescription.create')}
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="card-stat group hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <FiTrendingUp className="text-gray-600 group-hover:text-primary-400 transition-colors" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-white">
                {loading ? (
                  <span className="skeleton w-16 h-8 inline-block" />
                ) : (
                  formatNumber(stat.value)
                )}
              </p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="card">
        <h2 className="text-lg font-semibold text-white mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions
            .filter(action => !role || action.roles.includes(role) || role === 1)
            .map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className="card-feature group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon size={24} className="text-white" />
                </div>
                <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors flex items-center gap-2">
                  {action.label}
                  <FiArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              </Link>
            ))}
        </div>
      </motion.div>

      {/* Admin/Regulator: Network info - so you know which blockchain you're viewing */}
      {(role === 1 || role === 6) && (
        <motion.div variants={itemVariants} className="card bg-slate-800/50 border border-slate-600/50">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Network (data source)</h3>
          <p className="text-xs text-slate-400 font-mono break-all">{DEV_RPC_URL}</p>
          <p className="text-xs text-slate-500 mt-2">
            To see prescriptions and batches created on other PCs, run the blockchain on one PC and point this app to it: set <code className="bg-slate-700 px-1 rounded">VITE_DEV_RPC_URL=http://OTHER_PC_IP:8545</code> and <code className="bg-slate-700 px-1 rounded">VITE_CONTRACT_ADDRESS</code> (same as deploy) in <code className="bg-slate-700 px-1 rounded">.env</code>, then restart.
          </p>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Admin: All prescriptions from network (from any PC) */}
        {(role === 1 || role === 6) && (
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                All prescriptions (network)
              </h2>
              <Link to="/pharmacy" className="text-primary-400 text-sm hover:underline">
                Verify at Pharmacy
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-14 rounded-lg" />
                ))}
              </div>
            ) : allPrescriptions.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <FiFileText size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No prescriptions on this network yet.</p>
                <p className="text-xs mt-1">Connect to the same RPC as other PCs to see their data.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {allPrescriptions.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <FiFileText className="text-primary-400" size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white">#{p.id}</p>
                        <p className="text-xs text-gray-500 truncate font-mono">{shortenAddress(p.doctor, 4)}</p>
                        <p className="text-xs text-gray-400">{formatTimestamp(p.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`badge flex-shrink-0 ${p.isDispensed ? 'badge-success' : 'badge-warning'}`}>
                      {p.isDispensed ? 'Dispensed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Recent Prescriptions */}
        {role === 2 && (
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {t('dashboard.recentActivity')}
              </h2>
              <Link to="/prescription/create" className="text-primary-400 text-sm hover:underline">
                View All
              </Link>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : recentPrescriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FiFileText size={40} className="mx-auto mb-3 opacity-50" />
                <p>No prescriptions yet</p>
                <Link to="/prescription/create" className="btn-primary mt-4 inline-flex">
                  Create First Prescription
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPrescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <FiFileText className="text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          Prescription #{prescription.id}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatTimestamp(prescription.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${
                      prescription.isDispensed 
                        ? 'badge-success' 
                        : 'badge-warning'
                    }`}>
                      {prescription.isDispensed ? 'Dispensed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Alerts */}
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiAlertTriangle className="text-yellow-400" />
              {t('dashboard.activeAlerts')}
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FiCheckCircle size={40} className="mx-auto mb-3 text-primary-400" />
              <p>No active alerts</p>
              <p className="text-sm mt-1">System is running smoothly</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${
                    alert.type === 'recalled'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FiAlertTriangle 
                      className={alert.type === 'recalled' ? 'text-red-400' : 'text-yellow-400'} 
                      size={20}
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${
                        alert.type === 'recalled' ? 'text-red-300' : 'text-yellow-300'
                      }`}>
                        {alert.type === 'recalled' ? 'RECALL ALERT' : 'Suspicious Batch'}
                      </p>
                      <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <FiClock size={12} />
                        {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* System Health - For Admin/Regulator */}
        {(role === 1 || role === 6) && (
          <motion.div variants={itemVariants} className="card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiActivity className="text-primary-400" />
              {t('dashboard.systemHealth')}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <span className="text-gray-300">Blockchain Network</span>
                <span className="badge badge-success">Connected</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <span className="text-gray-300">Smart Contract</span>
                <span className="badge badge-success">Active</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <span className="text-gray-300">Total Users</span>
                <span className="text-white font-semibold">{formatNumber(stats.totalUsers)}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <span className="text-gray-300">Recalled Batches</span>
                <span className={`font-semibold ${stats.recalledCount > 0 ? 'text-red-400' : 'text-white'}`}>
                  {formatNumber(stats.recalledCount)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Batch Journey Timeline */}
      <motion.div variants={itemVariants}>
        <BatchTimeline batchNumber={null} compact={false} />
      </motion.div>

      {/* Live Transaction Feed - Shows real-time blockchain events */}
      <motion.div variants={itemVariants}>
        <TransactionFeed maxEvents={20} autoScroll={true} showHeader={true} />
      </motion.div>
    </motion.div>
  )
}

export default Dashboard
