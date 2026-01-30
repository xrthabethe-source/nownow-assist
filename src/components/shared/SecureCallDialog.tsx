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
import { Wifi, Signal, Loader2, PhoneOff } from "lucide-react";
import { useSecureCalling } from "@/hooks/useSecureCalling";

interface SecureCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  receiverId: string;
  receiverType: "customer" | "driver";
  receiverName: string;
  receiverPhone?: string; // Only used for carrier fallback
}

export const SecureCallDialog = ({
  open,
  onOpenChange,
  jobId,
  receiverId,
  receiverType,
  receiverName,
  receiverPhone,
}: SecureCallDialogProps) => {
  const {
    callStatus,
    isCallActive,
    initiateCall,
    initiateCarrierCall,
    resetCall,
  } = useSecureCalling({ jobId });

  const handleVoIPCall = async () => {
    await initiateCall(receiverId, receiverType);
  };

  const handleCarrierCall = () => {
    if (receiverPhone) {
      initiateCarrierCall(receiverPhone);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (!isCallActive) {
      onOpenChange(false);
      resetCall();
    }
  };

  // Show calling state
  if (isCallActive) {
    return (
      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent className="max-w-sm">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-pulse">
              <Wifi className="h-10 w-10 text-primary" />
            </div>
            <AlertDialogTitle className="mb-2">
              {callStatus === "initiating" ? "Connecting..." : "Ringing..."}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {callStatus === "initiating"
                ? "Setting up secure connection..."
                : `Calling ${receiverName}. You'll receive the call on your phone.`}
            </AlertDialogDescription>
            <Button
              variant="destructive"
              className="mt-6"
              onClick={() => {
                resetCall();
                onOpenChange(false);
              }}
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            Call {receiverName}
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
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Wifi className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Call via Internet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Secure, free call using WiFi or data. Your number stays private.
              </p>
            </div>
          </Button>

          {/* Carrier Call Option - only show if phone is available */}
          {receiverPhone && (
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
                  Uses your phone plan. Standard rates may apply.
                </p>
              </div>
            </Button>
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="ghost" onClick={handleClose} className="w-full">
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
