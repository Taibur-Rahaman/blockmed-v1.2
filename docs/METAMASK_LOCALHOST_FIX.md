# FIX FOR PROBLEM #2 — MetaMask cannot reach Hardhat (localhost blocked)

This document provides step-by-step instructions to resolve the issue where MetaMask cannot access a local Hardhat node (e.g., `http://127.0.0.1:8545`), producing repeated RPC errors or `too many errors` from Hardhat.

## Why it happens

Localhost JSON-RPC requests can be blocked or rerouted by:

- ISP proxy injection
- VPNs or DNS changers
- Antivirus HTTPS scanning
- System proxy settings
- Firewall rules
- Browser privacy blockers (Brave Shields, uBlock, AdGuard)

This doc targets macOS and Windows common causes and fixes.

---

## STEP 1 — Turn OFF system proxy

### On macOS
1. Open System Settings
2. Go to Network
3. Click your active network → Details
4. Go to Proxies
5. Turn everything OFF
6. Save

### On Windows
1. Settings → Network & Internet
2. Proxy
3. Turn OFF:
   - Automatically detect settings
   - Manual proxy

---

## STEP 2 — Disable your VPN or DNS changer

If you use ProtonVPN, 1.1.1.1 Warp, Outline, Psiphon, or any local VPN app — turn it off.
VPNs can route or block `127.0.0.1` requests.

---

## STEP 3 — Disable HTTPS scanning (Antivirus)

If you use antivirus that scans HTTPS (Avast, Bitdefender, Kaspersky, ESET):
- Settings → Web Protection → disable HTTPS/SSL scanning

---

## STEP 4 — Disable Adblock / Tracker blockers

For Brave: disable Shields for your localhost app.
For Chrome/Firefox extensions: disable uBlock Origin, AdGuard, Ghostery, PrivacyBadger for localhost.

---

## STEP 5 — Restart everything

1. Close browser and MetaMask.
2. Restart your Hardhat node:

```bash
npx hardhat node
```

3. Reopen browser, MetaMask, then try connecting.

---

## Quick test
Open `http://localhost:8545` or `http://127.0.0.1:8545` — you should see a response (likely `Cannot GET /`).

If you still get `ERR_CONNECTION_REFUSED` or `ERR_FAILED`, something on the system is still blocking localhost.

---

## If you want personalized help
Reply with:
- Your OS (Windows or macOS)
- Browser (Chrome, Brave, Firefox)
- Whether you use a VPN/antivirus and which one

I will provide exact steps tailored to your system.
