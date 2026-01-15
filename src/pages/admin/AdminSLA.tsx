import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays, startOfDay } from "date-fns";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Download,
  RefreshCw,
  AlertTriangle,
  Target,
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
  BarChart,
  Bar,
} from "recharts";

export default function AdminSLA() {
  const [dateRange, setDateRange] = useState("7");

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
        return startOfDay(subDays(new Date(), 7));
    }
  };

  const { data: slaData, isLoading } = useQuery({
    queryKey: ["admin-sla", dateRange],
    queryFn: async () => {
      const startDate = getStartDate();
      
      // Get completed jobs with ETA data
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("*, services(name)")
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate SLA metrics
      // SLA Target: Arrival within estimated ETA + 5 minutes buffer
      const SLA_BUFFER_MINUTES = 5;
      
      const jobsWithTiming = jobs.filter(j => j.eta_minutes && j.dispatched_at && j.started_at);
      
      const slaResults = jobsWithTiming.map(job => {
        const dispatchedAt = new Date(job.dispatched_at!).getTime();
        const startedAt = new Date(job.started_at!).getTime();
        const actualArrivalMinutes = (startedAt - dispatchedAt) / 60000;
        const targetMinutes = (job.eta_minutes || 0) + SLA_BUFFER_MINUTES;
        const metSLA = actualArrivalMinutes <= targetMinutes;
        
        return {
          ...job,
          actualArrivalMinutes,
          targetMinutes,
          metSLA,
          variance: actualArrivalMinutes - (job.eta_minutes || 0),
        };
      });

      const totalWithSLA = slaResults.length;
      const metSLACount = slaResults.filter(j => j.metSLA).length;
      const slaCompliance = totalWithSLA > 0 ? (metSLACount / totalWithSLA) * 100 : 100;
      
      const avgETA = jobsWithTiming.length > 0
        ? jobsWithTiming.reduce((sum, j) => sum + (j.eta_minutes || 0), 0) / jobsWithTiming.length
        : 0;
        
      const avgActualArrival = slaResults.length > 0
        ? slaResults.reduce((sum, j) => sum + j.actualArrivalMinutes, 0) / slaResults.length
        : 0;

      // Group by day for chart
      const byDay: Record<string, { total: number; met: number }> = {};
      slaResults.forEach((job) => {
        const day = format(new Date(job.created_at), "MMM d");
        if (!byDay[day]) {
          byDay[day] = { total: 0, met: 0 };
        }
        byDay[day].total += 1;
        if (job.metSLA) byDay[day].met += 1;
      });

      const chartData = Object.entries(byDay).map(([date, data]) => ({
        date,
        compliance: data.total > 0 ? (data.met / data.total) * 100 : 100,
        total: data.total,
        met: data.met,
      }));

      // Group by service
      const byService: Record<string, { total: number; met: number; avgVariance: number }> = {};
      slaResults.forEach((job) => {
        const serviceName = job.services?.name || "Unknown";
        if (!byService[serviceName]) {
          byService[serviceName] = { total: 0, met: 0, avgVariance: 0 };
        }
        byService[serviceName].total += 1;
        if (job.metSLA) byService[serviceName].met += 1;
        byService[serviceName].avgVariance += job.variance;
      });

      const serviceBreakdown = Object.entries(byService)
        .map(([name, data]) => ({
          name,
          compliance: data.total > 0 ? (data.met / data.total) * 100 : 100,
          avgVariance: data.total > 0 ? data.avgVariance / data.total : 0,
          total: data.total,
        }))
        .sort((a, b) => b.total - a.total);

      // Get worst performing jobs
      const worstJobs = slaResults
        .filter(j => !j.metSLA)
        .sort((a, b) => b.variance - a.variance)
        .slice(0, 5);

      return {
        slaCompliance,
        avgETA,
        avgActualArrival,
        totalJobs: totalWithSLA,
        metSLACount,
        missedSLACount: totalWithSLA - metSLACount,
        chartData,
        serviceBreakdown,
        worstJobs,
      };
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">SLA Compliance</h1>
            <p className="text-muted-foreground">Monitor service level agreement performance</p>
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
                <div className={`rounded-full p-3 ${(slaData?.slaCompliance || 0) >= 90 ? 'bg-success/10' : (slaData?.slaCompliance || 0) >= 70 ? 'bg-warning/10' : 'bg-destructive/10'}`}>
                  <Target className={`h-5 w-5 ${(slaData?.slaCompliance || 0) >= 90 ? 'text-success' : (slaData?.slaCompliance || 0) >= 70 ? 'text-warning' : 'text-destructive'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{slaData?.slaCompliance.toFixed(1) || 0}%</p>
                  <p className="text-sm text-muted-foreground">SLA Compliance</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{slaData?.avgETA.toFixed(0) || 0} min</p>
                  <p className="text-sm text-muted-foreground">Avg Est. ETA</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-success/10 p-3">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{slaData?.metSLACount || 0}</p>
                  <p className="text-sm text-muted-foreground">Met SLA</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{slaData?.missedSLACount || 0}</p>
                  <p className="text-sm text-muted-foreground">Missed SLA</p>
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
                Compliance Trend
              </CardTitle>
              <CardDescription>Daily SLA compliance rate</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={slaData?.chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Compliance']}
                    />
                    <Area
                      type="monotone"
                      dataKey="compliance"
                      stroke="hsl(142, 76%, 36%)"
                      fill="hsl(142, 76%, 36%, 0.2)"
                      name="Compliance"
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
                <CardTitle>Compliance by Service</CardTitle>
                <CardDescription>SLA performance by service type</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {slaData?.serviceBreakdown.map((service) => (
                      <div key={service.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.total} jobs</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${service.compliance >= 90 ? 'text-success' : service.compliance >= 70 ? 'text-warning' : 'text-destructive'}`}>
                              {service.compliance.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {service.avgVariance > 0 ? '+' : ''}{service.avgVariance.toFixed(0)} min avg
                            </p>
                          </div>
                        </div>
                        <Progress 
                          value={service.compliance} 
                          className="h-2"
                        />
                      </div>
                    ))}
                    {slaData?.serviceBreakdown.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No data available</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Worst Performing Jobs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  SLA Violations
                </CardTitle>
                <CardDescription>Jobs that missed the SLA target</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {slaData?.worstJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                        <div>
                          <p className="font-mono text-sm font-medium">{job.job_number}</p>
                          <p className="text-xs text-muted-foreground">{job.services?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="flex items-center gap-1 text-destructive">
                            <TrendingDown className="h-4 w-4" />
                            +{job.variance.toFixed(0)} min
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Target: {job.eta_minutes} min
                          </p>
                        </div>
                      </div>
                    ))}
                    {slaData?.worstJobs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle2 className="h-12 w-12 text-success/50" />
                        <p className="mt-2 font-medium text-success">All jobs met SLA!</p>
                        <p className="text-sm text-muted-foreground">Great performance</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
