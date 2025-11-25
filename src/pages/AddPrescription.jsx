import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import { QRCodeSVG } from 'qrcode.react'
import contractABI from '../utils/contractABI.json'
import { CONTRACT_ADDRESS } from '../utils/config'
import MedicineSearch from '../components/MedicineSearch'

const AddPrescription = ({ account }) => {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    patientHash: '',
    ipfsHash: ''
  })

  // New prescription fields
  const [patientName, setPatientName] = useState('')
  const [age, setAge] = useState('')
  const [symptomsField, setSymptomsField] = useState('')
  const [diagnosisField, setDiagnosisField] = useState('')
  const [medicines, setMedicines] = useState([])
  const [testsField, setTestsField] = useState('')
  const [adviceField, setAdviceField] = useState('')
  const [followUp, setFollowUp] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [prescriptionId, setPrescriptionId] = useState(null)
  const [qrValue, setQrValue] = useState('')
  const qrRef = React.useRef(null)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleAddMedicine = (med) => {
    // med already includes dose & duration from MedicineSearch
    setMedicines(prev => [...prev, med])
  }

  const handleRemoveMedicine = (index) => {
    setMedicines(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    if (!patientName.trim()) {
      setError('Patient name is required')
      return false
    }
    if (!symptomsField.trim()) {
      setError('Symptoms are required')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!validateForm()) {
      alert('Please fill all fields')
      return
    }

    // Check MetaMask
    if (!window.ethereum) {
      alert('Please install MetaMask!')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Connect to Ethereum provider
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Create contract instance
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        signer
      )

      console.log('Submitting prescription to blockchain...')
      console.log('Patient Hash:', formData.patientHash)
      console.log('IPFS Hash:', formData.ipfsHash)

      // Call smart contract function
      const tx = await contract.addPrescription(
        formData.patientHash,
        formData.ipfsHash
      )

      console.log('Transaction sent:', tx.hash)
      setTxHash(tx.hash)

      // Wait for transaction confirmation
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)

      // Get prescription ID from the event or contract
      const currentCount = await contract.prescriptionCount()
      const idString = currentCount.toString()
      setPrescriptionId(idString)

      // Generate QR code value (include prescription ID for verification)
      const qrData = JSON.stringify({
        prescriptionId: idString,
        patientHash: formData.patientHash,
        ipfsHash: formData.ipfsHash
      })
      setQrValue(qrData)

      alert('✅ Transaction Successful!\n\nYour prescription has been saved to the blockchain.')

    } catch (err) {
      console.error('Error submitting prescription:', err)
      
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction rejected by user')
      } else if (err.message.includes('invalid address')) {
        setError('Invalid contract address. Please check configuration.')
      } else {
        setError(err.message || 'Failed to submit prescription')
      }
      
      alert(`❌ Error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToDashboard = () => {
    navigate('/')
  }

  const handleCreateAnother = () => {
  setFormData({ patientHash: '', ipfsHash: '' })
    setTxHash('')
    setPrescriptionId(null)
    setQrValue('')
    setError('')
  setPatientName('')
  setAge('')
  setSymptomsField('')
  setDiagnosisField('')
  setMedicines([])
  setTestsField('')
  setAdviceField('')
  setFollowUp('')
  }

  return (
    <div className="container" style={{ paddingTop: '40px', maxWidth: '800px' }}>

      <div className="card">
        <h2>Prescription Details</h2>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Patient Info */}
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label>Patient Name</label>
              <input placeholder="Patient Name" value={patientName} onChange={(e)=>setPatientName(e.target.value)} />
            </div>
            <div>
              <label>Age</label>
              <input placeholder="Age or DOB" value={age} onChange={(e)=>setAge(e.target.value)} />
            </div>
          </div>

          {/* Symptoms & Diagnosis */}
          <div>
            <label>Symptoms</label>
            <textarea placeholder="Symptoms" value={symptomsField} onChange={(e)=>setSymptomsField(e.target.value)} />
          </div>
          <div>
            <label>Diagnosis</label>
            <textarea placeholder="Diagnosis" value={diagnosisField} onChange={(e)=>setDiagnosisField(e.target.value)} />
          </div>

          {/* Medicine Search & Add */}
          <div>
            <label>Search medicine (BD)</label>
            <MedicineSearch onAdd={handleAddMedicine} />
          </div>

          <div>
            <h4>Added Medicines</h4>
            {medicines.length === 0 && <p style={{ color: '#6b7280' }}>No medicines added.</p>}
            <ul>
              {medicines.map((m, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{m.name}</strong> — {m.dose} — {m.duration}
                      <div style={{ color: '#6b7280', fontSize: 13 }}>{m.generic ? `Generic: ${m.generic}` : ''}</div>
                    </div>
                    <div>
                      <button className="btn-secondary" onClick={()=>handleRemoveMedicine(i)}>Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Tests & Advice & Follow-up */}
          <div>
            <label>Recommended Tests</label>
            <input placeholder="e.g., CBC, LFT" value={testsField} onChange={(e)=>setTestsField(e.target.value)} />
          </div>
          <div>
            <label>Advice / Precaution</label>
            <textarea placeholder="Doctor advice" value={adviceField} onChange={(e)=>setAdviceField(e.target.value)} />
          </div>
          <div>
            <label>Follow-up (mm/dd/yyyy)</label>
            <input type="date" value={followUp} onChange={(e)=>setFollowUp(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button className="btn-primary" onClick={async (e)=>{
              // Generate QR / JSON summary
              if(!patientName.trim()) { setError('Patient name is required'); return }
              const summary = {
                patientName, age, symptoms: symptomsField, diagnosis: diagnosisField,
                medicines, tests: testsField, advice: adviceField, followUp, createdAt: new Date().toISOString()
              }
              // populate patientHash and ipfsHash placeholders (IPFS not integrated here)
              try{
                const ph = typeof btoa !== 'undefined' ? btoa(`${patientName}|${age}|${Date.now()}`) : `${patientName}-${Date.now()}`
                setFormData(prev=>({ ...prev, patientHash: ph, ipfsHash: JSON.stringify(summary) }))
              }catch(e){
                setFormData(prev=>({ ...prev, patientHash: `${patientName}-${Date.now()}`, ipfsHash: JSON.stringify(summary) }))
              }
              const qr = JSON.stringify(summary)
              setQrValue(qr)
              alert('Prescription generated — you can now submit to blockchain or download the QR')
            }}>Generate Prescription</button>

            <button className="btn-secondary" onClick={()=>{
              // clear generated but keep patient fields
              setQrValue('')
              setFormData(prev=>({ ...prev, patientHash: '', ipfsHash: '' }))
            }}>Clear Generated</button>
          </div>
        </div>

        {/* Blockchain submission form (optional) */}
        <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
          <div className="form-group">
            <label htmlFor="patientHash">Patient Hash ID</label>
            <input type="text" id="patientHash" name="patientHash" value={formData.patientHash} onChange={handleInputChange} placeholder="auto-filled after generate or enter manually" />
          </div>
          <div className="form-group">
            <label htmlFor="ipfsHash">IPFS Hash / Data</label>
            <input type="text" id="ipfsHash" name="ipfsHash" value={formData.ipfsHash} onChange={handleInputChange} placeholder="auto-filled after generate or enter IPFS hash" />
          </div>

          {!txHash && (
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: '100%', marginTop: '10px' }}>
              {isSubmitting ? '⏳ Submitting to Blockchain...' : '✅ Submit Prescription to Blockchain'}
            </button>
          )}
  </form>

        {/* Transaction Success */}
        {txHash && (
          <div className="alert alert-success mt-20">
            <h3 style={{ color: '#065f46', marginBottom: '10px' }}>✅ Transaction Successful!</h3>
            <p style={{ marginBottom: '8px' }}>
              <strong>Prescription ID:</strong> #{prescriptionId}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Transaction Hash:</strong>
            </p>
            <p style={{ 
              wordBreak: 'break-all', 
              fontFamily: 'monospace', 
              fontSize: '13px',
              background: '#fff',
              padding: '8px',
              borderRadius: '4px'
            }}>
              {txHash}
            </p>
          </div>
        )}

        {/* QR Code Display */}
        {qrValue && (
          <div className="mt-20">
            <h3 className="text-center">📱 Prescription QR Code</h3>
            <div className="qr-container">
              <div ref={qrRef}>
                <QRCodeSVG 
                  value={qrValue} 
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <p className="text-center" style={{ color: '#6b7280', fontSize: '14px', marginTop: '10px' }}>
              Scan this QR code to view prescription details
            </p>
            <div style={{ 
              background: '#f9fafb', 
              padding: '12px', 
              borderRadius: '8px', 
              marginTop: '10px',
              fontSize: '13px',
              wordBreak: 'break-all'
            }}>
              {qrValue}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  try {
                    const svg = qrRef.current.querySelector('svg')
                    const serializer = new XMLSerializer()
                    const svgStr = serializer.serializeToString(svg)
                    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `prescription_${prescriptionId || 'qr'}.svg`
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    URL.revokeObjectURL(url)
                  } catch (e) {
                    alert('Failed to download QR')
                  }
                }}
              >
                ⬇️ Download QR (SVG)
              </button>

              <button
                className="btn-secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(qrValue)
                    alert('QR data copied to clipboard')
                  } catch (e) {
                    alert('Failed to copy QR data')
                  }
                }}
              >
                📋 Copy QR Data
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {txHash && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              className="btn-primary" 
              onClick={handleCreateAnother}
              style={{ flex: 1 }}
            >
              ➕ Create Another
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleBackToDashboard}
              style={{ flex: 1 }}
            >
              🏠 Back to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="card">
        <h3>ℹ️ Important Notes</h3>
        <ul style={{ color: '#6b7280', lineHeight: '1.8', marginLeft: '20px' }}>
          <li>Ensure MetaMask is connected to the correct network</li>
          <li>Patient hash should be a unique identifier for privacy</li>
          <li>IPFS hash must contain the actual prescription document</li>
          <li>Transactions are irreversible once confirmed on blockchain</li>
          <li>Save the QR code for patient/pharmacy verification</li>
        </ul>
      </div>
    </div>
  )
}

export default AddPrescription
