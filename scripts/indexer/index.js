/**
 * BlockMed Event Indexer (free, open-source)
 * Listens to BlockMedV2 contract events and writes to SQLite.
 * Exposes HTTP API so data is "visible from any session".
 *
 * Usage:
 *   CONTRACT_ADDRESS=0x... RPC_URL=http://127.0.0.1:8545 node scripts/indexer/index.js
 *   Defaults: CONTRACT_ADDRESS from .env or config, RPC_URL=http://127.0.0.1:8545
 *
 * API:
 *   GET /api/health
 *   GET /api/prescriptions?doctor=0x...&patientHash=...
 *   GET /api/prescriptions/:id
 *   GET /api/batches
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { ethers } from "ethers";
import { readFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");

// Load ABI (events only needed for filtering; full ABI works)
const abiPath = join(root, "src/utils/contractABI.json");
const fullAbi = JSON.parse(readFileSync(abiPath, "utf8"));
const eventNames = [
  "PrescriptionCreated",
  "PrescriptionUpdated",
  "PrescriptionDispensed",
  "BatchCreated",
  "BatchRecalled",
  "BatchFlagged",
];
const abi = fullAbi.filter((x) => x.type === "event" && eventNames.includes(x.name));

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS ||
  process.env.VITE_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const PORT = Number(process.env.INDEXER_PORT) || 3001;
const DB_PATH = process.env.INDEXER_DB || join(__dirname, "data", "blockmed.db");

const Database = require("better-sqlite3");
const express = require("express");

// --- SQLite schema ---
function initDb(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS indexer_state (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY,
      patient_hash TEXT,
      doctor TEXT,
      expires_at INTEGER,
      created_at INTEGER,
      updated_at INTEGER,
      version INTEGER DEFAULT 1,
      reason TEXT,
      dispensed_by TEXT,
      dispensed_at INTEGER,
      raw_event TEXT
    );
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY,
      batch_number TEXT,
      medicine_name TEXT,
      manufacturer TEXT,
      created_at INTEGER,
      recalled_at INTEGER,
      recall_reason TEXT,
      recalled_by TEXT,
      flagged_at INTEGER,
      flag_reason TEXT,
      flagged_by TEXT,
      raw_event TEXT
    );
  `);
  const row = db.prepare("SELECT value FROM indexer_state WHERE key = ?").get("lastBlock");
  if (!row) {
    db.prepare("INSERT INTO indexer_state (key, value) VALUES (?, ?)").run("lastBlock", "0");
  }
}

// --- Indexer: listen and persist ---
async function getLastBlock(db) {
  const row = db.prepare("SELECT value FROM indexer_state WHERE key = ?").get("lastBlock");
  return row ? Number(row.value) : 0;
}

function setLastBlock(db, block) {
  db.prepare("UPDATE indexer_state SET value = ? WHERE key = ?").run(String(block), "lastBlock");
}

function indexEvent(db, event) {
  const name = event.eventName;
  const args = event.args;
  if (name === "PrescriptionCreated") {
    db.prepare(
      `INSERT OR REPLACE INTO prescriptions (id, patient_hash, doctor, expires_at, created_at, raw_event)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      Number(args.id),
      args.patientHash || "",
      args.doctor || "",
      Number(args.expiresAt ?? 0),
      Number(args.timestamp ?? 0),
      JSON.stringify({ event: name, blockNumber: event.blockNumber })
    );
  } else if (name === "PrescriptionUpdated") {
    const existing = db.prepare("SELECT id, version FROM prescriptions WHERE id = ?").get(Number(args.id));
    const version = existing ? (existing.version || 1) + 1 : 1;
    db.prepare(
      `UPDATE prescriptions SET updated_at = ?, version = ?, reason = ?, raw_event = ?
       WHERE id = ?`
    ).run(
      Number(args.timestamp ?? 0),
      version,
      args.reason || "",
      JSON.stringify({ event: name, blockNumber: event.blockNumber }),
      Number(args.id)
    );
  } else if (name === "PrescriptionDispensed") {
    db.prepare(
      `UPDATE prescriptions SET dispensed_by = ?, dispensed_at = ?, raw_event = ? WHERE id = ?`
    ).run(
      args.pharmacist || "",
      Number(args.timestamp ?? 0),
      JSON.stringify({ event: name, blockNumber: event.blockNumber }),
      Number(args.id)
    );
  } else if (name === "BatchCreated") {
    db.prepare(
      `INSERT OR REPLACE INTO batches (id, batch_number, medicine_name, manufacturer, created_at, raw_event)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      Number(args.id),
      args.batchNumber || "",
      args.medicineName || "",
      args.manufacturer || "",
      Number(args.timestamp ?? 0),
      JSON.stringify({ event: name, blockNumber: event.blockNumber })
    );
  } else if (name === "BatchRecalled") {
    db.prepare(
      `UPDATE batches SET recalled_at = ?, recall_reason = ?, recalled_by = ?, raw_event = ? WHERE id = ?`
    ).run(
      Number(args.timestamp ?? 0),
      args.reason || "",
      args.recalledBy || "",
      JSON.stringify({ event: name, blockNumber: event.blockNumber }),
      Number(args.id)
    );
  } else if (name === "BatchFlagged") {
    db.prepare(
      `UPDATE batches SET flagged_at = ?, flag_reason = ?, flagged_by = ?, raw_event = ? WHERE id = ?`
    ).run(
      Number(args.timestamp ?? 0),
      args.reason || "",
      args.flaggedBy || "",
      JSON.stringify({ event: name, blockNumber: event.blockNumber }),
      Number(args.id)
    );
  }
}

async function runIndexer(db, contract) {
  const fromBlock = (await getLastBlock(db)) || 0;
  const toBlock = await contract.provider.getBlockNumber();
  if (fromBlock > toBlock) return toBlock;

  const step = 2000;
  let current = fromBlock;
  while (current <= toBlock) {
    const end = Math.min(current + step - 1, toBlock);
    const filter = {
      address: CONTRACT_ADDRESS,
      fromBlock: current,
      toBlock: end,
    };
    const logs = await contract.provider.getLogs(filter);
    const iface = new ethers.Interface(abi);
    for (const log of logs) {
      try {
        const parsed = iface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsed && parsed.args && eventNames.includes(parsed.name)) {
          indexEvent(db, { eventName: parsed.name, args: parsed.args, blockNumber: log.blockNumber });
        }
      } catch (_) {
        // skip unparsed logs
      }
    }
    setLastBlock(db, end);
    current = end + 1;
  }
  return toBlock;
}

// --- HTTP API ---
function serveApi(db) {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    const lastBlock = getLastBlock(db);
    res.json({ ok: true, lastBlock, contract: CONTRACT_ADDRESS });
  });

  app.get("/api/prescriptions", (req, res) => {
    const { doctor, patientHash, limit = "100" } = req.query;
    let sql = "SELECT * FROM prescriptions WHERE 1=1";
    const params = [];
    if (doctor) {
      sql += " AND doctor = ?";
      params.push(doctor);
    }
    if (patientHash) {
      sql += " AND patient_hash = ?";
      params.push(patientHash);
    }
    sql += " ORDER BY created_at DESC LIMIT ?";
    params.push(Math.min(Number(limit) || 100, 500));
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  });

  app.get("/api/prescriptions/:id", (req, res) => {
    const row = db.prepare("SELECT * FROM prescriptions WHERE id = ?").get(Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });

  app.get("/api/batches", (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = db.prepare("SELECT * FROM batches ORDER BY created_at DESC LIMIT ?").all(limit);
    res.json(rows);
  });

  app.listen(PORT, () => {
    console.log(`Indexer API: http://localhost:${PORT}/api/health`);
    console.log(`  GET /api/prescriptions?doctor=0x...&patientHash=...`);
    console.log(`  GET /api/prescriptions/:id`);
    console.log(`  GET /api/batches`);
  });
}

// --- Main ---
async function main() {
  const dataDir = dirname(DB_PATH);
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  const db = new Database(DB_PATH);
  initDb(db);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

  console.log("BlockMed indexer (free tools):");
  console.log("  RPC:", RPC_URL);
  console.log("  Contract:", CONTRACT_ADDRESS);
  console.log("  DB:", DB_PATH);

  const last = await runIndexer(db, contract);
  console.log("  Backfill up to block:", last);

  // Live listener: ethers v6 contract.on with full ABI
  const fullContract = new ethers.Contract(CONTRACT_ADDRESS, fullAbi, provider);
  for (const name of eventNames) {
    fullContract.on(name, (...args) => {
      const ev = args[args.length - 1];
      const eventArgs = ev?.args ?? {};
      const blockNumber = ev?.log?.blockNumber ?? ev?.blockNumber;
      indexEvent(db, { eventName: name, args: eventArgs, blockNumber });
    });
  }

  serveApi(db);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
