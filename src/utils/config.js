// ============================================
// BlockMed V2 - Configuration
// ============================================

// Contract address - Can be set via environment variable or defaults to local
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'

// Supported Networks
export const NETWORKS = {
  ganache: {
    chainId: '0x539', // 1337 in hex
    chainName: 'Ganache Local',
    rpcUrls: ['http://127.0.0.1:7545'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: null,
  },
  hardhat: {
    chainId: '0x7a69', // 31337 in hex
    chainName: 'Hardhat Local',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: null,
  },
  polygon: {
    chainId: '0x13881', // 80001 in hex (Mumbai Testnet)
    chainName: 'Polygon Mumbai',
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
  },
  sepolia: {
    chainId: '0xaa36a7', // 11155111 in hex
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
}

// Default network
export const DEFAULT_NETWORK = NETWORKS.hardhat

// Role IDs (matching smart contract enum)
export const ROLES = {
  NONE: 0,
  ADMIN: 1,
  DOCTOR: 2,
  PHARMACIST: 3,
  MANUFACTURER: 4,
  PATIENT: 5,
  REGULATOR: 6,
}

export const ROLE_NAMES = {
  0: 'None',
  1: 'Admin',
  2: 'Doctor',
  3: 'Pharmacist',
  4: 'Manufacturer',
  5: 'Patient',
  6: 'Regulator',
}

export const ROLE_COLORS = {
  0: 'gray',
  1: 'red',
  2: 'green',
  3: 'blue',
  4: 'yellow',
  5: 'purple',
  6: 'orange',
}

// Prescription validity options (in days)
export const VALIDITY_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '180 days' },
  { value: 365, label: '1 year' },
]

// Gender options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', labelBn: 'পুরুষ' },
  { value: 'female', label: 'Female', labelBn: 'মহিলা' },
  { value: 'other', label: 'Other', labelBn: 'অন্যান্য' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', labelBn: 'বলতে চাই না' },
]

// Medicine dosage forms
export const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Suspension',
  'Injection',
  'Cream',
  'Ointment',
  'Drops',
  'Inhaler',
  'Patch',
  'Suppository',
  'Gel',
  'Powder',
  'Solution',
  'Spray',
]

// API endpoints
export const API = {
  FDA_DRUG_LABEL: 'https://api.fda.gov/drug/label.json',
  FDA_NDC: 'https://api.fda.gov/drug/ndc.json',
}

// Local storage keys
export const STORAGE_KEYS = {
  MEDICINES: 'blockmed-medicines',
  LANGUAGE: 'blockmed-language',
  THEME: 'blockmed-theme',
  CACHED_PRESCRIPTIONS: 'blockmed-cached-prescriptions',
  CACHED_BATCHES: 'blockmed-cached-batches',
}

// Toast configuration
export const TOAST_CONFIG = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: 'rgba(15, 23, 42, 0.95)',
    color: '#fff',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
  },
}

// QR Code configuration
export const QR_CONFIG = {
  size: 200,
  level: 'H',
  includeMargin: true,
  fgColor: '#000000',
  bgColor: '#ffffff',
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
}

// Date formats
export const DATE_FORMATS = {
  display: 'dd MMM yyyy',
  displayWithTime: 'dd MMM yyyy, HH:mm',
  input: 'yyyy-MM-dd',
  api: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
}

export default {
  CONTRACT_ADDRESS,
  NETWORKS,
  DEFAULT_NETWORK,
  ROLES,
  ROLE_NAMES,
  ROLE_COLORS,
  VALIDITY_OPTIONS,
  GENDER_OPTIONS,
  DOSAGE_FORMS,
  API,
  STORAGE_KEYS,
  TOAST_CONFIG,
  QR_CONFIG,
  PAGINATION,
  DATE_FORMATS,
}
