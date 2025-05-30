"use client";

import type React from "react";

import { useState } from "react";
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
import { ArrowLeft, Check, FileText, Search, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface HMOClaim {
  id: string;
  patientId: string;
  patientName: string;
  hmoProvider: string;
  policyNumber: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "completed";
  type: "consultation" | "pharmacy" | "laboratory" | "other";
  // items: ClaimItem[];
  // approvalCode?: string;
  // rejectionReason?: string;
  // notes?: "other";
  items: ClaimItem[];
  approvalCode?: string;
  rejectionReason?: string;
  notes?: string;
}

interface ClaimItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  approved?: boolean;
}

export default function HMOPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for HMO claims
  const [hmoClaims, setHmoClaims] = useState<HMOClaim[]>([
    {
      id: "HMO-1001",
      patientId: "P-1001",
      patientName: "John Doe",
      hmoProvider: "AXA Mansard",
      policyNumber: "AXA-12345",
      date: "2023-05-15",
      status: "pending",
      type: "consultation",
      items: [
        {
          id: "CI1",
          description: "Consultation Fee",
          quantity: 1,
          unitPrice: 5000,
        },
        {
          id: "CI2",
          description: "Registration Fee",
          quantity: 1,
          unitPrice: 2000,
        },
      ],
    },
    {
      id: "HMO-1002",
      patientId: "P-1002",
      patientName: "Sarah Johnson",
      hmoProvider: "Hygeia HMO",
      policyNumber: "HYG-67890",
      date: "2023-05-15",
      status: "approved",
      type: "pharmacy",
      items: [
        {
          id: "CI3",
          description: "Amoxicillin 500mg",
          quantity: 21,
          unitPrice: 150,
          approved: true,
        },
        {
          id: "CI4",
          description: "Paracetamol 500mg",
          quantity: 10,
          unitPrice: 50,
          approved: true,
        },
      ],
      approvalCode: "HYG-APP-123456",
    },
    {
      id: "HMO-1003",
      patientId: "P-1003",
      patientName: "Michael Smith",
      hmoProvider: "Avon HMO",
      policyNumber: "AVN-54321",
      date: "2023-05-15",
      status: "rejected",
      type: "laboratory",
      items: [
        {
          id: "CI5",
          description: "MRI Scan",
          quantity: 1,
          unitPrice: 75000,
          approved: false,
        },
      ],
      rejectionReason:
        "Procedure not covered under current plan. Patient needs to upgrade or pay out of pocket.",
    },
    {
      id: "HMO-1004",
      patientId: "P-1004",
      patientName: "Nancy Wilson",
      hmoProvider: "Liberty Health",
      policyNumber: "LIB-98765",
      date: "2023-05-15",
      status: "completed",
      type: "pharmacy",
      items: [
        {
          id: "CI6",
          description: "Metformin 500mg",
          quantity: 60,
          unitPrice: 25,
          approved: true,
        },
        {
          id: "CI7",
          description: "Glimepiride 2mg",
          quantity: 30,
          unitPrice: 75,
          approved: true,
        },
      ],
      approvalCode: "LIB-APP-654321",
    },
  ]);

  const [selectedClaim, setSelectedClaim] = useState<HMOClaim | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [approvalCode, setApprovalCode] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  const [itemApprovalStatus, setItemApprovalStatus] = useState<
    Record<string, boolean>
  >({});

  // Add search suggestions functionality
  const [searchSuggestions, setSearchSuggestions] = useState<HMOClaim[]>([]);

  // Add pagination to HMO page
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);

  // Updated search input handler
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

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
      };

      setHmoClaims(
        hmoClaims.map((c) => (c.id === selectedClaim.id ? updatedClaim : c))
      );

      setSelectedClaim(updatedClaim);

      toast({
        title: "Claim approved",
        description: `Claim #${updatedClaim.id} has been approved with code ${approvalCode}.`,
      });
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update items with rejection status
      const updatedItems = selectedClaim.items.map((item) => ({
        ...item,
        approved: false,
      }));

      // Update claim status
      const updatedClaim = {
        ...selectedClaim,
        status: "rejected" as const,
        items: updatedItems,
        rejectionReason,
        notes: claimNotes,
      };

      setHmoClaims(
        hmoClaims.map((c) => (c.id === selectedClaim.id ? updatedClaim : c))
      );

      setSelectedClaim(updatedClaim);

      toast({
        title: "Claim rejected",
        description: `Claim #${updatedClaim.id} has been rejected.`,
      });
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

  const handleCompleteClaim = async () => {
    if (!selectedClaim) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update claim status
      const updatedClaim = {
        ...selectedClaim,
        status: "completed" as const,
      };

      setHmoClaims(
        hmoClaims.map((c) => (c.id === selectedClaim.id ? updatedClaim : c))
      );

      setSelectedClaim(updatedClaim);

      toast({
        title: "Claim completed",
        description: `Claim #${updatedClaim.id} has been marked as completed.`,
      });
    } catch (error) {
      toast({
        title: "Completion failed",
        description:
          "There was an error completing the claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingClaims = hmoClaims.filter((c) => c.status === "pending");
  const approvedClaims = hmoClaims.filter((c) => c.status === "approved");
  const rejectedClaims = hmoClaims.filter((c) => c.status === "rejected");
  const completedClaims = hmoClaims.filter((c) => c.status === "completed");

  const calculateTotal = (items: ClaimItem[]) => {
    return items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0
    );
  };

  const calculateApprovedTotal = (items: ClaimItem[]) => {
    return items.reduce((total, item) => {
      if (item.approved) {
        return total + item.quantity * item.unitPrice;
      }
      return total;
    }, 0);
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              HMO Management
            </h1>
            <p className="text-muted-foreground">
              Process HMO claims and manage approvals
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
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
              onValueChange={handleTabChange}
              defaultValue="pending"
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
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
                          <Badge
                            variant="outline"
                            className="capitalize bg-blue-50 text-blue-800"
                          >
                            {claim.type}
                          </Badge>
                        </div>
                        <p className="text-sm mb-1">HMO: {claim.hmoProvider}</p>
                        <p className="text-sm mb-1">
                          Policy: {claim.policyNumber}
                        </p>
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
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-800"
                          >
                            Approved
                          </Badge>
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
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-800"
                          >
                            Rejected
                          </Badge>
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

              <TabsContent value="completed" className="space-y-4 mt-4">
                {filteredClaims(completedClaims).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No completed claims
                    </CardContent>
                  </Card>
                ) : (
                  paginateClaims(completedClaims).map((claim) => (
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
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-800"
                          >
                            Completed
                          </Badge>
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
                          variant="outline"
                          onClick={() => handleViewClaim(claim)}
                        >
                          View Claim
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
                <PaginationControls claims={completedClaims} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-2">
            {selectedClaim ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>HMO Claim #{selectedClaim.id}</CardTitle>
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
                      <p className="text-sm text-muted-foreground">
                        Policy Number
                      </p>
                      <p>{selectedClaim.policyNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p>{selectedClaim.date}</p>
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
                                  <input
                                    type="checkbox"
                                    checked={
                                      itemApprovalStatus[item.id] || false
                                    }
                                    onChange={() =>
                                      handleToggleItemApproval(item.id)
                                    }
                                    className="mr-2 h-4 w-4"
                                    title={`Approve ${item.description}`}
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
                      <p>{selectedClaim.notes}</p>
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

                  {selectedClaim.status === "approved" && (
                    <Button
                      onClick={handleCompleteClaim}
                      disabled={isSubmitting}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Processing..." : "Mark as Completed"}
                    </Button>
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
