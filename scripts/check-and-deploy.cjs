/**
 * Check Contract Deployment Status and Deploy if Needed
 * 
 * This script checks if the contract is deployed at the configured address.
 * If not, it deploys a new contract and updates the config.
 * 
 * Usage:
 *   npx hardhat run scripts/check-and-deploy.cjs --network localhost
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🔍 Checking BlockMed V2 Contract Deployment...\n");
  console.log("=".repeat(50));

  // Read current config
  const configPath = path.join(__dirname, "../src/utils/config.js");
  let configContent = fs.readFileSync(configPath, "utf8");
  
  // Extract current contract address from config
  const addressMatch = configContent.match(/CONTRACT_ADDRESS\s*=\s*['"](0x[a-fA-F0-9]{40})['"]/);
  const configuredAddress = addressMatch ? addressMatch[1] : null;
  
  console.log("📍 Configured Address:", configuredAddress || "Not set");

  // Check if contract exists at configured address
  let contractExists = false;
  if (configuredAddress) {
    try {
      const code = await hre.ethers.provider.getCode(configuredAddress);
      contractExists = code && code !== "0x" && code !== "0x0";
      console.log("📋 Contract Code:", contractExists ? "✅ Found" : "❌ Not found");
    } catch (error) {
      console.log("❌ Error checking contract:", error.message);
    }
  }

  if (contractExists) {
    console.log("\n✅ Contract is already deployed at:", configuredAddress);
    console.log("🎉 No deployment needed!");
    return;
  }

  console.log("\n⚠️  Contract not found. Deploying new contract...\n");

  // Get the contract factory
  const BlockMedV2 = await hre.ethers.getContractFactory("BlockMedV2");
  
  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const blockmed = await BlockMedV2.deploy();
  
  // Wait for deployment
  await blockmed.waitForDeployment();
  
  const contractAddress = await blockmed.getAddress();
  
  console.log("\n✅ BlockMed V2 deployed successfully!");
  console.log("📍 New Contract Address:", contractAddress);

  // Update config file
  const newConfig = configContent.replace(
    /export const CONTRACT_ADDRESS = ['"][^'"]*['"]/,
    `export const CONTRACT_ADDRESS = '${contractAddress}'`
  );
  
  fs.writeFileSync(configPath, newConfig, "utf8");
  console.log("\n✅ Updated src/utils/config.js with new address");

  // Get deployer info
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n👤 Deployed by:", deployer.address);
  
  // Get initial stats
  const prescriptionCount = await blockmed.prescriptionCount();
  const batchCount = await blockmed.batchCount();
  
  console.log("\n📊 Initial Stats:");
  console.log("   - Prescriptions:", prescriptionCount.toString());
  console.log("   - Medicine Batches:", batchCount.toString());
  
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Deployment Complete!");
  console.log("=".repeat(50));
  console.log("\n📝 Next Steps:");
  console.log("   1. The contract address has been automatically updated");
  console.log("   2. Refresh your browser");
  console.log("   3. Connect with Dev Mode or your wallet");
  console.log("   4. Start using BlockMed V2!");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
