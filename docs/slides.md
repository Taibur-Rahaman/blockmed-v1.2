% BlockMed: Teaching Blockchain (Grades 6 → University)
% Author: BlockMed project
% Updated: 2026-02-04

---

# Welcome

BlockMed — a hands-on blockchain project for teaching concepts from grade 6 up to university.

Slide goal: introduce blockchain ideas, show how BlockMed uses them, and provide levelled activities and demos.

---

## Learning roadmap (one slide)

- Grade 6–8: Big ideas & analogies
- High school: Transactions, wallets, verification
- University: Smart contracts, testing, deployment, security, extensions

---

## 1) Grade 6–8: Big ideas (Kid-friendly)

- What is a ledger? (analogy: classroom attendance sheet everyone can see)
- What is a block? (a page with many records)
- Why is it hard to cheat? (everyone checks the sheet)
- Real-world tie: how BlockMed tracks prescriptions and medicines using QR + ledger

Notes: Use physical props — index cards as blocks, students add a "transaction" and stamp it.

---

## Demo for younger students (5–15 min)

1. Show a sample medicine card with a QR code from `src/data/medicines.json` or `src/data/demoBatches.js`.
2. Explain: QR → unique ID recorded on the blockchain.
3. Optional classroom activity: each student makes a fake/real stamp and peers verify using a checklist.

---

## 2) High school: Concepts + simple tech

- Wallets & addresses: what they are and a mnemonic explanation
- Transactions: send, sign, verify
- Smart contract: the rules software that checks prescriptions
- Demo: run the local test chain and show a transaction in the UI

Hands-on steps (short):

1. Install deps: npm install
2. Start local chain and app: npm run start (this runs local Hardhat + deploy + dev server)
3. Open the UI and visit Pharmacy Verification / Patient Portal

Speaker note: use the `package.json` scripts (`blockchain`, `deploy`, `dev`, `start`) and `scripts/indexer/index.js` for the indexer demo.

---

## High school lab: Verify a prescription (30–45 min)

Goal: Students will see how a prescription is added and verified.

1. Instructor: run `npm run start` and open http://localhost:5173
2. Use the demo accounts created by Hardhat/Ganache (explain deterministic wallets)
3. Create sample prescriptions using the UI and scan QR codes
4. Observe events in the terminal and in `scripts/indexer/data/blockmed.db`

Optional assessment questions: What changed in the ledger? How would you detect a fake prescription?

---

## 3) University: Deep dive

- Smart contract architecture: review `contracts/BlockMedV2.sol`
- Testing & CI: read `test/BlockMedV2.test.cjs` and run `npm run test:blockchain`
- Security: reentrancy, access control, upgrades
- Data persistence & indexing: `scripts/indexer/index.js` and `better-sqlite3` usage

Assignment ideas:

- Implement a feature: add doctor role, or batch recall flow
- Write tests for new features, aim for coverage
- Perform a simple audit checklist for `BlockMedV2.sol`

---

## University lab: Extend BlockMed (2–4 hours)

1. Fork the repo and create a feature branch
2. Add a contract change under `contracts/` and a matching test in `test/`
3. Run local chain, deploy, and run tests: `npm run blockchain` then `npm run deploy:raw` then `npm run test:blockchain` (or the provided `npm run start` flow)
4. Update front-end `src/` components to call the new contract method and demonstrate in the UI

Deliverable: PR with contract + tests + UI demo and README

---

## Slide: How BlockMed maps to core blockchain topics

- Consensus? — Local demo uses single-node Hardhat; discuss mainnet consensus differences
- Immutability — explain immutability vs append-only logs and how indexers store derived state
- Privacy — on-chain public data vs off-chain sensitive data
- UX considerations: gas, wallets, onboarding

---

## Suggested slide timing and flow for a 50-minute class

1. 0–10 min: Big ideas + analogies (grade 6 friendly)
2. 10–20 min: Short demo on UI (high school level)
3. 20–35 min: Guided hands-on (student pairs follow a checklist)
4. 35–50 min: Discussion, security hints, assignments (university teaser)

---

## Visual assets & resources

- Repo locations:
  - Smart contract: `contracts/BlockMedV2.sol`
  - Frontend entry: `src/main.jsx`, `src/App.jsx`
  - Demo data: `src/data/demoBatches.js`, `src/data/medicines.json`
  - Scripts to run chain/deploy: `scripts/*` and `package.json` scripts

Tips: screenshot UI pages for slides, include simple diagrams (ledger, block, transaction flow).

---

## Conversion & delivery options

- Convert this Markdown to a PPTX using Pandoc or use Reveal.js for web slides.
- Pandoc (recommended for offline PPTX generation):

  1. Install pandoc and a TeX engine (macOS: Homebrew: `brew install pandoc --cask mactex-no-gui` or `brew install pandoc` + BasicTeX)
  2. Convert: `pandoc teaching/slides.md -t pptx -o teaching/BlockMed_Slides.pptx`

- Reveal.js (for live web presentation): use `npx reveal-md teaching/slides.md --theme solarized` (install reveal-md globally if desired).

---

## Assessment ideas & rubrics

- Grade 6–8: short quiz (5 questions) about ledger and verification — check for conceptual understanding
- High school: lab checklist (run demo, verify preset transactions, answer security question)
- University: PR with features + tests, and an audit report (10–15 points rubric)

---

## Next steps & extensions

- Add slide images (screenshots) into `teaching/assets/` and reference them in `slides.md` with Markdown image links.
- Create short Jupyter or Node notebooks that exercise contract functions for university lab.
- Create a sample PPTX exported from this Markdown and store in `teaching/` for quick distribution.

---

## Credits & further reading

- Project repo: current workspace
- Learning resources: Ethereum.org beginner guides, Hardhat docs, OpenZeppelin contracts
