### BlockMed V3 Role-Based Access (English + বাংলা)

এই ডকুমেন্টে BlockMed-এর **role-based permission system** কীভাবে কাজ করে তা English আর বাংলা মিক্স করে বোঝানো হয়েছে, সাথে গ্রাফ (diagram) আর কোড উদাহরণও আছে।

---

### 1. Roles Overview (ভূমিকা / রোল পরিচিতি)

Code: `src/utils/permissions.js` এবং `src/utils/config.js`

```javascript
export const ROLES = {
  ADMIN: 1,
  DOCTOR: 2,
  PHARMACIST: 3,
  MANUFACTURER: 4,
  PATIENT: 5,
  REGULATOR: 6,
}
```

**Mapping (Address → Role)** in Dev Mode (`src/utils/devMode.js`):

| Account Name   | Address (short)         | Role (ID)      |
|----------------|------------------------|----------------|
| Admin          | 0xf39Fd6e5...2266      | ADMIN (1)      |
| Doctor         | 0x70997970...79C8      | DOCTOR (2)     |
| Pharmacist     | 0x3C44CdDd...93BC      | PHARMACIST (3) |
| Manufacturer   | 0x90F79bf6...b906      | MANUFACTURER(4)|
| Patient        | 0x15d34AAf...6A65      | PATIENT (5)    |
| Regulator      | 0x9965507D...A4dc      | REGULATOR (6)  |

Dev Mode-এ এই mapping টি কোডে আছে (`DEV_ACCOUNTS`) এবং `LoginPage` auto-role assign করে (নিচে explain করা আছে)।

---

### 2. High-Level Graph (Diagram) – কে কোন পেজ/ফিচার দেখতে পায়?

Mermaid diagram – এক নজরে role → pages:

```mermaid
graph TD
  A[ADMIN (1)] --> D(Dashboard / All Pages)
  A --> PAll(All Features)

  B[DOCTOR (2)] --> C1(Create Prescription)
  B --> T1(Prescription Templates)
  B --> PH1(Pharmacy Verification)
  B --> PAT1(Patient Portal)
  B --> HIST1(Patient History)
  B --> MED1(Medicines)

  C[PHARMACIST (3)] --> PH2(Pharmacy Verification)
  C --> HIST2(Patient History)
  C --> MED2(Medicines • Dispense)

  M[MANUFACTURER (4)] --> B1(Batch Management • Create)

  P[PATIENT (5)] --> PAT2(Patient Portal)
  P --> PH3(Pharmacy Verification • View Only)

  R[REGULATOR (6)] --> AN(Analytics)
  R --> B2(Batch Management)
  R --> ACT(Activity Log)
```

বাংলায় সারাংশ:

- **Admin** সব পেজ + সব ফিচার অ্যাক্সেস করতে পারে (full power).
- **Doctor** prescriptions create/মেনেজ + pharmacy verify + patient portal/history + medicines।
- **Pharmacist** verification portal + patient history + medicines dispense।
- **Manufacturer** শুধু **Batch Management** (create/manage batches)।
- **Patient** শুধু নিজস্ব portal + verification (view mode)।
- **Regulator** analytics, batch overview, activity log – অর্থাৎ **monitoring & supervision**।

---

### 3. Page-Level Permissions (Page Access – কোন URL কে দেখতে পাবে?)

Code: `src/utils/permissions.js` – `PAGE_PERMISSIONS`

```javascript
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
```

**Core function (English + বাংলা ব্যাখ্যা):**

```javascript
export const canAccessPage = (roleId, path) => {
  const normalizedRole = normalizeRoleId(roleId)
  if (!normalizedRole || !path) return false
  if (normalizedRole === ROLES.ADMIN) return true

  const allowedRoles = PAGE_PERMISSIONS[path]
  return Array.isArray(allowedRoles) ? allowedRoles.includes(normalizedRole) : false
}
```

- `normalizeRoleId` role কে ১–৬ এর মধ্যে safe integer বানায়।
- যদি role `ADMIN` হয়, **directly true** – সব পেজ allow।
- অন্যসব ক্ষেত্রে `PAGE_PERMISSIONS` থেকে URL অনুযায়ী allowed list নিয়ে `includes` চেক করা হয়।
- অর্থাৎ **এখানেই সব routing decision হচ্ছে**।

---

### 4. Feature-Level Permissions (Button / Action Lock করা)

Code: `FEATURE_PERMISSIONS` + `canAccessFeature`

```javascript
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

export const canAccessFeature = (roleId, feature) => {
  const normalizedRole = normalizeRoleId(roleId)
  if (!normalizedRole || !feature) return false
  if (normalizedRole === ROLES.ADMIN) return true

  const allowedRoles = FEATURE_PERMISSIONS[feature]
  return Array.isArray(allowedRoles) ? allowedRoles.includes(normalizedRole) : false
}
```

বাংলা ব্যাখ্যা:

- `FEATURE_PERMISSIONS` হলো **feature-level policy** table (button / action allow-list)।
- `canAccessFeature` ফাংশন:
  - role normalize করে।
  - Admin হলে সব feature allow করে।
  - নইলে `FEATURE_PERMISSIONS[feature]` থেকে allowed roles বের করে `includes` করে।
- উদাহরণ:
  - `canCreateBatch` → Admin + Manufacturer + Regulator (অন্য কেউ batch create করতে পারবে না)।
  - `canDispense` → শুধু Admin + Pharmacist (patient / doctor এই action পেলেও disabled থাকবে)।

---

### 5. Routing & Layout Integration (React Router + Sidebar)

#### 5.1 Protected Routes (পেজে ঢোকার আগে গেটকিপার)

Code: `src/components/ProtectedRoute.jsx`

```javascript
const ProtectedRoute = ({ children, requiredPage }) => {
  const { role, user, account } = useStore()
  const location = useLocation()
  const currentRole = normalizeRoleId(role ?? user?.role)

  if (!account) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  const hasAccess = canAccessPage(currentRole, requiredPage || location.pathname)

  if (!hasAccess) {
    console.warn(`Access denied: User with role ${currentRole} cannot access ${location.pathname}`)
    return <Navigate to="/" replace />
  }

  return children
}
```

বাংলায়:

- User লগইন না থাকলে → `"/"` (login) এ redirect।
- লগইন থাকলে, `currentRole` নিয়ে `canAccessPage` call হয়।
- যদি false হয় → ড্যাশবোর্ডে redirect (page-level security)।
- তাই **URL direct hit করলেও** unauthorized user ভেতরে ঢুকতে পারে না।

#### 5.2 Sidebar / Navigation (কোন menu item enable/disable হবে?)

Code: `src/components/Layout.jsx` – অংশবিশেষ:

```javascript
const navItems = [
  { path: '/', icon: FiHome, label: t('nav.dashboard') },
  { path: '/prescription/create', icon: FiFileText, label: t('nav.createPrescription') },
  // ...
  { path: '/analytics', icon: FiPieChart, label: t('nav.analytics') },
  { path: '/regulator', icon: FiShield, label: 'Regulator Center' },
  { path: '/activity', icon: FiActivity, label: 'Activity Log' },
]

// inside render
const canAccess = canAccessPage(currentRole, item.path)

return (
  <div key={item.path} className="relative group">
    {canAccess ? (
      <Link to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
        {/* normal clickable item */}
      </Link>
    ) : (
      <div
        className="nav-item opacity-40 cursor-not-allowed"
        title={`Access restricted: ${getRoleName(currentRole)} role cannot access ${item.label}`}
      >
        {/* disabled item with "Restricted" badge */}
      </div>
    )}
  </div>
)
```

বাংলা ব্যাখ্যা:

- Sidebar-এর প্রতিটি item-এর জন্য `canAccessPage(currentRole, item.path)` use হচ্ছে।
- `true` হলে normal clickable link, `false` হলে **dimmed + “Restricted” badge**।
- তাই **UI level** এও user বুঝতে পারে কোন জিনিস তার role-এর বাইরে।

---

### 6. Dev Mode: Auto-Assign Roles Without On-Chain Registration

Problem: Dev Mode-এ নতুন Hardhat chain হলে `getUser(account)` কিছুই পায় না, ফলে `role` null → সবকিছু restricted (Admin ছাড়া)।

Solution: `LoginPage.jsx`–এ **Dev Mode fallback**:

```javascript
// after trying getUser(account) from contract...
let userLoadedFromChain = false
try {
  const userInfo = await contract.getUser(account)
  if (userInfo && userInfo.role !== 0n) {
    setUser({ address: userInfo.userAddress, role: Number(userInfo.role), /* ... */ })
    userLoadedFromChain = true
  }
} catch (err) {
  console.log('User not found on-chain:', err?.message || err)
}

// Dev Mode fallback: infer role from DEV_ACCOUNTS
if (!userLoadedFromChain && isDevModeConnection) {
  const devAccountConfig = DEV_ACCOUNTS.find(
    (acc) => acc.address.toLowerCase() === String(account).toLowerCase()
  )

  if (devAccountConfig) {
    const roleMap = {
      ADMIN: ROLES.ADMIN,
      DOCTOR: ROLES.DOCTOR,
      PHARMACIST: ROLES.PHARMACIST,
      MANUFACTURER: ROLES.MANUFACTURER,
      PATIENT: ROLES.PATIENT,
      REGULATOR: ROLES.REGULATOR,
    }

    const mappedRole = roleMap[devAccountConfig.role] || ROLES.PATIENT

    setUser({
      address: account,
      role: mappedRole,
      name: devAccountConfig.name,
      licenseNumber: devAccountConfig.role,
      isVerified: true,
      isActive: true,
      registeredAt: Math.floor(Date.now() / 1000),
    })

    return
  }
}

if (!userLoadedFromChain) {
  setShowRegister(true)
}
```

বাংলা ব্যাখ্যা:

- Dev Mode-এ **smart-contract user table খালি থাকলেও**, address থেকে `DEV_ACCOUNTS` দেখে role assign করা হয়।
- যেমন:
  - `0x9965507D...A4dc` → `REGULATOR` → numeric role `6` → Regulator এর সব permission পেয়ে যায়।
- এতে আপনাকে বারবার registration / verification না করেই **ready-made demo roles** দিয়ে system test করতে দেয়।

---

### 7. Dashboard Widgets per Role (Quick Actions & Stats)

Code: `DASHBOARD_WIDGETS` (`src/utils/permissions.js`)

```javascript
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
```

Dashboard (`src/pages/Dashboard.jsx`) এ:

```javascript
const currentRole = normalizeRoleId(role ?? user?.role)
const rolePermissions = getRolePermissions(currentRole)

// quick actions filter:
const quickActions = allQuickActions.filter((action) =>
  rolePermissions.quickActions.includes(action.id) &&
  canAccessFeature(currentRole, action.feature)
)

// stats filter:
const visibleStatCards = statCards.filter((card) =>
  rolePermissions.stats.includes(card.id)
)
```

বাংলা সারাংশ:

- প্রত্যেক role-এর **নিজস্ব quick actions** আর **stats cards** আছে।
- `getRolePermissions` internally `DASHBOARD_WIDGETS` থেকে সেই role-এর list বানিয়ে Dashboard-এ পাঠায়।
- ফলে একই Dashboard component, কিন্তু **Doctor vs Regulator vs Patient**–এর view আলাদা।

---

### 8. Mental Model Summary (সহজ ভাষায় সারাংশ)

১. **Role নির্ধারণ**  
- On-chain `getUser(account).role` থেকে, অথবা  
- Dev Mode fallback → `DEV_ACCOUNTS` mapping → numeric `ROLES`।

২. **Page Access**  
- `canAccessPage(role, path)` → `PAGE_PERMISSIONS[path]` check করে।
- Router (`ProtectedRoute`) আর sidebar (`Layout`) – দুই জায়গায়ই use হয়।

৩. **Feature Access**  
- `canAccessFeature(role, feature)` → `FEATURE_PERMISSIONS[feature]` check করে।
- Buttons, actions, sections – সবখানে এই function দিয়ে lock/unlock।

৪. **Dashboard Personalization**  
- `DASHBOARD_WIDGETS` + `getRolePermissions` → কোন quick actions / stats দেখাবে।

৫. **Result**  
- **Only Admin সব কিছু পায়**, আর বাকি roles ঠিক Table অনুযায়ী সীমাবদ্ধ access পায় — একসাথে security, UX, আর demo convenience নিশ্চিত করে।

