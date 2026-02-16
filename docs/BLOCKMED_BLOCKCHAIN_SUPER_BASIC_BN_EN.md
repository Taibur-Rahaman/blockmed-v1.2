# Blockchain → BlockMed  
## Super Basic Explanation (University Level)

**Target:** University students | **Assumption:** Zero (একদম নতুন ধরেই)  
**Language:** Bangla + English mixed | **Style:** Part-by-part, task-by-task

এই ডক পড়লে কেউ **blockchain শোনেনি হলেও বুঝবে**।

---

## Part 1: What is Blockchain? (Zero Level)

### Blockchain মানে কী?

**Blockchain** হলো:

- একটা **computer system**
- যেটা **data রাখে**
- data রাখা হয় **record আকারে**
- এবং এই record **change করা যায় না**

সহজ ভাষায়:

> **Blockchain = Digital Khata (খাতা)**

```mermaid
flowchart LR
  subgraph Blockchain
    A[Data রাখে] --> B[Record আকারে]
    B --> C[Change করা যায় না]
  end
  Blockchain --> D[Digital Khata]
```

---

## Part 2: Why Blockchain Was Needed

আগে কী সমস্যা ছিল?

### Traditional System এ সমস্যা:

- Data এক জায়গায় থাকে
- এক জন বা এক প্রতিষ্ঠান control করে
- চাইলে data edit বা delete করতে পারে

### Blockchain কী করলো?

- Data অনেক জায়গায় copy করে রাখলো
- সবাই একই data দেখে
- কেউ একা বসে change করতে পারে না

```mermaid
flowchart LR
  subgraph Traditional
    T1[এক জায়গায় Data]
    T2[এক জন Control]
    T3[Edit/Delete সম্ভব]
  end

  subgraph Blockchain
    B1[অনেক জায়গায় Copy]
    B2[সবাই একই Data]
    B3[একা Change করা যায় না]
  end
```

---

## Part 3: Important Words (Very Easy Meaning)

### Ledger

**Ledger** মানে:

- Record book
- Database
- Khata

👉 যেখানে সব তথ্য লেখা থাকে

---

### Transaction

**Transaction** মানে:

- Ledger এ **একটা নতুন entry**
- নতুন তথ্য যোগ করা

**Example:**  
“Prescription create করা” = 1 transaction

---

### Block

**Block** মানে:

- অনেকগুলো transaction একসাথে রাখা
- Ledger এর এক পৃষ্ঠা

👉 **1 block = many transactions**

---

### Blockchain

**Blockchain** মানে:

- অনেকগুলো block
- একটার সাথে আরেকটা যুক্ত
- sequence অনুযায়ী

👉 **Block + Block + Block = Blockchain**

```mermaid
flowchart LR
  T1[Tx 1] --> B1[Block 1]
  T2[Tx 2] --> B1
  T3[Tx 3] --> B1
  B1 --> B2[Block 2]
  B2 --> B3[Block 3]
  B3 --> B4[Block 4]
```

---

## Part 4: How Blockchain Works (Very Slowly)

Step by step:

1. কেউ একটি **transaction** তৈরি করে  
2. System transaction **check** করে  
3. Transaction **block** এ যায়  
4. Block **chain** এ যুক্ত হয়  
5. Data **permanent** হয়ে যায়  

👉 এরপর change করা যায় না

```mermaid
flowchart TD
  A[১. Transaction তৈরি] --> B[২. System check করে]
  B --> C[৩. Block এ যায়]
  C --> D[৪. Chain এ যুক্ত হয়]
  D --> E[৫. Data permanent]
```

---

## Part 5: Why Blockchain Data Cannot Be Changed

কারণ:

- প্রত্যেক block **আগের block** এর সাথে যুক্ত
- পুরনো data change করলে **link ভেঙে** যায়
- System **ধরে ফেলে**

👉 তাই cheating **almost impossible**

```mermaid
flowchart LR
  B1[Block 1] -->|hash link| B2[Block 2]
  B2 -->|hash link| B3[Block 3]
  B3 -->|hash link| B4[Block 4]
  B4 -.->|change করলে link ভেঙে যায়| X[❌ Detect]
```

---

## Part 6: What is a Wallet? (Very Important)

### Wallet কী?

**Wallet** হলো:

- আপনার **digital identity**
- আপনার নামের মতো

Wallet এর মধ্যে থাকে:

- **Address** (public)
- **Private key** (secret)

---

### Address

**Address** মানে:

- Account number
- যেটা সবাই দেখতে পারে

**Example:**  
“এই prescription কে বানিয়েছে?”

---

### Private Key

**Private key** মানে:

- Password
- Secret key

⚠️ **কাউকে দেওয়া যাবে না**

```mermaid
flowchart TD
  W[Wallet]
  W --> A[Address - Public]
  W --> P[Private Key - Secret]
  A --> A1[সবাই দেখে]
  P --> P1[কাউকে দিবেন না]
```

---

## Part 7: What is a Smart Contract?

**Smart Contract** হলো:

- Blockchain এর উপর চলা **program**
- **Automatic** rule follow করে

এটা:

- মানুষ না
- **Computer code**

---

### Example Rule:

```
If prescription is valid
  → approve
Else
  → reject
```

👉 No human decision  
👉 No cheating

```mermaid
flowchart LR
  I[Input: Prescription] --> SC[Smart Contract]
  SC --> V{Valid?}
  V -->|Yes| A[Approve]
  V -->|No| R[Reject]
```

---

## Part 8: On-chain vs Off-chain (Easy)

### On-chain মানে:

- Data **blockchain** এ আছে
- **Public**
- **Permanent**

**Example:**

- Prescription ID
- Status (used / unused)

---

### Off-chain মানে:

- Data blockchain এ **নেই**
- **Database** এ আছে
- **Private**

**Example:**

- Patient name
- Medical details

```mermaid
flowchart LR
  subgraph On-chain
    O1[Prescription ID]
    O2[Status]
  end

  subgraph Off-chain
    F1[Patient name]
    F2[Medical details]
  end
```

---

## Part 9: Now the Project — BlockMed

### BlockMed কী?

**BlockMed** হলো:

- **Healthcare blockchain** project
- Medicine + prescription নিয়ে কাজ করে

**Goal:**

- Fake prescription ধরা
- Medicine misuse বন্ধ করা

---

## Part 10: Why BlockMed is Needed

### Traditional prescription:

- Paper based
- Easy to copy
- Easy to reuse

### BlockMed prescription:

- **QR code** based
- **Blockchain** verified
- **One-time** usable

```mermaid
flowchart LR
  subgraph Traditional
    TP[Paper] --> TC[Copy/Reuse সহজ]
  end
  subgraph BlockMed
    BM[QR + Blockchain] --> BV[One-time, Verified]
  end
```

---

## Part 11: BlockMed Full Task Flow (Very Clear)

### Step 1: Doctor Task

- Doctor **prescription create** করে
- System **QR code** বানায়

---

### Step 2: Blockchain Task

- Prescription ID **blockchain** এ store হয়
- **Smart contract** rules apply করে

---

### Step 3: Pharmacy Task

- Pharmacy **QR scan** করে
- **Blockchain verify** করে

---

### Step 4: Result

- **Valid** → medicine give  
- **Invalid** → reject

```mermaid
sequenceDiagram
  participant D as Doctor
  participant S as System
  participant BC as Blockchain
  participant P as Pharmacy

  D->>S: Prescription create
  S->>S: QR code বানায়
  S->>BC: Prescription ID store
  BC->>BC: Smart contract rules
  P->>S: QR scan
  S->>BC: Verify
  BC-->>P: Valid / Invalid
  P->>P: Medicine give or Reject
```

---

## Part 12: Where Each Technology Is Used

| Technology      | Use                          |
|-----------------|------------------------------|
| **Blockchain**  | Prescription proof, Status   |
| **Smart Contract** | Rules checking           |
| **UI (Website)**   | User interaction         |
| **Indexer**     | Blockchain data read করা    |
| **Database**    | Fast search & history       |

```mermaid
flowchart TD
  UI[UI / Website] --> User[User interaction]
  BC[Blockchain] --> Proof[Prescription proof]
  BC --> Status[Status tracking]
  SC[Smart Contract] --> Rules[Rules checking]
  IDX[Indexer] --> Read[Blockchain data read]
  DB[Database] --> Search[Fast search & history]
```

---

## Part 13: Student Task (Demo)

### What student does:

1. Project **run** করে:

   ```bash
   npm run start
   ```

2. **UI** open করে  
3. **Prescription create** করে  
4. **QR scan** করে  
5. **Result observe** করে  

---

## Part 14: What Students Are Actually Learning

Students learn:

- Blockchain basics
- Wallet concept
- Smart contract logic
- Real system design
- Security thinking

---

## Part 15: Why This is Important for University

কারণ:

- **Real-world** blockchain app
- শুধু theory না
- **Industry-style** project
- **End-to-end** learning

---

## Final Simple Message

**Blockchain** মানে:

- Trust **without middleman**
- **Transparent** system
- **Rule-based** verification

**BlockMed দেখায় এটা বাস্তবে কীভাবে কাজ করে।**

---

## Next You Can Use 👇

- 📘 **Glossary sheet** (1-page exam ready)
- 🧪 **Lab worksheet** (task-by-task)
- 🧠 **Viva questions** with answers
- 🎞️ **Picture-based diagrams** (no text)

---

*Document for lecturer presentation | BlockMed Project | Bangla + English*
