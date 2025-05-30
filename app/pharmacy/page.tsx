"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Edit,
  Info,
  Pill,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/lib/data/store";
import { useMedicineStore, type Medicine } from "@/lib/data/medicines";
import type { Prescription, PrescriptionItem } from "@/lib/data/store";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/toaster";
import { useConsumableStore, type Consumable } from "@/lib/data/consumables";
import {
  useStoreExtension,
  type ConsumableItem,
  getRecommendedConsumablesText,
} from "@/lib/data/storeext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function PharmacyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMedicineTerm, setSearchMedicineTerm] = useState("");
  const [searchConsumableTerm, setSearchConsumableTerm] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null
  );
  const [selectedConsumable, setSelectedConsumable] =
    useState<Consumable | null>(null);
  const [medicineQuantity, setMedicineQuantity] = useState(1);
  const [consumableQuantity, setConsumableQuantity] = useState(1);
  const [medicineNotes, setMedicineNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedConsumables, setSelectedConsumables] = useState<
    ConsumableItem[]
  >([]);

  // Get data from the central store
  const {
    patients,
    bills,
    updatePatient,
    addBill,
    updateBill,
    getBillById,
    calculateTotal: calculateBillTotal,
    generateBillId,
    updatePrescriptionItems,
    refreshHMOClaims,
  } = useAppStore();

  // Get medicines from the medicine store
  const { medicines, searchMedicines, getMedicineById, decreaseStock } =
    useMedicineStore();

  // Get consumables from the consumable store
  const {
    consumables,
    searchConsumables,
    getConsumableById,
    decreaseStock: decreaseConsumableStock,
    getRecommendedConsumables,
  } = useConsumableStore();

  // Get store extension functions
  const {
    addConsumablesToBill,
    getRecommendedConsumablesForMedication,
    createConsumableBillItem,
  } = useStoreExtension();

  // Update the useEffect hook to properly fetch and maintain patient information and status
  useEffect(() => {
    // Find patients who have been sent to the pharmacy by the doctor
    const pharmacyPatients = patients.filter((patient) => {
      if (!patient.visits || patient.visits.length === 0) return false;

      const latestVisit = patient.visits[patient.visits.length - 1];

      // Include patients whose diagnosis indicates they're with pharmacy, cash point, or HMO
      // or have pharmacy bills that are paid but not dispensed
      const hasPharmacyBills = bills.some(
        (bill) =>
          bill.patientId === patient.id &&
          bill.type === "pharmacy" &&
          bill.status !== "cancelled" &&
          bill.visitId === latestVisit.id &&
          (!bill.allItemsDispensed || bill.status === "hmo_pending")
      );

      return (
        latestVisit.diagnosis?.startsWith("With Pharmacy:") ||
        latestVisit.diagnosis?.startsWith("With Cash Point:") ||
        latestVisit.diagnosis?.startsWith("With HMO:") ||
        hasPharmacyBills
      );
    });

    // Create prescriptions from these patients
    const newPrescriptions: Prescription[] = [];

    pharmacyPatients.forEach((patient) => {
      const latestVisit = patient.visits![patient.visits!.length - 1];
      const doctorPrescriptions = latestVisit.prescriptions || [];

      // Check if there's a bill for this patient's pharmacy items
      const pharmacyBill = bills.find(
        (bill) =>
          bill.patientId === patient.id &&
          bill.type === "pharmacy" &&
          bill.status !== "cancelled" &&
          bill.visitId === latestVisit.id
      );

      // Determine the status based on the diagnosis and bill status
      let status: Prescription["status"] = "pending";
      let displayStatus = "With Pharmacy";

      if (pharmacyBill) {
        if (pharmacyBill.status === "hmo_pending") {
          // HMO patients with pending approval
          status = "hmo_pending";
          displayStatus = "With HMO Desk";
        } else if (pharmacyBill.status === "paid") {
          // Bill is paid
          status = "paid";
          displayStatus = "Paid";
        } else if (
          patient.patientType === "cash" &&
          latestVisit.diagnosis?.startsWith("With Cash Point:")
        ) {
          // Cash patients with billing
          status = "billed";
          displayStatus = "With Cash Point";
        }
      } else {
        // No bill yet, determine status based on diagnosis
        if (latestVisit.diagnosis?.startsWith("With Pharmacy:")) {
          status = "pending";
          displayStatus = "With Pharmacy";
        } else if (latestVisit.diagnosis?.startsWith("With Cash Point:")) {
          status = "billed";
          displayStatus = "With Cash Point";
        } else if (latestVisit.diagnosis?.startsWith("With HMO:")) {
          status = "hmo_pending";
          displayStatus = "With HMO Desk";
        }
      }

      // If we already have a prescription for this patient and visit, update it
      const existingPrescriptionIndex = prescriptions.findIndex(
        (p) => p.patientId === patient.id && p.visitId === latestVisit.id
      );

      if (existingPrescriptionIndex >= 0) {
        const existingPrescription = prescriptions[existingPrescriptionIndex];

        // Only update if the status has changed
        if (existingPrescription.status !== status) {
          // Update prescription items based on status
          let updatedItems = existingPrescription.items;

          if (
            existingPrescription.status === "hmo_pending" &&
            status === "pending"
          ) {
            // This means the claim was rejected by HMO and sent back to pharmacy
            updatedItems = existingPrescription.items.map((item) => ({
              ...item,
              paymentStatus: "pending",
              dispensed: false, // Reset dispensed status
            }));
          } else if (status === "paid") {
            updatedItems = existingPrescription.items.map((item) => ({
              ...item,
              paymentStatus: "paid",
            }));
          }

          // Check if all items are dispensed
          const allDispensed = updatedItems.every((item) => item.dispensed);

          newPrescriptions.push({
            ...existingPrescription,
            status,
            displayStatus,
            items: updatedItems,
            allItemsDispensed: allDispensed,
          });
        } else {
          newPrescriptions.push(existingPrescription);
        }
        return;
      }

      // If we have a bill but no prescription yet, create one from the bill
      if (pharmacyBill) {
        // Filter out consumable items - they should not be part of the prescription items
        const medicineItems = pharmacyBill.items.filter(
          (item) =>
            !item.description.startsWith("Consumable:") &&
            !(item as any).isConsumable
        );

        const items: PrescriptionItem[] = medicineItems.map((item) => {
          const medicineId = item.description.split(" - ")[0];
          const medicine = getMedicineById(medicineId);

          // Check if the item has been dispensed
          const isDispensed =
            "dispensed" in item ? Boolean(item.dispensed) : false;

          return {
            id: `PI-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            medicineId: medicineId,
            name:
              medicine?.name ||
              item.description.split(" - ")[1]?.split(" (")[0] ||
              "Unknown Medicine",
            dosage: medicine?.dosage || "",
            form: medicine?.form || "other",
            quantity: item.quantity,
            price: item.unitPrice,
            paymentStatus: pharmacyBill.status === "paid" ? "paid" : "pending",
            dispensed: isDispensed,
            notes: latestVisit.notes,
          };
        });

        // Check if all items are dispensed
        const allDispensed =
          pharmacyBill.allItemsDispensed ||
          items.every((item) => item.dispensed);

        newPrescriptions.push({
          id: pharmacyBill.id,
          patientId: patient.id,
          patientName: patient.name,
          doctorName: latestVisit.doctor || "Unknown Doctor",
          date: latestVisit.date,
          status,
          displayStatus,
          items,
          paymentType: patient.patientType,
          hmoProvider: patient.hmoProvider,
          destination: "final",
          doctorPrescriptions,
          notes: latestVisit.notes,
          visitId: latestVisit.id,
          allItemsDispensed: allDispensed,
        });
        return;
      }

      // Otherwise, create a new prescription
      newPrescriptions.push({
        id: `RX-${patient.id}-${Date.now().toString().slice(-6)}`,
        patientId: patient.id,
        patientName: patient.name,
        doctorName: latestVisit.doctor || "Unknown Doctor",
        date: latestVisit.date,
        status,
        displayStatus,
        items: [],
        paymentType: patient.patientType,
        hmoProvider: patient.hmoProvider,
        notes: latestVisit.notes,
        doctorPrescriptions,
        destination: "final",
        visitId: latestVisit.id,
        allItemsDispensed: false,
      });
    });

    // Only update if there are changes
    if (JSON.stringify(newPrescriptions) !== JSON.stringify(prescriptions)) {
      setPrescriptions(newPrescriptions);
    }
  }, [patients, bills, prescriptions, getMedicineById]);

  // Pagination functions
  const paginatePrescriptions = (list: Prescription[]) => {
    const filtered = filteredPrescriptions(list);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalPages = (list: Prescription[]) => {
    return Math.ceil(filteredPrescriptions(list).length / itemsPerPage);
  };

  // Pagination component
  const PaginationControls = ({ items }: { items: Prescription[] }) => {
    const totalPages = getTotalPages(items);

    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-4">
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  // Reset pagination when tab changes
  const handleTabChange = (value: string) => {
    setCurrentPage(1);
    setActiveTab(value);
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setEditMode(false);
    setSelectedConsumables([]); // Reset selected consumables
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setEditMode(true);
    setSelectedConsumables([]); // Reset selected consumables
  };

  const handleAddMedicineItem = () => {
    if (!selectedPrescription || !selectedMedicine) return;

    // Check if medicine is already in the prescription
    const existingItem = selectedPrescription.items.find(
      (item) => item.medicineId === selectedMedicine.id
    );

    if (existingItem) {
      toast({
        title: "Medicine already added",
        description:
          "This medicine is already in the prescription. Edit the quantity instead.",
        variant: "destructive",
      });
      return;
    }

    // Check if we have enough stock
    if (selectedMedicine.stock < medicineQuantity) {
      toast({
        title: "Insufficient stock",
        description: `Only ${selectedMedicine.stock} units available.`,
        variant: "destructive",
      });
      return;
    }

    const newItem: PrescriptionItem = {
      id: `PI-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      medicineId: selectedMedicine.id,
      name: selectedMedicine.name,
      dosage: selectedMedicine.dosage,
      form: selectedMedicine.form,
      quantity: medicineQuantity,
      price: selectedMedicine.price,
      paymentStatus: "pending",
      dispensed: false,
      notes: medicineNotes || undefined,
    };

    const updatedPrescription = {
      ...selectedPrescription,
      items: [...selectedPrescription.items, newItem],
    };

    setPrescriptions(
      prescriptions.map((p) =>
        p.id === selectedPrescription.id
          ? { ...updatedPrescription, destination: "final" }
          : p
      )
    );

    setSelectedPrescription({ ...updatedPrescription, destination: "final" });
    setSelectedMedicine(null);
    setMedicineQuantity(1);
    setMedicineNotes("");
    setSearchMedicineTerm("");

    toast({
      title: "Medicine added",
      description: `${selectedMedicine.name} has been added to the prescription.`,
    });
  };

  const handleAddConsumableItem = () => {
    if (!selectedConsumable) return;

    // Check if consumable is already in the list
    const existingItem = selectedConsumables.find(
      (item) => item.consumableId === selectedConsumable.id
    );

    if (existingItem) {
      toast({
        title: "Consumable already added",
        description:
          "This consumable is already in the list. Edit the quantity instead.",
        variant: "destructive",
      });
      return;
    }

    // Check if we have enough stock
    if (selectedConsumable.stock < consumableQuantity) {
      toast({
        title: "Insufficient stock",
        description: `Only ${selectedConsumable.stock} units available.`,
        variant: "destructive",
      });
      return;
    }

    const newConsumable: ConsumableItem = {
      consumableId: selectedConsumable.id,
      name: selectedConsumable.name,
      quantity: consumableQuantity,
      price: selectedConsumable.price,
    };

    setSelectedConsumables([...selectedConsumables, newConsumable]);
    setSelectedConsumable(null);
    setConsumableQuantity(1);
    setSearchConsumableTerm("");

    toast({
      title: "Consumable added",
      description: `${selectedConsumable.name} has been added to the prescription.`,
    });
  };

  const handleRemoveMedicineItem = (itemId: string) => {
    if (!selectedPrescription) return;

    const updatedItems = selectedPrescription.items.filter(
      (item) => item.id !== itemId
    );
    const updatedPrescription = {
      ...selectedPrescription,
      items: updatedItems,
    };

    setPrescriptions(
      prescriptions.map((p) =>
        p.id === selectedPrescription.id
          ? {
              ...updatedPrescription,
              items: updatedPrescription.items.map((item) => ({
                ...item,
                paymentStatus: item.paymentStatus as
                  | "pending"
                  | "paid"
                  | "dispensed",
              })),
            }
          : p
      )
    );

    setSelectedPrescription({
      ...updatedPrescription,
      destination: "final" as "final" | "injection",
    });

    toast({
      title: "Medicine removed",
      description: "The medicine has been removed from the prescription.",
    });
  };

  const handleRemoveConsumableItem = (consumableId: string) => {
    setSelectedConsumables(
      selectedConsumables.filter((item) => item.consumableId !== consumableId)
    );

    toast({
      title: "Consumable removed",
      description: "The consumable has been removed from the list.",
    });
  };

  // Function to handle sending prescriptions to cash point or HMO desk
  const handleSendToCashPoint = async () => {
    if (!selectedPrescription) return;

    if (selectedPrescription.items.length === 0) {
      toast({
        title: "No medicines added",
        description: "Please add at least one medicine to the prescription.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the patient to ensure we have the correct patient type
      const patient = patients.find(
        (p) => p.id === selectedPrescription.patientId
      );
      if (!patient) {
        throw new Error("Patient not found");
      }

      // Separate injectable and non-injectable medications
      const injectables = selectedPrescription.items.filter(
        (item) => item.form === "injection"
      );
      const nonInjectables = selectedPrescription.items.filter(
        (item) => item.form !== "injection"
      );

      // Check if we have both types of medications
      const hasInjectables = injectables.length > 0;
      const hasNonInjectables = nonInjectables.length > 0;

      // Generate unique bill IDs
      const regularBillId = hasNonInjectables ? generateBillId() : null;
      const injectionBillId = hasInjectables ? generateBillId() : null;

      // Handle pharmacy bill for non-injectable medications
      if (hasNonInjectables) {
        // Create bill items for non-injectable medications
        const billItems = nonInjectables.map((item) => ({
          id: item.id,
          description: `${item.medicineId} - ${item.name} ${item.dosage}`,
          quantity: item.quantity,
          unitPrice: item.price,
          dispensed: false,
          paymentStatus: "pending" as "pending" | "paid" | "dispensed",
        }));

        // Add consumable items to the bill items
        const consumableBillItems = selectedConsumables
          .filter((consumable) => {
            // Only include consumables that are not for injections
            const consumableObj = getConsumableById(consumable.consumableId);
            return (
              consumableObj &&
              !["syringe", "needle", "swabs"].includes(consumableObj.category)
            );
          })
          .map((consumable) => ({
            id: `CONS-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 9)}`,
            description: `Consumable: ${consumable.name}`,
            quantity: consumable.quantity,
            unitPrice: consumable.price,
            isConsumable: true, // Mark as consumable for identification
          }));

        // Create a new bill with status based on patient type
        const billStatus =
          patient.patientType === "hmo" ? "hmo_pending" : "pending";

        const newBill = {
          id: regularBillId!,
          patientId: selectedPrescription.patientId,
          patientName: selectedPrescription.patientName,
          date: new Date().toISOString().split("T")[0],
          status: billStatus as "pending" | "hmo_pending",
          type: "pharmacy" as const,
          destination: "final" as "injection" | "final" | null,
          items: [...billItems, ...consumableBillItems], // Include both medications and consumables
          visitId: selectedPrescription.visitId,
          allItemsDispensed: false,
          // Add a flag to indicate if this patient also has injections
          hasInjections: hasInjectables,
        };

        // Add the bill to the store
        addBill(newBill);
      }

      // Handle injections separately
      if (hasInjectables) {
        // Create injection bills for each injectable
        injectables.forEach((injection) => {
          // Get injection-specific consumables
          const injectionConsumables = selectedConsumables.filter((c) => {
            const consumable = getConsumableById(c.consumableId);
            return (
              consumable &&
              ["syringe", "needle", "swabs"].includes(consumable.category)
            );
          });

          // Create consumable bill items for injections
          const injectionConsumableBillItems = injectionConsumables.map(
            (consumable) => ({
              id: `CONS-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 9)}`,
              description: `Consumable: ${consumable.name}`,
              quantity: consumable.quantity,
              unitPrice: consumable.price,
              isConsumable: true,
            })
          );

          // Create a unique ID for this injection bill
          const singleInjectionBillId = `${injectionBillId}-${injection.id}`;

          // Create the bill
          const injectionBill = {
            id: singleInjectionBillId,
            patientId: patient.id,
            patientName: patient.name,
            date: new Date().toISOString().split("T")[0],
            status:
              patient.patientType === "hmo"
                ? ("hmo_pending" as const)
                : ("pending" as const),
            type: "medication" as const,
            items: [
              {
                id: `ITEM-${Date.now().toString().slice(-6)}-${Math.random()
                  .toString(36)
                  .substr(2, 5)}`,
                description: `${injection.medicineId} - ${injection.name} ${injection.dosage} (IV)`,
                quantity: injection.quantity,
                unitPrice: injection.price,
                dispensed: false,
              },
              ...injectionConsumableBillItems, // Include consumables for injections
            ],
            source: "injection_room", // Mark the source as injection_room
            visitId: selectedPrescription.visitId,
            // Add a flag to indicate if this patient also has regular medications
            hasRegularMeds: hasNonInjectables,
          };

          // Add bill to store
          addBill(injectionBill);
        });

        // Create injection data structure for the patient's visit
        const injectionData = {
          id: `INJ-${injectionBillId}`,
          patientId: patient.id,
          patientName: patient.name,
          doctorName: selectedPrescription.doctorName,
          date: new Date().toISOString().split("T")[0],
          status: "not_paid" as const,
          injections: injectables.map((item) => ({
            id: `INJ-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            medicineId: item.medicineId,
            name: item.name,
            dosage: item.dosage,
            form: item.form,
            route: "IV", // Default route
            frequency: "Once", // Default frequency
            quantity: item.quantity,
            price: item.price,
            administered: false,
            paymentStatus: "pending" as const,
            sentToCashPoint: true,
            billId: `${injectionBillId}-${item.id}`, // Link to the correct bill
            notes: "",
          })),
          notes: "",
          doctorPrescriptions: selectedPrescription.doctorPrescriptions || [],
          // Add flags to track the overall workflow
          hasRegularMeds: hasNonInjectables,
          regularMedsCompleted: false,
        };

        // Update the patient's visit
        if (patient.visits && patient.visits.length > 0) {
          const updatedVisits = [...patient.visits];
          const latestVisitIndex = updatedVisits.length - 1;

          updatedVisits[latestVisitIndex] = {
            ...updatedVisits[latestVisitIndex],
            injectionData: injectionData,
          };

          // Update the patient
          updatePatient({
            ...patient,
            visits: updatedVisits,
          });
        }
      }

      // Update the patient's diagnosis based on their type
      if (patient.visits && patient.visits.length > 0) {
        const updatedVisits = [...patient.visits];
        const latestVisitIndex = updatedVisits.length - 1;
        const latestVisit = updatedVisits[latestVisitIndex];

        // Store the original diagnosis for later reference
        const originalDiagnosis =
          latestVisit.diagnosis?.split(": ")[1] || latestVisit.diagnosis || "";

        // Update the diagnosis based on patient type
        const updatedDiagnosis =
          patient.patientType === "hmo"
            ? `With HMO: ${originalDiagnosis}`
            : `With Cash Point: ${originalDiagnosis}`;

        updatedVisits[latestVisitIndex] = {
          ...latestVisit,
          diagnosis: updatedDiagnosis,
          // Don't add properties that don't exist in the Visit type
        };

        // Update the patient
        updatePatient({
          ...patient,
          visits: updatedVisits,
        });
      }

      // Update prescription status in our local state
      // Use the regular bill ID if available, otherwise use the injection bill ID
      const billToUse = regularBillId || injectionBillId;

      const updatedStatus =
        patient.patientType === "hmo" ? "hmo_pending" : "billed";
      const updatedDisplayStatus =
        patient.patientType === "hmo" ? "With HMO Desk" : "With Cash Point";

      const updatedPrescription = {
        ...selectedPrescription,
        id: billToUse!,
        status: updatedStatus as "hmo_pending" | "billed",
        displayStatus: updatedDisplayStatus,
        destination: "final" as "injection" | "final",
        // Add flags to track the workflow
        hasInjections: hasInjectables,
        hasRegularMeds: hasNonInjectables,
      };

      setPrescriptions([
        ...prescriptions.filter((p) => p.id !== selectedPrescription.id),
        updatedPrescription,
      ]);
      setSelectedPrescription(updatedPrescription);
      setEditMode(false);
      setSelectedConsumables([]); // Clear selected consumables after sending

      // For HMO patients, refresh claims
      if (patient.patientType === "hmo") {
        refreshHMOClaims();

        toast({
          title: "Prescription sent to HMO desk",
          description:
            injectables.length > 0 && nonInjectables.length > 0
              ? "Medications and injections sent to HMO desk for approval."
              : injectables.length > 0
              ? "Injections sent to HMO desk for approval."
              : "The prescription has been sent to HMO desk for approval.",
        });
      } else {
        toast({
          title: "Prescription processed",
          description:
            injectables.length > 0 && nonInjectables.length > 0
              ? "Non-injectable medications sent to Cash Point, injectables to Injection Room."
              : injectables.length > 0
              ? "Injectable medications sent to Injection Room."
              : "The prescription has been sent to Cash Point for payment.",
        });
      }
    } catch (error) {
      console.error("Error processing prescription:", error);
      toast({
        title: "Failed to process prescription",
        description:
          "There was an error processing the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dispensing medications
  const handleDispenseMedication = async () => {
    if (!selectedPrescription) return;

    setIsSubmitting(true);

    try {
      // Decrease stock for each medicine
      let stockError = false;

      for (const item of selectedPrescription.items) {
        const success = decreaseStock(item.medicineId, item.quantity);
        if (!success) {
          stockError = true;
          const medicine = getMedicineById(item.medicineId);
          toast({
            title: "Insufficient stock",
            description: `Not enough ${medicine?.name} in stock.`,
            variant: "destructive",
          });
          break;
        }
      }

      if (stockError) {
        setIsSubmitting(false);
        return;
      }

      // Get the bill to check for consumables
      const bill = getBillById(selectedPrescription.id);
      if (bill) {
        // Decrease stock for consumables in the bill
        const consumableItems = bill.items.filter(
          (item) =>
            item.description.startsWith("Consumable:") ||
            (item as any).isConsumable
        );

        for (const item of consumableItems) {
          // Extract consumable name from description
          const consumableName = item.description.replace("Consumable: ", "");
          // Find the consumable by name
          const consumable = consumables.find((c) => c.name === consumableName);

          if (consumable) {
            const success = decreaseConsumableStock(
              consumable.id,
              item.quantity
            );
            if (!success) {
              toast({
                title: "Insufficient consumable stock",
                description: `Not enough ${consumableName} in stock.`,
                variant: "destructive",
              });
              stockError = true;
              break;
            }
          }
        }

        if (stockError) {
          setIsSubmitting(false);
          return;
        }
      }

      // Keep prescription status as "paid" but mark all items as dispensed
      const updatedItems = selectedPrescription.items.map((item) => ({
        ...item,
        paymentStatus: "dispensed" as const,
        dispensed: true,
      }));

      const updatedPrescription = {
        ...selectedPrescription,
        items: updatedItems,
        allItemsDispensed: true,
      };

      // Update the bill in the central store to mark items as dispensed
      if (bill) {
        updateBill({
          ...bill,
          items: bill.items.map((item) => ({
            ...item,
            dispensed: true,
          })),
          allItemsDispensed: true,
        });
      }

      // Update the patient record
      const patient = patients.find(
        (p) => p.id === selectedPrescription.patientId
      );
      if (patient && patient.visits && patient.visits.length > 0) {
        const updatedVisits = [...patient.visits];
        const latestVisitIndex = updatedVisits.length - 1;

        // Add dispensed medications to the visit record
        const dispensedMeds = selectedPrescription.items.map(
          (item) => `${item.name} ${item.dosage} - ${item.quantity} units`
        );

        updatedVisits[latestVisitIndex] = {
          ...updatedVisits[latestVisitIndex],
          // Remove any workflow prefixes from diagnosis
          diagnosis: updatedVisits[latestVisitIndex].diagnosis.includes(": ")
            ? updatedVisits[latestVisitIndex].diagnosis.split(": ")[1]
            : updatedVisits[latestVisitIndex].diagnosis,
          prescriptions: dispensedMeds,
          notes:
            (updatedVisits[latestVisitIndex].notes || "") +
            `\n\nPharmacy Notes (${new Date().toLocaleDateString()}): Medications and consumables dispensed by ${
              user?.name || "Pharmacist"
            }`,
        };

        // Update the patient in the central store
        updatePatient({
          ...patient,
          visits: updatedVisits,
        });
      }

      // Update the prescriptions state
      setPrescriptions(
        prescriptions.map((p) =>
          p.id === selectedPrescription.id ? updatedPrescription : p
        )
      );

      // Switch to the dispensed tab
      setActiveTab("dispensed");
      setCurrentPage(1);
      setSelectedPrescription(null);

      toast({
        title: "Medication dispensed",
        description:
          "The medication and consumables have been successfully dispensed to the patient.",
      });
    } catch (error) {
      toast({
        title: "Failed to dispense medication",
        description:
          "There was an error processing the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter prescriptions by their status
  const pendingPrescriptions = prescriptions.filter(
    (p) => p.status === "pending"
  );
  const billedPrescriptions = prescriptions.filter(
    (p) => p.status === "billed"
  );
  const paidPrescriptions = prescriptions.filter(
    (p) =>
      p.status === "paid" &&
      !p.allItemsDispensed &&
      !p.items.every((item) => item.dispensed)
  );
  const hmoPrescriptions = prescriptions.filter(
    (p) => p.status === "hmo_pending" || p.status === "hmo_approved"
  );
  const dispensedPrescriptions = prescriptions.filter(
    (p) =>
      p.allItemsDispensed === true ||
      (p.items.length > 0 && p.items.every((item) => item.dispensed))
  );

  const calculateItemsTotal = (items: PrescriptionItem[]) => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateConsumablesTotal = (items: ConsumableItem[]) => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const filteredPrescriptions = (list: Prescription[]) => {
    if (!searchTerm) return list;

    return list.filter(
      (p) =>
        p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredMedicines = searchMedicines(searchMedicineTerm);
  const filteredConsumables = searchConsumables(searchConsumableTerm);

  // Get recommended consumables text for a medication
  const getConsumableRecommendations = (medicationForm: string) => {
    if (!medicationForm) return "No consumables needed";

    return getRecommendedConsumablesText(medicationForm);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pharmacy</h1>
            <p className="text-muted-foreground">
              Manage prescriptions and dispense medications
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push("/pharmacy/medicines")}>
              <Pill className="mr-2 h-4 w-4" />
              Manage Medicines
            </Button>
          </div>
        </div>

        <div className="flex w-full mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by patient name or ID..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="pending">New</TabsTrigger>
                <TabsTrigger value="billed">Billed</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="hmo">HMO</TabsTrigger>
                <TabsTrigger value="dispensed">Dispensed</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-4">
                {filteredPrescriptions(pendingPrescriptions).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No pending prescriptions
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginatePrescriptions(pendingPrescriptions).map(
                      (prescription) => (
                        <Card key={prescription.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {prescription.patientName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  ID: {prescription.patientId} • RX:{" "}
                                  {prescription.id}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-800"
                              >
                                {prescription.displayStatus}
                              </Badge>
                            </div>
                            <p className="text-sm mb-1">
                              Doctor: {prescription.doctorName}
                            </p>
                            <p className="text-sm mb-3">
                              Prescriptions:{" "}
                              {prescription.doctorPrescriptions?.length || 0}
                            </p>
                            <div className="flex space-x-2">
                              <Button
                                className="flex-1"
                                onClick={() =>
                                  handleViewPrescription(prescription)
                                }
                              >
                                View
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() =>
                                  handleEditPrescription(prescription)
                                }
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                    <PaginationControls items={pendingPrescriptions} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="billed" className="space-y-4 mt-4">
                {filteredPrescriptions(billedPrescriptions).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No billed prescriptions
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginatePrescriptions(billedPrescriptions).map(
                      (prescription) => (
                        <Card key={prescription.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {prescription.patientName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  ID: {prescription.patientId} • RX:{" "}
                                  {prescription.id}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-yellow-50 text-yellow-800"
                              >
                                {prescription.displayStatus}
                              </Badge>
                            </div>
                            <p className="text-sm mb-1">
                              Doctor: {prescription.doctorName}
                            </p>
                            <p className="text-sm mb-1">
                              Total: ₦
                              {calculateItemsTotal(
                                prescription.items
                              ).toLocaleString()}
                            </p>
                            <div className="flex space-x-2 mt-3">
                              <Button
                                className="flex-1"
                                onClick={() =>
                                  handleViewPrescription(prescription)
                                }
                              >
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() =>
                                  handleEditPrescription(prescription)
                                }
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                    <PaginationControls items={billedPrescriptions} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="paid" className="space-y-4 mt-4">
                {filteredPrescriptions(paidPrescriptions).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No paid prescriptions
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginatePrescriptions(paidPrescriptions).map(
                      (prescription) => (
                        <Card key={prescription.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {prescription.patientName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  ID: {prescription.patientId} • RX:{" "}
                                  {prescription.id}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-800"
                              >
                                Paid
                              </Badge>
                            </div>
                            <p className="text-sm mb-1">
                              Doctor: {prescription.doctorName}
                            </p>
                            <p className="text-sm mb-1">
                              Total: ₦
                              {calculateItemsTotal(
                                prescription.items
                              ).toLocaleString()}
                            </p>
                            <Button
                              className="w-full mt-3"
                              variant="default"
                              onClick={() =>
                                handleViewPrescription(prescription)
                              }
                            >
                              Dispense Medication
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    )}
                    <PaginationControls items={paidPrescriptions} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="hmo" className="space-y-4 mt-4">
                {filteredPrescriptions(hmoPrescriptions).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No HMO prescriptions
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginatePrescriptions(hmoPrescriptions).map(
                      (prescription) => (
                        <Card key={prescription.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {prescription.patientName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  ID: {prescription.patientId} • RX:{" "}
                                  {prescription.id}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-800"
                              >
                                {prescription.status === "hmo_approved"
                                  ? "HMO Approved"
                                  : "With HMO Desk"}
                              </Badge>
                            </div>
                            <p className="text-sm mb-1">
                              HMO: {prescription.hmoProvider}
                            </p>
                            <p className="text-sm mb-1">
                              Doctor: {prescription.doctorName}
                            </p>
                            <Button
                              className="w-full mt-3"
                              variant={
                                prescription.status === "hmo_approved"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                handleViewPrescription(prescription)
                              }
                            >
                              {prescription.status === "hmo_approved"
                                ? "Dispense Medication"
                                : "View Details"}
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    )}
                    <PaginationControls items={hmoPrescriptions} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="dispensed" className="space-y-4 mt-4">
                {filteredPrescriptions(dispensedPrescriptions).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No dispensed prescriptions
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginatePrescriptions(dispensedPrescriptions).map(
                      (prescription) => (
                        <Card key={prescription.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {prescription.patientName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  ID: {prescription.patientId} • RX:{" "}
                                  {prescription.id}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-800"
                              >
                                Dispensed
                              </Badge>
                            </div>
                            <p className="text-sm mb-1">
                              Doctor: {prescription.doctorName}
                            </p>
                            <p className="text-sm mb-1">
                              Date: {prescription.date}
                            </p>
                            <Button
                              className="w-full mt-3"
                              variant="outline"
                              onClick={() =>
                                handleViewPrescription(prescription)
                              }
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    )}
                    <PaginationControls items={dispensedPrescriptions} />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-2">
            {selectedPrescription ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        Prescription #{selectedPrescription.id}
                      </CardTitle>
                      <CardDescription>
                        Patient: {selectedPrescription.patientName} (ID:{" "}
                        {selectedPrescription.patientId})
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {editMode ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditMode(false)}
                        >
                          Cancel Editing
                        </Button>
                      ) : (
                        (selectedPrescription.status === "pending" ||
                          selectedPrescription.status === "billed") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditMode(true)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPrescription(null)}
                      >
                        Back to List
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Doctor</p>
                      <p>{selectedPrescription.doctorName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p>{selectedPrescription.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Payment Type
                      </p>
                      <p className="capitalize">
                        {selectedPrescription.paymentType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant="outline"
                        className={
                          selectedPrescription.status === "paid" ||
                          selectedPrescription.status === "dispensed" ||
                          selectedPrescription.status === "hmo_approved"
                            ? "bg-green-50 text-green-800"
                            : selectedPrescription.status === "billed" ||
                              selectedPrescription.status === "hmo_pending"
                            ? "bg-yellow-50 text-yellow-800"
                            : "bg-blue-50 text-blue-800"
                        }
                      >
                        {selectedPrescription.displayStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Doctor's prescriptions */}
                  {selectedPrescription.doctorPrescriptions &&
                    selectedPrescription.doctorPrescriptions.length > 0 && (
                      <div className="p-4 bg-white rounded-md">
                        <h3 className="text-sm font-medium mb-2">
                          Doctor's Prescriptions
                        </h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedPrescription.doctorPrescriptions.map(
                            (prescription, index) => (
                              <li key={index} className="text-sm">
                                {prescription}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {/* Doctor's notes */}
                  {selectedPrescription.notes && (
                    <div className="p-4 bg-white rounded-md">
                      <h3 className="text-sm font-medium mb-2">
                        Doctor's Notes
                      </h3>
                      <p className="text-sm whitespace-pre-line">
                        {selectedPrescription.notes}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Medications</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medication</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Form</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">
                            Price (₦)
                          </TableHead>
                          <TableHead>Status</TableHead>
                          {editMode && <TableHead></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPrescription.items.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={editMode ? 7 : 6}
                              className="text-center py-4 text-muted-foreground"
                            >
                              No medications added yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedPrescription.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.name}
                                {item.form && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 ml-1 -mt-1"
                                      >
                                        <Info className="h-3 w-3 text-muted-foreground" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-2 text-xs">
                                      {getConsumableRecommendations(item.form)}
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </TableCell>
                              <TableCell>{item.dosage}</TableCell>
                              <TableCell className="capitalize">
                                {item.form}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.price.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    item.paymentStatus === "paid" ||
                                    item.paymentStatus === "dispensed"
                                      ? "bg-green-50 text-green-800"
                                      : "bg-yellow-50 text-yellow-800"
                                  }
                                >
                                  {item.paymentStatus === "paid"
                                    ? "Paid"
                                    : item.paymentStatus === "dispensed"
                                    ? "Dispensed"
                                    : "Pending"}
                                </Badge>
                              </TableCell>
                              {editMode && (
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleRemoveMedicineItem(item.id)
                                    }
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        )}
                        {selectedPrescription.items.length > 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-right font-semibold"
                            >
                              Total
                            </TableCell>
                            <TableCell className="text-right">
                              {selectedPrescription.items.reduce(
                                (sum, item) => sum + item.quantity,
                                0
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ₦
                              {calculateItemsTotal(
                                selectedPrescription.items
                              ).toLocaleString()}
                            </TableCell>
                            <TableCell colSpan={editMode ? 2 : 1}></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Consumables section */}
                  {(editMode || selectedConsumables.length > 0) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Consumables
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Consumable</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">
                              Price (₦)
                            </TableHead>
                            <TableHead className="text-right">
                              Total (₦)
                            </TableHead>
                            {editMode && <TableHead></TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedConsumables.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={editMode ? 6 : 5}
                                className="text-center py-4 text-muted-foreground"
                              >
                                No consumables added yet
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedConsumables.map((item) => {
                              const consumable = getConsumableById(
                                item.consumableId
                              );
                              return (
                                <TableRow key={item.consumableId}>
                                  <TableCell className="font-medium">
                                    {item.name}
                                  </TableCell>
                                  <TableCell className="capitalize">
                                    {consumable?.category || "Unknown"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.quantity}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.price.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {(
                                      item.quantity * item.price
                                    ).toLocaleString()}
                                  </TableCell>
                                  {editMode && (
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleRemoveConsumableItem(
                                            item.consumableId
                                          )
                                        }
                                      >
                                        <X className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TableCell>
                                  )}
                                </TableRow>
                              );
                            })
                          )}
                          {selectedConsumables.length > 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-right font-semibold"
                              >
                                Total
                              </TableCell>
                              <TableCell className="text-right">
                                {selectedConsumables.reduce(
                                  (sum, item) => sum + item.quantity,
                                  0
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                ₦
                                {calculateConsumablesTotal(
                                  selectedConsumables
                                ).toLocaleString()}
                              </TableCell>
                              {editMode && <TableCell></TableCell>}
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {editMode && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          Add Medication
                        </h3>
                        <div className="space-y-4">
                          <div className="flex space-x-2">
                            <div className="flex-1 relative">
                              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search medicines..."
                                className="pl-8"
                                value={searchMedicineTerm}
                                onChange={(e) =>
                                  setSearchMedicineTerm(e.target.value)
                                }
                              />

                              {searchMedicineTerm &&
                                filteredMedicines.length > 0 && (
                                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                    {filteredMedicines.map((medicine) => (
                                      <div
                                        key={medicine.id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                          setSelectedMedicine(medicine);
                                          setSearchMedicineTerm(medicine.name);
                                        }}
                                      >
                                        <div className="font-medium">
                                          {medicine.name} {medicine.dosage}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {medicine.form} • ₦{medicine.price} •
                                          Stock: {medicine.stock}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>

                            <div className="w-24">
                              <Input
                                type="number"
                                min="1"
                                value={medicineQuantity}
                                onChange={(e) =>
                                  setMedicineQuantity(
                                    Number.parseInt(e.target.value) || 1
                                  )
                                }
                                placeholder="Qty"
                              />
                            </div>
                          </div>

                          {selectedMedicine && (
                            <div className="p-4 border rounded-md">
                              <div className="flex justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">
                                    {selectedMedicine.name}{" "}
                                    {selectedMedicine.dosage}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedMedicine.form} • ₦
                                    {selectedMedicine.price} • Stock:{" "}
                                    {selectedMedicine.stock}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedMedicine(null);
                                    setSearchMedicineTerm("");
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="space-y-2 mt-2">
                                <Label htmlFor="medicineNotes">Notes</Label>
                                <Textarea
                                  id="medicineNotes"
                                  value={medicineNotes}
                                  onChange={(e) =>
                                    setMedicineNotes(e.target.value)
                                  }
                                  placeholder="Add any notes about this medication..."
                                  rows={2}
                                />
                              </div>

                              <Button
                                className="w-full mt-3"
                                onClick={handleAddMedicineItem}
                                disabled={
                                  !selectedMedicine || medicineQuantity < 1
                                }
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Medication
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-semibold">
                            Add Consumables
                          </h3>
                          {selectedPrescription.items.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Info className="h-4 w-4 mr-1" />
                                    Recommended Consumables
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <ScrollArea className="h-72">
                                    <div className="space-y-4 p-2">
                                      <h4 className="font-medium">
                                        Based on your medications:
                                      </h4>
                                      {selectedPrescription.items.map(
                                        (item) => (
                                          <div
                                            key={item.id}
                                            className="space-y-2"
                                          >
                                            <div className="flex items-center">
                                              <span className="font-medium">
                                                {item.name}
                                              </span>
                                              <Badge className="ml-2 capitalize">
                                                {item.form}
                                              </Badge>
                                            </div>
                                            <p className="text-sm">
                                              {getConsumableRecommendations(
                                                item.form
                                              )}
                                            </p>
                                            <Separator />
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </ScrollArea>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div className="flex space-x-2">
                            <div className="flex-1 relative">
                              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search consumables..."
                                className="pl-8"
                                value={searchConsumableTerm}
                                onChange={(e) =>
                                  setSearchConsumableTerm(e.target.value)
                                }
                              />

                              {searchConsumableTerm &&
                                filteredConsumables.length > 0 && (
                                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                    {filteredConsumables.map((consumable) => (
                                      <div
                                        key={consumable.id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                          setSelectedConsumable(consumable);
                                          setSearchConsumableTerm(
                                            consumable.name
                                          );
                                        }}
                                      >
                                        <div className="font-medium">
                                          {consumable.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {consumable.category} • ₦
                                          {consumable.price} • Stock:{" "}
                                          {consumable.stock}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>

                            <div className="w-24">
                              <Input
                                type="number"
                                min="1"
                                value={consumableQuantity}
                                onChange={(e) =>
                                  setConsumableQuantity(
                                    Number.parseInt(e.target.value) || 1
                                  )
                                }
                                placeholder="Qty"
                              />
                            </div>
                          </div>

                          {selectedConsumable && (
                            <div className="p-4 border rounded-md">
                              <div className="flex justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">
                                    {selectedConsumable.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedConsumable.category} • ₦
                                    {selectedConsumable.price} • Stock:{" "}
                                    {selectedConsumable.stock}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedConsumable(null);
                                    setSearchConsumableTerm("");
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              <Button
                                className="w-full mt-3"
                                onClick={handleAddConsumableItem}
                                disabled={
                                  !selectedConsumable || consumableQuantity < 1
                                }
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Consumable
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPrescription(null)}
                  >
                    Back
                  </Button>

                  {/* Update the button text for HMO patients */}
                  {selectedPrescription.status === "pending" && (
                    <Button
                      onClick={handleSendToCashPoint}
                      disabled={
                        isSubmitting || selectedPrescription.items.length === 0
                      }
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {isSubmitting
                        ? "Processing..."
                        : selectedPrescription.paymentType === "hmo"
                        ? "Send to HMO Desk"
                        : "Send to Cash Point"}
                    </Button>
                  )}

                  {selectedPrescription.status === "paid" &&
                    !selectedPrescription.allItemsDispensed && (
                      <Button
                        onClick={handleDispenseMedication}
                        disabled={isSubmitting}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Processing..." : "Dispense Medication"}
                      </Button>
                    )}

                  {selectedPrescription.status === "hmo_approved" && (
                    <Button
                      onClick={handleDispenseMedication}
                      disabled={isSubmitting}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Processing..." : "Dispense Medication"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Prescription Details</CardTitle>
                  <CardDescription>
                    Select a prescription from the list to view or edit details
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Pill className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No prescription selected. Click on a prescription from the
                    list to view details.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </MainLayout>
  );
}
