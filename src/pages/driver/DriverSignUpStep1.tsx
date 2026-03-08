import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/Logo";
import { ArrowRight, Loader2 } from "lucide-react";

export default function DriverSignUpStep1() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!surname.trim()) e.surname = "Surname is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    setLoading(true);
    // Store in session and navigate to step 2
    sessionStorage.setItem(
      "driver_signup_step1",
      JSON.stringify({ name: name.trim(), surname: surname.trim(), email: email.trim().toLowerCase() })
    );
    navigate("/driver/signup/step2");
  };

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
            Join Now-Now Assist and start earning. Let's get you set up.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Step 1 of 2 — Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="Enter your first name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="surname">Surname <span className="text-destructive">*</span></Label>
              <Input
                id="surname"
                placeholder="Enter your surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
              />
              {errors.surname && <p className="text-xs text-destructive">{errors.surname}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <Button
              className="w-full"
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/auth")}
                className="text-primary font-medium underline underline-offset-2"
              >
                Sign in
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
