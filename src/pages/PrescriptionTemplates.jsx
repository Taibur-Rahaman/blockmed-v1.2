import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  FiFileText, FiPlus, FiEdit2, FiTrash2, FiCopy, FiSave,
  FiX, FiPackage, FiHeart, FiClipboard, FiCheck, FiSearch,
  FiTag, FiClock, FiUser
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useStore } from '../store/useStore'
import { usePrescriptionStore } from '../store/useStore'

const PrescriptionTemplates = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { role } = useStore()
  const prescriptionStore = usePrescriptionStore()
  
  const [templates, setTemplates] = useState([])
  const [filteredTemplates, setFilteredTemplates] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'general',
    symptoms: '',
    diagnosis: '',
    medicines: [],
    tests: '',
    advice: '',
    followUp: '',
    validityDays: 30
  })

  // Load templates from localStorage
  useEffect(() => {
    loadTemplates()
  }, [])

  // Filter templates based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredTemplates(templates.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.diagnosis?.toLowerCase().includes(query)
      ))
    }
  }, [searchQuery, templates])

  const loadTemplates = () => {
    try {
      const stored = localStorage.getItem('blockmed-prescription-templates')
      if (stored) {
        const parsed = JSON.parse(stored)
        setTemplates(Array.isArray(parsed) ? parsed : [])
      } else {
        setTemplates([])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setTemplates([])
    }
  }

  const saveTemplates = (newTemplates) => {
    try {
      localStorage.setItem('blockmed-prescription-templates', JSON.stringify(newTemplates))
      setTemplates(newTemplates)
      toast.success('Templates saved successfully')
    } catch (error) {
      console.error('Error saving templates:', error)
      toast.error('Failed to save templates')
    }
  }

  const handleCreateTemplate = () => {
    // Get current prescription data
    const currentData = {
      symptoms: prescriptionStore.symptoms,
      diagnosis: prescriptionStore.diagnosis,
      medicines: prescriptionStore.medicines,
      tests: prescriptionStore.tests,
      advice: prescriptionStore.advice,
      followUp: prescriptionStore.followUp,
      validityDays: prescriptionStore.validityDays
    }

    setTemplateForm({
      name: '',
      description: '',
      category: 'general',
      ...currentData
    })
    setEditingTemplate(null)
    setShowTemplateModal(true)
  }

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim()) {
      toast.error('Template name is required')
      return
    }

    if (templateForm.medicines.length === 0) {
      toast.error('At least one medicine is required')
      return
    }

    const newTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: templateForm.name.trim(),
      description: templateForm.description.trim(),
      category: templateForm.category,
      symptoms: templateForm.symptoms,
      diagnosis: templateForm.diagnosis,
      medicines: templateForm.medicines,
      tests: templateForm.tests,
      advice: templateForm.advice,
      followUp: templateForm.followUp,
      validityDays: templateForm.validityDays,
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user' // Could be account address
    }

    let updatedTemplates
    if (editingTemplate) {
      updatedTemplates = templates.map(t => 
        t.id === editingTemplate.id ? newTemplate : t
      )
      toast.success('Template updated successfully')
    } else {
      updatedTemplates = [...templates, newTemplate]
      toast.success('Template created successfully')
    }

    saveTemplates(updatedTemplates)
    setShowTemplateModal(false)
    resetTemplateForm()
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      category: template.category || 'general',
      symptoms: template.symptoms || '',
      diagnosis: template.diagnosis || '',
      medicines: template.medicines || [],
      tests: template.tests || '',
      advice: template.advice || '',
      followUp: template.followUp || '',
      validityDays: template.validityDays || 30
    })
    setShowTemplateModal(true)
  }

  const handleDeleteTemplate = (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t.id !== id)
      saveTemplates(updatedTemplates)
      toast.success('Template deleted successfully')
    }
  }

  const handleApplyTemplate = (template) => {
    // Apply template to current prescription form
    prescriptionStore.setSymptoms(template.symptoms || '')
    prescriptionStore.setDiagnosis(template.diagnosis || '')
    prescriptionStore.setTests(template.tests || '')
    prescriptionStore.setAdvice(template.advice || '')
    prescriptionStore.setFollowUp(template.followUp || '')
    prescriptionStore.setValidityDays(template.validityDays || 30)
    
    // Clear existing medicines and add template medicines
    prescriptionStore.medicines.forEach(med => {
      prescriptionStore.removeMedicine(med.id)
    })
    template.medicines.forEach(med => {
      prescriptionStore.addMedicine({
        ...med,
        id: Date.now() + Math.random() // New ID for each medicine
      })
    })

    toast.success(`Template "${template.name}" applied successfully!`)
    
    // Navigate to prescription creation page
    navigate('/prescription/create')
  }

  const handleDuplicateTemplate = (template) => {
    const duplicated = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    saveTemplates([...templates, duplicated])
    toast.success('Template duplicated successfully')
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category: 'general',
      symptoms: '',
      diagnosis: '',
      medicines: [],
      tests: '',
      advice: '',
      followUp: '',
      validityDays: 30
    })
    setEditingTemplate(null)
  }

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'fever', label: 'Fever & Cold' },
    { value: 'pain', label: 'Pain Management' },
    { value: 'infection', label: 'Infection' },
    { value: 'chronic', label: 'Chronic Disease' },
    { value: 'pediatric', label: 'Pediatric' },
    { value: 'other', label: 'Other' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FiFileText className="text-primary-400" />
              Prescription Templates
            </h1>
            <p className="text-gray-400 mt-1">
              Save and reuse common prescription patterns to speed up prescription creation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateTemplate}
              className="btn-primary"
            >
              <FiPlus size={18} />
              Create Template
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="form-input pl-10"
            placeholder="Search templates by name, category, or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="card p-12 text-center">
          <FiFileText size={64} className="mx-auto mb-4 text-gray-500" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'No templates found' : 'No templates yet'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchQuery 
              ? 'Try adjusting your search query'
              : 'Create your first template to save time when writing prescriptions'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreateTemplate}
              className="btn-primary"
            >
              <FiPlus size={18} />
              Create Your First Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FiTag className="text-primary-400" size={16} />
                    <span className="text-xs px-2 py-1 rounded-full bg-primary-500/20 text-primary-400">
                      {categories.find(c => c.value === template.category)?.label || 'General'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Template Info */}
              <div className="space-y-2 mb-4">
                {template.diagnosis && (
                  <div className="flex items-center gap-2 text-sm">
                    <FiHeart size={14} className="text-gray-400" />
                    <span className="text-gray-300 truncate">{template.diagnosis}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <FiPackage size={14} className="text-gray-400" />
                  <span className="text-gray-300">
                    {template.medicines?.length || 0} {template.medicines?.length === 1 ? 'medicine' : 'medicines'}
                  </span>
                </div>
                {template.updatedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <FiClock size={12} />
                    <span className="text-xs">
                      Updated {new Date(template.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleApplyTemplate(template)}
                  className="btn-primary flex-1 text-sm"
                >
                  <FiCopy size={14} />
                  Apply
                </button>
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="btn-secondary p-2"
                  title="Edit template"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={() => handleDuplicateTemplate(template)}
                  className="btn-secondary p-2"
                  title="Duplicate template"
                >
                  <FiCopy size={16} />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="btn-danger p-2"
                  title="Delete template"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowTemplateModal(false)
              resetTemplateForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
                </h2>
                <button
                  onClick={() => {
                    setShowTemplateModal(false)
                    resetTemplateForm()
                  }}
                  className="btn-icon"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Template Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Common Cold Treatment"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Brief description of when to use this template..."
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    className="form-select"
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Symptoms */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FiHeart className="inline mr-2" />
                    Symptoms
                  </label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Common symptoms for this template..."
                    value={templateForm.symptoms}
                    onChange={(e) => setTemplateForm({ ...templateForm, symptoms: e.target.value })}
                  />
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FiHeart className="inline mr-2" />
                    Diagnosis
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Common diagnosis..."
                    value={templateForm.diagnosis}
                    onChange={(e) => setTemplateForm({ ...templateForm, diagnosis: e.target.value })}
                  />
                </div>

                {/* Medicines */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FiPackage className="inline mr-2" />
                    Medicines ({templateForm.medicines.length})
                  </label>
                  {templateForm.medicines.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-gray-400">
                      <p className="text-sm">No medicines in template</p>
                      <p className="text-xs mt-1">Add medicines from the prescription form first</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templateForm.medicines.map((med, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-white/5 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-white font-medium">{med.name || med.medicineName}</p>
                            {med.dose && (
                              <p className="text-sm text-gray-400">Dose: {med.dose}</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const updated = templateForm.medicines.filter((_, i) => i !== index)
                              setTemplateForm({ ...templateForm, medicines: updated })
                            }}
                            className="btn-danger p-1"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tests */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FiClipboard className="inline mr-2" />
                    Laboratory Tests
                  </label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Common lab tests..."
                    value={templateForm.tests}
                    onChange={(e) => setTemplateForm({ ...templateForm, tests: e.target.value })}
                  />
                </div>

                {/* Advice */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Doctor's Advice
                  </label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Common advice..."
                    value={templateForm.advice}
                    onChange={(e) => setTemplateForm({ ...templateForm, advice: e.target.value })}
                  />
                </div>

                {/* Follow-up */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Follow-up
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., After 7 days"
                    value={templateForm.followUp}
                    onChange={(e) => setTemplateForm({ ...templateForm, followUp: e.target.value })}
                  />
                </div>

                {/* Validity Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prescription Validity (Days)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="365"
                    value={templateForm.validityDays}
                    onChange={(e) => setTemplateForm({ ...templateForm, validityDays: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowTemplateModal(false)
                    resetTemplateForm()
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="btn-primary flex-1"
                >
                  <FiSave size={18} />
                  {editingTemplate ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PrescriptionTemplates
