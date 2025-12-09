import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  FiSearch, FiUser, FiCalendar, FiPackage, FiCheckCircle,
  FiXCircle, FiClock, FiHash, FiFileText, FiArrowLeft
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

import { useStore } from '../store/useStore'
import { 
  formatTimestamp, shortenAddress, isExpired, daysUntilExpiry,
  getPrescriptionStatus, generatePatientHash
} from '../utils/helpers'
import { getReadContract, isBlockchainReady } from '../utils/contractHelper'
import { isDevMode } from '../utils/devMode'

const PatientHistory = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { account, language } = useStore()
  
  const [nid, setNid] = useState('')
  const [loading, setLoading] = useState(false)
  const [prescriptions, setPrescriptions] = useState([])
  const [patientInfo, setPatientInfo] = useState(null)

  // Load patient history by NID
  const loadPatientHistory = async () => {
    if (!nid || !nid.trim()) {
      toast.error('Please enter NID number')
      return
    }

    if (!isDevMode() && !window.ethereum) {
      toast.error('Please connect a wallet or enable Dev Mode')
      return
    }

    setLoading(true)
    setPrescriptions([])
    setPatientInfo(null)

    try {
      // Check blockchain ready
      const ready = await isBlockchainReady()
      if (!ready.ready) {
        toast.error(`Blockchain not ready: ${ready.error}`)
        setLoading(false)
        return
      }

      // Generate patient hash from NID
      const patientHash = generatePatientHash({ nid: nid.trim() })
      
      // Get contract
      const contract = await getReadContract()
      
      // Get all prescription IDs for this patient
      const prescriptionIds = await contract.getPrescriptionsByPatient(patientHash)
      
      if (prescriptionIds.length === 0) {
        toast.error('No prescriptions found for this NID')
        setLoading(false)
        return
      }

      // Load all prescription details
      const prescriptionData = []
      for (const id of prescriptionIds) {
        try {
          const p = await contract.getPrescription(Number(id))
          prescriptionData.push({
            id: Number(p.id),
            patientHash: p.patientHash,
            ipfsHash: p.ipfsHash,
            doctor: p.doctor,
            createdAt: Number(p.createdAt),
            expiresAt: Number(p.expiresAt),
            isDispensed: p.isDispensed,
            dispensedBy: p.dispensedBy,
            dispensedAt: Number(p.dispensedAt),
            version: Number(p.version),
            isActive: p.isActive,
          })
        } catch (error) {
          console.error(`Error loading prescription ${id}:`, error)
        }
      }

      // Sort by creation date (newest first)
      prescriptionData.sort((a, b) => b.createdAt - a.createdAt)

      setPrescriptions(prescriptionData)
      
      // Try to extract patient info from first prescription's IPFS data
      if (prescriptionData.length > 0 && prescriptionData[0].ipfsHash) {
        try {
          const data = JSON.parse(prescriptionData[0].ipfsHash)
          if (data.patient) {
            setPatientInfo(data.patient)
          }
        } catch (e) {
          // IPFS data might not be JSON, that's okay
        }
      }

      toast.success(`Found ${prescriptionData.length} prescription(s)`)
    } catch (error) {
      console.error('Error loading patient history:', error)
      toast.error(error.message || 'Failed to load patient history')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      loadPatientHistory()
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FiUser className="text-primary-400" />
              Patient History by NID
            </h1>
            <p className="text-gray-400 mt-1">
              View all prescriptions for a patient using their National ID number
            </p>
          </div>
          <button
            onClick={() => navigate('/pharmacy')}
            className="btn-ghost"
          >
            <FiArrowLeft size={18} />
            Back to Verification
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="card">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Enter NID (National ID) number"
              value={nid}
              onChange={(e) => setNid(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={17}
            />
          </div>
          <button
            onClick={loadPatientHistory}
            disabled={loading || !nid.trim()}
            className="btn-primary"
          >
            {loading ? (
              <>
                <span className="loader w-5 h-5" />
                Loading...
              </>
            ) : (
              <>
                <FiSearch size={18} />
                Search History
              </>
            )}
          </button>
        </div>
      </div>

      {/* Patient Info */}
      {patientInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiUser className="text-primary-400" />
            Patient Information
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-sm text-gray-400">Name</p>
              <p className="text-lg font-semibold text-white">{patientInfo.name || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-sm text-gray-400">NID</p>
              <p className="text-lg font-semibold text-white">{nid}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-sm text-gray-400">Age / Gender</p>
              <p className="text-lg font-semibold text-white">
                {patientInfo.age ? `${patientInfo.age} years` : 'N/A'}
                {patientInfo.gender && ` • ${patientInfo.gender}`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Prescriptions List */}
      {prescriptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiFileText className="text-primary-400" />
            Prescription History ({prescriptions.length})
          </h2>

          <div className="space-y-4">
            {prescriptions.map((prescription) => {
              const status = getPrescriptionStatus(prescription)
              const expired = isExpired(prescription.expiresAt)
              
              return (
                <motion.div
                  key={prescription.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-xl border ${
                    prescription.isDispensed
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : expired
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-primary-500/10 border-primary-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          Prescription #{prescription.id}
                        </h3>
                        {prescription.isDispensed ? (
                          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium flex items-center gap-1">
                            <FiCheckCircle size={12} />
                            Dispensed
                          </span>
                        ) : expired ? (
                          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-medium flex items-center gap-1">
                            <FiXCircle size={12} />
                            Expired
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-medium flex items-center gap-1">
                            <FiClock size={12} />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        Created: {formatTimestamp(prescription.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/pharmacy?prescriptionId=${prescription.id}`)}
                      className="btn-secondary text-sm"
                    >
                      View Details
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-gray-400 mb-1">Expires</p>
                      <p className={`font-semibold ${
                        expired ? 'text-red-400' : 'text-white'
                      }`}>
                        {formatTimestamp(prescription.expiresAt)}
                        {!expired && (
                          <span className="text-xs text-gray-400 ml-2">
                            ({daysUntilExpiry(prescription.expiresAt)} days left)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-gray-400 mb-1">Doctor</p>
                      <p className="text-white font-mono text-sm">
                        {shortenAddress(prescription.doctor)}
                      </p>
                    </div>
                    {prescription.isDispensed && (
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-xs text-gray-400 mb-1">Dispensed By</p>
                        <p className="text-white font-mono text-sm">
                          {shortenAddress(prescription.dispensedBy)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(prescription.dispensedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && prescriptions.length === 0 && nid && (
        <div className="card text-center py-12">
          <FiFileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-400">
            No prescriptions found for NID: <strong className="text-white">{nid}</strong>
          </p>
        </div>
      )}
    </div>
  )
}

export default PatientHistory
