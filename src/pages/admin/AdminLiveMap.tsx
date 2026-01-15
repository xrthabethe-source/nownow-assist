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

// Demo drivers with simulated locations around Johannesburg
const demoDrivers: OnlineDriver[] = [
  {
    id: "drv-001",
    user_id: "usr-001",
    vehicle_plate: "GP 123 ABC",
    vehicle_make: "Toyota",
    vehicle_model: "Hilux",
    vehicle_type: "truck",
    rating: 4.8,
    total_jobs: 156,
    current_location_lat: -26.1076,
    current_location_lng: 28.0567,
    status: "available",
    profiles: { full_name: "Samuel Khumalo", email: "samuel@email.com", phone: "+27 84 345 6789" },
    currentJob: null,
  },
  {
    id: "drv-002",
    user_id: "usr-002",
    vehicle_plate: "GP 456 DEF",
    vehicle_make: "Ford",
    vehicle_model: "Ranger",
    vehicle_type: "truck",
    rating: 4.6,
    total_jobs: 89,
    current_location_lat: -26.1344,
    current_location_lng: 28.0436,
    status: "on_job",
    profiles: { full_name: "David Okonkwo", email: "david@email.com", phone: "+27 85 456 7890" },
    currentJob: {
      id: "job-001",
      job_number: "JOB-2025-001",
      status: "in_progress",
      pickup_address: "123 Main St, Sandton",
      eta_minutes: 8,
      pickup_lat: -26.1052,
      pickup_lng: 28.0527,
      customer: { full_name: "John Mokoena" },
    },
  },
  {
    id: "drv-003",
    user_id: "usr-003",
    vehicle_plate: "GP 789 GHI",
    vehicle_make: "Isuzu",
    vehicle_model: "KB",
    vehicle_type: "truck",
    rating: 4.9,
    total_jobs: 234,
    current_location_lat: -26.0884,
    current_location_lng: 28.0849,
    status: "available",
    profiles: { full_name: "Blessing Ndlovu", email: "blessing@email.com", phone: "+27 88 789 0123" },
    currentJob: null,
  },
  {
    id: "drv-004",
    user_id: "usr-004",
    vehicle_plate: "GP 321 JKL",
    vehicle_make: "Nissan",
    vehicle_model: "NP200",
    vehicle_type: "bakkie",
    rating: 4.5,
    total_jobs: 67,
    current_location_lat: -26.1496,
    current_location_lng: 28.0289,
    status: "on_job",
    profiles: { full_name: "Thabo Molefe", email: "thabo@email.com", phone: "+27 82 111 2222" },
    currentJob: {
      id: "job-002",
      job_number: "JOB-2025-002",
      status: "dispatched",
      pickup_address: "45 Oak Ave, Rosebank",
      eta_minutes: 12,
      pickup_lat: -26.1467,
      pickup_lng: 28.0410,
      customer: { full_name: "Sarah Nkosi" },
    },
  },
  {
    id: "drv-005",
    user_id: "usr-005",
    vehicle_plate: "GP 654 MNO",
    vehicle_make: "VW",
    vehicle_model: "Amarok",
    vehicle_type: "truck",
    rating: 4.7,
    total_jobs: 112,
    current_location_lat: -26.1187,
    current_location_lng: 28.1043,
    status: "available",
    profiles: { full_name: "Peter van der Berg", email: "peter@email.com", phone: "+27 83 333 4444" },
    currentJob: null,
  },
  {
    id: "drv-006",
    user_id: "usr-006",
    vehicle_plate: "GP 987 PQR",
    vehicle_make: "Mercedes",
    vehicle_model: "Vito",
    vehicle_type: "van",
    rating: 4.9,
    total_jobs: 298,
    current_location_lat: -26.0753,
    current_location_lng: 28.0298,
    status: "available",
    profiles: { full_name: "James Sithole", email: "james@email.com", phone: "+27 79 555 6666" },
    currentJob: null,
  },
  {
    id: "drv-007",
    user_id: "usr-007",
    vehicle_plate: "GP 111 STU",
    vehicle_make: "Toyota",
    vehicle_model: "Quantum",
    vehicle_type: "minibus",
    rating: 4.4,
    total_jobs: 45,
    current_location_lat: -26.1623,
    current_location_lng: 28.0712,
    status: "on_job",
    profiles: { full_name: "Lucky Mthembu", email: "lucky@email.com", phone: "+27 71 777 8888" },
    currentJob: {
      id: "job-003",
      job_number: "JOB-2025-003",
      status: "in_progress",
      pickup_address: "78 William Nicol, Fourways",
      eta_minutes: 15,
      pickup_lat: -26.0234,
      pickup_lng: 28.0123,
      customer: { full_name: "Mike Richardson" },
    },
  },
];

// Type for route data
interface RouteData {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
}

export default function AdminLiveMap() {
  const [selectedDriver, setSelectedDriver] = useState<OnlineDriver | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simulatedPositions, setSimulatedPositions] = useState<Record<string, { lat: number; lng: number }>>({});
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const { data: drivers, refetch } = useQuery({
    queryKey: ["admin-live-map-drivers"],
    queryFn: async () => {
      const { data: driversData, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("is_online", true);

      if (error) throw error;

      if (!driversData || driversData.length === 0) {
        return demoDrivers;
      }

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone");

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      const driverIds = driversData.map(d => d.id);
      const { data: activeJobs } = await supabase
        .from("jobs")
        .select("id, job_number, status, driver_id, pickup_address, eta_minutes, customer_id")
        .in("driver_id", driverIds)
        .in("status", ["dispatched", "in_progress", "accepted"]);

      const jobsMap = new Map(activeJobs?.map(j => [j.driver_id, j]));

      return driversData.map(d => ({
        ...d,
        profiles: profilesMap.get(d.user_id) || null,
        currentJob: jobsMap.get(d.id) || null,
      })) as OnlineDriver[];
    },
    refetchInterval: 10000,
  });

  // Fetch route when driver with job is selected
  useEffect(() => {
    const fetchRoute = async () => {
      if (!selectedDriver || !selectedDriver.currentJob?.pickup_lat || !selectedDriver.currentJob?.pickup_lng) {
        setRouteData(null);
        return;
      }

      const driverPos = simulatedPositions[selectedDriver.id] || {
        lat: selectedDriver.current_location_lat,
        lng: selectedDriver.current_location_lng,
      };

      if (!driverPos.lat || !driverPos.lng) return;

      setIsLoadingRoute(true);
      
      try {
        // Use OSRM demo server for routing (free, no API key needed)
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${driverPos.lng},${driverPos.lat};${selectedDriver.currentJob.pickup_lng},${selectedDriver.currentJob.pickup_lat}?overview=full&geometries=geojson`
        );
        
        const data = await response.json();
        
        if (data.code === "Ok" && data.routes?.[0]) {
          const route = data.routes[0];
          setRouteData({
            coordinates: route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]), // Convert [lng, lat] to [lat, lng]
            distance: route.distance,
            duration: route.duration,
          });
        }
      } catch (error) {
        console.error("Failed to fetch route:", error);
        // Fallback to straight line if routing fails
        setRouteData(null);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [selectedDriver, simulatedPositions]);

  // Simulate driver movement along route
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedPositions(prev => {
        const newPositions: Record<string, { lat: number; lng: number }> = {};
        drivers?.forEach(driver => {
          const baseLat = driver.current_location_lat || -26.1076;
          const baseLng = driver.current_location_lng || 28.0567;
          const prevPos = prev[driver.id];
          
          // If this driver has a route and is selected, move along the route
          if (driver.currentJob && routeData && selectedDriver?.id === driver.id && routeData.coordinates.length > 0) {
            if (prevPos) {
              // Find current position on route and move towards destination
              const routeProgress = Math.random() * 0.02; // Small progress each tick
              const currentIndex = Math.floor(Math.random() * Math.min(3, routeData.coordinates.length));
              const targetPoint = routeData.coordinates[Math.min(currentIndex + 1, routeData.coordinates.length - 1)];
              
              newPositions[driver.id] = {
                lat: prevPos.lat + (targetPoint[0] - prevPos.lat) * routeProgress,
                lng: prevPos.lng + (targetPoint[1] - prevPos.lng) * routeProgress,
              };
            } else {
              newPositions[driver.id] = { lat: baseLat, lng: baseLng };
            }
          } else {
            // Regular random movement for non-routed drivers
            if (prevPos) {
              newPositions[driver.id] = {
                lat: prevPos.lat + (Math.random() - 0.5) * 0.001,
                lng: prevPos.lng + (Math.random() - 0.5) * 0.001,
              };
            } else {
              newPositions[driver.id] = { lat: baseLat, lng: baseLng };
            }
          }
        });
        return newPositions;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [drivers, routeData, selectedDriver]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleLocateDrivers = () => {
    if (mapRef.current && drivers && drivers.length > 0) {
      const bounds = L.latLngBounds(
        drivers
          .filter(d => d.current_location_lat && d.current_location_lng)
          .map(d => [
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
                  ref={mapRef}
                  zoomControl={false}
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
                      
                      {/* Actual road route or fallback straight line */}
                      {routeData ? (
                        <>
                          {/* Shadow/glow effect */}
                          <Polyline
                            positions={routeData.coordinates}
                            pathOptions={{
                              color: "#8b5cf6",
                              weight: 10,
                              opacity: 0.2,
                            }}
                          />
                          {/* Main route line */}
                          <Polyline
                            positions={routeData.coordinates}
                            pathOptions={{
                              color: "#8b5cf6",
                              weight: 5,
                              opacity: 0.9,
                              lineCap: "round",
                              lineJoin: "round",
                            }}
                          />
                          {/* Animated dashed overlay */}
                          <Polyline
                            positions={routeData.coordinates}
                            pathOptions={{
                              color: "#ffffff",
                              weight: 2,
                              opacity: 0.6,
                              dashArray: "8, 12",
                              lineCap: "round",
                            }}
                          />
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
                      <div className="w-6 h-0.5 bg-primary" style={{ borderTop: '2px dashed #8b5cf6' }} />
                      <span>Route</span>
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
                            <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <Navigation className="h-3 w-3" />
                                <span>Route Details</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="text-center p-2 bg-background rounded">
                                  <p className="text-lg font-bold text-primary">{(routeData.distance / 1000).toFixed(1)}</p>
                                  <p className="text-xs text-muted-foreground">km away</p>
                                </div>
                                <div className="text-center p-2 bg-background rounded">
                                  <p className="text-lg font-bold text-primary">{Math.ceil(routeData.duration / 60)}</p>
                                  <p className="text-xs text-muted-foreground">min drive</p>
                                </div>
                              </div>
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
