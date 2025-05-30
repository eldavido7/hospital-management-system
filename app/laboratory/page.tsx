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
  Clock,
  CreditCard,
  FileText,
  FlaskRoundIcon as Flask,
  Search,
  Plus,
  Check,
  ArrowRightCircle,
  X,
  Eye,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/data/store";
import { useAuth } from "@/context/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LaboratoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [resultsNotes, setResultsNotes] = useState("");
  const [isTestSelectionOpen, setIsTestSelectionOpen] = useState(false);
  const [selectedPatientForTests, setSelectedPatientForTests] = useState<
    string | null
  >(null);
  const [manualTestSelection, setManualTestSelection] = useState<
    Array<{ testId: string; quantity: number }>
  >([]);
  const [isManualTestDialogOpen, setIsManualTestDialogOpen] = useState(false);
  const [viewingPatientId, setViewingPatientId] = useState<string | null>(null);
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTests, setSelectedTests] = useState<
    Array<{ testId: string; quantity: number }>
  >([]);
  const [parameterResults, setParameterResults] = useState<
    Record<string, Record<string, string>>
  >({});
  const [manualSearchTerm, setManualSearchTerm] = useState("");
  const [manualSearchSuggestions, setManualSearchSuggestions] = useState<any[]>(
    []
  );

  // Get data from the store
  const {
    labRequests,
    labTests,
    getLabRequestById,
    updateLabRequest,
    addLabRequest,
    generateLabRequestId,
    getLabRequestsByStatus,
    getActiveLabTests,
    getPatientsWithLabRequests,
    getPatientById,
    addBill,
    generateBillId,
    formatCurrency,
    bills,
    getBillById,
    updateBill,
    patients,
    updatePatient,
  } = useAppStore();

  // Get patients with lab requests
  const patientsWithLabRequests = getPatientsWithLabRequests();

  // Get lab requests by status
  const pendingRequests = getLabRequestsByStatus("pending");
  const billedRequests = getLabRequestsByStatus("billed");
  const inProgressRequests = getLabRequestsByStatus("in_progress");
  const completedRequests = getLabRequestsByStatus("completed");

  // Check for updates to bills that might affect lab requests
  useEffect(() => {
    // For each billed lab request, check if its associated bill has been paid
    billedRequests.forEach((request) => {
      const allTestsPaid = request.tests.every((test) => {
        if (test.billId) {
          const bill = getBillById(test.billId);
          return bill?.status === "paid";
        }
        return test.paymentStatus === "paid";
      });

      // If all tests are paid in the bill but not marked as paid in the lab request
      if (
        allTestsPaid &&
        !request.tests.every((test) => test.paymentStatus === "paid")
      ) {
        // Update the lab request to mark all tests as paid
        const updatedRequest = {
          ...request,
          tests: request.tests.map((test) => ({
            ...test,
            paymentStatus: "paid" as const,
          })),
        };
        updateLabRequest(updatedRequest);
      }
    });
  }, [bills, billedRequests, getBillById, updateLabRequest]);

  // Updated search input handler
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length >= 2) {
      // Find matching lab requests
      const suggestions = labRequests
        .filter(
          (r) =>
            r.patientName.toLowerCase().includes(term.toLowerCase()) ||
            r.patientId.toLowerCase().includes(term.toLowerCase()) ||
            r.id.toLowerCase().includes(term.toLowerCase())
        )
        .slice(0, 5); // Limit to 5 suggestions

      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  // Handle manual search input for the dialog
  const handleManualSearchInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const term = e.target.value;
    setManualSearchTerm(term);

    if (term.length >= 2) {
      // Search patients directly instead of lab requests
      const matchingPatients = patients
        .filter(
          (p) =>
            p.name.toLowerCase().includes(term.toLowerCase()) ||
            p.id.toLowerCase().includes(term.toLowerCase()) ||
            (p.phone && p.phone.includes(term))
        )
        .slice(0, 5); // Limit to 5 suggestions

      setManualSearchSuggestions(matchingPatients);
    } else {
      setManualSearchSuggestions([]);
    }
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (request: any) => {
    setSearchTerm(request.patientName);
    setSearchSuggestions([]);
    // Focus on the selected request
    setSelectedRequest(request.id);
  };

  // Pagination functions
  const paginateRequests = (requests: any[]) => {
    const filtered = filteredRequests(requests);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalPages = (requests: any[]) => {
    return Math.ceil(filteredRequests(requests).length / itemsPerPage);
  };

  // Pagination component
  const PaginationControls = ({ requests }: { requests: any[] }) => {
    const totalPages = getTotalPages(requests);

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

  const filteredRequests = (requestList: any[]) => {
    if (!searchTerm) return requestList;

    return requestList.filter(
      (r) =>
        r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Handle view request
  const handleViewRequest = (requestId: string) => {
    setSelectedRequest(requestId);
    const request = getLabRequestById(requestId);

    if (request && request.status === "in_progress") {
      // Initialize test results
      const initialResults: Record<string, string> = {};
      const initialParameterResults: Record<
        string,
        Record<string, string>
      > = {};

      request.tests.forEach((test) => {
        initialResults[test.id] = test.result || "";

        // Initialize parameter results if the test has ranges
        const labTest = getActiveLabTests().find((t) => t.id === test.testId);
        if (labTest?.ranges && labTest.ranges.length > 0) {
          initialParameterResults[test.id] = {};

          // If we have existing parameter results, use them
          if (test.parameterResults) {
            test.parameterResults.forEach((param) => {
              initialParameterResults[test.id][param.name] = param.result;
            });
          } else {
            // Otherwise initialize empty
            labTest.ranges.forEach((range) => {
              initialParameterResults[test.id][range.name] = "";
            });
          }
        }
      });

      setTestResults(initialResults);
      setParameterResults(initialParameterResults);
      setResultsNotes(request.results || "");
    } else if (request && request.status === "pending") {
      // For pending requests, allow editing
      const initialTests = request.tests.map((test) => ({
        testId: test.testId,
        quantity: 1,
      }));
      setSelectedTests(initialTests);
    }
  };

  // Add a function to handle editing a lab request
  const handleEditLabRequest = (requestId: string) => {
    const request = getLabRequestById(requestId);
    if (!request || request.status !== "pending") return;

    setIsEditMode(true);
  };

  // Add a function to save edited lab request
  const handleSaveEditedLabRequest = async () => {
    if (!selectedRequest) return;

    const request = getLabRequestById(selectedRequest);
    if (!request || request.status !== "pending") return;

    setIsSubmitting(true);

    try {
      // Validate test selection
      const validTests = selectedTests.filter(
        (item) => item.testId && item.quantity > 0
      );
      if (validTests.length === 0) {
        toast({
          title: "No tests selected",
          description: "Please select at least one test.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Get selected tests
      const selectedLabTests = validTests.map((item) => {
        const test = getActiveLabTests().find((t) => t.id === item.testId);
        if (!test) throw new Error(`Test with ID ${item.testId} not found`);
        return {
          test,
          quantity: item.quantity,
        };
      });

      // Create updated tests array
      const updatedTests = selectedLabTests.flatMap(({ test, quantity }) =>
        Array(quantity)
          .fill(0)
          .map(() => ({
            id: `TEST-ITEM-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 9)}`,
            testId: test.id,
            name: test.name,
            price: test.price,
            normalRange: test.normalRange,
            unit: test.unit,
            paymentStatus: "pending" as "pending" | "paid",
          }))
      );

      // Update the request
      const updatedRequest = {
        ...request,
        tests: updatedTests,
      };

      updateLabRequest(updatedRequest);
      setIsEditMode(false);

      toast({
        title: "Lab request updated",
        description: "The lab request has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to update lab request",
        description:
          "There was an error updating the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle viewing patient details
  const handleViewPatientDetails = (patientId: string) => {
    setSelectedPatient(patientId);
    setSelectedRequest(null);
    setIsEditMode(false);
  };

  // Handle creating lab request from doctor's orders
  const handleCreateLabRequestFromDoctorOrders = (patientId: string) => {
    const patient = getPatientById(patientId);
    if (!patient || !patient.visits || patient.visits.length === 0) return;

    const latestVisit = patient.visits[patient.visits.length - 1];

    // Extract lab tests from doctor's orders
    const doctorLabTests = latestVisit.labTests || [];

    // Create initial test selection with doctor's ordered tests
    const initialTests: Array<{ testId: string; quantity: number }> = [];

    // If doctor specified lab tests, try to match them with available tests
    if (doctorLabTests.length > 0) {
      const activeTests = getActiveLabTests();

      // For each doctor-ordered test, try to find a matching test in the system
      doctorLabTests.forEach((doctorTest) => {
        const matchingTest = activeTests.find((test) =>
          test.name.toLowerCase().includes(doctorTest.name.toLowerCase())
        );

        if (matchingTest) {
          initialTests.push({ testId: matchingTest.id, quantity: 1 });
        }
      });
    }

    // If no tests were matched, start with one empty selection
    if (initialTests.length === 0) {
      initialTests.push({ testId: "", quantity: 1 });
    }

    setSelectedTests(initialTests);
    setSelectedPatient(patientId);
    setSelectedRequest(null);
    setIsEditMode(true);
  };

  // Handle opening manual test selection dialog
  const handleOpenManualTestDialog = (patientId: string) => {
    setSelectedPatientForTests(patientId);
    setManualTestSelection([{ testId: "", quantity: 1 }]);
    setIsManualTestDialogOpen(true);
  };

  // Handle adding a test to manual selection
  const handleAddTestToSelection = () => {
    setManualTestSelection([
      ...manualTestSelection,
      { testId: "", quantity: 1 },
    ]);
  };

  // Handle removing a test from manual selection
  const handleRemoveTestFromSelection = (index: number) => {
    const newSelection = [...manualTestSelection];
    newSelection.splice(index, 1);
    setManualTestSelection(newSelection);
  };

  // Handle test selection change
  const handleTestSelectionChange = (index: number, testId: string) => {
    const newSelection = [...manualTestSelection];
    newSelection[index].testId = testId;
    setManualTestSelection(newSelection);
  };

  // Handle quantity change
  const handleManualTestQuantityChange = (index: number, quantity: number) => {
    const newSelection = [...manualTestSelection];
    newSelection[index].quantity = quantity;
    setManualTestSelection(newSelection);
  };

  // Handle creating a lab request with manually selected tests
  const handleCreateManualLabRequest = async () => {
    if (!selectedPatientForTests) {
      toast({
        title: "Error",
        description: "No patient selected.",
        variant: "destructive",
      });
      return;
    }

    // Validate test selection
    const validTests = manualTestSelection.filter(
      (item) => item.testId && item.quantity > 0
    );
    if (validTests.length === 0) {
      toast({
        title: "No tests selected",
        description: "Please select at least one test.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const patient = getPatientById(selectedPatientForTests);

    if (!patient) {
      toast({
        title: "Error",
        description: "Patient not found.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Get the latest visit or create a placeholder
      const latestVisit =
        patient.visits && patient.visits.length > 0
          ? patient.visits[patient.visits.length - 1]
          : null;

      // Get selected tests
      const selectedLabTests = validTests.map((item) => {
        const test = getActiveLabTests().find((t) => t.id === item.testId);
        if (!test) throw new Error(`Test with ID ${item.testId} not found`);
        return {
          test,
          quantity: item.quantity,
        };
      });

      // Create lab request
      const newRequest = {
        id: generateLabRequestId(),
        patientId: patient.id,
        patientName: patient.name,
        doctorName: latestVisit
          ? latestVisit.doctor
          : user?.name || "Lab Staff",
        date: new Date().toISOString().split("T")[0],
        status: "pending" as "pending" | "billed",
        tests: selectedLabTests.flatMap(({ test, quantity }) =>
          Array(quantity)
            .fill(0)
            .map(() => ({
              id: `TEST-ITEM-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 9)}`,
              testId: test.id,
              name: test.name,
              price: test.price,
              normalRange: test.normalRange,
              unit: test.unit,
              paymentStatus: "pending" as "pending" | "paid",
            }))
        ),
        doctorPrescriptions:
          latestVisit && latestVisit.diagnosis.startsWith("With Laboratory:")
            ? [latestVisit.diagnosis.split(": ")[1]]
            : [],
      };

      // Add lab request to store
      addLabRequest(newRequest);
      setSelectedRequest(newRequest.id);
      setIsManualTestDialogOpen(false);
      setIsPatientDetailsOpen(false);

      // For HMO patients, show different message
      if (patient.patientType === "hmo") {
        toast({
          title: "Lab request created for HMO patient",
          description:
            "The lab request has been sent to HMO desk for approval.",
        });
      } else {
        toast({
          title: "Lab request created",
          description:
            "The lab request has been created successfully. Send to cash point for payment.",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to create lab request",
        description:
          "There was an error processing the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle sending to cash point
  const handleSendToCashPoint = async (requestId: string) => {
    setIsSubmitting(true);
    const request = getLabRequestById(requestId);

    if (!request) {
      toast({
        title: "Error",
        description: "Request not found.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Check if patient is HMO
      const patient = getPatientById(request.patientId);
      if (patient && patient.patientType === "hmo") {
        // For HMO patients, update the request status to billed
        // but don't mark as paid - it will go to HMO desk for approval
        const updatedRequest = {
          ...request,
          status: "billed" as const,
        };

        updateLabRequest(updatedRequest);
        setSelectedRequest(updatedRequest.id);

        toast({
          title: "HMO Patient",
          description: "Lab request has been sent to HMO desk for approval.",
        });
      } else {
        // For cash patients, create a bill
        const billId = generateBillId();
        const billItems = request.tests.map((test) => ({
          id: `BILL-ITEM-${Date.now()}-${test.id}`,
          description: test.name,
          quantity: 1,
          unitPrice: test.price,
        }));

        // Add bill to store
        addBill({
          id: billId,
          patientId: request.patientId,
          patientName: request.patientName,
          date: new Date().toISOString().split("T")[0],
          status: "pending",
          type: "laboratory",
          items: billItems,
        });

        // Update lab request status to billed
        const updatedRequest = {
          ...request,
          status: "billed" as const,
          tests: request.tests.map((test) => ({
            ...test,
            billId,
          })),
        };

        updateLabRequest(updatedRequest);
        setSelectedRequest(updatedRequest.id);

        toast({
          title: "Sent to Cash Point",
          description:
            "The lab tests have been sent to Cash Point for payment.",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to process request",
        description:
          "There was an error processing the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle starting test
  const handleStartTest = async (requestId: string) => {
    setIsSubmitting(true);
    const request = getLabRequestById(requestId);

    if (!request) {
      toast({
        title: "Error",
        description: "Request not found.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update request status to in_progress
      const updatedRequest = {
        ...request,
        status: "in_progress" as const,
      };

      updateLabRequest(updatedRequest);
      setSelectedRequest(updatedRequest.id);

      // Initialize test results
      const initialResults: Record<string, string> = {};
      request.tests.forEach((test) => {
        initialResults[test.id] = "";
      });
      setTestResults(initialResults);
      setResultsNotes("");

      toast({
        title: "Test started",
        description: "You can now enter the test results.",
      });
    } catch (error) {
      toast({
        title: "Failed to start test",
        description:
          "There was an error processing the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle result change
  const handleResultChange = (testId: string, value: string) => {
    setTestResults((prev) => ({
      ...prev,
      [testId]: value,
    }));
  };

  // Add a function to check if a value is abnormal
  const isAbnormalValue = (value: string, normalRange?: string): boolean => {
    if (
      !normalRange ||
      !value ||
      normalRange.toLowerCase().includes("negative") ||
      normalRange.toLowerCase().includes("reactive") ||
      normalRange.includes(",")
    ) {
      return false;
    }

    // Try to parse as number for range comparison
    const numericValue = Number.parseFloat(value);
    if (isNaN(numericValue)) return false;

    // Handle ranges like "10-20" or "<10" or ">10"
    if (normalRange.includes("-")) {
      const [min, max] = normalRange
        .split("-")
        .map((v) => Number.parseFloat(v.trim()));
      return numericValue < min || numericValue > max;
    } else if (normalRange.startsWith("<")) {
      const max = Number.parseFloat(normalRange.substring(1).trim());
      return numericValue >= max;
    } else if (normalRange.startsWith(">")) {
      const min = Number.parseFloat(normalRange.substring(1).trim());
      return numericValue <= min;
    }

    return false;
  };

  // Add a function to handle parameter result changes
  const handleParameterResultChange = (
    testId: string,
    paramName: string,
    value: string
  ) => {
    setParameterResults((prev) => ({
      ...prev,
      [testId]: {
        ...(prev[testId] || {}),
        [paramName]: value,
      },
    }));
  };

  // Handle submit results
  const handleSubmitResults = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    const request = getLabRequestById(selectedRequest);

    if (!request) {
      toast({
        title: "Error",
        description: "Request not found.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update tests with results
      const updatedTests = request.tests.map((test) => {
        const labTest = getActiveLabTests().find((t) => t.id === test.testId);

        // If this test has parameters and we have parameter results
        if (
          labTest?.ranges &&
          labTest.ranges.length > 0 &&
          parameterResults[test.id]
        ) {
          const testParamResults = parameterResults[test.id];
          const paramResults = Object.keys(testParamResults).map(
            (paramName) => {
              const range = labTest.ranges?.find((r) => r.name === paramName);
              const value = testParamResults[paramName];

              return {
                id: `${test.id}-${paramName
                  .replace(/\s+/g, "-")
                  .toLowerCase()}`,
                testId: test.testId,
                name: paramName,
                result: value,
                normalRange: range?.normalRange || "",
                unit: range?.unit,
                isAbnormal: isAbnormalValue(value, range?.normalRange),
                category: range?.category,
              };
            }
          );

          return {
            ...test,
            result: "See detailed parameters",
            parameterResults: paramResults,
          };
        } else {
          // For tests without parameters, use the regular result
          return {
            ...test,
            result: testResults[test.id] || "",
          };
        }
      });

      // Update request status to completed
      const updatedRequest = {
        ...request,
        status: "completed" as const,
        tests: updatedTests,
        results: resultsNotes,
      };

      updateLabRequest(updatedRequest);
      setSelectedRequest(updatedRequest.id);

      toast({
        title: "Results sent to doctor",
        description: "The test results have been saved and sent to the doctor.",
      });
    } catch (error) {
      toast({
        title: "Failed to submit results",
        description:
          "There was an error processing the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle creating a new lab request
  const handleCreateLabRequest = (patientId: string) => {
    const patient = getPatientById(patientId);
    if (!patient) return;

    // Get the latest visit
    const latestVisit =
      patient.visits && patient.visits.length > 0
        ? patient.visits[patient.visits.length - 1]
        : null;

    if (!latestVisit) return;

    // Reset selected tests
    setSelectedTests([]);
    setIsTestSelectionOpen(true);
  };

  // Handle test selection
  const handleTestSelection = (testId: string) => {
    setSelectedTests((prev) => {
      if (prev.some((item) => item.testId === testId)) {
        return prev.filter((item) => item.testId !== testId);
      } else {
        return [...prev, { testId, quantity: 1 }];
      }
    });
  };

  // Handle submitting selected tests
  const handleSubmitSelectedTests = async (patientId: string) => {
    if (selectedTests.length === 0) {
      toast({
        title: "No tests selected",
        description: "Please select at least one test.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const patient = getPatientById(patientId);

    if (!patient) {
      toast({
        title: "Error",
        description: "Patient not found.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get the latest visit
      const latestVisit =
        patient.visits && patient.visits.length > 0
          ? patient.visits[patient.visits.length - 1]
          : null;

      if (!latestVisit) {
        throw new Error("No visit found for patient");
      }

      // Get selected tests
      const selectedLabTests = getActiveLabTests().filter((test) =>
        selectedTests.some((item) => item.testId === test.id)
      );

      // Create lab request
      const newRequest = {
        id: generateLabRequestId(),
        patientId: patient.id,
        patientName: patient.name,
        doctorName: latestVisit.doctor,
        date: new Date().toISOString().split("T")[0],
        status: "pending" as "pending" | "billed",
        tests: selectedLabTests.map((test) => ({
          id: `TEST-ITEM-${Date.now()}-${test.id}`,
          testId: test.id,
          name: test.name,
          price: test.price,
          normalRange: test.normalRange,
          unit: test.unit,
          paymentStatus: "pending" as "pending" | "paid",
        })),
        doctorPrescriptions: latestVisit.diagnosis.startsWith(
          "With Laboratory:"
        )
          ? [latestVisit.diagnosis.split(": ")[1]]
          : [],
      };

      // Add lab request to store
      addLabRequest(newRequest);
      setSelectedRequest(newRequest.id);
      setIsTestSelectionOpen(false);

      // For HMO patients, show different message
      if (patient.patientType === "hmo") {
        toast({
          title: "Lab request created for HMO patient",
          description:
            "The lab request has been sent to HMO desk for approval.",
        });
      } else {
        toast({
          title: "Lab request created",
          description:
            "The lab request has been created successfully. Send to cash point for payment.",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to create lab request",
        description:
          "There was an error processing the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTest = () => {
    setSelectedTests([...selectedTests, { testId: "", quantity: 1 }]);
  };

  const handleTestChange = (index: number, testId: string) => {
    const newTests = [...selectedTests];
    newTests[index].testId = testId;
    setSelectedTests(newTests);
  };

  const handleSelectedTestQuantityChange = (
    index: number,
    quantity: number
  ) => {
    const newTests = [...selectedTests];
    newTests[index].quantity = quantity;
    setSelectedTests(newTests);
  };

  const handleRemoveTest = (index: number) => {
    const newTests = [...selectedTests];
    newTests.splice(index, 1);
    setSelectedTests(newTests);
  };

  const handleCreateLabRequestSubmit = async () => {
    if (!selectedPatient) return;

    // Validate test selection
    const validTests = selectedTests.filter(
      (item) => item.testId && item.quantity > 0
    );
    if (validTests.length === 0) {
      toast({
        title: "No tests selected",
        description: "Please select at least one test.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const patient = getPatientById(selectedPatient);

    if (!patient) {
      toast({
        title: "Error",
        description: "Patient not found.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Get the latest visit or create a placeholder
      const latestVisit =
        patient.visits && patient.visits.length > 0
          ? patient.visits[patient.visits.length - 1]
          : null;

      // Get selected tests
      const selectedLabTests = validTests.map((item) => {
        const test = getActiveLabTests().find((t) => t.id === item.testId);
        if (!test) throw new Error(`Test with ID ${item.testId} not found`);
        return {
          test,
          quantity: item.quantity,
        };
      });

      // Create lab request
      const newRequest = {
        id: generateLabRequestId(),
        patientId: patient.id,
        patientName: patient.name,
        doctorName: latestVisit
          ? latestVisit.doctor
          : user?.name || "Lab Staff",
        date: new Date().toISOString().split("T")[0],
        status: "pending" as "pending" | "billed",
        tests: selectedLabTests.flatMap(({ test, quantity }) =>
          Array(quantity)
            .fill(0)
            .map(() => ({
              id: `TEST-ITEM-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 9)}`,
              testId: test.id,
              name: test.name,
              price: test.price,
              normalRange: test.normalRange,
              unit: test.unit,
              paymentStatus: "pending" as "pending" | "paid",
            }))
        ),
        doctorPrescriptions:
          latestVisit && latestVisit.diagnosis.startsWith("With Laboratory:")
            ? [latestVisit.diagnosis.split(": ")[1]]
            : [],
      };

      // Add lab request to store
      addLabRequest(newRequest);
      setSelectedRequest(newRequest.id);
      setSelectedPatient(null);
      setIsEditMode(false);

      // For HMO patients, show different message
      if (patient.patientType === "hmo") {
        toast({
          title: "Lab request created for HMO patient",
          description:
            "The lab request has been sent to HMO desk for approval.",
        });
      } else {
        toast({
          title: "Lab request created",
          description:
            "The lab request has been created successfully. Send to cash point for payment.",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to create lab request",
        description:
          "There was an error processing the request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTest = async () => {
    if (!selectedRequest || !testResults) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update the lab request with results and mark as completed
      const request = getLabRequestById(selectedRequest);

      if (!request) {
        toast({
          title: "Error",
          description: "Request not found.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const updatedRequest = {
        ...request,
        status: "completed" as const,
        tests: request.tests.map((test) => ({
          ...test,
          result: testResults[test.id] || "",
        })),
        results: resultsNotes,
        completedAt: new Date().toISOString(),
        completedBy: user?.name || "Lab Technician",
      };

      updateLabRequest(updatedRequest);

      // Get the patient
      const patient = getPatientById(request.patientId);

      if (patient) {
        // For HMO patients, update the diagnosis to "With HMO Desk"
        if (patient.patientType === "hmo") {
          // Get the latest visit
          const latestVisit =
            patient.visits && patient.visits.length > 0
              ? patient.visits[patient.visits.length - 1]
              : null;

          if (latestVisit) {
            // Create a copy of the visits array
            const updatedVisits = [...(patient.visits || [])];
            const latestVisitIndex = updatedVisits.length - 1;

            // Update the diagnosis
            updatedVisits[latestVisitIndex] = {
              ...updatedVisits[latestVisitIndex],
              diagnosis: `With HMO: ${
                updatedVisits[latestVisitIndex].diagnosis.split(": ")[1]
              }`,
            };

            // Update the patient
            updatePatient({
              ...patient,
              visits: updatedVisits,
            });
          }
        }
      }

      // Clear the form and selected request
      setTestResults({});
      setSelectedRequest(null);

      toast({
        title: "Test completed",
        description:
          patient?.patientType === "hmo"
            ? "Results saved and patient sent to HMO desk for claim processing."
            : "Test results have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save test results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laboratory</h1>
            <p className="text-muted-foreground">
              Manage lab tests and results
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push("/laboratory/tests")}>
              <Plus className="mr-2 h-4 w-4" />
              Manage Tests
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
                {searchSuggestions.map((request) => (
                  <div
                    key={request.id}
                    className="px-4 py-2 hover:bg-white cursor-pointer"
                    onClick={() => handleSelectSuggestion(request)}
                  >
                    <div className="font-medium">{request.patientName}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {request.patientId} • Request: {request.id}
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
                <TabsTrigger value="billed">Billed</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-4">
                {paginateRequests(pendingRequests).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No pending requests
                    </CardContent>
                  </Card>
                ) : (
                  paginateRequests(pendingRequests).map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {request.patientName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {request.patientId} • Request: {request.id}
                            </p>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {request.date}
                          </div>
                        </div>
                        <p className="text-sm mb-1">
                          Doctor: {request.doctorName}
                        </p>
                        <p className="text-sm mb-3">
                          Tests: {request.tests.length}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => handleViewRequest(request.id)}
                          >
                            View Tests
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => handleSendToCashPoint(request.id)}
                            disabled={isSubmitting}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Send to Cash Point
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                <PaginationControls requests={pendingRequests} />

                {/* Patients with lab requests from doctor but no lab request created yet */}
                {patientsWithLabRequests.filter(
                  (patient) =>
                    !labRequests.some((req) => req.patientId === patient.id)
                ).length > 0 && (
                  <>
                    <div className="mt-6 mb-2">
                      <h3 className="text-lg font-medium">
                        Patients Awaiting Lab Tests
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        These patients have been sent from the doctor for lab
                        tests
                      </p>
                    </div>
                    {patientsWithLabRequests
                      .filter(
                        (patient) =>
                          !labRequests.some(
                            (req) => req.patientId === patient.id
                          )
                      )
                      .map((patient) => (
                        <Card key={patient.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {patient.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  ID: {patient.id}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-800"
                              >
                                New
                              </Badge>
                            </div>
                            <p className="text-sm mb-1">
                              Doctor:{" "}
                              {patient.visits && patient.visits.length > 0
                                ? patient.visits[patient.visits.length - 1]
                                    .doctor
                                : "Unknown"}
                            </p>
                            <p className="text-sm mb-1">
                              Diagnosis:{" "}
                              {patient.visits && patient.visits.length > 0
                                ? patient.visits[
                                    patient.visits.length - 1
                                  ].diagnosis.startsWith("With Laboratory:")
                                  ? patient.visits[
                                      patient.visits.length - 1
                                    ].diagnosis.split(": ")[1]
                                  : patient.visits[patient.visits.length - 1]
                                      .diagnosis
                                : "Unknown"}
                            </p>
                            {patient.visits &&
                              patient.visits.length > 0 &&
                              (() => {
                                const latestVisit =
                                  patient.visits[patient.visits.length - 1];
                                return (
                                  latestVisit.labTests &&
                                  latestVisit.labTests.length > 0 && (
                                    <div className="mb-3">
                                      <p className="text-sm font-medium">
                                        Doctor's Requested Tests:
                                      </p>
                                      <ul className="text-sm list-disc pl-5">
                                        {latestVisit.labTests.map(
                                          (test, index) => (
                                            <li key={index}>{test.name}</li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )
                                );
                              })()}
                            <div className="flex space-x-2">
                              <Button
                                className="flex-1"
                                onClick={() =>
                                  handleViewPatientDetails(patient.id)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Button>
                              <Button
                                className="flex-1"
                                variant="outline"
                                onClick={() =>
                                  handleCreateLabRequestFromDoctorOrders(
                                    patient.id
                                  )
                                }
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Process Tests
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </>
                )}

                {/* Button to create a new lab request manually */}
                <div className="flex justify-center mt-4">
                  <Button onClick={() => setIsManualTestDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Lab Request
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="billed" className="space-y-4 mt-4">
                {paginateRequests(billedRequests).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No billed requests
                    </CardContent>
                  </Card>
                ) : (
                  paginateRequests(billedRequests).map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {request.patientName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {request.patientId} • Request: {request.id}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              request.tests.every(
                                (test: { paymentStatus: string }) =>
                                  test.paymentStatus === "paid"
                              )
                                ? "bg-green-50 text-green-800"
                                : "bg-yellow-50 text-yellow-800"
                            }
                          >
                            {request.tests.every(
                              (test: { paymentStatus: string }) =>
                                test.paymentStatus === "paid"
                            )
                              ? "Paid"
                              : "Awaiting Payment"}
                          </Badge>
                        </div>
                        <p className="text-sm mb-1">
                          Doctor: {request.doctorName}
                        </p>
                        <p className="text-sm mb-1">
                          Total: ₦
                          {request.tests
                            .reduce(
                              (sum: number, test: { price: number }) =>
                                sum + test.price,
                              0
                            )
                            .toLocaleString()}
                        </p>
                        <Button
                          className="w-full mt-3"
                          variant={
                            request.tests.every(
                              (test: { paymentStatus: string }) =>
                                test.paymentStatus === "paid"
                            )
                              ? "default"
                              : "outline"
                          }
                          onClick={() => handleViewRequest(request.id)}
                          disabled={
                            !request.tests.every(
                              (test: { paymentStatus: string }) =>
                                test.paymentStatus === "paid"
                            )
                          }
                        >
                          {request.tests.every(
                            (test: { paymentStatus: string }) =>
                              test.paymentStatus === "paid"
                          )
                            ? "Start Tests"
                            : "Awaiting Payment"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
                <PaginationControls requests={billedRequests} />
              </TabsContent>

              <TabsContent value="in_progress" className="space-y-4 mt-4">
                {paginateRequests(inProgressRequests).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No tests in progress
                    </CardContent>
                  </Card>
                ) : (
                  paginateRequests(inProgressRequests).map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {request.patientName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {request.patientId} • Request: {request.id}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-800"
                          >
                            In Progress
                          </Badge>
                        </div>
                        <p className="text-sm mb-1">
                          Doctor: {request.doctorName}
                        </p>
                        <p className="text-sm mb-1">
                          Tests: {request.tests.length}
                        </p>
                        <Button
                          className="w-full mt-3"
                          onClick={() => handleViewRequest(request.id)}
                        >
                          Enter Results
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
                <PaginationControls requests={inProgressRequests} />
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-4">
                {paginateRequests(completedRequests).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No completed tests
                    </CardContent>
                  </Card>
                ) : (
                  paginateRequests(completedRequests).map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {request.patientName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {request.patientId} • Request: {request.id}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-800"
                          >
                            Completed
                          </Badge>
                        </div>
                        <p className="text-sm mb-1">
                          Doctor: {request.doctorName}
                        </p>
                        <p className="text-sm mb-1">Date: {request.date}</p>
                        <Button
                          className="w-full mt-3"
                          variant="outline"
                          onClick={() => handleViewRequest(request.id)}
                        >
                          View Results
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
                <PaginationControls requests={completedRequests} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-2">
            {selectedRequest ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Lab Request #{selectedRequest}</CardTitle>
                      <CardDescription>
                        Patient:{" "}
                        {getLabRequestById(selectedRequest)?.patientName} (ID:{" "}
                        {getLabRequestById(selectedRequest)?.patientId})
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(null)}
                      >
                        Back to List
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                    const request = getLabRequestById(selectedRequest);
                    if (!request) return null;

                    return (
                      <>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Doctor
                            </p>
                            <p>{request.doctorName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Date
                            </p>
                            <p>{request.date}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Status
                            </p>
                            <Badge
                              variant="outline"
                              className={
                                request.status === "completed"
                                  ? "bg-green-50 text-green-800"
                                  : request.status === "billed"
                                  ? "bg-yellow-50 text-yellow-800"
                                  : request.status === "in_progress"
                                  ? "bg-blue-50 text-blue-800"
                                  : "bg-gray-50 text-gray-800"
                              }
                            >
                              {request.status === "billed"
                                ? request.tests.every(
                                    (test) => test.paymentStatus === "paid"
                                  )
                                  ? "Paid"
                                  : "Awaiting Payment"
                                : request.status.charAt(0).toUpperCase() +
                                  request.status.slice(1).replace("_", " ")}
                            </Badge>
                          </div>
                        </div>

                        {request.doctorPrescriptions &&
                          request.doctorPrescriptions.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold mb-2">
                                Doctor's Notes
                              </h3>
                              <div className="p-4 bg-white border rounded-md">
                                <ul className="list-disc pl-5 space-y-1">
                                  {request.doctorPrescriptions.map(
                                    (note, index) => (
                                      <li key={index}>{note}</li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}

                        <div>
                          <h3 className="text-lg font-semibold mb-3">Tests</h3>
                          {isEditMode && request.status === "pending" ? (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">
                                  Edit tests for this request
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleAddTest}
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Add Test
                                </Button>
                              </div>

                              {selectedTests.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2 p-3 border rounded-md"
                                >
                                  <div className="flex-1">
                                    <Select
                                      value={item.testId}
                                      onValueChange={(value) =>
                                        handleTestChange(index, value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a test" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getActiveLabTests().map((test) => (
                                          <SelectItem
                                            key={test.id}
                                            value={test.id}
                                          >
                                            {test.name} - ₦
                                            {test.price.toLocaleString()}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="w-20">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleSelectedTestQuantityChange(
                                          index,
                                          Number.parseInt(e.target.value) || 1
                                        )
                                      }
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveTest(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}

                              <div className="pt-2 text-right">
                                <p className="text-sm font-medium">
                                  Total:{" "}
                                  {formatCurrency(
                                    selectedTests.reduce((sum, item) => {
                                      const test = getActiveLabTests().find(
                                        (t) => t.id === item.testId
                                      );
                                      return (
                                        sum +
                                        (test ? test.price * item.quantity : 0)
                                      );
                                    }, 0)
                                  )}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Test Name</TableHead>
                                  {(request.status === "pending" ||
                                    request.status === "billed") && (
                                    <TableHead className="text-right">
                                      Price (₦)
                                    </TableHead>
                                  )}
                                  {request.status === "billed" && (
                                    <TableHead>Payment Status</TableHead>
                                  )}
                                  {request.status === "in_progress" && (
                                    <>
                                      {/* <TableHead>Normal Range</TableHead> */}
                                      <TableHead>Result</TableHead>
                                    </>
                                  )}
                                  {request.status === "completed" && (
                                    <>
                                      {/* <TableHead>Normal Range</TableHead> */}
                                      <TableHead>Result</TableHead>
                                    </>
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {request.tests.map((test) => (
                                  <TableRow key={test.id}>
                                    <TableCell className="font-medium">
                                      {test.name}
                                    </TableCell>
                                    {(request.status === "pending" ||
                                      request.status === "billed") && (
                                      <TableCell className="text-right">
                                        {test.price.toLocaleString()}
                                      </TableCell>
                                    )}
                                    {request.status === "billed" && (
                                      <TableCell>
                                        <Badge
                                          variant="outline"
                                          className={
                                            test.paymentStatus === "paid"
                                              ? "bg-green-50 text-green-800"
                                              : "bg-yellow-50 text-yellow-800"
                                          }
                                        >
                                          {test.paymentStatus === "paid"
                                            ? "Paid"
                                            : "Pending"}
                                        </Badge>
                                      </TableCell>
                                    )}
                                    {request.status === "in_progress" && (
                                      <>
                                        {/* <TableCell>
                                          {test.normalRange || "Not specified"}
                                        </TableCell> */}
                                        <TableCell>
                                          {(() => {
                                            const labTest =
                                              getActiveLabTests().find(
                                                (t) => t.id === test.testId
                                              );

                                            // If this test has parameters/ranges
                                            if (
                                              labTest?.ranges &&
                                              labTest.ranges.length > 0
                                            ) {
                                              return (
                                                <div className="space-y-2">
                                                  {labTest.ranges.map(
                                                    (range, idx) => (
                                                      <div
                                                        key={idx}
                                                        className="flex flex-col space-y-1"
                                                      >
                                                        <div className="flex justify-between">
                                                          <Label className="text-xs">
                                                            {range.name}
                                                          </Label>
                                                          <span className="text-xs text-muted-foreground">
                                                            {range.normalRange}{" "}
                                                            {range.unit &&
                                                              `(${range.unit})`}
                                                          </span>
                                                        </div>
                                                        <Input
                                                          value={
                                                            parameterResults[
                                                              test.id
                                                            ]?.[range.name] ||
                                                            ""
                                                          }
                                                          onChange={(e) =>
                                                            handleParameterResultChange(
                                                              test.id,
                                                              range.name,
                                                              e.target.value
                                                            )
                                                          }
                                                          placeholder={`Enter ${range.name}`}
                                                          className="h-8"
                                                        />
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              );
                                            } else {
                                              // For tests without parameters
                                              return (
                                                <Input
                                                  value={
                                                    testResults[test.id] || ""
                                                  }
                                                  onChange={(e) =>
                                                    handleResultChange(
                                                      test.id,
                                                      e.target.value
                                                    )
                                                  }
                                                  placeholder="Enter result"
                                                />
                                              );
                                            }
                                          })()}
                                        </TableCell>
                                      </>
                                    )}
                                    {request.status === "completed" && (
                                      <>
                                        <TableCell>
                                          {test.normalRange || "Not specified"}
                                        </TableCell>
                                        <TableCell>
                                          {(() => {
                                            // If this test has parameter results
                                            if (
                                              test.parameterResults &&
                                              test.parameterResults.length > 0
                                            ) {
                                              return (
                                                <div className="space-y-1">
                                                  {test.parameterResults.map(
                                                    (param, idx) => (
                                                      <div
                                                        key={idx}
                                                        className="flex justify-between text-sm"
                                                      >
                                                        <span className="font-medium">
                                                          {param.name}:
                                                        </span>
                                                        <span
                                                          className={
                                                            param.isAbnormal
                                                              ? "text-red-600 font-medium"
                                                              : ""
                                                          }
                                                        >
                                                          {param.result}{" "}
                                                          {param.unit &&
                                                            `${param.unit}`}
                                                          {param.isAbnormal &&
                                                            " (Abnormal)"}
                                                        </span>
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              );
                                            } else {
                                              // For tests without parameter results
                                              return test.result || "N/A";
                                            }
                                          })()}
                                        </TableCell>
                                      </>
                                    )}
                                  </TableRow>
                                ))}
                                {(request.status === "pending" ||
                                  request.status === "billed") && (
                                  <TableRow>
                                    <TableCell className="text-right font-semibold">
                                      Total
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                      ₦
                                      {request.tests
                                        .reduce(
                                          (sum: number, test) =>
                                            sum + test.price,
                                          0
                                        )
                                        .toLocaleString()}
                                    </TableCell>
                                    {request.status === "billed" && (
                                      <TableCell></TableCell>
                                    )}
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          )}
                        </div>

                        {request.status === "in_progress" && (
                          <div className="space-y-2">
                            <Label htmlFor="notes">
                              Additional Notes / Interpretation
                            </Label>
                            <Textarea
                              id="notes"
                              value={resultsNotes}
                              onChange={(e) => setResultsNotes(e.target.value)}
                              placeholder="Enter any additional notes or interpretation of results..."
                              className="min-h-[100px]"
                            />
                          </div>
                        )}

                        {request.status === "completed" && request.results && (
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold">
                              Notes & Interpretation
                            </h3>
                            <div className="p-4 bg-white border rounded-md whitespace-pre-line">
                              {request.results}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedRequest(null);
                      setIsEditMode(false);
                    }}
                  >
                    Back
                  </Button>

                  {(() => {
                    const request = getLabRequestById(selectedRequest);
                    if (!request) return null;

                    if (isEditMode && request.status === "pending") {
                      return (
                        <Button
                          onClick={handleSaveEditedLabRequest}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                      );
                    }

                    if (request.status === "pending") {
                      return (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleEditLabRequest(request.id)}
                            className="mr-2"
                          >
                            Edit Tests
                          </Button>
                          <Button
                            onClick={() => handleSendToCashPoint(request.id)}
                            disabled={isSubmitting}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            {isSubmitting
                              ? "Processing..."
                              : "Send to Cash Point"}
                          </Button>
                        </>
                      );
                    }

                    if (
                      request.status === "billed" &&
                      request.tests.every(
                        (test) => test.paymentStatus === "paid"
                      )
                    ) {
                      return (
                        <Button
                          onClick={() => handleStartTest(request.id)}
                          disabled={isSubmitting}
                        >
                          <Flask className="mr-2 h-4 w-4" />
                          {isSubmitting ? "Processing..." : "Start Tests"}
                        </Button>
                      );
                    }

                    if (request.status === "in_progress") {
                      return (
                        <Button
                          onClick={handleSubmitResults}
                          disabled={isSubmitting}
                        >
                          <ArrowRightCircle className="mr-2 h-4 w-4" />
                          {isSubmitting
                            ? "Sending..."
                            : "Send Results to Doctor"}
                        </Button>
                      );
                    }

                    if (request.status === "completed") {
                      return (
                        <Button
                          variant="outline"
                          onClick={() => {
                            // In a real app, this would trigger a print or download
                            toast({
                              title: "Print triggered",
                              description:
                                "In a real app, this would print or download the results.",
                            });
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Print Results
                        </Button>
                      );
                    }

                    return null;
                  })()}
                </CardFooter>
              </Card>
            ) : selectedPatient ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        {isEditMode ? "Add Lab Tests" : "Patient Details"}
                      </CardTitle>
                      <CardDescription>
                        {getPatientById(selectedPatient)?.name} (ID:{" "}
                        {selectedPatient})
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(null);
                          setIsEditMode(false);
                        }}
                      >
                        Back to List
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                    const patient = getPatientById(selectedPatient);
                    if (!patient) return null;

                    const latestVisit =
                      patient.visits && patient.visits.length > 0
                        ? patient.visits[patient.visits.length - 1]
                        : null;

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Patient Type
                            </p>
                            <p className="font-medium capitalize">
                              {patient.patientType}{" "}
                              {patient.hmoProvider
                                ? `(${patient.hmoProvider})`
                                : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Doctor
                            </p>
                            <p className="font-medium">
                              {latestVisit?.doctor || "Not assigned"}
                            </p>
                          </div>
                        </div>

                        {latestVisit && (
                          <div className="p-4 bg-white border rounded-md">
                            <h3 className="font-semibold mb-2">
                              Doctor's Notes
                            </h3>
                            <p className="mb-2">
                              <span className="text-sm text-muted-foreground">
                                Diagnosis:{" "}
                              </span>
                              {latestVisit.diagnosis.startsWith(
                                "With Laboratory:"
                              )
                                ? latestVisit.diagnosis.split(": ")[1]
                                : latestVisit.diagnosis}
                            </p>
                            {latestVisit.notes && (
                              <p>
                                <span className="text-sm text-muted-foreground">
                                  Notes:{" "}
                                </span>
                                {latestVisit.notes}
                              </p>
                            )}
                          </div>
                        )}

                        {latestVisit &&
                          latestVisit.labTests &&
                          latestVisit.labTests.length > 0 && (
                            <div className="p-4 bg-white border rounded-md">
                              <h3 className="font-semibold mb-2">
                                Requested Lab Tests
                              </h3>
                              <ul className="list-disc pl-5 space-y-1">
                                {latestVisit.labTests.map((test, index) => (
                                  <li key={index}>{test.name}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {isEditMode && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-semibold">
                                Select Tests
                              </h3>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddTest}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add Test
                              </Button>
                            </div>

                            {selectedTests.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2 p-3 border rounded-md"
                              >
                                <div className="flex-1">
                                  <Select
                                    value={item.testId}
                                    onValueChange={(value) =>
                                      handleTestChange(index, value)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a test" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getActiveLabTests().map((test) => (
                                        <SelectItem
                                          key={test.id}
                                          value={test.id}
                                        >
                                          {test.name} - ₦
                                          {test.price.toLocaleString()}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="w-20">
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleSelectedTestQuantityChange(
                                        index,
                                        Number.parseInt(e.target.value) || 1
                                      )
                                    }
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveTest(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}

                            <div className="pt-2 text-right">
                              <p className="text-sm font-medium">
                                Total:{" "}
                                {formatCurrency(
                                  selectedTests.reduce((sum, item) => {
                                    const test = getActiveLabTests().find(
                                      (t) => t.id === item.testId
                                    );
                                    return (
                                      sum +
                                      (test ? test.price * item.quantity : 0)
                                    );
                                  }, 0)
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPatient(null);
                      setIsEditMode(false);
                    }}
                  >
                    Back
                  </Button>

                  {isEditMode ? (
                    <Button
                      onClick={handleCreateLabRequestSubmit}
                      disabled={
                        selectedTests.length === 0 ||
                        !selectedTests.some((item) => item.testId) ||
                        isSubmitting
                      }
                    >
                      {isSubmitting ? "Processing..." : "Create Lab Request"}
                    </Button>
                  ) : (
                    <Button onClick={() => setIsEditMode(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tests
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Lab Request Details</CardTitle>
                  <CardDescription>
                    Select a request or patient from the list to view details or
                    add tests
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Flask className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No request selected. Click on a request from the list to
                    view details or enter results.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Patient Details Dialog */}
      <Dialog
        open={isPatientDetailsOpen}
        onOpenChange={setIsPatientDetailsOpen}
      >
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>
              {viewingPatientId && getPatientById(viewingPatientId)
                ? `View details for ${getPatientById(viewingPatientId)?.name}`
                : "Patient information"}
            </DialogDescription>
          </DialogHeader>

          {viewingPatientId && (
            <div className="space-y-4">
              {(() => {
                const patient = getPatientById(viewingPatientId);
                if (!patient) return <p>Patient not found</p>;

                const latestVisit =
                  patient.visits && patient.visits.length > 0
                    ? patient.visits[patient.visits.length - 1]
                    : null;

                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{patient.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ID</p>
                        <p className="font-medium">{patient.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Age & Gender
                        </p>
                        <p className="font-medium">
                          {patient.age} years, {patient.gender}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Patient Type
                        </p>
                        <p className="font-medium capitalize">
                          {patient.patientType}{" "}
                          {patient.hmoProvider
                            ? `(${patient.hmoProvider})`
                            : ""}
                        </p>
                      </div>
                    </div>

                    {latestVisit && (
                      <>
                        <div className="border-t pt-4">
                          <h3 className="font-semibold mb-2">
                            Doctor's Information
                          </h3>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Doctor
                              </p>
                              <p>{latestVisit.doctor}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Diagnosis
                              </p>
                              <p>
                                {latestVisit.diagnosis.startsWith(
                                  "With Laboratory:"
                                )
                                  ? latestVisit.diagnosis.split(": ")[1]
                                  : latestVisit.diagnosis}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Notes
                              </p>
                              <p>{latestVisit.notes || "No notes provided"}</p>
                            </div>
                          </div>
                        </div>

                        {latestVisit.labTests &&
                          latestVisit.labTests.length > 0 && (
                            <div className="border-t pt-4">
                              <h3 className="font-semibold mb-2">
                                Requested Lab Tests
                              </h3>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Test Name</TableHead>
                                    <TableHead>Date Requested</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {latestVisit.labTests.map((test, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{test.name}</TableCell>
                                      <TableCell>{test.date}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                      </>
                    )}
                  </>
                );
              })()}

              <DialogFooter className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsPatientDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsPatientDetailsOpen(false);
                    handleCreateLabRequestFromDoctorOrders(viewingPatientId);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Process Lab Tests
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Selection Dialog */}
      <Dialog open={isTestSelectionOpen} onOpenChange={setIsTestSelectionOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Select Lab Tests</DialogTitle>
            <DialogDescription>
              Choose the laboratory tests to perform for this patient.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price (₦)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getActiveLabTests().map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTests.some(
                          (item) => item.testId === test.id
                        )}
                        onCheckedChange={() => handleTestSelection(test.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell>{test.category}</TableCell>
                    <TableCell className="text-right">
                      {test.price.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">
                Selected: {selectedTests.length}{" "}
                {selectedTests.length === 1 ? "test" : "tests"}
              </p>
              <p className="text-sm font-medium">
                Total:{" "}
                {formatCurrency(
                  getActiveLabTests()
                    .filter((test) =>
                      selectedTests.some((item) => item.testId === test.id)
                    )
                    .reduce((sum: number, test) => sum + test.price, 0)
                )}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsTestSelectionOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const patientId = patientsWithLabRequests.find(
                    (patient) =>
                      !labRequests.some((req) => req.patientId === patient.id)
                  )?.id;

                  if (patientId) {
                    handleSubmitSelectedTests(patientId);
                  }
                }}
                disabled={selectedTests.length === 0 || isSubmitting}
              >
                <Check className="mr-2 h-4 w-4" />
                {isSubmitting ? "Processing..." : "Confirm Selection"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Test Entry Dialog */}
      <Dialog
        open={isManualTestDialogOpen}
        onOpenChange={setIsManualTestDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manual Lab Test Entry</DialogTitle>
            <DialogDescription>
              {selectedPatientForTests
                ? `Create lab tests for ${
                    getPatientById(selectedPatientForTests)?.name
                  }`
                : "Select a patient and add tests manually"}
            </DialogDescription>
          </DialogHeader>

          {!selectedPatientForTests ? (
            <div className="space-y-4">
              <Label htmlFor="patientSearch">Search for a patient</Label>
              <Input
                id="patientSearch"
                placeholder="Enter patient name or ID"
                value={manualSearchTerm}
                onChange={handleManualSearchInputChange}
              />

              {manualSearchSuggestions.length > 0 && (
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  {manualSearchSuggestions.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-3 hover:bg-white cursor-pointer"
                      onClick={() => {
                        setSelectedPatientForTests(patient.id);
                        setManualSearchTerm(patient.name);
                        setManualSearchSuggestions([]);
                      }}
                    >
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {patient.id}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 border rounded-md">
                <p className="font-medium">
                  {getPatientById(selectedPatientForTests)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  ID: {selectedPatientForTests} •
                  {getPatientById(selectedPatientForTests)?.patientType ===
                  "hmo"
                    ? ` HMO Patient (${
                        getPatientById(selectedPatientForTests)?.hmoProvider
                      })`
                    : " Cash Patient"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Selected Tests</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTestToSelection}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Test
                  </Button>
                </div>

                {manualTestSelection.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-2 border rounded-md"
                  >
                    <div className="flex-1">
                      <Select
                        value={item.testId}
                        onValueChange={(value) =>
                          handleTestSelectionChange(index, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a test" />
                        </SelectTrigger>
                        <SelectContent>
                          {getActiveLabTests().map((test) => (
                            <SelectItem key={test.id} value={test.id}>
                              {test.name} - ₦{test.price.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleManualTestQuantityChange(
                            index,
                            Number.parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTestFromSelection(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {manualTestSelection.length === 0 && (
                  <div className="text-center p-4 border rounded-md text-muted-foreground">
                    No tests selected. Click "Add Test" to begin.
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-sm font-medium text-right">
                    Total:{" "}
                    {formatCurrency(
                      manualTestSelection.reduce((sum: number, item) => {
                        const test = getActiveLabTests().find(
                          (t) => t.id === item.testId
                        );
                        return sum + (test ? test.price * item.quantity : 0);
                      }, 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsManualTestDialogOpen(false);
                setSelectedPatientForTests(null);
                setManualTestSelection([{ testId: "", quantity: 1 }]);
                setManualSearchTerm("");
                setManualSearchSuggestions([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateManualLabRequest}
              disabled={
                !selectedPatientForTests ||
                manualTestSelection.length === 0 ||
                !manualTestSelection.some((item) => item.testId) ||
                isSubmitting
              }
            >
              {isSubmitting ? "Processing..." : "Create Lab Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
