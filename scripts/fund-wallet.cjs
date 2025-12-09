/**
 * Easy Wallet Funding Script
 * 
 * Fund any wallet address with ETH from Hardhat account #0
 * 
 * Usage:
 *   npx hardhat run scripts/fund-wallet.cjs --network localhost
 * 
 * Or with custom amount:
 *   FUND_AMOUNT=5.0 npx hardhat run scripts/fund-wallet.cjs --network localhost
 */

const hre = require("hardhat");

async function main() {
  console.log("\n💰 BlockMed Wallet Funding Script\n");
  console.log("=".repeat(50));

  // Get the funder account (account #0 - has 10,000 ETH)
  const [funder] = await hre.ethers.getSigners();
  
  console.log("\n📤 Funder Account:");
  console.log("  Address:", funder.address);
  const funderBalance = await hre.ethers.provider.getBalance(funder.address);
  console.log("  Balance:", hre.ethers.formatEther(funderBalance), "ETH");

  // Get recipient address from environment or prompt
  const recipientAddress = process.env.RECIPIENT_ADDRESS;
  const fundAmount = process.env.FUND_AMOUNT || "10.0";

  if (!recipientAddress) {
    console.log("\n❌ Error: No recipient address provided");
    console.log("\nUsage:");
    console.log("  RECIPIENT_ADDRESS=0x... npx hardhat run scripts/fund-wallet.cjs --network localhost");
    console.log("\nOr with custom amount:");
    console.log("  RECIPIENT_ADDRESS=0x... FUND_AMOUNT=5.0 npx hardhat run scripts/fund-wallet.cjs --network localhost");
    process.exit(1);
  }

  // Validate address
  if (!hre.ethers.isAddress(recipientAddress)) {
    console.log("\n❌ Error: Invalid address format");
    process.exit(1);
  }

  console.log("\n📥 Recipient Address:", recipientAddress);
  
  // Check recipient current balance
  const recipientBalance = await hre.ethers.provider.getBalance(recipientAddress);
  console.log("  Current Balance:", hre.ethers.formatEther(recipientBalance), "ETH");

  // Check if funder has enough balance
  const amountWei = hre.ethers.parseEther(fundAmount);
  if (funderBalance < amountWei) {
    console.log("\n❌ Error: Insufficient balance in funder account");
    console.log("  Required:", fundAmount, "ETH");
    console.log("  Available:", hre.ethers.formatEther(funderBalance), "ETH");
    process.exit(1);
  }

  // Send transaction
  console.log("\n⏳ Sending", fundAmount, "ETH...");
  const tx = await funder.sendTransaction({
    to: recipientAddress,
    value: amountWei
  });

  console.log("  Transaction Hash:", tx.hash);
  console.log("  Waiting for confirmation...");

  // Wait for confirmation
  const receipt = await tx.wait();
  console.log("  ✅ Confirmed in block:", receipt.blockNumber);

  // Check new balance
  const newBalance = await hre.ethers.provider.getBalance(recipientAddress);
  console.log("\n📊 New Balance:", hre.ethers.formatEther(newBalance), "ETH");
  console.log("  Increase:", hre.ethers.formatEther(newBalance - recipientBalance), "ETH");

  console.log("\n" + "=".repeat(50));
  console.log("✅ Funding complete!");
  console.log("=".repeat(50) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
