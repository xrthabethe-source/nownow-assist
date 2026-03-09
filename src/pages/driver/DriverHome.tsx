import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { TyreIcon, BatteryIcon, FuelIcon, WrenchIcon } from "@/components/icons/ServiceIcons";
import { BottomNav } from "@/components/shared/BottomNav";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { DriverNotificationsDialog } from "@/components/driver/DriverNotificationsDialog";
import { DriverVerificationSection } from "@/components/driver/DriverVerificationSection";
import { DriverMessagesPanel } from "@/components/driver/DriverMessagesPanel";
import { useDriverVerification } from "@/hooks/useDriverVerification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, Clock, Zap, Star, TrendingUp, Bell, Settings, ChevronRight,
  Navigation, Loader2, Volume2, VolumeX, Shield, User, FileText,
  MessageSquare, HelpCircle, CheckCircle2, AlertCircle,
} from "lucide-react";
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
  "Tyre Change": TyreIcon, "Jump-Start": BatteryIcon, "Fuel Rescue": FuelIcon,
  "Battery Boost + Diagnostics": BatteryIcon, "Call a Mechanic": WrenchIcon,
};

export const DriverHome = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: driverRecord, isLoading: driverLoading } = useQuery({
    queryKey: ["driver-record", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("drivers")
        .select("id, rating, total_jobs, status, is_online")
        .eq("user_id", user.id)
        .maybeSingle();
      
      // Create driver record if it doesn't exist
      if (!data) {
        const { data: newDriver } = await supabase
          .from("drivers")
          .insert({ user_id: user.id, status: "pending" })
          .select("id, rating, total_jobs, status, is_online")
          .single();
        return newDriver;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: profile } = useQuery({
    queryKey: ["driver-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { canGoOnline, verification, isLoading: verificationLoading, isVerified } = useDriverVerification(driverRecord?.id || null);

  // Initialize verification record if it doesn't exist
  useEffect(() => {
    if (driverRecord?.id && !verification && !verificationLoading) {
      supabase.from("driver_verifications" as any)
        .select("id")
        .eq("driver_id", driverRecord.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) {
            supabase.from("driver_verifications" as any)
              .insert({ driver_id: driverRecord.id, status: "not_started" })
              .then(() => {});
          }
        });
    }
  }, [driverRecord?.id, verification, verificationLoading]);

  const { data: todayStats } = useQuery({
    queryKey: ["driver-today-stats", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return { earnings: 0, jobCount: 0 };
      const today = startOfToday();
      const { data } = await supabase.from("jobs").select("final_price, estimated_price").eq("driver_id", driverRecord.id).eq("status", "completed").gte("completed_at", today.toISOString());
      const earnings = (data || []).reduce((sum, job) => sum + ((job.final_price || job.estimated_price || 0) * 0.8), 0);
      return { earnings: Math.round(earnings), jobCount: data?.length || 0 };
    },
    enabled: !!driverRecord?.id && canGoOnline,
  });

  const { data: weekStats } = useQuery({
    queryKey: ["driver-week-stats", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return { earnings: 0 };
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const { data } = await supabase.from("jobs").select("final_price, estimated_price").eq("driver_id", driverRecord.id).eq("status", "completed").gte("completed_at", weekStart.toISOString());
      const earnings = (data || []).reduce((sum, job) => sum + ((job.final_price || job.estimated_price || 0) * 0.8), 0);
      return { earnings: Math.round(earnings) };
    },
    enabled: !!driverRecord?.id && canGoOnline,
  });

  const { data: availableJobs } = useAvailableJobs(canGoOnline ? (driverRecord?.id || null) : null);
  const acceptJobMutation = useAcceptJob();
  const pendingJob = canGoOnline ? availableJobs?.[0] : null;
  const { stopRinging } = useJobAlert(!!pendingJob && isOnline && !isMuted);

  const { location, isTracking, error: locationError, toggleTracking } = useDriverLocation({
    driverId: driverRecord?.id || null, enabled: isOnline && canGoOnline && !!driverRecord?.id, updateInterval: 5000,
  });

  useEffect(() => {
    if (!driverRecord?.id || !canGoOnline) return;
    const updateOnlineStatus = async () => {
      await supabase.from("drivers").update({ is_online: isOnline }).eq("id", driverRecord.id);
    };
    updateOnlineStatus();
  }, [isOnline, driverRecord?.id, canGoOnline]);

  const handleAcceptJob = async (jobId: string) => {
    if (!driverRecord?.id) return;
    try {
      await acceptJobMutation.mutateAsync({ jobId, driverId: driverRecord.id });
      navigate("/driver/job/active");
    } catch (error) { console.error("Failed to accept job:", error); }
  };

  const stats = {
    todayEarnings: `R${(todayStats?.earnings || 0).toLocaleString()}`,
    weekEarnings: `R${(weekStats?.earnings || 0).toLocaleString()}`,
    completedJobs: todayStats?.jobCount || 0,
    rating: driverRecord?.rating || 0,
  };

  // Determine onboarding status for the portal
  const getOnboardingStatus = () => {
    if (!verification) return { label: "Account Created", variant: "warning" as const, step: 1 };
    if (verification.status === "not_started") return { label: "Documents Required", variant: "warning" as const, step: 2 };
    if (verification.status === "submitted" || verification.status === "pending_review") return { label: "Under Review", variant: "pending" as const, step: 3 };
    if (verification.status === "rejected") return { label: "Reupload Required", variant: "destructive" as const, step: 2 };
    if (verification.status === "approved") return { label: "Approved", variant: "success" as const, step: 4 };
    return { label: "Pending", variant: "warning" as const, step: 1 };
  };

  const onboardingStatus = getOnboardingStatus();

  if (driverLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <Logo size="lg" />
          <div className="flex items-center gap-2">
            <RoleSwitcher variant="compact" />
            <Button variant="ghost" size="icon-sm" className="rounded-full relative" onClick={() => setNotificationsOpen(true)}>
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => navigate("/driver/profile")}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Onboarding Status Banner (shown when not approved) */}
      {!canGoOnline && (
        <div className="container py-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">Driver Onboarding</p>
                      <StatusBadge variant={onboardingStatus.variant}>{onboardingStatus.label}</StatusBadge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {onboardingStatus.step === 1 && "Welcome! Upload your documents to begin verification."}
                      {onboardingStatus.step === 2 && "Upload all required documents to proceed."}
                      {onboardingStatus.step === 3 && "Your documents are being reviewed by our team."}
                      {onboardingStatus.step === 4 && "You're approved! You can now go online."}
                    </p>
                  </div>
                </div>
                {/* Progress steps */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { label: "Account", done: true },
                    { label: "Documents", done: onboardingStatus.step > 2 || (verification?.status === "submitted") },
                    { label: "Review", done: onboardingStatus.step > 3 },
                    { label: "Approved", done: onboardingStatus.step === 4 },
                  ].map((step, idx) => (
                    <div key={idx} className="text-center">
                      <div className={`h-1.5 rounded-full mb-1 ${step.done ? "bg-success" : "bg-muted"}`} />
                      <span className={`text-xs ${step.done ? "text-success font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Portal Tabs */}
      <div className="container py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="dashboard" className="text-xs gap-1">
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs gap-1">
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="text-xs gap-1">
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="text-xs gap-1">
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
          </TabsList>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-4">
            {/* Online Toggle - Only enabled when approved */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Card variant={isOnline && canGoOnline ? "primary" : "outline"} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isOnline && canGoOnline ? "bg-accent" : "bg-muted"}`}>
                        <Zap className={`h-6 w-6 ${isOnline && canGoOnline ? "text-accent-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className={`font-semibold ${isOnline && canGoOnline ? "text-primary-foreground" : "text-foreground"}`}>
                          {canGoOnline ? (isOnline ? "You're Online" : "You're Offline") : "Verification Required"}
                        </p>
                        <p className={`text-sm ${isOnline && canGoOnline ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {!canGoOnline ? "Complete verification to go online" : isOnline ? "Receiving job requests" : "Go online to receive jobs"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isOnline && canGoOnline}
                      onCheckedChange={(checked) => { if (!canGoOnline) return; setIsOnline(checked); }}
                      disabled={!canGoOnline}
                      className="data-[state=checked]:bg-accent"
                    />
                  </div>

                  {!canGoOnline && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Upload and verify your documents first</span>
                      <Button variant="outline" size="sm" className="ml-auto" onClick={() => setActiveTab("documents")}>
                        Upload Docs
                      </Button>
                    </div>
                  )}

                  {isOnline && canGoOnline && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 pt-3 border-t border-primary-foreground/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative flex items-center justify-center">
                            <Navigation className={`h-4 w-4 ${isTracking ? "text-success" : "text-primary-foreground/50"}`} />
                            {isTracking && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success animate-pulse" />}
                          </div>
                          <span className="text-sm text-primary-foreground/70">{isTracking ? "GPS Active" : "GPS Off"}</span>
                        </div>
                        {location && isTracking && <span className="text-xs text-primary-foreground/50 font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>}
                        {locationError && <span className="text-xs text-destructive">{locationError}</span>}
                        <Button variant="glass" size="sm" onClick={toggleTracking} className="h-7 text-xs">
                          {isTracking ? "Stop" : "Start"} GPS
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Incoming Job Alert - Only when approved and online */}
            {canGoOnline && isOnline && pendingJob && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}>
                <Card variant="default" className="border-2 border-accent overflow-hidden">
                  <div className="h-1.5 bg-muted overflow-hidden">
                    <motion.div className="h-full bg-accent" initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 60, ease: "linear" }} />
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusBadge variant="warning" pulse>New Request</StatusBadge>
                        <Button variant="ghost" size="icon-sm" className="h-7 w-7 rounded-full" onClick={() => setIsMuted(!isMuted)}>
                          {isMuted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-accent" />}
                        </Button>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{pendingJob.eta_minutes || 20}min ETA</span>
                    </div>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                        {(() => { const IconComponent = serviceIcons[pendingJob.services?.name || ""] || TyreIcon; return <IconComponent className="h-6 w-6 text-accent" />; })()}
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
                      <MapPin className="h-4 w-4" /><span>{pendingJob.pickup_address || "Location pending"}</span>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" disabled={acceptJobMutation.isPending}>Decline</Button>
                      <Button variant="amber" className="flex-1" onClick={() => handleAcceptJob(pendingJob.id)} disabled={acceptJobMutation.isPending}>
                        {acceptJobMutation.isPending ? "Accepting..." : "Accept Job"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Stats - Only shown when approved */}
            {canGoOnline && (
              <>
                <div className="mb-3"><h3 className="font-semibold text-foreground">Today's Summary</h3></div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: TrendingUp, label: "Earnings", value: stats.todayEarnings, delay: 0.1 },
                    { icon: Clock, label: "Jobs", value: stats.completedJobs, delay: 0.15 },
                    { icon: Star, label: "Rating", value: stats.rating > 0 ? stats.rating.toFixed(1) : "—", delay: 0.2 },
                    { icon: Zap, label: "Total Jobs", value: driverRecord?.total_jobs || 0, delay: 0.25 },
                  ].map((stat) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: stat.delay }}>
                      <Card variant="default" className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30" onClick={() => navigate("/driver/earnings")}>
                        <CardContent className="p-4">
                          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                            <stat.icon className="h-4 w-4" /><span className="text-sm">{stat.label}</span>
                          </div>
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <Card variant="primary" onClick={() => navigate("/driver/earnings")} className="cursor-pointer mt-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-primary-foreground/70">This Week</p>
                        <p className="text-3xl font-bold text-primary-foreground">{stats.weekEarnings}</p>
                      </div>
                      <ChevronRight className="h-6 w-6 text-primary-foreground/70" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Profile summary when not yet approved */}
            {!canGoOnline && profile && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium text-foreground">{profile.full_name || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-foreground">{profile.email || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium text-foreground">{profile.phone || "—"}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents" className="space-y-4">
            {driverRecord?.id && (
              <DriverVerificationSection driverId={driverRecord.id} />
            )}
          </TabsContent>

          {/* STATUS TAB */}
          <TabsContent value="status" className="space-y-4">
            <DriverMessagesPanel />
          </TabsContent>

          {/* MESSAGES TAB */}
          <TabsContent value="messages" className="space-y-4">
            <DriverMessagesPanel />
          </TabsContent>

          {/* SUPPORT TAB */}
          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  If you're having trouble with your application or documents, our support team is here to help.
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate("/driver/support")}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
                <div className="space-y-2 pt-3 border-t border-border">
                  <h4 className="text-sm font-medium text-foreground">Common Questions</h4>
                  {[
                    "How long does verification take?",
                    "What documents do I need?",
                    "Why was my document rejected?",
                    "How do I update my profile?",
                  ].map((q) => (
                    <div key={q} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav type="driver" />
      <DriverNotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </div>
  );
};

export default DriverHome;
