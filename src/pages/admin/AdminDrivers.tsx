import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DriverDocumentReviewDialog } from "@/components/admin/DriverDocumentReviewDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  MessageSquare,
  Send,
  FileText,
  Image,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

interface Driver {
  id: string;
  user_id: string;
  license_number: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  is_verified: boolean | null;
  is_online: boolean | null;
  rating: number | null;
  total_jobs: number | null;
  payout_percentage: number | null;
  status: string | null;
  created_at: string;
  license_document_url: string | null;
  vehicle_registration_url: string | null;
  profile_photo_url: string | null;
  id_document_url: string | null;
  license_document_status?: string | null;
  license_document_note?: string | null;
  vehicle_registration_status?: string | null;
  vehicle_registration_note?: string | null;
  profile_photo_status?: string | null;
  profile_photo_note?: string | null;
  id_document_status?: string | null;
  id_document_note?: string | null;
  documents_submitted_at: string | null;
  rejection_reason: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}


export default function AdminDrivers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [messageSubject, setMessageSubject] = useState<"complaint" | "payout" | "general">("general");
  const [messageContent, setMessageContent] = useState("");
  const [newPayout, setNewPayout] = useState(80);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "all") {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", value);
    }
    setSearchParams(searchParams);
  };

  const { data: drivers, isLoading, refetch } = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: async () => {
      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false });

      if (driversError) throw driversError;

      // If no real data, return demo drivers
      if (!driversData || driversData.length === 0) {
        return demoDrivers;
      }

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
    const matchesSearch = 
      driver.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      driver.profiles?.email?.toLowerCase().includes(searchLower) ||
      driver.vehicle_plate?.toLowerCase().includes(searchLower) ||
      driver.license_number?.toLowerCase().includes(searchLower);
    
    if (activeTab === "pending") {
      return matchesSearch && driver.status === "pending";
    }
    return matchesSearch;
  });

  const pendingDrivers = drivers?.filter((d) => d.status === "pending") || [];

  const stats = {
    total: drivers?.length || 0,
    online: drivers?.filter((d) => d.is_online).length || 0,
    approved: drivers?.filter((d) => d.status === "approved").length || 0,
    pending: pendingDrivers.length,
  };

  const handleReviewDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setRejectionReason("");
    setReviewDialogOpen(true);
  };

  const rejectDriverMutation = useMutation({
    mutationFn: async ({ driverId, reason }: { driverId: string; reason: string }) => {
      const { error } = await supabase
        .from("drivers")
        .update({ 
          status: "rejected", 
          is_verified: false,
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq("id", driverId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Driver application rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      setReviewDialogOpen(false);
      setSelectedDriver(null);
    },
    onError: (error) => {
      toast.error("Failed to reject: " + error.message);
    },
  });

  const approveDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      const { error } = await supabase
        .from("drivers")
        .update({ 
          status: "approved", 
          is_verified: true,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq("id", driverId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Driver approved successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      setReviewDialogOpen(false);
      setSelectedDriver(null);
    },
    onError: (error) => {
      toast.error("Failed to approve: " + error.message);
    },
  });

  const handleAdjustPayout = (driver: Driver) => {
    setSelectedDriver(driver);
    setNewPayout((driver.payout_percentage || 0.8) * 100);
    setPayoutDialogOpen(true);
  };

  const handleMessageDriver = (driver: Driver, subject: "complaint" | "payout" | "general" = "general") => {
    setSelectedDriver(driver);
    setMessageSubject(subject);
    setMessageContent("");
    setMessageDialogOpen(true);
  };

  const sendMessageMutation = useMutation({
    mutationFn: async ({ recipientId, subject, content, category }: { 
      recipientId: string; 
      subject: string; 
      content: string; 
      category: string;
    }) => {
      if (!user?.id) throw new Error("You must be logged in to send messages");
      
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          subject,
          content,
          category,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Message sent to ${selectedDriver?.profiles?.full_name}`);
      setMessageDialogOpen(false);
      setSelectedDriver(null);
      setMessageContent("");
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
    },
  });

  const handleSendMessage = () => {
    if (!selectedDriver?.user_id || !messageContent.trim()) return;
    
    sendMessageMutation.mutate({
      recipientId: selectedDriver.user_id,
      subject: getSubjectTitle(messageSubject),
      content: messageContent,
      category: messageSubject,
    });
  };

  const getSubjectTitle = (subject: "complaint" | "payout" | "general") => {
    switch (subject) {
      case "complaint":
        return "Regarding Customer Complaint";
      case "payout":
        return "Regarding Payout Adjustment";
      default:
        return "General Message";
    }
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
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${activeTab === "all" ? "ring-2 ring-primary" : ""}`}
              onClick={() => handleTabChange("all")}
            >
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
            <Card 
              className="cursor-pointer transition-all hover:shadow-md hover:border-success/50"
              onClick={() => handleTabChange("all")}
            >
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
            <Card 
              className="cursor-pointer transition-all hover:shadow-md hover:border-success/50"
              onClick={() => handleTabChange("all")}
            >
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
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-warning/50 ${activeTab === "pending" ? "ring-2 ring-warning" : ""}`}
              onClick={() => handleTabChange("pending")}
            >
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

        {/* Tabs for All Drivers and Pending Applications */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Drivers</TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending Applications
              {stats.pending > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleMessageDriver(driver, "complaint")}>
                              <MessageSquare className="mr-2 h-4 w-4 text-warning" />
                              Message About Complaint
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMessageDriver(driver, "payout")}>
                              <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                              Discuss Payout
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMessageDriver(driver, "general")}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Send Message
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
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Driver Applications</CardTitle>
                <CardDescription>
                  Review and approve new driver registrations. Check uploaded documents before approving.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDrivers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="mb-4 h-12 w-12 text-success/50" />
                    <h3 className="text-lg font-medium">No Pending Applications</h3>
                    <p className="text-sm text-muted-foreground">
                      All driver applications have been reviewed
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingDrivers.map((driver) => (
                      <Card key={driver.id} className="border-warning/50">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            {/* Driver Info */}
                            <div className="flex items-start gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-warning/10 text-warning">
                                  {driver.profiles?.full_name?.charAt(0).toUpperCase() || "D"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <h4 className="font-semibold">{driver.profiles?.full_name || "Unknown"}</h4>
                                <p className="text-sm text-muted-foreground">{driver.profiles?.email}</p>
                                <p className="text-sm text-muted-foreground">{driver.profiles?.phone}</p>
                                <div className="flex items-center gap-2 pt-1">
                                  <Badge variant="outline">{driver.vehicle_type}</Badge>
                                  <span className="text-sm">
                                    {driver.vehicle_make} {driver.vehicle_model} {driver.vehicle_year}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Applied: {format(new Date(driver.created_at), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            </div>

                            {/* Documents Status */}
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Required Documents</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 text-sm">
                                  {driver.license_document_url ? (
                                    <CheckCircle className="h-4 w-4 text-success" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                  )}
                                  <span>Driver's License</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  {driver.id_document_url ? (
                                    <CheckCircle className="h-4 w-4 text-success" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                  )}
                                  <span>ID Document</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  {driver.vehicle_registration_url ? (
                                    <CheckCircle className="h-4 w-4 text-success" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                  )}
                                  <span>Vehicle Reg</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  {driver.profile_photo_url ? (
                                    <CheckCircle className="h-4 w-4 text-success" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                  )}
                                  <span>Profile Photo</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReviewDriver(driver)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Review
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => approveDriverMutation.mutate(driver.id)}
                                disabled={approveDriverMutation.isPending}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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

      {/* Message Driver Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message Driver
            </DialogTitle>
            <DialogDescription>
              Send a direct message to {selectedDriver?.profiles?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {selectedDriver?.profiles?.full_name?.charAt(0).toUpperCase() || "D"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedDriver?.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedDriver?.profiles?.email}</p>
                  <p className="text-xs text-muted-foreground">{selectedDriver?.profiles?.phone}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Subject</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={messageSubject === "complaint" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMessageSubject("complaint")}
                >
                  Complaint
                </Button>
                <Button
                  type="button"
                  variant={messageSubject === "payout" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMessageSubject("payout")}
                >
                  Payout
                </Button>
                <Button
                  type="button"
                  variant={messageSubject === "general" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMessageSubject("general")}
                >
                  General
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder={
                  messageSubject === "complaint"
                    ? "We've received a complaint regarding your recent trip..."
                    : messageSubject === "payout"
                    ? "We'd like to discuss your current payout arrangement..."
                    : "Enter your message here..."
                }
                className="min-h-[120px]"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              This message will appear in the driver's in-app notifications.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || sendMessageMutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Driver Dialog */}
      <DriverDocumentReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        driver={selectedDriver}
      />
    </AdminLayout>
  );
}
