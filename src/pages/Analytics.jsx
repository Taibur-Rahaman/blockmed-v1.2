import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts'
import {
  FiPieChart, FiTrendingUp, FiActivity, FiAlertTriangle,
  FiFileText, FiPackage, FiUsers, FiCheckCircle
} from 'react-icons/fi'

import { useStore } from '../store/useStore'
import { formatNumber, hasFeatureAccess, isUserRestricted } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6', '#f97316']

const Analytics = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { role, account } = useStore()

  // Check access control
  useEffect(() => {
    if (account) {
      if (isUserRestricted(account)) {
        toast.error('Your account is restricted. You cannot access this feature.')
        navigate('/')
        return
      }
      if (!hasFeatureAccess(account, 'canViewAnalytics')) {
        toast.error('You do not have permission to view analytics.')
        navigate('/')
      }
    }
  }, [account, navigate])

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPrescriptions: 0,
    totalBatches: 0,
    dispensedCount: 0,
    flaggedCount: 0,
    recalledCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const { getReadContract, isBlockchainReady } = await import('../utils/contractHelper')
      
      // Check if blockchain is ready
      const ready = await isBlockchainReady()
      if (!ready.ready) {
        toast.error(ready.error || 'Blockchain not connected')
        setLoading(false)
        return
      }

      const contract = await getReadContract()

      // Try to get system stats, fallback to individual calls if method doesn't exist
      try {
        const systemStats = await contract.getSystemStats()
        setStats({
          totalUsers: Number(systemStats[0]),
          totalPrescriptions: Number(systemStats[1]),
          totalBatches: Number(systemStats[2]),
          dispensedCount: Number(systemStats[3]),
          flaggedCount: Number(systemStats[4]),
          recalledCount: Number(systemStats[5]),
        })
      } catch (e) {
        // Fallback: get individual stats
        const prescriptionCount = await contract.prescriptionCount()
        const batchCount = await contract.batchCount()
        
        setStats({
          totalUsers: 0,
          totalPrescriptions: Number(prescriptionCount),
          totalBatches: Number(batchCount),
          dispensedCount: 0,
          flaggedCount: 0,
          recalledCount: 0,
        })
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error(error?.message || 'Failed to load analytics. Is blockchain running?')
    } finally {
      setLoading(false)
    }
  }

  // Sample data for charts
  const prescriptionData = [
    { name: 'Mon', prescriptions: 12, dispensed: 8 },
    { name: 'Tue', prescriptions: 19, dispensed: 15 },
    { name: 'Wed', prescriptions: 15, dispensed: 12 },
    { name: 'Thu', prescriptions: 22, dispensed: 18 },
    { name: 'Fri', prescriptions: 28, dispensed: 24 },
    { name: 'Sat', prescriptions: 8, dispensed: 6 },
    { name: 'Sun', prescriptions: 5, dispensed: 4 },
  ]

  const roleDistribution = [
    { name: 'Doctors', value: 35, color: '#22c55e' },
    { name: 'Pharmacists', value: 45, color: '#3b82f6' },
    { name: 'Manufacturers', value: 10, color: '#eab308' },
    { name: 'Patients', value: 100, color: '#8b5cf6' },
    { name: 'Regulators', value: 5, color: '#f97316' },
  ]

  const batchStatus = [
    { name: 'Active', value: stats.totalBatches - stats.recalledCount - stats.flaggedCount },
    { name: 'Flagged', value: stats.flaggedCount },
    { name: 'Recalled', value: stats.recalledCount },
  ]

  const activityData = [
    { time: '00:00', activity: 5 },
    { time: '04:00', activity: 2 },
    { time: '08:00', activity: 25 },
    { time: '12:00', activity: 45 },
    { time: '16:00', activity: 38 },
    { time: '20:00', activity: 22 },
  ]

  const statCards = [
    { 
      label: t('dashboard.totalPrescriptions'), 
      value: stats.totalPrescriptions, 
      icon: FiFileText,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/20',
      change: '+12%'
    },
    { 
      label: 'Dispensed', 
      value: stats.dispensedCount, 
      icon: FiCheckCircle,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      change: '+8%'
    },
    { 
      label: 'Medicine Batches', 
      value: stats.totalBatches, 
      icon: FiPackage,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      change: '+5%'
    },
    { 
      label: 'Total Users', 
      value: stats.totalUsers, 
      icon: FiUsers,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      change: '+15%'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FiPieChart className="text-primary-400" />
          {t('analytics.title')}
        </h1>
        <p className="text-gray-400 mt-1">{t('analytics.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card-stat"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <span className="text-sm text-primary-400 font-medium">
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? (
                <span className="skeleton w-16 h-8 inline-block" />
              ) : (
                formatNumber(stat.value)
              )}
            </p>
            <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Prescription Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-primary-400" />
            Prescription Trend (Weekly)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={prescriptionData}>
                <defs>
                  <linearGradient id="colorPrescriptions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDispensed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="prescriptions" 
                  stroke="#22c55e" 
                  fillOpacity={1} 
                  fill="url(#colorPrescriptions)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="dispensed" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorDispensed)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* User Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiUsers className="text-primary-400" />
            User Distribution
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {roleDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Batch Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiPackage className="text-primary-400" />
            Batch Status
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={batchStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {batchStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiActivity className="text-primary-400" />
            System Activity (Today)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="activity" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Alerts Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiAlertTriangle className="text-yellow-400" />
          {t('analytics.alerts')}
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-3xl font-bold text-yellow-400">{stats.flaggedCount}</p>
            <p className="text-sm text-yellow-300 mt-1">Flagged Batches</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-3xl font-bold text-red-400">{stats.recalledCount}</p>
            <p className="text-sm text-red-300 mt-1">Recalled Batches</p>
          </div>
          <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
            <p className="text-3xl font-bold text-primary-400">
              {stats.totalPrescriptions - stats.dispensedCount}
            </p>
            <p className="text-sm text-primary-300 mt-1">Pending Prescriptions</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Analytics

