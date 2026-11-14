// Contract addresses — update these after running `npx hardhat run scripts/deploy.js`
// These are the default addresses when deploying to a fresh Hardhat node
export const CONTRACT_ADDRESSES = {
  ALUAssetRegistry: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  ALULogoToken: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
};

// The SHA-256 hash of the official ALU logo (registered in Formative 1)
export const ALU_LOGO_HASH =
  "0x6758a9d159474f0744b25ca15b79dbfbba40e2c619937eb4d797b6edf4add9d1";

// The token ID of the registered ALU logo NFT (always 1 after fresh deploy)
export const ALU_LOGO_TOKEN_ID = 1n;

// Hardhat local network config for MetaMask
export const HARDHAT_NETWORK = {
  chainId: "0x7A69", // 31337 in hex
  chainName: "Hardhat Local",
  rpcUrls: ["http://127.0.0.1:8545"],
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
};

