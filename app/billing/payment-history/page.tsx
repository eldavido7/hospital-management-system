"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePickerWithRange } from "@/components/date-range-picker";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useAppStore } from "@/lib/data/store";
import { ReceiptModal } from "@/components/receipt-modal";

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)), // Default to last 30 days
    to: new Date(),
  });

  // Use the billing store
  const { bills, getBillById, getPaidBills, calculateTotal } = useAppStore();

  // Calculate total for a bill
  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString()}`;
  };

  // Filter payments based on search term and date range
  const filteredPayments = getPaidBills().filter((payment) => {
    const matchesSearch =
      !searchTerm ||
      payment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());

    const paymentDate = new Date(payment.paymentDate || payment.date);
    const matchesDateRange =
      !dateRange?.from ||
      !dateRange?.to ||
      (paymentDate >= dateRange.from &&
        paymentDate <= new Date(dateRange.to.getTime() + 86400000)); // Add one day to include the end date

    return matchesSearch && matchesDateRange;
  });

  // Pagination
  const indexOfLastPayment = currentPage * itemsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - itemsPerPage;
  const currentPayments = filteredPayments.slice(
    indexOfFirstPayment,
    indexOfLastPayment
  );
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search

    if (term.length >= 2) {
      // Find matching payments
      const suggestions = getPaidBills()
        .filter(
          (p) =>
            p.patientName.toLowerCase().includes(term.toLowerCase()) ||
            p.patientId.toLowerCase().includes(term.toLowerCase()) ||
            p.id.toLowerCase().includes(term.toLowerCase())
        )
        .map((p) => p.id)
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
      handleViewReceipt(billId);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1); // Reset to first page on date change
  };

  // Handle print receipt
  const handlePrintReceipt = (billId: string) => {
    const payment = getBillById(billId);
    if (!payment) return;

    toast({
      title: "Printing receipt",
      description: `Receipt for ${payment.patientName} (${payment.id}) is being sent to the printer.`,
    });
  };

  // Handle view receipt
  const handleViewReceipt = (billId: string) => {
    setSelectedBillId(billId);
    setIsReceiptModalOpen(true);
  };

  // Handle export to CSV
  const handleExportToCSV = () => {
    toast({
      title: "Exporting data",
      description: "Payment history is being exported to CSV.",
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Payment History
            </h1>
            <p className="text-muted-foreground">
              View and search all processed payments
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/billing")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Billing
            </Button>
            <Button onClick={handleExportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="relative w-full md:w-1/3">
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
                  const payment = getBillById(billId);
                  if (!payment) return null;
                  return (
                    <div
                      key={billId}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectSuggestion(billId)}
                    >
                      <div className="font-medium">{payment.patientName}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {payment.patientId} • Receipt: {payment.id}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="w-full md:w-auto">
            <DatePickerWithRange
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              className="w-full md:w-auto"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
            <CardDescription>
              {filteredPayments.length} payment
              {filteredPayments.length !== 1 ? "s" : ""} found
              {dateRange?.from && dateRange?.to && (
                <>
                  {" "}
                  from {format(dateRange.from, "PPP")} to{" "}
                  {format(dateRange.to, "PPP")}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payment records found matching your criteria
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Processed By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.id}
                          </TableCell>
                          <TableCell>
                            <div>{payment.patientName}</div>
                            <div className="text-sm text-muted-foreground">
                              {payment.patientId}
                            </div>
                          </TableCell>
                          <TableCell>{payment.paymentDate}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`capitalize ${
                                payment.type === "deposit"
                                  ? "bg-green-50 text-green-800"
                                  : ""
                              }`}
                            >
                              {payment.type === "deposit"
                                ? "Deposit"
                                : payment.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(calculateTotal(payment.items))}
                          </TableCell>
                          <TableCell className="capitalize">
                            {payment.paymentMethod}
                          </TableCell>
                          <TableCell>{payment.processedBy}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintReceipt(payment.id)}
                            >
                              <Printer className="h-4 w-4" />
                              <span className="sr-only">Print</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReceipt(payment.id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        )
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        billId={selectedBillId}
        open={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </MainLayout>
  );
}
