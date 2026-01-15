import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
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
import { format, subDays, startOfDay } from "date-fns";
import {
  Search,
  Car,
  Users,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Star,
  DollarSign,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function AdminCompletedJobs() {
  const [searchQuery, setSearchQuery] = useState("");
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

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ["admin-completed-jobs", dateRange],
    queryFn: async () => {
      const startDate = getStartDate();
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          services(name, icon),
          drivers(id, user_id, vehicle_plate, vehicle_make, vehicle_model)
        `)
        .eq("status", "completed")
        .gte("completed_at", startDate.toISOString())
        .order("completed_at", { ascending: false });

      if (error) throw error;

      // Get customer profiles
      const customerIds = data.map(j => j.customer_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", customerIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]));

      // Get driver profiles
      const driverUserIds = data.map(j => j.drivers?.user_id).filter(Boolean);
      const { data: driverProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", driverUserIds);

      const driverProfilesMap = new Map(driverProfiles?.map(p => [p.id, p]));

      return data.map(job => ({
        ...job,
        customer: profilesMap.get(job.customer_id) || null,
        driverProfile: job.drivers ? driverProfilesMap.get(job.drivers.user_id) : null,
      }));
    },
  });

  const filteredJobs = jobs?.filter((job) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      job.job_number?.toLowerCase().includes(searchLower) ||
      job.customer?.full_name?.toLowerCase().includes(searchLower) ||
      job.driverProfile?.full_name?.toLowerCase().includes(searchLower) ||
      job.pickup_address?.toLowerCase().includes(searchLower) ||
      job.services?.name?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: jobs?.length || 0,
    totalRevenue: jobs?.reduce((sum, j) => sum + (j.final_price || j.estimated_price || 0), 0) || 0,
    avgRating: jobs?.length 
      ? (jobs.reduce((sum, j) => sum + (j.rating || 5), 0) / jobs.length).toFixed(1) 
      : "5.0",
    avgDuration: jobs?.length && jobs.some(j => j.started_at && j.completed_at)
      ? Math.round(
          jobs
            .filter(j => j.started_at && j.completed_at)
            .reduce((sum, j) => {
              const start = new Date(j.started_at!).getTime();
              const end = new Date(j.completed_at!).getTime();
              return sum + (end - start) / 60000;
            }, 0) / jobs.filter(j => j.started_at && j.completed_at).length
        )
      : 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Completed Jobs</h1>
            <p className="text-muted-foreground">View all completed service requests</p>
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
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
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
                <div className="rounded-full bg-success/10 p-3">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R{stats.totalRevenue.toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Star className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgRating}</p>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgDuration} min</p>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Completed Jobs
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                className="w-64 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredJobs?.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No completed jobs</h3>
                <p className="text-muted-foreground">No jobs have been completed in this time period.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job #</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs?.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <span className="font-mono font-medium">{job.job_number}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{job.services?.name || "Unknown"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{job.customer?.full_name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span>{job.driverProfile?.full_name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 max-w-[200px]">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="truncate text-sm">{job.pickup_address || "No address"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">
                          R{(job.final_price || job.estimated_price || 0).toFixed(0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span>{job.rating?.toFixed(1) || "5.0"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {job.completed_at ? format(new Date(job.completed_at), "MMM d, HH:mm") : "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
