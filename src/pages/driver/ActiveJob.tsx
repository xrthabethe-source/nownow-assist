import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TyreIcon, BatteryIcon, FuelIcon, WrenchIcon } from "@/components/icons/ServiceIcons";
import {
  Navigation,
  Phone,
  MessageCircle,
  Camera,
  Check,
  MapPin,
  User,
  AlertTriangle,
  ChevronRight,
  Car,
  FileText,
  IdCard,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isValidCoordinate } from "@/lib/validations";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { SecureChatDialog } from "@/components/shared/SecureChatDialog";
import { SecureCallDialog } from "@/components/shared/SecureCallDialog";
import { ReportAbuseDialog } from "@/components/shared/ReportAbuseDialog";
import { useSecureMessaging } from "@/hooks/useSecureMessaging";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateJobStatus } from "@/hooks/useJobs";

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Tyre Change": TyreIcon, "Jump-Start": BatteryIcon, "Fuel Rescue": FuelIcon,
  "Battery Boost + Diagnostics": BatteryIcon, "Call a Mechanic": WrenchIcon,
};

const stages = [
  { key: "accepted", label: "Accepted", action: "On My Way", nextStatus: "dispatched" as const },
  { key: "dispatched", label: "On My Way", action: "I've Arrived", nextStatus: "arrived" as const },
  { key: "arrived", label: "Arrived", action: "Start Job", nextStatus: "in_progress" as const },
  { key: "in_progress", label: "In Progress", action: "Complete Job", nextStatus: "completed" as const },
  { key: "completed", label: "Completed", action: null, nextStatus: null },
];

const navApps = [
  { id: "google", name: "Google Maps", icon: "🗺️", getUrl: (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving` },
  { id: "waze", name: "Waze", icon: "🚗", getUrl: (lat: number, lng: number) => `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` },
];

const securityPhotos = [
  { id: "vehicle", label: "Vehicle Photo", icon: Car, description: "Take a clear photo of the customer's vehicle" },
  { id: "registration", label: "Registration Number", icon: FileText, description: "Capture the vehicle registration plate" },
  { id: "driver_id", label: "Your ID Badge", icon: IdCard, description: "Photo of your driver identification" },
];

export const ActiveJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateJobStatus = useUpdateJobStatus();
  const [showNavPicker, setShowNavPicker] = useState(false);
  const [preferredNav, setPreferredNav] = useState<string | null>(null);
  const [showSecurityPhotos, setShowSecurityPhotos] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, boolean>>({});
  const [showPhotoCapture, setShowPhotoCapture] = useState<string | null>(null);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const allSecurityPhotosUploaded = securityPhotos.every((photo) => uploadedPhotos[photo.id]);

  // Fetch active job for this driver from DB
  const { data: activeJob, isLoading } = useQuery({
    queryKey: ["driver-active-job", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // Get driver record
      const { data: driver } = await supabase.from("drivers").select("id").eq("user_id", user.id).single();
      if (!driver) return null;

      const { data: job, error } = await supabase
        .from("jobs")
        .select(`*, services(id, name, icon, base_price)`)
        .eq("driver_id", driver.id)
        .in("status", ["accepted", "dispatched", "arrived", "in_progress"])
        .order("accepted_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !job) return null;

      // Get customer profile
      const { data: customerProfile } = await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url")
        .eq("id", job.customer_id)
        .single();

      return { ...job, customer: customerProfile, driverId: driver.id };
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Map DB status to stage index
  const getStageIndex = (status: string | null): number => {
    switch (status) {
      case "accepted": return 0;
      case "dispatched": return 1;
      case "arrived": return 2;
      case "in_progress": return 3;
      case "completed": return 4;
      default: return 0;
    }
  };

  const currentStage = activeJob ? getStageIndex(activeJob.status) : 0;

  // Show security photos when arriving
  useEffect(() => {
    if (currentStage === 2) setShowSecurityPhotos(true);
    else setShowSecurityPhotos(false);
  }, [currentStage]);

  const customerName = activeJob?.customer?.full_name || "Customer";
  const customerId = activeJob?.customer?.id || "";
  const customerPhone = activeJob?.customer?.phone || "";
  const jobId = activeJob?.id || "";
  const serviceName = activeJob?.services?.name || "Service";
  const payout = `R${Math.round((activeJob?.estimated_price || 0) * 0.8)}`;
  const pickupLat = activeJob?.pickup_lat ? Number(activeJob.pickup_lat) : null;
  const pickupLng = activeJob?.pickup_lng ? Number(activeJob.pickup_lng) : null;

  // Secure messaging
  const {
    messages, unreadCount, sending, rateLimited, sendMessage, setChatOpen, blockUser,
  } = useSecureMessaging({ jobId, otherPartyName: customerName });

  useEffect(() => { setChatOpen(showChatDialog); }, [showChatDialog, setChatOpen]);

  const handleNavigation = (appId: string) => {
    setPreferredNav(appId);
    const app = navApps.find((a) => a.id === appId);
    if (app && pickupLat && pickupLng) {
      if (!isValidCoordinate(pickupLat, pickupLng)) { toast.error("Invalid location coordinates"); setShowNavPicker(false); return; }
      const url = app.getUrl(pickupLat, pickupLng);
      if (url.startsWith("https://")) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error("Invalid navigation URL");
    }
    setShowNavPicker(false);
  };

  const handlePhotoCapture = (photoId: string) => {
    setUploadedPhotos((prev) => ({ ...prev, [photoId]: true }));
    setShowPhotoCapture(null);
  };

  const handleNextStage = async () => {
    if (!activeJob?.id) return;
    const stage = stages[currentStage];
    if (!stage.nextStatus) { navigate("/driver"); return; }

    // Can't proceed from arrived until photos done
    if (currentStage === 2 && !allSecurityPhotosUploaded) return;

    try {
      await updateJobStatus.mutateAsync({
        jobId: activeJob.id,
        status: stage.nextStatus as any,
        finalPrice: stage.nextStatus === "completed" ? (activeJob.estimated_price || undefined) : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["driver-active-job"] });
      if (stage.nextStatus === "completed") {
        toast.success("Job completed!");
        navigate("/driver");
      }
    } catch (err) {
      toast.error("Failed to update job status");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeJob) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <Car className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold text-foreground">No Active Job</h2>
        <p className="text-muted-foreground text-center">You don't have any active jobs right now.</p>
        <Button variant="amber" onClick={() => navigate("/driver")}>Back to Dashboard</Button>
      </div>
    );
  }

  const ServiceIcon = serviceIcons[serviceName] || TyreIcon;

  return (
    <div className="min-h-screen bg-background">
      {/* Map Area */}
      <div className="relative h-56 bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-amber">
              <Navigation className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <p className="text-lg font-bold text-foreground">{activeJob.eta_minutes || 15} min</p>
            <p className="text-sm text-muted-foreground">to destination</p>
          </div>
        </div>
        <Button variant="amber" size="lg" className="absolute bottom-4 left-4 right-4" onClick={() => setShowNavPicker(true)}>
          <Navigation className="mr-2 h-5 w-5" />
          {preferredNav ? `Open in ${navApps.find((a) => a.id === preferredNav)?.name}` : "Choose Navigation App"}
        </Button>
      </div>

      <div className="container py-4 space-y-4 pb-24">
        {/* Progress Steps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {stages.map((stage, index) => (
              <div key={stage.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${index <= currentStage ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {index < currentStage ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className="mt-1 text-[10px] text-muted-foreground whitespace-nowrap">{stage.label}</span>
                </div>
                {index < stages.length - 1 && <div className={`mx-1 h-0.5 w-6 transition-colors ${index < currentStage ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Job Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card variant="amber">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <ServiceIcon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">{activeJob.job_number}</span>
                    <StatusBadge variant="active" pulse>{stages[currentStage].label}</StatusBadge>
                  </div>
                  <p className="font-semibold text-foreground">{serviceName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{payout}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Photos Section */}
        <AnimatePresence>
          {showSecurityPhotos && currentStage === 2 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Card variant="default" className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Security Check-In</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">For security purposes, please capture the following photos before starting the job:</p>
                  <div className="space-y-3">
                    {securityPhotos.map((photo) => {
                      const Icon = photo.icon;
                      const isUploaded = uploadedPhotos[photo.id];
                      return (
                        <motion.button key={photo.id} onClick={() => !isUploaded && setShowPhotoCapture(photo.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${isUploaded ? "border-green-500/30 bg-green-500/10" : "border-border bg-card hover:border-primary/50"}`}
                          whileTap={{ scale: 0.98 }}>
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isUploaded ? "bg-green-500/20" : "bg-primary/10"}`}>
                            {isUploaded ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className="h-5 w-5 text-primary" />}
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`font-medium ${isUploaded ? "text-green-500" : "text-foreground"}`}>{photo.label}</p>
                            <p className="text-xs text-muted-foreground">{photo.description}</p>
                          </div>
                          {!isUploaded && <Camera className="h-5 w-5 text-muted-foreground" />}
                        </motion.button>
                      );
                    })}
                  </div>
                  {!allSecurityPhotosUploaded && <p className="mt-4 text-center text-sm text-muted-foreground">Complete all photos to proceed</p>}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customer Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card variant="default">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{customerName}</p>
                  <p className="text-sm text-muted-foreground">{customerPhone || "No phone"}</p>
                </div>
              </div>
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{activeJob.pickup_address || "Location pending"}</span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 relative" onClick={() => setShowChatDialog(true)}>
                  <MessageCircle className="mr-2 h-4 w-4" />Message
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowCallDialog(true)}>
                  <Phone className="mr-2 h-4 w-4" />Call
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Photo */}
        {currentStage === 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card variant="interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Camera className="h-5 w-5 text-primary" /></div>
                    <div><p className="font-medium text-foreground">Completion Photo</p><p className="text-sm text-muted-foreground">Required to complete job</p></div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Report Issue */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowReportDialog(true)}>
            <AlertTriangle className="mr-2 h-4 w-4" />Report an Issue
          </Button>
        </motion.div>
      </div>

      {/* Action Button */}
      {stages[currentStage].action && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="fixed bottom-4 left-4 right-4">
          <Button variant="amber" size="xl" className="w-full" onClick={handleNextStage}
            disabled={(currentStage === 2 && !allSecurityPhotosUploaded) || updateJobStatus.isPending}>
            {updateJobStatus.isPending ? "Updating..." : currentStage === 2 && !allSecurityPhotosUploaded ? "Complete Security Photos First" : stages[currentStage].action}
          </Button>
        </motion.div>
      )}

      {/* Navigation App Picker */}
      <AnimatePresence>
        {showNavPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowNavPicker(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Choose Navigation App</h3>
                <button onClick={() => setShowNavPicker(false)} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                {navApps.map((app) => (
                  <motion.button key={app.id} onClick={() => handleNavigation(app.id)}
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-background p-4 transition-all hover:border-primary hover:bg-primary/5" whileTap={{ scale: 0.98 }}>
                    <span className="text-3xl">{app.icon}</span>
                    <div className="flex-1 text-left"><p className="font-semibold text-foreground">{app.name}</p><p className="text-sm text-muted-foreground">Open directions in {app.name}</p></div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Capture Modal */}
      <AnimatePresence>
        {showPhotoCapture && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><Camera className="h-8 w-8 text-primary" /></div>
                <h3 className="text-lg font-semibold text-foreground">{securityPhotos.find((p) => p.id === showPhotoCapture)?.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{securityPhotos.find((p) => p.id === showPhotoCapture)?.description}</p>
              </div>
              <div className="mb-6 aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center">
                <div className="text-center"><Camera className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">Camera Preview</p></div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowPhotoCapture(null)}>Cancel</Button>
                <Button variant="amber" className="flex-1" onClick={() => handlePhotoCapture(showPhotoCapture)}><Camera className="mr-2 h-4 w-4" />Capture</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secure Chat Dialog */}
      <SecureChatDialog open={showChatDialog} onOpenChange={setShowChatDialog}
        otherPartyName={customerName} otherPartyId={customerId} otherPartyType="customer"
        messages={messages} sending={sending} rateLimited={rateLimited} onSendMessage={sendMessage}
        onCallClick={() => { setShowChatDialog(false); setShowCallDialog(true); }}
        onReportClick={() => { setShowChatDialog(false); setShowReportDialog(true); }}
        onBlockClick={() => blockUser(customerId)} currentUserId={user?.id} />

      {/* Secure Call Dialog */}
      <SecureCallDialog open={showCallDialog} onOpenChange={setShowCallDialog}
        jobId={jobId} receiverId={customerId} receiverType="customer" receiverName={customerName} receiverPhone={customerPhone} />

      {/* Report Abuse Dialog */}
      <ReportAbuseDialog open={showReportDialog} onOpenChange={setShowReportDialog}
        jobId={jobId} reportedId={customerId} reportedType="customer" reportedName={customerName} />
    </div>
  );
};

export default ActiveJob;
