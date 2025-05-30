import { create } from "zustand"

export interface Consumable {
  id: string
  name: string
  category: string
  price: number
  stock: number
  description?: string
  minStockLevel?: number
  reorderLevel?: number
  active: boolean
}

interface ConsumableStore {
  consumables: Consumable[]
  getConsumableById: (id: string) => Consumable | undefined
  addConsumable: (consumable: Consumable) => void
  updateConsumable: (updatedConsumable: Consumable) => void
  deleteConsumable: (id: string) => void
  searchConsumables: (term: string) => Consumable[]
  getActiveConsumables: () => Consumable[]
  generateConsumableId: () => string
  decreaseStock: (id: string, quantity: number) => boolean
  increaseStock: (id: string, quantity: number) => void
  getRecommendedConsumables: (medicationForm: string) => Consumable[]
  getLowStockConsumables: () => Consumable[]
}

// Generate mock consumables data
const generateMockConsumables = (): Consumable[] => {
  return [
    {
      id: "CONS-001",
      name: "Syringe 5ml",
      category: "syringe",
      price: 50,
      stock: 200,
      description: "5ml disposable syringe",
      minStockLevel: 50,
      reorderLevel: 100,
      active: true,
    },
    {
      id: "CONS-002",
      name: "Syringe 10ml",
      category: "syringe",
      price: 70,
      stock: 150,
      description: "10ml disposable syringe",
      minStockLevel: 40,
      reorderLevel: 80,
      active: true,
    },
    {
      id: "CONS-003",
      name: "IV Bag 500ml",
      category: "iv_bag",
      price: 200,
      stock: 100,
      description: "500ml IV fluid bag",
      minStockLevel: 20,
      reorderLevel: 40,
      active: true,
    },
    {
      id: "CONS-004",
      name: "IV Cannula 18G",
      category: "cannula",
      price: 150,
      stock: 120,
      description: "18G IV cannula for adult patients",
      minStockLevel: 30,
      reorderLevel: 60,
      active: true,
    },
    {
      id: "CONS-005",
      name: "IV Cannula 22G",
      category: "cannula",
      price: 150,
      stock: 120,
      description: "22G IV cannula for pediatric patients",
      minStockLevel: 30,
      reorderLevel: 60,
      active: true,
    },
    {
      id: "CONS-006",
      name: "Disposable Gloves (pair)",
      category: "gloves",
      price: 30,
      stock: 500,
      description: "Disposable examination gloves",
      minStockLevel: 100,
      reorderLevel: 200,
      active: true,
    },
    {
      id: "CONS-007",
      name: "Alcohol Swabs",
      category: "swabs",
      price: 10,
      stock: 1000,
      description: "Alcohol prep pads for skin disinfection",
      minStockLevel: 200,
      reorderLevel: 400,
      active: true,
    },
    {
      id: "CONS-008",
      name: "Adhesive Plaster",
      category: "plaster",
      price: 20,
      stock: 300,
      description: "Adhesive bandage for wound dressing",
      minStockLevel: 50,
      reorderLevel: 100,
      active: true,
    },
    {
      id: "CONS-009",
      name: "Needle 21G",
      category: "needle",
      price: 30,
      stock: 250,
      description: "21G needle for injections",
      minStockLevel: 50,
      reorderLevel: 100,
      active: true,
    },
    {
      id: "CONS-010",
      name: "Needle 23G",
      category: "needle",
      price: 30,
      stock: 250,
      description: "23G needle for injections",
      minStockLevel: 50,
      reorderLevel: 100,
      active: true,
    },
    {
      id: "CONS-011",
      name: "Saline Bag 250ml",
      category: "saline",
      price: 150,
      stock: 80,
      description: "250ml normal saline solution",
      minStockLevel: 20,
      reorderLevel: 40,
      active: true,
    },
    {
      id: "CONS-012",
      name: "IV Giving Set",
      category: "iv_set",
      price: 100,
      stock: 150,
      description: "IV administration set",
      minStockLevel: 30,
      reorderLevel: 60,
      active: true,
    },
    {
      id: "CONS-013",
      name: "Cotton Wool (roll)",
      category: "cotton",
      price: 80,
      stock: 100,
      description: "Cotton wool roll for medical use",
      minStockLevel: 20,
      reorderLevel: 40,
      active: true,
    },
    {
      id: "CONS-014",
      name: "Surgical Tape",
      category: "tape",
      price: 120,
      stock: 80,
      description: "Medical adhesive tape",
      minStockLevel: 15,
      reorderLevel: 30,
      active: true,
    },
    {
      id: "CONS-015",
      name: "Gauze Swabs",
      category: "gauze",
      price: 50,
      stock: 200,
      description: "Sterile gauze swabs",
      minStockLevel: 40,
      reorderLevel: 80,
      active: true,
    },
  ]
}

export const useConsumableStore = create<ConsumableStore>((set, get) => ({
  consumables: generateMockConsumables(),

  getConsumableById: (id: string) => get().consumables.find((consumable) => consumable.id === id),

  addConsumable: (consumable: Consumable) =>
    set((state) => ({
      consumables: [...state.consumables, consumable],
    })),

  updateConsumable: (updatedConsumable: Consumable) =>
    set((state) => ({
      consumables: state.consumables.map((consumable) =>
        consumable.id === updatedConsumable.id ? updatedConsumable : consumable,
      ),
    })),

  deleteConsumable: (id: string) =>
    set((state) => ({
      consumables: state.consumables.map((consumable) =>
        consumable.id === id ? { ...consumable, active: false } : consumable,
      ),
    })),

  searchConsumables: (term: string) => {
    const consumables = get().consumables
    if (!term) return consumables.filter((consumable) => consumable.active)

    return consumables.filter(
      (consumable) =>
        consumable.active &&
        (consumable.name.toLowerCase().includes(term.toLowerCase()) ||
          consumable.category.toLowerCase().includes(term.toLowerCase())),
    )
  },

  getActiveConsumables: () => get().consumables.filter((consumable) => consumable.active),

  generateConsumableId: () => {
    const consumables = get().consumables
    const lastId = consumables.length > 0 ? Number.parseInt(consumables[consumables.length - 1].id.split("-")[1]) : 0
    return `CONS-${String(lastId + 1).padStart(3, "0")}`
  },

  decreaseStock: (id: string, quantity: number) => {
    const consumable = get().getConsumableById(id)
    if (!consumable || consumable.stock < quantity) return false

    set((state) => ({
      consumables: state.consumables.map((c) => (c.id === id ? { ...c, stock: c.stock - quantity } : c)),
    }))

    return true
  },

  increaseStock: (id: string, quantity: number) => {
    set((state) => ({
      consumables: state.consumables.map((consumable) =>
        consumable.id === id ? { ...consumable, stock: consumable.stock + quantity } : consumable,
      ),
    }))
  },

  getRecommendedConsumables: (medicationForm: string) => {
    const consumables = get().getActiveConsumables()

    switch (medicationForm.toLowerCase()) {
      case "injection":
        return consumables.filter((c) => ["syringe", "needle", "swabs", "plaster", "gloves"].includes(c.category))
      case "iv":
        return consumables.filter((c) =>
          ["iv_bag", "cannula", "iv_set", "swabs", "plaster", "gloves"].includes(c.category),
        )
      case "oral":
      case "tablet":
      case "capsule":
        // No specific consumables needed for oral medications
        return []
      case "topical":
        return consumables.filter((c) => ["gloves", "gauze"].includes(c.category))
      default:
        return []
    }
  },

  getLowStockConsumables: () => {
    return get().consumables.filter(
      (consumable) => consumable.active && consumable.stock <= (consumable.minStockLevel || 0),
    )
  },
}))
