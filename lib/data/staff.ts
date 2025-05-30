// Staff interface
export interface Staff {
  id: string
  name: string
  username: string
  role: StaffRole
  email: string
  phone?: string
  department?: string
  status: "active" | "inactive" | "on_leave"
  joinDate: string
}

// Define staff roles
export type StaffRole =
  | "super_admin"
  | "manager"
  | "registration"
  | "cash_point"
  | "vitals"
  | "doctor"
  | "injection_room"
  | "lab"
  | "pharmacist"
  | "hmo_desk"
  | "hmo_admin"
  | "records_officer"

// HMO Provider interface
export interface HMOProvider {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  isActive: boolean
}

// Department interface
export interface Department {
  id: string
  name: string
  head: string
  isActive: boolean
}

// Hospital Settings interface
export interface HospitalSettings {
  hospitalName: string
  address: string
  phone: string
  email: string
  taxId: string
  consultationFee: number
  generalMedicineFee: number
  pediatricsFee: number
  specialistFee: number
  autoBackup: boolean
  emailNotifications: boolean
  staffDiscount: number // Add staff discount percentage
  consultationTypes?: Array<{ value: string; label: string }>
  appointmentTimeSlots?: string[]
  appointmentTypes?: Array<{ value: string; label: string }>
}

// Generate mock staff data
export const generateMockStaff = (): Staff[] => {
  return [
    {
      id: "STAFF-001",
      name: "Admin User",
      username: "admin",
      role: "super_admin",
      email: "admin@hospital.com",
      department: "Administration",
      status: "active",
      joinDate: "2020-01-01",
    },
    {
      id: "STAFF-002",
      name: "Manager User",
      username: "manager",
      role: "manager",
      email: "manager@hospital.com",
      department: "Administration",
      status: "active",
      joinDate: "2020-01-15",
    },
    {
      id: "STAFF-003",
      name: "Dr. Smith",
      username: "doctor",
      role: "doctor",
      email: "doctor@hospital.com",
      phone: "08012345678",
      department: "General Medicine",
      status: "active",
      joinDate: "2020-02-01",
    },
    {
      id: "STAFF-004",
      name: "Dr. Johnson",
      username: "drjohnson",
      role: "doctor",
      email: "johnson@hospital.com",
      phone: "08023456789",
      department: "Pediatrics",
      status: "active",
      joinDate: "2020-03-15",
    },
    {
      id: "STAFF-005",
      name: "Dr. Adeyemi",
      username: "dradeyemi",
      role: "doctor",
      email: "adeyemi@hospital.com",
      phone: "08034567890",
      department: "Cardiology",
      status: "inactive",
      joinDate: "2020-04-10",
    },
    {
      id: "STAFF-006",
      name: "Dr. Okonkwo",
      username: "drokonkwo",
      role: "doctor",
      email: "okonkwo@hospital.com",
      phone: "08045678901",
      department: "Obstetrics & Gynecology",
      status: "on_leave",
      joinDate: "2020-05-20",
    },
    {
      id: "STAFF-007",
      name: "Nurse Johnson",
      username: "nurse",
      role: "vitals",
      email: "nurse@hospital.com",
      phone: "08056789012",
      department: "Nursing",
      status: "active",
      joinDate: "2020-06-15",
    },
    {
      id: "STAFF-008",
      name: "Jane Doe",
      username: "reception",
      role: "registration",
      email: "reception@hospital.com",
      phone: "08067890123",
      department: "Front Desk",
      status: "active",
      joinDate: "2020-07-01",
    },
    {
      id: "STAFF-009",
      name: "Cash Point User",
      username: "cashier",
      role: "cash_point",
      email: "cashier@hospital.com",
      phone: "08078901234",
      department: "Finance",
      status: "active",
      joinDate: "2020-08-10",
    },
    {
      id: "STAFF-010",
      name: "Injection Room User",
      username: "injection",
      role: "injection_room",
      email: "injection@hospital.com",
      phone: "08089012345",
      department: "Nursing",
      status: "active",
      joinDate: "2020-09-15",
    },
    {
      id: "STAFF-011",
      name: "Lab Technician",
      username: "lab",
      role: "lab",
      email: "lab@hospital.com",
      phone: "08090123456",
      department: "Laboratory",
      status: "active",
      joinDate: "2020-10-01",
    },
    {
      id: "STAFF-012",
      name: "Pharmacist User",
      username: "pharmacy",
      role: "pharmacist",
      email: "pharmacy@hospital.com",
      phone: "08001234567",
      department: "Pharmacy",
      status: "active",
      joinDate: "2020-11-15",
    },
    {
      id: "STAFF-013",
      name: "HMO Desk User",
      username: "hmodesk",
      role: "hmo_desk",
      email: "hmodesk@hospital.com",
      phone: "08012345678",
      department: "HMO",
      status: "active",
      joinDate: "2020-12-01",
    },
    {
      id: "STAFF-014",
      name: "HMO Admin User",
      username: "hmoadmin",
      role: "hmo_admin",
      email: "hmoadmin@hospital.com",
      phone: "08023456789",
      department: "HMO",
      status: "active",
      joinDate: "2021-01-15",
    },
    {
      id: "STAFF-015",
      name: "Records Officer",
      username: "records",
      role: "records_officer",
      email: "records@hospital.com",
      phone: "08034567890",
      department: "Records",
      status: "active",
      joinDate: "2021-02-01",
    },
    {
      id: "STAFF-016",
      name: "Dr. Nwachukwu",
      username: "drnwachukwu",
      role: "doctor",
      email: "nwachukwu@hospital.com",
      phone: "08045678901",
      department: "Orthopedics",
      status: "active",
      joinDate: "2021-03-15",
    },
  ]
}

// Generate mock HMO providers
export const generateMockHMOProviders = (): HMOProvider[] => {
  return [
    {
      id: "HMO-001",
      name: "AXA Mansard",
      contactPerson: "John Smith",
      email: "contact@axamansard.com",
      phone: "08012345678",
      isActive: true,
    },
    {
      id: "HMO-002",
      name: "Hygeia HMO",
      contactPerson: "Sarah Johnson",
      email: "contact@hygeiahmo.com",
      phone: "08023456789",
      isActive: true,
    },
    {
      id: "HMO-003",
      name: "Avon HMO",
      contactPerson: "Michael Brown",
      email: "contact@avonhmo.com",
      phone: "08034567890",
      isActive: true,
    },
    {
      id: "HMO-004",
      name: "Liberty Health",
      contactPerson: "Emma Wilson",
      email: "contact@libertyhealth.com",
      phone: "08045678901",
      isActive: false,
    },
  ]
}

// Generate mock departments
export const generateMockDepartments = (): Department[] => {
  return [
    {
      id: "DEPT-001",
      name: "General Medicine",
      head: "Dr. James Wilson",
      isActive: true,
    },
    {
      id: "DEPT-002",
      name: "Pediatrics",
      head: "Dr. Sarah Thompson",
      isActive: true,
    },
    {
      id: "DEPT-003",
      name: "Obstetrics & Gynecology",
      head: "Dr. Emily Davis",
      isActive: true,
    },
    {
      id: "DEPT-004",
      name: "Orthopedics",
      head: "Dr. Robert Johnson",
      isActive: true,
    },
    {
      id: "DEPT-005",
      name: "Ophthalmology",
      head: "Dr. Michael Chen",
      isActive: false,
    },
  ]
}

// Default hospital settings
export const defaultHospitalSettings: HospitalSettings = {
  hospitalName: "eHospital",
  address: "123 Main St, City",
  phone: "08012345678",
  email: "info@ehospital.com",
  taxId: "1234567890",
  consultationFee: 5000, // Legacy field, kept for backward compatibility
  generalMedicineFee: 5000,
  pediatricsFee: 7500,
  specialistFee: 10000,
  autoBackup: true,
  emailNotifications: true,
  staffDiscount: 20, // Default staff discount of 20%
  consultationTypes: [
    { value: "initial", label: "Initial Consultation" },
    { value: "follow_up", label: "Follow-up Consultation" },
    { value: "specialist", label: "Specialist Consultation" },
    { value: "pediatrician", label: "Pediatrician" },
  ],
  appointmentTimeSlots: [
    "08:00 AM",
    "08:30 AM",
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
  ],
  appointmentTypes: [
    { value: "consultation", label: "Consultation" },
    { value: "follow-up", label: "Follow-up" },
    { value: "lab-test", label: "Laboratory Test" },
    { value: "procedure", label: "Procedure" },
    { value: "pediatrician", label: "Pediatrician" },
  ],
}
