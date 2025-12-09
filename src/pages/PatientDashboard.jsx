import React, { useState } from 'react'
import { ethers } from 'ethers'
import contractABI from '../utils/contractABI.json'
import { CONTRACT_ADDRESS } from '../utils/config'

const PatientDashboard = () => {
  const [patientHash, setPatientHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!patientHash.trim()) return setError('Please enter a patient hash')
    if (!window.ethereum) return setError('MetaMask not detected')

    setLoading(true)
    setError('')
    setResults([])

    try {
      const provider = window.__sharedBrowserProvider || new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)

      const count = await contract.prescriptionCount()
      const num = Number(count)
      const found = []
      for (let i = 1; i <= num; i++) {
        const p = await contract.prescriptions(i)
        if (p[1] === patientHash) {
          found.push({
            id: p[0].toString(),
            patientHash: p[1],
            ipfsHash: p[2],
            doctor: p[3],
            timestamp: new Date(Number(p[4]) * 1000).toLocaleString(),
            verified: p[5]
          })
        }
      }

      setResults(found)
      if (found.length === 0) setError('No prescriptions found for this patient')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: '40px', maxWidth: '900px' }}>
      <div className="card">
        <h1>🧾 Patient Dashboard</h1>
        <p style={{ color: '#6b7280' }}>Enter your patient hash to view prescriptions</p>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label>Patient Hash</label>
          <input value={patientHash} onChange={(e) => setPatientHash(e.target.value)} placeholder="e.g., patient_demo001" />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={handleSearch} disabled={loading}>{loading ? 'Searching...' : '🔎 Search'}</button>
        </div>

        {results.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h3>Prescriptions</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {results.map(r => (
                <div key={r.id} style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                  <p><strong>ID:</strong> #{r.id}</p>
                  <p><strong>IPFS:</strong> {r.ipfsHash}</p>
                  <p><strong>Doctor:</strong> {r.doctor}</p>
                  <p><strong>Timestamp:</strong> {r.timestamp}</p>
                  <p><strong>Verified:</strong> {r.verified ? 'Yes' : 'No'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientDashboard
