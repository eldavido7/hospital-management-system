"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppStore } from "@/lib/data/store";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

export default function PatientRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    generatePatientId,
    addPatient,
    staff,
    hospitalSettings,
    searchPatients,
  } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: undefined as Date | undefined,
    gender: "Male",
    phone: "",
    email: "",
    address: "",
    patientType: "cash",
    hmoProvider: "",
    medicalHistory: "",
    allergies: "",
    isStaff: false,
    staffId: undefined as string | undefined,
    isMinor: false,
    guardian: {
      name: "",
      relationship: "Parent",
      phone: "",
      email: "",
      address: "",
    },
    // New fields
    salutation: "",
    maritalStatus: "Single",
    religion: "",
    nationality: "Nigerian",
    stateOfOrigin: "",
    occupation: "",
    bloodGroup: "",
    nextOfKin: {
      fullName: "",
      phone: "",
      address: "",
      relationship: "Spouse",
    },
  });

  // Add a function to check if patient is a minor based on DOB
  const isMinor = (dob: Date | undefined): boolean => {
    if (!dob) return false;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age < 18;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Check if this is a guardian field
    if (name.startsWith("guardian.")) {
      const guardianField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        guardian: {
          ...prev.guardian,
          [guardianField]: value,
        },
      }));
    }
    // Check if this is a next of kin field
    else if (name.startsWith("nextOfKin.")) {
      const nextOfKinField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        nextOfKin: {
          ...prev.nextOfKin,
          [nextOfKinField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.dob ||
        !formData.phone
      ) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate guardian details if patient is a minor
      const patientIsMinor = isMinor(formData.dob);
      if (
        patientIsMinor &&
        (!formData.guardian.name || !formData.guardian.phone)
      ) {
        toast({
          title: "Missing guardian details",
          description:
            "Please fill in required guardian details for minor patient.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate next of kin details
      if (!formData.nextOfKin.fullName || !formData.nextOfKin.phone) {
        toast({
          title: "Missing next of kin details",
          description: "Please fill in required next of kin details.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check for duplicate patients with the same phone number
      const existingPatients = searchPatients(formData.phone, "phone");

      if (existingPatients.length > 0) {
        // Check if any existing patient has the same patient type
        const sameTypePatient = existingPatients.find(
          (p) => p.patientType === formData.patientType
        );

        if (sameTypePatient) {
          toast({
            title: "Patient already exists",
            description: `A ${formData.patientType} patient with this phone number already exists (ID: ${sameTypePatient.id}).`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        // If patient exists but with different type, show a warning but allow registration
        toast({
          title: "Note: Patient exists with different type",
          description: `This patient already exists as a ${existingPatients[0].patientType} patient (ID: ${existingPatients[0].id}).`,
          variant: "destructive",
        });
      }

      // Calculate age from DOB
      const today = new Date();
      const birthDate = new Date(formData.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      // Generate patient ID
      const patientId = generatePatientId();

      // Combine first and last name for the name field
      const fullName = `${formData.firstName} ${formData.lastName}`;

      // Create patient object
      const newPatient = {
        id: patientId,
        name: fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: format(formData.dob!, "yyyy-MM-dd"),
        age: age,
        gender: formData.gender as "Male" | "Female" | "Other",
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        lastVisit: new Date().toISOString().split("T")[0],
        patientType: formData.patientType as "cash" | "hmo",
        ...(formData.patientType === "hmo" && {
          hmoProvider: formData.hmoProvider,
        }),
        medicalHistory: formData.medicalHistory
          ? formData.medicalHistory.split("\n")
          : [],
        allergies: formData.allergies ? formData.allergies.split("\n") : [],
        visits: [],
        bills: [],
        isStaff: formData.isStaff || false,
        staffId: formData.isStaff ? formData.staffId : undefined,
        isMinor: patientIsMinor,
        ...(patientIsMinor && { guardian: formData.guardian }),
        balance: 0, // Add default balance
        // New fields
        salutation: formData.salutation,
        maritalStatus: formData.maritalStatus,
        religion: formData.religion,
        nationality: formData.nationality,
        stateOfOrigin: formData.stateOfOrigin,
        occupation: formData.occupation,
        bloodGroup: formData.bloodGroup,
        nextOfKin: formData.nextOfKin,
      };

      // Add patient to store
      addPatient(newPatient);

      // Show success message
      toast({
        title: "Patient registered successfully",
        description: `Patient ID: ${patientId}`,
      });

      // Redirect to patient detail page
      router.push(`/patients/${patientId}`);
    } catch (error) {
      console.error("Error registering patient:", error);
      toast({
        title: "Registration failed",
        description:
          "There was an error registering the patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (formData.dob) {
      const minor = isMinor(formData.dob);
      setFormData((prev) => ({
        ...prev,
        isMinor: minor,
      }));
    }
  }, [formData.dob]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Register New Patient
            </h1>
            <p className="text-muted-foreground">
              Add a new patient to the system
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/patients/search")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Enter the patient's personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salutation">Salutation</Label>
                    <Select
                      value={formData.salutation}
                      onValueChange={(value) =>
                        handleSelectChange("salutation", value)
                      }
                    >
                      <SelectTrigger id="salutation">
                        <SelectValue placeholder="Select salutation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Miss">Miss</SelectItem>
                        <SelectItem value="Ms">Ms</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                        <SelectItem value="Prof">Prof</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter patient's first name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter patient's last name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dob"
                      name="dob"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : undefined;
                        handleSelectChange("dob", date);
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <RadioGroup
                      defaultValue="Male"
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleSelectChange("gender", value)
                      }
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Male" id="male" />
                        <Label htmlFor="male" className="font-normal">
                          Male
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Female" id="female" />
                        <Label htmlFor="female" className="font-normal">
                          Female
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Other" id="other" />
                        <Label htmlFor="other" className="font-normal">
                          Other
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select
                      value={formData.maritalStatus}
                      onValueChange={(value) =>
                        handleSelectChange("maritalStatus", value)
                      }
                    >
                      <SelectTrigger id="maritalStatus">
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                        <SelectItem value="Separated">Separated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="religion">Religion</Label>
                    <Input
                      id="religion"
                      name="religion"
                      value={formData.religion}
                      onChange={handleInputChange}
                      placeholder="Enter religion"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      placeholder="Enter nationality"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stateOfOrigin">State of Origin</Label>
                    <Input
                      id="stateOfOrigin"
                      name="stateOfOrigin"
                      value={formData.stateOfOrigin}
                      onChange={handleInputChange}
                      placeholder="Enter state of origin"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      placeholder="Enter occupation"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select
                      value={formData.bloodGroup}
                      onValueChange={(value) =>
                        handleSelectChange("bloodGroup", value)
                      }
                    >
                      <SelectTrigger id="bloodGroup">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter residential address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
                <CardDescription>
                  Enter the patient's medical details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Patient Type <span className="text-red-500">*</span>
                  </Label>
                  <RadioGroup
                    defaultValue="cash"
                    value={formData.patientType}
                    onValueChange={(value) =>
                      handleSelectChange("patientType", value)
                    }
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="font-normal">
                        Cash
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hmo" id="hmo" />
                      <Label htmlFor="hmo" className="font-normal">
                        HMO
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.patientType === "hmo" && (
                  <div className="space-y-2">
                    <Label htmlFor="hmoProvider">
                      HMO Provider <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.hmoProvider}
                      onValueChange={(value) =>
                        handleSelectChange("hmoProvider", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select HMO provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AXA Mansard">AXA Mansard</SelectItem>
                        <SelectItem value="Hygeia HMO">Hygeia HMO</SelectItem>
                        <SelectItem value="Avon HMO">Avon HMO</SelectItem>
                        <SelectItem value="NHIS">NHIS</SelectItem>
                        <SelectItem value="Reliance HMO">
                          Reliance HMO
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Staff Patient Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isStaff"
                      checked={formData.isStaff || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          isStaff: checked === true,
                        })
                      }
                    />
                    <Label htmlFor="isStaff">Register as Staff Member</Label>
                  </div>

                  {formData.isStaff && (
                    <div className="space-y-2 pl-6 mt-2">
                      <Label htmlFor="staffId">Select Staff</Label>
                      <Select
                        value={formData.staffId || ""}
                        onValueChange={(value) => {
                          const selectedStaff = staff.find(
                            (s) => s.id === value
                          );
                          if (selectedStaff) {
                            setFormData({
                              ...formData,
                              staffId: value,
                              firstName: selectedStaff.name,
                              email: selectedStaff.email || formData.email,
                              phone: selectedStaff.phone || formData.phone,
                            });
                          }
                        }}
                      >
                        <SelectTrigger id="staffId">
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {staff
                            .filter((s) => s.status === "active")
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} ({s.role.replace("_", " ")})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Staff members receive a {hospitalSettings.staffDiscount}
                        % discount on services
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <Textarea
                    id="medicalHistory"
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleInputChange}
                    placeholder="Enter medical history (one per line)"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter each condition on a new line
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    placeholder="Enter allergies (one per line)"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter each allergy on a new line
                  </p>
                </div>
              </CardContent>
            </Card>
            {/* Next of Kin Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Next of Kin Information</CardTitle>
                <CardDescription>
                  Enter details of patient's next of kin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nextOfKin.fullName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nextOfKin.fullName"
                    name="nextOfKin.fullName"
                    value={formData.nextOfKin.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter next of kin's full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextOfKin.relationship">Relationship</Label>
                  <Select
                    value={formData.nextOfKin.relationship}
                    onValueChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        nextOfKin: {
                          ...prev.nextOfKin,
                          relationship: value,
                        },
                      }));
                    }}
                  >
                    <SelectTrigger id="nextOfKin.relationship">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextOfKin.phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nextOfKin.phone"
                    name="nextOfKin.phone"
                    value={formData.nextOfKin.phone}
                    onChange={handleInputChange}
                    placeholder="Enter next of kin's phone number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextOfKin.address">Address</Label>
                  <Textarea
                    id="nextOfKin.address"
                    name="nextOfKin.address"
                    value={formData.nextOfKin.address}
                    onChange={handleInputChange}
                    placeholder="Enter next of kin's address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            {/* Guardian Information Section (Conditional) */}
            {formData.isMinor && (
              <Card>
                <CardHeader>
                  <CardTitle>Guardian Information</CardTitle>
                  <CardDescription>
                    Enter guardian details for minor patient
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardian.name">
                      Guardian's Full Name{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guardian.name"
                      name="guardian.name"
                      value={formData.guardian.name}
                      onChange={handleInputChange}
                      placeholder="Enter guardian's full name"
                      required={formData.isMinor}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardian.relationship">
                      Relationship to Patient{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.guardian.relationship}
                      onValueChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          guardian: {
                            ...prev.guardian,
                            relationship: value,
                          },
                        }));
                      }}
                    >
                      <SelectTrigger id="guardian.relationship">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Mother">Mother</SelectItem>
                        <SelectItem value="Father">Father</SelectItem>
                        <SelectItem value="Grandparent">Grandparent</SelectItem>
                        <SelectItem value="Uncle">Uncle</SelectItem>
                        <SelectItem value="Aunt">Aunt</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Legal Guardian">
                          Legal Guardian
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardian.phone">
                      Guardian's Phone Number{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guardian.phone"
                      name="guardian.phone"
                      value={formData.guardian.phone}
                      onChange={handleInputChange}
                      placeholder="Enter guardian's phone number"
                      required={formData.isMinor}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardian.email">
                      Guardian's Email Address
                    </Label>
                    <Input
                      id="guardian.email"
                      name="guardian.email"
                      type="email"
                      value={formData.guardian.email}
                      onChange={handleInputChange}
                      placeholder="Enter guardian's email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardian.address">Guardian's Address</Label>
                    <Textarea
                      id="guardian.address"
                      name="guardian.address"
                      value={formData.guardian.address}
                      onChange={handleInputChange}
                      placeholder="Enter guardian's address if different from patient"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next of Kin Information Section */}
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Registering..." : "Register Patient"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
