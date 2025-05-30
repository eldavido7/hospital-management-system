"use client";

import { useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Printer } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { type HMOClaim, useAppStore } from "@/lib/data/store";
import { Toaster } from "@/components/ui/toaster";

export default function HMODetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  const hmoProvider = decodeURIComponent(params.hmoProvider as string);

  const {
    patients,
    getPatientById,
    hmoClaims,
    bills,
    labRequests,
    formatCurrency,
  } = useAppStore();

  // Get all claims for this HMO provider
  const claims = hmoClaims.filter((claim) => claim.hmoProvider === hmoProvider);

  const totalAmount = claims.reduce(
    (sum, claim) =>
      sum +
      claim.items.reduce(
        (itemSum, item) => itemSum + item.quantity * item.unitPrice,
        0
      ),
    0
  );

  const approvedAmount = claims.reduce((sum, claim) => {
    if (claim.status === "approved" || claim.status === "completed") {
      return (
        sum +
        claim.items.reduce((itemSum, item) => {
          if (item.approved) {
            return itemSum + item.quantity * item.unitPrice;
          }
          return itemSum;
        }, 0)
      );
    }
    return sum;
  }, 0);

  // Get unique patients with claims
  const patientIds = [...new Set(claims.map((claim) => claim.patientId))];
  const patientsWithClaims = patientIds
    .map((patientId) => {
      const patient = getPatientById(patientId);
      if (!patient) return null;

      // Get all visits for this patient
      const visits = patient.visits || [];

      // Get all claims for this patient
      const patientClaims = claims.filter(
        (claim) => claim.patientId === patientId
      );

      // Match claims with visits
      const visitsWithClaims = visits
        .map((visit) => {
          const visitClaims = patientClaims.filter(
            (claim) =>
              claim.sourceId === visit.id || // Doctor consultation
              (visit.labData && claim.sourceId === visit.labData.id) || // Lab tests
              (visit.injectionData && claim.sourceId === visit.injectionData.id) // Injections
          );

          // Get pharmacy bills related to this visit
          const pharmacyBills = bills.filter(
            (bill) =>
              bill.patientId === patientId &&
              bill.type === "pharmacy" &&
              patientClaims.some((claim) => claim.sourceId === bill.id)
          );

          return {
            ...visit,
            claims: visitClaims,
            pharmacyBills,
          };
        })
        .filter(
          (visit) => visit.claims.length > 0 || visit.pharmacyBills?.length > 0
        );

      return {
        patient,
        visitsWithClaims,
      };
    })
    .filter(Boolean) as Array<{
    patient: NonNullable<ReturnType<typeof getPatientById>>;
    visitsWithClaims: any[];
  }>;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && receiptRef.current) {
      printWindow.document.write(`
        <html>
          <head>
            <title>HMO Claims Report - ${hmoProvider}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .section { margin-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .patient-card { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; }
              .total-row { font-weight: bold; }
              .badge { 
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
              }
              .badge-approved { background-color: #d1fae5; color: #065f46; }
              .badge-pending { background-color: #e0f2fe; color: #0369a1; }
              .badge-rejected { background-color: #fee2e2; color: #b91c1c; }
            </style>
          </head>
          <body>
            ${receiptRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCopy = () => {
    // Create a text representation of the receipt
    let receiptText = `HMO CLAIMS REPORT - ${hmoProvider}
`;
    receiptText += `Date: ${new Date().toLocaleDateString()}
`;
    receiptText += `Total Patients: ${patientIds.length}
`;
    receiptText += `Total Claims: ${claims.length}
`;
    receiptText += `Total Amount: ${formatCurrency(totalAmount)}
`;
    receiptText += `Approved Amount: ${formatCurrency(approvedAmount)}

`;

    patientsWithClaims.forEach(({ patient, visitsWithClaims }) => {
      receiptText += `PATIENT: ${patient.name} (ID: ${patient.id})
`;
      receiptText += `Contact: ${patient.phone}

`;

      visitsWithClaims.forEach((visit) => {
        receiptText += `Visit Date: ${visit.date}
`;
        receiptText += `Doctor: ${visit.doctor}
`;
        receiptText += `Diagnosis: ${
          visit.diagnosis.startsWith("With ")
            ? visit.diagnosis.split(": ")[1]
            : visit.diagnosis
        }

`;

        // Prescriptions
        if (visit.prescriptions && visit.prescriptions.length > 0) {
          receiptText += `PRESCRIPTIONS:
`;
          visit.prescriptions.forEach((prescription: string) => {
            receiptText += `- ${prescription}
`;
          });
          receiptText += `
`;
        }

        // Lab Tests
        if (visit.labTests && visit.labTests.length > 0) {
          receiptText += `LAB TESTS:
`;
          visit.labTests.forEach((test: any) => {
            receiptText += `- ${test.name}: ${test.result}
`;
          });
          receiptText += `
`;
        }

        // Pharmacy Bills
        if (visit.pharmacyBills && visit.pharmacyBills.length > 0) {
          receiptText += `MEDICATIONS:
`;
          visit.pharmacyBills.forEach((bill: any) => {
            bill.items.forEach((item: any) => {
              receiptText += `- ${item.description}: ${
                item.quantity
              } x ${formatCurrency(item.unitPrice)} = ${formatCurrency(
                item.quantity * item.unitPrice
              )}
`;
            });
          });
          receiptText += `
`;
        }

        receiptText += `--------------------------------------------------

`;
      });
    });

    navigator.clipboard
      .writeText(receiptText)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description:
            "The HMO claims report has been copied to your clipboard.",
        });
      })
      .catch((err) => {
        toast({
          title: "Failed to copy",
          description: "Could not copy the report to clipboard.",
          variant: "destructive",
        });
      });
  };

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

  // Helper function to get claim status badge class
  const getClaimStatusClass = (status: string) => {
    if (status === "approved" || status === "completed") {
      return "bg-green-50 text-green-800";
    } else if (status === "rejected") {
      return "bg-red-50 text-red-800";
    } else {
      return "bg-blue-50 text-blue-800";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              HMO Claims Report
            </h1>
            <p className="text-muted-foreground">{hmoProvider}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Report
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
            <Button variant="outline" onClick={() => router.push("/reports")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              Generated on {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-xl font-medium">{patientIds.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Claims</p>
                <p className="text-xl font-medium">{claims.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-medium">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved Amount</p>
                <p className="text-xl font-medium">
                  {formatCurrency(approvedAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div ref={receiptRef}>
          <h2 className="text-2xl font-bold mb-4">Patient Claims</h2>

          {patientsWithClaims.length > 0 ? (
            <div className="space-y-8">
              {patientsWithClaims.map(({ patient, visitsWithClaims }) => (
                <Card key={patient.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{patient.name}</CardTitle>
                        <CardDescription>
                          ID: {patient.id} • {patient.age} years,{" "}
                          {patient.gender}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        HMO: {patient.hmoProvider}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-6 p-6">
                        {visitsWithClaims.map((visit, visitIndex) => (
                          <div
                            key={visitIndex}
                            className="border rounded-lg p-4"
                          >
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

                            {visit.prescriptions &&
                              visit.prescriptions.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium mb-1">
                                    Prescriptions
                                  </h4>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    {visit.prescriptions.map(
                                      (prescription: string, index: number) => (
                                        <li
                                          key={index}
                                          className="flex justify-between"
                                        >
                                          <span>{prescription}</span>
                                          {visit.claims.some(
                                            (claim: {
                                              sourceDepartment: string;
                                              items: { description: string }[];
                                            }) =>
                                              claim.items.some((item) =>
                                                item.description.includes(
                                                  prescription.split(" - ")[0]
                                                )
                                              )
                                          ) && (
                                            <Badge
                                              variant="outline"
                                              className="ml-2 bg-green-50 text-green-800"
                                            >
                                              Claimed
                                            </Badge>
                                          )}
                                        </li>
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
                                  {visit.labTests.map(
                                    (test: any, index: number) => (
                                      <div
                                        key={index}
                                        className="text-sm flex justify-between"
                                      >
                                        <div>
                                          <p className="font-medium">
                                            {test.name}
                                          </p>
                                          <p>Result: {test.result}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Date: {test.date}
                                          </p>
                                        </div>
                                        {visit.claims.some(
                                          (claim: HMOClaim) =>
                                            claim.sourceDepartment ===
                                              "laboratory" &&
                                            claim.items.some(
                                              (item: { description: string }) =>
                                                item.description.includes(
                                                  test.name
                                                )
                                            )
                                        ) && (
                                          <Badge
                                            variant="outline"
                                            className="ml-2 bg-green-50 text-green-800"
                                          >
                                            Claimed
                                          </Badge>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Pharmacy Bills */}
                            {visit.pharmacyBills &&
                              visit.pharmacyBills.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium mb-1">
                                    Medications
                                  </h4>
                                  <div className="space-y-2">
                                    {visit.pharmacyBills.map(
                                      (bill: any, billIndex: number) => (
                                        <div
                                          key={billIndex}
                                          className="border rounded p-2"
                                        >
                                          <div className="flex justify-between mb-2">
                                            <p className="text-sm font-medium">
                                              Bill: {bill.id}
                                            </p>
                                            <Badge
                                              variant="outline"
                                              className={
                                                bill.status === "paid"
                                                  ? "bg-green-50 text-green-800"
                                                  : "bg-yellow-50 text-yellow-800"
                                              }
                                            >
                                              {bill.status === "paid"
                                                ? "Paid"
                                                : "Pending"}
                                            </Badge>
                                          </div>
                                          <ul className="list-disc list-inside text-sm space-y-1">
                                            {bill.items.map(
                                              (
                                                item: any,
                                                itemIndex: number
                                              ) => (
                                                <li
                                                  key={itemIndex}
                                                  className="flex justify-between"
                                                >
                                                  <span>
                                                    {item.description} (
                                                    {item.quantity} x{" "}
                                                    {formatCurrency(
                                                      item.unitPrice
                                                    )}
                                                    )
                                                  </span>
                                                  <span className="font-medium">
                                                    {formatCurrency(
                                                      item.quantity *
                                                        item.unitPrice
                                                    )}
                                                  </span>
                                                </li>
                                              )
                                            )}
                                          </ul>
                                          <div className="flex justify-end mt-2">
                                            <p className="text-sm font-medium">
                                              Total:{" "}
                                              {formatCurrency(
                                                bill.items.reduce(
                                                  (sum: number, item: any) =>
                                                    sum +
                                                    item.quantity *
                                                      item.unitPrice,
                                                  0
                                                )
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Injection Data */}
                            {visit.injectionData &&
                              visit.injectionData.injections &&
                              visit.injectionData.injections.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium mb-1">
                                    Injections
                                  </h4>
                                  <div className="space-y-2">
                                    {visit.injectionData.injections.map(
                                      (injection: any, index: number) => (
                                        <div
                                          key={index}
                                          className="text-sm flex justify-between"
                                        >
                                          <div>
                                            <p className="font-medium">
                                              {injection.name}{" "}
                                              {injection.dosage}
                                            </p>
                                            <p>
                                              Route: {injection.route},
                                              Frequency: {injection.frequency}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Quantity: {injection.quantity},
                                              Price:{" "}
                                              {formatCurrency(injection.price)}
                                            </p>
                                          </div>
                                          <div className="flex flex-col items-end">
                                            <span className="font-medium">
                                              {formatCurrency(
                                                injection.quantity *
                                                  injection.price
                                              )}
                                            </span>
                                            {visit.claims.some(
                                              (claim: HMOClaim) =>
                                                claim.sourceDepartment ===
                                                  "injection_room" &&
                                                claim.items.some(
                                                  (item: {
                                                    description: string;
                                                  }) =>
                                                    item.description.includes(
                                                      injection.name
                                                    )
                                                )
                                            ) && (
                                              <Badge
                                                variant="outline"
                                                className="mt-1 bg-green-50 text-green-800"
                                              >
                                                Claimed
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Claims for this visit */}
                            {visit.claims && visit.claims.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <h4 className="text-sm font-medium mb-2">
                                  Claims
                                </h4>
                                <div className="space-y-3">
                                  {visit.claims.map(
                                    (claim: HMOClaim, claimIndex: number) => (
                                      <div
                                        key={claimIndex}
                                        className="border rounded p-3"
                                      >
                                        <div className="flex justify-between mb-2">
                                          <div>
                                            <p className="text-sm font-medium">
                                              Claim ID: {claim.id}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Source: {claim.sourceDepartment},
                                              Date: {claim.date}
                                            </p>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className={getClaimStatusClass(
                                              claim.status
                                            )}
                                          >
                                            {claim.status.toUpperCase()}
                                          </Badge>
                                        </div>
                                        <ul className="list-disc list-inside text-sm space-y-1">
                                          {claim.items.map(
                                            (item: any, itemIndex: number) => (
                                              <li
                                                key={itemIndex}
                                                className="flex justify-between"
                                              >
                                                <span>
                                                  {item.description} (
                                                  {item.quantity} x{" "}
                                                  {formatCurrency(
                                                    item.unitPrice
                                                  )}
                                                  )
                                                </span>
                                                <span className="font-medium">
                                                  {formatCurrency(
                                                    item.quantity *
                                                      item.unitPrice
                                                  )}
                                                </span>
                                              </li>
                                            )
                                          )}
                                        </ul>
                                        <div className="flex justify-end mt-2">
                                          <p className="text-sm font-medium">
                                            Total:{" "}
                                            {formatCurrency(
                                              claim.items.reduce(
                                                (sum: number, item: any) =>
                                                  sum +
                                                  item.quantity *
                                                    item.unitPrice,
                                                0
                                              )
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {visit.notes && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-1">
                                  Notes
                                </h4>
                                <p className="text-sm whitespace-pre-line">
                                  {visit.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No claims found for this HMO provider.
              </p>
              <Button className="mt-4" onClick={() => router.push("/reports")}>
                Back to Reports
              </Button>
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </MainLayout>
  );
}
