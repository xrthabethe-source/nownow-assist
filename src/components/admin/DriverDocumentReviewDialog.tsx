import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Image,
  Eye,
  ExternalLink,
  RotateCcw,
  Send,
} from "lucide-react";

type DocumentStatus = "pending" | "approved" | "rejected" | "resubmit_required";
type ApplicationStatus = "pending" | "approved" | "rejected" | "documents_required";

interface Driver {
  id: string;
  user_id: string;
  license_number: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  status: string | null;
  license_document_url: string | null;
  vehicle_registration_url: string | null;
  profile_photo_url: string | null;
  id_document_url: string | null;
  license_document_status?: string | null;
  license_document_note?: string | null;
  vehicle_registration_status?: string | null;
  vehicle_registration_note?: string | null;
  profile_photo_status?: string | null;
  profile_photo_note?: string | null;
  id_document_status?: string | null;
  id_document_note?: string | null;
  rejection_reason?: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface DocumentState {
  status: DocumentStatus;
  note: string;
}

interface DriverDocumentReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | null;
}

const documents = [
  { key: "license", label: "Driver's License", urlKey: "license_document_url", statusKey: "license_document_status", noteKey: "license_document_note", icon: FileText },
  { key: "id", label: "ID Document", urlKey: "id_document_url", statusKey: "id_document_status", noteKey: "id_document_note", icon: FileText },
  { key: "vehicle", label: "Vehicle Registration", urlKey: "vehicle_registration_url", statusKey: "vehicle_registration_status", noteKey: "vehicle_registration_note", icon: FileText },
  { key: "photo", label: "Profile Photo", urlKey: "profile_photo_url", statusKey: "profile_photo_status", noteKey: "profile_photo_note", icon: Image },
] as const;

export function DriverDocumentReviewDialog({
  open,
  onOpenChange,
  driver,
}: DriverDocumentReviewDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [documentStates, setDocumentStates] = useState<Record<string, DocumentState>>({
    license: { status: "pending", note: "" },
    id: { status: "pending", note: "" },
    vehicle: { status: "pending", note: "" },
    photo: { status: "pending", note: "" },
  });
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("pending");
  const [applicationReason, setApplicationReason] = useState("");
  const [activeTab, setActiveTab] = useState("documents");

  // Initialize states when driver changes
  const initializeStates = () => {
    if (driver) {
      setDocumentStates({
        license: { 
          status: (driver.license_document_status as DocumentStatus) || "pending", 
          note: driver.license_document_note || "" 
        },
        id: { 
          status: (driver.id_document_status as DocumentStatus) || "pending", 
          note: driver.id_document_note || "" 
        },
        vehicle: { 
          status: (driver.vehicle_registration_status as DocumentStatus) || "pending", 
          note: driver.vehicle_registration_note || "" 
        },
        photo: { 
          status: (driver.profile_photo_status as DocumentStatus) || "pending", 
          note: driver.profile_photo_note || "" 
        },
      });
      setApplicationStatus((driver.status as ApplicationStatus) || "pending");
      setApplicationReason(driver.rejection_reason || "");
    }
  };

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ docKey, status, note }: { docKey: string; status: DocumentStatus; note: string }) => {
      if (!driver) throw new Error("No driver selected");

      const updateData: Record<string, string | null> = {};
      
      if (docKey === "license") {
        updateData.license_document_status = status;
        updateData.license_document_note = note || null;
      } else if (docKey === "id") {
        updateData.id_document_status = status;
        updateData.id_document_note = note || null;
      } else if (docKey === "vehicle") {
        updateData.vehicle_registration_status = status;
        updateData.vehicle_registration_note = note || null;
      } else if (docKey === "photo") {
        updateData.profile_photo_status = status;
        updateData.profile_photo_note = note || null;
      }

      const { error } = await supabase
        .from("drivers")
        .update(updateData)
        .eq("id", driver.id);

      if (error) throw error;
    },
    onSuccess: (_, { docKey }) => {
      const docLabel = documents.find(d => d.key === docKey)?.label || docKey;
      toast.success(`${docLabel} status updated`);
      queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
    },
    onError: (error) => {
      toast.error("Failed to update document: " + error.message);
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ status, reason }: { status: ApplicationStatus; reason: string }) => {
      if (!driver) throw new Error("No driver selected");

      const updateData: Record<string, unknown> = {
        status,
        rejection_reason: status === "rejected" || status === "documents_required" ? reason : null,
        is_verified: status === "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      };

      const { error } = await supabase
        .from("drivers")
        .update(updateData)
        .eq("id", driver.id);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      const message = status === "approved" 
        ? "Driver approved successfully!" 
        : status === "rejected"
        ? "Driver application rejected"
        : "Application status updated - driver notified to resubmit documents";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to update application: " + error.message);
    },
  });

  const getStatusBadge = (status: DocumentStatus | string | null | undefined) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-success/10 text-success border-success/20"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      case "resubmit_required":
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20"><RotateCcw className="mr-1 h-3 w-3" />Resubmit Required</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="mr-1 h-3 w-3" />Pending</Badge>;
    }
  };

  const getDocumentUrl = (doc: typeof documents[number]) => {
    if (!driver) return null;
    return driver[doc.urlKey as keyof Driver] as string | null;
  };

  const handleDocumentUpdate = (docKey: string, status: DocumentStatus, note: string) => {
    setDocumentStates(prev => ({
      ...prev,
      [docKey]: { status, note }
    }));
  };

  const saveDocumentStatus = (docKey: string) => {
    const state = documentStates[docKey];
    updateDocumentMutation.mutate({ docKey, status: state.status, note: state.note });
  };

  const handleFinalDecision = () => {
    updateApplicationMutation.mutate({ status: applicationStatus, reason: applicationReason });
  };

  if (!driver) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (o) initializeStates();
      onOpenChange(o);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review Driver Application</DialogTitle>
          <DialogDescription>
            Review documents individually and make a final decision on the application
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Driver Info</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="decision">Final Decision</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] pr-4">
            <TabsContent value="info" className="mt-4 space-y-4">
              {/* Driver Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      {driver.profile_photo_url && <AvatarImage src={driver.profile_photo_url} />}
                      <AvatarFallback className="text-lg">
                        {driver.profiles?.full_name?.charAt(0).toUpperCase() || "D"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{driver.profiles?.full_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{driver.profiles?.email}</p>
                      <p className="text-sm text-muted-foreground">{driver.profiles?.phone || "No phone"}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">License Number</Label>
                    <p className="font-medium">{driver.license_number || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground text-xs">Vehicle Type</Label>
                    <p className="font-medium">{driver.vehicle_type || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Make & Model</Label>
                    <p className="font-medium">{driver.vehicle_make} {driver.vehicle_model}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Year</Label>
                    <p className="font-medium">{driver.vehicle_year || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">License Plate</Label>
                    <p className="font-medium">{driver.vehicle_plate || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4 space-y-4">
              {documents.map((doc) => {
                const url = getDocumentUrl(doc);
                const state = documentStates[doc.key];
                const Icon = doc.icon;

                return (
                  <Card key={doc.key} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-base">{doc.label}</CardTitle>
                        </div>
                        {getStatusBadge(state.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Document Preview / Link */}
                      <div className="flex items-center gap-2">
                        {url ? (
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                                View Document
                                <ExternalLink className="ml-2 h-3 w-3" />
                              </a>
                            </Button>
                            <Badge variant="secondary" className="bg-success/10 text-success">Uploaded</Badge>
                          </>
                        ) : (
                          <Badge variant="destructive">Not Uploaded</Badge>
                        )}
                      </div>

                      <Separator />

                      {/* Status Selection */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={state.status}
                            onValueChange={(value: DocumentStatus) => 
                              handleDocumentUpdate(doc.key, value, state.note)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending Review</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="resubmit_required">Resubmit Required</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Note to Driver</Label>
                          <Textarea
                            placeholder={
                              state.status === "rejected" 
                                ? "Explain why this document was rejected..."
                                : state.status === "resubmit_required"
                                ? "Explain what needs to be corrected..."
                                : "Optional note..."
                            }
                            value={state.note}
                            onChange={(e) => handleDocumentUpdate(doc.key, state.status, e.target.value)}
                            className="h-20"
                          />
                        </div>
                      </div>

                      <Button 
                        size="sm"
                        onClick={() => saveDocumentStatus(doc.key)}
                        disabled={updateDocumentMutation.isPending}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Save Document Status
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="decision" className="mt-4 space-y-4">
              {/* Summary of document statuses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Document Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {documents.map((doc) => (
                      <div key={doc.key} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm font-medium">{doc.label}</span>
                        {getStatusBadge(documentStates[doc.key].status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Final Decision */}
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-base">Application Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Final Status</Label>
                    <Select
                      value={applicationStatus}
                      onValueChange={(value: ApplicationStatus) => setApplicationStatus(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Keep Pending</SelectItem>
                        <SelectItem value="approved">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            Approve Application
                          </span>
                        </SelectItem>
                        <SelectItem value="documents_required">
                          <span className="flex items-center gap-2">
                            <RotateCcw className="h-4 w-4 text-warning" />
                            Request Document Resubmission
                          </span>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <span className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-destructive" />
                            Reject Application
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(applicationStatus === "rejected" || applicationStatus === "documents_required") && (
                    <div className="space-y-2">
                      <Label>
                        {applicationStatus === "rejected" ? "Rejection Reason" : "Resubmission Instructions"}
                      </Label>
                      <Textarea
                        placeholder={
                          applicationStatus === "rejected"
                            ? "Explain why the application is being rejected..."
                            : "Explain which documents need to be resubmitted and why..."
                        }
                        value={applicationReason}
                        onChange={(e) => setApplicationReason(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {activeTab === "decision" && (
            <Button 
              onClick={handleFinalDecision}
              disabled={updateApplicationMutation.isPending || (
                (applicationStatus === "rejected" || applicationStatus === "documents_required") && !applicationReason.trim()
              )}
              variant={applicationStatus === "approved" ? "default" : applicationStatus === "rejected" ? "destructive" : "secondary"}
            >
              {updateApplicationMutation.isPending ? "Saving..." : (
                applicationStatus === "approved" ? (
                  <><CheckCircle className="mr-2 h-4 w-4" />Approve Driver</>
                ) : applicationStatus === "rejected" ? (
                  <><XCircle className="mr-2 h-4 w-4" />Reject Application</>
                ) : applicationStatus === "documents_required" ? (
                  <><RotateCcw className="mr-2 h-4 w-4" />Request Resubmission</>
                ) : (
                  "Save Decision"
                )
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
