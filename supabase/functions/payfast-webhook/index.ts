import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Payfast sends ITN (Instant Transaction Notification) as form-encoded POST
    const formData = await req.text();
    const params = new URLSearchParams(formData);

    const paymentStatus = params.get("payment_status");
    const paymentId = params.get("m_payment_id"); // our payment/job ID
    const pfPaymentId = params.get("pf_payment_id"); // Payfast's transaction ID
    const amountGross = params.get("amount_gross");
    const amountFee = params.get("amount_fee");
    const customStr1 = params.get("custom_str1"); // user_id
    const customStr2 = params.get("custom_str2"); // job_id

    console.log("Payfast ITN received:", {
      paymentStatus,
      paymentId,
      pfPaymentId,
      amountGross,
      customStr1,
      customStr2,
    });

    // Validate required fields
    if (!paymentStatus || !paymentId) {
      console.error("Missing required ITN fields");
      return new Response("Missing fields", { status: 400 });
    }

    const jobId = customStr2 || paymentId;
    const userId = customStr1;
    const amount = parseFloat(amountGross || "0");
    const fee = parseFloat(amountFee || "0");

    if (paymentStatus === "COMPLETE") {
      // Payment successful - create payment record
      const platformFee = fee > 0 ? fee : amount * 0.05; // Use Payfast fee or 5% default
      const driverPayout = amount - platformFee;

      // Insert payment record
      const { error: paymentError } = await supabase.from("payments").insert({
        job_id: jobId !== "" ? jobId : null,
        customer_id: userId || null,
        amount: amount,
        platform_fee: platformFee,
        driver_payout: driverPayout,
        status: "completed",
        payment_method: "payfast",
        transaction_id: pfPaymentId,
      });

      if (paymentError) {
        console.error("Error inserting payment:", paymentError);
      }

      // Update job status to dispatched if job exists
      if (jobId && jobId !== "") {
        const { error: jobError } = await supabase
          .from("jobs")
          .update({ status: "dispatched", dispatched_at: new Date().toISOString() })
          .eq("id", jobId)
          .eq("status", "pending");

        if (jobError) {
          console.error("Error updating job:", jobError);
        }
      }

      console.log("Payment completed successfully:", pfPaymentId);

    } else if (paymentStatus === "FAILED") {
      // Payment failed
      const { error: paymentError } = await supabase.from("payments").insert({
        job_id: jobId !== "" ? jobId : null,
        customer_id: userId || null,
        amount: amount,
        status: "failed",
        payment_method: "payfast",
        transaction_id: pfPaymentId,
        failure_reason: "Payment failed at Payfast",
      });

      if (paymentError) {
        console.error("Error inserting failed payment:", paymentError);
      }

    } else if (paymentStatus === "CANCELLED") {
      // Payment cancelled
      if (jobId && jobId !== "") {
        const { error } = await supabase
          .from("jobs")
          .update({ 
            status: "cancelled", 
            cancelled_at: new Date().toISOString(),
            cancellation_reason: "Payment cancelled by customer" 
          })
          .eq("id", jobId);

        if (error) {
          console.error("Error cancelling job:", error);
        }
      }
    }

    // Payfast expects a 200 OK response
    return new Response("OK", { status: 200 });

  } catch (error: unknown) {
    console.error("Payfast webhook error:", error);
    return new Response("Server error", { status: 500 });
  }
});
