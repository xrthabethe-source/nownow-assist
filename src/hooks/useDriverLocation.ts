import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LocationState {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface UseDriverLocationOptions {
  driverId: string | null;
  enabled?: boolean;
  updateInterval?: number; // milliseconds between DB updates
}

export function useDriverLocation({
  driverId,
  enabled = true,
  updateInterval = 5000, // Update DB every 5 seconds
}: UseDriverLocationOptions) {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const { toast } = useToast();

  // Update driver location in database
  const updateDriverLocation = useCallback(
    async (lat: number, lng: number) => {
      if (!driverId) return;

      try {
        const { error: updateError } = await supabase
          .from("drivers")
          .update({
            current_location_lat: lat,
            current_location_lng: lng,
            updated_at: new Date().toISOString(),
          })
          .eq("id", driverId);

        if (updateError) {
          console.error("Failed to update driver location:", updateError);
        }
      } catch (err) {
        console.error("Error updating location:", err);
      }
    },
    [driverId]
  );

  // Handle successful location update
  const handlePositionUpdate = useCallback(
    (position: GeolocationPosition) => {
      const newLocation: LocationState = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };

      setLocation(newLocation);
      setError(null);

      // Throttle database updates
      const now = Date.now();
      if (now - lastUpdateRef.current >= updateInterval) {
        lastUpdateRef.current = now;
        updateDriverLocation(newLocation.lat, newLocation.lng);
      }
    },
    [updateInterval, updateDriverLocation]
  );

  // Handle geolocation errors
  const handlePositionError = useCallback(
    (positionError: GeolocationPositionError) => {
      let errorMessage: string;
      switch (positionError.code) {
        case positionError.PERMISSION_DENIED:
          errorMessage = "Location permission denied. Please enable location access.";
          break;
        case positionError.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable.";
          break;
        case positionError.TIMEOUT:
          errorMessage = "Location request timed out.";
          break;
        default:
          errorMessage = "An unknown error occurred while getting location.";
      }
      setError(errorMessage);
      console.error("Geolocation error:", errorMessage);
    },
    []
  );

  // Start tracking location
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      toast({
        title: "GPS Not Supported",
        description: "Your browser doesn't support GPS tracking.",
        variant: "destructive",
      });
      return;
    }

    if (watchIdRef.current !== null) return; // Already tracking

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      options
    );

    setIsTracking(true);
    toast({
      title: "GPS Tracking Started",
      description: "Your location is now being shared.",
    });
  }, [handlePositionUpdate, handlePositionError, toast]);

  // Stop tracking location
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Toggle tracking
  const toggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking, startTracking, stopTracking]);

  // Auto-start tracking when enabled and driverId is available
  useEffect(() => {
    if (enabled && driverId) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, driverId, startTracking, stopTracking]);

  // Request permission explicitly
  const requestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return false;
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      if (result.state === "granted") {
        return true;
      } else if (result.state === "prompt") {
        // Will prompt user
        return new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 10000 }
          );
        });
      }
      return false;
    } catch {
      // Fallback for browsers that don't support permissions API
      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 10000 }
        );
      });
    }
  }, []);

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
    toggleTracking,
    requestPermission,
  };
}
