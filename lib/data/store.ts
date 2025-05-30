import { create } from "zustand"
import type { BillItem } from "./billing"
import { generateMockBills } from "./billing"
import {
  type Staff,
  type StaffRole,
  type HMOProvider,
  type Department,
  type HospitalSettings,
  generateMockStaff,
  generateMockHMOProviders,
  generateMockDepartments,
  defaultHospitalSettings,
} from "./staff"
import { type LabTest, type LabRequest, generateMockLabTests, generateMockLabRequests } from "./lab-tests"
// Remove the generateMockPatients function and replace it with an import
import { generateMockPatients } from "./patients"

// Update the Patient interface to include all the registration fields
export interface Patient {
  id: string
  name: string
  firstName: string
  lastName: string
  dob?: string
  age: number
  gender: string
  phone: string
  email: string
  address: string
  lastVisit: string
  patientType: "cash" | "hmo"
  hmoProvider?: string
  medicalHistory?: string[]
  allergies?: string[]
  visits?: Visit[]
  bills?: string[] // References to bill IDs
  balance: number // Patient retainership balance
  isStaff?: boolean // Flag to identify staff as patients
  staffId?: string // Reference to the staff record if isStaff is true
  isMinor?: boolean // Flag to identify if patient is a minor
  guardian?: {
    name: string
    relationship: string
    phone: string
    email?: string
    address?: string
  }
  // New fields
  salutation?: string
  maritalStatus?: string
  religion?: string
  nationality?: string
  stateOfOrigin?: string
  occupation?: string
  bloodGroup?: string
  nextOfKin?: {
    fullName: string
    phone: string
    address: string
    relationship?: string
  }
}

// Visit interface
export interface Visit {
  id: string
  date: string
  type: string
  doctor: string
  diagnosis: string
  originalDiagnosis?: string
  physicalExamination?: string
  presentingComplaints?: string
  historyOfComplaints?: string
  vitals: {
    bloodPressure: string
    temperature: string
    heartRate: string
    respiratoryRate: string
    oxygenSaturation: string
    weight: string
    height: string
    bmi?: number
    bmiInterpretation?: string
  }
  prescriptions?: string[]
  labTests?: {
    name: string
    result: string
    date: string
  }[]
  notes?: string
  injectionData?: {
    id: string
    patientId: string
    patientName: string
    doctorName: string
    date: string
    status: "pending" | "not_paid" | "paid" | "in_progress" | "completed" | "later"
    injections: {
      id: string
      medicineId: string
      name: string
      dosage: string
      form: string
      route: string
      frequency: string
      quantity: number
      price: number
      administered: boolean
      administeredTime?: string
      administeredBy?: string
      paymentStatus: "pending" | "paid"
      notes?: string
      billId?: string
      sentToCashPoint: boolean
      saved?: boolean
    }[]
    notes?: string
    doctorPrescriptions?: string[]
  }
  labData?: LabRequest
  // Track doctor changes for billing purposes
  doctorChanges?: {
    date: string
    fromDoctor: string
    toDoctor: string
    fromDepartment?: string
    toDepartment?: string
    priceDifference: number
    billId?: string
    notes?: string
  }[]
}

// Update the Appointment interface to include consultation types
export interface Appointment {
  id: string
  patientId: string
  patientName: string
  date: string
  time: string
  type: string
  status: "scheduled" | "completed" | "cancelled" | "In Progress"
  doctor?: string
  doctorId?: string
  consultationType?: "initial" | "follow_up" | "specialist" | "general" | "pediatrician" | "vaccination"
  notes?: string
  presentingComplaints?: string
  historyOfComplaints?: string
  billId?: string
  vaccinationSessionId?: string
}

// Define interfaces for HMO claims
export interface ClaimItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  approved: boolean
  type: "medication" | "lab" | "injection" | "consultation"
  sourceId: string // ID of the original request/prescription
  sourceDepartment: "pharmacy" | "laboratory" | "injection_room" | "doctor"
  billId?: string
}

export interface HMOClaim {
  id: string
  patientId: string
  patientName: string
  hmoProvider: string
  policyNumber?: string
  date: string
  status: "pending" | "approved" | "rejected" | "completed"
  items: ClaimItem[]
  approvalCode?: string
  rejectionReason?: string
  notes?: string
  sourceDepartment: "pharmacy" | "laboratory" | "injection_room" | "doctor"
  sourceId: string // ID of the original request/prescription
  processedBy?: string
  processedDate?: string
}

// Update the Bill interface to include discount information
// export interface Bill {
//   id: string
//   patientId: string
//   patientName: string
//   date: string
//   // Status values:
//   // - "pending": Bill awaiting payment
//   // - "paid": Bill has been paid
//   // - "cancelled": Bill has been cancelled
//   // - "hmo_pending": Bill is pending HMO approval
//   // - "billed": Bill has been sent to billing
//   // - "dispensed": Bill has been sent to billing
//   status: "pending" | "paid" | "cancelled" | "hmo_pending" | "billed" | "dispensed"
//   type: "consultation" | "pharmacy" | "laboratory" | "medication" | "deposit" | "other"
//   destination?: "injection" | "final" | null
//   items: BillItem[]
//   paymentMethod?: "cash" | "card" | "transfer" | "hmo" | "balance"
//   paymentReference?: string
//   paymentDate?: string
//   processedBy?: string
//   source?: string
//   discount?: number // Discount percentage applied to the bill
//   discountReason?: string // Reason for discount (e.g., "Staff Discount")
//   originalTotal?: number // Original total before discount
// }

// Update the Bill interface to include visitId
export interface Bill {
  [x: string]: any
  id: string
  patientId: string
  patientName: string
  date: string
  // Status values:
  // - "pending": Bill awaiting payment
  // - "paid": Bill has been paid
  // - "cancelled": Bill has been cancelled
  // - "hmo_pending": Bill is pending HMO approval
  // - "billed": Bill has been sent to billing
  // - "dispensed": Medications have been dispensed (for HMO patients)
  status: "pending" | "paid" | "cancelled" | "hmo_pending" | "billed" | "dispensed"
  type: "consultation" | "pharmacy" | "laboratory" | "medication" | "deposit" | "vaccination" | "other"
  destination?: "injection" | "final" | null
  items: BillItem[]
  paymentMethod?: "cash" | "card" | "transfer" | "hmo" | "balance"
  paymentReference?: string
  paymentDate?: string
  processedBy?: string
  source?: string
  discount?: number // Discount percentage applied to the bill
  discountReason?: string // Reason for discount (e.g., "Staff Discount")
  originalTotal?: number // Original total before discount
  visitId?: string // Reference to the visit this bill belongs to
  allItemsDispensed?: boolean
}

// Interface for prescription items with payment status
export interface PrescriptionItem {
  id: string
  medicineId: string
  name: string
  dosage: string
  form: string
  quantity: number
  price: number
  paymentStatus: "pending" | "paid" | "dispensed"
  dispensed: boolean
  notes?: string
}

// Update the Prescription interface to include more detailed status tracking
export interface Prescription {
  id: string
  patientId: string
  patientName: string
  doctorName: string
  date: string
  status: "pending" | "billed" | "paid" | "dispensed" | "hmo_pending" | "hmo_approved"
  displayStatus: string // Add this field for UI display
  items: PrescriptionItem[]
  paymentType: "cash" | "hmo"
  hmoProvider?: string
  destination?: "injection" | "final"
  notes?: string
  doctorPrescriptions?: string[]
  visitId?: string // Add this to track which visit this prescription belongs to
  allItemsDispensed?: boolean // Track if all items have been dispensed
}

// Add a new interface for lab test normal ranges
export interface LabTestRange {
  name: string
  normalRange: string
  unit?: string
  category?: string
}

// Update the LabTest interface to include normal ranges
// export interface LabTest {
//   id: string
//   name: string
//   category: string
//   price: number
//   active: boolean
//   description?: string
//   normalRange?: string
//   ranges?: LabTestRange[]
// }

// Update the lab test result in the LabRequest interface
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

// Generate mock bills with deposit type
const generateMockDeposits = (): Bill[] => {
  return [
    {
      id: "BILL-DEP-1001",
      patientId: "P-1001",
      patientName: "John Doe",
      date: "2025-03-01",
      type: "deposit",
      status: "paid",
      items: [
        {
          id: "ITEM-DEP-1001",
          description: "Account Deposit",
          quantity: 1,
          unitPrice: 5000,
        },
      ],
      paymentMethod: "cash",
      paymentReference: "DEP-20250301-001",
      paymentDate: "2025-03-01",
      processedBy: "Nurse Amina",
    },
  ]
}

const generateMockAppointments = (): Appointment[] => {
  return []
}

const generateMockHMOClaims = (): HMOClaim[] => {
  return []
}

// Store interface
interface AppStore {
  // Patients
  patients: Patient[]
  getPatientById: (id: string) => Patient | undefined
  addPatient: (patient: Patient) => void
  updatePatient: (updatedPatient: Patient) => void
  searchPatients: (term: string, searchBy: string) => Patient[]
  updatePatientBalance: (patientId: string, amount: number) => void

  // Staff
  staff: Staff[]
  getStaffById: (id: string) => Staff | undefined
  getStaffByUsername: (username: string) => Staff | undefined
  addStaff: (staff: Staff) => void
  updateStaff: (updatedStaff: Staff) => void
  searchStaff: (term: string, searchBy: string) => Staff[]
  getStaffByRole: (role: StaffRole) => Staff[]
  getActiveStaffByRole: (role: StaffRole) => Staff[]
  generateStaffId: () => string

  // Bills
  bills: Bill[]
  getBillById: (id: string) => Bill | undefined
  addBill: (bill: Bill) => void
  updateBill: (updatedBill: Bill) => void
  getPendingBills: () => Bill[]
  getPaidBills: () => Bill[]
  getCancelledBills: () => Bill[]
  getTodaysPaidBills: () => Bill[]
  getPatientBills: (patientId: string) => Bill[]
  calculateTotal: (items: BillItem[]) => number
  createDepositBill: (patientId: string, amount: number, staffName: string) => Bill
  getDepositBills: () => Bill[]
  getPatientDepositBills: (patientId: string) => Bill[]

  // Appointments
  appointments: Appointment[]
  getAppointmentById: (id: string) => Appointment | undefined
  addAppointment: (appointment: Appointment) => void
  updateAppointment: (updatedAppointment: Appointment) => void
  getPatientAppointments: (patientId: string) => Appointment[]
  getAppointmentByVaccinationSessionId: (sessionId: string) => Appointment | undefined

  // Lab Tests
  labTests: LabTest[]
  getLabTestById: (id: string) => LabTest | undefined
  addLabTest: (labTest: LabTest) => void
  updateLabTest: (updatedLabTest: LabTest) => void
  deleteLabTest: (id: string) => void
  searchLabTests: (term: string) => LabTest[]
  getActiveLabTests: () => LabTest[]
  generateLabTestId: () => string

  // Lab Requests
  labRequests: LabRequest[]
  getLabRequestById: (id: string) => LabRequest | undefined
  addLabRequest: (labRequest: LabRequest) => void
  updateLabRequest: (updatedLabRequest: LabRequest) => void
  getLabRequestsByStatus: (status: LabRequest["status"]) => LabRequest[]
  getLabRequestsByPatientId: (patientId: string) => LabRequest[]
  generateLabRequestId: () => string
  getPatientsWithLabRequests: () => Patient[]

  // HMO Claims
  hmoClaims: HMOClaim[]
  getHMOClaimById: (id: string) => HMOClaim | undefined
  addHMOClaim: (claim: HMOClaim) => void
  updateHMOClaim: (updatedClaim: HMOClaim) => void
  getHMOClaimsByStatus: (status: HMOClaim["status"]) => HMOClaim[]
  getHMOClaimsByPatientId: (patientId: string) => HMOClaim[]
  generateHMOClaimId: (prefix: string) => string
  generateClaimItems: (
    patientId: string,
    sourceId: string,
    sourceDepartment: HMOClaim["sourceDepartment"],
  ) => ClaimItem[]
  processHMOClaim: (claim: HMOClaim, action: "approved" | "rejected", staffName?: string) => void
  refreshHMOClaims: () => void

  // HMO Providers
  hmoProviders: HMOProvider[]
  getHMOProviderById: (id: string) => HMOProvider | undefined
  addHMOProvider: (provider: HMOProvider) => void
  updateHMOProvider: (updatedProvider: HMOProvider) => void
  getActiveHMOProviders: () => HMOProvider[]
  generateHMOProviderId: () => string

  // Departments
  departments: Department[]
  getDepartmentById: (id: string) => Department | undefined
  addDepartment: (department: Department) => void
  updateDepartment: (updatedDepartment: Department) => void
  getActiveDepartments: () => Department[]
  generateDepartmentId: () => string

  // Hospital Settings
  hospitalSettings: HospitalSettings
  updateHospitalSettings: (settings: HospitalSettings) => void

  // Utility functions
  generatePatientId: () => string
  generateBillId: () => string
  generateDepositBillId: () => string
  generateAppointmentId: () => string
  formatCurrency: (amount: number) => string

  // Add these new methods
  createPatientFromStaff: (staffId: string) => Patient | null
  applyStaffDiscount: (billId: string) => void
  isStaffPatient: (patientId: string) => boolean

  // New methods for doctor changes
  canChangeDoctor: (billId: string) => boolean
  getConsultationFeeByDoctorId: (doctorId: string) => number
  changeConsultationDoctor: (
    billId: string,
    newDoctorId: string,
    consultationType: string,
    staffName?: string,
  ) => { success: boolean; message: string; newBillId?: string }
  logDoctorChange: (
    patientId: string,
    fromDoctorId: string,
    toDoctorId: string,
    priceDifference: number,
    billId?: string,
    notes?: string,
  ) => void
  getPatientDoctorChanges: (patientId: string) => Visit["doctorChanges"] | undefined

  // Add this new method
  updatePrescriptionItems: (billId: string, items: PrescriptionItem[]) => void

  // Add this new method to the AppStore interface (around line 400, with the other method declarations)
  cancelConsultation: (appointmentId: string, staffName?: string) => { success: boolean; message: string }
  // Add a new method to the AppStore interface (around line 400, with the other method declarations)
  sendInjectionsToInjectionRoom: (prescriptionId: string, patientId: string, injections: PrescriptionItem[]) => void
}

// Create the store
export const useAppStore = create<AppStore>((set, get) => ({
  // Initialize with mock data
  patients: generateMockPatients(),
  bills: [...generateMockBills(), ...generateMockDeposits()],
  appointments: generateMockAppointments(),
  staff: generateMockStaff(),
  labTests: generateMockLabTests(),
  labRequests: generateMockLabRequests(),
  hmoClaims: generateMockHMOClaims(),
  hmoProviders: generateMockHMOProviders(),
  departments: generateMockDepartments(),
  hospitalSettings: defaultHospitalSettings,

  // Patient functions
  getPatientById: (id: string) => get().patients.find((patient) => patient.id === id),

  addPatient: (patient: Patient) =>
    set((state) => ({
      patients: [...state.patients, { ...patient, balance: patient.balance || 0 }],
    })),

  updatePatient: (updatedPatient: Patient) =>
    set((state) => ({
      patients: state.patients.map((patient) => (patient.id === updatedPatient.id ? updatedPatient : patient)),
    })),

  searchPatients: (term: string, searchBy: string) => {
    const patients = get().patients
    if (!term) return []

    switch (searchBy) {
      case "name":
        return patients.filter((patient) => patient.name.toLowerCase().includes(term.toLowerCase()))
      case "id":
        return patients.filter((patient) => patient.id.toLowerCase().includes(term.toLowerCase()))
      case "phone":
        return patients.filter((patient) => patient.phone.includes(term))
      default:
        return []
    }
  },

  // New function to update patient balance
  updatePatientBalance: (patientId: string, amount: number) =>
    set((state) => ({
      patients: state.patients.map((patient) => {
        if (patient.id === patientId) {
          return {
            ...patient,
            balance: patient.balance + amount,
          }
        }
        return patient
      }),
    })),

  // Staff functions
  getStaffById: (id: string) => get().staff.find((staff) => staff.id === id),

  getStaffByUsername: (username: string) => get().staff.find((staff) => staff.username === username),

  addStaff: (staff: Staff) =>
    set((state) => ({
      staff: [...state.staff, staff],
    })),

  updateStaff: (updatedStaff: Staff) =>
    set((state) => ({
      staff: state.staff.map((staff) => (staff.id === updatedStaff.id ? updatedStaff : staff)),
    })),

  searchStaff: (term: string, searchBy: string) => {
    const staff = get().staff
    if (!term) return []

    switch (searchBy) {
      case "name":
        return staff.filter((s) => s.name.toLowerCase().includes(term.toLowerCase()))
      case "id":
        return staff.filter((s) => s.id.toLowerCase().includes(term.toLowerCase()))
      case "username":
        return staff.filter((s) => s.username.toLowerCase().includes(term.toLowerCase()))
      case "role":
        return staff.filter((s) => s.role.toLowerCase().includes(term.toLowerCase()))
      default:
        return []
    }
  },

  getStaffByRole: (role: StaffRole) => get().staff.filter((staff) => staff.role === role),

  getActiveStaffByRole: (role: StaffRole) =>
    get().staff.filter((staff) => staff.role === role && staff.status === "active"),

  generateStaffId: () => {
    const staff = get().staff
    const lastId = staff.length > 0 ? Number.parseInt(staff[staff.length - 1].id.split("-")[1]) : 0
    return `STAFF-${String(lastId + 1).padStart(3, "0")}`
  },

  // Bill functions
  getBillById: (id: string) => get().bills.find((bill) => bill.id === id),

  addBill: (bill: Bill) => {
    set((state) => {
      // Add bill to bills array
      const newBills = [...state.bills, bill]

      // Update patient's bills array
      const updatedPatients = state.patients.map((patient) => {
        if (patient.id === bill.patientId) {
          return {
            ...patient,
            bills: [...(patient.bills || []), bill.id],
          }
        }
        return patient
      })

      // For HMO patients with consultation bills, create an HMO claim immediately
      if (bill.type === "consultation" && bill.status === "paid") {
        const patient = state.patients.find((p) => p.id === bill.patientId)
        if (patient && patient.patientType === "hmo") {
          // Create a visit record if it doesn't exist
          const updatedPatient = { ...patient }
          if (!updatedPatient.visits || updatedPatient.visits.length === 0) {
            updatedPatient.visits = [
              {
                id: `V-${Date.now()}`,
                date: bill.date,
                type: "Consultation",
                doctor: bill.items[0]?.description.includes("Fee")
                  ? bill.items[0].description.split(" Fee")[0]
                  : "Doctor",
                diagnosis: "With HMO: Initial Consultation",
                vitals: {
                  bloodPressure: "",
                  temperature: "",
                  heartRate: "",
                  respiratoryRate: "",
                  oxygenSaturation: "",
                  weight: "",
                  height: "",
                },
              },
            ]
          } else {
            // Update the latest visit diagnosis to indicate it's with HMO
            const updatedVisits = [...updatedPatient.visits]
            const latestVisitIndex = updatedVisits.length - 1
            updatedVisits[latestVisitIndex] = {
              ...updatedVisits[latestVisitIndex],
              diagnosis: "With HMO: Initial Consultation",
            }
            updatedPatient.visits = updatedVisits
          }

          // Update the patient with the new visit info
          updatedPatients[updatedPatients.findIndex((p) => p.id === patient.id)] = updatedPatient

          // Create HMO claim - ONLY create one claim using the bill ID
          const claimId = `HMO-CONS-${patient.id}-${bill.id}`
          const consultationItems = [
            {
              id: `ITEM-CONS-${Date.now()}`,
              description: bill.items[0]?.description || "Consultation Fee",
              quantity: 1,
              unitPrice: bill.items[0]?.unitPrice || 0,
              approved: false,
              type: "consultation" as const,
              sourceId: bill.id,
              sourceDepartment: "doctor" as const,
            },
          ]

          // Add the claim to hmoClaims
          setTimeout(() => {
            get().addHMOClaim({
              id: claimId,
              patientId: patient.id,
              patientName: patient.name,
              hmoProvider: patient.hmoProvider || "Unknown HMO",
              date: bill.date,
              status: "pending" as const,
              items: consultationItems,
              sourceDepartment: "doctor" as const,
              sourceId: bill.id,
            })
          }, 0)
        }
      }

      return { bills: newBills, patients: updatedPatients }
    })
  },

  updateBill: (updatedBill: Bill) =>
    set((state) => ({
      bills: state.bills.map((bill) => (bill.id === updatedBill.id ? updatedBill : bill)),
    })),

  getPendingBills: () => get().bills.filter((bill) => bill.status === "pending"),

  getPaidBills: () => get().bills.filter((bill) => bill.status === "paid"),

  getCancelledBills: () => get().bills.filter((bill) => bill.status === "cancelled"),

  getTodaysPaidBills: () => {
    const today = new Date().toISOString().split("T")[0]
    return get().bills.filter((bill) => bill.status === "paid" && bill.paymentDate === today)
  },

  getPatientBills: (patientId: string) => get().bills.filter((bill) => bill.patientId === patientId),

  calculateTotal: (items: BillItem[]) => items.reduce((total, item) => total + item.quantity * item.unitPrice, 0),

  // New function to create a deposit bill
  createDepositBill: (patientId: string, amount: number, staffName: string) => {
    const patient = get().getPatientById(patientId)
    if (!patient) throw new Error("Patient not found")

    const today = new Date().toISOString().split("T")[0]
    const billId = get().generateDepositBillId()

    const depositBill: Bill = {
      id: billId,
      patientId,
      patientName: patient.name,
      date: today,
      type: "deposit",
      status: "paid",
      items: [
        {
          id: `ITEM-DEP-${Date.now()}`,
          description: "Account Deposit",
          quantity: 1,
          unitPrice: amount,
        },
      ],
      paymentMethod: "cash", // Default to cash, can be updated later
      paymentReference: `DEP-${today.replace(/-/g, "")}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`,
      paymentDate: today,
      processedBy: staffName,
    }

    // Add the bill to the store
    get().addBill(depositBill)

    // Update the patient's balance
    get().updatePatientBalance(patientId, amount)

    return depositBill
  },

  // New function to get all deposit bills
  getDepositBills: () => get().bills.filter((bill) => bill.type === "deposit"),

  // New function to get deposit bills for a specific patient
  getPatientDepositBills: (patientId: string) =>
    get().bills.filter((bill) => bill.patientId === patientId && bill.type === "deposit"),

  // Appointment functions
  getAppointmentById: (id: string) => get().appointments.find((appointment) => appointment.id === id),

  addAppointment: (appointment: Appointment) =>
    set((state) => ({
      appointments: [...state.appointments, appointment],
    })),

  updateAppointment: (updatedAppointment: Appointment) =>
    set((state) => ({
      appointments: state.appointments.map((appointment) =>
        appointment.id === updatedAppointment.id ? updatedAppointment : appointment,
      ),
    })),

  getPatientAppointments: (patientId: string) =>
    get().appointments.filter((appointment) => appointment.patientId === patientId),

  // Lab Test functions
  getLabTestById: (id: string) => get().labTests.find((test) => test.id === id),

  addLabTest: (labTest: LabTest) =>
    set((state) => ({
      labTests: [...state.labTests, labTest],
    })),

  updateLabTest: (updatedLabTest: LabTest) =>
    set((state) => ({
      labTests: state.labTests.map((test) => (test.id === updatedLabTest.id ? updatedLabTest : test)),
    })),

  deleteLabTest: (id: string) =>
    set((state) => ({
      labTests: state.labTests.map((test) => (test.id === id ? { ...test, active: false } : test)),
    })),

  searchLabTests: (term: string) => {
    const labTests = get().labTests
    if (!term) return labTests.filter((test) => test.active)

    return labTests.filter(
      (test) =>
        test.active &&
        (test.name.toLowerCase().includes(term.toLowerCase()) ||
          test.category.toLowerCase().includes(term.toLowerCase())),
    )
  },

  getActiveLabTests: () => get().labTests.filter((test) => test.active),

  generateLabTestId: () => {
    const labTests = get().labTests
    const lastId = labTests.length > 0 ? Number.parseInt(labTests[labTests.length - 1].id.split("-")[2]) : 0
    return `LAB-TEST-${String(lastId + 1).padStart(3, "0")}`
  },

  // Lab Request functions
  getLabRequestById: (id: string) => get().labRequests.find((request) => request.id === id),

  addLabRequest: (labRequest: LabRequest) =>
    set((state) => {
      // Add the lab request to the array
      const updatedLabRequests = [...state.labRequests, labRequest]

      // Check if this is for an HMO patient
      const patient = state.patients.find((p) => p.id === labRequest.patientId)

      if (patient && patient.patientType === "hmo") {
        // For HMO patients, don't automatically mark as paid
        // Instead, create a claim and send to HMO desk first
        const claimId = `HMO-LAB-${labRequest.id}`

        // Create claim items from lab tests
        const claimItems = labRequest.tests.map((test) => ({
          id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          description: test.name,
          quantity: 1,
          unitPrice: test.price,
          approved: false,
          type: "lab" as const,
          sourceId: labRequest.id,
          sourceDepartment: "laboratory" as const,
        }))

        // Add the claim to hmoClaims
        setTimeout(() => {
          get().addHMOClaim({
            id: claimId,
            patientId: patient.id,
            patientName: patient.name,
            hmoProvider: patient.hmoProvider || "Unknown HMO",
            date: new Date().toISOString().split("T")[0],
            status: "pending" as const,
            items: claimItems,
            sourceDepartment: "laboratory" as const,
            sourceId: labRequest.id,
          })
        }, 0)

        // Update the patient's visit to indicate it's with HMO desk
        if (patient.visits && patient.visits.length > 0) {
          const updatedVisits = [...patient.visits]
          const latestVisitIndex = updatedVisits.length - 1

          // Update the diagnosis to indicate it's with HMO desk
          updatedVisits[latestVisitIndex] = {
            ...updatedVisits[latestVisitIndex],
            diagnosis: `With HMO: ${updatedVisits[latestVisitIndex].diagnosis.split(": ")[1] || updatedVisits[latestVisitIndex].diagnosis}`,
          }

          // Update the patient
          const updatedPatients = state.patients.map((p) => (p.id === patient.id ? { ...p, visits: updatedVisits } : p))

          return { labRequests: updatedLabRequests, patients: updatedPatients }
        }
      }

      return { labRequests: updatedLabRequests }
    }),

  updateLabRequest: (updatedLabRequest: LabRequest) =>
    set((state) => {
      // Update lab requests
      const updatedLabRequests = state.labRequests.map((request) =>
        request.id === updatedLabRequest.id ? updatedLabRequest : request,
      )

      // If the lab request is completed, update the patient's visit record
      if (updatedLabRequest.status === "completed") {
        const patient = state.patients.find((p) => p.id === updatedLabRequest.patientId)

        if (patient && patient.visits && patient.visits.length > 0) {
          // Get the latest visit
          const latestVisitIndex = patient.visits.length - 1
          const latestVisit = patient.visits[latestVisitIndex]

          // Update the visit with lab results
          const updatedVisit = {
            ...latestVisit,
            labData: updatedLabRequest,
            labTests: updatedLabRequest.tests.map((test) => ({
              name: test.name,
              result: test.result || "No result recorded",
              date: updatedLabRequest.date,
            })),
            // If the diagnosis was "With Laboratory", update it to "Pending" to send back to doctor
            // This will make the patient appear in the doctor's queue
            diagnosis: latestVisit.diagnosis.startsWith("With Laboratory:") ? "Pending" : latestVisit.diagnosis,
            // Preserve the original diagnosis and notes in the visit record
            originalDiagnosis: latestVisit.diagnosis.startsWith("With Laboratory:")
              ? latestVisit.diagnosis
              : latestVisit.originalDiagnosis,
          }

          // Update the patient's visits
          const updatedVisits = [...patient.visits]
          updatedVisits[latestVisitIndex] = updatedVisit

          // Update the patient
          const updatedPatients = state.patients.map((p) => (p.id === patient.id ? { ...p, visits: updatedVisits } : p))

          return {
            labRequests: updatedLabRequests,
            patients: updatedPatients,
          }
        }
      }

      return { labRequests: updatedLabRequests }
    }),

  getLabRequestsByStatus: (status: LabRequest["status"]) =>
    get().labRequests.filter((request) => request.status === status),

  getLabRequestsByPatientId: (patientId: string) =>
    get().labRequests.filter((request) => request.patientId === patientId),

  generateLabRequestId: () => {
    const labRequests = get().labRequests
    const lastId = labRequests.length > 0 ? Number.parseInt(labRequests[labRequests.length - 1].id.split("-")[2]) : 0
    return `LAB-REQ-${String(lastId + 1).padStart(3, "0")}`
  },

  getPatientsWithLabRequests: () => {
    const patients = get().patients
    const labRequests = get().labRequests

    // Get patients who have lab requests
    return patients.filter(
      (patient) =>
        // Check if patient has a visit with a diagnosis that starts with "With Laboratory"
        (patient.visits && patient.visits.some((visit) => visit.diagnosis.startsWith("With Laboratory:"))) ||
        // Or check if patient has a lab request
        labRequests.some((request) => request.patientId === patient.id),
    )
  },

  // HMO Claim functions
  getHMOClaimById: (id: string) => get().hmoClaims.find((claim) => claim.id === id),

  addHMOClaim: (claim: HMOClaim) =>
    set((state) => ({
      hmoClaims: [...state.hmoClaims, claim],
    })),

  updateHMOClaim: (updatedClaim: HMOClaim) =>
    set((state) => ({
      hmoClaims: state.hmoClaims.map((claim) => (claim.id === updatedClaim.id ? updatedClaim : claim)),
    })),

  getHMOClaimsByStatus: (status: HMOClaim["status"]) => get().hmoClaims.filter((claim) => claim.status === status),

  getHMOClaimsByPatientId: (patientId: string) => get().hmoClaims.filter((claim) => claim.patientId === patientId),

  generateHMOClaimId: (prefix: string) => {
    const timestamp = new Date().getTime().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `HMO-${prefix}-${timestamp}-${random}`
  },

  generateClaimItems: (patientId: string, sourceId: string, sourceDepartment: HMOClaim["sourceDepartment"]) => {
    const items: ClaimItem[] = []
    const { bills, labRequests, patients } = get()

    // Find the patient
    const patient = patients.find((p) => p.id === patientId)
    if (!patient) return items

    if (sourceDepartment === "pharmacy") {
      // Get pharmacy bill items
      const bill = bills.find((b) => b.id === sourceId)
      if (bill) {
        return bill.items.map((item) => ({
          id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          approved: false,
          type: "medication",
          sourceId: bill.id,
          sourceDepartment: "pharmacy",
          billId: bill.id,
        }))
      }
    } else if (sourceDepartment === "laboratory") {
      // Get lab test items
      const labRequest = labRequests.find((lr) => lr.id === sourceId)
      if (labRequest) {
        return labRequest.tests.map((test) => ({
          id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          description: test.name,
          quantity: 1,
          unitPrice: test.price,
          approved: false,
          type: "lab",
          sourceId: labRequest.id,
          sourceDepartment: "laboratory",
        }))
      }
    } else if (sourceDepartment === "injection_room") {
      // Get injection items
      if (patient.visits) {
        const visit = patient.visits.find((v) => v.injectionData && v.injectionData.id === sourceId)
        if (visit && visit.injectionData) {
          return visit.injectionData.injections.map((inj) => ({
            id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            description: `${inj.name} ${inj.dosage} (${inj.route})`,
            quantity: inj.quantity,
            unitPrice: inj.price,
            approved: false,
            type: "injection",
            sourceId: visit.injectionData!.id,
            sourceDepartment: "injection_room",
          }))
        }
      }
    } else if (sourceDepartment === "doctor") {
      // Create a consultation item
      if (patient.visits) {
        const visit = patient.visits.find((v) => v.id === sourceId)
        if (visit) {
          // Get the doctor's department
          const doctor = get().staff.find((s) => s.name === visit.doctor)
          const department = doctor?.department?.toLowerCase() || "general medicine"

          // Determine the fee based on department
          let consultationFee = get().hospitalSettings.generalMedicineFee
          if (department === "pediatrics") {
            consultationFee = get().hospitalSettings.pediatricsFee
          } else if (["cardiology", "orthopedics", "obstetrics & gynecology", "ophthalmology"].includes(department)) {
            consultationFee = get().hospitalSettings.specialistFee
          }

          return [
            {
              id: `ITEM-CONS-${Date.now()}`,
              description: `Consultation with ${visit.doctor}`,
              quantity: 1,
              unitPrice: consultationFee,
              approved: false,
              type: "consultation",
              sourceId: visit.id,
              sourceDepartment: "doctor",
            },
          ]
        }
      }
    }

    return items
  },

  processHMOClaim: (claim: HMOClaim, action: "approved" | "rejected", staffName?: string) => {
    const { patients, bills, labRequests, updatePatient, updateBill, updateLabRequest, updateHMOClaim } = get()

    // Find the patient
    const patient = patients.find((p) => p.id === claim.patientId)
    if (!patient) return

    // Update the claim with current date and staff info
    const updatedClaim = {
      ...claim,
      status: action === "approved" ? ("completed" as const) : ("rejected" as const), // Approved claims are now marked as completed directly
      processedBy: staffName || "HMO Desk",
      processedDate: new Date().toISOString().split("T")[0],
    }

    // Update the claim in the store
    updateHMOClaim(updatedClaim)

    // Find the processHMOClaim function and update the doctor/consultation handling logic
    // Replace the existing doctor/consultation handling code in the processHMOClaim function with this:

    if (claim.sourceDepartment === "doctor" && claim.items.some((item) => item.type === "consultation")) {
      // This is an initial consultation approval
      const bill = bills.find((b) => b.id === claim.sourceId)
      if (bill) {
        if (action === "approved") {
          // Find the patient and update their visit to send to vitals
          if (patient.visits && patient.visits.length > 0) {
            const updatedVisits = [...patient.visits]
            const latestVisitIndex = updatedVisits.length - 1

            // Update the diagnosis to send to vitals
            updatedVisits[latestVisitIndex] = {
              ...updatedVisits[latestVisitIndex],
              diagnosis: "With Vitals: Initial Consultation",
              notes:
                (updatedVisits[latestVisitIndex].notes || "") +
                `\n\nHMO Desk (${new Date().toLocaleDateString()}): Initial consultation approved with code ${updatedClaim.approvalCode || "N/A"}.`,
            }

            // Update the patient
            updatePatient({
              ...patient,
              visits: updatedVisits,
            })
          }
        } else {
          // If rejected, update the visit to mark as cancelled
          if (patient.visits && patient.visits.length > 0) {
            const updatedVisits = [...patient.visits]
            const latestVisitIndex = updatedVisits.length - 1

            // Update the diagnosis to mark as cancelled
            updatedVisits[latestVisitIndex] = {
              ...updatedVisits[latestVisitIndex],
              diagnosis: "Cancelled",
              notes:
                (updatedVisits[latestVisitIndex].notes || "") +
                `\n\nHMO Desk (${new Date().toLocaleDateString()}): Initial consultation rejected. Reason: ${updatedClaim.rejectionReason || "No reason provided"}.`,
            }

            // Update the patient
            updatePatient({
              ...patient,
              visits: updatedVisits,
            })

            // Update the bill status to cancelled
            updateBill({
              ...bill,
              status: "cancelled" as const,
            })

            // Update any appointments related to this bill
            const appointment = get().appointments.find((a) => a.billId === bill.id)
            if (appointment) {
              get().updateAppointment({
                ...appointment,
                status: "cancelled" as const,
              })
            }
          }
        }
      }
    } else if (claim.sourceDepartment === "pharmacy") {
      // Existing pharmacy claim processing logic
      // Update pharmacy bill
      const bill = bills.find((b) => b.id === claim.sourceId)
      if (bill) {
        if (action === "approved") {
          // Mark bill as paid
          updateBill({
            ...bill,
            status: "paid",
            paymentMethod: "hmo",
            paymentReference: claim.approvalCode || "HMO-APPROVED",
            paymentDate: new Date().toISOString().split("T")[0],
            processedBy: staffName || "HMO Desk",
          })

          // Update patient's visit to mark as completed
          if (patient.visits && patient.visits.length > 0) {
            const updatedVisits = [...patient.visits]
            const latestVisitIndex = updatedVisits.length - 1

            // Ensure diagnosis exists before processing
            const latestVisit = updatedVisits[latestVisitIndex]
            if (latestVisit.diagnosis) {
              // Update the diagnosis to mark as completed
              updatedVisits[latestVisitIndex] = {
                ...latestVisit,
                diagnosis: latestVisit.diagnosis.startsWith("With HMO:")
                  ? latestVisit.diagnosis.split(": ")[1] // Remove the "With HMO:" prefix
                  : latestVisit.diagnosis,
                notes:
                  (latestVisit.notes || "") +
                  `\n\nHMO Desk (${new Date().toLocaleDateString()}): Claim approved with code ${updatedClaim.approvalCode || "N/A"}.`,
              }

              // Update the patient
              updatePatient({
                ...patient,
                visits: updatedVisits,
              })
            }
          }
        } else {
          // Mark bill as pending and update patient record
          updateBill({
            ...bill,
            status: "pending",
          })

          // Find the patient and update their visit
          if (patient.visits && patient.visits.length > 0) {
            const updatedVisits = [...patient.visits]
            const latestVisitIndex = updatedVisits.length - 1

            // Ensure diagnosis exists before processing
            const latestVisit = updatedVisits[latestVisitIndex]
            if (latestVisit.diagnosis) {
              // Update the diagnosis to send back to pharmacy
              updatedVisits[latestVisitIndex] = {
                ...latestVisit,
                diagnosis: `With Pharmacy: ${latestVisit.diagnosis.startsWith("With HMO:")
                  ? latestVisit.diagnosis.split(": ")[1]
                  : latestVisit.diagnosis
                  }`,
                notes:
                  (latestVisit.notes || "") +
                  `\n\nHMO Desk (${new Date().toLocaleDateString()}): Claim rejected. Reason: ${updatedClaim.rejectionReason || "No reason provided"}.`,
              }

              // Update the patient
              updatePatient({
                ...patient,
                visits: updatedVisits,
              })
            }
          }
        }
      }
    } else if (claim.sourceDepartment === "laboratory") {
      // Update lab request
      const labRequest = labRequests.find((lr) => lr.id === claim.sourceId)
      if (labRequest) {
        if (action === "approved") {
          // Mark lab request as paid/approved
          updateLabRequest({
            ...labRequest,
            status: "billed" as const,
            tests: labRequest.tests.map((test) => ({
              ...test,
              paymentStatus: "paid" as const,
            })),
          })

          // Update patient's visit to mark as approved
          if (patient.visits && patient.visits.length > 0) {
            const updatedVisits = [...patient.visits]
            const latestVisitIndex = updatedVisits.length - 1

            // Ensure diagnosis exists before processing
            const latestVisit = updatedVisits[latestVisitIndex]
            if (latestVisit.diagnosis) {
              // Update the diagnosis to send back to laboratory
              updatedVisits[latestVisitIndex] = {
                ...latestVisit,
                diagnosis: `With Laboratory: ${latestVisit.diagnosis.startsWith("With HMO:")
                  ? latestVisit.diagnosis.split(": ")[1]
                  : latestVisit.diagnosis
                  }`,
                notes:
                  (latestVisit.notes || "") +
                  `\n\nHMO Desk (${new Date().toLocaleDateString()}): Lab tests approved with code ${updatedClaim.approvalCode || "N/A"}.`,
              }

              // Update the patient
              updatePatient({
                ...patient,
                visits: updatedVisits,
              })
            }
          }
        } else {
          // Rejection handling remains the same
          // Mark lab request as pending and update patient record
          updateLabRequest({
            ...labRequest,
            status: "pending",
          })

          // Find the patient and update their visit
          if (patient.visits && patient.visits.length > 0) {
            const updatedVisits = [...patient.visits]
            const latestVisitIndex = updatedVisits.length - 1

            // Ensure diagnosis exists before processing
            const latestVisit = updatedVisits[latestVisitIndex]
            if (latestVisit.diagnosis) {
              // Update the diagnosis to send back to laboratory
              updatedVisits[latestVisitIndex] = {
                ...latestVisit,
                diagnosis: `With Laboratory: ${latestVisit.diagnosis.startsWith("With HMO:")
                  ? latestVisit.diagnosis.split(": ")[1]
                  : latestVisit.diagnosis
                  }`,
                notes:
                  (latestVisit.notes || "") +
                  `\n\nHMO Desk (${new Date().toLocaleDateString()}): Lab tests rejected. Reason: ${updatedClaim.rejectionReason || "No reason provided"}.`,
              }

              // Update the patient
              updatePatient({
                ...patient,
                visits: updatedVisits,
              })
            }
          }
        }
      }
    } else if (claim.sourceDepartment === "injection_room") {
      // Find the patient and update their injection data
      if (patient.visits && patient.visits.length > 0) {
        const updatedVisits = [...patient.visits]
        const visitWithInjection = updatedVisits.find((v) => v.injectionData && v.injectionData.id === claim.sourceId)

        if (visitWithInjection && visitWithInjection.injectionData) {
          const visitIndex = updatedVisits.indexOf(visitWithInjection)

          if (action === "approved") {
            // Update injection status to paid but keep patient in injection room
            // Update each injection's payment status based on approval
            const updatedInjections = visitWithInjection.injectionData.injections.map((inj) => {
              // Find if this injection is in the approved items
              const approvedItem = claim.items.find(
                (item) => item.description.includes(inj.name) && item.description.includes(inj.dosage) && item.approved,
              )

              return {
                ...inj,
                paymentStatus: approvedItem ? "paid" : inj.paymentStatus,
              }
            })

            updatedVisits[visitIndex] = {
              ...updatedVisits[visitIndex],
              // Keep the diagnosis as "With Injection Room" to ensure patient stays there
              diagnosis:
                "With Injection Room: " +
                (visitWithInjection.diagnosis?.startsWith("With HMO:")
                  ? visitWithInjection.diagnosis.split(": ")[1]
                  : visitWithInjection.diagnosis),
              injectionData: {
                ...updatedVisits[visitIndex].injectionData!,
                status: "paid", // Change status to paid so it appears in the paid tab
                injections: updatedInjections,
              },
              notes:
                (updatedVisits[visitIndex].notes || "") +
                `\n\nHMO Desk (${new Date().toLocaleDateString()}): Injections approved with code ${updatedClaim.approvalCode || "N/A"}.`,
            }
          } else {
            // Update the injection data to send back to injection room
            updatedVisits[visitIndex] = {
              ...updatedVisits[visitIndex],
              diagnosis: `With Injection Room: ${visitWithInjection.diagnosis.startsWith("With HMO:")
                ? visitWithInjection.diagnosis.split(": ")[1]
                : visitWithInjection.diagnosis
                }`,
              injectionData: {
                ...updatedVisits[visitIndex].injectionData!,
                status: "pending",
              },
              notes:
                (updatedVisits[visitIndex].notes || "") +
                `\n\nHMO Desk (${new Date().toLocaleDateString()}): Injections rejected. Reason: ${updatedClaim.rejectionReason || "No reason provided"}.`,
            }
          }

          // Update the patient
          updatePatient({
            ...patient,
            visits: updatedVisits,
          })
        }
      }
    }

    // Refresh claims to ensure UI is up to date
    get().refreshHMOClaims()
  },

  refreshHMOClaims: () => {
    const { patients, bills, labRequests, hmoClaims, addHMOClaim } = get()
    const existingClaimIds = new Set(hmoClaims.map((claim) => claim.id))
    const newClaims: HMOClaim[] = []
    const today = new Date().toISOString().split("T")[0]

    // Find the refreshHMOClaims function and update the pharmacyPatients filter
    // Around line 1000-1010, replace the existing pharmacyPatients filter with this:

    // Process pharmacy patients
    const pharmacyPatients = patients.filter((patient) => {
      if (!patient.visits || patient.visits.length === 0 || patient.patientType !== "hmo") return false
      const latestVisit = patient.visits[patient.visits.length - 1]
      return (
        latestVisit.diagnosis &&
        latestVisit.diagnosis.startsWith("With HMO:") &&
        latestVisit.diagnosis !== "With HMO: Initial Consultation" // Skip initial consultations as they're handled separately
      )
    })

    pharmacyPatients.forEach((patient) => {
      const latestVisit = patient.visits![patient.visits!.length - 1]

      // Find pharmacy bills for this patient
      const pharmacyBills = bills.filter(
        (bill) => bill.patientId === patient.id && bill.type === "pharmacy" && bill.status !== "cancelled",
      )

      pharmacyBills.forEach((bill) => {
        // Create pharmacy claim if it doesn't exist
        const pharmClaimId = `HMO-PHARM-${bill.id}`
        if (!existingClaimIds.has(pharmClaimId)) {
          // Create claim items from bill items
          const claimItems = get().generateClaimItems(patient.id, bill.id, "pharmacy")

          // Create a pharmacy claim
          newClaims.push({
            id: pharmClaimId,
            patientId: patient.id,
            patientName: patient.name,
            hmoProvider: patient.hmoProvider || "Unknown HMO",
            date: today,
            status: "pending",
            items: claimItems,
            sourceDepartment: "pharmacy",
            sourceId: bill.id,
          })
        }
      })
    })

    // Also add a specific check for initial consultations (around line 1080, after the pharmacy claims section)
    // Add this new section:

    // Process initial consultation claims for HMO patients
    const initialConsultationPatients = patients.filter((patient) => {
      if (!patient.visits || patient.visits.length === 0 || patient.patientType !== "hmo") return false
      const latestVisit = patient.visits[patient.visits.length - 1]
      return latestVisit.diagnosis === "With HMO: Initial Consultation"
    })

    initialConsultationPatients.forEach((patient) => {
      const latestVisit = patient.visits![patient.visits!.length - 1]

      // Find the bill associated with this consultation
      const consultationBill = bills.find(
        (b) =>
          b.patientId === patient.id &&
          b.type === "consultation" &&
          b.status === "paid" &&
          new Date(b.date).getTime() >= new Date(latestVisit.date).getTime() - 86400000, // Within 1 day
      )

      if (consultationBill) {
        // Create a consultation claim if it doesn't exist - ONLY using the bill ID
        const consClaimId = `HMO-CONS-${patient.id}-${consultationBill.id}`
        if (!existingClaimIds.has(consClaimId)) {
          // Create consultation claim items
          const consultationItems = [
            {
              id: `ITEM-CONS-${Date.now()}`,
              description: consultationBill.items[0]?.description || `Consultation with ${latestVisit.doctor}`,
              quantity: 1,
              unitPrice: consultationBill.items[0]?.unitPrice || get().hospitalSettings.generalMedicineFee,
              approved: false,
              type: "consultation" as const,
              sourceId: consultationBill.id,
              sourceDepartment: "doctor" as const,
            },
          ]

          // Create a consultation claim
          newClaims.push({
            id: consClaimId,
            patientId: patient.id,
            patientName: patient.name,
            hmoProvider: patient.hmoProvider || "Unknown HMO",
            date: today,
            status: "pending" as const,
            items: consultationItems,
            sourceDepartment: "doctor" as const,
            sourceId: consultationBill.id,
          })
        }
      }
    })

    // Process laboratory claims
    const labPatients = patients.filter((patient) => {
      if (patient.patientType !== "hmo") return false
      return labRequests.some((req) => req.patientId === patient.id && req.status === "completed")
    })

    labPatients.forEach((patient) => {
      const patientLabRequests = labRequests.filter((req) => req.patientId === patient.id && req.status === "completed")

      patientLabRequests.forEach((labRequest) => {
        const claimId = `HMO-LAB-${labRequest.id}`
        if (!existingClaimIds.has(claimId)) {
          // Create claim items from lab tests
          const claimItems = get().generateClaimItems(patient.id, labRequest.id, "laboratory")

          // Create a claim
          newClaims.push({
            id: claimId,
            patientId: patient.id,
            patientName: patient.name,
            hmoProvider: patient.hmoProvider || "Unknown HMO",
            date: today,
            status: "pending",
            items: claimItems,
            sourceDepartment: "laboratory",
            sourceId: labRequest.id,
          })
        }
      })
    })

    // Process injection room claims
    const injectionPatients = patients.filter((patient) => {
      if (patient.patientType !== "hmo" || !patient.visits || patient.visits.length === 0) return false
      return patient.visits.some(
        (visit) =>
          visit.injectionData &&
          (visit.injectionData.status === "completed" || visit.diagnosis.startsWith("With HMO:")),
      )
    })

    injectionPatients.forEach((patient) => {
      patient.visits!.forEach((visit) => {
        if (visit.injectionData) {
          const claimId = `HMO-INJ-${visit.injectionData.id}`
          if (!existingClaimIds.has(claimId)) {
            // Create claim items from injections
            const claimItems = get().generateClaimItems(patient.id, visit.injectionData.id, "injection_room")

            // Create a claim
            newClaims.push({
              id: claimId,
              patientId: patient.id,
              patientName: patient.name,
              hmoProvider: patient.hmoProvider || "Unknown HMO",
              date: today,
              status: "pending",
              items: claimItems,
              sourceDepartment: "injection_room",
              sourceId: visit.injectionData.id,
            })
          }
        }
      })
    })

    // Add new claims to the store
    newClaims.forEach((claim) => {
      addHMOClaim(claim)
    })
  },

  // HMO Providers
  getHMOProviderById: (id: string) => get().hmoProviders.find((provider) => provider.id === id),

  addHMOProvider: (provider: HMOProvider) =>
    set((state) => ({
      hmoProviders: [...state.hmoProviders, provider],
    })),

  updateHMOProvider: (updatedProvider: HMOProvider) =>
    set((state) => ({
      hmoProviders: state.hmoProviders.map((provider) =>
        provider.id === updatedProvider.id ? updatedProvider : provider,
      ),
    })),

  getActiveHMOProviders: () => get().hmoProviders.filter((provider) => provider.isActive),

  generateHMOProviderId: () => {
    const hmoProviders = get().hmoProviders
    const lastId = hmoProviders.length > 0 ? Number.parseInt(hmoProviders[hmoProviders.length - 1].id.split("-")[1]) : 0
    return `HMO-${String(lastId + 1).padStart(3, "0")}`
  },

  // Departments
  getDepartmentById: (id: string) => get().departments.find((department) => department.id === id),

  addDepartment: (department: Department) =>
    set((state) => ({
      departments: [...state.departments, department],
    })),

  updateDepartment: (updatedDepartment: Department) =>
    set((state) => ({
      departments: state.departments.map((department) =>
        department.id === updatedDepartment.id ? updatedDepartment : department,
      ),
    })),

  getActiveDepartments: () => get().departments.filter((department) => department.isActive),

  generateDepartmentId: () => {
    const departments = get().departments
    const lastId = departments.length > 0 ? Number.parseInt(departments[departments.length - 1].id.split("-")[1]) : 0
    return `DEPT-${String(lastId + 1).padStart(3, "0")}`
  },

  // Hospital Settings
  updateHospitalSettings: (settings: HospitalSettings) => set({ hospitalSettings: settings }),

  // Utility functions
  generatePatientId: () => {
    const patients = get().patients
    const lastId = patients.length > 0 ? Number.parseInt(patients[patients.length - 1].id.split("-")[1]) : 1000
    return `P-${lastId + 1}`
  },

  generateBillId: () => {
    const bills = get().bills.filter((bill) => !bill.id.includes("DEP"))
    const lastId = bills.length > 0 ? Number.parseInt(bills[bills.length - 1].id.split("-")[1]) : 1000
    return `BILL-${lastId + 1}`
  },

  generateDepositBillId: () => {
    const depositBills = get().bills.filter((bill) => bill.id.includes("DEP"))
    const lastId =
      depositBills.length > 0 ? Number.parseInt(depositBills[depositBills.length - 1].id.split("-")[2]) : 1000
    return `BILL-DEP-${lastId + 1}`
  },

  generateAppointmentId: () => {
    const appointments = get().appointments
    const lastId =
      appointments.length > 0 ? Number.parseInt(appointments[appointments.length - 1].id.split("-")[1]) : 1000
    return `A-${lastId + 1}`
  },

  formatCurrency: (amount: number) => `₦${amount.toLocaleString()}`,

  // Create a patient record from staff
  createPatientFromStaff: (staffId: string) => {
    const staff = get().getStaffById(staffId)
    if (!staff) return null

    // Check if a patient record already exists for this staff
    const existingPatient = get().patients.find((p) => p.isStaff && p.staffId === staffId)

    if (existingPatient) {
      return existingPatient
    }

    // Create a new patient ID
    const patientId = get().generatePatientId()

    // Extract age from staff if available, otherwise use a default
    let age = 30 // Default age
    if (staff.joinDate) {
      const joinYear = Number.parseInt(staff.joinDate.split("-")[0])
      const currentYear = new Date().getFullYear()
      // Rough estimate: assuming staff was ~25 when joining
      age = currentYear - joinYear + 25
    }

    // Create a new patient record
    const [firstName, ...lastNameParts] = staff.name.split(" ");
    const newPatient: Patient = {
      id: patientId,
      name: staff.name,
      firstName: firstName || "Unknown",
      lastName: lastNameParts.join(" ") || "Unknown",
      age: age,
      gender: "Unknown", // This would need to be updated manually
      phone: staff.phone || "",
      email: staff.email || "",
      address: "",
      lastVisit: new Date().toISOString().split("T")[0],
      patientType: "cash", // Default to cash patient
      bills: [],
      balance: 0,
      isStaff: true,
      staffId: staff.id,
    }

    // Add the patient to the store
    get().addPatient(newPatient)
    return newPatient
  },

  // Apply staff discount to a bill
  applyStaffDiscount: (billId: string) => {
    const bill = get().getBillById(billId)
    if (!bill) return

    const patient = get().getPatientById(bill.patientId)
    if (!patient || !patient.isStaff) return

    const staffDiscount = get().hospitalSettings.staffDiscount || 0

    if (staffDiscount > 0) {
      // Calculate original total
      const originalTotal = get().calculateTotal(bill.items)

      // Apply discount to each item
      const discountedItems = bill.items.map((item) => ({
        ...item,
        // We don't modify the unitPrice but instead store the discount at the bill level
      }))

      // Update the bill with discount information
      const updatedBill = {
        ...bill,
        items: discountedItems,
        discount: staffDiscount,
        discountReason: "Staff Discount",
        originalTotal: originalTotal,
      }

      // Update the bill in the store
      get().updateBill(updatedBill)
    }
  },

  // Check if a patient is a staff member
  isStaffPatient: (patientId: string) => {
    const patient = get().getPatientById(patientId)
    return patient ? !!patient.isStaff : false
  },

  // New methods for doctor changes
  canChangeDoctor: (billId: string) => {
    const bill = get().getBillById(billId)
    if (!bill || bill.type !== "consultation") return false

    // If the bill is not paid yet, it can be edited
    if (bill.status === "pending") return true

    // If the bill is paid, check if the patient has seen the doctor
    const appointment = get().appointments.find((a) => a.billId === billId)
    if (!appointment) return false

    // Get the patient
    const patient = get().getPatientById(bill.patientId)
    if (!patient || !patient.visits || patient.visits.length === 0) return true

    // Check the latest visit's diagnosis
    const latestVisit = patient.visits[patient.visits.length - 1]

    // If the diagnosis is still at the vitals stage or cash point stage, doctor can be changed
    return (
      latestVisit.diagnosis === "Pending" ||
      latestVisit.diagnosis.startsWith("With Cash Point:") ||
      latestVisit.diagnosis.startsWith("With Vitals:")
    )
  },

  getConsultationFeeByDoctorId: (doctorId: string) => {
    const doctor = get().getStaffById(doctorId)
    if (!doctor) return get().hospitalSettings.generalMedicineFee // Default to general medicine fee

    switch (doctor.department?.toLowerCase()) {
      case "pediatrics":
        return get().hospitalSettings.pediatricsFee
      case "general medicine":
        return get().hospitalSettings.generalMedicineFee
      case "cardiology":
      case "orthopedics":
      case "obstetrics & gynecology":
      case "ophthalmology":
        return get().hospitalSettings.specialistFee
      default:
        return get().hospitalSettings.generalMedicineFee
    }
  },

  changeConsultationDoctor: (billId: string, newDoctorId: string, consultationType: string, staffName?: string) => {
    const bill = get().getBillById(billId)
    if (!bill || bill.type !== "consultation") {
      return { success: false, message: "Invalid bill or bill type" }
    }

    // Check if doctor change is allowed
    if (!get().canChangeDoctor(billId)) {
      return { success: false, message: "Cannot change doctor after patient has seen the doctor" }
    }

    const appointment = get().appointments.find((a) => a.billId === billId)
    if (!appointment) {
      return { success: false, message: "No appointment found for this bill" }
    }

    const oldDoctorId = appointment.doctorId
    if (!oldDoctorId) {
      return { success: false, message: "No previous doctor found" }
    }

    const oldDoctor = get().getStaffById(oldDoctorId)
    const newDoctor = get().getStaffById(newDoctorId)
    if (!oldDoctor || !newDoctor) {
      return { success: false, message: "Doctor information not found" }
    }

    // Calculate price difference
    const oldPrice = get().getConsultationFeeByDoctorId(oldDoctorId)
    const newPrice = get().getConsultationFeeByDoctorId(newDoctorId)
    const priceDifference = newPrice - oldPrice

    // Get the patient to check their current position in the workflow
    const patient = get().getPatientById(bill.patientId)
    if (!patient) {
      return { success: false, message: "Patient not found" }
    }

    // Determine the patient's current position in the workflow
    let currentPosition = "unknown"
    let currentDiagnosis = ""

    if (patient.visits && patient.visits.length > 0) {
      const latestVisit = patient.visits[patient.visits.length - 1]
      currentDiagnosis = latestVisit.diagnosis || ""

      if (currentDiagnosis.startsWith("With Cash Point:")) {
        currentPosition = "billing"
      } else if (currentDiagnosis.startsWith("With Vitals:")) {
        currentPosition = "vitals"
      } else if (currentDiagnosis === "Pending") {
        currentPosition = "doctor"
      } else {
        // For any other status, we'll preserve it
        currentPosition = "other"
      }
    }

    console.log("Current patient position:", currentPosition)
    console.log("Current diagnosis:", currentDiagnosis)

    // If bill is pending, just update it
    if (bill.status === "pending") {
      // Update the bill
      get().updateBill({
        ...bill,
        items: [
          {
            ...bill.items[0],
            description: `${consultationType} Fee`,
            unitPrice: newPrice,
          },
          ...bill.items.slice(1),
        ],
      })

      // Update the appointment
      get().updateAppointment({
        ...appointment,
        doctorId: newDoctorId,
        doctor: newDoctor.name,
        consultationType: consultationType as any,
      })

      // Update the patient's visit with the new doctor while preserving their position
      if (patient.visits && patient.visits.length > 0) {
        const updatedVisits = [...patient.visits]
        const latestVisitIndex = updatedVisits.length - 1

        // Keep the same diagnosis (preserving their position) but update the doctor
        updatedVisits[latestVisitIndex] = {
          ...updatedVisits[latestVisitIndex],
          doctor: newDoctor.name,
          // IMPORTANT: Do not change the diagnosis here
        }

        // Update the patient
        get().updatePatient({
          ...patient,
          visits: updatedVisits,
        })
      }

      // Log the doctor change
      get().logDoctorChange(
        bill.patientId,
        oldDoctorId,
        newDoctorId,
        priceDifference,
        billId,
        `Doctor changed from ${oldDoctor.name} to ${newDoctor.name} before payment`,
      )

      return { success: true, message: "Doctor updated successfully" }
    }
    // If bill is paid, handle upgrade/downgrade
    else if (bill.status === "paid") {
      // Update the appointment
      get().updateAppointment({
        ...appointment,
        doctorId: newDoctorId,
        doctor: newDoctor.name,
        consultationType: consultationType as any,
      })

      // If price difference is positive (upgrade), create a new bill
      if (priceDifference > 0) {
        const newBillId = get().generateBillId()
        const upgradeBill = {
          id: newBillId,
          patientId: bill.patientId,
          patientName: bill.patientName,
          date: new Date().toISOString().split("T")[0],
          status: "pending" as const,
          type: "consultation" as const,
          items: [
            {
              id: `ITEM-${Date.now().toString().slice(-6)}`,
              description: `Consultation Upgrade: ${oldDoctor.name} to ${newDoctor.name}`,
              quantity: 1,
              unitPrice: priceDifference,
            },
          ],
        }

        get().addBill(upgradeBill)

        // For upgrades, if the patient has already paid, we need to send them back to billing
        // Update the patient's visit to reflect this
        if (patient.visits && patient.visits.length > 0) {
          const updatedVisits = [...patient.visits]
          const latestVisitIndex = updatedVisits.length - 1

          // CRITICAL FIX: Preserve the original diagnosis but add "With Cash Point:" prefix
          // This will send them back to billing
          let newDiagnosis = ""

          // If they're already at cash point or vitals, keep them there
          if (currentDiagnosis.startsWith("With Cash Point:")) {
            newDiagnosis = currentDiagnosis
          } else if (currentDiagnosis.startsWith("With Vitals:")) {
            newDiagnosis = currentDiagnosis
          } else {
            // Otherwise, send them to cash point
            newDiagnosis = `With Cash Point: Upgrade consultation from ${oldDoctor.name} to ${newDoctor.name}`
          }

          updatedVisits[latestVisitIndex] = {
            ...updatedVisits[latestVisitIndex],
            diagnosis: newDiagnosis,
            doctor: newDoctor.name, // Update the doctor name
          }

          console.log("New diagnosis after upgrade:", newDiagnosis)

          // Update the patient
          get().updatePatient({
            ...patient,
            visits: updatedVisits,
          })
        }

        // Log the doctor change
        get().logDoctorChange(
          bill.patientId,
          oldDoctorId,
          newDoctorId,
          priceDifference,
          newBillId,
          `Doctor upgraded from ${oldDoctor.name} to ${newDoctor.name} after payment. Patient sent back to billing.`,
        )

        return {
          success: true,
          message: `Doctor upgraded. New bill created for ₦${priceDifference.toLocaleString()}. Patient sent to billing.`,
          newBillId,
        }
      }
      // If price difference is negative (downgrade), add to patient balance
      else if (priceDifference < 0) {
        if (patient && patient.patientType === "cash") {
          // Add the absolute value of the difference to the patient's balance
          get().updatePatientBalance(patient.id, Math.abs(priceDifference))
        }

        // For downgrades, the patient stays at their current position in the workflow
        // We just need to update the doctor name
        if (patient && patient.visits && patient.visits.length > 0) {
          const updatedVisits = [...patient.visits]
          const latestVisitIndex = updatedVisits.length - 1

          // CRITICAL FIX: Keep the same diagnosis (preserving their position) but update the doctor
          updatedVisits[latestVisitIndex] = {
            ...updatedVisits[latestVisitIndex],
            doctor: newDoctor.name,
            // IMPORTANT: Do not change the diagnosis here
          }

          console.log("Preserving diagnosis after downgrade:", updatedVisits[latestVisitIndex].diagnosis)

          // Update the patient
          get().updatePatient({
            ...patient,
            visits: updatedVisits,
          })
        }

        // Log the doctor change
        get().logDoctorChange(
          bill.patientId,
          oldDoctorId,
          newDoctorId,
          priceDifference,
          billId,
          `Doctor downgraded from ${oldDoctor.name} to ${newDoctor.name} after payment. ₦${Math.abs(priceDifference).toLocaleString()} added to patient balance.`,
        )

        return {
          success: true,
          message: `Doctor downgraded. ₦${Math.abs(priceDifference).toLocaleString()} added to patient balance.`,
        }
      }
      // If no price difference, just update the appointment and doctor
      else {
        // Update the patient's visit with the new doctor while preserving their position
        if (patient.visits && patient.visits.length > 0) {
          const updatedVisits = [...patient.visits]
          const latestVisitIndex = updatedVisits.length - 1

          // CRITICAL FIX: Keep the same diagnosis (preserving their position) but update the doctor
          updatedVisits[latestVisitIndex] = {
            ...updatedVisits[latestVisitIndex],
            doctor: newDoctor.name,
            // IMPORTANT: Do not change the diagnosis here
          }

          console.log("Preserving diagnosis after same-price change:", updatedVisits[latestVisitIndex].diagnosis)

          // Update the patient
          get().updatePatient({
            ...patient,
            visits: updatedVisits,
          })
        }

        // Log the doctor change
        get().logDoctorChange(
          bill.patientId,
          oldDoctorId,
          newDoctorId,
          0,
          billId,
          `Doctor changed from ${oldDoctor.name} to ${newDoctor.name} (same price level)`,
        )

        return { success: true, message: "Doctor updated successfully (no price change)" }
      }
    }

    return { success: false, message: "Unable to process doctor change" }
  },

  logDoctorChange: (
    patientId: string,
    fromDoctorId: string,
    toDoctorId: string,
    priceDifference: number,
    billId?: string,
    notes?: string,
  ) => {
    const patient = get().getPatientById(patientId)
    if (!patient) return

    const fromDoctor = get().getStaffById(fromDoctorId)
    const toDoctor = get().getStaffById(toDoctorId)
    if (!fromDoctor || !toDoctor) return

    const doctorChange = {
      date: new Date().toISOString().split("T")[0],
      fromDoctor: fromDoctor.name,
      toDoctor: toDoctor.name,
      fromDepartment: fromDoctor.department,
      toDepartment: toDoctor.department,
      priceDifference,
      billId,
      notes,
    }

    set((state) => {
      const updatedPatients = state.patients.map((p) => {
        if (p.id === patientId) {
          // Get the latest visit or create a new one
          if (p.visits && p.visits.length > 0) {
            const updatedVisits = [...p.visits]
            const latestVisitIndex = updatedVisits.length - 1
            const latestVisit = updatedVisits[latestVisitIndex]

            // CRITICAL FIX: Add doctor change to the visit WITHOUT changing the diagnosis or status
            // This preserves the patient's position in the workflow
            updatedVisits[latestVisitIndex] = {
              ...latestVisit,
              doctorChanges: [...(latestVisit.doctorChanges || []), doctorChange],
              // IMPORTANT: Do NOT modify the diagnosis here as it would change the patient's position in the workflow
            }

            console.log("Adding doctor change without modifying diagnosis:", latestVisit.diagnosis)

            return {
              ...p,
              visits: updatedVisits,
            }
          }
          // If no visits, create a new one
          else {
            const newVisit: Visit = {
              id: `V-${Date.now()}`,
              date: new Date().toISOString().split("T")[0],
              type: "Consultation",
              doctor: toDoctor.name,
              diagnosis: "With Vitals: New consultation", // Send to vitals first
              vitals: {
                bloodPressure: "",
                temperature: "",
                heartRate: "",
                respiratoryRate: "",
                oxygenSaturation: "",
                weight: "",
                height: "",
              },
              doctorChanges: [doctorChange],
            }

            console.log("Creating new visit with diagnosis:", newVisit.diagnosis)

            return {
              ...p,
              visits: [newVisit],
            }
          }
        }
        return p
      })

      return { patients: updatedPatients }
    })
  },

  getPatientDoctorChanges: (patientId: string) => {
    const patient = get().getPatientById(patientId)
    if (!patient || !patient.visits || patient.visits.length === 0) return undefined

    // Get the latest visit
    const latestVisit = patient.visits[patient.visits.length - 1]
    return latestVisit.doctorChanges
  },

  updatePrescriptionItems: (billId: string, items: PrescriptionItem[]) => {
    const bill = get().getBillById(billId)
    if (!bill) return

    // Update the bill items to include the dispensed status
    const updatedBillItems = items.map((item) => ({
      id: item.id,
      description: `${item.medicineId} - ${item.name} ${item.dosage}`,
      quantity: item.quantity,
      unitPrice: item.price,
      dispensed: item.dispensed, // Store the dispensed status in the bill item
      paymentStatus: item.paymentStatus, // Store the payment status
    }))

    // Update the bill in the store
    set((state) => ({
      bills: state.bills.map((b) =>
        b.id === billId
          ? { ...b, items: updatedBillItems, allItemsDispensed: items.every((item) => item.dispensed) }
          : b,
      ),
    }))
  },

  // Add the implementation of the cancelConsultation method (around line 2000, with the other method implementations)
  cancelConsultation: (appointmentId: string, staffName?: string) => {
    const appointment = get().getAppointmentById(appointmentId)
    if (!appointment) {
      return { success: false, message: "Appointment not found" }
    }

    // Get the patient to determine if they're HMO or cash
    const patient = get().getPatientById(appointment.patientId)
    if (!patient) {
      return { success: false, message: "Patient not found" }
    }

    // Get the bill if it exists
    const bill = appointment.billId ? get().getBillById(appointment.billId) : null

    // Update appointment status
    get().updateAppointment({
      ...appointment,
      status: "cancelled" as const,
    })

    // Handle different scenarios based on patient type and payment status
    if (patient.patientType === "cash") {
      if (bill) {
        if (bill.status === "paid") {
          // For cash patients who have paid, refund to balance
          const billTotal = get().calculateTotal(bill.items)
          get().updatePatientBalance(patient.id, billTotal)

          // Update bill status
          get().updateBill({
            ...bill,
            status: "cancelled" as const,
            notes: `${bill.notes || ""}\nCancelled by ${staffName || "Reception"} on ${new Date().toISOString().split("T")[0]}. Amount refunded to patient balance.`,
          })

          // Update patient visit if exists
          if (patient.visits && patient.visits.length > 0) {
            const updatedVisits = [...patient.visits]
            const latestVisitIndex = updatedVisits.length - 1

            updatedVisits[latestVisitIndex] = {
              ...updatedVisits[latestVisitIndex],
              diagnosis: "Cancelled",
              notes: `${updatedVisits[latestVisitIndex].notes || ""}\n\nConsultation cancelled by ${staffName || "Reception"} on ${new Date().toISOString().split("T")[0]}. Payment refunded to balance.`,
            }

            get().updatePatient({
              ...patient,
              visits: updatedVisits,
            })
          }

          return {
            success: true,
            message: `Consultation cancelled. ₦${billTotal.toLocaleString()} refunded to patient balance.`,
          }
        } else {
          // For cash patients who haven't paid, just cancel the bill
          get().updateBill({
            ...bill,
            status: "cancelled" as const,
            notes: `${bill.notes || ""}\nCancelled by ${staffName || "Reception"} on ${new Date().toISOString().split("T")[0]}.`,
          })

          // Update patient visit if exists
          if (patient.visits && patient.visits.length > 0) {
            const updatedVisits = [...patient.visits]
            const latestVisitIndex = updatedVisits.length - 1

            updatedVisits[latestVisitIndex] = {
              ...updatedVisits[latestVisitIndex],
              diagnosis: "Cancelled",
              notes: `${updatedVisits[latestVisitIndex].notes || ""}\n\nConsultation cancelled by ${staffName || "Reception"} on ${new Date().toISOString().split("T")[0]}.`,
            }

            get().updatePatient({
              ...patient,
              visits: updatedVisits,
            })
          }

          return { success: true, message: "Consultation cancelled." }
        }
      }
    } else if (patient.patientType === "hmo") {
      // For HMO patients, just mark as cancelled without sending to HMO desk
      if (bill) {
        get().updateBill({
          ...bill,
          status: "cancelled" as const,
          notes: `${bill.notes || ""}\nCancelled by ${staffName || "Reception"} on ${new Date().toISOString().split("T")[0]}.`,
        })
      }

      // Update patient visit if exists
      if (patient.visits && patient.visits.length > 0) {
        const updatedVisits = [...patient.visits]
        const latestVisitIndex = updatedVisits.length - 1

        updatedVisits[latestVisitIndex] = {
          ...updatedVisits[latestVisitIndex],
          diagnosis: "Cancelled",
          notes: `${updatedVisits[latestVisitIndex].notes || ""}\n\nConsultation cancelled by ${staffName || "Reception"} on ${new Date().toISOString().split("T")[0]}.`,
        }

        get().updatePatient({
          ...patient,
          visits: updatedVisits,
        })
      }

      return { success: true, message: "HMO consultation cancelled." }
    }

    return { success: true, message: "Consultation cancelled." }
  },
  // Add the implementation of the sendInjectionsToInjectionRoom method (around line 2000, with the other method implementations)
  sendInjectionsToInjectionRoom: (prescriptionId: string, patientId: string, injections: PrescriptionItem[]) => {
    const patient = get().getPatientById(patientId)
    if (!patient || !patient.visits || !patient.visits.length) return

    // Get the latest visit
    const latestVisit = patient.visits[patient.visits.length - 1]
    const latestVisitIndex = patient.visits.length - 1

    // Create individual bills for each injection
    const injectionBills: string[] = []
    const updatedInjections = injections.map((item) => {
      // Create a bill for this injection
      const billId = get().generateBillId()

      // Create the bill with appropriate status based on patient type
      const injectionBill = {
        id: billId,
        patientId: patient.id,
        patientName: patient.name,
        date: new Date().toISOString().split("T")[0],
        // For HMO patients, set status to hmo_pending instead of pending
        status: patient.patientType === "hmo" ? ("hmo_pending" as const) : ("pending" as const),
        type: "medication" as const,
        items: [
          {
            id: `ITEM-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 5)}`,
            description: `${item.medicineId} - ${item.name} ${item.dosage} (IV)`,
            quantity: item.quantity,
            unitPrice: item.price,
            dispensed: false, // Make sure this is explicitly false
          },
        ],
        source: "injection_room", // Mark the source as injection_room
        visitId: latestVisit.id,
      }

      // Add bill to store
      get().addBill(injectionBill)
      injectionBills.push(billId)

      // Return the injection with bill ID
      return {
        id: `INJ-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        medicineId: item.medicineId,
        name: item.name,
        dosage: item.dosage,
        form: item.form,
        route: "IV", // Default route, can be updated in injection room
        frequency: "Once", // Default frequency, can be updated in injection room
        quantity: item.quantity,
        price: item.price,
        administered: false,
        paymentStatus: "pending" as const,
        sentToCashPoint: true, // Mark as already sent to cash point
        billId: billId, // Set the bill ID
      }
    })

    // Create injection data structure with a unique ID
    const injectionData = {
      id: `INJ-${prescriptionId}-${Date.now().toString().slice(-6)}`,
      patientId: patient.id,
      patientName: patient.name,
      doctorName: latestVisit.doctor || "Unknown Doctor",
      date: new Date().toISOString().split("T")[0],
      status: "not_paid" as const, // Set to not_paid since bills are already created
      injections: updatedInjections,
      notes: "",
      doctorPrescriptions: latestVisit.prescriptions || [],
    }

    // Determine the appropriate diagnosis based on patient type
    const updatedDiagnosis =
      patient.patientType === "hmo"
        ? `With HMO: ${latestVisit.diagnosis?.split(": ")[1] || latestVisit.diagnosis || ""}`
        : `With Cash Point: ${latestVisit.diagnosis?.split(": ")[1] || latestVisit.diagnosis || ""}`

    // Update the patient's visit with injection data
    const updatedVisits = [...patient.visits]
    updatedVisits[latestVisitIndex] = {
      ...latestVisit,
      injectionData,
      diagnosis: updatedDiagnosis,
    }

    // Update the patient in the central store
    get().updatePatient({
      ...patient,
      visits: updatedVisits,
    })

    // For HMO patients, refresh claims to ensure the injection claim appears immediately
    if (patient.patientType === "hmo") {
      setTimeout(() => {
        get().refreshHMOClaims()
      }, 100)
    }
  },
  getAppointmentByVaccinationSessionId: (sessionId: string) => {
    return get().appointments.find((appointment) => (appointment as any).vaccinationSessionId === sessionId)
  },
}))
