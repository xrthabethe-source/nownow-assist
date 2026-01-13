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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  MoreVertical,
  Car,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  RefreshCw,
  DollarSign,
  MapPin,
  Ban,
} from "lucide-react";
import { motion } from "framer-motion";

interface Driver {
  id: string;
  user_id: string;
  license_number: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  is_verified: boolean | null;
  is_online: boolean | null;
  rating: number | null;
  total_jobs: number | null;
  payout_percentage: number | null;
  status: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export default function AdminDrivers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [newPayout, setNewPayout] = useState(80);
  const queryClient = useQueryClient();

  const { data: drivers, isLoading, refetch } = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: async () => {
      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false });

      if (driversError) throw driversError;

      const { data: profilesData } = await supabase.from("profiles").select("id, full_name, email, phone");
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      return driversData.map(d => ({
        ...d,
        profiles: profilesMap.get(d.user_id) || null
      })) as Driver[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ driverId, status }: { driverId: string; status: string }) => {
      const { error } = await supabase
        .from("drivers")
        .update({ status, is_verified: status === "approved" })
        .eq("id", driverId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Driver status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const updatePayoutMutation = useMutation({
    mutationFn: async ({ driverId, payout }: { driverId: string; payout: number }) => {
      const { error } = await supabase
        .from("drivers")
        .update({ payout_percentage: payout / 100 })
        .eq("id", driverId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout percentage updated");
      queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      setPayoutDialogOpen(false);
      setSelectedDriver(null);
    },
    onError: (error) => {
      toast.error("Failed to update payout: " + error.message);
    },
  });

  const filteredDrivers = drivers?.filter((driver) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      driver.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      driver.profiles?.email?.toLowerCase().includes(searchLower) ||
      driver.vehicle_plate?.toLowerCase().includes(searchLower) ||
      driver.license_number?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: drivers?.length || 0,
    online: drivers?.filter((d) => d.is_online).length || 0,
    approved: drivers?.filter((d) => d.status === "approved").length || 0,
    pending: drivers?.filter((d) => d.status === "pending").length || 0,
  };

  const handleAdjustPayout = (driver: Driver) => {
    setSelectedDriver(driver);
    setNewPayout((driver.payout_percentage || 0.8) * 100);
    setPayoutDialogOpen(true);
  };

  const getStatusVariant = (status: string | null): "success" | "warning" | "destructive" | "default" => {
    switch (status) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "suspended":
      case "rejected":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Driver Management</h1>
            <p className="text-muted-foreground">Verify, manage, and monitor drivers</p>
          </div>
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Drivers</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-success/10 p-3">
                  <MapPin className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.online}</p>
                  <p className="text-sm text-muted-foreground">Online Now</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-success/10 p-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Drivers Table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>All Drivers</CardTitle>
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
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Payout %</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
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
                            {driver.is_online && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-success" />
                            )}
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
                        <StatusBadge variant={getStatusVariant(driver.status)}>
                          {driver.status || "pending"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span>{driver.rating?.toFixed(1) || "5.0"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{driver.total_jobs || 0}</TableCell>
                      <TableCell>{((driver.payout_percentage || 0.8) * 100).toFixed(0)}%</TableCell>
                      <TableCell>
                        {format(new Date(driver.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {driver.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      driverId: driver.id,
                                      status: "approved",
                                    })
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-success" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      driverId: driver.id,
                                      status: "rejected",
                                    })
                                  }
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-destructive" />
                                  Reject
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {driver.status === "approved" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    driverId: driver.id,
                                    status: "suspended",
                                  })
                                }
                              >
                                <Ban className="mr-2 h-4 w-4 text-destructive" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {driver.status === "suspended" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    driverId: driver.id,
                                    status: "approved",
                                  })
                                }
                              >
                                <CheckCircle className="mr-2 h-4 w-4 text-success" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleAdjustPayout(driver)}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Adjust Payout
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

      {/* Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Driver Payout</DialogTitle>
            <DialogDescription>
              Set the payout percentage for {selectedDriver?.profiles?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label>Payout Percentage</Label>
              <span className="text-2xl font-bold text-primary">{newPayout}%</span>
            </div>
            <Slider
              value={[newPayout]}
              onValueChange={([value]) => setNewPayout(value)}
              min={50}
              max={95}
              step={5}
            />
            <p className="text-sm text-muted-foreground">
              The driver will receive {newPayout}% of each job's total fare.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedDriver &&
                updatePayoutMutation.mutate({ driverId: selectedDriver.id, payout: newPayout })
              }
              disabled={updatePayoutMutation.isPending}
            >
              {updatePayoutMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
