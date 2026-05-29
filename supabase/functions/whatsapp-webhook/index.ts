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
  { key: "fuel_delivery", label: "Fuel delivery", matchName: "Fuel" },
  { key: "tyre_inflate", label: "Tyre inflate", matchName: "Tyre" },
  { key: "minor_roadside_assistance", label: "Minor roadside assistance", matchName: "Tow" },
];

const FALLBACK_PRICES: Record<string, number> = {
  jump_start: 349,
  tyre_change: 349,
  fuel_delivery: 299,
  tyre_inflate: 199,
  minor_roadside_assistance: 399,
};

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

function normalizeServiceType(raw: unknown, label: unknown): string | null {
  const legacyMap: Record<string, string> = {
    fuel: "fuel_delivery",
    minor_roadside: "minor_roadside_assistance",
  };
  const fromRaw = typeof raw === "string" ? raw.trim() : "";
  if (fromRaw) return legacyMap[fromRaw] || fromRaw;
  if (typeof label === "string") return SERVICES.find((s) => s.label === label)?.key ?? null;
  return null;
}

// Strip emoji / pictographs / symbols to detect emoji-only inputs like 👆🏾
function stripEmoji(s: string): string {
  return s.replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Emoji_Component}\u200d\ufe0f]/gu, "").trim();
}

function parseLocation(msg: {
  type: string;
  text?: { body: string };
  location?: { latitude: number; longitude: number; address?: string; name?: string };
}): { lat?: number; lng?: number; address: string; shared?: boolean } | null {
  if (msg.type === "location" && msg.location) {
    return {
      lat: msg.location.latitude,
      lng: msg.location.longitude,
      address: msg.location.address || msg.location.name || "Shared location",
      shared: true,
    };
  }
  const body = msg.text?.body?.trim() || "";
  const m = body.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
            body.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
            body.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]), address: body };
  // Reject emoji-only or too-short text (e.g. 👆🏾)
  const cleaned = stripEmoji(body);
  if (cleaned.length >= 3 && /[a-zA-Z0-9]/.test(cleaned)) return { address: body };
  return null;
}

function parseName(vehicleDetails: string): string | null {
  const first = vehicleDetails.split(",")[0]?.trim();
  if (first && first.length >= 2 && first.length <= 50 && /^[a-zA-Z\s'-]+$/.test(first)) {
    return first;
  }
  return null;
}

function maskPayload<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload, (key, value) => {
    if (/token|secret|key|signature|passphrase|authorization/i.test(key)) return "[masked]";
    return value;
  }));
}

function logDbError(label: string, table: string, payload: Record<string, unknown>, error: unknown) {
  const err = error as { code?: string; message?: string; details?: string; hint?: string } | null;
  console.error(label, {
    table,
    code: err?.code ?? null,
    message: err?.message ?? String(error),
    details: err?.details ?? null,
    hint: err?.hint ?? null,
    payload: maskPayload(payload),
  });
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
    const cleanedVehicle = stripEmoji(text);
    if (cleanedVehicle.length < 4 || !/[a-zA-Z]/.test(cleanedVehicle)) {
      await reply(supabase, phone, conv.profile_id, `That doesn't look like vehicle details.\n\n${ASK_VEHICLE}`);
      return;
    }
    draft.vehicle_details = text.slice(0, 300);
    const parsedName = parseName(text);
    if (parsedName) draft.customer_name = parsedName;
    else if (!draft.customer_name) draft.customer_name = "WhatsApp Customer";

    const loc = draft.location as { address: string; shared?: boolean };
    const locDisplay = loc.shared ? "Shared location" : loc.address;
    const confirm =
      `Thanks. Please confirm:\n\n` +
      `Service: ${draft.service_label}\n` +
      `Location: ${locDisplay}\n` +
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

    // Validate required fields before insert
    const loc = draft.location as { lat?: number; lng?: number; address: string; shared?: boolean } | undefined;
    const serviceType = normalizeServiceType(draft.service_key, draft.service_label);
    const locationText = loc?.shared ? "WhatsApp shared location" : loc?.address;
    const requestStatus = "pending";
    const paymentStatus = "unpaid";
    const createdAt = new Date().toISOString();
    const missing: string[] = [];
    if (!draft.service_label) missing.push("service");
    if (!serviceType) missing.push("service_type");
    if (!draft.safety_status) missing.push("safety");
    if (!loc || (!locationText && (loc.lat == null || loc.lng == null))) missing.push("location");
    if (!draft.vehicle_details) missing.push("vehicle details");
    if (!phone) missing.push("phone");
    if (!requestStatus) missing.push("request_status");
    if (!paymentStatus) missing.push("payment_status");
    if (!createdAt) missing.push("created_at");
    if (missing.length) {
      console.error("request validation failed", { missing, draft: maskPayload(draft) });
      await reply(supabase, phone, conv.profile_id, `We're missing: ${missing.join(", ")}. Reply *MENU* to restart.`);
      return;
    }

    // 1. Profile
    let profileId = conv.profile_id;
    const name = (draft.customer_name as string) || "WhatsApp Customer";
    if (!profileId) {
      const newId = crypto.randomUUID();
      const profilePayload = { id: newId, full_name: name, phone, email: null };
      const { error: pErr } = await supabase.from("profiles").insert(profilePayload);
      if (pErr) {
        logDbError("profile insert FAILED", "profiles", profilePayload, pErr);
        await reply(supabase, phone, null, `Sorry, we couldn't create your profile (${pErr.code || "DB"}). Please try again or reply MENU.`);
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

    const requestAuditPayload = {
      customer_profile_id: profileId,
      phone_number: phone,
      service_type: serviceType,
      location_text: locationText,
      location_latitude: loc.lat ?? null,
      location_longitude: loc.lng ?? null,
      safety_status: draft.safety_status,
      vehicle_details: draft.vehicle_details,
      request_status: requestStatus,
      payment_status: paymentStatus,
      created_at: createdAt,
    };

    // 4. Create job (roadside request table used by admin active jobs)
    const jobPayload = {
      customer_id: profileId,
      service_id: matched?.id ?? null,
      status: requestStatus,
      pickup_address: locationText,
      pickup_lat: loc.lat ?? null,
      pickup_lng: loc.lng ?? null,
      estimated_price: matched?.base_price ?? FALLBACK_PRICES[serviceType] ?? 349,
      notes:
        `WhatsApp request — ${serviceLabel} (${serviceType})\n` +
        `Payment: ${paymentStatus}\n` +
        `Safety: ${draft.safety_status}\n` +
        `Vehicle/contact: ${draft.vehicle_details}`,
      source: "whatsapp",
      wa_phone: phone,
      created_at: createdAt,
    };
    console.log("creating WhatsApp roadside request", maskPayload({ table: "jobs", request: requestAuditPayload, insert: jobPayload }));
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .insert(jobPayload)
      .select()
      .single();

    if (jobErr || !job) {
      logDbError("job insert FAILED", "jobs", jobPayload, jobErr || { message: "No job row returned" });
      await reply(supabase, phone, profileId, "Sorry, we couldn't create your request. Please try again or reply HELP.");
      return;
    }

    await updateConversation(supabase, conv.id, {
      step: "awaiting_dispatch",
      profile_id: profileId,
      draft: { ...draft, job_id: job.id },
    });

    const greetName = name ? `${name.split(" ")[0]}, ` : "";
    await reply(
      supabase,
      phone,
      profileId,
      `Thanks ${greetName}your Now-Now Assist request has been received. We are reviewing your location and service details now.`,
    );
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
