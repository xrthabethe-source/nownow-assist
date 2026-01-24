import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wallet, CreditCard, CheckCircle } from "lucide-react";

interface RequestPayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: string;
}

export const RequestPayoutDialog = ({ open, onOpenChange, availableBalance }: RequestPayoutDialogProps) => {
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const availableNum = parseInt(availableBalance.replace(/[R,]/g, ""));

  const handleSubmit = async () => {
    const requestedAmount = parseInt(amount);
    
    if (!amount || requestedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (requestedAmount > availableNum) {
      toast.error("Amount exceeds available balance");
      return;
    }

    if (requestedAmount < 50) {
      toast.error("Minimum payout is R50");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    setTimeout(() => {
      setIsSuccess(false);
      setAmount("");
      onOpenChange(false);
      toast.success("Payout request submitted successfully");
    }, 2000);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(isOpen);
      if (!isOpen) {
        setAmount("");
        setIsSuccess(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Request Payout
          </DialogTitle>
          <DialogDescription>
            Transfer your earnings to your bank account
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <p className="text-lg font-semibold text-foreground">Payout Requested!</p>
            <p className="text-sm text-muted-foreground text-center">
              R{parseInt(amount).toLocaleString()} will be transferred within 2-3 business days
            </p>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold text-success">{availableBalance}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payout Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  min={50}
                  max={availableNum}
                />
              </div>
              <p className="text-xs text-muted-foreground">Minimum payout: R50</p>
            </div>

            <div className="p-4 rounded-xl border border-border space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Bank Account</span>
              </div>
              <p className="text-sm text-muted-foreground">FNB •••• 4521</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="amber"
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting || !amount}
              >
                {isSubmitting ? "Processing..." : "Request Payout"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
