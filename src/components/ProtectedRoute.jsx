import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { canAccessPage, normalizeRoleId } from '../utils/permissions'

/**
 * Protected Route Component
 * Checks if the user's role has permission to access the page
 * If not, redirects to dashboard
 */
const ProtectedRoute = ({ children, requiredPage }) => {
  const { role, user, account } = useStore()
  const location = useLocation()
  const currentRole = normalizeRoleId(role ?? user?.role)

  // If not logged in, redirect to login
  if (!account) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Check if user's role can access this page
  const hasAccess = canAccessPage(currentRole, requiredPage || location.pathname)

  if (!hasAccess) {
    // Redirect to dashboard with a message
    console.warn(`Access denied: User with role ${currentRole} cannot access ${location.pathname}`)
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
