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

function mask(v: string | null | undefined, keep = 4): string {
  if (!v) return "(empty)";
  if (v.length <= keep) return "*".repeat(v.length);
  return `${v.slice(0, keep)}…(${v.length} chars)`;
}

// Normalize to digits-only E.164 without leading '+'.
// South African local format (0XXXXXXXXX) is converted to 27XXXXXXXXX.
function normalizeMsisdn(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return `27${digits.slice(1)}`;
  }
  return digits;
}

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
    console.error("WhatsApp credentials missing", { PHONE_ID: !!PHONE_ID, TOKEN: !!TOKEN });
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

  const rawTo = (body.to || "").trim();
  const to = normalizeMsisdn(rawTo);
  if (!/^\d{8,15}$/.test(to)) {
    return new Response(JSON.stringify({ error: "Invalid 'to' phone number", to_raw: rawTo, to_normalized: to }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const template = body.template?.trim() || "request_received";
  const language = body.language?.trim() || "en";

  const wabaBody = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template,
      language: { code: language },
      ...(body.components ? { components: body.components } : {}),
    },
  };

  const sendContext = {
    recipient_phone: to,
    recipient_phone_raw: rawTo,
    template,
    language,
    phone_number_id: mask(PHONE_ID),
    token: mask(TOKEN, 6),
    url: `${GRAPH}/${mask(PHONE_ID)}/messages`,
  };
  console.log("WA template send attempt", sendContext);

  let waResponse: unknown = null;
  let waStatus = 0;
  let waRawText = "";
  let networkError: string | null = null;
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
    waRawText = await res.text();
    try {
      waResponse = JSON.parse(waRawText);
    } catch {
      waResponse = { raw: waRawText };
    }
  } catch (e) {
    networkError = String(e);
    console.error("WhatsApp template send network error", e);
  }

  console.log("WA template send response", {
    ...sendContext,
    http_status_code: waStatus,
    response_body: waResponse,
    network_error: networkError,
  });

  const phoneE164 = `+${to}`;
  const ok = !networkError && waStatus >= 200 && waStatus < 300;

  if (!ok) {
    const errMsg =
      networkError ||
      (waResponse as { error?: { message?: string } })?.error?.message ||
      `HTTP ${waStatus}`;

    // Store failure
    await admin.from("whatsapp_messages").insert({
      phone: phoneE164,
      direction: "out",
      message_type: "template",
      body: `[template:${template}] FAILED: ${errMsg}`,
      payload: { request: wabaBody, response: waResponse, http_status: waStatus, network_error: networkError },
      status: "failed",
    });

    console.error("WhatsApp template send failed", { status: waStatus, error: errMsg });
    return new Response(
      JSON.stringify({
        error: "WhatsApp API error",
        meta_error: errMsg,
        http_status_code: waStatus,
        response_body: waResponse,
        network_error: networkError,
        recipient_phone: to,
        template,
        language,
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const wamid =
    (waResponse as { messages?: Array<{ id?: string }> })?.messages?.[0]?.id ?? null;

  await admin.from("whatsapp_messages").insert({
    phone: phoneE164,
    direction: "out",
    message_type: "template",
    body: `[template:${template}]`,
    payload: { request: wabaBody, response: waResponse },
    wa_message_id: wamid,
    status: "sent",
  });

  return new Response(JSON.stringify({ sent: true, wa_message_id: wamid, response: waResponse }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
