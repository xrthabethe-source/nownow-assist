import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/shared/Logo";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

export default function DriverSignUpStep1() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [cellphone, setCellphone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sameAsCellphone, setSameAsCellphone] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!surname.trim()) e.surname = "Surname is required";
    if (!cellphone.trim()) e.cellphone = "Cellphone number is required";
    else if (!/^(\+27|0)\d{9}$/.test(cellphone.replace(/\s/g, "")))
      e.cellphone = "Enter a valid SA phone number";
    if (!sameAsCellphone && !whatsapp.trim()) e.whatsapp = "WhatsApp number is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Min 8 characters";
    else if (!/[A-Z]/.test(password)) e.password = "Must include an uppercase letter";
    else if (!/[0-9]/.test(password)) e.password = "Must include a number";
    else if (!/[!@#$%^&*]/.test(password)) e.password = "Must include a special character";
    if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    sessionStorage.setItem(
      "driver_signup_data",
      JSON.stringify({
        name: name.trim(),
        surname: surname.trim(),
        cellphone: cellphone.trim(),
        whatsapp: sameAsCellphone ? cellphone.trim() : whatsapp.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
    );
    navigate("/driver/signup/verify-phone");
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
            <CardTitle className="text-lg">Step 1 — Your Details</CardTitle>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp">WhatsApp Number <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="same-cell" checked={sameAsCellphone} onCheckedChange={(v) => setSameAsCellphone(!!v)} />
                  <Label htmlFor="same-cell" className="text-xs font-normal text-muted-foreground cursor-pointer">Same as cellphone</Label>
                </div>
              </div>
              <Input
                id="whatsapp" type="tel" placeholder="e.g. 071 234 5678"
                value={sameAsCellphone ? cellphone : whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={sameAsCellphone}
                className={sameAsCellphone ? "bg-muted" : ""}
              />
              {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp}</p>}
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

            <Button className="w-full" onClick={handleNext}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
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
