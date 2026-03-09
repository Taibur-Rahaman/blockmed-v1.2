## BlockMed V3 – Vision & Implementation Plan

### 1. Vision

BlockMed V3 aims to move from “blockchain demo” to a **production‑grade, competition‑winning healthcare platform**. The focus is:

- **Patient‑centric**: longitudinal history, consent, and safety alerts around the patient.
- **Verifiable**: every critical action (prescribe, dispense, recall, verify) is backed by on‑chain events or cryptographic proofs.
- **Privacy‑preserving**: minimal PII on‑chain, encrypted off‑chain data, and room for ZK/VC integrations.
- **Interoperable**: clean APIs that can plug into hospital systems and regulators.

Progress legend:
- ✅ Done
- 🟡 In progress
- ⬜ Not started

---

### 2. Pillars & High‑Level Goals

1. **Patient Experience Pro**
   - Mobile‑friendly Patient Portal with profile, timeline, medicine checks, and recall alerts.
2. **Doctor & Pharmacy Tooling**
   - Smarter prescription creation and stronger pharmacy verification UX.
3. **Regulator Command Center**
   - Centralized view of recalls, flagged batches, system health, and network‑wide activity.
4. **Privacy & Cryptography Ready**
   - Architecture ready for verifiable credentials (VCs) and zero‑knowledge (ZK) upgrades.
5. **Interoperability & Analytics**
   - Indexer‑driven analytics and (future) FHIR‑style export for EMR integration.

---

### 3. V3 Features Mapped to This Codebase

This section focuses on what we can realistically build inside this repo, step by step.

#### 3.1 Patient Experience Pro (frontend)

- ✅ Patient Portal 2.0 (initial)
  - My Profile: basic info, wallet address, patient hash (ID) explanation.
  - On‑chain status per prescription via `isPrescriptionValid`.
  - Simple prescription timeline view.
  - “My medicine checks” list populated from QR‑based batch verifications.

- ⬜ Patient alerts & recall indicators
  - Show “You have N active recalls” in Patient Portal.
  - Mark prescriptions that reference recalled batches (requires a mapping from prescriptions → batches at UI or indexer level).

- ⬜ Mobile/PWA optimization
  - Audit CSS and layout for small screens.
  - Add PWA manifest and basic offline caching for core assets + last N prescriptions.

#### 3.2 Doctor & Pharmacy Tooling

- ✅ Stronger pharmacy accuracy
  - `PharmacyVerification.jsx`:
    - Uses `isPrescriptionValid` to show “On‑chain status”.
    - Verifies batches fully on‑chain and logs patient medicine checks.
    - Shows network/contract mismatch warnings from QR metadata (badge + toasts).

- ⬜ Doctor productivity improvements
  - Enhance `CreatePrescription.jsx`:
    - Smarter defaults (dosage templates, guideline hints).
    - Bulk templates and quick fills for chronic conditions.

- ⬜ Pharmacy risk indicators
  - For each batch verification, compute and display simple risk hints (e.g. “very close to expiry”, “stock exactly at total units → potential duplicate packs”).

#### 3.3 Regulator Command Center

- ⬜ Dedicated regulator page (`RegulatorCenter.jsx`)
  - Reuse existing contract functions:
    - `getSystemStats`, `getFlaggedBatches`, `getRecalledBatches`, `getMedicineBatch`.
  - Show:
    - Key KPIs (total prescriptions, flagged/recalled batches, users).
    - Tables for recent recalled and flagged batches.
    - Mini activity stream (reuse `TransactionFeed`).
  - Access control: visible only for Admin / Regulator roles.

- ⬜ Recall workflow helpers (frontend)
  - One‑click navigation from a recalled batch to:
    - Batch details.
    - Global activity log filtered to that batch ID / number.

#### 3.4 Privacy & Cryptography Ready (design‑level)

These are mostly **design/documentation hooks** and minor code structure tweaks to make future crypto work easier:

- ⬜ Clarify in docs and types which fields are:
  - On‑chain identifiers (hashes, addresses).
  - Off‑chain encrypted payloads (IPFS / DB JSON in `ipfsHash`).
- ⬜ Wrap prescription payload creation/parsing into helper functions (single place to extend).
- ⬜ (Future work) Introduce a “signature” field in the QR payload and UI hooks to verify it.

#### 3.5 Interoperability & Analytics

- ✅ Indexer foundation
  - SQLite schema for prescriptions & batches.
  - HTTP API for reading prescriptions/batches.

- ⬜ Regulator/analytics extensions
  - Extend indexer schema with:
    - Per‑doctor and per‑manufacturer aggregates.
    - (Optional) patient‑centric alerts table linking recalls to `patientHash`.

---

### 4. Concrete V3 Implementation Plan (In This Repo)

This is the actionable checklist for V3 work that can be done directly in this project.

#### Phase A – Regulator Command Center

1. ⬜ **Create `RegulatorCenter.jsx` page**
   - Uses `getSystemStats`, `getFlaggedBatches`, `getRecalledBatches`, `getMedicineBatch`.
   - Shows:
     - KPI cards (prescriptions, users, batches, flagged, recalled).
     - Recent recalled & flagged batch lists with timestamps and reasons.
2. ⬜ **Wire routing**
   - Add `/regulator` route in `App.jsx`.
   - Add navigation entry for Admin + Regulator roles in the sidebar.
3. ⬜ **Connect to existing ActivityLog / TransactionFeed**
   - Show a compact live events panel filtered to recalls/flags.

#### Phase B – Patient Alerts & Safety (UI‑only to start)

1. ⬜ **Recall awareness in Patient Portal**
   - Add a simple “Alerts” section on `PatientPortal.jsx` that:
     - Warns if any of the patient’s prescriptions are:
       - Expired.
       - Linked to a batch that is recalled/flagged (initially via local mapping or manual tagging).
2. ⬜ **Hook in from Pharmacy**
   - Whenever a pharmacist verifies a recalled/flagged batch, record a client‑side alert entry (using `useStore`) that can be surfaced in the patient’s view.

> Note: a fully correct mapping from recall → affected patients requires explicit linkage between prescription medicines and batch numbers, plus indexer support. That is a natural next step once the UI hooks exist.

#### Phase C – Doctor & Pharmacy Productivity

1. ⬜ **Prescription creation enhancements**
   - Pre‑configured guideline templates (e.g., for common conditions).
   - Better validation and safety hints (e.g., duration vs validity days).
2. ⬜ **Pharmacy UX**
   - Highlight soon‑to‑expire batches.
   - Add quick filters for recall/suspicion history in the batch verification view.

#### Phase D – Documentation & Readiness for Crypto/Interop

1. ⬜ Update docs:
   - `PRIVACY_ONCHAIN.md` to align with V3 (clear split of on‑chain vs off‑chain).
   - `BLOCKCHAIN_HOW_IT_WORKS.md` with V3 diagrams (patient/timeline/alerts).
2. ⬜ Add design notes:
   - Where verifiable credentials and ZK proofs would plug in (future work).

---

### 5. Status Snapshot (as of this branch)

- **Already implemented in this chat**
  - Patient Portal 2.0 basics (profile, on‑chain status, timeline, medicine checks).
  - Pharmacy QR safety improvements (network/contract mismatch warnings and badge).
  - Store support for patient medicine checks and patient hash reuse.
- **Next concrete implementation step**
  - Build **Regulator Command Center** page and route (Phase A.1–A.3).

This file should be kept up to date as new V3 pieces are implemented so future contributors immediately see the vision, plan, and progress.

