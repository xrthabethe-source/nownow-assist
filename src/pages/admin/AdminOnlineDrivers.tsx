import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Car,
  MapPin,
  RefreshCw,
  Star,
  Phone,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface OnlineDriver {
  id: string;
  user_id: string;
  vehicle_plate: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_type: string | null;
  rating: number | null;
  total_jobs: number | null;
  current_location_lat: number | null;
  current_location_lng: number | null;
  status: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
  currentJob?: {
    id: string;
    job_number: string;
    status: string | null;
  } | null;
}

export default function AdminOnlineDrivers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: drivers, isLoading, refetch } = useQuery({
    queryKey: ["admin-online-drivers"],
    queryFn: async () => {
      const { data: driversData, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("is_online", true)
        .order("rating", { ascending: false });

      if (error) throw error;

      // Get profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone");

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      // Get active jobs for these drivers
      const driverIds = driversData.map(d => d.id);
      const { data: activeJobs } = await supabase
        .from("jobs")
        .select("id, job_number, status, driver_id")
        .in("driver_id", driverIds)
        .in("status", ["dispatched", "in_progress", "accepted"]);

      const jobsMap = new Map(activeJobs?.map(j => [j.driver_id, j]));

      return driversData.map(d => ({
        ...d,
        profiles: profilesMap.get(d.user_id) || null,
        currentJob: jobsMap.get(d.id) || null,
      })) as OnlineDriver[];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const filteredDrivers = drivers?.filter((driver) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      driver.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      driver.profiles?.email?.toLowerCase().includes(searchLower) ||
      driver.profiles?.phone?.toLowerCase().includes(searchLower) ||
      driver.vehicle_plate?.toLowerCase().includes(searchLower)
    );
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "available") return matchesSearch && !driver.currentJob;
    if (statusFilter === "onJob") return matchesSearch && !!driver.currentJob;
    return matchesSearch;
  });

  const stats = {
    total: drivers?.length || 0,
    available: drivers?.filter((d) => !d.currentJob).length || 0,
    onJob: drivers?.filter((d) => d.currentJob).length || 0,
    avgRating: drivers?.length 
      ? (drivers.reduce((sum, d) => sum + (d.rating || 5), 0) / drivers.length).toFixed(1) 
      : "5.0",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Online Drivers</h1>
            <p className="text-muted-foreground">View all drivers currently available for jobs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin">← Back to Dashboard</Link>
            </Button>
            <Button onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-success/50 ${statusFilter === "all" ? "ring-2 ring-success" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-success/10 p-3">
                  <Car className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Online Now</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${statusFilter === "available" ? "ring-2 ring-primary" : ""}`}
              onClick={() => setStatusFilter("available")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.available}</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-warning/50 ${statusFilter === "onJob" ? "ring-2 ring-warning" : ""}`}
              onClick={() => setStatusFilter("onJob")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Activity className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.onJob}</p>
                  <p className="text-sm text-muted-foreground">On a Job</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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
        </div>

        {/* Drivers Table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-success" />
              Online Drivers
              <StatusBadge variant="active" pulse>Live</StatusBadge>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
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
            ) : filteredDrivers?.length === 0 ? (
              <div className="py-12 text-center">
                <Car className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No drivers online</h3>
                <p className="text-muted-foreground">There are currently no drivers available.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Job</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Total Jobs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers?.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarFallback>
                                {driver.profiles?.full_name?.charAt(0).toUpperCase() || "D"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-success" />
                          </div>
                          <div>
                            <p className="font-medium">{driver.profiles?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{driver.profiles?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{driver.vehicle_plate || "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {driver.vehicle_make} {driver.vehicle_model}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{driver.profiles?.phone || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {driver.currentJob ? (
                          <StatusBadge variant="warning">On Job</StatusBadge>
                        ) : (
                          <StatusBadge variant="success">Available</StatusBadge>
                        )}
                      </TableCell>
                      <TableCell>
                        {driver.currentJob ? (
                          <span className="font-mono text-sm font-medium text-primary">
                            {driver.currentJob.job_number}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span>{driver.rating?.toFixed(1) || "5.0"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{driver.total_jobs || 0}</span>
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
