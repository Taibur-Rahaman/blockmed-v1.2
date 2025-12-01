import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiDownload, FiUpload,
  FiPackage, FiX, FiCheck
} from 'react-icons/fi'

import { useMedicineStore } from '../store/useStore'
import { DOSAGE_FORMS } from '../utils/config'
import { downloadJSON, readJSONFile } from '../utils/helpers'
import staticMedicines from '../data/medicines.json'

const MedicineManagement = () => {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  
  const { 
    medicines, setMedicines, addMedicine, updateMedicine, deleteMedicine, importMedicines 
  } = useMedicineStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    generic: '',
    brand: '',
    form: '',
    strength: '',
    category: '',
    manufacturer: '',
  })

  // Load medicines on mount - always use static medicines as base
  useEffect(() => {
    // Clear old localStorage and use the updated medicines.json
    const storedVersion = localStorage.getItem('blockmed-medicines-version')
    if (storedVersion !== '2.0' || medicines.length < 50) {
      // Load fresh medicines from JSON
      setMedicines(staticMedicines.map((m, i) => ({ ...m, id: Date.now() + i })))
      localStorage.setItem('blockmed-medicines-version', '2.0')
    } else if (medicines.length === 0) {
      setMedicines(staticMedicines.map((m, i) => ({ ...m, id: Date.now() + i })))
    }
  }, [])

  // Filter medicines
  const filteredMedicines = medicines.filter(m => 
    (m.name + ' ' + (m.generic || '') + ' ' + (m.brand || ''))
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  )

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Medicine name is required')
      return
    }

    if (editingId) {
      updateMedicine(editingId, formData)
      toast.success('Medicine updated successfully')
    } else {
      addMedicine(formData)
      toast.success('Medicine added successfully')
    }

    resetForm()
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      generic: '',
      brand: '',
      form: '',
      strength: '',
      category: '',
      manufacturer: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  // Edit medicine
  const handleEdit = (medicine) => {
    setFormData({
      name: medicine.name || '',
      generic: medicine.generic || '',
      brand: medicine.brand || '',
      form: medicine.form || '',
      strength: medicine.strength || '',
      category: medicine.category || '',
      manufacturer: medicine.manufacturer || '',
    })
    setEditingId(medicine.id)
    setShowForm(true)
  }

  // Delete medicine
  const handleDelete = (id) => {
    if (confirm(t('medicine.confirmDelete'))) {
      deleteMedicine(id)
      toast.success('Medicine deleted')
    }
  }

  // Export medicines
  const handleExport = () => {
    downloadJSON(medicines, 'blockmed-medicines.json')
    toast.success('Medicines exported successfully')
  }

  // Import medicines
  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const data = await readJSONFile(file)
      if (Array.isArray(data)) {
        importMedicines(data.map((m, i) => ({ ...m, id: Date.now() + i })))
        toast.success(`Imported ${data.length} medicines`)
      } else {
        toast.error('Invalid file format')
      }
    } catch (error) {
      toast.error('Failed to import file')
    }

    e.target.value = ''
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FiPackage className="text-primary-400" />
              {t('medicine.title')}
            </h1>
            <p className="text-gray-400 mt-1">{t('medicine.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExport} className="btn-secondary">
              <FiDownload size={18} />
              {t('medicine.exportJSON')}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary"
            >
              <FiUpload size={18} />
              {t('medicine.importJSON')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <FiPlus size={18} />
              {t('medicine.addNew')}
            </button>
          </div>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:max-w-md relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="form-input pl-10 w-full"
              placeholder={t('medicine.searchMedicines')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              {t('medicine.totalMedicines')}: 
              <span className="text-white font-semibold ml-2">{medicines.length}</span>
            </span>
            {searchQuery && (
              <span className="text-gray-400">
                Found: <span className="text-primary-400 font-semibold">{filteredMedicines.length}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Medicine Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={resetForm}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? 'Edit Medicine' : t('medicine.addNew')}
                </h2>
                <button onClick={resetForm} className="btn-icon">
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="form-group md:col-span-2">
                    <label className="form-label">{t('medicine.name')} *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Paracetamol"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('medicine.generic')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.generic}
                      onChange={(e) => setFormData({ ...formData, generic: e.target.value })}
                      placeholder="e.g., Acetaminophen"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('medicine.brand')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g., Napa"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('medicine.form')}</label>
                    <select
                      className="form-select"
                      value={formData.form}
                      onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                    >
                      <option value="">Select form</option>
                      {DOSAGE_FORMS.map(form => (
                        <option key={form} value={form}>{form}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('medicine.strength')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.strength}
                      onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                      placeholder="e.g., 500mg"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('medicine.category')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Analgesic"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('medicine.manufacturer')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      placeholder="e.g., Beximco Pharma"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="btn-secondary flex-1">
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    <FiCheck size={18} />
                    {editingId ? t('common.save') : t('medicine.addNew')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medicine Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('medicine.name')}</th>
                <th>{t('medicine.generic')}</th>
                <th>{t('medicine.brand')}</th>
                <th>{t('medicine.form')}</th>
                <th>{t('medicine.strength')}</th>
                <th className="text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">
                    <FiPackage size={40} className="mx-auto mb-3 opacity-50" />
                    <p>No medicines found</p>
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((medicine) => (
                  <motion.tr
                    key={medicine.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group"
                  >
                    <td className="font-medium text-white">{medicine.name}</td>
                    <td className="text-gray-400">{medicine.generic || '-'}</td>
                    <td className="text-gray-400">{medicine.brand || '-'}</td>
                    <td>
                      {medicine.form && (
                        <span className="badge bg-white/10 text-white">
                          {medicine.form}
                        </span>
                      )}
                    </td>
                    <td className="text-gray-400">{medicine.strength || '-'}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(medicine)}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(medicine.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default MedicineManagement
