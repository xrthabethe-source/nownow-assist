/**
 * Hook to cache essential non-sensitive user data for offline access.
 * Automatically syncs profile and vehicle data to localStorage.
 */
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cacheProfile, cacheVehicles, cacheLastLocation, type CachedVehicle } from '@/lib/offlineStorage';

export function useOfflineCache() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Cache profile (name + phone only — no sensitive data)
    const cacheUserProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();

        if (data) {
          cacheProfile({ fullName: data.full_name, phone: data.phone });
        }
      } catch { /* offline — use existing cache */ }
    };

    // Cache vehicles (non-sensitive)
    const cacheUserVehicles = async () => {
      try {
        const { data } = await supabase
          .from('vehicles')
          .select('id, make, model, registration_number, color, is_default')
          .eq('user_id', user.id);

        if (data) {
          const vehicles: CachedVehicle[] = data.map(v => ({
            id: v.id,
            make: v.make,
            model: v.model,
            registrationNumber: v.registration_number,
            color: v.color,
            isDefault: v.is_default ?? false,
          }));
          cacheVehicles(vehicles);
        }
      } catch { /* offline — use existing cache */ }
    };

    cacheUserProfile();
    cacheUserVehicles();
  }, [user?.id]);
}

/**
 * Call this when the user sets a location to cache it for offline use.
 */
export function cacheCurrentLocation(address: string, lat: number, lng: number) {
  cacheLastLocation({ address, lat, lng, cachedAt: new Date().toISOString() });
}
