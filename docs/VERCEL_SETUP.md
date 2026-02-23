# Vercel – Proper Setup (Step by Step)

Use this checklist to deploy BlockMed to Vercel and have the shared link work for everyone.

---

## 1. Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New** → **Project**.
3. **Import** your BlockMed repo (e.g. `Taibur-Rahaman/blockmed-v1.2`).
4. Vercel will detect **Vite** and use:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Do **not** add env vars yet. Click **Deploy** and wait for the first build.

Result: You get a URL like `https://your-project.vercel.app`. Anyone opening it will see **"Connect your wallet"** (no "Hardhat Not Running") because the app detects non-localhost and switches to wallet mode automatically.

---

## 2. (Optional) Use real blockchain on Vercel

If you want users to read/write on a real chain (e.g. Sepolia testnet), do the following.

### 2.1 Deploy the contract once (Sepolia)

On your machine (with Hardhat configured for Sepolia):

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the printed **contract address**.

### 2.2 Set environment variables in Vercel

In Vercel: **Project** → **Settings** → **Environment Variables**. Add:

| Name | Value | Notes |
|------|--------|--------|
| `VITE_CONTRACT_ADDRESS` | `0x...` (your Sepolia contract) | Required for on-chain data |
| `VITE_DEV_RPC_URL` | `https://rpc.sepolia.org` | Public RPC; no API key |

Optional:

| Name | Value |
|------|--------|
| `VITE_PUBLIC_DEPLOYMENT` | `true` (optional; app already auto-detects Vercel) |
| `VITE_PUBLIC_NETWORK` | `sepolia` (default; or `polygon` for Mumbai) |

### 2.3 Redeploy

- **Deployments** → open the **⋯** on the latest deployment → **Redeploy**, or  
- Push a new commit to trigger a build.

After redeploy, users who open your Vercel link can **Connect MetaMask**, switch to **Sepolia**, and use the app with your deployed contract.

---

## 3. What the app uses (reference)

- **Build:** `npm run build` (Vite), output in `dist`.
- **SPA routing:** `vercel.json` rewrites all routes to `/index.html`.
- **Env at build time:** Only `VITE_*` variables are embedded; set them in Vercel before building.

---

## 4. Summary

| Goal | What to do |
|------|------------|
| **Just share the link (demo UI)** | Deploy from GitHub. No env vars needed. Users see "Connect MetaMask". |
| **Real blockchain on Sepolia** | Deploy contract to Sepolia, set `VITE_CONTRACT_ADDRESS` and `VITE_DEV_RPC_URL` in Vercel, then redeploy. |

For more detail (why "Hardhat Not Running" appears, local vs Vercel), see [VERCEL.md](./VERCEL.md).
