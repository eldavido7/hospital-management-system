"use client";

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
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Edit, Plus, Search, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMedicineStore, type Medicine } from "@/lib/data/medicines";
import { Toaster } from "@/components/ui/toaster";

export default function MedicinesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [isEditMedicineOpen, setIsEditMedicineOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null
  );
  const [newMedicine, setNewMedicine] = useState<Omit<Medicine, "id">>({
    name: "",
    dosage: "",
    form: "tablet",
    price: 0,
    stock: 0,
    description: "",
  });

  // Get medicines from the medicine store
  const {
    medicines,
    searchMedicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
  } = useMedicineStore();

  // Handle adding a new medicine
  const handleAddMedicine = () => {
    if (!newMedicine.name || !newMedicine.dosage || newMedicine.price <= 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const addedMedicine = addMedicine(newMedicine);

    toast({
      title: "Medicine added",
      description: `${addedMedicine.name} has been added to the inventory.`,
    });

    setNewMedicine({
      name: "",
      dosage: "",
      form: "tablet",
      price: 0,
      stock: 0,
      description: "",
    });

    setIsAddMedicineOpen(false);
  };

  // Handle updating a medicine
  const handleUpdateMedicine = () => {
    if (!selectedMedicine) return;

    updateMedicine(selectedMedicine.id, selectedMedicine);

    toast({
      title: "Medicine updated",
      description: `${selectedMedicine.name} has been updated in the inventory.`,
    });

    setIsEditMedicineOpen(false);
    setSelectedMedicine(null);
  };

  // Handle deleting a medicine
  const handleDeleteMedicine = (id: string) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      deleteMedicine(id);

      toast({
        title: "Medicine deleted",
        description: "The medicine has been removed from the inventory.",
      });
    }
  };

  // Filter medicines based on search term
  const filteredMedicines = searchMedicines(searchTerm);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Medicine Inventory
            </h1>
            <p className="text-muted-foreground">
              Manage the pharmacy medicine catalog
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/pharmacy")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pharmacy
            </Button>
            <Button onClick={() => setIsAddMedicineOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Medicine
            </Button>
          </div>
        </div>

        <div className="flex w-full mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search medicines..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Medicine Catalog</CardTitle>
            <CardDescription>
              View and manage all medicines in the pharmacy inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead className="text-right">Price (₦)</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedicines.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No medicines found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMedicines.map((medicine) => (
                      <TableRow key={medicine.id}>
                        <TableCell className="font-mono text-xs">
                          {medicine.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {medicine.name}
                        </TableCell>
                        <TableCell>{medicine.dosage}</TableCell>
                        <TableCell className="capitalize">
                          {medicine.form}
                        </TableCell>
                        <TableCell className="text-right">
                          {medicine.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              medicine.stock < 10
                                ? "text-red-500 font-medium"
                                : ""
                            }
                          >
                            {medicine.stock}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {medicine.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedMedicine(medicine);
                                setIsEditMedicineOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMedicine(medicine.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Medicine Dialog */}
      <Dialog open={isAddMedicineOpen} onOpenChange={setIsAddMedicineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
            <DialogDescription>
              Add a new medicine to the pharmacy inventory
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="medicineName">Name</Label>
              <Input
                id="medicineName"
                value={newMedicine.name}
                onChange={(e) =>
                  setNewMedicine({ ...newMedicine, name: e.target.value })
                }
                placeholder="Medicine name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicineDosage">Dosage</Label>
              <Input
                id="medicineDosage"
                value={newMedicine.dosage}
                onChange={(e) =>
                  setNewMedicine({ ...newMedicine, dosage: e.target.value })
                }
                placeholder="e.g. 500mg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicineForm">Form</Label>
              <Select
                value={newMedicine.form}
                onValueChange={(value) =>
                  setNewMedicine({ ...newMedicine, form: value as any })
                }
              >
                <SelectTrigger id="medicineForm">
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="capsule">Capsule</SelectItem>
                  <SelectItem value="syrup">Syrup</SelectItem>
                  <SelectItem value="injection">Injection</SelectItem>
                  <SelectItem value="cream">Cream</SelectItem>
                  <SelectItem value="ointment">Ointment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicinePrice">Price (₦)</Label>
              <Input
                id="medicinePrice"
                type="number"
                min="0"
                value={newMedicine.price || ""}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    price: Number.parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Price per unit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicineStock">Stock</Label>
              <Input
                id="medicineStock"
                type="number"
                min="0"
                value={newMedicine.stock || ""}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    stock: Number.parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Initial stock"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicineDescription">
                Description (Optional)
              </Label>
              <Textarea
                id="medicineDescription"
                value={newMedicine.description || ""}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddMedicineOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMedicine}>Add Medicine</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Medicine Dialog */}
      <Dialog open={isEditMedicineOpen} onOpenChange={setIsEditMedicineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
            <DialogDescription>Update medicine details</DialogDescription>
          </DialogHeader>

          {selectedMedicine && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editMedicineName">Name</Label>
                <Input
                  id="editMedicineName"
                  value={selectedMedicine.name}
                  onChange={(e) =>
                    setSelectedMedicine({
                      ...selectedMedicine,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMedicineDosage">Dosage</Label>
                <Input
                  id="editMedicineDosage"
                  value={selectedMedicine.dosage}
                  onChange={(e) =>
                    setSelectedMedicine({
                      ...selectedMedicine,
                      dosage: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMedicineForm">Form</Label>
                <Select
                  value={selectedMedicine.form}
                  onValueChange={(value) =>
                    setSelectedMedicine({
                      ...selectedMedicine,
                      form: value as any,
                    })
                  }
                >
                  <SelectTrigger id="editMedicineForm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="capsule">Capsule</SelectItem>
                    <SelectItem value="syrup">Syrup</SelectItem>
                    <SelectItem value="injection">Injection</SelectItem>
                    <SelectItem value="cream">Cream</SelectItem>
                    <SelectItem value="ointment">Ointment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMedicinePrice">Price (₦)</Label>
                <Input
                  id="editMedicinePrice"
                  type="number"
                  min="0"
                  value={selectedMedicine.price || ""}
                  onChange={(e) =>
                    setSelectedMedicine({
                      ...selectedMedicine,
                      price: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMedicineStock">Stock</Label>
                <Input
                  id="editMedicineStock"
                  type="number"
                  min="0"
                  value={selectedMedicine.stock || ""}
                  onChange={(e) =>
                    setSelectedMedicine({
                      ...selectedMedicine,
                      stock: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMedicineDescription">Description</Label>
                <Textarea
                  id="editMedicineDescription"
                  value={selectedMedicine.description || ""}
                  onChange={(e) =>
                    setSelectedMedicine({
                      ...selectedMedicine,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditMedicineOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateMedicine}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </MainLayout>
  );
}
