import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  BarChart3,
  TrendingUp,
  Users,
  Car,
  DollarSign,
  Activity,
  Download,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ["hsl(43, 100%, 50%)", "hsl(142, 76%, 36%)", "hsl(0, 84%, 60%)", "hsl(38, 92%, 50%)"];

// Demo data generators
const generateDemoRevenueData = (days: number) => {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const baseRevenue = 15000 + Math.random() * 20000;
    const dayOfWeek = date.getDay();
    // Weekends have higher revenue
    const multiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1;
    data.push({
      date: format(date, "MMM d"),
      revenue: Math.round(baseRevenue * multiplier),
    });
  }
  return data;
};

const generateDemoJobsData = (days: number) => {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const baseJobs = 40 + Math.floor(Math.random() * 30);
    const dayOfWeek = date.getDay();
    const multiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.4 : 1;
    data.push({
      date: format(date, "MMM d"),
      jobs: Math.round(baseJobs * multiplier),
    });
  }
  return data;
};

const demoJobStats = (days: number) => {
  const totalJobs = days * 50 + Math.floor(Math.random() * 100);
  return {
    total: totalJobs,
    byStatus: {
      completed: Math.floor(totalJobs * 0.72),
      cancelled: Math.floor(totalJobs * 0.08),
      in_progress: Math.floor(totalJobs * 0.12),
      pending: Math.floor(totalJobs * 0.08),
    },
    dailyData: generateDemoJobsData(days),
  };
};

const demoRevenueStats = (days: number) => {
  const dailyData = generateDemoRevenueData(days);
  const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);
  return {
    totalRevenue,
    totalPayouts: Math.round(totalRevenue * 0.8),
    totalFees: Math.round(totalRevenue * 0.2),
    dailyData,
  };
};

const demoUserStats = {
  totalUsers: 1247,
  totalDrivers: 86,
  onlineDrivers: 24,
  roleBreakdown: {
    customers: 1156,
    drivers: 86,
    admins: 5,
  },
};

export default function AdminReports() {
  const [dateRange, setDateRange] = useState("7");

  const { data: jobStats, isLoading: jobsLoading } = useQuery({
    queryKey: ["admin-job-stats", dateRange],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // If no real data, return demo data
      if (!data || data.length === 0) {
        return demoJobStats(parseInt(dateRange));
      }

      const byStatus = {
        completed: data.filter((j) => j.status === "completed").length,
        cancelled: data.filter((j) => j.status === "cancelled").length,
        in_progress: data.filter((j) => j.status === "in_progress").length,
        pending: data.filter((j) => j.status === "pending").length,
      };

      // Group by day
      const byDay: Record<string, number> = {};
      data.forEach((job) => {
        const day = format(new Date(job.created_at), "MMM d");
        byDay[day] = (byDay[day] || 0) + 1;
      });

      const dailyData = Object.entries(byDay).map(([date, count]) => ({
        date,
        jobs: count,
      }));

      return { total: data.length, byStatus, dailyData };
    },
  });

  const { data: revenueStats, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin-revenue-stats", dateRange],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // If no real data, return demo data
      if (!data || data.length === 0) {
        return demoRevenueStats(parseInt(dateRange));
      }

      const totalRevenue = data.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalPayouts = data.reduce((sum, p) => sum + Number(p.driver_payout || 0), 0);
      const totalFees = data.reduce((sum, p) => sum + Number(p.platform_fee || 0), 0);

      // Group by day
      const byDay: Record<string, number> = {};
      data.forEach((payment) => {
        const day = format(new Date(payment.created_at), "MMM d");
        byDay[day] = (byDay[day] || 0) + Number(payment.amount);
      });

      const dailyData = Object.entries(byDay).map(([date, amount]) => ({
        date,
        revenue: amount,
      }));

      return { totalRevenue, totalPayouts, totalFees, dailyData };
    },
  });

  const { data: userStats } = useQuery({
    queryKey: ["admin-user-stats"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("id");
      const { data: drivers } = await supabase.from("drivers").select("id, is_online");
      const { data: roles } = await supabase.from("user_roles").select("role");

      // If no real data, return demo data
      if (!profiles || profiles.length === 0) {
        return demoUserStats;
      }

      return {
        totalUsers: profiles?.length || 0,
        totalDrivers: drivers?.length || 0,
        onlineDrivers: drivers?.filter((d) => d.is_online).length || 0,
        roleBreakdown: {
          customers: roles?.filter((r) => r.role === "customer").length || 0,
          drivers: roles?.filter((r) => r.role === "driver").length || 0,
          admins: roles?.filter((r) => r.role === "admin").length || 0,
        },
      };
    },
  });

  const statusPieData = jobStats
    ? [
        { name: "Completed", value: jobStats.byStatus.completed },
        { name: "In Progress", value: jobStats.byStatus.in_progress },
        { name: "Cancelled", value: jobStats.byStatus.cancelled },
        { name: "Pending", value: jobStats.byStatus.pending },
      ]
    : [];

  const userPieData = userStats
    ? [
        { name: "Customers", value: userStats.roleBreakdown.customers },
        { name: "Drivers", value: userStats.roleBreakdown.drivers },
        { name: "Admins", value: userStats.roleBreakdown.admins },
      ]
    : [];

  const handleExport = () => {
    // Build CSV content
    let csvContent = "Analytics & Reports Export\n";
    csvContent += `Date Range: Last ${dateRange} days\n`;
    csvContent += `Generated: ${format(new Date(), "PPpp")}\n\n`;

    // Key Metrics
    csvContent += "=== KEY METRICS ===\n";
    csvContent += `Total Jobs,${jobStats?.total || 0}\n`;
    csvContent += `Total Revenue,R${revenueStats?.totalRevenue?.toFixed(0) || 0}\n`;
    csvContent += `Total Users,${userStats?.totalUsers || 0}\n`;
    csvContent += `Drivers Online,${userStats?.onlineDrivers || 0}\n\n`;

    // Job Status Breakdown
    csvContent += "=== JOB STATUS BREAKDOWN ===\n";
    csvContent += "Status,Count\n";
    statusPieData.forEach((item) => {
      csvContent += `${item.name},${item.value}\n`;
    });
    csvContent += "\n";

    // User Breakdown
    csvContent += "=== USER BREAKDOWN ===\n";
    csvContent += "Role,Count\n";
    userPieData.forEach((item) => {
      csvContent += `${item.name},${item.value}\n`;
    });
    csvContent += "\n";

    // Daily Revenue
    if (revenueStats?.dailyData) {
      csvContent += "=== DAILY REVENUE ===\n";
      csvContent += "Date,Revenue (R)\n";
      revenueStats.dailyData.forEach((item) => {
        csvContent += `${item.date},${item.revenue}\n`;
      });
      csvContent += "\n";
    }

    // Daily Jobs
    if (jobStats?.dailyData) {
      csvContent += "=== DAILY JOBS ===\n";
      csvContent += "Date,Jobs\n";
      jobStats.dailyData.forEach((item) => {
        csvContent += `${item.date},${item.jobs}\n`;
      });
    }

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics & Reports</h1>
            <p className="text-muted-foreground">Business insights and performance metrics</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{jobStats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-success/10 p-3">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R{revenueStats?.totalRevenue.toFixed(0) || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats?.totalUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats?.onlineDrivers || 0}</p>
                  <p className="text-sm text-muted-foreground">Drivers Online</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Daily revenue over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueStats?.dailyData || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(43, 100%, 50%)"
                        fill="hsl(43, 100%, 50%, 0.2)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Jobs Trend
                </CardTitle>
                <CardDescription>Daily jobs over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={jobStats?.dailyData || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="jobs" fill="hsl(43, 100%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle>Job Status Breakdown</CardTitle>
                <CardDescription>Distribution of job statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {statusPieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card>
              <CardHeader>
                <CardTitle>User Breakdown</CardTitle>
                <CardDescription>Distribution by user role</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={userPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {userPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {userPieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
