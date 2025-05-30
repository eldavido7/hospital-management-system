"use client";

import type React from "react";

import { useState, useCallback, memo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
// Update the imports to include the necessary icons
import {
  Search,
  X,
  Edit,
  ArrowUpDown,
  CheckSquare,
  Stethoscope,
  CalendarIcon,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Patient, useAppStore } from "@/lib/data/store";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
// Add this import for the dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/toaster";
import { useVaccineStore } from "@/lib/data/vaccines";
import { useStoreExtension } from "@/lib/data/storeext";

// Patient selection component - extracted and memoized to prevent unnecessary re-renders
interface PatientSelectionCardProps {
  searchTerm: string;
  searchBy: string;
  setSearchBy: (value: string) => void;
  handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
  searchSuggestions: Array<Patient>;
  handleSuggestionSelect: (patient: Patient) => void;
  selectedPatient: string | null;
  getPatientById: (id: string) =>
    | {
        id: string;
        name: string;
        gender: string;
        age: number;
        patientType: string;
        hmoProvider?: string;
        phone?: string;
      }
    | null
    | undefined;
  setSelectedPatient: (id: string | null) => void;
  setSearchTerm: (term: string) => void;
  setSearchSuggestions: React.Dispatch<React.SetStateAction<Patient[]>>;
}

const PatientSelectionCard = memo(
  ({
    searchTerm,
    searchBy,
    setSearchBy,
    handleSearchInputChange,
    handleSearch,
    searchSuggestions,
    handleSuggestionSelect,
    selectedPatient,
    getPatientById,
    setSelectedPatient,
    setSearchTerm,
    setSearchSuggestions,
  }: PatientSelectionCardProps) => (
    <Card>
      <CardHeader>
        <CardTitle>Patient Information</CardTitle>
        <CardDescription>Search for a patient</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Select defaultValue={searchBy} onValueChange={setSearchBy}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Search by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search by ${searchBy}...`}
              className="pl-8"
              value={searchTerm}
              onChange={handleSearchInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="absolute right-0 top-0 h-full"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Search suggestions dropdown */}
            {searchSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {searchSuggestions.map((patient) => (
                  <div
                    key={patient.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSuggestionSelect(patient)}
                  >
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {patient.id} • {patient.gender}, {patient.age} years
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Selected Patient</Label>
          {selectedPatient ? (
            <div className="p-3 border rounded-md flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {getPatientById(selectedPatient)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  ID: {selectedPatient} •{" "}
                  {getPatientById(selectedPatient)?.gender},{" "}
                  {getPatientById(selectedPatient)?.age} years
                </p>
                <p className="text-sm text-muted-foreground">
                  Patient Type:{" "}
                  {getPatientById(selectedPatient)?.patientType.toUpperCase()}
                  {getPatientById(selectedPatient)?.hmoProvider &&
                    ` • HMO: ${getPatientById(selectedPatient)?.hmoProvider}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPatient(null);
                  setSearchTerm("");
                  setSearchSuggestions([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="p-3 border rounded-md text-center text-muted-foreground">
              No patient selected
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
);

PatientSelectionCard.displayName = "PatientSelectionCard";

export default function AppointmentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [appointmentType, setAppointmentType] =
    useState<string>("consultation");
  const [consultationType, setConsultationType] = useState<string>("initial");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchBy, setSearchBy] = useState<string>("name");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("immediate");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Add presentingComplaints and historyOfComplaints to the state
  const [presentingComplaints, setPresentingComplaints] = useState<string>("");
  const [historyOfComplaints, setHistoryOfComplaints] = useState<string>("");
  const [editingAppointment, setEditingAppointment] = useState<string | null>(
    null
  );
  // Add state for search suggestions after the other state declarations
  const [searchSuggestions, setSearchSuggestions] = useState<
    ReturnType<typeof useAppStore.getState>["patients"]
  >([]);
  // const [searchInputValue, setSearchInputValue] = useState<string>("");
  // Add these state variables after the other state declarations (around line 40)
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<
    string | null
  >(null);
  const [cancellingAppointmentInfo, setCancellingAppointmentInfo] = useState<{
    patientName: string;
    isPaid: boolean;
    patientType: string;
  } | null>(null);
  const [selectedVaccine, setSelectedVaccine] = useState<string>("");
  const [vaccineDoseType, setVaccineDoseType] = useState<string>("initial");

  // Use the centralized store
  const {
    patients,
    appointments,
    searchPatients,
    getPatientById,
    addAppointment,
    updateAppointment,
    getAppointmentById,
    generateAppointmentId,
    addBill,
    generateBillId,
    getActiveStaffByRole,
    getStaffByRole,
    getStaffById,
    bills,
    getBillById,
    updateBill,
    hospitalSettings,
    canChangeDoctor,
    cancelConsultation,
  } = useAppStore();

  // Get active doctors for immediate consultations
  const activeDoctors = getActiveStaffByRole("doctor");

  // Get all doctors for scheduled appointments
  const allDoctors = getStaffByRole("doctor");

  // Get time slots from hospital settings or use defaults
  const timeSlots = hospitalSettings.appointmentTimeSlots || [
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
  ];

  // Get consultation types from hospital settings or use defaults
  const consultationTypes = hospitalSettings.consultationTypes || [
    { value: "initial", label: "Initial Consultation" },
    { value: "follow_up", label: "Follow-up Consultation" },
    { value: "specialist", label: "Specialist Consultation" },
    { value: "pediatrician", label: "Pediatrician" },
  ];

  const appointmentTypes = hospitalSettings.appointmentTypes || [
    { value: "initial", label: "Initial Consultation" },
    { value: "follow-up", label: "Follow-up" },
    { value: "lab-test", label: "Laboratory Test" },
    { value: "procedure", label: "Procedure" },
    { value: "pediatrician", label: "Pediatrician" },
  ];

  // Get available vaccines
  const { getAllVaccines } = useVaccineStore();
  const { scheduleVaccinationAppointment } = useStoreExtension();
  const availableVaccines = getAllVaccines().filter(
    (vaccine) => vaccine.stock > 0
  );

  // Filter appointments for today
  const todaysAppointments = appointments.filter(
    (appointment) => appointment.date === format(new Date(), "yyyy-MM-dd")
  );

  // Filter appointments for selected date
  const selectedDateAppointments = date
    ? appointments.filter(
        (appointment) => appointment.date === format(date, "yyyy-MM-dd")
      )
    : [];

  // Check if an appointment's bill is still pending
  const isAppointmentBillPending = (appointmentId: string) => {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment || !appointment.billId) return false;

    // Find the bill for this appointment
    const bill = getBillById(appointment.billId);
    return bill?.status === "pending";
  };

  // Check if an appointment's bill is paid
  const isAppointmentBillPaid = (appointmentId: string) => {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment || !appointment.billId) return false;

    // Find the bill for this appointment
    const bill = getBillById(appointment.billId);
    return bill?.status === "paid";
  };

  // Check if doctor can be changed for this appointment
  const canChangeDoctorForAppointment = (appointmentId: string) => {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment || !appointment.billId) return false;

    return canChangeDoctor(appointment.billId);
  };

  // Fix for search input - update both the input value and search term
  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setSearchTerm(term);

      if (term.length >= 2) {
        // Filter suggestions based on current search type
        const results = searchPatients(term, searchBy).slice(0, 5); // Limit to 5 suggestions
        setSearchSuggestions(results);
      } else {
        setSearchSuggestions([]);
      }
    },
    [searchBy, searchPatients]
  );

  // Function to select a patient from suggestions
  const handleSuggestionSelect = useCallback(
    (patient: ReturnType<typeof useAppStore.getState>["patients"][0]) => {
      setSearchSuggestions([]);
      setSearchTerm(
        searchBy === "name"
          ? patient.name
          : searchBy === "id"
          ? patient.id
          : patient.phone
      );
      setSelectedPatient(patient.id);
    },
    [searchBy]
  );

  // Handle search button click
  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a search term to find patients.",
        variant: "destructive",
      });
      return;
    }

    const results = searchPatients(searchTerm, searchBy);

    if (results.length === 0) {
      toast({
        title: "No patients found",
        description: "No patients match your search criteria.",
        variant: "destructive",
      });
    } else if (results.length === 1) {
      // Auto-select if only one result
      setSelectedPatient(results[0].id);
      setSearchTerm(
        searchBy === "name"
          ? results[0].name
          : searchBy === "id"
          ? results[0].id
          : results[0].phone
      );
      setSearchSuggestions([]);
    } else {
      // Show all results as suggestions
      setSearchSuggestions(results);
    }
  }, [searchTerm, searchBy, searchPatients, toast]);

  // Add this function before the handleCreateConsultation function
  const getConsultationFeeByDoctorId = (doctorId: string) => {
    const doctor = getStaffById(doctorId);
    if (!doctor) return hospitalSettings.generalMedicineFee; // Default to general medicine fee

    switch (doctor.department?.toLowerCase()) {
      case "pediatrics":
        return hospitalSettings.pediatricsFee;
      case "general medicine":
        return hospitalSettings.generalMedicineFee;
      case "cardiology":
      case "orthopedics":
      case "obstetrics & gynecology":
      case "ophthalmology":
        return hospitalSettings.specialistFee;
      default:
        return hospitalSettings.generalMedicineFee;
    }
  };

  // Handle immediate consultation creation
  const handleCreateConsultation = async () => {
    if (!selectedPatient) {
      toast({
        title: "Patient required",
        description: "Please select a patient for this consultation.",
        variant: "destructive",
      });
      return;
    }

    if (!consultationType) {
      toast({
        title: "Consultation type required",
        description: "Please select a consultation type.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDoctor) {
      toast({
        title: "Doctor required",
        description: "Please select a doctor for this consultation.",
        variant: "destructive",
      });
      return;
    }

    if (!presentingComplaints) {
      toast({
        title: "Presenting complaints required",
        description: "Please enter the presenting complaints.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get patient details
      const patient = getPatientById(selectedPatient);
      if (!patient) throw new Error("Patient not found");

      // Get doctor details
      const doctor = getStaffById(selectedDoctor);
      if (!doctor) throw new Error("Doctor not found");

      // Calculate the total using the consultation fee from hospital settings
      const consultationPrice = getConsultationFeeByDoctorId(selectedDoctor);

      // IMPORTANT FIX: Always generate a new bill ID for each consultation
      const billId = generateBillId();

      // Create consultation bill
      const consultationBill = {
        id: billId,
        patientId: patient.id,
        patientName: patient.name,
        date: format(new Date(), "yyyy-MM-dd"),
        status:
          patient.patientType === "hmo"
            ? "paid"
            : ("pending" as
                | "pending"
                | "paid"
                | "cancelled"
                | "hmo_pending"
                | "billed"
                | "dispensed"),
        type: "consultation" as const,
        items: [
          {
            id: `ITEM-${Date.now().toString().slice(-6)}`,
            description: `${
              consultationTypes.find((ct) => ct.value === consultationType)
                ?.label || "Consultation"
            } Fee`,
            quantity: 1,
            unitPrice: consultationPrice,
          },
        ],
        total: consultationPrice,
        // For HMO patients, add payment details automatically
        ...(patient.patientType === "hmo" && {
          paymentMethod: "hmo" as const,
          paymentReference: `HMO-AUTO-${Date.now().toString().slice(-6)}`,
          paymentDate: format(new Date(), "yyyy-MM-dd"),
          processedBy: "HMO Auto-Process",
        }),
      };

      // Add bill to store
      addBill(consultationBill);

      // IMPORTANT FIX: Always generate a new appointment ID
      const appointmentId = generateAppointmentId();

      // Create appointment record for today
      const newAppointment = {
        id: appointmentId,
        patientId: patient.id,
        patientName: patient.name,
        date: format(new Date(), "yyyy-MM-dd"),
        time: format(new Date(), "hh:mm a"),
        type: "consultation",
        status: "In Progress" as any,
        doctor: doctor.name,
        doctorId: doctor.id,
        consultationType: consultationType as
          | "vaccination"
          | "initial"
          | "follow_up"
          | "specialist"
          | "general"
          | "pediatrician",
        notes:
          notes ||
          `Walk-in ${
            consultationTypes.find((ct) => ct.value === consultationType)
              ?.label || "consultation"
          }`,
        billId: billId,
        presentingComplaints: presentingComplaints,
        historyOfComplaints: historyOfComplaints || "",
      };

      // Add appointment to store
      addAppointment(newAppointment);

      // Show different toast messages based on patient type
      if (patient.patientType === "hmo") {
        toast({
          title: "Consultation created successfully",
          description: `${
            consultationTypes.find((ct) => ct.value === consultationType)
              ?.label || "Consultation"
          } for ${patient.name} with ${
            doctor.name
          } has been created. Patient sent directly to Vitals.`,
        });
      } else {
        toast({
          title: "Consultation created successfully",
          description: `${
            consultationTypes.find((ct) => ct.value === consultationType)
              ?.label || "Consultation"
          } for ${patient.name} with ${
            doctor.name
          } has been created and sent to the cash point.`,
        });
      }

      // Reset form
      setSelectedPatient(null);
      setConsultationType("initial");
      setSelectedDoctor("");
      setNotes("");
      setSearchTerm("");
      setSearchSuggestions([]);
      setPresentingComplaints("");
      setHistoryOfComplaints("");
      setSelectedVaccine("");
      setVaccineDoseType("initial");
    } catch (error) {
      toast({
        title: "Failed to create consultation",
        description:
          "There was an error creating the consultation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle appointment scheduling
  const handleScheduleAppointment = async () => {
    if (!selectedPatient) {
      toast({
        title: "Patient required",
        description: "Please select a patient for this appointment.",
        variant: "destructive",
      });
      return;
    }

    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for this appointment.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTime) {
      toast({
        title: "Time required",
        description: "Please select a time for this appointment.",
        variant: "destructive",
      });
      return;
    }

    if (!appointmentType) {
      toast({
        title: "Appointment type required",
        description: "Please select an appointment type.",
        variant: "destructive",
      });
      return;
    }

    if (appointmentType === "consultation" && !consultationType) {
      toast({
        title: "Consultation type required",
        description: "Please select a consultation type.",
        variant: "destructive",
      });
      return;
    }

    if (appointmentType === "consultation" && !selectedDoctor) {
      toast({
        title: "Doctor required",
        description: "Please select a doctor for this consultation.",
        variant: "destructive",
      });
      return;
    }

    if (appointmentType === "consultation" && !presentingComplaints) {
      toast({
        title: "Presenting complaints required",
        description:
          "Please enter the presenting complaints for this consultation.",
        variant: "destructive",
      });
      return;
    }

    if (appointmentType === "vaccination" && !selectedVaccine) {
      toast({
        title: "Vaccine required",
        description:
          "Please select a vaccine for this vaccination appointment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get patient details
      const patient = getPatientById(selectedPatient);
      if (!patient) throw new Error("Patient not found");

      // Get doctor details if selected
      const doctor = selectedDoctor ? getStaffById(selectedDoctor) : null;

      // For vaccination appointments, use the vaccination flow
      if (appointmentType === "vaccination") {
        const result = scheduleVaccinationAppointment(
          patient.id,
          selectedVaccine,
          vaccineDoseType as any,
          false // Don't override eligibility
        );

        if (!result.success) {
          toast({
            title: "Vaccination scheduling failed",
            description: result.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Vaccination appointment scheduled successfully",
          description: `Vaccination appointment for ${
            patient.name
          } has been scheduled for ${format(date, "PPP")} at ${selectedTime}.`,
        });
      } else {
        // Create new appointment (existing code for non-vaccination appointments)
        const newAppointment = {
          id: generateAppointmentId(),
          patientId: patient.id,
          patientName: patient.name,
          date: format(date, "yyyy-MM-dd"),
          time: selectedTime,
          type: appointmentType,
          status: "scheduled" as const,
          doctor: doctor ? doctor.name : undefined,
          doctorId: doctor ? doctor.id : undefined,
          consultationType:
            appointmentType === "consultation"
              ? (consultationType as
                  | "vaccination"
                  | "initial"
                  | "follow_up"
                  | "specialist"
                  | "general"
                  | "pediatrician")
              : undefined,
          notes: notes || undefined,
          presentingComplaints:
            appointmentType === "consultation"
              ? presentingComplaints
              : undefined,
          historyOfComplaints:
            appointmentType === "consultation"
              ? historyOfComplaints || ""
              : undefined,
        };

        // Add to store
        addAppointment(newAppointment);

        toast({
          title: "Appointment scheduled successfully",
          description: `${
            appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1)
          } for ${patient.name} has been scheduled for ${format(
            date,
            "PPP"
          )} at ${selectedTime}${doctor ? ` with ${doctor.name}` : ""}.`,
        });
      }

      // Reset form
      setSelectedPatient(null);
      setDate(new Date());
      setSelectedTime("");
      setAppointmentType("consultation");
      setConsultationType("initial");
      setSelectedDoctor("");
      setNotes("");
      setSearchTerm("");
      setSearchSuggestions([]);
      setPresentingComplaints("");
      setHistoryOfComplaints("");
      setSelectedVaccine("");
      setVaccineDoseType("initial");
    } catch (error) {
      toast({
        title: "Failed to schedule appointment",
        description:
          "There was an error scheduling the appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this function to handle opening the cancel dialog (after the other handler functions)
  const handleOpenCancelDialog = (appointmentId: string) => {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment) return;

    const patient = getPatientById(appointment.patientId);
    if (!patient) return;

    const bill = appointment.billId ? getBillById(appointment.billId) : null;
    const isPaid = bill?.status === "paid";

    setCancellingAppointmentId(appointmentId);
    setCancellingAppointmentInfo({
      patientName: appointment.patientName,
      isPaid,
      patientType: patient.patientType,
    });
    setShowCancelDialog(true);
  };

  // Add this function to handle the actual cancellation (after the other handler functions)
  const handleConfirmCancelConsultation = () => {
    if (!cancellingAppointmentId) return;

    try {
      const result = cancelConsultation(
        cancellingAppointmentId,
        user?.name || "Reception"
      );

      if (result.success) {
        toast({
          title: "Consultation cancelled",
          description: result.message,
        });
      } else {
        toast({
          title: "Failed to cancel consultation",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "An unexpected error occurred while cancelling the consultation.",
        variant: "destructive",
      });
    } finally {
      setShowCancelDialog(false);
      setCancellingAppointmentId(null);
      setCancellingAppointmentInfo(null);
    }
  };

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const appointment = getAppointmentById(appointmentId);
      if (!appointment) return;

      const updatedAppointment = {
        ...appointment,
        status: "cancelled" as const,
      };

      updateAppointment(updatedAppointment);

      // If there's an associated bill, cancel it too
      if (appointment.billId) {
        const bill = getBillById(appointment.billId);
        if (bill && bill.status === "pending") {
          updateBill({
            ...bill,
            status: "cancelled" as const,
          });
        }
      }

      toast({
        title: "Appointment cancelled",
        description: `Appointment for ${appointment.patientName} has been cancelled.`,
      });
    } catch (error) {
      toast({
        title: "Failed to cancel appointment",
        description:
          "There was an error cancelling the appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle check-in for scheduled appointments
  const handleCheckInAppointment = async (appointmentId: string) => {
    try {
      const appointment = getAppointmentById(appointmentId);
      if (!appointment) return;

      // Get patient details to check if they're HMO
      const patient = getPatientById(appointment.patientId);
      if (!patient) return;

      // Get doctor details if selected
      const doctor = appointment.doctorId
        ? getStaffById(appointment.doctorId)
        : null;

      // Calculate the total using the consultation fee from hospital settings
      const consultationPrice = doctor
        ? getConsultationFeeByDoctorId(doctor.id)
        : hospitalSettings.generalMedicineFee;

      // Create a bill for this appointment
      const billId = generateBillId();
      const consultationBill = {
        id: billId,
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        date: format(new Date(), "yyyy-MM-dd"),
        status:
          patient.patientType === "hmo"
            ? "paid"
            : ("pending" as
                | "pending"
                | "paid"
                | "cancelled"
                | "hmo_pending"
                | "billed"
                | "dispensed"),
        type: "consultation" as const,
        items: [
          {
            id: `ITEM-${Date.now().toString().slice(-6)}`,
            description: `${
              appointment.consultationType
                ? consultationTypes.find(
                    (ct) => ct.value === appointment.consultationType
                  )?.label
                : "Consultation"
            } Fee`,
            quantity: 1,
            unitPrice: consultationPrice,
          },
        ],
        total: consultationPrice,
        // For HMO patients, add payment details automatically
        ...(patient.patientType === "hmo" && {
          paymentMethod: "hmo" as const,
          paymentReference: `HMO-AUTO-${Date.now().toString().slice(-6)}`,
          paymentDate: format(new Date(), "yyyy-MM-dd"),
          processedBy: "HMO Auto-Process",
        }),
      };

      // Add bill to store
      addBill(consultationBill);

      // Update appointment status
      const updatedAppointment = {
        ...appointment,
        status: "In Progress" as any,
        billId: billId,
      };

      updateAppointment(updatedAppointment);

      // Show different toast messages based on patient type
      if (patient.patientType === "hmo") {
        toast({
          title: "Patient checked in",
          description: `${appointment.patientName} has been checked in and sent directly to Vitals.`,
        });
      } else {
        toast({
          title: "Patient checked in",
          description: `${appointment.patientName} has been checked in and sent to the cash point.`,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to check in patient",
        description:
          "There was an error checking in the patient. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle edit appointment
  const handleEditAppointment = (appointmentId: string) => {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment) return;

    setEditingAppointment(appointmentId);
    setSelectedPatient(appointment.patientId);
    setConsultationType(appointment.consultationType || "initial");
    setSelectedDoctor(appointment.doctorId || "");
    setNotes(appointment.notes || "");
    setPresentingComplaints(appointment.presentingComplaints || "");
    setHistoryOfComplaints(appointment.historyOfComplaints || "");

    if (appointment.status === "scheduled") {
      setActiveTab("schedule");
      setDate(new Date(appointment.date));
      setSelectedTime(appointment.time);
      setAppointmentType(appointment.type);
    } else {
      setActiveTab("immediate");
    }
  };

  // Handle save edited appointment
  const handleSaveEditedAppointment = async () => {
    if (!editingAppointment) return;

    const appointment = getAppointmentById(editingAppointment);
    if (!appointment) return;

    setIsSubmitting(true);

    try {
      // Get patient details
      const patient = getPatientById(selectedPatient || "");
      if (!patient) throw new Error("Patient not found");

      // Get doctor details
      const doctor = getStaffById(selectedDoctor);
      if (!doctor) throw new Error("Doctor not found");

      // Update appointment
      const updatedAppointment = {
        ...appointment,
        patientId: patient.id,
        patientName: patient.name,
        doctor: doctor.name,
        doctorId: doctor.id,
        consultationType: consultationType as
          | "vaccination"
          | "initial"
          | "follow_up"
          | "specialist"
          | "general"
          | "pediatrician",
        notes: notes || appointment.notes,
        presentingComplaints:
          presentingComplaints || appointment.presentingComplaints,
        historyOfComplaints:
          historyOfComplaints || appointment.historyOfComplaints,
      };

      // If it's a scheduled appointment, update date, time and type
      if (appointment.status === "scheduled") {
        updatedAppointment.date = format(date || new Date(), "yyyy-MM-dd");
        updatedAppointment.time = selectedTime || appointment.time;
        updatedAppointment.type = appointmentType || appointment.type;
      }

      // Update appointment in store
      updateAppointment(updatedAppointment);

      // If there's an associated bill, update it too
      if (appointment.billId) {
        const bill = getBillById(appointment.billId);
        if (bill && bill.status === "pending") {
          // Update the bill description to match the new consultation type
          const updatedBill = {
            ...bill,
            items: bill.items.map((item) => ({
              ...item,
              description: `${
                consultationTypes.find((ct) => ct.value === consultationType)
                  ?.label || "Consultation"
              } Fee`,
            })),
          };
          updateBill(updatedBill);
        }
      }

      toast({
        title: "Appointment updated",
        description: `Appointment for ${patient.name} has been updated.`,
      });

      // Reset form and editing state
      setEditingAppointment(null);
      setSelectedPatient(null);
      setConsultationType("initial");
      setSelectedDoctor("");
      setNotes("");
      setSearchTerm("");
      setSearchSuggestions([]);
      setDate(new Date());
      setSelectedTime("");
      setAppointmentType("consultation");
      setPresentingComplaints("");
      setHistoryOfComplaints("");
    } catch (error) {
      toast({
        title: "Failed to update appointment",
        description:
          "There was an error updating the appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit consultation
  const handleEditConsultation = (appointmentId: string) => {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment || !appointment.billId) return;

    // Navigate to edit page
    router.push(`/appointments/edit-consultation/${appointment.billId}`);
  };

  // Handle upgrade/downgrade consultation
  const handleUpgradeConsultation = (appointmentId: string) => {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment || !appointment.billId) return;

    // Navigate to upgrade page
    router.push(`/appointments/upgrade-consultation/${appointment.billId}`);
  };

  // Add this function to check if an appointment is completed (after the other utility functions)
  const isAppointmentCompleted = (appointmentId: string) => {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment || !appointment.billId) return false;

    // Get the patient
    const patient = getPatientById(appointment.patientId);
    if (!patient || !patient.visits || patient.visits.length === 0)
      return false;

    // For HMO patients, check if all services are completed
    if (patient.patientType === "hmo") {
      const latestVisit = patient.visits[patient.visits.length - 1];

      // Check if diagnosis is not in a "with" state (not waiting for any department)
      const isCompletedDiagnosis =
        latestVisit.diagnosis !== "Pending" &&
        !latestVisit.diagnosis.startsWith("With ") &&
        latestVisit.diagnosis !== "Cancelled";

      // For pharmacy prescriptions, check if medications were dispensed
      const bill = getBillById(appointment.billId);
      const allItemsDispensed = bill?.allItemsDispensed === true;

      return (
        isCompletedDiagnosis &&
        (!bill || bill.type !== "pharmacy" || allItemsDispensed)
      );
    }

    return false;
  };

  // Add this function after the other utility functions (around line 400)
  const canCancelConsultation = (appointmentId: string) => {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment || !appointment.billId) return false;

    // Get the bill and patient
    const bill = getBillById(appointment.billId);
    const patient = getPatientById(appointment.patientId);

    if (!bill || !patient) return false;

    // If bill is pending, consultation can be cancelled
    if (bill.status === "pending") return true;

    // If bill is paid, check patient's position in the workflow
    if (bill.status === "paid" && patient.visits && patient.visits.length > 0) {
      const latestVisit = patient.visits[patient.visits.length - 1];
      const diagnosis = latestVisit.diagnosis || "";

      // Can cancel if patient is at vitals or in doctor's queue
      return (
        diagnosis === "Pending" ||
        diagnosis.startsWith("With Vitals:") ||
        diagnosis.startsWith("With Cash Point:") ||
        diagnosis === ""
      );
    }

    return false;
  };

  // Update the getStatusDisplay function to handle completed appointments better
  const getStatusDisplay = (status: string, appointmentId: string) => {
    // If the appointment is actually completed but not marked as such, return "Completed"
    if (status === "In Progress" && isAppointmentCompleted(appointmentId)) {
      return "Completed";
    }

    switch (status) {
      case "scheduled":
        return "Scheduled";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return (
          status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")
        );
    }
  };

  // Update the getStatusBadgeClass function to handle completed appointments better
  const getStatusBadgeClass = (status: string, appointmentId: string) => {
    // If the appointment is actually completed but not marked as such, use the completed style
    if (status === "In Progress" && isAppointmentCompleted(appointmentId)) {
      return "bg-green-50 text-green-800";
    }

    switch (status) {
      case "scheduled":
        return "bg-blue-50 text-blue-800";
      case "In Progress":
        return "bg-yellow-50 text-yellow-800";
      case "completed":
        return "bg-green-50 text-green-800";
      case "cancelled":
        return "bg-red-50 text-red-800";
      default:
        return "";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Schedule appointments and create consultations
          </p>
        </div>

        <Tabs
          defaultValue="immediate"
          onValueChange={setActiveTab}
          value={activeTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="immediate">Immediate Consultation</TabsTrigger>
            <TabsTrigger value="schedule">Schedule Appointment</TabsTrigger>
            <TabsTrigger value="today">Today's Appointments</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Appointments</TabsTrigger>
          </TabsList>

          <TabsContent value="immediate" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PatientSelectionCard
                searchTerm={searchTerm}
                searchBy={searchBy}
                setSearchBy={setSearchBy}
                handleSearchInputChange={handleSearchInputChange}
                handleSearch={handleSearch}
                searchSuggestions={searchSuggestions}
                handleSuggestionSelect={handleSuggestionSelect}
                selectedPatient={selectedPatient}
                getPatientById={getPatientById}
                setSelectedPatient={setSelectedPatient}
                setSearchTerm={setSearchTerm}
                setSearchSuggestions={setSearchSuggestions}
              />

              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingAppointment
                      ? "Edit Consultation"
                      : "Create Consultation"}
                  </CardTitle>
                  <CardDescription>
                    {editingAppointment
                      ? "Edit consultation details"
                      : "Create an immediate consultation for a walk-in patient"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="consultationType">Consultation Type</Label>
                    <Select
                      value={consultationType}
                      onValueChange={setConsultationType}
                    >
                      <SelectTrigger id="consultationType">
                        <SelectValue placeholder="Select consultation type" />
                      </SelectTrigger>
                      <SelectContent>
                        {consultationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doctor">Doctor</Label>
                    <Select
                      value={selectedDoctor}
                      onValueChange={setSelectedDoctor}
                    >
                      <SelectTrigger id="doctor">
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeDoctors.length > 0 ? (
                          activeDoctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name}{" "}
                              {doctor.department
                                ? `(${doctor.department})`
                                : ""}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No active doctors available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {activeDoctors.length === 0 && (
                      <p className="text-sm text-destructive mt-1">
                        No active doctors available. Please contact
                        administration.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="presentingComplaints">
                      Presenting Complaints{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="presentingComplaints"
                      placeholder="Enter patient's current complaints"
                      value={presentingComplaints}
                      onChange={(e) => setPresentingComplaints(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="historyOfComplaints">
                      History of Presenting Complaints
                    </Label>
                    <Textarea
                      id="historyOfComplaints"
                      placeholder="Enter history of presenting complaints (optional)"
                      value={historyOfComplaints}
                      onChange={(e) => setHistoryOfComplaints(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional notes here..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    {editingAppointment ? (
                      <Button
                        className="w-full"
                        onClick={handleSaveEditedAppointment}
                        disabled={
                          isSubmitting ||
                          !selectedPatient ||
                          !consultationType ||
                          !selectedDoctor
                        }
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={handleCreateConsultation}
                        disabled={
                          isSubmitting ||
                          !selectedPatient ||
                          !consultationType ||
                          !selectedDoctor
                        }
                      >
                        <Stethoscope className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Creating..." : "Create Consultation"}
                      </Button>
                    )}

                    {editingAppointment && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setEditingAppointment(null);
                          setSelectedPatient(null);
                          setConsultationType("initial");
                          setSelectedDoctor("");
                          setNotes("");
                        }}
                      >
                        Cancel Editing
                      </Button>
                    )}

                    {!editingAppointment && (
                      <div className="text-sm text-muted-foreground">
                        <p>
                          This will create a consultation bill that will be sent
                          to the cash point for payment processing.
                        </p>
                        <p>
                          After payment, the patient will proceed to vitals and
                          then to the doctor.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PatientSelectionCard
                searchTerm={searchTerm}
                searchBy={searchBy}
                setSearchBy={setSearchBy}
                handleSearchInputChange={handleSearchInputChange}
                handleSearch={handleSearch}
                searchSuggestions={searchSuggestions}
                handleSuggestionSelect={handleSuggestionSelect}
                selectedPatient={selectedPatient}
                getPatientById={getPatientById}
                setSelectedPatient={setSelectedPatient}
                setSearchTerm={setSearchTerm}
                setSearchSuggestions={setSearchSuggestions}
              />

              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingAppointment
                      ? "Edit Appointment"
                      : "Appointment Details"}
                  </CardTitle>
                  <CardDescription>
                    {editingAppointment
                      ? "Edit scheduled appointment"
                      : "Schedule a future appointment"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          className="bg-gray-800 text-gray-100"
                          onSelect={setDate}
                          initialFocus
                          disabled={(date: Date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Select
                      value={selectedTime}
                      onValueChange={setSelectedTime}
                    >
                      <SelectTrigger id="time">
                        <SelectValue placeholder="Select time">
                          {selectedTime ? (
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              {selectedTime}
                            </div>
                          ) : (
                            "Select time"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Appointment Type</Label>
                    <Select
                      value={appointmentType}
                      onValueChange={setAppointmentType}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {appointmentType === "consultation" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="scheduledConsultationType">
                          Consultation Type
                        </Label>
                        <Select
                          value={consultationType}
                          onValueChange={setConsultationType}
                        >
                          <SelectTrigger id="scheduledConsultationType">
                            <SelectValue placeholder="Select consultation type" />
                          </SelectTrigger>
                          <SelectContent>
                            {consultationTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="scheduledDoctor">Doctor</Label>
                        <Select
                          value={selectedDoctor}
                          onValueChange={setSelectedDoctor}
                        >
                          <SelectTrigger id="scheduledDoctor">
                            <SelectValue placeholder="Select doctor" />
                          </SelectTrigger>
                          <SelectContent>
                            {allDoctors.length > 0 ? (
                              allDoctors.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                  {doctor.name}{" "}
                                  {doctor.department
                                    ? `(${doctor.department})`
                                    : ""}
                                  {doctor.status !== "active" &&
                                    ` - ${doctor.status
                                      .replace("_", " ")
                                      .toUpperCase()}`}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No doctors available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {appointmentType === "vaccination" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="vaccine">Vaccine</Label>
                        <Select
                          value={selectedVaccine}
                          onValueChange={setSelectedVaccine}
                        >
                          <SelectTrigger id="vaccine">
                            <SelectValue placeholder="Select vaccine" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVaccines.length > 0 ? (
                              availableVaccines.map((vaccine) => (
                                <SelectItem key={vaccine.id} value={vaccine.id}>
                                  {vaccine.name} ({vaccine.stock} in stock)
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No vaccines available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="doseType">Dose Type</Label>
                        <Select
                          value={vaccineDoseType}
                          onValueChange={setVaccineDoseType}
                        >
                          <SelectTrigger id="doseType">
                            <SelectValue placeholder="Select dose type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="initial">
                              Initial Dose
                            </SelectItem>
                            <SelectItem value="review">Review Dose</SelectItem>
                            <SelectItem value="subsequent">
                              Subsequent Dose
                            </SelectItem>
                            <SelectItem value="one_off">
                              One-off Dose
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional notes here..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {appointmentType === "consultation" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="scheduledPresentingComplaints">
                          Presenting Complaints{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="scheduledPresentingComplaints"
                          placeholder="Enter patient's current complaints"
                          value={presentingComplaints}
                          onChange={(e) =>
                            setPresentingComplaints(e.target.value)
                          }
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="scheduledHistoryOfComplaints">
                          History of Presenting Complaints
                        </Label>
                        <Textarea
                          id="scheduledHistoryOfComplaints"
                          placeholder="Enter history of presenting complaints (optional)"
                          value={historyOfComplaints}
                          onChange={(e) =>
                            setHistoryOfComplaints(e.target.value)
                          }
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {editingAppointment ? (
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={handleSaveEditedAppointment}
                        disabled={
                          isSubmitting ||
                          !selectedPatient ||
                          !date ||
                          !selectedTime ||
                          !appointmentType ||
                          (appointmentType === "consultation" &&
                            (!consultationType || !selectedDoctor))
                        }
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setEditingAppointment(null);
                          setSelectedPatient(null);
                          setDate(new Date());
                          setSelectedTime("");
                          setAppointmentType("consultation");
                          setConsultationType("initial");
                          setSelectedDoctor("");
                          setNotes("");
                        }}
                      >
                        Cancel Editing
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={handleScheduleAppointment}
                      disabled={
                        isSubmitting ||
                        !selectedPatient ||
                        !date ||
                        !selectedTime ||
                        !appointmentType ||
                        (appointmentType === "consultation" &&
                          (!consultationType || !selectedDoctor)) ||
                        (appointmentType === "vaccination" && !selectedVaccine)
                      }
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
                <CardDescription>
                  {format(new Date(), "PPP")} - {todaysAppointments.length}{" "}
                  appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todaysAppointments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No appointments scheduled for today
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaysAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-4 border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {appointment.patientName}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                getStatusBadgeClass(
                                  appointment.status,
                                  appointment.id
                                )
                              )}
                            >
                              {getStatusDisplay(
                                appointment.status,
                                appointment.id
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ID: {appointment.patientId} • {appointment.time} •{" "}
                            {appointment.type}
                            {appointment.consultationType &&
                              ` (${
                                consultationTypes.find(
                                  (ct) =>
                                    ct.value === appointment.consultationType
                                )?.label
                              })`}
                          </p>
                          {appointment.doctor && (
                            <p className="text-sm text-muted-foreground">
                              Doctor: {appointment.doctor}
                            </p>
                          )}
                          {appointment.notes && (
                            <p className="text-sm mt-1">{appointment.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2 self-end md:self-center">
                          {appointment.status === "scheduled" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCheckInAppointment(appointment.id)
                                }
                              >
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Check In
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleEditAppointment(appointment.id)
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleCancelAppointment(appointment.id)
                                }
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {appointment.status === "In Progress" && (
                            <>
                              {isAppointmentBillPending(appointment.id) &&
                                canChangeDoctorForAppointment(
                                  appointment.id
                                ) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleEditConsultation(appointment.id)
                                    }
                                    title="Edit Doctor"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Change Doctor
                                  </Button>
                                )}
                              {isAppointmentBillPaid(appointment.id) &&
                                canChangeDoctorForAppointment(
                                  appointment.id
                                ) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleUpgradeConsultation(appointment.id)
                                    }
                                    title="Upgrade/Downgrade Doctor"
                                  >
                                    <ArrowUpDown className="mr-2 h-4 w-4" />
                                    Change Doctor
                                  </Button>
                                )}
                              {/* Show cancel button if consultation can be cancelled */}
                              {canCancelConsultation(appointment.id) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() =>
                                    handleOpenCancelDialog(appointment.id)
                                  }
                                  title="Cancel Consultation"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {appointment.status === "cancelled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPatient(appointment.patientId);
                                setActiveTab("immediate");
                              }}
                            >
                              Create New Consultation
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>
                    View and manage future appointments
                  </CardDescription>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardHeader>
              <CardContent>
                {date ? (
                  selectedDateAppointments.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-medium">
                        Appointments for {format(date, "PPP")} (
                        {selectedDateAppointments.length})
                      </h3>
                      {selectedDateAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="p-4 border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {appointment.patientName}
                              </h3>
                              <Badge
                                variant="outline"
                                className={cn(
                                  getStatusBadgeClass(
                                    appointment.status,
                                    appointment.id
                                  )
                                )}
                              >
                                {getStatusDisplay(
                                  appointment.status,
                                  appointment.id
                                )}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              ID: {appointment.patientId} • {appointment.time} •{" "}
                              {appointment.type}
                              {appointment.consultationType &&
                                ` (${
                                  consultationTypes.find(
                                    (ct) =>
                                      ct.value === appointment.consultationType
                                  )?.label
                                })`}
                            </p>
                            {appointment.doctor && (
                              <p className="text-sm text-muted-foreground">
                                Doctor: {appointment.doctor}
                              </p>
                            )}
                            {appointment.notes && (
                              <p className="text-sm mt-1">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 self-end md:self-center">
                            {appointment.status === "scheduled" && (
                              <>
                                {format(
                                  new Date(appointment.date),
                                  "yyyy-MM-dd"
                                ) === format(new Date(), "yyyy-MM-dd") && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleCheckInAppointment(appointment.id)
                                    }
                                  >
                                    <CheckSquare className="mr-2 h-4 w-4" />
                                    Check In
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleEditAppointment(appointment.id)
                                  }
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelAppointment(appointment.id)
                                  }
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {appointment.status === "cancelled" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPatient(appointment.patientId);
                                  setActiveTab("schedule");
                                }}
                              >
                                Reschedule
                              </Button>
                            )}
                            {appointment.status === "In Progress" && (
                              <>
                                {isAppointmentBillPending(appointment.id) &&
                                  canChangeDoctorForAppointment(
                                    appointment.id
                                  ) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleEditConsultation(appointment.id)
                                      }
                                      title="Edit Doctor"
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Change Doctor
                                    </Button>
                                  )}
                                {isAppointmentBillPaid(appointment.id) &&
                                  canChangeDoctorForAppointment(
                                    appointment.id
                                  ) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleUpgradeConsultation(
                                          appointment.id
                                        )
                                      }
                                      title="Upgrade/Downgrade Doctor"
                                    >
                                      <ArrowUpDown className="mr-2 h-4 w-4" />
                                      Change Doctor
                                    </Button>
                                  )}
                                {/* Show cancel button if consultation can be cancelled */}
                                {canCancelConsultation(appointment.id) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() =>
                                      handleOpenCancelDialog(appointment.id)
                                    }
                                    title="Cancel Consultation"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No appointments scheduled for {format(date, "PPP")}
                    </div>
                  )
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Select a date to view appointments
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Cancel Consultation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Consultation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the consultation for{" "}
              {cancellingAppointmentInfo?.patientName}?
              {cancellingAppointmentInfo?.isPaid &&
                cancellingAppointmentInfo?.patientType === "cash" && (
                  <p className="mt-2 text-sm font-medium text-amber-600">
                    The payment will be refunded to the patient's balance.
                  </p>
                )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancellingAppointmentId(null);
                setCancellingAppointmentInfo(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancelConsultation}
            >
              Yes, Cancel Consultation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </MainLayout>
  );
}
