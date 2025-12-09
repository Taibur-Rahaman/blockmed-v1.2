import { ethers } from 'ethers'
import { CONTRACT_ADDRESS } from './config'
import contractABI from './contractABI.json'
import { isDevMode, getDevProvider, getDevSigner, testHardhatConnection } from './devMode'

// ============================================
// Contract Helper - Auto Dev/Wallet Mode
// ============================================
// This helper automatically uses the right provider
// based on whether Dev Mode is active or not.

let cachedProvider = null
let cachedContract = null

/**
 * Get the appropriate provider (Dev Mode or Wallet)
 */
export async function getProvider() {
  // Dev Mode - use direct Hardhat connection
  if (isDevMode()) {
    console.log('📦 Using Dev Mode provider')
    return getDevProvider()
  }
  
  // Wallet Mode - use browser wallet
  if (window.ethereum) {
    console.log('🦊 Using wallet provider')
    if (!window.__sharedBrowserProvider) {
      window.__sharedBrowserProvider = new ethers.BrowserProvider(window.ethereum)
    }
    return window.__sharedBrowserProvider
  }
  
  // Fallback - direct RPC (read-only)
  console.log('📡 Using fallback RPC provider')
  return new ethers.JsonRpcProvider('http://127.0.0.1:8545')
}

/**
 * Get the appropriate signer (Dev Mode or Wallet)
 */
export async function getSigner() {
  // Dev Mode - use Hardhat account signer
  if (isDevMode()) {
    console.log('📦 Using Dev Mode signer')
    try {
      return getDevSigner()
    } catch (error) {
      throw new Error(`Dev Mode signer error: ${error.message}. Make sure Hardhat is running.`)
    }
  }
  
  // Wallet Mode - use browser wallet signer
  if (window.ethereum) {
    console.log('🦊 Using wallet signer')
    try {
      const provider = await getProvider()
      const signer = await provider.getSigner()
      // Verify signer has an address
      const address = await signer.getAddress()
      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet.')
      }
      return signer
    } catch (error) {
      if (error.message?.includes('Not connected') || error.message?.includes('could not coalesce')) {
        throw new Error('Wallet not connected. Please connect your wallet or enable Dev Mode.')
      }
      throw error
    }
  }
  
  throw new Error('No signer available. Enable Dev Mode or connect a wallet.')
}

/**
 * Get contract instance for READ operations
 */
export async function getReadContract() {
  const provider = await getProvider()
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)
}

/**
 * Get contract instance for WRITE operations
 */
export async function getWriteContract() {
  const signer = await getSigner()
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)
}

/**
 * Get current account address
 */
export async function getCurrentAccount() {
  // Dev Mode - NEVER call window.ethereum when Dev Mode is active
  if (isDevMode()) {
    try {
      const { getDevAccount } = await import('./devMode')
      const devAcc = getDevAccount()
      if (devAcc?.address) {
        return devAcc.address
      }
    } catch (error) {
      console.error('Error getting dev account:', error)
    }
    return null
  }
  
  // Wallet Mode - only call window.ethereum if it exists and Dev Mode is NOT active
  if (window.ethereum && !isDevMode()) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      return accounts[0] || null
    } catch (error) {
      console.error('Error getting accounts:', error)
      // If eth_accounts fails, try requesting accounts (but only if not in Dev Mode)
      if (!isDevMode()) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          return accounts[0] || null
        } catch (requestError) {
          console.error('Error requesting accounts:', requestError)
          return null
        }
      }
      return null
    }
  }
  
  return null
}

/**
 * Check if blockchain is ready (Hardhat running + account available)
 */
export async function isBlockchainReady() {
  try {
    // Check Hardhat connection
    const hardhatOk = await testHardhatConnection()
    if (!hardhatOk) {
      return { ready: false, error: 'Hardhat not running' }
    }
    
    // Check account
    const account = await getCurrentAccount()
    if (!account) {
      return { ready: false, error: 'No account connected' }
    }
    
    // Check contract exists
    const provider = await getProvider()
    const code = await provider.getCode(CONTRACT_ADDRESS)
    if (code === '0x' || code === '0x0' || !code) {
      return { 
        ready: false, 
        error: `Contract not deployed at ${CONTRACT_ADDRESS}. Run: npm run deploy:check` 
      }
    }
    
    return { ready: true, account }
  } catch (error) {
    return { ready: false, error: error.message }
  }
}

/**
 * Get account balance
 */
export async function getBalance(address) {
  try {
    const provider = await getProvider()
    const balance = await provider.getBalance(address)
    return ethers.formatEther(balance)
  } catch {
    return '0'
  }
}

/**
 * Execute contract method with proper error handling
 */
export async function executeContract(methodName, args = [], options = {}) {
  const { isWrite = false, value = 0 } = options
  
  try {
    const contract = isWrite 
      ? await getWriteContract() 
      : await getReadContract()
    
    if (!contract[methodName]) {
      throw new Error(`Method ${methodName} not found in contract`)
    }
    
    if (isWrite) {
      const tx = await contract[methodName](...args, { value })
      console.log(`⏳ Transaction sent: ${tx.hash}`)
      const receipt = await tx.wait()
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`)
      return { success: true, tx, receipt }
    } else {
      const result = await contract[methodName](...args)
      return { success: true, data: result }
    }
  } catch (error) {
    console.error(`❌ Contract error (${methodName}):`, error)
    return { 
      success: false, 
      error: error.reason || error.message || 'Unknown error' 
    }
  }
}

// Export all
export default {
  getProvider,
  getSigner,
  getReadContract,
  getWriteContract,
  getCurrentAccount,
  isBlockchainReady,
  getBalance,
  executeContract
}
