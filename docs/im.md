flowchart TB
  subgraph OnChain[On-chain (Blockchain)]
    P1[Prescription ID]
    P2[patientHash (no raw PII)]
    P3[expiresAt]
    P4[isDispensed: true/false]
    P5[doctor address]
  end

  subgraph OffChain[Off-chain (Database / App Storage)]
    O1[Patient name, age, address]
    O2[Full prescription details (private)]
    O3[UI history & fast search]
  end

  UI[BlockMed UI (Web App)] --> OnChain
  UI --> OffChain
