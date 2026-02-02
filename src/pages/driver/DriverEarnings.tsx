import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/shared/BottomNav";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TrendingUp, Calendar, DollarSign, ChevronRight, Download, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { TodayJobsDialog } from "@/components/driver/TodayJobsDialog";
import { WeekJobsDialog } from "@/components/driver/WeekJobsDialog";
import { PendingPaymentsDialog } from "@/components/driver/PendingPaymentsDialog";
import { RequestPayoutDialog } from "@/components/driver/RequestPayoutDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfToday, startOfWeek, formatDistanceToNow } from "date-fns";

export const DriverEarnings = () => {
  const [showTodayJobs, setShowTodayJobs] = useState(false);
  const [showWeekJobs, setShowWeekJobs] = useState(false);
  const [showPendingPayments, setShowPendingPayments] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const { user } = useAuth();

  // Fetch driver record
  const { data: driverRecord } = useQuery({
    queryKey: ["driver-record", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch today's earnings
  const { data: todayEarnings, isLoading: todayLoading } = useQuery({
    queryKey: ["driver-today-earnings", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return 0;
      const today = startOfToday();
      
      const { data } = await supabase
        .from("jobs")
        .select("final_price, estimated_price")
        .eq("driver_id", driverRecord.id)
        .eq("status", "completed")
        .gte("completed_at", today.toISOString());

      return (data || []).reduce((sum, job) => {
        return sum + ((job.final_price || job.estimated_price || 0) * 0.8);
      }, 0);
    },
    enabled: !!driverRecord?.id,
  });

  // Fetch this week's earnings
  const { data: weekEarnings, isLoading: weekLoading } = useQuery({
    queryKey: ["driver-week-earnings", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return 0;
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      const { data } = await supabase
        .from("jobs")
        .select("final_price, estimated_price")
        .eq("driver_id", driverRecord.id)
        .eq("status", "completed")
        .gte("completed_at", weekStart.toISOString());

      return (data || []).reduce((sum, job) => {
        return sum + ((job.final_price || job.estimated_price || 0) * 0.8);
      }, 0);
    },
    enabled: !!driverRecord?.id,
  });

  // Fetch pending payments
  const { data: pendingAmount, isLoading: pendingLoading } = useQuery({
    queryKey: ["driver-pending-amount", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return 0;
      
      const { data } = await supabase
        .from("payments")
        .select("driver_payout, amount")
        .eq("driver_id", driverRecord.id)
        .in("status", ["pending", "processing"]);

      return (data || []).reduce((sum, p) => {
        return sum + (p.driver_payout || p.amount * 0.8);
      }, 0);
    },
    enabled: !!driverRecord?.id,
  });

  // Fetch recent transactions
  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["driver-transactions", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return [];
      
      // Fetch completed jobs as earnings
      const { data: jobs } = await supabase
        .from("jobs")
        .select(`
          id,
          completed_at,
          final_price,
          estimated_price,
          services:service_id (name)
        `)
        .eq("driver_id", driverRecord.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10);

      // Fetch payouts
      const { data: payouts } = await supabase
        .from("payments")
        .select("id, driver_payout, amount, status, created_at")
        .eq("driver_id", driverRecord.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(5);

      const transactions = [
        ...(jobs || []).map((job) => ({
          id: job.id,
          type: "earning" as const,
          description: `${(job.services as any)?.name || "Service"}`,
          amount: `+R${Math.round(((job.final_price || job.estimated_price || 0) * 0.8))}`,
          time: job.completed_at ? formatDistanceToNow(new Date(job.completed_at), { addSuffix: true }) : "Recently",
          date: job.completed_at ? new Date(job.completed_at) : new Date(),
        })),
        ...(payouts || []).map((payout) => ({
          id: payout.id,
          type: "payout" as const,
          description: "Payout",
          amount: `-R${Math.round(payout.driver_payout || payout.amount * 0.8)}`,
          time: payout.created_at ? formatDistanceToNow(new Date(payout.created_at), { addSuffix: true }) : "Recently",
          date: payout.created_at ? new Date(payout.created_at) : new Date(),
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

      return transactions;
    },
    enabled: !!driverRecord?.id,
  });

  const isLoading = todayLoading || weekLoading || pendingLoading;

  const earnings = {
    today: `R${Math.round(todayEarnings || 0).toLocaleString()}`,
    thisWeek: `R${Math.round(weekEarnings || 0).toLocaleString()}`,
    pending: `R${Math.round(pendingAmount || 0).toLocaleString()}`,
  };

  return (
    <div className="min-h-screen bg-background pb-24 dark">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container py-4">
          <h1 className="text-xl font-bold text-foreground">Earnings</h1>
          <p className="text-sm text-muted-foreground">Track your income</p>
        </div>
      </header>

      <div className="container py-4 space-y-4">
        {/* Summary Cards - Now 3 cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <Card 
            variant="amber" 
            className="cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
            onClick={() => setShowTodayJobs(true)}
          >
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
                <span className="text-sm text-primary-foreground/80">Today</span>
              </div>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
              ) : (
                <p className="text-xl font-bold text-primary-foreground">{earnings.today}</p>
              )}
            </CardContent>
          </Card>

          <Card 
            variant="default" 
            className="cursor-pointer transition-all hover:border-primary/50 active:scale-[0.98]"
            onClick={() => setShowWeekJobs(true)}
          >
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Week</span>
              </div>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-xl font-bold text-foreground">{earnings.thisWeek}</p>
              )}
            </CardContent>
          </Card>

          <Card 
            variant="success" 
            className="cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
            onClick={() => setShowPendingPayments(true)}
          >
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Pending</span>
              </div>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <p className="text-xl font-bold">{earnings.pending}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3"
        >
          <Button variant="amber" className="flex-1" onClick={() => setShowPayoutDialog(true)}>
            Request Payout
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card variant="default">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {transactionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !recentTransactions || recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-3 transition-all hover:border-primary/50 hover:bg-muted/50 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          transaction.type === "earning"
                            ? "bg-success/10"
                            : "bg-primary/10"
                        }`}
                      >
                        {transaction.type === "earning" ? (
                          <ArrowUpRight className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{transaction.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          transaction.type === "earning" ? "text-success" : "text-foreground"
                        }`}
                      >
                        {transaction.amount}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payout Info */}
        {(pendingAmount || 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="interactive" className="cursor-pointer transition-all hover:border-primary/50 active:scale-[0.99]" onClick={() => setShowPendingPayments(true)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Pending Payout</p>
                    <p className="text-sm text-muted-foreground">Available for withdrawal</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{earnings.pending}</p>
                      <StatusBadge variant="pending">Processing</StatusBadge>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <BottomNav type="driver" />

      {/* Dialogs */}
      <TodayJobsDialog open={showTodayJobs} onOpenChange={setShowTodayJobs} />
      <WeekJobsDialog open={showWeekJobs} onOpenChange={setShowWeekJobs} />
      <PendingPaymentsDialog open={showPendingPayments} onOpenChange={setShowPendingPayments} />
      <RequestPayoutDialog 
        open={showPayoutDialog} 
        onOpenChange={setShowPayoutDialog}
        availableBalance={earnings.pending}
      />
    </div>
  );
};

export default DriverEarnings;
