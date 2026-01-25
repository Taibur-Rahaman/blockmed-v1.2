import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ethers } from 'ethers'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { 
  FiUser, FiCalendar, FiHeart, FiPlus, FiTrash2, FiPrinter,
  FiCheck, FiCopy, FiArrowLeft, FiArrowRight, FiSearch,
  FiPackage, FiClipboard, FiAlertCircle, FiRefreshCw, FiHash,
  FiLayers, FiSave
} from 'react-icons/fi'

import { useStore } from '../store/useStore'
import { usePrescriptionStore } from '../store/useStore'
import { CONTRACT_ADDRESS, GENDER_OPTIONS, VALIDITY_OPTIONS, API } from '../utils/config'
import contractABI from '../utils/contractABI.json'
import { 
  calculateAge, generatePatientHash, copyToClipboard, formatDate,
  isUserRestricted, getUserRestriction
} from '../utils/helpers'
import { getWriteContract, getCurrentAccount, isBlockchainReady } from '../utils/contractHelper'
import staticMedicines from '../data/medicines.json'

const CreatePrescription = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { account, language, logout } = useStore()
  const prescriptionStore = usePrescriptionStore()
  const printRef = useRef()
  
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templates, setTemplates] = useState([])

  // Local state
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [medicineSearch, setMedicineSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [medicineDetails, setMedicineDetails] = useState({
    dose: '',
    duration: '',
    instructions: '',
  })

  const {
    patient, setPatient, setPatientData,
    symptoms, setSymptoms,
    diagnosis, setDiagnosis,
    medicines, addMedicine, removeMedicine,
    tests, setTests,
    advice, setAdvice,
    followUp, setFollowUp,
    validityDays, setValidityDays,
    patientHash, ipfsHash, qrData, prescriptionId, txHash,
    setGeneratedData, reset
  } = prescriptionStore

  const steps = [
    { number: 1, label: t('prescription.patientInfo'), icon: FiUser },
    { number: 2, label: t('prescription.symptoms'), icon: FiHeart },
    { number: 3, label: t('prescription.medicines'), icon: FiPackage },
    { number: 4, label: t('prescription.tests'), icon: FiClipboard },
    { number: 5, label: 'Generate & Submit', icon: FiCheck },
  ]

  // Handle date of birth change
  const handleDateOfBirthChange = (date) => {
    const age = calculateAge(date)
    setPatientData({
      ...patient,
      dateOfBirth: date,
      age: age.toString(),
    })
  }

  // Check if user is restricted and access controls
  useEffect(() => {
    if (account) {
      // Check restriction
      if (isUserRestricted(account)) {
        const restriction = getUserRestriction(account)
        toast.error(
          `Your account is restricted. ${restriction?.reason || 'Please contact administrator.'}`,
          { duration: 10000 }
        )
        navigate('/')
        return
      }

      // Check access controls
      try {
        const stored = localStorage.getItem('blockmed-access-controls') || '{}'
        const accessControls = JSON.parse(stored)
        const controls = accessControls[account]
        
        if (controls && !controls.canCreatePrescription) {
          toast.error('You do not have permission to create prescriptions. Please contact administrator.', { duration: 10000 })
          navigate('/')
        }
      } catch (error) {
        console.error('Error checking access controls:', error)
      }

      // Check force logout
      if (sessionStorage.getItem(`blockmed-force-logout-${account}`) === 'true') {
        toast.error('Your session has been terminated by administrator.', { duration: 10000 })
        sessionStorage.removeItem(`blockmed-force-logout-${account}`)
        // Clear and logout
        logout()
        navigate('/')
      }
    }
  }, [account, navigate])

  // Load templates
  useEffect(() => {
    try {
      const stored = localStorage.getItem('blockmed-prescription-templates')
      if (stored) {
        const parsed = JSON.parse(stored)
        setTemplates(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }, [])

  // Save current prescription as template
  const handleSaveAsTemplate = () => {
    if (medicines.length === 0) {
      toast.error('Please add at least one medicine before saving as template')
      return
    }
    // Navigate to templates page with current data
    const templateData = {
      symptoms,
      diagnosis,
      medicines,
      tests,
      advice,
      followUp,
      validityDays
    }
    sessionStorage.setItem('blockmed-template-draft', JSON.stringify(templateData))
    navigate('/templates?action=create')
  }

  // Apply template
  const handleApplyTemplate = (template) => {
    if (template.symptoms) setSymptoms(template.symptoms)
    if (template.diagnosis) setDiagnosis(template.diagnosis)
    if (template.tests) setTests(template.tests)
    if (template.advice) setAdvice(template.advice)
    if (template.followUp) setFollowUp(template.followUp)
    if (template.validityDays) setValidityDays(template.validityDays)
    
    // Clear existing medicines and add template medicines
    medicines.forEach(med => {
      removeMedicine(med.id)
    })
    template.medicines.forEach(med => {
      addMedicine({
        ...med,
        id: Date.now() + Math.random()
      })
    })
    
    setShowTemplateModal(false)
    toast.success(`Template "${template.name}" applied successfully!`)
  }

  // Medicine search - Local BD medicines first, FDA API as backup
  const searchMedicines = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const q = query.toLowerCase()
    
    // First search local BD medicines database
    let medicinesList = staticMedicines
    try {
      const stored = localStorage.getItem('blockmed-medicines')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) medicinesList = parsed
      }
    } catch (e) {}

    const localResults = medicinesList.filter(m => 
      (m.name + ' ' + (m.generic || '') + ' ' + (m.brand || '') + ' ' + (m.category || ''))
        .toLowerCase()
        .includes(q)
    ).slice(0, 15)

    // If we have local results, use them immediately
    if (localResults.length > 0) {
      setSearchResults(localResults)
      setIsSearching(false)
      return
    }

    // If no local results, try FDA API as fallback (optional)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2000)
      
      const response = await fetch(
        `${API.FDA_DRUG_LABEL}?search=generic_name:"${encodeURIComponent(query)}"&limit=8`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)

      if (response.ok) {
        const data = await response.json()
        if (data.results && data.results.length > 0) {
          const mapped = data.results.map(r => ({
            name: r.openfda?.brand_name?.[0] || r.openfda?.generic_name?.[0] || 'Unknown',
            generic: r.openfda?.generic_name?.[0] || '',
            brand: r.openfda?.brand_name?.[0] || '',
            form: r.openfda?.dosage_form?.[0] || '',
            strength: r.openfda?.active_ingredients?.[0]?.strength || '',
            manufacturer: r.openfda?.manufacturer_name?.[0] || '',
          }))
          setSearchResults(mapped)
          setIsSearching(false)
          return
        }
      }
    } catch (error) {
      // API failed, that's okay - it's optional
    }

    setSearchResults([])
    setIsSearching(false)
  }

  // Debounced search
  const handleSearchChange = (e) => {
    const value = e.target.value
    setMedicineSearch(value)
    
    const timeoutId = setTimeout(() => {
      searchMedicines(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  // Select medicine from search
  const handleSelectMedicine = (medicine) => {
    setSelectedMedicine(medicine)
    setMedicineSearch(medicine.name)
    setSearchResults([])
  }

  // Add medicine to prescription
  const handleAddMedicine = () => {
    if (!selectedMedicine) {
      toast.error('Please select a medicine')
      return
    }
    if (!medicineDetails.dose) {
      toast.error('Please enter dosage')
      return
    }

    addMedicine({
      ...selectedMedicine,
      ...medicineDetails,
    })

    // Reset
    setSelectedMedicine(null)
    setMedicineSearch('')
    setMedicineDetails({ dose: '', duration: '', instructions: '' })
    toast.success('Medicine added')
  }

  // Generate prescription
  const handleGenerate = () => {
    if (!patient.name.trim()) {
      toast.error('Patient name is required')
      return
    }
    
    if (!patient.nid || !patient.nid.trim()) {
      toast.error('NID (National ID) is required for patient tracking')
      return
    }

    const hash = generatePatientHash(patient)
    const prescriptionData = {
      patient,
      symptoms,
      diagnosis,
      medicines,
      tests,
      advice,
      followUp,
      validityDays,
      createdAt: new Date().toISOString(),
      doctor: account,
    }

    const dataJson = JSON.stringify(prescriptionData)
    const qrDataJson = JSON.stringify({
      patientHash: hash,
      ipfsHash: dataJson.substring(0, 100) + '...',
      doctor: account,
    })

    setGeneratedData({
      patientHash: hash,
      ipfsHash: dataJson,
      qrData: qrDataJson,
    })

    toast.success('Prescription generated!')
    setCurrentStep(5)
  }

  // Submit to blockchain
  const handleSubmit = async () => {
    if (!patientHash || !ipfsHash) {
      toast.error('Please generate prescription first')
      return
    }

    setIsSubmitting(true)

    try {
      // Check if blockchain is ready
      const ready = await isBlockchainReady()
      if (!ready.ready) {
        toast.error(`Blockchain not ready: ${ready.error}\n\nPlease connect a wallet or enable Dev Mode.`)
        setIsSubmitting(false)
        return
      }

      // Get current account (works with both Dev Mode and Wallet)
      const currentAccount = await getCurrentAccount()
      if (!currentAccount) {
        toast.error('No account connected. Please connect a wallet or enable Dev Mode.')
        setIsSubmitting(false)
        return
      }

      // Get contract instance (automatically uses Dev Mode or Wallet)
      const contract = await getWriteContract()

      toast.loading('Submitting to blockchain...')
      
      // Use legacy addPrescription function (auto-registers user as doctor)
      const tx = await contract.addPrescription(
        patientHash,
        ipfsHash
      )

      console.log('⏳ Transaction sent:', tx.hash)
      const receipt = await tx.wait()
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber)
      
      // Get prescription ID
      const count = await contract.prescriptionCount()
      const newId = Number(count)

      setGeneratedData({
        patientHash,
        ipfsHash,
        qrData: JSON.stringify({
          prescriptionId: newId,
          patientHash,
          doctor: currentAccount,
        }),
        prescriptionId: newId,
        txHash: tx.hash,
      })

      toast.dismiss()
      toast.success(`Prescription #${newId} created on blockchain!`)
    } catch (error) {
      console.error('Submission error:', error)
      
      // Better error messages
      let errorMessage = 'Failed to submit prescription'
      
      if (error.message?.includes('Not connected') || error.message?.includes('could not coalesce')) {
        errorMessage = 'Not connected to blockchain. Please:\n1. Make sure Hardhat is running (npm run blockchain)\n2. Connect a wallet or enable Dev Mode'
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected'
      } else if (error.reason) {
        errorMessage = error.reason
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Print prescription
  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription - BlockMed V2</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            color: #000;
            background: #fff;
          }
          .prescription-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #16a34a;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .prescription-header h1 { 
            font-size: 24px; 
            color: #16a34a;
          }
          .prescription-header .subtitle {
            color: #666;
            font-size: 12px;
          }
          .qr-code {
            background: #fff;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-box {
            padding: 15px;
            background: #f5f5f5;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
          }
          .info-box h3 {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .info-box .name {
            font-size: 18px;
            font-weight: 600;
            color: #000;
          }
          .info-box .details {
            color: #555;
            font-size: 14px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section h3 {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          .medicine-item {
            padding: 12px;
            background: #f9f9f9;
            border: 1px solid #eee;
            border-radius: 6px;
            margin-bottom: 8px;
          }
          .medicine-item .name {
            font-weight: 600;
            color: #000;
          }
          .medicine-item .dosage {
            color: #555;
            font-size: 13px;
          }
          .two-cols {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .follow-up {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            color: #16a34a;
            font-weight: 500;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #16a34a;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #666;
          }
          .signature-box {
            text-align: center;
            padding-top: 40px;
          }
          .signature-line {
            border-top: 1px solid #000;
            width: 200px;
            margin: 0 auto;
            padding-top: 5px;
          }
          @media print {
            body { padding: 0; }
            @page { margin: 15mm; }
          }
        </style>
      </head>
      <body>
        <div class="prescription-header">
          <div>
            <h1>📋 BlockMed Prescription</h1>
            <p class="subtitle">Blockchain Secured Healthcare</p>
          </div>
          ${qrData ? `<div class="qr-code"><img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}" alt="QR Code" /></div>` : ''}
        </div>
        
        <div class="info-grid">
          <div class="info-box">
            <h3>Patient Information</h3>
            <p class="name">${patient.name || 'N/A'}</p>
            <p class="details">
              ${patient.age ? `Age: ${patient.age} years` : ''}
              ${patient.gender ? ` • ${patient.gender}` : ''}
            </p>
            ${patient.phone ? `<p class="details">📞 ${patient.phone}</p>` : ''}
          </div>
          <div class="info-box">
            <h3>Prescription Details</h3>
            <p class="details">Valid for: ${validityDays} days</p>
            <p class="details">Date: ${new Date().toLocaleDateString()}</p>
            ${prescriptionId ? `<p class="details" style="color: #16a34a; font-weight: 600;">ID: #${prescriptionId}</p>` : ''}
          </div>
        </div>

        ${diagnosis ? `
        <div class="section">
          <h3>Diagnosis</h3>
          <p>${diagnosis}</p>
        </div>
        ` : ''}

        <div class="section">
          <h3>Medicines (Rx)</h3>
          ${medicines.map((med, i) => `
            <div class="medicine-item">
              <p class="name">${i + 1}. ${med.name} ${med.strength ? `(${med.strength})` : ''}</p>
              <p class="dosage">${med.dose || ''} ${med.duration ? `• ${med.duration}` : ''}</p>
            </div>
          `).join('')}
        </div>

        ${(tests || advice) ? `
        <div class="two-cols">
          ${tests ? `
          <div class="section">
            <h3>Laboratory Tests</h3>
            <p>${tests}</p>
          </div>
          ` : ''}
          ${advice ? `
          <div class="section">
            <h3>Advice</h3>
            <p>${advice}</p>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${followUp ? `<p class="follow-up">📅 Follow-up: ${followUp}</p>` : ''}

        <div class="footer">
          <div>
            <p>Generated by BlockMed V2</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
          <div class="signature-box">
            <div class="signature-line">Doctor's Signature</div>
          </div>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  // Reset and create new
  const handleCreateAnother = () => {
    reset()
    setCurrentStep(1)
  }

  // Validation for step navigation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return patient.name.trim().length > 0 && patient.nid && patient.nid.trim().length > 0
      case 2:
        return symptoms.trim().length > 0
      case 3:
        return medicines.length > 0
      case 4:
        return true
      default:
        return true
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="card">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <button
                onClick={() => step.number <= currentStep && setCurrentStep(step.number)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  currentStep === step.number
                    ? 'bg-primary-500 text-white'
                    : currentStep > step.number
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                <step.icon size={18} />
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.number}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${
                  currentStep > step.number ? 'bg-primary-500' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 1: Patient Information */}
          {currentStep === 1 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <FiUser className="text-primary-400" />
                {t('prescription.patientInfo')}
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Patient Name */}
                <div className="form-group md:col-span-2">
                  <label className="form-label">
                    {t('prescription.patientName')} *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={language === 'en' ? 'Enter patient name' : 'রোগীর নাম লিখুন'}
                    value={patient.name}
                    onChange={(e) => setPatient('name', e.target.value)}
                  />
                </div>

                {/* NID (National ID) - Unique Identifier */}
                <div className="form-group md:col-span-2">
                  <label className="form-label flex items-center gap-2">
                    <FiHash size={14} />
                    NID (National ID) *
                    <span className="text-xs text-gray-400 font-normal">
                      {language === 'en' ? '(Unique patient identifier)' : '(অনন্য রোগী শনাক্তকারী)'}
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={language === 'en' ? 'Enter NID number (e.g., 1234567890123)' : 'NID নম্বর লিখুন'}
                    value={patient.nid}
                    onChange={(e) => setPatient('nid', e.target.value)}
                    maxLength={17}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {language === 'en' 
                      ? 'This NID will be used to track patient history across all prescriptions'
                      : 'এই NID ব্যবহার করে রোগীর সকল প্রেসক্রিপশনের ইতিহাস দেখা যাবে'}
                  </p>
                </div>

                {/* Date of Birth */}
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <FiCalendar size={14} />
                    {t('prescription.dateOfBirth')}
                  </label>
                  <DatePicker
                    selected={patient.dateOfBirth}
                    onChange={handleDateOfBirthChange}
                    dateFormat="dd MMM yyyy"
                    maxDate={new Date()}
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    placeholderText={language === 'en' ? 'Select date' : 'তারিখ নির্বাচন করুন'}
                    className="form-input w-full"
                    calendarClassName="!bg-dark-800"
                    popperPlacement="top-start"
                    popperModifiers={[
                      {
                        name: 'offset',
                        options: { offset: [0, 10] }
                      },
                      {
                        name: 'preventOverflow',
                        options: { boundary: 'viewport' }
                      }
                    ]}
                  />
                  {patient.age && (
                    <p className="text-sm text-primary-400 mt-1">
                      {t('prescription.age')}: {patient.age} years
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="form-group">
                  <label className="form-label">{t('prescription.gender')}</label>
                  <select
                    className="form-select"
                    value={patient.gender}
                    onChange={(e) => setPatient('gender', e.target.value)}
                  >
                    <option value="">
                      {language === 'en' ? 'Select gender' : 'লিঙ্গ নির্বাচন করুন'}
                    </option>
                    {GENDER_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {language === 'en' ? option.label : option.labelBn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="form-label">{t('prescription.phone')}</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="01XXXXXXXXX"
                    value={patient.phone}
                    onChange={(e) => setPatient('phone', e.target.value)}
                  />
                </div>

                {/* Address */}
                <div className="form-group">
                  <label className="form-label">{t('prescription.address')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={language === 'en' ? 'Patient address' : 'রোগীর ঠিকানা'}
                    value={patient.address}
                    onChange={(e) => setPatient('address', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Symptoms & Diagnosis */}
          {currentStep === 2 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <FiHeart className="text-primary-400" />
                {t('prescription.symptoms')} & {t('prescription.diagnosis')}
              </h2>

              <div className="space-y-6">
                <div className="form-group">
                  <label className="form-label">{t('prescription.symptoms')} *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder={t('prescription.symptomsPlaceholder')}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('prescription.diagnosis')}</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder={t('prescription.diagnosisPlaceholder')}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Medicines */}
          {currentStep === 3 && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FiPackage className="text-primary-400" />
                  {t('prescription.medicines')}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="btn-secondary text-sm"
                  >
                    <FiLayers size={16} />
                    Use Template
                  </button>
                  {medicines.length > 0 && (
                    <button
                      onClick={handleSaveAsTemplate}
                      className="btn-secondary text-sm"
                    >
                      <FiSave size={16} />
                      Save as Template
                    </button>
                  )}
                </div>
              </div>

              {/* Medicine Search */}
              <div className="glass-card p-4 mb-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 relative">
                    <div className="relative">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="form-input pl-10"
                        placeholder={t('prescription.searchMedicine')}
                        value={medicineSearch}
                        onChange={handleSearchChange}
                      />
                      {isSearching && (
                        <FiRefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 animate-spin" />
                      )}
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-dark-800 rounded-xl border border-white/20 max-h-72 overflow-y-auto shadow-2xl">
                        {searchResults.map((medicine, index) => (
                          <button
                            key={index}
                            className="w-full text-left px-4 py-3 hover:bg-primary-500/20 transition-colors border-b border-white/10 last:border-0"
                            onClick={() => handleSelectMedicine(medicine)}
                          >
                            <p className="font-medium text-white">{medicine.name} {medicine.brand && `(${medicine.brand})`}</p>
                            <p className="text-sm text-gray-400">
                              {medicine.generic} • {medicine.form} • {medicine.strength}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t('prescription.dosePlaceholder')}
                      value={medicineDetails.dose}
                      onChange={(e) => setMedicineDetails({ ...medicineDetails, dose: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="form-input flex-1"
                      placeholder={t('prescription.durationPlaceholder')}
                      value={medicineDetails.duration}
                      onChange={(e) => setMedicineDetails({ ...medicineDetails, duration: e.target.value })}
                    />
                    <button
                      onClick={handleAddMedicine}
                      className="btn-primary px-4"
                      disabled={!selectedMedicine}
                    >
                      <FiPlus size={20} />
                    </button>
                  </div>
                </div>

                {selectedMedicine && (
                  <div className="mt-3 p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                    <p className="text-sm text-primary-300">
                      Selected: <strong>{selectedMedicine.name}</strong>
                      {selectedMedicine.generic && ` (${selectedMedicine.generic})`}
                    </p>
                  </div>
                )}
              </div>

              {/* Added Medicines List */}
              <div>
                <h3 className="font-medium text-white mb-3">
                  {t('prescription.medicines')} ({medicines.length})
                </h3>
                
                {medicines.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-white/5 rounded-xl">
                    <FiPackage size={40} className="mx-auto mb-3 opacity-50" />
                    <p>{t('prescription.noMedicines')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {medicines.map((med, index) => (
                      <motion.div
                        key={med.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-white">
                            {index + 1}. {med.name}
                            {med.strength && ` - ${med.strength}`}
                          </p>
                          <p className="text-sm text-gray-400">
                            {med.generic && `${med.generic} • `}
                            {med.dose} • {med.duration}
                          </p>
                          {med.instructions && (
                            <p className="text-xs text-primary-400 mt-1">{med.instructions}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeMedicine(med.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Tests & Advice */}
          {currentStep === 4 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <FiClipboard className="text-primary-400" />
                {t('prescription.tests')} & {t('prescription.advice')}
              </h2>

              <div className="space-y-6">
                <div className="form-group">
                  <label className="form-label">{t('prescription.tests')}</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder={t('prescription.testsPlaceholder')}
                    value={tests}
                    onChange={(e) => setTests(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('prescription.advice')}</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder={t('prescription.advicePlaceholder')}
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">{t('prescription.followUp')}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t('prescription.followUpPlaceholder')}
                      value={followUp}
                      onChange={(e) => setFollowUp(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('prescription.validity')}</label>
                    <select
                      className="form-select"
                      value={validityDays}
                      onChange={(e) => setValidityDays(parseInt(e.target.value))}
                    >
                      {VALIDITY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Generate & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* Preview Card */}
              <div className="card print-area" ref={printRef}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">📋 Prescription</h2>
                    <p className="text-gray-400">BlockMed V2 • Blockchain Secured</p>
                  </div>
                  {qrData && (
                    <div className="qr-container">
                      <QRCodeSVG value={qrData} size={120} level="H" />
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 rounded-xl bg-white/5">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Patient Information</h3>
                    <p className="text-lg font-semibold text-white">{patient.name}</p>
                    <p className="text-gray-400">
                      {patient.age && `${patient.age} years`}
                      {patient.gender && ` • ${patient.gender}`}
                    </p>
                    {patient.phone && <p className="text-gray-400">📞 {patient.phone}</p>}
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/5">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Prescription Details</h3>
                    <p className="text-gray-300">
                      <span className="text-gray-400">Valid for:</span> {validityDays} days
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-400">Date:</span> {formatDate(new Date())}
                    </p>
                    {prescriptionId && (
                      <p className="text-primary-400 font-medium">ID: #{prescriptionId}</p>
                    )}
                  </div>
                </div>

                {diagnosis && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Diagnosis</h3>
                    <p className="text-white">{diagnosis}</p>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Medicines</h3>
                  <div className="space-y-2">
                    {medicines.map((med, i) => (
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

                {(tests || advice) && (
                  <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                    {tests && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Tests</h3>
                        <p className="text-gray-300">{tests}</p>
                      </div>
                    )}
                    {advice && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Advice</h3>
                        <p className="text-gray-300">{advice}</p>
                      </div>
                    )}
                  </div>
                )}

                {followUp && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-primary-400">Follow-up: {followUp}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="card">
                <div className="flex flex-wrap gap-4">
                  {!txHash ? (
                    <>
                      <button onClick={handleGenerate} className="btn-secondary flex-1">
                        <FiRefreshCw size={18} />
                        Regenerate
                      </button>
                      <button onClick={handlePrint} className="btn-secondary flex-1">
                        <FiPrinter size={18} />
                        {t('prescription.printPrescription')}
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !patientHash}
                        className="btn-primary flex-1"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="loader w-5 h-5" />
                            {t('prescription.submitting')}
                          </>
                        ) : (
                          <>
                            <FiCheck size={18} />
                            {t('prescription.submitToBlockchain')}
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handlePrint} className="btn-secondary flex-1">
                        <FiPrinter size={18} />
                        {t('prescription.printPrescription')}
                      </button>
                      <button
                        onClick={() => copyToClipboard(txHash)}
                        className="btn-secondary flex-1"
                      >
                        <FiCopy size={18} />
                        Copy TX Hash
                      </button>
                      <button onClick={handleCreateAnother} className="btn-primary flex-1">
                        <FiPlus size={18} />
                        {t('prescription.createAnother')}
                      </button>
                    </>
                  )}
                </div>

                {txHash && (
                  <div className="alert alert-success mt-4">
                    <FiCheck size={20} />
                    <div>
                      <p className="font-medium">Prescription submitted successfully!</p>
                      <p className="text-sm mt-1 font-mono break-all">{txHash}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <div className="card">
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="btn-ghost"
            >
              <FiArrowLeft size={18} />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="btn-primary"
              >
                Next
                <FiArrowRight size={18} />
              </button>
            ) : (
              <button onClick={handleGenerate} className="btn-primary">
                <FiCheck size={18} />
                {t('prescription.generate')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTemplateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FiLayers className="text-primary-400" />
                  Select Template
                </h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="btn-icon"
                >
                  <FiX size={20} />
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <FiLayers size={48} className="mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400 mb-4">No templates available</p>
                  <button
                    onClick={() => {
                      setShowTemplateModal(false)
                      navigate('/templates')
                    }}
                    className="btn-primary"
                  >
                    <FiPlus size={18} />
                    Create Template
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                          {template.description && (
                            <p className="text-sm text-gray-400 line-clamp-2">{template.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiPackage size={14} />
                          {template.medicines?.length || 0} medicines
                        </span>
                        {template.diagnosis && (
                          <span className="flex items-center gap-1">
                            <FiHeart size={14} />
                            {template.diagnosis.substring(0, 20)}...
                          </span>
                        )}
                      </div>
                      <button className="btn-primary w-full mt-4 text-sm">
                        Apply Template
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowTemplateModal(false)
                    navigate('/templates')
                  }}
                  className="btn-secondary w-full"
                >
                  <FiPlus size={18} />
                  Manage Templates
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CreatePrescription

