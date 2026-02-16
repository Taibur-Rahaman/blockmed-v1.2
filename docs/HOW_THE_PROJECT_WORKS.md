# How the Project Works

**BlockMed** – Blockchain-based prescription system. This document explains the flow, main components, and how each part works in detail (Bangla + English).

**Note:** The project may use a basic **BlockMed** contract (single prescription type) or an advanced **BlockMedV2** contract (roles, batches, versions). The ideas below apply to both; where behaviour differs, it is noted.

---

## High-level Flow (Overview)

1. **Doctor** প্রথমে web app open করে: `http://localhost:3000`
2. **MetaMask** দিয়ে wallet connect করে।
3. **Dashboard** এ গিয়ে connected wallet address দেখে।
4. **"Create New Prescription"** বাটন ক্লিক করে form এ যায়।
5. **Patient Hash + IPFS Hash** (অথবা full form fill) input দেয় → Submit করে।
6. **MetaMask pop-up** আসে → blockchain transaction confirm করে (smart contract-এ `addPrescription` / `createPrescription` call হয়)।
7. **Transaction confirm** হলে:
   - Transaction hash show করে
   - Prescription ID পাওয়া যায়
   - QR code generate হয় যার ভিতরে থাকে patient hash + IPFS hash (অথবা prescriptionId + metadata)

---

## Detailed Step-by-Step: What Happens When

### When the doctor opens the app (`http://localhost:3000`)

1. Browser requests the React app from the dev server (Vite).
2. **App.jsx** loads → React Router and all route components load.
3. **Auth check:** যদি আগে থেকে wallet connect করা থাকে (e.g. state/store or `localStorage`), তাহলে সরাসরি Dashboard দেখায়; নাহলে Login / MetaMask connect পেজ দেখায়।
4. **MetaMask connect** করলে: `window.ethereum` দিয়ে `eth_requestAccounts` call হয় → user MetaMask-এ Approve করলে wallet address পাওয়া যায় → সেই address **account** state/store-এ save হয়।
5. **Routing:** `account` থাকলে `/` = Dashboard, `/add-prescription` বা `/create-prescription` = prescription form। অন্য কোনো path লিখলে সাধারণত `/`-এ redirect।

### When the doctor clicks "Create New Prescription"

1. **Navigation:** `navigate('/add-prescription')` বা `navigate('/create-prescription')` call হয়।
2. Prescription form component load হয়।
3. Form এ থাকে: Patient info (name, age, gender, DOB), Symptoms, Diagnosis, Medicines (search + add), Tests, Advice, Follow-up, Validity। (Basic version এ শুধু Patient Hash + IPFS Hash দুইটা field ও থাকতে পারে।)
4. Doctor form fill করে। Optional: "Generate" বাটন দিয়ে আগে locally patient hash + summary বানিয়ে QR দেখতে পারে (এখনো blockchain-এ যায় না)।

### When the doctor clicks Submit (blockchain-এ পাঠানোর সময়)

নিচের ধাপগুলো **অনুক্রমে** হয়:

| Step | কী হয় (Bangla) | Technical |
|------|------------------|-----------|
| 1 | Form check – patient hash আর IPFS/data খালি আছে কি না | `validateForm()`; খালি থাকলে alert/error, submit বন্ধ |
| 2 | MetaMask আছে কি না check | `if (!window.ethereum)` → error message |
| 3 | Ethereum **provider** বানানো | `new ethers.BrowserProvider(window.ethereum)` – এটা blockchain-এর সাথে কথা বলার মাধ্যম |
| 4 | **Signer** নেওয়া | `await provider.getSigner()` – যে wallet দিয়ে transaction sign হবে (doctor) |
| 5 | **Contract instance** বানানো | `new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)` – ঠিকানা + ABI দিয়ে contract-এর function call করা যায় |
| 6 | Contract function call | `contract.addPrescription(patientHash, ipfsHash)` বা V2-তে `createPrescription(...)` – এটা একটা **transaction** তৈরি করে, এখনো chain-এ যাওয়া হয়নি |
| 7 | MetaMask pop-up | User কে transaction confirm করতে হয় (gas fee দেখায়) |
| 8 | Transaction পাঠানো | User Approve করলে transaction network-এ যায় (local Hardhat বা mainnet) |
| 9 | অপেক্ষা | `await tx.wait()` – transaction mine হওয়া পর্যন্ত wait |
| 10 | Success handling | Transaction hash (`tx.hash`), receipt, এবং contract থেকে নতুন prescription ID (e.g. `prescriptionCount`) নেওয়া হয় |
| 11 | UI update | Transaction hash, prescription ID, এবং QR data (patientHash + ipfsHash বা `{ prescriptionId, patientHash, ipfsHash }`) state-এ set হয় → screen-এ দেখায় |

যদি কোনো step-এ error হয় (e.g. user reject করল, wrong network, contract revert), তাহলে `catch` block-এ error message user কে দেখানো হয় এবং transaction হয় না।

### Why Patient Hash and IPFS Hash?

- **Patient Hash:** রোগীর আসল নাম/আইডি blockchain-এ সরাসরি না দিয়ে একটা **hash** (e.g. `btoa(name|age|timestamp)` বা অন্য identifier) দেয়। এতে privacy বজায় থাকে; শুধু যার hash জানা আছে সে নিজের prescription match করতে পারবে।
- **IPFS Hash:** বড় prescription data (লক্ষণ, ওষুধ, পরামর্শ ইত্যাদি) IPFS-এ upload করে তার **hash** blockchain-এ রাখা হয়। Blockchain-এ শুধু hash রাখলে cost কম থাকে; আসল ডেটা IPFS-এ থাকে। (কোনো সংস্করণে IPFS hash-এর বদলে JSON string ও ব্যবহার হতে পারে।)

---

## Data Flow (কী দিয়ে কী যায়)

```
[ Doctor Browser ]
       │
       │ 1. Fill form (patient hash, IPFS hash / full prescription)
       ▼
[ AddPrescription / CreatePrescription Component ]
       │
       │ 2. validateForm() → if OK, get provider & signer
       │ 3. ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
       ▼
[ MetaMask ]
       │ 4. User confirms transaction (gas)
       ▼
[ Local Blockchain (Hardhat) or Network ]
       │ 5. Transaction mined → contract state updated
       ▼
[ Smart Contract – BlockMed.sol / BlockMedV2.sol ]
       │ 6. addPrescription() or createPrescription()
       │    - prescriptionCount++
       │    - prescriptions[id] = { ... }
       │    - emit PrescriptionAdded / PrescriptionCreated
       ▼
[ Frontend ]
       │ 7. tx.wait() → get receipt, prescription ID
       │ 8. setTxHash, setPrescriptionId, setQrValue(...)
       ▼
[ UI shows: Tx hash, Prescription ID, QR code ]
```

**সংক্ষেপে:** User input → Frontend validation → MetaMask sign → Network → Contract state change → Event → Frontend আবার contract থেকে ID/ডেটা নেয় → UI update।

---

## Core Parts (Main Components + How They Work)

### 1. Smart Contract – `contracts/BlockMed.sol` (বা `BlockMedV2.sol`)

**Purpose:** Prescription blockchain-এ store করা, যাতে কেউ edit করতে না পারে (immutability)। V2-তে roles, batches, prescription versions ইত্যাদি ও থাকে।

**Important parts:**

- **`struct Prescription`** → প্রতিটি prescription-এর ডেটা এক জায়গায়।  
  সাধারণ ফিল্ড: `id`, `patientHash`, `ipfsHash`, `doctor` (address), `timestamp`/`createdAt`, `verified`/`isDispensed`।  
  V2-তে: `expiresAt`, `version`, `isActive`, `digitalSignature`, dispense-related ফিল্ড ইত্যাদি।
- **`mapping(uint256 => Prescription) prescriptions`**  
  → key = prescription ID (1, 2, 3, …), value = সেই prescription-এর struct। ID দিয়ে দ্রুত lookup।
- **`prescriptionCount`** → মোট কয়টা prescription যোগ হয়েছে (auto increment)। নতুন add করলে আগে `prescriptionCount++` করে সেই সংখ্যাটাই নতুন prescription-এর ID হয়।
- **Events** (e.g. `PrescriptionAdded`, `PrescriptionCreated`) → Frontend বা অন্য service এই ইভেন্ট listen করে জানতে পারে কখন নতুন prescription যোগ হয়েছে।

**Main functions (basic BlockMed):**

| Function | What it does (Bangla + English) |
|----------|----------------------------------|
| `addPrescription(patientHash, ipfsHash)` | New prescription blockchain-এ store করে + auto ID generate করে; empty string allow করে না (`require`) |
| `getPrescription(id)` | ID দিয়ে prescription details return করে (view, no gas for read) |
| `verifyPrescription(id)` | Prescription verify করার flag true করে দেয় (write, gas লাগে) |
| `getPrescriptionsByDoctor(address)` | ঐ doctor-এর সব prescription ID-র array return করে |

**V2-তে অতিরিক্ত:** Roles (`registerUser`, `verifyUser`, `deactivateUser`), `createPrescription` (with expiry, version), `dispensePrescription`, `createBatch`, `flagBatch`, `recallBatch`, `getSystemStats` ইত্যাদি। Contract-এর ABI দেখলে সব function-এর নাম ও parameter বের করা যায়।

---

### 2. Contract Interface (Frontend এ Smart Contract connect করার জন্য)

- - **`src/utils/contractABI.json`** → Smart contract compile করার পর যে ABI বের হয় সেটা এখানে। ABI = contract-এর function names, parameters, return types এর JSON list। Frontend এই ABI দিয়ে জানে কোন function কী argument নেয় এবং কী return করে। ABI ছাড়া `ethers.Contract` দিয়ে call করা যায় না।
- **`src/utils/config.js`** (বা `config.ts`) → `CONTRACT_ADDRESS` (deployed contract-এর ঠিকানা), এবং প্রায়ই network config (chainId, RPC URL)। Deploy করার পর নতুন address পাওয়া গেলে **এখানে আপডেট করতে হয়**, নাহলে frontend পুরানো/ভুল contract-এ call করবে।
- **`contractHelper.js`** (যদি থাকে) → Provider ও signer বানানোর logic: Dev Mode (Hardhat direct) বনাম Wallet (MetaMask)। এক জায়গায় থেকে `getReadContract()`, `getWriteContract()`, `getProvider()`, `getSigner()` ইত্যাদি দিয়ে app সব জায়গায় same way-তে contract use করে।

এগুলো ছাড়া Frontend contract-এর function চিনবে না।

---

### 3. App Routing – `App.jsx`

- **Initialization:** App load হলে store (e.g. Zustand), i18n, theme ইত্যাদি load হয়। কখনো Dev Mode init করা হয় (local Hardhat connection এর জন্য)।
- **Auth / Wallet:** Wallet connected আছে কি না **store** বা state থেকে check হয় (`account`). যদি user আগে connect করে থাকে এবং session থাকলে, `account` already set থাকতে পারে।
- **Restriction / Force logout:** যদি admin user কে restrict বা force-logout করে দিয়ে থাকে, তাহলে `sessionStorage` বা `localStorage` check করে user কে বের করে দিতে পারে।
- **Routing logic:** Login/connect পেজে MetaMask connect বা role-based login হয়। যদি **account না থাকে** → Login / MetaMask connect page show হয়। যদি **account থাকে** → Main layout (sidebar/nav) + routes enable হয়।
- **Routes (উদাহরণ):** `/` বা `/dashboard` → Dashboard; `/create-prescription` বা `/add-prescription` → Prescription form; `/pharmacy-verification` → Pharmacy verification; `/patient-portal`, `/medicine-management`, `/user-management`, `/activity-log`, `/prescription-templates` ইত্যাদি; `*` → Not found বা redirect to `/`.

👉 App.jsx মূল controller: কে লগইন আছে কি না দিয়ে কোন পেজ দেখাবে সেটা ঠিক করে; React Router দিয়ে সব navigation।

---

### 4. MetaMask Connect (Login)

**কোথায় থাকে:** সাধারণত `LoginPage.jsx` বা আলাদা `MetaMaskConnect.jsx` component।

**What it does (বিস্তারিত):**

1. **Browser check:** `if (typeof window !== 'undefined' && window.ethereum)` দিয়ে check করা হয় MetaMask (বা অন্য Ethereum wallet) installed আছে কি না। না থাকলে "Please install MetaMask" ধরনের message।
2. **Connect request:** Connect বাটনে ক্লিক করলে `window.ethereum.request({ method: 'eth_requestAccounts' })` call হয়। এটা MetaMask-এ pop-up খুলে দেয়: user কে সেই site কে accounts access দিতে হবে।
3. **Address পাওয়া:** User approve করলে একটা array of addresses return হয়। সাধারণত প্রথমটা নেওয়া হয় এবং সেটা **store**-এ বা parent-এর state-এ save হয় (`setAccount(address)` বা store-এর `setAccount`)।
4. **Network check (optional):** অনেক app check করে current chain ID (e.g. 31337 for Hardhat) সঠিক কি না। ভুল network এ থাকলে "Please switch to Hardhat Local" ধরনের prompt।
5. **Disconnect / Change:** Disconnect বাটন দিয়ে `setAccount(null)` করা হয়। আর MetaMask-এ account change করলে অনেক app `accountsChanged` event listen করে আপডেট করে।

👉 সংক্ষেপে: Login = MetaMask দিয়ে wallet connect করা এবং সেই address টা app-এর state/store-এ রাখা।

---

### 5. Dashboard – `Dashboard.jsx`

**কী দেখায় (বিস্তারিত):**

- **Header:** Project title (BlockMed), language/theme toggle যদি থাকে।
- **Wallet / Account:** Connected wallet address (পুরো বা short format যেমন `0x1234...5678`)। Doctor হিসেবে যে address দিয়ে connect করা সেটাই এখানে।
- **Stats (V2 বা advanced):** Contract থেকে নিয়ে আসা সংখ্যা: total prescriptions, total batches, total users, dispensed count, flagged/recalled counts ইত্যাদি। `getSystemStats()` বা আলাদা function দিয়ে।
- **Recent prescriptions (Doctor):** যদি current user Doctor হয়, তাহলে `getPrescriptionsByDoctor(account)` দিয়ে ID গুলো নিয়ে প্রতিটার জন্য `getPrescription(id)` call করে সাম্প্রতিক কয়টা prescription card/table আকারে দেখানো যায়।
- **Alerts:** Flagged বা recalled batches থাকলে সেগুলো একটা alerts section-এ দেখানো যায়।
- **Actions:** "Create New Prescription" বাটন → `navigate('/create-prescription')` বা `/add-prescription`; Disconnect বাটন → wallet disconnect।
- **Quick links:** Pharmacy Verification, Patient Portal, Medicine Management, Activity Log, Templates ইত্যাদি (role অনুযায়ী)।

**Data load:** Dashboard mount হলে (অথবা `account` change হলে) একটা `useEffect` দিয়ে `fetchDashboardData()` call হয় → contract থেকে stats এবং recent prescriptions load হয়। Blockchain ready না থাকলে loading বন্ধ করে empty state দেখানো যায়।

👉 Basically এটা logged-in doctor (বা admin) এর main home: এক নজরে stats + recent activity + navigation।

---

### 6. Prescription Form – `AddPrescription.jsx` / `CreatePrescription.jsx`

**Inputs (basic version):** শুধু `patientHash` এবং `ipfsHash` দুইটা field।  
**Inputs (full version / CreatePrescription):** Patient info (name, DOB, age, gender), Symptoms, Diagnosis, Medicines (search + add from list), Tests, Advice, Follow-up, Validity days। Full form fill করার পর "Generate" দিয়ে locally patient hash + summary বানিয়ে QR দেখানো যায়; তারপর ঐ hash/data দিয়ে blockchain-এ submit করা যায়।

**Validation (বিস্তারিত):**

- Patient name এবং Symptoms খালি থাকলে submit করা যায় না (অথবা patient hash + IPFS/data দুটোই required)।
- Empty string বা শুধু space দিয়ে submit করলে `validateForm()` false return করে এবং error message দেখায় (অথবা alert)।
- MetaMask না থাকলে submit বন্ধ এবং "MetaMask not detected" ধরনের message।

**Blockchain calls (ধাপে ধাপে):**

1. **Provider:** `new ethers.BrowserProvider(window.ethereum)` – browser-এর MetaMask দিয়ে network-এর সাথে connection। Dev Mode থাকলে কখনো direct Hardhat provider ব্যবহার হয় (`contractHelper.js`)।
2. **Signer:** `await provider.getSigner()` – যে wallet দিয়ে transaction sign হবে (ডাক্তারের wallet)। Write operation (যেমন addPrescription) এর জন্য signer দরকার।
3. **Contract instance:** `new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)` – ঠিকানা + ABI + signer দিয়ে contract-এর function call করা যায়।
4. **Transaction তৈরি:** `contract.addPrescription(patientHash, ipfsHash)` অথবা V2-তে `createPrescription(...)` call করলে একটা transaction object return হয়; এটা এখনো network-এ যায়নি।
5. **User confirm:** MetaMask pop-up আসে – user gas fee দেখে Approve বা Reject করে।
6. **Wait for mining:** `await tx.wait()` – transaction block-এ ঢোকার পর্যন্ত wait। এটা একটা **receipt** return করে (block number, gas used ইত্যাদি)।
7. **Prescription ID:** Transaction success হলে contract state update হয়ে যায়। নতুন prescription-এর ID = বর্তমান `prescriptionCount` (অথবা V2-তে return value)। Frontend `await contract.prescriptionCount()` বা transaction receipt/event দিয়ে ID নেয়।
8. **QR data set:** `setPrescriptionId(id)`, `setTxHash(tx.hash)`, এবং QR-এর জন্য string set করা হয় – e.g. `Prescription: <patientHash> | IPFS: <ipfsHash>` অথবা `JSON.stringify({ prescriptionId, patientHash, ipfsHash })`।

**Error handling:** MetaMask reject, wrong network, contract revert (e.g. "Patient hash cannot be empty"), network timeout ইত্যাদি `catch` block-এ ধরা হয়। User কে readable message দেখানো হয় (কখনো `getFriendlyErrorMessage(err)` দিয়ে) এবং `isSubmitting` false করে দেওয়া হয়।

**QR code text example:**  
`Prescription: <patientHash> | IPFS: <ipfsHash>`  
অথবা JSON: `{ "prescriptionId": "1", "patientHash": "...", "ipfsHash": "..." }`

---

### 7. Styling – `index.css`

- Gradient background, card UI, button hover effect
- QR code center-এ থাকে

---

## Runtime Setup (How to Run)

| Task | Command |
|------|---------|
| Hardhat blockchain start | `npm run blockchain` |
| Deploy smart contract | `npm run deploy` |
| Frontend start | `npm run dev` |

**MetaMask settings:**

- RPC: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Test account import → Hardhat terminal থেকে private key কপি করে import

---

## Common Errors and Fixes

| Error | Fix |
|-------|-----|
| MetaMask not installed | App alert দেখাবে |
| Wrong contract address | `config.js` এ address update করুন |
| Wrong network | MetaMask → Hardhat Local select করুন |
| Port already used | পুরানো blockchain terminal বন্ধ করে আবার run করুন |

---

## Edge Cases and Validation (কী কী পরিস্থিতিতে কী হয়)

- **User MetaMask-এ Reject করলে:** Transaction হয় না। Frontend-এ error message (e.g. "User rejected the transaction") দেখানো হয় এবং form submit state reset হয়। User আবার Submit করতে পারে।
- **Wrong network (e.g. Mainnet instead of Hardhat):** Contract call fail হতে পারে (wrong chainId)। অনেক app `provider.getNetwork()` দিয়ে check করে এবং "Please switch to Hardhat Local" ধরনের message দেয়। MetaMask-এ network change করলে আবার try করা যায়।
- **Contract revert (e.g. "Patient hash cannot be empty"):** Smart contract-এর `require()` fail হলে transaction revert হয়। ethers.js error throw করে; Frontend-এ catch করে user কে readable message দেখানো হয় (কখনো `getFriendlyErrorMessage(err)` দিয়ে)।
- **Prescription ID invalid (Pharmacy Verification):** ID 0 বা negative বা non-numeric দিলে "Invalid prescription ID"। ID সঠিক কিন্তু সেই ID-তে কোন prescription নেই (e.g. ID > prescriptionCount) হলে contract revert বা empty result – Frontend-এ "Prescription not found" ধরনের message।
- **Patient hash দিয়ে কোন prescription না পাওয়া (Patient Portal):** Loop করে সব prescription check করার পর কোনটার patientHash মিললে না – "No prescriptions found for this patient" message।
- **Loading state:** Submit বা Load চলাকালীন বাটন disable করা হয় (e.g. `isSubmitting` true) যাতে user একাধিকবার ক্লিক না করে। Error বা success এর পর আবার enable হয়।
- **Session / Force logout:** Admin যদি user কে force-logout বা restrict করে দেয় তাহলে `sessionStorage` / `localStorage` check করে app user কে বের করে দেয় বা prescription create করতে বাধা দেয়।

---

## QR Code – স্ক্যান করলে কী হয়?

QR শুধু store করা data show করে:

`Prescription: <patientHash> | IPFS: <ipfsHash>`

**Next phase:** QR scan → blockchain থেকে live verification fetch করা হবে।

---

## TL;DR (Short Summary)

- **MetaMaskConnect** = Login
- **App.jsx** = Routing (connected or not)
- **Dashboard** = Wallet + Navigation
- **AddPrescription** = Form → blockchain transaction → QR generate
- **BlockMed.sol** = Prescription data immutably blockchain এ store করে

---

## Glossary (সংক্ষিপ্ত শব্দকোষ)

| Term | Meaning (Bangla + English) |
|------|----------------------------|
| **ABI** | Application Binary Interface – contract-এর function names, parameters, return types এর JSON list। Frontend এই দিয়ে contract call করে। |
| **Provider** | Blockchain network-এর সাথে connection (read/send)। e.g. `BrowserProvider(window.ethereum)` = MetaMask দিয়ে। |
| **Signer** | যে wallet দিয়ে transaction sign করা হয় (write operation এর জন্য দরকার)। `provider.getSigner()` দিয়ে পাওয়া যায়। |
| **Contract address** | Deployed smart contract-এর ঠিকানা (0x...)। প্রতিবার deploy করলে নতুন address হয়। |
| **Transaction (tx)** | Blockchain-এ state change করার request (e.g. addPrescription)। User confirm করলে network-এ যায়। |
| **Gas** | Transaction execute করার জন্য খরচ (fee)। Local Hardhat-এ সাধারণত free; mainnet-এ ETH লাগে। |
| **Mining / Mined** | Transaction block-এ ঢুকে যাওয়া। `tx.wait()` mined হওয়া পর্যন্ত wait করে। |
| **Patient Hash** | রোগীর identity এর encoded/hashed value – নাম সরাসরি না দিয়ে privacy রাখা। |
| **IPFS Hash** | IPFS-এ রাখা ফাইলের unique identifier। অথবা prescription data এর JSON/string reference। |
| **Prescription ID** | Contract-এ প্রতিটি prescription-এর unique number (1, 2, 3, …)। `prescriptionCount` দিয়ে পাওয়া যায়। |
| **Event** | Contract থেকে বের হওয়া log (e.g. PrescriptionAdded)। Frontend/listener এই দিয়ে জানতে পারে কী হয়েছে। |
| **View function** | Contract-এর যে function state change করে না – শুধু পড়ে। Gas লাগে না (read-only)। |
| **Write function** | Contract-এর যে function state change করে (e.g. addPrescription)। Transaction + gas লাগে। |

---

## File and Folder Structure (প্রজেক্টে কী কোথায় থাকে)

সাধারণভাবে BlockMed প্রজেক্টে নিচের মতো থাকে:

```
project-root/
├── contracts/           # Smart contracts (Solidity)
│   ├── BlockMed.sol     # Basic version
│   └── BlockMedV2.sol   # Advanced (roles, batches, versions)
├── scripts/             # Deploy & utility scripts
│   ├── deploy.js        # Hardhat দিয়ে contract deploy
│   └── indexer/         # Event indexer (activity log ইত্যাদি)
├── src/                 # Frontend (React)
│   ├── App.jsx          # Main app + routing
│   ├── main.jsx         # Entry point
│   ├── store/           # State (e.g. Zustand) – account, theme, language
│   ├── pages/            # Page components
│   │   ├── LoginPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── CreatePrescription.jsx
│   │   ├── PharmacyVerification.jsx
│   │   ├── PatientPortal.jsx / PatientHistory.jsx
│   │   ├── MedicineManagement.jsx
│   │   ├── UserManagement.jsx
│   │   ├── ActivityLog.jsx
│   │   └── PrescriptionTemplates.jsx
│   ├── components/      # Reusable UI (Layout, BlockchainInfo, MedicineSearch ইত্যাদি)
│   ├── utils/           # Config ও helpers
│   │   ├── config.js    # CONTRACT_ADDRESS, API, chainId
│   │   ├── contractABI.json
│   │   ├── contractHelper.js  # getProvider, getSigner, getReadContract
│   │   ├── helpers.js   # formatTimestamp, getRoleName, restrictions
│   │   └── devMode.js   # Dev Mode – Hardhat direct connection
│   ├── hooks/           # e.g. useBlockchain
│   └── data/            # e.g. medicines.json
├── docs/                # Documentation (এই ফাইল সহ)
├── package.json
└── hardhat.config.js    # Hardhat network, compiler settings
```

**মনে রাখা:** Deploy করার পর **contract address** `src/utils/config.js` (বা যেখানে CONTRACT_ADDRESS আছে) এ আপডেট করতে হয়। ABI সাধারণত compile করার পর `artifacts/` থেকে কপি করে `src/utils/contractABI.json` এ রাখা হয়।

---

# Component Details (Code-level Explanation)

---

## BlockMed.sol (Smart Contract)

```solidity
// SPDX-License-Identifier: MIT
// 👉 এই লাইনটা লাইসেন্স টাইপ (MIT) নির্দিষ্ট করে
pragma solidity ^0.8.19;
// 👉 কোন Solidity ভার্সনে কোডটা চলবে সেটি নির্দিষ্ট করে

contract BlockMed {
  // 👉 BlockMed নামের স্মার্ট কনট্রাক্ট শুরু (ক্লাসের মতো কাজ করে)

  struct Prescription {
    uint256 id;           // প্রেসক্রিপশনের ইউনিক আইডি
    string patientHash;  // রোগীর হ্যাশ আইডেন্টিফায়ার
    string ipfsHash;     // প্রেসক্রিপশন ফাইলের IPFS হ্যাশ
    address doctor;      // যে ডাক্তার তৈরি করছে তার ওয়ালেট অ্যাড্রেস
    uint256 timestamp;   // কখন তৈরি হয়েছে তার সময়
    bool verified;       // যাচাই করা হয়েছে কি না (true/false)
  }

  uint256 public prescriptionCount;
  // 👉 মোট কয়টা প্রেসক্রিপশন যোগ হয়েছে তা গুনে রাখে

  mapping(uint256 => Prescription) public prescriptions;
  // 👉 প্রতিটি প্রেসক্রিপশনকে তার আইডি অনুযায়ী স্টোর করে (key-value আকারে)

  event PrescriptionAdded(...);
  event PrescriptionVerified(...);

  function addPrescription(string memory _patientHash, string memory _ipfsHash) public returns (uint256) {
    require(bytes(_patientHash).length > 0, "Patient hash cannot be empty");
    require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
    prescriptionCount++;
    prescriptions[prescriptionCount] = Prescription({...});
    emit PrescriptionAdded(...);
    return prescriptionCount;
  }

  function getPrescription(uint256 _id) public view returns (...) { ... }
  function verifyPrescription(uint256 _id) public { ... }
  function getPrescriptionsByDoctor(address _doctor) public view returns (uint256[] memory) { ... }
}
```

**সংক্ষেপে:**  
ডাক্তার `addPrescription()` দিয়ে প্রেসক্রিপশন যোগ করে; `getPrescription()` দিয়ে দেখা যায়; `verifyPrescription()` দিয়ে যাচাই করা হয়; `getPrescriptionsByDoctor()` দিয়ে ডাক্তারের সব প্রেসক্রিপশন দেখা যায়। সব কাজ blockchain-এ লগ হয়, তাই ডেটা নিরাপদ ও ট্রান্সপারেন্ট।

---

## Dashboard.jsx

- **Imports:** React, `useNavigate` (পেজ রিডাইরেক্টের জন্য)।
- **Component:** `const Dashboard = ({ account, setAccount }) => { ... }`  
  - `account` = doctor-এর connected wallet address; `setAccount` দিয়ে disconnect/update।
- **handleDisconnect:** `setAccount(null)` – logout / Disconnect।
- **handleCreatePrescription:** `navigate('/add-prescription')` – Create New Prescription ক্লিক করলে add-prescription পেজে যায়।
- **UI:** Header, Wallet Info Card (connected address), Main Action Card (Create New Prescription), Features (Blockchain secured, QR code generation, Verification system)。
- **Export:** `export default Dashboard`।

---

## AddPrescription.jsx

- **Imports:** React, `useState`, `useNavigate`, `ethers`, `QRCodeSVG`, `contractABI`, `CONTRACT_ADDRESS`।
- **State:** `formData` (patientHash, ipfsHash), `isSubmitting`, `txHash`, `prescriptionId`, `qrValue`, `error`।
- **handleInputChange:** input দিয়ে patientHash/ipfsHash আপডেট।
- **validateForm:** দুটি field খালি না কি না চেক।
- **handleSubmit (মূল blockchain কাজ):**
  1. Form validation
  2. MetaMask check
  3. Provider + signer + contract instance
  4. `addPrescription(patientHash, ipfsHash)` call
  5. Transaction hash ও receipt নেয়
  6. Prescription ID বের করে
  7. QR data set করে
- **Success:** `setTxHash`, `setPrescriptionId`, `setQrValue`।
- **Error:** `catch` – MetaMask reject, wrong contract, network ইত্যাদি।
- **Handlers:** `handleBackToDashboard`, `handleCreateAnother`।
- **UI:** Form inputs, Success message, Transaction hash, QR code, Action buttons, Info card।

---

## App.jsx

- **Imports:** React, `useState`, Router (BrowserRouter, Routes, Route, Navigate), MetaMaskConnect, Dashboard, AddPrescription।
- **State:** `const [account, setAccount] = useState(null)` – wallet connect হলে address, disconnect করলে null।
- **Conditional rendering:**
  - `account` না থাকলে → `<MetaMaskConnect account={account} setAccount={setAccount} />`
  - `account` থাকলে → `<Routes>...</Routes>`
- **Routes:**
  - `/` → Dashboard
  - `/add-prescription` → AddPrescription
  - `*` → `<Navigate to="/" />`
- **Export:** `export default App`।

**সংক্ষেপে:** App হলো মূল controller – MetaMask connect না থাকলে connect পেজ; connect থাকলে dashboard ও prescription পেজ; React Router দিয়ে navigation।

---

## deploy.js (Hardhat Deploy Script)

- **Import:** `hre` (Hardhat Runtime Environment)।
- **main():**
  - `getContractFactory("BlockMed")` → contract ব্লুপ্রিন্ট
  - `BlockMed.deploy()` → blockchain-এ deploy
  - `waitForDeployment()` → সম্পূর্ণ হওয়া পর্যন্ত অপেক্ষা
  - `getAddress()` → contract address
  - Console-এ address ও পরবর্তী স্টেপ (copy to `config.js`, run `npm run dev`, MetaMask connect)।
- **Test:** `prescriptionCount()` call করে initial count দেখায়।
- **Exit:** success → `process.exit(0)`, error → `process.exit(1)`।

**সংক্ষেপে:** Hardhat দিয়ে BlockMed contract deploy করে, address দেয়, React প্রজেক্টে কোথায় বসাতে হবে বলে দেয়।

---

## Pharmacy Verification Portal

**Purpose:** Prescription ID বা QR দিয়ে লোড করে blockchain থেকে verify করা।

- **Imports:** React, `useState`, ethers, contractABI, CONTRACT_ADDRESS।
- **State:** `inputId`, `loading`, `prescription`, `message`, `error`।
- **handleInputChange:** ID টাইপ করলে state আপডেট, message/error clear।
- **loadPrescription(id):**
  - QR JSON detect (e.g. `{"prescriptionId": 5}`) → `prescriptionId` extract।
  - MetaMask check।
  - Provider + contract (read-only)。
  - ID validation (number, > 0)。
  - `contract.getPrescription(parsedId)` call।
  - Result কে readable object (id, patientHash, ipfsHash, doctor, timestamp, verified)।
  - `setPrescription(pres)`।
- **handleVerify:**
  - MetaMask + signer।
  - `contract.verifyPrescription(id)` → write transaction।
  - Success message + আবার load।
- **handleScanPlaceholder:** alert – QR scanning এই ডেমোতে নেই, ID paste করতে বলবে।
- **UI:** Heading, input, Load Prescription বাটন, Scan QR বাটন, prescription details বক্স, Verify বাটন (যদি verified না থাকে)。

---

## PatientDashboard / Patient Portal / Patient History

**Purpose:** রোগী নিজের **patient hash** দিয়ে খুঁজে দেখতে পারে তার নামে কয়টা prescription blockchain-এ আছে এবং সেগুলোর সংক্ষিপ্ত তথ্য (ID, IPFS, Doctor, Timestamp, Verified)।

**কীভাবে কাজ করে (বিস্তারিত):**

1. **Input:** User নিজের patient hash টাইপ করে (যে hash ডাক্তার prescription তৈরির সময় ব্যবহার করেছিল – e.g. `btoa(name|age|timestamp)` বা অন্য কোনো unique identifier)। খালি submit করলে "Please enter a patient hash" ধরনের error।
2. **MetaMask check:** Read-only operation হলেও অনেক implementation MetaMask দিয়ে provider নেয়। না থাকলে "MetaMask not detected"।
3. **prescriptionCount:** Contract-এর `prescriptionCount()` call করে মোট কয়টা prescription আছে সেটা নেওয়া হয়। এটা দিয়ে loop চালানোর upper bound পাওয়া যায়।
4. **Loop:** 1 থেকে `prescriptionCount` পর্যন্ত প্রতিটি index-এর জন্য `contract.prescriptions(i)` call করা হয় (অথবা V2-তে `patientPrescriptions(patientHash)` দিয়ে direct ID list থাকলে সেটা ব্যবহার করা যায়)। প্রতিটি prescription-এর `patientHash` (struct-এর দ্বিতীয় ফিল্ড, অর্থাৎ index 1) user দেয়া hash এর সাথে মিলছে কি না check করা হয়। মিললে সেই prescription-এর ডেটা (id, patientHash, ipfsHash, doctor, timestamp, verified) একটা readable object বানিয়ে `found` array-তে push করা হয়।
5. **Result:** `setResults(found)`। যদি `found.length === 0` হয় তাহলে "No prescriptions found for this patient" message।
6. **Performance note:** অনেক prescription থাকলে প্রতিটার জন্য আলাদা contract call করতে হয় তাই একটু ধীর হতে পারে। V2-তে যদি `patientPrescriptions(patientHash)` থাকে তাহলে এক call-এ সব ID পাওয়া যায়।

**UI:** Header ("Patient Dashboard" / "Patient Portal"), input (patient hash placeholder সহ), Search বাটন, loading state, এবং results grid – প্রতিটি prescription এর জন্য কার্ড/row (ID, IPFS Hash, Doctor, Timestamp, Verified status)।

---

## Doctor Management

- Placeholder পেজ: Doctor approvals and registrations।
- Connected account show করে (short format)।
- এখনো full implementation নেই।

---

## Medicine Management

- **Imports:** React, useEffect, useState, MedicineForm, medicinesData (JSON)。
- **State:** `list` (medicines), `query` (search), `editing` (কোনটা edit হচ্ছে)।
- **Load:** useEffect – প্রথমে localStorage (`medicines`), না থাকলে bundled `medicinesData`।
- **Persist:** useEffect – `list` পরিবর্তন হলে `localStorage.setItem('medicines', JSON.stringify(list))`।
- **Filtered:** `list.filter(...)` – name, generic, brand দিয়ে search।
- **Handlers:** handleAdd, handleUpdate, handleDelete (confirm সহ), handleExport (JSON download), handleImport (JSON file parse করে list replace)।
- **UI:** Header, Search + Import/Export, Add new medicine form, Table (Name, Generic, Brand, Form, Strength, Edit/Delete), Edit form (when editing active)।

**Summary:** Data localStorage/bundled JSON থেকে; Add/Edit/Delete/Search; Import/Export JSON।

---

## Prescription Builder / CreatePrescription

- **State:** patient (name, age/dob, gender), symptoms, diagnosis, medicines[], tests, advice, followUp; formData (patientHash, ipfsHash); isSubmitting, txHash, prescriptionId, qrValue, error।
- **Medicine:** MedicineSearch component – add/remove medicines।
- **validateForm:** patient name ও symptoms required।
- **handleGenerate:** summary object (patient, symptoms, diagnosis, medicines, tests, advice, followUp, createdAt); patientHash (btoa or fallback); setFormData, setQrValue।
- **handlePrint:** `window.print()`।
- **handleSubmit:** MetaMask → provider, signer, contract → `addPrescription(patientHash, ipfsHash)` → tx hash, receipt, prescriptionCount → set prescriptionId, qrValue (JSON with prescriptionId, patientHash, ipfsHash)。
- **Reset:** handleClearGenerated, handleBackToDashboard, handleCreateAnother।
- **UI:** Patient info, Symptoms/Diagnosis, Medicines (MedicineSearch + list), Tests, Advice, Follow-up, Generate/Print/Clear, QR, Print preview, Blockchain submit panel (patientHash, ipfsHash, Submit, success message)।

**Summary:** Form → summary → QR → print; optional blockchain submit → Tx hash + prescription ID।

---

## Update (28 Jan) – Activity Log, User Management, Prescription Templates

### ১. Activity Log System

- **কী:** সিস্টেমে কী কী হয়েছে তার হিসাব (ডায়েরি) – কে কী কাজ করলো, কখন, কোন ট্রানজ্যাকশনে।
- **কীভাবে:** শেষ ১০,০০০ ব্লক থেকে ইভেন্ট পড়া: PrescriptionAdded, PrescriptionDispensed, UserRegistered, UserVerified, BatchCreated, BatchFlagged, BatchRecalled, UserLogin (localStorage থেকে)। ইভেন্টগুলো human-readable ফরম্যাটে (event type, block, tx hash, user/prescription info, timestamp)। Block timestamp: `provider.getBlock(blockNum).timestamp`; fallback: blockNumber * 12।
- **ফিচার:** Event type filter, Date range filter, Search (tx hash, address, ID), CSV export, Auto-refresh (৩০ সেকেন্ড)। Blockchain ডেটা immutable।

### ২. User Management System

- **কী:** Super Admin Panel – ইউজার verify, deactivate, restrict, access control, real-time কে অনলাইনে আছে।
- **Admin check:** Contract থেকে `getUser(account)` → role; Admin (role 1) অথবা contract owner হলে admin।
- **Blockchain থেকে ইউজার:** `getAllUsers()` (শুধু Admin), তারপর প্রতি address-এ `getUser(address)` – নাম, role, verified, active, license, registration time।
- **Admin actions:** Verify User → `verifyUser()` (blockchain); Deactivate User → `deactivateUser()` (blockchain, owner deactivate করা যায় না); Restrict User → localStorage (`blockmed-user-restrictions`); Access Control → localStorage (feature-wise); Real-time online → localStorage (`blockmed-active-users`, last 5 min = online)। Blockchain ধীর ও খরচ বেশি বলে real-time ট্র্যাকিং localStorage।

### ৩. Prescription Template System

- **কী:** ডাক্তারদের একই ধরনের প্রেসক্রিপশন বারবার লিখতে হয় – একবার বানাও, বারবার ব্যবহার (৬০–৮০% সময় বাঁচে)।
- **কোথায়:** Browser localStorage (`blockmed-prescription-templates`) – পার্সোনাল, দ্রুত, গ্যাস খরচ নেই, privacy।
- **Template structure:** id, name, description, category, symptoms, diagnosis, medicines[], tests, advice, followUp, validityDays, createdAt, updatedAt।
- **কীভাবে:** বর্তমান প্রেসক্রিপশন থেকে ডেটা নিয়ে template তৈরি → localStorage-এ JSON; Apply করলে symptoms, diagnosis, medicines auto-fill, prescription পেজে নিয়ে যায়। Search, category filter, Edit, Delete, Duplicate।

### Blockchain বনাম LocalStorage

| Feature | কোথায় রাখা | কারণ |
|--------|-------------|------|
| Activity Log | Blockchain | নিরাপদ, স্থায়ী |
| User Role / Verification / Deactivation | Blockchain | Trust, permanent record |
| Online Status | LocalStorage | দ্রুত, real-time |
| User Restrictions / Access Controls | LocalStorage | Temporary, fast |
| Prescription Template | LocalStorage | ব্যক্তিগত, দ্রুত |

**গুরুত্বপূর্ণ:** Activity Log-এ UserLogin event localStorage থেকে; User Management-এ restrictions ও access controls localStorage; Templates সম্পূর্ণ localStorage। Blockchain operations-এ gas লাগে; localStorage instant ও free।

**Activity Log – ডেটা কোথা থেকে আসে (বিস্তারিত):** Frontend (অথবা indexer) blockchain-এর শেষ কয়েক হাজার ব্লক query করে। প্রতিটি ব্লকের জন্য contract-এর events (PrescriptionAdded, UserRegistered, UserVerified, BatchCreated, BatchFlagged, BatchRecalled ইত্যাদি) filter করা হয়। Event-এর log থেকে `blockNumber`, `transactionHash`, এবং event-specific data (id, address, timestamp ইত্যাদি) বের করা হয়। Block timestamp জানতে `provider.getBlock(blockNumber)` call করা হয়। এই সব ডেটা একটা list আকারে UI-তে দেখানো হয় – filter (event type, date range) এবং search (tx hash, address, ID) দিয়ে। User CSV export করলে এই list টাই download হয়।

**User Management – Admin কী কী করে (বিস্তারিত):** Admin পেজে ঢোকার আগে contract থেকে `getUser(account)` call করে role check করা হয় – role Admin (1) অথবা owner হলে ঢুকতে পারবে। ঢুকে `getAllUsers()` (যদি contract-এ থাকে) অথবা user list অন্য উৎস থেকে নিয়ে প্রতি user-এর জন্য `getUser(address)` call করে নাম, role, verified, active, license, registeredAt ইত্যাদি দেখানো হয়। Verify বাটন → `verifyUser(address)` transaction → MetaMask confirm → UserVerified event। Deactivate বাটন → `deactivateUser(address)` transaction (owner কে deactivate করা যায় না)। Restrict/Access control → localStorage-এ key-value save (blockmed-user-restrictions, blockmed-access-controls) – এগুলো blockchain-এ যায় না তাই instant এবং admin চাইলে পরে পরিবর্তন করতে পারে। Online status → localStorage (blockmed-active-users) – কে কখন last activity করেছিল সেটা track করে; last 5 min = online।

**Prescription Template – কীভাবে save এবং apply হয়:** বর্তমান prescription form-এর ডেটা (symptoms, diagnosis, medicines[], tests, advice, followUp ইত্যাদি) নিয়ে user একটা নাম ও category দিয়ে "Save as Template" করে। একটা unique id (e.g. `uuid` বা timestamp) দিয়ে object বানিয়ে `localStorage.getItem('blockmed-prescription-templates')` থেকে existing array নিয়ে নতুন template push করে `localStorage.setItem` করা হয়। Apply করলে সেই template-এর ডেটা নিয়ে prescription form-এর state (symptoms, diagnosis, medicines ইত্যাদি) set করা হয় এবং user শুধু patient info আপডেট করে submit করতে পারে। Edit/Delete/Duplicate – একই localStorage array থেকে read করে update/filter/copy করে আবার set করা হয়।

---

*End of document. For setup and troubleshooting, see QUICK_START.md, TROUBLESHOOTING.md, and WALLET_SETUP.md.*
