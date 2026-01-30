import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export type CallStatus =
  | "idle"
  | "initiating"
  | "ringing"
  | "in_progress"
  | "completed"
  | "failed";

interface UseSecureCallingOptions {
  jobId: string | null;
  onCallStatusChange?: (status: CallStatus) => void;
}

export const useSecureCalling = ({
  jobId,
  onCallStatusChange,
}: UseSecureCallingOptions) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callId, setCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    (status: CallStatus) => {
      setCallStatus(status);
      onCallStatusChange?.(status);
    },
    [onCallStatusChange]
  );

  // Initiate a VoIP call through the secure endpoint
  const initiateCall = useCallback(
    async (receiverId: string, receiverType: "customer" | "driver") => {
      if (!jobId || !user) {
        setError("Unable to initiate call");
        return { success: false, error: "Invalid session" };
      }

      updateStatus("initiating");
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "secure-call",
          {
            body: {
              action: "initiate_call",
              jobId,
              receiverId,
              receiverType,
            },
          }
        );

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        if (data?.success) {
          setCallId(data.callId);
          updateStatus("ringing");

          toast({
            title: "Call initiated",
            description: data.message || "Connecting you now...",
          });

          return { success: true, callId: data.callId };
        }

        throw new Error("Unknown error");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to initiate call";
        setError(message);
        updateStatus("failed");

        toast({
          title: "Call failed",
          description: message,
          variant: "destructive",
        });

        return { success: false, error: message };
      }
    },
    [jobId, user, updateStatus, toast]
  );

  // Use native phone dialer as fallback
  const initiateCarrierCall = useCallback(
    (phoneNumber: string) => {
      window.location.href = `tel:${phoneNumber}`;

      toast({
        title: "Opening phone",
        description: "Using your phone's dialer...",
      });
    },
    [toast]
  );

  // Reset call state
  const resetCall = useCallback(() => {
    setCallStatus("idle");
    setCallId(null);
    setError(null);
  }, []);

  return {
    callStatus,
    callId,
    error,
    isCallActive: callStatus === "initiating" || callStatus === "ringing" || callStatus === "in_progress",
    initiateCall,
    initiateCarrierCall,
    resetCall,
  };
};
