// Types for inpatient management

export interface Room {
  id: string
  number: string
  type: string
  occupied: boolean
  patientId?: string
  admissionDate?: Date
  dailyRate: number
}

export interface InpatientPatient {
  id: string
  name: string
  age: number
  gender: string
  roomId: string
  roomNumber: string
  admissionDate: Date
  diagnosis: string
  doctor: string
}

export interface ObservationEntry {
  id: string
  patientId: string
  roomId: string
  timestamp: Date
  temperature: number
  bloodPressure: string
  pulseRate: number
  respiratoryRate: number
  oxygenSaturation: number
  weight?: number
  height?: number
  bmi?: number
  bmiInterpretation?: string
  nurse: string
  remarks: string
}

// Treatment chart entry
export interface TreatmentEntry {
  id: string
  patientId: string
  roomId: string
  timestamp: Date
  medicationName: string
  medicationType: "Medicine" | "Injection"
  route: string
  dosage: string
  duration: string
  cost: number
  administeredBy: string
}

// Inpatient statistics
export interface InpatientStats {
  totalBeds: number
  occupiedBeds: number
  availableBeds: number
  occupancyRate: number
  averageLengthOfStay: number
  admissionsToday: number
  dischargesToday: number
}
