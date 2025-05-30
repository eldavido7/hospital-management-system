"use client";

import type React from "react";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useVaccineStore, type Vaccine } from "@/lib/data/vaccines";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ManageVaccinesPage() {
  const { vaccines, addVaccine, updateVaccine } = useVaccineStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentVaccine, setCurrentVaccine] = useState<Vaccine | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Vaccine>>({
    name: "",
    type: "",
    description: "",
    total_required_doses: 1,
    interval_days: 0,
    stock: 0,
    price: 0,
    is_government_provided: false,
    age_restriction: {
      min: undefined,
      max: undefined,
    },
  });

  // Filter vaccines based on search query
  const filteredVaccines = vaccines.filter(
    (vaccine) =>
      vaccine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vaccine.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vaccine.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (name === "min_age" || name === "max_age") {
      // Handle age restriction fields
      const ageValue = value === "" ? undefined : Number.parseInt(value);
      setFormData({
        ...formData,
        age_restriction: {
          ...formData.age_restriction,
          [name === "min_age" ? "min" : "max"]: ageValue,
        },
      });
    } else {
      // Handle other fields
      setFormData({
        ...formData,
        [name]:
          type === "number"
            ? value === ""
              ? 0
              : Number.parseFloat(value)
            : value,
      });
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      is_government_provided: checked,
    });
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      description: "",
      total_required_doses: 1,
      interval_days: 0,
      stock: 0,
      price: 0,
      is_government_provided: false,
      age_restriction: {
        min: undefined,
        max: undefined,
      },
    });
  };

  // Handle add vaccine
  const handleAddVaccine = () => {
    if (!formData.name || !formData.type || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      addVaccine(formData as Omit<Vaccine, "id">);
      toast({
        title: "Success",
        description: "Vaccine added successfully.",
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add vaccine.",
        variant: "destructive",
      });
    }
  };

  // Handle edit vaccine
  const handleEditVaccine = () => {
    if (
      !currentVaccine ||
      !formData.name ||
      !formData.type ||
      !formData.description
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      updateVaccine({
        ...currentVaccine,
        ...formData,
      } as Vaccine);
      toast({
        title: "Success",
        description: "Vaccine updated successfully.",
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vaccine.",
        variant: "destructive",
      });
    }
  };

  // Handle delete vaccine
  const handleDeleteVaccine = () => {
    if (!currentVaccine) return;

    try {
      // Filter out the vaccine to delete
      const updatedVaccines = vaccines.filter(
        (v) => v.id !== currentVaccine.id
      );
      // Update the store
      useVaccineStore.setState({ vaccines: updatedVaccines });

      toast({
        title: "Success",
        description: "Vaccine deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vaccine.",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog with vaccine data
  const openEditDialog = (vaccine: Vaccine) => {
    setCurrentVaccine(vaccine);
    setFormData({
      name: vaccine.name,
      type: vaccine.type,
      description: vaccine.description,
      total_required_doses: vaccine.total_required_doses,
      interval_days: vaccine.interval_days || 0,
      stock: vaccine.stock,
      price: vaccine.price,
      is_government_provided: vaccine.is_government_provided,
      age_restriction: {
        min: vaccine.age_restriction?.min,
        max: vaccine.age_restriction?.max,
      },
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (vaccine: Vaccine) => {
    setCurrentVaccine(vaccine);
    setIsDeleteDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Vaccines</h1>
          <div className="flex space-x-2">
            <Button
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Vaccine
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Back
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vaccines Inventory</CardTitle>
            <CardDescription>
              Manage your vaccine inventory and details
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vaccines..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required Doses</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVaccines.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No vaccines found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVaccines.map((vaccine) => (
                    <TableRow key={vaccine.id}>
                      <TableCell className="font-medium">
                        {vaccine.name}
                      </TableCell>
                      <TableCell>{vaccine.type}</TableCell>
                      <TableCell>{vaccine.total_required_doses}</TableCell>
                      <TableCell>
                        {vaccine.stock <= 10 ? (
                          <div className="flex items-center">
                            <span
                              className={
                                vaccine.stock === 0
                                  ? "text-red-500"
                                  : "text-amber-500"
                              }
                            >
                              {vaccine.stock}
                            </span>
                            {vaccine.stock === 0 && (
                              <AlertCircle className="h-4 w-4 ml-1 text-red-500" />
                            )}
                          </div>
                        ) : (
                          vaccine.stock
                        )}
                      </TableCell>
                      <TableCell>
                        {vaccine.is_government_provided ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Free (Govt)
                          </Badge>
                        ) : (
                          `₦${vaccine.price.toLocaleString()}`
                        )}
                      </TableCell>
                      <TableCell>
                        {vaccine.stock > 0 ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            In Stock
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200"
                          >
                            Out of Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(vaccine)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(vaccine)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Vaccine Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Vaccine</DialogTitle>
              <DialogDescription>
                Enter the details for the new vaccine. Click save when you're
                done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vaccine Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., COVID-19 Vaccine"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Vaccine Type *</Label>
                  <Input
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    placeholder="e.g., COVID-19"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the vaccine"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_required_doses">Required Doses</Label>
                  <Input
                    id="total_required_doses"
                    name="total_required_doses"
                    type="number"
                    min="1"
                    value={formData.total_required_doses}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval_days">Interval Days</Label>
                  <Input
                    id="interval_days"
                    name="interval_days"
                    type="number"
                    min="0"
                    value={formData.interval_days}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Initial Stock</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    disabled={formData.is_government_provided}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_government_provided"
                  checked={formData.is_government_provided}
                  onCheckedChange={handleCheckboxChange}
                />
                <Label htmlFor="is_government_provided">
                  Government Provided (Free)
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_age">Minimum Age</Label>
                  <Input
                    id="min_age"
                    name="min_age"
                    type="number"
                    min="0"
                    value={formData.age_restriction?.min || ""}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_age">Maximum Age</Label>
                  <Input
                    id="max_age"
                    name="max_age"
                    type="number"
                    min="0"
                    value={formData.age_restriction?.max || ""}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddVaccine}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Vaccine Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Vaccine</DialogTitle>
              <DialogDescription>
                Update the details for this vaccine. Click save when you're
                done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Vaccine Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Vaccine Type *</Label>
                  <Input
                    id="edit-type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Input
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-total_required_doses">
                    Required Doses
                  </Label>
                  <Input
                    id="edit-total_required_doses"
                    name="total_required_doses"
                    type="number"
                    min="1"
                    value={formData.total_required_doses}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-interval_days">Interval Days</Label>
                  <Input
                    id="edit-interval_days"
                    name="interval_days"
                    type="number"
                    min="0"
                    value={formData.interval_days}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Stock</Label>
                  <Input
                    id="edit-stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (₦)</Label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    disabled={formData.is_government_provided}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is_government_provided"
                  checked={formData.is_government_provided}
                  onCheckedChange={handleCheckboxChange}
                />
                <Label htmlFor="edit-is_government_provided">
                  Government Provided (Free)
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-min_age">Minimum Age</Label>
                  <Input
                    id="edit-min_age"
                    name="min_age"
                    type="number"
                    min="0"
                    value={formData.age_restriction?.min || ""}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-max_age">Maximum Age</Label>
                  <Input
                    id="edit-max_age"
                    name="max_age"
                    type="number"
                    min="0"
                    value={formData.age_restriction?.max || ""}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditVaccine}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                vaccine
                {currentVaccine && (
                  <strong> "{currentVaccine.name}"</strong>
                )}{" "}
                from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteVaccine}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
