import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import {
  FiSearch, FiFileText, FiCheckCircle, FiClock, FiDownload,
  FiEye, FiX, FiPackage, FiCalendar, FiUser
} from 'react-icons/fi'

import { useStore } from '../store/useStore'
import { CONTRACT_ADDRESS } from '../utils/config'
import contractABI from '../utils/contractABI.json'
import { formatTimestamp, shortenAddress, isExpired, daysUntilExpiry } from '../utils/helpers'

const PatientPortal = () => {
  const { t } = useTranslation()
  const { language } = useStore()

  const [patientHash, setPatientHash] = useState('')
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState(null)

  // Search prescriptions
  const searchPrescriptions = async () => {
    if (!patientHash.trim()) {
      toast.error('Please enter your Patient ID')
      return
    }
    if (!window.ethereum) {
      toast.error('MetaMask not detected')
      return
    }

    setLoading(true)
    setPrescriptions([])

    try {
  const provider = window.__sharedBrowserProvider || new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)

      const prescriptionIds = await contract.getPrescriptionsByPatient(patientHash)
      
      const results = []
      for (const id of prescriptionIds) {
        const p = await contract.getPrescription(Number(id))
        
        // Try to parse IPFS data
        let details = {}
        try {
          details = JSON.parse(p.ipfsHash)
        } catch {
          details = { ipfsHash: p.ipfsHash }
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
        })
      }

      setPrescriptions(results.reverse()) // Show newest first
      
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
                      prescriptionId: selectedPrescription.id,
                      patientHash: selectedPrescription.patientHash,
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

