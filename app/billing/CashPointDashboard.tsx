"use client";
import type React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  FileText,
  CreditCard,
  History,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/data/store";

const CashPointDashboard = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Use the centralized store
  const {
    bills,
    getBillById,
    getPendingBills,
    getTodaysPaidBills,
    calculateTotal,
    updateBill,
    getPatientById,
  } = useAppStore();

  const pendingBills = getPendingBills();
  const todaysPaidBills = getTodaysPaidBills();

  // Filter bills based on search term
  const filteredPendingBills = pendingBills.filter(
    (b) =>
      b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPaidBills = todaysPaidBills.filter(
    (b) =>
      b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination for paid bills
  const indexOfLastPaidBill = currentPage * itemsPerPage;
  const indexOfFirstPaidBill = indexOfLastPaidBill - itemsPerPage;
  const currentPaidBills = filteredPaidBills.slice(
    indexOfFirstPaidBill,
    indexOfLastPaidBill
  );
  const totalPages = Math.ceil(filteredPaidBills.length / itemsPerPage);

  // Pagination for pending bills
  const indexOfLastPendingBill = currentPage * itemsPerPage;
  const indexOfFirstPendingBill = indexOfLastPendingBill - itemsPerPage;
  const currentPendingBills = filteredPendingBills.slice(
    indexOfFirstPendingBill,
    indexOfLastPendingBill
  );
  const totalPendingPages = Math.ceil(
    filteredPendingBills.length / itemsPerPage
  );

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length >= 2) {
      // Find matching bills
      const suggestions = [...pendingBills, ...todaysPaidBills]
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
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Billing Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/billing/payment-history")}>
            <History className="mr-2 h-4 w-4" />
            Payment History
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

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Payments</TabsTrigger>
          <TabsTrigger value="paid">Today's Processed Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentPendingBills.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3">
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No pending payments found
                  </CardContent>
                </Card>
              </div>
            ) : (
              currentPendingBills.map((bill) => (
                <Card key={bill.id}>
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
                      Amount: ₦{calculateTotal(bill.items).toLocaleString()}
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => router.push(`/billing?billId=${bill.id}`)}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Process Payment
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination controls */}
          {filteredPendingBills.length > 0 && (
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

                {Array.from({ length: totalPendingPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
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
                      Math.min(prev + 1, totalPendingPages)
                    )
                  }
                  disabled={currentPage === totalPendingPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentPaidBills.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3">
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No processed payments found for today
                  </CardContent>
                </Card>
              </div>
            ) : (
              currentPaidBills.map((bill) => (
                <Card key={bill.id}>
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
                    <p className="text-sm mb-1">Date: {bill.paymentDate}</p>
                    <p className="text-sm mb-1">
                      Amount: ₦{calculateTotal(bill.items).toLocaleString()}
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
                      onClick={() => router.push(`/billing?billId=${bill.id}`)}
                    >
                      View Receipt
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination controls */}
          {filteredPaidBills.length > 0 && (
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
                      variant={currentPage === page ? "default" : "outline"}
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
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for billing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => router.push("/billing")}
              >
                <CreditCard className="h-5 w-5" />
                <span>Process Payment</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => router.push("/billing/payment-history")}
              >
                <History className="h-5 w-5" />
                <span>Payment History</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => router.push("/patients/search")}
              >
                <FileText className="h-5 w-5" />
                <span>Patient Records</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => router.push("/billing/deposit")}
              >
                <CreditCard className="h-5 w-5" />
                <span>Make Deposit</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashPointDashboard;
