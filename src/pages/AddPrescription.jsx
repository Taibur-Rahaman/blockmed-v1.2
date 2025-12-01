import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import { QRCodeSVG } from 'qrcode.react'
import contractABI from '../utils/contractABI.json'
import { CONTRACT_ADDRESS } from '../utils/config'
import MedicineSearch from '../components/MedicineSearch'

const initialPatient = { name: '', age: '', gender: '' }

const AddPrescription = ({ account }) => {
  const navigate = useNavigate()
  const printRef = useRef()

  // Consolidated form state
  const [patient, setPatient] = useState(initialPatient)
  const [symptoms, setSymptoms] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [medicines, setMedicines] = useState([])
  const [tests, setTests] = useState('')
  const [advice, setAdvice] = useState('')
  const [followUp, setFollowUp] = useState('')

  // Blockchain & UI state
  const [formData, setFormData] = useState({ patientHash: '', ipfsHash: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [prescriptionId, setPrescriptionId] = useState(null)
  const [qrValue, setQrValue] = useState('')
  const qrRef = useRef(null)
  const [error, setError] = useState('')

  const handleAddMedicine = (med) => setMedicines(prev => [...prev, med])
  const handleRemoveMedicine = (index) => setMedicines(prev => prev.filter((_, i) => i !== index))

  const validateForm = () => {
    if (!patient.name.trim()) { setError('Patient name is required'); return false }
    if (!symptoms.trim()) { setError('Symptoms are required'); return false }
    return true
  }

  const handleGenerate = () => {
    if (!validateForm()) return
    const summary = { patient, symptoms, diagnosis, medicines, tests, advice, followUp, createdAt: new Date().toISOString() }
    try {
      const ph = typeof btoa !== 'undefined' ? btoa(`${patient.name}|${patient.age}|${Date.now()}`) : `${patient.name}-${Date.now()}`
      setFormData({ patientHash: ph, ipfsHash: JSON.stringify(summary) })
    } catch (e) {
      setFormData({ patientHash: `${patient.name}-${Date.now()}`, ipfsHash: JSON.stringify(summary) })
    }
    setQrValue(JSON.stringify(summary))
  }

  const handlePrint = () => {
    // Use browser print; user can limit to the preview card
    window.print()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.patientHash || !formData.ipfsHash) { setError('Patient hash and IPFS/data are required to submit'); return }
    if (!window.ethereum) { setError('MetaMask not found'); return }

    setIsSubmitting(true)
    setError('')
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)
      const tx = await contract.addPrescription(formData.patientHash, formData.ipfsHash, {
        gasPrice: 1,  // Set to 1 wei (minimal cost for real blockchain demo)
        gasLimit: 300000  // Set reasonable gas limit
      })
      setTxHash(tx.hash)
      const receipt = await tx.wait()
      const currentCount = await contract.prescriptionCount()
      const idString = currentCount.toString()
      setPrescriptionId(idString)
      const qrData = JSON.stringify({ prescriptionId: idString, patientHash: formData.patientHash, ipfsHash: formData.ipfsHash })
      setQrValue(qrData)
      setError('')
      alert('✅ Prescription Submitted to Blockchain!\n\n🔗 Transaction Hash: ' + tx.hash.substring(0, 10) + '...')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearGenerated = () => {
    setQrValue('')
    setFormData({ patientHash: '', ipfsHash: '' })
  }

  const handleBackToDashboard = () => navigate('/')
  const handleCreateAnother = () => {
    setPatient(initialPatient); setSymptoms(''); setDiagnosis(''); setMedicines([]); setTests(''); setAdvice(''); setFollowUp('')
    setFormData({ patientHash: '', ipfsHash: '' }); setTxHash(''); setPrescriptionId(null); setQrValue(''); setError('')
  }

  return (
    <div className="container" style={{ paddingTop: 30, maxWidth: 1000 }}>
      <div className="card">
        <h1>Create Prescription</h1>
        <p style={{ color: '#6b7280' }}>Fill patient details, add medicines and generate a printable prescription. Blockchain submission is optional and separated below.</p>
      </div>

      <div className="card" ref={printRef}>
        {error && <div className="alert alert-error">{error}</div>}

        <h2>1. Patient Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input placeholder="Name" value={patient.name} onChange={(e)=>setPatient({...patient, name: e.target.value})} />
          <div>
            <label style={{ fontSize: 12, color: '#6b7280' }}>Date of Birth</label>
            <input type="date" value={patient.dob || ''} onChange={(e)=>{
              const dob = e.target.value
              // compute age
              let age = ''
              if(dob){
                const diff = Date.now() - new Date(dob).getTime()
                age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
              }
              setPatient(prev=>({...prev, dob, age: age.toString()}))
            }} />
            <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>{patient.age ? `Age: ${patient.age}` : ''}</div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280' }}>Gender</label>
            <select value={patient.gender || ''} onChange={(e)=>setPatient({...patient, gender: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '2px solid #e5e7eb' }}>
              <option value="">Select gender (optional)</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <h2 style={{ marginTop: 18 }}>2. Symptoms & Diagnosis</h2>
        <textarea placeholder="Symptoms" value={symptoms} onChange={(e)=>setSymptoms(e.target.value)} />
        <textarea placeholder="Diagnosis" value={diagnosis} onChange={(e)=>setDiagnosis(e.target.value)} />

        <h2 style={{ marginTop: 18 }}>3. Medicines</h2>
        <MedicineSearch onAdd={handleAddMedicine} />

        <div style={{ marginTop: 12 }}>
          <h4>Added medicines</h4>
          {medicines.length === 0 && <p style={{ color: '#6b7280' }}>No medicines added yet.</p>}
          <ul>
            {medicines.map((m, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{m.name}</strong> {m.form ? `— ${m.form}` : ''} {m.strength ? `— ${m.strength}` : ''} — {m.dose} — {m.duration}
                    <div style={{ color: '#6b7280', fontSize: 13 }}>{m.generic && `Generic: ${m.generic}`}</div>
                  </div>
                  <div>
                    <button className="btn-secondary" onClick={()=>handleRemoveMedicine(i)}>Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <h2 style={{ marginTop: 18 }}>4. Tests & Advice</h2>
        <input placeholder="Recommended lab tests (comma separated)" value={tests} onChange={(e)=>setTests(e.target.value)} />
        <textarea placeholder="Doctor advice / precaution" value={advice} onChange={(e)=>setAdvice(e.target.value)} />

        <h2 style={{ marginTop: 18 }}>5. Follow-up</h2>
        <input placeholder="Follow-up date or duration" value={followUp} onChange={(e)=>setFollowUp(e.target.value)} />

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn-primary" onClick={handleGenerate}>Generate Prescription & QR</button>
          <button className="btn-secondary" onClick={handlePrint}>Print Prescription</button>
          <button className="btn-secondary" onClick={handleClearGenerated}>Clear Generated</button>
        </div>

        {qrValue && (
          <div style={{ marginTop: 18 }}>
            <h3>QR Code</h3>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <QRCodeSVG value={qrValue} size={160} level="H" includeMargin={true} />
              <div style={{ maxWidth: 520, wordBreak: 'break-all', background: '#f9fafb', padding: 10, borderRadius: 8 }}>
                <pre style={{ margin: 0, fontSize: 12 }}>{qrValue}</pre>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <button className="btn-primary" onClick={()=>{navigator.clipboard.writeText(qrValue)}}>Copy QR Data</button>
            </div>
          </div>
        )}
      </div>

      {/* Print-ready preview */}
      <div className="card print-area" style={{ marginTop: 14 }}>
        <h3>Print-ready Preview</h3>
        <div style={{ padding: 12, background: '#fff', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ margin: 0 }}>{patient.name || 'Patient Name'}</h4>
              <div style={{ color: '#6b7280' }}>{patient.age ? `Age: ${patient.age}` : ''} {patient.gender ? ` • ${patient.gender}` : ''}</div>
            </div>
            {qrValue && <QRCodeSVG value={qrValue} size={100} level="H" includeMargin={true} />}
          </div>

          <hr />
          <div>
            <h5>Diagnosis</h5>
            <div style={{ color: '#111' }}>{diagnosis || '-'}</div>
          </div>

          <div style={{ marginTop: 8 }}>
            <h5>Medicines</h5>
            <ol>
              {medicines.map((m, i) => (
                <li key={i}>{m.name} — {m.dose} — {m.duration}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Blockchain submission - visually separated */}
      <div className="card" style={{ marginTop: 14 }}>
        <h3>🔗 Submit to Real Blockchain</h3>
        <p style={{ color: '#059669', fontWeight: '600' }}>✅ Real Blockchain Demo - Shows actual transaction on-chain!</p>
        <p style={{ color: '#6b7280' }}>For university projects: Demonstrates genuine blockchain functionality with minimal gas fees.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="patientHash">Patient Hash ID</label>
            <input type="text" id="patientHash" name="patientHash" value={formData.patientHash} onChange={(e)=>setFormData(prev=>({...prev, patientHash: e.target.value}))} placeholder="auto-filled after generate or enter manually" />
          </div>
          <div className="form-group">
            <label htmlFor="ipfsHash">IPFS Hash / Data</label>
            <input type="text" id="ipfsHash" name="ipfsHash" value={formData.ipfsHash} onChange={(e)=>setFormData(prev=>({...prev, ipfsHash: e.target.value}))} placeholder="auto-filled after generate or enter IPFS hash" />
          </div>

          {!txHash && (
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: '100%', marginTop: '10px' }}>
              {isSubmitting ? '⏳ Submitting to Blockchain...' : '✅ Submit Prescription to Blockchain'}
            </button>
          )}

          {txHash && (
            <div className="alert alert-success mt-20">
              <h3 style={{ color: '#065f46', marginBottom: '10px' }}>✅ Transaction Successful!</h3>
              <p style={{ marginBottom: '8px' }}><strong>Prescription ID:</strong> #{prescriptionId}</p>
              <p style={{ marginBottom: '8px' }}><strong>Transaction Hash:</strong></p>
              <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '13px', background: '#fff', padding: '8px', borderRadius: '4px' }}>{txHash}</p>
            </div>
          )}
        </form>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3>ℹ️ Important Notes</h3>
        <ul style={{ color: '#6b7280', lineHeight: '1.8', marginLeft: '20px' }}>
          <li>Blockchain submission is optional — use only when necessary</li>
          <li>Patient hash should be a unique identifier for privacy</li>
          <li>IPFS hash must contain the actual prescription document or data</li>
          <li>Transactions are irreversible once confirmed on blockchain</li>
          <li>Use the Print button to get a formatted prescription for the patient</li>
        </ul>
      </div>
    </div>
  )
}

export default AddPrescription
