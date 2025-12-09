# 🚀 Easy Wallet Setup Guide - BlockMed

## Quick Start (Easiest Method - Recommended)

### Option 1: Dev Mode (No Wallet Needed!) ⭐

**This is the EASIEST way - no MetaMask, no Frame, no funding issues!**

1. **Start Hardhat node:**
   ```bash
   npm run blockchain
   # or
   npx hardhat node
   ```

2. **In your app, click "🔧 Use Dev Mode (Recommended)"**
   - Select any account (Admin, Doctor, Pharmacist, etc.)
   - Each account has **10,000 ETH** automatically
   - No wallet setup needed!
   - Free transactions!

**That's it!** You're ready to test. No funding, no wallet connection issues.

---

## Option 2: MetaMask/Frame Wallet (If you prefer)

### Step 1: Start Hardhat
```bash
npm run blockchain
```

### Step 2: Connect Your Wallet
1. Open MetaMask or Frame
2. Click "Connect Wallet" in the app
3. The app will automatically switch to Hardhat network (Chain ID: 31337)

### Step 3: Fund Your Wallet (One Click!)
1. After connecting, you'll see your balance
2. Click **"💰 Fund Wallet (10 ETH)"** button
3. Wait a few seconds - you'll receive 10 ETH automatically!

**No manual funding needed!** The app does it for you.

---

## Troubleshooting

### ❌ "Hardhat Not Running"
**Solution:** Run `npm run blockchain` in a terminal

### ❌ "Fund Wallet" button not showing
**Solution:** 
1. Make sure Hardhat is running
2. Make sure you're connected to Hardhat network (Chain ID: 31337)
3. Refresh the page

### ❌ "Insufficient funds" error
**Solution:** 
- The funder account might be low. Restart Hardhat node to reset all accounts to 10,000 ETH

### ❌ MetaMask/Frame can't connect
**Solution:** 
- Use **Dev Mode** instead! It's easier and has no connection issues.

---

## Network Setup

### Hardhat Local Network
- **Chain ID:** 31337 (0x7a69 in hex)
- **RPC URL:** http://127.0.0.1:8545
- **Currency:** ETH
- **Accounts:** 20 pre-funded accounts with 10,000 ETH each

### Adding Hardhat to MetaMask/Frame

The app will automatically add Hardhat network when you connect. If it doesn't:

1. **MetaMask:**
   - Settings → Networks → Add Network
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Frame:**
   - Settings → Networks → Add Custom Network
   - Same settings as above

---

## Dev Mode Accounts

When using Dev Mode, you can switch between these pre-funded accounts:

| Account | Address | Role | Balance |
|---------|---------|------|---------|
| #0 | 0xf39Fd6...92266 | Admin | 10,000 ETH |
| #1 | 0x709979...dc79C8 | Doctor | 10,000 ETH |
| #2 | 0x3C44Cd...4293BC | Pharmacist | 10,000 ETH |
| #3 | 0x90F79b...93b906 | Manufacturer | 10,000 ETH |
| #4 | 0x15d34A...2C6A65 | Patient | 10,000 ETH |
| #5 | 0x996550...0A4dc | Regulator | 10,000 ETH |

---

## Quick Commands

```bash
# Start Hardhat node
npm run blockchain

# Deploy contracts
npm run deploy

# Run tests
npm run test:blockchain

# Start app
npm run dev
```

---

## Why Dev Mode is Better

✅ **No wallet installation needed**  
✅ **No funding issues**  
✅ **No network switching**  
✅ **Instant connection**  
✅ **10,000 ETH per account**  
✅ **Free transactions**  
✅ **Easy account switching**  
✅ **Perfect for development**

**Use Dev Mode for the easiest experience!**
