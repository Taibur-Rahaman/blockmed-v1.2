import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import DatePicker from 'react-datepicker'
import { ethers } from 'ethers'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import {
  FiBox, FiPlus, FiAlertTriangle, FiCheckCircle, FiX,
  FiSearch, FiFilter, FiRefreshCw
} from 'react-icons/fi'

import { useStore } from '../store/useStore'
import { hasFeatureAccess, isUserRestricted } from '../utils/helpers'
import { CONTRACT_ADDRESS } from '../utils/config'
import contractABI from '../utils/contractABI.json'
import { formatTimestamp, shortenAddress, isExpired, getBatchStatus } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'

const BatchManagement = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { account, role } = useStore()

  // Check access control
  useEffect(() => {
    if (account) {
      if (isUserRestricted(account)) {
        toast.error('Your account is restricted. You cannot access this feature.')
        navigate('/')
        return
      }
      if (!hasFeatureAccess(account, 'canCreateBatch')) {
        toast.error('You do not have permission to create batches.')
        navigate('/')
      }
    }
  }, [account, navigate])

  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all') // all, flagged, recalled, expired
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    batchNumber: '',
    medicineName: '',
    genericName: '',
    expiryDate: null,
    origin: '',
  })

  // Load batches
  useEffect(() => {
    loadBatches()
  }, [account])

  const loadBatches = async () => {
    if (!window.ethereum) return

    setLoading(true)
    try {
  const provider = window.__sharedBrowserProvider || new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)

      const batchCount = await contract.batchCount()
      const results = []

      for (let i = 1; i <= Number(batchCount); i++) {
        const b = await contract.getMedicineBatch(i)
        results.push({
          id: Number(b.id),
          batchNumber: b.batchNumber,
          medicineName: b.medicineName,
          genericName: b.genericName,
          manufacturer: b.manufacturer,
          manufacturedAt: Number(b.manufacturedAt),
          expiresAt: Number(b.expiresAt),
          origin: b.origin,
          isRecalled: b.isRecalled,
          recallReason: b.recallReason,
          isFlagged: b.isFlagged,
          flagReason: b.flagReason,
        })
      }

      setBatches(results.reverse())
    } catch (error) {
      console.error('Error loading batches:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter batches
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = (batch.batchNumber + batch.medicineName + batch.genericName)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'flagged' && batch.isFlagged) ||
      (filter === 'recalled' && batch.isRecalled) ||
      (filter === 'expired' && isExpired(batch.expiresAt))

    return matchesSearch && matchesFilter
  })

  // Create batch
  const handleCreateBatch = async (e) => {
    e.preventDefault()

    if (!formData.batchNumber || !formData.medicineName || !formData.expiryDate) {
      toast.error('Please fill all required fields')
      return
    }

    setSubmitting(true)

    try {
  const provider = window.__sharedBrowserProvider || new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)

      const expiryTimestamp = Math.floor(formData.expiryDate.getTime() / 1000)

      const tx = await contract.createMedicineBatch(
        formData.batchNumber,
        formData.medicineName,
        formData.genericName,
        expiryTimestamp,
        formData.origin,
        '' // ipfsHash
      )

      toast.loading('Creating batch on blockchain...')
      await tx.wait()
      toast.dismiss()
      toast.success(t('batch.batchCreated'))

      setShowForm(false)
      setFormData({
        batchNumber: '',
        medicineName: '',
        genericName: '',
        expiryDate: null,
        origin: '',
      })

      await loadBatches()
    } catch (error) {
      console.error('Create batch error:', error)
      toast.error(error.message || 'Failed to create batch')
    } finally {
      setSubmitting(false)
    }
  }

  // Recall batch
  const handleRecall = async (batch) => {
    const reason = prompt('Enter recall reason:')
    if (!reason) return

    try {
  const provider = window.__sharedBrowserProvider || new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)

      const tx = await contract.recallBatch(batch.id, reason)
      toast.loading('Recalling batch...')
      await tx.wait()
      toast.dismiss()
      toast.success(t('batch.batchRecalled'))

      await loadBatches()
    } catch (error) {
      console.error('Recall error:', error)
      toast.error(error.message || 'Failed to recall batch')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FiBox className="text-primary-400" />
              {t('batch.title')}
            </h1>
            <p className="text-gray-400 mt-1">{t('batch.subtitle')}</p>
          </div>
          {(role === 1 || role === 4) && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <FiPlus size={18} />
              {t('batch.createBatch')}
            </button>
          )}
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
              placeholder="Search batches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            {['all', 'flagged', 'recalled', 'expired'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? f === 'recalled' ? 'bg-red-500/20 text-red-400'
                    : f === 'flagged' ? 'bg-yellow-500/20 text-yellow-400'
                    : f === 'expired' ? 'bg-gray-500/20 text-gray-400'
                    : 'bg-primary-500/20 text-primary-400'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <button onClick={loadBatches} className="btn-icon" disabled={loading}>
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Create Batch Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">{t('batch.createBatch')}</h2>
                <button onClick={() => setShowForm(false)} className="btn-icon">
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">{t('batch.batchNumber')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="e.g., BATCH-2024-001"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">{t('batch.medicineName')} *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.medicineName}
                      onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                      placeholder="e.g., Paracetamol 500mg"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('batch.genericName')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.genericName}
                      onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                      placeholder="e.g., Acetaminophen"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('batch.expiresAt')} *</label>
                  <DatePicker
                    selected={formData.expiryDate}
                    onChange={(date) => setFormData({ ...formData, expiryDate: date })}
                    minDate={new Date()}
                    dateFormat="dd MMM yyyy"
                    placeholderText="Select expiry date"
                    className="form-input w-full"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('batch.origin')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="e.g., Dhaka Factory, Bangladesh"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                    {t('common.cancel')}
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting ? (
                      <>
                        <span className="loader w-5 h-5" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FiPlus size={18} />
                        {t('batch.createBatch')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batches Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))
        ) : filteredBatches.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            <FiBox size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No batches found</p>
          </div>
        ) : (
          filteredBatches.map((batch) => {
            const status = getBatchStatus(batch)
            
            return (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card border-2 ${
                  batch.isRecalled ? 'border-red-500/50 bg-red-500/5' :
                  batch.isFlagged ? 'border-yellow-500/50 bg-yellow-500/5' :
                  isExpired(batch.expiresAt) ? 'border-gray-500/50' :
                  'border-white/10'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`badge ${
                      batch.isRecalled ? 'badge-danger' :
                      batch.isFlagged ? 'badge-warning' :
                      isExpired(batch.expiresAt) ? 'bg-gray-500/20 text-gray-400' :
                      'badge-success'
                    }`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <QRCodeSVG
                    value={JSON.stringify({ batchNumber: batch.batchNumber })}
                    size={60}
                    level="M"
                    className="rounded-lg"
                  />
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">
                  {batch.medicineName}
                </h3>
                <p className="text-sm text-gray-400 mb-3">{batch.genericName}</p>

                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-400">Batch:</span>
                    <span className="text-white font-mono">{batch.batchNumber}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Manufactured:</span>
                    <span className="text-white">{formatTimestamp(batch.manufacturedAt, 'dd MMM yyyy')}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Expires:</span>
                    <span className={isExpired(batch.expiresAt) ? 'text-red-400' : 'text-white'}>
                      {formatTimestamp(batch.expiresAt, 'dd MMM yyyy')}
                    </span>
                  </p>
                  {batch.origin && (
                    <p className="flex justify-between">
                      <span className="text-gray-400">Origin:</span>
                      <span className="text-white">{batch.origin}</span>
                    </p>
                  )}
                </div>

                {(batch.isRecalled || batch.isFlagged) && (
                  <div className={`mt-3 p-2 rounded-lg text-sm ${
                    batch.isRecalled ? 'bg-red-500/10 text-red-300' : 'bg-yellow-500/10 text-yellow-300'
                  }`}>
                    <strong>Reason:</strong> {batch.recallReason || batch.flagReason}
                  </div>
                )}

                {/* Actions */}
                {(role === 1 || role === 4 || role === 6) && !batch.isRecalled && (
                  <button
                    onClick={() => handleRecall(batch)}
                    className="btn-danger w-full mt-4 text-sm"
                  >
                    <FiAlertTriangle size={16} />
                    {t('batch.recallBatch')}
                  </button>
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default BatchManagement

