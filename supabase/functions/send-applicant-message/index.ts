import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { driver_id, phone_number, message, channel, template_used } = await req.json();

    if (!driver_id || !phone_number || !message || !channel) {
      return new Response(JSON.stringify({ error: "Missing required fields: driver_id, phone_number, message, channel" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize phone number for SA (add +27 if needed)
    let normalizedPhone = phone_number.trim().replace(/\s+/g, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "+27" + normalizedPhone.slice(1);
    } else if (!normalizedPhone.startsWith("+")) {
      normalizedPhone = "+" + normalizedPhone;
    }

    const results: { sms?: string; whatsapp?: string } = {};
    const errors: string[] = [];

    const sendViaTwilio = async (to: string, body: string, isWhatsApp: boolean) => {
      if (!twilioSid || !twilioAuth || !twilioPhone) {
        throw new Error("Twilio credentials not configured");
      }

      const fromNumber = isWhatsApp ? `whatsapp:${twilioPhone}` : twilioPhone;
      const toNumber = isWhatsApp ? `whatsapp:${to}` : to;

      const params = new URLSearchParams({
        To: toNumber,
        From: fromNumber,
        Body: body,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`${twilioSid}:${twilioAuth}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Twilio error: ${response.status}`);
      }
      return data.sid;
    };

    // Send based on channel selection
    if (channel === "sms" || channel === "both") {
      try {
        const sid = await sendViaTwilio(normalizedPhone, message, false);
        results.sms = sid;
      } catch (e: any) {
        errors.push(`SMS: ${e.message}`);
      }
    }

    if (channel === "whatsapp" || channel === "both") {
      try {
        const sid = await sendViaTwilio(normalizedPhone, message, true);
        results.whatsapp = sid;
      } catch (e: any) {
        errors.push(`WhatsApp: ${e.message}`);
      }
    }

    const deliveryStatus = errors.length === 0 ? "sent" : (Object.keys(results).length > 0 ? "partial" : "failed");

    // Log communication
    const { data: commLog, error: logError } = await supabaseAdmin
      .from("applicant_communications")
      .insert({
        driver_id,
        admin_id: user.id,
        channel,
        message_content: message,
        template_used: template_used || null,
        delivery_status: deliveryStatus,
        delivery_error: errors.length > 0 ? errors.join("; ") : null,
        phone_number: normalizedPhone,
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to log communication:", logError);
    }

    // Also log audit event
    await supabaseAdmin.rpc("log_audit_event", {
      p_user_id: user.id,
      p_event_type: "applicant_message_sent",
      p_event_category: "admin",
      p_resource_type: "driver",
      p_resource_id: driver_id,
      p_details: JSON.stringify({ channel, delivery_status: deliveryStatus, template_used }),
      p_severity: "info",
    });

    return new Response(
      JSON.stringify({
        success: deliveryStatus !== "failed",
        delivery_status: deliveryStatus,
        results,
        errors: errors.length > 0 ? errors : undefined,
        communication_id: commLog?.id,
      }),
      {
        status: deliveryStatus === "failed" ? 500 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
