import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import {
  FiSearch, FiCheckCircle, FiXCircle, FiAlertTriangle,
  FiCamera, FiPackage, FiClock, FiUser, FiHash
} from 'react-icons/fi'

import { useStore } from '../store/useStore'
import { CONTRACT_ADDRESS } from '../utils/config'
import contractABI from '../utils/contractABI.json'
import { 
  formatTimestamp, shortenAddress, isExpired, daysUntilExpiry,
  getPrescriptionStatus, getBatchStatus
} from '../utils/helpers'

const PharmacyVerification = () => {
  const { t } = useTranslation()
  const { account, language } = useStore()
  
  const [activeTab, setActiveTab] = useState('prescription')
  const [prescriptionId, setPrescriptionId] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [prescription, setPrescription] = useState(null)
  const [batch, setBatch] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const scannerRef = useRef(null)

  // Initialize QR Scanner
  useEffect(() => {
    if (showScanner && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      })

      scanner.render(
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText)
            if (data.prescriptionId) {
              setPrescriptionId(data.prescriptionId.toString())
              setActiveTab('prescription')
            } else if (data.batchNumber) {
              setBatchNumber(data.batchNumber)
              setActiveTab('batch')
            }
            scanner.clear()
            setShowScanner(false)
            toast.success('QR Code scanned successfully!')
          } catch {
            setPrescriptionId(decodedText)
          }
        },
        (error) => {
          console.log('QR scan error:', error)
        }
      )
      scannerRef.current = scanner
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [showScanner])

  // Load prescription
  const loadPrescription = async () => {
    if (!prescriptionId || !window.ethereum) return

    setLoading(true)
    setPrescription(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)

      const result = await contract.getPrescription(Number(prescriptionId))
      
      setPrescription({
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
      })
    } catch (error) {
      console.error('Error loading prescription:', error)
      toast.error('Prescription not found')
    } finally {
      setLoading(false)
    }
  }

  // Verify and dispense prescription
  const handleDispense = async () => {
    if (!prescription) return

    setLoading(true)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)

      const tx = await contract.dispensePrescription(prescription.id)
      toast.loading('Processing transaction...')
      await tx.wait()
      
      toast.dismiss()
      toast.success('Prescription dispensed successfully!')
      
      // Reload prescription
      await loadPrescription()
    } catch (error) {
      console.error('Dispense error:', error)
      toast.error(error.message || 'Failed to dispense')
    } finally {
      setLoading(false)
    }
  }

  // Load batch
  const loadBatch = async () => {
    if (!batchNumber || !window.ethereum) return

    setLoading(true)
    setBatch(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)

      const result = await contract.verifyBatch(batchNumber)
      
      if (result.exists) {
        const batchData = await contract.getBatchByNumber(batchNumber)
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
          verificationStatus: result.status,
        })
      } else {
        setBatch({
          notFound: true,
          status: result.status,
        })
      }
    } catch (error) {
      console.error('Error loading batch:', error)
      toast.error('Failed to verify batch')
    } finally {
      setLoading(false)
    }
  }

  // Flag batch
  const handleFlagBatch = async () => {
    if (!batch || batch.notFound) return

    const reason = prompt('Enter reason for flagging this batch:')
    if (!reason) return

    setLoading(true)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)

      const tx = await contract.flagBatch(batch.id, reason)
      toast.loading('Flagging batch...')
      await tx.wait()
      
      toast.dismiss()
      toast.success('Batch flagged successfully!')
      await loadBatch()
    } catch (error) {
      console.error('Flag error:', error)
      toast.error(error.message || 'Failed to flag batch')
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
        </h1>
        <p className="text-gray-400 mt-1">{t('pharmacy.subtitle')}</p>
      </div>

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
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <FiPackage className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder={t('pharmacy.enterBatchNumber')}
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="btn-secondary"
            >
              <FiCamera size={18} />
            </button>
            <button
              onClick={loadBatch}
              disabled={loading || !batchNumber}
              className="btn-primary"
            >
              {loading ? 'Verifying...' : t('pharmacy.verifyMedicine')}
            </button>
          </div>

          {/* Batch Details */}
          {batch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
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
                    <p className="text-primary-400 mt-1">This medicine is verified and safe to use</p>
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
                      <p className="text-white font-mono text-sm">{shortenAddress(batch.manufacturer)}</p>
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
                  </div>

                  {/* Flag Button */}
                  {!batch.isRecalled && !batch.isFlagged && (
                    <button
                      onClick={handleFlagBatch}
                      disabled={loading}
                      className="btn-danger w-full"
                    >
                      <FiAlertTriangle size={18} />
                      Report as Suspicious
                    </button>
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
