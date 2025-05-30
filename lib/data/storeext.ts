import { useAppStore } from "./store"
import { create } from "zustand"
import type { BillItem } from "./billing"
import { useConsumableStore, type Consumable } from "./consumables"
import type { Patient, Visit, Appointment, HMOClaim, ClaimItem } from "./store"
import { useVaccineStore, type VaccinationSession, type VaccineDoseType } from "./vaccines"
import { getRecommendedDoseType, isVaccinationSeriesComplete, checkVaccinationEligibility } from "./vaccines"

// Extended Patient interface with string fields for form handling
export interface ExtendedPatient extends Patient {
  medicalHistoryStr?: string
  allergiesStr?: string
}

// Extended Visit interface with vaccination data
export interface ExtendedVisit extends Visit {
  vaccinationData?: {
    sessions: VaccinationSession[]
  }
}

// Extend the existing store with consumable functionality
interface StoreExtension {
  // Add consumables to a bill
  addConsumablesToBill: (billId: string, consumables: ConsumableItem[]) => void

  // Get recommended consumables for a medication form
  getRecommendedConsumablesForMedication: (medicationForm: string) => Consumable[]

  // Create a consumable bill item
  createConsumableBillItem: (consumable: Consumable, quantity: number) => BillItem

  // Get consumables for a bill
  getConsumablesForBill: (billId: string) => BillItem[]

  // Check if a bill item is a consumable
  isConsumableItem: (item: BillItem) => boolean

  // Update patient information
  updatePatientInfo: (updatedPatient: ExtendedPatient) => boolean

  // Delete patient
  deletePatient: (patientId: string) => boolean

  // Vaccination extension interface
  // Schedule a vaccination appointment
  scheduleVaccinationAppointment: (
    patientId: string,
    vaccineId: string,
    doseType: VaccineDoseType,
    overrideEligibility?: boolean,
  ) => { success: boolean; message: string; appointmentId?: string }

  // Get patient vaccination history
  getPatientVaccinationHistory: (patientId: string) => VaccinationSession[]

  // Process vaccination at vitals
  processVaccinationAtVitals: (
    appointmentId: string,
    action: "approve" | "deny",
    notes?: string,
  ) => { success: boolean; message: string }

  // Complete vaccination administration
  completeVaccinationAdministration: (
    appointmentId: string,
    staffName: string,
    notes?: string,
  ) => { success: boolean; message: string }

  // Check if a patient is eligible for a vaccine
  checkPatientVaccineEligibility: (
    patientId: string,
    vaccineId: string,
    doseType: VaccineDoseType,
  ) => { eligible: boolean; reason?: string; requiresOverride?: boolean }

  // Get recommended vaccines for a patient
  getRecommendedVaccinesForPatient: (patientId: string) => {
    vaccineId: string
    name: string
    doseType: VaccineDoseType
    nextDueDate?: string
  }[]

  // Create a vaccination bill
  createVaccinationBill: (
    patientId: string,
    vaccineId: string,
    appointmentId: string,
  ) => { success: boolean; message: string; billId?: string }

  // Get vaccination appointments
  getVaccinationAppointments: (status?: string) => VaccinationAppointment[]
}

// Interface for consumable items added to prescriptions
export interface ConsumableItem {
  consumableId: string
  name: string
  quantity: number
  price: number
}

// Add this type definition after the ConsumableItem interface
// Vaccination appointment extension
export interface VaccinationAppointment extends Appointment {
  vaccinationDetails: {
    vaccineId: string
    vaccineName: string
    doseType: VaccineDoseType
    price: number
    isGovernmentProvided: boolean
  }
}

// Create the extension store
export const useStoreExtension = create<StoreExtension>((set, get) => ({
  // Add consumables to an existing bill
  addConsumablesToBill: (billId: string, consumables: ConsumableItem[]) => {
    const { getBillById, updateBill } = useAppStore.getState()
    const { decreaseStock } = useConsumableStore.getState()

    const bill = getBillById(billId)
    if (!bill) return

    // Create bill items for consumables
    const consumableBillItems: BillItem[] = consumables.map((consumable) => ({
      id: `CONS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      description: `Consumable: ${consumable.name}`,
      quantity: consumable.quantity,
      unitPrice: consumable.price,
      isConsumable: true, // Mark as consumable for identification
    }))

    // Update the bill with the new items
    updateBill({
      ...bill,
      items: [...bill.items, ...consumableBillItems],
    })

    // Decrease stock for each consumable
    consumables.forEach((consumable) => {
      decreaseStock(consumable.consumableId, consumable.quantity)
    })
  },

  // Get recommended consumables for a medication form
  getRecommendedConsumablesForMedication: (medicationForm: string) => {
    const { getRecommendedConsumables } = useConsumableStore.getState()
    return getRecommendedConsumables(medicationForm)
  },

  // Create a consumable bill item
  createConsumableBillItem: (consumable: Consumable, quantity: number): BillItem => {
    return {
      id: `CONS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      description: `Consumable: ${consumable.name}`,
      quantity: quantity,
      unitPrice: consumable.price,
    }
  },

  // Get consumables for a bill
  getConsumablesForBill: (billId: string): BillItem[] => {
    const { getBillById } = useAppStore.getState()
    const bill = getBillById(billId)
    if (!bill) return []

    return bill.items.filter(
      (item) => item.description.startsWith("Consumable:") || (item as any).isConsumable === true,
    )
  },

  // Check if a bill item is a consumable
  isConsumableItem: (item: BillItem): boolean => {
    return item.description.startsWith("Consumable:") || (item as any).isConsumable === true
  },

  // Update patient information
  updatePatientInfo: (updatedPatient: ExtendedPatient) => {
    // Convert string arrays back to arrays if they exist
    if (updatedPatient.medicalHistoryStr) {
      updatedPatient.medicalHistory = updatedPatient.medicalHistoryStr.split("\n").filter((item) => item.trim() !== "")
    }

    if (updatedPatient.allergiesStr) {
      updatedPatient.allergies = updatedPatient.allergiesStr
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
    }

    // Remove the string fields before updating
    const { medicalHistoryStr, allergiesStr, ...patientToUpdate } = updatedPatient

    // Get the updatePatient function from the main store
    const { updatePatient } = useAppStore.getState()

    // Call the main store's updatePatient function
    updatePatient(patientToUpdate)

    return true
  },

  // Delete patient
  deletePatient: (patientId: string) => {
    const { patients, appointments, bills, hmoClaims } = useAppStore.getState()

    // Check if patient exists
    const patientExists = patients.some((patient) => patient.id === patientId)
    if (!patientExists) {
      return false
    }

    // Filter out the patient to delete
    const updatedPatients = patients.filter((patient) => patient.id !== patientId)

    // Filter out appointments, bills, and HMO claims related to the patient
    const updatedAppointments = appointments.filter((appointment) => appointment.patientId !== patientId)
    const updatedBills = bills.filter((bill) => bill.patientId !== patientId)
    const updatedHMOClaims = hmoClaims.filter((claim) => claim.patientId !== patientId)

    // Update the store with all the filtered arrays
    useAppStore.setState({
      patients: updatedPatients,
      appointments: updatedAppointments,
      bills: updatedBills,
      hmoClaims: updatedHMOClaims,
    })

    return true
  },

  // Get patient vaccination history from visits
  getPatientVaccinationHistory: (patientId: string) => {
    const { getPatientById } = useAppStore.getState()
    const patient = getPatientById(patientId)

    if (!patient || !patient.visits) return []

    // Extract vaccination sessions from all visits
    const vaccinationHistory: VaccinationSession[] = []

    patient.visits.forEach((visit) => {
      const extendedVisit = visit as ExtendedVisit
      if (extendedVisit.vaccinationData && Array.isArray(extendedVisit.vaccinationData.sessions)) {
        vaccinationHistory.push(...extendedVisit.vaccinationData.sessions)
      }
    })

    return vaccinationHistory
  },

  // Schedule a vaccination appointment
  scheduleVaccinationAppointment: (patientId, vaccineId, doseType, overrideEligibility = false) => {
    const { getPatientById, addAppointment, generateAppointmentId } = useAppStore.getState()
    const { getVaccineById } = useVaccineStore.getState()
    const { getPatientVaccinationHistory, checkPatientVaccineEligibility } = get()

    const patient = getPatientById(patientId)
    const vaccine = getVaccineById(vaccineId)

    if (!patient) {
      return { success: false, message: "Patient not found" }
    }

    if (!vaccine) {
      return { success: false, message: "Vaccine not found" }
    }

    // Check eligibility unless override is specified
    if (!overrideEligibility) {
      const eligibility = checkPatientVaccineEligibility(patientId, vaccineId, doseType)
      if (!eligibility.eligible) {
        return {
          success: false,
          message: eligibility.reason || "Patient is not eligible for this vaccination dose",
        }
      }
    }

    // Check vaccine stock
    if (vaccine.stock <= 0) {
      return { success: false, message: "Vaccine is out of stock" }
    }

    // Create a new appointment ID
    const appointmentId = generateAppointmentId()

    // Create the appointment with vaccination details
    const today = new Date()
    const appointment: VaccinationAppointment = {
      id: appointmentId,
      patientId: patient.id,
      patientName: patient.name,
      date: today.toISOString().split("T")[0],
      time: `${today.getHours()}:${today.getMinutes().toString().padStart(2, "0")}`,
      type: "Vaccination",
      status: "scheduled" as const,
      notes: `${vaccine.name} vaccination (${doseType} dose)`,
      // Store vaccination details in the appointment
      vaccinationDetails: {
        vaccineId,
        vaccineName: vaccine.name,
        doseType,
        price: vaccine.price,
        isGovernmentProvided: vaccine.is_government_provided,
      },
    }

    // Add the appointment
    addAppointment(appointment)

    return {
      success: true,
      message: `Vaccination appointment scheduled successfully${overrideEligibility ? " (with eligibility override)" : ""}`,
      appointmentId,
    }
  },

  // Update the processVaccinationAtVitals function to handle HMO patients correctly
  processVaccinationAtVitals: (appointmentId, action, notes) => {
    const { getAppointmentById, updateAppointment, getPatientById, updatePatient } = useAppStore.getState()
    const { getVaccineById } = useVaccineStore.getState()
    const { createVaccinationBill } = get()

    const appointment = getAppointmentById(appointmentId) as VaccinationAppointment | undefined
    if (!appointment) {
      return { success: false, message: "Appointment not found" }
    }

    // Check if this is a vaccination appointment
    if (appointment.type !== "Vaccination" || !appointment.vaccinationDetails) {
      return { success: false, message: "This is not a vaccination appointment" }
    }

    const vaccinationDetails = appointment.vaccinationDetails
    const patient = getPatientById(appointment.patientId)

    if (!patient) {
      return { success: false, message: "Patient not found" }
    }

    // Get the vaccine to check if it's government provided
    const vaccine = getVaccineById(vaccinationDetails.vaccineId)
    if (!vaccine) {
      return { success: false, message: "Vaccine not found" }
    }

    // Create or update the patient's visit
    let visit: ExtendedVisit
    let visitIndex = -1

    if (patient.visits && patient.visits.length > 0) {
      // Check if there's a visit for today
      const today = new Date().toISOString().split("T")[0]
      visitIndex = patient.visits.findIndex((v) => v.date === today)

      if (visitIndex >= 0) {
        // Use existing visit
        visit = { ...patient.visits[visitIndex] } as ExtendedVisit
      } else {
        // Create a new visit
        visit = {
          id: `V-${Date.now()}`,
          date: today,
          type: "Vaccination",
          doctor: "Nurse", // Default to nurse for vaccinations
          diagnosis: "With Vitals: Vaccination", // Initial diagnosis
          vitals: {
            bloodPressure: "",
            temperature: "",
            heartRate: "",
            respiratoryRate: "",
            oxygenSaturation: "",
            weight: "",
            height: "",
          },
          // Initialize vaccination data if it doesn't exist
          vaccinationData: {
            sessions: [],
          },
        } as ExtendedVisit
        visitIndex = -1 // Indicate we need to add a new visit
      }
    } else {
      // Create first visit for patient
      visit = {
        id: `V-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        type: "Vaccination",
        doctor: "Nurse", // Default to nurse for vaccinations
        diagnosis: "With Vitals: Vaccination", // Initial diagnosis
        vitals: {
          bloodPressure: "",
          temperature: "",
          heartRate: "",
          respiratoryRate: "",
          oxygenSaturation: "",
          weight: "",
          height: "",
        },
        // Initialize vaccination data
        vaccinationData: {
          sessions: [],
        },
      } as ExtendedVisit
      visitIndex = -1 // Indicate we need to add a new visit
    }

    // Create a vaccination session
    const vaccinationSession: VaccinationSession = {
      id: `vacc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      vaccineId: vaccinationDetails.vaccineId,
      doseType: vaccinationDetails.doseType,
      date: new Date().toISOString().split("T")[0],
      status: action === "approve" ? "approved" : "denied",
      notes: notes || "",
    }

    // Add the session to the visit's vaccination data
    if (!visit.vaccinationData) {
      visit.vaccinationData = { sessions: [] }
    }

    visit.vaccinationData.sessions = [...((visit.vaccinationData as any).sessions || []), vaccinationSession]

    // Update the diagnosis based on action
    if (action === "approve") {
      if (vaccine.is_government_provided) {
        // For government-provided vaccines, send directly to injection room
        visit.diagnosis = "With Injection Room: Vaccination (Government Provided)"
      } else if (patient.patientType === "hmo") {
        // For HMO patients, send to HMO desk for approval
        visit.diagnosis = "With HMO: Vaccination"

        // Create a bill for the vaccination (will be marked as hmo_pending)
        const billResult = createVaccinationBill(patient.id, vaccinationDetails.vaccineId, appointmentId)

        // Store the bill ID in the session for easier tracking
        if (billResult.success && billResult.billId) {
          const lastSessionIndex = visit.vaccinationData.sessions.length - 1
          visit.vaccinationData.sessions[lastSessionIndex].billId = billResult.billId
        }
      } else {
        // For regular cash patients, send to cash point for payment
        visit.diagnosis = "With Cash Point: Vaccination"

        // Create a bill for the vaccination
        const billResult = createVaccinationBill(patient.id, vaccinationDetails.vaccineId, appointmentId)

        // Store the bill ID in the session for easier tracking
        if (billResult.success && billResult.billId) {
          const lastSessionIndex = visit.vaccinationData.sessions.length - 1
          visit.vaccinationData.sessions[lastSessionIndex].billId = billResult.billId
        }
      }
    } else {
      // For denied vaccinations, mark as completed with denial reason
      visit.diagnosis = "Vaccination Denied"
      visit.notes = `${visit.notes || ""}\nVaccination denied: ${notes || "No reason provided"}`
    }

    // Update the patient's visits
    let updatedVisits: Visit[]
    if (visitIndex >= 0) {
      // Update existing visit
      updatedVisits = [...patient.visits!]
      updatedVisits[visitIndex] = visit
    } else {
      // Add new visit
      updatedVisits = [...(patient.visits || []), visit]
    }

    // Update the patient
    updatePatient({
      ...patient,
      lastVisit: new Date().toISOString().split("T")[0],
      visits: updatedVisits,
    })

    // Update the appointment status
    updateAppointment({
      ...appointment,
      status: action === "approve" ? "In Progress" : "cancelled",
      notes: `${appointment.notes || ""}\n${action === "approve" ? "Approved" : "Denied"} at vitals: ${notes || "No notes provided"}`,
    })

    // Determine the appropriate message based on patient type and vaccine type
    let successMessage = ""
    if (action === "approve") {
      if (vaccine.is_government_provided) {
        successMessage = "Vaccination approved and sent to injection room (government provided - no payment required)"
      } else if (patient.patientType === "hmo") {
        successMessage = "Vaccination approved and sent to HMO desk for approval"
      } else {
        successMessage = "Vaccination approved and sent to cash point for payment"
      }
    } else {
      successMessage = `Vaccination denied. Reason: ${notes || "No reason provided"}`
    }

    return {
      success: true,
      message: successMessage,
    }
  },

  // Complete vaccination administration
  completeVaccinationAdministration: (appointmentId, staffName, notes) => {
    const { getAppointmentById, updateAppointment, getPatientById, updatePatient } = useAppStore.getState()
    const { decreaseVaccineStock, getVaccineById } = useVaccineStore.getState()

    const appointment = getAppointmentById(appointmentId) as VaccinationAppointment | undefined
    if (!appointment) {
      return { success: false, message: "Appointment not found" }
    }

    // Check if this is a vaccination appointment
    if (appointment.type !== "Vaccination" || !appointment.vaccinationDetails) {
      return { success: false, message: "This is not a vaccination appointment" }
    }

    const vaccinationDetails = appointment.vaccinationDetails
    const patient = getPatientById(appointment.patientId)

    if (!patient) {
      return { success: false, message: "Patient not found" }
    }

    // Find the visit with the vaccination session
    if (!patient.visits || patient.visits.length === 0) {
      return { success: false, message: "No visit record found for this patient" }
    }

    // Find the most recent visit with vaccination data
    const visitIndex = patient.visits.findIndex((v) => {
      const extendedVisit = v as ExtendedVisit
      return (
        extendedVisit.vaccinationData &&
        extendedVisit.vaccinationData.sessions &&
        extendedVisit.vaccinationData.sessions.some((s) => s.vaccineId === vaccinationDetails.vaccineId)
      )
    })

    if (visitIndex === -1) {
      return { success: false, message: "No vaccination record found in patient visits" }
    }

    // Get the visit and update it
    const visit = { ...patient.visits[visitIndex] } as ExtendedVisit

    // Find the vaccination session
    const sessionIndex = (visit.vaccinationData as any).sessions.findIndex(
      (s: VaccinationSession) =>
        s.vaccineId === vaccinationDetails.vaccineId &&
        s.doseType === vaccinationDetails.doseType &&
        s.status === "approved",
    )

    if (sessionIndex === -1) {
      return { success: false, message: "No approved vaccination session found" }
    }

    // Update the session
    const updatedSessions = [...(visit.vaccinationData as any).sessions]
    updatedSessions[sessionIndex] = {
      ...updatedSessions[sessionIndex],
      status: "completed",
      administeredBy: staffName,
      administeredTime: new Date().toISOString(),
      notes: `${updatedSessions[sessionIndex].notes || ""}\n${notes || "Vaccination administered"}`,
    }

    // Update the visit
    const updatedVisit = {
      ...visit,
      diagnosis: "Completed",
      vaccinationData: {
        ...(visit.vaccinationData as any),
        sessions: updatedSessions,
      },
    }

    // Update the patient's visits
    const updatedVisits = [...patient.visits]
    updatedVisits[visitIndex] = updatedVisit

    // Update the patient
    updatePatient({
      ...patient,
      visits: updatedVisits,
    })

    // Update the appointment
    updateAppointment({
      ...appointment,
      status: "completed",
      notes: `${appointment.notes || ""}\nVaccination completed by ${staffName} on ${new Date().toISOString().split("T")[0]}`,
    })

    // Get the vaccine to verify it exists before decreasing stock
    const vaccine = getVaccineById(vaccinationDetails.vaccineId)
    if (!vaccine) {
      return { success: false, message: "Vaccine not found in inventory" }
    }

    // Decrease vaccine stock
    const stockDecreased = decreaseVaccineStock(vaccinationDetails.vaccineId, 1)
    if (!stockDecreased) {
      return { success: false, message: "Failed to update vaccine inventory. Vaccine may be out of stock." }
    }

    // Check if vaccination series is complete
    const history = get().getPatientVaccinationHistory(patient.id)
    const seriesComplete = isVaccinationSeriesComplete(vaccinationDetails.vaccineId, [
      ...history,
      updatedSessions[sessionIndex],
    ])

    return {
      success: true,
      message: seriesComplete
        ? `Vaccination administered successfully. Patient has completed all required doses for ${vaccinationDetails.vaccineName}.`
        : "Vaccination administered successfully.",
    }
  },

  // Check if a patient is eligible for a vaccine
  checkPatientVaccineEligibility: (patientId, vaccineId, doseType) => {
    const { getPatientById } = useAppStore.getState()
    const { getPatientVaccinationHistory } = get()

    const patient = getPatientById(patientId)
    if (!patient) {
      return { eligible: false, reason: "Patient not found" }
    }

    const history = getPatientVaccinationHistory(patientId)

    return checkVaccinationEligibility(vaccineId, doseType, history, patient.age)
  },

  // Get recommended vaccines for a patient
  getRecommendedVaccinesForPatient: (patientId) => {
    const { getPatientById } = useAppStore.getState()
    const { getAllVaccines } = useVaccineStore.getState()
    const { getPatientVaccinationHistory } = get()

    const patient = getPatientById(patientId)
    if (!patient) return []

    const history = getPatientVaccinationHistory(patientId)
    const allVaccines = getAllVaccines()
    const recommendations = []

    // Filter for age-appropriate vaccines
    const ageAppropriateVaccines = allVaccines.filter((vaccine) => {
      if (!vaccine.age_restriction) return true

      const { min, max } = vaccine.age_restriction
      if (min !== undefined && patient.age < min) return false
      if (max !== undefined && patient.age > max) return false

      return true
    })

    // For each vaccine, check if patient needs any doses
    for (const vaccine of ageAppropriateVaccines) {
      // Skip if out of stock
      if (vaccine.stock <= 0) continue

      // Get vaccine-specific history
      const vaccineHistory = history.filter(
        (session) => session.vaccineId === vaccine.id && session.status === "completed",
      )

      // Skip if vaccination series is complete
      if (vaccineHistory.length >= vaccine.total_required_doses) continue

      // Determine next dose type
      const nextDoseType = getRecommendedDoseType(vaccine.id, history)
      if (!nextDoseType) continue

      // Calculate next due date if applicable
      let nextDueDate: string | undefined = undefined

      if (nextDoseType !== "initial" && vaccine.interval_days && vaccineHistory.length > 0) {
        // Find the most recent dose
        const lastDose = [...vaccineHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

        // Calculate due date
        const lastDoseDate = new Date(lastDose.date)
        lastDoseDate.setDate(lastDoseDate.getDate() + vaccine.interval_days)
        nextDueDate = lastDoseDate.toISOString().split("T")[0]
      }

      recommendations.push({
        vaccineId: vaccine.id,
        name: vaccine.name,
        doseType: nextDoseType,
        nextDueDate,
      })
    }

    return recommendations
  },

  // Create a vaccination bill
  createVaccinationBill: (patientId, vaccineId, appointmentId) => {
    const { getPatientById, getAppointmentById, generateBillId, addBill, updateAppointment } = useAppStore.getState()
    const { getVaccineById } = useVaccineStore.getState()

    const patient = getPatientById(patientId)
    const vaccine = getVaccineById(vaccineId)
    const appointment = getAppointmentById(appointmentId) as VaccinationAppointment | undefined

    if (!patient) {
      return { success: false, message: "Patient not found" }
    }

    if (!vaccine) {
      return { success: false, message: "Vaccine not found" }
    }

    if (!appointment) {
      return { success: false, message: "Appointment not found" }
    }

    // Skip billing for government-provided vaccines
    if (vaccine.is_government_provided) {
      // Update the appointment to link it to the patient's visit
      updateAppointment({
        ...appointment,
        status: "In Progress",
        notes: `${appointment.notes || ""}\nGovernment-provided vaccine - no payment required`,
      })

      // Find the patient's visit and update diagnosis to send to injection room
      if (patient.visits && patient.visits.length > 0) {
        const visitIndex = patient.visits.findIndex((v) => {
          const extendedVisit = v as ExtendedVisit
          return (
            extendedVisit.vaccinationData &&
            extendedVisit.vaccinationData.sessions &&
            extendedVisit.vaccinationData.sessions.some((s) => s.vaccineId === vaccineId)
          )
        })

        if (visitIndex >= 0) {
          const updatedVisits = [...patient.visits]
          updatedVisits[visitIndex] = {
            ...updatedVisits[visitIndex],
            diagnosis: "With Injection Room: Vaccination (Government Provided)",
          }

          // Update the patient
          useAppStore.getState().updatePatient({
            ...patient,
            visits: updatedVisits,
          })
        }
      }

      return {
        success: true,
        message: "Government-provided vaccine - no payment required. Patient sent to injection room.",
      }
    }

    // Create a bill for the vaccination
    const billId = generateBillId()
    const today = new Date().toISOString().split("T")[0]

    const bill = {
      id: billId,
      patientId: patient.id,
      patientName: patient.name,
      date: today,
      // Set status based on patient type
      status: patient.patientType === "hmo" ? ("hmo_pending" as const) : ("pending" as const),
      type: "vaccination" as const,
      items: [
        {
          id: `ITEM-${Date.now().toString().slice(-6)}`,
          description: `${vaccine.name} Vaccination (${appointment.vaccinationDetails.doseType} dose)`,
          quantity: 1,
          unitPrice: vaccine.price,
        },
      ],
      // Add a source field to identify this as a vaccination bill
      source: "vaccination",
      // Add a reference to the appointment
      appointmentId: appointment.id,
    }

    // Add the bill
    addBill(bill)

    // Update the appointment with the bill ID
    updateAppointment({
      ...appointment,
      billId,
      notes: `${appointment.notes || ""}\nBill created: ${billId}`,
    })

    // Find the patient's visit and update it with the bill ID
    if (patient.visits && patient.visits.length > 0) {
      const visitIndex = patient.visits.findIndex((v) => {
        const extendedVisit = v as ExtendedVisit
        return (
          extendedVisit.vaccinationData &&
          extendedVisit.vaccinationData.sessions &&
          extendedVisit.vaccinationData.sessions.some((s) => s.vaccineId === vaccineId)
        )
      })

      if (visitIndex >= 0) {
        const updatedVisits = [...patient.visits]
        const extendedVisit = updatedVisits[visitIndex] as ExtendedVisit

        if (extendedVisit.vaccinationData && extendedVisit.vaccinationData.sessions) {
          const sessionIndex = extendedVisit.vaccinationData.sessions.findIndex((s) => s.vaccineId === vaccineId)

          if (sessionIndex >= 0) {
            // Update the session with the bill ID
            const updatedSessions = [...extendedVisit.vaccinationData.sessions]
            updatedSessions[sessionIndex] = {
              ...updatedSessions[sessionIndex],
              billId,
            }

            // Create a new extended visit with updated vaccination data
            const updatedExtendedVisit: ExtendedVisit = {
              ...extendedVisit,
              vaccinationData: {
                ...extendedVisit.vaccinationData,
                sessions: updatedSessions,
              },
            }

            // Update the visit in the array
            updatedVisits[visitIndex] = updatedExtendedVisit

            // Update the patient
            useAppStore.getState().updatePatient({
              ...patient,
              visits: updatedVisits,
            })
          }
        }
      }
    }

    // For HMO patients, create an HMO claim
    if (patient.patientType === "hmo") {
      // Create a claim for the vaccination
      const claimId = `HMO-VACC-${billId}`

      // Create claim items
      const claimItems: ClaimItem[] = [
        {
          id: `ITEM-VACC-${Date.now()}`,
          description: `${vaccine.name} Vaccination (${appointment.vaccinationDetails.doseType} dose)`,
          quantity: 1,
          unitPrice: vaccine.price,
          approved: false,
          type: "injection",
          sourceId: billId,
          sourceDepartment: "injection_room",
          billId: billId,
        },
      ]

      // Create the HMO claim
      const hmoClaim: HMOClaim = {
        id: claimId,
        patientId: patient.id,
        patientName: patient.name,
        hmoProvider: patient.hmoProvider || "Unknown HMO",
        date: today,
        status: "pending",
        items: claimItems,
        sourceDepartment: "injection_room",
        sourceId: billId,
      }

      // Add the claim to the store
      setTimeout(() => {
        useAppStore.getState().addHMOClaim(hmoClaim)
      }, 0)
    }

    return {
      success: true,
      message:
        patient.patientType === "hmo"
          ? "Vaccination bill created and sent to HMO desk for approval"
          : "Vaccination bill created successfully",
      billId,
    }
  },

  // Get vaccination appointments
  getVaccinationAppointments: (status?: string) => {
    const { appointments } = useAppStore.getState()

    // Filter for vaccination appointments
    const vaccinationAppointments = appointments.filter(
      (appointment) => appointment.type === "Vaccination",
    ) as VaccinationAppointment[]

    // Further filter by status if provided
    if (status) {
      return vaccinationAppointments.filter((appointment) => appointment.status === status)
    }

    return vaccinationAppointments
  },
}))

// Helper function to get recommended consumable text for a medication form
export function getRecommendedConsumablesText(medicationForm: string): string {
  const { getRecommendedConsumablesForMedication } = useStoreExtension.getState()
  const recommendedConsumables = getRecommendedConsumablesForMedication(medicationForm)

  if (recommendedConsumables.length === 0) {
    return "No consumables needed for this medication type."
  }

  return `Recommended consumables: ${recommendedConsumables.map((c) => c.name).join(", ")}`
}
