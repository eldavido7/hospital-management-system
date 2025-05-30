"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/data/store";
import { useAuth } from "@/context/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/toaster";

export default function UpgradeConsultationPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [consultationType, setConsultationType] = useState<string>("");
  const [originalDoctor, setOriginalDoctor] = useState<string>("");
  const [originalDoctorName, setOriginalDoctorName] = useState<string>("");
  const [originalConsultationType, setOriginalConsultationType] =
    useState<string>("");
  const [originalConsultationTypeLabel, setOriginalConsultationTypeLabel] =
    useState<string>("");
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [priceDifference, setPriceDifference] = useState<number>(0);
  const [isUpgrade, setIsUpgrade] = useState<boolean>(true);
  const [canChange, setCanChange] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [billId, setBillId] = useState<string>("");

  const {
    getBillById,
    getStaffById,
    appointments,
    canChangeDoctor,
    getConsultationFeeByDoctorId,
    changeConsultationDoctor,
    getActiveStaffByRole,
    hospitalSettings,
    getPatientById,
  } = useAppStore();

  // Get active doctors
  const activeDoctors = getActiveStaffByRole("doctor");

  // Get consultation types from hospital settings or use defaults
  const consultationTypes = hospitalSettings.consultationTypes || [
    { value: "initial", label: "Initial Consultation" },
    { value: "follow_up", label: "Follow-up Consultation" },
    { value: "specialist", label: "Specialist Consultation" },
    { value: "emergency", label: "Emergency Consultation" },
  ];

  // Extract billId from params - handle case sensitivity
  useEffect(() => {
    console.log("Full params object:", params);

    // Check for both camelCase and lowercase versions of the parameter
    const id = params.billId || params.billid || params.BILLID || "";

    if (id) {
      // Handle if it's an array (shouldn't be, but just in case)
      const billIdValue = Array.isArray(id) ? id[0] : id;
      console.log("Extracted billId:", billIdValue);
      setBillId(billIdValue);
    } else {
      console.error("No billId found in params:", params);
      toast({
        title: "Error",
        description: "No bill ID provided. Please try again.",
        variant: "destructive",
      });
      router.push("/appointments");
    }
  }, [params, toast, router]);

  // Load bill data
  useEffect(() => {
    if (!billId || initialized) return;

    const loadData = async () => {
      setLoading(true);

      try {
        console.log("Fetching bill with ID:", billId);
        const bill = getBillById(billId);

        if (!bill) {
          console.error("Bill not found:", billId);
          toast({
            title: "Bill not found",
            description: "The requested bill could not be found.",
            variant: "destructive",
          });
          router.push("/appointments");
          return;
        }

        console.log("Found bill:", bill);

        // Check if this is a consultation bill
        if (bill.type !== "consultation") {
          console.error("Invalid bill type:", bill.type);
          toast({
            title: "Invalid bill type",
            description: "Only consultation bills can be upgraded/downgraded.",
            variant: "destructive",
          });
          router.push("/appointments");
          return;
        }

        // Check if bill is paid
        if (bill.status !== "paid") {
          console.error("Bill not paid");
          toast({
            title: "Bill not paid",
            description:
              "This bill has not been paid yet. Please edit the bill instead.",
            variant: "destructive",
          });
          router.push(`/appointments/edit-consultation/${billId}`);
          return;
        }

        // Check if doctor can be changed
        const doctorCanBeChanged = canChangeDoctor(billId);
        setCanChange(doctorCanBeChanged);

        if (!doctorCanBeChanged) {
          setErrorMessage(
            "This consultation cannot be changed because the patient has already seen the doctor."
          );
        }

        // Find the associated appointment
        const relatedAppointment = appointments.find(
          (a) => a.billId === billId
        );

        if (relatedAppointment) {
          // Set the original doctor ID and consultation type
          setOriginalDoctor(relatedAppointment.doctorId || "");
          setOriginalConsultationType(
            relatedAppointment.consultationType || "initial"
          );

          // Set the selected doctor and consultation type (for the form)
          setSelectedDoctor(relatedAppointment.doctorId || "");
          setConsultationType(relatedAppointment.consultationType || "initial");

          // Get the doctor name for display
          const doctor = getStaffById(relatedAppointment.doctorId || "");
          setOriginalDoctorName(doctor?.name || "Unknown");

          // Get the consultation type label for display
          const typeLabel =
            consultationTypes.find(
              (ct) => ct.value === relatedAppointment.consultationType
            )?.label || "Consultation";
          setOriginalConsultationTypeLabel(typeLabel);
        } else {
          console.error("Related appointment not found for bill:", billId);
        }

        // Set original price
        if (bill.items.length > 0) {
          const price = bill.items[0].unitPrice;
          setOriginalPrice(price);
          setNewPrice(price); // Initialize new price to match original
        }

        setInitialized(true);
      } catch (error) {
        console.error("Error loading bill data:", error);
        toast({
          title: "Error",
          description: "Failed to load consultation data. Please try again.",
          variant: "destructive",
        });
        router.push("/appointments");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    billId,
    getBillById,
    toast,
    router,
    appointments,
    canChangeDoctor,
    getStaffById,
    consultationTypes,
    initialized,
  ]);

  // Calculate new price when doctor or consultation type changes
  useEffect(() => {
    if (selectedDoctor) {
      try {
        const price = getConsultationFeeByDoctorId(selectedDoctor);
        setNewPrice(price);

        // Calculate price difference
        const difference = price - originalPrice;
        setPriceDifference(difference);
        setIsUpgrade(difference > 0);
      } catch (error) {
        console.error("Error calculating new price:", error);
      }
    }
  }, [selectedDoctor, getConsultationFeeByDoctorId, originalPrice]);

  // Find the handleProcessChange function and update it to properly handle the workflow
  const handleProcessChange = async () => {
    if (!selectedDoctor || !consultationType) {
      toast({
        title: "Missing information",
        description: "Please select a doctor and consultation type.",
        variant: "destructive",
      });
      return;
    }

    if (!canChange) {
      toast({
        title: "Cannot change doctor",
        description:
          "This consultation cannot be changed because the patient has already seen the doctor.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Changing doctor for bill:", billId);
      console.log("New doctor:", selectedDoctor);
      console.log("Consultation type:", consultationType);
      console.log("Is upgrade:", isUpgrade);

      // Use the centralized method to change the doctor
      const result = changeConsultationDoctor(
        billId,
        selectedDoctor,
        consultationType,
        user?.name || "Reception Staff"
      );

      if (result.success) {
        // Get the bill to check if it's paid
        const bill = getBillById(billId);

        // Get the patient to check their current position
        const patient = bill ? getPatientById(bill.patientId) : null;

        if (patient && patient.visits && patient.visits.length > 0) {
          console.log(
            "Patient current diagnosis:",
            patient.visits[patient.visits.length - 1].diagnosis
          );
        }

        toast({
          title: isUpgrade ? "Upgrade processed" : "Downgrade processed",
          description: result.message,
        });

        // Always redirect back to appointments - reception can't access billing
        router.push("/appointments");
      } else {
        toast({
          title: "Error",
          description:
            result.message || "Failed to process the change. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing change:", error);
      toast({
        title: "Error",
        description: "Failed to process the change. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              Loading consultation data...
            </h2>
            <p className="text-muted-foreground">
              Please wait while we retrieve the consultation details.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {isUpgrade ? "Upgrade" : "Downgrade"} Consultation
          </h1>
          <Button
            variant="outline"
            onClick={() => router.push("/appointments")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Appointments
          </Button>
        </div>

        {!canChange && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cannot change doctor</AlertTitle>
            <AlertDescription>
              {errorMessage ||
                "This consultation cannot be changed because the patient has already seen the doctor."}
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {isUpgrade
              ? "This will create a new bill for the price difference"
              : "This will add the price difference to the patient's balance"}
          </AlertTitle>
          <AlertDescription>
            {isUpgrade
              ? "The patient will need to pay the additional amount before seeing the new doctor."
              : "For cash patients, the difference will be added to their account balance."}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Consultation Details</CardTitle>
            <CardDescription>
              Change the doctor for this paid consultation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md space-y-2 mb-4">
              <h3 className="font-medium">Current Consultation</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Doctor:</p>
                  <p>{originalDoctorName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type:</p>
                  <p>{originalConsultationTypeLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price:</p>
                  <p>₦{originalPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor">New Doctor</Label>
              <Select
                value={selectedDoctor}
                onValueChange={setSelectedDoctor}
                disabled={!canChange}
              >
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {activeDoctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}{" "}
                      {doctor.department ? `(${doctor.department})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultationType">Consultation Type</Label>
              <Select
                value={consultationType}
                onValueChange={setConsultationType}
                disabled={!canChange}
              >
                <SelectTrigger id="consultationType">
                  <SelectValue placeholder="Select consultation type" />
                </SelectTrigger>
                <SelectContent>
                  {consultationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-gray-50 rounded-md space-y-2">
              <div className="flex justify-between">
                <span>Original Price:</span>
                <span>₦{originalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>New Price:</span>
                <span>₦{newPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>
                  {isUpgrade ? "Additional Amount:" : "Refund Amount:"}
                </span>
                <span className={isUpgrade ? "text-red-600" : "text-green-600"}>
                  {isUpgrade
                    ? `₦${priceDifference.toLocaleString()}`
                    : `₦${Math.abs(priceDifference).toLocaleString()}`}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.push("/appointments")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessChange}
              disabled={
                isSubmitting ||
                !selectedDoctor ||
                !consultationType ||
                !canChange
              }
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting
                ? "Processing..."
                : isUpgrade
                ? "Create Upgrade Bill"
                : "Process Downgrade"}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Toaster />
    </MainLayout>
  );
}
