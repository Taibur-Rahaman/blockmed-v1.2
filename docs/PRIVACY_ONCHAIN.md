# Privacy: Never Put PII On-Chain

For real-life and regulatory use (e.g. HIPAA/GDPR), **do not store any raw patient identifiers or PII on the blockchain**. On-chain data is public and permanent.

## What to store on-chain

- **Integrity/commitment only:** Use a **hash** of the patient identifier, not the identifier itself.
  - **BlockMed.sol (V1):** Uses `bytes32 hashedPatientId` — pass `keccak256(salt || patientId)` from the frontend. Never send raw NID, name, or other PII.
  - **BlockMedV2:** Uses `string patientHash`. For production, the frontend should pass **only** a hash, e.g. `keccak256(salt || patientId)` encoded as hex string. Never send raw PII.

## How to hash (frontend)

- **JavaScript/ethers:** `ethers.keccak256(ethers.toUtf8Bytes(salt + patientId))` for bytes32, or hex string of that for V2 if you keep string.
- Use a **salt** (random or fixed per app) to avoid rainbow-table attacks on short IDs.

## Off-chain

- Keep full prescription payloads **encrypted** (e.g. with crypto-js or Web Crypto API) before uploading to IPFS.
- Store decryption keys off-chain (e.g. server-side or user-managed); never put keys on-chain.

## Summary

| Do | Don’t |
|----|--------|
| Store only `bytes32` or hashed patient commitment on-chain | Put NID, name, phone, or any PII on-chain |
| Encrypt documents before IPFS; store only ciphertext hash | Store raw prescription text or identifiers on-chain |
| Use salt when hashing patient IDs | Use raw or unsalted identifiers |

This keeps the chain usable for verification and audit while avoiding re-identification and regulatory risk.
