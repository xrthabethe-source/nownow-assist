import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Abuse Reporting Endpoint
 * - Validates authenticated user
 * - Creates abuse report for safety team review
 * - Optionally blocks the reported user
 * - Notifies admins
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
    const {
      action,
      jobId,
      reportedId,
      reportedType,
      reportType,
      description,
      blockUser,
    } = await req.json();

    if (action !== "report") {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Validate required fields
    if (!reportedId || !reportedType || !reportType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: reportedId, reportedType, reportType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validReportTypes = [
      "harassment",
      "inappropriate_content",
      "spam",
      "threatening",
      "fraud",
      "other",
    ];

    if (!validReportTypes.includes(reportType)) {
      return new Response(
        JSON.stringify({ error: `Invalid reportType. Must be one of: ${validReportTypes.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Determine reporter type
    let reporterType: "customer" | "driver" = "customer";
    
    const { data: driverRecord } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (driverRecord) {
      reporterType = "driver";
    }

    // 5. Create abuse report
    const { data: report, error: reportError } = await supabase
      .from("abuse_reports")
      .insert({
        job_id: jobId || null,
        reporter_id: userId,
        reporter_type: reporterType,
        reported_id: reportedId,
        reported_type: reportedType,
        report_type: reportType,
        description: description?.substring(0, 2000) || null, // Limit description length
        status: "pending",
      })
      .select()
      .single();

    if (reportError) {
      console.error("Abuse report error:", reportError);
      return new Response(
        JSON.stringify({ error: "Failed to submit report" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Optionally block user
    if (blockUser) {
      await supabase.from("message_blocks").insert({
        blocker_id: userId,
        blocked_id: reportedId,
        reason: reportType,
      }).single(); // Ignore error if already blocked
    }

    // 7. Create admin notification
    await supabase.from("admin_notifications").insert({
      type: "abuse_report",
      title: "Abuse Report Submitted",
      message: `A ${reportType} report was submitted and requires review`,
      severity: reportType === "threatening" ? "error" : "warning",
      metadata: {
        report_id: report.id,
        report_type: reportType,
        job_id: jobId,
      },
    });

    // 8. Log audit event
    await supabase.rpc("log_audit_event", {
      p_user_id: userId,
      p_event_type: "abuse_report_created",
      p_event_category: "safety",
      p_resource_type: "abuse_report",
      p_resource_id: report.id,
      p_details: {
        report_type: reportType,
        reported_type: reportedType,
        blocked_user: blockUser,
      },
      p_severity: "warn",
    });

    return new Response(
      JSON.stringify({
        success: true,
        reportId: report.id,
        message: "Report submitted. Our safety team will review it within 24 hours.",
        userBlocked: !!blockUser,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Report abuse error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
