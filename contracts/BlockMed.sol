// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BlockMed {
    struct Prescription {
        uint256 id;
        string patientHash;
        string ipfsHash;
        address doctor;
        uint256 timestamp;
        bool verified;
    }

    uint256 public prescriptionCount;
    mapping(uint256 => Prescription) public prescriptions;

    event PrescriptionAdded(
        uint256 indexed id,
        string patientHash,
        string ipfsHash,
        address doctor,
        uint256 timestamp
    );

    event PrescriptionVerified(
        uint256 indexed id,
        address verifiedBy,
        uint256 timestamp
    );

    /**
     * @dev Add a new prescription to the blockchain
     * @param _patientHash Hash identifier for the patient
     * @param _ipfsHash IPFS hash of the prescription document
     * @return The ID of the newly created prescription
     */
    function addPrescription(
        string memory _patientHash,
        string memory _ipfsHash
    ) public returns (uint256) {
        require(bytes(_patientHash).length > 0, "Patient hash cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");

        prescriptionCount++;
        
        prescriptions[prescriptionCount] = Prescription({
            id: prescriptionCount,
            patientHash: _patientHash,
            ipfsHash: _ipfsHash,
            doctor: msg.sender,
            timestamp: block.timestamp,
            verified: false
        });

        emit PrescriptionAdded(
            prescriptionCount,
            _patientHash,
            _ipfsHash,
            msg.sender,
            block.timestamp
        );

        return prescriptionCount;
    }

    /**
     * @dev Get prescription details by ID
     * @param _id The prescription ID to retrieve
     * @return id The prescription ID
     * @return patientHash Hash identifier for the patient
     * @return ipfsHash IPFS hash of the prescription document
     * @return doctor Address of the prescribing doctor
     * @return timestamp Block timestamp when prescription was created
     * @return verified Whether the prescription has been verified
     */
    function getPrescription(uint256 _id) public view returns (
        uint256 id,
        string memory patientHash,
        string memory ipfsHash,
        address doctor,
        uint256 timestamp,
        bool verified
    ) {
        require(_id > 0 && _id <= prescriptionCount, "Invalid prescription ID");
        
        Prescription memory prescription = prescriptions[_id];
        
        return (
            prescription.id,
            prescription.patientHash,
            prescription.ipfsHash,
            prescription.doctor,
            prescription.timestamp,
            prescription.verified
        );
    }

    /**
     * @dev Verify a prescription (can be called by authorized pharmacist/doctor)
     * @param _id The prescription ID to verify
     */
    function verifyPrescription(uint256 _id) public {
        require(_id > 0 && _id <= prescriptionCount, "Invalid prescription ID");
        require(!prescriptions[_id].verified, "Prescription already verified");

        prescriptions[_id].verified = true;

        emit PrescriptionVerified(_id, msg.sender, block.timestamp);
    }

    /**
     * @dev Get all prescriptions by a specific doctor
     * @param _doctor The doctor's address
     * @return Array of prescription IDs
     */
    function getPrescriptionsByDoctor(address _doctor) public view returns (uint256[] memory) {
        uint256[] memory tempIds = new uint256[](prescriptionCount);
        uint256 count = 0;

        for (uint256 i = 1; i <= prescriptionCount; i++) {
            if (prescriptions[i].doctor == _doctor) {
                tempIds[count] = i;
                count++;
            }
        }

        uint256[] memory doctorPrescriptions = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            doctorPrescriptions[i] = tempIds[i];
        }

        return doctorPrescriptions;
    }
}
