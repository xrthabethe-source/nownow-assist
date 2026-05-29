// WhatsApp Business Cloud API webhook.
// - GET: Meta verification handshake (hub.verify_token must match WHATSAPP_VERIFY_TOKEN)
// - POST: incoming user messages -> drives the simplified booking state machine
// This function is intentionally PUBLIC (verify_jwt = false) — Meta has no JWT.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH = "https://graph.facebook.com/v20.0";

const SERVICES = [
  { key: "jump_start", label: "Jump start", matchName: "Battery" },
  { key: "tyre_change", label: "Tyre change", matchName: "Tyre" },
  { key: "fuel", label: "Fuel delivery", matchName: "Fuel" },
  { key: "tyre_inflate", label: "Tyre inflate", matchName: "Tyre" },
  { key: "minor_roadside", label: "Minor roadside assistance", matchName: "Tow" },
];

const WELCOME =
  "Hi, welcome to Now-Now Assist 🚗\n\n" +
  "What help do you need today?\n\n" +
  "Reply with:\n" +
  "1. Jump start\n" +
  "2. Tyre change\n" +
  "3. Fuel delivery\n" +
  "4. Tyre inflate\n" +
  "5. Minor roadside assistance";

const ASK_LOCATION =
  "Please send your location.\n\n" +
  "You can share your WhatsApp location 📎, or type your suburb/street/landmark.";

const ASK_SAFETY =
  "Are you safe where you are?\n\nReply:\n1. Yes\n2. No";

const ASK_VEHICLE =
  "Please send your vehicle details in one message:\n\n" +
  "Name, car, colour, registration if available.\n\n" +
  "Example:\nAdmire, white Toyota Hilux, AB 12 CD GP";

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

function parseServiceChoice(input: string): typeof SERVICES[number] | null {
  const t = input.trim().toLowerCase();
  const num = parseInt(t, 10);
  if (num >= 1 && num <= 5) return SERVICES[num - 1];
  if (/jump|battery/.test(t)) return SERVICES[0];
  if (/tyre change|tire change|flat/.test(t)) return SERVICES[1];
  if (/fuel|petrol|diesel/.test(t)) return SERVICES[2];
  if (/inflate|pump|air/.test(t)) return SERVICES[3];
  if (/roadside|tow|help|minor/.test(t)) return SERVICES[4];
  return null;
}

function parseLocation(msg: {
  type: string;
  text?: { body: string };
  location?: { latitude: number; longitude: number; address?: string; name?: string };
}): { lat?: number; lng?: number; address: string } | null {
  if (msg.type === "location" && msg.location) {
    return {
      lat: msg.location.latitude,
      lng: msg.location.longitude,
      address: msg.location.address || msg.location.name || `${msg.location.latitude}, ${msg.location.longitude}`,
    };
  }
  const body = msg.text?.body?.trim() || "";
  const m = body.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
            body.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
            body.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]), address: body };
  if (body.length >= 3) return { address: body };
  return null;
}

function parseName(vehicleDetails: string): string | null {
  const first = vehicleDetails.split(",")[0]?.trim();
  if (first && first.length >= 2 && first.length <= 50 && /^[a-zA-Z\s'-]+$/.test(first)) {
    return first;
  }
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

  const text = msg.text?.body?.trim() || "";

  // Global reset
  if (/^(cancel|reset|restart|stop|menu|start)$/i.test(text)) {
    await updateConversation(supabase, conv.id, { step: "awaiting_service", draft: {} });
    await reply(supabase, phone, conv.profile_id, WELCOME);
    return;
  }

  let step = conv.step;
  const draft = { ...(conv.draft as Record<string, unknown>) };

  if (step === "idle") {
    await updateConversation(supabase, conv.id, { step: "awaiting_service", draft: {} });
    await reply(supabase, phone, conv.profile_id, WELCOME);
    return;
  }

  if (step === "awaiting_service") {
    const choice = parseServiceChoice(text);
    if (!choice) {
      await reply(supabase, phone, conv.profile_id, `Sorry, I didn't catch that.\n\n${WELCOME}`);
      return;
    }
    draft.service_key = choice.key;
    draft.service_label = choice.label;
    await updateConversation(supabase, conv.id, { step: "awaiting_location", draft });
    await reply(supabase, phone, conv.profile_id, `Got it — ${choice.label}.\n\n${ASK_LOCATION}`);
    return;
  }

  if (step === "awaiting_location") {
    const loc = parseLocation(msg);
    if (!loc) {
      await reply(supabase, phone, conv.profile_id, "I couldn't read that location. Please share your WhatsApp location or type your suburb/street/landmark.");
      return;
    }
    draft.location = loc;
    await updateConversation(supabase, conv.id, { step: "awaiting_safety", draft });
    await reply(supabase, phone, conv.profile_id, ASK_SAFETY);
    return;
  }

  if (step === "awaiting_safety") {
    const t = text.toLowerCase();
    let safe: boolean | null = null;
    if (/^1$|^yes$|^y$|safe/.test(t)) safe = true;
    else if (/^2$|^no$|^n$|not safe|unsafe/.test(t)) safe = false;
    if (safe === null) {
      await reply(supabase, phone, conv.profile_id, `Please reply 1 for Yes or 2 for No.\n\n${ASK_SAFETY}`);
      return;
    }
    draft.safety_status = safe ? "safe" : "unsafe";
    await updateConversation(supabase, conv.id, { step: "awaiting_vehicle", draft });
    if (!safe) {
      await reply(supabase, phone, conv.profile_id,
        "Please move to a safer spot if possible. If it's an emergency, call emergency services first. We'll continue with your request now.");
    }
    await reply(supabase, phone, conv.profile_id, ASK_VEHICLE);
    return;
  }

  if (step === "awaiting_vehicle") {
    if (text.length < 4) {
      await reply(supabase, phone, conv.profile_id, ASK_VEHICLE);
      return;
    }
    draft.vehicle_details = text.slice(0, 300);
    const parsedName = parseName(text);
    if (parsedName) draft.customer_name = parsedName;

    const loc = draft.location as { address: string };
    const confirm =
      `Thanks. Please confirm:\n\n` +
      `Service: ${draft.service_label}\n` +
      `Location: ${loc.address}\n` +
      `Safety: ${draft.safety_status === "safe" ? "Safe" : "Not safe"}\n` +
      `Vehicle/contact: ${draft.vehicle_details}\n\n` +
      `Reply *YES* to continue (you agree to our Terms: https://nownowassist.co.za/terms), or *EDIT* to change.`;

    await updateConversation(supabase, conv.id, { step: "awaiting_confirm", draft });
    await reply(supabase, phone, conv.profile_id, confirm);
    return;
  }

  if (step === "awaiting_confirm") {
    if (/^edit$/i.test(text)) {
      await updateConversation(supabase, conv.id, { step: "awaiting_service", draft: {} });
      await reply(supabase, phone, conv.profile_id, `Let's start over.\n\n${WELCOME}`);
      return;
    }
    if (!/^yes$|^y$/i.test(text)) {
      await reply(supabase, phone, conv.profile_id, "Please reply *YES* to continue, or *EDIT* to change.");
      return;
    }

    // 1. Profile
    let profileId = conv.profile_id;
    const name = (draft.customer_name as string) || null;
    if (!profileId) {
      const newId = crypto.randomUUID();
      const { error: pErr } = await supabase.from("profiles").insert({
        id: newId,
        full_name: name,
        phone,
        email: null,
      });
      if (pErr) {
        console.error("profile insert error", pErr);
        await reply(supabase, phone, null, "Sorry, we couldn't create your profile. Please try again.");
        return;
      }
      profileId = newId;
    } else if (name) {
      await supabase.from("profiles").update({ full_name: name }).eq("id", profileId).is("full_name", null);
    }

    // 2. Consent (terms acknowledged via YES)
    await supabase.from("terms_consents").insert({
      phone,
      profile_id: profileId,
      terms_version: "v1.0",
      channel: "whatsapp",
    });

    // 3. Match service
    const serviceLabel = draft.service_label as string;
    const { data: services } = await supabase
      .from("services")
      .select("id, name, base_price")
      .eq("is_active", true);
    const matchKey = (SERVICES.find((s) => s.label === serviceLabel)?.matchName || serviceLabel).toLowerCase();
    const matched = (services || []).find((s: { name: string }) =>
      s.name.toLowerCase().includes(matchKey),
    ) || services?.[0];

    const loc = draft.location as { lat?: number; lng?: number; address: string };

    // 4. Create job
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        customer_id: profileId,
        service_id: matched?.id ?? null,
        status: "pending",
        pickup_address: loc.address,
        pickup_lat: loc.lat ?? null,
        pickup_lng: loc.lng ?? null,
        estimated_price: matched?.base_price ?? null,
        notes:
          `WhatsApp request — ${serviceLabel}\n` +
          `Safety: ${draft.safety_status}\n` +
          `Vehicle/contact: ${draft.vehicle_details}`,
        source: "whatsapp",
        wa_phone: phone,
      })
      .select()
      .single();

    if (jobErr || !job) {
      console.error("job insert error", jobErr);
      await reply(supabase, phone, profileId, "Sorry, we couldn't create your request. Please try again or reply HELP.");
      return;
    }

    // 5. PayFast link
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    let paymentLink: string | null = null;
    try {
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

    await updateConversation(supabase, conv.id, {
      step: paymentLink ? "awaiting_payment" : "awaiting_dispatch",
      profile_id: profileId,
      draft: { ...draft, job_id: job.id },
    });

    const greetName = name ? `${name.split(" ")[0]}, ` : "";
    if (paymentLink) {
      await reply(
        supabase,
        phone,
        profileId,
        `✅ Thanks ${greetName}your request *${job.job_number}* is in.\n` +
        `Service: ${serviceLabel}\n` +
        `📍 ${loc.address}\n` +
        `💳 Estimated: R${matched?.base_price ?? 349}\n\n` +
        `To dispatch a responder, please complete secure payment:\n${paymentLink}`,
      );
    } else {
      await reply(
        supabase,
        phone,
        profileId,
        `Thanks ${greetName}your request *${job.job_number}* has been received. Our team will confirm pricing/payment with you shortly.`,
      );
    }
    return;
  }

  if (step === "awaiting_payment") {
    await reply(supabase, phone, conv.profile_id,
      "We're waiting for your payment to confirm. Reply *CANCEL* to cancel this request, or *MENU* to start a new one.");
    return;
  }

  if (step === "awaiting_dispatch") {
    await reply(supabase, phone, conv.profile_id,
      "Your request is with our team. Reply *MENU* to start a new request.");
    return;
  }

  // Recover unknown
  await updateConversation(supabase, conv.id, { step: "awaiting_service", draft: {} });
  await reply(supabase, phone, conv.profile_id, WELCOME);
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
    const entries = payload?.entry || [];
    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        for (const status of value.statuses || []) {
          if (status.id) {
            await supabase.from("whatsapp_messages").update({ status: status.status })
              .eq("wa_message_id", status.id);
          }
        }
        for (const m of value.messages || []) {
          const phone = normalizePhone(m.from);
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
    return new Response("OK", { status: 200 });
  }
});
