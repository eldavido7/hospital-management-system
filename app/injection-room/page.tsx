"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { ArrowLeft, Check, Search, Syringe } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useMedicineStore } from "@/lib/data/medicines";
import { useStoreExtension } from "@/lib/data/storeext";

// Interface for injection items
interface Injection {
  id: string;
  medicineId: string;
  name: string;
  dosage: string;
  form: string;
  route: string;
  frequency: string;
  quantity: number;
  price: number;
  administered: boolean;
  administeredTime?: string;
  administeredBy?: string;
  paymentStatus: "pending" | "paid";
  notes?: string;
  billId?: string;
  sentToCashPoint: boolean;
  saved?: boolean; // Add this flag to track if the administration has been saved
}

// Interface for injection requests
interface InjectionRequest {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  status: "not_paid" | "paid" | "in_progress" | "completed" | "later";
  injections: Injection[];
  notes?: string;
  doctorPrescriptions?: string[];
}

// Add this interface after the existing Injection and InjectionRequest interfaces
interface VaccinationRequest {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  status: "not_paid" | "paid" | "in_progress" | "completed" | "later";
  vaccineId: string;
  vaccineName: string;
  doseType: string;
  price: number;
  administered: boolean;
  administeredTime?: string;
  administeredBy?: string;
  notes?: string;
  appointmentId: string;
  billId?: string;
  isGovernmentProvided: boolean;
}

export default function InjectionRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [injectionRequests, setInjectionRequests] = useState<
    InjectionRequest[]
  >([]);
  const [selectedRequest, setSelectedRequest] =
    useState<InjectionRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [administrationNotes, setAdministrationNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);

  // Add these state variables in the InjectionRoomPage component, after the existing state variables
  const [vaccinationRequests, setVaccinationRequests] = useState<
    VaccinationRequest[]
  >([]);
  const [selectedVaccinationRequest, setSelectedVaccinationRequest] =
    useState<VaccinationRequest | null>(null);
  const [vaccinationNotes, setVaccinationNotes] = useState("");

  // Add a ref to track if we've already processed patient data
  const processedRef = useRef<Set<string>>(new Set());

  // Get data from the central store
  const {
    patients,
    bills,
    updatePatient,
    appointments,
    updateAppointment,
    getPatientById,
  } = useAppStore();

  // Get medicines from the medicine store
  const { decreaseStock } = useMedicineStore();

  // Get vaccination appointments from the extension store
  const { getVaccinationAppointments, completeVaccinationAdministration } =
    useStoreExtension();

  // Save injection requests to patient visits in the central store
  const saveInjectionRequestsToStore = (requests: InjectionRequest[]) => {
    requests.forEach((request) => {
      const patient = patients.find((p) => p.id === request.patientId);
      if (patient && patient.visits && patient.visits.length > 0) {
        const updatedVisits = patient.visits ? [...patient.visits] : [];
        const latestVisitIndex = updatedVisits.length - 1;
        const latestVisit = updatedVisits[latestVisitIndex];

        // Store injection data in the visit
        updatedVisits[latestVisitIndex] = {
          ...latestVisit,
          injectionData: request,
        };

        // Update the patient in the central store
        updatePatient({
          ...patient,
          visits: updatedVisits,
        });
      }
    });
  };

  // Add this function after the saveInjectionRequestsToStore function
  // Load vaccination requests from appointments and patient visits
  const loadVaccinationRequests = useCallback(() => {
    // Get all vaccination appointments that are in progress, regardless of payment status
    const vaccinationAppointments = getVaccinationAppointments().filter(
      (app) => app.status === "In Progress" || app.status === "scheduled"
    );

    const newVaccinationRequests: VaccinationRequest[] = [];

    vaccinationAppointments.forEach((appointment) => {
      const patient = getPatientById(appointment.patientId);
      if (!patient || !patient.visits || patient.visits.length === 0) return;

      // Find the visit with vaccination data
      const visit = patient.visits.find((v) => {
        // Check if this visit has vaccination data
        return (
          (v as any).vaccinationData &&
          (v as any).vaccinationData.sessions &&
          (v as any).vaccinationData.sessions.some(
            (s: any) => s.vaccineId === appointment.vaccinationDetails.vaccineId
          )
        );
      });

      if (!visit || !(visit as any).vaccinationData) return;

      // Get the vaccination session for this appointment
      const vaccinationData = (visit as any).vaccinationData;
      const sessions = vaccinationData.sessions || [];

      // Find the session that matches this appointment's vaccine
      const session = sessions.find(
        (s: any) =>
          s.vaccineId === appointment.vaccinationDetails.vaccineId &&
          s.status === "approved"
      );

      if (!session) return;

      // Determine payment status
      let isPaid = false;
      const billId = appointment.billId || session.billId;

      // For government-provided vaccines, they're automatically "paid"
      if (appointment.vaccinationDetails.isGovernmentProvided) {
        isPaid = true;
      } else if (billId) {
        // Check the bill payment status
        const bill = bills.find((b) => b.id === billId);
        isPaid = bill?.status === "paid";
      }

      // Determine the status based on payment status and other factors
      let status: "not_paid" | "paid" | "in_progress" | "completed" | "later" =
        isPaid ? "paid" : "not_paid";

      if (visit.diagnosis === "Completed") {
        status = "completed";
      } else if (visit.diagnosis && visit.diagnosis.includes("later")) {
        status = "later";
      } else if (session.administeredTime) {
        status = "completed";
      } else if (
        status === "paid" &&
        visit.diagnosis &&
        visit.diagnosis.includes("Injection Room")
      ) {
        // If paid and already in injection room, it's ready for administration
        status = "paid";
      }

      // Create a vaccination request
      const vaccinationRequest: VaccinationRequest = {
        id: `VACC-${appointment.id}`,
        patientId: patient.id,
        patientName: patient.name,
        date: appointment.date,
        status,
        vaccineId: appointment.vaccinationDetails.vaccineId,
        vaccineName: appointment.vaccinationDetails.vaccineName,
        doseType: appointment.vaccinationDetails.doseType,
        price: appointment.vaccinationDetails.price,
        administered: !!session.administeredTime,
        administeredTime: session.administeredTime,
        administeredBy: session.administeredBy,
        notes: session.notes || "",
        appointmentId: appointment.id,
        billId,
        isGovernmentProvided:
          appointment.vaccinationDetails.isGovernmentProvided,
      };

      newVaccinationRequests.push(vaccinationRequest);
    });

    setVaccinationRequests(newVaccinationRequests);
  }, [getVaccinationAppointments, getPatientById, bills]);

  // Load injection requests from patients in the central store
  useEffect(() => {
    // Find patients who have been sent to the injection room by the pharmacy
    const injectionPatients = patients.filter((patient) => {
      if (!patient.visits || patient.visits.length === 0) return false;

      const latestVisit = patient.visits[patient.visits.length - 1];

      // Include patients with injectionData
      if (latestVisit.injectionData) {
        return true;
      }

      // Include patients whose diagnosis indicates they're with injection room or HMO or cash point
      return (
        latestVisit.diagnosis &&
        (latestVisit.diagnosis.startsWith("With Injection Room:") ||
          latestVisit.diagnosis.startsWith("With Cash Point:") ||
          (patient.patientType === "hmo" &&
            latestVisit.diagnosis.startsWith("With HMO:")))
      );
    });

    // Create a set of patient IDs we already processed this render to avoid duplicate processing
    const processedThisRender = new Set<string>();

    // Create injection requests from these patients
    const updatedRequests = [...injectionRequests]; // Start with existing requests
    let hasChanges = false;

    injectionPatients.forEach((patient) => {
      // Skip if we already processed this patient in this render
      if (processedThisRender.has(patient.id)) return;

      // Mark this patient as processed in this render
      processedThisRender.add(patient.id);

      const latestVisit = patient.visits![patient.visits!.length - 1];
      const doctorPrescriptions = latestVisit.prescriptions || [];

      // Check if we have stored injection data in the visit
      if (latestVisit.injectionData) {
        // Find if we already have this request in our state
        const existingRequestIndex = updatedRequests.findIndex(
          (r) => r.id === latestVisit.injectionData!.id
        );

        // Use the stored injection data
        const storedRequest = latestVisit.injectionData as InjectionRequest;

        // Update payment status based on bills
        const updatedInjections = storedRequest.injections.map((injection) => {
          if (injection.billId) {
            const bill = bills.find((b) => b.id === injection.billId);
            if (bill) {
              // Update payment status based on bill status
              const newPaymentStatus: "pending" | "paid" =
                bill.status === "paid" ? "paid" : "pending";
              if (injection.paymentStatus !== newPaymentStatus) {
                hasChanges = true;
                return { ...injection, paymentStatus: newPaymentStatus };
              }
            }
          }
          return injection;
        });

        // Determine if status needs to be updated
        let updatedStatus = storedRequest.status;

        // Check if any injections are paid
        const hasPaidInjections = updatedInjections.some(
          (inj) => inj.paymentStatus === "paid"
        );

        // If status is "not_paid" and there are paid injections, move to "paid"
        if (updatedStatus === "not_paid" && hasPaidInjections) {
          updatedStatus = "paid";
          hasChanges = true;
        }

        const updatedRequest = {
          ...storedRequest,
          injections: updatedInjections,
          status: updatedStatus,
          doctorPrescriptions,
        };

        if (existingRequestIndex >= 0) {
          // Update existing request
          if (
            JSON.stringify(updatedRequests[existingRequestIndex]) !==
            JSON.stringify(updatedRequest)
          ) {
            updatedRequests[existingRequestIndex] = updatedRequest;
            hasChanges = true;
          }
        } else {
          // Add new request
          updatedRequests.push(updatedRequest);
          hasChanges = true;
        }
      } else {
        // Find injection bills for this patient
        // Look for all medication bills that belong to this patient and have source="injection_room"
        const injectionBills = bills.filter(
          (bill) =>
            bill.patientId === patient.id &&
            bill.type === "medication" &&
            bill.source === "injection_room" &&
            bill.visitId === latestVisit.id
        );

        // Only proceed if we found injection bills
        if (injectionBills.length > 0) {
          // Create injection items from these bills
          const injectionItems: Injection[] = [];

          injectionBills.forEach((bill) => {
            // Each bill should contain one injection item
            if (bill.items.length > 0) {
              const item = bill.items[0];
              // Parse the description to get medicine details
              // Format is usually: "medicineId - medicine name dosage (route)"
              const descParts = item.description.split(" - ");
              const medicineId = descParts[0];

              let medicineName = "";
              let dosage = "";
              let route = "IV"; // Default route

              if (descParts.length > 1) {
                const detailParts = descParts[1].split(" (");
                const nameAndDosage = detailParts[0].split(" ");

                if (nameAndDosage.length > 1) {
                  // Last part is likely the dosage
                  dosage = nameAndDosage[nameAndDosage.length - 1];
                  // Rest is the name
                  medicineName = nameAndDosage
                    .slice(0, nameAndDosage.length - 1)
                    .join(" ");
                } else {
                  medicineName = detailParts[0];
                }

                if (detailParts.length > 1) {
                  route = detailParts[1].replace(")", "");
                }
              } else {
                medicineName = descParts[0];
              }

              injectionItems.push({
                id: `INJ-${bill.id}`,
                medicineId: medicineId,
                name: medicineName,
                dosage: dosage,
                form: "injection",
                route: route,
                frequency: "Once", // Default frequency
                quantity: item.quantity,
                price: item.unitPrice,
                administered: false,
                paymentStatus: bill.status === "paid" ? "paid" : "pending",
                billId: bill.id,
                sentToCashPoint: true, // Already sent to cash point by pharmacy
                notes: "",
              });
            }
          });

          // Only create a request if we actually found injection bills
          if (injectionItems.length > 0) {
            // Determine the status based on whether any injections are paid
            const hasPaidInjections = injectionItems.some(
              (inj) => inj.paymentStatus === "paid"
            );
            const status = hasPaidInjections ? "paid" : "not_paid";

            // Create a unique ID for this injection request
            const requestId = `INJ-${patient.id}-${Date.now()
              .toString()
              .slice(-6)}`;

            // Create the injection request
            const newInjectionRequest: InjectionRequest = {
              id: requestId,
              patientId: patient.id,
              patientName: patient.name,
              doctorName: latestVisit.doctor || "Unknown Doctor",
              date: latestVisit.date,
              status: status as
                | "paid"
                | "in_progress"
                | "completed"
                | "not_paid"
                | "later",
              injections: injectionItems,
              notes: "",
              doctorPrescriptions,
            };

            // Add it to our updated requests
            updatedRequests.push(newInjectionRequest);
            hasChanges = true;

            // Save the injection data to the patient's visit
            const updatedVisits = patient.visits ? [...patient.visits] : [];
            const latestVisitIndex = updatedVisits.length - 1;

            updatedVisits[latestVisitIndex] = {
              ...updatedVisits[latestVisitIndex],
              injectionData: {
                ...newInjectionRequest,
                status: newInjectionRequest.status as
                  | "pending"
                  | "paid"
                  | "in_progress"
                  | "completed"
                  | "not_paid"
                  | "later",
              },
            };

            // Update the patient
            updatePatient({
              ...patient,
              visits: updatedVisits,
            });
          }
        }
      }
    });

    // Only update if there are changes
    if (hasChanges) {
      setInjectionRequests(updatedRequests);
    }
  }, [patients, bills, updatePatient]); // Don't include injectionRequests in dependencies to avoid infinite loop

  // Add this useEffect after the existing useEffect for loading injection requests
  // Load vaccination requests
  useEffect(() => {
    loadVaccinationRequests();
  }, [patients, appointments, loadVaccinationRequests]);

  // Pagination functions
  const paginateRequests = (requests: InjectionRequest[]) => {
    const filtered = filteredRequests(requests);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalPages = (requests: InjectionRequest[]) => {
    return Math.ceil(filteredRequests(requests).length / itemsPerPage);
  };

  // Pagination component
  const PaginationControls = ({
    requests,
  }: {
    requests: InjectionRequest[];
  }) => {
    const totalPages = getTotalPages(requests);

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
  };

  const handleViewRequest = (request: InjectionRequest) => {
    setSelectedRequest(request);
    setAdministrationNotes(request.notes || "");
  };

  // Add this function after the handleViewRequest function
  const handleViewVaccinationRequest = (request: VaccinationRequest) => {
    setSelectedVaccinationRequest(request);
    setVaccinationNotes(request.notes || "");
    setSelectedRequest(null); // Clear any selected injection request
  };

  // Add a function to save the administration progress
  const handleSaveAdministration = (injectionId: string) => {
    if (!selectedRequest) return;

    const updatedInjections = selectedRequest.injections.map((injection) => {
      if (injection.id === injectionId) {
        return {
          ...injection,
          saved: true,
        };
      }
      return injection;
    });

    const updatedRequest = {
      ...selectedRequest,
      injections: updatedInjections,
    };

    setInjectionRequests(
      injectionRequests.map((r) =>
        r.id === selectedRequest.id ? updatedRequest : r
      )
    );
    setSelectedRequest(updatedRequest);

    // Also update the patient's visit data
    const patient = patients.find((p) => p.id === selectedRequest.patientId);
    if (patient && patient.visits && patient.visits.length > 0) {
      const updatedVisits = [...patient.visits];
      const latestVisitIndex = updatedVisits.length - 1;

      updatedVisits[latestVisitIndex] = {
        ...updatedVisits[latestVisitIndex],
        injectionData: updatedRequest,
      };

      // Update the patient
      updatePatient({
        ...patient,
        visits: updatedVisits,
      });
    }

    toast({
      title: "Administration saved",
      description: "The injection administration has been saved.",
    });
  };

  // Start administration from the Paid tab
  const handleStartAdministration = async (request: InjectionRequest) => {
    // Check if at least one injection is paid for
    const hasPaidInjections = request.injections.some(
      (injection) => injection.paymentStatus === "paid"
    );

    if (!hasPaidInjections) {
      toast({
        title: "Cannot start administration",
        description:
          "At least one injection must be paid for before starting administration.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update request status
      const updatedRequest = {
        ...request,
        status: "in_progress" as const,
      };

      // Update the request in the state
      setInjectionRequests(
        injectionRequests.map((r) => (r.id === request.id ? updatedRequest : r))
      );
      setSelectedRequest(updatedRequest);

      // Update the patient's visit data
      const patient = patients.find((p) => p.id === request.patientId);
      if (patient && patient.visits && patient.visits.length > 0) {
        const updatedVisits = [...patient.visits];
        const latestVisitIndex = updatedVisits.length - 1;

        updatedVisits[latestVisitIndex] = {
          ...updatedVisits[latestVisitIndex],
          injectionData: updatedRequest,
        };

        // Update the patient
        updatePatient({
          ...patient,
          visits: updatedVisits,
        });
      }

      toast({
        title: "Administration started",
        description: "You can now record the injections administered.",
      });
    } catch (error) {
      toast({
        title: "Failed to start administration",
        description:
          "There was an error processing the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the handleToggleAdministered function to check payment status
  const handleToggleAdministered = (injectionId: string) => {
    if (!selectedRequest) return;

    const injection = selectedRequest.injections.find(
      (inj) => inj.id === injectionId
    );

    if (!injection) return;

    // Check if the injection is paid for
    if (injection.paymentStatus !== "paid" && !injection.administered) {
      toast({
        title: "Cannot administer",
        description: "This injection has not been paid for yet.",
        variant: "destructive",
      });
      return;
    }

    const updatedInjections = selectedRequest.injections.map((injection) => {
      if (injection.id === injectionId) {
        if (injection.administered) {
          // If already administered, un-administer it
          return {
            ...injection,
            administered: false,
            administeredTime: undefined,
            administeredBy: undefined,
            saved: false,
          };
        } else {
          // If not administered, mark as administered
          return {
            ...injection,
            administered: true,
            administeredTime: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            administeredBy: user?.name || "Unknown Nurse",
          };
        }
      }
      return injection;
    });

    const updatedRequest = {
      ...selectedRequest,
      injections: updatedInjections,
    };

    // Update the state
    setInjectionRequests(
      injectionRequests.map((r) =>
        r.id === selectedRequest.id ? updatedRequest : r
      )
    );
    setSelectedRequest(updatedRequest);

    // Update the patient's visit data
    const patient = patients.find((p) => p.id === selectedRequest.patientId);
    if (patient && patient.visits && patient.visits.length > 0) {
      const updatedVisits = [...patient.visits];
      const latestVisitIndex = updatedVisits.length - 1;

      updatedVisits[latestVisitIndex] = {
        ...updatedVisits[latestVisitIndex],
        injectionData: updatedRequest,
      };

      // Update the patient
      updatePatient({
        ...patient,
        visits: updatedVisits,
      });
    }
  };

  // Add this function after the handleToggleAdministered function
  const handleAdministerVaccination = async () => {
    if (!selectedVaccinationRequest) return;

    setIsSubmitting(true);

    try {
      // Call the completeVaccinationAdministration function from the extension store
      const result = completeVaccinationAdministration(
        selectedVaccinationRequest.appointmentId,
        user?.name || "Unknown Staff",
        vaccinationNotes
      );

      if (result.success) {
        // Update the vaccination request in our local state
        const updatedRequest = {
          ...selectedVaccinationRequest,
          administered: true,
          administeredTime: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          administeredBy: user?.name || "Unknown Staff",
          status: "completed" as const,
          notes: vaccinationNotes,
        };

        setVaccinationRequests(
          vaccinationRequests.map((r) =>
            r.id === selectedVaccinationRequest.id ? updatedRequest : r
          )
        );

        setSelectedVaccinationRequest(updatedRequest);

        toast({
          title: "Vaccination administered",
          description: result.message,
        });

        // Refresh the vaccination requests
        loadVaccinationRequests();
      } else {
        toast({
          title: "Failed to administer vaccination",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "An unexpected error occurred while administering the vaccination.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a function to move a patient to the "Later" tab
  const handleMoveToLater = async (requestToMove?: InjectionRequest) => {
    const request = requestToMove || selectedRequest;
    if (!request) return;

    setIsSubmitting(true);

    try {
      // Update request status
      const updatedRequest = {
        ...request,
        status: "later" as const,
      };

      // Update the state
      setInjectionRequests(
        injectionRequests.map((r) => (r.id === request.id ? updatedRequest : r))
      );

      // Only update selectedRequest if we're moving the currently selected request
      if (!requestToMove || requestToMove.id === selectedRequest?.id) {
        setSelectedRequest(updatedRequest);
      }

      // Update the patient's visit data
      const patient = patients.find((p) => p.id === request.patientId);
      if (patient && patient.visits && patient.visits.length > 0) {
        const updatedVisits = [...patient.visits];
        const latestVisitIndex = updatedVisits.length - 1;

        updatedVisits[latestVisitIndex] = {
          ...updatedVisits[latestVisitIndex],
          injectionData: updatedRequest,
        };

        // Update the patient
        updatePatient({
          ...patient,
          visits: updatedVisits,
        });
      }

      toast({
        title: "Moved to Later",
        description:
          "The patient has been moved to the Later tab for future administration.",
      });
    } catch (error) {
      toast({
        title: "Failed to move patient",
        description:
          "There was an error processing the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this function after the handleMoveToLater function
  const handleMoveVaccinationToLater = async () => {
    if (!selectedVaccinationRequest) return;

    setIsSubmitting(true);

    try {
      // Update the patient's visit to mark the vaccination for later
      const patient = patients.find(
        (p) => p.id === selectedVaccinationRequest.patientId
      );
      if (patient && patient.visits && patient.visits.length > 0) {
        // Find the visit with vaccination data
        const visitIndex = patient.visits.findIndex(
          (v) =>
            (v as any).vaccinationData &&
            (v as any).vaccinationData.sessions &&
            (v as any).vaccinationData.sessions.some(
              (s: any) => s.vaccineId === selectedVaccinationRequest.vaccineId
            )
        );

        if (visitIndex >= 0) {
          const updatedVisits = [...patient.visits];
          updatedVisits[visitIndex] = {
            ...updatedVisits[visitIndex],
            diagnosis: "With Injection Room Later: Vaccination",
          };

          // Update the patient
          updatePatient({
            ...patient,
            visits: updatedVisits,
          });

          // Update the appointment
          const appointment = appointments.find(
            (a) => a.id === selectedVaccinationRequest.appointmentId
          );
          if (appointment) {
            const updatedAppointment = {
              ...appointment,
              notes: `${appointment.notes || ""}\nMoved to later by ${
                user?.name || "staff"
              } on ${new Date().toISOString().split("T")[0]}`,
            };

            // Update the appointment in the store
            updateAppointment(updatedAppointment);
          }

          // Update the vaccination request in our local state
          const updatedRequest = {
            ...selectedVaccinationRequest,
            status: "later" as const,
          };

          setVaccinationRequests(
            vaccinationRequests.map((r) =>
              r.id === selectedVaccinationRequest.id ? updatedRequest : r
            )
          );

          setSelectedVaccinationRequest(updatedRequest);

          toast({
            title: "Moved to Later",
            description:
              "The vaccination has been moved to the Later tab for future administration.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Failed to move vaccination",
        description:
          "There was an error processing the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a function to update injection notes
  const handleUpdateInjectionNotes = (injectionId: string, notes: string) => {
    if (!selectedRequest) return;

    const updatedInjections = selectedRequest.injections.map((injection) => {
      if (injection.id === injectionId) {
        return {
          ...injection,
          notes,
        };
      }
      return injection;
    });

    const updatedRequest = {
      ...selectedRequest,
      injections: updatedInjections,
    };

    // Update the state
    setInjectionRequests(
      injectionRequests.map((r) =>
        r.id === selectedRequest.id ? updatedRequest : r
      )
    );
    setSelectedRequest(updatedRequest);

    // Update the patient's visit data
    const patient = patients.find((p) => p.id === selectedRequest.patientId);
    if (patient && patient.visits && patient.visits.length > 0) {
      const updatedVisits = [...patient.visits];
      const latestVisitIndex = updatedVisits.length - 1;

      updatedVisits[latestVisitIndex] = {
        ...updatedVisits[latestVisitIndex],
        injectionData: updatedRequest,
      };

      // Update the patient
      updatePatient({
        ...patient,
        visits: updatedVisits,
      });
    }
  };

  // Update the handleCompleteAdministration function to check ALL injections
  const handleCompleteAdministration = async () => {
    if (!selectedRequest) return;

    // Check if ALL paid injections are administered and saved
    const paidInjections = selectedRequest.injections.filter(
      (inj) => inj.paymentStatus === "paid"
    );
    const allPaidInjectionsAdministered = paidInjections.every(
      (inj) => inj.administered && inj.saved
    );

    if (!allPaidInjectionsAdministered) {
      toast({
        title: "Cannot complete",
        description:
          "All paid injections must be administered and saved before completing.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update request status to completed
      const updatedRequest = {
        ...selectedRequest,
        status: "completed" as const,
        notes: administrationNotes,
      };

      // Update the state
      setInjectionRequests(
        injectionRequests.map((r) =>
          r.id === selectedRequest.id ? updatedRequest : r
        )
      );
      setSelectedRequest(updatedRequest);

      // Update the patient's visit in the central store
      const patient = patients.find((p) => p.id === selectedRequest.patientId);
      if (patient && patient.visits && patient.visits.length > 0) {
        const updatedVisits = [...patient.visits];
        const latestVisitIndex = updatedVisits.length - 1;

        // Update the diagnosis to reflect the injection status
        let updatedDiagnosis = updatedVisits[latestVisitIndex].diagnosis;

        // For regular patients, remove the "With Injection Room:" prefix to mark as completed
        if (!updatedDiagnosis.startsWith("With HMO:")) {
          updatedDiagnosis =
            updatedVisits[latestVisitIndex].diagnosis.split(": ")[1];
        }

        updatedVisits[latestVisitIndex] = {
          ...updatedVisits[latestVisitIndex],
          diagnosis: updatedDiagnosis,
          notes:
            (updatedVisits[latestVisitIndex].notes || "") +
            `\n\nInjection Room Notes (${new Date().toLocaleDateString()}): ${administrationNotes}`,
          injectionData: updatedRequest,
        };

        // Update the patient in the central store
        updatePatient({
          ...patient,
          visits: updatedVisits,
        });
      }

      toast({
        title: "Administration completed",
        description: "All injections have been successfully administered.",
      });
    } catch (error) {
      toast({
        title: "Failed to complete administration",
        description:
          "There was an error processing the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total for injections
  const calculateTotal = (injections: Injection[]) => {
    return injections.reduce(
      (total, injection) => total + injection.price * injection.quantity,
      0
    );
  };

  // Add these constants after the existing filteredRequests function
  const notPaidVaccinations = vaccinationRequests.filter(
    (r) => r.status === "not_paid"
  );
  const paidVaccinations = vaccinationRequests.filter(
    (r) => r.status === "paid" || r.isGovernmentProvided
  );
  const inProgressVaccinations = vaccinationRequests.filter(
    (r) => r.status === "in_progress"
  );
  const completedVaccinations = vaccinationRequests.filter(
    (r) => r.status === "completed"
  );
  const laterVaccinations = vaccinationRequests.filter(
    (r) => r.status === "later"
  );

  const notPaidRequests = injectionRequests.filter(
    (r) => r.status === "not_paid"
  );
  const paidRequests = injectionRequests.filter((r) => r.status === "paid");
  const inProgressRequests = injectionRequests.filter(
    (r) => r.status === "in_progress"
  );
  const completedRequests = injectionRequests.filter(
    (r) => r.status === "completed"
  );
  const laterRequests = injectionRequests.filter((r) => r.status === "later");

  const filteredRequests = (requestList: InjectionRequest[]) => {
    if (!searchTerm) return requestList;

    return requestList.filter(
      (r) =>
        r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Add this function after the filteredRequests function
  const filteredVaccinationRequests = (requestList: VaccinationRequest[]) => {
    if (!searchTerm) return requestList;

    return requestList.filter(
      (r) =>
        r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vaccineName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Add this function after the paginateRequests function
  const paginateVaccinationRequests = (requests: VaccinationRequest[]) => {
    const filtered = filteredVaccinationRequests(requests);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Add this function after the getTotalPages function
  const getTotalVaccinationPages = (requests: VaccinationRequest[]) => {
    return Math.ceil(
      filteredVaccinationRequests(requests).length / itemsPerPage
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Injection Room
            </h1>
            <p className="text-muted-foreground">
              Administer injections and IV medications
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
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
              defaultValue="not_paid"
              className="w-full"
              onValueChange={handleTabChange}
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="not_paid">Not Paid</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="later">Later</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value="not_paid" className="space-y-4 mt-4">
                {filteredRequests(notPaidRequests).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No injections awaiting payment
                    </CardContent>
                  </Card>
                ) : (
                  paginateRequests(notPaidRequests).map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {request.patientName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {request.patientId} • Request: {request.id}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-800"
                          >
                            Awaiting Payment
                          </Badge>
                        </div>
                        <p className="text-sm mb-1">
                          Doctor: {request.doctorName}
                        </p>
                        <p className="text-sm mb-1">
                          Injections: {request.injections.length} waiting for
                          payment
                        </p>
                        <div className="flex space-x-2 mt-3">
                          <Button
                            className="flex-1"
                            onClick={() => handleViewRequest(request)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleMoveToLater(request)}
                          >
                            Move to Later
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                <PaginationControls requests={notPaidRequests} />
              </TabsContent>

              {/* Modify the TabsContent for "paid" to include vaccinations */}
              {/* Find the TabsContent with value="paid" and add the following after the existing content */}
              <TabsContent value="paid" className="space-y-4 mt-4">
                {filteredRequests(paidRequests).length === 0 &&
                filteredVaccinationRequests(paidVaccinations).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No paid injections or vaccinations waiting for
                      administration
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginateRequests(paidRequests).map((request) => (
                      <Card key={request.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {request.patientName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                ID: {request.patientId} • Request: {request.id}
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
                            Doctor: {request.doctorName}
                          </p>
                          <p className="text-sm mb-1">
                            Paid Injections:{" "}
                            {
                              request.injections.filter(
                                (i) => i.paymentStatus === "paid"
                              ).length
                            }
                            /{request.injections.length}
                          </p>
                          <div className="flex space-x-2 mt-3">
                            <Button
                              className="flex-1"
                              onClick={() => handleViewRequest(request)}
                            >
                              View
                            </Button>
                            <Button
                              className="flex-1"
                              onClick={() => handleStartAdministration(request)}
                            >
                              <Syringe className="mr-2 h-4 w-4" />
                              Start Administration
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Vaccinations awaiting administration */}
                    {filteredVaccinationRequests(paidVaccinations).length >
                      0 && (
                      <>
                        <div className="mt-6 mb-2">
                          <h3 className="font-medium text-lg">
                            Vaccinations Awaiting Administration
                          </h3>
                        </div>
                        {paginateVaccinationRequests(paidVaccinations).map(
                          (request) => (
                            <Card key={request.id} className="mt-4">
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-semibold text-lg">
                                      {request.patientName}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      ID: {request.patientId}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="bg-green-50 text-green-800"
                                  >
                                    {request.isGovernmentProvided
                                      ? "Government Provided"
                                      : "Paid"}
                                  </Badge>
                                </div>
                                <p className="text-sm mb-1">
                                  Vaccine: {request.vaccineName}
                                </p>
                                <p className="text-sm mb-1">
                                  Dose Type: {request.doseType}
                                </p>
                                <div className="flex space-x-2 mt-3">
                                  <Button
                                    className="flex-1"
                                    onClick={() =>
                                      handleViewVaccinationRequest(request)
                                    }
                                  >
                                    View
                                  </Button>
                                  <Button
                                    className="flex-1"
                                    onClick={() =>
                                      handleViewVaccinationRequest(request)
                                    }
                                  >
                                    <Syringe className="mr-2 h-4 w-4" />
                                    Administer
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        )}
                      </>
                    )}
                  </>
                )}
                <PaginationControls requests={paidRequests} />
              </TabsContent>

              <TabsContent value="in_progress" className="space-y-4 mt-4">
                {filteredRequests(inProgressRequests).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No injections in progress
                    </CardContent>
                  </Card>
                ) : (
                  paginateRequests(inProgressRequests).map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {request.patientName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {request.patientId} • Request: {request.id}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-800"
                          >
                            In Progress
                          </Badge>
                        </div>
                        <p className="text-sm mb-1">
                          Doctor: {request.doctorName}
                        </p>
                        <p className="text-sm mb-1">
                          Progress:{" "}
                          {
                            request.injections.filter((i) => i.administered)
                              .length
                          }
                          /
                          {
                            request.injections.filter(
                              (i) => i.paymentStatus === "paid"
                            ).length
                          }{" "}
                          administered
                        </p>
                        <Button
                          className="w-full mt-3"
                          onClick={() => handleViewRequest(request)}
                        >
                          Continue Administration
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}

                {/* In-progress vaccinations */}
                {filteredVaccinationRequests(inProgressVaccinations).length >
                  0 && (
                  <>
                    <div className="mt-6 mb-2">
                      <h3 className="font-medium text-lg">
                        In-Progress Vaccinations
                      </h3>
                    </div>
                    {paginateVaccinationRequests(inProgressVaccinations).map(
                      (request) => (
                        <Card key={request.id} className="mt-4">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {request.patientName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  ID: {request.patientId}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-800"
                              >
                                In Progress
                              </Badge>
                            </div>
                            <p className="text-sm mb-1">
                              Vaccine: {request.vaccineName}
                            </p>
                            <p className="text-sm mb-1">
                              Dose Type: {request.doseType}
                            </p>
                            <Button
                              className="w-full mt-3"
                              onClick={() =>
                                handleViewVaccinationRequest(request)
                              }
                            >
                              Continue Administration
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </>
                )}
                <PaginationControls requests={inProgressRequests} />
              </TabsContent>

              <TabsContent value="later" className="space-y-4 mt-4">
                {filteredRequests(laterRequests).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No patients scheduled for later
                    </CardContent>
                  </Card>
                ) : (
                  paginateRequests(laterRequests).map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {request.patientName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {request.patientId} • Request: {request.id}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-orange-50 text-orange-800"
                          >
                            Later
                          </Badge>
                        </div>
                        <p className="text-sm mb-1">
                          Doctor: {request.doctorName}
                        </p>
                        <p className="text-sm mb-1">
                          Progress:{" "}
                          {
                            request.injections.filter((i) => i.administered)
                              .length
                          }
                          /
                          {
                            request.injections.filter(
                              (i) => i.paymentStatus === "paid"
                            ).length
                          }{" "}
                          administered
                        </p>
                        <Button
                          className="w-full mt-3"
                          onClick={() => handleViewRequest(request)}
                        >
                          Continue Administration
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}

                {/* Later vaccinations */}
                {filteredVaccinationRequests(laterVaccinations).length > 0 && (
                  <>
                    <div className="mt-6 mb-2">
                      <h3 className="font-medium text-lg">
                        Later Vaccinations
                      </h3>
                    </div>
                    {paginateVaccinationRequests(laterVaccinations).map(
                      (request) => (
                        <Card key={request.id} className="mt-4">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {request.patientName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  ID: {request.patientId}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-orange-50 text-orange-800"
                              >
                                Later
                              </Badge>
                            </div>
                            <p className="text-sm mb-1">
                              Vaccine: {request.vaccineName}
                            </p>
                            <p className="text-sm mb-1">
                              Dose Type: {request.doseType}
                            </p>
                            <Button
                              className="w-full mt-3"
                              onClick={() =>
                                handleViewVaccinationRequest(request)
                              }
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </>
                )}
                <PaginationControls requests={laterRequests} />
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-4">
                {filteredRequests(completedRequests).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No completed injections
                    </CardContent>
                  </Card>
                ) : (
                  paginateRequests(completedRequests).map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {request.patientName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {request.patientId} • Request: {request.id}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-800"
                          >
                            Completed
                          </Badge>
                        </div>
                        <p className="text-sm mb-1">
                          Doctor: {request.doctorName}
                        </p>
                        <p className="text-sm mb-1">Date: {request.date}</p>
                        <Button
                          className="w-full mt-3"
                          variant="outline"
                          onClick={() => handleViewRequest(request)}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}

                {/* Completed vaccinations */}
                {filteredVaccinationRequests(completedVaccinations).length >
                  0 && (
                  <>
                    <div className="mt-6 mb-2">
                      <h3 className="font-medium text-lg">
                        Completed Vaccinations
                      </h3>
                    </div>
                    {paginateVaccinationRequests(completedVaccinations).map(
                      (request) => (
                        <Card key={request.id} className="mt-4">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {request.patientName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  ID: {request.patientId}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-800"
                              >
                                Completed
                              </Badge>
                            </div>
                            <p className="text-sm mb-1">
                              Vaccine: {request.vaccineName}
                            </p>
                            <p className="text-sm mb-1">
                              Dose Type: {request.doseType}
                            </p>
                            <p className="text-sm mb-1">
                              Administered by {request.administeredBy} at{" "}
                              {request.administeredTime}
                            </p>
                            <Button
                              variant="outline"
                              className="w-full mt-3"
                              onClick={() =>
                                handleViewVaccinationRequest(request)
                              }
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </>
                )}
                <PaginationControls requests={completedRequests} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-2">
            {selectedRequest ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        Injection Request #{selectedRequest.id}
                      </CardTitle>
                      <CardDescription>
                        Patient: {selectedRequest.patientName} (ID:{" "}
                        {selectedRequest.patientId})
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(null)}
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
                      <p>{selectedRequest.doctorName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p>{selectedRequest.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant="outline"
                        className={
                          selectedRequest.status === "completed"
                            ? "bg-green-50 text-green-800"
                            : selectedRequest.status === "in_progress"
                            ? "bg-blue-50 text-blue-800"
                            : selectedRequest.status === "later"
                            ? "bg-orange-50 text-orange-800"
                            : selectedRequest.status === "paid"
                            ? "bg-green-50 text-green-800"
                            : selectedRequest.status === "not_paid"
                            ? "bg-yellow-50 text-yellow-800"
                            : "bg-gray-50 text-gray-800"
                        }
                      >
                        {selectedRequest.status === "not_paid"
                          ? "Awaiting Payment"
                          : selectedRequest.status === "in_progress"
                          ? "In Progress"
                          : selectedRequest.status.charAt(0).toUpperCase() +
                            selectedRequest.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {/* Doctor's prescriptions */}
                  {selectedRequest.doctorPrescriptions &&
                    selectedRequest.doctorPrescriptions.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-md">
                        <h3 className="text-sm font-medium mb-2">
                          Doctor's Prescriptions
                        </h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedRequest.doctorPrescriptions.map(
                            (prescription, index) => (
                              <li key={index} className="text-sm">
                                {prescription}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Injections</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medication</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">
                            Price (₦)
                          </TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequest.injections.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-4 text-muted-foreground"
                            >
                              No injections added yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedRequest.injections.map((injection) => (
                            <TableRow key={injection.id}>
                              <TableCell className="font-medium">
                                {injection.name}
                              </TableCell>
                              <TableCell>{injection.dosage}</TableCell>
                              <TableCell>{injection.route}</TableCell>
                              <TableCell className="text-right">
                                {injection.quantity}
                              </TableCell>
                              <TableCell className="text-right">
                                {injection.price.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    injection.paymentStatus === "paid"
                                      ? "bg-green-50 text-green-800"
                                      : "bg-yellow-50 text-yellow-800"
                                  }
                                >
                                  {injection.paymentStatus === "paid"
                                    ? "Paid"
                                    : "Awaiting Payment"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                        {selectedRequest.injections.length > 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-right font-semibold"
                            >
                              Total
                            </TableCell>
                            <TableCell className="text-right">
                              {selectedRequest.injections.reduce(
                                (sum, item) => sum + item.quantity,
                                0
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ₦
                              {calculateTotal(
                                selectedRequest.injections
                              ).toLocaleString()}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {(selectedRequest.status === "in_progress" ||
                    selectedRequest.status === "later") && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Administration
                      </h3>
                      <div className="space-y-4">
                        {selectedRequest.injections.map((injection) => (
                          <div
                            key={injection.id}
                            className={`p-4 rounded-md border ${
                              injection.administered && injection.saved
                                ? "bg-green-50 border-green-200"
                                : injection.administered && !injection.saved
                                ? "bg-blue-50 border-blue-200"
                                : injection.paymentStatus === "paid"
                                ? "bg-blue-50 border-blue-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">
                                  {injection.name} {injection.dosage}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Route: {injection.route} • Frequency:{" "}
                                  {injection.frequency}
                                </p>
                                <div className="flex items-center mt-1">
                                  <Badge
                                    variant="outline"
                                    className={
                                      injection.paymentStatus === "paid"
                                        ? "bg-green-50 text-green-800"
                                        : "bg-yellow-50 text-yellow-800"
                                    }
                                  >
                                    {injection.paymentStatus === "paid"
                                      ? "Paid"
                                      : "Payment Pending"}
                                  </Badge>
                                  {injection.saved && (
                                    <Badge
                                      variant="outline"
                                      className="bg-green-50 text-green-800 ml-2"
                                    >
                                      Saved
                                    </Badge>
                                  )}
                                </div>
                                {injection.administered && (
                                  <p className="text-sm text-green-600 mt-1">
                                    Administered at {injection.administeredTime}{" "}
                                    by {injection.administeredBy}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center">
                                <Checkbox
                                  id={`administered-${injection.id}`}
                                  checked={injection.administered}
                                  onCheckedChange={() =>
                                    handleToggleAdministered(injection.id)
                                  }
                                  className="mr-2"
                                  disabled={
                                    injection.paymentStatus !== "paid" ||
                                    injection.saved
                                  }
                                />
                                <Label htmlFor={`administered-${injection.id}`}>
                                  {injection.administered
                                    ? "Administered"
                                    : "Mark as Administered"}
                                </Label>
                              </div>
                            </div>

                            <div className="mt-3">
                              <Label
                                htmlFor={`notes-${injection.id}`}
                                className="text-sm"
                              >
                                Injection Notes
                              </Label>
                              <Textarea
                                id={`notes-${injection.id}`}
                                value={injection.notes || ""}
                                onChange={(e) =>
                                  handleUpdateInjectionNotes(
                                    injection.id,
                                    e.target.value
                                  )
                                }
                                placeholder="Enter notes for this injection..."
                                className="mt-1 text-sm min-h-[60px]"
                                disabled={
                                  !injection.administered || injection.saved
                                }
                              />
                            </div>

                            {injection.administered && !injection.saved && (
                              <Button
                                className="mt-3 w-full"
                                onClick={() =>
                                  handleSaveAdministration(injection.id)
                                }
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Save Administration
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 mt-6">
                        <Label htmlFor="notes">Administration Notes</Label>
                        <Textarea
                          id="notes"
                          value={administrationNotes}
                          onChange={(e) =>
                            setAdministrationNotes(e.target.value)
                          }
                          placeholder="Enter any notes about the administration..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === "completed" &&
                    selectedRequest.notes && (
                      <div className="space-y-2">
                        <Label htmlFor="notes">Administration Notes</Label>
                        <div className="p-4 bg-gray-50 rounded-md whitespace-pre-line">
                          {selectedRequest.notes}
                        </div>
                      </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRequest(null)}
                  >
                    Back
                  </Button>

                  <div className="space-x-2">
                    {/* Not Paid tab actions */}
                    {selectedRequest.status === "not_paid" && (
                      <Button
                        variant="outline"
                        onClick={() => handleMoveToLater()}
                        disabled={isSubmitting}
                      >
                        Move to Later
                      </Button>
                    )}

                    {/* Paid tab actions */}
                    {selectedRequest.status === "paid" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleMoveToLater()}
                          disabled={isSubmitting}
                        >
                          Move to Later
                        </Button>
                        <Button
                          onClick={() =>
                            handleStartAdministration(selectedRequest)
                          }
                          disabled={isSubmitting}
                        >
                          <Syringe className="mr-2 h-4 w-4" />
                          {isSubmitting
                            ? "Processing..."
                            : "Start Administration"}
                        </Button>
                      </>
                    )}

                    {/* In Progress tab actions */}
                    {selectedRequest?.status === "in_progress" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleMoveToLater()}
                          disabled={isSubmitting}
                        >
                          Move to Later
                        </Button>
                        <Button
                          onClick={handleCompleteAdministration}
                          disabled={isSubmitting}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {isSubmitting
                            ? "Saving..."
                            : "Complete Administration"}
                        </Button>
                      </>
                    )}

                    {/* Later tab actions */}
                    {selectedRequest?.status === "later" && (
                      <>
                        {selectedRequest.injections.some(
                          (inj) => inj.paymentStatus === "paid"
                        ) && (
                          <Button
                            onClick={() =>
                              handleStartAdministration(selectedRequest)
                            }
                            disabled={isSubmitting}
                          >
                            <Syringe className="mr-2 h-4 w-4" />
                            {isSubmitting
                              ? "Processing..."
                              : "Start Administration"}
                          </Button>
                        )}
                        {selectedRequest.injections
                          .filter((inj) => inj.paymentStatus === "paid")
                          .every((inj) => inj.administered) && (
                          <Button
                            onClick={handleCompleteAdministration}
                            disabled={isSubmitting}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            {isSubmitting
                              ? "Saving..."
                              : "Complete Administration"}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ) : selectedVaccinationRequest ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        Vaccination Request #{selectedVaccinationRequest.id}
                      </CardTitle>
                      <CardDescription>
                        Patient: {selectedVaccinationRequest.patientName} (ID:{" "}
                        {selectedVaccinationRequest.patientId})
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVaccinationRequest(null)}
                      >
                        Back to List
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Vaccine</p>
                      <p>{selectedVaccinationRequest.vaccineName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p>{selectedVaccinationRequest.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant="outline"
                        className={
                          selectedVaccinationRequest.status === "completed"
                            ? "bg-green-50 text-green-800"
                            : selectedVaccinationRequest.status ===
                              "in_progress"
                            ? "bg-blue-50 text-blue-800"
                            : selectedVaccinationRequest.status === "later"
                            ? "bg-orange-50 text-orange-800"
                            : selectedVaccinationRequest.status === "paid"
                            ? "bg-green-50 text-green-800"
                            : selectedVaccinationRequest.status === "not_paid"
                            ? "bg-yellow-50 text-yellow-800"
                            : "bg-gray-50 text-gray-800"
                        }
                      >
                        {selectedVaccinationRequest.status === "not_paid"
                          ? "Awaiting Payment"
                          : selectedVaccinationRequest.status === "in_progress"
                          ? "In Progress"
                          : selectedVaccinationRequest.status
                              .charAt(0)
                              .toUpperCase() +
                            selectedVaccinationRequest.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Vaccination Details
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vaccine</TableHead>
                          <TableHead>Dose Type</TableHead>
                          <TableHead className="text-right">
                            Price (₦)
                          </TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow key={selectedVaccinationRequest.id}>
                          <TableCell className="font-medium">
                            {selectedVaccinationRequest.vaccineName}
                          </TableCell>
                          <TableCell>
                            {selectedVaccinationRequest.doseType}
                          </TableCell>
                          <TableCell className="text-right">
                            {selectedVaccinationRequest.price.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                selectedVaccinationRequest.status === "paid"
                                  ? "bg-green-50 text-green-800"
                                  : "bg-yellow-50 text-yellow-800"
                              }
                            >
                              {selectedVaccinationRequest.status === "paid"
                                ? "Paid"
                                : "Awaiting Payment"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <Label htmlFor="notes">Vaccination Notes</Label>
                    <Textarea
                      id="notes"
                      value={vaccinationNotes}
                      onChange={(e) => setVaccinationNotes(e.target.value)}
                      placeholder="Enter any notes about the vaccination..."
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedVaccinationRequest(null)}
                  >
                    Back
                  </Button>

                  <div className="space-x-2">
                    {/* Later tab actions */}
                    {selectedVaccinationRequest?.status === "later" && (
                      <>
                        <Button
                          onClick={() => handleAdministerVaccination()}
                          disabled={isSubmitting}
                        >
                          <Syringe className="mr-2 h-4 w-4" />
                          {isSubmitting
                            ? "Processing..."
                            : "Administer Vaccination"}
                        </Button>
                      </>
                    )}
                    {/* Paid tab actions */}
                    {selectedVaccinationRequest.status === "paid" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleMoveVaccinationToLater()}
                          disabled={isSubmitting}
                        >
                          Move to Later
                        </Button>
                        <Button
                          onClick={() => handleAdministerVaccination()}
                          disabled={isSubmitting}
                        >
                          <Syringe className="mr-2 h-4 w-4" />
                          {isSubmitting
                            ? "Processing..."
                            : "Administer Vaccination"}
                        </Button>
                      </>
                    )}
                    {/* Completed tab actions */}
                    {selectedVaccinationRequest.status === "completed" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleMoveVaccinationToLater()}
                          disabled={isSubmitting}
                        >
                          Move to Later
                        </Button>
                      </>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Injection Details</CardTitle>
                  <CardDescription>
                    Select an injection request from the list to view or
                    administer
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Syringe className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No injection request selected. Click on a request from the
                    list to view details or administer injections.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
