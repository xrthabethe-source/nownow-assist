import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  MoreVertical,
  Car,
  Users,
  Clock,
  MapPin,
  RefreshCw,
  Activity,
  XCircle,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Demo active jobs data
const demoActiveJobs = [
  {
    id: "demo-1",
    job_number: "JOB-000142",
    status: "in_progress",
    pickup_address: "123 Victoria Island, Lagos",
    eta_minutes: 12,
    estimated_price: 15000,
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    services: { name: "Fuel Delivery", icon: "fuel" },
    drivers: { id: "d1", user_id: "u1", vehicle_plate: "LAG-234-KJ", vehicle_make: "Toyota", vehicle_model: "Hilux" },
    customer: { full_name: "Adaeze Okoro", phone: "+234 802 345 6789" },
    driverProfile: { full_name: "Michael Adeyemi", phone: "+234 801 234 5678" },
  },
  {
    id: "demo-2",
    job_number: "JOB-000143",
    status: "dispatched",
    pickup_address: "45 Lekki Phase 1, Lagos",
    eta_minutes: 18,
    estimated_price: 8500,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    services: { name: "Tyre Change", icon: "tyre" },
    drivers: { id: "d2", user_id: "u2", vehicle_plate: "LAG-891-XY", vehicle_make: "Ford", vehicle_model: "Ranger" },
    customer: { full_name: "Emeka Nwachukwu", phone: "+234 803 456 7890" },
    driverProfile: { full_name: "Chukwudi Okafor", phone: "+234 803 987 6543" },
  },
  {
    id: "demo-3",
    job_number: "JOB-000144",
    status: "pending",
    pickup_address: "78 Ikeja GRA, Lagos",
    eta_minutes: null,
    estimated_price: 25000,
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    services: { name: "Towing", icon: "tow" },
    drivers: null,
    customer: { full_name: "Funke Akindele", phone: "+234 805 678 9012" },
    driverProfile: null,
  },
  {
    id: "demo-4",
    job_number: "JOB-000145",
    status: "accepted",
    pickup_address: "32 Surulere, Lagos",
    eta_minutes: 22,
    estimated_price: 12000,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    services: { name: "Jump Start", icon: "battery" },
    drivers: { id: "d3", user_id: "u3", vehicle_plate: "LAG-456-AB", vehicle_make: "Nissan", vehicle_model: "Patrol" },
    customer: { full_name: "Olumide Balogun", phone: "+234 806 789 0123" },
    driverProfile: { full_name: "Ifeanyi Eze", phone: "+234 805 432 1098" },
  },
  {
    id: "demo-5",
    job_number: "JOB-000146",
    status: "in_progress",
    pickup_address: "15 Ajah, Lagos",
    eta_minutes: 8,
    estimated_price: 18000,
    created_at: new Date(Date.now() - 35 * 60000).toISOString(),
    services: { name: "Fuel Delivery", icon: "fuel" },
    drivers: { id: "d4", user_id: "u4", vehicle_plate: "LAG-789-CD", vehicle_make: "Toyota", vehicle_model: "Corolla" },
    customer: { full_name: "Ngozi Ibe", phone: "+234 807 890 1234" },
    driverProfile: { full_name: "Babatunde Yusuf", phone: "+234 807 654 3210" },
  },
  {
    id: "demo-6",
    job_number: "JOB-000147",
    status: "pending",
    pickup_address: "56 Maryland, Lagos",
    eta_minutes: null,
    estimated_price: 7500,
    created_at: new Date(Date.now() - 3 * 60000).toISOString(),
    services: { name: "Battery Replacement", icon: "battery" },
    drivers: null,
    customer: { full_name: "Chioma Uzoma", phone: "+234 808 901 2345" },
    driverProfile: null,
  },
];

export default function AdminActiveJobs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ["admin-active-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          services(name, icon),
          drivers(id, user_id, vehicle_plate, vehicle_make, vehicle_model)
        `)
        .in("status", ["pending", "dispatched", "in_progress", "accepted"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data) return [];

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
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("jobs")
        .update({ 
          status: "cancelled", 
          cancelled_at: new Date().toISOString(),
          cancellation_reason: "Cancelled by admin"
        })
        .eq("id", jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-active-jobs"] });
    },
    onError: (error) => {
      toast.error("Failed to cancel job: " + error.message);
    },
  });

  const filteredJobs = jobs?.filter((job) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      job.job_number?.toLowerCase().includes(searchLower) ||
      job.customer?.full_name?.toLowerCase().includes(searchLower) ||
      job.driverProfile?.full_name?.toLowerCase().includes(searchLower) ||
      job.pickup_address?.toLowerCase().includes(searchLower) ||
      job.services?.name?.toLowerCase().includes(searchLower)
    );
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "pending") return matchesSearch && job.status === "pending";
    if (statusFilter === "dispatched") return matchesSearch && (job.status === "dispatched" || job.status === "accepted");
    if (statusFilter === "in_progress") return matchesSearch && job.status === "in_progress";
    return matchesSearch;
  });

  const stats = {
    total: jobs?.length || 0,
    pending: jobs?.filter((j) => j.status === "pending").length || 0,
    dispatched: jobs?.filter((j) => j.status === "dispatched" || j.status === "accepted").length || 0,
    inProgress: jobs?.filter((j) => j.status === "in_progress").length || 0,
  };

  const getStatusVariant = (status: string | null): "success" | "warning" | "destructive" | "primary" | "default" => {
    switch (status) {
      case "in_progress":
        return "primary";
      case "dispatched":
      case "accepted":
        return "warning";
      case "pending":
        return "destructive";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string | null): string => {
    switch (status) {
      case "in_progress":
        return "In Progress";
      case "dispatched":
        return "Dispatched";
      case "accepted":
        return "Accepted";
      case "pending":
        return "Pending Driver";
      default:
        return status || "Unknown";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Active Jobs</h1>
            <p className="text-muted-foreground">Monitor and manage ongoing service requests</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin">← Back to Dashboard</Link>
            </Button>
            <Button onClick={() => {
              refetch();
              toast.success("Jobs refreshed");
            }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${statusFilter === "all" ? "ring-2 ring-primary" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Active</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-destructive/50 ${statusFilter === "pending" ? "ring-2 ring-destructive" : ""}`}
              onClick={() => setStatusFilter("pending")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <Clock className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Driver</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-warning/50 ${statusFilter === "dispatched" ? "ring-2 ring-warning" : ""}`}
              onClick={() => setStatusFilter("dispatched")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Car className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.dispatched}</p>
                  <p className="text-sm text-muted-foreground">Dispatched</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${statusFilter === "in_progress" ? "ring-2 ring-primary" : ""}`}
              onClick={() => setStatusFilter("in_progress")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Active Jobs
              <StatusBadge variant="active" pulse>Live</StatusBadge>
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
                <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No active jobs</h3>
                <p className="text-muted-foreground">All jobs have been completed or there are no pending requests.</p>
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
                    <TableHead>Status</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
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
                          <div>
                            <p className="font-medium">{job.customer?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{job.customer?.phone || "-"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{job.driverProfile?.full_name || "Unassigned"}</p>
                            <p className="text-xs text-muted-foreground">{job.drivers?.vehicle_plate || "-"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 max-w-[200px]">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="truncate text-sm">{job.pickup_address || "No address"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge 
                          variant={getStatusVariant(job.status)} 
                          pulse={job.status === "pending"}
                        >
                          {getStatusLabel(job.status)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">
                          {job.eta_minutes ? `${job.eta_minutes} min` : "--"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(job.created_at), "HH:mm")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => cancelJobMutation.mutate(job.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
