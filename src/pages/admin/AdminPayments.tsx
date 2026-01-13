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

  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch =
      payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.jobs?.job_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalRevenue: payments?.reduce((sum, p) => sum + (p.status === "completed" ? Number(p.amount) : 0), 0) || 0,
    totalDriverPayouts: payments?.reduce((sum, p) => sum + (p.status === "completed" ? Number(p.driver_payout || 0) : 0), 0) || 0,
    platformFees: payments?.reduce((sum, p) => sum + (p.status === "completed" ? Number(p.platform_fee || 0) : 0), 0) || 0,
    failedPayments: payments?.filter((p) => p.status === "failed").length || 0,
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
            <Card>
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
            <Card>
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
            <Card>
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
            <Card>
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
                    <TableRow key={payment.id}>
                      <TableCell>
                        {format(new Date(payment.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.jobs?.job_number || "-"}
                      </TableCell>
                      <TableCell>{payment.jobs?.services?.name || "-"}</TableCell>
                      <TableCell className="font-medium">
                        R{Number(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-success">
                        R{Number(payment.driver_payout || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        R{Number(payment.platform_fee || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="capitalize">{payment.payment_method}</TableCell>
                      <TableCell>
                        <StatusBadge variant={getStatusVariant(payment.status)}>
                          {payment.status}
                        </StatusBadge>
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
