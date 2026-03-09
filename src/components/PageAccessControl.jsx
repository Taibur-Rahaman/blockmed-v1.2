import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi'
import { useStore } from '../store/useStore'
import { canAccessPage, getRoleNameById } from '../utils/permissions'

/**
 * Page-level access control component
 * Wraps pages to ensure the user has permission to view them
 * Shows a permission denied message if the user doesn't have access
 */
export const PageAccessControl = ({ 
  children, 
  requiredRoles, 
  pageTitle = 'This Page' 
}) => {
  const navigate = useNavigate()
  const { role } = useStore()

  // Check if user's role is in the allowed roles
  const hasAccess = requiredRoles.includes(role)

  if (!hasAccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[60vh] flex items-center justify-center"
      >
        <div className="text-center max-w-md mx-auto px-6">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center">
              <FiAlertCircle size={32} className="text-red-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Access Denied
          </h2>

          <p className="text-gray-300 mb-2">
            You don't have permission to access <strong>{pageTitle}</strong>.
          </p>

          <p className="text-sm text-gray-400 mb-6">
            As a <strong>{getRoleNameById(role)}</strong>, this feature is restricted to: 
            <br />
            {requiredRoles.map((r) => getRoleNameById(r)).join(', ')}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
          >
            <FiArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </motion.div>
    )
  }

  return children
}

export default PageAccessControl
