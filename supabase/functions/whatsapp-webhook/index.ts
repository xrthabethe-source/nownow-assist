// WhatsApp Business Cloud API webhook.
// - GET: Meta verification handshake (hub.verify_token must match WHATSAPP_VERIFY_TOKEN)
// - POST: incoming user messages -> drives the booking state machine
// This function is intentionally PUBLIC (verify_jwt = false) — Meta has no JWT.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH = "https://graph.facebook.com/v20.0";

const SERVICES = [
  { key: "flat_tyre", label: "Flat Tyre Assistance", matchName: "Flat Tyre" },
  { key: "battery", label: "Battery Jump Start", matchName: "Battery" },
  { key: "fuel", label: "Fuel Delivery", matchName: "Fuel" },
  { key: "wont_start", label: "Vehicle Won't Start", matchName: "Mechanical" },
  { key: "general", label: "General Roadside Assistance", matchName: "Tow" },
];

interface Conv {
  id: string;
  phone: string;
  profile_id: string | null;
  step: string;
  draft: Record<string, unknown>;
}

function normalizePhone(p: string): string {
  const digits = p.replace(/[^0-9]/g, "");
  return digits.startsWith("0") ? "+27" + digits.slice(1) : "+" + digits;
}

async function sendWhatsApp(to: string, text: string) {
  const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  if (!PHONE_ID || !TOKEN) {
    console.error("WhatsApp credentials missing");
    return null;
  }
  const res = await fetch(`${GRAPH}/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
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

async function logMessage(
  supabase: ReturnType<typeof createClient>,
  args: {
    phone: string;
    profile_id: string | null;
    direction: "in" | "out";
    body: string;
    payload?: unknown;
    wa_message_id?: string;
    job_id?: string | null;
  },
) {
  await supabase.from("whatsapp_messages").insert({
    phone: args.phone,
    profile_id: args.profile_id,
    direction: args.direction,
    body: args.body,
    payload: args.payload ?? null,
    wa_message_id: args.wa_message_id ?? null,
    job_id: args.job_id ?? null,
  });
}

async function reply(
  supabase: ReturnType<typeof createClient>,
  phone: string,
  profile_id: string | null,
  text: string,
) {
  await sendWhatsApp(phone, text);
  await logMessage(supabase, { phone, profile_id, direction: "out", body: text });
}

async function getOrCreateConversation(
  supabase: ReturnType<typeof createClient>,
  phone: string,
): Promise<Conv> {
  const { data: existing } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();
  if (existing) return existing as Conv;

  // Try linking profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  const { data: created, error } = await supabase
    .from("whatsapp_conversations")
    .insert({ phone, profile_id: profile?.id ?? null, step: "idle", draft: {} })
    .select()
    .single();
  if (error) throw error;
  return created as Conv;
}

async function updateConversation(
  supabase: ReturnType<typeof createClient>,
  id: string,
  patch: Partial<Conv>,
) {
  await supabase
    .from("whatsapp_conversations")
    .update({ ...patch, last_message_at: new Date().toISOString() })
    .eq("id", id);
}

async function getConfig(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "whatsapp_config")
    .maybeSingle();
  const v = (data?.value ?? {}) as Record<string, string>;
  return {
    terms_url: v.terms_url || "https://nownowassist.co.za/terms",
    terms_version: v.terms_version || "v1.0",
    welcome: v.welcome_message || "Welcome to Now-Now Assist.",
  };
}

const SERVICE_MENU =
  "Please reply with a number:\n" +
  "1️⃣ Flat Tyre Assistance\n" +
  "2️⃣ Battery Jump Start\n" +
  "3️⃣ Fuel Delivery\n" +
  "4️⃣ Vehicle Won't Start\n" +
  "5️⃣ General Roadside Assistance";

function parseServiceChoice(input: string): typeof SERVICES[number] | null {
  const t = input.trim().toLowerCase();
  const num = parseInt(t, 10);
  if (num >= 1 && num <= 5) return SERVICES[num - 1];
  if (/tyre|tire|flat/.test(t)) return SERVICES[0];
  if (/battery|jump/.test(t)) return SERVICES[1];
  if (/fuel|petrol|diesel/.test(t)) return SERVICES[2];
  if (/start|crank|engine/.test(t)) return SERVICES[3];
  if (/tow|general|help/.test(t)) return SERVICES[4];
  return null;
}

function isStartTrigger(t: string): boolean {
  const s = t.trim().toLowerCase();
  return [
    "hi", "hello", "hey", "help", "start", "menu",
  ].includes(s) || s.length <= 2 || parseServiceChoice(s) !== null;
}

function parseLocation(msg: {
  type: string;
  text?: { body: string };
  location?: { latitude: number; longitude: number; address?: string; name?: string };
}): { lat?: number; lng?: number; address?: string } | null {
  if (msg.type === "location" && msg.location) {
    return {
      lat: msg.location.latitude,
      lng: msg.location.longitude,
      address: msg.location.address || msg.location.name || `${msg.location.latitude}, ${msg.location.longitude}`,
    };
  }
  const body = msg.text?.body?.trim() || "";
  // Google Maps link with coordinates
  const m = body.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
            body.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
            body.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
  if (m) {
    return { lat: parseFloat(m[1]), lng: parseFloat(m[2]), address: body };
  }
  if (body.length > 5) return { address: body };
  return null;
}

async function handleInbound(
  supabase: ReturnType<typeof createClient>,
  phone: string,
  msg: {
    id?: string;
    type: string;
    text?: { body: string };
    location?: { latitude: number; longitude: number; address?: string; name?: string };
  },
) {
  const body = msg.text?.body?.trim() || (msg.type === "location" ? "[location]" : `[${msg.type}]`);
  const conv = await getOrCreateConversation(supabase, phone);
  await logMessage(supabase, {
    phone,
    profile_id: conv.profile_id,
    direction: "in",
    body,
    payload: msg,
    wa_message_id: msg.id,
  });

  const cfg = await getConfig(supabase);
  const text = msg.text?.body?.trim() || "";

  // Global RESET command
  if (/^(cancel|reset|restart|stop)$/i.test(text)) {
    await updateConversation(supabase, conv.id, { step: "idle", draft: {} });
    await reply(supabase, phone, conv.profile_id, "Your request has been cancelled. Send HI to start again.");
    return;
  }

  let step = conv.step;
  const draft = { ...(conv.draft as Record<string, unknown>) };

  // Bootstrap: any message starts the flow
  if (step === "idle") {
    await reply(supabase, phone, conv.profile_id, `${cfg.welcome}\n\n${SERVICE_MENU}`);
    await updateConversation(supabase, conv.id, { step: "awaiting_service", draft: {} });
    return;
  }

  if (step === "awaiting_service") {
    const choice = parseServiceChoice(text);
    if (!choice) {
      await reply(supabase, phone, conv.profile_id, `Sorry, I didn't understand that.\n\n${SERVICE_MENU}`);
      return;
    }
    draft.service_key = choice.key;
    draft.service_label = choice.label;
    await updateConversation(supabase, conv.id, { step: "awaiting_location", draft });
    await reply(
      supabase,
      phone,
      conv.profile_id,
      `Got it — ${choice.label}.\n\nPlease share your location:\n• Tap 📎 → Location → Send your current location, or\n• Paste a Google Maps link, or\n• Type your street address.`,
    );
    return;
  }

  if (step === "awaiting_location") {
    const loc = parseLocation(msg);
    if (!loc) {
      await reply(supabase, phone, conv.profile_id, "I couldn't read that location. Please share your live location or paste a Google Maps link.");
      return;
    }
    draft.location = loc;

    // If we already have a profile, jump to terms
    if (conv.profile_id) {
      await updateConversation(supabase, conv.id, { step: "awaiting_terms", draft });
      await reply(
        supabase,
        phone,
        conv.profile_id,
        `Before continuing, please review our Terms and Conditions:\n${cfg.terms_url}\n\nReply *AGREE* to continue.`,
      );
      return;
    }

    // New customer flow
    await updateConversation(supabase, conv.id, { step: "awaiting_name", draft });
    await reply(supabase, phone, conv.profile_id, "Got your location. What's your *full name*?");
    return;
  }

  if (step === "awaiting_name") {
    if (text.length < 2) {
      await reply(supabase, phone, conv.profile_id, "Please send your full name (at least 2 characters).");
      return;
    }
    draft.full_name = text.slice(0, 100);
    await updateConversation(supabase, conv.id, { step: "awaiting_vehicle_make", draft });
    await reply(supabase, phone, conv.profile_id, `Thanks ${text.split(" ")[0]}. What's your vehicle *make*? (e.g. Toyota)`);
    return;
  }

  if (step === "awaiting_vehicle_make") {
    if (text.length < 2) { await reply(supabase, phone, conv.profile_id, "Please send the vehicle make."); return; }
    draft.vehicle_make = text.slice(0, 50);
    await updateConversation(supabase, conv.id, { step: "awaiting_vehicle_model", draft });
    await reply(supabase, phone, conv.profile_id, "And the *model*? (e.g. Corolla)");
    return;
  }

  if (step === "awaiting_vehicle_model") {
    if (text.length < 1) { await reply(supabase, phone, conv.profile_id, "Please send the vehicle model."); return; }
    draft.vehicle_model = text.slice(0, 50);
    await updateConversation(supabase, conv.id, { step: "awaiting_terms", draft });
    await reply(
      supabase,
      phone,
      conv.profile_id,
      `Before continuing, please review our Terms and Conditions:\n${cfg.terms_url}\n\nReply *AGREE* to continue.`,
    );
    return;
  }

  if (step === "awaiting_terms") {
    if (!/^agree$/i.test(text)) {
      await reply(supabase, phone, conv.profile_id, "You must reply *AGREE* to continue, or *CANCEL* to stop.");
      return;
    }

    // 1. Ensure profile exists for new customers
    let profileId = conv.profile_id;
    if (!profileId) {
      // Create a profiles row without auth user (phone-only WhatsApp customer)
      const newId = crypto.randomUUID();
      const { error: pErr } = await supabase.from("profiles").insert({
        id: newId,
        full_name: (draft.full_name as string) || null,
        phone,
        email: null,
      });
      if (pErr) {
        console.error("profile insert error", pErr);
        await reply(supabase, phone, null, "Sorry, we couldn't create your profile. Please try again.");
        return;
      }
      profileId = newId;
    }

    // 2. Record consent
    await supabase.from("terms_consents").insert({
      phone,
      profile_id: profileId,
      terms_version: cfg.terms_version,
      channel: "whatsapp",
    });

    // 3. Match the service from the services table
    const serviceLabel = draft.service_label as string;
    const { data: services } = await supabase
      .from("services")
      .select("id, name, base_price")
      .eq("is_active", true);
    const matchKey = (SERVICES.find((s) => s.label === serviceLabel)?.matchName || serviceLabel).toLowerCase();
    const matched = (services || []).find((s: { name: string }) =>
      s.name.toLowerCase().includes(matchKey),
    ) || services?.[0];

    const loc = draft.location as { lat?: number; lng?: number; address?: string };

    // 4. Create the job
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        customer_id: profileId,
        service_id: matched?.id ?? null,
        status: "pending",
        pickup_address: loc?.address || null,
        pickup_lat: loc?.lat ?? null,
        pickup_lng: loc?.lng ?? null,
        estimated_price: matched?.base_price ?? null,
        notes: `WhatsApp request — ${serviceLabel}` +
          (draft.vehicle_make ? ` — ${draft.vehicle_make} ${draft.vehicle_model || ""}` : ""),
        source: "whatsapp",
        wa_phone: phone,
      })
      .select()
      .single();

    if (jobErr || !job) {
      console.error("job insert error", jobErr);
      await reply(supabase, phone, profileId, "Sorry, we couldn't create your request. Please try again or call us.");
      return;
    }

    // 5. Generate PayFast link via existing function
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    let paymentLink: string | null = null;
    try {
      // We call payfast-payment with service-role JWT so the auth check passes
      const payRes = await fetch(`${SUPABASE_URL}/functions/v1/payfast-payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: matched?.base_price || 349,
          item_name: serviceLabel,
          job_id: job.id,
        }),
      });
      const payData = await payRes.json();
      if (payRes.ok && payData?.payment_url && payData?.payment_data) {
        const qs = new URLSearchParams(payData.payment_data as Record<string, string>).toString();
        paymentLink = `${payData.payment_url}?${qs}`;
      } else {
        console.error("payfast-payment failed", payRes.status, payData);
      }
    } catch (e) {
      console.error("payfast-payment fetch error", e);
    }

    // 6. Update conversation
    await updateConversation(supabase, conv.id, {
      step: "awaiting_payment",
      profile_id: profileId,
      draft: { ...draft, job_id: job.id },
    });

    const confirm =
      `✅ Request *${job.job_number}* created for ${serviceLabel}.\n` +
      `📍 ${loc?.address || "Location set"}\n` +
      `💳 Estimated: R${matched?.base_price ?? 349}\n\n` +
      (paymentLink
        ? `To dispatch a responder, please complete secure payment:\n${paymentLink}`
        : `A payment link will follow shortly. Reply HELP if you need assistance.`);
    await reply(supabase, phone, profileId, confirm);
    return;
  }

  if (step === "awaiting_payment") {
    await reply(
      supabase,
      phone,
      conv.profile_id,
      "We're waiting for your payment to confirm. Reply *CANCEL* to cancel this request.",
    );
    return;
  }

  // Unknown step — recover
  await updateConversation(supabase, conv.id, { step: "idle", draft: {} });
  await reply(supabase, phone, conv.profile_id, `Let's start over.\n\n${SERVICE_MENU}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return new Response("Server misconfigured", { status: 500 });
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // GET = Meta verification handshake
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token && token === VERIFY_TOKEN) {
      return new Response(challenge || "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const payload = await req.json();
    // WhatsApp webhook envelope
    const entries = payload?.entry || [];
    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        // Status updates (sent/delivered/read) — log lightly
        for (const status of value.statuses || []) {
          if (status.recipient_id) {
            await supabase.from("whatsapp_messages").update({ status: status.status })
              .eq("wa_message_id", status.id);
          }
        }
        // Incoming messages
        for (const m of value.messages || []) {
          const fromRaw: string = m.from;
          const phone = normalizePhone(fromRaw);
          try {
            await handleInbound(supabase, phone, m);
          } catch (e) {
            console.error("handleInbound error", e);
          }
        }
      }
    }
    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (e) {
    console.error("webhook error", e);
    // Always 200 to avoid Meta retries swamping us; log the error
    return new Response("OK", { status: 200 });
  }
});
