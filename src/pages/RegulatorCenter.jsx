import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  FiShield, FiAlertTriangle, FiPackage, FiFileText, FiUsers, FiActivity, FiClock,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useStore } from '../store/useStore'
import { formatNumber, isUserRestricted, hasFeatureAccess, shortenAddress, formatTimestamp } from '../utils/helpers'
import { getReadContract, isBlockchainReady } from '../utils/contractHelper'
import TransactionFeed from '../components/TransactionFeed'

const RegulatorCenter = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { account, role } = useStore()

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPrescriptions: 0,
    totalBatches: 0,
    dispensedCount: 0,
    flaggedCount: 0,
    recalledCount: 0,
  })
  const [flagged, setFlagged] = useState([])
  const [recalled, setRecalled] = useState([])
  const [loading, setLoading] = useState(true)

  // Access control – only Admin (1) and Regulator (6)
  useEffect(() => {
    if (!account) return
    if (role !== 1 && role !== 6) {
      toast.error('Regulator Center is only available for Admin and Regulator roles.')
      navigate('/')
      return
    }
    if (isUserRestricted(account)) {
      toast.error('Your account is restricted. You cannot access this feature.')
      navigate('/')
      return
    }
    if (!hasFeatureAccess(account, 'canViewAnalytics')) {
      toast.error('You do not have permission to view regulator analytics.')
      navigate('/')
    }
  }, [account, role, navigate])

  useEffect(() => {
    loadData()
  }, [account])

  const loadData = async () => {
    setLoading(true)
    try {
      const ready = await isBlockchainReady()
      if (!ready.ready) {
        toast.error(ready.error || 'Blockchain not connected. Run npm run blockchain and npm run deploy.')
        setLoading(false)
        return
      }
      const contract = await getReadContract()

      // System stats
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
        console.error('Error loading system stats:', e)
      }

      // Flagged & recalled batches – fetch last few
      try {
        const flaggedIds = await contract.getFlaggedBatches()
        const recalledIds = await contract.getRecalledBatches()

        const loadBatchSummaries = async (ids) => {
          const out = []
          const start = Math.max(0, ids.length - 5)
          for (let i = ids.length - 1; i >= start; i--) {
            const id = Number(ids[i])
            try {
              const b = await contract.getMedicineBatch(id)
              out.push({
                id,
                batchNumber: b.batchNumber,
                medicineName: b.medicineName,
                manufacturer: b.manufacturer,
                createdAt: Number(b.createdAt),
                recallReason: b.recallReason,
                flagReason: b.flagReason,
                isRecalled: b.isRecalled,
                isFlagged: b.isFlagged,
              })
            } catch (err) {
              console.warn('Error loading batch', id, err?.message)
            }
          }
          return out
        }

        const [flaggedSummaries, recalledSummaries] = await Promise.all([
          loadBatchSummaries(flaggedIds),
          loadBatchSummaries(recalledIds),
        ])

        setFlagged(flaggedSummaries)
        setRecalled(recalledSummaries)
      } catch (e) {
        console.error('Error loading flagged/recalled batches:', e)
      }
    } catch (error) {
      console.error('RegulatorCenter error:', error)
      toast.error(error?.message || 'Failed to load regulator data.')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      label: 'Total Prescriptions',
      value: stats.totalPrescriptions,
      icon: FiFileText,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/20',
    },
    {
      label: 'Dispensed',
      value: stats.dispensedCount,
      icon: FiActivity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Medicine Batches',
      value: stats.totalBatches,
      icon: FiPackage,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
    {
      label: 'Recalled / Flagged',
      value: `${stats.recalledCount}/${stats.flaggedCount}`,
      icon: FiAlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FiShield className="text-primary-400" />
              Regulator Command Center
            </h1>
            <p className="text-gray-400 mt-1">
              Network‑wide view of recalls, flagged batches, and prescription activity.
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary self-start"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, idx) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card-stat"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-xl ${s.bgColor}`}>
                <s.icon size={24} className={s.color} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading && typeof s.value === 'number'
                ? <span className="skeleton w-16 h-8 inline-block" />
                : typeof s.value === 'number'
                ? formatNumber(s.value)
                : s.value}
            </p>
            <p className="text-sm text-gray-400 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recalled batches */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-red-400" />
            Recent Recalled Batches
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          ) : recalled.length === 0 ? (
            <p className="text-gray-400 text-sm">No recalled batches on this network yet.</p>
          ) : (
            <div className="space-y-3">
              {recalled.map((b) => (
                <div
                  key={`recalled-${b.id}`}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">
                        {b.medicineName} <span className="text-xs text-gray-300">({b.batchNumber})</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Reason: {b.recallReason || '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-300">
                        ID #{b.id}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-1">
                        <FiClock size={10} />
                        {formatTimestamp(b.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flagged batches */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-yellow-400" />
            Recent Flagged Batches
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          ) : flagged.length === 0 ? (
            <p className="text-gray-400 text-sm">No flagged batches on this network yet.</p>
          ) : (
            <div className="space-y-3">
              {flagged.map((b) => (
                <div
                  key={`flagged-${b.id}`}
                  className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">
                        {b.medicineName} <span className="text-xs text-gray-300">({b.batchNumber})</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Reason: {b.flagReason || '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-300">
                        ID #{b.id}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-1">
                        <FiClock size={10} />
                        {formatTimestamp(b.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live on-chain events view */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiActivity className="text-primary-400" />
          Live Network Activity
        </h2>
        <TransactionFeed maxEvents={30} autoScroll={false} showHeader={false} />
      </div>
    </div>
  )
}

export default RegulatorCenter

