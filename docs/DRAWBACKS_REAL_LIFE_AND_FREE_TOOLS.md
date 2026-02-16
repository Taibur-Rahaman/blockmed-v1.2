# BlockMed: Drawbacks for Real-Life Backend Use & Free-Only Mitigations

This document lists **drawbacks** that block or risk using BlockMed in a real-life backend/production setting, and **only free / open-source tools** to fix them. Every suggested tool is free or has a free tier; self-hosted options are noted where applicable.

---

## 1. Privacy / Regulatory (PHI on-chain)

| Drawback | Impact |
|----------|--------|
| Contract stores `patientHash` and `ipfsHash` as **strings** on a public chain. If `patientHash` is derived from NID or other identifiers, or if `ipfsHash` points to decryptable content, this can violate HIPAA/GDPR and create re-identification risk. | Legal risk, cannot use in production for real PHI. |

**Free-only mitigations:**

- **On-chain:** Store only **integrity/commitment**, not identifiers. Use `bytes32` (e.g. `keccak256(salt || patientId)` or HMAC) instead of raw strings. Document: "Never put PII on-chain — only hashes."
- **Encryption:** Use existing `crypto-js` or Node `crypto` (free) to encrypt prescription payloads before upload; store only ciphertext on IPFS and keep keys off-chain.
- **Off-chain storage:** Keep full PHI in an encrypted DB (e.g. PostgreSQL with encryption at rest); use self-hosted or free-tier DB.

---

## 2. Authorization / Access Control

| Drawback | Impact |
|----------|--------|
| **BlockMed.sol (V1)** has no roles — anyone can call `addPrescription` and `verifyPrescription`. **BlockMedV2.sol** already has custom RBAC (Doctor, Pharmacist, Admin, etc.) but it is **custom**, not OpenZeppelin — harder to audit and no standard battle-tested role checks. | V1: fake prescriptions, malicious verifies. V2: better, but non-standard. |

**Free-only mitigations:**

- **V1:** Add OpenZeppelin `AccessControl` (free, open-source) and require `hasRole(DOCTOR_ROLE, msg.sender)` in `addPrescription` and appropriate role in `verifyPrescription`.
- **V2:** Consider migrating to OpenZeppelin `AccessControl` for auditability; or keep custom roles but add unit tests for every role gate (Hardhat — free).
- **Admin:** Restrict role-granting to owner/admin only (already present in V2).

---

## 3. Scalability & Gas (on-chain storage and reads)

| Drawback | Impact |
|----------|--------|
| V2 uses `mapping(address => uint256[])` for doctor/patient prescriptions, so **reads** are O(1) per mapping, but **listing** all prescriptions for the system is still O(n) if done by iterating IDs. Storing long strings on-chain is gas-heavy. | High gas cost for writes; frontend must paginate or use an indexer for "list all". |

**Free-only mitigations:**

- **Indexer:** Run a **free** Node.js service (ethers.js) that listens to contract events (`PrescriptionCreated`, `PrescriptionDispensed`, etc.) and writes to PostgreSQL or SQLite. Use this for fast queries and dashboards; no paid indexing service required.
- **On-chain:** Prefer emitting events and storing minimal data on-chain; keep full payload off-chain (IPFS + DB).
- **Pagination:** Use `blockchainData.js` helpers with a limit (e.g. `fetchAllPrescriptions(100)`) so the frontend never pulls the entire chain in one go.

---

## 4. Data Lifecycle / Revocation

| Drawback | Impact |
|----------|--------|
| V2 has `isActive`, `isDispensed`, `expiresAt` but no explicit **revoke** function (e.g. doctor or admin marks prescription as revoked). No on-chain "reason" for revocation for audit. | Cannot formally revoke erroneous or abused prescriptions; regulatory gap. |

**Free-only mitigations:**

- Add `revokePrescription(uint256 id, string reason)` with `onlyDoctor` or `onlyAdmin`, set `isActive = false`, and emit `PrescriptionRevoked(id, msg.sender, reason, timestamp)`.
- Off-chain indexer can expose "revoked" status and reason for reporting.

---

## 5. Security / Contract Hardening (testing & analyzers)

| Drawback | Impact |
|----------|--------|
| No automated Solidity linter or static analyzer in the repo; no CI running tests or security checks. | Higher risk of bugs and no continuous safety net. |

**Free-only mitigations:**

- **Linter:** **solhint** (free, OSS) — add to `package.json` and run in CI.
- **Static analysis:** **Slither** (free, OSS) — run in CI to catch common vulnerabilities.
- **Tests:** **Hardhat** (already used) — add unit tests for access control, revert cases, and events.
- **CI:** **GitHub Actions** (free for public repos) — run `npm run test:blockchain`, `solhint`, and optionally Slither on push/PR.

---

## 6. Frontend Persistence of Sensitive Data

| Drawback | Impact |
|----------|--------|
| `useStore.js` **persists** `account`, `user`, `role`, `isVerified` to **localStorage** via zustand persist. localStorage is long-lived and accessible by same-origin scripts (XSS). | Another user on the same device or an XSS could see wallet/role state; session survives across tabs and restarts. |

**Free-only mitigations:**

- **Do not persist** sensitive fields to localStorage. Either:
  - **Option A:** Remove `account`, `user`, `role`, `isVerified` from `partialize` so they are **in-memory only** (reset on refresh; user reconnects wallet). **Implemented in this repo:** auth state is no longer persisted; users reconnect wallet and role on each new session.
  - **Option B:** Store them in **sessionStorage** (cleared when tab closes) via a custom zustand storage adapter.
- Keep **language**, **theme**, and non-sensitive UI state in persisted store.
- **XSS:** Sanitize inputs, escape outputs, consider Content-Security-Policy (free).

---

## 7. Real-Time / Monitoring (no real-time backend)

| Drawback | Impact |
|----------|--------|
| Docs mention monitoring/admin dashboards but there is **no WebSocket or push service**. Frontend only gets updates by polling or manual refresh. | Poor UX for live alerts; no true real-time backend. |

**Free-only mitigations:**

- **Self-hosted:** Add a small Node.js server with **Socket.IO** (free, OSS). The event indexer (see §3) can push updates to connected clients when new events are indexed.
- **Alternative:** Use **Server-Sent Events (SSE)** from the same indexer — no extra dependency, free.
- Run indexer + Socket.IO/SSE on a free-tier or self-hosted VPS.

---

## 8. Off-Chain Storage & IPFS Pinning

| Drawback | Impact |
|----------|--------|
| App uses `ipfsHash` for prescription data but there is **no pinning or retention strategy** in the repo. Unpinned IPFS content can disappear. | Broken links, lost prescription documents. |

**Free-only mitigations:**

- **Self-hosted IPFS:** Run **go-ipfs** or **Kubo** (free, OSS) and pin hashes after upload.
- **Free pinning service:** **web3.storage** (free tier) or **Pinata** free tier — pin after upload; store pin status in your DB.
- **Backup:** Keep an encrypted copy of prescription payloads in your own DB (e.g. PostgreSQL + encryption) so you are not dependent only on IPFS.

---

## 9. UX: Transaction Latency & Gas Costs

| Drawback | Impact |
|----------|--------|
| Users pay gas and wait for confirmations. No gasless meta-transactions or relayer. | Doctors/pharmacies may resist adoption; cost and delay. |

**Free-only mitigations:**

- **L2 / low-fee chain:** Use **Polygon** or other L2 (Hardhat config already has polygon); use free RPC tiers (e.g. Alchemy/Infura free tier) for node access.
- **Optimistic UX:** Show "pending" state in the UI immediately; update to "confirmed" when the transaction is mined (already partially done).
- **Relayer (advanced):** Run your own **relayer** (Node.js) that accepts signed payloads and submits transactions; you pay gas once per batch. Fully free if you self-host.

---

## 10. Operations: CI, Backups, Monitoring

| Drawback | Impact |
|----------|--------|
| No CI, no automated backups, no monitoring. Deployment docs exist but production ops (logs, alerts, SLOs) are not covered. | Outages, no audit trail of deployments, no quick rollback. |

**Free-only mitigations:**

- **CI:** **GitHub Actions** (free for public repos) — run tests, solhint, build on push/PR.
- **Backups:** **pg_dump** (free) for PostgreSQL; cron or scheduled job to backup DB and config.
- **Monitoring:** **Prometheus + Grafana** (OSS, self-hosted) or **Grafana Cloud** free tier for metrics and dashboards.
- **Logging:** Structured logs from indexer and API; store in files or free-tier log service.

---

## Prioritized Remediation (all free tools)

| Priority | Action | Tool |
|----------|--------|------|
| **P0** | Stop persisting sensitive state (account, user, role, isVerified) to localStorage; use session or in-memory only. | zustand (already used) |
| **P0** | Add solhint + npm script; add GitHub Actions workflow for tests + solhint. | solhint, GitHub Actions |
| **P1** | Add Hardhat unit tests for V2 role checks and revert cases. | Hardhat (already used) |
| **P1** | Document: never put PII on-chain; only hashes. Consider bytes32 for patient commitment in future contract version. | **Done:** `docs/PRIVACY_ONCHAIN.md`; BlockMed.sol uses bytes32. |
| **P2** | Implement Node.js event indexer (ethers.js → SQLite/Postgres) and optional Socket.IO push. | Node.js, ethers, Socket.IO (all free) |
| **P2** | Add revokePrescription(id, reason) and PrescriptionRevoked event in contract. | **Done:** BlockMedV2.revokePrescription + PrescriptionRevoked; BlockMed.sol has revoke + Status. |
| **P3** | IPFS: add pin script (e.g. ipfs-http-client + web3.storage or self-hosted node) and backup strategy. | ipfs-http-client, web3.storage or go-ipfs |
| **P3** | Consider OpenZeppelin AccessControl in next contract upgrade for auditability. | OpenZeppelin (free) |

---

## Free Tools Summary (no paid required)

| Need | Free tool / approach |
|------|----------------------|
| Smart contracts | Hardhat, OpenZeppelin contracts |
| Linting / analysis | solhint, Slither |
| Testing | Hardhat, Mocha/Chai (in toolbox) |
| CI | GitHub Actions |
| Backend / indexer | Node.js, ethers.js, Express |
| Database | PostgreSQL, SQLite |
| Realtime | Socket.IO or SSE |
| IPFS | go-ipfs (self-hosted), web3.storage (free tier) |
| Encryption | crypto-js (already), Node crypto |
| Monitoring | Prometheus, Grafana (self-hosted or free tier) |
| Deployment | Vercel (frontend free tier), self-host backend |

All of the above are open-source or have a free tier suitable for a real-life pilot; for "only free forever", prefer self-hosted options (e.g. your own server or free-tier VPS with limits).
