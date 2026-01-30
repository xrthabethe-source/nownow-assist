import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export type AbuseReportType =
  | "harassment"
  | "inappropriate_content"
  | "spam"
  | "threatening"
  | "fraud"
  | "other";

interface ReportAbuseParams {
  jobId?: string;
  reportedId: string;
  reportedType: "customer" | "driver";
  reportType: AbuseReportType;
  description?: string;
  blockUser?: boolean;
}

export const useReportAbuse = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitReport = useCallback(
    async (params: ReportAbuseParams) => {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to report abuse",
          variant: "destructive",
        });
        return { success: false, error: "Not authenticated" };
      }

      setSubmitting(true);

      try {
        const { data, error } = await supabase.functions.invoke("report-abuse", {
          body: {
            action: "report",
            ...params,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setSubmitted(true);

        toast({
          title: "Report submitted",
          description: data.message || "Our safety team will review your report.",
        });

        return { success: true, reportId: data.reportId };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to submit report";

        toast({
          title: "Failed to submit report",
          description: message,
          variant: "destructive",
        });

        return { success: false, error: message };
      } finally {
        setSubmitting(false);
      }
    },
    [user, toast]
  );

  const reset = useCallback(() => {
    setSubmitted(false);
  }, []);

  return {
    submitting,
    submitted,
    submitReport,
    reset,
  };
};
