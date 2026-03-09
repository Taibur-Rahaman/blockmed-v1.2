# Role-Based Permissions System - Implementation Guide

## Overview

This guide documents the comprehensive role-based permissions system implemented in BlockMed V3. The system enforces role-based access control across pages, features, and components.

---

## 1. Core Components

### 1.1 Role Definitions (`src/utils/permissions.js`)

**Roles (Numeric IDs):**
- `1`: Admin - Full system access
- `2`: Doctor - Healthcare provider
- `3`: Pharmacist - Pharmacy operations
- `4`: Manufacturer - Batch management
- `5`: Patient - Patient portal access
- `6`: Regulator - Regulatory oversight

---

## 2. Permission Configuration

### 2.1 Page Access Permissions

Located in `src/utils/permissions.js` → `PAGE_PERMISSIONS`

**Example:**
```javascript
PAGE_PERMISSIONS = {
  '/prescription/create': [ROLES.ADMIN, ROLES.DOCTOR],
  '/batches': [ROLES.ADMIN, ROLES.MANUFACTURER, ROLES.REGULATOR],
  '/analytics': [ROLES.ADMIN, ROLES.REGULATOR],
}
```

**Current Page Permissions:**

| Page | Admin | Doctor | Pharmacist | Manufacturer | Patient | Regulator |
|------|-------|--------|-----------|--------------|---------|-----------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Prescription | ✓ | ✓ | | | | |
| Templates | ✓ | ✓ | | | | |
| Pharmacy Verification | ✓ | ✓ | ✓ | | ✓ | |
| Patient History | ✓ | ✓ | ✓ | | ✓ | |
| Patient Portal | ✓ | ✓ | | | ✓ | |
| Medicines | ✓ | ✓ | ✓ | | | |
| Batches | ✓ | | | ✓ | | ✓ |
| User Management | ✓ | | | | | |
| Analytics | ✓ | | | | | ✓ |
| Regulator Center | ✓ | | | | | ✓ |
| Activity Log | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Leaderboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Settings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 2.2 Feature-Level Permissions

Located in `src/utils/permissions.js` → `FEATURE_PERMISSIONS`

**Example:**
```javascript
FEATURE_PERMISSIONS = {
  canCreatePrescription: [ROLES.ADMIN, ROLES.DOCTOR],
  canDispense: [ROLES.ADMIN, ROLES.PHARMACIST],
  canCreateBatch: [ROLES.ADMIN, ROLES.MANUFACTURER],
  canFlagBatch: [ROLES.ADMIN, ROLES.REGULATOR],
}
```

**All Available Features:**

- **Prescription**: `canCreatePrescription`, `canEditPrescription`, `canDeletePrescription`, `canViewPrescriptionDetails`
- **Dispensing**: `canDispense`, `canVerifyPrescription`, `canViewPatientPrescriptions`
- **Batch Management**: `canCreateBatch`, `canEditBatch`, `canFlagBatch`, `canRecallBatch`
- **Medicines**: `canManageMedicines`, `canViewMedicines`
- **Analytics**: `canViewAnalytics`, `canExportReports`
- **Admin**: `canViewActivityLog`, `canManageUsers`, `canEditUserRole`, `canRestrictUser`
- **Patient**: `canViewOwnPrescriptions`, `canSharePrescription`

### 2.3 Dashboard Widgets

Roles see role-specific widgets on the dashboard:

**Quick Actions by Role:**
- **Admin**: Create Prescription, Manage Batches, Manage Users, View Analytics
- **Doctor**: Create Prescription, View Patients, Check Prescriptions
- **Pharmacist**: Verify Prescription, Dispense Medicine, View Inventory
- **Manufacturer**: Create Batch, Manage Batches, Track Inventory
- **Patient**: View Prescriptions, Track Dispensing
- **Regulator**: View Analytics, Flag Batch, Recall Batch

**Stats by Role:**
- **Admin**: All stats (Prescriptions, Batches, Users, Dispensed, Flagged, Recalled)
- **Doctor**: My Prescriptions, Verified Count, Pending Count
- **Pharmacist**: Dispensed Count, Verified Count, Pending Verification
- **Manufacturer**: Total Batches, Flagged Count, Recalled Count
- **Patient**: My Prescriptions, Dispensed Count
- **Regulator**: Total Batches, Flagged Count, Recalled Count, Total Dispensed

---

## 3. Implementation in Components

### 3.1 Permission Helper Functions

All exported from `src/utils/helpers.js`:

```javascript
// Check page access
canAccessPage(roleId, path) 
// Returns: boolean

// Check feature access
canAccessFeature(roleId, feature)
// Returns: boolean

// Get all permissions for a role
getRolePermissions(roleId)
// Returns: { pages: {...}, features: {...}, dashboardWidgets: {...} }

// Perform action check
canPerformAction(roleId, action, resourceType)
// Example: canPerformAction(2, 'create', 'prescription')

// Get accessible pages
getAccessiblePages(roleId)
// Returns: array of page paths

// Get permission denial message
getPermissionDenialMessage(roleId, feature)
// Returns: user-friendly message

// Role-specific checks
isAdmin(roleId)
isHealthcareProvider(roleId)
canDispenseMedicines(roleId)
canCreateBatches(roleId)
canManageBatches(roleId)
canAccessPatientData(roleId)
```

### 3.2 Protected Route Component

**File:** `src/components/ProtectedRoute.jsx`

Protects pages from unauthorized access:

```jsx
import ProtectedRoute from '../components/ProtectedRoute'

// In your router configuration:
<Route element={<ProtectedRoute><CreatePrescription /></ProtectedRoute>} path="/prescription/create" />
```

**Behavior:**
- Checks if user's role can access the page
- Redirects to dashboard if access denied
- Logs warnings for debugging

### 3.3 Role-Protected Components

**File:** `src/components/RoleProtectedComponent.jsx`

Provides utilities for conditional rendering based on role:

#### FeatureAccess (Page-Level)
Wraps entire pages to show access denied message:

```jsx
import { FeatureAccess } from '../components/RoleProtectedComponent'

export default function MyPage() {
  return (
    <FeatureAccess 
      feature="canCreatePrescription"
      allowedRoles={[1, 2]} // Admin and Doctor
    >
      {/* Page content */}
    </FeatureAccess>
  )
}
```

#### ConditionalFeature (Component-Level)
Shows/hides elements based on role:

```jsx
import { ConditionalFeature } from '../components/RoleProtectedComponent'

<ConditionalFeature 
  feature="canDispense"
  fallback={<p>No access to this feature</p>}
>
  <button>Dispense Medicine</button>
</ConditionalFeature>
```

#### PermissionButton
Disables button based on permission and shows tooltip:

```jsx
import { PermissionButton } from '../components/RoleProtectedComponent'

<PermissionButton 
  feature="canDispense"
  onClick={handleDispense}
  className="btn btn-primary"
>
  Dispense Medicine
</PermissionButton>
```

#### AdminOnly
Shows element only to admins:

```jsx
import { AdminOnly } from '../components/RoleProtectedComponent'

<AdminOnly>
  <button>Delete User</button>
</AdminOnly>
```

---

## 4. Navigation & Sidebar

### 4.1 Enhanced Layout Component

**File:** `src/components/Layout.jsx`

**Features:**
- Disabled navigation items for users without permission
- Lock icon (`FiLock`) indicates restricted access
- Tooltip on hover shows permission denial reason
- Dynamic tooltip message based on role

**Visual Indicators:**
- **Accessible items**: Normal appearance, clickable
- **Restricted items**: Grayed out (opacity-50), lock icon, tooltip on hover

### 4.2 Navigation Item Structure

```javascript
const navItems = [
  { 
    path: '/prescription/create',
    label: 'Create Prescription',
    icon: FiFileText,
    roles: [1, 2],
    accessControl: 'canCreatePrescription'
  },
  // ... more items
]
```

---

## 5. Dashboard Role-Based Customization

### 5.1 Smart Quick Actions

**File:** `src/pages/Dashboard.jsx`

Dashboard shows role-specific quick action buttons:

```javascript
// Doctor sees: Create Prescription, Verify Prescription
// Pharmacist sees: Verify Prescription, Dispense Medicine
// Manufacturer sees: Create Batch, Manage Batches
// Patient sees: View Prescriptions, Track Dispensing
```

### 5.2 Dynamic Stats

Dashboard stat cards are filtered by role:

- **All roles**: Prescriptions total
- **Admin only**: Total users, flagged/recalled batches
- **Pharmacist/Admin**: Dispensed count
- **Manufacturer/Regulator**: Batch counts

---

## 6. Usage Examples

### Example 1: Create Prescription Page

**Before:**
```jsx
const CreatePrescription = () => {
  return (
    <div>
      {/* No permission checking */}
    </div>
  )
}
```

**After:**
```jsx
import { FeatureAccess } from '../components/RoleProtectedComponent'

const CreatePrescription = () => {
  return (
    <FeatureAccess 
      feature="canCreatePrescription"
      allowedRoles={[1, 2]}
    >
      <div>
        {/* Only Admin and Doctor see this */}
      </div>
    </FeatureAccess>
  )
}
```

### Example 2: Dispense Button in Pharmacy Page

```jsx
import { PermissionButton, ConditionalFeature } from '../components/RoleProtectedComponent'

<ConditionalFeature feature="canDispense">
  <PermissionButton 
    feature="canDispense"
    onClick={dispenseHandler}
    className="btn btn-success"
  >
    <FiCheckCircle /> Dispense
  </PermissionButton>
</ConditionalFeature>
```

### Example 3: Batch Management Actions

```jsx
import { canAccessFeature } from '../utils/helpers'

// In component
const { role } = useStore()

const canFlag = canAccessFeature(role, 'canFlagBatch')
const canRecall = canAccessFeature(role, 'canRecallBatch')

return (
  <div>
    {canFlag && <button>Flag Batch</button>}
    {canRecall && <button>Recall Batch</button>}
  </div>
)
```

### Example 4: Admin-Only Settings

```jsx
import { AdminOnly } from '../components/RoleProtectedComponent'

<AdminOnly 
  fallback={<p>This feature is only available to administrators</p>}
>
  <section>
    <h3>System Settings</h3>
    {/* Admin-only configuration */}
  </section>
</AdminOnly>
```

---

## 7. Adding New Features

### Step 1: Define Permission in `src/utils/permissions.js`

```javascript
// Add to FEATURE_PERMISSIONS
export const FEATURE_PERMISSIONS = {
  // ... existing features
  canMyNewFeature: [ROLES.ADMIN, ROLES.DOCTOR],
}

// Add to PAGE_PERMISSIONS if it's a new page
export const PAGE_PERMISSIONS = {
  // ... existing pages
  '/my-new-page': [ROLES.ADMIN, ROLES.DOCTOR],
}
```

### Step 2: Use in Component

```jsx
import { FeatureAccess, PermissionButton } from '../components/RoleProtectedComponent'
import { canAccessFeature } from '../utils/helpers'

export default function MyNewPage() {
  const { role } = useStore()
  
  const hasAccess = canAccessFeature(role, 'canMyNewFeature')
  
  return (
    <FeatureAccess feature="canMyNewFeature" allowedRoles={[1, 2]}>
      {/* Page content */}
      {hasAccess && <button>My New Action</button>}
    </FeatureAccess>
  )
}
```

---

## 8. Testing Role-Based Access

### Test Cases

```javascript
// Test case: Doctor accessing prescription creation
expect(canAccessFeature(2, 'canCreatePrescription')).toBe(true)

// Test case: Pharmacist accessing prescription creation
expect(canAccessFeature(3, 'canCreatePrescription')).toBe(false)

// Test case: Admin accessing batch management
expect(canAccessFeature(1, 'canCreateBatch')).toBe(true)

// Test case: Manufacturer accessing batch management
expect(canAccessFeature(4, 'canCreateBatch')).toBe(true)

// Test case: Patient accessing batch management
expect(canAccessFeature(5, 'canCreateBatch')).toBe(false)
```

---

## 9. Security Considerations

1. **Frontend Enforcement**: These permissions are enforced on the frontend for UX. Always validate on backend!
2. **Smart Contract**: The blockchain contract should also enforce these permissions
3. **No Bypassing**: Users cannot bypass frontend checks - backend must verify
4. **Logging**: All permission denials are logged to console for debugging

---

## 10. Migration Checklist

- [x] Create `src/utils/permissions.js` with role definitions
- [x] Create `src/components/ProtectedRoute.jsx` for page-level protection
- [x] Create `src/components/RoleProtectedComponent.jsx` for component-level controls
- [x] Update `src/utils/helpers.js` to export permission functions
- [x] Update `src/components/Layout.jsx` with permission-aware navigation
- [x] Update `src/pages/CreatePrescription.jsx` with feature access wrapper
- [x] Update `src/pages/Dashboard.jsx` with role-specific widgets
- [ ] Update remaining pages (PharmacyVerification, BatchManagement, etc.)
- [ ] Add ProtectedRoute wrapper in Router configuration
- [ ] Test all permission scenarios
- [ ] Document in developer guide

---

## 11. Related Files

- `src/utils/permissions.js` - Permission configurations
- `src/utils/helpers.js` - Helper functions (re-exports from permissions.js)
- `src/components/ProtectedRoute.jsx` - Route protection component
- `src/components/RoleProtectedComponent.jsx` - Component-level access control
- `src/components/Layout.jsx` - Navigation with role-aware UI
- `src/pages/Dashboard.jsx` - Role-specific dashboard
- `src/pages/CreatePrescription.jsx` - Protected page example
- `src/store/useStore.js` - User and role state management

---

## 12. Troubleshooting

**Issue**: Permission check not working
**Solution**: Verify that `role` is correctly set in the store

**Issue**: Navigation item not showing
**Solution**: Check if role is in the `roles` array for that nav item

**Issue**: Feature button still visible when denied
**Solution**: Ensure you're using `ConditionalFeature` or `PermissionButton` correctly

**Issue**: Permission denial message not helpful
**Solution**: Update `getPermissionDenialMessage` function in `permissions.js`

---

## 13. Future Enhancements

- [ ] Role-based field validation in forms
- [ ] Audit logging for permission changes
- [ ] Dynamic permission assignment per user
- [ ] Permission inheritance for role hierarchies
- [ ] Permission caching for performance
- [ ] Permission-based API endpoint routing
