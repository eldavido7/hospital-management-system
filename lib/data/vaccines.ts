import { create } from "zustand"

// Vaccine dose types
export type VaccineDoseType = "initial" | "review" | "subsequent" | "one_off"

// Vaccination status (tracks the status of a specific vaccination within an appointment)
export type VaccinationStatus = "scheduled" | "approved" | "denied" | "completed" | "cancelled"

// Vaccine interface
export interface Vaccine {
  id: string
  name: string
  type: string
  description: string
  total_required_doses: number
  interval_days?: number
  stock: number
  price: number
  is_government_provided: boolean
  age_restriction?: {
    min?: number
    max?: number
  }
}

// Vaccination session interface - this will be stored as part of the visit data
export interface VaccinationSession {
  id: string
  vaccineId: string
  doseType: VaccineDoseType
  date: string
  status: VaccinationStatus
  administeredBy?: string
  administeredTime?: string
  notes?: string
  billId?: string
}

// Vaccine store interface
interface VaccineStore {
  vaccines: Vaccine[]

  // Vaccine management
  addVaccine: (vaccine: Omit<Vaccine, "id">) => string
  updateVaccine: (vaccine: Vaccine) => void
  getVaccineById: (id: string) => Vaccine | undefined
  getAllVaccines: () => Vaccine[]
  getActiveVaccines: () => Vaccine[]
  decreaseVaccineStock: (id: string, amount: number) => boolean
  increaseVaccineStock: (id: string, amount: number) => void
}

// Create the vaccine store
export const useVaccineStore = create<VaccineStore>((set, get) => ({
  vaccines: [
    {
      id: "vaccine-001",
      name: "COVID-19 Vaccine",
      type: "COVID-19",
      description: "Protects against COVID-19 infection",
      total_required_doses: 2,
      interval_days: 21,
      stock: 100,
      price: 0, // Free
      is_government_provided: true,
    },
    {
      id: "vaccine-002",
      name: "Influenza Vaccine",
      type: "Influenza",
      description: "Annual flu vaccine",
      total_required_doses: 1, // One-off
      stock: 200,
      price: 2500,
      is_government_provided: false,
    },
    {
      id: "vaccine-003",
      name: "Yellow Fever Vaccine",
      type: "Yellow Fever",
      description: "Protection against yellow fever",
      total_required_doses: 1, // One-off
      stock: 50,
      price: 5000,
      is_government_provided: false,
    },
    {
      id: "vaccine-004",
      name: "HPV Vaccine",
      type: "HPV",
      description: "Human Papillomavirus vaccine",
      total_required_doses: 3,
      interval_days: 60,
      stock: 75,
      price: 15000,
      is_government_provided: false,
      age_restriction: {
        min: 9,
        max: 45,
      },
    },
    {
      id: "vaccine-005",
      name: "Polio Vaccine",
      type: "Polio",
      description: "Protection against poliomyelitis",
      total_required_doses: 4,
      interval_days: 30,
      stock: 150,
      price: 0, // Free
      is_government_provided: true,
      age_restriction: {
        max: 18,
      },
    },
    {
      id: "vaccine-006",
      name: "Hepatitis B Vaccine",
      type: "Hepatitis B",
      description: "Protection against Hepatitis B virus",
      total_required_doses: 3,
      interval_days: 30,
      stock: 120,
      price: 3500,
      is_government_provided: false,
    },
  ],

  // Vaccine management functions
  addVaccine: (vaccine) => {
    const id = `vaccine-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    set((state) => ({
      vaccines: [...state.vaccines, { ...vaccine, id }],
    }))
    return id
  },

  updateVaccine: (vaccine) => {
    set((state) => ({
      vaccines: state.vaccines.map((v) => (v.id === vaccine.id ? vaccine : v)),
    }))
  },

  getVaccineById: (id) => {
    return get().vaccines.find((vaccine) => vaccine.id === id)
  },

  getAllVaccines: () => {
    return get().vaccines
  },

  getActiveVaccines: () => {
    return get().vaccines.filter((vaccine) => vaccine.stock > 0)
  },

  decreaseVaccineStock: (id, amount) => {
    const vaccine = get().getVaccineById(id)
    if (!vaccine || vaccine.stock < amount) {
      return false
    }

    set((state) => ({
      vaccines: state.vaccines.map((v) => (v.id === id ? { ...v, stock: v.stock - amount } : v)),
    }))

    return true
  },

  increaseVaccineStock: (id, amount) => {
    set((state) => ({
      vaccines: state.vaccines.map((v) => (v.id === id ? { ...v, stock: v.stock + amount } : v)),
    }))
  },
}))

// Helper function to get age-appropriate vaccines for a patient
export function getAgeAppropriateVaccines(patientAge: number): Vaccine[] {
  const { getAllVaccines } = useVaccineStore.getState()
  const allVaccines = getAllVaccines()

  return allVaccines.filter((vaccine) => {
    // If no age restrictions, vaccine is appropriate for all ages
    if (!vaccine.age_restriction) {
      return true
    }

    const { min, max } = vaccine.age_restriction

    // Check minimum age if specified
    if (min !== undefined && patientAge < min) {
      return false
    }

    // Check maximum age if specified
    if (max !== undefined && patientAge > max) {
      return false
    }

    return true
  })
}

// Helper function to format vaccination status for display
export function formatVaccinationStatus(status: VaccinationStatus): string {
  switch (status) {
    case "scheduled":
      return "Scheduled"
    case "approved":
      return "Approved (Awaiting Payment)"
    case "denied":
      return "Denied"
    case "completed":
      return "Completed"
    case "cancelled":
      return "Cancelled"
    default:
      return status
  }
}

// Helper function to determine the next recommended dose type for a patient
export function getRecommendedDoseType(
  vaccineId: string,
  vaccinationHistory: VaccinationSession[],
): VaccineDoseType | null {
  const { getVaccineById } = useVaccineStore.getState()
  const vaccine = getVaccineById(vaccineId)

  if (!vaccine) return null

  // Filter history for this specific vaccine and completed sessions
  const vaccineHistory = vaccinationHistory.filter(
    (session) => session.vaccineId === vaccineId && session.status === "completed",
  )

  // For one-off vaccines, check if already taken
  if (vaccine.total_required_doses === 1) {
    return vaccineHistory.length === 0 ? "one_off" : null
  }

  // If no doses given, recommend initial
  if (vaccineHistory.length === 0) {
    return "initial"
  }

  // If initial dose given but not review, recommend review
  const hasInitial = vaccineHistory.some((session) => session.doseType === "initial")
  const hasReview = vaccineHistory.some((session) => session.doseType === "review")

  if (hasInitial && !hasReview) {
    return "review"
  }

  // If both initial and review given, and more doses are required, recommend subsequent
  if (hasInitial && hasReview && vaccineHistory.length < vaccine.total_required_doses) {
    return "subsequent"
  }

  // No more doses needed
  return null
}

// Helper function to check if a vaccination series is complete
export function isVaccinationSeriesComplete(vaccineId: string, vaccinationHistory: VaccinationSession[]): boolean {
  const { getVaccineById } = useVaccineStore.getState()
  const vaccine = getVaccineById(vaccineId)

  if (!vaccine) return false

  // Count completed doses for this vaccine
  const completedDoses = vaccinationHistory.filter(
    (session) => session.vaccineId === vaccineId && session.status === "completed",
  ).length

  return completedDoses >= vaccine.total_required_doses
}

// Helper function to check eligibility for a specific dose
export function checkVaccinationEligibility(
  vaccineId: string,
  doseType: VaccineDoseType,
  vaccinationHistory: VaccinationSession[],
  patientAge?: number,
): { eligible: boolean; reason?: string; requiresOverride?: boolean } {
  const { getVaccineById } = useVaccineStore.getState()
  const vaccine = getVaccineById(vaccineId)

  if (!vaccine) {
    return { eligible: false, reason: "Vaccine not found" }
  }

  // Check age restrictions if patient age is provided
  if (patientAge !== undefined && vaccine.age_restriction) {
    if (vaccine.age_restriction.min !== undefined && patientAge < vaccine.age_restriction.min) {
      return {
        eligible: false,
        reason: `Patient is too young for this vaccine (minimum age: ${vaccine.age_restriction.min})`,
        requiresOverride: true,
      }
    }

    if (vaccine.age_restriction.max !== undefined && patientAge > vaccine.age_restriction.max) {
      return {
        eligible: false,
        reason: `Patient is too old for this vaccine (maximum age: ${vaccine.age_restriction.max})`,
        requiresOverride: true,
      }
    }
  }

  // Filter history for this specific vaccine and completed sessions
  const vaccineHistory = vaccinationHistory.filter(
    (session) => session.vaccineId === vaccineId && session.status === "completed",
  )

  // Check if vaccination series is already complete
  if (vaccineHistory.length >= vaccine.total_required_doses) {
    return {
      eligible: false,
      reason: `Patient has already completed all ${vaccine.total_required_doses} required doses for this vaccine`,
      requiresOverride: true,
    }
  }

  // For one-off vaccines
  if (doseType === "one_off") {
    if (vaccineHistory.length > 0) {
      return {
        eligible: false,
        reason: "Patient has already received this one-off vaccine",
        requiresOverride: true,
      }
    }
    return { eligible: true }
  }

  // Check dose type sequence
  if (doseType === "initial") {
    // Initial dose should be the first one
    const hasInitial = vaccineHistory.some((session) => session.doseType === "initial")
    if (hasInitial) {
      return {
        eligible: false,
        reason: "Patient has already received the initial dose",
        requiresOverride: true,
      }
    }
  } else if (doseType === "review") {
    // Review dose requires initial dose first
    const hasInitial = vaccineHistory.some((session) => session.doseType === "initial")
    if (!hasInitial) {
      return {
        eligible: false,
        reason: "Patient must receive the initial dose before review dose",
        requiresOverride: true,
      }
    }

    // Check interval days if specified
    if (vaccine.interval_days) {
      const initialDose = vaccineHistory.find((session) => session.doseType === "initial")
      if (initialDose) {
        const daysSinceInitial = Math.floor(
          (new Date().getTime() - new Date(initialDose.date).getTime()) / (1000 * 60 * 60 * 24),
        )
        if (daysSinceInitial < vaccine.interval_days) {
          return {
            eligible: false,
            reason: `Review dose should be given after ${vaccine.interval_days} days. Only ${daysSinceInitial} days have passed.`,
            requiresOverride: true,
          }
        }
      }
    }
  } else if (doseType === "subsequent") {
    // Subsequent dose requires both initial and review doses
    const hasInitial = vaccineHistory.some((session) => session.doseType === "initial")
    const hasReview = vaccineHistory.some((session) => session.doseType === "review")

    if (!hasInitial || !hasReview) {
      return {
        eligible: false,
        reason: "Patient must receive both initial and review doses before subsequent doses",
        requiresOverride: true,
      }
    }

    // Check if vaccine allows more than 2 doses
    if (vaccine.total_required_doses <= 2) {
      return {
        eligible: false,
        reason: `This vaccine only requires ${vaccine.total_required_doses} doses`,
        requiresOverride: true,
      }
    }

    // Check interval days if specified
    if (vaccine.interval_days) {
      const lastDose = [...vaccineHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

      if (lastDose) {
        const daysSinceLastDose = Math.floor(
          (new Date().getTime() - new Date(lastDose.date).getTime()) / (1000 * 60 * 60 * 24),
        )
        if (daysSinceLastDose < vaccine.interval_days) {
          return {
            eligible: false,
            reason: `Subsequent dose should be given after ${vaccine.interval_days} days. Only ${daysSinceLastDose} days have passed.`,
            requiresOverride: true,
          }
        }
      }
    }
  }

  return { eligible: true }
}
