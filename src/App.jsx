import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MetaMaskConnect from './components/MetaMaskConnect'
import Dashboard from './pages/Dashboard'
import AddPrescription from './pages/AddPrescription'
import PharmacyVerification from './pages/PharmacyVerification'
import PatientDashboard from './pages/PatientDashboard'
import DoctorManagement from './pages/DoctorManagement'
import PrescriptionBuilder from './pages/PrescriptionBuilder'
import MedicineManagement from './pages/MedicineManagement'

function App() {
  const [account, setAccount] = useState(null)

  return (
    <Router>
      <div className="App">
        {!account ? (
          <div className="container" style={{ paddingTop: '100px' }}>
            <div className="card text-center">
              <h1>🏥 BlockMed Dashboard</h1>
              <p style={{ color: '#6b7280', marginBottom: '30px' }}>
                Blockchain-based Prescription Management System
              </p>
              <MetaMaskConnect account={account} setAccount={setAccount} />
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard account={account} setAccount={setAccount} />} />
            <Route path="/add-prescription" element={<AddPrescription account={account} />} />
            <Route path="/prescription-builder" element={<PrescriptionBuilder account={account} />} />
            <Route path="/medicines" element={<MedicineManagement />} />
            <Route path="/pharmacy" element={<PharmacyVerification account={account} />} />
            <Route path="/patient" element={<PatientDashboard />} />
            <Route path="/doctor" element={<DoctorManagement account={account} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </div>
    </Router>
  )
}

export default App
