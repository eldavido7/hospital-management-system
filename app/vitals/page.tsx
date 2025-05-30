"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowRight,
  ClipboardList,
  UserRound,
  Syringe,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/lib/data/store";
import { useVaccineStore } from "@/lib/data/vaccines";
import { useStoreExtension } from "@/lib/data/storeext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

export default function VitalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activePatient, setActivePatient] = useState<string | null>(null);
  const [vitals, setVitals] = useState({
    bloodPressure: "",
    temperature: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
    bmi: 0,
    bmiInterpretation: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vaccinationApproval, setVaccinationApproval] = useState<
    "approve" | "deny" | null
  >(null);
  const [denialReason, setDenialReason] = useState("");

  // Use the centralized store
  const {
    bills,
    patients,
    getPatientById,
    updatePatient,
    getBillById,
    appointments,
  } = useAppStore();
  const { getVaccineById } = useVaccineStore();
  const { processVaccinationAtVitals } = useStoreExtension();

  // Get patients who have paid for consultation but haven't had vitals taken
  // Exclude HMO patients who are still waiting for approval
  const consultationPatientsInQueue = bills
    .filter((bill) => {
      // Only include paid consultation bills that haven't been processed by vitals
      if (
        bill.status !== "paid" ||
        bill.type !== "consultation" ||
        bill.processedBy?.includes("Vitals")
      ) {
        return false;
      }

      // Check if this is an HMO patient waiting for approval
      const patient = getPatientById(bill.patientId);
      if (
        patient &&
        patient.patientType === "hmo" &&
        patient.visits &&
        patient.visits.length > 0
      ) {
        const latestVisit = patient.visits[patient.visits.length - 1];
        // If the diagnosis is "With HMO: Initial Consultation", they're still waiting for approval
        if (latestVisit.diagnosis === "With HMO: Initial Consultation") {
          return false;
        }
      }

      return true;
    })
    .map((bill) => {
      const patient = getPatientById(bill.patientId);
      return {
        id: bill.patientId,
        name: bill.patientName,
        billId: bill.id,
        paymentDate: bill.paymentDate || "",
        age: patient?.age || 0,
        gender: patient?.gender || "",
      };
    });

  // Get patients who are scheduled for vaccination and need vitals
  const vaccinationPatients = patients
    .filter((patient) => {
      // Check if patient has a visit with "With Vitals: Vaccination" diagnosis
      if (patient.visits && patient.visits.length > 0) {
        const latestVisit = patient.visits[patient.visits.length - 1];
        if (latestVisit.diagnosis === "With Vitals: Vaccination") {
          return true;
        }
      }
      return false;
    })
    .map((patient) => {
      // Find the vaccination appointment for this patient
      const vaccinationAppointment = appointments.find(
        (a) =>
          a.patientId === patient.id &&
          a.type === "Vaccination" &&
          a.status === "In Progress"
      );

      if (
        !vaccinationAppointment ||
        !(vaccinationAppointment as any).vaccinationDetails
      ) {
        return {
          id: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          isVaccination: true,
          appointmentId: vaccinationAppointment?.id,
        };
      }

      // Get vaccine details directly from the store
      const vaccineId = (vaccinationAppointment as any).vaccinationDetails
        .vaccineId;
      const vaccine = getVaccineById(vaccineId);
      const doseType = (vaccinationAppointment as any).vaccinationDetails
        .doseType;

      return {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        isVaccination: true,
        appointmentId: vaccinationAppointment.id,
        vaccineId,
        vaccineName: vaccine?.name,
        isGovernmentProvided: vaccine?.is_government_provided,
        doseType,
      };
    });

  // Combine both types of patients
  const allPatientsInQueue = [
    ...consultationPatientsInQueue,
    ...vaccinationPatients,
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVitals((prev) => ({ ...prev, [name]: value }));
  };

  // Check if the active patient is a vaccination patient
  const isActivePatientVaccination = () => {
    if (!activePatient) return false;
    return vaccinationPatients.some((p) => p.id === activePatient);
  };

  // Get active vaccination patient details
  const getActiveVaccinationPatient = () => {
    if (!activePatient) return null;
    return vaccinationPatients.find((p) => p.id === activePatient);
  };

  // Update the handleSubmitVitals function to handle both types of patients
  const handleSubmitVitals = async () => {
    if (!activePatient) return;

    // Validate required fields
    if (!vitals.bloodPressure || !vitals.temperature || !vitals.heartRate) {
      toast({
        title: "Missing information",
        description:
          "Blood pressure, temperature, and heart rate are required.",
        variant: "destructive",
      });
      return;
    }

    // For vaccination patients, validate approval/denial selection
    if (isActivePatientVaccination() && !vaccinationApproval) {
      toast({
        title: "Missing approval decision",
        description:
          "Please select whether to approve or deny the vaccination.",
        variant: "destructive",
      });
      return;
    }

    // For vaccination denials, validate reason
    if (
      isActivePatientVaccination() &&
      vaccinationApproval === "deny" &&
      !denialReason.trim()
    ) {
      toast({
        title: "Missing denial reason",
        description: "Please provide a reason for denying the vaccination.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get patient
      const patient = getPatientById(activePatient);
      if (!patient) throw new Error("Patient not found");

      // Check if this is a vaccination patient
      if (isActivePatientVaccination()) {
        // Handle vaccination patient
        await handleVaccinationVitals(patient);
      } else {
        // Handle consultation patient
        await handleConsultationVitals(patient);
      }

      // Reset form
      setVitals({
        bloodPressure: "",
        temperature: "",
        heartRate: "",
        respiratoryRate: "",
        oxygenSaturation: "",
        weight: "",
        height: "",
        bmi: 0,
        bmiInterpretation: "",
      });
      setVaccinationApproval(null);
      setDenialReason("");
      setActivePatient(null);
    } catch (error) {
      console.error("Error submitting vitals:", error);
      toast({
        title: "Failed to record vitals",
        description:
          "There was an error recording the vitals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle vitals for consultation patients
  const handleConsultationVitals = async (patient) => {
    // Get the consultation bill
    const consultationBill = bills.find(
      (bill) =>
        bill.patientId === patient.id &&
        bill.status === "paid" &&
        bill.type === "consultation" &&
        !bill.processedBy?.includes("Vitals")
    );

    if (!consultationBill) throw new Error("Consultation bill not found");

    // Check if this patient already has a visit in progress
    // If they do, we should update that visit instead of creating a new one
    let existingVisitIndex = -1;
    if (patient.visits && patient.visits.length > 0) {
      // Check if the latest visit is still in progress (not completed)
      const latestVisit = patient.visits[patient.visits.length - 1];
      if (
        latestVisit.diagnosis === "Pending" ||
        latestVisit.diagnosis.startsWith("With Cash Point:") ||
        latestVisit.diagnosis.startsWith("With Vitals:")
      ) {
        existingVisitIndex = patient.visits.length - 1;
      }
    }

    // Get the appointment to find the assigned doctor
    const appointment = appointments.find(
      (a) => a.billId === consultationBill.id
    );
    const doctorName = appointment?.doctor || "Pending";

    if (existingVisitIndex >= 0) {
      // Update existing visit with vitals
      const updatedVisits = [...(patient.visits || [])];
      updatedVisits[existingVisitIndex] = {
        ...updatedVisits[existingVisitIndex],
        vitals: {
          bloodPressure: vitals.bloodPressure,
          temperature: vitals.temperature,
          heartRate: vitals.heartRate,
          respiratoryRate: vitals.respiratoryRate || "Not recorded",
          oxygenSaturation: vitals.oxygenSaturation || "Not recorded",
          weight: vitals.weight || "Not recorded",
          height: vitals.height || "Not recorded",
          ...(vitals.bmi > 0 && {
            bmi: vitals.bmi,
            bmiInterpretation: vitals.bmiInterpretation,
          }),
        },
        // Preserve the doctor assignment if it was changed
        doctor: doctorName,
        // Update diagnosis to indicate vitals have been recorded
        diagnosis: "Pending", // This will make the patient appear in the doctor's queue
        notes:
          (updatedVisits[existingVisitIndex].notes || "") +
          "\nVitals recorded, awaiting doctor consultation",
      };

      // Update patient with updated visit
      const updatedPatient = {
        ...patient,
        lastVisit: new Date().toISOString().split("T")[0],
        visits: updatedVisits,
      };

      // Update the patient in the store
      updatePatient(updatedPatient);
    } else {
      // Create a new visit record
      const newVisit = {
        id: `V-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split("T")[0],
        type: "Consultation",
        doctor: doctorName,
        diagnosis: "Pending", // This will make the patient appear in the doctor's queue
        vitals: {
          bloodPressure: vitals.bloodPressure,
          temperature: vitals.temperature,
          heartRate: vitals.heartRate,
          respiratoryRate: vitals.respiratoryRate || "Not recorded",
          oxygenSaturation: vitals.oxygenSaturation || "Not recorded",
          weight: vitals.weight || "Not recorded",
          height: vitals.height || "Not recorded",
          ...(vitals.bmi > 0 && {
            bmi: vitals.bmi,
            bmiInterpretation: vitals.bmiInterpretation,
          }),
        },
        notes: "Vitals recorded, awaiting doctor consultation",
      };

      // Update patient with new visit
      const updatedPatient = {
        ...patient,
        lastVisit: new Date().toISOString().split("T")[0],
        visits: [...(patient.visits || []), newVisit],
      };

      // Update the patient in the store
      updatePatient(updatedPatient);
    }

    // Mark the bill as processed by vitals
    const updatedBill = {
      ...consultationBill,
      processedBy: `${consultationBill.processedBy || ""} → Vitals: ${
        user?.name || "Unknown"
      }`,
    };

    // Update the bill in the store
    useAppStore.getState().updateBill(updatedBill);

    toast({
      title: "Vitals recorded successfully",
      description: `${patient.name} has been sent to the doctor's queue for consultation.`,
    });
  };

  // Handle vitals for vaccination patients
  const handleVaccinationVitals = async (patient) => {
    // Get vaccination details from the store
    const vaccinationPatient = getActiveVaccinationPatient();
    if (!vaccinationPatient || !vaccinationPatient.appointmentId) {
      throw new Error("Vaccination details not found");
    }

    // First, find the patient's current visit
    if (!patient.visits || patient.visits.length === 0) {
      throw new Error("No visit record found for patient");
    }

    // Find the visit with "With Vitals: Vaccination" diagnosis
    const visitIndex = patient.visits.findIndex(
      (v: { diagnosis: string }) => v.diagnosis === "With Vitals: Vaccination"
    );
    if (visitIndex === -1) {
      throw new Error("No vaccination visit found");
    }

    // Create a temporary vitals object
    const updatedVitals = {
      bloodPressure: vitals.bloodPressure,
      temperature: vitals.temperature,
      heartRate: vitals.heartRate,
      respiratoryRate: vitals.respiratoryRate || "Not recorded",
      oxygenSaturation: vitals.oxygenSaturation || "Not recorded",
      weight: vitals.weight || "Not recorded",
      height: vitals.height || "Not recorded",
      ...(vitals.bmi > 0 && {
        bmi: vitals.bmi,
        bmiInterpretation: vitals.bmiInterpretation,
      }),
    };

    // Use the processVaccinationAtVitals function with the updated vitals
    const result = processVaccinationAtVitals(
      vaccinationPatient.appointmentId,
      vaccinationApproval === "approve" ? "approve" : "deny",
      vaccinationApproval === "deny" ? denialReason : undefined
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    // After the process function has updated the patient's visit with the new diagnosis,
    // we need to update the vitals separately to avoid overwriting the diagnosis

    // Get the updated patient (after processVaccinationAtVitals has run)
    const updatedPatient = getPatientById(patient.id);
    if (!updatedPatient || !updatedPatient.visits) {
      throw new Error("Failed to retrieve updated patient");
    }

    // Find the latest visit (which should have the updated diagnosis)
    const latestVisitIndex = updatedPatient.visits.length - 1;
    const updatedVisits = [...updatedPatient.visits];

    // Update only the vitals, preserving the diagnosis and other changes
    updatedVisits[latestVisitIndex] = {
      ...updatedVisits[latestVisitIndex],
      vitals: updatedVitals,
    };

    // Update the patient with the vitals
    updatePatient({
      ...updatedPatient,
      visits: updatedVisits,
    });

    // Show success message
    toast({
      title:
        vaccinationApproval === "approve"
          ? "Vaccination approved"
          : "Vaccination denied",
      description: result.message,
    });
  };

  const calculateBMI = () => {
    if (!vitals.weight || !vitals.height) return;

    // Convert height from cm to meters
    const heightInMeters = Number.parseFloat(vitals.height) / 100;
    const weightInKg = Number.parseFloat(vitals.weight);

    if (
      isNaN(heightInMeters) ||
      isNaN(weightInKg) ||
      heightInMeters <= 0 ||
      weightInKg <= 0
    )
      return;

    // Calculate BMI
    const bmi = weightInKg / (heightInMeters * heightInMeters);

    // Determine BMI interpretation
    let interpretation = "";
    if (bmi < 18.5) {
      interpretation = "Underweight";
    } else if (bmi >= 18.5 && bmi < 25) {
      interpretation = "Normal weight";
    } else if (bmi >= 25 && bmi < 30) {
      interpretation = "Overweight";
    } else {
      interpretation = "Obese";
    }

    // Update vitals state
    setVitals((prev) => ({
      ...prev,
      bmi: Number.parseFloat(bmi.toFixed(1)),
      bmiInterpretation: interpretation,
    }));
  };

  // Reset approval state when patient changes
  useEffect(() => {
    setVaccinationApproval(null);
    setDenialReason("");
  }, [activePatient]);

  useEffect(() => {
    calculateBMI();
  }, [vitals.weight, vitals.height]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vitals Station</h1>
          <p className="text-muted-foreground">
            Record patient vitals before doctor consultation or vaccination
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Patient Queue</CardTitle>
              <CardDescription>Patients waiting for vitals</CardDescription>
            </CardHeader>
            <CardContent>
              {allPatientsInQueue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="mx-auto h-12 w-12 opacity-30 mb-2" />
                  <p>No patients in queue</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allPatientsInQueue.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-4 border rounded-md cursor-pointer transition-colors ${
                        activePatient === patient.id
                          ? "border-primary bg-white"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => setActivePatient(patient.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{patient.name}</h3>
                            {(patient as any).isVaccination && (
                              <Badge variant="secondary">
                                <Syringe className="h-3 w-3 mr-1" />
                                Vaccination
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ID: {patient.id} • {patient.gender}, {patient.age}{" "}
                            years
                          </p>
                          {!(patient as any).isVaccination && (
                            <p className="text-sm text-muted-foreground">
                              Paid:{" "}
                              {"paymentDate" in patient
                                ? patient.paymentDate
                                : "N/A"}
                            </p>
                          )}
                          {(patient as any).isVaccination &&
                            (patient as any).vaccineName && (
                              <p className="text-sm text-muted-foreground">
                                {(patient as any).vaccineName} (
                                {(patient as any).doseType} dose)
                                {(patient as any).isGovernmentProvided &&
                                  " (Gov't Provided)"}
                              </p>
                            )}
                        </div>
                        {activePatient === patient.id && (
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/30"
                          >
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Record Vitals</CardTitle>
              <CardDescription>
                {activePatient
                  ? `Recording vitals for ${
                      getPatientById(activePatient)?.name
                    }${isActivePatientVaccination() ? " (Vaccination)" : ""}`
                  : "Select a patient from the queue"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!activePatient ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserRound className="mx-auto h-12 w-12 opacity-30 mb-2" />
                  <p>Select a patient from the queue to record vitals</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bloodPressure">
                        Blood Pressure (mmHg) *
                      </Label>
                      <Input
                        id="bloodPressure"
                        name="bloodPressure"
                        placeholder="e.g. 120/80"
                        value={vitals.bloodPressure}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature (°C) *</Label>
                      <Input
                        id="temperature"
                        name="temperature"
                        placeholder="e.g. 36.8"
                        value={vitals.temperature}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heartRate">Heart Rate (bpm) *</Label>
                      <Input
                        id="heartRate"
                        name="heartRate"
                        placeholder="e.g. 72"
                        value={vitals.heartRate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="respiratoryRate">
                        Respiratory Rate (rpm)
                      </Label>
                      <Input
                        id="respiratoryRate"
                        name="respiratoryRate"
                        placeholder="e.g. 16"
                        value={vitals.respiratoryRate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oxygenSaturation">
                        Oxygen Saturation (%)
                      </Label>
                      <Input
                        id="oxygenSaturation"
                        name="oxygenSaturation"
                        placeholder="e.g. 98"
                        value={vitals.oxygenSaturation}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        name="weight"
                        placeholder="e.g. 70"
                        value={vitals.weight}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        name="height"
                        placeholder="e.g. 170"
                        value={vitals.height}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {vitals.bmi > 0 && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-md">
                      <h3 className="font-medium mb-1">BMI Calculation</h3>
                      <p>
                        BMI: <span className="font-semibold">{vitals.bmi}</span>
                      </p>
                      <p>
                        Interpretation:{" "}
                        <span className="font-semibold">
                          {vitals.bmiInterpretation}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Vaccination approval section */}
                  {isActivePatientVaccination() && (
                    <div className="mt-6 border-t pt-6">
                      <h3 className="font-medium mb-3">Vaccination Approval</h3>
                      <RadioGroup
                        value={vaccinationApproval || ""}
                        onValueChange={(value) =>
                          setVaccinationApproval(
                            value as "approve" | "deny" | null
                          )
                        }
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="approve" id="approve" />
                          <Label
                            htmlFor="approve"
                            className="flex items-center cursor-pointer"
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Approve Vaccination
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="deny" id="deny" />
                          <Label
                            htmlFor="deny"
                            className="flex items-center cursor-pointer"
                          >
                            <XCircle className="h-4 w-4 mr-2 text-red-500" />
                            Deny Vaccination
                          </Label>
                        </div>
                      </RadioGroup>

                      {vaccinationApproval === "deny" && (
                        <div className="mt-4 space-y-2">
                          <Label htmlFor="denialReason">
                            Reason for Denial *
                          </Label>
                          <Textarea
                            id="denialReason"
                            placeholder="Please provide a reason for denying the vaccination"
                            value={denialReason}
                            onChange={(e) => setDenialReason(e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    * Required fields
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActivePatient(null)}
                disabled={!activePatient}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitVitals}
                disabled={
                  isSubmitting ||
                  !activePatient ||
                  !vitals.bloodPressure ||
                  !vitals.temperature ||
                  !vitals.heartRate ||
                  (isActivePatientVaccination() && !vaccinationApproval) ||
                  (isActivePatientVaccination() &&
                    vaccinationApproval === "deny" &&
                    !denialReason.trim())
                }
              >
                {isSubmitting
                  ? "Submitting..."
                  : isActivePatientVaccination()
                  ? vaccinationApproval === "approve"
                    ? "Approve & Submit"
                    : vaccinationApproval === "deny"
                    ? "Deny & Submit"
                    : "Submit Decision"
                  : "Submit Vitals"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
