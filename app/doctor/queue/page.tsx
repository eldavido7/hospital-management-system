"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, ClipboardList, FileText, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/lib/data/store";
import { PatientHistoryModal } from "@/components/patient-history-modal";
import { Toaster } from "@/components/ui/toaster";
import { AdmissionModal } from "@/app/doctor/admission-modal";

export default function DoctorQueuePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activePatient, setActivePatient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("queue");
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [prescriptions, setPrescriptions] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [labTests, setLabTests] = useState<string>("");
  const [physicalExamination, setPhysicalExamination] = useState<string>("");
  const [destination, setDestination] = useState<
    "pharmacy" | "lab" | "injection" | "discharge" | "admission" | ""
  >("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false);

  // Use the centralized store
  const {
    patients,
    getPatientById,
    updatePatient,
    addBill,
    generateBillId,
    updatePatient: updatePatientInStore,
    hospitalSettings,
    refreshHMOClaims, // Add this line
  } = useAppStore();

  // Get patients who have had vitals taken but haven't seen the doctor
  const patientsInQueue = patients
    .filter((patient) => {
      // Check if patient has visits and the latest visit has "Pending" diagnosis
      if (
        !patient.visits ||
        patient.visits.length === 0 ||
        patient.visits[patient.visits.length - 1].diagnosis !== "Pending"
      ) {
        return false;
      }

      // Super admin can see all patients
      if (user?.role === "super_admin") {
        return true;
      }

      // Regular doctors can only see patients assigned to them
      const latestVisit = patient.visits[patient.visits.length - 1];
      return latestVisit.doctor === user?.name;
    })
    .map((patient) => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      lastVisit: patient.lastVisit,
      vitals: patient.visits
        ? patient.visits[patient.visits.length - 1].vitals
        : null,
      labData:
        patient.visits && patient.visits[patient.visits.length - 1].labData,
      presentingComplaints:
        patient.visits &&
        patient.visits[patient.visits.length - 1].presentingComplaints,
      historyOfComplaints:
        patient.visits &&
        patient.visits[patient.visits.length - 1].historyOfComplaints,
    }));

  // Update the useEffect hook to preserve previous entries and automatically navigate to consultation tab
  useEffect(() => {
    if (activePatient) {
      const patient = getPatientById(activePatient);
      if (patient && patient.visits && patient.visits.length > 0) {
        const latestVisit = patient.visits[patient.visits.length - 1];

        // If the diagnosis is not "Pending", it means the doctor has already started a consultation
        if (latestVisit.diagnosis !== "Pending") {
          // Extract the actual diagnosis if it has a prefix
          let actualDiagnosis = latestVisit.diagnosis;
          if (actualDiagnosis.startsWith("With Pharmacy: ")) {
            actualDiagnosis = actualDiagnosis.substring(
              "With Pharmacy: ".length
            );
            setDestination("pharmacy");
          } else if (actualDiagnosis.startsWith("With Laboratory: ")) {
            actualDiagnosis = actualDiagnosis.substring(
              "With Laboratory: ".length
            );
            setDestination("lab");
          } else if (actualDiagnosis.startsWith("With Injection Room: ")) {
            actualDiagnosis = actualDiagnosis.substring(
              "With Injection Room: ".length
            );
          } else if (actualDiagnosis.startsWith("With HMO: ")) {
            actualDiagnosis = actualDiagnosis.substring("With HMO: ".length);
          } else {
            setDestination("discharge");
          }

          setDiagnosis(actualDiagnosis);

          // Set other fields
          setPrescriptions(
            latestVisit.prescriptions
              ? latestVisit.prescriptions.join("\n")
              : ""
          );
          setNotes(latestVisit.notes || "");
          setLabTests(
            latestVisit.labTests
              ? latestVisit.labTests.map((test) => test.name).join("\n")
              : ""
          );
          setPhysicalExamination(latestVisit.physicalExamination || "");
        } else {
          // Reset form for new consultation
          setDiagnosis("");
          setPrescriptions("");
          setNotes("");
          setLabTests("");
          setPhysicalExamination("");
          setDestination("");
        }

        // Automatically switch to consultation tab
        setActiveTab("consultation");
      }
    }
  }, [activePatient, getPatientById]);

  // Update the handleSubmitConsultation function to properly handle HMO patients
  const handleSubmitConsultation = async () => {
    if (!activePatient) return;

    // Validate required fields
    if (!diagnosis) {
      toast({
        title: "Missing information",
        description: "Diagnosis is required.",
        variant: "destructive",
      });
      return;
    }

    if (!destination) {
      toast({
        title: "Missing information",
        description:
          "Please select where to send the patient after consultation.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get patient
      const patient = getPatientById(activePatient);
      if (!patient) throw new Error("Patient not found");

      // Get the latest visit
      const latestVisitIndex = patient.visits ? patient.visits.length - 1 : -1;
      if (latestVisitIndex < 0) throw new Error("No visit record found");

      // Set the status based on destination and patient type
      let statusDiagnosis = diagnosis;

      // If not discharge, add a status prefix to track where the patient is
      if (destination === "pharmacy") {
        statusDiagnosis = `With Pharmacy: ${diagnosis}`;
      } else if (destination === "lab") {
        statusDiagnosis = `With Laboratory: ${diagnosis}`;
      } else if (destination === "injection") {
        statusDiagnosis = `With Injection Room: ${diagnosis}`;
      } else if (destination === "discharge") {
        // For discharge, handle differently based on patient type
        if (patient.patientType === "hmo") {
          // HMO patients need to go through HMO desk for approval
          statusDiagnosis = `With HMO: ${diagnosis}`;
        }
        // For cash patients, keep the original diagnosis as it's completed
      } else if (destination === "admission") {
        statusDiagnosis = `For Admission: ${diagnosis}`;
      }

      // Update the visit with diagnosis and doctor info
      const updatedVisits = [...(patient.visits || [])];
      updatedVisits[latestVisitIndex] = {
        ...updatedVisits[latestVisitIndex],
        diagnosis: statusDiagnosis, // This includes the status prefix
        doctor: user?.name || "Unknown Doctor",
        physicalExamination: physicalExamination,
        prescriptions: prescriptions ? prescriptions.split("\n") : undefined,
        notes: notes || updatedVisits[latestVisitIndex].notes, // Keep existing notes if none provided
        labTests: labTests
          ? labTests.split("\n").map((test) => ({
              name: test,
              result: "Pending",
              date: new Date().toISOString().split("T")[0],
            }))
          : updatedVisits[latestVisitIndex].labTests, // Keep existing lab tests if none provided
      };

      // Update patient
      const updatedPatient = {
        ...patient,
        visits: updatedVisits,
      };

      // Update the patient in the store
      updatePatientInStore(updatedPatient);

      // Create a consultation bill for HMO patients when discharged
      if (destination === "discharge" && patient.patientType === "hmo") {
        const consultationBill = {
          id: generateBillId(),
          patientId: patient.id,
          patientName: patient.name,
          date: new Date().toISOString().split("T")[0],
          status: "hmo_pending" as const, // Mark as hmo_pending
          type: "consultation" as const,
          items: [
            {
              id: `BI-CONS-${Date.now()}`,
              description: `Consultation with ${user?.name || "Doctor"}`,
              quantity: 1,
              unitPrice: hospitalSettings.generalMedicineFee, // Use a standard fee
            },
          ],
          source: "doctor",
          visitId: updatedVisits[latestVisitIndex].id, // Add visit ID to track which visit this bill belongs to
        };

        addBill(consultationBill);

        // Refresh HMO claims to ensure this new bill is included
        // This is the key step that the pharmacy does to make patients appear at the HMO desk
        setTimeout(() => {
          refreshHMOClaims();
        }, 500);
      }

      // Update toast message based on destination and patient type
      if (destination === "pharmacy") {
        toast({
          title: "Consultation completed",
          description: `Patient ${patient.name} has been sent to pharmacy for medication.`,
        });
      } else if (destination === "lab") {
        toast({
          title: "Consultation completed",
          description: `Patient ${patient.name} has been sent to laboratory for tests.`,
        });
      } else if (destination === "injection") {
        toast({
          title: "Consultation completed",
          description: `Patient ${patient.name} has been sent to injection room.`,
        });
      } else if (destination === "discharge") {
        if (patient.patientType === "hmo") {
          toast({
            title: "Consultation completed",
            description: `Patient ${patient.name} has been sent to HMO desk for approval.`,
          });
        } else {
          toast({
            title: "Consultation completed",
            description: `Patient ${patient.name} has been discharged. Medical record has been updated.`,
          });
        }
      } else if (destination === "admission") {
        setAdmissionModalOpen(true);
        return;
      }

      // Reset form
      setDiagnosis("");
      setPrescriptions("");
      setNotes("");
      setLabTests("");
      setPhysicalExamination("");
      setDestination("");
      setActivePatient(null);
      setActiveTab("queue");
    } catch (error) {
      toast({
        title: "Failed to complete consultation",
        description:
          "There was an error completing the consultation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteDiagnosis = async () => {
    if (!activePatient || !diagnosis) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get patient
      const patient = getPatientById(activePatient);
      if (!patient) throw new Error("Patient not found");

      // Get the latest visit
      const latestVisitIndex = patient.visits ? patient.visits.length - 1 : -1;
      if (latestVisitIndex < 0) throw new Error("No visit record found");

      // Get the latest visit
      const latestVisit = patient.visits?.[patient.visits.length - 1];

      if (latestVisit) {
        // Create a copy of the visits array
        const updatedVisits = [...(patient.visits || [])];
        const latestVisitIndex = updatedVisits.length - 1;

        // Update the diagnosis
        updatedVisits[latestVisitIndex] = {
          ...updatedVisits[latestVisitIndex],
          diagnosis: diagnosis,
          notes: notes,
          doctor: user?.name || "Doctor",
          prescriptions: prescriptions ? prescriptions.split("\n") : undefined,
          labTests: labTests
            ? labTests.split("\n").map((test) => ({
                name: test,
                result: "Pending",
                date: new Date().toISOString().split("T")[0],
              }))
            : undefined,
        };

        // For HMO patients with no prescriptions, lab tests, or injections, send directly to HMO desk
        if (
          patient.patientType === "hmo" &&
          (prescriptions ? prescriptions.split("\n").length : 0) === 0 &&
          (labTests ? labTests.split("\n").length : 0) === 0
        ) {
          updatedVisits[latestVisitIndex] = {
            ...updatedVisits[latestVisitIndex],
            diagnosis: `With HMO: ${diagnosis}`,
          };

          const consultationBill = {
            id: generateBillId(),
            patientId: patient.id,
            patientName: patient.name,
            date: new Date().toISOString().split("T")[0],
            status: "hmo_pending" as const, // Mark as hmo_pending
            type: "consultation" as const,
            items: [
              {
                id: `BI-CONS-${Date.now()}`,
                description: `Consultation with ${user?.name || "Doctor"}`,
                quantity: 1,
                unitPrice: hospitalSettings.generalMedicineFee, // Use a standard fee
              },
            ],
            source: "doctor",
            visitId: updatedVisits[latestVisitIndex].id,
          };

          addBill(consultationBill);

          // Refresh HMO claims to ensure this new bill is included
          setTimeout(() => {
            refreshHMOClaims();
          }, 500);
        }

        // Update the patient
        const updatedPatient = {
          ...patient,
          visits: updatedVisits,
        };

        // Update the patient in the store
        updatePatientInStore(updatedPatient);

        // Create pharmacy bill if any prescriptions
        if (prescriptions && prescriptions.split("\n").length > 0) {
          const billItems = prescriptions.split("\n").map((prescription) => {
            return {
              id: `BI-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 7)}`,
              description: `${prescription}`,
              quantity: 1,
              unitPrice: 100,
            };
          });

          const bill = {
            id: generateBillId(),
            patientId: patient.id,
            patientName: patient.name,
            date: new Date().toISOString().split("T")[0],
            status:
              patient.patientType === "hmo"
                ? ("hmo_pending" as const)
                : ("pending" as const),
            type: "pharmacy" as const,
            items: billItems,
            source: "doctor",
            visitId: updatedVisits[latestVisitIndex].id,
          };

          addBill(bill);

          // Refresh HMO claims if this is an HMO patient
          if (patient.patientType === "hmo") {
            setTimeout(() => {
              refreshHMOClaims();
            }, 500);
          }
        }

        // Reset form and state
        setActivePatient(null);
        setActiveTab("queue");
        setDiagnosis("");
        setPrescriptions("");
        setNotes("");
        setLabTests("");
        setPhysicalExamination("");
        setDestination("");

        toast({
          title: "Consultation completed",
          description:
            patient.patientType === "hmo" &&
            (prescriptions ? prescriptions.split("\n").length : 0) === 0 &&
            (labTests ? labTests.split("\n").length : 0) === 0
              ? "Patient has been sent to HMO desk for claim processing."
              : "Patient has been successfully diagnosed and referred as needed.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete diagnosis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctor's Queue</h1>
          <p className="text-muted-foreground">
            {user?.role === "super_admin"
              ? "Manage all patient consultations"
              : `Manage consultations for Dr. ${
                  user?.name.split(" ").pop() || ""
                }`}
          </p>
          {user?.role === "super_admin" && (
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium">Admin view:</span> Showing all
              patients in queue
            </p>
          )}
        </div>

        <Tabs
          defaultValue="queue"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="queue">Patient Queue</TabsTrigger>
            <TabsTrigger value="consultation">Consultation</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patientsInQueue.length === 0 ? (
                <div className="col-span-full text-center py-12 border rounded-md">
                  <ClipboardList className="mx-auto h-12 w-12 opacity-30 mb-2" />
                  <p className="text-muted-foreground">
                    {user?.role === "super_admin"
                      ? "No patients in queue"
                      : "No patients assigned to you in the queue"}
                  </p>
                  {user?.role !== "super_admin" && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Only patients specifically assigned to you will appear
                      here
                    </p>
                  )}
                </div>
              ) : (
                patientsInQueue.map((patient) => (
                  <Card key={patient.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {patient.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {patient.id} • {patient.gender}, {patient.age}{" "}
                            years
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            patient.labData
                              ? "bg-green-50 text-green-800"
                              : "bg-blue-50 text-blue-800"
                          }
                        >
                          {patient.labData ? "Lab Results Ready" : "Waiting"}
                        </Badge>
                      </div>

                      {patient.vitals && (
                        <div className="space-y-1 mb-4">
                          <p className="text-sm">
                            <span className="font-medium">BP:</span>{" "}
                            {patient.vitals.bloodPressure}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Temp:</span>{" "}
                            {patient.vitals.temperature}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">HR:</span>{" "}
                            {patient.vitals.heartRate}
                          </p>
                          {patient.vitals.weight !== "Not recorded" && (
                            <p className="text-sm">
                              <span className="font-medium">Weight:</span>{" "}
                              {patient.vitals.weight}
                            </p>
                          )}
                        </div>
                      )}

                      {patient.labData && (
                        <div className="mb-4 p-2 bg-green-50 rounded-md">
                          <p className="text-sm font-medium text-green-800">
                            Lab results available
                          </p>
                        </div>
                      )}

                      {/* Update the onClick handler for the "Start Consultation" button */}
                      <Button
                        className="w-full"
                        onClick={() => {
                          setActivePatient(patient.id);
                        }}
                      >
                        Start Consultation
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="consultation">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Patient Consultation</CardTitle>
                    <CardDescription>
                      {activePatient
                        ? `Consulting with ${
                            getPatientById(activePatient)?.name
                          }`
                        : "Select a patient from the queue"}
                    </CardDescription>
                  </div>
                  {activePatient && (
                    <Button
                      variant="outline"
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Patient History
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!activePatient ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserRound className="mx-auto h-12 w-12 opacity-30 mb-2" />
                    <p>No patient selected</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setActiveTab("queue")}
                    >
                      Return to Queue
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Patient Information */}
                    <div className="p-4 bg-white rounded-md border">
                      <h3 className="font-semibold mb-2">
                        Patient Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p>{getPatientById(activePatient)?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ID</p>
                          <p>{activePatient}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Age & Gender
                          </p>
                          <p>
                            {getPatientById(activePatient)?.age} years,{" "}
                            {getPatientById(activePatient)?.gender}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Patient Type
                          </p>
                          <p className="capitalize">
                            {getPatientById(activePatient)?.patientType}
                          </p>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const patient = getPatientById(activePatient);
                      if (
                        !patient ||
                        !patient.visits ||
                        patient.visits.length === 0
                      )
                        return null;

                      const latestVisit =
                        patient.visits[patient.visits.length - 1];

                      return (
                        <>
                          {/* Presenting Complaints */}
                          {latestVisit.presentingComplaints && (
                            <div className="p-4 bg-white border rounded-md mt-4">
                              <h3 className="font-semibold mb-2">
                                Presenting Complaints
                              </h3>
                              <p>{latestVisit.presentingComplaints}</p>

                              {latestVisit.historyOfComplaints && (
                                <div className="mt-3">
                                  <h4 className="font-semibold mb-1">
                                    History of Complaints
                                  </h4>
                                  <p>{latestVisit.historyOfComplaints}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Vitals */}
                    {(() => {
                      const patient = getPatientById(activePatient);
                      if (!patient) return null;

                      return (
                        <>
                          <div className="p-4 bg-white border rounded-md">
                            <h3 className="font-semibold mb-2">Vitals</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {patient.visits && patient.visits.length > 0 && (
                                <>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Blood Pressure
                                    </p>
                                    <p>
                                      {
                                        patient.visits[
                                          patient.visits.length - 1
                                        ].vitals.bloodPressure
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Temperature
                                    </p>
                                    <p>
                                      {
                                        patient.visits[
                                          patient.visits.length - 1
                                        ].vitals.temperature
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Heart Rate
                                    </p>
                                    <p>
                                      {
                                        patient.visits[
                                          patient.visits.length - 1
                                        ].vitals.heartRate
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Respiratory Rate
                                    </p>
                                    <p>
                                      {
                                        patient.visits[
                                          patient.visits.length - 1
                                        ].vitals.respiratoryRate
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Oxygen Saturation
                                    </p>
                                    <p>
                                      {
                                        patient.visits[
                                          patient.visits.length - 1
                                        ].vitals.oxygenSaturation
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Weight
                                    </p>
                                    <p>
                                      {
                                        patient.visits[
                                          patient.visits.length - 1
                                        ].vitals.weight
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Height
                                    </p>
                                    <p>
                                      {
                                        patient.visits[
                                          patient.visits.length - 1
                                        ].vitals.height
                                      }
                                    </p>
                                  </div>
                                  {patient.visits &&
                                    patient.visits.length > 0 &&
                                    patient.visits[patient.visits.length - 1]
                                      .vitals.bmi && (
                                      <div>
                                        <p className="text-sm text-muted-foreground">
                                          BMI
                                        </p>
                                        <p>
                                          {
                                            patient.visits[
                                              patient.visits.length - 1
                                            ].vitals.bmi
                                          }{" "}
                                          (
                                          {
                                            patient.visits[
                                              patient.visits.length - 1
                                            ].vitals.bmiInterpretation
                                          }
                                          )
                                        </p>
                                      </div>
                                    )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Lab Results */}
                          {patient.visits &&
                            patient.visits.length > 0 &&
                            patient.visits[patient.visits.length - 1]
                              .labData && (
                              <div className="p-4 bg-white border rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-semibold">
                                    Laboratory Results
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className="bg-green-100 text-green-800"
                                  >
                                    Completed
                                  </Badge>
                                </div>
                                <div className="space-y-4">
                                  <div className="bg-white p-3 rounded-md">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="border-b">
                                          <th className="text-left py-2 font-medium text-sm">
                                            Test
                                          </th>
                                          <th className="text-left py-2 font-medium text-sm">
                                            Result
                                          </th>
                                          <th className="text-left py-2 font-medium text-sm">
                                            Normal Range
                                          </th>
                                          <th className="text-left py-2 font-medium text-sm">
                                            Status
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {patient.visits &&
                                          patient.visits.length > 0 &&
                                          (() => {
                                            const latestVisit =
                                              patient.visits[
                                                patient.visits.length - 1
                                              ];
                                            return (
                                              latestVisit.labData &&
                                              latestVisit.labData.tests &&
                                              latestVisit.labData.tests.length >
                                                0 &&
                                              latestVisit.labData.tests.map(
                                                (test, index) => {
                                                  // Check if test has parameterResults
                                                  if (
                                                    test.parameterResults &&
                                                    test.parameterResults
                                                      .length > 0
                                                  ) {
                                                    // Render each parameter as a separate row
                                                    return test.parameterResults.map(
                                                      (param, paramIndex) => (
                                                        <tr
                                                          key={`${index}-${paramIndex}`}
                                                          className="border-b"
                                                        >
                                                          <td className="py-2">
                                                            {paramIndex ===
                                                            0 ? (
                                                              <span className="font-medium">
                                                                {test.name}
                                                              </span>
                                                            ) : (
                                                              <span className="pl-4">
                                                                {param.name}
                                                              </span>
                                                            )}
                                                          </td>
                                                          <td
                                                            className={`py-2 ${
                                                              param.isAbnormal
                                                                ? "text-red-600 font-medium"
                                                                : ""
                                                            }`}
                                                          >
                                                            {param.result ||
                                                              "Not recorded"}{" "}
                                                            {param.unit || ""}
                                                          </td>
                                                          <td className="py-2">
                                                            {param.normalRange ||
                                                              test.normalRange ||
                                                              "Not specified"}{" "}
                                                            {param.unit || ""}
                                                          </td>
                                                          <td
                                                            className={`py-2 ${
                                                              param.isAbnormal
                                                                ? "text-red-600 font-medium"
                                                                : ""
                                                            }`}
                                                          >
                                                            {param.isAbnormal
                                                              ? "Abnormal"
                                                              : "Normal"}
                                                          </td>
                                                        </tr>
                                                      )
                                                    );
                                                  } else {
                                                    // Fallback for tests without parameter results
                                                    return (
                                                      <tr
                                                        key={index}
                                                        className="border-b"
                                                      >
                                                        <td className="py-2 font-medium">
                                                          {test.name}
                                                        </td>
                                                        <td className="py-2">
                                                          {test.result ||
                                                            "Not recorded"}
                                                        </td>
                                                        <td className="py-2">
                                                          {test.normalRange ||
                                                            "Not specified"}
                                                        </td>
                                                        <td className="py-2">
                                                          -
                                                        </td>
                                                      </tr>
                                                    );
                                                  }
                                                }
                                              )
                                            );
                                          })()}
                                      </tbody>
                                    </table>
                                  </div>

                                  {patient.visits &&
                                    patient.visits.length > 0 &&
                                    (() => {
                                      const latestVisit =
                                        patient.visits[
                                          patient.visits.length - 1
                                        ];
                                      return (
                                        latestVisit.labData &&
                                        latestVisit.labData.results && (
                                          <div>
                                            <p className="text-sm font-medium">
                                              Notes & Interpretation:
                                            </p>
                                            <p className="text-sm bg-white p-3 rounded-md">
                                              {latestVisit.labData.results}
                                            </p>
                                          </div>
                                        )
                                      );
                                    })()}
                                </div>
                              </div>
                            )}

                          {/* Medical History */}
                          {patient.medicalHistory &&
                            patient.medicalHistory.length > 0 && (
                              <div className="p-4 bg-white border rounded-md">
                                <h3 className="font-semibold mb-2">
                                  Medical History
                                </h3>
                                <ul className="list-disc pl-5 space-y-1">
                                  {patient.medicalHistory.map((item, index) => (
                                    <li key={index} className="text-sm">
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {/* Allergies */}
                          {patient.allergies &&
                            patient.allergies.length > 0 && (
                              <div className="p-4 bg-white border rounded-md">
                                <h3 className="font-semibold mb-2">
                                  Allergies
                                </h3>
                                <ul className="list-disc pl-5 space-y-1">
                                  {patient.allergies.map((item, index) => (
                                    <li key={index} className="text-sm">
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </>
                      );
                    })()}

                    {/* Consultation Form */}
                    <div className="space-y-4">
                      {/* Show previous diagnosis and notes if they exist and patient has lab results */}
                      {(() => {
                        const patient = getPatientById(activePatient);
                        if (
                          !patient ||
                          !patient.visits ||
                          patient.visits.length === 0
                        )
                          return null;

                        const latestVisit =
                          patient.visits[patient.visits.length - 1];

                        // Check if this is a patient returning from lab
                        // The diagnosis will be "Pending" and there will be labData present
                        if (
                          latestVisit.diagnosis === "Pending" &&
                          latestVisit.labData
                        ) {
                          // Get the original diagnosis
                          const originalDiagnosis =
                            latestVisit.originalDiagnosis;
                          let diagnosisText = "Not recorded";

                          if (originalDiagnosis) {
                            // Extract the actual diagnosis without the prefix
                            if (
                              originalDiagnosis.startsWith("With Laboratory: ")
                            ) {
                              diagnosisText = originalDiagnosis.substring(
                                "With Laboratory: ".length
                              );
                            } else if (originalDiagnosis.includes(": ")) {
                              diagnosisText = originalDiagnosis.split(": ")[1];
                            } else {
                              diagnosisText = originalDiagnosis;
                            }
                          }

                          return (
                            <div className="p-4 bg-white border rounded-md mb-4">
                              <h3 className="font-semibold mb-2">
                                Previous Consultation
                              </h3>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Previous Diagnosis:
                                  </p>
                                  <p className="font-medium">{diagnosisText}</p>
                                </div>
                                {latestVisit.notes && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Previous Notes:
                                    </p>
                                    <p>{latestVisit.notes}</p>
                                  </div>
                                )}
                                {latestVisit.prescriptions &&
                                  latestVisit.prescriptions.length > 0 && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">
                                        Previous Prescriptions:
                                      </p>
                                      <ul className="list-disc pl-5">
                                        {latestVisit.prescriptions.map(
                                          (prescription, index) => (
                                            <li key={index}>{prescription}</li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Requested Lab Tests:
                                  </p>
                                  <ul className="list-disc pl-5">
                                    {latestVisit.labData.tests.map(
                                      (test, index) => (
                                        <li key={index}>{test.name}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })()}

                      <div className="space-y-2">
                        <Label htmlFor="diagnosis">Diagnosis *</Label>
                        <Input
                          id="diagnosis"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          placeholder="Enter diagnosis"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="physicalExamination">
                          Physical Examination
                        </Label>
                        <Textarea
                          id="physicalExamination"
                          value={physicalExamination}
                          onChange={(e) =>
                            setPhysicalExamination(e.target.value)
                          }
                          placeholder="Enter physical examination findings"
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="prescriptions">
                          Prescriptions (one per line)
                        </Label>
                        <Textarea
                          id="prescriptions"
                          value={prescriptions}
                          onChange={(e) => setPrescriptions(e.target.value)}
                          placeholder="Enter prescriptions, one per line"
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="labTests">
                          Lab Tests (one per line)
                        </Label>
                        <Textarea
                          id="labTests"
                          value={labTests}
                          onChange={(e) => setLabTests(e.target.value)}
                          placeholder="Enter lab tests, one per line"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Enter additional notes"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="destination">Send Patient To *</Label>
                        <Select
                          value={destination}
                          onValueChange={(value) => {
                            if (value === "admission") {
                              setAdmissionModalOpen(true);
                            } else {
                              setDestination(value as any);
                            }
                          }}
                        >
                          <SelectTrigger id="destination">
                            <SelectValue placeholder="Select destination" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pharmacy">Pharmacy</SelectItem>
                            <SelectItem value="lab">Laboratory</SelectItem>
                            <SelectItem value="discharge">
                              {getPatientById(activePatient)?.patientType ===
                              "hmo"
                                ? "Discharge (via HMO Desk)"
                                : "Discharge"}
                            </SelectItem>
                            <SelectItem value="admission">Admission</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActivePatient(null);
                    setActiveTab("queue");
                    setDiagnosis("");
                    setPrescriptions("");
                    setNotes("");
                    setLabTests("");
                    setPhysicalExamination("");
                    setDestination("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitConsultation}
                  disabled={
                    isSubmitting || !activePatient || !diagnosis || !destination
                  }
                >
                  {isSubmitting ? "Submitting..." : "Complete Consultation"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Patient History Modal */}
      <PatientHistoryModal
        patientId={activePatient}
        visitId={
          activePatient
            ? (() => {
                const patient = getPatientById(activePatient);
                if (patient?.visits?.length) {
                  return patient.visits[patient.visits.length - 1]?.id ?? "";
                }
                return "";
              })()
            : ""
        }
        open={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
      <AdmissionModal
        open={admissionModalOpen}
        onOpenChange={setAdmissionModalOpen}
        patientName={
          activePatient
            ? getPatientById(activePatient)?.name || "Patient"
            : "Patient"
        }
        onComplete={() => {
          toast({
            title: "Patient Admission Process Started",
            description: "Patient has been sent to inpatient admission",
          });
          setAdmissionModalOpen(false);
          setActivePatient(null);
          setActiveTab("queue");
          setDiagnosis("");
          setPrescriptions("");
          setNotes("");
          setLabTests("");
          setPhysicalExamination("");
          setDestination("");
        }}
      />
      <Toaster />
    </MainLayout>
  );
}
