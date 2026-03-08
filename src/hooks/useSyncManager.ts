/**
 * Sync Manager for Now-Now Assist
 * 
 * Automatically retries pending offline job drafts when connectivity returns.
 * Runs in the background without blocking UI.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConnectivity } from '@/hooks/useConnectivity';
import { getDraftsToSync, updateDraftStatus, removeDraft, type PendingJobDraft } from '@/lib/offlineStorage';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function useSyncManager() {
  const { user } = useAuth();
  const { status } = useConnectivity();
  const queryClient = useQueryClient();
  const isSyncingRef = useRef(false);
  const [pendingCount, setPendingCount] = useState(getDraftsToSync().length);

  const syncDraft = useCallback(async (draft: PendingJobDraft): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('jobs')
        .insert({
          customer_id: user.id,
          service_id: draft.serviceId,
          pickup_address: draft.pickupAddress,
          pickup_lat: draft.pickupLat,
          pickup_lng: draft.pickupLng,
          estimated_price: draft.estimatedPrice,
          eta_minutes: draft.etaMinutes,
          notes: draft.notes ?? null,
          status: 'pending',
          created_offline: true,
          synced_at: new Date().toISOString(),
          offline_draft_id: draft.id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      updateDraftStatus(draft.id, 'submitted');
      removeDraft(draft.id);
      return true;
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      updateDraftStatus(draft.id, draft.retryCount >= 4 ? 'failed' : 'pending_sync', msg);
      return false;
    }
  }, [user]);

  const syncAll = useCallback(async () => {
    if (isSyncingRef.current || !user?.id) return;

    const drafts = getDraftsToSync();
    if (drafts.length === 0) return;

    isSyncingRef.current = true;
    let successCount = 0;

    for (const draft of drafts) {
      const ok = await syncDraft(draft);
      if (ok) successCount++;
    }

    isSyncingRef.current = false;
    setPendingCount(getDraftsToSync().length);

    if (successCount > 0) {
      toast.success(`${successCount} pending request${successCount > 1 ? 's' : ''} submitted successfully`);
      queryClient.invalidateQueries({ queryKey: ['customer-jobs'] });
    }
  }, [user, syncDraft, queryClient]);

  // Auto-sync when connectivity is restored
  useEffect(() => {
    if (status === 'online' && user?.id) {
      syncAll();
    }
  }, [status, user, syncAll]);

  // Periodic sync attempt every 15s when online
  useEffect(() => {
    if (status !== 'online') return;
    const interval = setInterval(() => {
      syncAll();
    }, 15000);
    return () => clearInterval(interval);
  }, [status, syncAll]);

  // Update pending count when drafts change
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingCount(getDraftsToSync().length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return { syncAll, pendingCount, isSyncing: isSyncingRef.current };
}
