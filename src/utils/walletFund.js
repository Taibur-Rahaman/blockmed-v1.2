import { ethers } from 'ethers'

// ============================================
// Easy Wallet Funding - Auto-fund MetaMask/Frame from Hardhat
// ============================================

// Hardhat's first account (has 10,000 ETH) - used for funding
const FUNDER_ACCOUNT = {
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
}

/**
 * Fund a wallet address with ETH from Hardhat account
 * @param {string} recipientAddress - Address to fund
 * @param {string} amount - Amount in ETH (default: 10 ETH)
 * @returns {Promise<{success: boolean, txHash?: string, error?: string}>}
 */
export async function fundWallet(recipientAddress, amount = '10.0') {
  try {
    // Check if Hardhat is running
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
    
    // Test connection
    try {
      await provider.getBlockNumber()
    } catch (error) {
      return {
        success: false,
        error: 'Hardhat node not running. Start it with: npx hardhat node'
      }
    }

    // Create signer from Hardhat account
    const funder = new ethers.Wallet(FUNDER_ACCOUNT.privateKey, provider)
    
    // Check funder balance
    const funderBalance = await provider.getBalance(FUNDER_ACCOUNT.address)
    const funderBalanceEth = parseFloat(ethers.formatEther(funderBalance))
    
    if (funderBalanceEth < parseFloat(amount)) {
      return {
        success: false,
        error: `Insufficient funds in funder account. Available: ${funderBalanceEth.toFixed(2)} ETH`
      }
    }

    // Check recipient balance
    const recipientBalance = await provider.getBalance(recipientAddress)
    const recipientBalanceEth = parseFloat(ethers.formatEther(recipientBalance))
    
    // Send transaction
    const amountWei = ethers.parseEther(amount)
    const tx = await funder.sendTransaction({
      to: recipientAddress,
      value: amountWei
    })
    
    console.log(`⏳ Funding transaction sent: ${tx.hash}`)
    
    // Wait for confirmation
    const receipt = await tx.wait()
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`)
    
    // Get new balance
    const newBalance = await provider.getBalance(recipientAddress)
    const newBalanceEth = parseFloat(ethers.formatEther(newBalance))
    
    return {
      success: true,
      txHash: tx.hash,
      oldBalance: recipientBalanceEth.toFixed(4),
      newBalance: newBalanceEth.toFixed(4),
      amount: amount
    }
  } catch (error) {
    console.error('❌ Funding error:', error)
    return {
      success: false,
      error: error.reason || error.message || 'Unknown error'
    }
  }
}

/**
 * Get balance of an address
 */
export async function getWalletBalance(address) {
  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
    const balance = await provider.getBalance(address)
    return parseFloat(ethers.formatEther(balance))
  } catch {
    return 0
  }
}

/**
 * Check if Hardhat is running and funder has enough balance
 */
export async function canFundWallet() {
  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
    await provider.getBlockNumber()
    
    const balance = await provider.getBalance(FUNDER_ACCOUNT.address)
    const balanceEth = parseFloat(ethers.formatEther(balance))
    
    return {
      available: true,
      funderBalance: balanceEth,
      canFund: balanceEth >= 1.0 // At least 1 ETH available
    }
  } catch {
    return {
      available: false,
      funderBalance: 0,
      canFund: false
    }
  }
}

export default {
  fundWallet,
  getWalletBalance,
  canFundWallet
}
