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
import { formatNumber, formatTimestamp, getRoleName } from '../utils/helpers'
import { getReadContract, getCurrentAccount } from '../utils/contractHelper'
import { isDevMode } from '../utils/devMode'

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
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [account])

  const fetchDashboardData = async () => {
    // Works with both Dev Mode and Wallet Mode
    if (!isDevMode() && !window.ethereum) return

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
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              {t('dashboard.welcome')}, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-gray-400 mt-1">
              {getRoleName(role)} Dashboard • {new Date().toLocaleDateString('en-US', { 
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

      <div className="grid lg:grid-cols-2 gap-6">
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
    </motion.div>
  )
}

export default Dashboard
