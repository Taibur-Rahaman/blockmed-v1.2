// ============================================
// BlockMed - Role-Based Permissions System
// ============================================

export const ROLES = {
  ADMIN: 1,
  DOCTOR: 2,
  PHARMACIST: 3,
  MANUFACTURER: 4,
  PATIENT: 5,
  REGULATOR: 6,
}

export const normalizeRoleId = (roleId) => {
  if (roleId === null || roleId === undefined || roleId === '') return null

  try {
    const normalized = Number(roleId)
    if (Number.isInteger(normalized) && normalized >= 1 && normalized <= 6) {
      return normalized
    }
  } catch (error) {
    console.error('Error normalizing role:', error)
  }

  return null
}

const ALL_ROLES = Object.values(ROLES)

// ============================================
// Page Access Permissions
// ============================================
export const PAGE_PERMISSIONS = {
  '/': ALL_ROLES,
  '/prescription/create': [ROLES.ADMIN, ROLES.DOCTOR],
  '/prescription/add': [ROLES.ADMIN, ROLES.DOCTOR],
  '/templates': [ROLES.ADMIN, ROLES.DOCTOR],
  '/pharmacy': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.PATIENT],
  '/patient-history': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST],
  '/patient': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT],
  '/medicines': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST],
  '/batches': [ROLES.ADMIN, ROLES.MANUFACTURER, ROLES.REGULATOR],
  '/users': [ROLES.ADMIN],
  '/analytics': [ROLES.ADMIN, ROLES.REGULATOR],
  '/regulator': [ROLES.ADMIN, ROLES.REGULATOR],
  '/activity': [ROLES.ADMIN, ROLES.REGULATOR],
  '/leaderboard': ALL_ROLES,
  '/settings': ALL_ROLES,
}

// ============================================
// Feature-Level Permissions
// ============================================
export const FEATURE_PERMISSIONS = {
  canCreatePrescription: [ROLES.ADMIN, ROLES.DOCTOR],
  canUseTemplates: [ROLES.ADMIN, ROLES.DOCTOR],
  canAccessPharmacyVerification: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.PATIENT],
  canDispense: [ROLES.ADMIN, ROLES.PHARMACIST],
  canViewPatientHistory: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST],
  canAccessPatientPortal: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT],
  canViewMedicines: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST],
  canCreateBatch: [ROLES.ADMIN, ROLES.MANUFACTURER, ROLES.REGULATOR],
  canManageBatch: [ROLES.ADMIN, ROLES.MANUFACTURER, ROLES.REGULATOR],
  canRecallBatch: [ROLES.ADMIN, ROLES.MANUFACTURER, ROLES.REGULATOR],
  canFlagBatch: [ROLES.ADMIN, ROLES.REGULATOR],
  canViewAnalytics: [ROLES.ADMIN, ROLES.REGULATOR],
  canViewActivityLog: [ROLES.ADMIN, ROLES.REGULATOR],
  canManageUsers: [ROLES.ADMIN],
  canViewPrescriptionDetails: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.PATIENT],
  canViewOwnPrescriptions: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT],
  canSharePrescription: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT],
}

// ============================================
// Dashboard Widget Permissions
// ============================================
export const DASHBOARD_WIDGETS = {
  quickActions: {
    [ROLES.ADMIN]: ['createPrescription', 'verification', 'batches', 'analytics', 'users'],
    [ROLES.DOCTOR]: ['createPrescription', 'templates', 'verification', 'patientPortal', 'medicines'],
    [ROLES.PHARMACIST]: ['verification', 'patientHistory', 'medicines'],
    [ROLES.MANUFACTURER]: ['batches'],
    [ROLES.PATIENT]: ['patientPortal', 'verification'],
    [ROLES.REGULATOR]: ['analytics', 'batches', 'activity'],
  },
  stats: {
    [ROLES.ADMIN]: ['totalPrescriptions', 'dispensedCount', 'totalBatches', 'activeAlerts'],
    [ROLES.DOCTOR]: ['totalPrescriptions'],
    [ROLES.PHARMACIST]: ['totalPrescriptions', 'dispensedCount'],
    [ROLES.MANUFACTURER]: ['totalBatches'],
    [ROLES.PATIENT]: ['totalPrescriptions'],
    [ROLES.REGULATOR]: ['dispensedCount', 'totalBatches', 'activeAlerts'],
  },
}

export const getRoleNameById = (roleId) => {
  const normalizedRole = normalizeRoleId(roleId)
  const roleNames = {
    [ROLES.ADMIN]: 'Admin',
    [ROLES.DOCTOR]: 'Doctor',
    [ROLES.PHARMACIST]: 'Pharmacist',
    [ROLES.MANUFACTURER]: 'Manufacturer',
    [ROLES.PATIENT]: 'Patient',
    [ROLES.REGULATOR]: 'Regulator',
  }
  return roleNames[normalizedRole] || 'Unknown'
}

export const canAccessPage = (roleId, path) => {
  const normalizedRole = normalizeRoleId(roleId)
  if (!normalizedRole || !path) return false
  if (normalizedRole === ROLES.ADMIN) return true

  const allowedRoles = PAGE_PERMISSIONS[path]
  return Array.isArray(allowedRoles) ? allowedRoles.includes(normalizedRole) : false
}

export const canAccessFeature = (roleId, feature) => {
  const normalizedRole = normalizeRoleId(roleId)
  if (!normalizedRole || !feature) return false
  if (normalizedRole === ROLES.ADMIN) return true

  const allowedRoles = FEATURE_PERMISSIONS[feature]
  return Array.isArray(allowedRoles) ? allowedRoles.includes(normalizedRole) : false
}

export const getRolePermissions = (roleId) => {
  const normalizedRole = normalizeRoleId(roleId)
  if (!normalizedRole) {
    return { role: null, pages: {}, features: {}, quickActions: [], stats: [] }
  }

  const permissions = {
    role: normalizedRole,
    pages: {},
    features: {},
    quickActions: DASHBOARD_WIDGETS.quickActions[normalizedRole] || [],
    stats: DASHBOARD_WIDGETS.stats[normalizedRole] || [],
  }

  Object.keys(PAGE_PERMISSIONS).forEach((page) => {
    permissions.pages[page] = canAccessPage(normalizedRole, page)
  })

  Object.keys(FEATURE_PERMISSIONS).forEach((feature) => {
    permissions.features[feature] = canAccessFeature(normalizedRole, feature)
  })

  return permissions
}

export const canPerformAction = (roleId, action, resourceType) => {
  const featureKey = `can${action.charAt(0).toUpperCase() + action.slice(1)}${
    resourceType.charAt(0).toUpperCase() + resourceType.slice(1)
  }`

  return canAccessFeature(roleId, featureKey)
}

export const getAccessiblePages = (roleId) => {
  const normalizedRole = normalizeRoleId(roleId)
  if (!normalizedRole) return []

  return Object.keys(PAGE_PERMISSIONS).filter((page) => canAccessPage(normalizedRole, page))
}

export const getPermissionDenialMessage = (roleId, target) => {
  const roleName = getRoleNameById(roleId)
  const labelMap = {
    canCreatePrescription: 'create prescriptions',
    canUseTemplates: 'use prescription templates',
    canAccessPharmacyVerification: 'access the pharmacy verification portal',
    canDispense: 'dispense or confirm medicine sales',
    canViewPatientHistory: 'view patient history',
    canAccessPatientPortal: 'access the patient portal',
    canViewMedicines: 'view medicines',
    canCreateBatch: 'create medicine batches',
    canManageBatch: 'manage medicine batches',
    canRecallBatch: 'recall medicine batches',
    canFlagBatch: 'flag suspicious batches',
    canViewAnalytics: 'view analytics',
    canViewActivityLog: 'view the activity log',
    canManageUsers: 'manage users',
  }

  const targetLabel = labelMap[target] || String(target || 'this feature').replace(/^can/, '').replace(/([A-Z])/g, ' $1').trim().toLowerCase()
  return `${roleName} role does not have permission to ${targetLabel}.`
}

export const isAdmin = (roleId) => normalizeRoleId(roleId) === ROLES.ADMIN

export const isHealthcareProvider = (roleId) => {
  const normalizedRole = normalizeRoleId(roleId)
  return normalizedRole === ROLES.DOCTOR || normalizedRole === ROLES.PHARMACIST
}

export const canDispenseMedicines = (roleId) => canAccessFeature(roleId, 'canDispense')

export const canCreateBatches = (roleId) => canAccessFeature(roleId, 'canCreateBatch')

export const canManageBatches = (roleId) =>
  canAccessFeature(roleId, 'canManageBatch') || canAccessFeature(roleId, 'canRecallBatch')

export const canAccessPatientData = (roleId) =>
  canAccessFeature(roleId, 'canViewPatientHistory') || canAccessFeature(roleId, 'canAccessPatientPortal')

export const getRoleColorClass = (roleId) => {
  const normalizedRole = normalizeRoleId(roleId)
  const colors = {
    [ROLES.ADMIN]: 'text-red-400 bg-red-500/20',
    [ROLES.DOCTOR]: 'text-green-400 bg-green-500/20',
    [ROLES.PHARMACIST]: 'text-blue-400 bg-blue-500/20',
    [ROLES.MANUFACTURER]: 'text-yellow-400 bg-yellow-500/20',
    [ROLES.PATIENT]: 'text-purple-400 bg-purple-500/20',
    [ROLES.REGULATOR]: 'text-orange-400 bg-orange-500/20',
  }
  return colors[normalizedRole] || 'text-gray-400 bg-gray-500/20'
}
