const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying BlockMed V2 Smart Contract...\n");

  // Get the contract factory
  const BlockMedV2 = await hre.ethers.getContractFactory("BlockMedV2");
  
  // Deploy the contract
  const blockmed = await BlockMedV2.deploy();
  
  // Wait for deployment
  await blockmed.waitForDeployment();
  
  const contractAddress = await blockmed.getAddress();
  
  console.log("✅ BlockMed V2 deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("\n⚠️  IMPORTANT: Update the CONTRACT_ADDRESS in src/utils/config.js");
  console.log(`\n   export const CONTRACT_ADDRESS = '${contractAddress}'`);
  
  // Get deployer info
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n👤 Deployed by:", deployer.address);
  
  // Get initial stats
  const prescriptionCount = await blockmed.prescriptionCount();
  const batchCount = await blockmed.batchCount();
  
  console.log("\n📊 Initial Stats:");
  console.log("   - Prescriptions:", prescriptionCount.toString());
  console.log("   - Medicine Batches:", batchCount.toString());
  
  console.log("\n🎉 Deployment Complete!");
  console.log("━".repeat(50));
  console.log("\n📝 Next Steps:");
  console.log("   1. Copy the contract address above");
  console.log("   2. Update src/utils/config.js");
  console.log("   3. Run: npm run dev");
  console.log("   4. Connect MetaMask and start using BlockMed V2!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
