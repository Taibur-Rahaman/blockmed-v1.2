# 🧪 BlockMed Testing Checklist – BlockMed V1.2

## Pre-Demo Setup Verification

### ✅ Environment Check
- [ ] Node.js installed (v16+)
- [ ] npm working correctly
- [ ] All dependencies installed (`npm install`)
- [ ] MetaMask extension installed (optional – Dev Mode does not require it)

### ✅ Contract Deployment
- [ ] Hardhat node running in Terminal 1 (`npm run blockchain`)
- [ ] Contract deployed: `npm run deploy:check` (in Terminal 2)
- [ ] Deploy script updated `src/utils/config.js` and `.env.local`
- [ ] Dev server restarted after deploy (`npm run dev`) and browser hard-refreshed (Ctrl+Shift+R / Cmd+Shift+R)

### ✅ Connection (Dev Mode or MetaMask)
- [ ] **Dev Mode:** Login page → "🔧 Use Dev Mode (Recommended)" → select account (e.g. Admin #0, Doctor #1)
- [ ] Or **MetaMask:** Hardhat Local added (Chain ID 31337, RPC http://127.0.0.1:8545); test account imported; ~10000 ETH
- [ ] Or **Settings → Blockchain Setup → Enable Dev Mode** after login

### ✅ Frontend Launch
- [ ] Development server running (`npm run dev`)
- [ ] App opens at http://localhost:3000
- [ ] No console errors on load
- [ ] Page loads completely

---

## Functional Testing

### 🔌 Test Case 1: Connection (Dev Mode or MetaMask)
**Steps:**
1. Open app; if no MetaMask, use Dev Mode on login page
2. Click "🔧 Use Dev Mode (Recommended)" and select an account, OR connect MetaMask

**Expected Result:**
- [ ] Dev Mode: account selected, no MetaMask required; or MetaMask connects
- [ ] If no wallet and no Dev Mode: message to connect wallet or enable Dev Mode

**Status:** ⬜ Pass / ⬜ Fail

---

### 🦊 Test Case 2: Login (Dev Mode or Wallet)
**Steps:**
1. Use Dev Mode: click "Use Dev Mode", select account (e.g. Admin #0 or Doctor #1); OR connect MetaMask
2. If new user: register (name, license, role); Admin can verify via User Management or `npm run verify:user`

**Expected Result:**
- [ ] Dev Mode: account selected, dashboard loads with role
- [ ] Wallet: connection successful; wallet address displayed; dashboard loads
- [ ] User role and verification status shown (Admin can dispense; verified Doctor can create prescriptions)

**Status:** ⬜ Pass / ⬜ Fail

---

### 🏠 Test Case 3: Dashboard Display
**Steps:**
1. After successful connection
2. Verify dashboard elements

**Expected Result:**
- [ ] Page title: "BlockMed Dashboard"
- [ ] Connected wallet address visible and correct
- [ ] Wallet address matches MetaMask
- [ ] "Create New Prescription" button present
- [ ] Features section displays correctly
- [ ] Disconnect button works

**Status:** ⬜ Pass / ⬜ Fail

---

### 📝 Test Case 4: Navigation to Prescription Page
**Steps:**
1. From dashboard
2. Click "Create New Prescription"

**Expected Result:**
- [ ] Page navigates to `/add-prescription`
- [ ] Form loads correctly
- [ ] Two input fields present (Patient Hash, IPFS Hash)
- [ ] "Back to Dashboard" button visible
- [ ] Connected wallet address shown at top

**Status:** ⬜ Pass / ⬜ Fail

---

### ❌ Test Case 5: Empty Form Validation
**Steps:**
1. On prescription page
2. Leave fields empty
3. Click "Submit Prescription"

**Expected Result:**
- [ ] Alert appears: "Please fill all fields"
- [ ] No MetaMask popup
- [ ] Form remains on page
- [ ] Error message displayed

**Status:** ⬜ Pass / ⬜ Fail

---

### 📄 Test Case 6: Prescription Submission - Valid Data
**Steps:**
1. Fill Patient Hash: `patient_demo_001`
2. Fill IPFS Hash: `QmDemoHashForSupervisor123`
3. Click "Submit Prescription"
4. MetaMask popup appears
5. Click "Confirm"
6. Wait for confirmation

**Expected Result:**
- [ ] MetaMask popup shows gas estimate
- [ ] Transaction details visible in MetaMask
- [ ] "Submitting to Blockchain..." loading state shown
- [ ] After confirmation: "Transaction Successful!" message
- [ ] Transaction hash displayed (starts with 0x)
- [ ] Prescription ID shows (e.g., #1)

**Transaction Hash:** _________________

**Prescription ID:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

### 📱 Test Case 7: QR Code Generation
**Steps:**
1. After successful transaction (Test Case 6)
2. Observe QR code section

**Expected Result:**
- [ ] QR code appears automatically
- [ ] QR code heading: "Prescription QR Code"
- [ ] QR code size approximately 180x180px
- [ ] QR code centered on page
- [ ] Text below QR shows exact data:
  ```
  Prescription: patient_demo_001 | IPFS: QmDemoHashForSupervisor123
  ```

**Status:** ⬜ Pass / ⬜ Fail

---

### 📲 Test Case 8: QR Code Scanning
**Steps:**
1. Use phone camera or QR scanner app
2. Point at QR code on screen
3. Read scanned data

**Expected Result:**
- [ ] QR code is scannable
- [ ] Scanned data matches:
  ```
  Prescription: patient_demo_001 | IPFS: QmDemoHashForSupervisor123
  ```
- [ ] No encoding errors

**Scanned Data:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

### 🔄 Test Case 9: Create Another Prescription
**Steps:**
1. After first prescription created
2. Click "Create Another" button
3. Fill new data:
   - Patient Hash: `patient_demo_002`
   - IPFS Hash: `QmSecondPrescriptionHash456`
4. Submit and confirm

**Expected Result:**
- [ ] Form clears completely
- [ ] Can enter new data
- [ ] Second transaction succeeds
- [ ] Prescription ID increments (should be #2)
- [ ] New QR code generated with new data

**Second Prescription ID:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

### 🔙 Test Case 10: Navigation - Back to Dashboard
**Steps:**
1. From prescription page (with or without submission)
2. Click "Back to Dashboard"

**Expected Result:**
- [ ] Returns to dashboard page
- [ ] Wallet still connected
- [ ] No errors
- [ ] Dashboard displays correctly

**Status:** ⬜ Pass / ⬜ Fail

---

### 🔌 Test Case 11: Account Change Detection
**Steps:**
1. While connected
2. Open MetaMask
3. Switch to different account
4. Observe app behavior

**Expected Result:**
- [ ] App detects account change
- [ ] New address displayed automatically
- [ ] No errors in console
- [ ] Can still create prescriptions

**Status:** ⬜ Pass / ⬜ Fail

---

### 🌐 Test Case 12: Network Switch Detection
**Steps:**
1. While connected to Hardhat Local
2. Switch MetaMask to different network (e.g., Ethereum Mainnet)
3. Try to submit prescription

**Expected Result:**
- [ ] Transaction fails gracefully
- [ ] Error message displayed
- [ ] App doesn't crash

**Status:** ⬜ Pass / ⬜ Fail

---

## Blockchain Verification

### 🔍 Test Case 13: Verify Contract State
**Steps:**
1. Open browser console (F12)
2. Run these commands:

```javascript
// Connect to contract
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(
  'YOUR_CONTRACT_ADDRESS',
  contractABI,
  signer
);

// Check prescription count
const count = await contract.prescriptionCount();
console.log('Total Prescriptions:', count.toString());

// Get prescription #1
const prescription = await contract.getPrescription(1);
console.log('Prescription #1:', prescription);
```

**Expected Result:**
- [ ] Prescription count matches number created
- [ ] Can retrieve prescription data
- [ ] Data matches what was entered
- [ ] Doctor address matches connected wallet
- [ ] Timestamp is recent

**Prescription Count:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

## Error Handling Tests

### ⚠️ Test Case 14: Rejected Transaction
**Steps:**
1. Fill prescription form
2. Click Submit
3. In MetaMask popup, click "Reject"

**Expected Result:**
- [ ] Error message: "Transaction rejected by user"
- [ ] No QR code generated
- [ ] Form still has data
- [ ] Can retry submission

**Status:** ⬜ Pass / ⬜ Fail

---

### ⚠️ Test Case 15: Invalid Contract Address
**Steps:**
1. Change contract address in config.js to invalid address
2. Restart dev server
3. Try to submit prescription

**Expected Result:**
- [ ] Error caught gracefully
- [ ] Error message displayed
- [ ] No crash or blank screen

**Status:** ⬜ Pass / ⬜ Fail

---

## Performance Tests

### ⚡ Test Case 16: Loading Speed
**Steps:**
1. Hard refresh page (Cmd+Shift+R / Ctrl+Shift+R)
2. Measure load time

**Expected Result:**
- [ ] Page loads in < 3 seconds
- [ ] No flickering
- [ ] Smooth transitions

**Load Time:** _________ seconds

**Status:** ⬜ Pass / ⬜ Fail

---

### ⚡ Test Case 17: Transaction Speed
**Steps:**
1. Submit prescription
2. Time from submit to confirmation

**Expected Result:**
- [ ] MetaMask popup appears instantly
- [ ] Confirmation takes < 5 seconds (local network)
- [ ] QR generates immediately after confirmation

**Transaction Time:** _________ seconds

**Status:** ⬜ Pass / ⬜ Fail

---

## Cross-Browser Testing

### 🌐 Test Case 18: Chrome/Brave
- [ ] App loads correctly
- [ ] MetaMask connects
- [ ] Prescriptions submit successfully
- [ ] QR codes generate

**Status:** ⬜ Pass / ⬜ Fail

---

### 🌐 Test Case 19: Firefox
- [ ] App loads correctly
- [ ] MetaMask connects
- [ ] Prescriptions submit successfully
- [ ] QR codes generate

**Status:** ⬜ Pass / ⬜ Fail

---

### 🌐 Test Case 20: Edge
- [ ] App loads correctly
- [ ] MetaMask connects
- [ ] Prescriptions submit successfully
- [ ] QR codes generate

**Status:** ⬜ Pass / ⬜ Fail

---

## Mobile Responsiveness

### 📱 Test Case 21: Mobile View
**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar
3. Select iPhone or Android device
4. Test all features

**Expected Result:**
- [ ] Layout adapts to mobile
- [ ] Buttons are tappable
- [ ] Forms are usable
- [ ] QR code visible and scannable

**Status:** ⬜ Pass / ⬜ Fail

---

## Console Checks

### 🐛 Test Case 22: No Console Errors
**Steps:**
1. Open DevTools console
2. Perform all major actions
3. Check for errors

**Expected Result:**
- [ ] No red errors in console
- [ ] Only info/log messages
- [ ] No warning about deprecated features

**Errors Found:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

## Final Demo Readiness

### ✅ Pre-Demo Final Check (Do this 10 minutes before demo)

- [ ] All test cases passed
- [ ] Hardhat node running
- [ ] Frontend running
- [ ] MetaMask connected to Hardhat Local
- [ ] Test account has ETH
- [ ] Browser console clear
- [ ] Demo data prepared:
  - Patient Hash: `patient_demo_001`
  - IPFS Hash: `QmDemoHashForSupervisor123`
- [ ] Phone ready for QR scan
- [ ] Backup plan if internet/MetaMask fails

---

## Test Summary

**Total Test Cases:** 22

**Passed:** _____ / 22

**Failed:** _____ / 22

**Critical Failures (must fix):**
1. _________________
2. _________________
3. _________________

**Non-Critical Issues (nice to fix):**
1. _________________
2. _________________

**Tested By:** _________________

**Date:** _________________

**Ready for Demo:** ⬜ YES / ⬜ NO

---

## Notes / Observations

_____________________________________________________________

_____________________________________________________________

_____________________________________________________________

_____________________________________________________________

---

**Good luck with your demo! 🎓🚀**
