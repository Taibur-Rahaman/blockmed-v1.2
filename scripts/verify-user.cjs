/**
 * Verify a user account
 * 
 * Usage:
 *   USER_ADDRESS=0x... npx hardhat run scripts/verify-user.cjs --network localhost
 */

const hre = require("hardhat");

async function main() {
  const userAddress = process.env.USER_ADDRESS;
  
  if (!userAddress) {
    console.error("❌ Error: USER_ADDRESS environment variable not set");
    console.log("\nUsage:");
    console.log("  USER_ADDRESS=0x... npx hardhat run scripts/verify-user.cjs --network localhost");
    process.exit(1);
  }

  console.log("\n🔍 Verifying User Account");
  console.log("=".repeat(50));
  console.log("User Address:", userAddress);

  // Get contract address from env or default
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const BlockMedV2 = await hre.ethers.getContractFactory("BlockMedV2");
  const contract = BlockMedV2.attach(contractAddress);

  // Get admin signer (first account)
  const [admin] = await hre.ethers.getSigners();
  console.log("Admin Address:", admin.address);

  try {
    // Check if user exists
    const user = await contract.getUser(userAddress);
    
    if (user.role === 0n) {
      console.log("\n❌ Error: User not registered");
      process.exit(1);
    }

    console.log("\n📋 User Info:");
    console.log("  Name:", user.name);
    console.log("  Role:", getRoleName(Number(user.role)));
    console.log("  License:", user.licenseNumber);
    console.log("  Verified:", user.isVerified);
    console.log("  Active:", user.isActive);

    if (user.isVerified) {
      console.log("\n✅ User is already verified!");
      return;
    }

    // Verify user
    console.log("\n⏳ Verifying user...");
    const tx = await contract.verifyUser(userAddress);
    await tx.wait();

    console.log("\n✅ User verified successfully!");
    console.log("Transaction hash:", tx.hash);

    // Confirm
    const updatedUser = await contract.getUser(userAddress);
    console.log("\n📋 Updated User Info:");
    console.log("  Verified:", updatedUser.isVerified);
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

function getRoleName(role) {
  const roles = ["None", "Admin", "Doctor", "Pharmacist", "Manufacturer", "Patient", "Regulator"];
  return roles[role] || "Unknown";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
