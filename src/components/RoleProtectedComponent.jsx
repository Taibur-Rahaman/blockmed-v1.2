import React from 'react'
import { useStore } from '../store/useStore'
import { canAccessFeature, getPermissionDenialMessage, normalizeRoleId } from '../utils/permissions'
import { FiLock } from 'react-icons/fi'

/**
 * Feature Access Wrapper Component
 * Shows a message if the user doesn't have permission for a specific feature
 * Prevents the component from rendering if access is denied
 */
export const FeatureAccess = ({ 
  feature, 
  children, 
  fallback,
  allowedRoles 
}) => {
  const { role, user } = useStore()
  const currentRole = normalizeRoleId(role ?? user?.role)

  // Check if role has access to the feature
  const hasAccess = allowedRoles 
    ? allowedRoles.includes(currentRole)
    : canAccessFeature(currentRole, feature)

  if (!hasAccess) {
    if (fallback) {
      return fallback
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-950">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-500/10 rounded-full">
              <FiLock size={32} className="text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300">
            {getPermissionDenialMessage(currentRole, feature)}
          </p>
        </div>
      </div>
    )
  }

  return children
}

/**
 * Conditional Feature Component
 * Shows element only if user has access to the feature
 */
export const ConditionalFeature = ({ 
  feature, 
  children, 
  allowedRoles,
  fallback = null 
}) => {
  const { role, user } = useStore()
  const currentRole = normalizeRoleId(role ?? user?.role)

  const hasAccess = allowedRoles 
    ? allowedRoles.includes(currentRole)
    : canAccessFeature(currentRole, feature)

  return hasAccess ? children : fallback
}

/**
 * Button with Permission Check
 * Disables button if user doesn't have permission
 */
export const PermissionButton = ({ 
  feature, 
  children, 
  allowedRoles,
  className = '',
  onClick,
  showTooltip = true,
  ...props 
}) => {
  const { role, user } = useStore()
  const currentRole = normalizeRoleId(role ?? user?.role)

  const hasAccess = allowedRoles 
    ? allowedRoles.includes(currentRole)
    : canAccessFeature(currentRole, feature)

  const denialMessage = getPermissionDenialMessage(currentRole, feature)

  return (
    <div 
      className="relative inline-block group"
      title={!hasAccess && showTooltip ? denialMessage : ''}
    >
      <button
        {...props}
        disabled={!hasAccess || props.disabled}
        onClick={(e) => {
          if (hasAccess && onClick) {
            onClick(e)
          }
        }}
        className={`${className} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {children}
      </button>
      
      {!hasAccess && showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity duration-200 border border-gray-700">
          {denialMessage}
        </div>
      )}
    </div>
  )
}

/**
 * Admin Only Component
 * Shows element only to admin users
 */
export const AdminOnly = ({ children, fallback = null }) => {
  const { role, user } = useStore()
  return normalizeRoleId(role ?? user?.role) === 1 ? children : fallback
}

/**
 * Role Badge with Permission Context
 * Shows if user can perform a specific action
 */
export const RoleAwareBadge = ({ feature, children, role: overrideRole }) => {
  const { role: userRole, user } = useStore()
  const role = normalizeRoleId(overrideRole ?? userRole ?? user?.role)

  const hasAccess = canAccessFeature(role, feature)

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
      hasAccess 
        ? 'bg-green-500/20 text-green-400' 
        : 'bg-red-500/20 text-red-400 opacity-60'
    }`}>
      {children}
    </div>
  )
}

export default {
  FeatureAccess,
  ConditionalFeature,
  PermissionButton,
  AdminOnly,
  RoleAwareBadge,
}
