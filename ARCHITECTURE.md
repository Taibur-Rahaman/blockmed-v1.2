# 🏗️ BlockMed Architecture Documentation

For a **full explanation of how blockchain works** in this project (contract, connection layer, Dev Mode vs Wallet, indexer, diagrams), see **[docs/BLOCKCHAIN_HOW_IT_WORKS.md](./docs/BLOCKCHAIN_HOW_IT_WORKS.md)**.

---

## System Architecture Overview

```mermaid
graph TB
    User[👨‍⚕️ Doctor / Pharmacist] --> Browser[Web Browser]
    Browser --> DevMode[🔧 Dev Mode]
    Browser --> MetaMask[🦊 MetaMask Wallet]
    Browser --> Frontend[⚛️ React Frontend]
    
    Frontend --> Router[React Router]
    Router --> Login[LoginPage]
    Router --> Dashboard[Dashboard Page]
    Router --> Prescription[CreatePrescription Page]
    Router --> Pharmacy[PharmacyVerification Page]
    
    Prescription --> QR[QR Code Generator]
    
    DevMode --> contractHelper[contractHelper.js]
    MetaMask --> contractHelper
    contractHelper --> Contract[📄 BlockMedV2 Contract]
    
    Contract --> Blockchain[(🔗 Blockchain)]
    
    Prescription --> IPFS[IPFS / JSON payload]
    
    style User fill:#667eea,color:#fff
    style MetaMask fill:#f6851b,color:#fff
    style Frontend fill:#61dafb,color:#000
    style Contract fill:#627eea,color:#fff
    style Blockchain fill:#764ba2,color:#fff
```

## Component Flow

```mermaid
graph LR
    A[App.jsx] --> B{Connected?}
    B -->|No| C[LoginPage - Dev Mode or MetaMask]
    B -->|Yes| D[Dashboard]
    D --> E[CreatePrescription]
    E --> F[Submit to Blockchain or Demo]
    F --> G[Generate QR Code]
    G --> H[Display Result]
    
    style A fill:#667eea,color:#fff
    style C fill:#f6851b,color:#fff
    style D fill:#10b981,color:#fff
    style E fill:#3b82f6,color:#fff
    style F fill:#8b5cf6,color:#fff
    style G fill:#ec4899,color:#fff
```

## Data Flow

```mermaid
sequenceDiagram
    participant Doctor
    participant UI
    participant MetaMask
    participant Contract
    participant Blockchain
    
    Doctor->>UI: Open App
    UI->>MetaMask: Request Connection
    MetaMask->>Doctor: Approve?
    Doctor->>MetaMask: Approve
    MetaMask->>UI: Connected ✅
    
    Doctor->>UI: Fill Prescription Form
    Doctor->>UI: Click Submit
    UI->>MetaMask: Request Transaction
    MetaMask->>Doctor: Confirm Transaction?
    Doctor->>MetaMask: Confirm
    MetaMask->>Contract: Send Transaction
    Contract->>Blockchain: Store Data
    Blockchain->>Contract: Transaction Hash
    Contract->>UI: Success + Hash
    UI->>UI: Generate QR Code
    UI->>Doctor: Show QR + Hash
```

## Smart Contract Structure (BlockMedV2)

```mermaid
graph TB
    BlockMed[BlockMedV2 Contract]
    
    BlockMed --> Data[State Variables]
    BlockMed --> Functions[Functions]
    BlockMed --> Events[Events]
    
    Data --> Users[users, userAddresses]
    Data --> Presc[prescriptions, prescriptionCount, patientPrescriptions, doctorPrescriptions]
    Data --> Batches[medicineBatches, batchNumberToId, flaggedBatches, recalledBatches]
    
    Functions --> Add[addPrescription / createPrescription]
    Functions --> Get[getPrescription, getPrescriptionsByPatient, getPrescriptionsByDoctor]
    Functions --> Dispense[dispensePrescription - Pharmacist or Admin]
    Functions --> Batch[createMedicineBatch, verifyBatch, dispenseFromBatch, recallBatch, flagBatch]
    
    Events --> PrescriptionCreated[PrescriptionCreated, PrescriptionDispensed]
    Events --> BatchEvents[BatchCreated, BatchRecalled, BatchFlagged, FakeMedicineAlert]
    
    style BlockMed fill:#627eea,color:#fff
    style Functions fill:#10b981,color:#fff
    style Events fill:#f59e0b,color:#fff
```

## Frontend Component Hierarchy

```mermaid
graph TB
    App[App.jsx - Router & State]
    
    App --> Login[LoginPage.jsx - Dev Mode or Wallet]
    App --> Layout[Layout.jsx]
    App --> Dash[Dashboard.jsx]
    App --> Presc[CreatePrescription.jsx]
    App --> Pharmacy[PharmacyVerification.jsx]
    
    Login --> ConnectUI[Dev Mode or MetaMask]
    ConnectUI --> contractHelper[contractHelper - getReadContract / getWriteContract]
    
    Dash --> WalletInfo[Wallet Info Display]
    Dash --> CreateBtn[Create Prescription Button]
    Dash --> Features[Features Section]
    
    Presc --> Form[Prescription Form]
    Presc --> Submit[Submit Logic]
    Presc --> QRGen[QR Generator]
    Presc --> Result[Result Display]
    
    Form --> PatientHash[Patient Hash Input]
    Form --> IPFSHash[IPFS Hash Input]
    
    Submit --> Validate[Validation]
    Submit --> TxSend[Send Transaction]
    Submit --> TxWait[Wait Confirmation]
    
    style App fill:#667eea,color:#fff
    style Connect fill:#f6851b,color:#fff
    style Dash fill:#10b981,color:#fff
    style Presc fill:#3b82f6,color:#fff
```

## Technology Stack Layers

```mermaid
graph TB
    subgraph Presentation Layer
        React[React 18.2]
        Router[React Router DOM]
        CSS[Custom CSS]
    end
    
    subgraph Application Layer
        Components[React Components]
        State[State Management]
        Routing[Client Routing]
    end
    
    subgraph Integration Layer
        Ethers[ethers.js 6.9]
        MetaMask[MetaMask Provider]
        QR[qrcode.react]
    end
    
    subgraph Blockchain Layer
        Contract[Smart Contract]
        Hardhat[Hardhat Dev Env]
        Network[Ethereum Network]
    end
    
    subgraph Data Layer
        Blockchain[(Blockchain Storage)]
        IPFS[(IPFS - Future)]
    end
    
    React --> Components
    Components --> Ethers
    Ethers --> Contract
    Contract --> Blockchain
    
    style React fill:#61dafb,color:#000
    style Ethers fill:#627eea,color:#fff
    style Contract fill:#627eea,color:#fff
    style Blockchain fill:#764ba2,color:#fff
```

## Network Architecture

```mermaid
graph LR
    subgraph Client Side
        Browser[Web Browser]
        MM[MetaMask]
    end
    
    subgraph Development
        Vite[Vite Dev Server :3000]
        Hardhat[Hardhat Node :8545]
    end
    
    subgraph Production Option 1
        LocalBC[Local Blockchain]
    end
    
    subgraph Production Option 2
        Testnet[Sepolia Testnet]
    end
    
    Browser --> Vite
    MM --> Hardhat
    MM --> LocalBC
    MM --> Testnet
    
    style Browser fill:#667eea,color:#fff
    style MM fill:#f6851b,color:#fff
    style Vite fill:#646cff,color:#fff
    style Hardhat fill:#fff100,color:#000
```

## File Organization

```
BlockMed V1.1/
│
├── 📁 contracts/                  # Blockchain Layer
│   └── BlockMed.sol              # Smart Contract
│
├── 📁 scripts/                    # Deployment
│   └── deploy.js                 # Deploy Script
│
├── 📁 src/                        # Frontend Application
│   │
│   ├── 📁 components/            # Reusable Components
│   │   └── MetaMaskConnect.jsx   # Wallet Connection
│   │
│   ├── 📁 pages/                 # Route Pages
│   │   ├── Dashboard.jsx         # Home Page
│   │   └── AddPrescription.jsx   # Prescription Page
│   │
│   ├── 📁 utils/                 # Utilities & Config
│   │   ├── contractABI.json      # Contract Interface
│   │   └── config.js             # Configuration
│   │
│   ├── App.jsx                   # Main App Component
│   ├── main.jsx                  # React Entry
│   └── index.css                 # Global Styles
│
├── 📄 index.html                  # HTML Template
├── 📄 package.json                # Dependencies
├── 📄 vite.config.js              # Vite Config
├── 📄 hardhat.config.js           # Hardhat Config
│
└── 📚 Documentation/
    ├── README.md
    ├── QUICK_START.md
    ├── DEPLOYMENT_GUIDE.md
    ├── TESTING_CHECKLIST.md
    ├── PROJECT_SUMMARY.md
    └── ARCHITECTURE.md
```

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Connecting: Click Connect
    Connecting --> Connected: MetaMask Approved
    Connecting --> Disconnected: User Rejected
    
    Connected --> Dashboard: Auto Navigate
    Dashboard --> CreatePrescription: Click Create
    
    CreatePrescription --> FillingForm: Enter Data
    FillingForm --> Submitting: Click Submit
    Submitting --> Confirming: MetaMask Confirm
    Confirming --> Success: Tx Confirmed
    Confirming --> Error: Tx Failed
    
    Success --> ShowingQR: Generate QR
    ShowingQR --> CreatePrescription: Create Another
    ShowingQR --> Dashboard: Back to Dashboard
    
    Error --> FillingForm: Retry
    
    Connected --> Disconnected: Disconnect/Network Change
```

## Security Architecture

```mermaid
graph TB
    subgraph Frontend Security
        A1[Input Validation]
        A2[XSS Prevention]
        A3[HTTPS Only]
    end
    
    subgraph Wallet Security
        B1[MetaMask Authorization]
        B2[Transaction Signing]
        B3[Private Key Never Exposed]
    end
    
    subgraph Smart Contract Security
        C1[Access Control]
        C2[Input Validation]
        C3[Event Logging]
        C4[Immutable Storage]
    end
    
    subgraph Blockchain Security
        D1[Decentralized Consensus]
        D2[Cryptographic Hashing]
        D3[Tamper-Proof Records]
    end
    
    A1 --> B1
    B2 --> C1
    C3 --> D1
    
    style Frontend fill:#3b82f6,color:#fff
    style Wallet fill:#f6851b,color:#fff
    style Smart fill:#627eea,color:#fff
    style Blockchain fill:#764ba2,color:#fff
```

## Deployment Pipeline

```mermaid
graph LR
    A[Development] --> B[Local Testing]
    B --> C{Tests Pass?}
    C -->|Yes| D[Deploy Smart Contract]
    C -->|No| A
    D --> E[Update Config]
    E --> F[Test Integration]
    F --> G{Integration OK?}
    G -->|Yes| H[Build Frontend]
    G -->|No| E
    H --> I[Deploy to Production]
    I --> J[Verify & Monitor]
    
    style A fill:#667eea,color:#fff
    style D fill:#10b981,color:#fff
    style H fill:#3b82f6,color:#fff
    style I fill:#8b5cf6,color:#fff
```

## Key Design Decisions

### 1. Why React?
- Component-based architecture
- Easy state management
- Large ecosystem
- Fast with Vite

### 2. Why ethers.js v6?
- Modern API
- Better TypeScript support
- Smaller bundle size
- Active development

### 3. Why Hardhat?
- Fast local blockchain
- Built-in testing
- Easy debugging
- Plugin ecosystem

### 4. Why MetaMask?
- Most popular Web3 wallet
- Easy integration
- Widely trusted
- Cross-browser support

### 5. Why QR Codes?
- Universal compatibility
- Easy scanning
- No app required
- Future blockchain linking

## Scalability Considerations

### Current Design
- Single doctor per transaction
- Sequential prescription creation
- On-chain storage only
- Simple validation

### Future Enhancements
- Multi-doctor collaboration
- Batch prescription creation
- Off-chain indexing (The Graph)
- Advanced role-based access
- Layer 2 scaling solutions
- IPFS for document storage

## Performance Metrics

### Local Development
- Page Load: < 1 second
- MetaMask Connect: < 2 seconds
- Transaction Submit: < 5 seconds
- QR Generation: Instant

### Testnet (Sepolia)
- Transaction Confirm: 15-30 seconds
- Block Time: ~12 seconds
- Gas Costs: Minimal (testnet)

## Monitoring & Logging

### Frontend Logs
- Component lifecycle events
- State changes
- Error messages
- User actions

### Blockchain Events
- PrescriptionAdded
- PrescriptionVerified
- Transaction hashes
- Block numbers

### MetaMask Events
- Account changes
- Network switches
- Connection status
- Transaction status

## Error Handling Strategy

```mermaid
graph TB
    Error[Error Occurs]
    Error --> Type{Error Type?}
    
    Type -->|Network| N[Show Network Error]
    Type -->|User Rejection| U[Show Cancellation]
    Type -->|Validation| V[Show Validation Error]
    Type -->|Contract| C[Show Contract Error]
    Type -->|Unknown| X[Show Generic Error]
    
    N --> Log[Log Error]
    U --> Log
    V --> Log
    C --> Log
    X --> Log
    
    Log --> Recovery{Recoverable?}
    Recovery -->|Yes| Retry[Allow Retry]
    Recovery -->|No| Inform[Inform User]
    
    style Error fill:#ef4444,color:#fff
    style Log fill:#f59e0b,color:#fff
    style Recovery fill:#10b981,color:#fff
```

## Future Architecture (Phase 3)

```mermaid
graph TB
    subgraph Users
        Doctor[👨‍⚕️ Doctor]
        Patient[👤 Patient]
        Pharmacy[💊 Pharmacy]
    end
    
    subgraph Frontend
        DoctorUI[Doctor Dashboard]
        PatientUI[Patient Portal]
        PharmacyUI[Pharmacy Verification]
    end
    
    subgraph Backend Services
        Auth[Authentication Service]
        IPFS[IPFS Service]
        Indexer[Graph Indexer]
    end
    
    subgraph Blockchain
        Contract[Enhanced Smart Contract]
        Events[Event System]
    end
    
    Doctor --> DoctorUI
    Patient --> PatientUI
    Pharmacy --> PharmacyUI
    
    DoctorUI --> Auth
    PatientUI --> Auth
    PharmacyUI --> Auth
    
    DoctorUI --> IPFS
    
    Auth --> Contract
    IPFS --> Contract
    Indexer --> Events
    
    style Doctor fill:#667eea,color:#fff
    style Patient fill:#10b981,color:#fff
    style Pharmacy fill:#f59e0b,color:#fff
```

---

## Summary

**BlockMed V1.1** follows a clean, layered architecture:

1. **Presentation Layer** - React UI components
2. **Integration Layer** - ethers.js + MetaMask
3. **Smart Contract Layer** - Solidity blockchain logic
4. **Storage Layer** - Ethereum blockchain

This architecture ensures:
- ✅ Separation of concerns
- ✅ Easy testing
- ✅ Scalability
- ✅ Security
- ✅ Maintainability

**Ready for supervisor demo and future enhancements! 🚀**
