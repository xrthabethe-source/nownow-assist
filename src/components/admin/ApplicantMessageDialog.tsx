import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  MessageSquare,
  Send,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Smartphone,
  History,
  Loader2,
} from "lucide-react";

interface Driver {
  id: string;
  user_id: string;
  status: string | null;
  license_document_url: string | null;
  id_document_url: string | null;
  vehicle_registration_url: string | null;
  profile_photo_url: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface ApplicantMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | null;
}

type Channel = "sms" | "whatsapp" | "both";

interface MessageTemplate {
  id: string;
  label: string;
  message: string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "missing_id",
    label: "Missing ID Document",
    message: "Hello [First Name], thank you for applying to become a Now-Now Assist responder. We are missing your ID/Passport document. Please upload the required document to complete your application. If you need assistance, reply to this message.",
  },
  {
    id: "missing_licence",
    label: "Missing Driver's Licence",
    message: "Hello [First Name], thank you for applying to become a Now-Now Assist responder. We are missing your Driver's Licence. Please upload the required document to complete your application. If you need assistance, reply to this message.",
  },
  {
    id: "proof_of_address",
    label: "Proof of Address Required",
    message: "Hello [First Name], thank you for applying to become a Now-Now Assist responder. We require a Proof of Address document. Please upload the required document to complete your application. If you need assistance, reply to this message.",
  },
  {
    id: "vehicle_reg",
    label: "Vehicle Registration Required",
    message: "Hello [First Name], thank you for applying to become a Now-Now Assist responder. We are missing your Vehicle Registration document. Please upload the required document to complete your application. If you need assistance, reply to this message.",
  },
  {
    id: "training",
    label: "Training Required",
    message: "Hello [First Name], thank you for applying to become a Now-Now Assist responder. You are required to complete a training session before your application can be approved. We will contact you with training details shortly.",
  },
  {
    id: "incomplete",
    label: "Application Incomplete",
    message: "Hello [First Name], thank you for your interest in becoming a Now-Now Assist responder. Your application is currently incomplete. Please ensure all required documents are uploaded and all fields are completed. If you need assistance, reply to this message.",
  },
];

export function ApplicantMessageDialog({ open, onOpenChange, driver }: ApplicantMessageDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("compose");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const firstName = driver?.profiles?.full_name?.split(" ")[0] || "Applicant";

  // Reset state when dialog opens with new driver
  useEffect(() => {
    if (open && driver) {
      setMessage("");
      setSelectedTemplate(null);
      setActiveTab("compose");
    }
  }, [open, driver?.id]);

  // Fetch communication history
  const { data: commHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["applicant-communications", driver?.id],
    queryFn: async () => {
      if (!driver?.id) return [];
      const { data, error } = await supabase
        .from("applicant_communications" as any)
        .select("*")
        .eq("driver_id", driver.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: open && !!driver?.id,
  });

  const handleSelectTemplate = (template: MessageTemplate) => {
    const personalizedMessage = template.message.replace("[First Name]", firstName);
    setMessage(personalizedMessage);
    setSelectedTemplate(template.id);
  };

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!driver?.id || !driver?.profiles?.phone || !message.trim()) {
        throw new Error("Missing required information");
      }

      const { data, error } = await supabase.functions.invoke("send-applicant-message", {
        body: {
          driver_id: driver.id,
          phone_number: driver.profiles.phone,
          message: message.trim(),
          channel,
          template_used: selectedTemplate,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data?.delivery_status === "partial") {
        toast.warning("Message partially delivered", {
          description: data.errors?.join(", "),
        });
      } else {
        toast.success("Message sent successfully", {
          description: `Sent via ${channel === "both" ? "SMS & WhatsApp" : channel.toUpperCase()}`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["applicant-communications", driver?.id] });
      setMessage("");
      setSelectedTemplate(null);
      setActiveTab("history");
    },
    onError: (error: any) => {
      toast.error("Failed to send message", {
        description: error.message,
      });
    },
  });

  const missingDocs = driver ? [
    { name: "ID Document", missing: !driver.id_document_url },
    { name: "Driver's Licence", missing: !driver.license_document_url },
    { name: "Vehicle Registration", missing: !driver.vehicle_registration_url },
    { name: "Profile Photo", missing: !driver.profile_photo_url },
  ].filter(d => d.missing) : [];

  const getDeliveryBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="default" className="bg-success text-success-foreground"><CheckCircle className="mr-1 h-3 w-3" />Sent</Badge>;
      case "partial":
        return <Badge variant="secondary" className="bg-warning/15 text-warning"><AlertCircle className="mr-1 h-3 w-3" />Partial</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    }
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case "whatsapp":
        return <Smartphone className="h-3 w-3" />;
      case "sms":
        return <Phone className="h-3 w-3" />;
      case "both":
        return <MessageSquare className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Contact Applicant
          </DialogTitle>
          <DialogDescription>
            Send a message to {driver?.profiles?.full_name || "the applicant"} via SMS or WhatsApp
          </DialogDescription>
        </DialogHeader>

        {/* Applicant Info Banner */}
        <div className="rounded-lg border bg-muted/50 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {firstName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{driver?.profiles?.full_name || "Unknown"}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{driver?.profiles?.phone || "No phone"}</span>
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{driver?.profiles?.email || "No email"}</span>
              </div>
            </div>
            <Badge variant={driver?.status === "pending" ? "secondary" : "outline"}>
              {driver?.status || "pending"}
            </Badge>
          </div>
          {missingDocs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {missingDocs.map(d => (
                <Badge key={d.name} variant="destructive" className="text-xs">
                  <AlertCircle className="mr-1 h-3 w-3" />Missing: {d.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0">
          <TabsList className="w-full">
            <TabsTrigger value="compose" className="flex-1">
              <Send className="mr-1.5 h-3.5 w-3.5" />Compose
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex-1">
              <FileText className="mr-1.5 h-3.5 w-3.5" />Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 relative">
              <History className="mr-1.5 h-3.5 w-3.5" />History
              {commHistory && commHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{commHistory.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="mt-3 space-y-3">
            {/* Channel Selection */}
            <div className="space-y-1.5">
              <Label className="text-sm">Delivery Channel</Label>
              <div className="flex gap-2">
                {(["whatsapp", "sms", "both"] as Channel[]).map(ch => (
                  <Button
                    key={ch}
                    type="button"
                    variant={channel === ch ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChannel(ch)}
                    className="flex-1"
                  >
                    {ch === "whatsapp" && <Smartphone className="mr-1.5 h-3.5 w-3.5" />}
                    {ch === "sms" && <Phone className="mr-1.5 h-3.5 w-3.5" />}
                    {ch === "both" && <MessageSquare className="mr-1.5 h-3.5 w-3.5" />}
                    {ch === "both" ? "Both" : ch.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-1.5">
              <Label className="text-sm">Message</Label>
              <Textarea
                placeholder={`Write a message to ${firstName}...`}
                className="min-h-[140px] resize-none"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setSelectedTemplate(null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/1600 characters
                {selectedTemplate && <span className="ml-2 text-primary">• Using template</span>}
              </p>
            </div>

            {!driver?.profiles?.phone && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="inline mr-1.5 h-4 w-4" />
                No phone number on file. Cannot send message.
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-3">
            <ScrollArea className="h-[280px]">
              <div className="space-y-2 pr-3">
                {MESSAGE_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    className={`w-full text-left rounded-lg border p-3 transition-all hover:border-primary/50 hover:bg-primary/5 ${
                      selectedTemplate === template.id ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                    }`}
                    onClick={() => {
                      handleSelectTemplate(template);
                      setActiveTab("compose");
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{template.label}</span>
                      {selectedTemplate === template.id && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.message.replace("[First Name]", firstName)}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            <ScrollArea className="h-[280px]">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !commHistory || commHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No messages sent yet</p>
                </div>
              ) : (
                <div className="space-y-3 pr-3">
                  {commHistory.map((comm: any) => (
                    <div key={comm.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(comm.channel)}
                          <span className="text-xs font-medium uppercase text-muted-foreground">
                            {comm.channel === "both" ? "SMS & WhatsApp" : comm.channel}
                          </span>
                        </div>
                        {getDeliveryBadge(comm.delivery_status)}
                      </div>
                      <p className="text-sm leading-relaxed">{comm.message_content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(comm.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                        {comm.template_used && (
                          <Badge variant="outline" className="text-[10px]">Template</Badge>
                        )}
                      </div>
                      {comm.delivery_error && (
                        <p className="text-xs text-destructive">{comm.delivery_error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => sendMessageMutation.mutate()}
            disabled={
              !message.trim() ||
              !driver?.profiles?.phone ||
              sendMessageMutation.isPending ||
              message.length > 1600
            }
          >
            {sendMessageMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" />Send via {channel === "both" ? "SMS & WhatsApp" : channel.toUpperCase()}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
