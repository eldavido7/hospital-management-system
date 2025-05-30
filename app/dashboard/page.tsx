"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clipboard,
  FileText,
  FlaskRoundIcon as Flask,
  Pill,
  Syringe,
  CreditCard,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { MainLayout } from "@/components/layout/main-layout";
import CashPointDashboard from "../billing/CashPointDashboard";
import { Toaster } from "@/components/ui/toaster";

// Simple Bar Chart Component
const SimpleBarChart = ({
  data,
}: {
  data: { month: string; revenue: number }[];
}) => {
  const maxRevenue = Math.max(...data.map((item) => item.revenue));

  return (
    <div className="w-full h-[300px] mt-6">
      <div className="flex items-end h-[250px] space-x-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-primary rounded-t-md transition-all duration-500"
              style={{ height: `${(item.revenue / maxRevenue) * 220}px` }}
            ></div>
            <div className="text-xs mt-2 font-medium">{item.month}</div>
            <div className="text-xs text-muted-foreground">
              ₦{(item.revenue / 1000000).toFixed(1)}M
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple Line Chart Component
const SimpleLineChart = ({
  data,
}: {
  data: { month: string; newPatients: number; returnPatients: number }[];
}) => {
  const maxPatients = Math.max(
    ...data.map((item) => Math.max(item.newPatients, item.returnPatients))
  );

  return (
    <div className="w-full h-[300px] mt-6">
      <div className="relative h-[250px]">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-muted-foreground">
          <span>{maxPatients}</span>
          <span>{Math.floor(maxPatients / 2)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="absolute left-12 right-0 top-0 bottom-0 border-b border-l border-border">
          {/* New patients line */}
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <polyline
              points={data
                .map(
                  (item, i) =>
                    `${(i / (data.length - 1)) * 100}% ${
                      100 - (item.newPatients / maxPatients) * 100
                    }%`
                )
                .join(" ")}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Return patients line */}
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <polyline
              points={data
                .map(
                  (item, i) =>
                    `${(i / (data.length - 1)) * 100}% ${
                      100 - (item.returnPatients / maxPatients) * 100
                    }%`
                )
                .join(" ")}
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* X-axis labels */}
          <div className="absolute left-0 right-0 bottom-[-20px] flex justify-between text-xs">
            {data.map((item, i) => (
              <span key={i}>{item.month}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center mt-6 space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-primary rounded-full mr-1"></div>
          <span>New Patients</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-secondary rounded-full mr-1"></div>
          <span>Return Patients</span>
        </div>
      </div>
    </div>
  );
};

// Cash Point Dashboard Component

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Mock data for dashboard charts
  const revenueData = [
    { month: "Jan", revenue: 1200000 },
    { month: "Feb", revenue: 1500000 },
    { month: "Mar", revenue: 1800000 },
    { month: "Apr", revenue: 1600000 },
    { month: "May", revenue: 2100000 },
    { month: "Jun", revenue: 2400000 },
  ];

  const patientData = [
    { month: "Jan", newPatients: 120, returnPatients: 350 },
    { month: "Feb", newPatients: 150, returnPatients: 390 },
    { month: "Mar", newPatients: 180, returnPatients: 420 },
    { month: "Apr", newPatients: 160, returnPatients: 380 },
    { month: "May", newPatients: 210, returnPatients: 450 },
    { month: "Jun", newPatients: 240, returnPatients: 480 },
  ];

  // Mock data for dashboard
  const stats = [
    {
      title: "Total Patients",
      value: "3,456",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      color: "bg-blue-500",
    },
    {
      title: "Appointments Today",
      value: "24",
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
      color: "bg-green-500",
    },
    {
      title: "Revenue (Monthly)",
      value: "₦2.4M",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      color: "bg-purple-500",
    },
    {
      title: "Active Staff",
      value: "32",
      icon: <Activity className="h-4 w-4 text-muted-foreground" />,
      color: "bg-orange-500",
    },
  ];

  // Recent patients data
  const recentPatients = [
    {
      id: "PT-2023-001",
      name: "Aisha Mohammed",
      time: "10:30 AM",
      status: "Waiting",
      doctor: "Dr. Okonkwo",
    },
    {
      id: "PT-2023-045",
      name: "Emmanuel Okafor",
      time: "11:15 AM",
      status: "With Doctor",
      doctor: "Dr. Adeyemi",
    },
    {
      id: "PT-2023-062",
      name: "Ngozi Eze",
      time: "12:00 PM",
      status: "Lab Tests",
      doctor: "Dr. Nwachukwu",
    },
    {
      id: "PT-2023-078",
      name: "Oluwaseun Adeleke",
      time: "01:30 PM",
      status: "Completed",
      doctor: "Dr. Okonkwo",
    },
    {
      id: "PT-2023-083",
      name: "Chinedu Okoro",
      time: "02:15 PM",
      status: "Waiting",
      doctor: "Dr. Adeyemi",
    },
  ];

  // Quick actions based on user role
  const getQuickActions = () => {
    switch (user?.role) {
      case "super_admin":
        return [
          {
            title: "Staff Management",
            icon: <Users className="h-5 w-5" />,
            action: () => router.push("/settings/staff"),
          },
          {
            title: "Reports",
            icon: <TrendingUp className="h-5 w-5" />,
            action: () => router.push("/reports"),
          },
        ];
      case "manager":
        return [
          {
            title: "Staff Management",
            icon: <Users className="h-5 w-5" />,
            action: () => router.push("/settings/staff"),
          },
          {
            title: "Reports",
            icon: <TrendingUp className="h-5 w-5" />,
            action: () => router.push("/reports"),
          },
        ];
      case "doctor":
        return [
          {
            title: "View Queue",
            icon: <Users className="h-5 w-5" />,
            action: () => router.push("/doctor/queue"),
          },
          {
            title: "Patient Records",
            icon: <FileText className="h-5 w-5" />,
            action: () => router.push("/patients/search"),
          },
        ];
      case "vitals":
        return [
          {
            title: "Record Vitals",
            icon: <Activity className="h-5 w-5" />,
            action: () => router.push("/vitals"),
          },
          {
            title: "Patient Records",
            icon: <FileText className="h-5 w-5" />,
            action: () => router.push("/patients/search"),
          },
        ];
      case "registration":
        return [
          {
            title: "Register Patient",
            icon: <Users className="h-5 w-5" />,
            action: () => router.push("/patients/register"),
          },
          {
            title: "Appointments",
            icon: <Calendar className="h-5 w-5" />,
            action: () => router.push("/appointments"),
          },
        ];
      case "lab":
        return [
          {
            title: "Lab Tests",
            icon: <Flask className="h-5 w-5" />,
            action: () => router.push("/laboratory"),
          },
          {
            title: "Patient Records",
            icon: <FileText className="h-5 w-5" />,
            action: () => router.push("/patients/search"),
          },
        ];
      case "pharmacist":
        return [
          {
            title: "Pharmacy Queue",
            icon: <Pill className="h-5 w-5" />,
            action: () => router.push("/pharmacy"),
          },
          {
            title: "Inventory",
            icon: <Clipboard className="h-5 w-5" />,
            action: () => router.push("/pharmacy/inventory"),
          },
        ];
      case "injection_room":
        return [
          {
            title: "Injections",
            icon: <Syringe className="h-5 w-5" />,
            action: () => router.push("/injection-room"),
          },
          {
            title: "Patient Records",
            icon: <FileText className="h-5 w-5" />,
            action: () => router.push("/patients/search"),
          },
        ];
      case "cash_point":
        return [
          {
            title: "Billing",
            icon: <CreditCard className="h-5 w-5" />,
            action: () => router.push("/billing"),
          },
          {
            title: "Payment History",
            icon: <History className="h-5 w-5" />,
            action: () => router.push("/billing/payment-history"),
          },
        ];
      case "hmo_desk":
        return [
          {
            title: "View Patients",
            icon: <Users className="h-5 w-5" />,
            action: () => router.push("/patients/search"),
          },
          {
            title: "Appointments",
            icon: <Calendar className="h-5 w-5" />,
            action: () => router.push("/appointments"),
          },
        ];
      case "hmo_admin":
        return [
          {
            title: "HMO Reports",
            icon: <TrendingUp className="h-5 w-5" />,
            action: () => router.push("/reports"),
          },
          {
            title: "HMO Management",
            icon: <FileText className="h-5 w-5" />,
            action: () => router.push("/hmo"),
          },
        ];
      case "records_officer":
        return [
          {
            title: "Patient Records",
            icon: <FileText className="h-5 w-5" />,
            action: () => router.push("/patients/search"),
          },
          {
            title: "Reports",
            icon: <TrendingUp className="h-5 w-5" />,
            action: () => router.push("/reports"),
          },
        ];
      default:
        return [
          {
            title: "Patient Records",
            icon: <FileText className="h-5 w-5" />,
            action: () => router.push("/patients/search"),
          },
          {
            title: "Settings",
            icon: <FileText className="h-5 w-5" />,
            action: () => router.push("/settings"),
          },
        ];
    }
  };

  // If user is a cashier, show the specialized dashboard
  if (user?.role === "cash_point") {
    return (
      <MainLayout>
        <CashPointDashboard />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            {(user?.role === "registration" ||
              user?.role === "super_admin" ||
              user?.role === "manager") && (
              <Button onClick={() => router.push("/patients/register")}>
                Register New Patient
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          {(user?.role === "super_admin" || user?.role === "manager") && (
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="overview" className="space-y-4">
            {(user?.role === "super_admin" ||
              user?.role === "manager" ||
              user?.role === "records_officer") && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <div className={`${stat.color} p-2 rounded-full`}>
                        {stat.icon}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Today's Patient Queue</CardTitle>
                  <CardDescription>
                    Patients currently in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentPatients.map((patient, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b py-2"
                      >
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.id} • {patient.time}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              patient.status === "Waiting"
                                ? "bg-yellow-100 text-yellow-800"
                                : patient.status === "With Doctor"
                                ? "bg-blue-100 text-blue-800"
                                : patient.status === "Lab Tests"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {patient.status}
                          </span>
                          <span className="ml-4 text-sm text-muted-foreground">
                            {patient.doctor}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks for your role</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {getQuickActions().map((action, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center space-y-2"
                        onClick={action.action}
                      >
                        {action.icon}
                        <span>{action.title}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>
                    Monthly revenue for the past 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart data={revenueData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Patient Statistics</CardTitle>
                  <CardDescription>New vs returning patients</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleLineChart data={patientData} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>
                  Access and generate hospital reports
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Detailed reports are available in the Reports section
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => router.push("/reports")}
                  >
                    Go to Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </MainLayout>
  );
}
