// TEMPORARY: Admin-only PayFast live R5 test. Safe to delete after go-live verification.
// To remove: delete this file and remove its route/import from src/App.tsx.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { initiatePayfastPayment, redirectToPayfast } from "@/lib/payfast";
import { toast } from "@/hooks/use-toast";

export default function AdminPayfastTest() {
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const res = await initiatePayfastPayment({
        amount: 5,
        itemName: "ITN Live Test (R5)",
        // no jobId — keeps it isolated from real jobs
      });
      toast({ title: "Redirecting to PayFast…", description: res.sandbox ? "Sandbox mode" : "LIVE mode" });
      redirectToPayfast(res.payment_url, res.payment_data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start test";
      toast({ title: "Test failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="max-w-md w-full p-6 space-y-4">
        <h1 className="text-xl font-semibold text-foreground">PayFast Live ITN Test</h1>
        <p className="text-sm text-muted-foreground">
          Triggers a R5.00 live PayFast payment (no job linked). After paying,
          check <span className="font-mono">/admin/payments</span> and the
          <span className="font-mono"> payfast-webhook</span> logs for
          <span className="font-mono"> sigOk / merchantOk / ipOk / serverOk = true</span>.
        </p>
        <Button onClick={runTest} disabled={loading} className="w-full">
          {loading ? "Starting…" : "Pay R5 (Live Test)"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Temporary page. Remove the route once verification is complete.
        </p>
      </Card>
    </div>
  );
}
