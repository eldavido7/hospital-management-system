"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  FileText,
  CreditCard,
  History,
  Edit,
  Trash2,
} from "lucide-react";
import { useAppStore } from "@/lib/data/store";
import { ReceiptModal } from "@/components/receipt-modal";
import { PatientHistoryModal } from "@/components/patient-history-modal";
import { PatientEditModal } from "@/components/patient-edit-modal";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/auth-context";
import { useStoreExtension, type ExtendedPatient } from "@/lib/data/storeext";

export default function PatientDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  const { toast } = useToast();

  // Get patient data from the centralized store
  const {
    getPatientById,
    getPatientBills,
    getPatientAppointments,
    formatCurrency,
    calculateTotal,
    hmoClaims,
  } = useAppStore();

  const patient = getPatientById(patientId);
  const bills = getPatientBills(patientId);
  const appointments = getPatientAppointments(patientId);

  // Get HMO claims for this patient
  const patientHmoClaims = hmoClaims.filter(
    (claim) => claim.patientId === patientId
  );

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useAuth();

  const { updatePatientInfo, deletePatient } = useStoreExtension();

  const handleUpdatePatient = (updatedPatient: ExtendedPatient) => {
    const success = updatePatientInfo(updatedPatient);
    if (success !== undefined) {
      toast({
        title: "Patient updated",
        description: "Patient information has been successfully updated.",
      });
      setShowEditModal(false);
    } else {
      toast({
        title: "Update failed",
        description: "There was an error updating the patient information.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePatient = () => {
    const success = deletePatient(patientId);
    if (success) {
      toast({
        title: "Patient deleted",
        description: "Patient has been successfully deleted.",
      });
      router.push("/patients/search");
    } else {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the patient.",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
  };

  if (!patient) {
    return (
      <MainLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">
              Patient Not Found
            </h2>
            <Button
              variant="outline"
              onClick={() => router.push("/patients/search")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                The patient with ID {patientId} could not be found.
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/patients/search")}
              >
                Return to Patient Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Sort visits by date (newest first)
  const sortedVisits = [...(patient.visits || [])].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Sort bills by date (newest first)
  const sortedBills = [...bills].sort((a, b) => {
    const dateA = a.paymentDate || a.date;
    const dateB = b.paymentDate || b.date;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  // Sort appointments by date (newest first)
  const sortedAppointments = [...appointments].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Helper function to determine patient status from diagnosis
  const getPatientStatus = (diagnosis: string) => {
    if (diagnosis === "Pending") {
      return { label: "With Doctor", className: "bg-blue-50 text-blue-800" };
    } else if (diagnosis.startsWith("With Pharmacy:")) {
      return {
        label: "With Pharmacy",
        className: "bg-green-50 text-green-800",
      };
    } else if (diagnosis.startsWith("With Laboratory:")) {
      return {
        label: "With Laboratory",
        className: "bg-purple-50 text-purple-800",
      };
    } else if (diagnosis.startsWith("With Injection Room:")) {
      return {
        label: "With Injection Room",
        className: "bg-orange-50 text-orange-800",
      };
    } else if (diagnosis.startsWith("With Cash Point:")) {
      return {
        label: "With Cash Point",
        className: "bg-yellow-50 text-yellow-800",
      };
    } else if (diagnosis.startsWith("With HMO:")) {
      return { label: "With HMO Desk", className: "bg-blue-50 text-blue-800" };
    } else if (diagnosis.startsWith("With Vitals:")) {
      return { label: "With Vitals", className: "bg-teal-50 text-teal-800" };
    } else {
      return { label: "Completed", className: "bg-green-50 text-green-800" };
    }
  };

  // Helper function to check if a bill has a rejected HMO claim
  const hasRejectedHMOClaim = (billId: string) => {
    return patientHmoClaims.some(
      (claim) => claim.sourceId === billId && claim.status === "rejected"
    );
  };

  // Helper function to get claim status badge
  const getClaimStatusBadge = (billId: string) => {
    const claim = patientHmoClaims.find((claim) => claim.sourceId === billId);

    if (!claim) return null;

    if (claim.status === "rejected") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-800">
          Rejected
        </Badge>
      );
    } else if (claim.status === "approved" || claim.status === "completed") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-800">
          Approved
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-800">
          Pending
        </Badge>
      );
    }
  };

  const paidBills = bills.filter((bill) => bill.status === "paid");
  const cancelledBills = bills.filter((bill) => bill.status === "cancelled");

  // Format name with salutation if available
  const formattedName = patient.salutation
    ? `${patient.salutation} ${patient.name}`
    : patient.name;

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Patient Details</h2>
          <Button
            variant="outline"
            onClick={() => router.push("/patients/search")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{formattedName}</CardTitle>
                  <CardDescription>
                    {patient.age} years, {patient.gender} • ID: {patient.id}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge
                    variant={
                      patient.patientType === "hmo" ? "outline" : "secondary"
                    }
                  >
                    {patient.patientType === "hmo"
                      ? `HMO: ${patient.hmoProvider}`
                      : "Cash Patient"}
                  </Badge>
                  {patient.isStaff && (
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-800"
                    >
                      Staff Member
                    </Badge>
                  )}
                </div>
              </div>
              {(user?.role === "super_admin" ||
                user?.role === "manager" ||
                user?.role === "records_officer") && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Personal Information
                  </h3>
                  {patient.firstName && patient.lastName && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Name:</span>{" "}
                      {patient.firstName} {patient.lastName}
                    </p>
                  )}
                  <p className="text-sm mb-1">
                    <span className="font-medium">Phone:</span> {patient.phone}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Email:</span>{" "}
                    {patient.email || "Not provided"}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Address:</span>{" "}
                    {patient.address || "Not provided"}
                  </p>
                  {patient.maritalStatus && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Marital Status:</span>{" "}
                      {patient.maritalStatus}
                    </p>
                  )}
                  {patient.religion && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Religion:</span>{" "}
                      {patient.religion}
                    </p>
                  )}
                  {patient.nationality && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Nationality:</span>{" "}
                      {patient.nationality}
                    </p>
                  )}
                  {patient.stateOfOrigin && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">State of Origin:</span>{" "}
                      {patient.stateOfOrigin}
                    </p>
                  )}
                  {patient.occupation && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Occupation:</span>{" "}
                      {patient.occupation}
                    </p>
                  )}
                  {patient.isMinor && patient.guardian && (
                    <div className="mt-3">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Guardian Information
                      </h3>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Name:</span>{" "}
                        {patient.guardian.name}
                      </p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Relationship:</span>{" "}
                        {patient.guardian.relationship}
                      </p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Phone:</span>{" "}
                        {patient.guardian.phone}
                      </p>
                      {patient.guardian.email && (
                        <p className="text-sm mb-1">
                          <span className="font-medium">Email:</span>{" "}
                          {patient.guardian.email}
                        </p>
                      )}
                      {patient.guardian.address && (
                        <p className="text-sm">
                          <span className="font-medium">Address:</span>{" "}
                          {patient.guardian.address}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Medical Information
                  </h3>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Last Visit:</span>{" "}
                    {patient.lastVisit}
                  </p>
                  {patient.bloodGroup && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Blood Group:</span>{" "}
                      {patient.bloodGroup}
                    </p>
                  )}
                  <div className="text-sm mb-1">
                    <span className="font-medium">Allergies:</span>{" "}
                    {patient.allergies && patient.allergies.length > 0
                      ? patient.allergies.join(", ")
                      : "None recorded"}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Medical History:</span>
                    {patient.medicalHistory &&
                    patient.medicalHistory.length > 0 ? (
                      <ul className="list-disc list-inside mt-1 ml-1">
                        {patient.medicalHistory.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      " None recorded"
                    )}
                  </div>

                  {/* Next of Kin Information */}
                  {patient.nextOfKin && (
                    <div className="mt-3">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Next of Kin
                      </h3>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Name:</span>{" "}
                        {patient.nextOfKin.fullName}
                      </p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Relationship:</span>{" "}
                        {patient.nextOfKin.relationship}
                      </p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Phone:</span>{" "}
                        {patient.nextOfKin.phone}
                      </p>
                      {patient.nextOfKin.address && (
                        <p className="text-sm">
                          <span className="font-medium">Address:</span>{" "}
                          {patient.nextOfKin.address}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {patient.patientType === "cash" && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Account Information
                    </h3>
                    <p className="text-sm mb-1">
                      <span className="font-medium">Balance:</span>{" "}
                      <span
                        className={
                          patient.balance > 0
                            ? "text-green-600 font-semibold"
                            : "text-gray-600"
                        }
                      >
                        {formatCurrency(patient.balance)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/appointments?patientId=${patient.id}`)
                }
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/billing?patientId=${patient.id}`)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveTab("visits")}
              >
                <FileText className="mr-2 h-4 w-4" />
                View Medical Records
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveTab("payments")}
              >
                <History className="mr-2 h-4 w-4" />
                Payment History
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="visits">Medical Records</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Recent Visits */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Recent Visits</h3>
                    {sortedVisits.length > 0 ? (
                      <div className="space-y-3">
                        {sortedVisits.slice(0, 3).map((visit) => (
                          <div key={visit.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{visit.type}</p>
                                <p className="text-sm text-muted-foreground">
                                  {visit.date} •{" "}
                                  {visit.doctor || "Doctor not assigned"}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {getPatientStatus(visit.diagnosis).label}
                              </Badge>
                            </div>
                            {visit.diagnosis && (
                              <p className="text-sm mt-2">
                                <span className="font-medium">Diagnosis:</span>{" "}
                                {visit.diagnosis.startsWith("With ")
                                  ? visit.diagnosis.split(": ")[1]
                                  : visit.diagnosis}
                              </p>
                            )}
                          </div>
                        ))}
                        {sortedVisits.length > 3 && (
                          <Button
                            variant="link"
                            className="px-0"
                            onClick={() => setActiveTab("visits")}
                          >
                            View all {sortedVisits.length} visits
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No visits recorded
                      </p>
                    )}
                  </div>

                  {/* Recent Appointments */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Upcoming Appointments
                    </h3>
                    {sortedAppointments.filter((a) => a.status === "scheduled")
                      .length > 0 ? (
                      <div className="space-y-3">
                        {sortedAppointments
                          .filter((a) => a.status === "scheduled")
                          .slice(0, 3)
                          .map((appointment) => (
                            <div
                              key={appointment.id}
                              className="border rounded-lg p-3"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">
                                    {appointment.type}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {appointment.date} at {appointment.time} •{" "}
                                    {appointment.doctor ||
                                      "Doctor not assigned"}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-800"
                                >
                                  Scheduled
                                </Badge>
                              </div>
                              {appointment.notes && (
                                <p className="text-sm mt-2">
                                  <span className="font-medium">Notes:</span>{" "}
                                  {appointment.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        <Button
                          variant="link"
                          className="px-0"
                          onClick={() => setActiveTab("appointments")}
                        >
                          View all appointments
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No upcoming appointments
                      </p>
                    )}
                  </div>

                  {/* Recent Payments */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Recent Payments
                    </h3>
                    {paidBills.length > 0 ? (
                      <div className="space-y-3">
                        {paidBills.slice(0, 3).map((bill) => (
                          <div key={bill.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium capitalize">
                                  {bill.type}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {bill.paymentDate} • Receipt: {bill.id}
                                </p>
                              </div>
                              <p className="font-medium">
                                {bill.total
                                  ? formatCurrency(bill.total)
                                  : formatCurrency(calculateTotal(bill.items))}
                              </p>
                            </div>
                            <div className="flex justify-between mt-2">
                              <p className="text-sm">
                                <span className="font-medium">Method:</span>{" "}
                                <span className="capitalize">
                                  {bill.paymentMethod}
                                </span>
                              </p>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-800"
                              >
                                Paid
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="link"
                          className="px-0"
                          onClick={() => setActiveTab("payments")}
                        >
                          View all payments
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No payment records
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>
                  Complete history of patient visits and consultations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sortedVisits.length > 0 ? (
                  <div className="space-y-6">
                    {sortedVisits.map((visit) => (
                      <div key={visit.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium">
                              {visit.type}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {visit.date} •{" "}
                              {visit.doctor || "Doctor not assigned"}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              getPatientStatus(visit.diagnosis).className
                            }
                          >
                            {getPatientStatus(visit.diagnosis).label}
                          </Badge>
                        </div>

                        {visit.presentingComplaints && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-1">
                              Presenting Complaints
                            </h4>
                            <p className="text-sm">
                              {visit.presentingComplaints}
                            </p>

                            {visit.historyOfComplaints && (
                              <div className="mt-2">
                                <h4 className="text-sm font-medium mb-1">
                                  History of Complaints
                                </h4>
                                <p className="text-sm">
                                  {visit.historyOfComplaints}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {visit.diagnosis && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-1">
                              Diagnosis
                            </h4>
                            <p className="text-sm">
                              {visit.diagnosis.startsWith("With ")
                                ? visit.diagnosis.split(": ")[1]
                                : visit.diagnosis}
                            </p>
                          </div>
                        )}

                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-1">
                            Vital Signs
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-sm">
                              <span className="font-medium">BP:</span>{" "}
                              {visit.vitals.bloodPressure}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Temp:</span>{" "}
                              {visit.vitals.temperature}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">HR:</span>{" "}
                              {visit.vitals.heartRate}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">RR:</span>{" "}
                              {visit.vitals.respiratoryRate}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">SpO2:</span>{" "}
                              {visit.vitals.oxygenSaturation}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Weight:</span>{" "}
                              {visit.vitals.weight}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Height:</span>{" "}
                              {visit.vitals.height}
                            </div>
                            {visit.vitals.bmi && (
                              <div className="text-sm">
                                <span className="font-medium">BMI:</span>{" "}
                                {visit.vitals.bmi} (
                                {visit.vitals.bmiInterpretation})
                              </div>
                            )}
                          </div>
                        </div>

                        {visit.physicalExamination && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-1">
                              Physical Examination
                            </h4>
                            <p className="text-sm">
                              {visit.physicalExamination}
                            </p>
                          </div>
                        )}

                        {visit.prescriptions &&
                          visit.prescriptions.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-1">
                                Prescriptions
                              </h4>
                              <ul className="list-disc list-inside text-sm">
                                {visit.prescriptions.map(
                                  (prescription, index) => (
                                    <li key={index}>{prescription}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {visit.labTests && visit.labTests.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-1">
                              Laboratory Tests
                            </h4>
                            <div className="space-y-2">
                              {visit.labTests.map((test, index) => (
                                <div key={index} className="text-sm">
                                  <p className="font-medium">{test.name}</p>
                                  <p>Result: {test.result}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Date: {test.date}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {visit.notes && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Notes</h4>
                            <p className="text-sm">{visit.notes}</p>
                          </div>
                        )}
                        {visit.doctorChanges &&
                          visit.doctorChanges.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-1">
                                Doctor Changes
                              </h4>
                              <div className="space-y-2">
                                {visit.doctorChanges.map((change, index) => (
                                  <div
                                    key={index}
                                    className="text-sm border-l-2 border-blue-200 pl-3"
                                  >
                                    <p>
                                      <span className="font-medium">Date:</span>{" "}
                                      {change.date}
                                    </p>
                                    <p>
                                      <span className="font-medium">From:</span>{" "}
                                      {change.fromDoctor}{" "}
                                      {change.fromDepartment &&
                                        `(${change.fromDepartment})`}
                                    </p>
                                    <p>
                                      <span className="font-medium">To:</span>{" "}
                                      {change.toDoctor}{" "}
                                      {change.toDepartment &&
                                        `(${change.toDepartment})`}
                                    </p>
                                    {change.priceDifference !== 0 && (
                                      <p>
                                        <span className="font-medium">
                                          Price Difference:
                                        </span>{" "}
                                        <span
                                          className={
                                            change.priceDifference > 0
                                              ? "text-red-600"
                                              : "text-green-600"
                                          }
                                        >
                                          {formatCurrency(
                                            Math.abs(change.priceDifference)
                                          )}
                                          {change.priceDifference > 0
                                            ? " (Upgrade)"
                                            : " (Downgrade)"}
                                        </span>
                                      </p>
                                    )}
                                    {change.notes && (
                                      <p>
                                        <span className="font-medium">
                                          Notes:
                                        </span>{" "}
                                        {change.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      No medical records found for this patient
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>
                  All scheduled and past appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sortedAppointments.length > 0 ? (
                  <div className="space-y-6">
                    {/* Upcoming Appointments */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Upcoming Appointments
                      </h3>
                      {sortedAppointments.filter(
                        (a) => a.status === "scheduled"
                      ).length > 0 ? (
                        <div className="space-y-3">
                          {sortedAppointments
                            .filter((a) => a.status === "scheduled")
                            .map((appointment) => (
                              <div
                                key={appointment.id}
                                className="border rounded-lg p-3"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">
                                      {appointment.type}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {appointment.date} at {appointment.time} •{" "}
                                      {appointment.doctor ||
                                        "Doctor not assigned"}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50 text-blue-800"
                                  >
                                    Scheduled
                                  </Badge>
                                </div>
                                {appointment.presentingComplaints && (
                                  <div className="mt-2">
                                    <p className="text-sm">
                                      <span className="font-medium">
                                        Presenting Complaints:
                                      </span>{" "}
                                      {appointment.presentingComplaints}
                                    </p>
                                    {appointment.historyOfComplaints && (
                                      <p className="text-sm mt-1">
                                        <span className="font-medium">
                                          History:
                                        </span>{" "}
                                        {appointment.historyOfComplaints}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {appointment.notes && (
                                  <p className="text-sm mt-2">
                                    <span className="font-medium">Notes:</span>{" "}
                                    {appointment.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          No upcoming appointments
                        </p>
                      )}
                    </div>

                    {/* Past Appointments */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Past Appointments
                      </h3>
                      {sortedAppointments.filter(
                        (a) => a.status !== "scheduled"
                      ).length > 0 ? (
                        <div className="space-y-3">
                          {sortedAppointments
                            .filter((a) => a.status !== "scheduled")
                            .map((appointment) => (
                              <div
                                key={appointment.id}
                                className="border rounded-lg p-3"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">
                                      {appointment.type}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {appointment.date} at {appointment.time} •{" "}
                                      {appointment.doctor ||
                                        "Doctor not assigned"}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={
                                      appointment.status === "completed"
                                        ? "bg-green-50 text-green-800"
                                        : "bg-red-50 text-red-800"
                                    }
                                  >
                                    {appointment.status
                                      .charAt(0)
                                      .toUpperCase() +
                                      appointment.status.slice(1)}
                                  </Badge>
                                </div>
                                {appointment.presentingComplaints && (
                                  <div className="mt-2">
                                    <p className="text-sm">
                                      <span className="font-medium">
                                        Presenting Complaints:
                                      </span>{" "}
                                      {appointment.presentingComplaints}
                                    </p>
                                    {appointment.historyOfComplaints && (
                                      <p className="text-sm mt-1">
                                        <span className="font-medium">
                                          History:
                                        </span>{" "}
                                        {appointment.historyOfComplaints}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {appointment.notes && (
                                  <p className="text-sm mt-2">
                                    <span className="font-medium">Notes:</span>{" "}
                                    {appointment.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          No past appointments
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      No appointments found for this patient
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() =>
                        router.push(`/appointments?patientId=${patient.id}`)
                      }
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  All billing and payment records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sortedBills.length > 0 ? (
                  <div className="space-y-6">
                    {/* Pending Bills */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Pending Bills
                      </h3>
                      {sortedBills.filter((b) => b.status === "pending")
                        .length > 0 ? (
                        <div className="space-y-3">
                          {sortedBills
                            .filter((b) => b.status === "pending")
                            .map((bill) => (
                              <div
                                key={bill.id}
                                className="border rounded-lg p-3"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium capitalize">
                                      {bill.type}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {bill.date} • Bill: {bill.id}
                                    </p>
                                  </div>
                                  <p className="font-medium">
                                    {bill.total
                                      ? formatCurrency(bill.total)
                                      : formatCurrency(
                                          calculateTotal(bill.items)
                                        )}
                                  </p>
                                </div>
                                <div className="flex justify-between mt-2">
                                  <p className="text-sm">
                                    {bill.items.length}{" "}
                                    {bill.items.length === 1 ? "item" : "items"}
                                  </p>
                                  {hasRejectedHMOClaim(bill.id) ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-red-50 text-red-800"
                                    >
                                      Rejected
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className={
                                        (bill.type === "consultation" &&
                                          patient.patientType === "hmo") ||
                                        (bill.type === "medication" &&
                                          patient.patientType === "hmo")
                                          ? "bg-green-50 text-green-800"
                                          : "bg-yellow-50 text-yellow-800"
                                      }
                                    >
                                      {bill.type === "consultation" &&
                                      patient.patientType === "hmo"
                                        ? "Paid"
                                        : bill.type === "medication" &&
                                          patient.patientType === "hmo"
                                        ? "Dispensed"
                                        : "Pending"}
                                    </Badge>
                                  )}
                                </div>
                                {/* Show HMO claim status if applicable */}
                                {patient.patientType === "hmo" &&
                                  getClaimStatusBadge(bill.id) && (
                                    <div className="flex justify-end mt-1">
                                      <p className="text-sm mr-2">HMO Claim:</p>
                                      {getClaimStatusBadge(bill.id)}
                                    </div>
                                  )}
                                {
                                  !(
                                    bill.type === "consultation" &&
                                    patient.patientType === "hmo"
                                  ) &&
                                    !(
                                      bill.type === "medication" &&
                                      patient.patientType === "hmo"
                                    )
                                  // && (
                                  //   <Button
                                  //     size="sm"
                                  //     className="mt-2"
                                  //     onClick={() =>
                                  //       router.push(
                                  //         `/billing?billId=${bill.id}`
                                  //       )
                                  //     }
                                  //   >
                                  //     Process Payment
                                  //   </Button>
                                  // )
                                }
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          No pending bills
                        </p>
                      )}
                    </div>

                    {/* Paid Bills */}
                    {paidBills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">
                          Payment Records
                        </h3>
                        <div className="space-y-3">
                          {paidBills.map((bill) => (
                            <div
                              key={bill.id}
                              className="border rounded-lg p-3"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium capitalize">
                                    {bill.type}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {bill.paymentDate} • Receipt: {bill.id}
                                  </p>
                                </div>
                                <p className="font-medium">
                                  {bill.total
                                    ? formatCurrency(bill.total)
                                    : formatCurrency(
                                        calculateTotal(bill.items)
                                      )}
                                </p>
                              </div>
                              <div className="flex justify-between mt-2">
                                <p className="text-sm">
                                  <span className="font-medium">Method:</span>{" "}
                                  <span className="capitalize">
                                    {bill.paymentMethod}
                                  </span>
                                </p>
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-800"
                                >
                                  Paid
                                </Badge>
                              </div>
                              {/* Only show View Receipt button for non-HMO payments */}
                              {bill.paymentMethod !== "hmo" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() => setSelectedBillId(bill.id)}
                                >
                                  View Receipt
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deposit History */}
                    {sortedBills.filter((b) => b.type === "deposit").length >
                      0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">
                          Deposit History
                        </h3>
                        <div className="space-y-3">
                          {sortedBills
                            .filter((b) => b.type === "deposit")
                            .map((bill) => (
                              <div
                                key={bill.id}
                                className="border rounded-lg p-3"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">
                                      Account Deposit
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {bill.paymentDate} • Receipt: {bill.id}
                                    </p>
                                  </div>
                                  <p className="font-medium text-green-600">
                                    {bill.total
                                      ? formatCurrency(bill.total)
                                      : formatCurrency(
                                          calculateTotal(bill.items)
                                        )}
                                  </p>
                                </div>
                                <div className="flex justify-between mt-2">
                                  <p className="text-sm">
                                    <span className="font-medium">Method:</span>{" "}
                                    <span className="capitalize">
                                      {bill.paymentMethod}
                                    </span>
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="bg-green-50 text-green-800"
                                  >
                                    Deposit
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() => setSelectedBillId(bill.id)}
                                >
                                  View Receipt
                                </Button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Cancelled Bills */}
                    {cancelledBills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">
                          Cancelled Bills
                        </h3>
                        <div className="space-y-3">
                          {cancelledBills.map((bill) => (
                            <div
                              key={bill.id}
                              className="border rounded-lg p-3"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium capitalize">
                                    {bill.type}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {bill.date} • Bill: {bill.id}
                                  </p>
                                </div>
                                <p className="font-medium">
                                  {bill.total
                                    ? formatCurrency(bill.total)
                                    : formatCurrency(
                                        calculateTotal(bill.items)
                                      )}
                                </p>
                              </div>
                              <div className="flex justify-between mt-2">
                                <p className="text-sm">
                                  {bill.items.length}{" "}
                                  {bill.items.length === 1 ? "item" : "items"}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="bg-red-50 text-red-800"
                                >
                                  Cancelled
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sortedBills.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          No billing records found for this patient
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() =>
                            router.push(`/billing?patientId=${patient.id}`)
                          }
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Create New Invoice
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      No billing records found for this patient
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() =>
                        router.push(`/billing?patientId=${patient.id}`)
                      }
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Create New Invoice
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Receipt Modal */}
      <ReceiptModal
        billId={selectedBillId}
        open={!!selectedBillId}
        onClose={() => setSelectedBillId(null)}
      />
      {/* Patient History Modal */}
      <PatientHistoryModal
        patientId={patientId}
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        visitId=""
      />
      {/* Patient Edit Modal */}
      <PatientEditModal
        patient={patient}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdatePatient}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeletePatient}
        title="Delete Patient Record"
        description={`Are you sure you want to delete ${patient.name}'s record? This action cannot be undone and will remove all patient data including medical history, appointments, and billing records.`}
      />
      <Toaster />
    </MainLayout>
  );
}
