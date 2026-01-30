import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export type MessageStatus = "sent" | "delivered" | "read";

export interface SecureMessage {
  id: string;
  job_id: string;
  sender_id: string;
  sender_type: "customer" | "driver";
  message: string;
  status: MessageStatus;
  is_read: boolean;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

interface UseSecureMessagingOptions {
  jobId: string | null;
  otherPartyName?: string;
  onNewMessage?: (message: SecureMessage) => void;
}

export const useSecureMessaging = ({
  jobId,
  otherPartyName,
  onNewMessage,
}: UseSecureMessagingOptions) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<SecureMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const notificationPermissionRef = useRef<NotificationPermission>("default");
  const isChatOpenRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        notificationPermissionRef.current = permission;
      });
    }
  }, []);

  // Show push notification
  const showNotification = useCallback(
    (message: SecureMessage) => {
      if (
        notificationPermissionRef.current === "granted" &&
        !isChatOpenRef.current &&
        document.hidden &&
        message.sender_id !== user?.id
      ) {
        const notification = new Notification(otherPartyName || "New Message", {
          body: message.message.substring(0, 100),
          icon: "/favicon.ico",
          tag: `job-message-${message.id}`,
          requireInteraction: false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 5000);
      }
    },
    [otherPartyName, user?.id]
  );

  // Fetch existing messages
  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("job_messages")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const typedMessages = data as SecureMessage[];
        setMessages(typedMessages);

        // Count unread from other party
        const unread = typedMessages.filter(
          (m) => m.sender_id !== user?.id && !m.is_read
        ).length;
        setUnreadCount(unread);

        // Mark as delivered when fetched
        const undelivered = typedMessages.filter(
          (m) => m.sender_id !== user?.id && m.status === "sent"
        );
        
        for (const msg of undelivered) {
          await markAsDelivered(msg.id);
        }
      }
      setLoading(false);
    };

    fetchMessages();
  }, [jobId, user?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel(`secure-messages-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_messages",
          filter: `job_id=eq.${jobId}`,
        },
        async (payload) => {
          const newMessage = payload.new as SecureMessage;

          // Avoid duplicates
          if (lastMessageIdRef.current === newMessage.id) return;
          lastMessageIdRef.current = newMessage.id;

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });

          if (newMessage.sender_id !== user?.id) {
            setUnreadCount((prev) => prev + 1);
            showNotification(newMessage);
            onNewMessage?.(newMessage);
            
            // Auto-mark as delivered
            await markAsDelivered(newMessage.id);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "job_messages",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as SecureMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, user?.id, showNotification, onNewMessage]);

  // Send a message via secure endpoint
  const sendMessage = useCallback(
    async (text: string): Promise<{ error: string | null }> => {
      if (!jobId || !user || !text.trim()) {
        return { error: "Invalid input" };
      }

      if (rateLimited) {
        return { error: "Please wait before sending another message" };
      }

      if (isBlocked) {
        return { error: "Unable to send message" };
      }

      setSending(true);

      try {
        const { data, error } = await supabase.functions.invoke("secure-message", {
          body: {
            action: "send",
            jobId,
            message: text.trim(),
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.error) {
          if (data.error.includes("Rate limit")) {
            setRateLimited(true);
            setTimeout(() => setRateLimited(false), 5000);
          }
          return { error: data.error };
        }

        return { error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send message";
        return { error: message };
      } finally {
        setSending(false);
      }
    },
    [jobId, user, rateLimited, isBlocked]
  );

  // Mark message as delivered
  const markAsDelivered = useCallback(
    async (messageId: string) => {
      try {
        await supabase.functions.invoke("secure-message", {
          body: {
            action: "mark_delivered",
            messageId,
          },
        });
      } catch (err) {
        console.error("Failed to mark as delivered:", err);
      }
    },
    []
  );

  // Mark messages as read
  const markAsRead = useCallback(
    async (messageId?: string) => {
      if (!jobId) return;

      try {
        await supabase.functions.invoke("secure-message", {
          body: {
            action: "mark_read",
            jobId,
            messageId,
          },
        });
        setUnreadCount(0);
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    },
    [jobId]
  );

  // Track if chat is open (to suppress notifications)
  const setChatOpen = useCallback(
    (isOpen: boolean) => {
      isChatOpenRef.current = isOpen;
      if (isOpen && unreadCount > 0) {
        markAsRead();
      }
    },
    [unreadCount, markAsRead]
  );

  // Block user
  const blockUser = useCallback(
    async (blockedId: string) => {
      try {
        const { error } = await supabase.from("message_blocks").insert({
          blocker_id: user?.id,
          blocked_id: blockedId,
          reason: "manual_block",
        });

        if (!error) {
          setIsBlocked(true);
          toast({
            title: "User blocked",
            description: "You will no longer receive messages from this user.",
          });
        }
      } catch (err) {
        console.error("Failed to block user:", err);
      }
    },
    [user?.id, toast]
  );

  return {
    messages,
    loading,
    sending,
    unreadCount,
    isBlocked,
    rateLimited,
    sendMessage,
    markAsRead,
    markAsDelivered,
    setChatOpen,
    blockUser,
  };
};
