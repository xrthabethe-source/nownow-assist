import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { TyreIcon, BatteryIcon, FuelIcon, PumpIcon, WrenchIcon } from "@/components/icons/ServiceIcons";
import { BottomNav } from "@/components/shared/BottomNav";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { DriverNotificationsDialog } from "@/components/driver/DriverNotificationsDialog";
import { MapPin, Clock, Zap, Star, TrendingUp, Bell, Settings, ChevronRight, Navigation, Loader2, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAvailableJobs, useAcceptJob } from "@/hooks/useJobs";
import { useJobAlert } from "@/hooks/useJobAlert";
import { Badge } from "@/components/ui/badge";
import { startOfToday, startOfWeek } from "date-fns";

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Tyre Change": TyreIcon,
  "Jump-Start": BatteryIcon,
  "Fuel Rescue": FuelIcon,
  "Battery Boost + Diagnostics": BatteryIcon,
  "Call a Mechanic": WrenchIcon,
};

export const DriverHome = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch driver record for current user
  const { data: driverRecord } = useQuery({
    queryKey: ["driver-record", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("drivers")
        .select("id, rating, total_jobs")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch today's earnings
  const { data: todayStats } = useQuery({
    queryKey: ["driver-today-stats", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return { earnings: 0, jobCount: 0 };
      const today = startOfToday();
      
      const { data } = await supabase
        .from("jobs")
        .select("final_price, estimated_price")
        .eq("driver_id", driverRecord.id)
        .eq("status", "completed")
        .gte("completed_at", today.toISOString());

      const earnings = (data || []).reduce((sum, job) => {
        return sum + ((job.final_price || job.estimated_price || 0) * 0.8);
      }, 0);

      return {
        earnings: Math.round(earnings),
        jobCount: data?.length || 0,
      };
    },
    enabled: !!driverRecord?.id,
  });

  // Fetch this week's earnings
  const { data: weekStats } = useQuery({
    queryKey: ["driver-week-stats", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return { earnings: 0 };
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      const { data } = await supabase
        .from("jobs")
        .select("final_price, estimated_price")
        .eq("driver_id", driverRecord.id)
        .eq("status", "completed")
        .gte("completed_at", weekStart.toISOString());

      const earnings = (data || []).reduce((sum, job) => {
        return sum + ((job.final_price || job.estimated_price || 0) * 0.8);
      }, 0);

      return { earnings: Math.round(earnings) };
    },
    enabled: !!driverRecord?.id,
  });

  // Fetch available jobs from database
  const { data: availableJobs } = useAvailableJobs(driverRecord?.id || null);
  const acceptJobMutation = useAcceptJob();
  
  // Get first pending job to show as alert
  const pendingJob = availableJobs?.[0];

  // Job alert ringtone - plays when there's a pending job and not muted
  const { stopRinging } = useJobAlert(!!pendingJob && isOnline && !isMuted);

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

  const handleAcceptJob = async (jobId: string) => {
    if (!driverRecord?.id) return;
    
    try {
      await acceptJobMutation.mutateAsync({
        jobId,
        driverId: driverRecord.id,
      });
      navigate("/driver/job/active");
    } catch (error) {
      console.error("Failed to accept job:", error);
    }
  };

  const stats = {
    todayEarnings: `R${(todayStats?.earnings || 0).toLocaleString()}`,
    weekEarnings: `R${(weekStats?.earnings || 0).toLocaleString()}`,
    completedJobs: todayStats?.jobCount || 0,
    rating: driverRecord?.rating || 0,
    acceptanceRate: 0, // Would need to track accepts/declines to calculate
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Deep Trust Blue */}
      <header className="sticky top-0 z-40 border-b border-border bg-primary/95 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <Logo size="lg" />
          <div className="flex items-center gap-2">
            <RoleSwitcher variant="compact" />
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="rounded-full text-white relative"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="rounded-full text-white"
              onClick={() => navigate("/driver/profile")}
            >
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
          <Card variant={isOnline ? "amber" : "outline"} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      isOnline ? "bg-accent" : "bg-white/10"
                    }`}
                  >
                    <Zap className={`h-6 w-6 ${isOnline ? "text-white" : "text-white/60"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {isOnline ? "You're Online" : "You're Offline"}
                    </p>
                    <p className="text-sm text-white/70">
                      {isOnline ? "Receiving job requests" : "Go online to receive jobs"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isOnline}
                  onCheckedChange={setIsOnline}
                  className="data-[state=checked]:bg-accent"
                />
              </div>
              
              {/* GPS Status Indicator */}
              {isOnline && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 pt-3 border-t border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`relative flex items-center justify-center`}>
                        <Navigation className={`h-4 w-4 ${isTracking ? "text-success" : "text-white/50"}`} />
                        {isTracking && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success animate-pulse" />
                        )}
                      </div>
                      <span className="text-sm text-white/70">
                        {isTracking ? "GPS Active" : "GPS Off"}
                      </span>
                    </div>
                    {location && isTracking && (
                      <span className="text-xs text-white/50 font-mono">
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
                      className="h-7 text-xs text-white"
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
      {isOnline && pendingJob && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="container py-2"
        >
          <Card variant="default" className="border-2 border-accent overflow-hidden">
            <div className="h-1.5 bg-white/20 overflow-hidden">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 60, ease: "linear" }}
              />
            </div>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge variant="warning" pulse>New Request</StatusBadge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 rounded-full"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-accent" />
                    )}
                  </Button>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {pendingJob.eta_minutes || 20}min ETA
                </span>
              </div>

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                  {(() => {
                    const IconComponent = serviceIcons[pendingJob.services?.name || ""] || TyreIcon;
                    return <IconComponent className="h-6 w-6 text-accent" />;
                  })()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{pendingJob.services?.name || "Service"}</p>
                  <p className="text-sm text-muted-foreground">{(pendingJob as any).customer?.full_name || "Customer"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-accent">R{Math.round((pendingJob.estimated_price || 0) * 0.8)}</p>
                  <p className="text-sm text-muted-foreground">Payout</p>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{pendingJob.pickup_address || "Location pending"}</span>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-border text-foreground"
                  disabled={acceptJobMutation.isPending}
                >
                  Decline
                </Button>
                <Button
                  variant="amber"
                  className="flex-1"
                  onClick={() => handleAcceptJob(pendingJob.id)}
                  disabled={acceptJobMutation.isPending}
                >
                  {acceptJobMutation.isPending ? "Accepting..." : "Accept Job"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="container py-4">
        <div className="mb-3">
          <h3 className="font-semibold text-white">Today's Summary</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="default" className="cursor-pointer transition-all hover:border-accent/50" onClick={() => navigate("/driver/earnings")}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Earnings</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.todayEarnings}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card variant="default" className="cursor-pointer transition-all hover:border-accent/50" onClick={() => navigate("/driver/earnings")}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Jobs</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.completedJobs}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="default" className="cursor-pointer transition-all hover:border-accent/50" onClick={() => navigate("/driver/earnings")}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span className="text-sm">Rating</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.rating > 0 ? stats.rating.toFixed(1) : "—"}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card variant="default" className="cursor-pointer transition-all hover:border-accent/50" onClick={() => navigate("/driver/earnings")}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm">Total Jobs</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{driverRecord?.total_jobs || 0}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Weekly Earnings */}
      <div className="container py-4">
        <Card variant="amber" onClick={() => navigate("/driver/earnings")} className="cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">This Week</p>
                <p className="text-3xl font-bold text-white">{stats.weekEarnings}</p>
              </div>
              <ChevronRight className="h-6 w-6 text-white/70" />
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav type="driver" />
      
      {/* Notifications Dialog */}
      <DriverNotificationsDialog 
        open={notificationsOpen} 
        onOpenChange={setNotificationsOpen} 
      />
    </div>
  );
};

export default DriverHome;
