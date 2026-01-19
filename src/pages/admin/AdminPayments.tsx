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
import { format } from "date-fns";
import {
  Search,
  Filter,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";

// Demo data for realistic preview
const demoPayments = [
  {
    id: "pay-001",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    transaction_id: "TXN-2026-001245",
    amount: 450,
    driver_payout: 360,
    platform_fee: 90,
    status: "completed",
    payment_method: "card",
    failure_reason: null,
    jobs: { job_number: "JOB-089", services: { name: "Tyre Change" } },
  },
  {
    id: "pay-002",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    transaction_id: "TXN-2026-001244",
    amount: 280,
    driver_payout: 0,
    platform_fee: 0,
    status: "failed",
    payment_method: "card",
    failure_reason: "Card declined - insufficient funds",
    jobs: { job_number: "JOB-088", services: { name: "Jump Start" } },
  },
  {
    id: "pay-003",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    transaction_id: "TXN-2026-001243",
    amount: 650,
    driver_payout: 520,
    platform_fee: 130,
    status: "completed",
    payment_method: "eft",
    failure_reason: null,
    jobs: { job_number: "JOB-087", services: { name: "Towing" } },
  },
  {
    id: "pay-004",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    transaction_id: "TXN-2026-001242",
    amount: 180,
    driver_payout: 144,
    platform_fee: 36,
    status: "pending",
    payment_method: "card",
    failure_reason: null,
    jobs: { job_number: "JOB-086", services: { name: "Fuel Delivery" } },
  },
  {
    id: "pay-005",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    transaction_id: "TXN-2026-001241",
    amount: 320,
    driver_payout: 256,
    platform_fee: 64,
    status: "refunded",
    payment_method: "card",
    failure_reason: null,
    refund_amount: 320,
    jobs: { job_number: "JOB-085", services: { name: "Battery Replacement" } },
  },
  {
    id: "pay-006",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    transaction_id: "TXN-2026-001240",
    amount: 550,
    driver_payout: 0,
    platform_fee: 0,
    status: "failed",
    payment_method: "eft",
    failure_reason: "Payment timeout - bank connection failed",
    jobs: { job_number: "JOB-084", services: { name: "Lockout Assist" } },
  },
  {
    id: "pay-007",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    transaction_id: "TXN-2026-001239",
    amount: 890,
    driver_payout: 712,
    platform_fee: 178,
    status: "completed",
    payment_method: "card",
    failure_reason: null,
    jobs: { job_number: "JOB-083", services: { name: "Towing" } },
  },
  {
    id: "pay-008",
    created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    transaction_id: "TXN-2026-001238",
    amount: 220,
    driver_payout: 176,
    platform_fee: 44,
    status: "processing",
    payment_method: "card",
    failure_reason: null,
    jobs: { job_number: "JOB-082", services: { name: "Jump Start" } },
  },
  {
    id: "pay-009",
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    transaction_id: "TXN-2026-001237",
    amount: 380,
    driver_payout: 0,
    platform_fee: 0,
    status: "failed",
    payment_method: "card",
    failure_reason: "Card expired",
    jobs: { job_number: "JOB-081", services: { name: "Tyre Change" } },
  },
  {
    id: "pay-010",
    created_at: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    transaction_id: "TXN-2026-001236",
    amount: 750,
    driver_payout: 600,
    platform_fee: 150,
    status: "completed",
    payment_method: "eft",
    failure_reason: null,
    jobs: { job_number: "JOB-080", services: { name: "Accident Assist" } },
  },
];

export default function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          jobs:job_id (
            job_number,
            services:service_id (name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Use demo data if no real payments exist
  const displayPayments = payments && payments.length > 0 ? payments : demoPayments;

  const filteredPayments = displayPayments?.filter((payment) => {
    const matchesSearch =
      payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.jobs?.job_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalRevenue: displayPayments?.reduce((sum, p) => sum + (p.status === "completed" ? Number(p.amount) : 0), 0) || 0,
    totalDriverPayouts: displayPayments?.reduce((sum, p) => sum + (p.status === "completed" ? Number(p.driver_payout || 0) : 0), 0) || 0,
    platformFees: displayPayments?.reduce((sum, p) => sum + (p.status === "completed" ? Number(p.platform_fee || 0) : 0), 0) || 0,
    failedPayments: displayPayments?.filter((p) => p.status === "failed").length || 0,
  };

  const getStatusVariant = (status: string | null): "success" | "warning" | "destructive" | "default" => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
      case "processing":
        return "warning";
      case "failed":
        return "destructive";
      default:
        return "default";
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ["Date", "Job", "Amount", "Driver Payout", "Platform Fee", "Status", "Method"];
    const rows = filteredPayments?.map((p) => [
      format(new Date(p.created_at), "yyyy-MM-dd HH:mm"),
      p.jobs?.job_number || "-",
      p.amount,
      p.driver_payout || 0,
      p.platform_fee || 0,
      p.status,
      p.payment_method,
    ]);

    const csv = [headers, ...(rows || [])].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payments & Payouts</h1>
            <p className="text-muted-foreground">Track payments, driver payouts, and reconciliation</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-success/50 ${statusFilter === "completed" ? "ring-2 ring-success" : ""}`}
              onClick={() => setStatusFilter("completed")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-success/10 p-3">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R{stats.totalRevenue.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${statusFilter === "all" ? "ring-2 ring-primary" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R{stats.totalDriverPayouts.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Driver Payouts</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-warning/50 ${statusFilter === "pending" ? "ring-2 ring-warning" : ""}`}
              onClick={() => setStatusFilter("pending")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R{stats.platformFees.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Platform Fees</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-destructive/50 ${statusFilter === "failed" ? "ring-2 ring-destructive" : ""}`}
              onClick={() => setStatusFilter("failed")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.failedPayments}</p>
                  <p className="text-sm text-muted-foreground">Failed Payments</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>All Transactions</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPayments && filteredPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Driver Payout</TableHead>
                    <TableHead>Platform Fee</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow 
                      key={payment.id}
                      className={payment.status === "failed" ? "bg-destructive/5" : ""}
                    >
                      <TableCell>
                        {format(new Date(payment.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {payment.transaction_id || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.jobs?.job_number || "-"}
                      </TableCell>
                      <TableCell>{payment.jobs?.services?.name || "-"}</TableCell>
                      <TableCell className="font-medium">
                        R{Number(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className={payment.status === "completed" ? "text-success" : "text-muted-foreground"}>
                        R{Number(payment.driver_payout || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        R{Number(payment.platform_fee || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="capitalize">{payment.payment_method}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <StatusBadge variant={getStatusVariant(payment.status)}>
                            {payment.status}
                          </StatusBadge>
                          {payment.status === "failed" && payment.failure_reason && (
                            <span className="text-xs text-destructive">
                              {payment.failure_reason}
                            </span>
                          )}
                          {payment.status === "refunded" && (
                            <span className="text-xs text-muted-foreground">
                              Refunded: R{Number(payment.refund_amount || payment.amount).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">No payments yet</p>
                <p className="text-sm text-muted-foreground">
                  Payments will appear here when customers complete transactions
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
