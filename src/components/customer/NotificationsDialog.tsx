import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, CreditCard, Car, CheckCircle, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const demoNotifications = [
  {
    id: "1",
    type: "payment",
    title: "Payment Successful",
    message: "Your payment of R250.00 for Flat Tire Assistance was processed successfully.",
    time: "2 hours ago",
    icon: CreditCard,
    route: "/customer/history",
  },
  {
    id: "2",
    type: "assist",
    title: "Assist Completed",
    message: "Your vehicle battery jumpstart was completed. Rate your experience!",
    time: "Yesterday",
    icon: CheckCircle,
    route: "/customer/history",
  },
  {
    id: "3",
    type: "assist",
    title: "Driver En Route",
    message: "John M. is on the way to assist with your flat tire. ETA: 15 mins",
    time: "2 days ago",
    icon: Car,
    route: "/customer/tracking",
  },
  {
    id: "4",
    type: "payment",
    title: "Payment Received",
    message: "Your payment of R180.00 for Battery Jumpstart has been confirmed.",
    time: "3 days ago",
    icon: CreditCard,
    route: "/customer/history",
  },
  {
    id: "5",
    type: "assist",
    title: "Service Request Accepted",
    message: "A driver has accepted your request for fuel delivery.",
    time: "1 week ago",
    icon: CheckCircle,
    route: "/customer/tracking",
  },
];

export const NotificationsDialog = ({ open, onOpenChange }: NotificationsDialogProps) => {
  const navigate = useNavigate();

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
          <div className="space-y-3">
            {demoNotifications.map((notification) => (
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
