"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import Link from "next/link"
import { inpatients } from "@/lib/data/inpatient-dummy-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

export default function InpatientPatients() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPatients = inpatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate days since admission for each patient
  const calculateDaysSinceAdmission = (admissionDate: Date) => {
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - admissionDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admitted Patients</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              Back
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients..."
                className="w-[250px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Inpatients ({filteredPatients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Age/Gender</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Days Admitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>
                        {patient.age} / {patient.gender}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{patient.roomNumber}</Badge>
                      </TableCell>
                      <TableCell>{patient.diagnosis}</TableCell>
                      <TableCell>{patient.doctor}</TableCell>
                      <TableCell>{calculateDaysSinceAdmission(patient.admissionDate)}</TableCell>
                      <TableCell>
                        <Link href={`/inpatient/room/${patient.roomId}`}>
                          <Button variant="outline" size="sm">
                            View Room
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No patients found matching your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
