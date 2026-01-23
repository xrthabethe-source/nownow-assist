import { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Car,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  MapPin,
  Filter,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Bell,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeJobs, useRealtimeDrivers } from "@/hooks/useJobs";

const mockAlerts = [
  { id: 1, type: "warning", message: "Driver David O. rating dropped below 4.0", time: "5 min ago", link: "/admin/drivers" },
  { id: 2, type: "error", message: "Payment failed for JOB-089", time: "12 min ago", link: "/admin/payments" },
  { id: 3, type: "info", message: "New driver registration pending approval", time: "1 hr ago", link: "/admin/drivers" },
];

export const AdminDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  // Enable realtime updates
  useRealtimeJobs();
  useRealtimeDrivers();

  // Fetch active jobs from database
  const { data: activeJobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ["admin-active-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          services (id, name, icon)
        `)
        .in("status", ["pending", "accepted", "dispatched", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch customer and driver profiles
      if (data && data.length > 0) {
        const customerIds = [...new Set(data.map(j => j.customer_id).filter(Boolean))];
        const driverIds = [...new Set(data.map(j => j.driver_id).filter(Boolean))];

        const [customersRes, driversRes] = await Promise.all([
          customerIds.length > 0 
            ? supabase.from("profiles").select("id, full_name, phone").in("id", customerIds)
            : { data: [] },
          driverIds.length > 0
            ? supabase.from("drivers").select("id, user_id, vehicle_plate").in("id", driverIds)
            : { data: [] }
        ]);

        // Fetch driver profiles
        const driverUserIds = driversRes.data?.map(d => d.user_id) || [];
        const driverProfilesRes = driverUserIds.length > 0
          ? await supabase.from("profiles").select("id, full_name").in("id", driverUserIds)
          : { data: [] };

        return data.map(job => ({
          ...job,
          customer: customersRes.data?.find(p => p.id === job.customer_id) || null,
          driver: driversRes.data?.find(d => d.id === job.driver_id) || null,
          driverProfile: driverProfilesRes.data?.find(p => 
            p.id === driversRes.data?.find(d => d.id === job.driver_id)?.user_id
          ) || null,
        }));
      }

      return data || [];
    },
    refetchInterval: 30000, // Auto refresh every 30 seconds
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [activeJobsRes, driversOnlineRes, completedTodayRes, revenueTodayRes] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact" })
          .in("status", ["pending", "accepted", "dispatched", "in_progress"]),
        supabase.from("drivers").select("id", { count: "exact" }).eq("is_online", true),
        supabase.from("jobs").select("id", { count: "exact" })
          .eq("status", "completed")
          .gte("completed_at", today.toISOString()),
        supabase.from("payments").select("amount")
          .eq("status", "completed")
          .gte("created_at", today.toISOString()),
      ]);

      const totalRevenue = revenueTodayRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      return {
        activeJobs: activeJobsRes.count || 0,
        driversOnline: driversOnlineRes.count || 0,
        completedToday: completedTodayRes.count || 0,
        revenue: `R${totalRevenue.toLocaleString()}`,
        avgEta: "18 min",
        slaCompliance: 94,
      };
    },
    refetchInterval: 30000,
  });

  const handleRefreshJobs = useCallback(async () => {
    setIsRefreshing(true);
    await refetchJobs();
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    setIsRefreshing(false);
  }, [refetchJobs, queryClient]);

  const filteredJobs = useMemo(() => {
    if (statusFilter === "all") return activeJobs;
    return activeJobs.filter((job: any) => job.status === statusFilter);
  }, [activeJobs, statusFilter]);

  return (
    <AdminLayout>
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
        >
          <Link to="/admin/active-jobs">
            <Card variant="default" className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Activity className="h-5 w-5 text-primary" />
                  <StatusBadge variant="active" pulse>Live</StatusBadge>
                </div>
                <p className="text-2xl font-bold">{stats?.activeJobs || 0}</p>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/live-map">
            <Card variant="default" className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 relative overflow-hidden">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Car className="h-5 w-5 text-success" />
                  <StatusBadge variant="active" pulse>Live</StatusBadge>
                </div>
                <p className="text-2xl font-bold">{stats?.driversOnline || 0}</p>
                <p className="text-sm text-muted-foreground">Drivers Online</p>
              </CardContent>
              {/* Animated pulse overlay */}
              <div className="absolute inset-0 bg-success/5 animate-pulse pointer-events-none" />
            </Card>
          </Link>

          <Link to="/admin/completed-jobs">
            <Card variant="default" className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <p className="text-2xl font-bold">{stats?.completedToday || 0}</p>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/revenue">
            <Card variant="default" className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold">{stats?.revenue || "R0"}</p>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/sla">
            <Card variant="default" className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <p className="text-2xl font-bold">{stats?.avgEta || "-- min"}</p>
                <p className="text-sm text-muted-foreground">Avg ETA</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/sla">
            <Card variant="default" className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <p className="text-2xl font-bold">{stats?.slaCompliance || 0}%</p>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card variant="default">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Active Jobs
                </CardTitle>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                        All Status
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                        Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("dispatched")}>
                        Dispatched
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("in_progress")}>
                        In Progress
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={handleRefreshJobs}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredJobs.map((job) => (
                    <Link
                      key={job.id}
                      to="/admin/active-jobs"
                      className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-muted-foreground">
                            {job.job_number}
                          </span>
                          <StatusBadge
                            variant={
                              job.status === "in_progress"
                                ? "primary"
                                : job.status === "dispatched"
                                ? "warning"
                                : "destructive"
                            }
                            pulse={job.status === "pending"}
                          >
                            {job.status === "in_progress"
                              ? "In Progress"
                              : job.status === "dispatched"
                              ? "Dispatched"
                              : "Pending Driver"}
                          </StatusBadge>
                        </div>
                        <p className="font-medium">{(job as any).services?.name || "Service"}</p>
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {(job as any).customer?.full_name || "Customer"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {(job as any).driverProfile?.full_name || "Unassigned"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.pickup_address || "Location"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{job.eta_minutes || "--"} min</p>
                        <p className="text-sm text-muted-foreground">ETA</p>
                      </div>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <span>
                          <MoreVertical className="h-4 w-4" />
                        </span>
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Alerts & Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="default">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Alerts
                </CardTitle>
                <Button variant="link" size="sm" className="text-primary" asChild>
                  <Link to="/admin/audit">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAlerts.map((alert) => (
                    <Link
                      key={alert.id}
                      to={alert.link}
                      className={`block rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                        alert.type === "error"
                          ? "bg-destructive/10 border border-destructive/20 hover:bg-destructive/15"
                          : alert.type === "warning"
                          ? "bg-warning/10 border border-warning/20 hover:bg-warning/15"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        {alert.type === "error" ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : alert.type === "warning" ? (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        ) : (
                          <Bell className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="default" className="mt-4">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link to="/admin/drivers">
                    View All Drivers
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link to="/admin/pricing">
                    Manage Pricing
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link to="/admin/payments">
                    Payment Reports
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link to="/admin/disputes">
                    Dispute Center
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
