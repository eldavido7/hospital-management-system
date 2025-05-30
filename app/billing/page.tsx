"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  CreditCard,
  Printer,
  Receipt,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/lib/data/store";
import type { Bill } from "@/lib/data/billing";
import { Toaster } from "@/components/ui/toaster";

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [destination, setDestination] = useState<"injection" | "final" | null>(
    null
  );
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "transfer" | "balance"
  >("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);

  // Add state to track the current patient
  const [currentPatient, setCurrentPatient] = useState<any>(null);

  // Use the centralized app store
  const {
    bills,
    updateBill,
    getBillById,
    getPendingBills,
    getPaidBills,
    getCancelledBills,
    getTodaysPaidBills,
    calculateTotal,
    patients,
    updatePatient,
    appointments,
    updateAppointment,
    getPatientById,
    updatePatientBalance,
    hospitalSettings,
  } = useAppStore();

  // Check for billId in URL params
  useEffect(() => {
    const billId = searchParams.get("billId");
    if (billId) {
      const bill = getBillById(billId);
      if (bill) {
        setSelectedBill(billId);
        setPaymentReference("");
      }
    }
  }, [searchParams, getBillById]);

  // Update current patient when selected bill changes
  useEffect(() => {
    if (selectedBill) {
      const bill = getBillById(selectedBill);
      if (bill) {
        const patient = getPatientById(bill.patientId);
        setCurrentPatient(patient || null);
      }
    } else {
      setCurrentPatient(null);
    }
  }, [selectedBill, getBillById, getPatientById]);

  // Pagination functions
  const paginateBills = (billList: string[]) => {
    const filtered = filteredBills(billList);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalPages = (billList: string[]) => {
    return Math.ceil(filteredBills(billList).length / itemsPerPage);
  };

  // Pagination component
  const PaginationControls = ({ bills }: { bills: string[] }) => {
    const totalPages = getTotalPages(bills);

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

  const handleViewBill = (billId: string) => {
    setSelectedBill(billId);
    setPaymentReference("");
  };

  // Add a function to apply staff discount when processing payment
  const handleProcessPayment = async () => {
    if (!selectedBill) return;

    const bill = getBillById(selectedBill);
    if (!bill) return;

    // Add at the beginning of the function
    console.log("Processing payment for bill:", bill);

    if (
      paymentMethod !== "cash" &&
      !paymentReference &&
      paymentMethod !== "balance"
    ) {
      toast({
        title: "Payment reference required",
        description:
          "Please enter a payment reference for card or transfer payments.",
        variant: "destructive",
      });
      return;
    }

    // Check if using balance payment method
    if (paymentMethod === "balance") {
      const patient = getPatientById(bill.patientId);
      if (!patient) {
        toast({
          title: "Patient not found",
          description:
            "The patient associated with this bill could not be found.",
          variant: "destructive",
        });
        return;
      }

      // Verify patient has sufficient balance
      const total = calculateTotal(bill.items);
      if (patient.balance < total) {
        toast({
          title: "Insufficient balance",
          description: `Patient's balance (₦${patient.balance.toLocaleString()}) is less than the bill amount (₦${total.toLocaleString()}).`,
          variant: "destructive",
        });
        return;
      }

      // Deduct from patient's balance
      updatePatientBalance(patient.id, -total);
    }

    // Check if pharmacy bill needs destination selection
    // For pharmacy bills, always set destination to "final"
    if (bill.type === "pharmacy") {
      console.log("Processing pharmacy payment");
      setDestination("final");
    }

    // Add special handling for vaccination bills
    if (bill.type === "vaccination") {
      console.log("Processing vaccination payment");
      setDestination("injection");
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Calculate the total amount
      const total = calculateTotal(bill.items);

      // Check if this is a staff patient and apply discount if needed
      const patient = getPatientById(bill.patientId);

      // Initialize the updated bill without discount
      let updatedBill: Partial<Bill> = {
        ...bill,
        status: "paid" as const,
        destination:
          bill.type === "pharmacy"
            ? "final"
            : (null as "injection" | "final" | null),
        paymentMethod,
        paymentReference:
          paymentMethod === "cash"
            ? `CASH-${Date.now().toString().slice(-6)}`
            : paymentMethod === "balance"
            ? `BALANCE-${Date.now().toString().slice(-6)}`
            : paymentReference,
        paymentDate: new Date().toISOString().split("T")[0],
        processedBy: user?.name || "Unknown User",
        total: total, // Add the total to the bill
      };

      // Apply staff discount if applicable
      if (patient?.isStaff) {
        const staffDiscount = hospitalSettings.staffDiscount || 0;
        const discountAmount = total * (staffDiscount / 100);
        const discountedTotal = total - discountAmount;

        updatedBill = {
          ...updatedBill,
          discount: staffDiscount,
          discountReason: "Staff Discount",
          originalTotal: total,
          total: discountedTotal,
        };
      }

      // Update the bill in the store
      updateBill(updatedBill as Bill);
      setSelectedBill(updatedBill.id as string);

      // If this is a pharmacy payment, update the patient's status to completed
      if (bill.type === "pharmacy") {
        // Find the patient
        const patient = patients.find((p) => p.id === bill.patientId);
        if (patient && patient.visits && patient.visits.length > 0) {
          const updatedVisits = [...patient.visits];
          const latestVisitIndex = updatedVisits.length - 1;

          // Update the diagnosis to mark as completed
          if (
            updatedVisits[latestVisitIndex].diagnosis.startsWith(
              "With Cash Point:"
            )
          ) {
            updatedVisits[latestVisitIndex] = {
              ...updatedVisits[latestVisitIndex],
              diagnosis:
                updatedVisits[latestVisitIndex].diagnosis.split(": ")[1], // Remove the "With Cash Point:" prefix
            };

            // Update the patient in the central store
            updatePatient({
              ...patient,
              visits: updatedVisits,
            });
          }
        }

        // Update any related appointment to completed
        const patientAppointments = appointments.filter(
          (a) =>
            a.patientId === bill.patientId &&
            a.status !== "completed" &&
            a.status !== "cancelled"
        );

        if (patientAppointments.length > 0) {
          console.log("Found appointments to update:", patientAppointments);
          // Find the most recent appointment
          const latestAppointment = patientAppointments.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];

          // Update it to completed
          updateAppointment({
            ...latestAppointment,
            status: "completed",
          });
        }
      }
      // Add handling for vaccination bills
      else if (bill.type === "vaccination") {
        // Find the patient
        const patient = patients.find((p) => p.id === bill.patientId);
        if (patient && patient.visits && patient.visits.length > 0) {
          const updatedVisits = [...patient.visits];
          const latestVisitIndex = updatedVisits.length - 1;

          // Update the diagnosis to send to injection room
          if (
            updatedVisits[latestVisitIndex].diagnosis ===
            "With Cash Point: Vaccination"
          ) {
            updatedVisits[latestVisitIndex] = {
              ...updatedVisits[latestVisitIndex],
              diagnosis: "With Injection Room: Vaccination",
            };

            // Update the patient in the central store
            updatePatient({
              ...patient,
              visits: updatedVisits,
            });
          }
        }

        // Find and update the vaccination appointment
        const vaccinationAppointment = appointments.find(
          (a) =>
            a.patientId === bill.patientId &&
            a.type === "Vaccination" &&
            a.status === "In Progress"
        );

        if (vaccinationAppointment) {
          updateAppointment({
            ...vaccinationAppointment,
            notes: `${
              vaccinationAppointment.notes || ""
            }\nPayment processed. Sent to Injection Room.`,
          });
        }
      }

      // Show toast message with discount information if applicable
      if (patient?.isStaff && updatedBill.discount) {
        toast({
          title: "Payment processed with staff discount",
          description: `Receipt #${updatedBill.id} has been generated with ${
            updatedBill.discount
          }% staff discount applied. Final amount: ₦${updatedBill.total?.toLocaleString()}.`,
        });
      } else {
        // Add logic to handle different payment types
        if (bill.type === "pharmacy") {
          toast({
            title: "Payment processed successfully",
            description: `Receipt #${updatedBill.id} has been generated. Consultation completed.`,
          });
        } else if (bill.type === "vaccination") {
          toast({
            title: "Payment processed successfully",
            description: `Receipt #${updatedBill.id} has been generated. Patient sent to Injection Room.`,
          });
        } else if (bill.type === "consultation") {
          toast({
            title: "Payment processed successfully",
            description: `Receipt #${updatedBill.id} has been generated. Patient sent to Vitals.`,
          });
        } else {
          toast({
            title: "Payment processed successfully",
            description: `Receipt #${updatedBill.id} has been generated.`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Payment processing failed",
        description:
          "There was an error processing the payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBill = async () => {
    if (!selectedBill) return;

    const bill = getBillById(selectedBill);
    if (!bill) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update bill status
      const updatedBill = {
        ...bill,
        status: "cancelled" as const,
      };

      // Update the bill in the store
      updateBill(updatedBill);
      setSelectedBill(updatedBill.id);

      toast({
        title: "Bill cancelled",
        description: `Bill #${updatedBill.id} has been cancelled.`,
      });
    } catch (error) {
      toast({
        title: "Failed to cancel bill",
        description:
          "There was an error cancelling the bill. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    // In a real app, this would trigger a print function
    toast({
      title: "Printing receipt",
      description: "The receipt is being sent to the printer.",
    });
  };

  // Get bill IDs for each category
  const pendingBillIds = getPendingBills().map((bill) => bill.id);
  const todaysPaidBillIds = getTodaysPaidBills().map((bill) => bill.id);
  const cancelledBillIds = getCancelledBills().map((bill) => bill.id);

  const filteredBills = (billIds: string[]) => {
    if (!searchTerm) return billIds;

    return billIds.filter((id) => {
      const bill = getBillById(id);
      if (!bill) return false;

      return (
        bill.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  // Reset pagination when tab changes
  const handleTabChange = (value: string) => {
    setCurrentPage(1);
  };

  // Updated search input handler
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length >= 2) {
      // Find matching bills
      const suggestions = bills
        .filter(
          (b) =>
            b.patientName.toLowerCase().includes(term.toLowerCase()) ||
            b.patientId.toLowerCase().includes(term.toLowerCase()) ||
            b.id.toLowerCase().includes(term.toLowerCase())
        )
        .map((b) => b.id)
        .slice(0, 5); // Limit to 5 suggestions

      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (billId: string) => {
    const bill = getBillById(billId);
    if (bill) {
      setSearchTerm(bill.patientName);
      setSearchSuggestions([]);
      // Focus on the selected bill
      setSelectedBill(billId);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Billing & Payments
            </h1>
            <p className="text-muted-foreground">
              Process payments and manage billing
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push("/billing/payment-history")}>
              Payment History
            </Button>
            <Button onClick={() => router.push("/billing/deposit")}>
              <CreditCard className="h-5 w-5" />
              <span>Make Deposit</span>
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
              onChange={handleSearchInputChange}
            />

            {searchSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {searchSuggestions.map((billId) => {
                  const bill = getBillById(billId);
                  if (!bill) return null;
                  return (
                    <div
                      key={billId}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectSuggestion(billId)}
                    >
                      <div className="font-medium">{bill.patientName}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {bill.patientId} • Bill: {bill.id}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Tabs
              onValueChange={handleTabChange}
              defaultValue="pending"
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="paid">Today's Paid</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-4">
                {filteredBills(pendingBillIds).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No pending bills
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginateBills(pendingBillIds).map((billId) => {
                      const bill = getBillById(billId);
                      if (!bill) return null;
                      return (
                        <Card key={billId}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {bill.patientName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  ID: {bill.patientId} • Bill: {bill.id}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="capitalize bg-blue-50 text-blue-800"
                              >
                                {bill.type}
                              </Badge>
                            </div>
                            <p className="text-sm mb-1">Date: {bill.date}</p>
                            <p className="text-sm mb-3">
                              Amount: ₦
                              {(() => {
                                const patient = getPatientById(bill.patientId);
                                const subtotal = calculateTotal(bill.items);
                                if (patient?.isStaff) {
                                  const staffDiscount =
                                    hospitalSettings.staffDiscount || 0;
                                  const discountAmount =
                                    subtotal * (staffDiscount / 100);
                                  return (
                                    subtotal - discountAmount
                                  ).toLocaleString();
                                }
                                return subtotal.toLocaleString();
                              })()}
                            </p>
                            <Button
                              className="w-full"
                              onClick={() => handleViewBill(billId)}
                            >
                              Process Payment
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                    <PaginationControls bills={pendingBillIds} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="paid" className="space-y-4 mt-4">
                {filteredBills(todaysPaidBillIds).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No paid bills today
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginateBills(todaysPaidBillIds).map((billId) => {
                      const bill = getBillById(billId);
                      if (!bill) return null;
                      return (
                        <Card key={billId}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {bill.patientName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  ID: {bill.patientId} • Receipt: {bill.id}
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
                              Date: {bill.paymentDate}
                            </p>
                            <p className="text-sm mb-1">
                              Amount: ₦
                              {calculateTotal(bill.items).toLocaleString()}
                            </p>
                            <p className="text-sm mb-1 capitalize">
                              Method: {bill.paymentMethod}
                            </p>
                            <p className="text-sm mb-3">
                              Processed by: {bill.processedBy}
                            </p>
                            <Button
                              className="w-full"
                              variant="outline"
                              onClick={() => handleViewBill(billId)}
                            >
                              View Receipt
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                    <PaginationControls bills={todaysPaidBillIds} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-4 mt-4">
                {filteredBills(cancelledBillIds).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No cancelled bills
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginateBills(cancelledBillIds).map((billId) => {
                      const bill = getBillById(billId);
                      if (!bill) return null;
                      return (
                        <Card key={billId}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {bill.patientName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  ID: {bill.patientId} • Bill: {bill.id}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-800"
                              >
                                Cancelled
                              </Badge>
                            </div>
                            <p className="text-sm mb-1">Date: {bill.date}</p>
                            <p className="text-sm mb-3">
                              Amount: ₦
                              {calculateTotal(bill.items).toLocaleString()}
                            </p>
                            <Button
                              className="w-full"
                              variant="outline"
                              onClick={() => handleViewBill(billId)}
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                    <PaginationControls bills={cancelledBillIds} />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-2">
            {selectedBill ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        {getBillById(selectedBill)?.status === "paid"
                          ? "Receipt"
                          : "Bill"}{" "}
                        #{selectedBill}
                      </CardTitle>
                      <CardDescription>
                        Patient: {getBillById(selectedBill)?.patientName} (ID:{" "}
                        {getBillById(selectedBill)?.patientId})
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBill(null)}
                      >
                        Back to List
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                    const bill = getBillById(selectedBill);
                    if (!bill) return null;

                    return (
                      <>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Date
                            </p>
                            <p>
                              {bill.status === "paid"
                                ? bill.paymentDate
                                : bill.date}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Type
                            </p>
                            <p className="capitalize">{bill.type}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Status
                            </p>
                            <Badge
                              variant="outline"
                              className={
                                bill.status === "paid"
                                  ? "bg-green-50 text-green-800"
                                  : bill.status === "cancelled"
                                  ? "bg-red-50 text-red-800"
                                  : "bg-blue-50 text-blue-800"
                              }
                            >
                              {bill.status.charAt(0).toUpperCase() +
                                bill.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-3">Items</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">
                                  Qty
                                </TableHead>
                                <TableHead className="text-right">
                                  Unit Price (₦)
                                </TableHead>
                                <TableHead className="text-right">
                                  Total (₦)
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bill.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">
                                    {item.description}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.quantity}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.unitPrice.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {(
                                      item.quantity * item.unitPrice
                                    ).toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}

                              {/* Show staff discount for pending bills if patient is staff */}
                              {(() => {
                                const patient = getPatientById(bill.patientId);
                                const subtotal = calculateTotal(bill.items);
                                const isStaffPatient = patient?.isStaff;
                                const staffDiscount =
                                  hospitalSettings.staffDiscount || 0;

                                // For already processed bills with discount
                                if (
                                  bill.discount &&
                                  bill.discount > 0 &&
                                  bill.originalTotal
                                ) {
                                  return (
                                    <>
                                      <TableRow>
                                        <TableCell
                                          colSpan={3}
                                          className="text-right font-medium"
                                        >
                                          Subtotal
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                          ₦{bill.originalTotal.toLocaleString()}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell
                                          colSpan={3}
                                          className="text-right text-green-600"
                                        >
                                          {bill.discountReason} ({bill.discount}
                                          %)
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                          -₦
                                          {(
                                            bill.originalTotal *
                                            (bill.discount / 100)
                                          ).toLocaleString()}
                                        </TableCell>
                                      </TableRow>
                                    </>
                                  );
                                }

                                // For pending bills where patient is staff
                                if (
                                  bill.status === "pending" &&
                                  isStaffPatient &&
                                  staffDiscount > 0
                                ) {
                                  const discountAmount =
                                    subtotal * (staffDiscount / 100);
                                  return (
                                    <>
                                      <TableRow>
                                        <TableCell
                                          colSpan={3}
                                          className="text-right font-medium"
                                        >
                                          Subtotal
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                          ₦{subtotal.toLocaleString()}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell
                                          colSpan={3}
                                          className="text-right text-green-600"
                                        >
                                          Staff Discount ({staffDiscount}%)
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                          -₦{discountAmount.toLocaleString()}
                                        </TableCell>
                                      </TableRow>
                                    </>
                                  );
                                }

                                return null;
                              })()}

                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  className="text-right font-semibold"
                                >
                                  Total
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  ₦
                                  {(() => {
                                    const patient = getPatientById(
                                      bill.patientId
                                    );
                                    const subtotal = calculateTotal(bill.items);
                                    if (patient?.isStaff) {
                                      const staffDiscount =
                                        hospitalSettings.staffDiscount || 0;
                                      const discountAmount =
                                        subtotal * (staffDiscount / 100);
                                      return (
                                        subtotal - discountAmount
                                      ).toLocaleString();
                                    }
                                    return subtotal.toLocaleString();
                                  })()}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        {bill.status === "paid" && (
                          <div className="p-4 bg-white rounded-md">
                            <h3 className="text-lg font-semibold mb-2">
                              Payment Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Payment Method
                                </p>
                                <p className="capitalize">
                                  {bill.paymentMethod}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Reference
                                </p>
                                <p>{bill.paymentReference}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Payment Date
                                </p>
                                <p>{bill.paymentDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Amount Paid
                                </p>
                                <p>
                                  ₦
                                  {bill.total
                                    ? bill.total.toLocaleString()
                                    : calculateTotal(
                                        bill.items
                                      ).toLocaleString()}
                                </p>
                              </div>
                              {bill.processedBy && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Processed By
                                  </p>
                                  <p>{bill.processedBy}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {bill.status === "pending" && (
                          <div className="space-y-4 p-4 bg-gray-800 text-gray-100 rounded-md">
                            <h3 className="text-lg font-semibold mb-2">
                              Payment Method
                            </h3>
                            <RadioGroup
                              defaultValue="cash"
                              onValueChange={(value) =>
                                setPaymentMethod(
                                  value as
                                    | "cash"
                                    | "card"
                                    | "transfer"
                                    | "balance"
                                )
                              }
                              className="flex flex-col space-y-3"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="cash" id="cash" />
                                <Label htmlFor="cash" className="font-normal">
                                  Cash
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="card" id="card" />
                                <Label htmlFor="card" className="font-normal">
                                  Card
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="transfer"
                                  id="transfer"
                                />
                                <Label
                                  htmlFor="transfer"
                                  className="font-normal"
                                >
                                  Bank Transfer
                                </Label>
                              </div>
                              {currentPatient &&
                                currentPatient.patientType === "cash" && (
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value="balance"
                                      id="balance"
                                      disabled={
                                        currentPatient.balance <
                                        (bill ? calculateTotal(bill.items) : 0)
                                      }
                                    />
                                    <Label
                                      htmlFor="balance"
                                      className="font-normal"
                                    >
                                      Account Balance (₦
                                      {currentPatient.balance.toLocaleString()})
                                      {currentPatient.balance <
                                        (bill
                                          ? calculateTotal(bill.items)
                                          : 0) && (
                                        <span className="ml-2 text-xs text-red-500">
                                          Insufficient balance
                                        </span>
                                      )}
                                    </Label>
                                  </div>
                                )}
                            </RadioGroup>

                            {paymentMethod !== "cash" &&
                              paymentMethod !== "balance" && (
                                <div className="space-y-2 pt-2">
                                  <Label htmlFor="reference">
                                    Payment Reference
                                  </Label>
                                  <Input
                                    id="reference"
                                    value={paymentReference}
                                    onChange={(e) =>
                                      setPaymentReference(e.target.value)
                                    }
                                    placeholder="Enter transaction reference"
                                  />
                                </div>
                              )}
                          </div>
                        )}

                        {bill?.type === "pharmacy" &&
                          bill.status === "pending" && (
                            <div className="space-y-4 p-4 mt-4 bg-white rounded-md">
                              <h3 className="text-lg font-semibold mb-2">
                                Pharmacy Payment
                              </h3>
                              <p>
                                This payment will complete the patient's
                                consultation.
                              </p>
                            </div>
                          )}
                      </>
                    );
                  })()}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBill(null)}
                  >
                    Back
                  </Button>

                  {getBillById(selectedBill)?.status === "pending" && (
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelBill}
                        disabled={isSubmitting}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel Bill
                      </Button>
                      <Button
                        onClick={handleProcessPayment}
                        disabled={isSubmitting}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Processing..." : "Process Payment"}
                      </Button>
                    </div>
                  )}

                  {getBillById(selectedBill)?.status === "paid" && (
                    <Button onClick={handlePrintReceipt}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Receipt
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Bill Details</CardTitle>
                  <CardDescription>
                    Select a bill from the list to view details or process
                    payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No bill selected. Click on a bill from the list to view
                    details or process payment.
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
