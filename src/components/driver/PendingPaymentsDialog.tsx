import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Clock } from "lucide-react";

interface PendingPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockPendingPayments = [
  { id: 1, service: "Tyre Change", customer: "Peter K.", amount: "R320", date: "Today, 3:45 PM", status: "processing" },
  { id: 2, service: "Jump Start", customer: "Anna M.", amount: "R200", date: "Today, 1:20 PM", status: "processing" },
  { id: 3, service: "Fuel Delivery", customer: "James L.", amount: "R180", date: "Yesterday", status: "pending" },
  { id: 4, service: "Towing", customer: "Mary S.", amount: "R850", date: "Yesterday", status: "pending" },
  { id: 5, service: "Battery", customer: "Tom R.", amount: "R550", date: "Dec 12", status: "pending" },
];

export const PendingPaymentsDialog = ({ open, onOpenChange }: PendingPaymentsDialogProps) => {
  const totalPending = mockPendingPayments.reduce((sum, p) => {
    const amount = parseInt(p.amount.replace("R", ""));
    return sum + amount;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pending Payments</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">Total Pending</p>
          <p className="text-2xl font-bold text-primary">R{totalPending.toLocaleString()}</p>
        </div>

        <div className="space-y-3 mt-4">
          {mockPendingPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending payments</p>
          ) : (
            mockPendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-xl border border-border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{payment.service}</h4>
                  <span className="text-primary font-semibold">{payment.amount}</span>
                </div>
                <p className="text-sm text-muted-foreground">{payment.customer}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{payment.date}</span>
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
