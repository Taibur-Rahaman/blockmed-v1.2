import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import {
  FiSearch, FiFileText, FiCheckCircle, FiClock, FiDownload,
  FiEye, FiX, FiPackage, FiCalendar, FiUser, FiActivity
} from 'react-icons/fi'

import { useStore } from '../store/useStore'
import { getReadContract, isBlockchainReady, getContractAddress } from '../utils/contractHelper'
import { formatTimestamp, shortenAddress, isExpired, daysUntilExpiry } from '../utils/helpers'

const PatientPortal = () => {
  const { t } = useTranslation()
  const { language, demoPrescriptions, account, user, role, patientPortalPatientHash, setPatientPortalPatientHash, patientMedicineChecks } = useStore()

  const [patientHash, setPatientHash] = useState(patientPortalPatientHash || '')
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState(null)

  // Keep local input in sync if store value changes (e.g. after login)
  React.useEffect(() => {
    if (patientPortalPatientHash && !patientHash) {
      setPatientHash(patientPortalPatientHash)
    }
  }, [patientPortalPatientHash])

  // Search prescriptions (works with Dev Mode and Wallet)
  const searchPrescriptions = async () => {
    if (!patientHash.trim()) {
      toast.error('Please enter your Patient ID')
      return
    }

    const ready = await isBlockchainReady()
    if (!ready.ready) {
      // Fallback: demo prescriptions created when blockchain was offline
      const hash = patientHash.trim()
      const demos = (demoPrescriptions || []).filter(
        (p) => String(p.patientHash || '').toLowerCase() === hash.toLowerCase()
      )

      setLoading(true)
      setPrescriptions([])

      try {
        if (demos.length === 0) {
          toast.error(
            language === 'en'
              ? 'No demo prescriptions found for this Patient ID. Connect blockchain to search on-chain.'
              : 'এই রোগী আইডির জন্য কোনো ডেমো প্রেসক্রিপশন পাওয়া যায়নি। অন-চেইন খুঁজতে ব্লকচেইন সংযুক্ত করুন।'
          )
          return
        }

        const results = demos.map((demo) => {
          const createdAtSec = demo.createdAt
            ? Math.floor(new Date(demo.createdAt).getTime() / 1000)
            : Math.floor(Date.now() / 1000)
          const validityDays = demo.validityDays || 30
          const expiresAtSec = createdAtSec + validityDays * 86400

          const details = {
            patient: demo.patient,
            symptoms: demo.symptoms,
            diagnosis: demo.diagnosis,
            medicines: demo.medicines,
            tests: demo.tests,
            advice: demo.advice,
            followUp: demo.followUp,
            validityDays: demo.validityDays,
          }

          return {
            id: demo.id,
            patientHash: demo.patientHash,
            ipfsHash: demo.ipfsHash,
            details,
            doctor: demo.doctor,
            createdAt: createdAtSec,
            expiresAt: expiresAtSec,
            isDispensed: demo.isDispensed || false,
            dispensedBy: demo.dispensedBy || '',
            dispensedAt: demo.dispensedAt || 0,
            version: 1,
            isActive: true,
            isDemo: true,
          }
        })

        // Newest first
        setPrescriptions(results.reverse())
        setPatientPortalPatientHash(hash)

        toast.success(
          language === 'en'
            ? 'Showing demo prescriptions (blockchain not connected).'
            : 'ব্লকচেইন সংযুক্ত না থাকায় ডেমো প্রেসক্রিপশন দেখানো হচ্ছে।'
        )
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setPrescriptions([])

    try {
      const contract = await getReadContract()
      const prescriptionIds = await contract.getPrescriptionsByPatient(patientHash.trim())
      
      const results = []
      for (const id of prescriptionIds) {
        const numericId = Number(id)
        const p = await contract.getPrescription(numericId)
        
        // Try to parse IPFS data
        let details = {}
        try {
          details = JSON.parse(p.ipfsHash)
        } catch {
          details = { ipfsHash: p.ipfsHash }
        }

        // Try to fetch on-chain validity for clearer status
        let onchainStatus = null
        try {
          const validity = await contract.isPrescriptionValid(numericId)
          const isValid = validity.isValid ?? validity[0]
          const statusText = validity.status ?? validity[1]
          onchainStatus = { isValid, status: statusText }
        } catch {
          onchainStatus = null
        }

        results.push({
          id: Number(p.id),
          patientHash: p.patientHash,
          ipfsHash: p.ipfsHash,
          details,
          doctor: p.doctor,
          createdAt: Number(p.createdAt),
          expiresAt: Number(p.expiresAt),
          isDispensed: p.isDispensed,
          dispensedBy: p.dispensedBy,
          dispensedAt: Number(p.dispensedAt),
          version: Number(p.version),
          isActive: p.isActive,
          onchainStatus,
        })
      }

      setPrescriptions(results.reverse()) // Show newest first
      setPatientPortalPatientHash(patientHash.trim())
      
      if (results.length === 0) {
        toast.error(t('patient.noPrescriptions'))
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search prescriptions')
    } finally {
      setLoading(false)
    }
  }

  // Get status styling
  const getStatusStyle = (prescription) => {
    if (prescription.onchainStatus && typeof prescription.onchainStatus.isValid === 'boolean') {
      const { isValid, status } = prescription.onchainStatus
      if (!isValid) {
        // Map common failure statuses to colors
        const lowered = String(status || '').toLowerCase()
        if (lowered.includes('dispensed')) {
          return { label: status, color: 'text-blue-400', bg: 'bg-blue-500/20' }
        }
        if (lowered.includes('expired')) {
          return { label: status, color: 'text-red-400', bg: 'bg-red-500/20' }
        }
        if (lowered.includes('inactive')) {
          return { label: status, color: 'text-gray-400', bg: 'bg-gray-500/20' }
        }
        return { label: status, color: 'text-red-400', bg: 'bg-red-500/20' }
      }
      return { label: status || t('prescription.valid'), color: 'text-primary-400', bg: 'bg-primary-500/20' }
    }
    if (!prescription.isActive) {
      return { label: 'Inactive', color: 'text-gray-400', bg: 'bg-gray-500/20' }
    }
    if (prescription.isDispensed) {
      return { label: t('prescription.dispensed'), color: 'text-blue-400', bg: 'bg-blue-500/20' }
    }
    if (isExpired(prescription.expiresAt)) {
      return { label: t('prescription.expired'), color: 'text-red-400', bg: 'bg-red-500/20' }
    }
    return { label: t('prescription.valid'), color: 'text-primary-400', bg: 'bg-primary-500/20' }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FiUser className="text-primary-400" />
          {t('patient.title')}
        </h1>
        <p className="text-gray-400 mt-1">{t('patient.subtitle')}</p>
      </div>

      {/* My Profile (for logged-in patients) */}
      {role === 5 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-3">
            {language === 'en' ? 'My Profile' : 'আমার প্রোফাইল'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400 mb-1">
                {language === 'en' ? 'Name' : 'নাম'}
              </p>
              <p className="text-white font-medium">
                {user?.name || (language === 'en' ? 'Unknown' : 'অজানা')}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400 mb-1">
                {language === 'en' ? 'Wallet Address' : 'ওয়ালেট ঠিকানা'}
              </p>
              <p className="text-white font-mono text-sm">
                {shortenAddress(account) || (language === 'en' ? 'Not connected' : 'সংযুক্ত নয়')}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 sm:col-span-2">
              <p className="text-xs text-gray-400 mb-1">
                {language === 'en'
                  ? 'Your Patient ID (hashed, used to fetch your history)'
                  : 'আপনার রোগী আইডি (হ্যাশ করা, ইতিহাস দেখতে ব্যবহার হয়)'}
              </p>
              <p className="text-white font-mono text-xs break-all">
                {patientPortalPatientHash || (language === 'en' ? 'Not set yet — ask your doctor for your Patient ID or scan the QR on a prescription.' : 'এখনও সেট করা হয়নি — আপনার প্রেসক্রিপশনের QR থেকে বা ডাক্তার থেকে আইডি নিন।')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="form-input pl-10"
              placeholder={t('patient.enterPatientHash')}
              value={patientHash}
              onChange={(e) => setPatientHash(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchPrescriptions()}
            />
          </div>
          <button
            onClick={searchPrescriptions}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <span className="loader w-5 h-5" />
                {language === 'en' ? 'Searching...' : 'খুঁজছে...'}
              </>
            ) : (
              <>
                <FiSearch size={18} />
                {t('common.search')}
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-gray-400 mt-3">
          {language === 'en' 
            ? 'Enter your unique Patient ID to view all your prescriptions'
            : 'আপনার সমস্ত প্রেসক্রিপশন দেখতে আপনার অনন্য রোগী আইডি লিখুন'}
        </p>
      </div>

      {/* Prescriptions List */}
      {prescriptions.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiFileText className="text-primary-400" />
            {t('patient.myPrescriptions')} ({prescriptions.length})
          </h2>

          <div className="space-y-4">
            {prescriptions.map((prescription) => {
              const status = getStatusStyle(prescription)
              
              return (
                <motion.div
                  key={prescription.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-semibold text-white">
                          Prescription #{prescription.id}
                        </span>
                        <span className={`badge ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="badge badge-purple">
                          v{prescription.version}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        <p className="text-gray-400">
                          <FiCalendar className="inline mr-2" />
                          Created: {formatTimestamp(prescription.createdAt)}
                        </p>
                        <p className={`${isExpired(prescription.expiresAt) ? 'text-red-400' : 'text-gray-400'}`}>
                          <FiClock className="inline mr-2" />
                          Expires: {formatTimestamp(prescription.expiresAt)}
                          {!isExpired(prescription.expiresAt) && (
                            <span className="text-primary-400 ml-2">
                              ({daysUntilExpiry(prescription.expiresAt)} days)
                            </span>
                          )}
                        </p>
                        <p className="text-gray-400">
                          Doctor: {shortenAddress(prescription.doctor)}
                        </p>
                        {prescription.isDispensed && (
                          <p className="text-blue-400">
                            <FiCheckCircle className="inline mr-2" />
                            Dispensed: {formatTimestamp(prescription.dispensedAt)}
                          </p>
                        )}
                      </div>

                      {/* Medicine preview */}
                      {prescription.details?.medicines?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-400 mb-1">Medicines:</p>
                          <div className="flex flex-wrap gap-2">
                            {prescription.details.medicines.slice(0, 3).map((med, i) => (
                              <span key={i} className="badge bg-white/10 text-white">
                                <FiPackage size={12} className="mr-1" />
                                {med.name}
                              </span>
                            ))}
                            {prescription.details.medicines.length > 3 && (
                              <span className="badge bg-white/10 text-gray-400">
                                +{prescription.details.medicines.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedPrescription(prescription)}
                      className="btn-icon"
                    >
                      <FiEye size={18} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Simple timeline-style view of past prescriptions */}
      {prescriptions.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiActivity className="text-primary-400" />
            {language === 'en' ? 'Prescription Timeline' : 'প্রেসক্রিপশন টাইমলাইন'}
          </h2>
          <div className="relative pl-4 border-l border-white/10 space-y-3">
            {prescriptions.map((p) => (
              <div key={`timeline-${p.id}`} className="relative">
                <div className="w-2 h-2 rounded-full bg-primary-400 absolute -left-[5px] top-2" />
                <div className="ml-2">
                  <p className="text-xs text-gray-400">
                    {formatTimestamp(p.createdAt)}
                  </p>
                  <p className="text-sm text-white font-medium">
                    #{p.id} • {p.details?.diagnosis || (language === 'en' ? 'Prescription' : 'প্রেসক্রিপশন')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My medicine checks (from QR verifications) */}
      {account && patientMedicineChecks && patientMedicineChecks.filter((c) => c.account === account).length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiPackage className="text-primary-400" />
            {language === 'en' ? 'My medicine checks' : 'আমার ওষুধ যাচাই'}
          </h2>
          <div className="space-y-3">
            {patientMedicineChecks
              .filter((c) => c.account === account)
              .map((check) => (
                <div
                  key={check.id}
                  className="p-3 rounded-xl bg-white/5 flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="text-white font-medium">
                      {language === 'en' ? 'Batch' : 'ব্যাচ'} #{check.batchNumber}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(check.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${
                      String(check.result || '').toUpperCase().includes('RECALL') ? 'text-red-400'
                      : String(check.result || '').toUpperCase().includes('FLAG') ? 'text-yellow-400'
                      : 'text-primary-400'
                    }`}>
                      {check.result}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {check.source === 'blockchain' ? 'On-chain' : 'Demo'}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Prescription Detail Modal */}
      <AnimatePresence>
        {selectedPrescription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPrescription(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Prescription #{selectedPrescription.id}
                  </h2>
                  <p className="text-gray-400">Version {selectedPrescription.version}</p>
                </div>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="btn-icon"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="qr-container">
                  <QRCodeSVG
                    value={JSON.stringify({
                      type: 'prescription',
                      version: 2,
                      prescriptionId: selectedPrescription.id,
                      patientHash: selectedPrescription.patientHash,
                      doctor: selectedPrescription.doctor,
                      contractAddress: getContractAddress(),
                      isDemo: selectedPrescription.isDemo || false,
                    })}
                    size={150}
                    level="H"
                  />
                </div>
              </div>

              {/* Patient Info */}
              {selectedPrescription.details?.patient && (
                <div className="p-4 rounded-xl bg-white/5 mb-4">
                  <h3 className="font-medium text-gray-400 mb-2">Patient Information</h3>
                  <p className="text-xl font-semibold text-white">
                    {selectedPrescription.details.patient.name}
                  </p>
                  <p className="text-gray-400">
                    {selectedPrescription.details.patient.age && `${selectedPrescription.details.patient.age} years`}
                    {selectedPrescription.details.patient.gender && ` • ${selectedPrescription.details.patient.gender}`}
                  </p>
                </div>
              )}

              {/* Diagnosis */}
              {selectedPrescription.details?.diagnosis && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-400 mb-2">Diagnosis</h3>
                  <p className="text-white">{selectedPrescription.details.diagnosis}</p>
                </div>
              )}

              {/* Medicines */}
              {selectedPrescription.details?.medicines?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-400 mb-2">Medicines</h3>
                  <div className="space-y-2">
                    {selectedPrescription.details.medicines.map((med, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5">
                        <p className="font-medium text-white">
                          {i + 1}. {med.name} {med.strength && `(${med.strength})`}
                        </p>
                        <p className="text-sm text-gray-400">
                          {med.dose} • {med.duration}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tests & Advice */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {selectedPrescription.details?.tests && (
                  <div className="p-4 rounded-xl bg-white/5">
                    <h3 className="font-medium text-gray-400 mb-2">Tests</h3>
                    <p className="text-white">{selectedPrescription.details.tests}</p>
                  </div>
                )}
                {selectedPrescription.details?.advice && (
                  <div className="p-4 rounded-xl bg-white/5">
                    <h3 className="font-medium text-gray-400 mb-2">Advice</h3>
                    <p className="text-white">{selectedPrescription.details.advice}</p>
                  </div>
                )}
              </div>

              {/* Footer Info */}
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-400">
                  <p>Doctor: {shortenAddress(selectedPrescription.doctor)}</p>
                  <p>Created: {formatTimestamp(selectedPrescription.createdAt)}</p>
                  <p>Expires: {formatTimestamp(selectedPrescription.expiresAt)}</p>
                  {selectedPrescription.isDispensed && (
                    <p className="text-blue-400">
                      Dispensed: {formatTimestamp(selectedPrescription.dispensedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => window.print()}
                  className="btn-primary flex-1"
                >
                  <FiDownload size={18} />
                  {t('patient.downloadPrescription')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PatientPortal

