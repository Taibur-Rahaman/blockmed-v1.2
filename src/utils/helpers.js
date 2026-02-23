// ============================================
// BlockMed V2 - Helper Functions
// ============================================

import CryptoJS from 'crypto-js'
import { format, differenceInYears, isAfter, isBefore, parseISO } from 'date-fns'

// ============================================
// Address & Hash Formatting
// ============================================

/**
 * Shorten an Ethereum address
 */
export const shortenAddress = (address, chars = 4) => {
  if (!address) return ''
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`
}

/**
 * Alias for shortenAddress (older components import truncateAddress)
 */
export const truncateAddress = (address, chars = 4) => {
  return shortenAddress(address, chars)
}

/**
 * Shorten a transaction hash
 */
export const shortenHash = (hash, chars = 6) => {
  if (!hash) return ''
  return `${hash.substring(0, chars + 2)}...${hash.substring(hash.length - chars)}`
}

/**
 * Generate a patient hash from patient data
 * Uses NID (National ID) as the unique identifier if available
 */
export const generatePatientHash = (patientData) => {
  // If NID is provided, use it as the unique identifier (hash it for privacy)
  if (patientData.nid && patientData.nid.trim()) {
    // Hash NID to maintain privacy while keeping it unique
    return CryptoJS.SHA256(`NID:${patientData.nid.trim()}`).toString(CryptoJS.enc.Hex).substring(0, 32)
  }
  // Fallback to old method if no NID
  const data = `${patientData.name}|${patientData.dateOfBirth || ''}|${Date.now()}`
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Base64).substring(0, 32)
}

/**
 * Generate a unique prescription ID hash
 */
export const generatePrescriptionHash = (prescriptionData) => {
  const data = JSON.stringify(prescriptionData) + Date.now()
  return CryptoJS.SHA256(data).toString()
}

/**
 * Generate a hash of medicines array for verification
 * This ensures medicines cannot be tampered with
 */
export const generateMedicinesHash = (medicines) => {
  if (!medicines || medicines.length === 0) return ''
  // Sort medicines by name to ensure consistent hashing
  const sorted = [...medicines].sort((a, b) => 
    (a.name || a.medicineName || '').localeCompare(b.name || b.medicineName || '')
  )
  const medicinesString = JSON.stringify(sorted)
  return CryptoJS.SHA256(medicinesString).toString(CryptoJS.enc.Hex)
}

// ============================================
// Date & Age Calculations
// ============================================

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return ''
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth
  return differenceInYears(new Date(), dob)
}

/**
 * Format a date for display
 */
export const formatDate = (date, formatString = 'dd MMM yyyy') => {
  if (!date) return '-'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    return format(dateObj, formatString)
  } catch {
    return '-'
  }
}

/**
 * Format a timestamp (seconds) to date
 */
export const formatTimestamp = (timestamp, formatString = 'dd MMM yyyy, HH:mm') => {
  if (!timestamp) return '-'
  try {
    return format(new Date(Number(timestamp) * 1000), formatString)
  } catch {
    return '-'
  }
}

/**
 * Check if a date is expired
 */
export const isExpired = (expiryDate) => {
  if (!expiryDate) return false
  const expiry = typeof expiryDate === 'number' 
    ? new Date(expiryDate * 1000) 
    : new Date(expiryDate)
  return isBefore(expiry, new Date())
}

/**
 * Calculate days until expiry
 */
export const daysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return 0
  const expiry = typeof expiryDate === 'number' 
    ? new Date(expiryDate * 1000) 
    : new Date(expiryDate)
  const diff = expiry.getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ============================================
// Data Formatting
// ============================================

/**
 * Format prescription data for QR code
 */
export const formatPrescriptionForQR = (prescription) => {
  return JSON.stringify({
    id: prescription.id,
    patientHash: prescription.patientHash,
    doctor: prescription.doctor,
    timestamp: prescription.createdAt,
    version: prescription.version,
  })
}

/**
 * Parse QR code data
 */
export const parseQRData = (qrString) => {
  try {
    return JSON.parse(qrString)
  } catch {
    return null
  }
}

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return '-'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Format currency (for gas fees etc)
 */
export const formatCurrency = (amount, currency = 'ETH', decimals = 6) => {
  if (!amount) return `0 ${currency}`
  const formatted = parseFloat(amount).toFixed(decimals)
  return `${formatted} ${currency}`
}

// ============================================
// Validation
// ============================================

/**
 * Validate Ethereum address
 */
export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Validate phone number (Bangladesh format)
 */
export const isValidPhone = (phone) => {
  // Accepts formats like: +8801712345678, 01712345678, 1712345678
  return /^(?:\+?88)?01[3-9]\d{8}$/.test(phone.replace(/\s/g, ''))
}

/**
 * Validate batch number format
 */
export const isValidBatchNumber = (batchNumber) => {
  return batchNumber && batchNumber.length >= 5
}

// ============================================
// Role & Permission Helpers
// ============================================

/**
 * Get role name from role ID
 */
export const getRoleName = (roleId) => {
  const roles = ['None', 'Admin', 'Doctor', 'Pharmacist', 'Manufacturer', 'Patient', 'Regulator']
  return roles[roleId] || 'Unknown'
}

/**
 * Get role color class
 */
export const getRoleColorClass = (roleId) => {
  const colors = {
    0: 'text-gray-400 bg-gray-500/20',
    1: 'text-red-400 bg-red-500/20',
    2: 'text-green-400 bg-green-500/20',
    3: 'text-blue-400 bg-blue-500/20',
    4: 'text-yellow-400 bg-yellow-500/20',
    5: 'text-purple-400 bg-purple-500/20',
    6: 'text-orange-400 bg-orange-500/20',
  }
  return colors[roleId] || colors[0]
}

/**
 * Check if user has permission for an action
 */
export const hasPermission = (userRole, requiredRoles) => {
  if (!userRole) return false
  if (userRole === 1) return true // Admin has all permissions
  return requiredRoles.includes(userRole)
}

// ============================================
// User Restriction Helpers
// ============================================

/**
 * Check if a user is restricted
 * @param {string} userAddress - User's wallet address
 * @returns {object|null} - Restriction object or null
 */
export const getUserRestriction = (userAddress) => {
  if (!userAddress) return null
  
  try {
    const stored = localStorage.getItem('blockmed-user-restrictions')
    if (!stored) return null
    
    const restrictions = JSON.parse(stored)
    const restriction = restrictions[userAddress]
    if (!restriction) return null

    const now = Date.now()
    const expiresAt = restriction.expiresAt

    // Check if restriction is expired
    if (restriction.restrictionType === 'temporary' && expiresAt && now > expiresAt) {
      // Auto-remove expired restrictions
      const newRestrictions = { ...restrictions }
      delete newRestrictions[userAddress]
      localStorage.setItem('blockmed-user-restrictions', JSON.stringify(newRestrictions))
      return null
    }

    return restriction
  } catch (error) {
    console.error('Error checking user restriction:', error)
    return null
  }
}

/**
 * Check if user is restricted
 * @param {string} userAddress - User's wallet address
 * @returns {boolean} - True if user is restricted
 */
export const isUserRestricted = (userAddress) => {
  return getUserRestriction(userAddress) !== null
}

/**
 * Check if user has access to a feature
 * @param {string} userAddress - User's wallet address
 * @param {string} feature - Feature name (canCreatePrescription, canDispense, etc.)
 * @returns {boolean} - True if user has access
 */
export const hasFeatureAccess = (userAddress, feature) => {
  if (!userAddress) return false
  
  try {
    const stored = localStorage.getItem('blockmed-access-controls')
    if (!stored) return true // Default: allow access
    
    const accessControls = JSON.parse(stored)
    const controls = accessControls[userAddress]
    
    if (!controls) return true // No restrictions: allow access
    
    return controls[feature] !== false // Allow if not explicitly disabled
  } catch (error) {
    console.error('Error checking feature access:', error)
    return true // Default: allow access on error
  }
}

// ============================================
// Prescription Status Helpers
// ============================================

/**
 * Get prescription status
 */
export const getPrescriptionStatus = (prescription) => {
  if (!prescription.isActive) {
    return { status: 'inactive', label: 'Inactive', color: 'gray' }
  }
  if (prescription.isDispensed) {
    return { status: 'dispensed', label: 'Dispensed', color: 'blue' }
  }
  if (isExpired(prescription.expiresAt)) {
    return { status: 'expired', label: 'Expired', color: 'red' }
  }
  return { status: 'valid', label: 'Valid', color: 'green' }
}

/**
 * Get batch status
 */
export const getBatchStatus = (batch) => {
  if (batch.isRecalled) {
    return { status: 'recalled', label: 'Recalled', color: 'red', icon: '🚫' }
  }
  if (batch.isFlagged) {
    return { status: 'flagged', label: 'Flagged', color: 'yellow', icon: '⚠️' }
  }
  if (isExpired(batch.expiresAt)) {
    return { status: 'expired', label: 'Expired', color: 'gray', icon: '⏰' }
  }
  return { status: 'authentic', label: 'Authentic', color: 'green', icon: '✅' }
}

// ============================================
// Local Storage Helpers
// ============================================

/**
 * Save to local storage
 */
export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Error saving to storage:', error)
    return false
  }
}

/**
 * Load from local storage
 */
export const loadFromStorage = (key, defaultValue = null) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch (error) {
    console.error('Error loading from storage:', error)
    return defaultValue
  }
}

/**
 * Remove from local storage
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Error removing from storage:', error)
    return false
  }
}

// ============================================
// Copy to Clipboard
// ============================================

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (err) {
      document.body.removeChild(textArea)
      return false
    }
  }
}

// ============================================
// File Helpers
// ============================================

/**
 * Download JSON file
 */
export const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Read JSON file
 */
export const readJSONFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

// ============================================
// Debounce & Throttle
// ============================================

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export default {
  shortenAddress,
  shortenHash,
  generatePatientHash,
  generatePrescriptionHash,
  calculateAge,
  formatDate,
  formatTimestamp,
  isExpired,
  daysUntilExpiry,
  formatPrescriptionForQR,
  parseQRData,
  formatNumber,
  formatCurrency,
  isValidAddress,
  isValidEmail,
  isValidPhone,
  isValidBatchNumber,
  getRoleName,
  getRoleColorClass,
  hasPermission,
  getPrescriptionStatus,
  getBatchStatus,
  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  copyToClipboard,
  downloadJSON,
  readJSONFile,
  debounce,
  throttle,
}

