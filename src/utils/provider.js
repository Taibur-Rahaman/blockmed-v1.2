import { ethers } from 'ethers'

// ============================================
// Robust Provider with Connection Handling
// ============================================

// Cache for common RPC responses
const cache = new Map()
const CACHE_TTL = {
  blockNumber: 15000, // 15s
  code: 5000,
  balance: 5000
}

function now() { return Date.now() }

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (now() - entry.ts > entry.ttl) { cache.delete(key); return null }
  return entry.value
}

function setCached(key, value, ttl) {
  cache.set(key, { value, ts: now(), ttl })
}

// Track in-flight promises to coalesce duplicate requests
const inflight = new Map()

function getInFlight(key) {
  return inflight.get(key) || null
}

function setInFlight(key, promise) {
  inflight.set(key, promise)
  promise.finally(() => inflight.delete(key))
}

// Connection state tracking
let connectionErrorCount = 0
let lastConnectionError = 0
const CONNECTION_RESET_INTERVAL = 30000 // Reset error count after 30s of no errors

/**
 * Check if the RPC connection is likely available
 */
export function isRpcHealthy() {
  if (now() - lastConnectionError > CONNECTION_RESET_INTERVAL) {
    connectionErrorCount = 0
  }
  return connectionErrorCount < 3
}

/**
 * Reset the provider (useful after Hardhat restart)
 */
export function resetProvider() {
  if (window.__sharedBrowserProvider) {
    delete window.__sharedBrowserProvider
  }
  cache.clear()
  connectionErrorCount = 0
  lastConnectionError = 0
  console.log('🔄 Provider reset - ready for fresh connection')
}

/**
 * Get or create a shared BrowserProvider
 */
export function getProvider() {
  if (typeof window === 'undefined' || !window.ethereum) {
    console.warn('⚠️ MetaMask not detected')
    return null
  }
  
  if (!window.__sharedBrowserProvider) {
    window.__sharedBrowserProvider = new ethers.BrowserProvider(window.ethereum)
  }
  return window.__sharedBrowserProvider
}

/**
 * Wrapper for RPC calls with error handling
 */
async function safeRpcCall(operation, fallback = null) {
  try {
    const result = await operation()
    // Success - reset error tracking
    if (connectionErrorCount > 0) {
      connectionErrorCount = Math.max(0, connectionErrorCount - 1)
    }
    return result
  } catch (error) {
    connectionErrorCount++
    lastConnectionError = now()
    
    // Check for specific RPC errors
    const errorMsg = error?.message || String(error)
    
    if (errorMsg.includes('could not coalesce') || 
        errorMsg.includes('too many errors') ||
        errorMsg.includes('-32002')) {
      console.error('🔴 RPC Connection Error - Is Hardhat node running?')
      console.error('   Run: npx hardhat node')
      console.error('   Then refresh this page')
    } else if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('Failed to fetch')) {
      console.error('🔴 Cannot reach RPC endpoint at http://127.0.0.1:8545')
      console.error('   Make sure Hardhat node is running: npx hardhat node')
    }
    
    return fallback
  }
}

/**
 * Get current block number with caching
 */
export async function getBlockNumber() {
  const key = 'blockNumber'
  const cached = getCached(key)
  if (cached !== null) return cached
  
  const inF = getInFlight(key)
  if (inF) return await inF
  
  const p = getProvider()
  if (!p) return null
  
  const promise = safeRpcCall(async () => {
    const blockNum = await p.getBlockNumber()
    setCached(key, blockNum, CACHE_TTL.blockNumber)
    return blockNum
  }, null)
  
  setInFlight(key, promise)
  return await promise
}

/**
 * Get contract code at address with caching
 */
export async function getCode(address) {
  const key = `code:${address}`
  const cached = getCached(key)
  if (cached !== null) return cached
  
  const inF = getInFlight(key)
  if (inF) return await inF
  
  const p = getProvider()
  if (!p) return '0x'
  
  const promise = safeRpcCall(async () => {
    const code = await p.getCode(address)
    setCached(key, code, CACHE_TTL.code)
    return code
  }, '0x')
  
  setInFlight(key, promise)
  return await promise
}

/**
 * Get balance of address with caching
 */
export async function getBalance(address) {
  const key = `balance:${address}`
  const cached = getCached(key)
  if (cached !== null) return cached
  
  const inF = getInFlight(key)
  if (inF) return await inF
  
  const p = getProvider()
  if (!p) return null
  
  const promise = safeRpcCall(async () => {
    const balance = await p.getBalance(address)
    setCached(key, balance, CACHE_TTL.balance)
    return balance
  }, null)
  
  setInFlight(key, promise)
  return await promise
}

/**
 * Test if Hardhat node is reachable
 */
export async function testRpcConnection() {
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
    if (data.result) {
      console.log('✅ Hardhat node is running - Block:', parseInt(data.result, 16))
      return true
    }
    return false
  } catch (error) {
    console.error('❌ Cannot reach Hardhat node at http://127.0.0.1:8545')
    return false
  }
}

export default { 
  getProvider, 
  getBlockNumber, 
  getCode, 
  getBalance, 
  resetProvider,
  isRpcHealthy,
  testRpcConnection
}
