import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface AdminNotification {
  id: string;
  type: 'driver_application' | 'payment' | 'system_alert' | 'dispute';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useAdminNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AdminNotification[];
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('admin-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    }
  };

  // Function to create system alerts manually
  const createSystemAlert = async (title: string, message: string, severity: 'info' | 'warning' | 'error' = 'warning') => {
    const { error } = await supabase
      .from('admin_notifications')
      .insert({
        type: 'system_alert',
        title,
        message,
        severity,
      });

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    }
    return { error };
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    refetch,
    markAsRead,
    markAllAsRead,
    createSystemAlert,
  };
}
