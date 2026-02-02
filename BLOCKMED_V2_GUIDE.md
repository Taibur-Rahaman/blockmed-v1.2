# 🏥 BlockMed V2 – Complete System Guide

## ✅ Current status

- **Smart contract**: BlockMedV2 – address from `VITE_CONTRACT_ADDRESS` or `src/utils/config.js` (updated by deploy script)
- **Hardhat node**: `http://127.0.0.1:8545` (Chain ID 31337)
- **Frontend**: `http://localhost:3000`
- **Indexer** (optional): `npm run indexer` – HTTP API on port 3002

---

## 🚀 Quick start

### 1. Access the app

Open **http://localhost:3000**

### 2. Connect (Dev Mode or MetaMask)

**Dev Mode (recommended – no wallet):**

1. Click **"🔧 Use Dev Mode (Recommended)"** on the login page
2. Select an account (Admin #0, Doctor #1, Pharmacist #2, etc.)
3. Each has 10,000 ETH. No MetaMask needed.

Or enable Dev Mode after login: **Settings → Blockchain Setup → Enable Dev Mode**.

**MetaMask:**

1. Install MetaMask; click "Connect Wallet"
2. Add Hardhat Local: RPC `http://127.0.0.1:8545`, Chain ID `31337`
3. Import a test account from Hardhat node output (e.g. private key for Account #0)

---

## 🎯 Features by Role

### 👨‍⚕️ Doctor Role
- Create prescriptions with full patient information
- Date picker for date of birth (auto-calculates age)
- Dropdown for gender selection
- Medicine search with FDA API integration (with local fallback)
- QR code generation for each prescription
- Submit prescriptions to blockchain
- Print-ready prescription format

### 🏪 Pharmacist Role
- Verify prescriptions by ID or QR scan
- Mark prescriptions as dispensed (on-chain or demo)
- Verify medicine batches for authenticity
- Flag suspicious batches
- View prescription details and validity
- **Admin** can also dispense prescriptions and from batches (onlyPharmacistOrAdmin)

### 👤 Patient Role
- View all personal prescriptions using Patient ID
- See prescription history and status
- Download/print prescriptions
- QR code for easy sharing

### 🏭 Manufacturer Role
- Create medicine batches with QR codes
- Set batch expiry dates
- Recall batches if needed
- Track all manufactured batches

### 👮 Regulator (DGDA) Role
- View system analytics
- Monitor all users
- Review flagged/recalled batches
- Access audit trails
- View prescription statistics

### 🔧 Admin Role
- Manage all users
- Verify pending user registrations
- Deactivate users
- Full system access

---

## 🌐 Multi-Language Support
- Click the language toggle button (🌐) in the header
- Supports English and Bangla (বাংলা)
- All UI elements and forms translate

---

## 📱 Key Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Main dashboard with stats and quick actions |
| Create Prescription | `/prescription/create` | 5-step prescription creation |
| Pharmacy Verification | `/pharmacy` | Verify prescriptions and medicines |
| Patient Portal | `/patient` | View patient prescriptions |
| Medicine Management | `/medicines` | CRUD for medicine database |
| Batch Management | `/batches` | Create and manage medicine batches |
| User Management | `/users` | Admin user management |
| Analytics | `/analytics` | System statistics and charts |
| Settings | `/settings` | User preferences and network info |

---

## 💊 Medicine Search

The system uses the **FDA OpenFDA API** for real medicine data:
- Search by medicine name or generic name
- Auto-fetches brand names, dosage forms, strengths
- Falls back to local `medicines.json` if API is unavailable
- Local medicine database can be imported/exported as JSON

---

## 🔐 Smart Contract Features

### Prescription Management
- Create prescriptions with expiry dates
- Versioning (edit creates new version, old versions preserved)
- Dispense tracking
- Patient hash for privacy

### Medicine Batch Tracking
- Batch creation with QR codes
- Expiry date tracking
- Recall functionality
- Flag suspicious batches
- Authenticity verification

### Role-Based Access Control
- 6 roles: Admin, Doctor, Pharmacist, Manufacturer, Patient, Regulator
- Permission-based actions
- Admin verification for new users

---

## 🛠 Development commands

```bash
# Start Hardhat local blockchain
npm run blockchain

# Deploy contract (check first, or force redeploy)
npm run deploy:check   # Deploy only if no contract at address; updates config + .env.local
npm run deploy        # Always redeploy (e.g. after Solidity changes)

# Start frontend
npm run dev

# One command: blockchain + deploy + dev
npm run start

# Run contract tests
npm run test:blockchain
npm run test:all

# Optional event indexer (API on port 3002)
npm run indexer

# Build for production
npm run build
```

**After a new deploy:** Restart the dev server and hard-refresh the browser so the app uses the new contract address.

---

## 📁 Project structure

```
BlockMed V1.2/
├── contracts/
│   └── BlockMedV2.sol       # Smart contract (RBAC, prescriptions, batches)
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── BlockchainInfo.jsx
│   │   └── ErrorBoundary.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── CreatePrescription.jsx
│   │   ├── PharmacyVerification.jsx
│   │   ├── PrescriptionTemplates.jsx
│   │   ├── PatientPortal.jsx, PatientHistory.jsx
│   │   ├── MedicineManagement.jsx, BatchManagement.jsx
│   │   ├── UserManagement.jsx, Analytics.jsx, Settings.jsx
│   │   └── ActivityLog.jsx
│   ├── store/useStore.js    # Zustand (user, demo prescriptions, etc.)
│   ├── hooks/useBlockchain.js
│   ├── i18n/                # English & Bangla
│   ├── utils/               # config, contractHelper, devMode, helpers, blockchainData
│   ├── App.jsx
│   └── index.css
├── scripts/
│   ├── check-and-deploy.cjs # Deploy + update config + .env.local
│   ├── indexer/index.js     # Event indexer (port 3002)
│   ├── verify-user.cjs
│   └── test-*.mjs, test-local.cjs
├── docs/                    # BLOCKCHAIN_HOW_IT_WORKS, PRIVACY_ONCHAIN, etc.
├── test/BlockMedV2.test.cjs
├── hardhat.config.cjs
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 🎨 UI Features

- Modern dark theme with glass morphism effects
- Animated gradients and transitions
- Responsive design for all screen sizes
- Custom scrollbars
- Toast notifications
- Loading skeletons
- Print-ready prescription format

---

## 🔗 Blockchain Networks Supported

| Network | Chain ID | Status |
|---------|----------|--------|
| Hardhat Local | 31337 | ✅ Default |
| Polygon Mumbai | 80001 | Configurable |
| Sepolia Testnet | 11155111 | Configurable |

---

## 📞 Support

- **Contract not deployed** → Run `npm run deploy:check` (Hardhat running). Restart dev server and hard-refresh.
- **No wallet** → Use **Dev Mode** on login or in Settings → Blockchain Setup.
- **Only verified pharmacist** → Log in as Admin (Dev Mode Account #0) to dispense, or verify the pharmacist user via User Management or `npm run verify:user USER_ADDRESS=0x...`.

See **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** and **[docs/BLOCKCHAIN_HOW_IT_WORKS.md](./docs/BLOCKCHAIN_HOW_IT_WORKS.md)** for more.

---

**Built with ❤️ using React, TailwindCSS, Ethers.js & Solidity**

