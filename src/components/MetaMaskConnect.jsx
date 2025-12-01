import React, { useState, useEffect } from 'react'

const MetaMaskConnect = ({ account, setAccount }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [currentNetwork, setCurrentNetwork] = useState('')

  // Check if MetaMask is already connected on component mount
  useEffect(() => {
    checkIfWalletIsConnected()
    switchToLocalNetwork()
  }, [])

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        return
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })

      if (accounts.length > 0) {
        setAccount(accounts[0])
        console.log('Connected wallet:', accounts[0])
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }

  const switchToLocalNetwork = async () => {
    try {
      if (!window.ethereum) return

      // Check current chain
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })

      // Hardhat local network chainId is 31337 (0x7a69 in hex)
      if (chainId !== '0x7a69') {
        try {
          // Try to switch to local network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7a69' }],
          })
        } catch (switchError) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x7a69',
                  chainName: 'Hardhat Local',
                  rpcUrls: ['http://127.0.0.1:8545'],
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  blockExplorerUrls: null,
                }],
              })
            } catch (addError) {
              console.error('Failed to add local network:', addError)
              alert('Please manually add the Hardhat Local network to MetaMask:\n\nNetwork Name: Hardhat Local\nRPC URL: http://127.0.0.1:8545\nChain ID: 31337\nCurrency: ETH')
            }
          } else {
            console.error('Failed to switch network:', switchError)
            alert('Please switch MetaMask to the Hardhat Local network (Chain ID: 31337)')
          }
        }
      }
    } catch (error) {
      console.error('Error switching to local network:', error)
    }
  }

  const connectWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        alert('Please install MetaMask!')
        window.open('https://metamask.io/download/', '_blank')
        return
      }

      setIsConnecting(true)

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length > 0) {
        setAccount(accounts[0])
        console.log('Connected wallet:', accounts[0])
        // Switch to local network after connecting
        await switchToLocalNetwork()
        alert(`✅ Connected successfully!\n\nAddress: ${accounts[0]}\n\n🔄 Switched to Hardhat Local network (free transactions)`)
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error)
      
      if (error.code === 4001) {
        alert('Connection request rejected. Please try again.')
      } else {
        alert('Failed to connect to MetaMask. Please try again.')
      }
    } finally {
      setIsConnecting(false)
    }
  }

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          console.log('Account changed to:', accounts[0])
        } else {
          setAccount(null)
          console.log('Wallet disconnected')
        }
      }

      const handleChainChanged = (chainId) => {
        console.log('Network changed to:', chainId)
        if (chainId === '0x7a69') {
          setCurrentNetwork('Hardhat Local (Free)')
        } else if (chainId === '0x1') {
          setCurrentNetwork('Ethereum Mainnet (Paid)')
        } else {
          setCurrentNetwork('Unknown Network')
        }
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [setAccount])

  if (account) {
    return (
      <div className="text-center">
        <button className="btn-success" disabled>
          Connected ✅
        </button>
        <p style={{ marginTop: '10px', color: '#059669', fontWeight: '600' }}>
          {account.substring(0, 6)}...{account.substring(account.length - 4)}
        </p>
        <p style={{ marginTop: '5px', fontSize: '14px', color: currentNetwork.includes('Free') ? '#059669' : '#dc2626' }}>
          🌐 {currentNetwork}
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <button 
        className="btn-primary" 
        onClick={connectWallet}
        disabled={isConnecting}
      >
        {isConnecting ? 'Connecting...' : '🦊 Connect MetaMask'}
      </button>
      {!window.ethereum && (
        <p style={{ marginTop: '10px', color: '#ef4444', fontSize: '14px' }}>
          MetaMask not detected. Please install MetaMask extension.
        </p>
      )}
    </div>
  )
}

export default MetaMaskConnect
