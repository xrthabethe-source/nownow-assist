import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Secure VoIP Call Endpoint
 * - Validates authenticated user
 * - Logs call for audit/dispute resolution
 * - Rate limits calls (max 10 per hour per user)
 * - Routes through Twilio with number masking
 * - Automatically disables after job completion
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;

    // 2. Parse request body
    const { action, jobId, receiverId, receiverType } = await req.json();

    if (action !== "initiate_call") {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!jobId || !receiverId || !receiverType) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: jobId, receiverId, receiverType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Verify job is active (not completed/cancelled)
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, status, customer_id, driver_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (job.status === "completed" || job.status === "cancelled") {
      return new Response(
        JSON.stringify({ error: "Cannot call for completed or cancelled jobs" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Rate limit check (max 10 calls per hour)
    const { count: callCount } = await supabase
      .from("call_logs")
      .select("*", { count: "exact", head: true })
      .eq("caller_id", userId)
      .gte("initiated_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if ((callCount || 0) >= 10) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Maximum 10 calls per hour." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Check if user is blocked by receiver
    const { data: isBlocked } = await supabase.rpc("is_user_blocked", {
      p_sender_id: userId,
      p_receiver_id: receiverId,
    });

    if (isBlocked) {
      return new Response(
        JSON.stringify({ error: "Unable to connect call" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Get receiver's phone number (masked - never sent to client)
    let receiverPhone: string | null = null;
    
    if (receiverType === "driver") {
      // Get driver's phone from profile
      const { data: driver } = await supabase
        .from("drivers")
        .select("user_id")
        .eq("id", receiverId)
        .single();
      
      if (driver) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", driver.user_id)
          .single();
        receiverPhone = profile?.phone;
      }
    } else if (receiverType === "customer") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", receiverId)
        .single();
      receiverPhone = profile?.phone;
    }

    if (!receiverPhone) {
      return new Response(
        JSON.stringify({ error: "Receiver phone number not available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Get Twilio credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhone) {
      console.error("Twilio credentials not configured");
      return new Response(
        JSON.stringify({ error: "Calling service not available" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Determine caller type
    let callerType: "customer" | "driver";
    if (job.customer_id === userId) {
      callerType = "customer";
    } else {
      callerType = "driver";
    }

    // 9. Create call log BEFORE initiating call
    const { data: callLog, error: logError } = await supabase
      .from("call_logs")
      .insert({
        job_id: jobId,
        caller_id: userId,
        caller_type: callerType,
        receiver_id: receiverId,
        receiver_type: receiverType,
        status: "initiated",
        metadata: {
          user_agent: req.headers.get("user-agent"),
        },
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create call log:", logError);
    }

    // 10. Initiate Twilio call
    const twiml = `
      <Response>
        <Say voice="alice">Connecting you now. Please hold.</Say>
        <Dial callerId="${twilioPhone}" timeout="30">
          ${receiverPhone}
        </Dial>
        <Say>The call could not be completed. Please try again later.</Say>
      </Response>
    `.trim();

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: receiverPhone,
        From: twilioPhone,
        Twiml: twiml,
      }),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      // Update call log with failure
      if (callLog) {
        await supabase
          .from("call_logs")
          .update({
            status: "failed",
            ended_at: new Date().toISOString(),
            end_reason: twilioData.message || "Twilio error",
          })
          .eq("id", callLog.id);
      }

      console.error("Twilio error:", twilioData);
      return new Response(
        JSON.stringify({ error: "Failed to connect call. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 11. Update call log with Twilio SID
    if (callLog) {
      await supabase
        .from("call_logs")
        .update({
          call_sid: twilioData.sid,
          status: "ringing",
        })
        .eq("id", callLog.id);
    }

    // 12. Return success (never expose phone number to client)
    return new Response(
      JSON.stringify({
        success: true,
        callId: callLog?.id,
        message: "Call initiated. You will receive the call shortly.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Secure call error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
