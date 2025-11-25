import React, { useEffect, useState } from 'react'
import MedicineForm from '../components/MedicineForm'
import medicinesData from '../data/medicines.json'

export default function MedicineManagement(){
  const [list, setList] = useState([])
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)

  useEffect(()=>{
    // load initial data from local JSON (could be replaced with API)
    setList(medicinesData)
  }, [])

  const filtered = list.filter(m => (m.name+' '+(m.generic||'')+' '+(m.brand||'')).toLowerCase().includes(query.toLowerCase()))

  const handleAdd = (med) => {
    setList(prev => [med, ...prev])
  }

  const handleUpdate = (idx, med) => {
    setList(prev => prev.map((p,i) => i===idx ? med : p))
    setEditing(null)
  }

  const handleDelete = (idx) => {
    if(!confirm('Delete this medicine?')) return
    setList(prev => prev.filter((_,i)=>i!==idx))
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'medicines-export.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result)
        if(Array.isArray(data)){
          setList(data)
        } else alert('Invalid JSON format - expected an array')
      }catch(err){
        alert('Failed to parse JSON')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="container" style={{ paddingTop: 30 }}>
      <div className="card">
        <h1>Medicine Management</h1>
        <p style={{ color: '#6b7280' }}>Add, edit, delete, search and import/export medicines.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input placeholder="Search medicines" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <button className="btn-primary" onClick={handleExport}>Export JSON</button>
          <label className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Import JSON
            <input type="file" accept="application/json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <h3>Add new medicine</h3>
          <MedicineForm onSubmit={(med)=>handleAdd(med)} />
        </div>

        <div style={{ marginTop: 18 }}>
          <h3>Medicine list ({filtered.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th>Name</th><th>Generic</th><th>Brand</th><th>Form</th><th>Strength</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m,i)=> (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 4px' }}>{m.name}</td>
                  <td style={{ padding: '8px 4px' }}>{m.generic}</td>
                  <td style={{ padding: '8px 4px' }}>{m.brand}</td>
                  <td style={{ padding: '8px 4px' }}>{m.form}</td>
                  <td style={{ padding: '8px 4px' }}>{m.strength}</td>
                  <td style={{ padding: '8px 4px' }}>
                    <button className="btn-secondary" onClick={()=>setEditing({ index: i, data: m })}>Edit</button>
                    <button className="btn-danger" onClick={()=>handleDelete(i)} style={{ marginLeft: 8 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editing && (
          <div style={{ marginTop: 16 }}>
            <h4>Editing: {editing.data.name}</h4>
            <MedicineForm initial={editing.data} onSubmit={(med) => handleUpdate(editing.index, med)} onCancel={()=>setEditing(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
