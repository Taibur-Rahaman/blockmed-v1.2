# 🔧 Troubleshooting Guide - BlockMed V1.2

## 🎯 Common Issues & Solutions

This guide consolidates all troubleshooting information for BlockMed V1.2.

---

## ⚠️ White Page Issues

### Problem: App Shows White Page

**Possible Causes & Solutions:**

#### 1. Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Share any errors you see

#### 2. Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Check if all files load (no 404 errors)

#### 3. Verify Dev Server is Running
```bash
# Make sure dev server is running
npm run dev
```

Should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

#### 4. Clear Cache and Restart
```bash
# Stop the server (Ctrl+C)
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart
npm run dev
```

#### 5. Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

#### 6. Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache

---

## 🔧 Fixes Applied

### Error Boundary Added
- Created `ErrorBoundary.jsx` to catch React errors
- Shows user-friendly error messages instead of white page
- Displays error details for debugging

### Better Error Handling
- Added try-catch blocks in critical initialization code
- i18n initialization now has fallback
- Store rehydration error handling

### Loading State
- Added loading indicator while app initializes
- Prevents white page during startup

### Root Element Check
- Verifies root element exists before rendering
- Shows error if root element is missing

---

## 🦊 MetaMask/Wallet Issues

### Issue: "Please install MetaMask"
**Solution**: Install MetaMask browser extension from [metamask.io](https://metamask.io)

### Issue: "Transaction Failed"
**Solutions**:
- Check MetaMask is on correct network
- Verify contract address in `config.js`
- Ensure wallet has enough ETH for gas
- Check contract is deployed correctly

### Issue: "Invalid contract address"
**Solution**: 
- Re-deploy contract
- Update `CONTRACT_ADDRESS` in `/src/utils/config.js`

### Issue: Can't Connect Wallet
**Solutions**:
- Unlock MetaMask
- Refresh page
- Check network (should be "Hardhat Local" for dev)
- Use Dev Mode instead (easier!)

### Issue: Low Balance Warning
**Solution**: 
- Click "Fund Wallet" button (if using Hardhat)
- Or use Dev Mode (each account has 10,000 ETH)

---

## 📱 Feature-Specific Issues

### Issue: QR Code Not Showing
**Solutions**:
- Check transaction was confirmed
- Verify `qrcode.react` is installed: `npm install qrcode.react`
- Wait for transaction confirmation

### Issue: Analytics Page Not Loading
**Solutions**:
- Check if you're connected (wallet or Dev Mode)
- Verify contract is deployed
- Check browser console for errors

### Issue: Settings Page Not Working
**Solutions**:
- Clear browser cache
- Check localStorage is enabled
- Try incognito/private mode

---

## 🚀 Deployment Issues

### Issue: Build Fails
**Solutions**:
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### Issue: Vercel Deployment Fails
**Solutions**:
- Check build command: `npm run build`
- Verify output directory: `dist`
- Check environment variables are set
- Review build logs in Vercel dashboard

---

## 🔍 Debugging Steps

### Step 1: Check Console Errors
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Share any errors you see

### Step 2: Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Check if all files load (no 404 errors)

### Step 3: Verify Configuration
1. Check `src/utils/config.js` has correct contract address
2. Verify Hardhat node is running (if using local)
3. Check MetaMask network matches contract network

### Step 4: Test with Dev Mode
1. Click "🔧 Use Dev Mode" in app
2. Select any account
3. Each has 10,000 ETH automatically
4. This bypasses wallet connection issues

---

## 📋 Quick Checklist

Before reporting an issue, check:

- [ ] Dev server is running (`npm run dev`)
- [ ] No errors in browser console
- [ ] All files load in Network tab
- [ ] Hard refresh the page
- [ ] Check if ErrorBoundary shows an error message
- [ ] Try different browser
- [ ] Clear browser cache
- [ ] Contract is deployed
- [ ] Contract address is correct in config.js
- [ ] Network matches (Hardhat Local for dev)

---

## 🎯 Common Error Messages

### "Hardhat Not Running"
**Solution**: Run `npm run blockchain` in a terminal

### "Fund Wallet" Not Showing
**Solution**: Make sure Hardhat is running and you're on Chain ID 31337

### "Connection errors"
**Solution**: Use **Dev Mode** instead - it's easier!

### "Transaction reverted"
**Solution**: 
- Check you have enough ETH for gas
- Verify contract address is correct
- Check you're on the right network

---

## 💡 Pro Tips

1. **Use Dev Mode for development** - It's the fastest way
2. **Each Dev Mode account has 10,000 ETH** - More than enough for testing
3. **Check browser console first** - Most errors are visible there
4. **Hard refresh** - Often fixes caching issues
5. **Try different browser** - Sometimes browser-specific issues

---

## 📞 Still Need Help?

If you've tried all the above and still have issues:

1. **Check the error message** in browser console
2. **Check ErrorBoundary** - It should show the error
3. **Share the error message** - Include:
   - Browser console errors
   - Network tab errors
   - Steps to reproduce
   - What you expected vs what happened

---

## 🔄 Recent Fixes Applied

### White Page Fix
- ✅ Error Boundary added
- ✅ Better error handling
- ✅ Loading state
- ✅ Root element check

### Feature Enabling
- ✅ Analytics page enabled
- ✅ Settings page enabled
- ✅ All routes working
- ✅ Navigation updated

### Wallet Improvements
- ✅ Dev Mode support
- ✅ One-click wallet funding
- ✅ Better error messages
- ✅ Auto-balance display

---

**For more help, check:**
- [README.md](./README.md) - Main documentation
- [QUICK_START.md](./QUICK_START.md) - Setup guide
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions

---

*Last Updated: This Week*  
*Version: BlockMed V1.2*
