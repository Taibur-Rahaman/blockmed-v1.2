import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { FiGlobe, FiShield, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { useStore } from '../store/useStore'
import { DEFAULT_NETWORK, NETWORKS, CONTRACT_ADDRESS, ROLES } from '../utils/config'
import contractABI from '../utils/contractABI.json'

const LoginPage = () => {
  const { t } = useTranslation()
  const { setAccount, setUser, setNetwork, language, toggleLanguage, wasLoggedOut, clearLogoutFlag } = useStore()
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [registerData, setRegisterData] = useState({
    name: '',
    licenseNumber: '',
    role: ROLES.DOCTOR,
  })

  // Check existing connection (but not if user explicitly logged out)
  useEffect(() => {
    // Don't auto-connect if user explicitly logged out
    if (wasLoggedOut()) {
      return
    }
    checkExistingConnection()
  }, [])

  const checkExistingConnection = async () => {
    if (!window.ethereum) return
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        await handleAccountConnected(accounts[0])
      }
    } catch (error) {
      console.error('Error checking connection:', error)
    }
  }

  const handleAccountConnected = async (account) => {
    setAccount(account)
    
    // Check chain and get user info
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      setNetwork(DEFAULT_NETWORK.chainName, chainId)
      
      // Get user info from contract
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)
      
      try {
        const userInfo = await contract.getUser(account)
        if (userInfo && userInfo.role !== 0n) {
          setUser({
            address: userInfo.userAddress,
            role: Number(userInfo.role),
            name: userInfo.name,
            licenseNumber: userInfo.licenseNumber,
            isVerified: userInfo.isVerified,
            isActive: userInfo.isActive,
            registeredAt: Number(userInfo.registeredAt),
          })
        } else {
          // User not registered - show registration
          setShowRegister(true)
        }
      } catch (err) {
        // Contract might not have user, show register
        console.log('User not found, showing registration')
        setShowRegister(true)
      }
    } catch (error) {
      console.error('Error getting user info:', error)
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask!')
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    setIsConnecting(true)
    // Clear logout flag when user manually connects
    clearLogoutFlag()

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length > 0) {
        // Switch to correct network
        await switchNetwork()
        await handleAccountConnected(accounts[0])
        toast.success('Wallet connected successfully!')
      }
    } catch (error) {
      console.error('Connection error:', error)
      if (error.code === 4001) {
        toast.error('Connection rejected by user')
      } else {
        toast.error('Failed to connect wallet')
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: DEFAULT_NETWORK.chainId }],
      })
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [DEFAULT_NETWORK],
          })
        } catch (addError) {
          console.error('Failed to add network:', addError)
        }
      }
    }
  }

  const handleRegister = async () => {
    if (!registerData.name.trim() || !registerData.licenseNumber.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsRegistering(true)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)

      const tx = await contract.registerUser(
        registerData.name,
        registerData.licenseNumber,
        registerData.role
      )
      
      toast.loading('Registering on blockchain...')
      await tx.wait()
      
      toast.dismiss()
      toast.success('Registration successful! Awaiting admin verification.')
      
      setUser({
        name: registerData.name,
        licenseNumber: registerData.licenseNumber,
        role: registerData.role,
        isVerified: false,
        isActive: true,
      })
      
      setShowRegister(false)
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed')
    } finally {
      setIsRegistering(false)
    }
  }

  const features = [
    { icon: '🔒', title: 'Blockchain Secured', desc: 'Immutable prescription storage' },
    { icon: '📱', title: 'QR Verification', desc: 'Instant medicine authentication' },
    { icon: '🏥', title: 'Multi-Role Access', desc: 'Doctor, Pharmacy, Patient portals' },
    { icon: '🛡️', title: 'Anti-Counterfeit', desc: 'Fake medicine detection system' },
  ]

  const roleOptions = [
    { value: ROLES.DOCTOR, label: 'Doctor', labelBn: 'ডাক্তার' },
    { value: ROLES.PHARMACIST, label: 'Pharmacist', labelBn: 'ফার্মাসিস্ট' },
    { value: ROLES.MANUFACTURER, label: 'Manufacturer', labelBn: 'প্রস্তুতকারক' },
    { value: ROLES.PATIENT, label: 'Patient', labelBn: 'রোগী' },
    { value: ROLES.REGULATOR, label: 'Regulator (DGDA)', labelBn: 'নিয়ন্ত্রক (ডিজিডিএ)' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Language Toggle */}
      <button
        onClick={toggleLanguage}
        className="absolute top-6 right-6 btn-icon flex items-center gap-2 z-10"
      >
        <FiGlobe size={18} />
        <span className="text-sm font-medium">{language === 'en' ? 'বাংলা' : 'English'}</span>
      </button>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-3xl shadow-neon animate-float">
              🏥
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white">
                Block<span className="text-primary-400">Med</span>
              </h1>
              <p className="text-gray-400">V2.0</p>
            </div>
          </div>

          <h2 className="text-2xl lg:text-3xl font-semibold text-white mb-4">
            {language === 'en' 
              ? 'Blockchain Healthcare Security' 
              : 'ব্লকচেইন স্বাস্থ্য নিরাপত্তা'}
          </h2>
          
          <p className="text-gray-400 text-lg mb-8 max-w-md">
            {language === 'en'
              ? 'Secure prescription management and anti-counterfeit medicine tracking powered by blockchain technology.'
              : 'ব্লকচেইন প্রযুক্তি দ্বারা চালিত নিরাপদ প্রেসক্রিপশন ব্যবস্থাপনা এবং জাল ওষুধ ট্র্যাকিং।'}
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="glass-card p-4 text-left"
              >
                <span className="text-2xl mb-2 block">{feature.icon}</span>
                <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                <p className="text-gray-400 text-xs">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Connect/Register Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="glass-card p-8 max-w-md mx-auto">
            {!showRegister ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                    <FiShield size={40} className="text-primary-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {t('auth.connectWallet')}
                  </h3>
                  <p className="text-gray-400">
                    {language === 'en'
                      ? 'Connect your MetaMask wallet to access BlockMed'
                      : 'BlockMed অ্যাক্সেস করতে আপনার MetaMask ওয়ালেট সংযুক্ত করুন'}
                  </p>
                </div>

                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="btn-primary w-full text-lg py-4 mb-4"
                >
                  {isConnecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="loader w-5 h-5" />
                      {t('auth.connecting')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>🦊</span>
                      {t('auth.connectWallet')}
                    </span>
                  )}
                </button>

                {!window.ethereum && (
                  <div className="alert alert-warning text-sm">
                    <FiAlertCircle size={18} />
                    <span>{t('auth.metamaskRequired')}</span>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <p className="text-sm text-gray-400">
                    {language === 'en'
                      ? 'Supported networks: Hardhat Local, Polygon Mumbai'
                      : 'সমর্থিত নেটওয়ার্ক: Hardhat Local, Polygon Mumbai'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {language === 'en' ? 'Register Account' : 'অ্যাকাউন্ট নিবন্ধন'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {language === 'en'
                      ? 'Complete registration to access the system'
                      : 'সিস্টেম অ্যাক্সেস করতে নিবন্ধন সম্পূর্ণ করুন'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">
                      {language === 'en' ? 'Full Name' : 'পূর্ণ নাম'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === 'en' ? 'Enter your name' : 'আপনার নাম লিখুন'}
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {language === 'en' ? 'License/Registration Number' : 'লাইসেন্স/নিবন্ধন নম্বর'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === 'en' ? 'e.g., BMDC-12345' : 'যেমন, BMDC-12345'}
                      value={registerData.licenseNumber}
                      onChange={(e) => setRegisterData({ ...registerData, licenseNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {language === 'en' ? 'Role' : 'ভূমিকা'}
                    </label>
                    <select
                      className="form-select"
                      value={registerData.role}
                      onChange={(e) => setRegisterData({ ...registerData, role: parseInt(e.target.value) })}
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {language === 'en' ? option.label : option.labelBn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="btn-primary w-full mt-4"
                  >
                    {isRegistering ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="loader w-5 h-5" />
                        {language === 'en' ? 'Registering...' : 'নিবন্ধন হচ্ছে...'}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <FiCheckCircle size={18} />
                        {language === 'en' ? 'Register' : 'নিবন্ধন করুন'}
                      </span>
                    )}
                  </button>

                  <div className="alert alert-info text-sm mt-4">
                    <FiAlertCircle size={18} />
                    <span>
                      {language === 'en'
                        ? 'Your account will need admin verification before full access.'
                        : 'সম্পূর্ণ অ্যাক্সেসের আগে আপনার অ্যাকাউন্টে অ্যাডমিন যাচাই প্রয়োজন।'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  )
}

export default LoginPage

