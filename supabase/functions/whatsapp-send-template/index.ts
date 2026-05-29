// Send a WhatsApp template message via Meta Cloud API.
// Admin-only. Tokens never leave the backend.
//
// POST body: { to: "+27...", template?: string, language?: string, components?: any[] }
// - template defaults to "request_received"
// - language defaults to "en"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GRAPH = "https://graph.facebook.com/v20.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

  // Auth: require admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await authed.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: isAdmin } = await admin.rpc("has_role", {
    _user_id: claims.claims.sub,
    _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!PHONE_ID || !TOKEN) {
    console.error("WhatsApp credentials missing");
    return new Response(JSON.stringify({ error: "WhatsApp credentials not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    to?: string;
    template?: string;
    language?: string;
    components?: unknown[];
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const to = (body.to || "").trim();
  if (!/^\+?\d{8,15}$/.test(to)) {
    return new Response(JSON.stringify({ error: "Invalid 'to' phone number" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const template = body.template?.trim() || "request_received";
  const language = body.language?.trim() || "en";

  const wabaBody = {
    messaging_product: "whatsapp",
    to: to.replace(/^\+/, ""),
    type: "template",
    template: {
      name: template,
      language: { code: language },
      ...(body.components ? { components: body.components } : {}),
    },
  };

  let waResponse: unknown;
  let waStatus = 0;
  try {
    const res = await fetch(`${GRAPH}/${PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(wabaBody),
    });
    waStatus = res.status;
    waResponse = await res.json();
  } catch (e) {
    console.error("WhatsApp template send network error", e);
    return new Response(JSON.stringify({ error: "Network error contacting WhatsApp API", detail: String(e) }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (waStatus < 200 || waStatus >= 300) {
    console.error("WhatsApp template send failed", waStatus, waResponse);
    return new Response(JSON.stringify({ error: "WhatsApp API error", status: waStatus, detail: waResponse }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const wamid =
    (waResponse as { messages?: Array<{ id?: string }> })?.messages?.[0]?.id ?? null;

  // Log outbound
  const phoneE164 = to.startsWith("+") ? to : `+${to}`;
  await admin.from("whatsapp_messages").insert({
    phone: phoneE164,
    direction: "out",
    message_type: "template",
    body: `[template:${template}]`,
    payload: wabaBody,
    wa_message_id: wamid,
    status: "sent",
  });

  return new Response(JSON.stringify({ sent: true, wa_message_id: wamid, response: waResponse }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
