import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Secure Messaging Endpoint
 * - Validates authenticated user
 * - Rate limits messages (max 30 per minute per job)
 * - Checks blocking status
 * - Prevents messaging on completed/cancelled jobs
 * - Sanitizes message content
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
    const { action, jobId, message, messageId } = await req.json();

    // 3. Handle different actions
    switch (action) {
      case "send": {
        if (!jobId || !message) {
          return new Response(
            JSON.stringify({ error: "Missing required parameters: jobId, message" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate message length (max 1000 chars)
        if (message.length > 1000) {
          return new Response(
            JSON.stringify({ error: "Message too long. Maximum 1000 characters." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify job exists and is active
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
            JSON.stringify({ error: "Cannot send messages for completed or cancelled jobs" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Determine sender type and get receiver info
        let senderType: "customer" | "driver";
        let receiverId: string | null = null;

        if (job.customer_id === userId) {
          senderType = "customer";
          // Get driver's user_id
          if (job.driver_id) {
            const { data: driver } = await supabase
              .from("drivers")
              .select("user_id")
              .eq("id", job.driver_id)
              .single();
            receiverId = driver?.user_id || null;
          }
        } else {
          senderType = "driver";
          receiverId = job.customer_id;
        }

        // Check if blocked
        if (receiverId) {
          const { data: isBlocked } = await supabase.rpc("is_user_blocked", {
            p_sender_id: userId,
            p_receiver_id: receiverId,
          });

          if (isBlocked) {
            return new Response(
              JSON.stringify({ error: "Unable to send message" }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Rate limit check (max 30 messages per minute per job)
        const { data: rateLimitOk } = await supabase.rpc("check_message_rate_limit", {
          p_user_id: userId,
          p_job_id: jobId,
        });

        if (!rateLimitOk) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please slow down." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Sanitize message (basic XSS prevention)
        const sanitizedMessage = message
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .trim();

        // Insert message
        const { data: newMessage, error: insertError } = await supabase
          .from("job_messages")
          .insert({
            job_id: jobId,
            sender_id: userId,
            sender_type: senderType,
            message: sanitizedMessage,
            status: "sent",
            metadata: {
              original_length: message.length,
              client_timestamp: new Date().toISOString(),
            },
          })
          .select()
          .single();

        if (insertError) {
          console.error("Message insert error:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to send message" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            messageId: newMessage.id,
            status: "sent",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "mark_delivered": {
        if (!messageId) {
          return new Response(
            JSON.stringify({ error: "Missing messageId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: updateError } = await supabase
          .from("job_messages")
          .update({
            status: "delivered",
            delivered_at: new Date().toISOString(),
          })
          .eq("id", messageId)
          .neq("sender_id", userId); // Only recipient can mark as delivered

        if (updateError) {
          console.error("Mark delivered error:", updateError);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "mark_read": {
        if (!messageId && !jobId) {
          return new Response(
            JSON.stringify({ error: "Missing messageId or jobId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const now = new Date().toISOString();

        if (messageId) {
          // Mark single message as read
          await supabase
            .from("job_messages")
            .update({
              is_read: true,
              status: "read",
              read_at: now,
            })
            .eq("id", messageId)
            .neq("sender_id", userId);
        } else if (jobId) {
          // Mark all unread messages in job as read
          await supabase
            .from("job_messages")
            .update({
              is_read: true,
              status: "read",
              read_at: now,
            })
            .eq("job_id", jobId)
            .neq("sender_id", userId)
            .eq("is_read", false);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: send, mark_delivered, mark_read" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

  } catch (error) {
    console.error("Secure message error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
