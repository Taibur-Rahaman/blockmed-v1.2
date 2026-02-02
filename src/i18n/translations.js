// ============================================
// BlockMed V2 - Multi-Language Support
// English (en) & Bangla (bn)
// ============================================

export const translations = {
  en: {
    // ============================================
    // Common
    // ============================================
    common: {
      appName: 'BlockMed',
      tagline: 'Blockchain Healthcare Security',
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      print: 'Print',
      submit: 'Submit',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      yes: 'Yes',
      no: 'No',
      all: 'All',
      none: 'None',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
      required: 'Required',
      optional: 'Optional',
      actions: 'Actions',
      status: 'Status',
      date: 'Date',
      time: 'Time',
      id: 'ID',
    },
    
    // ============================================
    // Authentication & Wallet
    // ============================================
    auth: {
      connectWallet: 'Connect Wallet',
      connecting: 'Connecting...',
      connected: 'Connected',
      disconnect: 'Disconnect',
      walletAddress: 'Wallet Address',
      switchNetwork: 'Switch Network',
      installMetaMask: 'Install MetaMask',
      metamaskRequired: 'MetaMask is required to use this application',
      wrongNetwork: 'Please switch to the correct network',
      connectionFailed: 'Failed to connect wallet',
    },
    
    // ============================================
    // Roles
    // ============================================
    roles: {
      admin: 'Administrator',
      doctor: 'Doctor',
      pharmacist: 'Pharmacist',
      manufacturer: 'Manufacturer',
      patient: 'Patient',
      regulator: 'Regulator (DGDA)',
      unverified: 'Unverified',
      pending: 'Pending Verification',
    },
    
    // ============================================
    // Navigation
    // ============================================
    nav: {
      dashboard: 'Dashboard',
      prescriptions: 'Prescriptions',
      createPrescription: 'Create Prescription',
      verification: 'Verification',
      patients: 'Patients',
      medicines: 'Medicines',
      batches: 'Medicine Batches',
      users: 'User Management',
      analytics: 'Analytics',
      settings: 'Settings',
      notifications: 'Notifications',
      help: 'Help & Support',
    },
    
    // ============================================
    // Dashboard
    // ============================================
    dashboard: {
      welcome: 'Welcome',
      overview: 'Overview',
      quickActions: 'Quick Actions',
      recentActivity: 'Recent Activity',
      statistics: 'Statistics',
      totalPrescriptions: 'Total Prescriptions',
      totalPatients: 'Total Patients',
      todayPrescriptions: "Today's Prescriptions",
      pendingVerification: 'Pending Verification',
      activeAlerts: 'Active Alerts',
      systemHealth: 'System Health',
    },
    
    // ============================================
    // Prescription
    // ============================================
    prescription: {
      title: 'Prescription',
      create: 'Create Prescription',
      edit: 'Edit Prescription',
      view: 'View Prescription',
      history: 'Prescription History',
      
      // Patient Info
      patientInfo: 'Patient Information',
      patientName: 'Patient Name',
      dateOfBirth: 'Date of Birth',
      age: 'Age',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      preferNotToSay: 'Prefer not to say',
      phone: 'Phone Number',
      address: 'Address',
      
      // Clinical
      symptoms: 'Symptoms',
      symptomsPlaceholder: 'Enter patient symptoms...',
      diagnosis: 'Diagnosis',
      diagnosisPlaceholder: 'Enter diagnosis...',
      
      // Medicines
      medicines: 'Medicines',
      searchMedicine: 'Search medicine by name or generic',
      addMedicine: 'Add Medicine',
      medicineName: 'Medicine Name',
      genericName: 'Generic Name',
      brandName: 'Brand Name',
      dosageForm: 'Dosage Form',
      strength: 'Strength',
      dose: 'Dose',
      dosePlaceholder: 'e.g., 1-0-1',
      duration: 'Duration',
      durationPlaceholder: 'e.g., 7 days',
      instructions: 'Special Instructions',
      noMedicines: 'No medicines added yet',
      
      // Tests & Advice
      tests: 'Laboratory Tests',
      testsPlaceholder: 'Enter recommended lab tests...',
      advice: 'Doctor\'s Advice',
      advicePlaceholder: 'Enter advice and precautions...',
      followUp: 'Follow-up',
      followUpPlaceholder: 'e.g., After 7 days',
      
      // Validity
      validity: 'Prescription Validity',
      validityDays: 'Valid for (days)',
      expiresOn: 'Expires On',
      expired: 'Expired',
      valid: 'Valid',
      
      // Actions
      generate: 'Generate Prescription',
      generateQR: 'Generate QR Code',
      submitToBlockchain: 'Submit to Blockchain',
      submitting: 'Submitting...',
      printPrescription: 'Print Prescription',
      downloadPDF: 'Download PDF',
      copyQRData: 'Copy QR Data',
      createAnother: 'Create Another',
      
      // Status
      dispensed: 'Dispensed',
      notDispensed: 'Not Dispensed',
      verified: 'Verified',
      notVerified: 'Not Verified',
      version: 'Version',
      
      // Messages
      createdSuccess: 'Prescription created successfully!',
      updatedSuccess: 'Prescription updated successfully!',
      dispensedSuccess: 'Prescription dispensed successfully!',
      transactionHash: 'Transaction Hash',
      prescriptionId: 'Prescription ID',
    },
    
    // ============================================
    // Pharmacy Verification
    // ============================================
    pharmacy: {
      title: 'Pharmacy Verification Portal',
      subtitle: 'Verify prescriptions and medicine authenticity',
      enterPrescriptionId: 'Enter Prescription ID',
      scanQR: 'Scan QR Code',
      loadPrescription: 'Load Prescription',
      verifyAndDispense: 'Verify & Dispense',
      verifying: 'Verifying...',
      prescriptionDetails: 'Prescription Details',
      patientHash: 'Patient Hash',
      doctorAddress: 'Doctor Address',
      timestamp: 'Created At',
      alreadyDispensed: 'This prescription has already been dispensed',
      prescriptionExpired: 'This prescription has expired',
      
      // Medicine Verification
      verifyMedicine: 'Verify Medicine',
      enterBatchNumber: 'Enter Batch Number',
      batchDetails: 'Batch Details',
      manufacturerAddress: 'Manufacturer',
      manufacturedOn: 'Manufactured On',
      expiresOn: 'Expires On',
      origin: 'Origin',
      authentic: 'Authentic Medicine',
      suspicious: 'Suspicious - Verify with Authority',
      recalled: 'RECALLED - Do Not Dispense',
      expired: 'EXPIRED - Do Not Dispense',
      unknown: 'Unknown Batch - Not in System',
    },
    
    // ============================================
    // Patient Portal
    // ============================================
    patient: {
      title: 'Patient Portal',
      subtitle: 'View your prescriptions and medical history',
      enterPatientHash: 'Enter your Patient ID',
      myPrescriptions: 'My Prescriptions',
      noPrescriptions: 'No prescriptions found',
      viewDetails: 'View Details',
      downloadPrescription: 'Download',
      verifyMedicine: 'Verify Medicine',
    },
    
    // ============================================
    // Medicine Management
    // ============================================
    medicine: {
      title: 'Medicine Management',
      subtitle: 'Manage your medicine database',
      addNew: 'Add New Medicine',
      searchMedicines: 'Search medicines...',
      importJSON: 'Import JSON',
      exportJSON: 'Export JSON',
      name: 'Name',
      generic: 'Generic',
      brand: 'Brand',
      form: 'Form',
      strength: 'Strength',
      category: 'Category',
      manufacturer: 'Manufacturer',
      totalMedicines: 'Total Medicines',
      confirmDelete: 'Are you sure you want to delete this medicine?',
    },
    
    // ============================================
    // Batch Management
    // ============================================
    batch: {
      title: 'Medicine Batch Management',
      subtitle: 'Track and manage medicine batches',
      createBatch: 'Create New Batch',
      batchNumber: 'Batch Number',
      medicineName: 'Medicine Name',
      genericName: 'Generic Name',
      manufacturedAt: 'Manufactured Date',
      expiresAt: 'Expiry Date',
      origin: 'Origin/Factory',
      totalUnits: 'Total Units (boxes/packs)',
      recallBatch: 'Recall Batch',
      flagBatch: 'Flag as Suspicious',
      recallReason: 'Recall Reason',
      flagReason: 'Flag Reason',
      recalledBatches: 'Recalled Batches',
      flaggedBatches: 'Flagged Batches',
      batchCreated: 'Batch created successfully!',
      batchRecalled: 'Batch recalled successfully!',
      batchFlagged: 'Batch flagged successfully!',
    },
    
    // ============================================
    // User Management
    // ============================================
    user: {
      title: 'User Management',
      subtitle: 'Manage system users and permissions',
      register: 'Register',
      registerUser: 'Register New User',
      verifyUser: 'Verify User',
      deactivateUser: 'Deactivate User',
      name: 'Name',
      licenseNumber: 'License/Registration Number',
      role: 'Role',
      status: 'Status',
      verified: 'Verified',
      unverified: 'Unverified',
      active: 'Active',
      inactive: 'Inactive',
      registeredAt: 'Registered At',
      pendingUsers: 'Pending Verification',
      allUsers: 'All Users',
    },
    
    // ============================================
    // Analytics
    // ============================================
    analytics: {
      title: 'Analytics Dashboard',
      subtitle: 'System statistics and insights',
      overview: 'Overview',
      prescriptionStats: 'Prescription Statistics',
      batchStats: 'Batch Statistics',
      userStats: 'User Statistics',
      alerts: 'Alerts & Warnings',
      trends: 'Trends',
      byDay: 'By Day',
      byWeek: 'By Week',
      byMonth: 'By Month',
    },
    
    // ============================================
    // Alerts
    // ============================================
    alerts: {
      fakeMedicine: 'Fake Medicine Alert',
      batchRecalled: 'Batch Recalled',
      batchFlagged: 'Suspicious Batch Flagged',
      prescriptionExpired: 'Prescription Expired',
      lowStock: 'Low Stock Warning',
      expiryWarning: 'Expiry Warning',
    },
    
    // ============================================
    // Settings
    // ============================================
    settings: {
      title: 'Settings',
      language: 'Language',
      theme: 'Theme',
      dark: 'Dark',
      light: 'Light',
      notifications: 'Notifications',
      enableNotifications: 'Enable Notifications',
      emailNotifications: 'Email Notifications',
      smsNotifications: 'SMS Notifications',
      profile: 'Profile Settings',
      security: 'Security',
      network: 'Blockchain Network',
    },
    
    // ============================================
    // Errors
    // ============================================
    errors: {
      required: 'This field is required',
      invalidEmail: 'Invalid email address',
      invalidPhone: 'Invalid phone number',
      networkError: 'Network error. Please try again.',
      transactionFailed: 'Transaction failed',
      unauthorized: 'You are not authorized to perform this action',
      notFound: 'Not found',
      serverError: 'Server error. Please try again later.',
      offlineMode: 'You are currently offline. Some features may be limited.',
    },
  },
  
  // ============================================
  // BANGLA TRANSLATIONS
  // ============================================
  bn: {
    common: {
      appName: 'ব্লকমেড',
      tagline: 'ব্লকচেইন স্বাস্থ্য নিরাপত্তা',
      loading: 'লোড হচ্ছে...',
      save: 'সংরক্ষণ',
      cancel: 'বাতিল',
      delete: 'মুছুন',
      edit: 'সম্পাদনা',
      view: 'দেখুন',
      search: 'খুঁজুন',
      filter: 'ফিল্টার',
      export: 'এক্সপোর্ট',
      import: 'ইমপোর্ট',
      print: 'প্রিন্ট',
      submit: 'জমা দিন',
      confirm: 'নিশ্চিত',
      back: 'পেছনে',
      next: 'পরবর্তী',
      yes: 'হ্যাঁ',
      no: 'না',
      all: 'সব',
      none: 'কিছুই না',
      success: 'সফল',
      error: 'ত্রুটি',
      warning: 'সতর্কতা',
      info: 'তথ্য',
      required: 'আবশ্যক',
      optional: 'ঐচ্ছিক',
      actions: 'কার্যক্রম',
      status: 'অবস্থা',
      date: 'তারিখ',
      time: 'সময়',
      id: 'আইডি',
    },
    
    auth: {
      connectWallet: 'ওয়ালেট সংযুক্ত করুন',
      connecting: 'সংযুক্ত হচ্ছে...',
      connected: 'সংযুক্ত',
      disconnect: 'সংযোগ বিচ্ছিন্ন',
      walletAddress: 'ওয়ালেট ঠিকানা',
      switchNetwork: 'নেটওয়ার্ক পরিবর্তন করুন',
      installMetaMask: 'MetaMask ইনস্টল করুন',
      metamaskRequired: 'এই অ্যাপ্লিকেশন ব্যবহার করতে MetaMask প্রয়োজন',
      wrongNetwork: 'অনুগ্রহ করে সঠিক নেটওয়ার্কে পরিবর্তন করুন',
      connectionFailed: 'ওয়ালেট সংযোগ ব্যর্থ',
    },
    
    roles: {
      admin: 'প্রশাসক',
      doctor: 'ডাক্তার',
      pharmacist: 'ফার্মাসিস্ট',
      manufacturer: 'প্রস্তুতকারক',
      patient: 'রোগী',
      regulator: 'নিয়ন্ত্রক (ডিজিডিএ)',
      unverified: 'যাচাই করা হয়নি',
      pending: 'যাচাই অপেক্ষমান',
    },
    
    nav: {
      dashboard: 'ড্যাশবোর্ড',
      prescriptions: 'প্রেসক্রিপশন',
      createPrescription: 'প্রেসক্রিপশন তৈরি',
      verification: 'যাচাইকরণ',
      patients: 'রোগী',
      medicines: 'ওষুধ',
      batches: 'ওষুধের ব্যাচ',
      users: 'ব্যবহারকারী পরিচালনা',
      analytics: 'বিশ্লেষণ',
      settings: 'সেটিংস',
      notifications: 'বিজ্ঞপ্তি',
      help: 'সাহায্য ও সহায়তা',
    },
    
    dashboard: {
      welcome: 'স্বাগতম',
      overview: 'সংক্ষিপ্ত বিবরণ',
      quickActions: 'দ্রুত কার্যক্রম',
      recentActivity: 'সাম্প্রতিক কার্যকলাপ',
      statistics: 'পরিসংখ্যান',
      totalPrescriptions: 'মোট প্রেসক্রিপশন',
      totalPatients: 'মোট রোগী',
      todayPrescriptions: 'আজকের প্রেসক্রিপশন',
      pendingVerification: 'যাচাই অপেক্ষমান',
      activeAlerts: 'সক্রিয় সতর্কতা',
      systemHealth: 'সিস্টেম স্থিতি',
    },
    
    prescription: {
      title: 'প্রেসক্রিপশন',
      create: 'প্রেসক্রিপশন তৈরি করুন',
      edit: 'প্রেসক্রিপশন সম্পাদনা',
      view: 'প্রেসক্রিপশন দেখুন',
      history: 'প্রেসক্রিপশন ইতিহাস',
      
      patientInfo: 'রোগীর তথ্য',
      patientName: 'রোগীর নাম',
      dateOfBirth: 'জন্ম তারিখ',
      age: 'বয়স',
      gender: 'লিঙ্গ',
      male: 'পুরুষ',
      female: 'মহিলা',
      other: 'অন্যান্য',
      preferNotToSay: 'বলতে চাই না',
      phone: 'ফোন নম্বর',
      address: 'ঠিকানা',
      
      symptoms: 'লক্ষণ',
      symptomsPlaceholder: 'রোগীর লক্ষণ লিখুন...',
      diagnosis: 'রোগ নির্ণয়',
      diagnosisPlaceholder: 'রোগ নির্ণয় লিখুন...',
      
      medicines: 'ওষুধ',
      searchMedicine: 'ওষুধের নাম বা জেনেরিক নামে খুঁজুন',
      addMedicine: 'ওষুধ যোগ করুন',
      medicineName: 'ওষুধের নাম',
      genericName: 'জেনেরিক নাম',
      brandName: 'ব্র্যান্ড নাম',
      dosageForm: 'ডোজ ফর্ম',
      strength: 'শক্তি',
      dose: 'ডোজ',
      dosePlaceholder: 'যেমন, ১-০-১',
      duration: 'সময়কাল',
      durationPlaceholder: 'যেমন, ৭ দিন',
      instructions: 'বিশেষ নির্দেশনা',
      noMedicines: 'এখনো কোনো ওষুধ যোগ করা হয়নি',
      
      tests: 'ল্যাবরেটরি পরীক্ষা',
      testsPlaceholder: 'প্রস্তাবিত পরীক্ষা লিখুন...',
      advice: 'ডাক্তারের পরামর্শ',
      advicePlaceholder: 'পরামর্শ ও সতর্কতা লিখুন...',
      followUp: 'ফলো-আপ',
      followUpPlaceholder: 'যেমন, ৭ দিন পরে',
      
      validity: 'প্রেসক্রিপশন বৈধতা',
      validityDays: 'বৈধতা (দিন)',
      expiresOn: 'মেয়াদ শেষ',
      expired: 'মেয়াদ শেষ',
      valid: 'বৈধ',
      
      generate: 'প্রেসক্রিপশন তৈরি করুন',
      generateQR: 'QR কোড তৈরি করুন',
      submitToBlockchain: 'ব্লকচেইনে জমা দিন',
      submitting: 'জমা হচ্ছে...',
      printPrescription: 'প্রেসক্রিপশন প্রিন্ট',
      downloadPDF: 'PDF ডাউনলোড',
      copyQRData: 'QR ডেটা কপি',
      createAnother: 'আরেকটি তৈরি করুন',
      
      dispensed: 'প্রদান করা হয়েছে',
      notDispensed: 'প্রদান করা হয়নি',
      verified: 'যাচাই করা হয়েছে',
      notVerified: 'যাচাই করা হয়নি',
      version: 'সংস্করণ',
      
      createdSuccess: 'প্রেসক্রিপশন সফলভাবে তৈরি হয়েছে!',
      updatedSuccess: 'প্রেসক্রিপশন সফলভাবে আপডেট হয়েছে!',
      dispensedSuccess: 'প্রেসক্রিপশন সফলভাবে প্রদান করা হয়েছে!',
      transactionHash: 'লেনদেন হ্যাশ',
      prescriptionId: 'প্রেসক্রিপশন আইডি',
    },
    
    pharmacy: {
      title: 'ফার্মেসি যাচাইকরণ পোর্টাল',
      subtitle: 'প্রেসক্রিপশন এবং ওষুধের সত্যতা যাচাই করুন',
      enterPrescriptionId: 'প্রেসক্রিপশন আইডি লিখুন',
      scanQR: 'QR কোড স্ক্যান করুন',
      loadPrescription: 'প্রেসক্রিপশন লোড করুন',
      verifyAndDispense: 'যাচাই করুন ও প্রদান করুন',
      verifying: 'যাচাই হচ্ছে...',
      prescriptionDetails: 'প্রেসক্রিপশন বিবরণ',
      patientHash: 'রোগী হ্যাশ',
      doctorAddress: 'ডাক্তারের ঠিকানা',
      timestamp: 'তৈরির সময়',
      alreadyDispensed: 'এই প্রেসক্রিপশন ইতিমধ্যে প্রদান করা হয়েছে',
      prescriptionExpired: 'এই প্রেসক্রিপশনের মেয়াদ শেষ',
      
      verifyMedicine: 'ওষুধ যাচাই',
      enterBatchNumber: 'ব্যাচ নম্বর লিখুন',
      batchDetails: 'ব্যাচ বিবরণ',
      manufacturerAddress: 'প্রস্তুতকারক',
      manufacturedOn: 'উৎপাদন তারিখ',
      expiresOn: 'মেয়াদ শেষ',
      origin: 'উৎস',
      authentic: 'আসল ওষুধ',
      suspicious: 'সন্দেহজনক - কর্তৃপক্ষের সাথে যাচাই করুন',
      recalled: 'প্রত্যাহার করা হয়েছে - প্রদান করবেন না',
      expired: 'মেয়াদ শেষ - প্রদান করবেন না',
      unknown: 'অজানা ব্যাচ - সিস্টেমে নেই',
    },
    
    patient: {
      title: 'রোগী পোর্টাল',
      subtitle: 'আপনার প্রেসক্রিপশন এবং চিকিৎসা ইতিহাস দেখুন',
      enterPatientHash: 'আপনার রোগী আইডি লিখুন',
      myPrescriptions: 'আমার প্রেসক্রিপশন',
      noPrescriptions: 'কোনো প্রেসক্রিপশন পাওয়া যায়নি',
      viewDetails: 'বিস্তারিত দেখুন',
      downloadPrescription: 'ডাউনলোড',
      verifyMedicine: 'ওষুধ যাচাই',
    },
    
    medicine: {
      title: 'ওষুধ পরিচালনা',
      subtitle: 'আপনার ওষুধ ডাটাবেস পরিচালনা করুন',
      addNew: 'নতুন ওষুধ যোগ করুন',
      searchMedicines: 'ওষুধ খুঁজুন...',
      importJSON: 'JSON ইমপোর্ট',
      exportJSON: 'JSON এক্সপোর্ট',
      name: 'নাম',
      generic: 'জেনেরিক',
      brand: 'ব্র্যান্ড',
      form: 'ফর্ম',
      strength: 'শক্তি',
      category: 'ক্যাটাগরি',
      manufacturer: 'প্রস্তুতকারক',
      totalMedicines: 'মোট ওষুধ',
      confirmDelete: 'আপনি কি এই ওষুধ মুছে ফেলতে চান?',
    },
    
    batch: {
      title: 'ওষুধ ব্যাচ পরিচালনা',
      subtitle: 'ওষুধ ব্যাচ ট্র্যাক এবং পরিচালনা করুন',
      createBatch: 'নতুন ব্যাচ তৈরি করুন',
      batchNumber: 'ব্যাচ নম্বর',
      medicineName: 'ওষুধের নাম',
      genericName: 'জেনেরিক নাম',
      manufacturedAt: 'উৎপাদন তারিখ',
      expiresAt: 'মেয়াদ শেষ',
      origin: 'উৎস/কারখানা',
      totalUnits: 'মোট ইউনিট (বাক্স/প্যাক)',
      recallBatch: 'ব্যাচ প্রত্যাহার',
      flagBatch: 'সন্দেহজনক হিসেবে চিহ্নিত',
      recallReason: 'প্রত্যাহারের কারণ',
      flagReason: 'চিহ্নিত করার কারণ',
      recalledBatches: 'প্রত্যাহার করা ব্যাচ',
      flaggedBatches: 'চিহ্নিত ব্যাচ',
      batchCreated: 'ব্যাচ সফলভাবে তৈরি হয়েছে!',
      batchRecalled: 'ব্যাচ সফলভাবে প্রত্যাহার করা হয়েছে!',
      batchFlagged: 'ব্যাচ সফলভাবে চিহ্নিত করা হয়েছে!',
    },
    
    user: {
      title: 'ব্যবহারকারী পরিচালনা',
      subtitle: 'সিস্টেম ব্যবহারকারী এবং অনুমতি পরিচালনা করুন',
      register: 'নিবন্ধন',
      registerUser: 'নতুন ব্যবহারকারী নিবন্ধন',
      verifyUser: 'ব্যবহারকারী যাচাই',
      deactivateUser: 'ব্যবহারকারী নিষ্ক্রিয়',
      name: 'নাম',
      licenseNumber: 'লাইসেন্স/নিবন্ধন নম্বর',
      role: 'ভূমিকা',
      status: 'অবস্থা',
      verified: 'যাচাই করা হয়েছে',
      unverified: 'যাচাই করা হয়নি',
      active: 'সক্রিয়',
      inactive: 'নিষ্ক্রিয়',
      registeredAt: 'নিবন্ধনের সময়',
      pendingUsers: 'যাচাই অপেক্ষমান',
      allUsers: 'সব ব্যবহারকারী',
    },
    
    analytics: {
      title: 'বিশ্লেষণ ড্যাশবোর্ড',
      subtitle: 'সিস্টেম পরিসংখ্যান এবং অন্তর্দৃষ্টি',
      overview: 'সংক্ষিপ্ত বিবরণ',
      prescriptionStats: 'প্রেসক্রিপশন পরিসংখ্যান',
      batchStats: 'ব্যাচ পরিসংখ্যান',
      userStats: 'ব্যবহারকারী পরিসংখ্যান',
      alerts: 'সতর্কতা ও সতর্কবাণী',
      trends: 'প্রবণতা',
      byDay: 'দিন অনুযায়ী',
      byWeek: 'সপ্তাহ অনুযায়ী',
      byMonth: 'মাস অনুযায়ী',
    },
    
    alerts: {
      fakeMedicine: 'নকল ওষুধ সতর্কতা',
      batchRecalled: 'ব্যাচ প্রত্যাহার',
      batchFlagged: 'সন্দেহজনক ব্যাচ চিহ্নিত',
      prescriptionExpired: 'প্রেসক্রিপশন মেয়াদ শেষ',
      lowStock: 'কম স্টক সতর্কতা',
      expiryWarning: 'মেয়াদ শেষ সতর্কতা',
    },
    
    settings: {
      title: 'সেটিংস',
      language: 'ভাষা',
      theme: 'থিম',
      dark: 'ডার্ক',
      light: 'লাইট',
      notifications: 'বিজ্ঞপ্তি',
      enableNotifications: 'বিজ্ঞপ্তি সক্রিয় করুন',
      emailNotifications: 'ইমেইল বিজ্ঞপ্তি',
      smsNotifications: 'এসএমএস বিজ্ঞপ্তি',
      profile: 'প্রোফাইল সেটিংস',
      security: 'নিরাপত্তা',
      network: 'ব্লকচেইন নেটওয়ার্ক',
    },
    
    errors: {
      required: 'এই ক্ষেত্রটি আবশ্যক',
      invalidEmail: 'অবৈধ ইমেইল ঠিকানা',
      invalidPhone: 'অবৈধ ফোন নম্বর',
      networkError: 'নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।',
      transactionFailed: 'লেনদেন ব্যর্থ',
      unauthorized: 'আপনি এই কাজ করার অনুমতি পাননি',
      notFound: 'পাওয়া যায়নি',
      serverError: 'সার্ভার ত্রুটি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
      offlineMode: 'আপনি বর্তমানে অফলাইন। কিছু বৈশিষ্ট্য সীমিত হতে পারে।',
    },
  },
}

export default translations

