// This file now just exports types and the mock data generator
// The actual store functionality is moved to store.ts

export interface BillItem {
    id: string
    description: string
    quantity: number
    unitPrice: number
    isInjectable?: boolean // Add this property to support injection tracking
    dispensed?: boolean // Add this property to track if the item has been dispensed
    paymentStatus?: "pending" | "paid" | "dispensed" // Add this property to track payment status
}

// Add discount fields to the Bill interface
export interface Bill {
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
    total?: number
    // Add these new fields for staff discount
    discount?: number // Discount percentage applied to the bill
    discountReason?: string // Reason for discount (e.g., "Staff Discount")
    originalTotal?: number // Original total before discount
}

// Generate mock data - exported for use in the store
export const generateMockBills = (): Bill[] => {
    return [
        {
            id: "BILL-1001",
            patientId: "P-1001",
            patientName: "John Doe",
            date: "2025-02-01",
            status: "pending",
            type: "consultation",
            items: [
                {
                    id: "BI1",
                    description: "Consultation Fee",
                    quantity: 1,
                    unitPrice: 5000,
                },
                {
                    id: "BI2",
                    description: "Registration Fee",
                    quantity: 1,
                    unitPrice: 2000,
                },
            ],
        },
        {
            id: "BILL-1002",
            patientId: "P-1002",
            patientName: "Sarah Johnson",
            date: "2025-02-01",
            status: "pending",
            type: "pharmacy",
            items: [
                {
                    id: "BI3",
                    description: "Amoxicillin 500mg",
                    quantity: 21,
                    unitPrice: 150,
                },
                {
                    id: "BI4",
                    description: "Paracetamol 500mg",
                    quantity: 10,
                    unitPrice: 50,
                },
            ],
        },
        {
            id: "BILL-1003",
            patientId: "P-1003",
            patientName: "Michael Smith",
            date: "2025-03-23",
            status: "paid",
            type: "laboratory",
            items: [
                {
                    id: "BI5",
                    description: "Complete Blood Count",
                    quantity: 1,
                    unitPrice: 3500,
                },
                {
                    id: "BI6",
                    description: "Urinalysis",
                    quantity: 1,
                    unitPrice: 2500,
                },
            ],
            paymentMethod: "cash",
            paymentReference: "REF123456",
            paymentDate: "2025-26-03",
            processedBy: "Jane Cashier",
        },
        {
            id: "BILL-1004",
            patientId: "P-1004",
            patientName: "Emma Wilson",
            date: "2025-02-30",
            status: "cancelled",
            type: "pharmacy",
            items: [
                {
                    id: "BI7",
                    description: "Metformin 500mg",
                    quantity: 60,
                    unitPrice: 25,
                },
            ],
        },
        {
            id: "BILL-1005",
            patientId: "P-1005",
            patientName: "Chioma Okafor",
            date: "2025-02-01",
            status: "pending",
            type: "laboratory",
            items: [
                {
                    id: "BI8",
                    description: "Blood Sugar Test",
                    quantity: 1,
                    unitPrice: 2500,
                },
            ],
        },
        {
            id: "BILL-1006",
            patientId: "P-1006",
            patientName: "Oluwaseun Adeleke",
            date: "2025-02-30",
            status: "paid",
            type: "consultation",
            items: [
                {
                    id: "BI9",
                    description: "Specialist Consultation",
                    quantity: 1,
                    unitPrice: 7500,
                },
            ],
            paymentMethod: "card",
            paymentReference: "CARD-789012",
            paymentDate: "2025-02-30",
            processedBy: "Jane Cashier",
        },
        {
            id: "BILL-1007",
            patientId: "P-1007",
            patientName: "Ngozi Eze",
            date: "2025-02-29",
            status: "paid",
            type: "pharmacy",
            items: [
                {
                    id: "BI10",
                    description: "Metformin 500mg",
                    quantity: 30,
                    unitPrice: 25,
                },
                {
                    id: "BI11",
                    description: "Lisinopril 10mg",
                    quantity: 30,
                    unitPrice: 35,
                },
            ],
            paymentMethod: "transfer",
            paymentReference: "TRF-456789",
            paymentDate: "2025-02-29",
            processedBy: "John Cashier",
        },
        {
            id: "BILL-1008",
            patientId: "P-1008",
            patientName: "Emeka Okonkwo",
            date: "2025-02-29",
            status: "paid",
            type: "laboratory",
            items: [
                {
                    id: "BI12",
                    description: "Liver Function Test",
                    quantity: 1,
                    unitPrice: 4500,
                },
            ],
            paymentMethod: "cash",
            paymentReference: "CASH-345678",
            paymentDate: "2025-02-29",
            processedBy: "Jane Cashier",
        },
        {
            id: "BILL-1009",
            patientId: "P-1009",
            patientName: "Fatima Ibrahim",
            date: "2025-02-30",
            status: "paid",
            type: "consultation",
            items: [
                {
                    id: "BI13",
                    description: "Follow-up Consultation",
                    quantity: 1,
                    unitPrice: 3500,
                },
            ],
            paymentMethod: "card",
            paymentReference: "CARD-901234",
            paymentDate: "2025-02-30",
            processedBy: "Jane Cashier",
        },
        // {
        //     id: "BILL-1010",
        //     patientId: "P-1010",
        //     patientName: "Chinedu Okoro",
        //     date: "2025-02-01",
        //     status: "paid",
        //     type: "pharmacy",
        //     items: [
        //         {
        //             id: "BI14",
        //             description: "Amlodipine 5mg",
        //             quantity: 30,
        //             unitPrice: 30,
        //         },
        //     ],
        //     paymentMethod: "cash",
        //     paymentReference: "CASH-567890",
        //     paymentDate: "2025-02-01",
        //     processedBy: "Jane Cashier",
        // },
        {
            id: "BILL-1011",
            patientId: "P-1011",
            patientName: "Blessing Adeyemi",
            date: "2025-02-21",
            status: "paid",
            type: "laboratory",
            items: [
                {
                    id: "BI15",
                    description: "Thyroid Function Test",
                    quantity: 1,
                    unitPrice: 5500,
                },
            ],
            paymentMethod: "transfer",
            paymentReference: "TRF-678901",
            paymentDate: "2025-02-21",
            processedBy: "John Cashier",
        },
        {
            id: "BILL-1012",
            patientId: "P-1012",
            patientName: "Tunde Bakare",
            date: "2025-02-22",
            status: "paid",
            type: "consultation",
            items: [
                {
                    id: "BI16",
                    description: "Emergency Consultation",
                    quantity: 1,
                    unitPrice: 10000,
                },
            ],
            paymentMethod: "card",
            paymentReference: "CARD-123456",
            paymentDate: "2025-02-22",
            processedBy: "Jane Cashier",
        },
        {
            id: "BILL-1013",
            patientId: "P-1013",
            patientName: "Amina Mohammed",
            date: "2025-03-26",
            status: "paid",
            type: "pharmacy",
            items: [
                {
                    id: "BI17",
                    description: "Atorvastatin 20mg",
                    quantity: 30,
                    unitPrice: 45,
                },
                {
                    id: "BI18",
                    description: "Aspirin 75mg",
                    quantity: 30,
                    unitPrice: 15,
                },
            ],
            paymentMethod: "cash",
            paymentReference: "CASH-789012",
            paymentDate: "2025-03-26",
            processedBy: "John Cashier",
        },
    ]
}

export const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString()}`
}
