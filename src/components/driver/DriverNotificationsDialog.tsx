import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  MessageSquare, 
  CreditCard, 
  TrendingUp,
  CheckCircle,
  Clock,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface DriverNotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type NotificationType = "all" | "earnings" | "messages" | "payments";

interface Notification {
  id: string;
  type: "earning" | "message" | "payment";
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  route?: string;
  amount?: string;
}

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "earning":
      return <TrendingUp className="h-5 w-5 text-accent" />;
    case "message":
      return <MessageSquare className="h-5 w-5 text-primary" />;
    case "payment":
      return <CreditCard className="h-5 w-5 text-success" />;
  }
};

const getNotificationBadge = (type: Notification["type"]) => {
  switch (type) {
    case "earning":
      return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">Earning</Badge>;
    case "message":
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Message</Badge>;
    case "payment":
      return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Payment</Badge>;
  }
};

export const DriverNotificationsDialog = ({ open, onOpenChange }: DriverNotificationsDialogProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NotificationType>("all");
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

  // Fetch completed jobs as earnings notifications
  const { data: recentJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["driver-recent-jobs", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return [];
      const { data } = await supabase
        .from("jobs")
        .select(`
          id,
          job_number,
          completed_at,
          final_price,
          estimated_price,
          services:service_id (name)
        `)
        .eq("driver_id", driverRecord.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!driverRecord?.id && open,
  });

  // Fetch payments as payment notifications
  const { data: recentPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["driver-recent-payments", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return [];
      const { data } = await supabase
        .from("payments")
        .select("id, amount, driver_payout, status, created_at")
        .eq("driver_id", driverRecord.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!driverRecord?.id && open,
  });

  // Fetch admin messages
  const { data: adminMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ["driver-admin-messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("messages")
        .select("id, subject, content, created_at, is_read")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  // Transform data into notifications
  const notifications: Notification[] = [
    ...(recentJobs?.map((job) => ({
      id: `earning-${job.id}`,
      type: "earning" as const,
      title: "Job Completed",
      description: `You earned R${Math.round(((job.final_price || job.estimated_price || 0) * 0.8))} for ${(job.services as any)?.name || "service"}`,
      time: job.completed_at ? formatDistanceToNow(new Date(job.completed_at), { addSuffix: true }) : "Recently",
      isRead: true,
      route: "/driver/earnings",
      amount: `R${Math.round(((job.final_price || job.estimated_price || 0) * 0.8))}`,
    })) || []),
    ...(recentPayments?.map((payment) => ({
      id: `payment-${payment.id}`,
      type: "payment" as const,
      title: payment.status === "completed" ? "Payout Processed" : "Payment Pending",
      description: `R${Math.round(payment.driver_payout || payment.amount * 0.8)} ${payment.status === "completed" ? "transferred to your account" : "pending clearance"}`,
      time: payment.created_at ? formatDistanceToNow(new Date(payment.created_at), { addSuffix: true }) : "Recently",
      isRead: true,
      route: "/driver/earnings",
      amount: `R${Math.round(payment.driver_payout || payment.amount * 0.8)}`,
    })) || []),
    ...(adminMessages?.map((msg) => ({
      id: `message-${msg.id}`,
      type: "message" as const,
      title: msg.subject || "Message from Admin",
      description: msg.content?.substring(0, 100) || "",
      time: msg.created_at ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : "Recently",
      isRead: msg.is_read,
      route: "/driver/profile",
    })) || []),
  ].sort((a, b) => {
    // Sort by most recent - we just use the order they came in since they're already sorted
    return 0;
  });

  const isLoading = jobsLoading || paymentsLoading || messagesLoading;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "earnings") return n.type === "earning";
    if (activeTab === "messages") return n.type === "message";
    if (activeTab === "payments") return n.type === "payment";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    if (notification.route) {
      onOpenChange(false);
      navigate(notification.route);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 bg-card border-border">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NotificationType)} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 px-4">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-accent"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="earnings"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-accent"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Earnings
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-accent"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Messages
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-accent"
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mb-4 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50",
                        !notification.isRead && "bg-accent/5"
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getNotificationBadge(notification.type)}
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-accent" />
                          )}
                        </div>
                        <p className="font-medium text-foreground truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {notification.time}
                          </span>
                          {notification.amount && (
                            <span className="text-sm font-semibold text-accent">
                              {notification.amount}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate("/driver/earnings");
            }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            View All Earnings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
