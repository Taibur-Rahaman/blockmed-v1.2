# 🏥 BlockMed V1.2 / V2 – Blockchain Prescription & Medicine Verification

Blockchain-based prescription management and anti-fake medicine tracking with **Dev Mode** (no wallet needed), **MetaMask** support, and **demo mode** when the chain is offline.

## 🎯 Features

- **Dev Mode** – Use pre-funded Hardhat accounts without MetaMask (recommended for local dev)
- **Demo mode** – Create and verify prescriptions/batches locally when blockchain is not connected
- **BlockMedV2 contract** – RBAC (Admin, Doctor, Pharmacist, Manufacturer, Patient, Regulator), prescriptions, medicine batches, recall/flag
- **Admin can dispense** – Admin or Pharmacist can dispense prescriptions and from batches
- **QR codes** – Prescription and batch verification; QR scan on Pharmacy Verification page
- **Prescription templates** – Save and reuse common prescriptions
- **Multi-language** – English and Bangla (বাংলা)
- **Indexer** (optional) – Event indexer + HTTP API on port 3002 for prescriptions/batches

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[START_HERE.md](./START_HERE.md)** | First-time setup and navigation |
| **[QUICK_START.md](./QUICK_START.md)** | Fast setup (Dev Mode or wallet) |
| **[docs/BLOCKCHAIN_HOW_IT_WORKS.md](./docs/BLOCKCHAIN_HOW_IT_WORKS.md)** | How blockchain works (contract, connection, indexer, diagrams) |
| **[BLOCKMED_V2_GUIDE.md](./BLOCKMED_V2_GUIDE.md)** | System guide by role and page |
| **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** | Deploy contract and config |
| **[WALLET_SETUP.md](./WALLET_SETUP.md)** | Dev Mode and MetaMask setup |
| **[BLOCKCHAIN_DATA_PERSISTENCE.md](./BLOCKCHAIN_DATA_PERSISTENCE.md)** | Where data lives and how to find it |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System architecture |
| **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** | Project overview |
| **[SUPER_ADMIN_PORTAL.md](./SUPER_ADMIN_PORTAL.md)** | Super Admin features |
| **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** | Testing guide |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** | Common issues and fixes |
| **[docs/PRIVACY_ONCHAIN.md](./docs/PRIVACY_ONCHAIN.md)** | Privacy and on-chain data |
| **[docs/METAMASK_LOCALHOST_FIX.md](./docs/METAMASK_LOCALHOST_FIX.md)** | MetaMask localhost tips |
| **[docs/CURSOR_COOKBOOK_SETUP.md](./docs/CURSOR_COOKBOOK_SETUP.md)** | Cursor cookbook + SDK quickstart setup |

---

## ⚡ Quick Setup

### 1. Install

```bash
npm install
```

### 2. Start blockchain and deploy

**Option A – One command (blockchain + deploy + app):**

```bash
npm run start
```

**Option B – Separate terminals:**

```bash
# Terminal 1
npm run blockchain

# Terminal 2 (after node is up)
npm run deploy:check
npm run dev
```

### 3. Use the app

- Open **http://localhost:3000**
- Click **🔧 Use Dev Mode** → choose account (e.g. Admin #0, Doctor #1)
- Or connect **MetaMask** (Hardhat Local, Chain ID 31337)

After a **new deploy**, restart the dev server and hard-refresh the browser so `VITE_CONTRACT_ADDRESS` is picked up.

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run blockchain` | Start Hardhat node (localhost:8545) |
| `npm run deploy` | Redeploy contract and update config + .env.local |
| `npm run deploy:check` | Deploy only if no contract at configured address |
| `npm run start` | Run blockchain, then deploy, then dev (concurrently) |
| `npm run test:blockchain` | Run Hardhat contract tests |
| `npm run test:all` | Run full feature test script |
| `npm run indexer` | Start event indexer (API on port 3002) |
| `npm run verify:user` | Verify user (e.g. `USER_ADDRESS=0x... npm run verify:user`) |

---

## 📂 Project structure

```
BlockMed V1.2/
├── contracts/
│   └── BlockMedV2.sol           # Smart contract (RBAC, prescriptions, batches)
├── src/
│   ├── components/              # Layout, BlockchainInfo, ErrorBoundary
│   ├── pages/                    # Login, Dashboard, CreatePrescription, PharmacyVerification, etc.
│   ├── store/useStore.js        # Zustand state (user, demo prescriptions, etc.)
│   ├── hooks/useBlockchain.js   # Blockchain connection state
│   ├── utils/                   # config, contractHelper, devMode, helpers, blockchainData
│   └── i18n/                    # English & Bangla
├── scripts/
│   ├── check-and-deploy.cjs     # Deploy and update config + .env.local
│   ├── indexer/index.js          # Event indexer + HTTP API (port 3002)
│   ├── verify-user.cjs          # CLI: verify a user (Admin)
│   └── test-*.mjs / test-local.cjs
├── docs/                        # BLOCKCHAIN_HOW_IT_WORKS, PRIVACY_ONCHAIN, METAMASK_LOCALHOST_FIX
├── test/BlockMedV2.test.cjs     # Contract tests
└── *.md                         # Documentation
```

---

## 🔧 Troubleshooting

- **Contract not deployed** → Run `npm run deploy:check` (with Hardhat node running). Then restart `npm run dev` and hard-refresh the browser.
- **No wallet / want to skip MetaMask** → Use **Dev Mode** on the login page (Settings → Blockchain Setup → Enable Dev Mode, or “Use Dev Mode” on login).
- **Demo mode** → When blockchain is not connected, you can still create prescriptions and verify/dispense them locally; enable Dev Mode and run blockchain to save on-chain.

See **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** and **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for more.

---

## 🚀 Deploy to Vercel

1. Push to GitHub (e.g. `main`).
2. In Vercel: **Add New** → **Project** → import your BlockMed repo. Deploy (no env vars needed for the shared link to show “Connect wallet”).
3. Optional (real blockchain): Deploy contract to Sepolia, then in Vercel **Settings** → **Environment Variables** add `VITE_CONTRACT_ADDRESS` and `VITE_DEV_RPC_URL=https://rpc.sepolia.org`, then redeploy.

**Step-by-step:** **[docs/VERCEL_SETUP.md](./docs/VERCEL_SETUP.md)** | **Details:** **[docs/VERCEL.md](./docs/VERCEL.md)**

---

**Built with React, Vite, TailwindCSS, ethers.js, Solidity, Hardhat**
