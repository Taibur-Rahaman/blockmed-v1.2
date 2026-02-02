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
 * Parse contract error for user-friendly message
 */
function parseContractError(error) {
  if (!error) return null
  const msg = String(error.message || error.reason || '')
  // Solidity revert with reason
  if (error.reason) return error.reason
  // Common ethers/contract errors
  if (msg.includes('call revert exception')) {
    const reason = error.data?.error?.message || error.error?.reason
    if (reason) return reason
  }
  // User-friendly mapping for common errors
  if (msg.includes('missing role') || msg.includes('AccessControl')) return 'Permission denied. Check your role.'
  if (msg.includes('already registered')) return 'Already registered.'
  if (msg.includes('not found') || msg.includes('does not exist')) return 'Record not found.'
  return null
}

/**
 * Get the appropriate signer (Dev Mode or Wallet)
 */
export async function getSigner() {
  // Dev Mode - use Hardhat account signer
  if (isDevMode()) {
    console.log('📦 Using Dev Mode signer')
    try {
      const signer = getDevSigner()
      if (!signer) throw new Error('No signer')
      return signer
    } catch (error) {
      const { disableDevMode } = await import('./devMode')
      disableDevMode()
      throw new Error('Hardhat disconnected. Run "npx hardhat node" in a terminal, then enable Dev Mode again in Settings.')
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
 * Check if blockchain is ready (works for both Dev Mode and Wallet Mode).
 * Dev Mode: requires Hardhat running.
 * Wallet Mode: requires wallet connected and contract deployed on current chain.
 */
export async function isBlockchainReady() {
  try {
    // Dev Mode: require Hardhat
    if (isDevMode()) {
      const hardhatOk = await testHardhatConnection()
      if (!hardhatOk) {
        return { ready: false, error: 'Hardhat not running. Run: npm run blockchain' }
      }
    } else if (!window?.ethereum) {
      return { ready: false, error: 'No wallet. Connect MetaMask or enable Dev Mode.' }
    }

    // Account (Dev or Wallet)
    const account = await getCurrentAccount()
    if (!account) {
      return { ready: false, error: 'No account. Connect wallet or enable Dev Mode.' }
    }

    // Contract must exist on current chain
    const provider = await getProvider()
    const code = await provider.getCode(CONTRACT_ADDRESS)
    if (code === '0x' || code === '0x0' || !code) {
      return {
        ready: false,
        error: `Contract not deployed at ${CONTRACT_ADDRESS.slice(0, 10)}... Run: npm run deploy`
      }
    }

    return { ready: true, account }
  } catch (error) {
    return { ready: false, error: error?.message || 'Connection failed' }
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
    const friendly = parseContractError(error)
    return { 
      success: false, 
      error: friendly || error.reason || error.shortMessage || error.message || 'Unknown error' 
    }
  }
}

/**
 * Get user-friendly error message for contract/wallet errors
 */
export function getFriendlyErrorMessage(error) {
  if (!error) return 'An error occurred'
  const msg = String(error.message || '')
  if (msg.includes('Hardhat disconnected') || msg.includes('Hardhat node')) {
    return 'Demo mode. Terminal 1: npm run blockchain · Terminal 2: npm run deploy · Settings → Blockchain Setup → Enable Dev Mode'
  }
  if (msg.includes('Wallet not connected') || msg.includes('No signer')) {
    return 'Using demo mode. Connect your wallet or enable Dev Mode in Settings for on-chain actions.'
  }
  if (msg.includes('Contract not deployed') || msg.includes('not deployed')) {
    return 'Contract not deployed. Run "npm run deploy" (with Hardhat node running).'
  }
  if (msg.includes('user rejected') || msg.includes('rejected')) {
    return 'Transaction was cancelled.'
  }
  if (msg.includes('Only verified pharmacist can perform this action')) {
    return 'Old contract in use. Run: npm run deploy (with Hardhat node running), then restart dev server and refresh. Log in as Admin (Account #0) to dispense.'
  }
  const contractMsg = parseContractError(error)
  if (contractMsg) return contractMsg
  return error.reason || error.shortMessage || msg || 'Operation failed'
}

/** Contract address (single source of truth) */
export function getContractAddress() {
  return CONTRACT_ADDRESS
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
  executeContract,
  getContractAddress,
  getFriendlyErrorMessage,
}
