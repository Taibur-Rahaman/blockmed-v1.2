import React, { useState, useEffect } from 'react'
import staticMedicines from '../data/medicines.json'

export default function MedicineSearch({ onAdd }){
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [dose, setDose] = useState('')
  const [duration, setDuration] = useState('')

  useEffect(()=>{
    // filter the in-memory medicines list for the query
    if(!query) {
      setResults([])
      return
    }
    const q = query.toLowerCase()
    const fetchFromAPI = async () => {
      // Try openFDA drug label search as an example public API
      // We use a small timeout and fallback to local list on failure
      try{
        const controller = new AbortController()
        const timeout = setTimeout(()=>controller.abort(), 2500)
        const url = `https://api.fda.gov/drug/label.json?search=generic_name:"${encodeURIComponent(q)}"&limit=10`
        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timeout)
        if(!res.ok) throw new Error('API error')
        const data = await res.json()
        if(data.results && Array.isArray(data.results)){
          const mapped = data.results.map(r => ({
            name: (r.openfda && r.openfda.brand_name && r.openfda.brand_name[0]) || (r.openfda && r.openfda.generic_name && r.openfda.generic_name[0]) || r.brand_name || 'Unknown',
            generic: (r.openfda && r.openfda.generic_name && r.openfda.generic_name[0]) || '',
            brand: (r.openfda && r.openfda.brand_name && r.openfda.brand_name[0]) || '',
            form: (r.openfda && r.openfda.dosage_form && r.openfda.dosage_form[0]) || '',
            strength: (r.openfda && r.openfda.dosage_strength && r.openfda.dosage_strength[0]) || ''
          }))
          setResults(mapped)
          return
        }
      }catch(err){
        // ignore and fallback
      }

      // fallback to local list
      let medicinesList = staticMedicines
      try{
        const raw = localStorage.getItem('medicines')
        if(raw) {
          const parsed = JSON.parse(raw)
          if(Array.isArray(parsed)) medicinesList = parsed
        }
      }catch(e){ /* ignore and use static list */ }

      const filtered = medicinesList.filter(m => (m.name + ' ' + (m.generic||'') + ' ' + (m.brand||'')).toLowerCase().includes(q)).slice(0,10)
      setResults(filtered)
    }

    // Only try API for longer queries to avoid quota/noise
    if(query.length >= 3){
      fetchFromAPI()
    } else {
      // quick local match
      let medicinesList = staticMedicines
      try{
        const raw = localStorage.getItem('medicines')
        if(raw) {
          const parsed = JSON.parse(raw)
          if(Array.isArray(parsed)) medicinesList = parsed
        }
      }catch(e){ }
      const filtered = medicinesList.filter(m => (m.name + ' ' + (m.generic||'') + ' ' + (m.brand||'')).toLowerCase().includes(q)).slice(0,10)
      setResults(filtered)
    }
  }, [query])

  const handleSelect = (m)=>{
    setSelected(m)
    setQuery(m.name)
    setResults([])
  }

  const handleAdd = ()=>{
    if(!selected) return alert('Select a medicine')
    const payload = {
      name: selected.name,
      generic: selected.generic || '',
      brand: selected.brand || '',
      manufacturer: selected.manufacturer || '',
      form: selected.form || '',
      strength: selected.strength || '',
      dose: dose || '1 tab',
      duration: duration || '5 days'
    }
    onAdd(payload)
    setSelected(null)
    setQuery('')
    setDose('')
    setDuration('')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input placeholder="Search medicine by name or generic" value={query} onChange={(e)=>setQuery(e.target.value)} />
        <input placeholder="Dose (e.g. 1-0-1)" value={dose} onChange={(e)=>setDose(e.target.value)} style={{ width: 160 }} />
        <input placeholder="Duration (e.g. 5 days)" value={duration} onChange={(e)=>setDuration(e.target.value)} style={{ width: 160 }} />
        <button className="btn-primary" onClick={handleAdd}>Add</button>
      </div>

      {results.length > 0 && (
        <div style={{ border: '1px solid #e5e7eb', marginTop: 8, borderRadius: 6, maxHeight: 220, overflow: 'auto' }}>
          {results.map((m,i)=> (
            <div key={i} style={{ padding: 8, cursor: 'pointer' }} onClick={()=>handleSelect(m)}>
              <div style={{ fontWeight: 600 }}>{m.name} {m.brand ? `(${m.brand})` : ''}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{m.generic} • {m.form} • {m.strength}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
