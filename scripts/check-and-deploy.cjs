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
  
  // Extract current contract address from config (handles: = '0x...' or || '0x...')
  const addressMatch = configContent.match(/(0x[a-fA-F0-9]{40})/);
  const configuredAddress = addressMatch ? addressMatch[1] : null;
  
  console.log("📍 Configured Address:", configuredAddress || "Not set");

  const forceRedeploy = process.env.FORCE_DEPLOY === "1" || process.env.FORCE_DEPLOY === "true";
  if (forceRedeploy) {
    console.log("🔄 FORCE_DEPLOY=1 — redeploying new contract (e.g. after contract code changes)...\n");
  } else {
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
      console.log("   To redeploy (e.g. after Solidity changes): npm run deploy");
      return;
    }

    console.log("\n⚠️  Contract not found. Deploying new contract...\n");
  }

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

  // Update config file (handles: = '0x...' or = import.meta.env.VITE_CONTRACT_ADDRESS || '0x...')
  const newConfig = configContent.replace(
    /(export const CONTRACT_ADDRESS = )(?:import\.meta\.env\.VITE_CONTRACT_ADDRESS \|\| )?['"][^'"]*['"]/,
    `$1import.meta.env.VITE_CONTRACT_ADDRESS || '${contractAddress}'`
  );
  
  fs.writeFileSync(configPath, newConfig, "utf8");
  console.log("\n✅ Updated src/utils/config.js with new address");

  // Write .env.local so Vite uses the new address (overrides any old .env)
  const envLocalPath = path.join(__dirname, "../.env.local");
  let envContent = "";
  try {
    if (fs.existsSync(envLocalPath)) {
      envContent = fs.readFileSync(envLocalPath, "utf8");
      if (envContent.includes("VITE_CONTRACT_ADDRESS=")) {
        envContent = envContent.replace(/VITE_CONTRACT_ADDRESS=.*/m, `VITE_CONTRACT_ADDRESS=${contractAddress}`);
      } else {
        envContent = (envContent.trim() ? envContent + "\n" : "") + `VITE_CONTRACT_ADDRESS=${contractAddress}`;
      }
    } else {
      envContent = `VITE_CONTRACT_ADDRESS=${contractAddress}\n`;
    }
    fs.writeFileSync(envLocalPath, envContent, "utf8");
    console.log("✅ Updated .env.local with VITE_CONTRACT_ADDRESS");
  } catch (e) {
    console.log("⚠️  Could not write .env.local:", e.message);
  }

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
  console.log("\n📝 Next Steps (important):");
  console.log("   1. STOP your dev server (Ctrl+C if npm run dev is running)");
  console.log("   2. Start it again: npm run dev");
  console.log("   3. Hard-refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)");
  console.log("   4. Log in as Admin (Dev Mode → Account #0) to verify & dispense");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
