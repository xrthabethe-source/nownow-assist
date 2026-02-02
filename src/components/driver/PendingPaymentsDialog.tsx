import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Clock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow } from "date-fns";

interface PendingPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PendingPaymentsDialog = ({ open, onOpenChange }: PendingPaymentsDialogProps) => {
  const { user } = useAuth();

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
    enabled: !!user?.id && open,
  });

  const { data: pendingPayments, isLoading } = useQuery({
    queryKey: ["pending-payments", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return [];
      
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          driver_payout,
          status,
          created_at,
          jobs:job_id (
            job_number,
            services:service_id (name)
          )
        `)
        .eq("driver_id", driverRecord.id)
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!driverRecord?.id && open,
  });

  const totalPending = pendingPayments?.reduce((sum, p) => {
    return sum + (p.driver_payout || p.amount * 0.8);
  }, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pending Payments</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">Total Pending</p>
          <p className="text-2xl font-bold text-primary">R{Math.round(totalPending).toLocaleString()}</p>
        </div>

        <div className="space-y-3 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !pendingPayments || pendingPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending payments</p>
          ) : (
            pendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-xl border border-border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">
                    {(payment.jobs as any)?.services?.name || "Service"}
                  </h4>
                  <span className="text-primary font-semibold">
                    R{Math.round(payment.driver_payout || payment.amount * 0.8)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(payment.jobs as any)?.job_number || "Job"}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {payment.created_at 
                        ? formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })
                        : "N/A"
                      }
                    </span>
                  </div>
                  <StatusBadge variant={payment.status === "processing" ? "warning" : "pending"}>
                    {payment.status === "processing" ? "Processing" : "Pending"}
                  </StatusBadge>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
