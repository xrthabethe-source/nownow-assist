import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, CreditCard, ExternalLink } from "lucide-react";

interface PaymentMethodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentMethodsDialog = ({ open, onOpenChange }: PaymentMethodsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">Secure Payments via PayFast</p>
              <p className="mt-1 text-sm text-muted-foreground">
                All payments are processed securely through PayFast's hosted payment page. 
                NowNow Assist never collects, stores, or has access to your card details.
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <h4 className="font-medium text-foreground">How it works</h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                <span>Confirm your service request</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                <span>You'll be redirected to PayFast's secure page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                <span>Enter your card details on PayFast (card number, CVV, expiry)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">4</span>
                <span>Once payment is confirmed, your responder is dispatched</span>
              </li>
            </ol>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            <span>PayFast is a trusted South African payment gateway</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
