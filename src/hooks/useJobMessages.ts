import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  sender_type: "customer" | "driver";
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useJobMessages = (jobId: string | null, driverName?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationPermissionRef = useRef<NotificationPermission>("default");
  const isChatOpenRef = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        notificationPermissionRef.current = permission;
      });
    }
  }, []);

  // Show push notification
  const showNotification = useCallback((message: Message) => {
    if (
      notificationPermissionRef.current === "granted" &&
      !isChatOpenRef.current &&
      document.hidden
    ) {
      const notification = new Notification(driverName || "Driver", {
        body: message.message,
        icon: "/favicon.ico",
        tag: `job-message-${message.id}`,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  }, [driverName]);

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
        setMessages(data as Message[]);
        const unread = data.filter(
          (m) => m.sender_type === "driver" && !m.is_read
        ).length;
        setUnreadCount(unread);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [jobId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel(`job-messages-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_messages",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          // Show notification for driver messages
          if (newMessage.sender_type === "driver") {
            setUnreadCount((prev) => prev + 1);
            showNotification(newMessage);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, showNotification]);

  // Send a message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!jobId || !user || !text.trim()) return { error: "Invalid input" };

      const { error } = await supabase.from("job_messages").insert({
        job_id: jobId,
        sender_id: user.id,
        sender_type: "customer",
        message: text.trim(),
      });

      return { error: error?.message || null };
    },
    [jobId, user]
  );

  // Mark messages as read
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Track if chat is open (to suppress notifications)
  const setChatOpen = useCallback((isOpen: boolean) => {
    isChatOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
    }
  }, []);

  return {
    messages,
    loading,
    unreadCount,
    sendMessage,
    markAsRead,
    setChatOpen,
  };
};
