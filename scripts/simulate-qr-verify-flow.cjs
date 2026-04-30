/**
 * Simulates pharmacy verification after scanning a prescription QR:
 * QR JSON contains prescriptionId + patientHash → call getPrescription(id) and compare hash.
 *
 * Requires: npm run blockchain, then npm run deploy:check
 * Usage: npx hardhat run scripts/simulate-qr-verify-flow.cjs --network localhost
 */
const hre = require('hardhat')
const fs = require('fs')
const path = require('path')

async function main() {
  const configPath = path.join(__dirname, '../src/utils/config.js')
  const configContent = fs.readFileSync(configPath, 'utf8')
  const addressMatch = configContent.match(/(0x[a-fA-F0-9]{40})/)
  if (!addressMatch) throw new Error('Could not parse CONTRACT_ADDRESS from config.js')

  const contractAddress = addressMatch[1]
  const [, doctor] = await hre.ethers.getSigners()
  const blockmed = await hre.ethers.getContractAt('BlockMedV2', contractAddress)
  const network = await hre.ethers.provider.getNetwork()

  const patientHash = '0x' + 'c'.repeat(64)
  const ipfsData = JSON.stringify({ patient: { name: 'QR Flow Test' }, medicines: [] })
  const tx = await blockmed.connect(doctor).addPrescription(patientHash, ipfsData)
  await tx.wait()

  const prescriptionId = Number(await blockmed.prescriptionCount())
  const qrPayload = JSON.stringify({
    type: 'prescription',
    version: 2,
    prescriptionId,
    patientHash,
    doctor: doctor.address,
    contractAddress,
    isDemo: false,
    chainId: Number(network.chainId),
    network: network.name,
  })

  const scanned = JSON.parse(qrPayload)
  const loaded = await blockmed.getPrescription(Number(scanned.prescriptionId))

  if (!loaded.id || Number(loaded.id) !== scanned.prescriptionId) {
    throw new Error(`ID mismatch: chain ${loaded.id} vs QR ${scanned.prescriptionId}`)
  }
  if (loaded.patientHash !== scanned.patientHash) {
    throw new Error('patientHash mismatch after simulated scan')
  }

  console.log('\n✅ simulate-qr-verify-flow')
  console.log('   contract:', contractAddress)
  console.log('   chainId :', Number(network.chainId))
  console.log('   prescriptionId:', prescriptionId)
  console.log('   (UI would call loadPrescription(' + prescriptionId + ') after scan — data matches on-chain.)\n')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
