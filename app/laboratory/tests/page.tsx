"use client";

import type React from "react";

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
import { ArrowLeft, Plus, Search, Trash, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/data/store";
import type { LabTest } from "@/lib/data/lab-tests";
import { Toaster } from "@/components/ui/toaster";

export default function ManageLabTestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState<Partial<LabTest>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    normalRange: "",
    unit: "",
    active: true,
  });

  // Get lab tests from store
  const {
    labTests,
    searchLabTests,
    addLabTest,
    updateLabTest,
    deleteLabTest,
    generateLabTestId,
  } = useAppStore();

  // Filter lab tests based on search term
  const filteredTests = searchTerm
    ? searchLabTests(searchTerm)
    : labTests.filter((test) => test.active);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTests = filteredTests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);

  // Categories for dropdown
  const categories = Array.from(new Set(labTests.map((test) => test.category)));

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: "",
      normalRange: "",
      unit: "",
      active: true,
    });
    setIsEditMode(false);
  };

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? Number.parseFloat(value) || 0 : value,
    }));
  };

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.name || !formData.category || (formData.price ?? 0) <= 0) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (isEditMode && formData.id) {
        // Update existing test
        updateLabTest({
          ...(formData as LabTest),
        });
        toast({
          title: "Test updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        // Add new test
        const newTest: LabTest = {
          ...(formData as LabTest),
          id: generateLabTestId(),
          active: true,
        };
        addLabTest(newTest);
        toast({
          title: "Test added",
          description: `${formData.name} has been added successfully.`,
        });
      }

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          "There was an error processing your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit test
  const handleEditTest = (test: LabTest) => {
    setFormData(test);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  // Handle delete test
  const handleDeleteTest = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      setIsSubmitting(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));

        deleteLabTest(id);

        toast({
          title: "Test deleted",
          description: `${name} has been deleted successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            "There was an error deleting the test. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Manage Lab Tests
            </h1>
            <p className="text-muted-foreground">
              Add, edit, or delete laboratory tests
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push("/laboratory")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Laboratory
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm();
                    setIsEditMode(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Test
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>
                    {isEditMode ? "Edit Lab Test" : "Add New Lab Test"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditMode
                      ? "Update the details of the laboratory test."
                      : "Fill in the details to add a new laboratory test."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="col-span-3"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price" className="text-right">
                        Price (₦) *
                      </Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="col-span-3"
                        min="0"
                        step="100"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">
                        Category *
                      </Label>
                      <div className="col-span-3 flex gap-2">
                        <Select
                          value={formData.category}
                          onValueChange={handleCategoryChange}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {formData.category === "Other" && (
                          <Input
                            placeholder="Enter new category"
                            name="category"
                            onChange={handleInputChange}
                            className="flex-1"
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="normalRange" className="text-right">
                        Normal Range
                      </Label>
                      <Input
                        id="normalRange"
                        name="normalRange"
                        value={formData.normalRange}
                        onChange={handleInputChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="unit" className="text-right">
                        Unit
                      </Label>
                      <Input
                        id="unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Saving..."
                        : isEditMode
                        ? "Update Test"
                        : "Add Test"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex w-full mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by test name or category..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Laboratory Tests</CardTitle>
            <CardDescription>
              {filteredTests.length}{" "}
              {filteredTests.length === 1 ? "test" : "tests"} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Normal Range</TableHead>
                  <TableHead className="text-right">Price (₦)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6 text-muted-foreground"
                    >
                      {searchTerm
                        ? "No tests found matching your search."
                        : "No tests available."}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">{test.name}</TableCell>
                      <TableCell>{test.category}</TableCell>
                      <TableCell>
                        {test.normalRange || "Not specified"}
                      </TableCell>
                      <TableCell className="text-right">
                        {test.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTest(test)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTest(test.id, test.name)}
                            disabled={isSubmitting}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
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
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </MainLayout>
  );
}
