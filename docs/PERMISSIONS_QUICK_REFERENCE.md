# Role-Based Permissions - Quick Reference

## Import Examples

```javascript
// Import from helpers (preferred)
import { 
  canAccessPage,
  canAccessFeature,
  getRolePermissions,
  canDispenseMedicines,
  isAdmin,
  getPermissionDenialMessage
} from '../utils/helpers'

// Import components
import { FeatureAccess, ConditionalFeature, PermissionButton, AdminOnly } from '../components/RoleProtectedComponent'
import ProtectedRoute from '../components/ProtectedRoute'

// Import store
import { useStore } from '../store/useStore'

// Import permissions constants
import { ROLES } from '../utils/permissions'
```

## Role IDs Reference

| ID | Role | Use Case |
|----|------|----------|
| 1 | Admin | Full system access, user management |
| 2 | Doctor | Create prescriptions, patient care |
| 3 | Pharmacist | Dispense medicines, verify prescriptions |
| 4 | Manufacturer | Batch creation and management |
| 5 | Patient | Access own prescriptions, patient portal |
| 6 | Regulator | Oversight, batch flagging/recall, analytics |

## Common Permission Checks

### Check if user can access a page
```javascript
const { role } = useStore()
if (!canAccessPage(role, '/batches')) {
  navigate('/') // Redirect if denied
}
```

### Check if user can perform an action
```javascript
const { role } = useStore()
const canCreate = canAccessFeature(role, 'canCreatePrescription')

if (canCreate) {
  // Show create button
}
```

### Check specific role types
```javascript
const { role } = useStore()

if (isAdmin(role)) {
  // Admin-specific code
}

if (canDispenseMedicines(role)) {
  // Dispensing logic
}

if (canCreateBatches(role)) {
  // Batch creation logic
}
```

### Get all permissions for a role
```javascript
const { role } = useStore()
const permissions = getRolePermissions(role)

console.log(permissions.features.canDispense) // true/false
console.log(permissions.pages['/batches']) // true/false
console.log(permissions.stats) // ['totalBatches', 'flaggedCount', ...]
```

## Component Usage Patterns

### Pattern 1: Wrap Entire Page (Recommended for new pages)
```jsx
import { FeatureAccess } from '../components/RoleProtectedComponent'

export default function MyPage() {
  return (
    <FeatureAccess 
      feature="canCreatePrescription"
      allowedRoles={[1, 2]}
    >
      {/* Your page content */}
    </FeatureAccess>
  )
}
```

### Pattern 2: Conditional UI Elements
```jsx
import { ConditionalFeature } from '../components/RoleProtectedComponent'

<ConditionalFeature feature="canDispense">
  <button>Dispense Medicine</button>
</ConditionalFeature>

// With fallback
<ConditionalFeature 
  feature="canDispense"
  fallback={<p>Not available for your role</p>}
>
  <button>Dispense Medicine</button>
</ConditionalFeature>
```

### Pattern 3: Permission-Aware Buttons
```jsx
import { PermissionButton } from '../components/RoleProtectedComponent'

<PermissionButton
  feature="canCreateBatch"
  onClick={createBatch}
  className="btn btn-primary"
>
  Create Batch
</PermissionButton>
```

### Pattern 4: Admin-Only Sections
```jsx
import { AdminOnly } from '../components/RoleProtectedComponent'

<AdminOnly fallback={<p>Admin access required</p>}>
  <section className="admin-panel">
    {/* Admin-only content */}
  </section>
</AdminOnly>
```

### Pattern 5: Manual Permission Check
```jsx
const { role } = useStore()
const canDispense = canAccessFeature(role, 'canDispense')

return (
  <>
    {canDispense ? (
      <button onClick={dispense}>Dispense</button>
    ) : (
      <p className="text-gray-400">Not available for your role</p>
    )}
  </>
)
```

## Navigation Sidebar (in Layout.jsx)

Navigation items are automatically disabled based on role permissions. Users see:
- **Accessible items**: Normal appearance, clickable
- **Restricted items**: Grayed out with lock icon, tooltip on hover

No additional code needed - it's handled by the Layout component!

## Error Messages

Get user-friendly permission denial messages:
```javascript
const { role } = useStore()
const message = getPermissionDenialMessage(role, 'canDispense')
// Output: "As a Patient, you don't have permission to dispense."

toast.error(message)
```

## Dashboard Customization

Dashboard automatically shows role-specific:
- **Quick Actions**: Buttons filtered by role
- **Stats Cards**: Only relevant metrics for the role
- **Widgets**: Role-appropriate dashboard widgets

No code changes needed - Dashboard.jsx handles it!

## Feature Permission List

### Prescription Features
- `canCreatePrescription` - Create new prescription
- `canEditPrescription` - Edit existing prescription
- `canDeletePrescription` - Delete prescription
- `canViewPrescriptionDetails` - View full details

### Dispensing Features
- `canDispense` - Dispense medicines
- `canVerifyPrescription` - Verify prescription validity
- `canViewPatientPrescriptions` - View patient's prescriptions

### Batch Management
- `canCreateBatch` - Create new batch
- `canEditBatch` - Edit batch details
- `canFlagBatch` - Flag batch as problematic
- `canRecallBatch` - Recall batch from circulation

### Administration
- `canManageUsers` - Add/edit/delete users
- `canEditUserRole` - Change user roles
- `canRestrictUser` - Restrict user access
- `canViewActivityLog` - View system activity
- `canViewAnalytics` - View dashboards & reports
- `canExportReports` - Export data

### Medicine & Patient Management
- `canManageMedicines` - Add/edit medicines
- `canViewMedicines` - View medicine inventory
- `canViewPatientPrescriptions` - View patient data
- `canViewOwnPrescriptions` - View own prescriptions

## Adding a New Feature

1. Add to `FEATURE_PERMISSIONS` in `src/utils/permissions.js`:
```javascript
canMyNewFeature: [ROLES.ADMIN, ROLES.DOCTOR],
```

2. Use in your component:
```javascript
const { role } = useStore()
if (canAccessFeature(role, 'canMyNewFeature')) {
  // Show feature
}
```

## Testing Permissions

```javascript
// Test Admin access
expect(canAccessFeature(1, 'canCreatePrescription')).toBe(true)
expect(canAccessFeature(1, 'canDispense')).toBe(true)

// Test Doctor access
expect(canAccessFeature(2, 'canCreatePrescription')).toBe(true)
expect(canAccessFeature(2, 'canDispense')).toBe(false)

// Test Page access
expect(canAccessPage(1, '/batches')).toBe(true)
expect(canAccessPage(5, '/batches')).toBe(false)
```

## Remember

✅ **Always check role on the frontend** for UX  
✅ **Always validate on the backend** for security  
✅ **Use FeatureAccess wrapper for new pages**  
✅ **Use ConditionalFeature for UI elements**  
✅ **Use PermissionButton for action buttons**  

❌ **Never trust frontend permissions alone**  
❌ **Never skip backend validation**  
❌ **Never hardcode role numbers** (use ROLES constant)
