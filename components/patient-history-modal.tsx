"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/data/store";
import { useRouter } from "next/navigation";

interface PatientHistoryModalProps {
  patientId: string | null;
  open: boolean;
  onClose: () => void;
  visitId: string; // Added visitId property
}

export function PatientHistoryModal({
  patientId,
  open,
  onClose,
}: PatientHistoryModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Get patient data from the centralized store
  const {
    getPatientById,
    getPatientBills,
    getPatientAppointments,
    formatCurrency,
    calculateTotal,
    hmoClaims,
  } = useAppStore();

  const patient = patientId ? getPatientById(patientId) : null;
  const bills = patientId ? getPatientBills(patientId) : [];
  const appointments = patientId ? getPatientAppointments(patientId) : [];

  // Get HMO claims for this patient
  const patientHmoClaims = patientId
    ? hmoClaims.filter((claim) => claim.patientId === patientId)
    : [];

  if (!patient) {
    return null;
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Patient History: {patient.name}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
            <div>
              <h2 className="text-lg font-semibold">{patient.name}</h2>
              <p className="text-sm text-muted-foreground">
                {patient.age} years, {patient.gender} • ID: {patient.id}
              </p>
            </div>
            <Badge
              variant={patient.patientType === "hmo" ? "outline" : "secondary"}
            >
              {patient.patientType === "hmo"
                ? `HMO: ${patient.hmoProvider}`
                : "Cash Patient"}
            </Badge>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="visits">Medical Records</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Contact Information
                      </h3>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Phone:</span>{" "}
                        {patient.phone}
                      </p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Email:</span>{" "}
                        {patient.email}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Address:</span>{" "}
                        {patient.address}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Medical Information
                      </h3>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Last Visit:</span>{" "}
                        {patient.lastVisit}
                      </p>
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
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Recent Visits */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Recent Visits
                      </h3>
                      {sortedVisits.length > 0 ? (
                        <div className="space-y-3">
                          {sortedVisits.slice(0, 3).map((visit) => (
                            <div
                              key={visit.id}
                              className="border rounded-lg p-3"
                            >
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
                                  <span className="font-medium">
                                    Diagnosis:
                                  </span>{" "}
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
                      {sortedAppointments.filter(
                        (a) => a.status === "scheduled"
                      ).length > 0 ? (
                        <div className="space-y-3">
                          {sortedAppointments
                            .filter((a) => a.status === "scheduled")
                            .slice(0, 2)
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
                              <h4 className="text-sm font-medium mb-1">
                                Notes
                              </h4>
                              <p className="text-sm">{visit.notes}</p>
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
                                        {appointment.date} at {appointment.time}{" "}
                                        •{" "}
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
                                      <span className="font-medium">
                                        Notes:
                                      </span>{" "}
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
                                        {appointment.date} at {appointment.time}{" "}
                                        •{" "}
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
                                      <span className="font-medium">
                                        Notes:
                                      </span>{" "}
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
                                      {bill.items.length === 1
                                        ? "item"
                                        : "items"}
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
                                        <p className="text-sm mr-2">
                                          HMO Claim:
                                        </p>
                                        {getClaimStatusBadge(bill.id)}
                                      </div>
                                    )}
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
                            {paidBills.slice(0, 5).map((bill) => (
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
                              </div>
                            ))}
                            {paidBills.length > 5 && (
                              <p className="text-sm text-muted-foreground text-center">
                                + {paidBills.length - 5} more payment records
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">
                        No billing records found for this patient
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
