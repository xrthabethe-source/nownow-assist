import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { openSupportWhatsApp } from "@/lib/contact";

/**
 * Public PayFast return/cancel landing page.
 * Used as return_url / cancel_url so PayFast users (often unauthenticated,
 * coming from WhatsApp) don't hit a 404 or get bounced through /auth.
 *
 * Reads: ?status=success|cancelled & job={jobId}
 */
const PaymentResult = () => {
  const [params] = useSearchParams();
  // Accept both ?status= and legacy ?payment=
  const status = (params.get("status") || params.get("payment") || "").toLowerCase();
  const jobId = params.get("job") || params.get("job_id") || "";
  const isSuccess = status === "success";
  const isCancelled = status === "cancelled" || status === "cancel";

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
              ) : (
                <XCircle className="h-14 w-14 mx-auto text-destructive" />
              )}

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                {isSuccess && (
                  <p className="text-muted-foreground">
                    Payment received. Your request has been submitted. We'll
                    contact you shortly.
                  </p>
                )}
                {isCancelled && (
                  <p className="text-muted-foreground">
                    Payment cancelled. You can try again or contact us on
                    WhatsApp.
                  </p>
                )}
                {!isSuccess && !isCancelled && (
                  <p className="text-muted-foreground">
                    We couldn't read your payment status. If you completed
                    payment, please contact support on WhatsApp.
                  </p>
                )}
              </div>

              {jobId && (
                <div className="rounded-lg bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground">
                  Reference: <span className="font-mono">{jobId.slice(0, 8)}</span>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <Button className="w-full" onClick={() => openSupportWhatsApp()}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp +27 65 663 6685
                </Button>
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

export default PaymentResult;
