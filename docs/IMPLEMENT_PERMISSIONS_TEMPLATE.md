# Implementing Permissions on Remaining Pages - Template & Checklist

## Overview

This document provides a template and checklist for implementing role-based permissions on the remaining pages in BlockMed V3.

---

## Pages Requiring Permission Implementation

- [ ] PharmacyVerification.jsx
- [ ] BatchManagement.jsx
- [ ] Analytics.jsx
- [ ] MedicineManagement.jsx
- [ ] UserManagement.jsx
- [ ] PatientPortal.jsx
- [ ] RegulatorCenter.jsx
- [ ] ActivityLog.jsx (if needed)
- [ ] PrescriptionTemplates.jsx (if custom)
- [ ] PatientHistory.jsx (if custom)
- [ ] Leaderboard.jsx (if custom)

---

## Template: Adding Permissions to a Page

### Step 1: Import Required Components

```jsx
// At the top of your page file
import { FeatureAccess, ConditionalFeature, PermissionButton } from '../components/RoleProtectedComponent'
import { canAccessFeature } from '../utils/helpers'
import { useStore } from '../store/useStore'
```

### Step 2: Wrap Main Component

```jsx
const MyPage = () => {
  const { role } = useStore()
  
  return (
    <FeatureAccess 
      feature="canMyFeature"  // ← Change this to appropriate feature
      allowedRoles={[1, 2]}   // ← Set appropriate roles
    >
      {/* Your existing page code */}
    </FeatureAccess>
  )
}

export default MyPage
```

### Step 3: Add Permission Checks for Actions

```jsx
// Inside your component
const canCreatePrescription = canAccessFeature(role, 'canCreatePrescription')
const canDispense = canAccessFeature(role, 'canDispense')

// Use in JSX
return (
  <div>
    {canCreatePrescription && (
      <button onClick={create}>Create</button>
    )}
  </div>
)
```

### Step 4: Replace Action Buttons with PermissionButton

```jsx
// Before
<button onClick={handleCreate}>Create Batch</button>

// After
<PermissionButton
  feature="canCreateBatch"
  onClick={handleCreate}
  className="btn btn-primary"
>
  Create Batch
</PermissionButton>
```

---

## Page-by-Page Implementation Guide

### 1. PharmacyVerification.jsx

**Purpose**: Verify prescriptions and dispense medicines

**Required Permissions**:
- Page access: Admin, Pharmacist, Patient
- Main feature: `canVerifyPrescription`, `canDispense`

**Actions to Protect**:
- Verify prescription button → `canVerifyPrescription`
- Dispense medicine button → `canDispense`
- Edit dispensing details → `canDispense`
- View patient history → `canViewPatientPrescriptions`

**Template**:
```jsx
export default function PharmacyVerification() {
  return (
    <FeatureAccess 
      feature="canDispense"
      allowedRoles={[1, 3, 5]}
    >
      {/* Existing component */}
    </FeatureAccess>
  )
}
```

---

### 2. BatchManagement.jsx

**Purpose**: Create, edit, flag, and recall medicine batches

**Required Permissions**:
- Page access: Admin, Manufacturer, Regulator
- Create/Edit: `canCreateBatch`, `canEditBatch` (Admin, Manufacturer)
- Flag/Recall: `canFlagBatch`, `canRecallBatch` (Admin, Regulator)

**Actions to Protect**:
- Create batch button → `canCreateBatch`
- Edit batch button → `canEditBatch`
- Flag batch button → `canFlagBatch`
- Recall batch button → `canRecallBatch`
- Delete batch → Admin only

**Template**:
```jsx
export default function BatchManagement() {
  const { role } = useStore()
  
  return (
    <FeatureAccess 
      feature="canCreateBatch"
      allowedRoles={[1, 4, 6]}
    >
      {/* Show different actions based on role */}
      {[1, 4].includes(role) && <CreateBatchSection />}
      {[1, 6].includes(role) && <ManageBatchSection />}
    </FeatureAccess>
  )
}
```

---

### 3. Analytics.jsx

**Purpose**: View system analytics and reports

**Required Permissions**:
- Page access: Admin, Regulator
- View analytics: `canViewAnalytics`
- Export reports: `canExportReports`

**Actions to Protect**:
- View dashboard → `canViewAnalytics`
- Export data button → `canExportReports`

**Template**:
```jsx
export default function Analytics() {
  return (
    <FeatureAccess 
      feature="canViewAnalytics"
      allowedRoles={[1, 6]}
    >
      {/* Analytics content */}
    </FeatureAccess>
  )
}
```

---

### 4. MedicineManagement.jsx

**Purpose**: Manage medicine database

**Required Permissions**:
- Page access: Admin, Doctor, Pharmacist
- Create/Edit: `canManageMedicines` (Admin, Doctor)
- View: `canViewMedicines` (Admin, Doctor, Pharmacist)

**Actions to Protect**:
- Add medicine → `canManageMedicines`
- Edit medicine → `canManageMedicines`
- Delete medicine → Admin only
- View medicines → `canViewMedicines`

**Template**:
```jsx
export default function MedicineManagement() {
  const { role } = useStore()
  
  return (
    <FeatureAccess 
      feature="canViewMedicines"
      allowedRoles={[1, 2, 3]}
    >
      {canAccessFeature(role, 'canManageMedicines') ? (
        <FullMedicineEditor />
      ) : (
        <MedicineViewer />
      )}
    </FeatureAccess>
  )
}
```

---

### 5. UserManagement.jsx

**Purpose**: Manage user accounts and roles

**Required Permissions**:
- Page access: Admin only
- Manage users: `canManageUsers`
- Edit roles: `canEditUserRole`
- Restrict users: `canRestrictUser`

**Actions to Protect**:
- Add user → `canManageUsers`
- Edit user → `canManageUsers`
- Delete user → Admin only
- Change role → `canEditUserRole`
- Restrict user → `canRestrictUser`

**Template**:
```jsx
export default function UserManagement() {
  return (
    <FeatureAccess 
      feature="canManageUsers"
      allowedRoles={[1]}
    >
      {/* User management content */}
    </FeatureAccess>
  )
}
```

---

### 6. PatientPortal.jsx

**Purpose**: Patient-specific prescription and health data access

**Required Permissions**:
- Page access: Patient, Admin, Doctor
- View own prescriptions: `canViewOwnPrescriptions`
- Share prescription: `canSharePrescription`

**Actions to Protect**:
- View prescriptions → `canViewOwnPrescriptions`
- Share prescription → `canSharePrescription`
- Download prescription → `canViewOwnPrescriptions`

**Template**:
```jsx
export default function PatientPortal() {
  return (
    <FeatureAccess 
      feature="canViewOwnPrescriptions"
      allowedRoles={[1, 2, 5]}
    >
      {/* Patient portal content */}
    </FeatureAccess>
  )
}
```

---

### 7. RegulatorCenter.jsx

**Purpose**: Regulatory oversight and compliance management

**Required Permissions**:
- Page access: Admin, Regulator
- View analytics: `canViewAnalytics`
- Flag batch: `canFlagBatch`
- Recall batch: `canRecallBatch`

**Actions to Protect**:
- Flag batch → `canFlagBatch`
- Recall batch → `canRecallBatch`
- View activity log → `canViewActivityLog`
- Export compliance reports → `canExportReports`

**Template**:
```jsx
export default function RegulatorCenter() {
  const { role } = useStore()
  
  return (
    <FeatureAccess 
      feature="canViewAnalytics"
      allowedRoles={[1, 6]}
    >
      <RegulatoryDashboard />
      <ConditionalFeature feature="canFlagBatch">
        <BatchFlaggingSection />
      </ConditionalFeature>
      <ConditionalFeature feature="canRecallBatch">
        <BatchRecallSection />
      </ConditionalFeature>
    </FeatureAccess>
  )
}
```

---

### 8. ActivityLog.jsx (Optional)

**Purpose**: View system activity and audit trail

**Required Permissions**:
- Page access: All roles (likely)
- View activity: `canViewActivityLog` (Admin only)

**Template**:
```jsx
export default function ActivityLog() {
  const { role } = useStore()
  
  return (
    <FeatureAccess 
      feature="canViewActivityLog"
      allowedRoles={[1]}
      fallback={<p>This feature requires admin access</p>}
    >
      {/* Activity log content */}
    </FeatureAccess>
  )
}
```

---

## Advanced Patterns

### Pattern 1: Role-Specific Page Layout

```jsx
import { ConditionalFeature } from '../components/RoleProtectedComponent'
import { canAccessFeature } from '../utils/helpers'
import { useStore } from '../store/useStore'

export default function BatchManagement() {
  const { role } = useStore()
  const canCreate = canAccessFeature(role, 'canCreateBatch')
  const canManage = canAccessFeature(role, 'canFlagBatch')
  
  return (
    <FeatureAccess feature="canCreateBatch" allowedRoles={[1, 4, 6]}>
      <div className="space-y-6">
        {/* Common section */}
        <BrowseBatches />
        
        {/* Creator section */}
        {canCreate && <CreateBatchSection />}
        
        {/* Manager section */}
        {canManage && <ManageBatchSection />}
      </div>
    </FeatureAccess>
  )
}
```

### Pattern 2: Action-Level Permission Checks

```jsx
const handleCreate = () => {
  const { role } = useStore()
  
  if (!canAccessFeature(role, 'canCreateBatch')) {
    toast.error('You do not have permission to create batches')
    return
  }
  
  // Proceed with creation
}
```

### Pattern 3: Permission-Based Form Fields

```jsx
export default function BatchForm() {
  const { role } = useStore()
  const canEdit = canAccessFeature(role, 'canEditBatch')
  
  return (
    <form>
      <input 
        disabled={!canEdit}
        placeholder="Batch Number"
      />
      
      {canEdit && (
        <textarea 
          placeholder="Edit notes"
        />
      )}
    </form>
  )
}
```

---

## Checklist for Implementation

For each page, verify:

- [ ] Correct feature permission chosen from `FEATURE_PERMISSIONS`
- [ ] Correct allowed roles specified (1-6)
- [ ] Main page wrapped with `FeatureAccess`
- [ ] All action buttons use `PermissionButton` or have checks
- [ ] Conditional sections use `ConditionalFeature`
- [ ] Role-specific layouts implemented correctly
- [ ] Fallback UI provided for denied access
- [ ] Tooltips show helpful denial messages
- [ ] Console shows no permission-related warnings
- [ ] Tested with different roles (1, 2, 3, 4, 5, 6)
- [ ] Tested navigation to page with denied role
- [ ] Tested action buttons with denied role
- [ ] No hardcoded role numbers (use imported constants)

---

## Testing Checklist

For each implemented page:

```javascript
// Test page access
✓ Admin (1) can access
✓ Intended roles can access
✓ Other roles cannot access and see error page
✓ Redirects to dashboard when denied

// Test feature access
✓ Buttons disabled/hidden for unauthorized roles
✓ Tooltips appear on hover for disabled buttons
✓ Actions are prevented when role lacks permission
✓ Console shows permission denial if action attempted

// Test UI
✓ No console errors
✓ No broken layouts
✓ Lock icon appears for restricted items
✓ Tooltips are readable and helpful
✓ Fallback UI is professional
```

---

## Common Mistakes to Avoid

❌ **Hardcoding role numbers**
```javascript
// Bad
if (role === 1) { /* ... */ }

// Good
import { ROLES } from '../utils/permissions'
if (role === ROLES.ADMIN) { /* ... */ }
```

❌ **Forgetting to add fallback**
```javascript
// Bad - confusing when access denied
<FeatureAccess feature="canCreate">
  <CreateForm />
</FeatureAccess>

// Good - shows helpful message
<FeatureAccess 
  feature="canCreate"
  fallback={<p>You don't have permission to create</p>}
>
  <CreateForm />
</FeatureAccess>
```

❌ **Using old permission check function**
```javascript
// Bad - outdated
if (item.roles.includes(role)) { /* ... */ }

// Good - uses new system
if (canAccessFeature(role, 'canCreateBatch')) { /* ... */ }
```

❌ **Forgetting backend validation**
```javascript
// Frontend check (good for UX)
if (canAccessFeature(role, 'canCreate')) {
  // Backend must also validate!
}
```

---

## Integration Order (Recommended)

1. **Core pages first** (higher traffic):
   - [ ] PharmacyVerification.jsx
   - [ ] BatchManagement.jsx
   - [ ] Dashboard.jsx ✓ (already done)

2. **Admin pages**:
   - [ ] UserManagement.jsx
   - [ ] Analytics.jsx

3. **Role-specific pages**:
   - [ ] PatientPortal.jsx
   - [ ] RegulatorCenter.jsx
   - [ ] MedicineManagement.jsx

4. **Optional/View-only pages**:
   - [ ] ActivityLog.jsx
   - [ ] PrescriptionTemplates.jsx
   - [ ] PatientHistory.jsx
   - [ ] Leaderboard.jsx

---

## Support

For questions or issues:
1. Check `ROLE_BASED_PERMISSIONS_GUIDE.md`
2. Review `PERMISSIONS_QUICK_REFERENCE.md`
3. Look at `Dashboard.jsx` for a working example
4. Check `CreatePrescription.jsx` for page-level wrapper example

Good luck! 🚀
