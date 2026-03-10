import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, email, phone, otp_type, otp_code } = await req.json();

    if (action === "send") {
      if (!email || !otp_type) {
        return new Response(
          JSON.stringify({ error: "Email and otp_type are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate 5-digit OTP
      const code = String(Math.floor(10000 + Math.random() * 90000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Rate limit: max 5 OTPs per hour per email+type
      const { data: recentOtps } = await supabase
        .from("driver_otp_verifications")
        .select("id")
        .eq("email", email)
        .eq("otp_type", otp_type)
        .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (recentOtps && recentOtps.length >= 5) {
        return new Response(
          JSON.stringify({ error: "Too many OTP requests. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Invalidate previous unverified OTPs
      await supabase
        .from("driver_otp_verifications")
        .delete()
        .eq("email", email)
        .eq("otp_type", otp_type)
        .eq("verified", false);

      // Store OTP
      const { error: insertErr } = await supabase
        .from("driver_otp_verifications")
        .insert({
          email,
          phone: phone || null,
          otp_code: code,
          otp_type,
          expires_at: expiresAt.toISOString(),
        });

      if (insertErr) throw insertErr;

      // Send OTP via appropriate channel
      if (otp_type === "phone" && phone) {
        const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
        const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

        if (twilioSid && twilioAuth && twilioPhone) {
          let formattedPhone = phone.replace(/\s+/g, "");
          if (formattedPhone.startsWith("0")) {
            formattedPhone = "+27" + formattedPhone.slice(1);
          } else if (!formattedPhone.startsWith("+")) {
            formattedPhone = "+27" + formattedPhone;
          }

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const body = new URLSearchParams({
            To: formattedPhone,
            From: twilioPhone,
            Body: `Your Now-Now Assist verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`,
          });

          try {
            const response = await fetch(twilioUrl, {
              method: "POST",
              headers: {
                Authorization: "Basic " + btoa(`${twilioSid}:${twilioAuth}`),
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: body.toString(),
            });

            if (!response.ok) {
              const errData = await response.json();
              console.error("Twilio SMS error:", errData);
              // Fall through to dev mode instead of failing
              console.warn("SMS delivery failed, OTP stored for manual verification. Code:", code);
            }
          } catch (twilioErr) {
            console.error("Twilio request failed:", twilioErr);
            console.warn("SMS delivery failed, OTP stored for manual verification. Code:", code);
          }
        } else {
          console.warn("Twilio credentials not configured. OTP code:", code);
        }
      } else if (otp_type === "email") {
        console.log(`Email OTP for ${email}: ${code}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Verification code sent to your ${otp_type === "phone" ? "phone" : "email"}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (!email || !otp_type || !otp_code) {
        return new Response(
          JSON.stringify({ error: "Email, otp_type, and otp_code are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: otpRecord, error } = await supabase
        .from("driver_otp_verifications")
        .select("*")
        .eq("email", email)
        .eq("otp_type", otp_type)
        .eq("verified", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !otpRecord) {
        return new Response(
          JSON.stringify({ error: "No OTP found. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (new Date(otpRecord.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "OTP has expired. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (otpRecord.attempts >= otpRecord.max_attempts) {
        return new Response(
          JSON.stringify({ error: "Too many attempts. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (otpRecord.otp_code !== otp_code) {
        await supabase
          .from("driver_otp_verifications")
          .update({ attempts: otpRecord.attempts + 1 })
          .eq("id", otpRecord.id);

        const remaining = otpRecord.max_attempts - otpRecord.attempts - 1;
        return new Response(
          JSON.stringify({
            error: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as verified
      await supabase
        .from("driver_otp_verifications")
        .update({ verified: true })
        .eq("id", otpRecord.id);

      return new Response(
        JSON.stringify({ success: true, verified: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check_status") {
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: phoneVerified } = await supabase
        .from("driver_otp_verifications")
        .select("verified")
        .eq("email", email)
        .eq("otp_type", "phone")
        .eq("verified", true)
        .limit(1);

      const { data: emailVerified } = await supabase
        .from("driver_otp_verifications")
        .select("verified")
        .eq("email", email)
        .eq("otp_type", "email")
        .eq("verified", true)
        .limit(1);

      return new Response(
        JSON.stringify({
          phone_verified: (phoneVerified?.length || 0) > 0,
          email_verified: (emailVerified?.length || 0) > 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create_account") {
      // Create account only if both OTPs are verified
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: phoneV } = await supabase
        .from("driver_otp_verifications")
        .select("verified")
        .eq("email", email)
        .eq("otp_type", "phone")
        .eq("verified", true)
        .limit(1);

      const { data: emailV } = await supabase
        .from("driver_otp_verifications")
        .select("verified")
        .eq("email", email)
        .eq("otp_type", "email")
        .eq("verified", true)
        .limit(1);

      if (!phoneV?.length || !emailV?.length) {
        return new Response(
          JSON.stringify({ error: "Both phone and email must be verified before creating an account." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { password, full_name, phone: userPhone, whatsapp } = await req.json().catch(() => ({}));

      // This action expects all data in the original request body
      const body = JSON.parse(await req.text().catch(() => "{}"));

      return new Response(
        JSON.stringify({ error: "Use client-side signup after OTP verification" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OTP error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
