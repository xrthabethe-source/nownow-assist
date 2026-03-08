/**
 * Wrapper component that initializes offline caching for logged-in users.
 */
import { useOfflineCache } from '@/hooks/useOfflineCache';

export function OfflineCacheProvider({ children }: { children: React.ReactNode }) {
  useOfflineCache();
  return <>{children}</>;
}
