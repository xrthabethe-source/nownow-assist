import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare, AlertCircle, FileText, CheckCircle2, Clock,
  XCircle, Upload, ShieldCheck, Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const DOC_LABELS: Record<string, string> = {
  id_doc: "ID / Passport",
  license: "Driver's Licence",
  profile_photo: "Profile Photo",
  background_check: "Background Check",
};

function getDocIcon(status: string) {
  switch (status) {
    case "approved": return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "rejected": return <XCircle className="h-4 w-4 text-destructive" />;
    default: return <Clock className="h-4 w-4 text-warning" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "approved": return <Badge variant="default" className="bg-success/15 text-success border-success/30 text-xs">Approved</Badge>;
    case "rejected": return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
    default: return <Badge variant="secondary" className="text-xs">Pending</Badge>;
  }
}

function getOverallBadge(status: string) {
  switch (status) {
    case "approved": return <Badge variant="default" className="bg-success/15 text-success border-success/30">Approved</Badge>;
    case "rejected": return <Badge variant="destructive">Rejected</Badge>;
    case "submitted":
    case "pending_review": return <Badge variant="secondary">Under Review</Badge>;
    case "not_started": return <Badge variant="outline">Documents Required</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

export function DriverMessagesPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get driver record
  const { data: driver } = useQuery({
    queryKey: ["driver-record-msgs", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Get verification record for document statuses
  const { data: verification } = useQuery({
    queryKey: ["driver-verification-msgs", driver?.id],
    queryFn: async () => {
      if (!driver?.id) return null;
      const { data } = await supabase
        .from("driver_verifications" as any)
        .select("*")
        .eq("driver_id", driver.id)
        .maybeSingle();
      return data as any;
    },
    enabled: !!driver?.id,
  });

  // Get admin messages for this driver
  const { data: messages } = useQuery({
    queryKey: ["driver-portal-messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", messageId);
    queryClient.invalidateQueries({ queryKey: ["driver-portal-messages"] });
  };

  const unreadCount = messages?.filter((m) => !m.is_read).length || 0;

  // Build document status list
  const docItems = verification
    ? [
        { key: "id_doc", status: verification.id_doc_status, rejection: verification.id_doc_rejection_reason, hasFile: !!verification.id_doc_file_url },
        { key: "license", status: verification.license_status, rejection: verification.license_rejection_reason, hasFile: !!verification.license_file_url },
        { key: "profile_photo", status: verification.profile_photo_status, rejection: verification.profile_photo_rejection_reason, hasFile: !!verification.profile_photo_url },
        { key: "background_check", status: verification.background_check_status, rejection: verification.background_check_rejection_reason, hasFile: !!verification.background_check_url || !!verification.bg_consent_given },
      ]
    : [];

  const hasRejections = docItems.some((d) => d.status === "rejected");
  const overallStatus = verification?.status || "not_started";

  return (
    <div className="space-y-4">
      {/* Overall Verification Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Verification Status
            </CardTitle>
            {getOverallBadge(overallStatus)}
          </div>
        </CardHeader>
        {verification && (
          <CardContent className="pt-0 space-y-3">
            {/* Document statuses */}
            {docItems.map((doc) => (
              <div key={doc.key} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <div className="mt-0.5">{getDocIcon(doc.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{DOC_LABELS[doc.key]}</span>
                    {getStatusBadge(doc.status)}
                  </div>
                  {doc.status === "rejected" && doc.rejection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-1.5 flex items-start gap-1.5 rounded-md bg-destructive/10 p-2"
                    >
                      <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-destructive">{doc.rejection}</p>
                    </motion.div>
                  )}
                  {!doc.hasFile && doc.status === "pending" && (
                    <p className="text-xs text-warning mt-1 flex items-center gap-1">
                      <Upload className="h-3 w-3" /> Not yet uploaded
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Action hint */}
            {hasRejections && (
              <div className="flex items-start gap-2 rounded-md bg-warning/10 p-3">
                <Info className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-xs text-warning">
                  Some documents were rejected. Please re-upload the corrected documents above to continue your verification.
                </p>
              </div>
            )}

            {overallStatus === "approved" && (
              <div className="flex items-center gap-2 rounded-md bg-success/10 p-3">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <p className="text-sm text-success font-medium">
                  You're verified! You can now go online and receive service requests.
                </p>
              </div>
            )}
          </CardContent>
        )}

        {!verification && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Upload your documents to begin the verification process.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Messages from Admin */}
      {messages && messages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Admin Feedback
              </CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">{unreadCount} new</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-64">
              <div className="divide-y divide-border">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      !msg.is_read ? "bg-primary/5 border-l-2 border-l-primary" : ""
                    }`}
                    onClick={() => { if (!msg.is_read) markAsRead(msg.id); }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${!msg.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                        {msg.subject}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
