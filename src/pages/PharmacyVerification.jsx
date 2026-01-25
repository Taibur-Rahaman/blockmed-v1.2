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
import { 
  formatTimestamp, shortenAddress, isExpired, daysUntilExpiry,
  getPrescriptionStatus, getBatchStatus, generatePatientHash,
  hasFeatureAccess, isUserRestricted
} from '../utils/helpers'
import { getReadContract, getWriteContract } from '../utils/contractHelper'
import { isDevMode } from '../utils/devMode'

const PharmacyVerification = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { account, language } = useStore()

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
  const [showHistory, setShowHistory] = useState(false)
  const [prescriptionData, setPrescriptionData] = useState(null) // Parsed prescription data from ipfsHash

  // Read prescriptionId from URL query parameter on mount
  useEffect(() => {
    const urlPrescriptionId = searchParams.get('prescriptionId')
    if (urlPrescriptionId && urlPrescriptionId !== prescriptionId) {
      setPrescriptionId(urlPrescriptionId)
      setActiveTab('prescription')
    }
  }, [searchParams])

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
    if (!prescriptionId) return
    if (!isDevMode() && !window.ethereum) return

    setLoading(true)
    setPrescription(null)
    setPrescriptionData(null)
    setPatientHistory([])

    try {
      const contract = await getReadContract()
      const result = await contract.getPrescription(Number(prescriptionId))
      
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
      toast.error('Prescription not found')
    } finally {
      setLoading(false)
    }
  }

  // Auto-load prescription when prescriptionId is set from URL
  useEffect(() => {
    const urlPrescriptionId = searchParams.get('prescriptionId')
    if (urlPrescriptionId && urlPrescriptionId === prescriptionId && !prescription && !loading && prescriptionId) {
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
    if (!batchNumber) return
    if (!isDevMode() && !window.ethereum) return

    setLoading(true)
    setBatch(null)

    try {
      const contract = await getReadContract()
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
      const contract = await getWriteContract()
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
