/**
 * Connectivity detection hook for low-connectivity environments.
 * Monitors online/offline state and connection quality.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export type ConnectivityStatus = 'online' | 'offline' | 'weak';

export function useConnectivity() {
  const [status, setStatus] = useState<ConnectivityStatus>(
    navigator.onLine ? 'online' : 'offline'
  );
  const [lastOnline, setLastOnline] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );
  const checkIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const checkConnectionQuality = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }

    // Use Navigator.connection API if available (Chrome/Android)
    const conn = (navigator as any).connection;
    if (conn) {
      const effectiveType = conn.effectiveType; // '4g', '3g', '2g', 'slow-2g'
      if (effectiveType === '2g' || effectiveType === 'slow-2g') {
        setStatus('weak');
        return;
      }
      if (conn.downlink < 0.5) { // Less than 0.5 Mbps
        setStatus('weak');
        return;
      }
    }

    // Ping test as fallback — lightweight HEAD request
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const start = Date.now();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      clearTimeout(timeout);
      const latency = Date.now() - start;
      setStatus(latency > 3000 ? 'weak' : 'online');
      setLastOnline(new Date());
    } catch {
      // If fetch fails but navigator says online → weak
      setStatus(navigator.onLine ? 'weak' : 'offline');
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setLastOnline(new Date());
      checkConnectionQuality();
    };
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check quality periodically (every 30s)
    checkIntervalRef.current = setInterval(checkConnectionQuality, 30000);

    // Initial check
    checkConnectionQuality();

    // Listen for connection change events
    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', checkConnectionQuality);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (conn) conn.removeEventListener('change', checkConnectionQuality);
    };
  }, [checkConnectionQuality]);

  return { status, isOffline: status === 'offline', isWeak: status === 'weak', isOnline: status === 'online', lastOnline };
}
