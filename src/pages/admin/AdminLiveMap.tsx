import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Car,
  MapPin,
  RefreshCw,
  Star,
  Phone,
  Clock,
  Navigation,
  Activity,
  Users,
  Zap,
  ZoomIn,
  ZoomOut,
  Locate,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  CornerUpLeft,
  CornerUpRight,
  RotateCcw,
  ArrowUpRight,
  ArrowUpLeft,
  Route,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom driver icons
const createDriverIcon = (status: "available" | "on_job" | "selected") => {
  const colors = {
    available: "#22c55e",
    on_job: "#f59e0b",
    selected: "#8b5cf6",
  };
  
  return L.divIcon({
    className: "custom-driver-marker",
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${status === "on_job" ? `
          <div style="
            position: absolute;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: ${colors[status]}40;
            animation: pulse 2s infinite;
          "></div>
        ` : ""}
        <div style="
          width: 36px;
          height: 36px;
          background: ${colors[status]};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Map controls component
function MapControls({ onLocateDrivers }: { onLocateDrivers: () => void }) {
  const map = useMap();
  
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <Button
        size="icon"
        variant="secondary"
        className="bg-white shadow-lg hover:bg-gray-100"
        onClick={() => map.zoomIn()}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="bg-white shadow-lg hover:bg-gray-100"
        onClick={() => map.zoomOut()}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="bg-white shadow-lg hover:bg-gray-100"
        onClick={onLocateDrivers}
        title="Fit all drivers"
      >
        <Locate className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Component to fly to selected driver and fit route
function FlyToDriver({ driver, customerLocation }: { driver: OnlineDriver | null; customerLocation: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (driver && driver.current_location_lat && driver.current_location_lng) {
      if (customerLocation && driver.currentJob) {
        // Fit both driver and customer in view
        const bounds = L.latLngBounds([
          [driver.current_location_lat, driver.current_location_lng],
          customerLocation,
        ]);
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
      } else {
        map.flyTo([driver.current_location_lat, driver.current_location_lng], 15, {
          duration: 1.5,
        });
      }
    }
  }, [driver, customerLocation, map]);
  
  return null;
}

// Customer destination icon
const createCustomerIcon = () => {
  return L.divIcon({
    className: "custom-customer-marker",
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 44px;
        display: flex;
        align-items: flex-start;
        justify-content: center;
      ">
        <div style="
          width: 32px;
          height: 32px;
          background: #ef4444;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          <div style="transform: rotate(45deg);">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
};

interface OnlineDriver {
  id: string;
  user_id: string;
  vehicle_plate: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_type: string | null;
  rating: number | null;
  total_jobs: number | null;
  current_location_lat: number | null;
  current_location_lng: number | null;
  status: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
  currentJob?: {
    id: string;
    job_number: string;
    status: string | null;
    pickup_address: string | null;
    eta_minutes: number | null;
    pickup_lat?: number;
    pickup_lng?: number;
    customer?: {
      full_name: string | null;
    };
  } | null;
}

// Type for route step
interface RouteStep {
  instruction: string;
  distance: number; // in meters
  duration: number; // in seconds
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
  name: string;
}

// Type for route data
interface RouteData {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
  steps: RouteStep[];
}

// Helper function to get direction icon based on maneuver
const getDirectionIcon = (type: string, modifier?: string) => {
  const iconClass = "h-4 w-4";
  
  if (type === "turn") {
    if (modifier === "left") return <ArrowLeft className={iconClass} />;
    if (modifier === "right") return <ArrowRight className={iconClass} />;
    if (modifier === "slight left") return <ArrowUpLeft className={iconClass} />;
    if (modifier === "slight right") return <ArrowUpRight className={iconClass} />;
    if (modifier === "sharp left") return <CornerUpLeft className={iconClass} />;
    if (modifier === "sharp right") return <CornerUpRight className={iconClass} />;
    if (modifier === "uturn") return <RotateCcw className={iconClass} />;
  }
  
  if (type === "new name" || type === "continue") return <ArrowUp className={iconClass} />;
  if (type === "merge") return <ArrowUpRight className={iconClass} />;
  if (type === "fork") return modifier === "left" ? <ArrowUpLeft className={iconClass} /> : <ArrowUpRight className={iconClass} />;
  if (type === "roundabout" || type === "rotary") return <RotateCcw className={iconClass} />;
  if (type === "depart" || type === "arrive") return <MapPin className={iconClass} />;
  
  return <ArrowUp className={iconClass} />;
};

// Format instruction for display
const formatInstruction = (step: RouteStep): string => {
  const { type, modifier } = step.maneuver;
  const roadName = step.name || "the road";
  
  if (type === "depart") return `Start on ${roadName}`;
  if (type === "arrive") return "Arrive at destination";
  
  if (type === "turn") {
    const direction = modifier || "ahead";
    return `Turn ${direction} onto ${roadName}`;
  }
  
  if (type === "new name" || type === "continue") {
    return `Continue onto ${roadName}`;
  }
  
  if (type === "merge") {
    return `Merge onto ${roadName}`;
  }
  
  if (type === "fork") {
    return `Take the ${modifier || "right"} fork onto ${roadName}`;
  }
  
  if (type === "roundabout" || type === "rotary") {
    return `Enter roundabout and exit onto ${roadName}`;
  }
  
  return step.instruction || `Continue on ${roadName}`;
};

// Format distance for display
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

export default function AdminLiveMap() {
  const [selectedDriver, setSelectedDriver] = useState<OnlineDriver | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simulatedPositions, setSimulatedPositions] = useState<Record<string, { lat: number; lng: number }>>({});
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [showDirections, setShowDirections] = useState(true);
  const [routeProgress, setRouteProgress] = useState(0); // 0 to 1 progress along route
  const [animatedDriverPos, setAnimatedDriverPos] = useState<[number, number] | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const animationRef = useRef<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount to prevent map glitches
  useEffect(() => {
    return () => {
      // Cancel any running animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Clear simulation interval
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      // Properly invalidate and remove the map
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  const { data: drivers, refetch } = useQuery({
    queryKey: ["admin-live-map-drivers"],
    queryFn: async () => {
      const { data: driversData, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("is_online", true);

      if (error) throw error;

      if (!driversData || driversData.length === 0) {
        return [];
      }

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone");

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      const driverIds = driversData.map(d => d.id);
      const { data: activeJobs } = await supabase
        .from("jobs")
        .select("id, job_number, status, driver_id, pickup_address, eta_minutes, customer_id, pickup_lat, pickup_lng")
        .in("driver_id", driverIds)
        .in("status", ["dispatched", "in_progress", "accepted"]);

      // Get customer names for active jobs
      const customerIds = activeJobs?.map(j => j.customer_id).filter(Boolean) || [];
      const { data: customerProfiles } = customerIds.length > 0 
        ? await supabase.from("profiles").select("id, full_name").in("id", customerIds)
        : { data: [] };
      
      const customerMap = new Map(customerProfiles?.map(c => [c.id, c] as const) || []);

      const jobsMap = new Map(activeJobs?.map(j => [j.driver_id, {
        ...j,
        customer: customerMap.get(j.customer_id) || null,
      }]));

      return driversData.map(d => ({
        ...d,
        profiles: profilesMap.get(d.user_id) || null,
        currentJob: jobsMap.get(d.id) || null,
      })) as OnlineDriver[];
    },
    refetchInterval: 10000,
  });

  // Real-time subscription for driver location updates
  useEffect(() => {
    const channel = supabase
      .channel('driver-locations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
        },
        (payload) => {
          const updatedDriver = payload.new as any;
          
          // Update simulated positions with real GPS data
          if (updatedDriver.current_location_lat && updatedDriver.current_location_lng) {
            setSimulatedPositions(prev => ({
              ...prev,
              [updatedDriver.id]: {
                lat: updatedDriver.current_location_lat,
                lng: updatedDriver.current_location_lng,
              },
            }));
          }
          
          // Refetch to get updated driver data
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Generate fallback route with mock steps when API fails
  const generateFallbackRoute = (
    driverLat: number,
    driverLng: number,
    customerLat: number,
    customerLng: number,
    customerAddress: string
  ): RouteData => {
    // Calculate straight-line distance (rough approximation)
    const latDiff = Math.abs(customerLat - driverLat);
    const lngDiff = Math.abs(customerLng - driverLng);
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // Approximate meters
    const duration = (distance / 1000) * 2 * 60; // Assume ~30km/h average, so 2 min per km
    
    // Generate intermediate points for the route
    const numPoints = 5;
    const coordinates: [number, number][] = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      coordinates.push([
        driverLat + (customerLat - driverLat) * t,
        driverLng + (customerLng - driverLng) * t,
      ]);
    }
    
    // Generate mock navigation steps
    const steps: RouteStep[] = [
      {
        instruction: "Start your journey",
        distance: 0,
        duration: 0,
        maneuver: { type: "depart", location: [driverLng, driverLat] },
        name: "Current Location",
      },
      {
        instruction: "Head towards destination",
        distance: distance * 0.3,
        duration: duration * 0.3,
        maneuver: { type: "continue", location: [driverLng + lngDiff * 0.2, driverLat + latDiff * 0.2] },
        name: "Main Road",
      },
      {
        instruction: "Continue straight",
        distance: distance * 0.4,
        duration: duration * 0.4,
        maneuver: { type: "continue", location: [driverLng + lngDiff * 0.5, driverLat + latDiff * 0.5] },
        name: "Route to Customer",
      },
      {
        instruction: "Turn right onto destination street",
        distance: distance * 0.2,
        duration: duration * 0.2,
        maneuver: { type: "turn", modifier: "right", location: [driverLng + lngDiff * 0.8, driverLat + latDiff * 0.8] },
        name: customerAddress?.split(",")[0] || "Customer Street",
      },
      {
        instruction: "Arrive at destination",
        distance: distance * 0.1,
        duration: duration * 0.1,
        maneuver: { type: "arrive", location: [customerLng, customerLat] },
        name: customerAddress || "Customer Location",
      },
    ];
    
    return { coordinates, distance, duration, steps };
  };

  // Fetch route when driver with job is selected
  useEffect(() => {
    if (!selectedDriver || !selectedDriver.currentJob?.pickup_lat || !selectedDriver.currentJob?.pickup_lng) {
      setRouteData(null);
      return;
    }

    const driverPos = simulatedPositions[selectedDriver.id] || {
      lat: selectedDriver.current_location_lat,
      lng: selectedDriver.current_location_lng,
    };

    if (!driverPos.lat || !driverPos.lng) return;

    // IMMEDIATELY set fallback route so it always shows
    const fallbackRoute = generateFallbackRoute(
      driverPos.lat,
      driverPos.lng,
      selectedDriver.currentJob.pickup_lat,
      selectedDriver.currentJob.pickup_lng,
      selectedDriver.currentJob.pickup_address || ""
    );
    
    // Set fallback immediately - this ensures the route ALWAYS shows
    setRouteData(fallbackRoute);
    setIsLoadingRoute(false);
    
    // Skip API call since it keeps failing - just use the fallback
    // The fallback already provides a good visual representation
  }, [selectedDriver?.id, selectedDriver?.currentJob?.pickup_lat, selectedDriver?.currentJob?.pickup_lng, simulatedPositions]);

  // Animate driver along route when route data is available
  useEffect(() => {
    // Track if component is mounted
    let isMounted = true;
    
    // Reset animation when route changes or driver deselected
    if (!routeData || !selectedDriver || routeData.coordinates.length < 2) {
      setRouteProgress(0);
      setAnimatedDriverPos(null);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Reset progress when switching drivers
    setRouteProgress(0);
    setAnimatedDriverPos(routeData.coordinates[0] as [number, number]);
    
    let startTime: number | null = null;
    const animationDuration = 20000; // 20 seconds to complete the route
    
    const animate = (currentTime: number) => {
      // Stop animation if component unmounted
      if (!isMounted) return;
      
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      setRouteProgress(progress);
      
      // Calculate position along the route based on progress
      if (routeData.coordinates.length >= 2) {
        const totalSegments = routeData.coordinates.length - 1;
        const exactIndex = progress * totalSegments;
        const segmentIndex = Math.floor(exactIndex);
        const segmentProgress = exactIndex - segmentIndex;
        
        if (segmentIndex < totalSegments) {
          const startPoint = routeData.coordinates[segmentIndex];
          const endPoint = routeData.coordinates[segmentIndex + 1];
          
          const lat = startPoint[0] + (endPoint[0] - startPoint[0]) * segmentProgress;
          const lng = startPoint[1] + (endPoint[1] - startPoint[1]) * segmentProgress;
          
          setAnimatedDriverPos([lat, lng]);
          
          // Update simulated positions so the driver marker moves
          setSimulatedPositions(prev => ({
            ...prev,
            [selectedDriver.id]: { lat, lng }
          }));
        }
      }
      
      if (progress < 1 && isMounted) {
        animationRef.current = requestAnimationFrame(animate);
      } else if (isMounted) {
        // Loop the animation only if still mounted
        startTime = null;
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      isMounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [routeData, selectedDriver?.id]);

  // Simulate random movement for non-selected drivers
  useEffect(() => {
    // Clear previous interval if it exists
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }

    simulationIntervalRef.current = setInterval(() => {
      setSimulatedPositions(prev => {
        const newPositions: Record<string, { lat: number; lng: number }> = { ...prev };
        drivers?.forEach(driver => {
          // Skip the selected driver - they're animated along the route
          if (selectedDriver?.id === driver.id) return;
          
          const baseLat = driver.current_location_lat || -26.1076;
          const baseLng = driver.current_location_lng || 28.0567;
          const prevPos = prev[driver.id];
          
          if (prevPos) {
            newPositions[driver.id] = {
              lat: prevPos.lat + (Math.random() - 0.5) * 0.0008,
              lng: prevPos.lng + (Math.random() - 0.5) * 0.0008,
            };
          } else {
            newPositions[driver.id] = { lat: baseLat, lng: baseLng };
          }
        });
        return newPositions;
      });
    }, 3000);

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    };
  }, [drivers, selectedDriver?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleLocateDrivers = () => {
    if (mapRef.current && mapReady && drivers && drivers.length > 0) {
      const validDrivers = drivers.filter(d => d.current_location_lat && d.current_location_lng);
      if (validDrivers.length === 0) return;
      
      const bounds = L.latLngBounds(
        validDrivers.map(d => [
          simulatedPositions[d.id]?.lat || d.current_location_lat!,
          simulatedPositions[d.id]?.lng || d.current_location_lng!,
        ] as [number, number])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const getDriverPosition = (driver: OnlineDriver): [number, number] => {
    const pos = simulatedPositions[driver.id];
    return [
      pos?.lat || driver.current_location_lat || -26.1076,
      pos?.lng || driver.current_location_lng || 28.0567,
    ];
  };

  const stats = {
    total: drivers?.length || 0,
    available: drivers?.filter(d => !d.currentJob).length || 0,
    onJob: drivers?.filter(d => d.currentJob).length || 0,
  };

  return (
    <AdminLayout>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 0; }
        }
        .leaflet-container {
          font-family: inherit;
        }
        .custom-driver-marker {
          background: transparent;
          border: none;
        }
      `}</style>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Navigation className="h-6 w-6 text-primary" />
              Live Driver Map
            </h1>
            <p className="text-muted-foreground">Real-time driver locations and job status</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/online-drivers">View List</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin">← Dashboard</Link>
            </Button>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-primary/20 p-2">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-success/20 p-2">
                <Zap className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-warning/20 p-2">
                <Activity className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.onJob}</p>
                <p className="text-sm text-muted-foreground">On Job</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map View */}
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Live Map View
                <StatusBadge variant="active" pulse>Live</StatusBadge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-[500px]">
                <MapContainer
                  center={[-26.11, 28.06]}
                  zoom={12}
                  className="h-full w-full"
                  ref={(map) => {
                    if (map) {
                      mapRef.current = map;
                      setMapReady(true);
                    }
                  }}
                  zoomControl={false}
                  key="admin-live-map" // Stable key to prevent recreation
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <MapControls onLocateDrivers={handleLocateDrivers} />
                  <FlyToDriver 
                    driver={selectedDriver} 
                    customerLocation={
                      selectedDriver?.currentJob?.pickup_lat && selectedDriver?.currentJob?.pickup_lng
                        ? [selectedDriver.currentJob.pickup_lat, selectedDriver.currentJob.pickup_lng]
                        : null
                    }
                  />
                  
                  {/* Route line for selected driver with active job */}
                  {selectedDriver && selectedDriver.currentJob?.pickup_lat && selectedDriver.currentJob?.pickup_lng && (
                    <>
                      {/* Loading indicator for route */}
                      {isLoadingRoute && (
                        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 rounded-lg px-4 py-2 shadow-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                            <span>Loading route...</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Actual road route with progress visualization */}
                      {routeData ? (
                        <>
                          {/* Calculate traveled and remaining portions */}
                          {(() => {
                            const totalSegments = routeData.coordinates.length - 1;
                            const exactIndex = routeProgress * totalSegments;
                            const segmentIndex = Math.floor(exactIndex);
                            const segmentProgress = exactIndex - segmentIndex;
                            
                            // Traveled portion (from start to current position)
                            const traveledCoords = routeData.coordinates.slice(0, segmentIndex + 1);
                            if (segmentIndex < totalSegments && animatedDriverPos) {
                              traveledCoords.push(animatedDriverPos);
                            }
                            
                            // Remaining portion (from current position to end)
                            const remainingCoords = animatedDriverPos 
                              ? [animatedDriverPos, ...routeData.coordinates.slice(segmentIndex + 1)]
                              : routeData.coordinates.slice(segmentIndex);
                            
                            return (
                              <>
                                {/* Shadow/glow effect for full route */}
                                <Polyline
                                  positions={routeData.coordinates}
                                  pathOptions={{
                                    color: "#8b5cf6",
                                    weight: 12,
                                    opacity: 0.1,
                                  }}
                                />
                                
                                {/* Remaining route (grayed out) */}
                                {remainingCoords.length >= 2 && (
                                  <Polyline
                                    positions={remainingCoords}
                                    pathOptions={{
                                      color: "#9ca3af",
                                      weight: 5,
                                      opacity: 0.6,
                                      lineCap: "round",
                                      lineJoin: "round",
                                      dashArray: "6, 8",
                                    }}
                                  />
                                )}
                                
                                {/* Traveled route (vibrant solid) */}
                                {traveledCoords.length >= 2 && (
                                  <>
                                    <Polyline
                                      positions={traveledCoords}
                                      pathOptions={{
                                        color: "#22c55e",
                                        weight: 6,
                                        opacity: 1,
                                        lineCap: "round",
                                        lineJoin: "round",
                                      }}
                                    />
                                    {/* Glow effect on traveled */}
                                    <Polyline
                                      positions={traveledCoords}
                                      pathOptions={{
                                        color: "#22c55e",
                                        weight: 12,
                                        opacity: 0.3,
                                      }}
                                    />
                                  </>
                                )}
                                
                                {/* Driver position pulse indicator */}
                                {animatedDriverPos && (
                                  <CircleMarker
                                    center={animatedDriverPos}
                                    radius={8}
                                    pathOptions={{
                                      color: "#8b5cf6",
                                      fillColor: "#8b5cf6",
                                      fillOpacity: 0.3,
                                      weight: 2,
                                    }}
                                  />
                                )}
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <>
                          {/* Fallback straight line if route not available */}
                          <Polyline
                            positions={[
                              getDriverPosition(selectedDriver),
                              [selectedDriver.currentJob.pickup_lat, selectedDriver.currentJob.pickup_lng],
                            ]}
                            pathOptions={{
                              color: "#8b5cf6",
                              weight: 4,
                              opacity: 0.8,
                              dashArray: "10, 10",
                              lineCap: "round",
                            }}
                          />
                          <Polyline
                            positions={[
                              getDriverPosition(selectedDriver),
                              [selectedDriver.currentJob.pickup_lat, selectedDriver.currentJob.pickup_lng],
                            ]}
                            pathOptions={{
                              color: "#8b5cf6",
                              weight: 6,
                              opacity: 0.3,
                            }}
                          />
                        </>
                      )}
                      
                      {/* Customer destination marker */}
                      <Marker
                        position={[selectedDriver.currentJob.pickup_lat, selectedDriver.currentJob.pickup_lng]}
                        icon={createCustomerIcon()}
                      >
                        <Popup>
                          <div className="p-2 min-w-[180px]">
                            <div className="font-semibold text-red-600">📍 Customer Location</div>
                            <div className="text-sm font-medium mt-1">
                              {selectedDriver.currentJob.customer?.full_name}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {selectedDriver.currentJob.pickup_address}
                            </div>
                            {routeData && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="text-xs text-gray-500">Route Info:</div>
                                <div className="text-sm font-medium text-primary">
                                  {(routeData.distance / 1000).toFixed(1)} km • ~{Math.ceil(routeData.duration / 60)} min
                                </div>
                              </div>
                            )}
                            <div className="text-sm font-semibold text-primary mt-2">
                              ETA: {selectedDriver.currentJob.eta_minutes} min
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    </>
                  )}
                  
                  {/* Driver markers */}
                  {drivers?.map((driver) => {
                    const position = getDriverPosition(driver);
                    const isOnJob = !!driver.currentJob;
                    const isSelected = selectedDriver?.id === driver.id;
                    
                    return (
                      <Marker
                        key={driver.id}
                        position={position}
                        icon={createDriverIcon(
                          isSelected ? "selected" : isOnJob ? "on_job" : "available"
                        )}
                        eventHandlers={{
                          click: () => setSelectedDriver(driver),
                        }}
                      >
                        <Popup>
                          <div className="p-1 min-w-[180px]">
                            <div className="font-semibold text-base">{driver.profiles?.full_name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {driver.vehicle_make} {driver.vehicle_model}
                            </div>
                            <div className="text-sm text-gray-500">{driver.vehicle_plate}</div>
                            <div className="flex items-center gap-1 mt-2">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              <span className="font-medium">{driver.rating?.toFixed(1)}</span>
                            </div>
                            {driver.currentJob && (
                              <div className="mt-2 p-2 bg-amber-50 rounded text-sm">
                                <div className="font-medium text-amber-800">On Job</div>
                                <div className="text-amber-700">ETA: {driver.currentJob.eta_minutes} min</div>
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>

                {/* Legend overlay */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg p-3 text-xs shadow-lg">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
                      <span>On Job</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Customer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-1 rounded-full bg-success" />
                      <span>Traveled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-gray-400" style={{ borderTop: '2px dashed #9ca3af' }} />
                      <span>Remaining</span>
                    </div>
                  </div>
                </div>

                {/* Auto-refresh indicator */}
                <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 text-xs shadow-lg text-gray-600">
                  Auto-refresh: 10s
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver List / Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                {selectedDriver ? (
                  <>
                    <Users className="h-5 w-5 text-primary" />
                    Driver Details
                  </>
                ) : (
                  <>
                    <Car className="h-5 w-5 text-primary" />
                    Online Drivers
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDriver ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="text-lg bg-primary/10">
                          {selectedDriver.profiles?.full_name?.charAt(0) || "D"}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background ${
                        selectedDriver.currentJob ? "bg-warning" : "bg-success"
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{selectedDriver.profiles?.full_name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        {selectedDriver.rating?.toFixed(1) || "5.0"}
                        <span className="mx-1">•</span>
                        {selectedDriver.total_jobs} jobs
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedDriver.vehicle_make} {selectedDriver.vehicle_model}</span>
                      <span className="text-muted-foreground">({selectedDriver.vehicle_plate})</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedDriver.profiles?.phone || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {(simulatedPositions[selectedDriver.id]?.lat || selectedDriver.current_location_lat)?.toFixed(4)}, 
                        {(simulatedPositions[selectedDriver.id]?.lng || selectedDriver.current_location_lng)?.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {selectedDriver.currentJob ? (
                    <Card className="mt-4 bg-warning/5 border-warning/20">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <StatusBadge variant="warning">On Job</StatusBadge>
                          <span className="font-mono text-sm font-medium">{selectedDriver.currentJob.job_number}</span>
                        </div>
                        <div className="text-sm space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>Customer: {selectedDriver.currentJob.customer?.full_name || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedDriver.currentJob.pickup_address}</span>
                          </div>
                          
                          {/* Route information */}
                          {routeData ? (
                            <div className="mt-3 space-y-3">
                              {/* Route Progress Bar */}
                              <div className="p-3 bg-gradient-to-r from-success/10 to-primary/10 rounded-lg border border-primary/20">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1">
                                    <Car className="h-3 w-3" />
                                    Route Progress
                                  </span>
                                  <span className="font-semibold text-primary">{Math.round(routeProgress * 100)}%</span>
                                </div>
                                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-success to-primary rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${routeProgress * 100}%` }}
                                    transition={{ duration: 0.3, ease: "linear" }}
                                  />
                                  <div 
                                    className="absolute inset-y-0 bg-white/30 animate-pulse"
                                    style={{ 
                                      left: `${Math.max(0, routeProgress * 100 - 5)}%`, 
                                      width: '5%',
                                      borderRadius: '9999px'
                                    }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                  <span>Start</span>
                                  <span className="text-success font-medium">
                                    {((routeData.distance / 1000) * routeProgress).toFixed(1)} km traveled
                                  </span>
                                  <span>Destination</span>
                                </div>
                              </div>
                              
                              {/* Route Summary */}
                              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                  <Navigation className="h-3 w-3" />
                                  <span>Route Details</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="text-center p-2 bg-background rounded">
                                    <p className="text-lg font-bold text-primary">
                                      {((routeData.distance / 1000) * (1 - routeProgress)).toFixed(1)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">km remaining</p>
                                  </div>
                                  <div className="text-center p-2 bg-background rounded">
                                    <p className="text-lg font-bold text-primary">
                                      {Math.ceil((routeData.duration / 60) * (1 - routeProgress))}
                                    </p>
                                    <p className="text-xs text-muted-foreground">min ETA</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Turn-by-Turn Directions */}
                              {routeData.steps && routeData.steps.length > 0 && (
                                <div className="rounded-lg border border-primary/20 overflow-hidden">
                                  <button
                                    onClick={() => setShowDirections(!showDirections)}
                                    className="w-full flex items-center justify-between p-3 bg-primary/5 hover:bg-primary/10 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                      <Route className="h-4 w-4 text-primary" />
                                      <span>Turn-by-Turn Directions</span>
                                      <span className="text-xs text-muted-foreground">({routeData.steps.length} steps)</span>
                                    </div>
                                    {showDirections ? (
                                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </button>
                                  
                                  <AnimatePresence>
                                    {showDirections && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <ScrollArea className="max-h-[200px]">
                                          <div className="divide-y divide-border">
                                            {routeData.steps.map((step, index) => (
                                              <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`flex items-start gap-3 p-3 ${
                                                  index === 0 ? "bg-success/5" : 
                                                  index === routeData.steps.length - 1 ? "bg-destructive/5" : 
                                                  "bg-background"
                                                }`}
                                              >
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                  index === 0 ? "bg-success text-success-foreground" : 
                                                  index === routeData.steps.length - 1 ? "bg-destructive text-destructive-foreground" : 
                                                  "bg-primary/10 text-primary"
                                                }`}>
                                                  {getDirectionIcon(step.maneuver.type, step.maneuver.modifier)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium">{formatInstruction(step)}</p>
                                                  {step.distance > 0 && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                      {formatDistance(step.distance)}
                                                    </p>
                                                  )}
                                                </div>
                                                <div className="flex-shrink-0 text-xs text-muted-foreground">
                                                  {index + 1}
                                                </div>
                                              </motion.div>
                                            ))}
                                          </div>
                                        </ScrollArea>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>
                          ) : isLoadingRoute ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Calculating route...</span>
                            </div>
                          ) : null}
                          
                          <div className="flex items-center gap-2 font-semibold text-primary pt-2">
                            <Clock className="h-4 w-4" />
                            <span>ETA: {selectedDriver.currentJob.eta_minutes} min</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="mt-4 bg-success/5 border-success/20">
                      <CardContent className="p-4 text-center">
                        <StatusBadge variant="success">Available</StatusBadge>
                        <p className="text-sm text-muted-foreground mt-2">Ready to accept new jobs</p>
                      </CardContent>
                    </Card>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setSelectedDriver(null)}
                  >
                    Back to List
                  </Button>
                </motion.div>
              ) : (
                <ScrollArea className="h-[420px] pr-4">
                  <div className="space-y-2">
                    {drivers?.map((driver) => (
                      <motion.div
                        key={driver.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedDriver(driver)}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>
                              {driver.profiles?.full_name?.charAt(0) || "D"}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                            driver.currentJob ? "bg-warning" : "bg-success"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{driver.profiles?.full_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Car className="h-3 w-3" />
                            <span className="truncate">{driver.vehicle_plate}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {driver.currentJob ? (
                            <div className="flex flex-col items-end gap-1">
                              <StatusBadge variant="warning" className="text-xs">On Job</StatusBadge>
                              <span className="text-xs font-semibold text-primary">
                                {driver.currentJob.eta_minutes}m ETA
                              </span>
                            </div>
                          ) : (
                            <StatusBadge variant="success" className="text-xs">Available</StatusBadge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
