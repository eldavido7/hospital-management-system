"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Edit, Plus, Search, Trash } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useConsumableStore, type Consumable } from "@/lib/data/consumables"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Toaster } from "@/components/ui/toaster"

export default function ConsumablesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null)

  // Form state
  const [formData, setFormData] = useState<{
    id: string
    name: string
    description: string
    price: number
    category: string
    stock: number
  }>({
    id: "",
    name: "",
    description: "",
    price: 0,
    category: "general",
    stock: 0,
  })

  // Get consumables from the store
  const { consumables, searchConsumables, addConsumable, updateConsumable, deleteConsumable, generateConsumableId } =
    useConsumableStore()

  // Filter consumables based on search term and active tab
  const filteredConsumables = () => {
    let filtered = searchTerm ? searchConsumables(searchTerm) : consumables

    if (activeTab !== "all") {
      filtered = filtered.filter((c) => c.category === activeTab && c.active)
    } else {
      filtered = filtered.filter((c) => c.active)
    }

    return filtered
  }

  // Pagination
  const paginatedConsumables = () => {
    const filtered = filteredConsumables()
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    return filtered.slice(indexOfFirstItem, indexOfLastItem)
  }

  const totalPages = Math.ceil(filteredConsumables().length / itemsPerPage)

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    })
  }

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
    })
  }

  // Handle add consumable
  const handleAddConsumable = () => {
    if (!formData.name || !formData.description || formData.price <= 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const newId = generateConsumableId()
    const newConsumable: Consumable = {
      id: newId,
      name: formData.name,
      description: formData.description,
      price: formData.price,
      category: formData.category as any,
      stock: formData.stock,
      active: true,
    }

    addConsumable(newConsumable)
    setIsAddDialogOpen(false)
    resetForm()

    toast({
      title: "Consumable added",
      description: `${formData.name} has been added to inventory.`,
    })
  }

  // Handle edit consumable
  const handleEditConsumable = () => {
    if (!selectedConsumable) return

    if (!formData.name || !formData.description || formData.price <= 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const updatedConsumable: Consumable = {
      ...selectedConsumable,
      name: formData.name,
      description: formData.description,
      price: formData.price,
      category: formData.category as any,
      stock: formData.stock,
    }

    updateConsumable(updatedConsumable)
    setIsEditDialogOpen(false)
    setSelectedConsumable(null)
    resetForm()

    toast({
      title: "Consumable updated",
      description: `${formData.name} has been updated.`,
    })
  }

  // Handle delete consumable
  const handleDeleteConsumable = (id: string, name: string) => {
    deleteConsumable(id)

    toast({
      title: "Consumable deleted",
      description: `${name} has been removed from active inventory.`,
    })
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
      price: 0,
      category: "general",
      stock: 0,
    })
  }

  // Open edit dialog
  const openEditDialog = (consumable: Consumable) => {
    setSelectedConsumable(consumable)
    setFormData({
      id: consumable.id,
      name: consumable.name,
      description: consumable.description,
      price: consumable.price,
      category: consumable.category,
      stock: consumable.stock,
    })
    setIsEditDialogOpen(true)
  }

  // Pagination controls
  const PaginationControls = () => {
    if (totalPages <= 1) return null

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
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Consumables</h1>
            <p className="text-muted-foreground">Manage hospital consumables inventory</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm()
                    setIsAddDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Consumable
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Consumable</DialogTitle>
                  <DialogDescription>Add a new consumable item to the inventory.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Price (₦)
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <Select value={formData.category} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="injection">Injection Supplies</SelectItem>
                        <SelectItem value="iv">IV Supplies</SelectItem>
                        <SelectItem value="general">General Supplies</SelectItem>
                        <SelectItem value="dressing">Dressing Supplies</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stock" className="text-right">
                      Stock
                    </Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddConsumable}>Add Consumable</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex w-full mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search consumables..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value)
            setCurrentPage(1)
          }}
        >
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="injection">Injection</TabsTrigger>
            <TabsTrigger value="iv">IV</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="dressing">Dressing</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Consumables Inventory</CardTitle>
                <CardDescription>
                  {activeTab === "all"
                    ? "All consumable items in inventory"
                    : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} supplies in inventory`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price (₦)</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedConsumables().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          No consumables found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedConsumables().map((consumable) => (
                        <TableRow key={consumable.id}>
                          <TableCell className="font-medium">{consumable.id}</TableCell>
                          <TableCell>{consumable.name}</TableCell>
                          <TableCell>{consumable.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {consumable.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{consumable.price.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={consumable.stock < 10 ? "destructive" : "outline"}>
                              {consumable.stock}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(consumable)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteConsumable(consumable.id, consumable.name)}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <PaginationControls />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Consumable</DialogTitle>
            <DialogDescription>Update the details of this consumable item.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">
                Price (₦)
              </Label>
              <Input
                id="edit-price"
                name="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="injection">Injection Supplies</SelectItem>
                  <SelectItem value="iv">IV Supplies</SelectItem>
                  <SelectItem value="general">General Supplies</SelectItem>
                  <SelectItem value="dressing">Dressing Supplies</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-stock" className="text-right">
                Stock
              </Label>
              <Input
                id="edit-stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditConsumable}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </MainLayout>
  )
}
