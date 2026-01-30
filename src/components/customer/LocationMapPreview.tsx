import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapPreviewProps {
  lat: number;
  lng: number;
  onClick?: () => void;
}

export function LocationMapPreview({ lat, lng, onClick }: LocationMapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    });

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Create custom pin icon
    const pinIcon = L.divIcon({
      className: "custom-pin-icon",
      html: `
        <div class="relative">
          <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-foreground">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45 shadow-lg"></div>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
    });

    // Add marker
    const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    
    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], 16);
    }
  }, [lat, lng]);

  return (
    <div 
      ref={mapRef} 
      className="h-24 w-full rounded-xl overflow-hidden cursor-pointer ring-1 ring-border hover:ring-primary transition-all relative"
      style={{ zIndex: 0 }}
      onClick={onClick}
      role="button"
      aria-label="Tap to adjust pin location"
    />
  );
}
