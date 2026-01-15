import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { TyreIcon, BatteryIcon, FuelIcon, PumpIcon, WrenchIcon } from "@/components/icons/ServiceIcons";
import { BottomNav } from "@/components/shared/BottomNav";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MapPin, Clock, Zap, Star, TrendingUp, Bell, Settings, ChevronRight, Navigation, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const mockStats = {
  todayEarnings: "R1,250",
  weekEarnings: "R8,450",
  completedJobs: 12,
  rating: 4.9,
  acceptanceRate: 95,
};

const mockPendingJob = {
  id: "job-123",
  service: "Tyre Change",
  icon: TyreIcon,
  customerName: "John M.",
  location: "123 Main Street, Sandton",
  distance: "2.3 km",
  payout: "R280",
  expiresIn: 18,
};

export const DriverHome = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showJobAlert, setShowJobAlert] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch driver record for current user
  const { data: driverRecord } = useQuery({
    queryKey: ["driver-record", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // GPS Location tracking
  const {
    location,
    isTracking,
    error: locationError,
    toggleTracking,
  } = useDriverLocation({
    driverId: driverRecord?.id || null,
    enabled: isOnline && !!driverRecord?.id,
    updateInterval: 5000,
  });

  // Update online status in database
  useEffect(() => {
    if (!driverRecord?.id) return;
    
    const updateOnlineStatus = async () => {
      await supabase
        .from("drivers")
        .update({ is_online: isOnline })
        .eq("id", driverRecord.id);
    };
    
    updateOnlineStatus();
  }, [isOnline, driverRecord?.id]);

  const handleAcceptJob = () => {
    navigate("/driver/job/active");
  };

  return (
    <div className="min-h-screen bg-background pb-24 dark">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Online Toggle */}
      <div className="container py-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant={isOnline ? "amber" : "default"} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      isOnline ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <Zap className={`h-6 w-6 ${isOnline ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {isOnline ? "You're Online" : "You're Offline"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isOnline ? "Receiving job requests" : "Go online to receive jobs"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isOnline}
                  onCheckedChange={setIsOnline}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              
              {/* GPS Status Indicator */}
              {isOnline && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 pt-3 border-t border-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`relative flex items-center justify-center`}>
                        <Navigation className={`h-4 w-4 ${isTracking ? "text-success" : "text-muted-foreground"}`} />
                        {isTracking && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success animate-pulse" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {isTracking ? "GPS Active" : "GPS Off"}
                      </span>
                    </div>
                    {location && isTracking && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </span>
                    )}
                    {locationError && (
                      <span className="text-xs text-destructive">
                        {locationError}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleTracking}
                      className="h-7 text-xs"
                    >
                      {isTracking ? "Stop" : "Start"} GPS
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Incoming Job Alert */}
      {isOnline && showJobAlert && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="container py-2"
        >
          <Card variant="interactive" className="border-2 border-primary overflow-hidden">
            <div className="h-1.5 bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 20, ease: "linear" }}
              />
            </div>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <StatusBadge variant="primary" pulse>New Request</StatusBadge>
                <span className="text-sm font-medium text-muted-foreground">
                  {mockPendingJob.expiresIn}s remaining
                </span>
              </div>

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <mockPendingJob.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{mockPendingJob.service}</p>
                  <p className="text-sm text-muted-foreground">{mockPendingJob.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{mockPendingJob.payout}</p>
                  <p className="text-sm text-muted-foreground">{mockPendingJob.distance}</p>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{mockPendingJob.location}</span>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowJobAlert(false)}
                >
                  Decline
                </Button>
                <Button
                  variant="amber"
                  className="flex-1"
                  onClick={handleAcceptJob}
                >
                  Accept Job
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="container py-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Today's Summary</h3>
          <Button variant="link" size="sm" className="text-primary">
            View Details
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="default">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Earnings</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{mockStats.todayEarnings}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card variant="default">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Jobs</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{mockStats.completedJobs}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="default">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span className="text-sm">Rating</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{mockStats.rating}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card variant="default">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm">Accept Rate</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{mockStats.acceptanceRate}%</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Weekly Earnings */}
      <div className="container py-4">
        <Card variant="elevated" onClick={() => navigate("/driver/earnings")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold text-foreground">{mockStats.weekEarnings}</p>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav type="driver" />
    </div>
  );
};

export default DriverHome;
