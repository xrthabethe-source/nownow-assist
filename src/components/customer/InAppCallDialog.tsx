import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Phone, Wifi, Signal, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InAppCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverName: string;
  driverPhone: string;
}

export const InAppCallDialog = ({
  open,
  onOpenChange,
  driverName,
  driverPhone,
}: InAppCallDialogProps) => {
  const { toast } = useToast();
  const [calling, setCalling] = useState(false);

  const handleVoIPCall = async () => {
    setCalling(true);
    try {
      const { data, error } = await supabase.functions.invoke("twilio-token", {
        body: { action: "call", to: driverPhone },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Call initiated",
          description: `Connecting you to ${driverName}...`,
        });
        onOpenChange(false);
      } else {
        throw new Error(data?.error || "Failed to initiate call");
      }
    } catch (error: any) {
      console.error("VoIP call error:", error);
      toast({
        title: "Call failed",
        description: error.message || "Unable to connect via internet. Try using your carrier.",
        variant: "destructive",
      });
    } finally {
      setCalling(false);
    }
  };

  const handleCarrierCall = () => {
    window.location.href = `tel:${driverPhone}`;
    toast({
      title: "Opening phone",
      description: `Calling ${driverName}...`,
    });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            Call {driverName}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Choose how you'd like to connect
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          {/* VoIP Call Option */}
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex items-start gap-4 text-left"
            onClick={handleVoIPCall}
            disabled={calling}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              {calling ? (
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              ) : (
                <Wifi className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Call via Internet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Free call using WiFi or data. Recommended when you have good connection.
              </p>
            </div>
          </Button>

          {/* Carrier Call Option */}
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex items-start gap-4 text-left"
            onClick={handleCarrierCall}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/10">
              <Signal className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Call via Carrier</p>
              <p className="text-xs text-muted-foreground mt-1">
                Uses your phone plan. Standard call rates may apply.
              </p>
            </div>
          </Button>
        </div>

        <AlertDialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
