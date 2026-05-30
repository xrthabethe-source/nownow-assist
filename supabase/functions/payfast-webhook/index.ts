import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Md5 } from "https://deno.land/std@0.119.0/hash/md5.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// PayFast servers (per https://developers.payfast.co.za/documentation/#confirm-payment).
// Resolved at runtime; static fallback used if DNS fails.
const PAYFAST_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
];
const PAYFAST_STATIC_IPS = new Set<string>([
  // Documented PayFast notify IPs (kept as fallback; DNS check is primary)
  "197.97.145.144", "197.97.145.145", "197.97.145.146", "197.97.145.147",
  "41.74.179.194", "41.74.179.195", "41.74.179.196", "41.74.179.197",
  "41.74.179.200", "41.74.179.201", "41.74.179.203", "41.74.179.204",
  "41.74.179.210", "41.74.179.211",
]);

function pfEncode(v: string): string {
  return encodeURIComponent(v.trim()).replace(/%20/g, "+");
}

function md5Hex(input: string): string {
  const md5 = new Md5();
  md5.update(input);
  return md5.toString();
}

// 1) Re-hash the signature using the same field order PayFast posted, excluding `signature`.
function verifySignature(rawBody: string, passphrase: string, postedSignature: string): boolean {
  const pairs: string[] = [];
  for (const pair of rawBody.split("&")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const key = decodeURIComponent(pair.slice(0, eq).replace(/\+/g, " "));
    if (key === "signature") continue;
    const valRaw = pair.slice(eq + 1);
    const val = decodeURIComponent(valRaw.replace(/\+/g, " "));
    pairs.push(`${key}=${pfEncode(val)}`);
  }
  const base = pairs.join("&");
  const withPass = passphrase && passphrase.length > 0
    ? `${base}&passphrase=${pfEncode(passphrase)}`
    : base;
  const computed = md5Hex(withPass);
  return computed.toLowerCase() === (postedSignature || "").toLowerCase();
}

// 2) Source-IP validation against resolved PayFast hosts (with static fallback).
async function isValidPayfastSourceIp(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const resolved = new Set<string>(PAYFAST_STATIC_IPS);
  try {
    const results = await Promise.allSettled(
      PAYFAST_HOSTS.map((h) => Deno.resolveDns(h, "A"))
    );
    for (const r of results) {
      if (r.status === "fulfilled") r.value.forEach((a) => resolved.add(a));
    }
  } catch (e) {
    console.warn("PayFast DNS resolution failed, using static list", e);
  }
  return resolved.has(ip);
}

function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip");
}

// 3) Server-to-server validation: POST the raw ITN back to PayFast.
async function validateWithPayfast(rawBody: string, isSandbox: boolean): Promise<boolean> {
  const url = isSandbox
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    const text = (await res.text()).trim();
    return text.split(/\r?\n/)[0].trim().toUpperCase() === "VALID";
  } catch (e) {
    console.error("PayFast server validation request failed", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const PASSPHRASE = Deno.env.get("PAYFAST_PASSPHRASE") || "";
    const MERCHANT_ID = Deno.env.get("PAYFAST_MERCHANT_ID") || "";
    const ITN_STRICT = (Deno.env.get("PAYFAST_ITN_STRICT") || "true").toLowerCase() !== "false";

    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Payfast sends ITN (Instant Transaction Notification) as form-encoded POST
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    const isSandbox = MERCHANT_ID === "10000100";

    // ---- ITN security checks (additive) ----
    const postedSignature = params.get("signature") || "";
    const postedMerchantId = params.get("merchant_id") || "";
    const sourceIp = getClientIp(req);

    const sigOk = PASSPHRASE
      ? verifySignature(rawBody, PASSPHRASE, postedSignature)
      : !!postedSignature; // if no passphrase configured, skip rehash but still require signature field
    const merchantOk = MERCHANT_ID ? postedMerchantId === MERCHANT_ID : true;
    const ipOk = await isValidPayfastSourceIp(sourceIp);
    const serverOk = await validateWithPayfast(rawBody, isSandbox);

    console.log("PayFast ITN security checks:", {
      sigOk, merchantOk, ipOk, serverOk, sourceIp, isSandbox, strict: ITN_STRICT,
    });

    if (!sigOk || !merchantOk || !serverOk || (ITN_STRICT && !ipOk)) {
      console.error("PayFast ITN rejected", { sigOk, merchantOk, ipOk, serverOk });
      // Return 200 so PayFast does not endlessly retry a forged request, but do not process.
      return new Response("Invalid ITN", { status: 200 });
    }
    // ---- end ITN security checks ----


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

        // Fire WhatsApp notifications (no-op if not a whatsapp job)
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-notify`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ job_id: jobId, status: "payment_received" }),
          });
          await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-notify`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ job_id: jobId, status: "dispatched" }),
          });
        } catch (e) {
          console.error("whatsapp-notify failed", e);
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
