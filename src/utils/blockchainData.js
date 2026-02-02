/**
 * Blockchain data helpers – read prescriptions and batches from the contract.
 * Use these to "find old data": data lives on-chain and is never deleted by the app.
 * @see BLOCKCHAIN_DATA_PERSISTENCE.md
 */

import { getReadContract } from './contractHelper'

/**
 * Get all prescription IDs (1 .. prescriptionCount). Use for admin/audit or "list all".
 * @returns {Promise<number[]>} Array of prescription IDs
 */
export async function getAllPrescriptionIds() {
  const contract = await getReadContract()
  const count = await contract.prescriptionCount()
  const n = Number(count)
  if (n === 0) return []
  return Array.from({ length: n }, (_, i) => i + 1)
}

/**
 * Fetch one prescription by ID. Returns normalized object for UI.
 * @param {number} id - Prescription ID
 * @returns {Promise<object|null>} Prescription data or null if invalid
 */
export async function fetchPrescriptionById(id) {
  const contract = await getReadContract()
  try {
    const p = await contract.getPrescription(id)
    return normalizePrescription(p, id)
  } catch {
    return null
  }
}

/**
 * Fetch multiple prescriptions by IDs. Useful after getAllPrescriptionIds().
 * @param {number[]} ids - Prescription IDs
 * @param {number} [limit=100] - Max number to fetch (avoid huge loops)
 * @returns {Promise<object[]>} Array of prescription objects
 */
export async function fetchPrescriptionsByIds(ids, limit = 100) {
  const contract = await getReadContract()
  const toFetch = ids.slice(0, limit)
  const list = []
  for (const id of toFetch) {
    try {
      const p = await contract.getPrescription(id)
      list.push(normalizePrescription(p, id))
    } catch {
      // Skip invalid IDs
    }
  }
  return list
}

/**
 * Load all prescriptions (for admin/audit). Respects optional limit.
 * Data is read from blockchain – same data after closing project or new npm run.
 * @param {number} [limit=100] - Max prescriptions to load
 * @returns {Promise<{ ids: number[], prescriptions: object[], total: number }>}
 */
export async function fetchAllPrescriptions(limit = 100) {
  const ids = await getAllPrescriptionIds()
  const total = ids.length
  const prescriptions = await fetchPrescriptionsByIds(ids, limit)
  return { ids, prescriptions, total }
}

/**
 * Normalize contract prescription struct to a simple object (handles both V1-style and V2).
 */
function normalizePrescription(p, id) {
  if (!p) return null
  const created = p.createdAt != null ? Number(p.createdAt) : Number(p.timestamp)
  return {
    id: Number(p.id ?? id),
    patientHash: p.patientHash ?? '',
    ipfsHash: p.ipfsHash ?? '',
    doctor: p.doctor ?? '',
    createdAt: created,
    expiresAt: p.expiresAt != null ? Number(p.expiresAt) : null,
    isDispensed: p.isDispensed ?? p.verified ?? false,
    dispensedBy: p.dispensedBy ?? null,
    dispensedAt: p.dispensedAt != null ? Number(p.dispensedAt) : null,
    version: p.version != null ? Number(p.version) : 1,
    isActive: p.isActive !== false,
  }
}

export default {
  getAllPrescriptionIds,
  fetchPrescriptionById,
  fetchPrescriptionsByIds,
  fetchAllPrescriptions,
}
