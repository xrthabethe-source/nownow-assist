import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, CreditCard, Camera, ScanLine } from "lucide-react";
import { usePaymentMethods, PaymentMethodInput } from "@/hooks/usePaymentMethods";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentMethodsDialog = ({ open, onOpenChange }: PaymentMethodsDialogProps) => {
  const { paymentMethods, loading, addPaymentMethod, deletePaymentMethod } = usePaymentMethods();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryMonth: "",
    expiryYear: "",
    cardBrand: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const detectCardBrand = (number: string): string => {
    const cleaned = number.replace(/\s/g, "");
    if (/^4/.test(cleaned)) return "Visa";
    if (/^5[1-5]/.test(cleaned)) return "Mastercard";
    if (/^3[47]/.test(cleaned)) return "Amex";
    if (/^6(?:011|5)/.test(cleaned)) return "Discover";
    return "Card";
  };

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }
    return parts.join(" ");
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    const brand = detectCardBrand(formatted);
    setFormData({ ...formData, cardNumber: formatted, cardBrand: brand });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cardDigits = formData.cardNumber.replace(/\s/g, "");
    if (cardDigits.length < 13 || !formData.expiryMonth || !formData.expiryYear) {
      toast({
        title: "Invalid card details",
        description: "Please enter valid card information",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const paymentMethodData: PaymentMethodInput = {
      card_last_four: cardDigits.slice(-4),
      card_brand: formData.cardBrand,
      cardholder_name: formData.cardholderName || null,
      expiry_month: parseInt(formData.expiryMonth),
      expiry_year: parseInt(formData.expiryYear),
    };

    const { error } = await addPaymentMethod(paymentMethodData);
    setSubmitting(false);

    if (!error) {
      setFormData({
        cardNumber: "",
        cardholderName: "",
        expiryMonth: "",
        expiryYear: "",
        cardBrand: "",
      });
      setShowAddForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deletePaymentMethod(id);
  };

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowScanner(true);
      toast({
        title: "Camera ready",
        description: "Position your card in the frame. Card scanning is simulated - please enter details manually.",
      });
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to scan your card, or enter details manually.",
        variant: "destructive",
      });
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowScanner(false);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      stopScanner();
      setShowAddForm(false);
    }
    onOpenChange(open);
  };

  const getCardIcon = (brand: string | null) => {
    // In a real app, you'd use brand-specific icons
    return <CreditCard className="h-6 w-6" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Methods
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing payment methods */}
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : paymentMethods.length === 0 && !showAddForm ? (
            <div className="text-center py-6 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No payment methods saved yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getCardIcon(pm.card_brand)}
                    <div>
                      <p className="font-medium">
                        {pm.card_brand || "Card"} •••• {pm.card_last_four}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires {String(pm.expiry_month).padStart(2, "0")}/{pm.expiry_year}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(pm.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Scanner view */}
          {showScanner && (
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-primary rounded-lg w-[85%] h-[55%] opacity-70" />
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={() => {
                  stopScanner();
                  setShowAddForm(true);
                }}
              >
                Enter Manually
              </Button>
            </div>
          )}

          {/* Add payment method form */}
          {showAddForm && !showScanner ? (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number *</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    required
                  />
                  {formData.cardBrand && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {formData.cardBrand}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  placeholder="John Doe"
                  value={formData.cardholderName}
                  onChange={(e) =>
                    setFormData({ ...formData, cardholderName: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">Expiry Month *</Label>
                  <Input
                    id="expiryMonth"
                    placeholder="MM"
                    value={formData.expiryMonth}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                      if (parseInt(val) <= 12 || val.length < 2) {
                        setFormData({ ...formData, expiryMonth: val });
                      }
                    }}
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryYear">Expiry Year *</Label>
                  <Input
                    id="expiryYear"
                    placeholder="YYYY"
                    value={formData.expiryYear}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setFormData({ ...formData, expiryYear: val });
                    }}
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Card"}
                </Button>
              </div>
            </form>
          ) : !showScanner ? (
            <div className="space-y-2">
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Card Manually
              </Button>
              <Button
                onClick={startScanner}
                className="w-full"
                variant="secondary"
              >
                <ScanLine className="h-4 w-4 mr-2" />
                Scan Card
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
