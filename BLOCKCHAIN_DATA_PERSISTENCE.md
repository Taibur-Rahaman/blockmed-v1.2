# Blockchain Data Persistence in BlockMed

This guide explains **where your data lives**, **why it does not disappear** when you close the project or run `npm run dev` again, and **how to find old data** reliably.

---

## 1. Where Data Lives

All prescription and batch data is stored **on the blockchain**, not in your app or in a local database:

- **Prescriptions**: `BlockMedV2` contract → `prescriptions[id]`, `patientPrescriptions[patientHash]`, `doctorPrescriptions[doctor]`
- **Medicine batches**: `medicineBatches[id]`, `batchNumberToId[batchNumber]`
- **Users**: `users[address]`

The frontend **always reads from the contract** when you open Dashboard, Patient History, Pharmacy Verification, Activity Log, etc. Nothing critical is stored only in `localStorage` or in memory.

---

## 2. When Data “Never Deletes”

| What you do | Effect on blockchain data |
|-------------|---------------------------|
| Close the project / VS Code | **No effect** – data stays on the chain |
| Run `npm run dev` again | **No effect** – app reconnects to same chain and contract |
| Restart the frontend | **No effect** – same contract, same data |
| Clear browser cache / localStorage | **No effect** – prescriptions are on chain, not in cache |

So: **closing the project or running a new `npm run dev` does not delete blockchain data.** The app will load the same data again from the contract.

---

## 3. When Data Can “Disappear” (Local Dev Only)

Data can look “gone” in two situations:

### A) You restart the **Hardhat node** (`npx hardhat node`)

- The default Hardhat network is **in-memory**. When you stop the node, the chain state is reset.
- **Next time you start the node**, you get a **new empty chain**. Old prescriptions from the previous run are not there anymore.
- **To keep data across restarts:**
  - **Option 1:** Keep the same Hardhat node running; only restart the frontend (`npm run dev`).
  - **Option 2:** Use a **persistent** chain (e.g. Ganache with a database, or Hardhat with a fork/saved state).
  - **Option 3:** Deploy to a **testnet** (e.g. Sepolia). Data then stays on the public network and survives everything.

### B) You deploy a **new** contract and don’t update the app

- Each `npx hardhat run scripts/deploy.js` creates a **new** contract at a **new** address.
- The **old** data is still on the **old** contract address.
- If the app still uses the **old** `VITE_CONTRACT_ADDRESS`, you still see old data. If you change the app to the **new** address (or use the default in code), the app points at the **new** empty contract and it looks like “all data is gone”.
- **Fix:** After deploying, set **the same contract address** you want to use in `.env`:

  ```bash
  VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
  ```

  Then restart `npm run dev`. The app will read from that contract; old data is there as long as you’re still using that address and the same network.

---

## 4. How to Find Old Data

The app **does not delete** prescriptions. It only **reads** them from the blockchain. You “find” old data by using the same contract on the same network and the right screens:

| Who you are | Where to find old data |
|-------------|-------------------------|
| **Doctor** | **Dashboard** – lists prescriptions by your wallet address (`getPrescriptionsByDoctor(account)`). |
| **Patient** | **Patient History** or **Patient Portal** – enter NID/patient ID; loads prescriptions by patient hash (`getPrescriptionsByPatient(patientHash)`). |
| **Pharmacist** | **Pharmacy Verification** – look up by **Prescription ID** or by **Patient NID**; uses `getPrescription(id)` and `getPrescriptionsByPatient(patientHash)`. |
| **Admin / Audit** | **Activity Log** – shows blockchain events (prescription created, dispensed, batch created, etc.). To list **all prescriptions by ID**, use the helper: `import { fetchAllPrescriptions, getAllPrescriptionIds } from './utils/blockchainData'` then `fetchAllPrescriptions(100)` or `getAllPrescriptionIds()`. |

Contract methods used:

- `getPrescription(id)` – one prescription by ID.
- `getPrescriptionsByDoctor(doctorAddress)` – all prescription IDs for a doctor.
- `getPrescriptionsByPatient(patientHash)` – all prescription IDs for a patient.
- `prescriptionCount()` – total number of prescriptions (IDs are `1..prescriptionCount`).

So: **old data is found by querying the same contract (same address + same network) with the right ID, doctor address, or patient hash.** Closing the project or running a new `npm run dev` does not change that.

---

## 5. Using Blockchain “Properly” in This Project

- **Single source of truth:** The smart contract is the only place where prescription and batch data is stored for the long term. The frontend never “owns” the data; it only displays what the contract returns.
- **Immutability:** Once a transaction is confirmed, history is not modified or deleted by the app. Updates (e.g. new prescription version) are new transactions; old versions remain on chain (e.g. `getPrescriptionVersions` in V2).
- **Same contract address:** To always see the same “old” data, keep using the same `VITE_CONTRACT_ADDRESS` (and same network). Set it in `.env` after deploy and don’t change it unless you intentionally switch to another contract.
- **Testnet for real persistence:** For data that must survive restarts and feel “permanent”, deploy the contract once to a testnet (e.g. Sepolia), set `VITE_CONTRACT_ADDRESS` to that deployment, and use that network in the app. Then “close project” and “run new npm” do not affect that data.

---

## 6. Quick Checklist

- **Data never deletes from chain** when you only close the project or run a new `npm run dev`.
- **Data is “lost” locally** if you restart the Hardhat node (in-memory chain) or point the app at a newly deployed contract without keeping the old address.
- **Find old data** via Dashboard (doctor), Patient History / Patient Portal (patient), Pharmacy Verification (ID or NID), and Activity Log (events). Use the same contract address and network.
- **Keep using the same data** by setting `VITE_CONTRACT_ADDRESS` in `.env` to the contract you want and not changing it after deploy.
