import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignupData {
  name: string;
  surname: string;
  cellphone: string;
  whatsapp: string;
  email: string;
  password: string;
}

export default function DriverSignUpPhoneVerify() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [signupData, setSignupData] = useState<SignupData | null>(null);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sent, setSent] = useState(false);

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
          phone: signupData.cellphone,
          otp_type: "phone",
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setSent(true);
      setCountdown(60);
      toast({ title: "OTP Sent", description: `Verification code sent to ${signupData.cellphone}` });
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  }, [signupData, countdown, toast]);

  // Auto-send on mount
  useEffect(() => {
    if (signupData && !sent) {
      sendOtp();
    }
  }, [signupData, sent, sendOtp]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 5 || !signupData) return;
    setVerifying(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("driver-otp", {
        body: {
          action: "verify",
          email: signupData.email,
          otp_type: "phone",
          otp_code: otp,
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      if (data?.verified) {
        toast({ title: "Phone Verified!", description: "Your phone number has been verified." });
        navigate("/driver/signup/verify-email");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
      setOtp("");
    } finally {
      setVerifying(false);
    }
  };

  if (!signupData) return null;

  const maskedPhone = signupData.cellphone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Logo size="md" />
          <h1 className="text-2xl font-bold text-foreground">Verify Phone Number</h1>
          <p className="text-sm text-muted-foreground">Step 2 of 4 — Phone Verification</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" /> SMS Verification
              </CardTitle>
              <button onClick={() => navigate("/driver/signup")} className="text-sm text-primary flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground text-center">
              We've sent a 5-digit verification code to <span className="font-medium text-foreground">{maskedPhone}</span>
            </p>

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

            <Button className="w-full" onClick={handleVerify} disabled={otp.length !== 5 || verifying}>
              {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify Phone Number
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={sendOtp}
                disabled={countdown > 0 || sending}
                className="text-muted-foreground"
              >
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${sending ? "animate-spin" : ""}`} />
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
              </Button>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-2 justify-center pt-2">
              <div className="h-2 w-8 rounded-full bg-primary" />
              <div className="h-2 w-8 rounded-full bg-primary" />
              <div className="h-2 w-8 rounded-full bg-muted" />
              <div className="h-2 w-8 rounded-full bg-muted" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
