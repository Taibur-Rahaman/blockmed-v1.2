# 🚀 Contract Deployment Guide – BlockMed V1.2

## Quick deploy (recommended)

If you see **"Contract not deployed"**, run:

```bash
npm run deploy:check
```

(with Hardhat node running: `npm run blockchain`)

This will:
1. ✅ Check if a contract is already at the configured address
2. ✅ Deploy only if needed
3. ✅ Update `src/utils/config.js` with the new address
4. ✅ Update `.env.local` with `VITE_CONTRACT_ADDRESS`

**After deploy:** Stop the dev server (Ctrl+C), run `npm run dev` again, and **hard-refresh** the browser (Ctrl+Shift+R or Cmd+Shift+R) so the new address is used.

---

## Manual Deployment

### Step 1: Start Hardhat Node

```bash
npm run blockchain
```

Keep this terminal running!

### Step 2: Deploy contract

In a **new terminal**, run:

```bash
npm run deploy:check
```

- **deploy:check** – Deploys only if no contract at configured address; updates `config.js` and `.env.local`.
- **deploy** – Always redeploys (FORCE_DEPLOY=1) and updates `config.js` and `.env.local`. Use after changing the Solidity contract.

### Step 3: Restart dev server and refresh browser

1. Stop the dev server (Ctrl+C) if it is running.
2. Run `npm run dev` again.
3. Hard-refresh the browser (Ctrl+Shift+R or Cmd+Shift+R).

The app will then use the new contract address from `.env.local` / `config.js`.

---

## Troubleshooting

### ❌ "Contract not deployed" Error

**Solution:**
```bash
npm run deploy:check
```

This automatically deploys and updates the config.

### ❌ "Hardhat not running" Error

**Solution:**
```bash
npm run blockchain
```

Keep this running in a separate terminal.

### ❌ Contract address mismatch

**Solution:**
1. Run `npm run deploy:check` - it will auto-update the address
2. Or manually update `src/utils/config.js` with the correct address

### ❌ "Cannot connect to Hardhat"

**Solution:**
1. Make sure Hardhat is running: `npm run blockchain`
2. Check it's on port 8545: `http://127.0.0.1:8545`
3. Restart Hardhat if needed

---

## Deployment scripts

| Command | Description |
|---------|-------------|
| `npm run deploy:check` | ✅ **Recommended.** Deploy only if no contract at address; updates config + .env.local |
| `npm run deploy` | Always redeploy (e.g. after Solidity changes); updates config + .env.local |
| `npm run blockchain` | Start Hardhat node (localhost:8545) |

---

## Contract address

After deployment, the address is shown in the terminal and saved to **`src/utils/config.js`** and **`.env.local`** (VITE_CONTRACT_ADDRESS). The app reads from env; default in code may be overridden by `.env.local`.

---

## Verify Deployment

After deployment, you can verify:

1. **In Browser Console:**
   ```javascript
   // Check if contract exists
   const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
   const code = await provider.getCode('0x5FbDB2315678afecb367f032d93F642f64180aa3')
   console.log(code !== '0x' ? '✅ Deployed' : '❌ Not deployed')
   ```

2. **In App:**
   - Connect with Dev Mode
   - Try creating a prescription
   - If it works, contract is deployed! ✅

---

## Quick Start Checklist

- [ ] Start Hardhat: `npm run blockchain`
- [ ] Deploy contract: `npm run deploy:check`
- [ ] Refresh browser
- [ ] Connect with Dev Mode
- [ ] Create prescription - should work! ✅

---

**Need help?** The `deploy:check` script handles everything automatically! 🎉
