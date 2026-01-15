import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subDays, startOfDay } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  Users,
  Car,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminRevenue() {
  const [dateRange, setDateRange] = useState("today");

  const getStartDate = () => {
    switch (dateRange) {
      case "today":
        return startOfDay(new Date());
      case "7":
        return startOfDay(subDays(new Date(), 7));
      case "30":
        return startOfDay(subDays(new Date(), 30));
      case "90":
        return startOfDay(subDays(new Date(), 90));
      default:
        return startOfDay(new Date());
    }
  };

  const { data: revenueData, isLoading } = useQuery({
    queryKey: ["admin-revenue", dateRange],
    queryFn: async () => {
      const startDate = getStartDate();
      
      // Get completed payments
      const { data: payments, error } = await supabase
        .from("payments")
        .select(`
          *,
          jobs(job_number, service_id, customer_id, driver_id, services(name))
        `)
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate stats
      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalPayouts = payments.reduce((sum, p) => sum + Number(p.driver_payout || 0), 0);
      const totalFees = payments.reduce((sum, p) => sum + Number(p.platform_fee || 0), 0);
      const transactionCount = payments.length;

      // Group by day for chart
      const byDay: Record<string, { revenue: number; fees: number; payouts: number }> = {};
      payments.forEach((payment) => {
        const day = format(new Date(payment.created_at), "MMM d");
        if (!byDay[day]) {
          byDay[day] = { revenue: 0, fees: 0, payouts: 0 };
        }
        byDay[day].revenue += Number(payment.amount);
        byDay[day].fees += Number(payment.platform_fee || 0);
        byDay[day].payouts += Number(payment.driver_payout || 0);
      });

      const chartData = Object.entries(byDay).map(([date, data]) => ({
        date,
        ...data,
      }));

      // Group by service
      const byService: Record<string, { count: number; revenue: number }> = {};
      payments.forEach((payment) => {
        const serviceName = payment.jobs?.services?.name || "Unknown";
        if (!byService[serviceName]) {
          byService[serviceName] = { count: 0, revenue: 0 };
        }
        byService[serviceName].count += 1;
        byService[serviceName].revenue += Number(payment.amount);
      });

      const serviceBreakdown = Object.entries(byService)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        totalRevenue,
        totalPayouts,
        totalFees,
        transactionCount,
        chartData,
        serviceBreakdown,
        recentPayments: payments.slice(0, 10),
      };
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Revenue Overview</h1>
            <p className="text-muted-foreground">Track earnings and financial performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin">← Back to Dashboard</Link>
            </Button>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R{revenueData?.totalRevenue.toFixed(0) || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-success/10 p-3">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R{revenueData?.totalFees.toFixed(0) || 0}</p>
                  <p className="text-sm text-muted-foreground">Platform Fees</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Car className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R{revenueData?.totalPayouts.toFixed(0) || 0}</p>
                  <p className="text-sm text-muted-foreground">Driver Payouts</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{revenueData?.transactionCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Daily revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData?.chartData || []}>
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
                      name="Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="fees"
                      stroke="hsl(142, 76%, 36%)"
                      fill="hsl(142, 76%, 36%, 0.2)"
                      name="Platform Fees"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Service Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service</CardTitle>
                <CardDescription>Breakdown by service type</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {revenueData?.serviceBreakdown.map((service) => (
                      <div key={service.name} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.count} jobs</p>
                        </div>
                        <p className="text-lg font-bold text-primary">R{service.revenue.toFixed(0)}</p>
                      </div>
                    ))}
                    {revenueData?.serviceBreakdown.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No data available</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest completed payments</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueData?.recentPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">
                            {payment.jobs?.job_number || "-"}
                          </TableCell>
                          <TableCell className="font-bold text-primary">
                            R{Number(payment.amount).toFixed(0)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(payment.created_at), "HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))}
                      {revenueData?.recentPayments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No transactions yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
