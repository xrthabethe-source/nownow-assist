import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, ArrowDownLeft, ArrowUpRight, Save, Send, Code2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";


interface Conversation {
  id: string;
  phone: string;
  profile_id: string | null;
  step: string;
  last_message_at: string;
}

interface WaMessage {
  id: string;
  phone: string;
  direction: "in" | "out";
  body: string | null;
  created_at: string;
  job_id: string | null;
  payload?: unknown;
  wa_message_id?: string | null;
  message_type?: string | null;
  status?: string | null;
}


interface WhatsAppConfig {
  business_number?: string;
  terms_url?: string;
  terms_version?: string;
  welcome_message?: string;
}

export default function AdminWhatsApp() {
  const queryClient = useQueryClient();
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [config, setConfig] = useState<WhatsAppConfig>({});

  const { data: conversations = [] } = useQuery({
    queryKey: ["wa-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .order("last_message_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Conversation[];
    },
    refetchInterval: 10000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["wa-messages", selectedPhone],
    queryFn: async () => {
      if (!selectedPhone) return [];
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("phone", selectedPhone)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data as WaMessage[];
    },
    enabled: !!selectedPhone,
    refetchInterval: 5000,
  });

  const { data: cfgRow } = useQuery({
    queryKey: ["wa-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "whatsapp_config")
        .maybeSingle();
      return (data?.value ?? {}) as WhatsAppConfig;
    },
  });

  useEffect(() => {
    if (cfgRow) setConfig(cfgRow);
  }, [cfgRow]);

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("app_settings")
        .update({ value: config as Record<string, string>, updated_at: new Date().toISOString() })
        .eq("key", "whatsapp_config");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("WhatsApp settings saved");
      queryClient.invalidateQueries({ queryKey: ["wa-config"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const sendTemplateMutation = useMutation({
    mutationFn: async ({ to, template }: { to: string; template: string }) => {
      const { data, error } = await supabase.functions.invoke("whatsapp-send-template", {
        body: { to, template },
      });
      if (error) {
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.text === "function") {
          try {
            const txt = await ctx.text();
            throw new Error(txt || error.message);
          } catch {
            throw error;
          }
        }
        throw error;
      }
      if (data?.error) {
        const detail = data.meta_error || (data.response_body && JSON.stringify(data.response_body)) || "";
        throw new Error(`${data.error}${detail ? `: ${detail}` : ""} (HTTP ${data.http_status_code ?? "?"})`);
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Template reply sent");
      queryClient.invalidateQueries({ queryKey: ["wa-messages", selectedPhone] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Failed to send template";
      toast.error(msg, { duration: 10000, description: "Check edge function logs for full Meta API response." });
      console.error("WA template send failed", e);
    },
  });


  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;


  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-7 w-7 text-success" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">WhatsApp Channel</h1>
            <p className="text-sm text-muted-foreground">Conversations, message log, and configuration.</p>
          </div>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Business WhatsApp Number</Label>
                <Input
                  placeholder="+27..."
                  value={config.business_number || ""}
                  onChange={(e) => setConfig({ ...config, business_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Terms URL</Label>
                <Input
                  placeholder="https://nownowassist.co.za/terms"
                  value={config.terms_url || ""}
                  onChange={(e) => setConfig({ ...config, terms_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Terms Version</Label>
                <Input
                  placeholder="v1.0"
                  value={config.terms_version || ""}
                  onChange={(e) => setConfig({ ...config, terms_version: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Input
                  value={config.welcome_message || ""}
                  onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                />
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-xs">
              <div className="mb-1 font-semibold">Meta Webhook URL (paste in WhatsApp Business app settings)</div>
              <code className="break-all">{webhookUrl}</code>
            </div>
            <Button onClick={() => saveConfigMutation.mutate()} disabled={saveConfigMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              Save settings
            </Button>
          </CardContent>
        </Card>

        {/* Conversations + Messages */}
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="text-base">Conversations ({conversations.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[520px]">
                {conversations.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
                ) : (
                  <ul className="divide-y">
                    {conversations.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => setSelectedPhone(c.phone)}
                          className={`flex w-full flex-col items-start gap-1 p-3 text-left hover:bg-muted/50 ${
                            selectedPhone === c.phone ? "bg-muted" : ""
                          }`}
                        >
                          <span className="text-sm font-semibold">{c.phone}</span>
                          <span className="text-xs text-muted-foreground">
                            {c.step} · {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">
                {selectedPhone ? `Messages with ${selectedPhone}` : "Select a conversation"}
              </CardTitle>
              {selectedPhone && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={sendTemplateMutation.isPending}
                  onClick={() =>
                    sendTemplateMutation.mutate({ to: selectedPhone, template: "request_received" })
                  }
                >
                  <Send className="mr-2 h-3 w-3" />
                  Send request_received template
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[520px] p-4">
                {selectedPhone ? (
                  messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {messages.map((m) => (
                        <li
                          key={m.id}
                          className={`flex gap-2 ${m.direction === "out" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                              m.direction === "out"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <div className="mb-1 flex items-center gap-1 text-[10px] opacity-75">
                              {m.direction === "out" ? (
                                <><ArrowUpRight className="h-3 w-3" /> Sent</>
                              ) : (
                                <><ArrowDownLeft className="h-3 w-3" /> Received</>
                              )}
                              <span>· {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                              {m.status && <span>· {m.status}</span>}
                            </div>
                            <div className="whitespace-pre-wrap">{m.body || "(no text)"}</div>
                            {m.payload != null && (
                              <Collapsible className="mt-2">
                                <CollapsibleTrigger className="flex items-center gap-1 text-[10px] underline opacity-75 hover:opacity-100">
                                  <Code2 className="h-3 w-3" /> Raw payload
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <pre className="mt-1 max-h-48 overflow-auto rounded bg-background/40 p-2 text-[10px] leading-tight text-foreground/80">
                                    {JSON.stringify(m.payload, null, 2)}
                                  </pre>
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </div>
                        </li>
                      ))}

                    </ul>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">Pick a conversation on the left.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
