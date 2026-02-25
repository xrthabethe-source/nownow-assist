import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type VerificationStatus = "not_started" | "submitted" | "pending_review" | "approved" | "rejected";
export type DocStatus = "pending" | "approved" | "rejected";

export interface DriverVerification {
  id: string;
  driver_id: string;
  status: VerificationStatus;
  submitted_at: string | null;
  approved_at: string | null;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  id_doc_type: string | null;
  id_doc_file_url: string | null;
  id_doc_status: DocStatus;
  id_doc_rejection_reason: string | null;
  id_doc_upload_count: number;
  license_file_url: string | null;
  license_status: DocStatus;
  license_rejection_reason: string | null;
  license_upload_count: number;
  profile_photo_url: string | null;
  profile_photo_status: DocStatus;
  profile_photo_rejection_reason: string | null;
  profile_photo_upload_count: number;
  background_check_url: string | null;
  background_check_status: DocStatus;
  background_check_rejection_reason: string | null;
  background_check_upload_count: number;
  bg_consent_given: boolean;
  bg_full_name: string | null;
  bg_id_number: string | null;
  bg_date_of_birth: string | null;
  fraud_risk_score: number;
  fraud_flags: string[];
  verified_at: string | null;
  verified_badge_active: boolean;
  audit_log: any[];
  created_at: string;
  updated_at: string;
}

export function useDriverVerification(driverId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: verification, isLoading } = useQuery({
    queryKey: ["driver-verification", driverId],
    queryFn: async () => {
      if (!driverId) return null;
      const { data, error } = await supabase
        .from("driver_verifications" as any)
        .select("*")
        .eq("driver_id", driverId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DriverVerification | null;
    },
    enabled: !!driverId,
  });

  const initVerification = useMutation({
    mutationFn: async () => {
      if (!driverId) throw new Error("No driver ID");
      const { data, error } = await supabase
        .from("driver_verifications" as any)
        .insert({ driver_id: driverId, status: "not_started" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["driver-verification", driverId] }),
  });

  const uploadDocument = useMutation({
    mutationFn: async ({ file, docType }: { file: File; docType: "id_doc" | "license" | "profile_photo" | "background_check" }) => {
      if (!driverId) throw new Error("No driver ID");

      // Validate file
      const allowedTypes = docType === "profile_photo"
        ? ["image/jpeg", "image/png"]
        : ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File must be less than 10MB");
      }

      // Compute simple hash for duplicate detection
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Upload to storage
      const ext = file.name.split(".").pop();
      const filePath = `${driverId}/${docType}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("driver-documents")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("driver-documents")
        .getPublicUrl(filePath);
      const fileUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Calculate fraud flags
      const fraudFlags: string[] = [];
      let fraudScore = 0;

      // Check for duplicate hash across other drivers
      const { data: duplicates } = await supabase
        .from("driver_verifications" as any)
        .select("driver_id")
        .eq(`${docType}_file_hash`, fileHash)
        .neq("driver_id", driverId);
      if (duplicates && duplicates.length > 0) {
        fraudFlags.push("duplicate_document");
        fraudScore += 40;
      }

      // Check image quality (basic heuristic: small file for an image)
      if (file.type.startsWith("image/")) {
        if (file.size < 20000) {
          fraudFlags.push("low_quality");
          fraudScore += 15;
        }
        if (file.size < 50000 && file.size > 0) {
          fraudFlags.push("possible_blur");
          fraudScore += 10;
        }
      }

      // Get current verification
      const { data: current } = await supabase
        .from("driver_verifications" as any)
        .select("*")
        .eq("driver_id", driverId)
        .single();

      const currentUploadCount = current ? (current as any)[`${docType}_upload_count`] || 0 : 0;
      const newUploadCount = currentUploadCount + 1;
      if (newUploadCount > 3) {
        fraudFlags.push("excessive_resubmissions");
        fraudScore += 20;
      }

      // Merge fraud flags with existing
      const existingFlags: string[] = current ? ((current as any).fraud_flags || []) : [];
      const mergedFlags = [...new Set([...existingFlags, ...fraudFlags])];
      const existingScore: number = current ? ((current as any).fraud_risk_score || 0) : 0;
      const newScore = Math.min(100, existingScore + fraudScore);

      // Build audit entry
      const auditEntry = {
        action: "document_uploaded",
        doc_type: docType,
        timestamp: new Date().toISOString(),
        fraud_flags: fraudFlags,
        upload_count: newUploadCount,
      };
      const existingAudit: any[] = current ? ((current as any).audit_log || []) : [];

      // Update verification record
      const updateData: any = {
        [`${docType}_file_url`]: fileUrl,
        [`${docType}_status`]: "pending",
        [`${docType}_rejection_reason`]: null,
        [`${docType}_file_hash`]: fileHash,
        [`${docType}_upload_count`]: newUploadCount,
        fraud_risk_score: newScore,
        fraud_flags: mergedFlags,
        audit_log: [...existingAudit, auditEntry],
      };

      const { error: updateError } = await supabase
        .from("driver_verifications" as any)
        .update(updateData)
        .eq("driver_id", driverId);
      if (updateError) throw updateError;

      return { fileUrl, fraudFlags };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["driver-verification", driverId] });
      toast({ title: "Document uploaded", description: `Your ${variables.docType.replace("_", " ")} has been uploaded.` });
    },
    onError: (error: any) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const submitForReview = useMutation({
    mutationFn: async () => {
      if (!driverId) throw new Error("No driver ID");
      const auditEntry = { action: "submitted_for_review", timestamp: new Date().toISOString() };
      const existingAudit: any[] = verification?.audit_log || [];

      const { error } = await supabase
        .from("driver_verifications" as any)
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          audit_log: [...existingAudit, auditEntry],
        })
        .eq("driver_id", driverId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-verification", driverId] });
      toast({ title: "Submitted for review", description: "Your documents are now pending admin review." });
    },
    onError: (error: any) => {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    },
  });

  const isVerified = verification?.status === "approved" && verification?.verified_badge_active;
  const canGoOnline = verification?.status === "approved";

  const completionItems = [
    { key: "id_doc", label: "ID Document", status: verification?.id_doc_status || "pending", hasFile: !!verification?.id_doc_file_url, rejection: verification?.id_doc_rejection_reason },
    { key: "license", label: "Driver's Licence", status: verification?.license_status || "pending", hasFile: !!verification?.license_file_url, rejection: verification?.license_rejection_reason },
    { key: "profile_photo", label: "Profile Photo", status: verification?.profile_photo_status || "pending", hasFile: !!verification?.profile_photo_url, rejection: verification?.profile_photo_rejection_reason },
    { key: "background_check", label: "Background Check", status: verification?.background_check_status || "pending", hasFile: !!verification?.background_check_url || !!verification?.bg_consent_given, rejection: verification?.background_check_rejection_reason },
  ];

  const allUploaded = completionItems.every(item => item.hasFile);
  const canSubmit = allUploaded && (!verification || verification.status === "not_started" || verification.status === "rejected");

  return {
    verification,
    isLoading,
    isVerified,
    canGoOnline,
    completionItems,
    allUploaded,
    canSubmit,
    initVerification,
    uploadDocument,
    submitForReview,
  };
}
