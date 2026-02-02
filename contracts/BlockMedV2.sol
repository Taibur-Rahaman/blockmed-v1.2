// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BlockMed V2 - Blockchain-Based Prescription Verification & Anti-Fake Medicine Tracking
 * @dev Complete healthcare security platform with RBAC, prescription management, and medicine tracking
 */
contract BlockMedV2 {
    
    // ============================================
    // ROLE DEFINITIONS
    // ============================================
    enum Role { None, Admin, Doctor, Pharmacist, Manufacturer, Patient, Regulator }
    
    struct User {
        address userAddress;
        Role role;
        string name;
        string licenseNumber;  // BMDC for doctors, Drug license for pharmacists
        bool isVerified;
        bool isActive;
        uint256 registeredAt;
    }

    // ============================================
    // PRESCRIPTION STRUCTURES
    // ============================================
    struct Prescription {
        uint256 id;
        string patientHash;
        string ipfsHash;
        address doctor;
        uint256 createdAt;
        uint256 expiresAt;
        bool isDispensed;
        address dispensedBy;
        uint256 dispensedAt;
        uint256 version;
        bool isActive;
        string digitalSignature;
    }

    struct PrescriptionVersion {
        uint256 prescriptionId;
        uint256 version;
        string ipfsHash;
        uint256 createdAt;
        string reason;
    }

    // ============================================
    // MEDICINE BATCH STRUCTURES
    // ============================================
    struct MedicineBatch {
        uint256 id;
        string batchNumber;
        string medicineName;
        string genericName;
        address manufacturer;
        uint256 manufacturedAt;
        uint256 expiresAt;
        string origin;
        string ipfsHash;  // Contains detailed batch info
        bool isRecalled;
        string recallReason;
        bool isFlagged;
        string flagReason;
        uint256 createdAt;
        uint256 totalUnits;     // Total units/boxes in this batch when created
        uint256 dispensedUnits; // Units sold/dispensed - remaining = totalUnits - dispensedUnits
    }

    // ============================================
    // STATE VARIABLES
    // ============================================
    address public owner;
    
    // User management
    mapping(address => User) public users;
    address[] public userAddresses;
    
    // Prescription management
    uint256 public prescriptionCount;
    mapping(uint256 => Prescription) public prescriptions;
    mapping(uint256 => PrescriptionVersion[]) public prescriptionVersions;
    mapping(string => uint256[]) public patientPrescriptions;  // patientHash => prescriptionIds
    mapping(address => uint256[]) public doctorPrescriptions;  // doctor => prescriptionIds
    
    // Medicine batch management
    uint256 public batchCount;
    mapping(uint256 => MedicineBatch) public medicineBatches;
    mapping(string => uint256) public batchNumberToId;  // batchNumber => batchId
    mapping(address => uint256[]) public manufacturerBatches;  // manufacturer => batchIds
    
    // Flagged/Recalled tracking
    uint256[] public flaggedBatches;
    uint256[] public recalledBatches;
    
    // Audit trail
    uint256 public totalVerifications;
    uint256 public totalDispensations;

    // ============================================
    // EVENTS
    // ============================================
    event UserRegistered(address indexed user, Role role, string name, uint256 timestamp);
    event UserVerified(address indexed user, address indexed verifiedBy, uint256 timestamp);
    event UserDeactivated(address indexed user, address indexed deactivatedBy, uint256 timestamp);
    
    event PrescriptionCreated(
        uint256 indexed id,
        string patientHash,
        address indexed doctor,
        uint256 expiresAt,
        uint256 timestamp
    );
    
    event PrescriptionUpdated(
        uint256 indexed id,
        uint256 version,
        address indexed doctor,
        string reason,
        uint256 timestamp
    );
    
    event PrescriptionDispensed(
        uint256 indexed id,
        address indexed pharmacist,
        uint256 timestamp
    );
    
    event PrescriptionRevoked(
        uint256 indexed id,
        address indexed revokedBy,
        string reason,
        uint256 timestamp
    );
    
    event BatchCreated(
        uint256 indexed id,
        string batchNumber,
        string medicineName,
        address indexed manufacturer,
        uint256 timestamp
    );
    
    event BatchRecalled(
        uint256 indexed id,
        string batchNumber,
        string reason,
        address indexed recalledBy,
        uint256 timestamp
    );
    
    event BatchFlagged(
        uint256 indexed id,
        string batchNumber,
        string reason,
        address indexed flaggedBy,
        uint256 timestamp
    );
    
    event FakeMedicineAlert(
        uint256 indexed batchId,
        string batchNumber,
        string alertType,
        address indexed reportedBy,
        uint256 timestamp
    );
    
    event BatchDispensed(
        uint256 indexed batchId,
        string batchNumber,
        uint256 quantity,
        uint256 remainingUnits,
        address indexed dispensedBy,
        uint256 timestamp
    );

    // ============================================
    // MODIFIERS
    // ============================================
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAdmin() {
        require(users[msg.sender].role == Role.Admin || msg.sender == owner, "Only admin can perform this action");
        _;
    }
    
    modifier onlyDoctor() {
        require(users[msg.sender].role == Role.Doctor && users[msg.sender].isVerified, "Only verified doctor can perform this action");
        _;
    }
    
    modifier onlyPharmacist() {
        require(users[msg.sender].role == Role.Pharmacist && users[msg.sender].isVerified, "Only verified pharmacist can perform this action");
        _;
    }
    
    modifier onlyManufacturer() {
        require(users[msg.sender].role == Role.Manufacturer && users[msg.sender].isVerified, "Only verified manufacturer can perform this action");
        _;
    }
    
    modifier onlyRegulator() {
        require(users[msg.sender].role == Role.Regulator && users[msg.sender].isVerified, "Only verified regulator can perform this action");
        _;
    }
    
    modifier onlyVerifiedUser() {
        require(users[msg.sender].isVerified && users[msg.sender].isActive, "Only verified active user can perform this action");
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================
    constructor() {
        owner = msg.sender;
        
        // Register owner as admin
        users[msg.sender] = User({
            userAddress: msg.sender,
            role: Role.Admin,
            name: "System Admin",
            licenseNumber: "ADMIN-001",
            isVerified: true,
            isActive: true,
            registeredAt: block.timestamp
        });
        userAddresses.push(msg.sender);
        
        emit UserRegistered(msg.sender, Role.Admin, "System Admin", block.timestamp);
    }

    // ============================================
    // USER MANAGEMENT FUNCTIONS
    // ============================================
    
    /**
     * @dev Register a new user with a specific role
     */
    function registerUser(
        string memory _name,
        string memory _licenseNumber,
        Role _role
    ) external returns (bool) {
        require(users[msg.sender].role == Role.None, "User already registered");
        require(_role != Role.None && _role != Role.Admin, "Invalid role");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            role: _role,
            name: _name,
            licenseNumber: _licenseNumber,
            isVerified: false,  // Requires admin verification
            isActive: true,
            registeredAt: block.timestamp
        });
        userAddresses.push(msg.sender);
        
        emit UserRegistered(msg.sender, _role, _name, block.timestamp);
        return true;
    }
    
    /**
     * @dev Admin verifies a user
     */
    function verifyUser(address _user) external onlyAdmin {
        require(users[_user].role != Role.None, "User not registered");
        require(!users[_user].isVerified, "User already verified");
        
        users[_user].isVerified = true;
        
        emit UserVerified(_user, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Deactivate a user
     */
    function deactivateUser(address _user) external onlyAdmin {
        require(users[_user].role != Role.None, "User not registered");
        require(_user != owner, "Cannot deactivate owner");
        
        users[_user].isActive = false;
        
        emit UserDeactivated(_user, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get user info
     */
    function getUser(address _user) external view returns (User memory) {
        return users[_user];
    }
    
    /**
     * @dev Get all users (admin only)
     */
    function getAllUsers() external view onlyAdmin returns (address[] memory) {
        return userAddresses;
    }

    // ============================================
    // PRESCRIPTION FUNCTIONS
    // ============================================
    
    /**
     * @dev Create a new prescription (Doctor only).
     *      For production/privacy: pass only keccak256(salt || patientId) as _patientHash — never raw PII on-chain.
     */
    function createPrescription(
        string memory _patientHash,
        string memory _ipfsHash,
        uint256 _validityDays,
        string memory _digitalSignature
    ) external onlyDoctor returns (uint256) {
        require(bytes(_patientHash).length > 0, "Patient hash cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(_validityDays > 0 && _validityDays <= 365, "Invalid validity period");
        
        prescriptionCount++;
        uint256 expiresAt = block.timestamp + (_validityDays * 1 days);
        
        prescriptions[prescriptionCount] = Prescription({
            id: prescriptionCount,
            patientHash: _patientHash,
            ipfsHash: _ipfsHash,
            doctor: msg.sender,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            isDispensed: false,
            dispensedBy: address(0),
            dispensedAt: 0,
            version: 1,
            isActive: true,
            digitalSignature: _digitalSignature
        });
        
        // Track by patient and doctor
        patientPrescriptions[_patientHash].push(prescriptionCount);
        doctorPrescriptions[msg.sender].push(prescriptionCount);
        
        // Create initial version record
        prescriptionVersions[prescriptionCount].push(PrescriptionVersion({
            prescriptionId: prescriptionCount,
            version: 1,
            ipfsHash: _ipfsHash,
            createdAt: block.timestamp,
            reason: "Initial creation"
        }));
        
        emit PrescriptionCreated(
            prescriptionCount,
            _patientHash,
            msg.sender,
            expiresAt,
            block.timestamp
        );
        
        return prescriptionCount;
    }
    
    /**
     * @dev Update a prescription (creates new version)
     */
    function updatePrescription(
        uint256 _prescriptionId,
        string memory _newIpfsHash,
        string memory _reason
    ) external onlyDoctor returns (uint256) {
        Prescription storage presc = prescriptions[_prescriptionId];
        
        require(presc.id != 0, "Prescription does not exist");
        require(presc.doctor == msg.sender, "Only prescribing doctor can update");
        require(presc.isActive, "Prescription is not active");
        require(!presc.isDispensed, "Cannot update dispensed prescription");
        require(block.timestamp < presc.expiresAt, "Prescription has expired");
        
        presc.version++;
        presc.ipfsHash = _newIpfsHash;
        
        prescriptionVersions[_prescriptionId].push(PrescriptionVersion({
            prescriptionId: _prescriptionId,
            version: presc.version,
            ipfsHash: _newIpfsHash,
            createdAt: block.timestamp,
            reason: _reason
        }));
        
        emit PrescriptionUpdated(
            _prescriptionId,
            presc.version,
            msg.sender,
            _reason,
            block.timestamp
        );
        
        return presc.version;
    }
    
    /**
     * @dev Dispense a prescription (Pharmacist only)
     */
    function dispensePrescription(uint256 _prescriptionId) external onlyPharmacist {
        Prescription storage presc = prescriptions[_prescriptionId];
        
        require(presc.id != 0, "Prescription does not exist");
        require(presc.isActive, "Prescription is not active");
        require(!presc.isDispensed, "Prescription already dispensed");
        require(block.timestamp < presc.expiresAt, "Prescription has expired");
        
        presc.isDispensed = true;
        presc.dispensedBy = msg.sender;
        presc.dispensedAt = block.timestamp;
        
        totalDispensations++;
        
        emit PrescriptionDispensed(_prescriptionId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Revoke a prescription (prescribing doctor or admin). Sets isActive = false; audit trail preserved.
     */
    function revokePrescription(uint256 _prescriptionId, string memory _reason) external {
        Prescription storage presc = prescriptions[_prescriptionId];
        require(presc.id != 0, "Prescription does not exist");
        require(presc.isActive, "Prescription not active");
        
        bool isPrescribingDoctor = users[msg.sender].role == Role.Doctor && presc.doctor == msg.sender;
        bool isAdmin = users[msg.sender].role == Role.Admin || msg.sender == owner;
        require(isPrescribingDoctor || isAdmin, "Not authorized to revoke");
        
        presc.isActive = false;
        
        emit PrescriptionRevoked(_prescriptionId, msg.sender, _reason, block.timestamp);
    }
    
    /**
     * @dev Get prescription details
     */
    function getPrescription(uint256 _id) external view returns (Prescription memory) {
        require(_id > 0 && _id <= prescriptionCount, "Invalid prescription ID");
        return prescriptions[_id];
    }
    
    /**
     * @dev Get prescriptions by patient hash
     */
    function getPrescriptionsByPatient(string memory _patientHash) external view returns (uint256[] memory) {
        return patientPrescriptions[_patientHash];
    }
    
    /**
     * @dev Get prescriptions by doctor
     */
    function getPrescriptionsByDoctor(address _doctor) external view returns (uint256[] memory) {
        return doctorPrescriptions[_doctor];
    }
    
    /**
     * @dev Get prescription version history
     */
    function getPrescriptionVersions(uint256 _prescriptionId) external view returns (PrescriptionVersion[] memory) {
        return prescriptionVersions[_prescriptionId];
    }
    
    /**
     * @dev Check if prescription is valid
     */
    function isPrescriptionValid(uint256 _prescriptionId) external view returns (bool isValid, string memory status) {
        Prescription memory presc = prescriptions[_prescriptionId];
        
        if (presc.id == 0) return (false, "Does not exist");
        if (!presc.isActive) return (false, "Inactive");
        if (presc.isDispensed) return (false, "Already dispensed");
        if (block.timestamp >= presc.expiresAt) return (false, "Expired");
        
        return (true, "Valid");
    }

    // ============================================
    // MEDICINE BATCH FUNCTIONS
    // ============================================
    
    /**
     * @dev Create a new medicine batch (Manufacturer only)
     * @param _totalUnits Total units/boxes in this batch (use 0 for legacy "no quantity tracking")
     */
    function createMedicineBatch(
        string memory _batchNumber,
        string memory _medicineName,
        string memory _genericName,
        uint256 _expiresAt,
        string memory _origin,
        string memory _ipfsHash,
        uint256 _totalUnits
    ) external onlyManufacturer returns (uint256) {
        require(bytes(_batchNumber).length > 0, "Batch number cannot be empty");
        require(batchNumberToId[_batchNumber] == 0, "Batch number already exists");
        require(_expiresAt > block.timestamp, "Expiry must be in the future");
        
        batchCount++;
        
        medicineBatches[batchCount] = MedicineBatch({
            id: batchCount,
            batchNumber: _batchNumber,
            medicineName: _medicineName,
            genericName: _genericName,
            manufacturer: msg.sender,
            manufacturedAt: block.timestamp,
            expiresAt: _expiresAt,
            origin: _origin,
            ipfsHash: _ipfsHash,
            isRecalled: false,
            recallReason: "",
            isFlagged: false,
            flagReason: "",
            createdAt: block.timestamp,
            totalUnits: _totalUnits,
            dispensedUnits: 0
        });
        
        batchNumberToId[_batchNumber] = batchCount;
        manufacturerBatches[msg.sender].push(batchCount);
        
        emit BatchCreated(
            batchCount,
            _batchNumber,
            _medicineName,
            msg.sender,
            block.timestamp
        );
        
        return batchCount;
    }
    
    /**
     * @dev Dispense/sell units from a batch (Pharmacist only)
     * Reduces remaining units - helps detect counterfeit copies (if sold > total = fake)
     * @param _batchId Batch ID
     * @param _quantity Number of units customer purchased
     */
    function dispenseFromBatch(uint256 _batchId, uint256 _quantity) external onlyPharmacist {
        MedicineBatch storage batch = medicineBatches[_batchId];
        require(batch.id != 0, "Batch does not exist");
        require(!batch.isRecalled, "Cannot dispense recalled batch");
        require(block.timestamp < batch.expiresAt, "Cannot dispense expired batch");
        require(batch.totalUnits > 0, "Quantity tracking not enabled for this batch");
        require(_quantity > 0, "Quantity must be greater than zero");
        require(batch.dispensedUnits + _quantity <= batch.totalUnits, "Insufficient units - possible counterfeit");
        
        batch.dispensedUnits += _quantity;
        totalDispensations += _quantity;
        
        uint256 remaining = batch.totalUnits - batch.dispensedUnits;
        
        emit BatchDispensed(
            _batchId,
            batch.batchNumber,
            _quantity,
            remaining,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Recall a medicine batch (Manufacturer or Regulator)
     */
    function recallBatch(uint256 _batchId, string memory _reason) external {
        require(
            users[msg.sender].role == Role.Manufacturer || 
            users[msg.sender].role == Role.Regulator ||
            users[msg.sender].role == Role.Admin,
            "Not authorized to recall"
        );
        
        MedicineBatch storage batch = medicineBatches[_batchId];
        require(batch.id != 0, "Batch does not exist");
        
        // Manufacturers can only recall their own batches
        if (users[msg.sender].role == Role.Manufacturer) {
            require(batch.manufacturer == msg.sender, "Not your batch");
        }
        
        batch.isRecalled = true;
        batch.recallReason = _reason;
        recalledBatches.push(_batchId);
        
        emit BatchRecalled(_batchId, batch.batchNumber, _reason, msg.sender, block.timestamp);
        emit FakeMedicineAlert(_batchId, batch.batchNumber, "RECALL", msg.sender, block.timestamp);
    }
    
    /**
     * @dev Flag a batch as suspicious (Any verified user)
     */
    function flagBatch(uint256 _batchId, string memory _reason) external onlyVerifiedUser {
        MedicineBatch storage batch = medicineBatches[_batchId];
        require(batch.id != 0, "Batch does not exist");
        require(!batch.isFlagged, "Batch already flagged");
        
        batch.isFlagged = true;
        batch.flagReason = _reason;
        flaggedBatches.push(_batchId);
        
        emit BatchFlagged(_batchId, batch.batchNumber, _reason, msg.sender, block.timestamp);
        emit FakeMedicineAlert(_batchId, batch.batchNumber, "FLAGGED", msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get batch by ID
     */
    function getMedicineBatch(uint256 _batchId) external view returns (MedicineBatch memory) {
        require(_batchId > 0 && _batchId <= batchCount, "Invalid batch ID");
        return medicineBatches[_batchId];
    }
    
    /**
     * @dev Get batch by batch number
     */
    function getBatchByNumber(string memory _batchNumber) external view returns (MedicineBatch memory) {
        uint256 batchId = batchNumberToId[_batchNumber];
        require(batchId != 0, "Batch not found");
        return medicineBatches[batchId];
    }
    
    /**
     * @dev Verify batch authenticity
     */
    function verifyBatch(string memory _batchNumber) external view returns (
        bool exists,
        bool isRecalled,
        bool isFlagged,
        bool isExpired,
        string memory status
    ) {
        uint256 batchId = batchNumberToId[_batchNumber];
        
        if (batchId == 0) {
            return (false, false, false, false, "UNKNOWN - Batch not in system");
        }
        
        MedicineBatch memory batch = medicineBatches[batchId];
        
        if (batch.isRecalled) {
            return (true, true, batch.isFlagged, block.timestamp >= batch.expiresAt, "RECALLED - Do not use");
        }
        
        if (batch.isFlagged) {
            return (true, false, true, block.timestamp >= batch.expiresAt, "FLAGGED - Verify with authority");
        }
        
        if (block.timestamp >= batch.expiresAt) {
            return (true, false, false, true, "EXPIRED - Do not use");
        }
        
        return (true, false, false, false, "VERIFIED - Authentic medicine");
    }
    
    /**
     * @dev Get flagged batches
     */
    function getFlaggedBatches() external view returns (uint256[] memory) {
        return flaggedBatches;
    }
    
    /**
     * @dev Get recalled batches
     */
    function getRecalledBatches() external view returns (uint256[] memory) {
        return recalledBatches;
    }

    // ============================================
    // ANALYTICS & REPORTING (Admin/Regulator)
    // ============================================
    
    /**
     * @dev Get system statistics
     */
    function getSystemStats() external view returns (
        uint256 totalUsers,
        uint256 totalPrescriptions,
        uint256 totalBatches,
        uint256 dispensedCount,
        uint256 flaggedCount,
        uint256 recalledCount
    ) {
        return (
            userAddresses.length,
            prescriptionCount,
            batchCount,
            totalDispensations,
            flaggedBatches.length,
            recalledBatches.length
        );
    }
    
    /**
     * @dev Get batches by manufacturer
     */
    function getBatchesByManufacturer(address _manufacturer) external view returns (uint256[] memory) {
        return manufacturerBatches[_manufacturer];
    }

    // ============================================
    // LEGACY COMPATIBILITY FUNCTIONS
    // ============================================
    
    /**
     * @dev Legacy: Add prescription (for backward compatibility)
     */
    function addPrescription(
        string memory _patientHash,
        string memory _ipfsHash
    ) external returns (uint256) {
        // Register user as doctor if not registered
        if (users[msg.sender].role == Role.None) {
            users[msg.sender] = User({
                userAddress: msg.sender,
                role: Role.Doctor,
                name: "Doctor",
                licenseNumber: "PENDING",
                isVerified: true,  // Auto-verify for legacy support
                isActive: true,
                registeredAt: block.timestamp
            });
            userAddresses.push(msg.sender);
        }
        
        prescriptionCount++;
        uint256 expiresAt = block.timestamp + (30 days);  // Default 30 days
        
        prescriptions[prescriptionCount] = Prescription({
            id: prescriptionCount,
            patientHash: _patientHash,
            ipfsHash: _ipfsHash,
            doctor: msg.sender,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            isDispensed: false,
            dispensedBy: address(0),
            dispensedAt: 0,
            version: 1,
            isActive: true,
            digitalSignature: ""
        });
        
        patientPrescriptions[_patientHash].push(prescriptionCount);
        doctorPrescriptions[msg.sender].push(prescriptionCount);
        
        emit PrescriptionCreated(
            prescriptionCount,
            _patientHash,
            msg.sender,
            expiresAt,
            block.timestamp
        );
        
        return prescriptionCount;
    }
    
    /**
     * @dev Legacy: Verify prescription
     */
    function verifyPrescription(uint256 _id) external {
        // Register as pharmacist if not registered
        if (users[msg.sender].role == Role.None) {
            users[msg.sender] = User({
                userAddress: msg.sender,
                role: Role.Pharmacist,
                name: "Pharmacist",
                licenseNumber: "PENDING",
                isVerified: true,
                isActive: true,
                registeredAt: block.timestamp
            });
            userAddresses.push(msg.sender);
        }
        
        Prescription storage presc = prescriptions[_id];
        require(presc.id != 0, "Prescription does not exist");
        require(!presc.isDispensed, "Already dispensed");
        
        presc.isDispensed = true;
        presc.dispensedBy = msg.sender;
        presc.dispensedAt = block.timestamp;
        
        totalDispensations++;
        totalVerifications++;
        
        emit PrescriptionDispensed(_id, msg.sender, block.timestamp);
    }
}

