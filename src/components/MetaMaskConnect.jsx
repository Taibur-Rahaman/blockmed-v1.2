import React, { useState, useEffect } from 'react'
import { 
  DEV_ACCOUNTS, 
  isDevMode, 
  enableDevMode, 
  disableDevMode, 
  getDevAccount,
  getDevBalance,
  testHardhatConnection,
  initDevMode,
  switchDevAccount
} from '../utils/devMode'
import { fundWallet, getWalletBalance, canFundWallet } from '../utils/walletFund'

const MetaMaskConnect = ({ account, setAccount }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [currentNetwork, setCurrentNetwork] = useState('')
  const [walletType, setWalletType] = useState('')
  const [devModeActive, setDevModeActive] = useState(false)
  const [devBalance, setDevBalance] = useState(null)
  const [selectedDevAccount, setSelectedDevAccount] = useState(0)
  const [hardhatRunning, setHardhatRunning] = useState(false)
  const [showDevPanel, setShowDevPanel] = useState(false)
  const [walletBalance, setWalletBalance] = useState(null)
  const [isFunding, setIsFunding] = useState(false)
  const [fundingStatus, setFundingStatus] = useState(null)
  const [canFund, setCanFund] = useState(false)

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      // Check if Hardhat is running
      const running = await testHardhatConnection()
      setHardhatRunning(running)
      
      // Check if we can fund wallets
      if (running) {
        const fundCheck = await canFundWallet()
        setCanFund(fundCheck.canFund)
      }
      
      // Check if dev mode was previously enabled
      const wasDevMode = initDevMode()
      if (wasDevMode && running) {
        setDevModeActive(true)
        const devAcc = getDevAccount()
        if (devAcc) {
          setAccount(devAcc.address)
          setCurrentNetwork('Hardhat Local (Dev Mode)')
          const bal = await getDevBalance()
          setDevBalance(bal)
        }
      } else {
        // Normal wallet detection
        setWalletType(detectWallet())
        await checkIfWalletIsConnected()
      }
    }
    init()
  }, [])

  // Update wallet balance when account changes
  useEffect(() => {
    const updateBalance = async () => {
      if (account && !devModeActive && hardhatRunning) {
        const balance = await getWalletBalance(account)
        setWalletBalance(balance)
      }
    }
    updateBalance()
    const interval = setInterval(updateBalance, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [account, devModeActive, hardhatRunning])

  // Detect wallet type
  const detectWallet = () => {
    if (window.ethereum?.isFrame) return 'Frame'
    if (window.ethereum?.isMetaMask) return 'MetaMask'
    if (window.ethereum?.isRabby) return 'Rabby'
    if (window.ethereum) return 'Web3 Wallet'
    return 'None'
  }

  const checkIfWalletIsConnected = async () => {
    try {
      // Don't check wallet if Dev Mode is active
      if (isDevMode()) {
        return
      }
      
      if (!window.ethereum) return
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        setAccount(accounts[0])
        // Get balance
        const balance = await getWalletBalance(accounts[0])
        setWalletBalance(balance)
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }

  // Fund connected wallet
  const handleFundWallet = async () => {
    if (!account) {
      alert('Please connect your wallet first!')
      return
    }

    setIsFunding(true)
    setFundingStatus(null)

    try {
      const result = await fundWallet(account, '10.0')
      
      if (result.success) {
        setFundingStatus({
          type: 'success',
          message: `✅ Successfully funded! Received ${result.amount} ETH\n\nOld Balance: ${result.oldBalance} ETH\nNew Balance: ${result.newBalance} ETH\n\nTx: ${result.txHash}`
        })
        // Update balance
        const newBalance = await getWalletBalance(account)
        setWalletBalance(newBalance)
      } else {
        setFundingStatus({
          type: 'error',
          message: `❌ Failed to fund wallet:\n\n${result.error}`
        })
      }
    } catch (error) {
      setFundingStatus({
        type: 'error',
        message: `❌ Error: ${error.message}`
      })
    } finally {
      setIsFunding(false)
      // Clear status after 5 seconds
      setTimeout(() => setFundingStatus(null), 5000)
    }
  }

  // Enable Dev Mode
  const handleEnableDevMode = async (accountIndex = 0) => {
    setIsConnecting(true)
    try {
      const result = await enableDevMode(accountIndex)
      if (result.success) {
        setDevModeActive(true)
        setAccount(result.account.address)
        setDevBalance(result.balance)
        setCurrentNetwork('Hardhat Local (Dev Mode)')
        setSelectedDevAccount(accountIndex)
        alert(`✅ Dev Mode Enabled!\n\n👤 ${result.account.name}\n📍 ${result.account.address}\n💰 ${result.balance} ETH\n\n🚀 No wallet needed! Free transactions!`)
      } else {
        alert(`❌ Failed to enable Dev Mode:\n\n${result.error}\n\n💡 Make sure Hardhat is running:\nnpx hardhat node`)
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  // Disable Dev Mode
  const handleDisableDevMode = () => {
    disableDevMode()
    setDevModeActive(false)
    setAccount(null)
    setDevBalance(null)
    setCurrentNetwork('')
    setShowDevPanel(false)
  }

  // Switch Dev Account
  const handleSwitchDevAccount = async (accountIndex) => {
    setSelectedDevAccount(accountIndex)
    await handleEnableDevMode(accountIndex)
  }

  // Normal wallet connection
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!')
        window.open('https://metamask.io/download/', '_blank')
        return
      }

      setIsConnecting(true)
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length > 0) {
        setAccount(accounts[0])
        await switchToLocalNetwork()
        // Get balance after connecting
        const balance = await getWalletBalance(accounts[0])
        setWalletBalance(balance)
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error)
      if (error.code === 4001) {
        alert('Connection request rejected.')
      } else {
        alert('Failed to connect. Try Dev Mode instead!')
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const switchToLocalNetwork = async () => {
    try {
      if (!window.ethereum) return
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      const validChainIds = ['0x539', '0x7a69']
      
      if (!validChainIds.includes(chainId)) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7a69' }],
          })
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x7a69',
                chainName: 'Hardhat Local',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              }],
            })
          }
        }
      }
    } catch (error) {
      console.error('Error switching network:', error)
    }
  }

  // Listen for account/chain changes
  useEffect(() => {
    if (window.ethereum && !devModeActive) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
        } else {
          setAccount(null)
        }
      }

      const handleChainChanged = (chainId) => {
        if (chainId === '0x7a69') {
          setCurrentNetwork('Hardhat Local')
        } else if (chainId === '0x539') {
          setCurrentNetwork('Ganache Local')
        } else {
          setCurrentNetwork('Other Network')
        }
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [setAccount, devModeActive])

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

  // ==================== RENDER ====================

  // Dev Mode Panel
  const DevModePanel = () => (
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
        <h3 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>🔧 Dev Mode - Select Account</h3>
        <button 
          onClick={() => setShowDevPanel(false)}
          style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>
      
      <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
        Select a pre-funded Hardhat account. Each has 10,000 ETH for testing.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {DEV_ACCOUNTS.map((acc, index) => (
          <button
            key={acc.address}
            onClick={() => handleSwitchDevAccount(index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: selectedDevAccount === index ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
              border: selectedDevAccount === index ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
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
      
      {devModeActive && (
        <button
          onClick={handleDisableDevMode}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            color: '#ef4444',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🔒 Disable Dev Mode
        </button>
      )}
    </div>
  )

  // Overlay
  const Overlay = () => (
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
  )

  // Connected state (Dev Mode)
  if (devModeActive && account) {
    const devAcc = getDevAccount()
    return (
      <div className="text-center">
        {showDevPanel && <><Overlay /><DevModePanel /></>}
        
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(139, 92, 246, 0.3)'
        }}>
          <div style={{ 
            display: 'inline-block',
            padding: '4px 12px',
            background: '#8b5cf6',
            borderRadius: '20px',
            color: '#fff',
            fontSize: '11px',
            fontWeight: '700',
            marginBottom: '12px'
          }}>
            🔧 DEV MODE
          </div>
          
          <p style={{ color: '#22c55e', fontWeight: '700', margin: '8px 0' }}>
            ✅ Connected
          </p>
          
          <p style={{ color: '#fff', fontWeight: '600', fontSize: '14px', margin: '4px 0' }}>
            {devAcc?.name}
          </p>
          
          <p style={{ color: '#9ca3af', fontSize: '12px', fontFamily: 'monospace', margin: '4px 0' }}>
            {account.substring(0, 8)}...{account.substring(38)}
          </p>
          
          <p style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '600', margin: '8px 0' }}>
            💰 {devBalance ? `${parseFloat(devBalance).toFixed(2)} ETH` : 'Loading...'}
          </p>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => setShowDevPanel(true)}
              style={{
                padding: '8px 16px',
                background: 'rgba(139, 92, 246, 0.3)',
                border: '1px solid #8b5cf6',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🔄 Switch Account
            </button>
            <button
              onClick={handleDisableDevMode}
              style={{
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✕ Exit
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Connected state (Wallet)
  if (account && !devModeActive) {
    return (
      <div className="text-center">
        <button className="btn-success" disabled>
          {walletType === 'MetaMask' ? '🦊' : walletType === 'Frame' ? '🖼️' : '💳'} Connected ✅
        </button>
        <p style={{ marginTop: '10px', color: '#059669', fontWeight: '600' }}>
          {account.substring(0, 6)}...{account.substring(account.length - 4)}
        </p>
        <p style={{ marginTop: '5px', fontSize: '14px', color: '#8b5cf6' }}>
          {walletType}
        </p>
        
        {/* Balance Display */}
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid #22c55e',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <span style={{ color: '#9ca3af' }}>Balance: </span>
          <span style={{ color: '#22c55e', fontWeight: '600' }}>
            {walletBalance !== null ? `${walletBalance.toFixed(4)} ETH` : 'Loading...'}
          </span>
        </div>

        {/* Fund Wallet Button */}
        {hardhatRunning && canFund && (
          <button
            onClick={handleFundWallet}
            disabled={isFunding}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '10px 16px',
              background: isFunding 
                ? 'rgba(107, 114, 128, 0.3)' 
                : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isFunding ? 'not-allowed' : 'pointer',
              boxShadow: isFunding ? 'none' : '0 4px 15px rgba(34, 197, 94, 0.3)'
            }}
          >
            {isFunding ? '⏳ Funding...' : '💰 Fund Wallet (10 ETH)'}
          </button>
        )}

        {/* Funding Status */}
        {fundingStatus && (
          <div style={{
            marginTop: '12px',
            padding: '10px',
            background: fundingStatus.type === 'success' 
              ? 'rgba(34, 197, 94, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${fundingStatus.type === 'success' ? '#22c55e' : '#ef4444'}`,
            borderRadius: '8px',
            fontSize: '12px',
            color: fundingStatus.type === 'success' ? '#22c55e' : '#ef4444',
            whiteSpace: 'pre-line',
            textAlign: 'left'
          }}>
            {fundingStatus.message}
          </div>
        )}

        {/* Low Balance Warning */}
        {walletBalance !== null && walletBalance < 0.1 && (
          <div style={{
            marginTop: '12px',
            padding: '8px',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#fbbf24'
          }}>
            ⚠️ Low balance! Click "Fund Wallet" to get test ETH
          </div>
        )}

        <button
          onClick={() => setShowDevPanel(true)}
          style={{
            marginTop: '10px',
            padding: '6px 12px',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid #8b5cf6',
            borderRadius: '6px',
            color: '#8b5cf6',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          🔧 Switch to Dev Mode
        </button>
        {showDevPanel && <><Overlay /><DevModePanel /></>}
      </div>
    )
  }

  // Not connected state
  return (
    <div className="text-center">
      {showDevPanel && <><Overlay /><DevModePanel /></>}
      
      {/* Hardhat Status */}
      <div style={{
        marginBottom: '16px',
        padding: '8px 12px',
        borderRadius: '8px',
        background: hardhatRunning ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${hardhatRunning ? '#22c55e' : '#ef4444'}`,
        fontSize: '12px',
        color: hardhatRunning ? '#22c55e' : '#ef4444'
      }}>
        {hardhatRunning ? '✅ Hardhat Running' : '❌ Hardhat Not Running'}
        {!hardhatRunning && (
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#9ca3af' }}>
            Run: <code style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>npx hardhat node</code>
          </div>
        )}
      </div>

      {/* Dev Mode Button - RECOMMENDED */}
      <button
        onClick={() => handleEnableDevMode(0)}
        disabled={isConnecting || !hardhatRunning}
        style={{
          width: '100%',
          padding: '14px 20px',
          background: hardhatRunning 
            ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' 
            : 'rgba(107, 114, 128, 0.3)',
          border: 'none',
          borderRadius: '12px',
          color: '#fff',
          fontSize: '15px',
          fontWeight: '700',
          cursor: hardhatRunning ? 'pointer' : 'not-allowed',
          marginBottom: '12px',
          boxShadow: hardhatRunning ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none'
        }}
      >
        {isConnecting ? '⏳ Connecting...' : '🔧 Use Dev Mode (Recommended)'}
      </button>
      
      <p style={{ color: '#22c55e', fontSize: '11px', marginBottom: '16px' }}>
        ✨ No wallet setup needed! Free transactions!
      </p>

      {/* Divider */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        margin: '16px 0',
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
        disabled={isConnecting || !window.ethereum}
        style={{
          width: '100%',
          padding: '12px 20px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          color: '#9ca3af',
          fontSize: '14px',
          fontWeight: '600',
          cursor: window.ethereum ? 'pointer' : 'not-allowed'
        }}
      >
        {window.ethereum 
          ? `${walletType === 'MetaMask' ? '🦊' : walletType === 'Frame' ? '🖼️' : '💳'} Connect ${walletType}`
          : '❌ No Wallet Detected'
        }
      </button>
      
      {!window.ethereum && (
        <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '11px' }}>
          💡 Use Dev Mode above - no wallet needed!
        </p>
      )}
    </div>
  )
}

export default MetaMaskConnect
