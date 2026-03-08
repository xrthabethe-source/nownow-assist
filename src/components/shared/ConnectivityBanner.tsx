/**
 * Connectivity Banner — shows a calm, clear notification when
 * the user is offline or has weak connectivity.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Signal, CloudOff, RefreshCw } from 'lucide-react';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useSyncManager } from '@/hooks/useSyncManager';

export function ConnectivityBanner() {
  const { status, isOnline } = useConnectivity();
  const { pendingCount } = useSyncManager();

  const showBanner = status !== 'online' || pendingCount > 0;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          {status === 'offline' && (
            <div className="flex items-center gap-3 bg-destructive/10 px-4 py-3 border-b border-destructive/20">
              <WifiOff className="h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive font-medium">
                You're offline. Your request will be saved and sent automatically when signal returns.
              </p>
            </div>
          )}

          {status === 'weak' && (
            <div className="flex items-center gap-3 bg-warning/10 px-4 py-3 border-b border-warning/20">
              <Signal className="h-4 w-4 shrink-0 text-warning" />
              <p className="text-sm text-warning font-medium">
                Connection is weak. Your request will be saved and sent automatically when signal returns.
              </p>
            </div>
          )}

          {isOnline && pendingCount > 0 && (
            <div className="flex items-center gap-3 bg-primary/10 px-4 py-3 border-b border-primary/20">
              <RefreshCw className="h-4 w-4 shrink-0 text-primary animate-spin" />
              <p className="text-sm text-primary font-medium">
                Syncing {pendingCount} pending request{pendingCount > 1 ? 's' : ''}…
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
