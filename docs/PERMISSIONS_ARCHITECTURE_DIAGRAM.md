# BlockMed Permissions System - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER AUTHENTICATION                          │
│                                                                   │
│  User Logs In → Role Assigned (1-6) → Stored in useStore()     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NAVIGATION LAYER                              │
│                     (Layout.jsx)                                 │
│                                                                   │
│  For each nav item:                                              │
│    canAccessPage(role, path) → Show/Hide menu item              │
│                                                                   │
│  ✅ Menu items filtered by role                                 │
│  ✅ Breadcrumb shows current page                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PAGE ACCESS LAYER                             │
│               (PageAccessControl component)                      │
│                                                                   │
│  Page Navigation:                                                │
│    1. User navigates to page                                    │
│    2. PageAccessControl checks requiredRoles                    │
│    3. If role not in list → Show access denied                 │
│    4. If role in list → Render page content                    │
│                                                                   │
│  ✅ Prevents unauthorized page access                           │
│  ✅ Shows friendly denial message                               │
│  ✅ Prevents direct URL access to restricted pages              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PAGE CONTENT LAYER                             │
│              (Individual Page Components)                        │
│                                                                   │
│  Page renders with:                                              │
│    - All content accessible to allowed roles                    │
│    - Dynamic features based on role                             │
│    - Feature-level permission checks                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   FEATURE ACCESS LAYER                           │
│            (FeatureAccess / RestrictedAction)                   │
│                                                                   │
│  For each feature/button:                                       │
│                                                                   │
│  Method 1 - Hide Completely:                                    │
│    <FeatureAccess feature="canCreatePrescription">             │
│      <CreateForm />                                             │
│    </FeatureAccess>                                             │
│                                                                   │
│  Method 2 - Show Disabled:                                      │
│    <RestrictedAction feature="canDelete">                       │
│      <button>Delete</button>                                    │
│    </RestrictedAction>                                          │
│                                                                   │
│  Method 3 - Conditional Rendering:                              │
│    {canAccessFeature(role, 'feature') && <Component />}        │
│                                                                   │
│  ✅ Prevents unauthorized action execution                      │
│  ✅ Shows why action is disabled                                │
│  ✅ Improves user experience                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Permission Check Flow

```
┌─────────────┐
│ User Action │
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────────────┐
│ Check Permission                         │
│ canAccessFeature(role, 'featureName')    │
└────────┬─────────────────────────────────┘
         │
         ├─→ Is Admin (Role 1)?
         │   └─→ YES → ✅ Allow
         │   └─→ NO  → Continue
         │
         ├─→ Is feature in FEATURE_PERMISSIONS?
         │   └─→ NO  → ❌ Deny
         │   └─→ YES → Continue
         │
         ├─→ Is role in allowedRoles list?
         │   └─→ YES → ✅ Allow
         │   └─→ NO  → ❌ Deny
         │
         ↓
┌──────────────────────────────────────────┐
│ Handle Result                            │
├──────────────────────────────────────────┤
│ ALLOWED:                                 │
│  - Show component/button                 │
│  - Enable button                         │
│  - Allow action execution                │
│                                          │
│ DENIED:                                  │
│  - Hide component (FeatureAccess)        │
│  - Show disabled button (RestrictedAction)
│  - Show "Access Denied" message          │
│  - Prevent action execution              │
└──────────────────────────────────────────┘
```

---

## Data Flow for Role-Based Access

```
                    ┌─────────────────────┐
                    │  PERMISSION CONFIG  │
                    │  (permissions.js)   │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ↓                      ↓                      ↓
    ┌─────────┐         ┌─────────────┐      ┌─────────────────┐
    │  ROLES  │         │    PAGES    │      │    FEATURES     │
    ├─────────┤         ├─────────────┤      ├─────────────────┤
    │ Admin:1 │         │'/':ALL      │      │canCreate:1,2    │
    │Doctor:2 │         │'/bx':[1,4,6]│      │canDispense:1,3  │
    │Pharmacist:3        │'/rx':[1,2]  │      │canEdit:1,2      │
    │Mfr:4   │         │...         │      │...             │
    │Patient:5│         └─────────────┘      └─────────────────┘
    │Reg:6   │
    └─────────┘
        │
        │ Each user has ONE role
        │
        ↓
    ┌─────────────────────────────────┐
    │  useStore().role                │
    │  (e.g., role = 2 for Doctor)    │
    └──────────┬──────────────────────┘
               │
               ├─→ canAccessPage(2, '/bx') 
               │   → allowedRoles = [1,4,6]
               │   → 2 not in list → ❌ DENY
               │
               ├─→ canAccessPage(2, '/rx')
               │   → allowedRoles = [1,2]
               │   → 2 in list → ✅ ALLOW
               │
               └─→ canAccessFeature(2, 'canCreate')
                   → allowedRoles = [1,2]
                   → 2 in list → ✅ ALLOW
```

---

## Component Hierarchy and Permission Checks

```
┌─────────────────────────────────────────────────────────┐
│                      App Root                            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│                  Layout Component                        │
│  • Shows/hides nav items based on canAccessPage()       │
│  • Displays user role badge                             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
            ┌──────────────────────┐
            │   Router / Routes    │
            └──────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
    ┌────────┐  ┌────────────┐  ┌─────────────┐
    │Dashboard│  │Prescriptions│  │Pharmacy Verify│
    └────────┘  └────────────┘  └─────────────┘
        │              │              │
        ↓              ↓              ↓
┌──────────────────────────────────────────────────────────┐
│        PageAccessControl (Page-level check)              │
│  requiredRoles={[1, 2]}                                  │
│  • Checks user role against allowedRoles                │
│  • Shows access denied if no match                       │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ↓
            ┌──────────────────────┐
            │   Page Content       │
            │  (if allowed)        │
            └──────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│FeatureAccess     │ │RestrictedAction│RoleBasedContent│
│(hide feature)    │ │(disable button)│(conditional)   │
└──────────────────┘ └──────────────┘ └──────────────────┘
        │              │              │
        ↓              ↓              ↓
   Component      Button/Action    Content
   Hidden/Shown   Disabled/Enabled  Shown/Hidden
```

---

## Role-Based Access Matrix Visualization

```
Legend: ✅ = Can Access  ❌ = Cannot Access

                Admin  Doctor  Pharmacist  Manufacturer  Patient  Regulator
PAGES
─────
Dashboard       ✅     ✅       ✅          ✅           ✅       ✅
Create Rx       ✅     ✅       ❌          ❌           ❌       ❌
Pharmacy        ✅     ❌       ✅          ❌           ✅       ❌
Batches         ✅     ❌       ❌          ✅           ❌       ✅
Analytics       ✅     ❌       ❌          ❌           ❌       ✅
Users           ✅     ❌       ❌          ❌           ❌       ❌

FEATURES
────────
Create Rx       ✅     ✅       ❌          ❌           ❌       ❌
Verify Rx       ✅     ❌       ✅          ❌           ❌       ❌
Dispense        ✅     ❌       ✅          ❌           ❌       ❌
Create Batch    ✅     ❌       ❌          ✅           ❌       ❌
Flag Batch      ✅     ❌       ❌          ❌           ❌       ✅
View Analytics  ✅     ❌       ❌          ❌           ❌       ✅
```

---

## Permission System Layers

```
┌────────────────────────────────────────────────────────────┐
│  LAYER 1: AUTHENTICATION                                   │
│  User → Login → Role Assignment → useStore()               │
└────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────┐
│  LAYER 2: NAVIGATION (Layout.jsx)                          │
│  Menu items filtered by canAccessPage()                    │
│  ✅ User sees only accessible navigation items             │
└────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────┐
│  LAYER 3: PAGE ACCESS (PageAccessControl)                  │
│  Routes protected by requiredRoles                         │
│  ✅ User cannot access restricted pages                    │
│  ✅ Even with direct URL, gets access denied              │
└────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────┐
│  LAYER 4: FEATURE ACCESS (FeatureAccess/RestrictedAction) │
│  Buttons/components protected by feature permissions       │
│  ✅ User cannot see/use restricted features               │
│  ✅ Disabled buttons show why they're disabled            │
└────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────┐
│  LAYER 5: ACTION EXECUTION (Backend/Smart Contract)        │
│  ⚠️  TODO: Backend must also enforce permissions           │
│  ⚠️  TODO: Smart contract must validate role before action │
└────────────────────────────────────────────────────────────┘
```

---

## Helper Function Decision Tree

```
                      ┌─ Do you need to:
                      │
        ┌─────────────┼─────────────┬──────────────┐
        │             │             │              │
        ↓             ↓             ↓              ↓
    Check if      Check if      Hide entire    Show disabled
    role has      role can      component?     button?
    access to     access to
    a PAGE?       FEATURE?
        │             │             │              │
        ↓             ↓             ↓              ↓
    USE:          USE:           USE:            USE:
canAccessPage() canAccessFeature() FeatureAccess RestrictedAction
        │             │             │              │
        ↓             ↓             ↓              ↓
    Example:     Example:       Example:        Example:
if (              if (            <Feature     <Restricted
  canAccess      canAccess        Access        Action
  Page(          Feature(         feature=     feature=
  role,          role,            "can       "canDelete"
  '/bx')         'canCreate')     Create">    >
) {                {              <Form/>      <button>
  // Allowed      // Show        </Feature    Delete
}                 }               Access>      </Restricted
                                               Action>
```

---

## State Flow Diagram

```
        User Logs In
            │
            ↓
    ┌──────────────┐
    │ Check Role   │
    │ = 2 (Doctor) │
    └──────┬───────┘
           │
           ├─→ Store in useStore()
           │   role: 2
           │
           ↓
    ┌──────────────────────┐
    │ Navigate to Page     │
    │ /prescription/create │
    └──────┬───────────────┘
           │
           ↓
    ┌─────────────────────────────────────┐
    │ PageAccessControl Check             │
    │ requiredRoles = [1, 2]              │
    │ role (2) in [1, 2]? → YES → ✅     │
    └──────┬──────────────────────────────┘
           │
           ↓
    ┌──────────────────────┐
    │ Page Renders         │
    │                      │
    │ ┌─────────────────┐  │
    │ │FeatureAccess:   │  │
    │ │canCreate: [1,2] │  │
    │ │role 2 in [1,2]? │  │
    │ │YES → Show Form  │  │
    │ └─────────────────┘  │
    │                      │
    │ ┌─────────────────┐  │
    │ │RestrictedAction:│  │
    │ │canDelete: [1]   │  │
    │ │role 2 in [1]?   │  │
    │ │NO → Disable Btn │  │
    │ └─────────────────┘  │
    └──────────────────────┘
           │
           ↓
    ┌──────────────────────┐
    │ User Sees:           │
    │ ✅ Create Form       │
    │ ⛔ Delete (disabled) │
    └──────────────────────┘
```

---

## File Dependency Graph

```
src/utils/permissions.js
    │
    ├─ Exports: ROLES, PAGE_PERMISSIONS, FEATURE_PERMISSIONS
    ├─ Exports: Helper functions (canAccessPage, canAccessFeature, etc.)
    └─ Imported by: Components and Pages
        │
        ├─→ Layout.jsx (uses canAccessPage)
        ├─→ PageAccessControl.jsx (uses canAccessPage)
        ├─→ FeatureAccessControl.jsx (uses canAccessFeature)
        ├─→ CreatePrescription.jsx
        ├─→ Dashboard.jsx (uses DASHBOARD_WIDGETS)
        └─→ All other pages (to be protected)

useStore() (src/store/useStore.js)
    │
    ├─ Stores: role (1-6)
    └─ Used by: All pages and components
        │
        ├─→ Layout.jsx
        ├─→ PageAccessControl.jsx
        ├─→ FeatureAccessControl.jsx
        └─→ All pages
```

---

## Message Flow - Permission Denied Scenarios

```
Scenario 1: Patient tries to access /prescription/create

Patient (role 5) → Navigate to /prescription/create
                    │
                    ↓
                    PageAccessControl
                    requiredRoles = [1, 2]
                    5 in [1, 2]? NO
                    │
                    ↓
                    ┌─────────────────────────────┐
                    │ Access Denied Screen        │
                    │ "You don't have permission" │
                    │ "Only Admin/Doctor can do"  │
                    │ [Go Back Button]            │
                    └─────────────────────────────┘


Scenario 2: Doctor tries to delete prescription

Doctor (role 2) → Click Delete Button
                    │
                    ↓
                    RestrictedAction
                    feature = "canDelete"
                    allowedRoles = [1]
                    2 in [1]? NO
                    │
                    ↓
                    ┌──────────────────────┐
                    │ Button Disabled       │
                    │ Tooltip: "Restricted" │
                    │ [Delete] (grayed out)│
                    └──────────────────────┘


Scenario 3: Pharmacist tries to create batch

Pharmacist (role 3) → Navigate to /batches
                        │
                        ↓
                        Page loads (allowed)
                        │
                        ↓
                        Click "Create Batch"
                        │
                        ↓
                        FeatureAccess
                        feature = "canCreateBatch"
                        allowedRoles = [1, 4]
                        3 in [1, 4]? NO
                        │
                        ↓
                        ┌──────────────────────────┐
                        │ Create Form Hidden       │
                        │ (Component not rendered) │
                        │ Shows: "Feature Locked"  │
                        └──────────────────────────┘
```

---

## Summary

This permission system provides **5 layers of protection**:

1. **Navigation**: Only show accessible menu items
2. **Page Access**: Prevent unauthorized page access
3. **Feature Access**: Hide/disable restricted features
4. **Button State**: Disable buttons with explanation
5. **Backend** (TODO): Validate on server/contract

All protected by centralized, easy-to-manage configuration in `src/utils/permissions.js`.

---

*This diagram represents BlockMed Role-Based Permissions System - Version 1.0*
