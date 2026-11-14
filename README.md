# ALU Logo Registry dApp

A fully working decentralised application (dApp) built for Individual Assignment 2. The frontend connects to two Solidity smart contracts deployed on a local Hardhat blockchain, allowing users to register and verify the official ALU logo through a browser-based interface.

---

## What This Project Does

The smart contracts (built in Formative 1) solve a real problem — they permanently register the ALU logo on the blockchain. This frontend is the user-facing interface that makes those contracts accessible to anyone without technical knowledge:

| Page | Description |
|------|-------------|
| **Home** | Landing page with wallet connection |
| **Register Logo** | Upload an image, hash it in-browser, register it as an NFT |
| **Verify Logo** | Upload any logo to check if it matches the blockchain record (no wallet needed) |
| **Dashboard** | View ALUT token ownership; contract owner can distribute tokens |

---

## SHA-256 Hash of the Official ALU Logo

```
0x6758a9d159474f0744b25ca15b79dbfbba40e2c619937eb4d797b6edf4add9d1
```

This hash is permanently recorded on the blockchain at Token ID **1**.

---

## Project Structure

```
blockchain_and_applications_assignment_1/
├── contracts/
│   ├── ALUAssetRegistry.sol     # ERC-721 logo registry contract
│   └── ALULogoToken.sol         # ERC-20 ownership token contract
├── scripts/
│   └── deploy.js                # Deploys both contracts + registers ALU logo
├── test/
│   └── ALUAssetRegistry.test.js # 13 tests (8 Formative 1 + 5 new integration)
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── constants.js         # Contract addresses + known hash
│       ├── abis/                # Extracted ABI JSON files
│       ├── hooks/useWallet.js   # Wallet connection hook
│       ├── utils/hash.js        # In-browser SHA-256 hashing utility
│       ├── components/Navbar.jsx
│       └── pages/
│           ├── Home.jsx
│           ├── Register.jsx
│           ├── Verify.jsx
│           └── Dashboard.jsx
├── alu-logo.png                 # The official ALU logo file
├── hardhat.config.ts
└── README.md
```

---

## Prerequisites

- **Node.js** v22+
- **MetaMask** browser extension (or any Web3 wallet)

---

## Setup & Running the dApp

### 1. Install Hardhat dependencies

```bash
cd blockchain_and_applications_assignment_1
npm install
```

### 2. Start the local Hardhat blockchain

Open a terminal and run:

```bash
npx hardhat node
```

Leave this running. It will print 20 test accounts with private keys — copy the first one to import into MetaMask.

### 3. Deploy the contracts

In a **new** terminal:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

You will see two contract addresses printed. Copy them into `frontend/src/constants.js`:

```js
export const CONTRACT_ADDRESSES = {
  ALUAssetRegistry: "0x...",  // paste here
  ALULogoToken: "0x...",      // paste here
};
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

### 5. Start the frontend dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Connecting MetaMask to Hardhat

1. Open MetaMask → Settings → Networks → Add a network manually
2. Enter:
   - **Network Name:** Hardhat Local
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
3. Import the first Hardhat account using its private key (shown in the `npx hardhat node` output)

---

## Using Each Feature

### Register a Logo
1. Connect your wallet (navbar)
2. Navigate to **Register Logo**
3. Upload an image — the SHA-256 hash is computed in your browser instantly
4. Enter an asset name and confirm the file type
5. Click **Register Logo on Blockchain** and approve in MetaMask
6. Your Token ID is shown on success

### Verify a Logo
1. Navigate to **Verify Logo** — **no wallet needed**
2. Upload any image file or paste a hash
3. The app checks the blockchain and shows a clear ✅ or ⚠️ result

### Dashboard
1. Connect your wallet
2. Navigate to **Dashboard**
3. View token balances and ownership percentages
4. If you are the contract owner, use the distribution form to send ALUT tokens

---

## Running All 13 Tests

```bash
npx hardhat test
```

Expected output: **13 passing**

---

## Versions

| Tool | Version |
|------|---------|
| Node.js | v22.x |
| Hardhat | v3.21.1 |
| ethers.js | v6.17.0 |
| React | v18.3.1 |
| Vite | v5.4.11 |
| Solidity | 0.8.34 |
| OpenZeppelin | v5.6.1 |

---

## Known Limitations

- The dApp is configured for the **local Hardhat network only**. To use it on a public testnet, update `CONTRACT_ADDRESSES` in `constants.js` and the RPC URL in `Verify.jsx`.
- The ownership percentage function uses integer division, so percentages below 1% display as 0%.
- MetaMask must be on Chain ID 31337 (Hardhat) or transactions will fail.
