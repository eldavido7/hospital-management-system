"use client";

import type React from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/data/store";
import { useVaccineStore, type VaccineDoseType } from "@/lib/data/vaccines";
import { useStoreExtension } from "@/lib/data/storeext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  CheckCircle,
  AlertCircle,
  CalendarIcon,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ScheduleVaccinationPage() {
  // Store hooks
  const { patients, getPatientById, updateAppointment, getAppointmentById } =
    useAppStore();
  const { getAllVaccines, getVaccineById } = useVaccineStore();
  const {
    scheduleVaccinationAppointment,
    getPatientVaccinationHistory,
    checkPatientVaccineEligibility,
    getRecommendedVaccinesForPatient,
    getVaccinationAppointments,
    createVaccinationBill,
  } = useStoreExtension();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [selectedVaccineId, setSelectedVaccineId] = useState<string | null>(
    null
  );
  const [selectedDoseType, setSelectedDoseType] =
    useState<VaccineDoseType>("initial");
  const [appointmentType, setAppointmentType] = useState<
    "immediate" | "scheduled"
  >("immediate");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("09:00 AM");
  const [overrideEligibility, setOverrideEligibility] = useState(false);
  const [eligibilityCheck, setEligibilityCheck] = useState<{
    eligible: boolean;
    reason?: string;
    requiresOverride?: boolean;
  } | null>(null);
  const [recommendedVaccines, setRecommendedVaccines] = useState<any[]>([]);
  const [vaccinationAppointments, setVaccinationAppointments] = useState<any[]>(
    []
  );
  const [activeTab, setActiveTab] = useState("recommended");
  const [notes, setNotes] = useState("");

  // Time slots for scheduling
  const timeSlots = [
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

  // Filter patients based on search query
  const filteredPatients =
    searchQuery.length < 2
      ? []
      : patients.filter(
          (patient) =>
            patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.id.toLowerCase().includes(searchQuery.toLowerCase())
        );

  // Get all vaccines
  const allVaccines = getAllVaccines();

  // Load vaccination appointments
  useEffect(() => {
    const appointments = getVaccinationAppointments();
    setVaccinationAppointments(appointments);
  }, [getVaccinationAppointments]);

  // Effect to check eligibility when patient and vaccine are selected
  useEffect(() => {
    if (selectedPatientId && selectedVaccineId) {
      const eligibility = checkPatientVaccineEligibility(
        selectedPatientId,
        selectedVaccineId,
        selectedDoseType
      );
      setEligibilityCheck(eligibility);
    } else {
      setEligibilityCheck(null);
    }
  }, [
    selectedPatientId,
    selectedVaccineId,
    selectedDoseType,
    checkPatientVaccineEligibility,
  ]);

  // Effect to get recommended vaccines when patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      const recommendations =
        getRecommendedVaccinesForPatient(selectedPatientId);
      setRecommendedVaccines(recommendations);
    } else {
      setRecommendedVaccines([]);
    }
  }, [selectedPatientId, getRecommendedVaccinesForPatient]);

  // Handle patient selection
  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    setSelectedVaccineId(null);
    setSelectedDoseType("initial");
    setEligibilityCheck(null);
  };

  // Handle vaccine selection
  const handleVaccineSelect = (vaccineId: string) => {
    setSelectedVaccineId(vaccineId);

    // Reset dose type when changing vaccines
    setSelectedDoseType("initial");

    // Check if this is a one-off vaccine
    const vaccine = getVaccineById(vaccineId);
    if (vaccine && vaccine.total_required_doses === 1) {
      setSelectedDoseType("one_off");
    }
  };

  // Handle recommended vaccine selection
  const handleRecommendedVaccineSelect = (
    vaccineId: string,
    doseType: VaccineDoseType
  ) => {
    setSelectedVaccineId(vaccineId);
    setSelectedDoseType(doseType);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatientId || !selectedVaccineId) {
      toast({
        title: "Missing Information",
        description: "Please select both a patient and a vaccine.",
        variant: "destructive",
      });
      return;
    }

    // Check eligibility unless override is checked
    if (
      !overrideEligibility &&
      eligibilityCheck &&
      !eligibilityCheck.eligible
    ) {
      toast({
        title: "Eligibility Check Failed",
        description:
          eligibilityCheck.reason ||
          "Patient is not eligible for this vaccination.",
        variant: "destructive",
      });
      return;
    }

    // For scheduled appointments, check date and time
    if (appointmentType === "scheduled") {
      if (!date) {
        toast({
          title: "Date Required",
          description: "Please select a date for the scheduled vaccination.",
          variant: "destructive",
        });
        return;
      }

      if (!time) {
        toast({
          title: "Time Required",
          description: "Please select a time for the scheduled vaccination.",
          variant: "destructive",
        });
        return;
      }
    }

    // Schedule the vaccination
    const result = scheduleVaccinationAppointment(
      selectedPatientId,
      selectedVaccineId,
      selectedDoseType,
      overrideEligibility
    );

    if (result.success) {
      // If we have an appointment ID
      if (result.appointmentId) {
        // Get the appointment
        const appointment = getAppointmentById(result.appointmentId);

        if (appointment) {
          if (appointmentType === "scheduled") {
            // Update with scheduled date and time
            updateAppointment({
              ...appointment,
              date: format(date!, "yyyy-MM-dd"),
              time: time,
              notes: notes || appointment.notes,
              status: "scheduled",
            });

            toast({
              title: "Success",
              description: `Vaccination scheduled for ${format(
                date!,
                "PPP"
              )} at ${time}`,
            });
          } else {
            // For immediate vaccinations, send to vitals for assessment
            // Get patient details
            const patient = getPatientById(selectedPatientId);
            if (patient) {
              // Update appointment status to "In Progress"
              updateAppointment({
                ...appointment,
                status: "In Progress" as any,
                notes: notes || appointment.notes,
              });

              // For all vaccinations, send directly to Vitals first
              const { updatePatient } = useAppStore.getState();
              const today = new Date().toISOString().split("T")[0];
              const vaccine = getVaccineById(selectedVaccineId);

              // Check if patient already has a visit for today
              const updatedVisits = [...(patient.visits || [])];
              const visitIndex = updatedVisits.findIndex(
                (v) => v.date === today
              );

              if (visitIndex >= 0) {
                // Update existing visit
                updatedVisits[visitIndex] = {
                  ...updatedVisits[visitIndex],
                  diagnosis: "With Vitals: Vaccination",
                  notes: `${
                    updatedVisits[visitIndex].notes || ""
                  }\nImmediate vaccination: ${
                    vaccine?.name
                  } (${selectedDoseType} dose)`,
                };
              } else {
                // Create new visit
                updatedVisits.push({
                  id: `V-${Date.now()}`,
                  date: today,
                  type: "Vaccination",
                  doctor: "Nurse", // Default to nurse for vaccinations
                  diagnosis: "With Vitals: Vaccination",
                  vitals: {
                    bloodPressure: "",
                    temperature: "",
                    heartRate: "",
                    respiratoryRate: "",
                    oxygenSaturation: "",
                    weight: "",
                    height: "",
                  },
                  notes: `Immediate vaccination: ${vaccine?.name} (${selectedDoseType} dose)`,
                });
              }

              // Update patient
              updatePatient({
                ...patient,
                lastVisit: today,
                visits: updatedVisits,
              });

              // DO NOT create a bill here - it will be created after vitals approval

              toast({
                title: "Success",
                description: `Immediate vaccination created for ${patient.name} and sent to Vitals for assessment.`,
              });
            }
          }
        }
      } else {
        toast({
          title: "Success",
          description: result.message,
        });
      }

      // Reset form
      setSelectedPatientId(null);
      setSelectedVaccineId(null);
      setSelectedDoseType("initial");
      setSearchQuery("");
      setDate(new Date());
      setTime("09:00 AM");
      setOverrideEligibility(false);
      setEligibilityCheck(null);
      setNotes("");

      // Refresh appointments list
      const appointments = getVaccinationAppointments();
      setVaccinationAppointments(appointments);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  // Handle check-in for scheduled vaccination
  const handleCheckIn = (appointmentId: string) => {
    try {
      const appointment = getAppointmentById(appointmentId);
      if (!appointment) return;

      // Update appointment status
      updateAppointment({
        ...appointment,
        status: "In Progress" as any,
      });

      // Get patient details
      const patient = getPatientById(appointment.patientId);
      if (!patient) return;

      // For all vaccinations, send directly to Vitals first
      const { updatePatient } = useAppStore.getState();
      const today = new Date().toISOString().split("T")[0];
      const vaccine = getVaccineById(
        (appointment as any).vaccinationDetails.vaccineId
      );

      // Check if patient already has a visit for today
      const updatedVisits = [...(patient.visits || [])];
      const visitIndex = updatedVisits.findIndex((v) => v.date === today);

      if (visitIndex >= 0) {
        // Update existing visit
        updatedVisits[visitIndex] = {
          ...updatedVisits[visitIndex],
          diagnosis: "With Vitals: Vaccination",
          notes: `${
            updatedVisits[visitIndex].notes || ""
          }\nChecked in for vaccination: ${vaccine?.name}`,
        };
      } else {
        // Create new visit
        updatedVisits.push({
          id: `V-${Date.now()}`,
          date: today,
          type: "Vaccination",
          doctor: "Nurse", // Default to nurse for vaccinations
          diagnosis: "With Vitals: Vaccination",
          vitals: {
            bloodPressure: "",
            temperature: "",
            heartRate: "",
            respiratoryRate: "",
            oxygenSaturation: "",
            weight: "",
            height: "",
          },
          notes: `Checked in for vaccination: ${vaccine?.name}`,
        });
      }

      // Update patient
      updatePatient({
        ...patient,
        lastVisit: today,
        visits: updatedVisits,
      });

      // DO NOT create a bill here - it will be created after vitals approval

      toast({
        title: "Patient checked in",
        description: `${appointment.patientName} has been checked in for vaccination and sent to Vitals for assessment.`,
      });

      // Refresh appointments list
      const appointments = getVaccinationAppointments();
      setVaccinationAppointments(appointments);
    } catch (error) {
      toast({
        title: "Failed to check in patient",
        description:
          "There was an error checking in the patient. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle appointment cancellation
  const handleCancelAppointment = (appointmentId: string) => {
    try {
      const appointment = getAppointmentById(appointmentId);
      if (!appointment) return;

      updateAppointment({
        ...appointment,
        status: "cancelled" as const,
      });

      toast({
        title: "Appointment cancelled",
        description: `Vaccination appointment for ${appointment.patientName} has been cancelled.`,
      });

      // Refresh appointments list
      const appointments = getVaccinationAppointments();
      setVaccinationAppointments(appointments);
    } catch (error) {
      toast({
        title: "Failed to cancel appointment",
        description:
          "There was an error cancelling the appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format dose type for display
  const formatDoseType = (doseType: VaccineDoseType) => {
    switch (doseType) {
      case "initial":
        return "Initial Dose";
      case "review":
        return "Review Dose";
      case "subsequent":
        return "Subsequent Dose";
      case "one_off":
        return "One-off Dose";
      default:
        return doseType;
    }
  };

  // Filter appointments for today
  const todaysAppointments = vaccinationAppointments.filter(
    (appointment) =>
      appointment.date === format(new Date(), "yyyy-MM-dd") &&
      appointment.status === "scheduled"
  );

  // Filter upcoming appointments (future dates)
  const upcomingAppointments = vaccinationAppointments.filter(
    (appointment) =>
      appointment.status === "scheduled" &&
      new Date(appointment.date) >
        new Date(new Date().setHours(23, 59, 59, 999))
  );

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Schedule Vaccination</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>

        <Tabs defaultValue="new" className="space-y-4">
          <TabsList>
            <TabsTrigger value="new">New Vaccination</TabsTrigger>
            <TabsTrigger value="today">
              Today's Appointments ({todaysAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming Appointments ({upcomingAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Patient Selection */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Select Patient</CardTitle>
                  <CardDescription>
                    Search and select a patient for vaccination
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patients..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto border rounded-md">
                    {searchQuery.length < 2 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Type at least 2 characters to search
                      </div>
                    ) : filteredPatients.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No patients found
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className={cn(
                              "p-3 cursor-pointer hover:bg-muted",
                              selectedPatientId === patient.id && "bg-muted"
                            )}
                            onClick={() => handlePatientSelect(patient.id)}
                          >
                            <div className="font-medium">{patient.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {patient.id} • Age: {patient.age}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Vaccination Form */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Vaccination Details</CardTitle>
                  <CardDescription>
                    {selectedPatientId
                      ? `Configure vaccination details for ${
                          getPatientById(selectedPatientId)?.name ||
                          "selected patient"
                        }`
                      : "Select a patient first"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPatientId ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Appointment Type */}
                      <div className="space-y-2">
                        <Label>Appointment Type</Label>
                        <RadioGroup
                          value={appointmentType}
                          onValueChange={(value) =>
                            setAppointmentType(
                              value as "immediate" | "scheduled"
                            )
                          }
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="immediate" id="immediate" />
                            <Label htmlFor="immediate">Immediate (Today)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="scheduled" id="scheduled" />
                            <Label htmlFor="scheduled">
                              Scheduled (Future Date)
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Scheduling options - only show if scheduled is selected */}
                      {appointmentType === "scheduled" && (
                        <div className="space-y-4 border-l-2 pl-4 border-muted">
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
                                  onSelect={setDate}
                                  initialFocus
                                  disabled={(date: Date) =>
                                    date <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <Select value={time} onValueChange={setTime}>
                              <SelectTrigger id="time">
                                <SelectValue placeholder="Select time">
                                  {time ? (
                                    <div className="flex items-center">
                                      <Clock className="mr-2 h-4 w-4" />
                                      {time}
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
                        </div>
                      )}

                      <Tabs
                        defaultValue={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                      >
                        <TabsList className="grid grid-cols-2">
                          <TabsTrigger value="recommended">
                            Recommended
                          </TabsTrigger>
                          <TabsTrigger value="all">All Vaccines</TabsTrigger>
                        </TabsList>

                        <TabsContent
                          value="recommended"
                          className="space-y-4 pt-4"
                        >
                          {recommendedVaccines.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                              No recommended vaccines for this patient
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {recommendedVaccines.map((rec) => (
                                <div
                                  key={`${rec.vaccineId}-${rec.doseType}`}
                                  className={cn(
                                    "p-4 border rounded-lg cursor-pointer hover:border-primary",
                                    selectedVaccineId === rec.vaccineId &&
                                      selectedDoseType === rec.doseType
                                      ? "border-primary bg-primary/5"
                                      : ""
                                  )}
                                  onClick={() =>
                                    handleRecommendedVaccineSelect(
                                      rec.vaccineId,
                                      rec.doseType
                                    )
                                  }
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">
                                        {rec.name}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {formatDoseType(rec.doseType)}
                                      </div>
                                      {rec.nextDueDate && (
                                        <div className="text-sm text-muted-foreground">
                                          Due: {rec.nextDueDate}
                                        </div>
                                      )}
                                    </div>
                                    {selectedVaccineId === rec.vaccineId &&
                                      selectedDoseType === rec.doseType && (
                                        <CheckCircle className="h-5 w-5 text-primary" />
                                      )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="all" className="space-y-4 pt-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="vaccine">Select Vaccine</Label>
                              <Select
                                value={selectedVaccineId || ""}
                                onValueChange={handleVaccineSelect}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a vaccine" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allVaccines.map((vaccine) => (
                                    <SelectItem
                                      key={vaccine.id}
                                      value={vaccine.id}
                                      disabled={vaccine.stock <= 0}
                                    >
                                      {vaccine.name}{" "}
                                      {vaccine.stock <= 0 && "(Out of Stock)"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {selectedVaccineId && (
                              <div className="space-y-2">
                                <Label htmlFor="doseType">Dose Type</Label>
                                <RadioGroup
                                  value={selectedDoseType}
                                  onValueChange={(value) =>
                                    setSelectedDoseType(
                                      value as VaccineDoseType
                                    )
                                  }
                                  className="flex flex-col space-y-1"
                                >
                                  {getVaccineById(selectedVaccineId)
                                    ?.total_required_doses === 1 ? (
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="one_off"
                                        id="one_off"
                                      />
                                      <Label htmlFor="one_off">
                                        One-off Dose
                                      </Label>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                          value="initial"
                                          id="initial"
                                        />
                                        <Label htmlFor="initial">
                                          Initial Dose
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                          value="review"
                                          id="review"
                                        />
                                        <Label htmlFor="review">
                                          Review Dose
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                          value="subsequent"
                                          id="subsequent"
                                        />
                                        <Label htmlFor="subsequent">
                                          Subsequent Dose
                                        </Label>
                                      </div>
                                    </>
                                  )}
                                </RadioGroup>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>

                      {/* Notes field */}
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                          id="notes"
                          placeholder="Add any additional notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>

                      {/* Eligibility Check Result */}
                      {eligibilityCheck && (
                        <div
                          className={cn(
                            "p-4 border rounded-md",
                            eligibilityCheck.eligible
                              ? "bg-white border-green-200"
                              : "bg-amber-50 border-amber-200"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {eligibilityCheck.eligible ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                            )}
                            <div>
                              <p className="font-medium">
                                {eligibilityCheck.eligible
                                  ? "Patient is eligible for this vaccination"
                                  : "Patient may not be eligible"}
                              </p>
                              {!eligibilityCheck.eligible &&
                                eligibilityCheck.reason && (
                                  <p className="text-sm text-muted-foreground">
                                    {eligibilityCheck.reason}
                                  </p>
                                )}
                              {!eligibilityCheck.eligible &&
                                eligibilityCheck.requiresOverride && (
                                  <div className="mt-2 flex items-center space-x-2">
                                    <Checkbox
                                      id="override"
                                      checked={overrideEligibility}
                                      onCheckedChange={(checked) =>
                                        setOverrideEligibility(!!checked)
                                      }
                                    />
                                    <Label
                                      htmlFor="override"
                                      className="text-sm font-medium"
                                    >
                                      Override eligibility check (requires
                                      authorization)
                                    </Label>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={
                          !selectedPatientId ||
                          !selectedVaccineId ||
                          (!eligibilityCheck?.eligible &&
                            !overrideEligibility) ||
                          (appointmentType === "scheduled" && (!date || !time))
                        }
                      >
                        {appointmentType === "immediate"
                          ? "Create Immediate Vaccination"
                          : "Schedule Vaccination"}
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Please select a patient to continue
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Vaccination Appointments</CardTitle>
                <CardDescription>
                  {format(new Date(), "PPP")} - {todaysAppointments.length}{" "}
                  appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todaysAppointments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No vaccinations scheduled for today
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
                              className="bg-blue-50 text-blue-800"
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ID: {appointment.patientId} • {appointment.time} •{" "}
                            {appointment.vaccinationDetails.vaccineName} (
                            {formatDoseType(
                              appointment.vaccinationDetails.doseType
                            )}
                            )
                          </p>
                          {appointment.notes && (
                            <p className="text-sm mt-1">{appointment.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2 self-end md:self-center">
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(appointment.id)}
                          >
                            Check In
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
              <CardHeader>
                <CardTitle>Upcoming Vaccination Appointments</CardTitle>
                <CardDescription>Future scheduled vaccinations</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No upcoming vaccinations scheduled
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
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
                              className="bg-blue-50 text-blue-800"
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(appointment.date), "PPP")} •{" "}
                            {appointment.time} •{" "}
                            {appointment.vaccinationDetails.vaccineName} (
                            {formatDoseType(
                              appointment.vaccinationDetails.doseType
                            )}
                            )
                          </p>
                          {appointment.notes && (
                            <p className="text-sm mt-1">{appointment.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2 self-end md:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCancelAppointment(appointment.id)
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
