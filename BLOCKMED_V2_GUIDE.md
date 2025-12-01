# 🏥 BlockMed V2 - Complete System Guide

## ✅ Current Status
- **Smart Contract**: Deployed at `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Hardhat Node**: Running at `http://127.0.0.1:8545`
- **Frontend**: Running at `http://localhost:3000`

---

## 🚀 Quick Start

### 1. Access the Application
Open your browser and go to: **http://localhost:3000**

### 2. Connect MetaMask
1. Install MetaMask browser extension if you haven't
2. Click "Connect Wallet" button
3. The app will automatically switch to Hardhat Local network (Chain ID: 31337)

### 3. Import Test Account (for testing with funds)
From the Hardhat node output, import one of the test accounts into MetaMask:
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- This account has 10000 ETH for testing

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
- Mark prescriptions as dispensed
- Verify medicine batches for authenticity
- Flag suspicious batches
- View prescription details and validity

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

## 🛠 Development Commands

```bash
# Start Hardhat local blockchain
npm run blockchain

# Deploy smart contract
npm run deploy

# Start frontend development server
npm run dev

# Build for production
npm run build
```

---

## 📁 Project Structure

```
BlockMed V1.2/
├── contracts/
│   └── BlockMedV2.sol       # Enhanced smart contract
├── src/
│   ├── components/
│   │   └── Layout.jsx       # Main layout with sidebar
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── CreatePrescription.jsx
│   │   ├── PharmacyVerification.jsx
│   │   ├── PatientPortal.jsx
│   │   ├── MedicineManagement.jsx
│   │   ├── BatchManagement.jsx
│   │   ├── UserManagement.jsx
│   │   ├── Analytics.jsx
│   │   └── Settings.jsx
│   ├── store/
│   │   └── useStore.js      # Zustand state management
│   ├── i18n/
│   │   ├── index.js
│   │   └── translations.js  # English & Bangla
│   ├── utils/
│   │   ├── config.js
│   │   ├── helpers.js
│   │   └── contractABI.json
│   ├── App.jsx
│   └── index.css            # TailwindCSS styles
├── scripts/
│   └── deploy.cjs
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

For issues:
1. Check browser console for errors
2. Verify MetaMask is on correct network
3. Ensure contract is deployed
4. Check Hardhat node is running

---

**Built with ❤️ using React, TailwindCSS, Ethers.js & Solidity**

