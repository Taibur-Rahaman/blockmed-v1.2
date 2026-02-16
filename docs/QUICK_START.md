# ⚡ Quick Start – BlockMed V1.2

## 🎯 Easiest method: Dev Mode (recommended)

**No wallet needed. No funding issues.**

1. **Start Hardhat:**
   ```bash
   npm run blockchain
   ```

2. **Deploy contract (in another terminal):**
   ```bash
   npm run deploy:check
   ```
   This deploys if needed and updates `config.js` and `.env.local`.

3. **Start the app:**
   ```bash
   npm run dev
   ```

4. **In the app:** Click **"🔧 Use Dev Mode (Recommended)"** on the login page
   - Select an account (Admin #0, Doctor #1, Pharmacist #2, etc.)
   - Each has 10,000 ETH automatically
   - Or after login: **Settings → Blockchain Setup → Enable Dev Mode**

**That's it!** ✅

---

## 🦊 Using MetaMask/Frame (Alternative)

1. **Start Hardhat:**
   ```bash
   npm run blockchain
   ```

2. **Connect your wallet** in the app

3. **Click "💰 Fund Wallet"** button
   - Automatically receives 10 ETH
   - No manual steps needed!

---

## 📋 What's New

✅ **One-click wallet funding** - No manual transfers needed  
✅ **Improved Dev Mode** - More reliable and user-friendly  
✅ **Auto-balance display** - See your balance in real-time  
✅ **Better error handling** - Clear messages when something's wrong  
✅ **Easy account switching** - Switch between Dev Mode accounts instantly  

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Hardhat Not Running" | Run `npm run blockchain` |
| "Fund Wallet" not showing | Make sure Hardhat is running and you're on Chain ID 31337 |
| Low balance warning | Click "Fund Wallet" button |
| Connection errors | Use **Dev Mode** instead - it's easier! |

---

## 💡 Pro Tips

1. **Use Dev Mode for development** - It's the fastest way
2. **Each Dev Mode account has 10,000 ETH** - More than enough for testing
3. **Switch accounts easily** - Click "Switch Account" in Dev Mode
4. **Fund wallet button** - Only shows when Hardhat is running and you have a connected wallet

---

## 📞 Need help?

- **[WALLET_SETUP.md](./WALLET_SETUP.md)** – Dev Mode and MetaMask details
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** – Deploy and config
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** – Common issues

**Remember: Dev Mode is the easiest option.** 🚀
