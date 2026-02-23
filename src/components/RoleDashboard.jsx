/**
 * RoleDashboard - Visual Role-Based Access Control Dashboard
 * 
 * Displays all system roles with their permissions in a visual way:
 * - Role cards with icons and descriptions
 * - Permission matrix showing what each role can do
 * - Current user role highlighting
 * - Interactive permission tooltips
 * 
 * Great for teaching RBAC and blockchain permissions!
 */
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  FiShield, FiUsers, FiUser, FiUserCheck, FiUserX,
  FiPackage, FiFileText, FiAlertTriangle, FiCheckCircle,
  FiActivity, FiSettings, FiInfo, FiChevronDown, FiChevronUp,
  FiLock, FiUnlock, FiEye, FiEdit, FiTrash2
} from 'react-icons/fi'
import { useStore } from '../store/useStore'

// Role definitions with metadata
const ROLES = {
  ADMIN: {
    id: 1,
    name: 'Admin',
    icon: FiShield,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    description: 'Full system access',
    permissions: [
      { name: 'user:manage', label: 'Manage Users', icon: FiUsers, description: 'Create, verify, deactivate users' },
      { name: 'prescription:create', label: 'Create Prescriptions', icon: FiFileText, description: 'Write new prescriptions' },
      { name: 'prescription:dispense', label: 'Dispense Prescriptions', icon: FiCheckCircle, description: 'Mark prescriptions as dispensed' },
      { name: 'batch:create', label: 'Create Batches', icon: FiPackage, description: 'Register medicine batches' },
      { name: 'batch:dispense', label: 'Dispense Batches', icon: FiPackage, description: 'Sell medicines from batches' },
      { name: 'batch:recall', label: 'Recall Batches', icon: FiAlertTriangle, description: 'Recall defective medicines' },
      { name: 'batch:flag', label: 'Flag Batches', icon: FiAlertTriangle, description: 'Mark suspicious batches' },
      { name: 'analytics:view', label: 'View Analytics', icon: FiActivity, description: 'Access system statistics' },
      { name: 'settings:manage', label: 'Manage Settings', icon: FiSettings, description: 'Configure system settings' },
    ],
    advancedFeatures: [
      {
        key: 'role-management-console',
        title: 'Role Management Console',
        description: 'Grant or revoke on-chain roles (doctor, pharmacist, regulator) with full audit trail and approval workflow.'
      },
      {
        key: 'batch-recall-scheduler',
        title: 'Batch Recall Scheduler',
        description: 'Schedule future batch recalls or expiries on-chain using timelocked transactions.'
      },
      {
        key: 'compliance-audit-dashboard',
        title: 'Compliance Audit Dashboard',
        description: 'Generate on-chain compliance reports for prescription volume, recalls, and role changes.'
      },
      {
        key: 'blacklist-whitelist-management',
        title: 'Blacklist/Whitelist Management',
        description: 'Maintain on-chain lists of approved or blocked users and manufacturers.'
      }
    ]
  },
  DOCTOR: {
    id: 2,
    name: 'Doctor',
    icon: FiUserCheck,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500',
    description: 'Prescribe medicines',
    permissions: [
      { name: 'prescription:create', label: 'Create Prescriptions', icon: FiFileText, description: 'Write new prescriptions' },
      { name: 'prescription:update', label: 'Update Prescriptions', icon: FiEdit, description: 'Edit own prescriptions' },
      { name: 'prescription:revoke', label: 'Revoke Prescriptions', icon: FiTrash2, description: 'Cancel own prescriptions' },
      { name: 'patient:view', label: 'View Patients', icon: FiEye, description: 'Access patient records' },
    ],
    advancedFeatures: [
      {
        key: 'onchain-prescription-templates',
        title: 'On-chain Prescription Templates',
        description: 'Save and reuse versioned prescription templates on-chain with full audit trail.'
      },
      {
        key: 'doctor-reputation-badge',
        title: 'Doctor Reputation Badge',
        description: 'Earn on-chain badges for safe prescribing patterns, low recall rates, and peer endorsements.'
      },
      {
        key: 'prescription-audit-log',
        title: 'Prescription Audit Log',
        description: 'Review immutable on-chain logs of all prescriptions, edits, and recalls linked to your address.'
      },
      {
        key: 'doctor-license-nft',
        title: 'Doctor License NFT',
        description: 'Hold a non-transferable on-chain license credential that can be verified or revoked by the Super Admin.'
      }
    ]
  },
  PHARMACIST: {
    id: 3,
    name: 'Pharmacist',
    icon: FiUser,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500',
    description: 'Dispense medicines',
    permissions: [
      { name: 'prescription:verify', label: 'Verify Prescriptions', icon: FiEye, description: 'View prescription details' },
      { name: 'prescription:dispense', label: 'Dispense Prescriptions', icon: FiCheckCircle, description: 'Mark prescriptions as dispensed' },
      { name: 'batch:verify', label: 'Verify Batches', icon: FiEye, description: 'Check medicine authenticity' },
      { name: 'batch:dispense', label: 'Dispense Batches', icon: FiPackage, description: 'Sell medicines from batches' },
      { name: 'batch:flag', label: 'Flag Batches', icon: FiAlertTriangle, description: 'Mark suspicious batches' },
    ],
    advancedFeatures: [
      {
        key: 'batch-authenticity-verifier',
        title: 'Batch Authenticity Verifier',
        description: 'Scan medicine QR codes and verify batch authenticity on-chain with full Merkle proof view.'
      },
      {
        key: 'dispensation-quota-tracker',
        title: 'Dispensation Quota Tracker',
        description: 'Track daily and weekly on-chain dispensation quotas to prevent over-dispensing.'
      },
      {
        key: 'recall-alert-center',
        title: 'Recall Alert Center',
        description: 'Receive real-time on-chain recall alerts with affected prescriptions and batch status.'
      },
      {
        key: 'pharmacist-performance-token',
        title: 'Pharmacist Performance Token',
        description: 'Earn on-chain tokens for accurate, verified dispensations that can be redeemed for rewards.'
      }
    ]
  },
  MANUFACTURER: {
    id: 4,
    name: 'Manufacturer',
    icon: FiPackage,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500',
    description: 'Create medicine batches',
    permissions: [
      { name: 'batch:create', label: 'Create Batches', icon: FiPackage, description: 'Register new medicine batches' },
      { name: 'batch:recall', label: 'Recall Batches', icon: FiAlertTriangle, description: 'Recall own batches' },
      { name: 'batch:view', label: 'View Batches', icon: FiEye, description: 'View own batch history' },
    ],
    advancedFeatures: [
      {
        key: 'batch-minting-tracking',
        title: 'Batch Minting & Tracking',
        description: 'Mint new medicine batches as on-chain tokens or NFTs and track their journey end-to-end.'
      },
      {
        key: 'supply-chain-event-logger',
        title: 'Supply Chain Event Logger',
        description: 'Log every manufacturer → distributor → pharmacy handoff as on-chain events.'
      },
      {
        key: 'recall-initiator',
        title: 'Recall Initiator',
        description: 'Initiate on-chain recalls directly from the manufacturer dashboard and notify all stakeholders.'
      },
      {
        key: 'quality-certificate-nft',
        title: 'Quality Certificate NFT',
        description: 'Issue verifiable on-chain certificates for high-quality batches, visible across the supply chain.'
      }
    ]
  },
  PATIENT: {
    id: 5,
    name: 'Patient',
    icon: FiUser,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500',
    description: 'View prescriptions',
    permissions: [
      { name: 'prescription:view', label: 'View Prescriptions', icon: FiEye, description: 'View own prescriptions' },
    ],
    advancedFeatures: [
      {
        key: 'personal-prescription-vault',
        title: 'Personal Prescription Vault',
        description: 'View all of your prescriptions stored on-chain with an immutable medical history timeline.'
      },
      {
        key: 'consent-management',
        title: 'Consent Management',
        description: 'Grant or revoke on-chain access to your prescription data for specific doctors and pharmacies.'
      },
      {
        key: 'prescription-authenticity-checker',
        title: 'Prescription Authenticity Checker',
        description: 'Independently verify prescription authenticity and status (active, expired, recalled) from the blockchain.'
      },
      {
        key: 'patient-feedback-nft',
        title: 'Patient Feedback NFT',
        description: 'Optionally leave privacy-aware on-chain feedback NFTs for doctors and pharmacists.'
      }
    ]
  },
  REGULATOR: {
    id: 6,
    name: 'Regulator',
    icon: FiShield,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    description: 'Oversight & compliance',
    permissions: [
      { name: 'user:view', label: 'View Users', icon: FiEye, description: 'View all registered users' },
      { name: 'prescription:view', label: 'View Prescriptions', icon: FiEye, description: 'View all prescriptions' },
      { name: 'batch:view', label: 'View Batches', icon: FiEye, description: 'View all medicine batches' },
      { name: 'batch:recall', label: 'Recall Batches', icon: FiAlertTriangle, description: 'Recall any batch' },
      { name: 'batch:flag', label: 'Flag Batches', icon: FiAlertTriangle, description: 'Flag suspicious batches' },
      { name: 'analytics:view', label: 'View Analytics', icon: FiActivity, description: 'Access system statistics' },
    ],
    advancedFeatures: [
      {
        key: 'regulator-role-management-console',
        title: 'Role Management Console',
        description: 'Approve or revoke roles on-chain for healthcare providers with a transparent audit log.'
      },
      {
        key: 'regulator-compliance-audit-dashboard',
        title: 'Compliance Audit Dashboard',
        description: 'Inspect on-chain statistics for prescribing behavior, recalls, and user lifecycle events.'
      },
      {
        key: 'regulator-blacklist-whitelist',
        title: 'Blacklist/Whitelist Management',
        description: 'Curate on-chain lists of trusted and blocked organizations and addresses.'
      }
    ]
  }
}

// Permission categories for matrix view
const PERMISSION_CATEGORIES = {
  'User Management': ['user:manage', 'user:view'],
  'Prescriptions': ['prescription:create', 'prescription:verify', 'prescription:dispense', 'prescription:update', 'prescription:revoke', 'prescription:view'],
  'Batches': ['batch:create', 'batch:verify', 'batch:dispense', 'batch:recall', 'batch:flag', 'batch:view'],
  'Analytics': ['analytics:view'],
  'Settings': ['settings:manage'],
}

const RoleDashboard = ({ showMatrix = true, compact = false }) => {
  const { t } = useTranslation()
  const { role: currentRole, user } = useStore()
  const [expandedRole, setExpandedRole] = useState(null)
  const [showOnlyMine, setShowOnlyMine] = useState(false)

  const roleEntries = Object.entries(ROLES)

  const hasPermission = (roleId, permissionName) => {
    const role = roleEntries.find(([_, r]) => r.id === roleId)?.[1]
    if (!role) return false
    return role.permissions.some(p => p.name === permissionName)
  }

  const currentRoleData = Object.values(ROLES).find(r => r.id === currentRole)

  const resolveAdvancedFeatures = (role) => {
    if (!role?.advancedFeatures || role.advancedFeatures.length === 0) return []
    return role.advancedFeatures
  }

  if (compact) {
    // Compact view - just show current role badge
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${currentRoleData?.bgColor || 'bg-gray-500/20'} border ${currentRoleData?.borderColor || 'border-gray-500'}`}>
        {currentRoleData && <currentRoleData.icon className={currentRoleData.color} size={14} />}
        <span className={`text-sm font-medium ${currentRoleData?.color || 'text-gray-400'}`}>
          {currentRoleData?.name || 'Unknown'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current User Role Banner */}
      {currentRoleData && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card p-6 border-2 ${currentRoleData.borderColor}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${currentRoleData.bgColor}`}>
                <currentRoleData.icon className={currentRoleData.color} size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Your Role: {currentRoleData.name}
                </h2>
                <p className="text-gray-400">{currentRoleData.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  You have {currentRoleData.permissions.length} permissions
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex flex-wrap gap-2">
                {currentRoleData.permissions.slice(0, 3).map((perm) => (
                  <span
                    key={perm.name}
                    className="px-2 py-1 rounded bg-white/10 text-xs text-gray-300"
                  >
                    {perm.label}
                  </span>
                ))}
                {currentRoleData.permissions.length > 3 && (
                  <span className="px-2 py-1 rounded bg-white/10 text-xs text-gray-300">
                    +{currentRoleData.permissions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {showOnlyMine ? 'Your Permissions' : 'All System Roles'}
        </h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyMine}
            onChange={(e) => setShowOnlyMine(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 text-primary-500 focus:ring-primary-500 bg-gray-700"
          />
          <span className="text-sm text-gray-400">Show only my role</span>
        </label>
      </div>

      {/* Role Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(showOnlyMine 
          ? roleEntries.filter(([_, r]) => r.id === currentRole)
          : roleEntries
        ).map(([key, role], index) => {
          const Icon = role.icon
          const isExpanded = expandedRole === role.id
          const isCurrentUser = role.id === currentRole

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card cursor-pointer transition-all hover:scale-[1.02] ${
                isCurrentUser ? `border-2 ${role.borderColor}` : ''
              }`}
              onClick={() => setExpandedRole(isExpanded ? null : role.id)}
            >
              {/* Card Header */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${role.bgColor}`}>
                      <Icon className={role.color} size={20} />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${role.color}`}>
                        {role.name}
                        {isCurrentUser && (
                          <span className="ml-2 px-2 py-0.5 rounded text-xs bg-primary-500/20 text-primary-400">
                            YOU
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-400">{role.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{role.permissions.length}</p>
                    <p className="text-xs text-gray-500">permissions</p>
                  </div>
                </div>
              </div>

              {/* Permissions Preview */}
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 4).map((perm) => (
                    <span
                      key={perm.name}
                      className={`px-2 py-0.5 rounded text-xs ${
                        isCurrentUser 
                          ? 'bg-white/20 text-white' 
                          : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      {perm.label}
                    </span>
                  ))}
                  {role.permissions.length > 4 && (
                    <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-gray-500">
                      +{role.permissions.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Permissions List */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="px-4 pb-4 border-t border-gray-700/50 pt-4"
                >
                  <h5 className="text-sm font-medium text-gray-300 mb-3">
                    All Permissions:
                  </h5>
                  <div className="space-y-2">
                    {role.permissions.map((perm) => {
                      const PermIcon = perm.icon
                      return (
                        <div
                          key={perm.name}
                          className="flex items-start gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          title={perm.description}
                        >
                          <PermIcon className={`${role.color} mt-0.5`} size={14} />
                          <div className="flex-1">
                            <p className="text-sm text-white">{perm.label}</p>
                            <p className="text-xs text-gray-500">{perm.description}</p>
                          </div>
                          <FiCheckCircle className="text-green-400" size={14} />
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Expand indicator */}
              <div className={`flex items-center justify-center py-2 text-gray-500 text-sm border-t border-gray-700/30 ${
                isExpanded ? '' : 'hover:text-white'
              }`}>
                {isExpanded ? (
                  <>Show less <FiChevronUp className="inline ml-1" /></>
                ) : (
                  <>View permissions <FiChevronDown className="inline ml-1" /></>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Permission Matrix */}
      {showMatrix && !showOnlyMine && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card overflow-hidden"
        >
          <div className="p-4 border-b border-gray-700/50">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FiShield className="text-primary-400" />
              Permission Matrix
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Visual overview of what each role can do in the system
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="p-3 text-left text-gray-400 font-medium">Permission</th>
                  {Object.values(ROLES).map((role) => {
                    const Icon = role.icon
                    return (
                      <th key={role.id} className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Icon className={role.color} size={16} />
                          <span className={`text-xs ${role.color}`}>{role.name}</span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-gray-800/50">
                      <td colSpan={7} className="p-2 px-4 text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {category}
                      </td>
                    </tr>
                    {perms.map((permName) => {
                      const perm = Object.values(ROLES).flatMap(r => r.permissions).find(p => p.name === permName)
                      if (!perm) return null
                      
                      return (
                        <tr key={permName} className="border-b border-gray-700/30 hover:bg-white/5">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <perm.icon className="text-gray-500" size={14} />
                              <span className="text-gray-300">{perm.label}</span>
                            </div>
                          </td>
                          {Object.values(ROLES).map((role) => (
                            <td key={role.id} className="p-3 text-center">
                              {hasPermission(role.id, permName) ? (
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
                                  <FiCheckCircle className="text-green-400" size={14} />
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-700/30">
                                  <FiLock className="text-gray-600" size={12} />
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-gray-700/50 bg-gray-800/30">
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <FiCheckCircle className="text-green-400" size={10} />
                </div>
                <span>Allowed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-700/30 flex items-center justify-center">
                  <FiLock className="text-gray-600" size={8} />
                </div>
                <span>Not Allowed</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Role-Specific Blockchain Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FiActivity className="text-primary-400" />
              Role-Specific Blockchain Features
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Advanced options powered by on-chain data, events, and permissions for each user type.
            </p>
          </div>
        </div>

        <div className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(showOnlyMine && currentRoleData
            ? [currentRoleData]
            : Object.values(ROLES)
          ).map((role) => {
            const Icon = role.icon
            const features = resolveAdvancedFeatures(role)
            if (features.length === 0) return null

            return (
              <div
                key={role.id}
                className="rounded-xl border border-gray-700/60 bg-gray-900/40 p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${role.bgColor}`}>
                    <Icon className={role.color} size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${role.color}`}>{role.name}</p>
                    <p className="text-xs text-gray-500">Blockchain-powered options</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {features.map((feature) => (
                    <div
                      key={feature.key}
                      className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white">
                          {feature.title}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-emerald-500/20 text-emerald-300">
                          On-chain
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

export default RoleDashboard

