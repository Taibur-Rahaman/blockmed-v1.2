/**
 * Quick test: deploy prescription to verify the flow works
 * Run: node scripts/test-prescription.mjs
 */
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const RPC = 'http://127.0.0.1:8545';

// Minimal ABI for addPrescription
const abi = [
  'function addPrescription(string patientHash, string ipfsHash) external returns (uint256)',
  'function prescriptionCount() view returns (uint256)',
];

async function main() {
  console.log('Testing prescription deployment...');
  console.log('Contract:', CONTRACT_ADDRESS);
  console.log('RPC:', RPC);

  const provider = new ethers.JsonRpcProvider(RPC);
  const blockNum = await provider.getBlockNumber();
  console.log('Block number:', blockNum);

  const code = await provider.getCode(CONTRACT_ADDRESS);
  if (!code || code === '0x' || code === '0x0') {
    console.error('ERROR: No contract at address. Run: npm run deploy (with Hardhat node running)');
    process.exit(1);
  }
  console.log('Contract code: found');

  const signer = new ethers.Wallet(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    provider
  );
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

  const patientHash = '0xtest' + Date.now();
  const ipfsHash = JSON.stringify({
    patient: { name: 'John', nid: '1234567890123', age: '34', gender: 'male' },
    symptoms: 'Fever',
    diagnosis: 'Cold',
    medicines: [{ name: 'Napa', dose: '1-1-1', duration: '5 days' }],
    doctor: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    createdAt: new Date().toISOString(),
  });

  try {
    console.log('\nCalling addPrescription...');
    const tx = await contract.addPrescription(patientHash, ipfsHash);
    console.log('Tx hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('Block:', receipt.blockNumber);
    const count = await contract.prescriptionCount();
    console.log('Prescription count:', count.toString());
    console.log('\n✅ Success! Prescription #' + count + ' created.');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.data) console.error('Data:', err.data);
    process.exit(1);
  }
}

main();
