# 🚀 START HERE – BlockMed V1.2

## 👋 Welcome

BlockMed is a **blockchain-based prescription and medicine verification** system. You can use it **without a wallet** (Dev Mode) or with **MetaMask**.

---

## ⚡ Quick navigation

| File | Purpose | When to use |
|------|---------|-------------|
| **[QUICK_START.md](./QUICK_START.md)** | Short setup | Get running quickly |
| **[README.md](./README.md)** | Overview and scripts | Main project doc |
| **[docs/BLOCKCHAIN_HOW_IT_WORKS.md](./docs/BLOCKCHAIN_HOW_IT_WORKS.md)** | How blockchain is used | Understand contract, connection, indexer |
| **[BLOCKMED_V2_GUIDE.md](./BLOCKMED_V2_GUIDE.md)** | Features by role | Doctor, Pharmacist, Admin, etc. |
| **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** | Deploy contract | When you see “Contract not deployed” |
| **[WALLET_SETUP.md](./WALLET_SETUP.md)** | Dev Mode & MetaMask | Connection and funding |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** | Common issues | When something breaks |
| **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** | Test cases | Before demo or release |
| **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** | Project overview | High-level summary |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Architecture | Design and data flow |
| **[BLOCKCHAIN_DATA_PERSISTENCE.md](./BLOCKCHAIN_DATA_PERSISTENCE.md)** | Where data lives | On-chain vs demo data |
| **[SUPER_ADMIN_PORTAL.md](./SUPER_ADMIN_PORTAL.md)** | Admin portal | Super admin features |

---

## 🎯 What is BlockMed?

- **Doctors** – Create prescriptions (patient hash, medicines, validity); store on blockchain or use demo mode.
- **Pharmacists / Admin** – Verify and dispense prescriptions; verify/flag medicine batches.
- **Manufacturers** – Create batches; recall if needed.
- **Patients** – View history by patient ID (NID) / patient hash.
- **Dev Mode** – Pre-funded Hardhat accounts, no MetaMask required.
- **Demo mode** – Create and verify prescriptions/batches locally when the chain is not connected.

---

## 🏃 Get started in 3 steps

### 1. Install and start (about 5 min)

```bash
npm install
npm run blockchain    # Terminal 1 – keep running
npm run deploy:check # Terminal 2 – deploys and updates config
npm run dev          # Terminal 2 – start app
```

Or use **one command**: `npm run start` (runs blockchain, then deploy, then dev).

### 2. Open the app

- Go to **http://localhost:3000**
- Click **🔧 Use Dev Mode (Recommended)** and choose an account (e.g. Admin #0 or Doctor #1). No MetaMask needed.
- Or connect **MetaMask** (add Hardhat Local: RPC `http://127.0.0.1:8545`, Chain ID `31337`).

### 3. Enable Dev Mode in Settings (if you use Dev Mode)

- After login, go to **Settings** → **Blockchain Setup** → **Enable Dev Mode** and select account.
- Dev Mode is also available on the **Login** page (“Use Dev Mode”).

---

## ⚠️ After deploying a new contract

The deploy script updates **`src/utils/config.js`** and **`.env.local`** with the new contract address.

1. **Stop** the dev server (Ctrl+C).
2. Run **`npm run dev`** again.
3. **Hard-refresh** the browser (Ctrl+Shift+R or Cmd+Shift+R).

Otherwise the app may still use the old address.

---

## 📂 Project structure (main parts)

```
BlockMed V1.2/
├── START_HERE.md, README.md, QUICK_START.md
├── contracts/BlockMedV2.sol     # Smart contract
├── src/
│   ├── pages/                   # LoginPage, CreatePrescription, PharmacyVerification, etc.
│   ├── utils/contractHelper.js  # Contract read/write, Dev Mode vs Wallet
│   ├── utils/devMode.js        # Dev Mode accounts and provider
│   └── store/useStore.js       # User, demo prescriptions, etc.
├── scripts/
│   ├── check-and-deploy.cjs    # Deploy + update config and .env.local
│   └── indexer/index.js        # Optional event indexer (port 3002)
└── docs/                       # BLOCKCHAIN_HOW_IT_WORKS, PRIVACY_ONCHAIN, etc.
```

---

## 🐛 Quick fixes

| Problem | Solution |
|--------|----------|
| “Contract not deployed” | Run `npm run deploy:check` (Hardhat must be running). Restart dev server and hard-refresh. |
| “Hardhat not running” | Run `npm run blockchain` in a terminal. |
| No wallet / don’t want MetaMask | Use **Dev Mode** on login or in Settings → Blockchain Setup. |
| “Only verified pharmacist…” | Use Admin (Dev Mode Account #0) to dispense, or verify the pharmacist user. |

More: **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** and **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**.

---

## 📋 Pre-demo checklist

- [ ] `npm run blockchain` running
- [ ] `npm run deploy:check` done (and dev server restarted if you just deployed)
- [ ] `npm run dev` running, app at http://localhost:3000
- [ ] Logged in with Dev Mode (e.g. Admin #0 or Doctor #1) or MetaMask
- [ ] Created at least one prescription (on-chain or demo)
- [ ] Verified/dispensed a prescription (Pharmacy Verification)

---

**Next:** [QUICK_START.md](./QUICK_START.md) for the shortest path to a running app.

**Built with ❤️ – BlockMed V1.2**
