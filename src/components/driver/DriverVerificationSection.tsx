import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useDriverVerification, type DocStatus } from "@/hooks/useDriverVerification";
import {
  Shield, Upload, CheckCircle2, XCircle, Clock, AlertTriangle,
  FileText, Camera, CreditCard, UserCheck, Loader2, Eye, RefreshCw, BadgeCheck,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Props {
  driverId: string | null;
}

const docTypeLabels: Record<string, { label: string; icon: React.ReactNode; accept: string; hint: string }> = {
  id_doc: { label: "ID Document", icon: <CreditCard className="h-5 w-5" />, accept: ".jpg,.jpeg,.png,.pdf", hint: "ID Card or Passport • JPG/PNG/PDF • Max 10MB" },
  license: { label: "Driver's Licence", icon: <FileText className="h-5 w-5" />, accept: ".jpg,.jpeg,.png,.pdf", hint: "Mandatory • JPG/PNG/PDF • Max 10MB" },
  profile_photo: { label: "Profile Photo", icon: <Camera className="h-5 w-5" />, accept: ".jpg,.jpeg,.png", hint: "Clear face photo • JPG/PNG • Max 10MB" },
  background_check: { label: "Background Check", icon: <UserCheck className="h-5 w-5" />, accept: ".jpg,.jpeg,.png,.pdf", hint: "Certificate/document • JPG/PNG/PDF • Max 10MB" },
};

function getStatusIcon(status: DocStatus) {
  switch (status) {
    case "approved": return <CheckCircle2 className="h-5 w-5 text-success" />;
    case "rejected": return <XCircle className="h-5 w-5 text-destructive" />;
    default: return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "not_started": return <StatusBadge variant="offline">Not Started</StatusBadge>;
    case "submitted": return <StatusBadge variant="warning">Submitted</StatusBadge>;
    case "pending_review": return <StatusBadge variant="pending" pulse>Pending Review</StatusBadge>;
    case "approved": return <StatusBadge variant="success">Approved</StatusBadge>;
    case "rejected": return <StatusBadge variant="destructive">Rejected</StatusBadge>;
    default: return <StatusBadge variant="offline">Not Started</StatusBadge>;
  }
}

export function DriverVerificationSection({ driverId }: Props) {
  const {
    verification, isLoading, isVerified, completionItems, allUploaded, canSubmit,
    initVerification, uploadDocument, submitForReview,
  } = useDriverVerification(driverId);

  const [idDocType, setIdDocType] = useState<string>("id_card");
  const [bgConsent, setBgConsent] = useState(false);
  const [bgFullName, setBgFullName] = useState("");
  const [bgIdNumber, setBgIdNumber] = useState("");
  const [bgDob, setBgDob] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (isLoading) {
    return (
      <Card variant="default">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Initialize verification record if doesn't exist
  if (!verification && driverId) {
    return (
      <Card variant="default">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Verification & Trust
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Complete identity verification to start accepting jobs. You must be verified before going online.
          </p>
          <Button variant="amber" onClick={() => initVerification.mutate()} disabled={initVerification.isPending}>
            {initVerification.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Start Verification
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!verification) return null;

  const completedCount = completionItems.filter(i => i.hasFile).length;
  const approvedCount = completionItems.filter(i => i.status === "approved").length;
  const progress = (completedCount / 4) * 100;

  const handleFileUpload = (docType: string) => {
    fileInputRefs.current[docType]?.click();
  };

  const handleFileChange = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadDocument.mutateAsync({ file, docType: docType as any });
    e.target.value = "";
  };

  const handleSaveBgConsent = async () => {
    if (!driverId) return;
    const { supabase } = await import("@/integrations/supabase/client");
    await (supabase as any).from("driver_verifications")
      .update({
        bg_consent_given: bgConsent,
        bg_full_name: bgFullName,
        bg_id_number: bgIdNumber,
        bg_date_of_birth: bgDob || null,
      })
      .eq("driver_id", driverId);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header Card */}
      <Card variant={isVerified ? "success" : "default"}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {isVerified ? <BadgeCheck className="h-5 w-5 text-success" /> : <Shield className="h-5 w-5 text-primary" />}
              Verification & Trust
            </CardTitle>
            {getStatusBadge(verification.status)}
          </div>
        </CardHeader>
        <CardContent>
          {isVerified && verification.verified_at && (
            <p className="text-sm text-success mb-3">
              ✓ Verified since {new Date(verification.verified_at).toLocaleDateString()}
            </p>
          )}
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium text-foreground">{completedCount}/4 items</span>
          </div>
          <Progress value={progress} className="h-2" />
          {verification.status !== "approved" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Complete all items and submit for review to start accepting jobs.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Checklist Items */}
      {Object.entries(docTypeLabels).map(([key, meta]) => {
        const item = completionItems.find(i => i.key === key);
        if (!item) return null;
        const isRejected = item.status === "rejected";
        const canReupload = isRejected || !item.hasFile;

        return (
          <Card key={key} variant={isRejected ? "destructive" : item.status === "approved" ? "success" : "default"} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    item.status === "approved" ? "bg-success/15 text-success" :
                    isRejected ? "bg-destructive/15 text-destructive" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {meta.icon}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">{meta.hint}</p>
                  </div>
                </div>
                {getStatusIcon(item.status as DocStatus)}
              </div>

              {/* ID doc type selector */}
              {key === "id_doc" && canReupload && (
                <div className="mb-3">
                  <Label className="text-xs">Document Type</Label>
                  <Select value={idDocType} onValueChange={setIdDocType}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id_card">ID Card</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Rejection reason */}
              {isRejected && item.rejection && (
                <div className="mb-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Rejected</p>
                    <p className="text-xs text-destructive/80">{item.rejection}</p>
                  </div>
                </div>
              )}

              {/* Preview if uploaded */}
              {item.hasFile && !canReupload && (
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>Document uploaded</span>
                </div>
              )}

              {/* Upload / Re-upload button */}
              {canReupload && (
                <>
                  <input
                    type="file"
                    ref={(el) => { fileInputRefs.current[key] = el; }}
                    accept={meta.accept}
                    className="hidden"
                    onChange={(e) => handleFileChange(key, e)}
                  />
                  <Button
                    variant={isRejected ? "destructive" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => handleFileUpload(key)}
                    disabled={uploadDocument.isPending}
                  >
                    {uploadDocument.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isRejected ? (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {isRejected ? "Re-upload" : "Upload"}
                  </Button>
                </>
              )}

              {/* Background check consent form */}
              {key === "background_check" && canReupload && (
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  <p className="text-xs font-medium text-muted-foreground">OR provide consent for admin screening:</p>
                  <div className="space-y-2">
                    <Input placeholder="Full Name" value={bgFullName} onChange={e => setBgFullName(e.target.value)} className="h-9 text-sm" />
                    <Input placeholder="ID Number" value={bgIdNumber} onChange={e => setBgIdNumber(e.target.value)} className="h-9 text-sm" />
                    <Input type="date" placeholder="Date of Birth" value={bgDob} onChange={e => setBgDob(e.target.value)} className="h-9 text-sm" />
                    <div className="flex items-center gap-2">
                      <Checkbox id="bg-consent" checked={bgConsent} onCheckedChange={(v) => setBgConsent(!!v)} />
                      <Label htmlFor="bg-consent" className="text-xs">I consent to a background check</Label>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSaveBgConsent} disabled={!bgConsent || !bgFullName || !bgIdNumber}>
                      Save Consent
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Submit Button */}
      {canSubmit && (
        <Button
          variant="amber"
          className="w-full"
          onClick={() => submitForReview.mutate()}
          disabled={submitForReview.isPending || !allUploaded}
        >
          {submitForReview.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
          Submit for Review
        </Button>
      )}

      {verification.status === "submitted" && (
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="font-medium text-foreground">Under Review</p>
            <p className="text-sm text-muted-foreground">Your documents are being reviewed. We'll notify you once complete.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
