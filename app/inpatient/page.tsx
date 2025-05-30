"use client";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  inpatientStats,
  rooms,
  inpatients,
} from "@/lib/data/inpatient-dummy-data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ArrowRight,
  BedDouble,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default function InpatientDashboard() {
  const router = useRouter();

  // Prepare data for room type distribution chart
  const roomTypeData = [
    {
      name: "Standard",
      value: rooms.filter((room) => room.type === "Standard").length,
    },
    {
      name: "Private",
      value: rooms.filter((room) => room.type === "Private").length,
    },
    { name: "ICU", value: rooms.filter((room) => room.type === "ICU").length },
  ];

  // Prepare data for occupancy by room type chart
  const occupancyByTypeData = [
    {
      name: "Standard",
      occupied: rooms.filter(
        (room) => room.type === "Standard" && room.occupied
      ).length,
      available: rooms.filter(
        (room) => room.type === "Standard" && !room.occupied
      ).length,
    },
    {
      name: "Private",
      occupied: rooms.filter((room) => room.type === "Private" && room.occupied)
        .length,
      available: rooms.filter(
        (room) => room.type === "Private" && !room.occupied
      ).length,
    },
    {
      name: "ICU",
      occupied: rooms.filter((room) => room.type === "ICU" && room.occupied)
        .length,
      available: rooms.filter((room) => room.type === "ICU" && !room.occupied)
        .length,
    },
  ];

  // Prepare data for diagnosis distribution
  const diagnosisData = inpatients.reduce((acc, patient) => {
    const existingDiagnosis = acc.find(
      (item) => item.name === patient.diagnosis
    );
    if (existingDiagnosis) {
      existingDiagnosis.value += 1;
    } else {
      acc.push({ name: patient.diagnosis, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Colors for pie charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Inpatient Dashboard</h1>
          <Button onClick={() => router.push("/inpatient/patients")}>
            View Admitted Patients
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">
                    Total Beds
                  </span>
                  <h3 className="text-2xl font-bold">
                    {inpatientStats.totalBeds}
                  </h3>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <BedDouble className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">
                    Occupancy Rate
                  </span>
                  <h3 className="text-2xl font-bold">
                    {inpatientStats.occupancyRate.toFixed(1)}%
                  </h3>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">
                    Current Inpatients
                  </span>
                  <h3 className="text-2xl font-bold">{inpatients.length}</h3>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">
                    Avg. Length of Stay
                  </span>
                  <h3 className="text-2xl font-bold">
                    {inpatientStats.averageLengthOfStay} days
                  </h3>
                </div>
                <div className="p-2 bg-amber-100 rounded-full">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Room Occupancy by Type</CardTitle>
              <CardDescription>
                Current distribution of occupied and available beds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={occupancyByTypeData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="occupied"
                      stackId="a"
                      fill="#0088FE"
                      name="Occupied"
                    />
                    <Bar
                      dataKey="available"
                      stackId="a"
                      fill="#00C49F"
                      name="Available"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Admissions</CardTitle>
              <CardDescription>
                Patients admitted in the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Patient</th>
                      <th className="text-left py-3 px-4">Room</th>
                      <th className="text-left py-3 px-4">Diagnosis</th>
                      <th className="text-left py-3 px-4">Doctor</th>
                      <th className="text-left py-3 px-4">Admission Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inpatients.slice(0, 5).map((patient) => (
                      <tr
                        key={patient.id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-3 px-4">{patient.name}</td>
                        <td className="py-3 px-4">{patient.roomNumber}</td>
                        <td className="py-3 px-4">{patient.diagnosis}</td>
                        <td className="py-3 px-4">{patient.doctor}</td>
                        <td className="py-3 px-4">
                          {patient.admissionDate.toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
