# Vercel Deployment Guide

## How BlockMed Runs on Vercel

Vercel hosts **only the frontend** (React app). It cannot run a blockchain node.

- **Hardhat node** = long‑running process; Vercel = serverless (short-lived functions)
- Vercel builds and serves static assets; it does not keep `npx hardhat node` running

## Modes on Vercel

### Demo mode (default)

- No blockchain connection
- App uses demo data (batches, prescriptions)
- No MetaMask or Dev Mode required

### Blockchain mode (optional)

To use real blockchain when deployed on Vercel:

1. **Deploy the contract to a testnet** (e.g. Polygon Mumbai, Sepolia):
   ```bash
   npm run deploy:polygon
   ```
   (Configure `hardhat.config.js` with the target network and keys.)

2. **Set environment variable in Vercel:**
   - Project → Settings → Environment Variables
   - Add: `VITE_CONTRACT_ADDRESS` = your deployed contract address

3. **User setup:**
   - Connect MetaMask
   - Switch to the same testnet (e.g. Polygon Mumbai)
   - Use the app as usual

## Summary

| Environment   | Blockchain                    | Data source              |
|--------------|-------------------------------|---------------------------|
| Local dev    | `npx hardhat node` + Dev Mode | On-chain (local)          |
| Vercel (default) | None                      | Demo data                 |
| Vercel + testnet | None (user’s wallet)      | On-chain (Polygon/Sepolia)|
