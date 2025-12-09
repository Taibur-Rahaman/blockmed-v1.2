import { ethers } from 'ethers'

// ============================================
// BlockMed Dev Mode - NO WALLET NEEDED!
// ============================================
// This bypasses MetaMask/Frame entirely and connects
// directly to Hardhat with pre-funded accounts.

// Hardhat's default pre-funded accounts (10,000 ETH each)
// These are deterministic - same every time you run `npx hardhat node`
export const DEV_ACCOUNTS = [
  {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    name: 'Admin (Account #0)',
    role: 'ADMIN'
  },
  {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    name: 'Doctor (Account #1)',
    role: 'DOCTOR'
  },
  {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    name: 'Pharmacist (Account #2)',
    role: 'PHARMACIST'
  },
  {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    name: 'Manufacturer (Account #3)',
    role: 'MANUFACTURER'
  },
  {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
    name: 'Patient (Account #4)',
    role: 'PATIENT'
  },
  {
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
    name: 'Regulator (Account #5)',
    role: 'REGULATOR'
  }
]

// Dev Mode State
let devModeEnabled = false
let currentDevAccount = null
let devProvider = null
let devSigner = null

// Storage key
const DEV_MODE_KEY = 'blockmed-dev-mode'
const DEV_ACCOUNT_KEY = 'blockmed-dev-account'

/**
 * Initialize dev mode from localStorage
 */
export function initDevMode() {
  try {
    const stored = localStorage.getItem(DEV_MODE_KEY)
    const storedAccount = localStorage.getItem(DEV_ACCOUNT_KEY)
    
    if (stored === 'true') {
      devModeEnabled = true
      const accountIndex = parseInt(storedAccount) || 0
      currentDevAccount = DEV_ACCOUNTS[accountIndex]
      console.log('🔧 Dev Mode initialized with:', currentDevAccount.name)
    }
  } catch (e) {
    console.warn('Could not load dev mode settings')
  }
  return devModeEnabled
}

/**
 * Check if dev mode is enabled
 */
export function isDevMode() {
  return devModeEnabled
}

/**
 * Enable dev mode with a specific account
 */
export async function enableDevMode(accountIndex = 0) {
  try {
    // Validate account index
    if (accountIndex < 0 || accountIndex >= DEV_ACCOUNTS.length) {
      throw new Error(`Invalid account index. Must be between 0 and ${DEV_ACCOUNTS.length - 1}`)
    }

    // Test connection to Hardhat first
    const connected = await testHardhatConnection()
    if (!connected) {
      throw new Error('Hardhat node not running. Start it with: npx hardhat node')
    }
    
    devModeEnabled = true
    currentDevAccount = DEV_ACCOUNTS[accountIndex]
    
    // Create provider and signer with retry logic
    let retries = 3
    let provider = null
    
    while (retries > 0) {
      try {
        provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
        // Test connection
        await provider.getBlockNumber()
        break
      } catch (error) {
        retries--
        if (retries === 0) {
          throw new Error('Cannot connect to Hardhat node. Make sure it is running on http://127.0.0.1:8545')
        }
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    devProvider = provider
    devSigner = new ethers.Wallet(currentDevAccount.privateKey, devProvider)
    
    // Verify account has balance
    const balance = await devProvider.getBalance(currentDevAccount.address)
    const balanceEth = parseFloat(ethers.formatEther(balance))
    
    if (balanceEth < 0.01) {
      console.warn('⚠️ Account has very low balance:', balanceEth, 'ETH')
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(DEV_MODE_KEY, 'true')
      localStorage.setItem(DEV_ACCOUNT_KEY, accountIndex.toString())
    } catch (e) {
      console.warn('Could not save dev mode to localStorage:', e)
    }
    
    console.log('✅ Dev Mode enabled!')
    console.log('📍 Account:', currentDevAccount.name)
    console.log('💰 Address:', currentDevAccount.address)
    console.log('💎 Balance:', ethers.formatEther(balance), 'ETH')
    
    return {
      success: true,
      account: currentDevAccount,
      balance: ethers.formatEther(balance)
    }
  } catch (error) {
    console.error('❌ Failed to enable dev mode:', error.message)
    // Reset state on error
    devModeEnabled = false
    currentDevAccount = null
    devProvider = null
    devSigner = null
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Disable dev mode
 */
export function disableDevMode() {
  devModeEnabled = false
  currentDevAccount = null
  devProvider = null
  devSigner = null
  localStorage.removeItem(DEV_MODE_KEY)
  localStorage.removeItem(DEV_ACCOUNT_KEY)
  console.log('🔒 Dev Mode disabled')
}

/**
 * Switch dev account
 */
export async function switchDevAccount(accountIndex) {
  if (!devModeEnabled) {
    throw new Error('Dev mode is not enabled')
  }
  return await enableDevMode(accountIndex)
}

/**
 * Get current dev account
 */
export function getDevAccount() {
  return currentDevAccount
}

/**
 * Get dev provider (for read operations)
 */
export function getDevProvider() {
  if (!devModeEnabled) {
    throw new Error('Dev mode is not enabled')
  }
  
  if (!devProvider) {
    // Create on demand if needed
    try {
      devProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
    } catch (error) {
      throw new Error('Cannot create provider. Is Hardhat running?')
    }
  }
  return devProvider
}

/**
 * Get dev signer (for write operations)
 */
export function getDevSigner() {
  if (!devModeEnabled || !devSigner) {
    throw new Error('Dev mode not enabled or no signer available')
  }
  return devSigner
}

/**
 * Get provider - auto-selects dev or browser provider
 */
export async function getSmartProvider() {
  if (devModeEnabled) {
    return getDevProvider()
  }
  
  // Fallback to browser provider
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  
  throw new Error('No provider available')
}

/**
 * Get signer - auto-selects dev or browser signer
 */
export async function getSmartSigner() {
  if (devModeEnabled) {
    return getDevSigner()
  }
  
  // Fallback to browser signer
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum)
    return await provider.getSigner()
  }
  
  throw new Error('No signer available')
}

/**
 * Test if Hardhat node is running
 */
export async function testHardhatConnection() {
  try {
    const response = await fetch('http://127.0.0.1:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    })
    const data = await response.json()
    return !!data.result
  } catch {
    return false
  }
}

/**
 * Get balance for current dev account
 */
export async function getDevBalance() {
  if (!devModeEnabled || !currentDevAccount) {
    return null
  }
  
  try {
    const provider = getDevProvider()
    const balance = await provider.getBalance(currentDevAccount.address)
    return ethers.formatEther(balance)
  } catch {
    return null
  }
}

// Export everything
export default {
  DEV_ACCOUNTS,
  initDevMode,
  isDevMode,
  enableDevMode,
  disableDevMode,
  switchDevAccount,
  getDevAccount,
  getDevProvider,
  getDevSigner,
  getSmartProvider,
  getSmartSigner,
  testHardhatConnection,
  getDevBalance
}
