# Page Permission Implementation Template

Use this template when implementing role-based access control on any page.

---

## Template 1: Simple Page Protection (No Internal Variations)

For pages where all users who can access can do everything.

```javascript
import PageAccessControl from '../components/PageAccessControl'
import { ROLES } from '../utils/permissions'

const MyPage = () => {
  return (
    <PageAccessControl 
      requiredRoles={[ROLES.ADMIN, ROLES.DOCTOR]} 
      pageTitle="My Page Title"
    >
      <div className="page-content">
        {/* All content visible to all allowed roles */}
      </div>
    </PageAccessControl>
  )
}

export default MyPage
```

---

## Template 2: Page with Role-Specific Features

For pages where different roles see different buttons/sections.

```javascript
import PageAccessControl from '../components/PageAccessControl'
import { RestrictedAction, FeatureAccess, DoctorOnly } from '../components/FeatureAccessControl'
import { canAccessFeature } from '../utils/permissions'
import { useStore } from '../store/useStore'

const MyPage = () => {
  const { role } = useStore()

  return (
    <PageAccessControl 
      requiredRoles={[1, 2, 3]} 
      pageTitle="Prescription Management"
    >
      <div className="page-content">
        {/* Section 1: Visible to all allowed roles */}
        <div className="prescriptions-list">
          <h2>Prescriptions</h2>
          {/* List content */}
        </div>

        {/* Section 2: Only visible to doctors */}
        <DoctorOnly>
          <div className="create-section">
            <h3>Create New Prescription</h3>
            {/* Create form */}
          </div>
        </DoctorOnly>

        {/* Section 3: Visible but disabled if can't access feature */}
        <div className="actions">
          <RestrictedAction feature="canVerifyPrescription">
            <button onClick={handleVerify} className="btn-primary">
              Verify
            </button>
          </RestrictedAction>

          <RestrictedAction feature="canDispense">
            <button onClick={handleDispense} className="btn-primary">
              Dispense
            </button>
          </RestrictedAction>
        </div>

        {/* Section 4: Complete feature hiding */}
        <FeatureAccess feature="canEditPrescription" fallback={null}>
          <div className="edit-section">
            <h3>Edit Prescription</h3>
            {/* Edit form */}
          </div>
        </FeatureAccess>
      </div>
    </PageAccessControl>
  )
}

export default MyPage
```

---

## Template 3: Multi-Tab Page with Role-Based Tabs

For pages with tabs where different roles see different tabs.

```javascript
import { useState } from 'react'
import PageAccessControl from '../components/PageAccessControl'
import { AdminOnly, RoleBasedContent } from '../components/FeatureAccessControl'
import { ROLES } from '../utils/permissions'
import { useStore } from '../store/useStore'

const MyPage = () => {
  const { role } = useStore()
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', roles: [1, 2, 3, 4, 5, 6] },
    { id: 'details', label: 'Details', roles: [1, 2, 3] },
    { id: 'admin', label: 'Admin', roles: [1] },
    { id: 'analytics', label: 'Analytics', roles: [1, 6] },
  ]

  // Filter tabs by role
  const visibleTabs = tabs.filter(tab => tab.roles.includes(role))

  return (
    <PageAccessControl 
      requiredRoles={[1, 2, 3, 4, 5, 6]} 
      pageTitle="Dashboard"
    >
      <div className="page-content">
        {/* Tabs */}
        <div className="tabs">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'details' && <DetailsTab />}
          {activeTab === 'admin' && <AdminOnly><AdminTab /></AdminOnly>}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>
    </PageAccessControl>
  )
}

export default MyPage
```

---

## Template 4: CRUD Operations with Granular Permissions

For pages with create/read/update/delete operations.

```javascript
import { useState } from 'react'
import PageAccessControl from '../components/PageAccessControl'
import { RestrictedAction, FeatureAccess } from '../components/FeatureAccessControl'
import { canAccessFeature } from '../utils/permissions'
import { useStore } from '../store/useStore'

const MyPage = () => {
  const { role } = useStore()
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)

  return (
    <PageAccessControl 
      requiredRoles={[1, 2, 3]} 
      pageTitle="Item Management"
    >
      <div className="page-content">
        {/* CREATE */}
        <RestrictedAction feature="canCreateItem">
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            + New Item
          </button>
        </RestrictedAction>

        {showForm && canAccessFeature(role, 'canCreateItem') && (
          <CreateItemForm 
            onSubmit={(item) => {
              setItems([...items, item])
              setShowForm(false)
            }}
          />
        )}

        {/* READ */}
        <div className="items-list">
          {items.map(item => (
            <div key={item.id} className="item-card">
              <h3>{item.name}</h3>
              <p>{item.description}</p>

              {/* UPDATE */}
              <RestrictedAction feature="canEditItem">
                <button 
                  onClick={() => editItem(item.id)}
                  className="btn-secondary"
                >
                  Edit
                </button>
              </RestrictedAction>

              {/* DELETE */}
              <RestrictedAction feature="canDeleteItem">
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </RestrictedAction>
            </div>
          ))}
        </div>
      </div>
    </PageAccessControl>
  )
}

export default MyPage
```

---

## Template 5: Dashboard with Role-Specific Widgets

For dashboard pages with different widgets per role.

```javascript
import { DASHBOARD_WIDGETS } from '../utils/permissions'
import { useStore } from '../store/useStore'
import PageAccessControl from '../components/PageAccessControl'

const Dashboard = () => {
  const { role } = useStore()

  // Get role-specific widgets
  const quickActions = DASHBOARD_WIDGETS.quickActions[role] || []
  const stats = DASHBOARD_WIDGETS.stats[role] || []

  return (
    <PageAccessControl requiredRoles={[1, 2, 3, 4, 5, 6]}>
      <div className="dashboard">
        {/* Quick Actions Section */}
        {quickActions.length > 0 && (
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              {quickActions.includes('createPrescription') && (
                <QuickActionCard 
                  title="Create Prescription"
                  icon={FiFileText}
                  onClick={() => navigate('/prescription/create')}
                />
              )}
              {quickActions.includes('manageBatches') && (
                <QuickActionCard 
                  title="Manage Batches"
                  icon={FiBox}
                  onClick={() => navigate('/batches')}
                />
              )}
              {quickActions.includes('viewAnalytics') && (
                <QuickActionCard 
                  title="View Analytics"
                  icon={FiPieChart}
                  onClick={() => navigate('/analytics')}
                />
              )}
              {/* ... more quick actions ... */}
            </div>
          </div>
        )}

        {/* Stats Section */}
        {stats.length > 0 && (
          <div className="stats">
            <h2>Statistics</h2>
            <div className="stat-cards">
              {stats.includes('totalPrescriptions') && (
                <StatCard 
                  title="Total Prescriptions"
                  value={totalPrescriptions}
                  icon={FiFileText}
                />
              )}
              {stats.includes('totalBatches') && (
                <StatCard 
                  title="Total Batches"
                  value={totalBatches}
                  icon={FiBox}
                />
              )}
              {stats.includes('dispensedCount') && (
                <StatCard 
                  title="Dispensed"
                  value={dispensedCount}
                  icon={FiCheckCircle}
                />
              )}
              {/* ... more stats ... */}
            </div>
          </div>
        )}

        {/* Role-Specific Sections */}
        {role === ROLES.ADMIN && <AdminDashboard />}
        {role === ROLES.DOCTOR && <DoctorDashboard />}
        {role === ROLES.PHARMACIST && <PharmacistDashboard />}
        {/* ... etc ... */}
      </div>
    </PageAccessControl>
  )
}

export default Dashboard
```

---

## Template 6: Data Table with Role-Based Actions

For displaying tables with role-specific columns/actions.

```javascript
import PageAccessControl from '../components/PageAccessControl'
import { RestrictedAction } from '../components/FeatureAccessControl'
import { canAccessFeature } from '../utils/permissions'
import { useStore } from '../store/useStore'

const DataTablePage = () => {
  const { role } = useStore()
  const [data, setData] = useState([])

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    // Only show role-specific columns
    ...(canAccessFeature(role, 'canViewDetails') 
      ? [{ key: 'details', label: 'Details' }] 
      : []
    ),
    ...(canAccessFeature(role, 'canViewCost') 
      ? [{ key: 'cost', label: 'Cost' }] 
      : []
    ),
  ]

  return (
    <PageAccessControl requiredRoles={[1, 2, 3]}>
      <div className="page-content">
        <h1>Data Table</h1>
        
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.id}>
                {columns.map(col => (
                  <td key={col.key}>{row[col.key]}</td>
                ))}
                <td className="actions">
                  <RestrictedAction feature="canViewItem">
                    <button onClick={() => viewItem(row.id)}>View</button>
                  </RestrictedAction>
                  
                  <RestrictedAction feature="canEditItem">
                    <button onClick={() => editItem(row.id)}>Edit</button>
                  </RestrictedAction>
                  
                  <RestrictedAction feature="canDeleteItem">
                    <button onClick={() => deleteItem(row.id)}>Delete</button>
                  </RestrictedAction>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageAccessControl>
  )
}

export default DataTablePage
```

---

## Common Features to Protect

When implementing these templates, common features to check:

```javascript
// Prescriptions
'canCreatePrescription'
'canEditPrescription'
'canDeletePrescription'
'canViewPrescriptionDetails'

// Pharmacy
'canDispense'
'canVerifyPrescription'

// Batches
'canCreateBatch'
'canEditBatch'
'canFlagBatch'
'canRecallBatch'

// Users
'canManageUsers'
'canEditUserRole'
'canRestrictUser'

// Analytics
'canViewAnalytics'
'canExportReports'
```

---

## Import Checklist

For each template, ensure you import:

```javascript
// Page Protection
import PageAccessControl from '../components/PageAccessControl'

// Feature Protection
import { 
  FeatureAccess, 
  RestrictedAction,
  RoleBasedContent,
  AdminOnly,
  DoctorOnly,
  PatientOnly,
  PharmacistOnly
} from '../components/FeatureAccessControl'

// Permission Constants
import { ROLES, DASHBOARD_WIDGETS } from '../utils/permissions'

// Helper Functions
import { canAccessFeature, DASHBOARD_WIDGETS } from '../utils/permissions'

// Store
import { useStore } from '../store/useStore'
```

---

## Quick Checklist

When implementing a page:

- [ ] Import PageAccessControl
- [ ] Wrap entire component with PageAccessControl
- [ ] Set requiredRoles to correct array
- [ ] Set pageTitle to page name
- [ ] Import FeatureAccess/RestrictedAction for buttons
- [ ] Check each button's required feature
- [ ] Wrap sensitive features with permission component
- [ ] Test as each role
- [ ] Verify access denied shows correct message
- [ ] Verify buttons are disabled properly
- [ ] Test direct URL navigation to page

---

## Testing Each Template

```javascript
// Test as different roles
const roles = [1, 2, 3, 4, 5, 6]

roles.forEach(role => {
  // Set role in store
  // Navigate to page
  // Check visible elements
  // Try restricted actions
  // Verify feedback message
})
```
