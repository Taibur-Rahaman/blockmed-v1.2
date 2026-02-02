/**
 * Easy Local Testing Script - No Wallet Needed!
 * 
 * Run: npx hardhat run scripts/test-local.cjs --network localhost
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🧪 BlockMed Local Testing\n");
  console.log("=".repeat(50));

  // Get signers (accounts with 10,000 ETH each)
  const [admin, doctor, pharmacist, patient] = await hre.ethers.getSigners();
  
  console.log("\n💰 Test Accounts (All have 10,000 ETH):");
  console.log("  Admin:      ", admin.address);
  console.log("  Doctor:     ", doctor.address);
  console.log("  Pharmacist: ", pharmacist.address);
  console.log("  Patient:    ", patient.address);

  // Get contract address from env or default (first Hardhat deploy)
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const BlockMedV2 = await hre.ethers.getContractFactory("BlockMedV2");
  const contract = BlockMedV2.attach(contractAddress);

  console.log("\n📋 Contract:", contractAddress);

  // Check current state
  const prescriptionCount = await contract.prescriptionCount();
  console.log("\n📊 Current Prescriptions:", prescriptionCount.toString());

  // Create a test prescription
  console.log("\n--- Creating Test Prescription ---");
  
  const patientData = {
    patient: { name: "Test Patient", age: "30", gender: "male" },
    medicines: [
      { name: "Napa", generic: "Paracetamol", dose: "500mg", frequency: "1-0-1" },
      { name: "Seclo", generic: "Omeprazole", dose: "20mg", frequency: "1-0-0" }
    ],
    diagnosis: "Fever with gastritis",
    symptoms: "High temperature, stomach pain",
    validityDays: 30
  };

  const tx = await contract.addPrescription(
    "patient-hash-" + Date.now(),
    JSON.stringify(patientData)
  );
  
  const receipt = await tx.wait();
  const newCount = await contract.prescriptionCount();
  
  console.log("✅ Prescription Created!");
  console.log("  ID:", newCount.toString());
  console.log("  Tx Hash:", tx.hash);
  console.log("  Gas Used:", receipt.gasUsed.toString());

  // Verify the prescription
  const presc = await contract.getPrescription(newCount);
  console.log("\n📋 Prescription Details:");
  console.log("  Doctor:", presc.doctor);
  console.log("  Active:", presc.isActive);
  console.log("  Dispensed:", presc.isDispensed);
  console.log("  Expires:", new Date(Number(presc.expiresAt) * 1000).toLocaleDateString());

  // Check validity
  const [isValid, status] = await contract.isPrescriptionValid(newCount);
  console.log("\n✅ Validity Check:");
  console.log("  Valid:", isValid);
  console.log("  Status:", status);

  // Print QR data
  const qrData = JSON.stringify({
    prescriptionId: newCount.toString(),
    contract: contractAddress,
    network: "localhost"
  });
  
  console.log("\n📱 QR Code Data (for testing):");
  console.log(qrData);

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Test Complete! Prescription #" + newCount.toString() + " is ready to verify.");
  console.log("\nTo verify manually:");
  console.log("  1. Open http://localhost:3000/pharmacy");
  console.log("  2. Enter ID: " + newCount.toString());
  console.log("  3. Click 'Load Prescription'");
  console.log("=".repeat(50) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
