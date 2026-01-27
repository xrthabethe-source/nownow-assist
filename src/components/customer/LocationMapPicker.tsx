import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Check, X, Loader2, Crosshair, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat: number;
  initialLng: number;
  onConfirm: (lat: number, lng: number, address: string) => void;
}

export function LocationMapPicker({
  open,
  onOpenChange,
  initialLat,
  initialLng,
  onConfirm,
}: LocationMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  const [position, setPosition] = useState({ lat: initialLat, lng: initialLng });
  const [streetAddress, setStreetAddress] = useState<string>("");
  const [houseNumber, setHouseNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecentering, setIsRecentering] = useState(false);

  // Build full address with optional house number
  const getFullAddress = () => {
    if (houseNumber.trim()) {
      return `${houseNumber.trim()} ${streetAddress}`;
    }
    return streetAddress;
  };

  // Reverse geocode the position
  const fetchAddress = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reverse-geocode", {
        body: { lat, lon: lng },
      });
      
      // Prefer the short location format (street only), fall back to display_name if needed
      if (!error && data?.location && data.location !== '') {
        setStreetAddress(data.location);
      } else if (!error && data?.display_name) {
        // Parse display_name to extract just the street/area, not full address
        const parts = data.display_name.split(',').map((p: string) => p.trim());
        // Take first 1-2 meaningful parts only
        const shortAddress = parts.slice(0, 2).join(', ');
        setStreetAddress(shortAddress);
      } else {
        setStreetAddress("Location selected");
      }
    } catch {
      setStreetAddress("Location selected");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize map when dialog opens
  useEffect(() => {
    if (!open || !mapRef.current) return;

    // Small delay to ensure dialog is rendered
    const timeout = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        return;
      }

      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [position.lat, position.lng],
        zoom: 17,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Create draggable pin icon
      const pinIcon = L.divIcon({
        className: "custom-pin-icon",
        html: `
          <div class="relative animate-bounce-once">
            <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-xl border-3 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-foreground">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45 shadow-lg"></div>
          </div>
        `,
        iconSize: [40, 52],
        iconAnchor: [20, 52],
      });

      const marker = L.marker([position.lat, position.lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      // Handle marker drag
      marker.on("dragend", () => {
        const newPos = marker.getLatLng();
        setPosition({ lat: newPos.lat, lng: newPos.lng });
        fetchAddress(newPos.lat, newPos.lng);
      });

      // Handle map click to move marker
      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
        fetchAddress(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Fetch initial address
      fetchAddress(position.lat, position.lng);
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [open]);

  // Cleanup on close
  useEffect(() => {
    if (!open && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  }, [open]);

  // Reset position when dialog opens with new coordinates
  useEffect(() => {
    if (open) {
      setPosition({ lat: initialLat, lng: initialLng });
    }
  }, [open, initialLat, initialLng]);

  const handleRecenter = () => {
    if (!navigator.geolocation) return;
    
    setIsRecentering(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        
        fetchAddress(latitude, longitude);
        setIsRecentering(false);
      },
      () => {
        setIsRecentering(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    onConfirm(position.lat, position.lng, getFullAddress());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-[100dvh] p-0 gap-0 border-0 rounded-none sm:rounded-none">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-b from-background/95 via-background/80 to-transparent p-4 pb-8">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 rounded-full bg-card shadow-md"
            >
              <X className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold text-foreground">Set your location</h2>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Map */}
        <div ref={mapRef} className="w-full h-full" />

        {/* Recenter button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={handleRecenter}
          disabled={isRecentering}
          className="absolute bottom-36 right-4 z-[1000] h-12 w-12 rounded-full shadow-lg bg-card"
        >
          {isRecentering ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Crosshair className="h-5 w-5" />
          )}
        </Button>

        {/* Bottom panel */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-card rounded-t-3xl shadow-xl p-4 pb-6 safe-area-bottom">
          {/* House number input */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Home className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              placeholder="House/Unit number (optional)"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              className="flex-1"
            />
          </div>
          
          {/* Address display */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Selected location</p>
              {isLoading ? (
                <div className="flex items-center gap-2 mt-1">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Finding address...</span>
                </div>
              ) : (
                <p className="font-medium text-foreground line-clamp-2">{getFullAddress() || "Drag pin to adjust"}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirm Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
