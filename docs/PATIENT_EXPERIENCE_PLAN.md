## Patient Experience & Accuracy Roadmap

### 1. Scope & Vision

Goal: Make BlockMed feel like a safe, trustworthy medical record and anti‑fake medicine app from a **patient/customer** point of view, while keeping the blockchain as the single source of truth.

This document tracks:
- **What we want to build** (features)
- **How we’ll build it** (steps)
- **What’s already done** (progress)

Progress legend:
- ✅ Done
- 🟡 In progress
- ⬜ Not started

---

### 2. High‑Level Goals

1. **Accurate on‑chain truth**
   - Prescriptions and batches derive their state from smart contract calls or indexer, not from local guesses.
2. **Clear, simple patient UX**
   - Patients can easily see: “Is this medicine safe?” and “What did my doctor prescribe before?”.
3. **Longitudinal history**
   - Patients see all their past prescriptions/visits and medicine verifications in one place.
4. **Trustable profiles**
   - Patients can tell if a doctor/pharmacy/manufacturer is verified and what their history looks like.
5. **Safety alerts**
   - Personalized alerts for recalls, suspicious batches, and risky patterns.

---

### 3. Feature Breakdown & Status

#### 3.1 Contract & Verification Accuracy

- ✅ Prefer RBAC `createPrescription` over legacy `addPrescription`
  - **Code**: `CreatePrescription.jsx` now:
    - Tries `createPrescription(patientHash, ipfsHash, validityDays, '')`.
    - Falls back once to `addPrescription` on role/permission errors.
- ✅ On‑chain validity used in pharmacy
  - **Code**: `PharmacyVerification.jsx`:
    - Calls `isPrescriptionValid(id)` after `getPrescription`.
    - Shows `On-chain status: <status>` banner for pharmacists.
- ✅ Batch verification already fully on‑chain
  - `verifyBatch` / `getBatchByNumber` used in `PharmacyVerification.jsx`.

**Next steps**
- ⬜ Add `isPrescriptionValid` usage into `PatientPortal` so patients see contract‑backed status too.
- ⬜ Extend indexer schema with prescription validity snapshots for historical analytics (optional).

#### 3.2 QR Security & Network Matching

- ✅ QR includes contract + chain metadata
  - **Code**:
    - `CreatePrescription.jsx` QR payload now has:
      - `contractAddress`, `chainId`, `network`, `isDemo`.
    - Demo prescriptions mark `network: "demo-offline", chainId: null`.
- ✅ Pharmacy validates QR against current network
  - **Code**: `PharmacyVerification.jsx` QR scan:
    - Compares `data.contractAddress` with `getContractAddress()`.
    - Compares `data.chainId` with `provider.getNetwork().chainId`.
    - Shows clear toasts when QR comes from a different contract or chain.

**Next steps**
- ⬜ Add a visible warning badge in the pharmacy UI when a QR mismatch is detected (not just toasts).
- ⬜ Sign QR payloads (EIP‑712 or backend signature) for anti‑tampering, and verify signature on scan.

#### 3.3 Patient Portal 2.0 (Profile + History)

Current state:
- `PatientPortal.jsx` allows any user to:
  - Enter a **patient hash**.
  - See **all prescriptions** for that hash (on‑chain or demo).
  - View each prescription in a modal with a QR code and medicines.

Planned improvements:
- ⬜ **Logged‑in patient profile**
  - Tie portal to logged‑in patient (e.g. from `useStore`) instead of requiring raw `patientHash` input.
  - Show basic info: name, age, gender, masked NID, contact.
- ⬜ **Status from blockchain**
  - Reuse `isPrescriptionValid` inside `PatientPortal` list and detail:
    - Show “Valid / Already dispensed / Expired / Inactive” from contract, not only from timestamps.
- ⬜ **Visit timeline**
  - Group prescriptions by visit date for a timeline view:
    - Each node: date, doctor, key diagnosis, quick list of medicines.
  - Allow click‑through to existing modal for full details.
- ⬜ **My medicine verifications**
  - Store locally (and later via indexer) each QR scan result the patient does.
  - Add a “My medicine checks” section listing:
    - Date/time, batch number, result (Authentic / Flagged / Recalled / Unknown).
    - Re‑verify result live against blockchain when opening old entries.

Implementation notes:
- Start with **UI only**, powered by existing smart contract methods:
  - Use `getPrescriptionsByPatient(patientHash)` + `getPrescription(id)` (already in use).
  - Add one more call to `isPrescriptionValid(id)` per prescription and cache the result.

#### 3.4 Profiles (Doctor / Pharmacy / Manufacturer)

Current state:
- Basic role, user stats, and system analytics shown on `Dashboard.jsx`.

Planned:
- ⬜ **Doctor profile**
  - Add a “Doctor Profile” panel (or page) with:
    - Name, specialization, license.
    - Count of prescriptions written, % dispensed, recent activity list.
  - For patients: simple view only (“Verified doctor”, “X prescriptions written”).
- ⬜ **Pharmacy profile**
  - Track dispensations per pharmacy address.
  - Show stats in pharmacy view and optionally in patient portal when showing “who dispensed this”.
- ⬜ **Manufacturer profile**
  - Count of batches created, number of recalls/flags.
  - Surface a simplified trust indicator to patients (“No recalls in last 12 months”).

Technical direction:
- Extend indexer to aggregate by doctor/pharmacy/manufacturer addresses (simple SQL views).

#### 3.5 Alerts & Safety for Patients

Current state:
- `Dashboard.jsx` shows **system‑level alerts** (flagged/recalled batches).

Planned:
- ⬜ **Personal recall alerts**
  - When a batch is recalled on‑chain, indexer:
    - Finds affected prescriptions/dispensations.
    - Stores a “recall affecting patientHash X” row.
  - Patient Portal:
    - Shows “You have 0/1 active recalls”.
    - Marks affected prescriptions in the history list with a red “Recall” chip.
- ⬜ **Notification methods**
  - Start with in‑app banners and toasts.
  - Later: optional email/SMS via backend (out of scope for the pure front‑end).

---

### 4. Step‑by‑Step Implementation Plan

**Phase 1 – Contract & Verification (partially done)**
1. ✅ Switch `CreatePrescription` to prefer `createPrescription` with legacy fallback.
2. ✅ Use `isPrescriptionValid` in `PharmacyVerification` and show on‑chain status.
3. ⬜ Reuse `isPrescriptionValid` in `PatientPortal` for patient‑visible status.

**Phase 2 – QR & Network Trust (partially done)**
1. ✅ Enrich QR payload with `contractAddress`, `chainId`, `network`, `isDemo`.
2. ✅ Validate QR against current contract + chain in Pharmacy.
3. ⬜ Add UI badge for QR mismatch (pharmacy).
4. ⬜ Optional: sign and verify QR payloads.

**Phase 3 – Patient Portal 2.0**
1. ⬜ Connect Patient Portal to logged‑in patient profile (store).
2. ⬜ Add a “My Profile” section in `PatientPortal.jsx` with basic info and security hints.
3. ⬜ Replace raw patient hash text with more guided UX (show current patient hash and copy button).
4. ⬜ Introduce a timeline‑style view of past prescriptions.
5. ⬜ Add a “My medicine checks” list populated from QR verification events.

**Phase 4 – Profiles & Analytics**
1. ⬜ Extend indexer DB with per‑doctor / per‑pharmacy / per‑manufacturer aggregates.
2. ⬜ Add profile pages/sections using those aggregates.

**Phase 5 – Patient‑specific Alerts**
1. ⬜ Extend indexer to join recalls with prescription/batch usage by `patientHash`.
2. ⬜ Add recall badges and a “My alerts” section in the Patient Portal.

---

### 5. What’s Done vs. Open (Quick View)

- **Done (code merged)**
  - `CreatePrescription` uses `createPrescription` with safe fallback to `addPrescription`.
  - QR payload includes network metadata; demo vs on‑chain clearly marked.
  - `PharmacyVerification`:
    - Validates contract address + chain ID from QR vs current network.
    - Uses `isPrescriptionValid` to show on‑chain prescription status.

- **In Progress / Next Up**
  - Patient Portal 2.0:
    - Move from “enter patient hash” to “logged‑in patient” first UX.
    - Add on‑chain validity and timeline.
  - Profiles & patient‑specific alerts (design is here; implementation TBD).

---

### 6. Notes for Future Developers

- **Start small**: Begin with Phase 3, steps 1–3. They are pure front‑end changes and only rely on existing contract methods.
- **Indexing**: Any cross‑cutting analytics (profiles, alerts) should go through `scripts/indexer/index.js` and SQLite, not direct front‑end aggregation.
- **Backwards compatibility**: Keep legacy flows (`addPrescription`, demo mode) working; always provide soft fallbacks when adding new RBAC‑heavy or network‑sensitive logic.

