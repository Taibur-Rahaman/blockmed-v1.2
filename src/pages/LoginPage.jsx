import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { FiGlobe, FiShield, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { useStore } from '../store/useStore'
import { DEFAULT_NETWORK, CONTRACT_ADDRESS, ROLES } from '../utils/config'
import contractABI from '../utils/contractABI.json'
import { 
  DEV_ACCOUNTS, 
  isDevMode, 
  enableDevMode, 
  disableDevMode, 
  getDevAccount,
  getDevBalance,
  testHardhatConnection,
  initDevMode
} from '../utils/devMode'
import { getProvider, getSigner, getReadContract, getWriteContract } from '../utils/contractHelper'

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
  
  // Dev Mode State
  const [devModeActive, setDevModeActive] = useState(false)
  const [selectedDevAccount, setSelectedDevAccount] = useState(0)
  const [hardhatRunning, setHardhatRunning] = useState(false)
  const [showDevPanel, setShowDevPanel] = useState(false)

  // Check existing connection
  useEffect(() => {
    const init = async () => {
      // Check Hardhat status
      const running = await testHardhatConnection()
      setHardhatRunning(running)
      
      // Check if dev mode was active
      const wasDevMode = initDevMode()
      if (wasDevMode && running) {
        setDevModeActive(true)
        const devAcc = getDevAccount()
        if (devAcc) {
          await handleAccountConnected(devAcc.address, true)
        }
        return
      }
      
      // Don't auto-connect if user explicitly logged out
      if (wasLoggedOut()) {
        return
      }
      checkExistingConnection()
    }
    init()
  }, [])

  const checkExistingConnection = async () => {
    // Check Dev Mode first - don't call window.ethereum if Dev Mode is active
    const { isDevMode, getDevAccount } = await import('../utils/devMode')
    if (isDevMode()) {
      const devAcc = getDevAccount()
      if (devAcc?.address) {
        await handleAccountConnected(devAcc.address, true)
        return
      }
    }
    
    // Only check wallet if Dev Mode is not active
    if (!window.ethereum) return
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        await handleAccountConnected(accounts[0], false)
      }
    } catch (error) {
      console.error('Error checking connection:', error)
    }
  }

  const handleAccountConnected = async (account, isDevModeConnection = false) => {
    setAccount(account)
    
    // Track user login (real-time)
    try {
      const stored = localStorage.getItem('blockmed-active-users') || '{}'
      const activeUsers = JSON.parse(stored)
      activeUsers[account] = {
        lastSeen: Date.now(),
        loginTime: Date.now(),
        sessionId: `session-${Date.now()}-${Math.random()}`
      }
      localStorage.setItem('blockmed-active-users', JSON.stringify(activeUsers))
    } catch (error) {
      console.error('Error tracking login:', error)
    }
    
    try {
      if (isDevModeConnection) {
        setNetwork('Hardhat Local (Dev Mode)', '0x7a69')
      } else if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        setNetwork(DEFAULT_NETWORK.chainName, chainId)
      }
      
      // Get user info from contract
      const contract = await getReadContract()
      
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
          setShowRegister(true)
        }
      } catch (err) {
        console.log('User not found, showing registration')
        setShowRegister(true)
      }
    } catch (error) {
      console.error('Error getting user info:', error)
    }
  }

  // Enable Dev Mode
  const handleEnableDevMode = async (accountIndex = 0) => {
    setIsConnecting(true)
    clearLogoutFlag()
    
    try {
      const result = await enableDevMode(accountIndex)
      if (result.success) {
        setDevModeActive(true)
        setSelectedDevAccount(accountIndex)
        await handleAccountConnected(result.account.address, true)
        toast.success(`Dev Mode: ${result.account.name}`)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsConnecting(false)
    }
  }

  // Disable Dev Mode
  const handleDisableDevMode = () => {
    disableDevMode()
    setDevModeActive(false)
    setAccount(null)
    setUser(null)
    setShowDevPanel(false)
  }

  // Normal wallet connection
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask or use Dev Mode!')
      return
    }

    setIsConnecting(true)
    clearLogoutFlag()

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length > 0) {
        await switchNetwork()
        await handleAccountConnected(accounts[0], false)
        toast.success('Wallet connected!')
      }
    } catch (error) {
      console.error('Connection error:', error)
      if (error.code === 4001) {
        toast.error('Connection rejected')
      } else {
        toast.error('Failed to connect. Try Dev Mode!')
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
      const contract = await getWriteContract()
      const currentAccount = await (await getProvider()).getSigner().getAddress()

      // Register user
      const tx = await contract.registerUser(
        registerData.name,
        registerData.licenseNumber,
        registerData.role
      )
      
      toast.loading('Registering on blockchain...')
      await tx.wait()
      
      toast.dismiss()
      
      // Auto-verify in Dev Mode (since Account #0 is admin)
      if (devModeActive) {
        try {
          toast.loading('Auto-verifying Dev Mode account...')
          
          // Get admin account (Account #0)
          const adminResult = await enableDevMode(0)
          if (adminResult.success) {
            const adminContract = await getWriteContract()
            const verifyTx = await adminContract.verifyUser(currentAccount)
            await verifyTx.wait()
            
            // Switch back to original account
            await enableDevMode(selectedDevAccount)
            
            toast.dismiss()
            toast.success('Registration successful! Account auto-verified.')
            
            setUser({
              name: registerData.name,
              licenseNumber: registerData.licenseNumber,
              role: registerData.role,
              isVerified: true,
              isActive: true,
            })
          }
        } catch (verifyError) {
          console.error('Auto-verify error:', verifyError)
          toast.dismiss()
          toast.success('Registration successful! (Manual verification needed)')
          
          setUser({
            name: registerData.name,
            licenseNumber: registerData.licenseNumber,
            role: registerData.role,
            isVerified: false,
            isActive: true,
          })
        }
      } else {
        toast.success('Registration successful! Awaiting admin verification.')
        
        setUser({
          name: registerData.name,
          licenseNumber: registerData.licenseNumber,
          role: registerData.role,
          isVerified: false,
          isActive: true,
        })
      }
      
      setShowRegister(false)
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.reason || error.message || 'Registration failed')
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

  // Get role color
  const getRoleColor = (role) => {
    const colors = {
      ADMIN: '#ef4444',
      DOCTOR: '#22c55e',
      PHARMACIST: '#3b82f6',
      MANUFACTURER: '#eab308',
      PATIENT: '#a855f7',
      REGULATOR: '#f97316'
    }
    return colors[role] || '#6b7280'
  }

  // Dev Mode Account Selection Panel
  const DevModePanel = () => (
    <>
      <div 
        onClick={() => setShowDevPanel(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 999
        }}
      />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        zIndex: 1000,
        minWidth: '400px',
        maxWidth: '500px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>🔧 Select Dev Account</h3>
          <button 
            onClick={() => setShowDevPanel(false)}
            style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        
        <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
          Each account has 10,000 ETH for free testing!
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {DEV_ACCOUNTS.map((acc, index) => (
            <button
              key={acc.address}
              onClick={() => {
                setShowDevPanel(false)
                handleEnableDevMode(index)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{acc.name}</div>
                <div style={{ color: '#6b7280', fontSize: '11px', fontFamily: 'monospace' }}>
                  {acc.address.substring(0, 10)}...{acc.address.substring(38)}
                </div>
              </div>
              <span style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                background: getRoleColor(acc.role),
                color: '#fff'
              }}>
                {acc.role}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {showDevPanel && <DevModePanel />}
      
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
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                    <FiShield size={40} className="text-primary-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {language === 'en' ? 'Get Started' : 'শুরু করুন'}
                  </h3>
                </div>

                {/* Hardhat Status */}
                <div style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: hardhatRunning ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${hardhatRunning ? '#22c55e' : '#ef4444'}`,
                  fontSize: '13px',
                  color: hardhatRunning ? '#22c55e' : '#ef4444',
                  textAlign: 'center'
                }}>
                  {hardhatRunning ? '✅ Hardhat Running - Ready!' : '❌ Hardhat Not Running'}
                  {!hardhatRunning && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#9ca3af' }}>
                      In a terminal: <code style={{ background: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>npm run blockchain</code>
                      <br />Then: <code style={{ background: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>npm run deploy</code> and refresh.
                    </div>
                  )}
                </div>

                {/* Dev Mode Button - PRIMARY */}
                <button
                  onClick={() => setShowDevPanel(true)}
                  disabled={isConnecting || !hardhatRunning}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: hardhatRunning 
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' 
                      : 'rgba(107, 114, 128, 0.3)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: hardhatRunning ? 'pointer' : 'not-allowed',
                    marginBottom: '8px',
                    boxShadow: hardhatRunning ? '0 4px 20px rgba(139, 92, 246, 0.4)' : 'none'
                  }}
                >
                  {isConnecting ? '⏳ Connecting...' : '🔧 Dev Mode (No Wallet Needed)'}
                </button>
                
                <p style={{ color: '#22c55e', fontSize: '12px', marginBottom: '20px', textAlign: 'center' }}>
                  ✨ Free transactions! Pre-funded accounts!
                </p>

                {/* Divider */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  margin: '20px 0',
                  color: '#6b7280',
                  fontSize: '12px'
                }}>
                  <div style={{ flex: 1, height: '1px', background: '#374151' }} />
                  <span style={{ padding: '0 12px' }}>or use wallet</span>
                  <div style={{ flex: 1, height: '1px', background: '#374151' }} />
                </div>

                {/* Wallet Connect Button */}
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="btn-secondary w-full"
                >
                  {isConnecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="loader w-5 h-5" />
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>🦊</span>
                      Connect MetaMask/Frame
                    </span>
                  )}
                </button>

                {!window.ethereum && (
                  <p style={{ marginTop: '10px', color: '#6b7280', fontSize: '11px', textAlign: 'center' }}>
                    No wallet? Use Dev Mode above!
                  </p>
                )}

                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <p className="text-sm text-gray-400">
                    {language === 'en'
                      ? 'Network: Hardhat Local (Free)'
                      : 'নেটওয়ার্ক: Hardhat Local (বিনামূল্যে)'}
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
