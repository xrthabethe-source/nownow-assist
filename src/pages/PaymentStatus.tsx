import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { supabase } from "@/integrations/supabase/client";
import { openSupportWhatsApp } from "@/lib/contact";

/**
 * Public PayFast return/cancel landing page.
 *
 * Used as return_url / cancel_url for the live PayFast checkout because most
 * paying customers come from WhatsApp and are NOT authenticated — sending them
 * to /customer/home would bounce through /auth and feel like a broken flow.
 *
 * Reads: ?payment=success|cancelled & job={jobId}
 */
const PaymentStatus = () => {
  const [params] = useSearchParams();
  const status = (params.get("payment") || "").toLowerCase();
  const jobId = params.get("job") || params.get("job_id") || "";
  const isSuccess = status === "success";
  const isCancelled = status === "cancelled" || status === "cancel";

  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [loadingJob, setLoadingJob] = useState<boolean>(Boolean(jobId));

  useEffect(() => {
    let active = true;
    if (!jobId) return;
    (async () => {
      const { data } = await supabase
        .from("jobs")
        .select("status")
        .eq("id", jobId)
        .maybeSingle();
      if (!active) return;
      setJobStatus(data?.status ?? null);
      setLoadingJob(false);
    })();
    return () => {
      active = false;
    };
  }, [jobId]);

  const title = useMemo(() => {
    if (isSuccess) return "Payment received";
    if (isCancelled) return "Payment cancelled";
    return "Payment status";
  }, [isSuccess, isCancelled]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container py-4 flex items-center justify-center">
        <Logo size="lg" />
      </header>

      <main className="flex-1 container flex items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-border bg-card/95 backdrop-blur">
            <CardContent className="p-6 space-y-5 text-center">
              {isSuccess ? (
                <CheckCircle2 className="h-14 w-14 mx-auto text-secondary" />
              ) : isCancelled ? (
                <XCircle className="h-14 w-14 mx-auto text-destructive" />
              ) : (
                <Loader2 className="h-14 w-14 mx-auto text-muted-foreground animate-spin" />
              )}

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                {isSuccess && (
                  <p className="text-muted-foreground">
                    Thanks — your payment was received. We're dispatching your
                    responder now. You'll get a WhatsApp message with their
                    details and ETA shortly.
                  </p>
                )}
                {isCancelled && (
                  <p className="text-muted-foreground">
                    Your payment was cancelled and no money was taken. Your
                    request has not been submitted. You can try again on
                    WhatsApp.
                  </p>
                )}
                {!isSuccess && !isCancelled && (
                  <p className="text-muted-foreground">
                    We couldn't read your payment status. If you completed
                    payment, please give us a moment or contact support.
                  </p>
                )}
              </div>

              {jobId && (
                <div className="rounded-lg bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground">
                  <div>Reference: <span className="font-mono">{jobId.slice(0, 8)}</span></div>
                  {loadingJob ? (
                    <div className="mt-1">Checking job status…</div>
                  ) : jobStatus ? (
                    <div className="mt-1">Status: <span className="font-medium text-foreground">{jobStatus}</span></div>
                  ) : null}
                </div>
              )}

              <div className="space-y-2 pt-1">
                {isSuccess ? (
                  <Button
                    className="w-full"
                    onClick={() => openSupportWhatsApp()}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Open WhatsApp chat
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => openSupportWhatsApp()}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Retry on WhatsApp
                  </Button>
                )}
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/">
                    Back to home
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default PaymentStatus;
