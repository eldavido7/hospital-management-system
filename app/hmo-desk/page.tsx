"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Check,
  FileText,
  Search,
  X,
  Plus,
  Clock,
  Pill,
  FlaskRoundIcon as Flask,
  Syringe,
  Stethoscope,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/auth-context";
import { useAppStore, type HMOClaim, type ClaimItem } from "@/lib/data/store";
import { useStoreExtension } from "@/lib/data/storeext";

export default function HMODeskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<HMOClaim[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [selectedClaim, setSelectedClaim] = useState<HMOClaim | null>(null);
  const [approvalCode, setApprovalCode] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  const [itemApprovalStatus, setItemApprovalStatus] = useState<
    Record<string, boolean>
  >({});
  const [activeTab, setActiveTab] = useState("pending");

  // Get data from the central store
  const {
    hmoClaims,
    refreshHMOClaims,
    getHMOClaimsByStatus,
    updateHMOClaim,
    processHMOClaim,
    patients,
    getPatientById,
    formatCurrency,
    updatePatient,
    bills,
    updateBill,
  } = useAppStore();

  // Get extension store functions if needed
  const {} = useStoreExtension();

  // Load HMO claims when the component mounts
  useEffect(() => {
    // Immediately refresh claims when component mounts
    refreshHMOClaims();

    // Set up an interval to refresh claims every few seconds
    const intervalId = setInterval(() => {
      refreshHMOClaims();
    }, 5000); // Refresh every 5 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [refreshHMOClaims]);

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length >= 2) {
      // Find matching claims
      const suggestions = hmoClaims
        .filter(
          (c) =>
            c.patientName.toLowerCase().includes(term.toLowerCase()) ||
            c.patientId.toLowerCase().includes(term.toLowerCase()) ||
            c.id.toLowerCase().includes(term.toLowerCase()) ||
            c.hmoProvider.toLowerCase().includes(term.toLowerCase())
        )
        .slice(0, 5); // Limit to 5 suggestions

      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (claim: HMOClaim) => {
    setSearchTerm(claim.patientName);
    setSearchSuggestions([]);
    // Focus on the selected claim
    setSelectedClaim(claim);
  };

  // Pagination functions
  const paginateClaims = (claimList: HMOClaim[]) => {
    const filtered = filteredClaims(claimList);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalPages = (claimList: HMOClaim[]) => {
    return Math.ceil(filteredClaims(claimList).length / itemsPerPage);
  };

  // Pagination component
  const PaginationControls = ({ claims }: { claims: HMOClaim[] }) => {
    const totalPages = getTotalPages(claims);

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

  // Reset pagination when tab changes
  const handleTabChange = (value: string) => {
    setCurrentPage(1);
    setActiveTab(value);
  };

  const handleViewClaim = (claim: HMOClaim) => {
    setSelectedClaim(claim);
    setApprovalCode(claim.approvalCode || "");
    setRejectionReason(claim.rejectionReason || "");
    setClaimNotes(claim.notes || "");

    // Initialize item approval status
    const initialStatus: Record<string, boolean> = {};
    claim.items.forEach((item) => {
      initialStatus[item.id] = item.approved || false;
    });
    setItemApprovalStatus(initialStatus);
  };

  const handleToggleItemApproval = (itemId: string) => {
    setItemApprovalStatus((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleApproveClaim = async () => {
    if (!selectedClaim) return;

    if (!approvalCode) {
      toast({
        title: "Approval code required",
        description: "Please enter an approval code from the HMO provider.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get today's date
      const today = new Date().toISOString().split("T")[0];

      // Update items with approval status
      const updatedItems = selectedClaim.items.map((item) => ({
        ...item,
        approved: itemApprovalStatus[item.id],
      }));

      // Update claim status
      const updatedClaim = {
        ...selectedClaim,
        status: "approved" as const,
        items: updatedItems,
        approvalCode,
        notes: claimNotes,
        processedBy: user?.name || "HMO Staff",
        processedDate: today,
      };

      // Process the claim (update patient records, bills, etc.)
      processHMOClaim(updatedClaim, "approved", user?.name);

      // Update the selected claim
      setSelectedClaim(updatedClaim);

      // Check if this is a vaccination claim (from injection_room with vaccination in description)
      const isVaccinationClaim =
        selectedClaim.sourceDepartment === "injection_room" &&
        selectedClaim.items.some((item) =>
          item.description.toLowerCase().includes("vaccination")
        );

      if (isVaccinationClaim) {
        // Find the patient and update their visit to send to injection room
        const patient = getPatientById(selectedClaim.patientId);
        if (patient && patient.visits && patient.visits.length > 0) {
          // Find the visit with vaccination data
          const visitIndex = patient.visits.findIndex((v) => {
            return v.diagnosis === "With HMO: Vaccination";
          });

          if (visitIndex >= 0) {
            const updatedVisits = [...patient.visits];

            // Update the diagnosis to send to injection room - this matches what billing does
            updatedVisits[visitIndex] = {
              ...updatedVisits[visitIndex],
              diagnosis: "With Injection Room: Vaccination",
              notes: `${
                updatedVisits[visitIndex].notes || ""
              }\n\nHMO Desk (${today}): Vaccination approved with code ${approvalCode}.`,
            };

            // Update the patient
            updatePatient({
              ...patient,
              visits: updatedVisits,
            });

            // Find and update the bill
            const bill = bills.find((b) => b.id === selectedClaim.sourceId);
            if (bill) {
              updateBill({
                ...bill,
                status: "paid",
                paymentMethod: "hmo",
                paymentReference: approvalCode || "HMO-APPROVED",
                paymentDate: today,
                processedBy: user?.name || "HMO Desk",
              });
            }
          }
        }
      }

      // Show different messages based on claim type
      let successMessage = `Claim #${updatedClaim.id} has been approved with code ${approvalCode}.`;

      if (updatedClaim.sourceDepartment === "doctor") {
        successMessage = `Initial consultation approved. Patient sent to vitals.`;
      } else if (updatedClaim.sourceDepartment === "pharmacy") {
        successMessage = `Pharmacy claim approved. Medications ready for dispensing.`;
      } else if (updatedClaim.sourceDepartment === "laboratory") {
        successMessage = `Laboratory tests approved. Tests can now be conducted.`;
      } else if (updatedClaim.sourceDepartment === "injection_room") {
        if (isVaccinationClaim) {
          successMessage = `Vaccination approved. Patient sent to injection room.`;
        } else {
          successMessage = `Injections approved. Patient can proceed to injection room.`;
        }
      }

      toast({
        title: "Claim approved",
        description: successMessage,
      });

      // Refresh claims to update the UI
      refreshHMOClaims();
    } catch (error) {
      toast({
        title: "Approval failed",
        description:
          "There was an error approving the claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClaim = async () => {
    if (!selectedClaim) return;

    if (!rejectionReason) {
      toast({
        title: "Rejection reason required",
        description: "Please enter a reason for rejecting the claim.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      {
        // Get today's date
        const today = new Date().toISOString().split("T")[0];

        // Update claim status
        const updatedClaim = {
          ...selectedClaim,
          status: "rejected" as const,
          rejectionReason,
          notes: claimNotes,
          processedBy: user?.name || "HMO Staff",
          processedDate: today,
        };

        // Process the claim (update patient records, bills, etc.)
        processHMOClaim(updatedClaim, "rejected", user?.name);

        // Update the selected claim
        setSelectedClaim(updatedClaim);

        // Show different messages based on claim type
        let rejectionMessage = `Claim #${updatedClaim.id} has been rejected.`;

        if (updatedClaim.sourceDepartment === "doctor") {
          rejectionMessage = `Initial consultation rejected. Appointment has been cancelled.`;
        }

        toast({
          title: "Claim rejected",
          description: rejectionMessage,
        });
      }

      // Refresh claims to update the UI
      refreshHMOClaims();
    } catch (error) {
      toast({
        title: "Rejection failed",
        description:
          "There was an error rejecting the claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClaims = (claimList: HMOClaim[]) => {
    if (!searchTerm) return claimList;

    return claimList.filter(
      (c) =>
        c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.hmoProvider.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Add a function to filter claims by today's date
  const getTodaysClaims = (claimList: HMOClaim[]) => {
    const today = new Date().toISOString().split("T")[0];
    return claimList.filter(
      (claim) => claim.date === today || claim.processedDate === today
    );
  };

  const getSourceIcon = (department: string) => {
    switch (department) {
      case "pharmacy":
        return <Pill className="h-4 w-4" />;
      case "laboratory":
        return <Flask className="h-4 w-4" />;
      case "injection_room":
        return <Syringe className="h-4 w-4" />;
      case "doctor":
        return <Stethoscope className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getSourceDisplayName = (department: string) => {
    switch (department) {
      case "pharmacy":
        return "Pharmacy";
      case "laboratory":
        return "Laboratory";
      case "injection_room":
        return "Injection Room";
      case "doctor":
        return "Consultation";
      default:
        return department.replace("_", " ");
    }
  };

  // Update the claims variables to use today's date filter
  const pendingClaims = getTodaysClaims(getHMOClaimsByStatus("pending"));
  const approvedClaims = getTodaysClaims([
    ...getHMOClaimsByStatus("approved"),
    ...getHMOClaimsByStatus("completed"),
  ]);
  const rejectedClaims = getTodaysClaims(getHMOClaimsByStatus("rejected"));

  const calculateTotal = (items: ClaimItem[]) => {
    return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  };

  const calculateApprovedTotal = (items: ClaimItem[]) => {
    return items.reduce((acc, item) => {
      if (item.approved) {
        return acc + item.quantity * item.unitPrice;
      }
      return acc;
    }, 0);
  };

  const getNextStepAfterApproval = (department: string) => {
    switch (department) {
      case "doctor":
        return "Patient will be sent to vitals";
      case "pharmacy":
        return "Medications will be dispensed";
      case "laboratory":
        return "Tests will be conducted";
      case "injection_room":
        return "Injections will be administered";
      default:
        return "Claim will be processed";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">HMO Desk</h1>
            <p className="text-muted-foreground">
              Process HMO claims and manage approvals
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push("/patients/register")}>
              <Plus className="mr-2 h-4 w-4" />
              Register HMO Patient
            </Button>
          </div>
        </div>

        <div className="flex w-full mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by patient name, ID or HMO provider..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearchInputChange}
            />

            {searchSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {searchSuggestions.map((claim) => (
                  <div
                    key={claim.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectSuggestion(claim)}
                  >
                    <div className="font-medium">{claim.patientName}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {claim.patientId} • Claim: {claim.id} • HMO:{" "}
                      {claim.hmoProvider}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-4">
                {filteredClaims(pendingClaims).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No pending claims
                    </CardContent>
                  </Card>
                ) : (
                  paginateClaims(pendingClaims).map((claim) => (
                    <Card key={claim.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {claim.patientName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {claim.patientId} • Claim: {claim.id}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {getSourceIcon(claim.sourceDepartment)}
                            <Badge
                              variant="outline"
                              className="ml-2 capitalize bg-blue-50 text-blue-800"
                            >
                              {getSourceDisplayName(claim.sourceDepartment)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm mb-1">HMO: {claim.hmoProvider}</p>
                        <p className="text-sm mb-1">Date: {claim.date}</p>
                        <p className="text-sm mb-3">
                          Amount: ₦
                          {calculateTotal(claim.items).toLocaleString()}
                        </p>
                        <Button
                          className="w-full"
                          onClick={() => handleViewClaim(claim)}
                        >
                          Process Claim
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
                <PaginationControls claims={pendingClaims} />
              </TabsContent>

              <TabsContent value="approved" className="space-y-4 mt-4">
                {filteredClaims(approvedClaims).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No approved claims
                    </CardContent>
                  </Card>
                ) : (
                  paginateClaims(approvedClaims).map((claim) => (
                    <Card key={claim.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {claim.patientName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {claim.patientId} • Claim: {claim.id}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {getSourceIcon(claim.sourceDepartment)}
                            <Badge
                              variant="outline"
                              className="ml-2 bg-green-50 text-green-800"
                            >
                              Approved
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm mb-1">HMO: {claim.hmoProvider}</p>
                        <p className="text-sm mb-1">
                          Approval: {claim.approvalCode}
                        </p>
                        <p className="text-sm mb-3">
                          Amount: ₦
                          {calculateApprovedTotal(claim.items).toLocaleString()}
                        </p>
                        <Button
                          className="w-full"
                          onClick={() => handleViewClaim(claim)}
                        >
                          View Claim
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
                <PaginationControls claims={approvedClaims} />
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4 mt-4">
                {filteredClaims(rejectedClaims).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No rejected claims
                    </CardContent>
                  </Card>
                ) : (
                  paginateClaims(rejectedClaims).map((claim) => (
                    <Card key={claim.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {claim.patientName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {claim.patientId} • Claim: {claim.id}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {getSourceIcon(claim.sourceDepartment)}
                            <Badge
                              variant="outline"
                              className="ml-2 bg-red-50 text-red-800"
                            >
                              Rejected
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm mb-1">HMO: {claim.hmoProvider}</p>
                        <p className="text-sm mb-3">Date: {claim.date}</p>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => handleViewClaim(claim)}
                        >
                          View Claim
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
                <PaginationControls claims={rejectedClaims} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-2">
            {selectedClaim ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        {getSourceDisplayName(selectedClaim.sourceDepartment)}{" "}
                        Claim
                      </CardTitle>
                      <CardDescription>
                        Patient: {selectedClaim.patientName} (ID:{" "}
                        {selectedClaim.patientId})
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClaim(null)}
                      >
                        Back to List
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        HMO Provider
                      </p>
                      <p>{selectedClaim.hmoProvider}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p>{selectedClaim.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <div className="flex items-center">
                        {getSourceIcon(selectedClaim.sourceDepartment)}
                        <span className="ml-1 capitalize">
                          {getSourceDisplayName(selectedClaim.sourceDepartment)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant="outline"
                        className={
                          selectedClaim.status === "approved" ||
                          selectedClaim.status === "completed"
                            ? "bg-green-50 text-green-800"
                            : selectedClaim.status === "rejected"
                            ? "bg-red-50 text-red-800"
                            : "bg-blue-50 text-blue-800"
                        }
                      >
                        {selectedClaim.status.charAt(0).toUpperCase() +
                          selectedClaim.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Claim Items</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">
                            Unit Price (₦)
                          </TableHead>
                          <TableHead className="text-right">
                            Total (₦)
                          </TableHead>
                          {selectedClaim.status === "pending" && (
                            <TableHead>Approve</TableHead>
                          )}
                          {(selectedClaim.status === "approved" ||
                            selectedClaim.status === "completed") && (
                            <TableHead>Status</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedClaim.items.map((item) => (
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
                            {selectedClaim.status === "pending" && (
                              <TableCell>
                                <div className="flex items-center">
                                  <Checkbox
                                    checked={
                                      itemApprovalStatus[item.id] || false
                                    }
                                    onCheckedChange={() =>
                                      handleToggleItemApproval(item.id)
                                    }
                                    className="mr-2"
                                  />
                                  <Label>Approve</Label>
                                </div>
                              </TableCell>
                            )}
                            {(selectedClaim.status === "approved" ||
                              selectedClaim.status === "completed") && (
                              <TableCell>
                                <Badge
                                  variant={
                                    item.approved ? "default" : "destructive"
                                  }
                                  className={
                                    item.approved
                                      ? "bg-green-100 text-green-800"
                                      : ""
                                  }
                                >
                                  {item.approved ? "Approved" : "Rejected"}
                                </Badge>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-right font-semibold"
                          >
                            Total
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₦
                            {calculateTotal(
                              selectedClaim.items
                            ).toLocaleString()}
                          </TableCell>
                          {(selectedClaim.status === "pending" ||
                            selectedClaim.status === "approved" ||
                            selectedClaim.status === "completed") && (
                            <TableCell></TableCell>
                          )}
                        </TableRow>
                        {(selectedClaim.status === "approved" ||
                          selectedClaim.status === "completed") && (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-right font-semibold"
                            >
                              Approved Total
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ₦
                              {calculateApprovedTotal(
                                selectedClaim.items
                              ).toLocaleString()}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {selectedClaim.status === "pending" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="approvalCode">Approval Code</Label>
                          <Input
                            id="approvalCode"
                            value={approvalCode}
                            onChange={(e) => setApprovalCode(e.target.value)}
                            placeholder="Enter HMO approval code"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rejectionReason">
                            Rejection Reason
                          </Label>
                          <Input
                            id="rejectionReason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason if rejecting"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={claimNotes}
                          onChange={(e) => setClaimNotes(e.target.value)}
                          placeholder="Enter any additional notes about the claim..."
                          className="min-h-[100px]"
                        />
                      </div>

                      {/* Add information about what happens after approval */}
                      <div className="p-4 bg-white rounded-md border border-blue-200">
                        <h3 className="text-lg font-semibold mb-2">
                          After Approval
                        </h3>
                        <p>
                          {getNextStepAfterApproval(
                            selectedClaim.sourceDepartment
                          )}
                        </p>
                      </div>
                    </>
                  )}

                  {selectedClaim.status === "rejected" &&
                    selectedClaim.rejectionReason && (
                      <div className="p-4 bg-red-50 rounded-md border border-red-200">
                        <h3 className="text-lg font-semibold mb-2">
                          Rejection Reason
                        </h3>
                        <p>{selectedClaim.rejectionReason}</p>
                      </div>
                    )}

                  {selectedClaim.notes && (
                    <div className="p-4 bg-gray-50 rounded-md">
                      <h3 className="text-lg font-semibold mb-2">Notes</h3>
                      <p className="whitespace-pre-line">
                        {selectedClaim.notes}
                      </p>
                    </div>
                  )}

                  {selectedClaim.processedBy && (
                    <div className="p-4 bg-white rounded-md">
                      <h3 className="text-lg font-semibold mb-2">
                        Processing Information
                      </h3>
                      <p>Processed by: {selectedClaim.processedBy}</p>
                      <p>Processed date: {selectedClaim.processedDate}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedClaim(null)}
                  >
                    Back
                  </Button>

                  {selectedClaim.status === "pending" && (
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleRejectClaim}
                        disabled={isSubmitting}
                      >
                        <X className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Processing..." : "Reject Claim"}
                      </Button>
                      <Button
                        onClick={handleApproveClaim}
                        disabled={isSubmitting}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Processing..." : "Approve Claim"}
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>HMO Claim Details</CardTitle>
                  <CardDescription>
                    Select a claim from the list to view details or process
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No claim selected. Click on a claim from the list to view
                    details or process.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
