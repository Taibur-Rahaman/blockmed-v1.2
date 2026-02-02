/**
 * BlockchainInfo – shows on-chain proof (tx hash, block, ID).
 * Use wherever we read/write blockchain so users see how blockchain is used.
 */
import React from 'react'
import { motion } from 'framer-motion'
import { FiCopy, FiCheckCircle, FiHash, FiLayers, FiLoader } from 'react-icons/fi'
import { copyToClipboard } from '../utils/helpers'
import toast from 'react-hot-toast'

const copy = (text, label) => {
  copyToClipboard(text)
  toast.success(`${label} copied`)
}

export function BlockchainInfo({
  title = 'On-chain',
  txHash,
  blockNumber,
  prescriptionId,
  contractAddress,
  compact = false,
  className = '',
}) {
  const hasData = txHash || blockNumber != null || prescriptionId || contractAddress

  if (!hasData) return null

  return (
    <div
      className={`rounded-xl border border-primary-500/30 bg-primary-500/5 p-4 ${className}`}
      role="region"
      aria-label="Blockchain verification"
    >
      <div className="flex items-center gap-2 mb-3">
        <FiLayers className="text-primary-400" size={18} />
        <span className="font-medium text-white">{title}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300">
          Blockchain
        </span>
      </div>
      <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {prescriptionId != null && (
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-green-400 shrink-0" size={14} />
            <span className="text-gray-400 text-sm">ID:</span>
            <span className="text-white font-mono text-sm">#{prescriptionId}</span>
          </div>
        )}
        {txHash && (
          <div className="flex items-center gap-2 min-w-0">
            <FiHash className="text-primary-400 shrink-0" size={14} />
            <span className="text-gray-400 text-sm shrink-0">Tx:</span>
            <code className="text-primary-300 font-mono text-xs truncate flex-1" title={txHash}>
              {txHash.slice(0, 10)}…{txHash.slice(-8)}
            </code>
            <button
              type="button"
              onClick={() => copy(txHash, 'Transaction hash')}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white shrink-0"
              aria-label="Copy transaction hash"
            >
              <FiCopy size={14} />
            </button>
          </div>
        )}
        {blockNumber != null && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Block:</span>
            <span className="text-white font-mono text-sm">{blockNumber}</span>
          </div>
        )}
        {contractAddress && !compact && (
          <div className="flex items-center gap-2 min-w-0 sm:col-span-2">
            <span className="text-gray-400 text-sm shrink-0">Contract:</span>
            <code className="text-gray-500 font-mono text-xs truncate" title={contractAddress}>
              {contractAddress.slice(0, 10)}…{contractAddress.slice(-8)}
            </code>
            <button
              type="button"
              onClick={() => copy(contractAddress, 'Contract address')}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white shrink-0"
            >
              <FiCopy size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Short badge: "Data from blockchain" or "Saved on-chain" */
export function BlockchainBadge({ label = 'From blockchain', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary-500/15 border border-primary-500/30 text-primary-300 text-xs font-medium ${className}`}
    >
      <FiLayers size={12} />
      {label}
    </span>
  )
}

/** Loading steps during blockchain verification - builds trust */
export function BlockchainLoadingSteps({ steps = [], currentStep = 0, message, language = 'en' }) {
  const defaultSteps = language === 'bn'
    ? ['ব্লকচেইনে সংযোগ করা হচ্ছে...', 'ব্যাচ রেজিস্ট্রি অনুসন্ধান করা হচ্ছে...', 'প্রামাণিকতা যাচাই করা হচ্ছে...']
    : ['Connecting to blockchain...', 'Querying batch registry...', 'Verifying authenticity...']
  const s = steps.length ? steps : defaultSteps

  return (
    <div className="rounded-xl border border-primary-500/30 bg-primary-500/5 p-5 animate-pulse-slow">
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-primary-400"
        >
          <FiLoader size={24} />
        </motion.div>
        <div>
          <p className="font-medium text-white">
            {message || (language === 'bn' ? 'ব্লকচেইনে যাচাই করা হচ্ছে' : 'Verifying on blockchain')}
          </p>
          <p className="text-xs text-gray-400">
            {language === 'bn' ? 'তামাদি-প্রমাণ নিশ্চিতকরণ' : 'Tamper-proof verification'}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {s.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              i < currentStep ? 'bg-green-500/20 text-green-400' :
              i === currentStep ? 'bg-primary-500/30 text-primary-400 animate-pulse' :
              'bg-white/5 text-gray-500'
            }`}>
              {i < currentStep ? '✓' : i + 1}
            </span>
            <span className={`text-sm ${i <= currentStep ? 'text-white' : 'text-gray-500'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Activity badge when blockchain is in use */
export function BlockchainActivityBadge({ loading, label, language = 'en' }) {
  if (!loading) return null
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/15 border border-primary-500/40 text-primary-300 text-xs font-medium"
    >
      <motion.span
        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <FiLayers size={14} />
      </motion.span>
      {label || (language === 'bn' ? 'ব্লকচেইনে সিঙ্ক হচ্ছে...' : 'Syncing with blockchain...')}
    </motion.span>
  )
}

/** Trust section - how verification works (shown after success) */
export function BlockchainVerificationProof({ source = 'blockchain', blockNumber, language = 'en' }) {
  const copy = source === 'blockchain'
    ? (language === 'bn'
      ? 'এই তথ্য ব্লকচেইনে যাচাই করা হয়েছে। এটি পরিবর্তন করা যায় না।'
      : 'This data was verified on the blockchain. It cannot be altered.')
    : (language === 'bn'
      ? 'ডেমো ডেটা — ব্লকচেইনে যাচাই করতে সংযুক্ত করুন।'
      : 'Demo data — connect blockchain to verify on-chain.')

  return (
    <div className="rounded-lg border border-primary-500/20 bg-primary-500/5 p-3">
      <div className="flex items-center gap-2">
        <FiCheckCircle className="text-primary-400 shrink-0" size={16} />
        <div>
          <p className="text-sm font-medium text-white">
            {source === 'blockchain'
              ? (language === 'bn' ? 'ব্লকচেইনে যাচাইকৃত' : 'Verified on blockchain')
              : (language === 'bn' ? 'ডেমো মোড' : 'Demo mode')}
          </p>
          <p className="text-xs text-gray-400">{copy}</p>
          {source === 'blockchain' && blockNumber != null && (
            <p className="text-xs text-primary-400 mt-1 font-mono">Block #{blockNumber}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlockchainInfo
