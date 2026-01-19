import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  Filter,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";

interface Dispute {
  id: string;
  job_id: string | null;
  reporter_id: string | null;
  reporter_type: string | null;
  category: string;
  description: string;
  status: string | null;
  resolution: string | null;
  refund_issued: boolean | null;
  refund_amount: number | null;
  created_at: string;
  resolved_at: string | null;
  jobs?: {
    job_number: string;
    pickup_address?: string | null;
    estimated_price?: number | null;
    final_price?: number | null;
    status?: string | null;
    created_at?: string;
    services?: { name: string } | null;
  } | null;
  reporter_name?: string;
  reporter_email?: string;
}

// Demo disputes with realistic data for when no real data exists
const demoDisputes: Dispute[] = [
  {
    id: "demo-1",
    job_id: "job-001",
    reporter_id: "user-001",
    reporter_type: "customer",
    category: "overcharge",
    description: "I was charged R450 for a jumpstart that should have been R150. The driver took a long route and added extra fees without my consent.",
    status: "open",
    resolution: null,
    refund_issued: null,
    refund_amount: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    reporter_name: "Thabo Mokoena",
    reporter_email: "thabo.m@email.com",
    jobs: {
      job_number: "JOB-2024-0892",
      pickup_address: "123 Main Road, Sandton, Johannesburg",
      estimated_price: 150,
      final_price: 450,
      status: "completed",
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      services: { name: "Jump Start" },
    },
  },
  {
    id: "demo-2",
    job_id: "job-002",
    reporter_id: "user-002",
    reporter_type: "customer",
    category: "service_quality",
    description: "Driver arrived 45 minutes late and was very rude. He blamed me for the flat tyre and refused to help properly. I need a refund.",
    status: "investigating",
    resolution: null,
    refund_issued: null,
    refund_amount: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    reporter_name: "Nomvula Dlamini",
    reporter_email: "nomvula.d@email.com",
    jobs: {
      job_number: "JOB-2024-0876",
      pickup_address: "45 Oxford Street, Durban North",
      estimated_price: 200,
      final_price: 200,
      status: "completed",
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      services: { name: "Flat Tyre Assist" },
    },
  },
  {
    id: "demo-3",
    job_id: "job-003",
    reporter_id: "driver-001",
    reporter_type: "driver",
    category: "customer_behaviour",
    description: "Customer was abusive and threatened me when I arrived. They refused to pay and I had to leave the scene for my safety.",
    status: "open",
    resolution: null,
    refund_issued: null,
    refund_amount: null,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    reporter_name: "Sipho Nkosi",
    reporter_email: "sipho.driver@email.com",
    jobs: {
      job_number: "JOB-2024-0889",
      pickup_address: "78 Long Street, Cape Town CBD",
      estimated_price: 350,
      final_price: null,
      status: "cancelled",
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      services: { name: "Tow Truck" },
    },
  },
  {
    id: "demo-4",
    job_id: "job-004",
    reporter_id: "user-003",
    reporter_type: "customer",
    category: "damage",
    description: "The driver scratched my car while attempting to jumpstart it. I have photos as evidence. I want compensation for the repair costs.",
    status: "investigating",
    resolution: null,
    refund_issued: null,
    refund_amount: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    reporter_name: "Lerato Molefe",
    reporter_email: "lerato.molefe@email.com",
    jobs: {
      job_number: "JOB-2024-0845",
      pickup_address: "12 Rivonia Boulevard, Rivonia",
      estimated_price: 180,
      final_price: 180,
      status: "completed",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      services: { name: "Jump Start" },
    },
  },
  {
    id: "demo-5",
    job_id: "job-005",
    reporter_id: "user-004",
    reporter_type: "customer",
    category: "no_show",
    description: "Driver accepted my request but never showed up. I waited for 2 hours and had to call another service. I want a full refund.",
    status: "resolved",
    resolution: "Full refund issued to customer. Driver has been warned and placed on probation.",
    refund_issued: true,
    refund_amount: 250,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reporter_name: "Bongani Zulu",
    reporter_email: "bongani.z@email.com",
    jobs: {
      job_number: "JOB-2024-0821",
      pickup_address: "99 William Nicol Drive, Bryanston",
      estimated_price: 250,
      final_price: 250,
      status: "cancelled",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      services: { name: "Fuel Delivery" },
    },
  },
];

export default function AdminDisputes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [issueRefund, setIssueRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const queryClient = useQueryClient();

  const { data: dbDisputes, isLoading, refetch } = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select(`
          *,
          jobs:job_id (
            job_number,
            pickup_address,
            estimated_price,
            final_price,
            status,
            created_at,
            services:service_id (name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Dispute[];
    },
  });

  // Use demo data if no real disputes exist
  const disputes = dbDisputes && dbDisputes.length > 0 ? dbDisputes : demoDisputes;
  const isUsingDemoData = !dbDisputes || dbDisputes.length === 0;
  const updateStatusMutation = useMutation({
    mutationFn: async ({ disputeId, status }: { disputeId: string; status: string }) => {
      const { error } = await supabase
        .from("disputes")
        .update({ status })
        .eq("id", disputeId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dispute status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({
      disputeId,
      resolution,
      refundIssued,
      refundAmount,
    }: {
      disputeId: string;
      resolution: string;
      refundIssued: boolean;
      refundAmount: number;
    }) => {
      const { error } = await supabase
        .from("disputes")
        .update({
          status: "resolved",
          resolution,
          refund_issued: refundIssued,
          refund_amount: refundIssued ? refundAmount : null,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", disputeId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dispute resolved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      setResolutionDialogOpen(false);
      setSelectedDispute(null);
      setResolution("");
      setIssueRefund(false);
      setRefundAmount(0);
    },
    onError: (error) => {
      toast.error("Failed to resolve dispute: " + error.message);
    },
  });

  const filteredDisputes = disputes?.filter((dispute) => {
    const matchesSearch =
      dispute.jobs?.job_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.reporter_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: disputes?.length || 0,
    open: disputes?.filter((d) => d.status === "open").length || 0,
    investigating: disputes?.filter((d) => d.status === "investigating").length || 0,
    resolved: disputes?.filter((d) => d.status === "resolved").length || 0,
  };

  const getStatusVariant = (status: string | null): "destructive" | "warning" | "success" | "default" => {
    switch (status) {
      case "open":
        return "destructive";
      case "investigating":
        return "warning";
      case "resolved":
        return "success";
      default:
        return "default";
    }
  };

  const handleResolve = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResolution("");
    setIssueRefund(false);
    setRefundAmount(0);
    setResolutionDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dispute Center</h1>
            <p className="text-muted-foreground">Handle customer and driver disputes</p>
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
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${statusFilter === "all" ? "ring-2 ring-primary" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Disputes</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-destructive/50 ${statusFilter === "open" ? "ring-2 ring-destructive" : ""}`}
              onClick={() => setStatusFilter("open")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.open}</p>
                  <p className="text-sm text-muted-foreground">Open</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-warning/50 ${statusFilter === "investigating" ? "ring-2 ring-warning" : ""}`}
              onClick={() => setStatusFilter("investigating")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.investigating}</p>
                  <p className="text-sm text-muted-foreground">Investigating</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-success/50 ${statusFilter === "resolved" ? "ring-2 ring-success" : ""}`}
              onClick={() => setStatusFilter("resolved")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-success/10 p-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Disputes Table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>All Disputes</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search disputes..."
                  className="w-64 pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDisputes && filteredDisputes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Trip Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell>
                        {format(new Date(dispute.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {dispute.reporter_name || "Unknown"}
                          </p>
                          <StatusBadge variant={dispute.reporter_type === "customer" ? "primary" : "warning"}>
                            {dispute.reporter_type}
                          </StatusBadge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 max-w-[200px]">
                          <p className="font-mono text-xs font-medium">
                            {dispute.jobs?.job_number || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {dispute.jobs?.services?.name || "Unknown Service"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {dispute.jobs?.pickup_address || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-sm">{dispute.category.replace("_", " ")}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm truncate">{dispute.description}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant={getStatusVariant(dispute.status)}>
                          {dispute.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        {dispute.refund_issued ? (
                          <span className="text-success font-medium">
                            R{dispute.refund_amount?.toFixed(2)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {dispute.status === "open" && !isUsingDemoData && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  disputeId: dispute.id,
                                  status: "investigating",
                                })
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {(dispute.status === "open" || dispute.status === "investigating") && !isUsingDemoData && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResolve(dispute)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setResolutionDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">No disputes</p>
                <p className="text-sm text-muted-foreground">
                  Disputes will appear here when users report issues
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resolution Dialog */}
      <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDispute?.status === "resolved" ? "Dispute Details" : "Resolve Dispute"}
            </DialogTitle>
            <DialogDescription>
              {selectedDispute?.status === "resolved" 
                ? "View the details of this resolved dispute"
                : "Provide a resolution for this dispute"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Reporter Info */}
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Reporter</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedDispute?.reporter_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{selectedDispute?.reporter_email}</p>
                </div>
                <StatusBadge variant={selectedDispute?.reporter_type === "customer" ? "primary" : "warning"}>
                  {selectedDispute?.reporter_type}
                </StatusBadge>
              </div>
            </div>

            {/* Trip Info */}
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Trip in Question</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Job Number:</span>
                  <span className="font-mono font-medium">{selectedDispute?.jobs?.job_number || "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service:</span>
                  <span>{selectedDispute?.jobs?.services?.name || "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pickup:</span>
                  <span className="text-right max-w-[200px] truncate">{selectedDispute?.jobs?.pickup_address || "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Price:</span>
                  <span>R{selectedDispute?.jobs?.estimated_price?.toFixed(2) || "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Final Price:</span>
                  <span className={selectedDispute?.jobs?.final_price && selectedDispute?.jobs?.estimated_price && selectedDispute.jobs.final_price > selectedDispute.jobs.estimated_price ? "text-destructive font-medium" : ""}>
                    R{selectedDispute?.jobs?.final_price?.toFixed(2) || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trip Status:</span>
                  <StatusBadge variant={selectedDispute?.jobs?.status === "completed" ? "success" : selectedDispute?.jobs?.status === "cancelled" ? "destructive" : "default"}>
                    {selectedDispute?.jobs?.status || "-"}
                  </StatusBadge>
                </div>
              </div>
            </div>

            {/* Dispute Details */}
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Dispute</p>
              <p className="text-sm font-medium capitalize mb-1">{selectedDispute?.category?.replace("_", " ")}</p>
              <p className="text-sm">{selectedDispute?.description}</p>
            </div>

            {/* Resolution (if exists) */}
            {selectedDispute?.status === "resolved" && selectedDispute?.resolution && (
              <div className="rounded-lg bg-success/10 border border-success/20 p-3">
                <p className="text-xs font-semibold uppercase text-success mb-2">Resolution</p>
                <p className="text-sm">{selectedDispute.resolution}</p>
                {selectedDispute.refund_issued && (
                  <p className="text-sm font-medium text-success mt-2">
                    Refund issued: R{selectedDispute.refund_amount?.toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Resolution form - only show for unresolved disputes and not demo data */}
            {selectedDispute?.status !== "resolved" && !isUsingDemoData && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution Notes</Label>
                  <Textarea
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe how the dispute was resolved..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Issue Refund</Label>
                    <p className="text-xs text-muted-foreground">
                      Refund the customer for this dispute
                    </p>
                  </div>
                  <Switch checked={issueRefund} onCheckedChange={setIssueRefund} />
                </div>

                {issueRefund && (
                  <div className="space-y-2">
                    <Label htmlFor="refund-amount">Refund Amount (R)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="refund-amount"
                        type="number"
                        className="pl-10"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolutionDialogOpen(false)}>
              {selectedDispute?.status === "resolved" || isUsingDemoData ? "Close" : "Cancel"}
            </Button>
            {selectedDispute?.status !== "resolved" && !isUsingDemoData && (
              <Button
                onClick={() =>
                  selectedDispute &&
                  resolveDisputeMutation.mutate({
                    disputeId: selectedDispute.id,
                    resolution,
                    refundIssued: issueRefund,
                    refundAmount,
                  })
                }
                disabled={resolveDisputeMutation.isPending || !resolution}
              >
                {resolveDisputeMutation.isPending ? "Resolving..." : "Resolve Dispute"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
