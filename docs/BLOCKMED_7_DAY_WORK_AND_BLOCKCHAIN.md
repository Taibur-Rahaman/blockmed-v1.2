# 🧠 BlockMed – Last week Work & How the Blockchain Flows (BN+EN)

## 1. What You Built in the Last 7 Days

This document explains, **part by part**, what you built in the last few days and how it connects to the **BlockMed blockchain flow**.  
Language style: **Bangla + English mixed**, optimized for **students + teachers + devs**.

---

## 1.1 New Leaderboard Feature

### 1.1.1 New `Leaderboard` Page

- **File:** `src/pages/Leaderboard.jsx`  
- **Goal:** Show **top performers** (users / roles) based on their on‑chain or app activity.

High‑level idea (English + Bangla):

- এই page টা basically একটা **"Who is doing best?"** view।
- You can rank:
  - Which **manufacturer** created the most valid batches.
  - Which **distributor** handled the most safe transfers.
  - Which **pharmacist / hospital** dispensed most verified medicine.
- Perfect for:
  - 🔹 **Gamification** – Students can compete on “fake vs real” detection.
  - 🔹 **Teaching** – দেখাতে পারবেন কিভাবে **reputation** blockchain data থেকে আসে।

### 1.1.2 App Routing Update – `App.jsx`

- **File:** `src/App.jsx`
- **Changes:**
  - Imported `Leaderboard`:
    - `import Leaderboard from './pages/Leaderboard'`
  - Added a new **route**:
    - Path: `/leaderboard`
    - Element: `<Leaderboard />`

**Result:**  
When a user goes to `http://.../leaderboard`, the new **Leaderboard page** loads via React Router.

### 1.1.3 Sidebar Navigation Update – `Layout.jsx`

- **File:** `src/components/Layout.jsx`
- **Changes:**
  - Imported `FiAward` from `react-icons/fi`.
  - Extended the `navItems` list with:
    - **Path:** `/leaderboard`
    - **Icon:** `FiAward`
    - **Label:** `Leaderboard`
    - **Roles:** `[1, 2, 3, 4, 5, 6]` (almost all roles)
    - **Access Control:** `null` (open to those roles)

Mixed explanation:

- এখন **sidebar এ Leaderboard button** থাকবে।
- যেকোনো allowed role user যখন sidebar থেকে `Leaderboard` click করে:
  1. React Router → `/leaderboard`
  2. `Leaderboard.jsx` render হয়
  3. Page এর ভিতরে আপনি blockchain‑based ranking দেখাতে পারবেন।

---

## 1.2 Live Blockchain Transaction Feed on Dashboard

### 1.2.1 Dashboard Integration – `Dashboard.jsx`

- **File:** `src/pages/Dashboard.jsx`
- **Changes:**
  - New import:
    - `import TransactionFeed from '../components/TransactionFeed'`
  - New section added at bottom of the dashboard:
    - `<TransactionFeed maxEvents={20} autoScroll={true} showHeader={true} />`

Parameters meaning:

- **`maxEvents={20}`**  
  - সর্বোচ্চ ২০টা recent transaction / event দেখাবে।
- **`autoScroll={true}`**  
  - নতুন event আসলে list automatically নিচে scroll হতে পারে, যেন latest সবসময় visible থাকে।
- **`showHeader={true}`**  
  - উপরে একটা header / title থাকবে – যেমন **"Live Blockchain Activity"**।

### 1.2.2 `TransactionFeed` Component – Concept

- **File:** `src/components/TransactionFeed.jsx`
- **Role of this component:**
  - **Listen** to blockchain events and show them in a live list.
  - Uses `getProvider()`, `getContractAddress()`, `formatTimestamp()`, `truncateAddress()` from your helpers.

**Events shown in the feed** (from `EVENT_CONFIG` in code):

- **Prescription:** `PrescriptionCreated`, `PrescriptionDispensed`, `PrescriptionUpdated`, `PrescriptionRevoked`
- **Batch:** `BatchCreated`, `BatchDispensed`, `BatchRecalled`, `BatchFlagged`
- **Alerts:** `FakeMedicineAlert`
- **User:** `UserRegistered`, `UserVerified`, `UserDeactivated`

- Event গুলোকে **human‑readable UI** তে convert করে: short addresses (`truncateAddress`), timestamps, status badges/colors, icons.

Conceptual data flow:

```text
[Blockchain] --(events/transactions)--> [TransactionFeed Logic] --(UI data)--> [Dashboard Live List]
```

Bangla + English:

- Dashboard এখন শুধু static summary না, বরং **“live TV channel”** এর মতো:
  - নতুন batch create হলে সাথে সাথে দেখা যাবে।
  - Recall, transfer, dispense – সব events এখানে scroll হতে পারে।
- Classroom demo তে একটা **wow moment**:
  - Teacher বলবে: “একটা batch create করি” → student clicks →  
    **কয়েক সেকেন্ডের মধ্যে live feed এ event দেখাবে**.

---

## 1.3 Address Helper Improvement – `helpers.js`

- **File:** `src/utils/helpers.js`
- **Existing function:**
  - `shortenAddress(address, chars = 4)` → e.g. `0x12ab...89CD`
- **New function you added:**

```js
export const truncateAddress = (address, chars = 4) => {
  return shortenAddress(address, chars)
}
```

Why this matters (Bangla + English):

- আগে কিছু component `truncateAddress` use করত, কিছু `shortenAddress` use করত।
- এখন আপনি:
  - `truncateAddress` কে **alias** বানালেন for `shortenAddress`.
  - অর্থাৎ দুইটা নাম → একই behavior.
- Result:
  - পুরনো code break হল না।
  - নতুন code standard name `shortenAddress` ব্যবহার করতে পারছে।
  - **Backward compatibility + clean helper design** একসাথে।

---

## 1.4 Role‑Based Dashboards and Batch Timeline

### 1.4.1 `RoleDashboard.jsx`

- **File:** `src/components/RoleDashboard.jsx`
- Concept:
  - আলাদা role অনুযায়ী customized dashboard:
    - **Super Admin** → high‑level system metrics.
    - **Manufacturer** → কত batch তৈরি, pending, shipped, recalled।
    - **Distributor** → কোন batch কোথা থেকে কোথায় যাচ্ছে।
    - **Pharmacist / Hospital** → কত medicine dispensed, কোন batch থেকে এসেছে।

Bangla + English:

- Same blockchain data, but **“camera angle”** আলাদা আলাদা।
- এর মাধ্যমে আপনি দেখাতে পারেন:
  - **Same blockchain, different UI for different roles.**

### 1.4.2 `BatchTimeline.jsx`

- **File:** `src/components/BatchTimeline.jsx`
- Concept:
  - এক একটা medicine batch এর **life story** কে time সিরিজ আকারে দেখানো।

**Actual timeline steps in code** (from `STEP_TYPES`):

```text
Manufactured → Dispensed → Flagged → Recalled
     (created)   (sold)    (suspicious) (recalled from market)
```

- প্রতিটা step corresponds to:
  - **Manufactured** – batch created on blockchain (`BatchCreated`).
  - **Dispensed** – medicine sold to patient.
  - **Flagged** – marked as suspicious.
  - **Recalled** – batch recalled from market (`BatchRecalled`).
- Component uses `getReadContract()`, `isBlockchainReady()`, `formatTimestamp()`, `shortenAddress()` from your helpers.
- `BatchTimeline` এই events read করে correct **order** + **timestamp** অনুযায়ী একটা **visual timeline graph** বানায়।

Teaching use‑case:

- Student দেরকে real medicine packet এ থাকা QR code থেকে:
  1. Batch ID বের করা,
  2. Timeline open করা,
  3. “See – এই batch কখন created, কখন কোথায় গেছে, কে dispense করেছে”
  4. Understand **immutability + traceability** clearly.

---

## 1.5 Documentation Work for Teachers & Learners

In the same time period, you also created several markdown/text files to make BlockMed easy to **learn, teach, and plan**.

### 1.5.1 Files You Added

- `DOCUMENTATION_INDEX.md` – master index of all docs (what to read, in which order).
- `FEATURES_SUMMARY.md` – extended overview of all 16 features and teaching levels.
- `FEATURE_ROADMAP_VISUAL.md` – ASCII art timeline and feature relationships.
- `QUICK_START.md` – short implementation + teaching quick reference.
- `README_FEATURES.md` – feature‑focused README (marketing + teaching).
- `START_HERE.txt` – for first‑time visitors (“open this first”).
- `docs/NEW_FEATURES_PLAN.md` – deep, detailed plan of new features.

Impact:

- Developer + Teacher যখন project এ ঢুকবে:
  - তারা **lost হবে না**।
  - Exactly জানবে:
    - first কি read করতে হবে,
    - কোন feature কোন file এ describe করা আছে,
    - কত সময় লাগবে,
    - কোন grade level এর জন্য কোন feature best।

---

## 2. How Blockchain Works in BlockMed (BN+EN Deep Dive)

This section explains **how your UI changes sit on top of the blockchain logic.**

---

## 2.1 High‑Level System Flow

Think of the system as **4 major layers**:

```text
1) Users (Doctors, Pharmacists, Admins, Students)
        |
        v
2) React App (Dashboard, Leaderboard, BatchTimeline, TransactionFeed)
        |
        v
3) Integration Layer (getReadContract, getCurrentAccount, helpers)
        |
        v
4) Blockchain (Smart Contracts + Events + On‑Chain State)
```

### Layer 1 – Users (BN+EN)

- **Who:**
  - Super Admin, Manufacturer, Distributor, Pharmacist, Hospital, Teacher, Student.
- **What they do:**
  - Create new medicine batches,
  - Transfer ownership along supply chain,
  - Dispense medicine to patients,
  - Perform recalls,
  - Explore Leaderboard / Timeline / Live Feed.

### Layer 2 – React App

Key screens you updated:

- `Dashboard`:
  - Now includes `TransactionFeed` → **live blockchain activity view**.
- `Leaderboard`:
  - Shows **top actors** based on on‑chain metrics (current + future).
- `BatchTimeline`:
  - Visualizes **per‑batch history**.
- `RoleDashboard`:
  - Different views for different roles.

BN+EN meaning:

- React app is your **“window”** into blockchain:
  - Same contract, but different **visual stories**:
    - Live log,
    - Ranking,
    - Timeline.

### Layer 3 – Integration Layer (`getReadContract`, etc.)

Typical helpers (names from your project structure):

- `getReadContract()` – returns a contract instance for **reading** on‑chain data.
- `getCurrentAccount()` – gets the connected wallet address.
- `isBlockchainReady()` – checks if RPC provider, network, and wallet are correctly set up.
- `shortenAddress` / `truncateAddress` – makes addresses **user‑friendly**.

Flow (English + Bangla):

- যখন UI থেকে কোনো action নেয়:
  1. Integration layer checks → **is blockchain reachable?**
  2. Gets **logged‑in wallet address** (owner/actor).
  3. Calls the **smart contract function** (read/write).
  4. Receives:
     - On‑chain data (state),
     - or events (logs).
  5. Converts them into **UI‑friendly objects** → feeds into components like `TransactionFeed`, `BatchTimeline`, `RoleDashboard`.

### Layer 4 – Blockchain (Smart Contracts)

On‑chain you typically have:

- **State:**
  - Batches (IDs, metadata, owners, status, timestamps).
  - Roles (who is manufacturer, distributor, pharmacist).
  - Prescriptions / transfers / approvals.
- **Events** (as used in `TransactionFeed` and contracts):
  - Prescription: `PrescriptionCreated`, `PrescriptionDispensed`, `PrescriptionUpdated`, `PrescriptionRevoked`
  - Batch: `BatchCreated`, `BatchDispensed`, `BatchRecalled`, `BatchFlagged`
  - Alert: `FakeMedicineAlert`
  - User: `UserRegistered`, `UserVerified`, `UserDeactivated`
  - Plus any `BatchTransferred`, `UserRoleUpdated`, etc. your contract emits.

Why events are important:

- Events are your **bridge** from blockchain → frontend:
  - You don’t poll *all* state every second.
  - Instead you:
    - subscribe to **relevant events**,
    - or poll for **latest blocks** and decode event logs.
- Components like `TransactionFeed` and `BatchTimeline` are **event‑driven**.

---

## 2.2 Detailed Flow Example – Creating a New Batch

Let’s walk through one **concrete scenario** with BN+EN explanation.

### Step 1 – User Action in UI

- User (Manufacturer role) opens **Dashboard / Batches** screen.
- Fills out **“Create New Batch”** form:
  - Drug name, batch ID, expiry date, etc.
- Clicks **“Create Batch”**.

### Step 2 – Frontend Calls Smart Contract

- React component calls a helper like:
  - `const contract = getReadContract()` (or write‑enabled variant).
- Then sends a blockchain transaction:

```js
await contract.createBatch(batchId, metadata, ...);
```

Bangla + English:

- এই জিনিসটা basically **"Hey blockchain, new batch রেকর্ড করো"**।
- Transaction propagate হয়ে miners/validators block এ include করে।

### Step 3 – Blockchain Updates State + Emits Event

- Smart contract:
  - Saves new batch info into its storage.
  - Emits an event:

```solidity
event BatchCreated(uint256 batchId, address owner, uint256 timestamp, ...);
```

Meaning:

- On‑chain immutable log now says:
  - “At `timestamp`, `owner` created batch `batchId` with these details.”

### Step 4 – Frontend Detects Event

- `TransactionFeed` logic:
  - Either **subscribes** to `BatchCreated` events (via WebSocket / filters),
  - or periodically **polls** for new blocks and filters logs.
- When it sees a new `BatchCreated`:
  - Formats the data:

```js
{
  type: 'BatchCreated',
  batchId,
  ownerShort: shortenAddress(owner),
  time: formatTimestamp(timestamp),
}
```

- Adds this to its internal **event list** (up to `maxEvents = 20`).

### Step 5 – UI Updates in Real Time

- `TransactionFeed` component re‑renders:
  - Live list shows:
    - “BatchCreated – ID 123 – 0x12ab...89CD – 2026‑02‑23 10:45”
- `BatchTimeline` for batch `123` (if opened):
  - Adds a new timeline node at the **start**: “Created”.
- `RoleDashboard` for manufacturer:
  - Increments “Total Batches Created”.

Bangla + English effect:

- Student / user immediately দেখতে পারে:
  - Form submit → **blockchain transaction mined** → **UI live update**.
- এটাই real‑time **"blockchain in action"** demo.

---

## 3. Graph‑Style Views (Text Diagrams, BN+EN)

### 3.1 Overall Architecture Graph

```text
           ┌────────────────────────────────────────┐
           │  Users (Doctors, Pharmacists, Admins) │
           └────────────────────────────────────────┘
                             |
                             v
      ┌────────────────────────────────────────────────────┐
      │ React App (Dashboard, Leaderboard, Timeline, etc.)│
      └────────────────────────────────────────────────────┘
                             |
                             v
     ┌─────────────────────────────────────────────────────┐
     │ Integration Layer                                  │
     │ - getReadContract / getCurrentAccount              │
     │ - helpers (shortenAddress, truncateAddress, etc.)  │
     └─────────────────────────────────────────────────────┘
                             |
                             v
       ┌───────────────────────────────────────────────┐
       │ Blockchain (Smart Contracts + Events + State) │
       └───────────────────────────────────────────────┘
```

BN+EN explanation:

- উপরের 4‑layer diagram টা basically বলে:
  - Users only **see React**,
  - React talks to **helpers**,
  - Helpers talk to **smart contracts**,
  - Smart contracts keep the **truth** (state + events).

### 3.2 Event‑Driven Live Feed Graph

```text
Smart Contract Events
   (BatchCreated, Transferred, Dispensed, ...)
                 |
                 v
         Event Listener / Poller
                 |
                 v
        Data Normalization Helpers
     (shortenAddress, formatTimestamp, etc.)
                 |
                 v
            TransactionFeed
                 |
        ┌────────┴─────────┐
        v                  v
   Live Log UI       Updates to Other Components
                   (RoleDashboard, BatchTimeline)
```

BN+EN:

- Blockchain events are **raw signals**.
- Frontend helper গুলো এগুলাকে **human‑readable data** বানায়।
- `TransactionFeed`:
  - একদিকে **live log** বানায়,
  - অন্যদিকে **other components কে update** করার trigger হিসেবে কাজ করে।

### 3.3 Batch Timeline Graph (Logical)

**As implemented in `BatchTimeline.jsx`:**

```text
Time →

Manufactured ──► Dispensed ──► Flagged ──► Recalled
      ^              ^             ^           ^
      │              │             │           │
BatchCreated    (sold to      (suspicious)  BatchRecalled
                patient)
```

BN+EN:

- উপরকার লাইনে আপনি UI তে যা দেখান (timeline nodes) – **Manufactured → Dispensed → Flagged → Recalled**.
- প্রতিটা node corresponds to **smart contract events** or status.
- For any batch: UI timeline = **sorted list of events** with human labels and timestamps.

---

## 4. How This Helps Teaching & Demos

### 4.1 BN+EN Teaching Storyline

You can explain to students like this:

1. **“Blockchain কি?”**
   - Immutable ledger, সব action record হয়.
2. **“BlockMed এ আমরা কি record করছি?”**
   - Medicine batch journey + prescriptions + roles.
3. **“React UI কি করে?”**
   - এই সব data কে সুন্দর করে **dashboard, leaderboard, timeline, live log** আকারে দেখায়.
4. **“TransactionFeed কেন দরকার?”**
   - যেন সবাই real‑time এ দেখে:
     - নতুন batch, transfer, recall etc. হচ্ছে.
5. **“Leaderboard কেন?”**
   - To reward **good actors**, detect **risky behavior**, এবং gamify learning.

### 4.2 Demo Flow Using Your New Features

Simple 5–10 minute classroom demo:

1. Open **Dashboard** → show `TransactionFeed`.
2. Manufacturer student creates a **new batch**.
3. Wait a few seconds → show how **live feed** updates.
4. Open **BatchTimeline** for that batch → show journey starting at “Created”.
5. Transfer / dispense a batch → watch both:
   - **Timeline** grow,
   - **TransactionFeed** update.
6. Open **Leaderboard**:
   - Show which role/user is currently most active or “safest”.

---

## 5. Summary

- In the last few days, you:
  - Added **Leaderboard**, **TransactionFeed**, `RoleDashboard`, `BatchTimeline`.
  - Improved helpers (`truncateAddress` alias).
  - Created comprehensive **documentation** for teachers, devs, and students.
- Blockchain in BlockMed works as:
  - **Smart contracts** store truth + emit events,
  - **Helpers** connect React UI to those contracts,
  - **Components** like Dashboard, Leaderboard, Timeline, and TransactionFeed visualize that truth.

This file is written so you can:

- Present BlockMed easily,
- Teach blockchain concepts with visuals and BN+EN explanations,
- And extend new features without losing the big picture.

---

## Document info

| Item | Value |
|------|--------|
| **File** | `docs/BLOCKMED_7_DAY_WORK_AND_BLOCKCHAIN.md` |
| **Last updated** | February 2026 |
| **Purpose** | Part-by-part summary of recent BlockMed work + blockchain flow (BN+EN) |

