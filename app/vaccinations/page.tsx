"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  useStoreExtension,
  type VaccinationAppointment,
} from "@/lib/data/storeext";
import { useVaccineStore } from "@/lib/data/vaccines";
import { useAppStore } from "@/lib/data/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function VaccinationsPage() {
  const { getVaccinationAppointments } = useStoreExtension();
  const { getAllVaccines } = useVaccineStore();
  const { getPatientById } = useAppStore();
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    vaccines: 0,
  });
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<
    VaccinationAppointment[]
  >([]);
  const [completedVaccinations, setCompletedVaccinations] = useState<
    VaccinationAppointment[]
  >([]);

  useEffect(() => {
    // Get all vaccination appointments
    const allVaccinations = getVaccinationAppointments();

    // Get upcoming vaccinations (scheduled or in progress)
    const upcoming = allVaccinations.filter(
      (appt) => appt.status === "scheduled" || appt.status === "In Progress"
    );

    // Get completed vaccinations
    const completed = allVaccinations.filter(
      (appt) => appt.status === "completed"
    );

    // Get total number of vaccines
    const vaccines = getAllVaccines().length;

    // Set stats
    setStats({
      total: allVaccinations.length,
      upcoming: upcoming.length,
      completed: completed.length,
      vaccines: vaccines,
    });

    setUpcomingVaccinations(upcoming);
    setCompletedVaccinations(completed);
  }, [getVaccinationAppointments, getAllVaccines, getPatientById]);

  // Helper function to format dose type for display
  const formatDoseType = (doseType: string) => {
    switch (doseType) {
      case "initial":
        return "Initial Dose";
      case "review":
        return "Review Dose";
      case "subsequent":
        return "Subsequent Dose";
      case "one_off":
        return "One-off Dose";
      default:
        return doseType;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Vaccination Center</h1>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/vaccinations/schedule">Schedule Vaccination</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/vaccinations/manage">Manage Vaccines</Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Vaccinations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcoming}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Vaccines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.vaccines}</div>
            </CardContent>
          </Card>
        </div>

        {/* Vaccination Lists */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Vaccinations</TabsTrigger>
            <TabsTrigger value="completed">Completed Vaccinations</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Vaccinations</CardTitle>
                <CardDescription>
                  Scheduled and in-progress vaccination appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingVaccinations.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No upcoming vaccinations scheduled
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingVaccinations.map((vaccination) => (
                      <div
                        key={vaccination.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">
                            {vaccination.patientName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {vaccination.vaccinationDetails.vaccineName} -{" "}
                            {formatDoseType(
                              vaccination.vaccinationDetails.doseType
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {vaccination.date}
                            <Clock className="h-3 w-3 ml-2" />
                            {vaccination.time}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              vaccination.status === "scheduled"
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {vaccination.status}
                          </Badge>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/patients/${vaccination.patientId}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Vaccinations</CardTitle>
                <CardDescription>
                  History of completed vaccination appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedVaccinations.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No completed vaccinations found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedVaccinations.map((vaccination) => (
                      <div
                        key={vaccination.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">
                            {vaccination.patientName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {vaccination.vaccinationDetails.vaccineName} -{" "}
                            {formatDoseType(
                              vaccination.vaccinationDetails.doseType
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {vaccination.date}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/patients/${vaccination.patientId}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
