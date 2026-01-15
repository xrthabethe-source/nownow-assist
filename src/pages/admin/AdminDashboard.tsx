import { useState, useCallback, useMemo } from "react";
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
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Bell,
} from "lucide-react";
import { Link } from "react-router-dom";

const mockStats = {
  activeJobs: 8,
  driversOnline: 24,
  completedToday: 156,
  revenue: "R48,250",
  avgEta: "18 min",
  slaCompliance: 94,
};

const initialActiveJobs = [
  {
    id: "JOB-001",
    customer: "John M.",
    driver: "Samuel K.",
    service: "Tyre Change",
    status: "in_progress",
    location: "Sandton, JHB",
    eta: "12 min",
  },
  {
    id: "JOB-002",
    customer: "Sarah L.",
    driver: "David O.",
    service: "Jump Start",
    status: "dispatched",
    location: "Rosebank, JHB",
    eta: "8 min",
  },
  {
    id: "JOB-003",
    customer: "Mike R.",
    driver: null,
    service: "Fuel Delivery",
    status: "pending",
    location: "Fourways, JHB",
    eta: "--",
  },
];

const mockAlerts = [
  { id: 1, type: "warning", message: "Driver David O. rating dropped below 4.0", time: "5 min ago", link: "/admin/drivers" },
  { id: 2, type: "error", message: "Payment failed for JOB-089", time: "12 min ago", link: "/admin/payments" },
  { id: 3, type: "info", message: "New driver registration pending approval", time: "1 hr ago", link: "/admin/drivers" },
];

export const AdminDashboard = () => {
  const [activeJobs, setActiveJobs] = useState(initialActiveJobs);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleRefreshJobs = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh - in production this would fetch from the database
    setTimeout(() => {
      setActiveJobs([...initialActiveJobs]);
      setIsRefreshing(false);
    }, 500);
  }, []);

  const filteredJobs = useMemo(() => {
    if (statusFilter === "all") return activeJobs;
    return activeJobs.filter((job) => job.status === statusFilter);
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
                <p className="text-2xl font-bold">{mockStats.activeJobs}</p>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/online-drivers">
            <Card variant="default" className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Car className="h-5 w-5 text-success" />
                </div>
                <p className="text-2xl font-bold">{mockStats.driversOnline}</p>
                <p className="text-sm text-muted-foreground">Drivers Online</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/completed-jobs">
            <Card variant="default" className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <p className="text-2xl font-bold">{mockStats.completedToday}</p>
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
                <p className="text-2xl font-bold">{mockStats.revenue}</p>
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
                <p className="text-2xl font-bold">{mockStats.avgEta}</p>
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
                <p className="text-2xl font-bold">{mockStats.slaCompliance}%</p>
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
                            {job.id}
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
                        <p className="font-medium">{job.service}</p>
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {job.customer}
                          </span>
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {job.driver || "Unassigned"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{job.eta}</p>
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
