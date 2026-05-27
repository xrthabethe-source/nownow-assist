import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/Logo";
import { ArrowRight, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function DriverSignUp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [cellphone, setCellphone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!surname.trim()) e.surname = "Surname is required";
    if (!cellphone.trim()) e.cellphone = "Cellphone number is required";
    else if (!/^(\+27|0)\d{9}$/.test(cellphone.replace(/\s/g, "")))
      e.cellphone = "Enter a valid SA phone number (e.g. 071 234 5678)";
    if (!email.trim()) e.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(password)) e.password = "Password must include an uppercase letter";
    else if (!/[0-9]/.test(password)) e.password = "Password must include a number";
    else if (!/[!@#$%^&*]/.test(password)) e.password = "Password must include a special character";
    if (!confirmPassword) e.confirmPassword = "Confirm password is required";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast({
        title: "Please fix the errors below",
        description: "Some fields are missing or invalid.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);

    try {
      const fullName = `${name.trim()} ${surname.trim()}`;

      // 1. Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
            account_type: "driver",
          },
        },
      });

      if (authError) {
        if (authError.message?.includes("already registered")) {
          throw new Error("This email is already registered. Please sign in instead.");
        }
        throw authError;
      }

      const userId = authData.user?.id;
      if (!userId) throw new Error("Account creation failed");

      // Check for fake signup (email already exists)
      if (authData.user?.identities && authData.user.identities.length === 0) {
        throw new Error("This email is already registered. Please sign in instead.");
      }

      // Wait for trigger to create profile + role
      await new Promise((r) => setTimeout(r, 2000));

      // 2. Update profile with phone
      await supabase.from("profiles").update({
        phone: cellphone.trim(),
        full_name: fullName,
      }).eq("id", userId);

      // 3. Ensure driver record exists
      const { data: existingDriver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingDriver) {
        await supabase.from("drivers").insert({
          user_id: userId,
          status: "pending",
          whatsapp_number: cellphone.trim(),
        });
      }

      // 4. Create verification record
      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (driver) {
        const { data: existingVerification } = await supabase
          .from("driver_verifications" as any)
          .select("id")
          .eq("driver_id", driver.id)
          .maybeSingle();

        if (!existingVerification) {
          await supabase.from("driver_verifications" as any).insert({
            driver_id: driver.id,
            status: "not_started",
          });
        }
      }

      setSuccess(true);
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account, then sign in.",
      });
    } catch (err: any) {
      toast({
        title: "Signup failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center space-y-6"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Account Created!</h1>
          <p className="text-muted-foreground leading-relaxed">
            We've sent a verification email to <strong>{email}</strong>. 
            Please verify your email, then sign in to access your Driver Portal 
            where you'll upload your documents and complete onboarding.
          </p>
          <Button onClick={() => navigate("/auth")} className="w-full">
            Go to Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <Logo size="md" />
          <h1 className="text-2xl font-bold text-foreground">Become a Driver</h1>
          <p className="text-sm text-muted-foreground">
            Create your account to get started. You'll upload documents after signing in.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Create Your Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                <Input id="name" placeholder="First name" value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="surname">Surname <span className="text-destructive">*</span></Label>
                <Input id="surname" placeholder="Last name" value={surname} onChange={(e) => setSurname(e.target.value)} />
                {errors.surname && <p className="text-xs text-destructive">{errors.surname}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cellphone">Cellphone Number <span className="text-destructive">*</span></Label>
              <Input id="cellphone" type="tel" placeholder="e.g. 071 234 5678" value={cellphone} onChange={(e) => setCellphone(e.target.value)} />
              {errors.cellphone && <p className="text-xs text-destructive">{errors.cellphone}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password" type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              <p className="text-xs text-muted-foreground">Min 8 chars, uppercase, number, special character</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
              <Input
                id="confirmPassword" type={showPassword ? "text" : "password"}
                placeholder="Confirm your password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</>
              ) : (
                <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{" "}
              <button onClick={() => navigate("/auth")} className="text-primary font-medium underline underline-offset-2">
                Sign in
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
