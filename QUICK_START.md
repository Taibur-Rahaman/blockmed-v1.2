# Quick Start (Latest UI)

This guide ensures you run the latest code from GitHub and avoid old cached UI.

## 1) Clone and open the project

```bash
git clone https://github.com/Taibur-Rahaman/blockmed-v1.2.git
cd blockmed-v1.2
git checkout main
git pull origin main
```

## 2) Install dependencies

```bash
npm install
```

## 3) Start everything (recommended)

```bash
npm run start
```

This runs:
- Hardhat local blockchain (`localhost:8545`)
- Contract deploy/update
- Vite app (`localhost:3000`)

Open: `http://localhost:3000`

## 4) Log in quickly

- On login page, click **Use Dev Mode**
- Choose a role account (e.g. Admin #0, Doctor #1)
- Or connect MetaMask (chain ID `31337`)

## If old UI still shows

1. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Ensure no old server is running in another folder
3. Confirm latest commit:

```bash
git log --oneline -1
```

4. Confirm folder:

```bash
pwd
```

5. Restart app:

```bash
npm run dev
```

## Useful scripts

- `npm run dev` - Start frontend only
- `npm run blockchain` - Start Hardhat node
- `npm run deploy:check` - Deploy if needed
- `npm run deploy` - Force redeploy
- `npm run indexer` - Run optional event indexer (port `3002`)
