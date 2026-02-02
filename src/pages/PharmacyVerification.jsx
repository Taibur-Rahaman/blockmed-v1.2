import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import {
  FiSearch, FiCheckCircle, FiXCircle, FiAlertTriangle,
  FiCamera, FiPackage, FiClock, FiUser, FiHash, FiList, FiArrowRight, FiShield
} from 'react-icons/fi'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useStore } from '../store/useStore'
import { findDemoBatchByNumber } from '../data/demoBatches'
import { 
  formatTimestamp, shortenAddress, isExpired, daysUntilExpiry,
  getPrescriptionStatus, getBatchStatus, generatePatientHash,
  hasFeatureAccess, isUserRestricted
} from '../utils/helpers'
import { getReadContract, getWriteContract, isBlockchainReady, getFriendlyErrorMessage } from '../utils/contractHelper'
import { isDevMode } from '../utils/devMode'
import { BlockchainInfo, BlockchainBadge, BlockchainLoadingSteps, BlockchainVerificationProof } from '../components/BlockchainInfo'

const PharmacyVerification = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { account, language, role, incrementDemoBatchesVersion } = useStore()

  // Check access control
  useEffect(() => {
    if (account) {
      if (isUserRestricted(account)) {
        toast.error('Your account is restricted. You cannot access this feature.')
        navigate('/')
        return
      }
      if (!hasFeatureAccess(account, 'canDispense')) {
        toast.error('You do not have permission to dispense prescriptions.')
        navigate('/')
      }
    }
  }, [account, navigate])
  
  const [activeTab, setActiveTab] = useState('prescription')
  const [prescriptionId, setPrescriptionId] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [prescription, setPrescription] = useState(null)
  const [batch, setBatch] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const scannerRef = useRef(null)
  const [patientHistory, setPatientHistory] = useState([])
  const [lastTx, setLastTx] = useState({ hash: null, block: null })
  const [showHistory, setShowHistory] = useState(false)
  const [prescriptionData, setPrescriptionData] = useState(null)
  const [chainReady, setChainReady] = useState(false)
  const [purchaseQuantity, setPurchaseQuantity] = useState(1)
  const [verificationStep, setVerificationStep] = useState(0)

  // Check blockchain connection
  useEffect(() => {
    isBlockchainReady().then((r) => setChainReady(r.ready))
  }, [account])

  // Read prescriptionId from URL query parameter on mount
  useEffect(() => {
    const urlPrescriptionId = searchParams.get('prescriptionId')
    if (urlPrescriptionId && urlPrescriptionId !== prescriptionId) {
      setPrescriptionId(String(urlPrescriptionId).trim())
      setActiveTab('prescription')
    }
  }, [searchParams])

  // Initialize QR Scanner after DOM has qr-reader (so camera works)
  useEffect(() => {
    if (!showScanner) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
      return
    }
    const timer = setTimeout(() => {
      if (scannerRef.current || !document.getElementById('qr-reader')) return
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      })
      scanner.render(
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText)
            if (data.prescriptionId != null) {
              setPrescriptionId(String(data.prescriptionId).trim())
              setActiveTab('prescription')
            } else if (data.batchNumber) {
              setBatchNumber(String(data.batchNumber).trim())
              setActiveTab('batch')
            }
            scanner.clear().catch(() => {})
            setShowScanner(false)
            toast.success(language === 'bn' ? 'QR স্ক্যান সফল!' : 'QR Code scanned!')
          } catch {
            setPrescriptionId(String(decodedText).trim())
            scanner.clear().catch(() => {})
            setShowScanner(false)
            toast.success(language === 'bn' ? 'QR স্ক্যান সফল!' : 'QR Code scanned!')
          }
        },
        () => {}
      )
      scannerRef.current = scanner
    }, 300)
    return () => {
      clearTimeout(timer)
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [showScanner, language])

  // Load patient history by patientHash
  const loadPatientHistory = async (patientHash) => {
    if (!patientHash) return
    
    try {
      const contract = await getReadContract()
      const prescriptionIds = await contract.getPrescriptionsByPatient(patientHash)
      
      if (prescriptionIds.length === 0) {
        setPatientHistory([])
        return
      }

      // Load all prescription details
      const history = []
      for (const id of prescriptionIds) {
        try {
          const p = await contract.getPrescription(Number(id))
          history.push({
            id: Number(p.id),
            patientHash: p.patientHash,
            createdAt: Number(p.createdAt),
            expiresAt: Number(p.expiresAt),
            isDispensed: p.isDispensed,
            doctor: p.doctor,
          })
        } catch (error) {
          console.error(`Error loading prescription ${id}:`, error)
        }
      }

      // Sort by creation date (newest first)
      history.sort((a, b) => b.createdAt - a.createdAt)
      setPatientHistory(history)
    } catch (error) {
      console.error('Error loading patient history:', error)
      setPatientHistory([])
    }
  }

  // Load prescription
  const loadPrescription = async () => {
    const id = String(prescriptionId || '').trim()
    if (!id) {
      toast.error(language === 'bn' ? 'প্রেসক্রিপশন আইডি লিখুন' : 'Enter Prescription ID')
      return
    }
    const ready = await isBlockchainReady()
    if (!ready.ready) {
      toast.error(ready.error || (language === 'bn' ? 'ব্লকচেইন সংযুক্ত নয়' : 'Blockchain not connected'))
      return
    }

    setLoading(true)
    setPrescription(null)
    setPrescriptionData(null)
    setPatientHistory([])

    try {
      const contract = await getReadContract()
      const numId = Number(id)
      if (!Number.isInteger(numId) || numId < 1) {
        toast.error(language === 'bn' ? 'বৈধ প্রেসক্রিপশন আইডি লিখুন' : 'Enter a valid prescription ID (number)')
        setLoading(false)
        return
      }
      const result = await contract.getPrescription(numId)
      
      const prescriptionData = {
        id: Number(result.id),
        patientHash: result.patientHash,
        ipfsHash: result.ipfsHash,
        doctor: result.doctor,
        createdAt: Number(result.createdAt),
        expiresAt: Number(result.expiresAt),
        isDispensed: result.isDispensed,
        dispensedBy: result.dispensedBy,
        dispensedAt: Number(result.dispensedAt),
        version: Number(result.version),
        isActive: result.isActive,
      }
      
      setPrescription(prescriptionData)
      
      // Parse prescription data from ipfsHash (contains medicines, patient info, etc.)
      try {
        const parsedData = JSON.parse(result.ipfsHash)
        setPrescriptionData(parsedData)
        console.log('✅ Prescription data parsed:', parsedData)
      } catch (error) {
        console.error('Error parsing prescription data:', error)
        // If parsing fails, try to extract medicines from the string
        setPrescriptionData(null)
      }
      
      // Load patient history if we have patientHash
      if (result.patientHash) {
        await loadPatientHistory(result.patientHash)
      }
    } catch (error) {
      console.error('Error loading prescription:', error)
      toast.error(language === 'bn' ? 'প্রেসক্রিপশন পাওয়া যায়নি। আইডি ও নেটওয়ার্ক যাচাই করুন।' : 'Prescription not found. Check ID and network.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-load prescription when prescriptionId is set from URL
  useEffect(() => {
    const id = String(prescriptionId || '').trim()
    if (!id || loading) return
    const urlPrescriptionId = searchParams.get('prescriptionId')
    if (urlPrescriptionId && String(urlPrescriptionId).trim() === id && !prescription) {
      loadPrescription()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescriptionId])

  // Verify and dispense prescription
  const handleDispense = async () => {
    if (!prescription) return

    setLoading(true)

    try {
      const contract = await getWriteContract()
      const tx = await contract.dispensePrescription(prescription.id)
      toast.loading('Processing transaction on blockchain...')
      const receipt = await tx.wait()
      toast.dismiss()
      toast.success('Prescription dispensed on-chain!')
      setLastTx({ hash: tx.hash, block: receipt?.blockNumber ?? null })
      await loadPrescription()
    } catch (error) {
      console.error('Dispense error:', error)
      toast.error(getFriendlyErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  // Load batch
  const loadBatch = async () => {
    const num = String(batchNumber || '').trim()
    if (!num) {
      toast.error(language === 'bn' ? 'ব্যাচ নম্বর লিখুন' : 'Enter batch number')
      return
    }

    setLoading(true)
    setBatch(null)

    // Helper to set batch from demo data
    const setBatchFromDemo = (demo) => {
      if (!demo) return
      setBatch({
        id: demo.id,
        batchNumber: demo.batchNumber,
        medicineName: demo.medicineName,
        genericName: demo.genericName,
        manufacturer: demo.manufacturer || '',
        manufacturedAt: Number(demo.manufacturedAt),
        expiresAt: Number(demo.expiresAt),
        origin: demo.origin,
        isRecalled: demo.isRecalled,
        recallReason: demo.recallReason,
        isFlagged: demo.isFlagged,
        flagReason: demo.flagReason,
        totalUnits: Number(demo.totalUnits ?? 0),
        dispensedUnits: Number(demo.dispensedUnits ?? 0),
        isDemo: true,
      })
    }

    const ready = await isBlockchainReady()
    if (!ready.ready) {
      // Blockchain not connected - use demo data if batch exists
      const demo = findDemoBatchByNumber(num)
      if (demo) {
        setBatchFromDemo(demo)
        toast.success(language === 'bn' ? 'ডেমো ব্যাচ পাওয়া গেছে' : 'Demo batch found')
      } else {
        toast.error(ready.error || (language === 'bn' ? 'ব্লকচেইন সংযুক্ত নয়' : 'Blockchain not connected'))
      }
      setLoading(false)
      setVerificationStep(0)
      return
    }

    try {
      setVerificationStep(1)
      const contract = await getReadContract()
      setVerificationStep(2)
      const result = await contract.verifyBatch(num)
      const exists = result?.exists ?? result?.[0] ?? false
      const status = result?.status ?? result?.[4] ?? 'UNKNOWN'
      
      if (exists) {
        const batchData = await contract.getBatchByNumber(num)
        setBatch({
          id: Number(batchData.id),
          batchNumber: batchData.batchNumber,
          medicineName: batchData.medicineName,
          genericName: batchData.genericName,
          manufacturer: batchData.manufacturer,
          manufacturedAt: Number(batchData.manufacturedAt),
          expiresAt: Number(batchData.expiresAt),
          origin: batchData.origin,
          isRecalled: batchData.isRecalled,
          recallReason: batchData.recallReason,
          isFlagged: batchData.isFlagged,
          flagReason: batchData.flagReason,
          totalUnits: Number(batchData.totalUnits ?? 0),
          dispensedUnits: Number(batchData.dispensedUnits ?? 0),
          verificationStatus: status,
        })
      } else {
        // Not on chain - check demo data
        const demo = findDemoBatchByNumber(num)
        if (demo) {
          setBatchFromDemo(demo)
        } else {
          setBatch({
            notFound: true,
            status: status,
          })
        }
      }
    } catch (error) {
      console.error('Error loading batch:', error)
      // Fallback to demo data on error
      const demo = findDemoBatchByNumber(num)
      if (demo) {
        setBatchFromDemo(demo)
        toast.success(language === 'bn' ? 'ডেমো ব্যাচ প্রদর্শিত হচ্ছে' : 'Showing demo batch (blockchain unavailable)')
      } else {
        toast.error(language === 'bn' ? 'ব্যাচ যাচাই ব্যর্থ। নেটওয়ার্ক যাচাই করুন।' : 'Failed to verify batch. Check network.')
      }
    } finally {
      setLoading(false)
      setVerificationStep(0)
    }
  }

  // Flag batch
  const handleFlagBatch = async () => {
    if (!batch || batch.notFound) return

    const reason = prompt(
      language === 'bn' ? 'ব্যাচ সন্দেহজনক হিসাবে রিপোর্ট করার কারণ লিখুন:' : 'Enter reason for flagging this batch:',
      ''
    )
    if (!reason || !reason.trim()) return

    setLoading(true)

    try {
      const contract = await getWriteContract()
      const tx = await contract.flagBatch(batch.id, reason)
      toast.loading('Flagging batch on blockchain...')
      const receipt = await tx.wait()
      toast.dismiss()
      toast.success('Batch flagged on-chain!')
      setLastTx({ hash: tx.hash, block: receipt?.blockNumber ?? null })
      await loadBatch()
    } catch (error) {
      console.error('Flag error:', error)
      toast.error(getFriendlyErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  // Confirm purchase - deduct units from batch (on-chain: Pharmacist only; demo: simulated locally)
  const handleConfirmPurchase = async () => {
    if (!batch || batch.notFound) return
    const qty = parseInt(purchaseQuantity, 10) || 0
    if (qty < 1) {
      toast.error(language === 'bn' ? 'পরিমাণ ১ এর বেশি হতে হবে' : 'Quantity must be at least 1')
      return
    }
    const total = Number(batch.totalUnits ?? 0)
    const dispensed = Number(batch.dispensedUnits ?? 0)
    const remaining = total - dispensed
    if (total <= 0) {
      toast.error(language === 'bn' ? 'এই ব্যাচে পরিমাণ ট্র্যাকিং সক্ষম নয়' : 'Quantity tracking not enabled for this batch')
      return
    }
    if (qty > remaining) {
      toast.error(language === 'bn' 
        ? `স্টকে শুধু ${remaining} ইউনিট আছে। সম্ভাব্য জাল!` 
        : `Only ${remaining} units in stock. Possible counterfeit!`)
      return
    }

    // Demo mode: simulate locally (mutate DEMO_BATCHES so Batch Management also updates)
    if (batch.isDemo) {
      const demo = findDemoBatchByNumber(batch.batchNumber)
      if (demo) {
        const newDispensed = (demo.dispensedUnits || 0) + qty
        demo.dispensedUnits = newDispensed // Mutate for Batch Management
        incrementDemoBatchesVersion() // Trigger re-render in Batch Management
      }
      setBatch({
        ...batch,
        dispensedUnits: dispensed + qty,
      })
      toast.success(language === 'bn' ? `${qty} ইউনিট বিক্রয় সিমিউলেটেড (ডেমো)` : `${qty} unit(s) sold — simulated (demo)`)
      setPurchaseQuantity(1)
      return
    }

    // On-chain: require Pharmacist
    if (role !== 3) {
      toast.error(language === 'bn' ? 'শুধুমাত্র ফার্মাসিস্ট ক্রয় নিশ্চিত করতে পারবেন' : 'Only pharmacists can confirm purchase on blockchain')
      return
    }

    setLoading(true)
    try {
      const contract = await getWriteContract()
      const tx = await contract.dispenseFromBatch(batch.id, qty)
      toast.loading('Confirming purchase on blockchain...')
      const receipt = await tx.wait()
      toast.dismiss()
      toast.success(language === 'bn' ? `${qty} ইউনিট বিক্রয় নিশ্চিত হয়েছে` : `${qty} unit(s) sold — recorded on-chain`)
      setLastTx({ hash: tx.hash, block: receipt?.blockNumber ?? null })
      setPurchaseQuantity(1)
      await loadBatch()
    } catch (error) {
      console.error('Confirm purchase error:', error)
      if (error.message?.includes('Insufficient units')) {
        toast.error(language === 'bn' ? 'স্টকে পর্যাপ্ত ইউনিট নেই — সম্ভাব্য জাল!' : 'Insufficient units — possible counterfeit!')
      } else {
        toast.error(getFriendlyErrorMessage(error))
      }
    } finally {
      setLoading(false)
    }
  }

  const prescriptionStatus = prescription ? getPrescriptionStatus(prescription) : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FiCheckCircle className="text-primary-400" />
          {t('pharmacy.title')}
          <BlockchainBadge label="Verified on-chain" />
        </h1>
        <p className="text-gray-400 mt-1">{t('pharmacy.subtitle')}</p>
      </div>

      {!chainReady && (
        <div className="card border-amber-500/40 bg-amber-500/10">
          <p className="text-amber-300 font-medium">
            {language === 'bn' ? 'ব্লকচেইন সংযুক্ত নয়। প্রেসক্রিপশন ও ওষুধ যাচাই করতে ওয়ালেট বা ডেভ মোড চালু করুন।' : 'Blockchain not connected. Connect wallet or enable Dev Mode to verify prescriptions and medicine.'}
          </p>
        </div>
      )}

      {lastTx.hash && (
        <div className="card">
          <BlockchainInfo
            title="Last transaction"
            txHash={lastTx.hash}
            blockNumber={lastTx.block}
            compact
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('prescription')}
          className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
            activeTab === 'prescription'
              ? 'bg-primary-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <FiHash className="inline mr-2" />
          Verify Prescription
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
            activeTab === 'batch'
              ? 'bg-primary-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <FiPackage className="inline mr-2" />
          Verify Medicine
        </button>
      </div>

      {/* QR Scanner */}
      {showScanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-white">Scan QR Code</h3>
            <button
              onClick={() => setShowScanner(false)}
              className="btn-ghost text-sm"
            >
              Cancel
            </button>
          </div>
          <div id="qr-reader" className="rounded-xl overflow-hidden" />
        </motion.div>
      )}

      {/* Prescription Verification */}
      {activeTab === 'prescription' && (
        <div className="card">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder={t('pharmacy.enterPrescriptionId')}
                value={prescriptionId}
                onChange={(e) => setPrescriptionId(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="btn-secondary"
            >
              <FiCamera size={18} />
              {t('pharmacy.scanQR')}
            </button>
            <button
              onClick={loadPrescription}
              disabled={loading || !prescriptionId}
              className="btn-primary"
            >
              {loading ? 'Loading...' : t('pharmacy.loadPrescription')}
            </button>
          </div>

          {/* Prescription Details */}
          {prescription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border ${
                prescription.isDispensed
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : isExpired(prescription.expiresAt)
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-primary-500/10 border-primary-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  {prescription.isDispensed ? (
                    <FiCheckCircle size={24} className="text-blue-400" />
                  ) : isExpired(prescription.expiresAt) ? (
                    <FiXCircle size={24} className="text-red-400" />
                  ) : (
                    <FiCheckCircle size={24} className="text-primary-400" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      prescription.isDispensed
                        ? 'text-blue-300'
                        : isExpired(prescription.expiresAt)
                        ? 'text-red-300'
                        : 'text-primary-300'
                    }`}>
                      {prescription.isDispensed
                        ? t('pharmacy.alreadyDispensed')
                        : isExpired(prescription.expiresAt)
                        ? t('pharmacy.prescriptionExpired')
                        : 'Valid Prescription - Ready to Dispense'}
                    </p>
                    {prescription.isDispensed && (
                      <p className="text-sm text-gray-400 mt-1">
                        Dispensed by: {shortenAddress(prescription.dispensedBy)} at {formatTimestamp(prescription.dispensedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">Prescription ID</p>
                  <p className="text-lg font-semibold text-white">#{prescription.id}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">Version</p>
                  <p className="text-lg font-semibold text-white">v{prescription.version}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">{t('pharmacy.patientHash')}</p>
                  <p className="text-white font-mono text-sm break-all">{prescription.patientHash}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">{t('pharmacy.doctorAddress')}</p>
                  <p className="text-white font-mono text-sm">{shortenAddress(prescription.doctor)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">{t('pharmacy.timestamp')}</p>
                  <p className="text-white">{formatTimestamp(prescription.createdAt)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">{t('pharmacy.expiresOn')}</p>
                  <p className={`font-semibold ${
                    isExpired(prescription.expiresAt) ? 'text-red-400' : 'text-white'
                  }`}>
                    {formatTimestamp(prescription.expiresAt)}
                    {!isExpired(prescription.expiresAt) && (
                      <span className="text-sm text-gray-400 ml-2">
                        ({daysUntilExpiry(prescription.expiresAt)} days left)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Prescription Medicines - From Blockchain (Tamper-Proof) */}
              {prescriptionData && prescriptionData.medicines && prescriptionData.medicines.length > 0 && (
                <div className="p-6 rounded-xl bg-white/5 border-2 border-primary-500/50">
                  <div className="flex items-center gap-2 mb-4">
                    <FiPackage className="text-primary-400" size={20} />
                    <h3 className="text-lg font-semibold text-white">
                      Prescribed Medicines (Blockchain Verified)
                    </h3>
                    <span className="ml-auto px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1">
                      <FiCheckCircle size={12} />
                      Blockchain Verified
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
                    <p className="text-sm text-green-300 flex items-center gap-2">
                      <FiShield size={16} />
                      <strong>Security:</strong> These medicines are stored on the blockchain and <strong>cannot be edited</strong> by patients. 
                      The data is cryptographically secured and any tampering would be immediately detected.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {prescriptionData.medicines.map((medicine, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-primary-400 font-semibold">
                                {index + 1}.
                              </span>
                              <h4 className="text-white font-semibold">
                                {medicine.name || medicine.medicineName || 'Unknown Medicine'}
                              </h4>
                              {medicine.strength && (
                                <span className="text-gray-400 text-sm">
                                  ({medicine.strength})
                                </span>
                              )}
                            </div>
                            <div className="grid md:grid-cols-3 gap-2 text-sm">
                              {medicine.dose && (
                                <div>
                                  <span className="text-gray-400">Dose: </span>
                                  <span className="text-white">{medicine.dose}</span>
                                </div>
                              )}
                              {medicine.duration && (
                                <div>
                                  <span className="text-gray-400">Duration: </span>
                                  <span className="text-white">{medicine.duration}</span>
                                </div>
                              )}
                              {medicine.quantity && (
                                <div>
                                  <span className="text-gray-400">Quantity: </span>
                                  <span className="text-white">{medicine.quantity}</span>
                                </div>
                              )}
                            </div>
                            {medicine.instructions && (
                              <div className="mt-2">
                                <span className="text-gray-400 text-sm">Instructions: </span>
                                <span className="text-white text-sm">{medicine.instructions}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Prescription Details from Blockchain */}
              {prescriptionData && (
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiUser className="text-primary-400" />
                    Patient Information (From Blockchain)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {prescriptionData.patient && (
                      <>
                        {prescriptionData.patient.name && (
                          <div>
                            <p className="text-sm text-gray-400">Patient Name</p>
                            <p className="text-white font-medium">{prescriptionData.patient.name}</p>
                          </div>
                        )}
                        {prescriptionData.patient.nid && (
                          <div>
                            <p className="text-sm text-gray-400">NID</p>
                            <p className="text-white font-mono text-sm">{prescriptionData.patient.nid}</p>
                          </div>
                        )}
                        {prescriptionData.patient.age && (
                          <div>
                            <p className="text-sm text-gray-400">Age</p>
                            <p className="text-white">{prescriptionData.patient.age} years</p>
                          </div>
                        )}
                        {prescriptionData.patient.gender && (
                          <div>
                            <p className="text-sm text-gray-400">Gender</p>
                            <p className="text-white">{prescriptionData.patient.gender}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {prescriptionData.diagnosis && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-1">Diagnosis</p>
                      <p className="text-white">{prescriptionData.diagnosis}</p>
                    </div>
                  )}
                  {prescriptionData.symptoms && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-1">Symptoms</p>
                      <p className="text-white">{prescriptionData.symptoms}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Patient History Section */}
              {patientHistory.length > 1 && (
                <div className="p-4 rounded-xl bg-white/5 border border-primary-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <FiList className="text-primary-400" />
                      Patient History ({patientHistory.length} prescriptions)
                    </h3>
                    <button
                      onClick={() => navigate('/patient-history')}
                      className="btn-ghost text-sm"
                    >
                      View All <FiArrowRight size={14} className="inline ml-1" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {patientHistory.slice(0, 3).map((hist) => (
                      <div
                        key={hist.id}
                        className={`p-3 rounded-lg flex items-center justify-between ${
                          hist.id === prescription.id
                            ? 'bg-primary-500/20 border border-primary-500/50'
                            : 'bg-white/5'
                        }`}
                      >
                        <div>
                          <p className="text-white font-medium">
                            Prescription #{hist.id}
                            {hist.id === prescription.id && (
                              <span className="ml-2 text-xs text-primary-400">(Current)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatTimestamp(hist.createdAt)}
                            {hist.isDispensed && ' • Dispensed'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setPrescriptionId(hist.id.toString())
                            loadPrescription()
                          }}
                          className="btn-ghost text-xs"
                        >
                          View
                        </button>
                      </div>
                    ))}
                    {patientHistory.length > 3 && (
                      <p className="text-xs text-gray-400 text-center pt-2">
                        + {patientHistory.length - 3} more prescriptions
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {!prescription.isDispensed && !isExpired(prescription.expiresAt) && (
                <button
                  onClick={handleDispense}
                  disabled={loading}
                  className="btn-primary w-full py-4 text-lg"
                >
                  {loading ? (
                    <>
                      <span className="loader w-5 h-5" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={20} />
                      {t('pharmacy.verifyAndDispense')}
                    </>
                  )}
                </button>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Medicine Batch Verification */}
      {activeTab === 'batch' && (
        <div className="card">
          <p className="text-gray-400 text-sm mb-4">
            {language === 'bn' ? 'ওষুধের ব্যাচ নম্বর লিখুন অথবা প্যাকেটের QR স্ক্যান করুন। নকল ওষুধ যাচাই করুন।' : 'Enter medicine batch number or scan packet QR. Verify authenticity (anti-counterfeit).'}
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex-1 min-w-[200px] relative">
              <FiPackage className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                className="form-input pl-10"
                placeholder={t('pharmacy.enterBatchNumber')}
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadBatch()}
              />
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="btn-secondary"
              type="button"
            >
              <FiCamera size={18} />
              {t('pharmacy.scanQR')}
            </button>
            <button
              onClick={loadBatch}
              disabled={loading || !String(batchNumber || '').trim()}
              className="btn-primary"
              type="button"
            >
              {loading ? (language === 'bn' ? 'যাচাই হচ্ছে...' : 'Verifying...') : t('pharmacy.verifyMedicine')}
            </button>
          </div>

          {loading && chainReady && (
            <BlockchainLoadingSteps
              currentStep={verificationStep}
              language={language}
              steps={language === 'bn'
                ? ['ব্লকচেইনে সংযোগ করা হচ্ছে...', 'ব্যাচ রেজিস্ট্রি অনুসন্ধান করা হচ্ছে...', 'প্রামাণিকতা যাচাই করা হচ্ছে...']
                : ['Connecting to blockchain...', 'Querying batch registry...', 'Verifying authenticity...']}
              message={language === 'bn' ? 'ব্লকচেইনে যাচাই করা হচ্ছে' : 'Verifying on blockchain'}
            />
          )}

          {!batch && !loading && (
            <div className="py-6 text-center rounded-xl bg-white/5 border border-dashed border-white/10">
              <FiPackage size={40} className="mx-auto text-gray-500 mb-2" />
              <p className="text-gray-400">
                {language === 'bn' ? 'ওষুধ যাচাই করতে ব্যাচ নম্বর লিখুন অথবা QR স্ক্যান করুন।' : 'Enter batch number above or scan QR to verify medicine.'}
              </p>
            </div>
          )}

          {/* Batch Details */}
          {batch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Verification proof - trust for users */}
              {!batch.notFound && (
                <BlockchainVerificationProof
                  source={batch.isDemo ? 'demo' : 'blockchain'}
                  blockNumber={batch.isDemo ? null : undefined}
                  language={language}
                />
              )}

              {/* Status Banner */}
              <div className={`p-6 rounded-xl border text-center ${
                batch.notFound
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : batch.isRecalled
                  ? 'bg-red-500/10 border-red-500/30'
                  : batch.isFlagged
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : isExpired(batch.expiresAt)
                  ? 'bg-gray-500/10 border-gray-500/30'
                  : 'bg-primary-500/10 border-primary-500/30'
              }`}>
                {batch.notFound ? (
                  <>
                    <FiAlertTriangle size={48} className="mx-auto text-yellow-400 mb-3" />
                    <p className="text-xl font-bold text-yellow-300">{t('pharmacy.unknown')}</p>
                    <p className="text-yellow-400 mt-1">{batch.status}</p>
                  </>
                ) : batch.isRecalled ? (
                  <>
                    <FiXCircle size={48} className="mx-auto text-red-400 mb-3" />
                    <p className="text-xl font-bold text-red-300">{t('pharmacy.recalled')}</p>
                    <p className="text-red-400 mt-1">Reason: {batch.recallReason}</p>
                  </>
                ) : batch.isFlagged ? (
                  <>
                    <FiAlertTriangle size={48} className="mx-auto text-yellow-400 mb-3" />
                    <p className="text-xl font-bold text-yellow-300">{t('pharmacy.suspicious')}</p>
                    <p className="text-yellow-400 mt-1">Reason: {batch.flagReason}</p>
                  </>
                ) : isExpired(batch.expiresAt) ? (
                  <>
                    <FiClock size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-xl font-bold text-gray-300">{t('pharmacy.expired')}</p>
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={48} className="mx-auto text-primary-400 mb-3" />
                    <p className="text-xl font-bold text-primary-300">{t('pharmacy.authentic')}</p>
                    <p className="text-primary-400 mt-1">
                      {batch.isDemo ? 'Demo data — medicine details for testing' : 'This medicine is verified and safe to use'}
                    </p>
                  </>
                )}
              </div>

              {/* Batch Details Grid */}
              {!batch.notFound && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-sm text-gray-400">Batch Number</p>
                      <p className="text-lg font-semibold text-white">{batch.batchNumber}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-sm text-gray-400">Medicine Name</p>
                      <p className="text-lg font-semibold text-white">{batch.medicineName}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-sm text-gray-400">Generic Name</p>
                      <p className="text-white">{batch.genericName}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-sm text-gray-400">{t('pharmacy.manufacturerAddress')}</p>
                      <p className="text-white font-mono text-sm">
                        {batch.manufacturer ? shortenAddress(batch.manufacturer) : (batch.isDemo ? 'N/A (Demo)' : '—')}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-sm text-gray-400">{t('pharmacy.manufacturedOn')}</p>
                      <p className="text-white">{formatTimestamp(batch.manufacturedAt)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-sm text-gray-400">{t('pharmacy.expiresOn')}</p>
                      <p className={`font-semibold ${
                        isExpired(batch.expiresAt) ? 'text-red-400' : 'text-white'
                      }`}>
                        {formatTimestamp(batch.expiresAt)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 md:col-span-2">
                      <p className="text-sm text-gray-400">{t('pharmacy.origin')}</p>
                      <p className="text-white">{batch.origin}</p>
                    </div>
                    {(batch.totalUnits ?? 0) > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 md:col-span-2">
                        <p className="text-sm text-gray-400">Stock (remaining / total)</p>
                        <p className={`font-mono font-semibold text-lg ${
                          (batch.totalUnits - (batch.dispensedUnits ?? 0)) <= 0 ? 'text-red-400' : 'text-primary-400'
                        }`}>
                          {(batch.totalUnits ?? 0) - (batch.dispensedUnits ?? 0)} / {batch.totalUnits} units
                        </p>
                        {(batch.totalUnits - (batch.dispensedUnits ?? 0)) <= 0 && (
                          <p className="text-red-400 text-sm mt-1">Out of stock — possible counterfeit if seen in market</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm Purchase - on-chain: Pharmacist only; demo: anyone (simulated locally) */}
                  {!batch.notFound && !batch.isRecalled && !batch.isFlagged && !isExpired(batch.expiresAt) &&
                   (batch.totalUnits ?? 0) > 0 && (batch.totalUnits - (batch.dispensedUnits ?? 0)) > 0 &&
                   (batch.isDemo || role === 3) && (
                    <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
                      <p className="text-sm font-medium text-primary-300 mb-3">
                        {language === 'bn' ? 'ক্রেতা কত ইউনিট কিনেছে?' : 'How many units did the customer buy?'}
                      </p>
                      <div className="flex gap-3 items-center">
                        <input
                          type="number"
                          min="1"
                          max={(batch.totalUnits ?? 0) - (batch.dispensedUnits ?? 0)}
                          value={purchaseQuantity}
                          onChange={(e) => setPurchaseQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="form-input w-24"
                        />
                        <button
                          onClick={handleConfirmPurchase}
                          disabled={loading}
                          className="btn-primary"
                        >
                          {loading ? (language === 'bn' ? 'নিশ্চিত হচ্ছে...' : 'Confirming...') : (language === 'bn' ? 'ক্রয় নিশ্চিত করুন' : 'Confirm Purchase')}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {batch.isDemo 
                          ? (language === 'bn' ? 'ডেমো মোড — স্থানীয়ভাবে সিমিউলেটেড। ব্লকচেইনে রেকর্ড করতে ফার্মাসিস্ট হিসাবে লগইন করুন।' : 'Demo mode — simulated locally. Connect blockchain as Pharmacist to record on-chain.')
                          : (language === 'bn' ? 'এই সংখ্যা ব্যাচের স্টক থেকে বিয়োগ হবে। অতিরিক্ত বিক্রয় = সম্ভাব্য জাল।' : 'This quantity will be deducted from batch stock. Excess sales = possible counterfeit.')}
                      </p>
                    </div>
                  )}

                  {/* Flag Button - only for on-chain batches */}
                  {!batch.isRecalled && !batch.isFlagged && !batch.isDemo && (
                    <button
                      onClick={handleFlagBatch}
                      disabled={loading}
                      className="btn-danger w-full"
                    >
                      <FiAlertTriangle size={18} />
                      Report as Suspicious
                    </button>
                  )}
                  {batch.isDemo && (
                    <p className="text-center text-amber-400 text-sm py-2">
                      Demo data — connect blockchain to flag batches
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

export default PharmacyVerification
