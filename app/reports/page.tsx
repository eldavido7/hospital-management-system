"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BarChart4,
  Download,
  FileText,
  Printer,
} from "lucide-react";
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
import { DatePickerWithRange } from "@/components/date-range-picker";
import { useToast } from "@/components/ui/use-toast";
import type { DateRange } from "react-day-picker";
import { format, isWithinInterval, parseISO, startOfMonth } from "date-fns";
import { useAppStore } from "@/lib/data/store";

// Add a simple chart component
const SimpleBarChart = ({
  data,
  xKey,
  yKey,
  title,
}: {
  data: any[];
  xKey: string;
  yKey: string;
  title: string;
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d[yKey]));

  return (
    <div className="w-full h-full">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="relative h-[300px] w-full">
        {data.map((item, index) => (
          <div
            key={index}
            className="absolute bottom-0 flex flex-col items-center"
            style={{
              left: `${(index / (data.length - 1 || 1)) * 90 + 5}%`,
              height: `${((item[yKey] || 0) / (maxValue || 1)) * 80}%`,
            }}
          >
            <div
              className="w-12 bg-primary rounded-t-md"
              style={{ height: item[yKey] ? "100%" : "5px" }}
            ></div>
            <span className="text-xs mt-1">{item[xKey]}</span>
            <span className="text-xs font-medium">
              {typeof item[yKey] === "number"
                ? item[yKey].toLocaleString()
                : item[yKey] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("revenue");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // Get data from store
  const { bills, patients, hmoClaims, staff, labRequests, formatCurrency } =
    useAppStore();

  // Filter data by date range
  const filterByDateRange = <T extends { date: string }>(data: T[]): T[] => {
    if (!dateRange?.from || !dateRange?.to) return data;

    return data.filter((item) => {
      try {
        const itemDate = parseISO(item.date);
        return isWithinInterval(itemDate, {
          start: dateRange.from!,
          end: dateRange.to!,
        });
      } catch (e) {
        return false;
      }
    });
  };

  // Group data by month
  const groupByMonth = <T extends { date: string }>(
    data: T[],
    valueKey?: keyof T
  ): any[] => {
    const grouped = data.reduce((acc, item) => {
      try {
        const date = parseISO(item.date);
        const monthYear = format(date, "MMM yyyy");

        if (!acc[monthYear]) {
          acc[monthYear] = {
            month: monthYear,
            count: 0,
            value: 0,
            items: [],
          };
        }

        acc[monthYear].count += 1;
        acc[monthYear].items.push(item);

        if (valueKey && typeof item[valueKey] === "number") {
          acc[monthYear].value += item[valueKey] as number;
        }

        return acc;
      } catch (e) {
        return acc;
      }
    }, {} as Record<string, any>);

    return Object.values(grouped);
  };

  // Calculate revenue data
  const getRevenueData = () => {
    const filteredBills = filterByDateRange(bills);

    // Group by month and calculate totals
    const monthlyData = filteredBills.reduce((acc, bill) => {
      try {
        const date = parseISO(bill.date);
        const monthYear = format(date, "MMM yyyy");

        if (!acc[monthYear]) {
          acc[monthYear] = {
            date: monthYear,
            consultations: 0,
            pharmacy: 0,
            laboratory: 0,
            total: 0,
          };
        }

        // Use the recorded total if available (which includes any discounts), otherwise calculate
        const total =
          bill.total ||
          bill.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
          );

        if (bill.type === "consultation") {
          acc[monthYear].consultations += total;
        } else if (bill.type === "pharmacy") {
          acc[monthYear].pharmacy += total;
        } else if (bill.type === "laboratory") {
          acc[monthYear].laboratory += total;
        }

        acc[monthYear].total += total;

        return acc;
      } catch (e) {
        return acc;
      }
    }, {} as Record<string, any>);

    return Object.values(monthlyData);
  };

  // Calculate patient data
  const getPatientData = () => {
    // Filter patients by their last visit date
    const filteredPatients = patients.filter((patient) => {
      if (!dateRange?.from || !dateRange?.to || !patient.lastVisit)
        return false;

      try {
        const visitDate = parseISO(patient.lastVisit);
        return isWithinInterval(visitDate, {
          start: dateRange.from,
          end: dateRange.to,
        });
      } catch (e) {
        return false;
      }
    });

    // Group by month
    const monthlyData = filteredPatients.reduce((acc, patient) => {
      try {
        const date = parseISO(patient.lastVisit);
        const monthYear = format(date, "MMM yyyy");

        if (!acc[monthYear]) {
          acc[monthYear] = {
            date: monthYear,
            newPatients: 0,
            returnPatients: 0,
            hmoPatients: 0,
            cashPatients: 0,
            total: 0,
          };
        }

        // Determine if new or returning patient (simplified logic)
        const isNewPatient = !patient.visits || patient.visits.length <= 1;

        if (isNewPatient) {
          acc[monthYear].newPatients += 1;
        } else {
          acc[monthYear].returnPatients += 1;
        }

        if (patient.patientType === "hmo") {
          acc[monthYear].hmoPatients += 1;
        } else {
          acc[monthYear].cashPatients += 1;
        }

        acc[monthYear].total += 1;

        return acc;
      } catch (e) {
        return acc;
      }
    }, {} as Record<string, any>);

    return Object.values(monthlyData);
  };

  // Calculate department data
  const getDepartmentData = (): {
    department: string;
    patients: number;
    revenue: number;
  }[] => {
    // Get all visits within date range
    const visitsInRange: any[] = [];

    patients.forEach((patient) => {
      if (patient.visits) {
        patient.visits.forEach((visit) => {
          if (!dateRange?.from || !dateRange?.to || !visit.date) return;

          try {
            const visitDate = parseISO(visit.date);
            if (
              isWithinInterval(visitDate, {
                start: dateRange.from,
                end: dateRange.to,
              })
            ) {
              visitsInRange.push({
                ...visit,
                patientId: patient.id,
                patientType: patient.patientType,
              });
            }
          } catch (e) {
            // Skip invalid dates
          }
        });
      }
    });

    // Group by department (doctor)
    const departmentData = visitsInRange.reduce((acc, visit) => {
      const department = visit.doctor
        ? visit.doctor.split(" ")[1] || "General"
        : "General";

      if (!acc[department]) {
        acc[department] = {
          department,
          patients: 0,
          revenue: 0,
        };
      }

      acc[department].patients += 1;

      // Estimate revenue based on patient type
      const baseRevenue = visit.patientType === "hmo" ? 5000 : 7000;
      acc[department].revenue += baseRevenue;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(departmentData);
  };

  // Calculate HMO data
  const getHMOData = () => {
    const filteredClaims = filterByDateRange(hmoClaims);

    // Group by HMO provider
    const hmoData = filteredClaims.reduce((acc, claim) => {
      const provider = claim.hmoProvider;

      if (!acc[provider]) {
        acc[provider] = {
          provider,
          patients: 0,
          claims: 0,
          approved: 0,
          rejected: 0,
          totalAmount: 0,
          approvedAmount: 0,
          claimsList: [],
        };
      }

      // Add to claims list for detailed view
      acc[provider].claimsList.push(claim);

      // Count unique patients
      if (!acc[provider].patientIds) {
        acc[provider].patientIds = new Set();
      }
      acc[provider].patientIds.add(claim.patientId);
      acc[provider].patients = acc[provider].patientIds.size;

      acc[provider].claims += 1;

      if (claim.status === "approved" || claim.status === "completed") {
        acc[provider].approved += 1;
      } else if (claim.status === "rejected") {
        acc[provider].rejected += 1;
      }

      const claimAmount = claim.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      acc[provider].totalAmount += claimAmount;

      if (claim.status === "approved" || claim.status === "completed") {
        const approvedAmount = claim.items.reduce((sum, item) => {
          if (item.approved) {
            return sum + item.quantity * item.unitPrice;
          }
          return sum;
        }, 0);
        acc[provider].approvedAmount += approvedAmount;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(hmoData).map((item) => {
      const { patientIds, claimsList, ...rest } = item;
      return rest;
    });
  };

  // Get chart data based on report type
  const getChartData = () => {
    switch (reportType) {
      case "revenue": {
        const data = getRevenueData();
        return {
          data: data.map((item) => ({ name: item.date, value: item.total })),
          title: "Revenue by Month",
        };
      }
      case "patient": {
        const data = getPatientData();
        return {
          data: data.map((item) => ({ name: item.date, value: item.total })),
          title: "Patients by Month",
        };
      }
      case "department": {
        const data = getDepartmentData();
        return {
          data: data.map((item) => ({
            name: item.department,
            value: item.revenue,
          })),
          title: "Revenue by Department",
        };
      }
      case "hmo": {
        const data = getHMOData();
        return {
          data: data.map((item) => ({
            name: item.provider,
            value: item.approvedAmount,
          })),
          title: "Approved Amount by HMO",
        };
      }
      default:
        return { data: [], title: "" };
    }
  };

  const handlePrintReport = () => {
    toast({
      title: "Printing report",
      description: "The report is being sent to the printer.",
    });
  };

  const handleDownloadReport = () => {
    toast({
      title: "Downloading report",
      description: "The report is being downloaded as CSV.",
    });
  };

  const handleHMOClick = (provider: string) => {
    router.push(`/reports/details/${encodeURIComponent(provider)}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Generate and view hospital reports
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Parameters</CardTitle>
            <CardDescription>
              Select the type of report and date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select defaultValue={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue Report</SelectItem>
                    <SelectItem value="patient">Patient Statistics</SelectItem>
                    <SelectItem value="department">
                      Department Performance
                    </SelectItem>
                    <SelectItem value="hmo">HMO Claims Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <DatePickerWithRange
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handlePrintReport}>
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </CardFooter>
        </Card>

        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table">
              <FileText className="mr-2 h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="chart">
              <BarChart4 className="mr-2 h-4 w-4" />
              Chart View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {reportType === "revenue" && "Revenue Report"}
                  {reportType === "patient" && "Patient Statistics"}
                  {reportType === "department" && "Department Performance"}
                  {reportType === "hmo" && "HMO Claims Analysis"}
                </CardTitle>
                <CardDescription>
                  {dateRange?.from && dateRange?.to
                    ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                    : "All time"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportType === "revenue" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">
                          Consultations (₦)
                        </TableHead>
                        <TableHead className="text-right">
                          Pharmacy (₦)
                        </TableHead>
                        <TableHead className="text-right">
                          Laboratory (₦)
                        </TableHead>
                        <TableHead className="text-right">Total (₦)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getRevenueData().map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell className="text-right">
                            {row.consultations.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.pharmacy.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.laboratory.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {row.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">
                          {getRevenueData()
                            .reduce((sum, row) => sum + row.consultations, 0)
                            .toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {getRevenueData()
                            .reduce((sum, row) => sum + row.pharmacy, 0)
                            .toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {getRevenueData()
                            .reduce((sum, row) => sum + row.laboratory, 0)
                            .toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {getRevenueData()
                            .reduce((sum, row) => sum + row.total, 0)
                            .toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}

                {reportType === "patient" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">
                          New Patients
                        </TableHead>
                        <TableHead className="text-right">
                          Return Patients
                        </TableHead>
                        <TableHead className="text-right">
                          HMO Patients
                        </TableHead>
                        <TableHead className="text-right">
                          Cash Patients
                        </TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPatientData().map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell className="text-right">
                            {row.newPatients}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.returnPatients}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.hmoPatients}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.cashPatients}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {row.total}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">
                          {getPatientData().reduce(
                            (sum, row) => sum + row.newPatients,
                            0
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {getPatientData().reduce(
                            (sum, row) => sum + row.returnPatients,
                            0
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {getPatientData().reduce(
                            (sum, row) => sum + row.hmoPatients,
                            0
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {getPatientData().reduce(
                            (sum, row) => sum + row.cashPatients,
                            0
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {getPatientData().reduce(
                            (sum, row) => sum + row.total,
                            0
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}

                {reportType === "department" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Patients</TableHead>
                        <TableHead className="text-right">
                          Revenue (₦)
                        </TableHead>
                        <TableHead className="text-right">
                          Avg. Revenue per Patient (₦)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getDepartmentData().map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.department}</TableCell>
                          <TableCell className="text-right">
                            {row.patients}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.patients > 0
                              ? Math.round(
                                  row.revenue / row.patients
                                ).toLocaleString()
                              : "0"}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">
                          {getDepartmentData().reduce(
                            (sum, row) => sum + row.patients,
                            0
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {getDepartmentData()
                            .reduce((sum, row) => sum + row.revenue, 0)
                            .toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {(() => {
                            const totalPatients = getDepartmentData().reduce(
                              (sum, row) => sum + row.patients,
                              0
                            );
                            const totalRevenue = getDepartmentData().reduce(
                              (sum, row) => sum + row.revenue,
                              0
                            );
                            return totalPatients > 0
                              ? Math.round(
                                  totalRevenue / totalPatients
                                ).toLocaleString()
                              : "0";
                          })()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}

                {reportType === "hmo" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>HMO Provider</TableHead>
                        <TableHead className="text-right">Patients</TableHead>
                        <TableHead className="text-right">Claims</TableHead>
                        <TableHead className="text-right">Approved</TableHead>
                        <TableHead className="text-right">Rejected</TableHead>
                        <TableHead className="text-right">
                          Total Amount (₦)
                        </TableHead>
                        <TableHead className="text-right">
                          Approved Amount (₦)
                        </TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getHMOData().map((row, index) => (
                        <TableRow
                          key={index}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>{row.provider}</TableCell>
                          <TableCell className="text-right">
                            {row.patients}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.claims}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.approved}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.rejected}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(row.totalAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(row.approvedAmount)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleHMOClick(row.provider)}
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">
                          {getHMOData().reduce(
                            (sum, row) => sum + row.patients,
                            0
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {getHMOData().reduce(
                            (sum, row) => sum + row.claims,
                            0
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {getHMOData().reduce(
                            (sum, row) => sum + row.approved,
                            0
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {getHMOData().reduce(
                            (sum, row) => sum + row.rejected,
                            0
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            getHMOData().reduce(
                              (sum, row) => sum + row.totalAmount,
                              0
                            )
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            getHMOData().reduce(
                              (sum, row) => sum + row.approvedAmount,
                              0
                            )
                          )}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chart" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {reportType === "revenue" && "Revenue Report"}
                  {reportType === "patient" && "Patient Statistics"}
                  {reportType === "department" && "Department Performance"}
                  {reportType === "hmo" && "HMO Claims Analysis"}
                </CardTitle>
                <CardDescription>
                  {dateRange?.from && dateRange?.to
                    ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                    : "All time"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <SimpleBarChart
                  data={getChartData().data}
                  xKey="name"
                  yKey="value"
                  title={getChartData().title}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
