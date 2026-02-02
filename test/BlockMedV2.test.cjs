const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('BlockMedV2', function () {
  let blockmed
  let owner
  let doctor
  let pharmacist
  let manufacturer
  let patient

  const ROLE = { None: 0, Admin: 1, Doctor: 2, Pharmacist: 3, Manufacturer: 4, Patient: 5, Regulator: 6 }

  beforeEach(async function () {
    [owner, doctor, pharmacist, manufacturer, patient] = await ethers.getSigners()
    const BlockMedV2 = await ethers.getContractFactory('BlockMedV2')
    blockmed = await BlockMedV2.deploy()
    await blockmed.waitForDeployment()
  })

  describe('Deployment', function () {
    it('Should set owner correctly', async function () {
      expect(await blockmed.owner()).to.equal(owner.address)
    })

    it('Should start with 0 prescriptions', async function () {
      expect(await blockmed.prescriptionCount()).to.equal(0)
    })

    it('Should start with 0 batches', async function () {
      expect(await blockmed.batchCount()).to.equal(0)
    })
  })

  describe('Legacy addPrescription', function () {
    it('Should create prescription and auto-register as doctor', async function () {
      const patientHash = '0x' + 'a'.repeat(64)
      const ipfsHash = JSON.stringify({ test: true })

      const tx = await blockmed.connect(doctor).addPrescription(patientHash, ipfsHash)
      await tx.wait()

      expect(await blockmed.prescriptionCount()).to.equal(1)

      const p = await blockmed.prescriptions(1)
      expect(p.patientHash).to.equal(patientHash)
      expect(p.ipfsHash).to.equal(ipfsHash)
      expect(p.doctor).to.equal(doctor.address)
      expect(p.isDispensed).to.equal(false)

      const user = await blockmed.users(doctor.address)
      expect(Number(user.role)).to.equal(ROLE.Doctor)
    })

    it('Should allow multiple prescriptions', async function () {
      const hash1 = '0x' + '1'.repeat(64)
      const hash2 = '0x' + '2'.repeat(64)

      await blockmed.connect(doctor).addPrescription(hash1, '{"a":1}')
      await blockmed.connect(doctor).addPrescription(hash2, '{"a":2}')

      expect(await blockmed.prescriptionCount()).to.equal(2)
    })
  })

  describe('Legacy verifyPrescription (dispense)', function () {
    it('Should allow pharmacist to dispense', async function () {
      const patientHash = '0x' + 'a'.repeat(64)
      await blockmed.connect(doctor).addPrescription(patientHash, '{}')
      await blockmed.connect(pharmacist).verifyPrescription(1)

      const p = await blockmed.prescriptions(1)
      expect(p.isDispensed).to.equal(true)
      expect(p.dispensedBy).to.equal(pharmacist.address)
    })
  })

  describe('User registration', function () {
    it('Should register user with role', async function () {
      await blockmed.connect(doctor).registerUser('Dr. Smith', 'BMDC123', ROLE.Doctor)

      const user = await blockmed.users(doctor.address)
      expect(user.name).to.equal('Dr. Smith')
      expect(user.licenseNumber).to.equal('BMDC123')
      expect(Number(user.role)).to.equal(ROLE.Doctor)
    })

    it('Should not allow double registration', async function () {
      await blockmed.connect(doctor).registerUser('Dr. Smith', 'BMDC123', ROLE.Doctor)
      await expect(
        blockmed.connect(doctor).registerUser('Other', 'X', ROLE.Pharmacist)
      ).to.be.revertedWith('User already registered')
    })
  })

  describe('Batch management', function () {
    it('Should create batch as verified manufacturer', async function () {
      await blockmed.connect(manufacturer).registerUser('Pharma Co', 'DL123', ROLE.Manufacturer)
      await blockmed.connect(owner).verifyUser(manufacturer.address)

      const batchNum = 'BATCH-2024-001'
      const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365
      const tx = await blockmed.connect(manufacturer).createMedicineBatch(
        batchNum,
        'Paracetamol',
        'Acetaminophen',
        expiresAt,
        'Bangladesh',
        'QmHash123',
        1000
      )
      await tx.wait()

      expect(await blockmed.batchCount()).to.equal(1)
      const b = await blockmed.medicineBatches(1)
      expect(b.batchNumber).to.equal(batchNum)
      expect(b.medicineName).to.equal('Paracetamol')
      expect(Number(b.totalUnits)).to.equal(1000)
    })
  })
})
