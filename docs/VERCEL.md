# Vercel Deployment Guide

**Quick setup:** See **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** for a step-by-step checklist.

## Why others used to see "Hardhat Not Running"

Vercel hosts **only the frontend** (React app). It cannot run a blockchain node.

- **Hardhat node** runs only on your computer (`npm run blockchain`). When someone opens your Vercel link, their browser would try to connect to **Hardhat Local** (`http://127.0.0.1:8545`), which doesn’t exist on their machine.
- The app now **auto-detects** when it’s not on localhost (e.g. `*.vercel.app`). In that case it shows **"Connect your wallet"** instead of "Hardhat Not Running", with **no env vars required**.
- You **cannot run the blockchain on Vercel**. For real on-chain data, deploy the contract to a **public network** (e.g. Sepolia) and set the env vars in Vercel (see VERCEL_SETUP.md).

---

## Make the shared Vercel link work for everyone

Use **public network mode**: the app talks to a **public testnet** (e.g. Sepolia) and users connect with **MetaMask**. No Hardhat needed for visitors.

### Step 1: Deploy the contract to a public testnet

Deploy your BlockMed contract once to Sepolia (or another testnet your Hardhat is set up for):

```bash
# Configure hardhat.config.js with Sepolia (and a funded account / API key if needed)
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the printed **contract address**.

### Step 2: Set environment variables in Vercel

In **Vercel** → your project → **Settings** → **Environment Variables**, add:

| Variable | Value | Required |
|----------|--------|----------|
| `VITE_CONTRACT_ADDRESS` | Your Sepolia contract address (e.g. `0x...`) | Yes, for on-chain data |
| `VITE_DEV_RPC_URL` | `https://rpc.sepolia.org` (or another Sepolia RPC) | Yes, for read-only when no wallet |
| `VITE_PUBLIC_DEPLOYMENT` | `true` | Optional – app already auto-detects Vercel (non-localhost) |
| `VITE_PUBLIC_NETWORK` | `sepolia` | Optional – default is Sepolia |

### Step 3: Redeploy

Trigger a new deployment (e.g. push a commit or **Redeploy** in Vercel dashboard).

---

## What users see after this

- **Get Started** screen shows:
  - **"Connect your wallet to use BlockMed on this network."**
  - **"Connect MetaMask / Wallet"** as the main button.
  - **"Network: Sepolia Testnet"** (or the network you set).
- No **"Hardhat Not Running"** and no need to run `npm run blockchain` or Dev Mode.
- Users install MetaMask (if needed), connect, switch to Sepolia, and use the app with the contract you deployed.

---

## Summary

| Environment | Blockchain | Who can use |
|-------------|------------|-------------|
| **Local dev** | `npx hardhat node` + Dev Mode | You (and others on same LAN if you share RPC URL) |
| **Vercel (default)** | None / Hardhat expected | Only you (if you run Hardhat locally and use the same app) |
| **Vercel + public** | Sepolia (or other testnet) | Anyone with MetaMask and the same network |

You **can** run the **app** on Vercel and have **everyone** use it—by using a **public testnet** and the env vars above. The **blockchain** part runs on the public network, not on Vercel.
