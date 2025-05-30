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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Search, Users, X } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/data/store";
import type { UserRole } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/toaster";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffSearchOpen, setStaffSearchOpen] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffSearchResults, setStaffSearchResults] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [activeTab, setActiveTab] = useState("users");

  // Use the central store
  const {
    staff,
    addStaff,
    updateStaff,
    generateStaffId,
    hmoProviders,
    addHMOProvider,
    updateHMOProvider,
    generateHMOProviderId,
    departments,
    addDepartment,
    updateDepartment,
    generateDepartmentId,
    hospitalSettings,
    updateHospitalSettings,
  } = useAppStore();

  // Form states
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    email: "",
    role: "registration" as UserRole,
    password: "",
    confirmPassword: "",
    phone: "",
    department: "",
  });

  const [newHmoProvider, setNewHmoProvider] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
  });

  const [newDepartment, setNewDepartment] = useState({
    name: "",
    head: "",
    headId: "",
  });

  const [editedHospitalSettings, setEditedHospitalSettings] = useState({
    ...hospitalSettings,
  });

  // Effect for staff search
  useEffect(() => {
    if (staffSearchQuery.trim() === "") {
      setStaffSearchResults([]);
      return;
    }

    const query = staffSearchQuery.toLowerCase();
    const results = staff
      .filter(
        (s) =>
          s.status === "active" &&
          (s.name.toLowerCase().includes(query) ||
            s.username.toLowerCase().includes(query))
      )
      .map((s) => ({
        id: s.id,
        name: s.name,
      }));

    setStaffSearchResults(results);
  }, [staffSearchQuery, staff]);

  const handleToggleUserStatus = (userId: string) => {
    const staffMember = staff.find((s) => s.id === userId);
    if (!staffMember) return;

    const updatedStaff = {
      ...staffMember,
      status:
        staffMember.status === "active"
          ? "inactive"
          : ("active" as "active" | "inactive" | "on_leave"),
    };

    updateStaff(updatedStaff);

    toast({
      title: "User status updated",
      description: "The user's status has been updated successfully.",
    });
  };

  const handleToggleHmoStatus = (hmoId: string) => {
    const provider = hmoProviders.find((hmo) => hmo.id === hmoId);
    if (!provider) return;

    const updatedProvider = {
      ...provider,
      isActive: !provider.isActive,
    };

    updateHMOProvider(updatedProvider);

    toast({
      title: "HMO provider status updated",
      description: "The HMO provider's status has been updated successfully.",
    });
  };

  const handleToggleDepartmentStatus = (departmentId: string) => {
    const department = departments.find((dept) => dept.id === departmentId);
    if (!department) return;

    const updatedDepartment = {
      ...department,
      isActive: !department.isActive,
    };

    updateDepartment(updatedDepartment);

    toast({
      title: "Department status updated",
      description: "The department's status has been updated successfully.",
    });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (newUser.password !== newUser.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure the passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a new staff member
      const newStaffMember = {
        id: generateStaffId(),
        name: newUser.name,
        username: newUser.username,
        role: newUser.role as any,
        email: newUser.email,
        phone: newUser.phone,
        department: newUser.department,
        status: "active" as "active" | "inactive" | "on_leave",
        joinDate: new Date().toISOString().split("T")[0],
      };

      // Add to store
      addStaff(newStaffMember);

      // Reset form
      setNewUser({
        name: "",
        username: "",
        email: "",
        role: "registration" as UserRole,
        password: "",
        confirmPassword: "",
        phone: "",
        department: "",
      });

      toast({
        title: "User added successfully",
        description: `${
          newUser.name
        } has been added as a ${newUser.role.replace("_", " ")}.`,
      });
    } catch (error) {
      toast({
        title: "Error adding user",
        description: "There was an error adding the user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddHmoProvider = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a new HMO provider
      const newProvider = {
        id: generateHMOProviderId(),
        name: newHmoProvider.name,
        contactPerson: newHmoProvider.contactPerson,
        email: newHmoProvider.email,
        phone: newHmoProvider.phone,
        isActive: true,
      };

      // Add to store
      addHMOProvider(newProvider);

      // Reset form
      setNewHmoProvider({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
      });

      toast({
        title: "HMO provider added successfully",
        description: `${newHmoProvider.name} has been added to the system.`,
      });
    } catch (error) {
      toast({
        title: "Error adding HMO provider",
        description:
          "There was an error adding the HMO provider. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a new department
      const newDept = {
        id: generateDepartmentId(),
        name: newDepartment.name,
        head: newDepartment.head,
        isActive: true,
      };

      // Add to store
      addDepartment(newDept);

      // Reset form
      setNewDepartment({
        name: "",
        head: "",
        headId: "",
      });

      toast({
        title: "Department added successfully",
        description: `${newDepartment.name} has been added to the system.`,
      });
    } catch (error) {
      toast({
        title: "Error adding department",
        description:
          "There was an error adding the department. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveHospitalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update hospital settings
      updateHospitalSettings({
        ...editedHospitalSettings,
        consultationFee: Number(editedHospitalSettings.consultationFee),
      });

      toast({
        title: "Settings saved successfully",
        description: "The hospital settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description:
          "There was an error saving the settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectStaff = (staffId: string, staffName: string) => {
    setNewDepartment({
      ...newDepartment,
      head: staffName,
      headId: staffId,
    });
    setStaffSearchOpen(false);
    setStaffSearchQuery("");
  };

  // Function to handle consultation types changes
  const handleConsultationTypeChange = (
    index: number,
    field: "value" | "label",
    value: string
  ) => {
    const updatedTypes = [...(editedHospitalSettings.consultationTypes || [])];
    updatedTypes[index] = {
      ...updatedTypes[index],
      [field]: value,
    };

    setEditedHospitalSettings({
      ...editedHospitalSettings,
      consultationTypes: updatedTypes,
    });
  };

  // Function to add a new consultation type
  const handleAddConsultationType = () => {
    const updatedTypes = [...(editedHospitalSettings.consultationTypes || [])];
    updatedTypes.push({ value: "", label: "" });

    setEditedHospitalSettings({
      ...editedHospitalSettings,
      consultationTypes: updatedTypes,
    });
  };

  // Function to remove a consultation type
  const handleRemoveConsultationType = (index: number) => {
    const updatedTypes = [...(editedHospitalSettings.consultationTypes || [])];
    updatedTypes.splice(index, 1);

    setEditedHospitalSettings({
      ...editedHospitalSettings,
      consultationTypes: updatedTypes,
    });
  };

  // Function to handle time slots changes
  const handleTimeSlotsChange = (value: string) => {
    // Parse the textarea value into an array of time slots
    const slots = value
      .split("\n")
      .map((slot) => slot.trim())
      .filter((slot) => slot.length > 0);

    setEditedHospitalSettings({
      ...editedHospitalSettings,
      appointmentTimeSlots: slots,
    });
  };

  // Function to handle appointment types changes
  const handleAppointmentTypeChange = (
    index: number,
    field: "value" | "label",
    value: string
  ) => {
    const updatedTypes = [...(editedHospitalSettings.appointmentTypes || [])];
    updatedTypes[index] = {
      ...updatedTypes[index],
      [field]: value,
    };

    setEditedHospitalSettings({
      ...editedHospitalSettings,
      appointmentTypes: updatedTypes,
    });
  };

  // Function to add a new appointment type
  const handleAddAppointmentType = () => {
    const updatedTypes = [...(editedHospitalSettings.appointmentTypes || [])];
    updatedTypes.push({ value: "", label: "" });

    setEditedHospitalSettings({
      ...editedHospitalSettings,
      appointmentTypes: updatedTypes,
    });
  };

  // Function to remove an appointment type
  const handleRemoveAppointmentType = (index: number) => {
    const updatedTypes = [...(editedHospitalSettings.appointmentTypes || [])];
    updatedTypes.splice(index, 1);

    setEditedHospitalSettings({
      ...editedHospitalSettings,
      appointmentTypes: updatedTypes,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              System Settings
            </h1>
            <p className="text-muted-foreground">
              Manage users, departments, and system configuration
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="hmo">HMO Providers</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="hospital">Hospital Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage system users and their access levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staff.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.name}
                            </TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className="capitalize">
                              {user.role.replace("_", " ")}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  user.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.status === "active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleUserStatus(user.id)}
                              >
                                {user.status === "active"
                                  ? "Deactivate"
                                  : "Activate"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Add New User</CardTitle>
                    <CardDescription>Create a new user account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) =>
                            setNewUser({ ...newUser, name: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={newUser.username}
                          onChange={(e) =>
                            setNewUser({ ...newUser, username: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) =>
                            setNewUser({ ...newUser, email: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={newUser.phone}
                          onChange={(e) =>
                            setNewUser({ ...newUser, phone: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Select
                          value={newUser.department}
                          onValueChange={(value) =>
                            setNewUser({ ...newUser, department: value })
                          }
                        >
                          <SelectTrigger id="department">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments
                              .filter((dept) => dept.isActive)
                              .map((dept) => (
                                <SelectItem key={dept.id} value={dept.name}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(value) =>
                            setNewUser({ ...newUser, role: value as UserRole })
                          }
                        >
                          <SelectTrigger id="role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">
                              Super Admin
                            </SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="registration">
                              Registration
                            </SelectItem>
                            <SelectItem value="cash_point">
                              Cash Point
                            </SelectItem>
                            <SelectItem value="vitals">Vitals</SelectItem>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="injection_room">
                              Injection Room
                            </SelectItem>
                            <SelectItem value="lab">Laboratory</SelectItem>
                            <SelectItem value="pharmacist">
                              Pharmacist
                            </SelectItem>
                            <SelectItem value="hmo_desk">HMO Desk</SelectItem>
                            <SelectItem value="hmo_admin">HMO Admin</SelectItem>
                            <SelectItem value="records_officer">
                              Records Officer
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) =>
                            setNewUser({ ...newUser, password: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={newUser.confirmPassword}
                          onChange={(e) =>
                            setNewUser({
                              ...newUser,
                              confirmPassword: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Adding User..." : "Add User"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hmo" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>HMO Providers</CardTitle>
                    <CardDescription>
                      Manage HMO providers and their details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Contact Person</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hmoProviders.map((hmo) => (
                          <TableRow key={hmo.id}>
                            <TableCell className="font-medium">
                              {hmo.name}
                            </TableCell>
                            <TableCell>{hmo.contactPerson}</TableCell>
                            <TableCell>{hmo.email}</TableCell>
                            <TableCell>{hmo.phone}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  hmo.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {hmo.isActive ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleHmoStatus(hmo.id)}
                              >
                                {hmo.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Add HMO Provider</CardTitle>
                    <CardDescription>
                      Add a new HMO provider to the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddHmoProvider} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="hmoName">Provider Name</Label>
                        <Input
                          id="hmoName"
                          value={newHmoProvider.name}
                          onChange={(e) =>
                            setNewHmoProvider({
                              ...newHmoProvider,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactPerson">Contact Person</Label>
                        <Input
                          id="contactPerson"
                          value={newHmoProvider.contactPerson}
                          onChange={(e) =>
                            setNewHmoProvider({
                              ...newHmoProvider,
                              contactPerson: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hmoEmail">Email</Label>
                        <Input
                          id="hmoEmail"
                          type="email"
                          value={newHmoProvider.email}
                          onChange={(e) =>
                            setNewHmoProvider({
                              ...newHmoProvider,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hmoPhone">Phone</Label>
                        <Input
                          id="hmoPhone"
                          value={newHmoProvider.phone}
                          onChange={(e) =>
                            setNewHmoProvider({
                              ...newHmoProvider,
                              phone: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? "Adding Provider..."
                          : "Add HMO Provider"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Departments</CardTitle>
                    <CardDescription>
                      Manage hospital departments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department Name</TableHead>
                          <TableHead>Department Head</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departments.map((dept) => (
                          <TableRow key={dept.id}>
                            <TableCell className="font-medium">
                              {dept.name}
                            </TableCell>
                            <TableCell>{dept.head}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  dept.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {dept.isActive ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleToggleDepartmentStatus(dept.id)
                                }
                              >
                                {dept.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Add Department</CardTitle>
                    <CardDescription>
                      Add a new department to the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddDepartment} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="deptName">Department Name</Label>
                        <Input
                          id="deptName"
                          value={newDepartment.name}
                          onChange={(e) =>
                            setNewDepartment({
                              ...newDepartment,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deptHead">Department Head</Label>
                        <div className="flex gap-2">
                          <Input
                            id="deptHead"
                            value={newDepartment.head}
                            readOnly
                            placeholder="Search for staff member"
                            onClick={() => setStaffSearchOpen(true)}
                            className="cursor-pointer"
                            required
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setStaffSearchOpen(true)}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          {newDepartment.head && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                setNewDepartment({
                                  ...newDepartment,
                                  head: "",
                                  headId: "",
                                })
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? "Adding Department..."
                          : "Add Department"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hospital" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Hospital Settings</CardTitle>
                <CardDescription>
                  Configure general hospital information and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSaveHospitalSettings}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="hospitalName">Hospital Name</Label>
                      <Input
                        id="hospitalName"
                        value={editedHospitalSettings.hospitalName}
                        onChange={(e) =>
                          setEditedHospitalSettings({
                            ...editedHospitalSettings,
                            hospitalName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={editedHospitalSettings.address}
                        onChange={(e) =>
                          setEditedHospitalSettings({
                            ...editedHospitalSettings,
                            address: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={editedHospitalSettings.phone}
                        onChange={(e) =>
                          setEditedHospitalSettings({
                            ...editedHospitalSettings,
                            phone: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedHospitalSettings.email}
                        onChange={(e) =>
                          setEditedHospitalSettings({
                            ...editedHospitalSettings,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        value={editedHospitalSettings.taxId}
                        onChange={(e) =>
                          setEditedHospitalSettings({
                            ...editedHospitalSettings,
                            taxId: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Replace the single consultation fee field with these three fields */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Consultation Fees</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="generalMedicineFee">
                            General Medicine Fee (₦)
                          </Label>
                          <Input
                            id="generalMedicineFee"
                            type="number"
                            value={editedHospitalSettings.generalMedicineFee}
                            onChange={(e) =>
                              setEditedHospitalSettings({
                                ...editedHospitalSettings,
                                generalMedicineFee: Number(e.target.value),
                                consultationFee: Number(e.target.value), // Update legacy field for backward compatibility
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pediatricsFee">
                            Pediatrics Fee (₦)
                          </Label>
                          <Input
                            id="pediatricsFee"
                            type="number"
                            value={editedHospitalSettings.pediatricsFee}
                            onChange={(e) =>
                              setEditedHospitalSettings({
                                ...editedHospitalSettings,
                                pediatricsFee: Number(e.target.value),
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="specialistFee">
                            Specialist Fee (₦)
                          </Label>
                          <Input
                            id="specialistFee"
                            type="number"
                            value={editedHospitalSettings.specialistFee}
                            onChange={(e) =>
                              setEditedHospitalSettings({
                                ...editedHospitalSettings,
                                specialistFee: Number(e.target.value),
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Add staff discount settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Staff Benefits</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="staffDiscount">
                            Staff Discount (%)
                          </Label>
                          <Input
                            id="staffDiscount"
                            type="number"
                            min="0"
                            max="100"
                            value={editedHospitalSettings.staffDiscount}
                            onChange={(e) =>
                              setEditedHospitalSettings({
                                ...editedHospitalSettings,
                                staffDiscount: Number(e.target.value),
                              })
                            }
                            required
                          />
                          <p className="text-sm text-muted-foreground">
                            Discount percentage applied to staff members when
                            they are patients
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Remove or comment out this block
                    <div className="space-y-2">
                      <Label htmlFor="consultationFee">Default Consultation Fee (₦)</Label>
                      <Input
                        id="consultationFee"
                        type="number"
                        value={editedHospitalSettings.consultationFee}
                        onChange={(e) =>
                          setEditedHospitalSettings({
                            ...editedHospitalSettings,
                            consultationFee: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                    */}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Appointment Settings
                    </h3>

                    <div className="space-y-4">
                      <Label>Consultation Types</Label>
                      <div className="space-y-2">
                        {(editedHospitalSettings.consultationTypes || []).map(
                          (type, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Input
                                placeholder="Value (e.g. initial)"
                                value={type.value}
                                onChange={(e) =>
                                  handleConsultationTypeChange(
                                    index,
                                    "value",
                                    e.target.value
                                  )
                                }
                                className="flex-1"
                              />
                              <Input
                                placeholder="Label (e.g. Initial Consultation)"
                                value={type.label}
                                onChange={(e) =>
                                  handleConsultationTypeChange(
                                    index,
                                    "label",
                                    e.target.value
                                  )
                                }
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  handleRemoveConsultationType(index)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddConsultationType}
                          className="w-full"
                        >
                          Add Consultation Type
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeSlots">Appointment Time Slots</Label>
                      <Textarea
                        id="timeSlots"
                        placeholder="Enter time slots, one per line (e.g. 08:00 AM)"
                        value={(
                          editedHospitalSettings.appointmentTimeSlots || []
                        ).join("\n")}
                        onChange={(e) => handleTimeSlotsChange(e.target.value)}
                        className="min-h-[150px]"
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter one time slot per line (e.g. 08:00 AM)
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Label>Appointment Types</Label>
                      <div className="space-y-2">
                        {(editedHospitalSettings.appointmentTypes || []).map(
                          (type, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Input
                                placeholder="Value (e.g. consultation)"
                                value={type.value}
                                onChange={(e) =>
                                  handleAppointmentTypeChange(
                                    index,
                                    "value",
                                    e.target.value
                                  )
                                }
                                className="flex-1"
                              />
                              <Input
                                placeholder="Label (e.g. Consultation)"
                                value={type.label}
                                onChange={(e) =>
                                  handleAppointmentTypeChange(
                                    index,
                                    "label",
                                    e.target.value
                                  )
                                }
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  handleRemoveAppointmentType(index)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddAppointmentType}
                          className="w-full"
                        >
                          Add Appointment Type
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">System Settings</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoBackup">
                          Automatic Daily Backup
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically backup the system database daily
                        </p>
                      </div>
                      <Switch
                        id="autoBackup"
                        checked={editedHospitalSettings.autoBackup}
                        onCheckedChange={(checked) =>
                          setEditedHospitalSettings({
                            ...editedHospitalSettings,
                            autoBackup: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailNotifications">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Send email notifications to patients for appointments
                        </p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={editedHospitalSettings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setEditedHospitalSettings({
                            ...editedHospitalSettings,
                            emailNotifications: checked,
                          })
                        }
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving Settings..." : "Save Settings"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Staff Search Dialog */}
      <Dialog open={staffSearchOpen} onOpenChange={setStaffSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Staff</DialogTitle>
            <DialogDescription>
              Search for a staff member to assign as department head
            </DialogDescription>
          </DialogHeader>
          <Command className="rounded-lg border shadow-md">
            <CommandInput
              placeholder="Search staff by name or username..."
              value={staffSearchQuery}
              onValueChange={setStaffSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No staff members found.</CommandEmpty>
              <CommandGroup heading="Active Staff">
                {staffSearchResults.map((staffMember) => (
                  <CommandItem
                    key={staffMember.id}
                    onSelect={() =>
                      handleSelectStaff(staffMember.id, staffMember.name)
                    }
                    className="cursor-pointer"
                  >
                    {staffMember.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
      <Toaster />
    </MainLayout>
  );
}
