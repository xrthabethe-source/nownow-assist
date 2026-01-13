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
    services?: { name: string };
  };
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

export default function AdminDisputes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [issueRefund, setIssueRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const queryClient = useQueryClient();

  const { data: disputes, isLoading, refetch } = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select(`
          *,
          jobs:job_id (
            job_number,
            services:service_id (name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Dispute[];
    },
  });

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
      dispute.description.toLowerCase().includes(searchQuery.toLowerCase());
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
            <Card>
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
            <Card>
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
            <Card>
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
            <Card>
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
                    <TableHead>Job</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Reporter</TableHead>
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
                      <TableCell className="font-mono text-sm">
                        {dispute.jobs?.job_number || "-"}
                      </TableCell>
                      <TableCell className="capitalize">{dispute.category}</TableCell>
                      <TableCell>
                        <StatusBadge variant={dispute.reporter_type === "customer" ? "primary" : "warning"}>
                          {dispute.reporter_type}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {dispute.description}
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
                          {dispute.status === "open" && (
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
                          {(dispute.status === "open" || dispute.status === "investigating") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResolve(dispute)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Provide a resolution for this dispute
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">Dispute Details</p>
              <p className="text-xs text-muted-foreground mt-1">
                Job: {selectedDispute?.jobs?.job_number}
              </p>
              <p className="text-xs text-muted-foreground">
                Category: {selectedDispute?.category}
              </p>
              <p className="text-sm mt-2">{selectedDispute?.description}</p>
            </div>

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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolutionDialogOpen(false)}>
              Cancel
            </Button>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
