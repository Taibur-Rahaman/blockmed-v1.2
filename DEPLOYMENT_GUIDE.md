# 🚀 Contract Deployment Guide

## Quick Deploy (Recommended)

If you get "Contract not deployed" error, run:

```bash
npm run deploy:check
```

This will:
1. ✅ Check if contract is already deployed
2. ✅ Deploy if needed
3. ✅ Automatically update `src/utils/config.js`
4. ✅ Show you the contract address

**That's it!** Just refresh your browser after running this.

---

## Manual Deployment

### Step 1: Start Hardhat Node

```bash
npm run blockchain
```

Keep this terminal running!

### Step 2: Deploy Contract

In a **new terminal**, run:

```bash
npm run deploy
```

Or use the check-and-deploy script:

```bash
npm run deploy:check
```

### Step 3: Update Config (if needed)

If you used `npm run deploy` (not `deploy:check`), you need to manually update:

**File:** `src/utils/config.js`

```javascript
export const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_ADDRESS_HERE'
```

### Step 4: Refresh Browser

Refresh your browser and the contract should be ready!

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

## Deployment Scripts

| Command | Description |
|---------|-------------|
| `npm run deploy:check` | ✅ **Best!** Checks and deploys if needed, auto-updates config |
| `npm run deploy` | Deploys contract (manual config update needed) |
| `npm run blockchain` | Starts Hardhat node |

---

## Contract Address

After deployment, the contract address will be shown in the terminal and automatically saved to `src/utils/config.js`.

**Default Hardhat address:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`

This is the deterministic address that Hardhat uses for the first deployment.

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
