import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, AlertCircle, FileText, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export function DriverMessagesPanel() {
  const { user } = useAuth();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["driver-admin-messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const unreadCount = messages?.filter((m) => !m.is_read).length || 0;

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", messageId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "complaint": return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "payout": return <FileText className="h-4 w-4 text-primary" />;
      default: return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "complaint": return <Badge variant="destructive" className="text-xs">Complaint</Badge>;
      case "payout": return <Badge variant="outline" className="text-xs">Payout</Badge>;
      case "general": return <Badge variant="secondary" className="text-xs">General</Badge>;
      default: return <Badge variant="secondary" className="text-xs">{category}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Clock className="h-5 w-5 animate-spin mx-auto mb-2" />
          Loading messages...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messages from Admin
          </CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!messages || messages.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Messages from the admin team will appear here</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y divide-border">
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !msg.is_read ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                  onClick={() => {
                    if (!msg.is_read) markAsRead(msg.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getCategoryIcon(msg.category)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium truncate ${!msg.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                          {msg.subject}
                        </span>
                        {getCategoryBadge(msg.category)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                        {msg.is_read && (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 className="h-3 w-3" /> Read
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
