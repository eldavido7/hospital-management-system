import { create } from "zustand"

export interface Medicine {
  id: string
  name: string
  dosage: string
  form: "tablet" | "capsule" | "syrup" | "injection" | "cream" | "ointment" | "other"
  price: number
  stock: number
  description?: string
}

interface MedicineStore {
  medicines: Medicine[]
  getMedicineById: (id: string) => Medicine | undefined
  addMedicine: (medicine: Omit<Medicine, "id">) => Medicine
  updateMedicine: (id: string, updates: Partial<Medicine>) => void
  deleteMedicine: (id: string) => void
  searchMedicines: (term: string) => Medicine[]
  decreaseStock: (id: string, quantity: number) => boolean
  increaseStock: (id: string, quantity: number) => boolean
}

// Generate mock medicines
const generateMockMedicines = (): Medicine[] => {
  return [
    {
      id: "MED-1001",
      name: "Paracetamol",
      dosage: "500mg",
      form: "tablet",
      price: 50,
      stock: 1000,
      description: "For pain and fever relief",
    },
    {
      id: "MED-1002",
      name: "Amoxicillin",
      dosage: "500mg",
      form: "capsule",
      price: 150,
      stock: 500,
      description: "Antibiotic for bacterial infections",
    },
    {
      id: "MED-1003",
      name: "Ibuprofen",
      dosage: "400mg",
      form: "tablet",
      price: 80,
      stock: 800,
      description: "Anti-inflammatory and pain relief",
    },
    {
      id: "MED-1004",
      name: "Metformin",
      dosage: "500mg",
      form: "tablet",
      price: 120,
      stock: 600,
      description: "For type 2 diabetes",
    },
    {
      id: "MED-1005",
      name: "Amlodipine",
      dosage: "5mg",
      form: "tablet",
      price: 100,
      stock: 400,
      description: "For high blood pressure",
    },
    {
      id: "MED-1006",
      name: "Diclofenac",
      dosage: "75mg",
      form: "injection",
      price: 200,
      stock: 300,
      description: "For pain and inflammation",
    },
    {
      id: "MED-1007",
      name: "Dexamethasone",
      dosage: "4mg",
      form: "injection",
      price: 250,
      stock: 200,
      description: "Corticosteroid for inflammation",
    },
    {
      id: "MED-1008",
      name: "Ceftriaxone",
      dosage: "1g",
      form: "injection",
      price: 500,
      stock: 150,
      description: "Broad-spectrum antibiotic",
    },
    {
      id: "MED-1009",
      name: "Metoclopramide",
      dosage: "10mg",
      form: "injection",
      price: 180,
      stock: 250,
      description: "For nausea and vomiting",
    },
    {
      id: "MED-1010",
      name: "Salbutamol",
      dosage: "100mcg",
      form: "other",
      price: 350,
      stock: 100,
      description: "Inhaler for asthma",
    },
    {
      id: "MED-1011",
      name: "Omeprazole",
      dosage: "20mg",
      form: "capsule",
      price: 120,
      stock: 400,
      description: "For acid reflux and ulcers",
    },
    {
      id: "MED-1012",
      name: "Loratadine",
      dosage: "10mg",
      form: "tablet",
      price: 80,
      stock: 300,
      description: "Antihistamine for allergies",
    },
  ]
}

export const useMedicineStore = create<MedicineStore>((set, get) => ({
  medicines: generateMockMedicines(),

  getMedicineById: (id: string) => {
    return get().medicines.find((medicine) => medicine.id === id)
  },

  addMedicine: (medicine) => {
    const newId = `MED-${Date.now().toString().slice(-4)}`
    const newMedicine = { ...medicine, id: newId }

    set((state) => ({
      medicines: [...state.medicines, newMedicine],
    }))

    return newMedicine
  },

  updateMedicine: (id: string, updates: Partial<Medicine>) => {
    set((state) => ({
      medicines: state.medicines.map((medicine) => (medicine.id === id ? { ...medicine, ...updates } : medicine)),
    }))
  },

  deleteMedicine: (id: string) => {
    set((state) => ({
      medicines: state.medicines.filter((medicine) => medicine.id !== id),
    }))
  },

  searchMedicines: (term: string) => {
    const { medicines } = get()
    if (!term) return medicines

    const lowerTerm = term.toLowerCase()
    return medicines.filter(
      (medicine) =>
        medicine.name.toLowerCase().includes(lowerTerm) ||
        medicine.dosage.toLowerCase().includes(lowerTerm) ||
        medicine.description?.toLowerCase().includes(lowerTerm),
    )
  },

  decreaseStock: (id: string, quantity: number) => {
    const medicine = get().getMedicineById(id)
    if (!medicine || medicine.stock < quantity) return false

    get().updateMedicine(id, { stock: medicine.stock - quantity })
    return true
  },

  increaseStock: (id: string, quantity: number) => {
    const medicine = get().getMedicineById(id)
    if (!medicine) return false

    get().updateMedicine(id, { stock: medicine.stock + quantity })
    return true
  },
}))

