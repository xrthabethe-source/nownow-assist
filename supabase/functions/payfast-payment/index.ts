import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Payfast URLs
const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";
const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";

async function generateSignature(data: Record<string, string>, passphrase: string): Promise<string> {
  // Build param string: alphabetically sorted, non-empty values, URL-encoded with + for spaces
  const paramString = Object.keys(data)
    .sort()
    .filter(key => data[key] !== undefined && data[key] !== "")
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
    .join("&");

  const withPassphrase = `${paramString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`;

  // Use Deno's built-in crypto for reliable MD5
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(withPassphrase);
  const hashBuffer = await crypto.subtle.digest("MD5", dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MERCHANT_ID = Deno.env.get("PAYFAST_MERCHANT_ID");
    const MERCHANT_KEY = Deno.env.get("PAYFAST_MERCHANT_KEY");
    const PASSPHRASE = Deno.env.get("PAYFAST_PASSPHRASE");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MERCHANT_ID) throw new Error("PAYFAST_MERCHANT_ID is not configured");
    if (!MERCHANT_KEY) throw new Error("PAYFAST_MERCHANT_KEY is not configured");
    if (!PASSPHRASE) throw new Error("PAYFAST_PASSPHRASE is not configured");
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const userId = user.id;
    const userEmail = user.email || "";

    const { amount, item_name, job_id, return_url, cancel_url } = await req.json();

    if (!amount || !item_name) {
      return new Response(JSON.stringify({ error: "amount and item_name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Webhook URL for PayFast ITN
    const notifyUrl = `${SUPABASE_URL}/functions/v1/payfast-webhook`;

    // Determine sandbox vs live
    const isSandbox = MERCHANT_ID === "10000100";
    const payfastUrl = isSandbox ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL;

    // Build payment data — order doesn't matter for signature (we sort alphabetically)
    // but we exclude signature from the data used to generate it
    const paymentData: Record<string, string> = {
      merchant_id: MERCHANT_ID,
      merchant_key: MERCHANT_KEY,
      return_url: return_url || `https://nownow-assist.lovable.app/customer/home?payment=success`,
      cancel_url: cancel_url || `https://nownow-assist.lovable.app/customer/home?payment=cancelled`,
      notify_url: notifyUrl,
      email_address: userEmail,
      m_payment_id: job_id || crypto.randomUUID(),
      amount: Number(amount).toFixed(2),
      item_name: item_name,
      item_description: `NowNow Assist - ${item_name}`,
      custom_str1: userId,
      custom_str2: job_id || "",
    };

    // Generate signature using proper MD5
    const signature = await generateSignature(paymentData, PASSPHRASE);
    paymentData.signature = signature;

    console.log("PayFast payment initiated:", { 
      userId, amount, item_name, job_id, sandbox: isSandbox, 
      payfastUrl, signature: signature.substring(0, 8) + "..." 
    });

    return new Response(JSON.stringify({
      payment_url: payfastUrl,
      payment_data: paymentData,
      sandbox: isSandbox,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Payfast payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
