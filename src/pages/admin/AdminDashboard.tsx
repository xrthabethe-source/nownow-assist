import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Users,
  Car,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  MapPin,
  Settings,
  Bell,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const mockStats = {
  activeJobs: 8,
  driversOnline: 24,
  completedToday: 156,
  revenue: "R48,250",
  avgEta: "18 min",
  slaCompliance: 94,
};

const mockActiveJobs = [
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
  { id: 1, type: "warning", message: "Driver David O. rating dropped below 4.0", time: "5 min ago" },
  { id: 2, type: "error", message: "Payment failed for JOB-089", time: "12 min ago" },
  { id: 3, type: "info", message: "New driver registration pending approval", time: "1 hr ago" },
];

export const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <StatusBadge variant="online" pulse>Live Operations</StatusBadge>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs, drivers..."
                className="w-64 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon-sm" className="relative rounded-full">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                3
              </span>
            </Button>
            <Button variant="ghost" size="icon-sm" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
        >
          <Card variant="default">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <Activity className="h-5 w-5 text-primary" />
                <StatusBadge variant="active" pulse>Live</StatusBadge>
              </div>
              <p className="text-2xl font-bold">{mockStats.activeJobs}</p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <Car className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-bold">{mockStats.driversOnline}</p>
              <p className="text-sm text-muted-foreground">Drivers Online</p>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-bold">{mockStats.completedToday}</p>
              <p className="text-sm text-muted-foreground">Completed Today</p>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{mockStats.revenue}</p>
              <p className="text-sm text-muted-foreground">Today's Revenue</p>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <p className="text-2xl font-bold">{mockStats.avgEta}</p>
              <p className="text-sm text-muted-foreground">Avg ETA</p>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-bold">{mockStats.slaCompliance}%</p>
              <p className="text-sm text-muted-foreground">SLA Compliance</p>
            </CardContent>
          </Card>
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
                  <Button variant="ghost" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockActiveJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
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
                      <Button variant="ghost" size="icon-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
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
                <Button variant="link" size="sm" className="text-primary">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`rounded-xl p-3 ${
                        alert.type === "error"
                          ? "bg-destructive/10 border border-destructive/20"
                          : alert.type === "warning"
                          ? "bg-warning/10 border border-warning/20"
                          : "bg-muted"
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
                    </div>
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
                <Button variant="outline" className="w-full justify-between">
                  View All Drivers
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Manage Pricing
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Payment Reports
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Dispute Center
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
