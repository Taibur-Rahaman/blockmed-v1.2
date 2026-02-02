# 🔐 Super Admin User Control Portal – Complete Guide

## 🎯 Feature Overview

Enhanced **Super Admin User Control Portal** with real-time login tracking, comprehensive account control, and granular access management. Super Administrators can monitor active users in real-time and control their access to system features.

**BlockMed V1.2:** Admin can also **dispense** prescriptions and from batches (onlyPharmacistOrAdmin in BlockMedV2). Use **Dev Mode** (Settings → Blockchain Setup or login page) for Admin account #0 when testing locally.

---

## ✨ Complete Feature List

### 1. **Super Admin Only Access** 🛡️
- ✅ Restricted to Super Admin role only (Role ID: 1)
- ✅ Access denied page for non-admin users
- ✅ Clear indication of Super Admin privileges
- ✅ Navigation hidden for non-admin users

### 2. **Real-Time Login Tracking** 🟢
- ✅ **Live User Activity** - See who's currently logged in
- ✅ **Last Seen Timestamps** - Track when users were last active
- ✅ **Online Status Indicators** - Green dot shows active users
- ✅ **Auto-Refresh** - Updates every 5 seconds automatically
- ✅ **Session Tracking** - Track user sessions with unique IDs
- ✅ **Activity Timeline** - View user activity history

### 3. **User Restriction System** 🔒
- ✅ **Temporary Restrictions** - Restrict users for 1, 3, 7, 14, 30, 60, or 90 days
- ✅ **Permanent Restrictions** - Permanently restrict user access
- ✅ **Reason Tracking** - Record reason for each restriction
- ✅ **Auto-Expiration** - Temporary restrictions automatically expire
- ✅ **Restriction History** - Track all restrictions with timestamps
- ✅ **Visual Indicators** - Red badges and icons for restricted users

### 4. **Access Control Management** ⚙️
- ✅ **Feature-Level Permissions**:
  - Create Prescriptions (`canCreatePrescription`)
  - Dispense Prescriptions (`canDispense`)
  - Create Medicine Batches (`canCreateBatch`)
  - View Analytics (`canViewAnalytics`)
  - Manage Users (`canManageUsers`)
- ✅ **Granular Control** - Enable/disable features per user
- ✅ **Real-Time Enforcement** - Changes apply immediately
- ✅ **Navigation Filtering** - Hidden menu items for disabled features

### 5. **User Management Actions** 👥
- ✅ **Verify Users** - Verify pending user registrations
- ✅ **Deactivate Users** - Permanently deactivate users
- ✅ **Restrict Users** - Temporarily or permanently restrict access
- ✅ **Remove Restrictions** - Lift restrictions when needed
- ✅ **Force Logout** - Instantly log out active users
- ✅ **Control Access** - Manage feature-level permissions
- ✅ **View User Status** - See restriction status, expiration dates, online status

### 6. **Advanced Filtering & Search** 🔍
- ✅ Filter by: All, Pending, Verified, Inactive, Restricted
- ✅ Search by name, address, or license number
- ✅ Real-time badge counts
- ✅ Online user filtering

### 7. **Statistics Dashboard** 📊
- ✅ **Total Users** - All registered users
- ✅ **Online Now** 🟢 - Currently active users (with pulsing dot)
- ✅ **Pending Users** - Unverified users
- ✅ **Verified Users** - Verified active users
- ✅ **Inactive Users** - Deactivated users
- ✅ **Restricted Users** - Users with active restrictions

### 8. **Real-Time Activity Panel** 📈
- ✅ **Currently Online** - Count of active users
- ✅ **Total Sessions** - Active session count
- ✅ **Last Update** - Timestamp of last refresh
- ✅ **Auto-Refresh Toggle** - Enable/disable automatic updates
- ✅ **Manual Refresh** - Refresh data on demand

---

## 🔧 Technical Implementation

### Real-Time Tracking System
- **Storage**: `localStorage` key: `blockmed-active-users`
- **Update Frequency**: 
  - Current user: Every 30 seconds
  - Admin view: Every 5 seconds
- **Inactivity Threshold**: 5 minutes
- **Session IDs**: Unique identifier for each login

### Access Control System
- **Storage**: `localStorage` key: `blockmed-access-controls`
- **Format**: `{ userAddress: { feature: boolean, updatedAt, updatedBy } }`
- **Default**: All features enabled
- **Enforcement**: Checked on page load and navigation

### Restriction System
- **Storage**: `localStorage` key: `blockmed-user-restrictions`
- **Auto-Expiration**: Temporary restrictions expire automatically
- **Enforcement**: Checked globally in App.jsx and per-page

### Integration Points
- ✅ `LoginPage.jsx` - Tracks login events
- ✅ `App.jsx` - Global restriction and force logout checks
- ✅ `Layout.jsx` - Navigation filtering based on access controls
- ✅ `CreatePrescription.jsx` - Checks `canCreatePrescription`
- ✅ `PharmacyVerification.jsx` - Checks `canDispense`
- ✅ `BatchManagement.jsx` - Checks `canCreateBatch`
- ✅ `Analytics.jsx` - Checks `canViewAnalytics`
- ✅ `UserManagement.jsx` - Checks `canManageUsers`

---

## 🚀 Usage Guide

### For Super Admin

#### Viewing Active Users
1. Navigate to "Users" page (Super Admin only)
2. See "Online Now" stat card with green pulsing dot
3. View user table - online users have green dot indicator
4. Check "Activity" column for last seen times
5. Toggle auto-refresh on/off as needed

#### Controlling User Access
1. Click shield icon (🛡️) next to user
2. Toggle feature checkboxes:
   - Create Prescriptions
   - Dispense Prescriptions
   - Create Batches
   - View Analytics
   - Manage Users (admin only)
3. Click "Save Access Controls"
4. Changes apply immediately - user will see restricted features hidden

#### Restricting Users
1. Click lock icon (🔒) next to user
2. Select restriction type:
   - **Temporary**: Set duration (1-90 days)
   - **Permanent**: No expiration
3. Enter reason for restriction
4. Click "Apply Restriction"
5. User is immediately restricted

#### Removing Restrictions
1. Filter by "Restricted" to see restricted users
2. Click unlock icon (🔓) next to user
3. Confirm removal
4. User access is restored immediately

#### Force Logout User
1. Find online user (green dot indicator)
2. Click orange logout icon (🚪)
3. Confirm action
4. User will be logged out on their next action

#### Verifying Users
1. Find pending user (yellow "Pending" badge)
2. Click checkmark icon (✅)
3. User is verified immediately

#### Deactivating Users
1. Click X icon (❌) next to user
2. Confirm deactivation
3. User is permanently deactivated

---

## 🔐 Security & Enforcement

### Restriction Enforcement
- ✅ Checked on app load (`App.jsx`)
- ✅ Checked on page navigation
- ✅ Checked before key actions
- ✅ Automatic redirect if restricted
- ✅ Clear error messages

### Access Control Enforcement
- ✅ Navigation items hidden if access denied
- ✅ Page-level checks prevent access
- ✅ Feature-level checks before actions
- ✅ Real-time updates (no page refresh needed)

### Force Logout
- ✅ Sets session flag in `sessionStorage`
- ✅ User is logged out on next action
- ✅ Session cleared immediately
- ✅ Redirected to login page

### Real-Time Tracking
- ✅ Login events tracked automatically
- ✅ Activity updates every 30 seconds
- ✅ Admin view refreshes every 5 seconds
- ✅ Inactive users auto-removed after 5 minutes

---

## 📊 User Interface

### Statistics Dashboard
- **6 Stat Cards** with real-time counts
- **Online Now** card with pulsing green dot
- **Badge Counts** on filter buttons

### Real-Time Activity Panel
- **Currently Online** counter
- **Total Sessions** count
- **Last Update** timestamp
- **Auto-Refresh Toggle**
- **Manual Refresh Button**

### User Table
- **Online Status** - Green pulsing dot for active users
- **Last Seen** - Time since last activity
- **Restriction Status** - Red badges for restricted users
- **Activity Column** - Shows online/offline status
- **Action Buttons** - Verify, Control Access, Restrict, Force Logout, Deactivate

### Modals
- **Restriction Modal** - Set temporary/permanent restrictions
- **Access Control Modal** - Manage feature-level permissions

---

## 📝 Data Storage

### Active Users (`blockmed-active-users`)
```json
{
  "0x123...": {
    "lastSeen": 1704067200000,
    "loginTime": 1704067000000,
    "sessionId": "session-1704067000000-abc123"
  }
}
```

### Access Controls (`blockmed-access-controls`)
```json
{
  "0x123...": {
    "canCreatePrescription": true,
    "canDispense": false,
    "canCreateBatch": true,
    "canViewAnalytics": true,
    "canManageUsers": false,
    "updatedAt": 1704067200000,
    "updatedBy": "0xadmin..."
  }
}
```

### Restrictions (`blockmed-user-restrictions`)
```json
{
  "0x123...": {
    "userAddress": "0x123...",
    "userName": "John Doe",
    "reason": "Violation of policy",
    "restrictionType": "temporary",
    "duration": "7",
    "restrictedAt": 1704067200000,
    "expiresAt": 1704672000000,
    "restrictedBy": "0xadmin...",
    "isActive": true
  }
}
```

---

## 🎯 Use Cases

### Scenario 1: Suspend Problematic User
1. Super Admin sees user creating issues
2. Clicks "Restrict" → Selects "Temporary" → 7 days
3. Enters reason: "Policy violation"
4. User is immediately restricted
5. User sees error message and cannot access features

### Scenario 2: Limit User Access
1. Super Admin wants to prevent user from creating prescriptions
2. Clicks "Control Access" (shield icon)
3. Unchecks "Create Prescriptions"
4. Saves changes
5. User no longer sees "Create Prescription" in navigation
6. If user tries to access, they're blocked

### Scenario 3: Monitor Active Users
1. Super Admin opens User Management
2. Sees "Online Now: 5" with green pulsing dot
3. Views table - sees 5 users with green dots
4. Checks "Activity" column for last seen times
5. Can force logout any active user if needed

### Scenario 4: Emergency Logout
1. Super Admin notices suspicious activity
2. Finds user in table (green dot = online)
3. Clicks orange logout icon
4. Confirms action
5. User is logged out immediately on their next action

---

## ✅ Completion Status

- [x] Super Admin access control
- [x] Real-time login tracking
- [x] Online/offline status display
- [x] User restriction system
- [x] Temporary restrictions with expiration
- [x] Permanent restrictions
- [x] Access control management
- [x] Feature-level permissions
- [x] Force logout capability
- [x] User verification
- [x] User deactivation
- [x] Advanced filtering
- [x] Statistics dashboard
- [x] Real-time activity panel
- [x] Restriction modal UI
- [x] Access control modal UI
- [x] Auto-expiration system
- [x] Integration with all key pages
- [x] Navigation filtering
- [x] Global enforcement
- [x] Documentation

---

## 🎓 Supervisor Presentation Points

### Key Talking Points
1. **"Real-Time Monitoring"** - See who's logged in right now
2. **"Complete Control"** - Control every aspect of user access
3. **"Granular Permissions"** - Feature-level access control
4. **"Instant Actions"** - Force logout, restrict, control immediately
5. **"Live Updates"** - Auto-refreshes every 5 seconds

### Demo Flow
1. Show real-time activity dashboard (green dots)
2. Demonstrate online user tracking
3. Control access for a user (disable prescription creation)
4. Show user can't access that feature
5. Restrict a user temporarily
6. Show restrictions apply immediately
7. Force logout an active user
8. Show user is logged out

---

**This portal provides Super Administrators with complete real-time visibility and control over all users and their access to system features.**

---

*Last Updated: This Week*  
*Version: 1.2*  
*Status: Production Ready ✅*
