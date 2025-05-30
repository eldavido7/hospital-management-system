"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAppStore } from "@/lib/data/store";
import { Search, CreditCard, ArrowLeft } from "lucide-react";

export default function DepositForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [isProcessing, setIsProcessing] = useState(false);

  // Get functions from the store
  const { searchPatients, getPatientById, createDepositBill } = useAppStore();

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length >= 2) {
      // Search patients by name or ID, but only return cash patients
      const results = searchPatients(
        term,
        term.startsWith("P-") ? "id" : "name"
      ).filter((patient) => patient.patientType === "cash"); // Only include cash patients
      setSearchResults(results.slice(0, 5)); // Limit to 5 results
    } else {
      setSearchResults([]);
    }
  };

  // Handle patient selection
  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setSearchTerm(patient.name);
    setSearchResults([]);
  };

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAmount(value);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      return;
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create deposit bill
      const depositBill = createDepositBill(
        selectedPatient.id,
        Number.parseFloat(amount),
        "Cash Point Staff" // In a real app, this would be the logged-in user
      );

      // Show success message
      toast({
        title: "Deposit Successful",
        description: `₦${Number.parseFloat(
          amount
        ).toLocaleString()} has been added to ${
          selectedPatient.name
        }'s account.`,
      });

      // Reset form
      setSelectedPatient(null);
      setSearchTerm("");
      setAmount("");
      setPaymentMethod("cash");

      // Redirect to the receipt page
      router.push(`/billing?billId=${depositBill.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while processing the deposit",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Patient Account Deposit
        </h2>
        <Button variant="outline" onClick={() => router.push("/billing")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Billing
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Make a Deposit</CardTitle>
          <CardDescription>
            Add funds to a patient's account balance (Cash patients only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="patient-search">Patient</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="patient-search"
                  type="text"
                  placeholder="Search by patient name or ID..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />

                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {patient.id} •{" "}
                          {patient.patientType === "hmo"
                            ? `HMO: ${patient.hmoProvider}`
                            : "Cash Patient"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedPatient && (
              <div className="p-4 border rounded-md bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{selectedPatient.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {selectedPatient.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Current Balance</p>
                    <p
                      className={
                        selectedPatient.balance > 0
                          ? "font-medium text-green-600"
                          : "font-medium"
                      }
                    >
                      ₦{selectedPatient.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Deposit Amount (₦)</Label>
              <Input
                id="amount"
                type="text"
                placeholder="Enter amount"
                value={amount}
                onChange={handleAmountChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Metho</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/billing")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing || !selectedPatient || !amount}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {isProcessing ? "Processing..." : "Process Deposit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
