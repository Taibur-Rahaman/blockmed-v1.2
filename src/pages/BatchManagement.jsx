import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import DatePicker from 'react-datepicker'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import {
  FiBox, FiPlus, FiAlertTriangle, FiCheckCircle, FiX,
  FiSearch, FiFilter, FiRefreshCw
} from 'react-icons/fi'

import { useStore } from '../store/useStore'
import { hasFeatureAccess, isUserRestricted } from '../utils/helpers'
import { getReadContract, getWriteContract, isBlockchainReady, getFriendlyErrorMessage } from '../utils/contractHelper'
import { DEMO_BATCHES } from '../data/demoBatches'
import { formatTimestamp, shortenAddress, isExpired, getBatchStatus } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'
import { BlockchainBadge, BlockchainInfo, BlockchainActivityBadge } from '../components/BlockchainInfo'

const BatchManagement = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { account, role, language, demoBatchesVersion, incrementDemoBatchesVersion } = useStore()

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
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastTx, setLastTx] = useState({ hash: null, block: null })
  const [chainReady, setChainReady] = useState(false)
  const [usingDemoData, setUsingDemoData] = useState(false)

  const [formData, setFormData] = useState({
    batchNumber: '',
    medicineName: '',
    genericName: '',
    expiryDate: null,
    origin: '',
    totalUnits: '',
  })

  // Load batches
  useEffect(() => {
    loadBatches()
  }, [account])

  const loadBatches = async () => {
    const ready = await isBlockchainReady()
    if (!ready.ready) {
      setChainReady(false)
      setUsingDemoData(true)
      setBatches(DEMO_BATCHES)
      setLoading(false)
      return
    }

    setChainReady(true)
    setBatches(DEMO_BATCHES) // Show demo immediately while loading from chain
    setLoading(true)
    try {
      const contract = await getReadContract()
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
          totalUnits: Number(b.totalUnits ?? 0),
          dispensedUnits: Number(b.dispensedUnits ?? 0),
        })
      }

      // Use demo data when chain has no batches (helps demos & onboarding)
      const hasRealBatches = results.length > 0
      setUsingDemoData(!hasRealBatches)
      setBatches(hasRealBatches ? results.reverse() : DEMO_BATCHES)
    } catch (error) {
      console.error('Error loading batches:', error)
      toast.error(error?.message || 'Failed to load batches. Is blockchain running?')
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

    const batchNum = String(formData.batchNumber || '').trim()
    const medName = String(formData.medicineName || '').trim()
    if (!batchNum || !medName) {
      toast.error(language === 'bn' ? 'ব্যাচ নম্বর ও ওষুধের নাম পূরণ করুন' : 'Fill batch number and medicine name')
      return
    }
    if (!formData.expiryDate) {
      toast.error(language === 'bn' ? 'মেয়াদ উত্তীর্ণের তারিখ নির্বাচন করুন' : 'Select expiry date')
      return
    }

    setSubmitting(true)

    // Demo mode: simulate batch creation locally (no blockchain)
    if (usingDemoData) {
      if (DEMO_BATCHES.some(b => String(b.batchNumber).toLowerCase() === batchNum.toLowerCase())) {
        toast.error(language === 'bn' ? 'এই ব্যাচ নম্বর ইতিমধ্যে আছে' : 'Batch number already exists')
        setSubmitting(false)
        return
      }
      const now = Math.floor(Date.now() / 1000)
      const expiryTs = Math.floor(formData.expiryDate.getTime() / 1000)
      const totalUnits = parseInt(String(formData.totalUnits || '0'), 10) || 0
      const newId = Math.max(...DEMO_BATCHES.map(b => b.id), 0) + 1
      DEMO_BATCHES.unshift({
        id: newId,
        batchNumber: batchNum,
        medicineName: medName,
        genericName: String(formData.genericName || '').trim(),
        manufacturer: '',
        manufacturedAt: now,
        expiresAt: expiryTs,
        origin: String(formData.origin || '').trim(),
        isRecalled: false,
        recallReason: '',
        isFlagged: false,
        flagReason: '',
        totalUnits: Math.max(0, totalUnits),
        dispensedUnits: 0,
      })
      incrementDemoBatchesVersion()
      setBatches([...DEMO_BATCHES])
      toast.success(language === 'bn' ? 'ব্যাচ সিমিউলেটেড হিসাবে তৈরি হয়েছে (ডেমো)' : 'Batch created — simulated (demo)')
      setShowForm(false)
      setFormData({
        batchNumber: '',
        medicineName: '',
        genericName: '',
        expiryDate: null,
        origin: '',
        totalUnits: '',
      })
      setSubmitting(false)
      return
    }

    try {
      const contract = await getWriteContract()
      const expiryTimestamp = Math.floor(formData.expiryDate.getTime() / 1000)

      const totalUnits = parseInt(String(formData.totalUnits || '0'), 10) || 0

      const tx = await contract.createMedicineBatch(
        batchNum,
        medName,
        String(formData.genericName || '').trim(),
        expiryTimestamp,
        String(formData.origin || '').trim(),
        '',
        totalUnits
      )

      toast.loading('Creating batch on blockchain...')
      const receipt = await tx.wait()
      toast.dismiss()
      toast.success(t('batch.batchCreated'))
      setLastTx({ hash: tx.hash, block: receipt?.blockNumber ?? null })

      setShowForm(false)
      setFormData({
        batchNumber: '',
        medicineName: '',
        genericName: '',
        expiryDate: null,
        origin: '',
        totalUnits: '',
      })

      await loadBatches()
    } catch (error) {
      console.error('Create batch error:', error)
      toast.error(getFriendlyErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  // Recall batch
  const handleRecall = async (batch) => {
    const reason = prompt(
      t('batch.recallReason') + '\n(e.g. ' + (t('common.yes') === 'Yes' ? 'contamination, wrong label' : 'দূষণ, ভুল লেবেল') + ')',
      ''
    )
    if (!reason || !reason.trim()) return

    // Demo mode: simulate recall locally
    if (usingDemoData) {
      const demo = DEMO_BATCHES.find(b => String(b.batchNumber) === String(batch.batchNumber))
      if (demo) {
        demo.isRecalled = true
        demo.recallReason = reason.trim()
        incrementDemoBatchesVersion()
        setBatches([...DEMO_BATCHES])
        toast.success(language === 'bn' ? 'ব্যাচ সিমিউলেটেড হিসাবে প্রত্যাহার করা হয়েছে (ডেমো)' : 'Batch recalled — simulated (demo)')
      }
      return
    }

    try {
      const contract = await getWriteContract()
      const tx = await contract.recallBatch(batch.id, reason)
      toast.loading('Recalling batch...')
      const receipt = await tx.wait()
      toast.dismiss()
      toast.success(t('batch.batchRecalled'))
      setLastTx({ hash: tx.hash, block: receipt?.blockNumber ?? null })

      await loadBatches()
    } catch (error) {
      console.error('Recall error:', error)
      toast.error(getFriendlyErrorMessage(error))
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
              {loading && chainReady ? (
                <BlockchainActivityBadge loading={true} language={language} label={language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'} />
              ) : !usingDemoData ? (
                <BlockchainBadge label="From blockchain" />
              ) : (
                <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  Demo data
                </span>
              )}
            </h1>
            <p className="text-gray-400 mt-1">
              {loading && chainReady
                ? (language === 'bn' ? 'ব্লকচেইনে ব্যাচ লোড হচ্ছে...' : 'Loading batches from blockchain...')
                : !usingDemoData ? t('batch.subtitle') : 'Showing demo batches. Connect wallet or enable Dev Mode to create real batches.'}
            </p>
          </div>
          {(role === 1 || role === 4) && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <FiPlus size={18} />
              {t('batch.createBatch')}
            </button>
          )}
        </div>
      </div>

      {lastTx.hash && (
        <div className="card">
          <BlockchainInfo
            title="Last transaction on-chain"
            txHash={lastTx.hash}
            blockNumber={lastTx.block}
            compact
          />
        </div>
      )}

      {!chainReady && (
        <div className="card border-amber-500/40 bg-amber-500/10">
          <p className="text-amber-300 font-medium">
            {t('common.loading') === 'Loading...' ? 'Blockchain not connected. Connect wallet or Dev Mode to view and create batches.' : 'ব্লকচেইন সংযুক্ত নয়। ব্যাচ দেখতে ও তৈরি করতে ওয়ালেট বা ডেভ মোড চালু করুন।'}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:max-w-md relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="form-input pl-10 w-full"
              placeholder={t('batch.batchNumber') + ' / ' + t('batch.medicineName') + '...'}
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

                <div className="form-group">
                  <label className="form-label">{t('batch.totalUnits') || 'Total Units (boxes/packs)'}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={formData.totalUnits}
                    onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                    placeholder="e.g., 1000 (use 0 for no quantity tracking)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'bn' ? 'প্রতি ব্যাচে মোট ইউনিট। 0 = পরিমাণ ট্র্যাকিং নেই' : 'Total units in batch. 0 = no quantity tracking'}
                  </p>
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
            <FiBox size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-white font-medium mb-2">
              {batches.length === 0
                ? (language === 'bn' ? 'এখনও কোনো ব্যাচ নেই' : 'No batches yet')
                : (language === 'bn' ? 'ফিল্টারে মিলছে না' : 'No batches match filter')}
            </p>
            <p className="text-gray-400 mb-4">
              {batches.length === 0
                ? (language === 'bn' ? 'প্রথম ব্যাচ তৈরি করুন। ব্লকচেইনে ওষুধ নিবন্ধন করুন।' : 'Create your first batch to register medicine on blockchain.')
                : (language === 'bn' ? 'অন্য খুঁজুন বা ফিল্টার পরিবর্তন করুন।' : 'Try a different search or filter.')}
            </p>
            {batches.length === 0 && (role === 1 || role === 4) && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <FiPlus size={18} />
                {t('batch.createBatch')}
              </button>
            )}
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
                  {(batch.totalUnits ?? 0) > 0 && (
                    <p className="flex justify-between">
                      <span className="text-gray-400">Stock:</span>
                      <span className={`font-mono font-semibold ${
                        (batch.totalUnits - (batch.dispensedUnits ?? 0)) <= 0 ? 'text-red-400' : 'text-primary-400'
                      }`}>
                        {(batch.totalUnits ?? 0) - (batch.dispensedUnits ?? 0)} / {batch.totalUnits} units
                      </span>
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

