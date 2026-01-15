import { useState, useEffect } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

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
];

export default function AdminLiveMap() {
  const [selectedDriver, setSelectedDriver] = useState<OnlineDriver | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simulatedPositions, setSimulatedPositions] = useState<Record<string, { lat: number; lng: number }>>({});

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

  // Simulate driver movement
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedPositions(prev => {
        const newPositions: Record<string, { lat: number; lng: number }> = {};
        drivers?.forEach(driver => {
          const baseLat = driver.current_location_lat || -26.1076;
          const baseLng = driver.current_location_lng || 28.0567;
          const prevPos = prev[driver.id];
          
          if (prevPos) {
            // Move slightly in a random direction
            newPositions[driver.id] = {
              lat: prevPos.lat + (Math.random() - 0.5) * 0.002,
              lng: prevPos.lng + (Math.random() - 0.5) * 0.002,
            };
          } else {
            newPositions[driver.id] = { lat: baseLat, lng: baseLng };
          }
        });
        return newPositions;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [drivers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const stats = {
    total: drivers?.length || 0,
    available: drivers?.filter(d => !d.currentJob).length || 0,
    onJob: drivers?.filter(d => d.currentJob).length || 0,
  };

  // Calculate driver positions for the simulated map
  const getDriverPosition = (driver: OnlineDriver) => {
    const pos = simulatedPositions[driver.id] || {
      lat: driver.current_location_lat || -26.1076,
      lng: driver.current_location_lng || 28.0567,
    };
    // Convert lat/lng to percentage positions on the map (simplified)
    const centerLat = -26.11;
    const centerLng = 28.06;
    const scale = 1500;
    
    return {
      x: 50 + (pos.lng - centerLng) * scale,
      y: 50 + (pos.lat - centerLat) * scale,
    };
  };

  return (
    <AdminLayout>
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
              <div className="relative h-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                {/* Animated grid background */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `
                      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                  }} />
                </div>

                {/* Simulated roads */}
                <svg className="absolute inset-0 w-full h-full opacity-30">
                  <defs>
                    <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  <path d="M0,250 Q150,200 300,250 T600,250" stroke="url(#roadGradient)" strokeWidth="3" fill="none" />
                  <path d="M250,0 Q280,150 250,300 T250,500" stroke="url(#roadGradient)" strokeWidth="3" fill="none" />
                  <path d="M100,100 L400,400" stroke="url(#roadGradient)" strokeWidth="2" fill="none" />
                  <path d="M400,100 L100,400" stroke="url(#roadGradient)" strokeWidth="2" fill="none" />
                </svg>

                {/* Map center indicator */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white/80">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-primary" />
                    Johannesburg CBD Area
                  </div>
                </div>

                {/* Driver markers */}
                <AnimatePresence>
                  {drivers?.map((driver) => {
                    const pos = getDriverPosition(driver);
                    const isOnJob = !!driver.currentJob;
                    const isSelected = selectedDriver?.id === driver.id;
                    
                    return (
                      <motion.div
                        key={driver.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: 1, 
                          opacity: 1,
                          x: `${pos.x}%`,
                          y: `${pos.y}%`,
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 100,
                          damping: 15,
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                        onClick={() => setSelectedDriver(driver)}
                        style={{ left: 0, top: 0 }}
                      >
                        {/* Pulse ring for drivers on job */}
                        {isOnJob && (
                          <motion.div
                            className="absolute inset-0 rounded-full bg-warning/30"
                            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ width: 48, height: 48, margin: -8 }}
                          />
                        )}
                        
                        {/* Driver marker */}
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-lg ${
                            isSelected
                              ? "bg-primary border-white shadow-primary/50"
                              : isOnJob
                              ? "bg-warning border-warning-foreground shadow-warning/30"
                              : "bg-success border-success-foreground shadow-success/30"
                          }`}
                        >
                          <Car className="h-5 w-5 text-white" />
                        </motion.div>

                        {/* Driver label */}
                        <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded ${
                          isSelected ? "bg-primary text-white" : "bg-black/70 text-white/90"
                        }`}>
                          {driver.profiles?.full_name?.split(' ')[0] || "Driver"}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span className="text-white/80">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
                      <span className="text-white/80">On Job</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-white/80">Selected</span>
                    </div>
                  </div>
                </div>

                {/* Last updated */}
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white/60">
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
                        {selectedDriver.current_location_lat?.toFixed(4)}, {selectedDriver.current_location_lng?.toFixed(4)}
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
                          <div className="flex items-center gap-2 font-semibold text-primary">
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
