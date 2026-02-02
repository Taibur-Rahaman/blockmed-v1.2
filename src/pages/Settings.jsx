import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  FiSettings, FiGlobe, FiMoon, FiSun, FiBell, FiShield,
  FiLink, FiCopy, FiExternalLink, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi'

import { useStore } from '../store/useStore'
import { NETWORKS, DEFAULT_NETWORK } from '../utils/config'
import { shortenAddress, copyToClipboard } from '../utils/helpers'
import { getContractAddress, isBlockchainReady, getWriteContract, getReadContract } from '../utils/contractHelper'
import { 
  enableDevMode, 
  disableDevMode, 
  isDevMode, 
  getDevAccount,
  DEV_ACCOUNTS,
  testHardhatConnection
} from '../utils/devMode'

const Settings = () => {
  const { t } = useTranslation()
  const { 
    account, user, language, toggleLanguage, 
    theme, toggleTheme, isOnline, setAccount, setUser
  } = useStore()
  
  const [devModeActive, setDevModeActive] = useState(isDevMode())
  const [hardhatRunning, setHardhatRunning] = useState(false)
  const [selectedDevAccount, setSelectedDevAccount] = useState(0)
  const [verifying, setVerifying] = useState(false)
  
  useEffect(() => {
    const checkHardhat = async () => {
      const running = await testHardhatConnection()
      setHardhatRunning(running)
    }
    checkHardhat()
    
    if (devModeActive) {
      const devAcc = getDevAccount()
      if (devAcc) {
        const index = DEV_ACCOUNTS.findIndex(acc => acc.address === devAcc.address)
        if (index >= 0) setSelectedDevAccount(index)
      }
    }
  }, [])
  
  const handleEnableDevMode = async () => {
    try {
      const result = await enableDevMode(selectedDevAccount)
      if (result.success) {
        setDevModeActive(true)
        setAccount(result.account.address)
        toast.success(`Dev Mode enabled: ${result.account.name}`)
        // Reload to update the app state
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error(result.error || 'Failed to enable Dev Mode')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to enable Dev Mode')
    }
  }
  
  const handleDisableDevMode = () => {
    disableDevMode()
    setDevModeActive(false)
    setAccount(null)
    setUser(null)
    toast.success('Dev Mode disabled')
    setTimeout(() => window.location.reload(), 1000)
  }

  const handleVerifyAccount = async () => {
    if (!account || !user || user.isVerified) return
    
    setVerifying(true)
    try {
      // Switch to admin account (Account #0)
      const currentIndex = selectedDevAccount
      const adminResult = await enableDevMode(0)
      
      if (!adminResult.success) {
        toast.error('Failed to switch to admin account')
        return
      }
      
      const contract = await getWriteContract()
      const tx = await contract.verifyUser(account)
      
      toast.loading('Verifying account...')
      await tx.wait()
      
      // Switch back to original account
      await enableDevMode(currentIndex)
      
      // Refresh user info
      const readContract = await getReadContract()
      const userInfo = await readContract.getUser(account)
      setUser({
        address: userInfo.userAddress,
        role: Number(userInfo.role),
        name: userInfo.name,
        licenseNumber: userInfo.licenseNumber,
        isVerified: userInfo.isVerified,
        isActive: userInfo.isActive,
      })
      
      toast.dismiss()
      toast.success('Account verified successfully!')
    } catch (error) {
      console.error('Verify error:', error)
      toast.error(error.message || 'Failed to verify account')
    } finally {
      setVerifying(false)
    }
  }

  const handleCopyAddress = async () => {
    await copyToClipboard(account)
    toast.success('Address copied!')
  }

  const handleCopyContract = async () => {
    await copyToClipboard(getContractAddress())
    toast.success('Contract address copied!')
  }

  const [blockchainStatus, setBlockchainStatus] = useState({ ready: false, error: null })
  const [testingConnection, setTestingConnection] = useState(false)
  const testBlockchainConnection = async () => {
    setTestingConnection(true)
    setBlockchainStatus({ ready: false, error: null })
    try {
      const result = await isBlockchainReady()
      setBlockchainStatus({ ready: result.ready, error: result.error })
      if (result.ready) toast.success('Blockchain connected')
      else toast.error(result.error)
    } catch (e) {
      setBlockchainStatus({ ready: false, error: e?.message })
      toast.error(e?.message || 'Connection failed')
    } finally {
      setTestingConnection(false)
    }
  }
  useEffect(() => {
    testBlockchainConnection()
  }, [account])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FiSettings className="text-primary-400" />
          {t('settings.title')}
        </h1>
      </div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiShield className="text-primary-400" />
          {t('settings.profile')}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="text-sm text-gray-400">Name</p>
              <p className="text-white font-medium">{user?.name || 'Not set'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="text-sm text-gray-400">Wallet Address</p>
              <p className="text-white font-mono">{shortenAddress(account, 8)}</p>
            </div>
            <button onClick={handleCopyAddress} className="btn-icon">
              <FiCopy size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="text-sm text-gray-400">License Number</p>
              <p className="text-white">{user?.licenseNumber || 'Not set'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex-1">
              <p className="text-sm text-gray-400">Verification Status</p>
              <p className={user?.isVerified ? 'text-primary-400' : 'text-yellow-400'}>
                {user?.isVerified ? 'Verified' : 'Pending Verification'}
              </p>
            </div>
            {!user?.isVerified && devModeActive && (
              <button
                onClick={handleVerifyAccount}
                disabled={verifying}
                className="btn-primary text-sm"
              >
                {verifying ? 'Verifying...' : 'Verify Now'}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Blockchain connection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiLink className="text-primary-400" />
          Blockchain
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="text-sm text-gray-400">Contract address</p>
              <p className="text-white font-mono text-sm">{shortenAddress(getContractAddress(), 12)}</p>
            </div>
            <button onClick={handleCopyContract} className="btn-icon">
              <FiCopy size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="text-sm text-gray-400">Connection</p>
              <p className={blockchainStatus.ready ? 'text-green-400' : 'text-amber-400'}>
                {blockchainStatus.ready ? '✓ Connected' : (blockchainStatus.error || 'Unknown')}
              </p>
            </div>
            <button
              onClick={testBlockchainConnection}
              disabled={testingConnection}
              className="px-4 py-2 rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/40 hover:bg-primary-500/30 disabled:opacity-50"
            >
              {testingConnection ? 'Testing…' : 'Test'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Language & Theme */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiGlobe className="text-primary-400" />
          {t('settings.language')} & {t('settings.theme')}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <FiGlobe size={20} className="text-gray-400" />
              <div>
                <p className="text-white font-medium">{t('settings.language')}</p>
                <p className="text-sm text-gray-400">
                  {language === 'en' ? 'English' : 'বাংলা'}
                </p>
              </div>
            </div>
            <button 
              onClick={toggleLanguage}
              className="px-4 py-2 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
            >
              {language === 'en' ? 'বাংলা' : 'English'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <FiMoon size={20} className="text-gray-400" />
              ) : (
                <FiSun size={20} className="text-yellow-400" />
              )}
              <div>
                <p className="text-white font-medium">{t('settings.theme')}</p>
                <p className="text-sm text-gray-400">
                  {theme === 'dark' ? t('settings.dark') : t('settings.light')}
                </p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {theme === 'dark' ? t('settings.light') : t('settings.dark')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiBell className="text-primary-400" />
          {t('settings.notifications')}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="text-white font-medium">{t('settings.enableNotifications')}</p>
              <p className="text-sm text-gray-400">Receive alerts for important updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="text-white font-medium">Fake Medicine Alerts</p>
              <p className="text-sm text-gray-400">Get notified about recalled batches</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Blockchain Setup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`card border-2 ${blockchainStatus.ready ? 'border-primary-500/30' : 'border-amber-500/30'}`}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          {blockchainStatus.ready ? <FiCheckCircle className="text-primary-400" /> : <FiAlertCircle className="text-amber-400" />}
          Blockchain Setup
          {blockchainStatus.ready && <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300">Ready</span>}
        </h2>
        {!blockchainStatus.ready && (
          <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-amber-300 text-sm font-medium mb-2">To use blockchain (create batches, prescriptions):</p>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Terminal 1: <code className="bg-black/30 px-2 py-0.5 rounded">npx hardhat node</code></li>
              <li>Terminal 2: <code className="bg-black/30 px-2 py-0.5 rounded">npm run deploy</code></li>
              <li>Enable Dev Mode below, then refresh</li>
            </ol>
          </div>
        )}
        <button onClick={testBlockchainConnection} disabled={testingConnection} className="btn-secondary w-full mb-4">
          {testingConnection ? 'Testing...' : 'Test Connection'}
        </button>
      </motion.div>

      {/* Network & Contract */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiLink className="text-primary-400" />
          {t('settings.network')}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="text-sm text-gray-400">Network Status</p>
              <p className={`font-medium ${isOnline ? 'text-primary-400' : 'text-red-400'}`}>
                {isOnline ? 'Connected' : 'Offline'}
              </p>
            </div>
            <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-primary-500 animate-pulse' : 'bg-red-500'}`} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="text-sm text-gray-400">Current Network</p>
              <p className="text-white font-medium">{DEFAULT_NETWORK.chainName}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex-1 mr-4">
              <p className="text-sm text-gray-400">Smart Contract</p>
              <p className="text-white font-mono text-sm break-all">{getContractAddress()}</p>
            </div>
            <button onClick={handleCopyContract} className="btn-icon">
              <FiCopy size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="text-sm text-gray-400">RPC URL</p>
              <p className="text-white text-sm">{DEFAULT_NETWORK.rpcUrls[0]}</p>
            </div>
            <a 
              href={DEFAULT_NETWORK.blockExplorerUrls?.[0] || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon"
            >
              <FiExternalLink size={16} />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Dev Mode Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-primary-400">🔧</span>
          Dev Mode
        </h2>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-medium">Dev Mode Status</p>
                <p className="text-sm text-gray-400">
                  {devModeActive 
                    ? `Active: ${getDevAccount()?.name || 'Unknown'}`
                    : 'Not enabled - Enable to use Hardhat accounts without a wallet'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                devModeActive 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {devModeActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-white/5">
              <p className="text-xs text-gray-400 mb-2">Hardhat Status:</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${hardhatRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm text-white">
                  {hardhatRunning ? '✅ Running on port 8545' : '❌ Not running'}
                </span>
              </div>
              {!hardhatRunning && (
                <p className="text-xs text-yellow-400 mt-2">
                  Run: <code className="bg-black/30 px-2 py-1 rounded">npx hardhat node</code>
                </p>
              )}
            </div>

            {!devModeActive ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Select Dev Account:</label>
                  <select
                    value={selectedDevAccount}
                    onChange={(e) => setSelectedDevAccount(parseInt(e.target.value))}
                    className="w-full form-select"
                    disabled={!hardhatRunning}
                  >
                    {DEV_ACCOUNTS.map((acc, index) => (
                      <option key={index} value={index}>
                        {acc.name} - {acc.address.substring(0, 10)}...
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleEnableDevMode}
                  disabled={!hardhatRunning}
                  className="w-full btn-primary"
                >
                  {hardhatRunning ? '🔧 Enable Dev Mode' : '⏳ Waiting for Hardhat...'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                  <p className="text-sm text-white font-medium mb-1">
                    {getDevAccount()?.name}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {getDevAccount()?.address}
                  </p>
                </div>
                <button
                  onClick={handleDisableDevMode}
                  className="w-full btn-secondary"
                >
                  🔒 Disable Dev Mode
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Version Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center py-6"
      >
        <p className="text-gray-500 text-sm">
          BlockMed V2.0 • Blockchain Healthcare Security
        </p>
        <p className="text-gray-600 text-xs mt-1">
          Built with React, Ethers.js & Solidity
        </p>
      </motion.div>
    </div>
  )
}

export default Settings

