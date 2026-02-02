import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, CreditCard, Car, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NotificationItem {
  id: string;
  type: "payment" | "assist" | "message";
  title: string;
  message: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}

export const NotificationsDialog = ({ open, onOpenChange }: NotificationsDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch recent jobs for this customer
  const { data: recentJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["customer-recent-jobs", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("jobs")
        .select(`
          id,
          job_number,
          status,
          completed_at,
          created_at,
          final_price,
          estimated_price,
          services:service_id (name)
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  // Fetch recent payments for this customer
  const { data: recentPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["customer-recent-payments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("payments")
        .select("id, amount, status, created_at")
        .eq("customer_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  const isLoading = jobsLoading || paymentsLoading;

  // Transform data into notifications
  const notifications: NotificationItem[] = [
    ...(recentPayments?.map((payment) => ({
      id: `payment-${payment.id}`,
      type: "payment" as const,
      title: "Payment Successful",
      message: `Your payment of R${payment.amount.toFixed(2)} was processed successfully.`,
      time: payment.created_at ? formatDistanceToNow(new Date(payment.created_at), { addSuffix: true }) : "Recently",
      icon: CreditCard,
      route: "/customer/history",
    })) || []),
    ...(recentJobs?.map((job) => ({
      id: `job-${job.id}`,
      type: "assist" as const,
      title: job.status === "completed" ? "Assist Completed" : 
             job.status === "in_progress" ? "Driver En Route" :
             job.status === "accepted" ? "Request Accepted" : "Service Request",
      message: job.status === "completed" 
        ? `Your ${(job.services as any)?.name || "service"} was completed. Rate your experience!`
        : job.status === "in_progress"
        ? `A driver is on the way for your ${(job.services as any)?.name || "service"}.`
        : `Your ${(job.services as any)?.name || "service"} request is being processed.`,
      time: job.completed_at 
        ? formatDistanceToNow(new Date(job.completed_at), { addSuffix: true })
        : job.created_at 
        ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
        : "Recently",
      icon: job.status === "completed" ? CheckCircle : Car,
      route: job.status === "completed" ? "/customer/history" : "/customer/tracking",
    })) || []),
  ];

  const handleNotificationClick = (route: string) => {
    onOpenChange(false);
    navigate(route);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm text-center mt-2">You'll see updates about your service requests here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.route)}
                  className="flex w-full gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50 text-left cursor-pointer"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <notification.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground/70">{notification.time}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
