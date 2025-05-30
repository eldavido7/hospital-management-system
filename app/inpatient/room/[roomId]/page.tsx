"use client";

import { useState, use, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useRouter } from "next/navigation";
import {
  getRoomById,
  getPatientById,
  getPatientObservations,
  getPatientTreatments,
  observationEntries,
  treatmentEntries,
} from "@/lib/data/inpatient-dummy-data";
import type {
  ObservationEntry,
  TreatmentEntry,
} from "@/lib/data/inpatient-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  AlertCircle,
  Activity,
  PlusCircle,
  ClipboardList,
  ArrowLeft,
  Search,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { useMedicineStore } from "@/lib/data/medicines";

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;
  const { user } = useAuth();
  const { medicines, getMedicineById } = useMedicineStore();

  const router = useRouter();
  const [activeTab, setActiveTab] = useState("observations");
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [showDischargeDialog, setShowDischargeDialog] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(
    null
  );
  const [selectedObservation, setSelectedObservation] =
    useState<ObservationEntry | null>(null);
  const [showObservationDetails, setShowObservationDetails] = useState(false);

  // Get room data using the roomId from URL params
  const room = getRoomById(roomId);
  const patient = room?.patientId ? getPatientById(room.patientId) : undefined;
  const observations = patient ? getPatientObservations(patient.id) : [];
  const treatments = patient ? getPatientTreatments(patient.id) : [];

  // Form states
  const [newObservation, setNewObservation] = useState<
    Partial<ObservationEntry>
  >({
    temperature: 37.0,
    bloodPressure: "120/80",
    pulseRate: 80,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    weight: 70,
    height: 170,
    bmi: 0,
    bmiInterpretation: "",
    remarks: "",
    nurse: user?.name || "Current Nurse",
  });

  const [newTreatment, setNewTreatment] = useState<Partial<TreatmentEntry>>({
    medicationName: "",
    medicationType: "Medicine",
    route: "",
    dosage: "",
    duration: "",
    cost: 0,
    administeredBy: user?.name || "Current Staff",
  });

  // BMI calculation
  const calculateBMI = () => {
    if (!newObservation.weight || !newObservation.height) return;

    // Convert height from cm to meters
    const heightInMeters =
      Number.parseFloat(String(newObservation.height)) / 100;
    const weightInKg = Number.parseFloat(String(newObservation.weight));

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
    setNewObservation((prev) => ({
      ...prev,
      bmi: Number.parseFloat(bmi.toFixed(1)),
      bmiInterpretation: interpretation,
    }));
  };

  // Update BMI when weight or height changes
  useEffect(() => {
    calculateBMI();
  }, [newObservation.weight, newObservation.height]);

  // Filter medicines for search
  const filteredMedicines = medicines.filter((medicine) =>
    medicine.name.toLowerCase().includes(medicineSearch.toLowerCase())
  );

  // Update treatment form when medicine is selected
  useEffect(() => {
    if (selectedMedicineId) {
      const medicine = getMedicineById(selectedMedicineId);
      if (medicine) {
        setNewTreatment((prev) => ({
          ...prev,
          medicationName: medicine.name,
          medicationType:
            medicine.form === "injection" ? "Injection" : "Medicine",
          cost: medicine.price,
          dosage: medicine.dosage,
        }));
      }
    }
  }, [selectedMedicineId, getMedicineById]);

  // Handle observation row click
  const handleObservationClick = (observation: ObservationEntry) => {
    setSelectedObservation(observation);
    setShowObservationDetails(true);
  };

  if (!room) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Room not found with ID: {roomId}
            </AlertDescription>
          </Alert>
          <Button
            className="mt-4"
            onClick={() => router.push("/inpatient/patients")}
          >
            Back to Patients
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!patient) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Room Available</AlertTitle>
            <AlertDescription>
              Room {room.number} is currently unoccupied
            </AlertDescription>
          </Alert>
          <Button
            className="mt-4"
            onClick={() => router.push("/inpatient/patients")}
          >
            Back to Patients
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleAddObservation = () => {
    const newEntry: ObservationEntry = {
      id: `obs${observationEntries.length + 1}`,
      patientId: patient.id,
      roomId: room.id,
      timestamp: new Date(),
      temperature: newObservation.temperature || 37.0,
      bloodPressure: newObservation.bloodPressure || "120/80",
      pulseRate: newObservation.pulseRate || 80,
      respiratoryRate: newObservation.respiratoryRate || 16,
      oxygenSaturation: newObservation.oxygenSaturation || 98,
      weight: newObservation.weight || 70,
      height: newObservation.height || 170,
      bmi: newObservation.bmi || 0,
      bmiInterpretation: newObservation.bmiInterpretation || "",
      nurse: newObservation.nurse || user?.name || "Current Nurse",
      remarks: newObservation.remarks || "",
    };

    // In a real app, we would update the database
    // For this simulation, we'll just add to our local array
    observationEntries.push(newEntry);

    // Reset form and close
    setNewObservation({
      temperature: 37.0,
      bloodPressure: "120/80",
      pulseRate: 80,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weight: 70,
      height: 170,
      bmi: 0,
      bmiInterpretation: "",
      remarks: "",
      nurse: user?.name || "Current Nurse",
    });
    setShowObservationForm(false);
  };

  const handleAddTreatment = () => {
    const newEntry: TreatmentEntry = {
      id: `treat${treatmentEntries.length + 1}`,
      patientId: patient.id,
      roomId: room.id,
      timestamp: new Date(),
      medicationName: newTreatment.medicationName || "",
      medicationType: newTreatment.medicationType || "Medicine",
      route: newTreatment.route || "",
      dosage: newTreatment.dosage || "",
      duration: newTreatment.duration || "",
      cost: newTreatment.cost || 0,
      administeredBy:
        newTreatment.administeredBy || user?.name || "Current Staff",
    };

    // In a real app, we would update the database
    // For this simulation, we'll just add to our local array
    treatmentEntries.push(newEntry);

    // Reset form and close
    setNewTreatment({
      medicationName: "",
      medicationType: "Medicine",
      route: "",
      dosage: "",
      duration: "",
      cost: 0,
      administeredBy: user?.name || "Current Staff",
    });
    setSelectedMedicineId(null);
    setMedicineSearch("");
    setShowTreatmentForm(false);
  };

  const handleDischarge = () => {
    // In a real app, we would update the database
    // For this simulation, we'll just navigate back
    setShowDischargeDialog(false);
    router.push("/inpatient/patients");
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/inpatient/patients")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Patients
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Room {room.number}</h1>
            <p className="text-muted-foreground">Patient: {patient.name}</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDischargeDialog(true)}
          >
            Discharge Patient
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{patient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age/Gender:</span>
                  <span className="font-medium">
                    {patient.age} / {patient.gender}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diagnosis:</span>
                  <span className="font-medium">{patient.diagnosis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doctor:</span>
                  <span className="font-medium">{patient.doctor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admission Date:</span>
                  <span className="font-medium">
                    {format(patient.admissionDate, "PPP")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Number:</span>
                  <span className="font-medium">{room.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Type:</span>
                  <span className="font-medium">{room.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Rate:</span>
                  <span className="font-medium">
                    ₦{room.dailyRate.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stay Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Admitted:</span>
                  <span className="font-medium">
                    {Math.ceil(
                      (new Date().getTime() - patient.admissionDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Charges:</span>
                  <span className="font-medium">
                    ₦
                    {(
                      room.dailyRate *
                      Math.ceil(
                        (new Date().getTime() -
                          patient.admissionDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Treatment Charges:
                  </span>
                  <span className="font-medium">
                    ₦
                    {treatments
                      .reduce((sum, treatment) => sum + treatment.cost, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total Charges:</span>
                  <span>
                    ₦
                    {(
                      room.dailyRate *
                        Math.ceil(
                          (new Date().getTime() -
                            patient.admissionDate.getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) +
                      treatments.reduce(
                        (sum, treatment) => sum + treatment.cost,
                        0
                      )
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs
          defaultValue="observations"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="observations"
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Observation Chart
            </TabsTrigger>
            <TabsTrigger value="treatments" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Treatment Chart
            </TabsTrigger>
          </TabsList>

          <TabsContent value="observations" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Observation Chart</h2>
              <Button onClick={() => setShowObservationForm(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Observation
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>Blood Pressure</TableHead>
                      <TableHead>Pulse Rate</TableHead>
                      <TableHead>Respiratory Rate</TableHead>
                      <TableHead>O₂ Saturation</TableHead>
                      <TableHead>Weight/Height</TableHead>
                      <TableHead>BMI</TableHead>
                      <TableHead>Nurse</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {observations.length > 0 ? (
                      [...observationEntries].reverse().map((entry) => (
                        <TableRow
                          key={entry.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleObservationClick(entry)}
                        >
                          <TableCell>
                            {format(entry.timestamp, "PPp")}
                          </TableCell>
                          <TableCell>{entry.temperature}°C</TableCell>
                          <TableCell>{entry.bloodPressure}</TableCell>
                          <TableCell>{entry.pulseRate} bpm</TableCell>
                          <TableCell>{entry.respiratoryRate} /min</TableCell>
                          <TableCell>{entry.oxygenSaturation}%</TableCell>
                          <TableCell>
                            {entry.weight && entry.height
                              ? `${entry.weight}kg / ${entry.height}cm`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {entry.bmi ? (
                              <>
                                {entry.bmi} ({entry.bmiInterpretation})
                              </>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{entry.nurse}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {entry.remarks || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-4">
                          No observations recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Observation Details Dialog */}
            {selectedObservation && (
              <Dialog
                open={showObservationDetails}
                onOpenChange={setShowObservationDetails}
              >
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader className="flex flex-row items-center justify-between">
                    <div>
                      <DialogTitle>Observation Details</DialogTitle>
                      <DialogDescription>
                        Recorded on{" "}
                        {format(selectedObservation.timestamp, "PPP")} at{" "}
                        {format(selectedObservation.timestamp, "p")}
                      </DialogDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowObservationDetails(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogHeader>

                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-base">
                            Vital Signs
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-3">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Temperature:
                              </span>
                              <span className="font-medium">
                                {selectedObservation.temperature}°C
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Blood Pressure:
                              </span>
                              <span className="font-medium">
                                {selectedObservation.bloodPressure}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Pulse Rate:
                              </span>
                              <span className="font-medium">
                                {selectedObservation.pulseRate} bpm
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Respiratory Rate:
                              </span>
                              <span className="font-medium">
                                {selectedObservation.respiratoryRate} /min
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Oxygen Saturation:
                              </span>
                              <span className="font-medium">
                                {selectedObservation.oxygenSaturation}%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-base">
                            Measurements
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-3">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Weight:
                              </span>
                              <span className="font-medium">
                                {selectedObservation.weight
                                  ? `${selectedObservation.weight} kg`
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Height:
                              </span>
                              <span className="font-medium">
                                {selectedObservation.height
                                  ? `${selectedObservation.height} cm`
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                BMI:
                              </span>
                              <span className="font-medium">
                                {selectedObservation.bmi
                                  ? selectedObservation.bmi
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                BMI Interpretation:
                              </span>
                              <span className="font-medium">
                                {selectedObservation.bmiInterpretation || "-"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">Remarks</CardTitle>
                      </CardHeader>
                      <CardContent className="py-3">
                        <div className="bg-muted/30 p-3 rounded-md min-h-[80px]">
                          {selectedObservation.remarks ||
                            "No remarks recorded."}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Recorded by:
                        </span>
                        <span className="ml-2 font-medium">
                          {selectedObservation.nurse}
                        </span>
                      </div>
                      <Button onClick={() => setShowObservationDetails(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {showObservationForm && (
              <Dialog
                open={showObservationForm}
                onOpenChange={setShowObservationForm}
              >
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Add New Observation</DialogTitle>
                    <DialogDescription>
                      Record new vital signs and observations for the patient.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="temperature">Temperature (°C) *</Label>
                        <Input
                          id="temperature"
                          type="number"
                          step="0.1"
                          value={newObservation.temperature}
                          onChange={(e) =>
                            setNewObservation({
                              ...newObservation,
                              temperature: Number.parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bloodPressure">
                          Blood Pressure (mmHg) *
                        </Label>
                        <Input
                          id="bloodPressure"
                          value={newObservation.bloodPressure}
                          onChange={(e) =>
                            setNewObservation({
                              ...newObservation,
                              bloodPressure: e.target.value,
                            })
                          }
                          placeholder="e.g. 120/80"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pulseRate">Heart Rate (bpm) *</Label>
                        <Input
                          id="pulseRate"
                          type="number"
                          value={newObservation.pulseRate}
                          onChange={(e) =>
                            setNewObservation({
                              ...newObservation,
                              pulseRate: Number.parseInt(e.target.value),
                            })
                          }
                          placeholder="e.g. 72"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="respiratoryRate">
                          Respiratory Rate (rpm)
                        </Label>
                        <Input
                          id="respiratoryRate"
                          type="number"
                          value={newObservation.respiratoryRate}
                          onChange={(e) =>
                            setNewObservation({
                              ...newObservation,
                              respiratoryRate: Number.parseInt(e.target.value),
                            })
                          }
                          placeholder="e.g. 16"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="oxygenSaturation">
                          Oxygen Saturation (%)
                        </Label>
                        <Input
                          id="oxygenSaturation"
                          type="number"
                          value={newObservation.oxygenSaturation}
                          onChange={(e) =>
                            setNewObservation({
                              ...newObservation,
                              oxygenSaturation: Number.parseInt(e.target.value),
                            })
                          }
                          placeholder="e.g. 98"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          value={newObservation.weight}
                          onChange={(e) =>
                            setNewObservation({
                              ...newObservation,
                              weight: Number.parseFloat(e.target.value),
                            })
                          }
                          placeholder="e.g. 70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          value={newObservation.height}
                          onChange={(e) =>
                            setNewObservation({
                              ...newObservation,
                              height: Number.parseInt(e.target.value),
                            })
                          }
                          placeholder="e.g. 170"
                        />
                      </div>
                    </div>

                    {(newObservation.bmi ?? 0) > 0 && (
                      <div className="mt-2 p-3 bg-primary/5 rounded-md">
                        <h3 className="font-medium mb-1">BMI Calculation</h3>
                        <p>
                          BMI:{" "}
                          <span className="font-semibold">
                            {newObservation.bmi}
                          </span>
                        </p>
                        <p>
                          Interpretation:{" "}
                          <span className="font-semibold">
                            {newObservation.bmiInterpretation}
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="nurse">Nurse</Label>
                      <Input
                        id="nurse"
                        value={newObservation.nurse}
                        onChange={(e) =>
                          setNewObservation({
                            ...newObservation,
                            nurse: e.target.value,
                          })
                        }
                        placeholder="Enter nurse name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="remarks">Remarks</Label>
                      <Textarea
                        id="remarks"
                        value={newObservation.remarks}
                        onChange={(e) =>
                          setNewObservation({
                            ...newObservation,
                            remarks: e.target.value,
                          })
                        }
                        placeholder="Enter any observations or remarks"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      * Required fields
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowObservationForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddObservation}
                      disabled={
                        !newObservation.temperature ||
                        !newObservation.bloodPressure ||
                        !newObservation.pulseRate
                      }
                    >
                      Save Observation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          <TabsContent value="treatments" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Treatment Chart</h2>
              <Button onClick={() => setShowTreatmentForm(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Treatment
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Administered By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatments.length > 0 ? (
                      [...treatments].reverse().map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {format(entry.timestamp, "PPp")}
                          </TableCell>
                          <TableCell>{entry.medicationName}</TableCell>
                          <TableCell>{entry.medicationType}</TableCell>
                          <TableCell>{entry.route}</TableCell>
                          <TableCell>{entry.dosage}</TableCell>
                          <TableCell>{entry.duration}</TableCell>
                          <TableCell>₦{entry.cost.toLocaleString()}</TableCell>
                          <TableCell>{entry.administeredBy}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No treatments recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {showTreatmentForm && (
              <Dialog
                open={showTreatmentForm}
                onOpenChange={setShowTreatmentForm}
              >
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Add New Treatment</DialogTitle>
                    <DialogDescription>
                      Record a new medication or treatment administered to the
                      patient.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="medicationName">Medication *</Label>
                      <div className="relative">
                        <div className="flex">
                          <Select
                            value={selectedMedicineId || ""}
                            onValueChange={(value) => {
                              setSelectedMedicineId(value);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select medicine from inventory" />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="flex items-center px-2 pb-1 sticky top-0 bg-background border-b pt-2">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                <Input
                                  placeholder="Search medicine..."
                                  className="h-9 w-full border-0 p-1 focus-visible:ring-0"
                                  value={medicineSearch}
                                  onChange={(e) =>
                                    setMedicineSearch(e.target.value)
                                  }
                                />
                              </div>
                              {filteredMedicines.length > 0 ? (
                                filteredMedicines.map((medicine) => (
                                  <SelectItem
                                    key={medicine.id}
                                    value={medicine.id}
                                  >
                                    {medicine.name} ({medicine.dosage}) - ₦
                                    {medicine.price}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="py-6 text-center text-sm">
                                  No medicines found
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="medicationType">Type</Label>
                        <Select
                          value={newTreatment.medicationType}
                          onValueChange={(value) =>
                            setNewTreatment({
                              ...newTreatment,
                              medicationType: value as "Medicine" | "Injection",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Medicine">Medicine</SelectItem>
                            <SelectItem value="Injection">Injection</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="route">Route *</Label>
                        <Input
                          id="route"
                          value={newTreatment.route}
                          onChange={(e) =>
                            setNewTreatment({
                              ...newTreatment,
                              route: e.target.value,
                            })
                          }
                          placeholder="e.g., Oral, IV, IM"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dosage">Dosage *</Label>
                        <Input
                          id="dosage"
                          value={newTreatment.dosage}
                          onChange={(e) =>
                            setNewTreatment({
                              ...newTreatment,
                              dosage: e.target.value,
                            })
                          }
                          placeholder="e.g., 500mg, 10ml"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration *</Label>
                        <Input
                          id="duration"
                          value={newTreatment.duration}
                          onChange={(e) =>
                            setNewTreatment({
                              ...newTreatment,
                              duration: e.target.value,
                            })
                          }
                          placeholder="e.g., Once daily for 5 days"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cost">Cost (₦)</Label>
                        <Input
                          id="cost"
                          type="number"
                          value={newTreatment.cost}
                          onChange={(e) =>
                            setNewTreatment({
                              ...newTreatment,
                              cost: Number.parseInt(e.target.value),
                            })
                          }
                          disabled={selectedMedicineId !== null}
                        />
                        {selectedMedicineId !== null && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Cost is auto-populated from selected medicine
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="administeredBy">Administered By</Label>
                        <Input
                          id="administeredBy"
                          value={newTreatment.administeredBy}
                          onChange={(e) =>
                            setNewTreatment({
                              ...newTreatment,
                              administeredBy: e.target.value,
                            })
                          }
                          placeholder="Enter staff name"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      * Required fields
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowTreatmentForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddTreatment}
                      disabled={
                        !newTreatment.medicationName ||
                        !newTreatment.route ||
                        !newTreatment.dosage ||
                        !newTreatment.duration
                      }
                    >
                      Save Treatment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>
        </Tabs>

        <Dialog
          open={showDischargeDialog}
          onOpenChange={setShowDischargeDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Discharge Patient</DialogTitle>
              <DialogDescription>
                Are you sure you want to discharge {patient.name} from Room{" "}
                {room.number}?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-md bg-amber-50 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle
                      className="h-5 w-5 text-amber-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      Discharge Summary
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>
                        Total days admitted:{" "}
                        {Math.ceil(
                          (new Date().getTime() -
                            patient.admissionDate.getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}
                      </p>
                      <p>
                        Total charges: ₦
                        {(
                          room.dailyRate *
                            Math.ceil(
                              (new Date().getTime() -
                                patient.admissionDate.getTime()) /
                                (1000 * 60 * 60 * 24)
                            ) +
                          treatments.reduce(
                            (sum, treatment) => sum + treatment.cost,
                            0
                          )
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDischargeDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDischarge}>
                Confirm Discharge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
