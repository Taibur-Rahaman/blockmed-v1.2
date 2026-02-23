import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================
// Main Application Store
// ============================================
export const useStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // User & Authentication State
      // ============================================
      account: null,
      user: null,
      role: null, // 'admin', 'doctor', 'pharmacist', 'manufacturer', 'patient', 'regulator'
      isConnected: false,
      isVerified: false,
      
      setAccount: (account) => set({ account, isConnected: !!account }),
      setUser: (user) => set({ 
        user, 
        role: user?.role || null,
        isVerified: user?.isVerified || false 
      }),
      logout: () => {
        // Set flag to prevent auto-reconnect
        sessionStorage.setItem('blockmed-logged-out', 'true')
        
        // Reset provider cache
        if (window.__sharedBrowserProvider) {
          delete window.__sharedBrowserProvider
        }
        
        set({ 
          account: null, 
          user: null, 
          role: null, 
          isConnected: false,
          isVerified: false 
        })
      },
      clearLogoutFlag: () => sessionStorage.removeItem('blockmed-logged-out'),
      wasLoggedOut: () => sessionStorage.getItem('blockmed-logged-out') === 'true',

      // ============================================
      // Language State
      // ============================================
      language: 'en', // 'en' or 'bn' (Bangla)
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set((state) => ({ 
        language: state.language === 'en' ? 'bn' : 'en' 
      })),

      // ============================================
      // Theme State
      // ============================================
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),

      // ============================================
      // Network State
      // ============================================
      network: null,
      chainId: null,
      isCorrectNetwork: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      
      setNetwork: (network, chainId) => set({ 
        network, 
        chainId,
        isCorrectNetwork: chainId === '0x7a69' || chainId === '0x13881' || chainId === '0xaa36a7' // Hardhat, Polygon Mumbai, Sepolia
      }),
      setOnlineStatus: (isOnline) => set({ isOnline }),

      // ============================================
      // Notifications State
      // ============================================
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification) => set((state) => ({
        notifications: [
          { 
            id: Date.now(), 
            timestamp: new Date().toISOString(),
            read: false,
            ...notification 
          },
          ...state.notifications
        ].slice(0, 50), // Keep last 50 notifications
        unreadCount: state.unreadCount + 1
      })),
      
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      })),
      
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

      // ============================================
      // Offline Cache State
      // ============================================
      cachedPrescriptions: [],
      cachedBatches: [],
      lastSyncTime: null,
      
      setCachedPrescriptions: (prescriptions) => set({ 
        cachedPrescriptions: prescriptions,
        lastSyncTime: new Date().toISOString()
      }),
      
      setCachedBatches: (batches) => set({ 
        cachedBatches: batches,
        lastSyncTime: new Date().toISOString()
      }),

      // Demo batch stock sync - when Pharmacy confirms purchase (demo), Batch Management re-renders
      demoBatchesVersion: 0,
      incrementDemoBatchesVersion: () => set((state) => ({ demoBatchesVersion: state.demoBatchesVersion + 1 })),

      // Demo prescriptions (stored locally when blockchain unavailable)
      demoPrescriptions: [],
      demoPrescriptionsVersion: 0,
      addDemoPrescription: (prescription) => set((state) => ({
        demoPrescriptions: [prescription, ...state.demoPrescriptions],
        demoPrescriptionsVersion: state.demoPrescriptionsVersion + 1,
      })),
      markDemoPrescriptionDispensed: (prescriptionId, dispensedBy) => set((state) => ({
        demoPrescriptions: state.demoPrescriptions.map((p) =>
          p.id === prescriptionId
            ? { ...p, isDispensed: true, dispensedBy: dispensedBy || '', dispensedAt: Math.floor(Date.now() / 1000) }
            : p
        ),
        demoPrescriptionsVersion: state.demoPrescriptionsVersion + 1,
      })),
      clearDemoPrescriptions: () => set({ demoPrescriptions: [], demoPrescriptionsVersion: 0 }),

      // ============================================
      // UI State
      // ============================================
      sidebarOpen: true,
      modalOpen: null, // 'prescription', 'batch', 'user', etc.
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setModalOpen: (modal) => set({ modalOpen: modal }),
      closeModal: () => set({ modalOpen: null }),

      // ============================================
      // Loading States
      // ============================================
      loading: {
        global: false,
        prescription: false,
        batch: false,
        user: false,
      },
      
      setLoading: (key, value) => set((state) => ({
        loading: { ...state.loading, [key]: value }
      })),
    }),
    {
      name: 'blockmed-storage',
      // Do NOT persist sensitive auth state (account, user, role, isVerified) to localStorage
      // so other users on same device / XSS cannot see wallet or role. See DRAWBACKS_REAL_LIFE_AND_FREE_TOOLS.md
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        cachedPrescriptions: state.cachedPrescriptions,
        cachedBatches: state.cachedBatches,
        lastSyncTime: state.lastSyncTime,
        notifications: state.notifications,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating store:', error)
        }
      },
    }
  )
)

// ============================================
// Prescription Form Store
// ============================================
export const usePrescriptionStore = create((set, get) => ({
  // Patient Info
  patient: {
    name: '',
    nid: '', // National ID Number - unique identifier
    dateOfBirth: null,
    age: '',
    gender: '',
    phone: '',
    address: '',
  },
  
  // Clinical Info
  symptoms: '',
  diagnosis: '',
  
  // Medicines
  medicines: [],
  
  // Tests & Advice
  tests: '',
  advice: '',
  followUp: '',
  
  // Prescription Settings
  validityDays: 30,
  
  // Generated Data
  patientHash: '',
  ipfsHash: '',
  qrData: '',
  prescriptionId: null,
  txHash: '',
  blockNumber: null,
  
  // Actions
  setPatient: (field, value) => set((state) => ({
    patient: { ...state.patient, [field]: value }
  })),
  
  setPatientData: (data) => set({ patient: data }),
  
  setSymptoms: (symptoms) => set({ symptoms }),
  setDiagnosis: (diagnosis) => set({ diagnosis }),
  
  addMedicine: (medicine) => set((state) => ({
    medicines: [...state.medicines, { ...medicine, id: Date.now() }]
  })),
  
  removeMedicine: (id) => set((state) => ({
    medicines: state.medicines.filter(m => m.id !== id)
  })),
  
  updateMedicine: (id, updates) => set((state) => ({
    medicines: state.medicines.map(m => 
      m.id === id ? { ...m, ...updates } : m
    )
  })),
  
  setTests: (tests) => set({ tests }),
  setAdvice: (advice) => set({ advice }),
  setFollowUp: (followUp) => set({ followUp }),
  setValidityDays: (days) => set({ validityDays: days }),
  
  setGeneratedData: (data) => set({
    patientHash: data.patientHash || '',
    ipfsHash: data.ipfsHash || '',
    qrData: data.qrData || '',
    prescriptionId: data.prescriptionId || null,
    txHash: data.txHash || '',
  }),
  
  reset: () => set({
    patient: { name: '', nid: '', dateOfBirth: null, age: '', gender: '', phone: '', address: '' },
    symptoms: '',
    diagnosis: '',
    medicines: [],
    tests: '',
    advice: '',
    followUp: '',
    validityDays: 30,
    patientHash: '',
    ipfsHash: '',
    qrData: '',
    prescriptionId: null,
    txHash: '',
    blockNumber: null,
  }),
}))

// ============================================
// Medicine Management Store
// ============================================
export const useMedicineStore = create(
  persist(
    (set, get) => ({
      medicines: [],
      searchResults: [],
      isSearching: false,
      version: '1.0',
      
      setMedicines: (medicines) => set({ medicines, version: '2.0' }),
      setSearchResults: (results) => set({ searchResults: results }),
      setIsSearching: (searching) => set({ isSearching: searching }),
      
      addMedicine: (medicine) => set((state) => ({
        medicines: [{ ...medicine, id: Date.now() }, ...state.medicines]
      })),
      
      updateMedicine: (id, updates) => set((state) => ({
        medicines: state.medicines.map(m => 
          m.id === id ? { ...m, ...updates } : m
        )
      })),
      
      deleteMedicine: (id) => set((state) => ({
        medicines: state.medicines.filter(m => m.id !== id)
      })),
      
      importMedicines: (medicines) => set({ medicines, version: '2.0' }),
      
      clearSearchResults: () => set({ searchResults: [] }),
      
      resetToDefault: () => set({ medicines: [], version: '1.0' }),
    }),
    {
      name: 'blockmed-medicines',
    }
  )
)

export default useStore

