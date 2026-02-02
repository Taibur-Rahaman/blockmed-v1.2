/**
 * useBlockchain – single source of truth for blockchain connection.
 * Use this hook in any page that needs to read/write the contract.
 * Works with both Dev Mode (Hardhat) and Wallet (MetaMask).
 */
import { useState, useEffect, useCallback } from 'react'
import {
  getProvider,
  getReadContract,
  getWriteContract,
  getCurrentAccount,
  isBlockchainReady,
  getContractAddress,
  getBalance
} from '../utils/contractHelper'
import { isDevMode } from '../utils/devMode'
import { DEFAULT_NETWORK, NETWORKS } from '../utils/config'

export function useBlockchain() {
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [networkName, setNetworkName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkConnection = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await isBlockchainReady()
      if (!result.ready) {
        setConnected(false)
        setAccount(null)
        setError(result.error)
        setLoading(false)
        return
      }
      setAccount(result.account)
      setConnected(true)
      setError(null)

      const provider = await getProvider()
      const network = await provider.getNetwork()
      const id = network?.chainId?.toString()
      setChainId(id)
      const hexId = id ? '0x' + BigInt(id).toString(16) : null
      const name = isDevMode()
        ? 'Hardhat Local'
        : (NETWORKS[Object.keys(NETWORKS).find(k => NETWORKS[k].chainId === hexId)]?.chainName) || `Chain ${id}`
      setNetworkName(name)
    } catch (err) {
      setConnected(false)
      setAccount(null)
      setError(err?.message || 'Connection failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  const contractRead = useCallback(async () => {
    return getReadContract()
  }, [])

  const contractWrite = useCallback(async () => {
    return getWriteContract()
  }, [])

  const getAccountBalance = useCallback(async (addr) => {
    try {
      return await getBalance(addr || account)
    } catch {
      return '0'
    }
  }, [account])

  return {
    connected,
    account,
    chainId,
    networkName,
    isDevMode: isDevMode(),
    contractAddress: getContractAddress(),
    error,
    loading,
    refresh: checkConnection,
    getReadContract: contractRead,
    getWriteContract: contractWrite,
    getBalance: getAccountBalance
  }
}

export default useBlockchain
