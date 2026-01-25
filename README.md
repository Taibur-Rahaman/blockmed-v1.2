# 🏥 BlockMed V1.1 - Doctor Dashboard

Blockchain-based prescription management system with MetaMask integration and QR code generation.

## 🎯 Supervisor Demo Features

✅ **MetaMask Integration** - Connect wallet with ethers.js  
✅ **Blockchain Storage** - Store prescriptions on-chain  
✅ **QR Code Generation** - Instant QR codes for prescriptions  
✅ **Doctor Dashboard** - Clean, professional UI  
✅ **Activity Log** - Complete audit trail of all blockchain events  
✅ **Prescription Templates** - Save and reuse common prescription patterns  
✅ **Super Admin Portal** - Real-time user monitoring and access control

---

## 📚 Documentation

### Main Documentation
- **[README.md](./README.md)** - This file (setup and overview)
- **[WEEKLY_UPDATES.md](./WEEKLY_UPDATES.md)** - Consolidated weekly feature updates
- **[TEAM_UPDATE_SUPERVISOR.md](./TEAM_UPDATE_SUPERVISOR.md)** - Summary for supervisors
- **[SUPER_ADMIN_PORTAL.md](./SUPER_ADMIN_PORTAL.md)** - Complete Super Admin Portal guide

### System Guides
- **[BLOCKMED_V2_GUIDE.md](./BLOCKMED_V2_GUIDE.md)** - Complete system guide
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Project overview
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture

### Setup & Deployment
- **[QUICK_START.md](./QUICK_START.md)** - Quick setup guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[WALLET_SETUP.md](./WALLET_SETUP.md)** - Wallet configuration
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Testing guide  

---

## ⚙️ Setup Instructions

### 1️⃣ Install Dependencies

```bash
npm install
```

This will install:
- `react`, `react-dom`, `react-router-dom`
- `ethers` (v6.9.0) for blockchain interaction
- `qrcode.react` for QR code generation
- `vite` for fast development

---

### 2️⃣ Deploy Smart Contract

#### Option A: Using Hardhat (Recommended for local testing)

1. **Install Hardhat**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

2. **Deploy Contract**
```bash
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy.js --network localhost
```

3. **Copy the deployed contract address** and update:
   - `/src/utils/config.js` → `CONTRACT_ADDRESS`

#### Option B: Using Remix IDE

1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. Create new file: `BlockMed.sol`
3. Copy content from `/contracts/BlockMed.sol`
4. Compile with Solidity 0.8.19+
5. Deploy to:
   - **Local**: Hardhat/Ganache
   - **Testnet**: Sepolia/Goerli
6. Copy deployed address → update `config.js`

---

### 3️⃣ Configure MetaMask

1. **Install MetaMask** browser extension
2. **Add Local Network** (if using Hardhat):
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

3. **Import Test Account**:
   - Use one of the private keys from `npx hardhat node`
   - Or use your testnet account for Sepolia/Goerli

---

### 4️⃣ Update Contract Configuration

Edit `/src/utils/config.js`:

```javascript
export const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE'
```

---

### 5️⃣ Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

---

## 🧪 Testing Checklist

### ✅ Step 1: MetaMask Connection
- [ ] Click "Connect MetaMask" button
- [ ] MetaMask popup appears
- [ ] Accept connection
- [ ] Wallet address shows "Connected ✅"
- [ ] Dashboard page loads

### ✅ Step 2: Dashboard Navigation
- [ ] Connected wallet address is visible
- [ ] "Create New Prescription" button works
- [ ] Redirects to `/add-prescription`

### ✅ Step 3: Prescription Creation
- [ ] Enter Patient Hash: `hash123`
- [ ] Enter IPFS Hash: `QmXyz123abc...`
- [ ] Click "Submit Prescription"
- [ ] MetaMask confirmation popup appears
- [ ] Confirm transaction
- [ ] "Transaction Successful!" message shows
- [ ] Transaction hash is displayed

### ✅ Step 4: QR Code Verification
- [ ] QR code appears automatically
- [ ] QR code is scannable (test with phone camera)
- [ ] QR contains: `Prescription: hash123 | IPFS: QmXyz123...`

### ✅ Step 5: Blockchain Verification
Open browser console and verify:
```javascript
// Get prescription count
const count = await contract.prescriptionCount()
console.log('Total Prescriptions:', count.toString())

// Get prescription details
const prescription = await contract.getPrescription(1)
console.log('Prescription:', prescription)
```

---

## 📂 Project Structure

```
BlockMed V1.1/
├── contracts/
│   └── BlockMed.sol              # Smart contract
├── src/
│   ├── components/
│   │   └── MetaMaskConnect.jsx   # Wallet connection
│   ├── pages/
│   │   ├── Dashboard.jsx         # Doctor dashboard
│   │   └── AddPrescription.jsx   # Prescription form + QR
│   ├── utils/
│   │   ├── contractABI.json      # Contract ABI
│   │   └── config.js             # Contract address & config
│   ├── App.jsx                   # Main router
│   ├── main.jsx                  # React entry
│   └── index.css                 # Global styles
├── index.html
├── package.json
└── vite.config.js
```

---

## 🎓 Supervisor Demo Script

### Opening Statement:
*"Good day, Sir. This is BlockMed Version 1.1 - our blockchain-based prescription management system."*

### Demo Flow:

**1. MetaMask Connection** (30 seconds)
- Show MetaMask not connected
- Click connect button
- Explain: *"The doctor authenticates using their MetaMask wallet, ensuring secure identity verification"*
- Show connected address

**2. Dashboard** (20 seconds)
- Point out wallet address
- Highlight features: *"Blockchain secured, QR generation, verification system"*
- Click "Create New Prescription"

**3. Prescription Creation** (60 seconds)
- Fill Patient Hash: `patient_demo_001`
- Fill IPFS Hash: `QmDemo123HashForSupervisorDemo`
- Click Submit
- When MetaMask pops up: *"This triggers a blockchain transaction"*
- Confirm transaction
- Show transaction hash: *"This is proof the prescription is stored immutably on-chain"*

**4. QR Code** (30 seconds)
- Show generated QR code
- Scan with phone (if possible): *"This QR contains the patient and prescription data"*
- Explain: *"In Phase 3, we'll connect this QR to direct blockchain verification by pharmacies"*

**5. Blockchain Verification** (30 seconds)
- Open browser console
- Show prescription count increased
- Explain: *"Every prescription is permanently recorded and traceable"*

### Closing Statement:
*"Sir, this completes Phase 2. We have successfully integrated:*
- *Frontend React application*
- *MetaMask wallet authentication*
- *Smart contract interaction via ethers.js*
- *QR code generation for prescriptions*

*Next phase will add patient and pharmacy portals with full QR verification."*

---

## 🔧 Troubleshooting

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

### Issue: QR code not showing
**Solution**: 
- Check transaction was confirmed
- Verify `qrcode.react` is installed: `npm install qrcode.react`

---

## 🚀 Deploy to Vercel

### Quick Deploy

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/Taibur-Rahaman/blockmed-v1.2.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

3. **Configure Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add: `VITE_CONTRACT_ADDRESS` = `your_contract_address`
   - Redeploy after adding variables

4. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be live at `https://your-project.vercel.app`

### Manual Configuration

If auto-detection doesn't work, configure in Vercel dashboard:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables

Set these in Vercel:
- `VITE_CONTRACT_ADDRESS` - Your deployed smart contract address

---

## 🚀 Next Steps (Phase 3)

- [ ] Add patient dashboard
- [ ] Add pharmacy verification portal
- [ ] Connect QR scanning to blockchain verification
- [ ] Add prescription history view
- [ ] Implement role-based access control

---

## 📝 Important Notes

⚠️ **Before Demo**:
1. Deploy contract and update address
2. Test full flow at least once
3. Ensure MetaMask has test ETH
4. Keep network configuration handy

✨ **For Production**:
- Use environment variables for contract address
- Deploy to mainnet/testnet
- Add proper error handling
- Implement user authentication
- Add prescription encryption

---

## 📞 Support

For issues or questions:
1. Check console for errors
2. Verify network configuration
3. Ensure contract is deployed correctly
4. Review transaction on block explorer

---

**Built with ❤️ for BlockMed Supervisor Demo**
