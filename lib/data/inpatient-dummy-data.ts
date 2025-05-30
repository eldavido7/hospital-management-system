import type { Room, InpatientPatient, ObservationEntry, TreatmentEntry, InpatientStats } from "./inpatient-types"

// Fix the room and patient data to ensure they're properly connected
// Make sure room IDs in the rooms array match the roomId in the patients array

// Update the rooms array to ensure all occupied rooms have the correct patientId
export const rooms: Room[] = [
  {
    id: "room1",
    number: "101",
    type: "Standard",
    occupied: true,
    patientId: "pat1",
    admissionDate: new Date("2023-05-01"),
    dailyRate: 5000,
  },
  {
    id: "room2",
    number: "102",
    type: "Standard",
    occupied: true,
    patientId: "pat2",
    admissionDate: new Date("2023-05-02"),
    dailyRate: 5000,
  },
  { id: "room3", number: "103", type: "Standard", occupied: false, dailyRate: 5000 },
  {
    id: "room4",
    number: "104",
    type: "Private",
    occupied: true,
    patientId: "pat3",
    admissionDate: new Date("2023-05-03"),
    dailyRate: 8000,
  },
  { id: "room5", number: "105", type: "Private", occupied: false, dailyRate: 8000 },
  {
    id: "room6",
    number: "201",
    type: "ICU",
    occupied: true,
    patientId: "pat4",
    admissionDate: new Date("2023-05-04"),
    dailyRate: 15000,
  },
  { id: "room7", number: "202", type: "ICU", occupied: false, dailyRate: 15000 },
]

// Update the inpatients array to ensure all patients have the correct roomId
export const inpatients: InpatientPatient[] = [
  {
    id: "pat1",
    name: "John Doe",
    age: 45,
    gender: "Male",
    roomId: "room1",
    roomNumber: "101",
    admissionDate: new Date("2023-05-01"),
    diagnosis: "Pneumonia",
    doctor: "Dr. Smith",
  },
  {
    id: "pat2",
    name: "Jane Smith",
    age: 32,
    gender: "Female",
    roomId: "room2",
    roomNumber: "102",
    admissionDate: new Date("2023-05-02"),
    diagnosis: "Appendicitis",
    doctor: "Dr. Johnson",
  },
  {
    id: "pat3",
    name: "Robert Brown",
    age: 67,
    gender: "Male",
    roomId: "room4",
    roomNumber: "104",
    admissionDate: new Date("2023-05-03"),
    diagnosis: "Congestive Heart Failure",
    doctor: "Dr. Williams",
  },
  {
    id: "pat4",
    name: "Emily Davis",
    age: 28,
    gender: "Female",
    roomId: "room6",
    roomNumber: "201",
    admissionDate: new Date("2023-05-04"),
    diagnosis: "Severe Trauma",
    doctor: "Dr. Garcia",
  },
]

// Update observation entries to ensure they have the correct patientId and roomId
export const observationEntries: ObservationEntry[] = [
  {
    id: "obs1",
    patientId: "pat1",
    roomId: "room1",
    timestamp: new Date("2023-05-01T08:00:00"),
    temperature: 38.5,
    bloodPressure: "120/80",
    pulseRate: 88,
    respiratoryRate: 18,
    oxygenSaturation: 96,
    nurse: "Nurse Johnson",
    remarks: "Patient complaining of chest pain",
  },
  {
    id: "obs2",
    patientId: "pat1",
    roomId: "room1",
    timestamp: new Date("2023-05-01T14:00:00"),
    temperature: 38.2,
    bloodPressure: "118/78",
    pulseRate: 85,
    respiratoryRate: 17,
    oxygenSaturation: 97,
    nurse: "Nurse Williams",
    remarks: "Pain reduced after medication",
  },
  {
    id: "obs3",
    patientId: "pat2",
    roomId: "room2",
    timestamp: new Date("2023-05-02T09:00:00"),
    temperature: 37.8,
    bloodPressure: "130/85",
    pulseRate: 90,
    respiratoryRate: 19,
    oxygenSaturation: 98,
    nurse: "Nurse Brown",
    remarks: "Post-operative pain managed with analgesics",
  },
  {
    id: "obs4",
    patientId: "pat3",
    roomId: "room4",
    timestamp: new Date("2023-05-03T10:00:00"),
    temperature: 36.9,
    bloodPressure: "140/90",
    pulseRate: 78,
    respiratoryRate: 16,
    oxygenSaturation: 95,
    nurse: "Nurse Davis",
    remarks: "Mild edema in lower extremities",
  },
  {
    id: "obs5",
    patientId: "pat4",
    roomId: "room6",
    timestamp: new Date("2023-05-04T07:00:00"),
    temperature: 37.2,
    bloodPressure: "110/70",
    pulseRate: 100,
    respiratoryRate: 22,
    oxygenSaturation: 94,
    nurse: "Nurse Wilson",
    remarks: "Patient sedated, responsive to pain",
  },
]

// Update treatment entries to ensure they have the correct patientId and roomId
export const treatmentEntries: TreatmentEntry[] = [
  {
    id: "treat1",
    patientId: "pat1",
    roomId: "room1",
    timestamp: new Date("2023-05-01T09:00:00"),
    medicationName: "Azithromycin",
    medicationType: "Medicine",
    route: "Oral",
    dosage: "500mg",
    duration: "Once daily for 5 days",
    cost: 1200,
    administeredBy: "Nurse Johnson",
  },
  {
    id: "treat2",
    patientId: "pat1",
    roomId: "room1",
    timestamp: new Date("2023-05-01T12:00:00"),
    medicationName: "Paracetamol",
    medicationType: "Medicine",
    route: "Oral",
    dosage: "1000mg",
    duration: "Every 6 hours as needed",
    cost: 300,
    administeredBy: "Nurse Williams",
  },
  {
    id: "treat3",
    patientId: "pat2",
    roomId: "room2",
    timestamp: new Date("2023-05-02T10:00:00"),
    medicationName: "Ceftriaxone",
    medicationType: "Injection",
    route: "IV",
    dosage: "1g",
    duration: "Every 12 hours",
    cost: 1800,
    administeredBy: "Nurse Brown",
  },
  {
    id: "treat4",
    patientId: "pat3",
    roomId: "room4",
    timestamp: new Date("2023-05-03T11:00:00"),
    medicationName: "Furosemide",
    medicationType: "Injection",
    route: "IV",
    dosage: "40mg",
    duration: "Once daily",
    cost: 950,
    administeredBy: "Nurse Davis",
  },
  {
    id: "treat5",
    patientId: "pat4",
    roomId: "room6",
    timestamp: new Date("2023-05-04T08:00:00"),
    medicationName: "Morphine",
    medicationType: "Injection",
    route: "IV",
    dosage: "5mg",
    duration: "Every 4 hours as needed",
    cost: 1500,
    administeredBy: "Nurse Wilson",
  },
]

// Dummy inpatient stats
export const inpatientStats: InpatientStats = {
  totalBeds: rooms.length,
  occupiedBeds: rooms.filter((room) => room.occupied).length,
  availableBeds: rooms.filter((room) => !room.occupied).length,
  occupancyRate: (rooms.filter((room) => room.occupied).length / rooms.length) * 100,
  averageLengthOfStay: 4.5,
  admissionsToday: 1,
  dischargesToday: 0,
}

// Helper functions
export const getPatientById = (patientId: string): InpatientPatient | undefined => {
  return inpatients.find((patient) => patient.id === patientId)
}

export const getRoomById = (roomId: string): Room | undefined => {
  return rooms.find((room) => room.id === roomId)
}

export const getPatientObservations = (patientId: string): ObservationEntry[] => {
  return observationEntries.filter((entry) => entry.patientId === patientId)
}

export const getPatientTreatments = (patientId: string): TreatmentEntry[] => {
  return treatmentEntries.filter((entry) => entry.patientId === patientId)
}

export const getAvailableRooms = (): Room[] => {
  return rooms.filter((room) => !room.occupied)
}
