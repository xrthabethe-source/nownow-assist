import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/shared/Logo";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Upload, CheckCircle2, FileText, ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface Step1Data {
  name: string;
  surname: string;
  email: string;
}

type DocKey = "id_document" | "drivers_licence" | "profile_photo" | "vehicle_inspection" | "vehicle_registration" | "background_check";

const DOC_LABELS: Record<DocKey, string> = {
  id_document: "ID / Passport",
  drivers_licence: "Driver's Licence",
  profile_photo: "Profile Photo",
  vehicle_inspection: "Vehicle Inspection Report",
  vehicle_registration: "Vehicle Registration Documents",
  background_check: "Background Check Certificate",
};

export default function DriverSignUpStep2() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRefs = useRef<Record<DocKey, HTMLInputElement | null>>({
    id_document: null,
    drivers_licence: null,
    profile_photo: null,
    vehicle_inspection: null,
    vehicle_registration: null,
    background_check: null,
  });

  const [step1, setStep1] = useState<Step1Data | null>(null);
  const [cellphone, setCellphone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sameAsCellphone, setSameAsCellphone] = useState(false);
  const [licenceType, setLicenceType] = useState("");
  const [files, setFiles] = useState<Record<DocKey, File | null>>({
    id_document: null,
    drivers_licence: null,
    profile_photo: null,
    vehicle_inspection: null,
    vehicle_registration: null,
    background_check: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("driver_signup_step1");
    if (!raw) {
      navigate("/driver/signup");
      return;
    }
    setStep1(JSON.parse(raw));
  }, [navigate]);

  useEffect(() => {
    if (sameAsCellphone) setWhatsapp(cellphone);
  }, [sameAsCellphone, cellphone]);

  const handleFileSelect = (key: DocKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload PDF, JPG, or PNG.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Max file size is 10MB.", variant: "destructive" });
      return;
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!cellphone.trim()) e.cellphone = "Cellphone number is required";
    if (!sameAsCellphone && !whatsapp.trim()) e.whatsapp = "WhatsApp number is required";
    if (!licenceType) e.licenceType = "Select a licence type";
    for (const key of Object.keys(DOC_LABELS) as DocKey[]) {
      if (!files[key]) e[key] = `${DOC_LABELS[key]} is required`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !step1) return;
    setSubmitting(true);

    try {
      // 1. Create auth account (driver role)
      const password = crypto.randomUUID().slice(0, 16) + "Aa1!";
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: step1.email,
        password,
        options: {
          data: {
            full_name: `${step1.name} ${step1.surname}`,
            account_type: "driver",
          },
        },
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Account creation failed");

      // 2. Wait briefly for trigger to create profile + driver record
      await new Promise((r) => setTimeout(r, 2000));

      // 3. Get the driver record
      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      // If no driver record from trigger, create one
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

      // 4. Update profile with phone
      await supabase
        .from("profiles")
        .update({
          phone: cellphone.trim(),
          full_name: `${step1.name} ${step1.surname}`,
        })
        .eq("id", userId);

      // 5. Upload documents
      for (const key of Object.keys(DOC_LABELS) as DocKey[]) {
        const file = files[key]!;
        const ext = file.name.split(".").pop();
        const filePath = `${driverId}/${key}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("driver-documents")
          .upload(filePath, file, { upsert: true });
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from("driver-documents")
          .getPublicUrl(filePath);

        // Update the driver record with document URLs
        const updateMap: Record<DocKey, string> = {
          id_document: "id_document_url",
          drivers_licence: "license_document_url",
          profile_photo: "profile_photo_url",
          vehicle_inspection: "vehicle_registration_url",
          vehicle_registration: "vehicle_registration_url",
          background_check: "vehicle_registration_url",
        };
        await supabase
          .from("drivers")
          .update({
            [updateMap[key]]: urlData.publicUrl,
            status: "pending",
            documents_submitted_at: new Date().toISOString(),
          })
          .eq("id", driverId);
      }

      // 6. Also update licence type info
      await supabase
        .from("drivers")
        .update({
          vehicle_type: licenceType,
          status: "pending",
          documents_submitted_at: new Date().toISOString(),
        })
        .eq("id", driverId);

      // 7. Create verification record
      await supabase
        .from("driver_verifications" as any)
        .insert({
          driver_id: driverId,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          id_doc_file_url: "uploaded",
          license_file_url: "uploaded",
          background_check_url: "uploaded",
        });

      // Clean up session
      sessionStorage.removeItem("driver_signup_step1");
      setSubmitted(true);
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!step1) return null;

  if (submitted) {
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
          <h1 className="text-2xl font-bold text-foreground">Thank You!</h1>
          <p className="text-muted-foreground leading-relaxed">
            Your documents have been submitted and are under review.
            We will contact you once verification is complete.
          </p>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Go to Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <Logo size="md" />
          <h1 className="text-2xl font-bold text-foreground">Driver Details</h1>
          <p className="text-sm text-muted-foreground">
            Complete your profile and upload required documents.
          </p>
        </div>

        {/* Personal Details */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Step 2 of 2 — Details & Documents</CardTitle>
              <button
                onClick={() => navigate("/driver/signup")}
                className="text-sm text-primary flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Read-only name/surname from step 1 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={step1.name} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label>Surname</Label>
                <Input value={step1.surname} disabled className="bg-muted" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cellphone">Cellphone Number <span className="text-destructive">*</span></Label>
              <Input
                id="cellphone"
                type="tel"
                placeholder="e.g. 071 234 5678"
                value={cellphone}
                onChange={(e) => setCellphone(e.target.value)}
              />
              {errors.cellphone && <p className="text-xs text-destructive">{errors.cellphone}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp">WhatsApp Number <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="same-cell"
                    checked={sameAsCellphone}
                    onCheckedChange={(v) => setSameAsCellphone(!!v)}
                  />
                  <Label htmlFor="same-cell" className="text-xs font-normal text-muted-foreground cursor-pointer">
                    Same as cellphone
                  </Label>
                </div>
              </div>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="e.g. 071 234 5678"
                value={sameAsCellphone ? cellphone : whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={sameAsCellphone}
                className={sameAsCellphone ? "bg-muted" : ""}
              />
              {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Licence Type <span className="text-destructive">*</span></Label>
              <Select value={licenceType} onValueChange={setLicenceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select licence type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="motor_vehicle">Motor Vehicle Licence</SelectItem>
                  <SelectItem value="motorbike">Motorbike Licence</SelectItem>
                </SelectContent>
              </Select>
              {errors.licenceType && <p className="text-xs text-destructive">{errors.licenceType}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Document Uploads */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Document Uploads</CardTitle>
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG • Max 10MB each
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(DOC_LABELS) as DocKey[]).map((key) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-sm">
                  {DOC_LABELS[key]} <span className="text-destructive">*</span>
                </Label>
                <input
                  type="file"
                  ref={(el) => { fileRefs.current[key] = el; }}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileSelect(key, e)}
                />
                <Button
                  type="button"
                  variant={files[key] ? "outline" : "outline"}
                  size="sm"
                  className={`w-full justify-start gap-2 ${
                    files[key]
                      ? "border-success/50 text-success"
                      : errors[key]
                      ? "border-destructive/50 text-destructive"
                      : ""
                  }`}
                  onClick={() => fileRefs.current[key]?.click()}
                >
                  {files[key] ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {files[key]!.name.length > 30
                        ? files[key]!.name.slice(0, 27) + "..."
                        : files[key]!.name}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload {DOC_LABELS[key].split("/")[0].trim()}
                    </>
                  )}
                </Button>
                {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Submit Application
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground pb-4">
          All documents are stored securely and reviewed by our team.
        </p>
      </motion.div>
    </div>
  );
}
