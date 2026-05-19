// Internal helper: send a WhatsApp status update for a job.
// Called by payfast-webhook and by the frontend after job status changes.
// No-ops if the job did not originate from WhatsApp.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH = "https://graph.facebook.com/v20.0";

const STATUS_TEMPLATES: Record<string, (j: { job_number: string }) => string> = {
  accepted: (j) => `✅ A responder has been assigned to your request *${j.job_number}*. You'll get an update when they're on their way.`,
  dispatched: (j) => `🚗 Your responder is en route for *${j.job_number}*. Hang tight — we'll be there now-now.`,
  arrived: (j) => `📍 Your responder has arrived for *${j.job_number}*. Please look out for them.`,
  in_progress: (j) => `🔧 Work has started on *${j.job_number}*.`,
  completed: (j) => `🎉 Your request *${j.job_number}* is complete. Thank you for choosing Now-Now Assist!`,
  cancelled: (j) => `❌ Your request *${j.job_number}* has been cancelled.`,
  payment_received: (j) => `💳 Payment received for *${j.job_number}*. Dispatching a responder now.`,
};

async function sendWhatsApp(to: string, text: string) {
  const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  if (!PHONE_ID || !TOKEN) return null;
  const res = await fetch(`${GRAPH}/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/^\+/, ""),
      type: "text",
      text: { body: text.slice(0, 4096) },
    }),
  });
  const data = await res.json();
  if (!res.ok) console.error("WA send error", res.status, data);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { job_id, status, custom_message } = await req.json();
    if (!job_id || (!status && !custom_message)) {
      return new Response(JSON.stringify({ error: "job_id and status (or custom_message) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("id, job_number, source, wa_phone, customer_id")
      .eq("id", job_id)
      .maybeSingle();

    if (!job) {
      return new Response(JSON.stringify({ error: "job not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (job.source !== "whatsapp" || !job.wa_phone) {
      return new Response(JSON.stringify({ skipped: true, reason: "not a whatsapp job" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tpl = status ? STATUS_TEMPLATES[status] : null;
    const text = custom_message || (tpl ? tpl(job as { job_number: string }) : null);
    if (!text) {
      return new Response(JSON.stringify({ error: "no template for status" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendWhatsApp(job.wa_phone, text);
    await supabase.from("whatsapp_messages").insert({
      phone: job.wa_phone,
      profile_id: job.customer_id,
      job_id: job.id,
      direction: "out",
      body: text,
    });

    return new Response(JSON.stringify({ sent: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("whatsapp-notify error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
