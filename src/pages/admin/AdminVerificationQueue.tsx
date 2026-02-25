import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Shield, Search, Filter, Eye, CheckCircle2, XCircle, AlertTriangle,
  Clock, FileText, Camera, CreditCard, UserCheck, Loader2, BadgeCheck, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface VerificationRow {
  id: string;
  driver_id: string;
  status: string;
  submitted_at: string | null;
  fraud_risk_score: number;
  fraud_flags: string[];
  id_doc_file_url: string | null;
  id_doc_status: string;
  license_file_url: string | null;
  license_status: string;
  profile_photo_url: string | null;
  profile_photo_status: string;
  background_check_url: string | null;
  background_check_status: string;
  bg_consent_given: boolean;
  bg_full_name: string | null;
  bg_id_number: string | null;
  verified_badge_active: boolean;
  audit_log: any[];
  reviewer_notes: string | null;
  drivers?: {
    id: string;
    user_id: string;
    vehicle_plate: string | null;
    profiles?: { full_name: string | null; email: string | null } | null;
  };
}

const DOC_KEYS = [
  { key: "id_doc", label: "ID Document", icon: CreditCard },
  { key: "license", label: "Driver's Licence", icon: FileText },
  { key: "profile_photo", label: "Profile Photo", icon: Camera },
  { key: "background_check", label: "Background Check", icon: UserCheck },
] as const;

export default function AdminVerificationQueue() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedVerification, setSelectedVerification] = useState<VerificationRow | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [docNotes, setDocNotes] = useState<Record<string, string>>({});
  const [finalNotes, setFinalNotes] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: verifications, isLoading, refetch } = useQuery({
    queryKey: ["admin-verification-queue"],
    queryFn: async () => {
      // Fetch verifications
      const { data: vData, error } = await (supabase as any)
        .from("driver_verifications")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (error) throw error;

      // Fetch driver + profile info
      const driverIds = (vData || []).map((v: any) => v.driver_id);
      if (driverIds.length === 0) return [];

      const { data: drivers } = await supabase
        .from("drivers")
        .select("id, user_id, vehicle_plate")
        .in("id", driverIds);

      const userIds = (drivers || []).map(d => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      return (vData || []).map((v: any) => {
        const driver = drivers?.find(d => d.id === v.driver_id);
        const profile = profiles?.find(p => p.id === driver?.user_id);
        return { ...v, drivers: { ...driver, profiles: profile } } as VerificationRow;
      });
    },
  });

  const updateDocStatus = useMutation({
    mutationFn: async ({ verificationId, docKey, status, reason }: {
      verificationId: string; docKey: string; status: string; reason?: string;
    }) => {
      const updateData: any = {
        [`${docKey}_status`]: status,
        [`${docKey}_rejection_reason`]: status === "rejected" ? reason : null,
      };
      const { error } = await (supabase as any)
        .from("driver_verifications")
        .update(updateData)
        .eq("id", verificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verification-queue"] });
      toast({ title: "Document status updated" });
    },
  });

  const finalDecision = useMutation({
    mutationFn: async ({ verificationId, decision, notes }: {
      verificationId: string; decision: "approved" | "rejected"; notes: string;
    }) => {
      const updateData: any = {
        status: decision,
        reviewer_id: user?.id,
        reviewer_notes: notes,
      };
      if (decision === "approved") {
        updateData.approved_at = new Date().toISOString();
        updateData.verified_at = new Date().toISOString();
        updateData.verified_badge_active = true;
      }
      const { error } = await (supabase as any)
        .from("driver_verifications")
        .update(updateData)
        .eq("id", verificationId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-verification-queue"] });
      setReviewDialogOpen(false);
      toast({ title: `Driver ${vars.decision}`, description: vars.decision === "approved" ? "Verified badge activated." : "Driver notified of rejection." });
    },
  });

  const filtered = (verifications || []).filter((v: VerificationRow) => {
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (riskFilter === "high" && v.fraud_risk_score < 70) return false;
    if (riskFilter === "low" && v.fraud_risk_score >= 70) return false;
    if (searchQuery) {
      const name = v.drivers?.profiles?.full_name || "";
      const email = v.drivers?.profiles?.email || "";
      const q = searchQuery.toLowerCase();
      if (!name.toLowerCase().includes(q) && !email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = {
    total: verifications?.length || 0,
    pending: verifications?.filter((v: VerificationRow) => v.status === "submitted" || v.status === "pending_review").length || 0,
    highRisk: verifications?.filter((v: VerificationRow) => v.fraud_risk_score >= 70).length || 0,
    approved: verifications?.filter((v: VerificationRow) => v.status === "approved").length || 0,
  };

  const openReview = (v: VerificationRow) => {
    setSelectedVerification(v);
    setDocNotes({});
    setFinalNotes(v.reviewer_notes || "");
    setReviewDialogOpen(true);
  };

  const allDocsApproved = selectedVerification && DOC_KEYS.every(dk => {
    const status = (selectedVerification as any)[`${dk.key}_status`];
    return status === "approved";
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Driver Verification Queue
            </h1>
            <p className="text-muted-foreground">Review and approve driver identity documents</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, icon: Shield },
            { label: "Pending Review", value: stats.pending, icon: Clock, variant: "warning" as const },
            { label: "High Risk", value: stats.highRisk, icon: AlertTriangle, variant: "destructive" as const },
            { label: "Approved", value: stats.approved, icon: CheckCircle2, variant: "success" as const },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card variant="default">
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Risk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="high">High Risk (≥70)</SelectItem>
              <SelectItem value="low">Low Risk (&lt;70)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card variant="default">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No verifications found</TableCell></TableRow>
              ) : (
                filtered.map((v: VerificationRow) => (
                  <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openReview(v)}>
                    <TableCell>
                      <div>
                        <p className="font-medium flex items-center gap-1">
                          {v.drivers?.profiles?.full_name || "Unknown"}
                          {v.verified_badge_active && <BadgeCheck className="h-4 w-4 text-success" />}
                        </p>
                        <p className="text-xs text-muted-foreground">{v.drivers?.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {v.status === "submitted" && <StatusBadge variant="warning">Submitted</StatusBadge>}
                      {v.status === "pending_review" && <StatusBadge variant="pending" pulse>Pending</StatusBadge>}
                      {v.status === "approved" && <StatusBadge variant="success">Approved</StatusBadge>}
                      {v.status === "rejected" && <StatusBadge variant="destructive">Rejected</StatusBadge>}
                      {v.status === "not_started" && <StatusBadge variant="offline">Not Started</StatusBadge>}
                    </TableCell>
                    <TableCell className="text-sm">{v.submitted_at ? format(new Date(v.submitted_at), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${v.fraud_risk_score >= 70 ? "text-destructive" : v.fraud_risk_score >= 40 ? "text-warning" : "text-success"}`}>
                        {v.fraud_risk_score}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(v.fraud_flags || []).map((f: string) => (
                          <Badge key={f} variant="destructive" className="text-xs">{f.replace(/_/g, " ")}</Badge>
                        ))}
                        {(!v.fraud_flags || v.fraud_flags.length === 0) && <span className="text-xs text-muted-foreground">None</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {DOC_KEYS.map(dk => {
                          const status = (v as any)[`${dk.key}_status`];
                          return (
                            <div key={dk.key} className={`h-3 w-3 rounded-full ${
                              status === "approved" ? "bg-success" : status === "rejected" ? "bg-destructive" : "bg-muted-foreground/30"
                            }`} title={`${dk.label}: ${status}`} />
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openReview(v); }}>
                        <Eye className="mr-1 h-4 w-4" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Review: {selectedVerification?.drivers?.profiles?.full_name || "Driver"}
            </DialogTitle>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-4">
              {/* Fraud Score */}
              <Card variant={selectedVerification.fraud_risk_score >= 70 ? "destructive" : "default"}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Fraud Risk Score</p>
                      <p className={`text-3xl font-bold ${selectedVerification.fraud_risk_score >= 70 ? "text-destructive" : selectedVerification.fraud_risk_score >= 40 ? "text-warning" : "text-success"}`}>
                        {selectedVerification.fraud_risk_score}/100
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(selectedVerification.fraud_flags || []).map((f: string) => (
                        <Badge key={f} variant="destructive" className="text-xs">{f.replace(/_/g, " ")}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Background Check Consent Info */}
              {selectedVerification.bg_consent_given && (
                <Card variant="default">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Background Check Consent</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Name:</span> {selectedVerification.bg_full_name}</div>
                      <div><span className="text-muted-foreground">ID:</span> {selectedVerification.bg_id_number}</div>
                      <div><span className="text-muted-foreground">Consent:</span> <StatusBadge variant="success">Given</StatusBadge></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Document Review */}
              {DOC_KEYS.map(dk => {
                const fileUrl = (selectedVerification as any)[`${dk.key}_file_url`];
                const status = (selectedVerification as any)[`${dk.key}_status`];
                const Icon = dk.icon;

                return (
                  <Card key={dk.key} variant="default">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{dk.label}</span>
                        </div>
                        {status === "approved" && <StatusBadge variant="success">Approved</StatusBadge>}
                        {status === "rejected" && <StatusBadge variant="destructive">Rejected</StatusBadge>}
                        {status === "pending" && <StatusBadge variant="pending">Pending</StatusBadge>}
                      </div>

                      {fileUrl ? (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1">
                          <Eye className="h-4 w-4" /> View Document
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">No document uploaded</p>
                      )}

                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Rejection reason (if rejecting)..."
                          value={docNotes[dk.key] || ""}
                          onChange={e => setDocNotes(prev => ({ ...prev, [dk.key]: e.target.value }))}
                          className="h-16 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          disabled={updateDocStatus.isPending || status === "approved"}
                          onClick={() => updateDocStatus.mutate({ verificationId: selectedVerification.id, docKey: dk.key, status: "approved" })}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={updateDocStatus.isPending || !docNotes[dk.key]}
                          onClick={() => updateDocStatus.mutate({ verificationId: selectedVerification.id, docKey: dk.key, status: "rejected", reason: docNotes[dk.key] })}
                        >
                          <XCircle className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Final Decision */}
              <Card variant="default">
                <CardContent className="p-4 space-y-3">
                  <p className="font-medium">Final Decision</p>
                  <Textarea placeholder="Overall reviewer notes..." value={finalNotes} onChange={e => setFinalNotes(e.target.value)} className="h-20" />
                  <div className="flex gap-3">
                    <Button
                      variant="success"
                      className="flex-1"
                      disabled={!allDocsApproved || finalDecision.isPending}
                      onClick={() => finalDecision.mutate({ verificationId: selectedVerification.id, decision: "approved", notes: finalNotes })}
                    >
                      {finalDecision.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                      Approve & Verify Driver
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={finalDecision.isPending || !finalNotes}
                      onClick={() => finalDecision.mutate({ verificationId: selectedVerification.id, decision: "rejected", notes: finalNotes })}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Reject Driver
                    </Button>
                  </div>
                  {!allDocsApproved && (
                    <p className="text-xs text-muted-foreground">All 4 documents must be approved before final approval.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
