import React from 'react'
import { motion } from 'framer-motion'
import { FiLock } from 'react-icons/fi'
import { useStore } from '../store/useStore'
import { canAccessFeature, getRoleNameById, ROLES } from '../utils/permissions'

/**
 * Feature-level access control component
 * Shows children if user has permission, otherwise shows locked message
 */
export const FeatureAccess = ({ 
  children, 
  feature, 
  fallback = null,
  showLocked = true 
}) => {
  const { role } = useStore()

  if (!canAccessFeature(role, feature)) {
    if (!showLocked) return fallback

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-4"
      >
        <div className="flex-shrink-0">
          <FiLock className="text-red-400" size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-red-300 mb-1">Feature Locked</h3>
          <p className="text-sm text-red-200">
            As a {getRoleNameById(role)}, you don't have permission to access this feature.
          </p>
        </div>
      </motion.div>
    )
  }

  return children
}

/**
 * Disabled button wrapper for restricted actions
 * Shows a disabled button with explanation tooltip
 */
export const RestrictedAction = ({ 
  children, 
  feature, 
  className = '',
  tooltipPosition = 'top'
}) => {
  const { role } = useStore()
  const hasAccess = canAccessFeature(role, feature)

  if (hasAccess) {
    return children
  }

  const tooltipClass = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  }[tooltipPosition]

  return (
    <div className="relative group inline-block">
      <div className={className}>
        {React.cloneElement(children, {
          disabled: true,
          className: `${children.props.className || ''} opacity-50 cursor-not-allowed`
        })}
      </div>
      <div className={`absolute hidden group-hover:block ${tooltipClass} z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-gray-700`}>
        Restricted for {getRoleNameById(role)}
      </div>
    </div>
  )
}

/**
 * Role-based visibility component
 * Shows content only to specified roles
 */
export const RoleBasedContent = ({ 
  allowedRoles = [], 
  children, 
  fallback = null 
}) => {
  const { role } = useStore()

  if (!allowedRoles.includes(role)) {
    return fallback
  }

  return children
}

/**
 * Admin-only content wrapper
 */
export const AdminOnly = ({ children, fallback = null }) => {
  return <RoleBasedContent allowedRoles={[ROLES.ADMIN]} fallback={fallback}>{children}</RoleBasedContent>
}

/**
 * Doctor-only content wrapper
 */
export const DoctorOnly = ({ children, fallback = null }) => {
  return <RoleBasedContent allowedRoles={[ROLES.DOCTOR]} fallback={fallback}>{children}</RoleBasedContent>
}

/**
 * Pharmacist-only content wrapper
 */
export const PharmacistOnly = ({ children, fallback = null }) => {
  return <RoleBasedContent allowedRoles={[ROLES.PHARMACIST]} fallback={fallback}>{children}</RoleBasedContent>
}

/**
 * Patient-only content wrapper
 */
export const PatientOnly = ({ children, fallback = null }) => {
  return <RoleBasedContent allowedRoles={[ROLES.PATIENT]} fallback={fallback}>{children}</RoleBasedContent>
}

/**
 * Multi-role content wrapper
 */
export const RoleProtectedComponent = ({ 
  roles = [], 
  children, 
  fallback = null 
}) => {
  return <RoleBasedContent allowedRoles={roles} fallback={fallback}>{children}</RoleBasedContent>
}

export default FeatureAccess
