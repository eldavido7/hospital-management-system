"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/lib/data/store";
import type { ExtendedPatient } from "@/lib/data/storeext";
import { useToast } from "./ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface PatientEditModalProps {
  patient: ExtendedPatient;
  open: boolean;
  onClose: () => void;
  onSave: (patient: ExtendedPatient) => void;
}

export function PatientEditModal({
  patient,
  open,
  onClose,
  onSave,
}: PatientEditModalProps) {
  const { hmoProviders } = useAppStore();
  const activeHMOProviders = hmoProviders.filter(
    (provider) => provider.isActive
  );

  const [formData, setFormData] = useState<ExtendedPatient>({
    ...patient,
    medicalHistoryStr: patient.medicalHistory?.join("\n") || "",
    allergiesStr: patient.allergies?.join(", ") || "",
  });

  const [isMinor, setIsMinor] = useState(patient.isMinor || false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFormData({
        ...patient,
        medicalHistoryStr: patient.medicalHistory?.join("\n") || "",
        allergiesStr: patient.allergies?.join(", ") || "",
      });
      setIsMinor(patient.isMinor || false);
    }
  }, [open, patient]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardianChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      guardian: {
        ...(prev.guardian || { name: "", relationship: "", phone: "" }),
        [name.replace("guardian.", "")]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      isMinor &&
      (!formData.guardian?.name ||
        !formData.guardian.relationship ||
        !formData.guardian.phone)
    ) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
      });

      return;
    }

    if (
      !formData.name ||
      !formData.age ||
      !formData.gender ||
      !formData.phone
    ) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
      });

      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient Information</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    age: Number.parseInt(e.target.value),
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                name="gender"
                value={formData.gender}
                onValueChange={(value) => handleSelectChange("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientType">Patient Type</Label>
              <Select
                name="patientType"
                value={formData.patientType}
                onValueChange={(value) =>
                  handleSelectChange("patientType", value as "cash" | "hmo")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="hmo">HMO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.patientType === "hmo" && (
              <div className="space-y-2">
                <Label htmlFor="hmoProvider">HMO Provider</Label>
                <Select
                  name="hmoProvider"
                  value={formData.hmoProvider || ""}
                  onValueChange={(value) =>
                    handleSelectChange("hmoProvider", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select HMO provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeHMOProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.name}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isMinor"
                  checked={isMinor}
                  onCheckedChange={(checked) => {
                    setIsMinor(!!checked);
                    setFormData((prev) => ({ ...prev, isMinor: !!checked }));
                  }}
                />
                <Label htmlFor="isMinor">Patient is a minor (under 18)</Label>
              </div>
            </div>
          </div>

          {isMinor && (
            <div className="border p-4 rounded-md space-y-4">
              <h3 className="font-medium">Guardian Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardian.name">Guardian Name</Label>
                  <Input
                    id="guardian.name"
                    name="guardian.name"
                    value={formData.guardian?.name || ""}
                    onChange={handleGuardianChange}
                    required={isMinor}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian.relationship">
                    Relationship to Patient
                  </Label>
                  <Input
                    id="guardian.relationship"
                    name="guardian.relationship"
                    value={formData.guardian?.relationship || ""}
                    onChange={handleGuardianChange}
                    required={isMinor}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian.phone">Guardian Phone</Label>
                  <Input
                    id="guardian.phone"
                    name="guardian.phone"
                    value={formData.guardian?.phone || ""}
                    onChange={handleGuardianChange}
                    required={isMinor}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian.email">Guardian Email</Label>
                  <Input
                    id="guardian.email"
                    name="guardian.email"
                    type="email"
                    value={formData.guardian?.email || ""}
                    onChange={handleGuardianChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="guardian.address">Guardian Address</Label>
                  <Input
                    id="guardian.address"
                    name="guardian.address"
                    value={formData.guardian?.address || ""}
                    onChange={handleGuardianChange}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="allergiesStr">Allergies (comma separated)</Label>
            <Input
              id="allergiesStr"
              name="allergiesStr"
              value={formData.allergiesStr}
              onChange={handleChange}
              placeholder="Penicillin, Peanuts, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalHistoryStr">
              Medical History (one condition per line)
            </Label>
            <Textarea
              id="medicalHistoryStr"
              name="medicalHistoryStr"
              value={formData.medicalHistoryStr}
              onChange={handleChange}
              placeholder="Hypertension&#10;Diabetes&#10;Asthma"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <Toaster />
    </Dialog>
  );
}
