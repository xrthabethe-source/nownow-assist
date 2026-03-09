import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignupData {
  name: string;
  surname: string;
  cellphone: string;
  whatsapp: string;
  email: string;
  password: string;
}

export default function DriverSignUpEmailVerify() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [signupData, setSignupData] = useState<SignupData | null>(null);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sent, setSent] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("driver_signup_data");
    if (!raw) {
      navigate("/driver/signup");
      return;
    }
    setSignupData(JSON.parse(raw));
  }, [navigate]);

  const sendOtp = useCallback(async () => {
    if (!signupData || countdown > 0) return;
    setSending(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("driver-otp", {
        body: {
          action: "send",
          email: signupData.email,
          otp_type: "email",
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setSent(true);
      setCountdown(60);
      toast({ title: "OTP Sent", description: `Verification code sent to ${signupData.email}` });
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  }, [signupData, countdown, toast]);

  useEffect(() => {
    if (signupData && !sent) {
      sendOtp();
    }
  }, [signupData, sent, sendOtp]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const createAccount = async () => {
    if (!signupData) return;
    setCreating(true);
    try {
      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: `${signupData.name} ${signupData.surname}`,
            account_type: "driver",
          },
        },
      });
      if (authError) throw authError;
      if (!authData.user?.id) throw new Error("Account creation failed");

      // Check for fake signup
      if (authData.user?.identities && authData.user.identities.length === 0) {
        throw new Error("An account with this email already exists.");
      }

      // Wait for trigger to create profile + driver record
      await new Promise((r) => setTimeout(r, 2000));

      const userId = authData.user.id;

      // Update profile with phone
      await supabase
        .from("profiles")
        .update({
          phone: signupData.cellphone,
          full_name: `${signupData.name} ${signupData.surname}`,
        })
        .eq("id", userId);

      // Get driver record and update verification flags
      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      let driverId = driver?.id;
      if (!driverId) {
        const { data: newDriver, error: driverErr } = await supabase
          .from("drivers")
          .insert({ user_id: userId, status: "pending" })
          .select("id")
          .single();
        if (driverErr) throw driverErr;
        driverId = newDriver.id;
      }

      // Update driver with verification flags
      await supabase
        .from("drivers")
        .update({
          phone_verified: true,
          email_verified: true,
          whatsapp_number: signupData.whatsapp,
          status: "pending",
        })
        .eq("id", driverId);

      // Create initial verification record
      await supabase
        .from("driver_verifications" as any)
        .insert({
          driver_id: driverId,
          status: "not_started",
        });

      // Sign out so they can sign in properly
      await supabase.auth.signOut();

      // Clean up session
      sessionStorage.removeItem("driver_signup_data");
      setAccountCreated(true);
    } catch (err: any) {
      setError(err.message || "Account creation failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 5 || !signupData) return;
    setVerifying(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("driver-otp", {
        body: {
          action: "verify",
          email: signupData.email,
          otp_type: "email",
          otp_code: otp,
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      if (data?.verified) {
        toast({ title: "Email Verified!", description: "Your email has been verified." });
        // Both verified — create account
        await createAccount();
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
      setOtp("");
    } finally {
      setVerifying(false);
    }
  };

  if (!signupData) return null;

  if (accountCreated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Account Created!</h1>
          <p className="text-muted-foreground leading-relaxed">
            Your account has been created successfully. Sign in to access your driver portal and complete your verification documents.
          </p>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => navigate("/auth")}>
              Sign In to Your Portal
            </Button>
            <p className="text-xs text-muted-foreground">
              You'll need to upload your documents before you can go online.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const maskedEmail = signupData.email.replace(/(.{2})(.*)(@)/, "$1***$3");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Logo size="md" />
          <h1 className="text-2xl font-bold text-foreground">Verify Email Address</h1>
          <p className="text-sm text-muted-foreground">Step 3 of 4 — Email Verification</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> Email Verification
              </CardTitle>
              <button onClick={() => navigate("/driver/signup/verify-phone")} className="text-sm text-primary flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">
                We've sent a 5-digit verification code to
              </p>
              <p className="font-medium text-foreground">{maskedEmail}</p>
            </div>

            <div className="flex justify-center">
              <InputOTP maxLength={5} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive text-center">
                {error}
              </motion.p>
            )}

            <Button className="w-full" onClick={handleVerify} disabled={otp.length !== 5 || verifying || creating}>
              {(verifying || creating) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {creating ? "Creating Account..." : "Verify & Create Account"}
            </Button>

            <div className="text-center">
              <Button
                variant="ghost" size="sm"
                onClick={sendOtp}
                disabled={countdown > 0 || sending}
                className="text-muted-foreground"
              >
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${sending ? "animate-spin" : ""}`} />
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
              </Button>
            </div>

            <div className="flex items-center gap-2 justify-center pt-2">
              <div className="h-2 w-8 rounded-full bg-primary" />
              <div className="h-2 w-8 rounded-full bg-primary" />
              <div className="h-2 w-8 rounded-full bg-primary" />
              <div className="h-2 w-8 rounded-full bg-muted" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
