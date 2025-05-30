// Lab Test interface
export interface LabTest {
  id: string
  name: string
  description: string
  price: number
  category: string
  normalRange?: string
  unit?: string
  active: boolean
  ranges?: LabTestRange[]
}

// Add the LabTestResult interface if it doesn't exist
export interface LabTestResult {
  id: string
  testId: string
  name: string
  result: string
  normalRange: string
  unit?: string
  isAbnormal?: boolean
  notes?: string
  category?: string
}

// Lab Request interface
export interface LabRequest {
  id: string
  patientId: string
  patientName: string
  doctorName: string
  date: string
  status: "pending" | "billed" | "in_progress" | "completed"
  tests: {
    id: string
    testId: string
    name: string
    price: number
    normalRange?: string
    unit?: string
    result?: string
    parameterResults?: LabTestResult[] // Add this field
    paymentStatus: "pending" | "paid"
    billId?: string
  }[]
  notes?: string
  results?: string
  doctorPrescriptions?: string[]
  completedAt?: string
  completedBy?: string
}

export interface LabTestRange {
  name: string
  normalRange: string
  unit?: string
  category: string
}

// Add the lab test ranges data
export const labTestRanges: Record<string, LabTestRange[]> = {
  "Full Blood Count": [
    { name: "Haemoglobin", normalRange: "130-180 g/L", unit: "g/L", category: "Hematology" },
    { name: "Haematocrit (PCV)", normalRange: "44 - 54%", unit: "%", category: "Hematology" },
    { name: "WBC count", normalRange: "4000 - 11,000/mm³", unit: "/mm³", category: "Hematology" },
    { name: "Neutrophils", normalRange: "40-77%", unit: "%", category: "Differential counts" },
    { name: "Lymphocytes", normalRange: "20-45%", unit: "%", category: "Differential counts" },
    { name: "Monocytes", normalRange: "1.0-15.0%", unit: "%", category: "Differential counts" },
    { name: "Eosinophils", normalRange: "1-6%", unit: "%", category: "Differential counts" },
    { name: "Basophils", normalRange: "0-1%", unit: "%", category: "Differential counts" },
    { name: "Platelet count", normalRange: "150-400/mm³", unit: "/mm³", category: "Hematology" },
    { name: "MCH", normalRange: "27 - 32 pg", unit: "pg", category: "Hematology" },
    { name: "MCHC", normalRange: "30 - 35%", unit: "%", category: "Hematology" },
    { name: "ESR", normalRange: "0 - 20 mm/hr", unit: "mm/hr", category: "Hematology" },
  ],
  "Blood Glucose": [
    { name: "Fasting glucose", normalRange: "4.2-6.0 mmol/L", unit: "mmol/L", category: "Biochemistry" },
    { name: "Random glucose", normalRange: "4.2-8.0 mmol/L", unit: "mmol/L", category: "Biochemistry" },
    { name: "RBS", normalRange: "4.2-8.0 mmol/L", unit: "mmol/L", category: "Biochemistry" },
  ],
  "Lipid Profile": [
    { name: "Cholesterol", normalRange: "150 - 250 mg/dL", unit: "mg/dL", category: "Biochemistry" },
    { name: "HDL cholesterol", normalRange: "<150 mg/dL", unit: "mg/dL", category: "Biochemistry" },
    { name: "LDL cholesterol", normalRange: "74 - 172 mg/dL", unit: "mg/dL", category: "Biochemistry" },
    { name: "Triglyceride", normalRange: "3.5 - 5.3 mg/dL", unit: "mg/dL", category: "Biochemistry" },
  ],
  "Liver Function Test": [
    { name: "Albumin", normalRange: "3.5 - 5.0 g/dL", unit: "g/dL", category: "Biochemistry" },
    { name: "Total protein", normalRange: "6.3 - 8.0 g/dL", unit: "g/dL", category: "Biochemistry" },
    { name: "SGOT/AST", normalRange: "<12 IU/L", unit: "IU/L", category: "Biochemistry" },
    { name: "SGPT/ALT", normalRange: "0.2 IU/L", unit: "IU/L", category: "Biochemistry" },
    { name: "Direct Bilirubin", normalRange: "<0.3 mg/dL", unit: "mg/dL", category: "Biochemistry" },
    { name: "Alkaline Phosphatase", normalRange: "1.1 - 4.0 mg/dL", unit: "mg/dL", category: "Biochemistry" },
    { name: "Total Bilirubin", normalRange: "0.2 - 1.2 mg/dL", unit: "mg/dL", category: "Biochemistry" },
  ],
  Electrolytes: [
    { name: "Calcium", normalRange: "8.5 - 11 mg/dL", unit: "mg/dL", category: "Biochemistry" },
    { name: "Total Calcium", normalRange: "2.30 - 2.70 mg/dL", unit: "mg/dL", category: "Biochemistry" },
    { name: "Phosphorus", normalRange: "2.4 - 4.5 mg/dL", unit: "mg/dL", category: "Biochemistry" },
    { name: "Sodium", normalRange: "135 - 145 mmol/L", unit: "mmol/L", category: "Biochemistry" },
    { name: "Potassium", normalRange: "3.5 - 5.5 mmol/L", unit: "mmol/L", category: "Biochemistry" },
    { name: "Chloride", normalRange: "96 - 108 mmol/L", unit: "mmol/L", category: "Biochemistry" },
    { name: "Bicarbonate", normalRange: "20 - 35 mmol/L", unit: "mmol/L", category: "Biochemistry" },
  ],
  "Renal Function": [
    { name: "Urea", normalRange: "10 - 50 mg/dL", unit: "mg/dL", category: "Biochemistry" },
    { name: "Creatinine", normalRange: "0.7 - 1.4 mg/dL", unit: "mg/dL", category: "Biochemistry" },
    { name: "Uric acid", normalRange: "2.5 - 7.0 mg/dL", unit: "mg/dL", category: "Biochemistry" },
  ],
  Enzymes: [
    { name: "LDH", normalRange: "<220 U/L", unit: "U/L", category: "Biochemistry" },
    { name: "Amylase", normalRange: "30 - 110 U/L", unit: "U/L", category: "Biochemistry" },
    { name: "GGT", normalRange: "<2 IU/L", unit: "IU/L", category: "Biochemistry" },
  ],
  Serology: [
    { name: "Widal - Salmonella typhi", normalRange: "Negative", category: "Serology" },
    { name: "Widal - S. Paratyphi A", normalRange: "Negative", category: "Serology" },
    { name: "Widal - S. Paratyphi B", normalRange: "Negative", category: "Serology" },
    { name: "C-Reactive protein", normalRange: "0 - 10 mg/L", unit: "mg/L", category: "Serology" },
    { name: "VDRL", normalRange: "Non-reactive", category: "Serology" },
    { name: "HCV", normalRange: "Non-reactive", category: "Serology" },
    { name: "HIV 1&2 screening", normalRange: "Non-reactive", category: "Serology" },
    { name: "HB sAg screening", normalRange: "Non-reactive", category: "Serology" },
    { name: "H-Pyloric", normalRange: "Negative", category: "Serology" },
    { name: "Rheumatoid Factor", normalRange: "<15 IU/mL", unit: "IU/mL", category: "Serology" },
  ],
  Hematology: [
    { name: "Retic count", normalRange: "0.5 - 2.0%", unit: "%", category: "Hematology" },
    { name: "Hb Genotype", normalRange: "AA, AS, SS, AC, etc.", category: "Hematology" },
    { name: "Blood group", normalRange: "A, B, AB, O (with Rh)", category: "Hematology" },
    { name: "Bleeding time", normalRange: "1 - 6 mins", unit: "mins", category: "Hematology" },
    { name: "Clotting time", normalRange: "4 - 10 mins", unit: "mins", category: "Hematology" },
    { name: "Prothrombin time", normalRange: "10 - 15 secs", unit: "secs", category: "Hematology" },
  ],
  Parasitology: [
    { name: "Microfilaria", normalRange: "Negative", category: "Parasitology" },
    { name: "TB", normalRange: "Negative", category: "Parasitology" },
    { name: "mp", normalRange: "Negative", category: "Parasitology" },
  ],
  Immunology: [
    { name: "Indirect Comb", normalRange: "Negative", category: "Immunology" },
    { name: "Direct Comb", normalRange: "Negative", category: "Immunology" },
  ],
  Endocrinology: [{ name: "HBA1C", normalRange: "4 - 5.6%", unit: "%", category: "Endocrinology" }],
  Pregnancy: [{ name: "Pregnancy blood/urine", normalRange: "Negative", category: "Pregnancy" }],
}

// Update the generateMockLabTests function to include normal ranges
export const generateMockLabTests = (): LabTest[] => {
  const tests: LabTest[] = [
    {
      id: "LAB-TEST-001",
      name: "Full Blood Count",
      category: "Hematology",
      price: 3500,
      active: true,
      description: "Complete blood count including differential",
      ranges: labTestRanges["Full Blood Count"],
    },
    {
      id: "LAB-TEST-002",
      name: "Blood Glucose",
      category: "Biochemistry",
      price: 1500,
      active: true,
      description: "Blood sugar test (fasting or random)",
      ranges: labTestRanges["Blood Glucose"],
    },
    {
      id: "LAB-TEST-003",
      name: "Lipid Profile",
      category: "Biochemistry",
      price: 4500,
      active: true,
      description: "Cholesterol and triglycerides panel",
      ranges: labTestRanges["Lipid Profile"],
    },
    {
      id: "LAB-TEST-004",
      name: "Liver Function Test",
      category: "Biochemistry",
      price: 5000,
      active: true,
      description: "Comprehensive liver panel",
      ranges: labTestRanges["Liver Function Test"],
    },
    {
      id: "LAB-TEST-005",
      name: "Electrolytes",
      category: "Biochemistry",
      price: 3000,
      active: true,
      description: "Sodium, potassium, chloride, and bicarbonate",
      ranges: labTestRanges["Electrolytes"],
    },
    {
      id: "LAB-TEST-006",
      name: "Urinalysis",
      category: "Urine",
      price: 1200,
      active: true,
      description: "Physical, chemical, and microscopic examination of urine",
    },
    {
      id: "LAB-TEST-007",
      name: "Widal Test",
      category: "Serology",
      price: 1800,
      active: true,
      description: "Test for typhoid fever",
      ranges: labTestRanges["Serology"].filter((r) => r.name.includes("Widal")),
    },
    {
      id: "LAB-TEST-008",
      name: "Malaria Parasite",
      category: "Parasitology",
      price: 1500,
      active: true,
      description: "Test for malaria parasites",
      ranges: labTestRanges["Parasitology"].filter((r) => r.name === "mp"),
    },
    {
      id: "LAB-TEST-009",
      name: "Pregnancy Test",
      category: "Pregnancy",
      price: 1000,
      active: true,
      description: "Test for pregnancy hormone (hCG)",
      ranges: labTestRanges["Pregnancy"],
    },
    {
      id: "LAB-TEST-010",
      name: "HIV Screening",
      category: "Serology",
      price: 2000,
      active: true,
      description: "Screening test for HIV antibodies",
      ranges: labTestRanges["Serology"].filter((r) => r.name.includes("HIV")),
    },
    {
      id: "LAB-TEST-011",
      name: "Hepatitis B Surface Antigen",
      category: "Serology",
      price: 2000,
      active: true,
      description: "Test for hepatitis B virus",
      ranges: labTestRanges["Serology"].filter((r) => r.name.includes("HB sAg")),
    },
    {
      id: "LAB-TEST-012",
      name: "Stool Analysis",
      category: "Stool",
      price: 1500,
      active: true,
      description: "Examination of stool for parasites and other abnormalities",
    },
    {
      id: "LAB-TEST-013",
      name: "Renal Function Test",
      category: "Biochemistry",
      price: 4000,
      active: true,
      description: "Test for kidney function",
      ranges: labTestRanges["Renal Function"],
    },
    {
      id: "LAB-TEST-014",
      name: "Genotype",
      category: "Hematology",
      price: 2500,
      active: true,
      description: "Determination of hemoglobin genotype",
      ranges: labTestRanges["Hematology"].filter((r) => r.name.includes("Genotype")),
    },
    {
      id: "LAB-TEST-015",
      name: "Blood Group",
      category: "Hematology",
      price: 1000,
      active: true,
      description: "Determination of ABO blood group and Rh factor",
      ranges: labTestRanges["Hematology"].filter((r) => r.name.includes("Blood group")),
    },
  ]

  return tests
}

// Generate mock lab requests
export const generateMockLabRequests = (): LabRequest[] => {
  return [
    {
      id: "LAB-REQ-001",
      patientId: "P-1001",
      patientName: "John Doe",
      doctorName: "Dr. Okonkwo",
      date: "2023-05-15",
      status: "pending",
      tests: [
        {
          id: "TEST-ITEM-001",
          testId: "LAB-TEST-001",
          name: "Complete Blood Count (CBC)",
          price: 3500,
          normalRange: "WBC: 4.5-11.0 x10^9/L, RBC: 4.5-5.9 x10^12/L, Hgb: 13.5-17.5 g/dL",
          paymentStatus: "pending",
        },
        {
          id: "TEST-ITEM-002",
          testId: "LAB-TEST-003",
          name: "Lipid Profile",
          price: 4500,
          normalRange: "Total Cholesterol: <200 mg/dL, HDL: >40 mg/dL, LDL: <100 mg/dL",
          paymentStatus: "pending",
        },
      ],
      doctorPrescriptions: ["Check lipid profile and CBC for cardiovascular risk assessment"],
    },
    {
      id: "LAB-REQ-002",
      patientId: "P-1002",
      patientName: "Sarah Johnson",
      doctorName: "Dr. Adeyemi",
      date: "2023-05-12",
      status: "billed",
      tests: [
        {
          id: "TEST-ITEM-003",
          testId: "LAB-TEST-002",
          name: "Blood Glucose",
          price: 1500,
          normalRange: "70-99 mg/dL (fasting)",
          paymentStatus: "pending",
        },
      ],
      doctorPrescriptions: ["Check fasting blood glucose"],
    },
    {
      id: "LAB-REQ-003",
      patientId: "P-1003",
      patientName: "Michael Smith",
      doctorName: "Dr. Nwachukwu",
      date: "2023-05-15",
      status: "in_progress",
      tests: [
        {
          id: "TEST-ITEM-004",
          testId: "LAB-TEST-004",
          name: "Liver Function Test",
          price: 5000,
          normalRange: "ALT: 7-55 U/L, AST: 8-48 U/L, ALP: 45-115 U/L",
          paymentStatus: "paid",
        },
        {
          id: "TEST-ITEM-005",
          testId: "LAB-TEST-005",
          name: "Kidney Function Test",
          price: 5000,
          normalRange: "BUN: 7-20 mg/dL, Creatinine: 0.6-1.2 mg/dL",
          paymentStatus: "paid",
        },
      ],
      doctorPrescriptions: ["Check liver and kidney function"],
    },
    {
      id: "LAB-REQ-004",
      patientId: "P-1004",
      patientName: "Emma Wilson",
      doctorName: "Dr. Brown",
      date: "2023-05-08",
      status: "completed",
      tests: [
        {
          id: "TEST-ITEM-006",
          testId: "LAB-TEST-006",
          name: "Thyroid Function Test",
          price: 6500,
          normalRange: "TSH: 0.4-4.0 mIU/L, T4: 4.5-11.2 μg/dL, T3: 80-200 ng/dL",
          paymentStatus: "paid",
          result: "TSH: 2.5 mIU/L, T4: 8.3 μg/dL, T3: 120 ng/dL",
        },
      ],
      results: "All thyroid function parameters are within normal range.",
      doctorPrescriptions: ["Check thyroid function"],
    },
  ]
}
