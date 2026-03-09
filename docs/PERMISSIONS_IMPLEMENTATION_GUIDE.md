# Role-Based Permissions System - Implementation Guide

## Overview

BlockMed V3 now features a comprehensive role-based permissions system with six distinct roles, each with specific access levels and capabilities.

## Role Definitions

| Role | ID | Purpose | Access Level |
|------|----|---------|--------------| 
| **Admin** | 1 | System administrator | Full access to all features |
| **Doctor** | 2 | Healthcare provider | Create prescriptions, manage patients |
| **Pharmacist** | 3 | Pharmacy staff | Verify and dispense prescriptions |
| **Manufacturer** | 4 | Medicine producer | Manage batches and inventory |
| **Patient** | 5 | Medication recipient | View personal prescriptions and history |
| **Regulator** | 6 | Regulatory authority | Monitor batches and generate reports |

---

## Architecture

### 1. Core Permissions Module (`src/utils/permissions.js`)

The permissions system is built on three main pillars:

#### A. Page Access Permissions
Controls which roles can view specific pages.

```javascript
export const PAGE_PERMISSIONS = {
  '/': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST, ...], // All roles
  '/prescription/create': [ROLES.ADMIN, ROLES.DOCTOR],
  '/pharmacy': [ROLES.ADMIN, ROLES.PHARMACIST, ROLES.PATIENT],
  '/batches': [ROLES.ADMIN, ROLES.MANUFACTURER, ROLES.REGULATOR],
  // ... more pages
}
```

#### B. Feature Permissions
Controls which roles can perform specific actions.

```javascript
export const FEATURE_PERMISSIONS = {
  canCreatePrescription: [ROLES.ADMIN, ROLES.DOCTOR],
  canDispense: [ROLES.ADMIN, ROLES.PHARMACIST],
  canCreateBatch: [ROLES.ADMIN, ROLES.MANUFACTURER],
  // ... more features
}
```

#### C. Dashboard Widgets
Defines role-specific dashboard components and stats.

```javascript
export const DASHBOARD_WIDGETS = {
  quickActions: {
    [ROLES.DOCTOR]: ['createPrescription', 'viewPatients', ...],
    [ROLES.PHARMACIST]: ['verifyPrescription', 'dispenseMedicine', ...],
    // ... per role
  },
  stats: {
    [ROLES.DOCTOR]: ['myPrescriptions', 'verifiedCount', ...],
    // ... per role
  }
}
```

---

## Key Helper Functions

Located in `src/utils/permissions.js`:

### Checking Access

```javascript
// Check if role can access a page
canAccessPage(roleId, path)

// Check if role can access a feature
canAccessFeature(roleId, feature)

// Get all permissions for a role
getRolePermissions(roleId)

// Check if role can perform an action on a resource
canPerformAction(roleId, action, resourceType)
```

### Role Utilities

```javascript
// Get role name from ID
getRoleNameById(roleId)

// Check if admin
isAdmin(roleId)

// Check if healthcare provider
isHealthcareProvider(roleId)

// Convenience methods
canDispenseMedicines(roleId)
canCreateBatches(roleId)
canManageBatches(roleId)
canAccessPatientData(roleId)
```

---

## Access Control Components

Located in `src/components/`:

### 1. **PageAccessControl** (`PageAccessControl.jsx`)
Page-level access control that shows a permission denied screen.

```javascript
import PageAccessControl from '../components/PageAccessControl'

export const CreatePrescription = () => {
  return (
    <PageAccessControl requiredRoles={[1, 2]} pageTitle="Create Prescription">
      {/* Page content */}
    </PageAccessControl>
  )
}
```

### 2. **FeatureAccess** (`FeatureAccessControl.jsx`)
Feature-level access control for individual components or actions.

```javascript
import { FeatureAccess } from '../components/FeatureAccessControl'

<FeatureAccess feature="canCreatePrescription">
  <button>Create Prescription</button>
</FeatureAccess>
```

### 3. **Role-Based Content Components**

```javascript
// Show content only to specific roles
import { RoleBasedContent, AdminOnly, DoctorOnly, PatientOnly } from '../components/FeatureAccessControl'

<AdminOnly>
  <AdminPanel />
</AdminOnly>

<DoctorOnly>
  <DoctorDashboard />
</DoctorOnly>

<RoleBasedContent allowedRoles={[1, 2, 3]}>
  <RestrictedFeature />
</RoleBasedContent>
```

### 4. **RestrictedAction** - Disabled Button Wrapper
Shows a disabled button with tooltip for restricted actions.

```javascript
import { RestrictedAction } from '../components/FeatureAccessControl'

<RestrictedAction feature="canDeletePrescription" tooltipPosition="top">
  <button onClick={handleDelete}>Delete</button>
</RestrictedAction>
```

---

## Implementation Steps

### Step 1: Add Page-Level Access Control

For any protected page, wrap the entire component:

```javascript
import PageAccessControl from '../components/PageAccessControl'
import { ROLES } from '../utils/permissions'

const MyProtectedPage = () => {
  return (
    <PageAccessControl requiredRoles={[ROLES.ADMIN, ROLES.DOCTOR]}>
      <div className="page-content">
        {/* Content only visible to Admin and Doctor */}
      </div>
    </PageAccessControl>
  )
}
```

### Step 2: Add Feature-Level Access Control

For individual features within a page:

```javascript
import { FeatureAccess, RestrictedAction } from '../components/FeatureAccessControl'

// Method 1: Hide entire component
<FeatureAccess feature="canCreateBatch">
  <CreateBatchForm />
</FeatureAccess>

// Method 2: Show disabled button with tooltip
<RestrictedAction feature="canDeleteBatch">
  <button onClick={handleDelete} className="btn-primary">
    Delete Batch
  </button>
</RestrictedAction>
```

### Step 3: Role-Based Dashboard Widgets

Filter dashboard content by role:

```javascript
import { useStore } from '../store/useStore'
import { DASHBOARD_WIDGETS } from '../utils/permissions'

const Dashboard = () => {
  const { role } = useStore()
  const allowedWidgets = DASHBOARD_WIDGETS.quickActions[role] || []
  const allowedStats = DASHBOARD_WIDGETS.stats[role] || []

  return (
    <div className="dashboard">
      {allowedWidgets.includes('createPrescription') && <CreatePrescriptionWidget />}
      {allowedWidgets.includes('manageBatches') && <ManageBatchesWidget />}
      {/* ... etc */}
    </div>
  )
}
```

---

## Usage Examples

### Example 1: Create Prescription Page
Only Admin and Doctor can create prescriptions.

```javascript
import PageAccessControl from '../components/PageAccessControl'
import { ROLES } from '../utils/permissions'

const CreatePrescription = () => {
  return (
    <PageAccessControl requiredRoles={[ROLES.ADMIN, ROLES.DOCTOR]}>
      {/* Form to create prescription */}
    </PageAccessControl>
  )
}
```

### Example 2: Pharmacy Verification with Role-Based Features
Pharmacist can verify, Patient can only view.

```javascript
const PharmacyVerification = () => {
  const { role } = useStore()
  
  return (
    <PageAccessControl requiredRoles={[ROLES.ADMIN, ROLES.PHARMACIST, ROLES.PATIENT]}>
      <PrescriptionList>
        {/* All roles can view prescriptions */}
        
        {role !== ROLES.PATIENT && (
          <RestrictedAction feature="canVerifyPrescription">
            <button>Verify Prescription</button>
          </RestrictedAction>
        )}
        
        {canAccessFeature(role, 'canDispense') && (
          <DispenseForm />
        )}
      </PrescriptionList>
    </PageAccessControl>
  )
}
```

### Example 3: Batch Management with Admin Oversight
Different capabilities per role.

```javascript
import { RestrictedAction, AdminOnly } from '../components/FeatureAccessControl'

const BatchManagement = () => {
  return (
    <PageAccessControl requiredRoles={[ROLES.ADMIN, ROLES.MANUFACTURER, ROLES.REGULATOR]}>
      <div>
        <RestrictedAction feature="canCreateBatch">
          <button>Create Batch</button>
        </RestrictedAction>
        
        <RestrictedAction feature="canFlagBatch">
          <button>Flag Batch</button>
        </RestrictedAction>
        
        <AdminOnly>
          <AdminBatchTools />
        </AdminOnly>
      </div>
    </PageAccessControl>
  )
}
```

---

## Permission Matrix

### Pages Access

| Page | Admin | Doctor | Pharmacist | Manufacturer | Patient | Regulator |
|------|-------|--------|-----------|--------------|---------|-----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Prescription | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Templates | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Pharmacy Verification | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Patient History | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Medicines | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Batches | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Activity Log | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Features Access

| Feature | Admin | Doctor | Pharmacist | Manufacturer | Patient | Regulator |
|---------|-------|--------|-----------|--------------|---------|-----------|
| Create Prescription | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verify Prescription | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Dispense Medicine | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Create Batch | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Flag Batch | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Recall Batch | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Analytics | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Testing Permissions

### 1. Manual Testing Checklist

- [ ] Login as Admin - should see all menu items and pages
- [ ] Login as Doctor - should see only doctor-accessible pages
- [ ] Try accessing restricted pages via URL - should show access denied
- [ ] Check disabled buttons show tooltips
- [ ] Test feature-level access within pages

### 2. Unit Testing Example

```javascript
import { canAccessPage, canAccessFeature, ROLES } from '../utils/permissions'

describe('Permissions', () => {
  it('should allow admin access to all pages', () => {
    expect(canAccessPage(ROLES.ADMIN, '/pharmacy')).toBe(true)
  })
  
  it('should deny pharmacist access to create prescription', () => {
    expect(canAccessFeature(ROLES.PHARMACIST, 'canCreatePrescription')).toBe(false)
  })
  
  it('should allow manufacturer to create batches', () => {
    expect(canAccessFeature(ROLES.MANUFACTURER, 'canCreateBatch')).toBe(true)
  })
})
```

---

## Adding New Features to Permissions

### 1. Add to Feature Permissions

```javascript
// src/utils/permissions.js
export const FEATURE_PERMISSIONS = {
  // ... existing features
  canDoSomethingNew: [ROLES.ADMIN, ROLES.DOCTOR], // Add new feature
}
```

### 2. Use in Component

```javascript
import { canAccessFeature } from '../utils/permissions'

if (canAccessFeature(userRole, 'canDoSomethingNew')) {
  // Show feature
}
```

### 3. Protect with Component

```javascript
import { FeatureAccess } from '../components/FeatureAccessControl'

<FeatureAccess feature="canDoSomethingNew">
  <MyNewFeatureComponent />
</FeatureAccess>
```

---

## Best Practices

1. **Always wrap pages with PageAccessControl** for top-level protection
2. **Use FeatureAccess for component-level features** within pages
3. **Provide fallback UI** for restricted features
4. **Log access denials** for security auditing
5. **Test all role paths** before deployment
6. **Use semantic feature names** like `canCreatePrescription` not `canDo1`
7. **Keep permissions centralized** in `permissions.js`
8. **Document permission requirements** in code comments

---

## Troubleshooting

### Issue: User sees restricted page
- Check that PageAccessControl wraps the page
- Verify requiredRoles includes the user's role
- Check that role is correctly loaded in useStore

### Issue: Button is not disabled
- Use RestrictedAction or FeatureAccess component
- Verify feature name matches FEATURE_PERMISSIONS
- Check that canAccessFeature returns false

### Issue: Permission denied message appears but shouldn't
- Verify user's role in browser DevTools (useStore.role)
- Check PAGE_PERMISSIONS configuration
- Ensure role ID is numeric (1-6)

---

## Next Steps

1. Review all pages and add appropriate PageAccessControl wrappers
2. Audit all actions and protect with FeatureAccess or RestrictedAction
3. Update Dashboard widgets based on DASHBOARD_WIDGETS config
4. Test all role paths thoroughly
5. Add monitoring/logging for access denials
6. Create role-specific user onboarding flows
