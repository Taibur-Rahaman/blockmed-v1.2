require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      // Pre-funded accounts with 10,000 ETH each
      // Use these in Dev Mode - no wallet needed!
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 20,
        accountsBalance: "10000000000000000000000", // 10,000 ETH per account
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      // Same accounts as hardhat network
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
    },
    // Polygon Mumbai Testnet (Optional)
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
    },
    // Sepolia Testnet (Optional)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
