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
import { ArrowLeft, FileText, Search, User, Plus } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/data/store";
import { Toaster } from "@/components/ui/toaster";

export default function PatientSearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("name");
  const [searchResults, setSearchResults] = useState<
    ReturnType<typeof useAppStore.getState>["patients"]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Add state for search suggestions and pagination
  const [searchSuggestions, setSearchSuggestions] = useState<
    ReturnType<typeof useAppStore.getState>["patients"]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Get patients from the store
  const { patients, searchPatients } = useAppStore();

  // Calculate pagination indexes
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = searchResults.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(searchResults.length / itemsPerPage);

  // Update search function to show suggestions as user types
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length >= 2) {
      // Filter suggestions based on current search type
      const results = searchPatients(term, searchBy).slice(0, 5); // Limit to 5 suggestions
      setSearchSuggestions(results);
    } else {
      setSearchSuggestions([]);
    }
  };

  // Function to select a patient from suggestions
  const handleSuggestionSelect = (
    patient: ReturnType<typeof useAppStore.getState>["patients"][0]
  ) => {
    setSearchSuggestions([]);
    setSearchTerm(
      searchBy === "name"
        ? patient.name
        : searchBy === "id"
        ? patient.id
        : patient.phone
    );
    setSearchResults([patient]);
    setHasSearched(true);
  };

  // Update pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    // Simulate API call
    setTimeout(() => {
      const results = searchPatients(searchTerm, searchBy);
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const handleViewPatient = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  const handleRegisterPatient = () => {
    router.push("/patients/register");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Patient Search
            </h1>
            <p className="text-muted-foreground">
              Search for patients in the system
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button onClick={handleRegisterPatient}>
              <Plus className="mr-2 h-4 w-4" />
              Register New Patient
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Patients</CardTitle>
            <CardDescription>
              Search by name, ID, or phone number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/4">
                <Select defaultValue={searchBy} onValueChange={setSearchBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Search by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="id">Patient ID</SelectItem>
                    <SelectItem value="phone">Phone Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-full md:w-3/4 space-x-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={`Search by ${searchBy}...`}
                    className="pl-8"
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />

                  {/* Search suggestions dropdown */}
                  {searchSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {searchSuggestions.map((patient) => (
                        <div
                          key={patient.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSuggestionSelect(patient)}
                        >
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {patient.id} • {patient.gender}, {patient.age}{" "}
                            years
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasSearched && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                {searchResults.length === 0
                  ? "No patients found matching your search criteria."
                  : `Found ${searchResults.length} patient(s) matching your search.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchResults.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>{patient.id}</TableCell>
                        <TableCell className="font-medium">
                          {patient.name}
                        </TableCell>
                        <TableCell>
                          {patient.age} / {patient.gender}
                        </TableCell>
                        <TableCell>
                          <div>{patient.phone}</div>
                          <div className="text-xs text-muted-foreground">
                            {patient.email}
                          </div>
                        </TableCell>
                        <TableCell>{patient.lastVisit}</TableCell>
                        <TableCell>
                          {patient.patientType === "hmo" ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-800"
                            >
                              HMO - {patient.hmoProvider}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-800"
                            >
                              Cash
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPatient(patient.id)}
                            >
                              <User className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No patients found matching your search criteria.
                  </p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Try a different search term or criteria.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {searchResults.length > itemsPerPage && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
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
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </MainLayout>
  );
}
