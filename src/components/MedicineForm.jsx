import React, { useState, useEffect } from 'react'

export default function MedicineForm({ initial = null, onSubmit, onCancel }){
  const [form, setForm] = useState({ name: '', generic: '', brand: '', manufacturer: '', form: '', strength: '' })
  const [error, setError] = useState('')

  useEffect(()=>{
    if(initial) setForm(initial)
  }, [initial])

  const validate = () => {
    if(!form.name.trim()) return 'Name is required'
    if(!form.form.trim()) return 'Form is required (Tablet, Syrup, etc)'
    if(!form.strength.trim()) return 'Strength is required'
    return null
  }

  const submit = (e) => {
    e && e.preventDefault()
    const v = validate()
    if(v){ setError(v); return }
    onSubmit(form)
    setForm({ name: '', generic: '', brand: '', manufacturer: '', form: '', strength: '' })
    setError('')
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      {error && <div className="alert alert-error">{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input placeholder="Name" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
        <input placeholder="Generic name" value={form.generic} onChange={(e)=>setForm({...form, generic: e.target.value})} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input placeholder="Brand" value={form.brand} onChange={(e)=>setForm({...form, brand: e.target.value})} />
        <input placeholder="Manufacturer" value={form.manufacturer} onChange={(e)=>setForm({...form, manufacturer: e.target.value})} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input placeholder="Form (Tablet, Syrup)" value={form.form} onChange={(e)=>setForm({...form, form: e.target.value})} />
        <input placeholder="Strength (e.g. 500mg)" value={form.strength} onChange={(e)=>setForm({...form, strength: e.target.value})} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button className="btn-primary" type="submit">{initial ? 'Save' : 'Add'}</button>
        {initial && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}
