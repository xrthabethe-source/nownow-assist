import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TyreIcon, FuelIcon, BatteryIcon, MechanicIcon } from "@/components/icons/ServiceIcons";
import { Phone, MessageCircle, AlertTriangle, Star, Car, Check, X, MapPin, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { SecureChatDialog } from "@/components/shared/SecureChatDialog";
import { SecureCallDialog } from "@/components/shared/SecureCallDialog";
import { ReportAbuseDialog } from "@/components/shared/ReportAbuseDialog";
import { useSecureMessaging } from "@/hooks/useSecureMessaging";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statuses = [
  { key: "finding", label: "Finding a responder...", icon: "🔍" },
  { key: "matched", label: "Responder found!", icon: "✓" },
  { key: "on_way", label: "On the way", icon: "🚗" },
  { key: "arriving", label: "Almost there", icon: "📍" },
  { key: "arrived", label: "Responder arrived", icon: "🎉" },
];

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  fuel: FuelIcon,
  jumpstart: BatteryIcon,
  tyre: TyreIcon,
  mechanic: MechanicIcon,
};

const serviceNames: Record<string, string> = {
  fuel: "Fuel Rescue",
  jumpstart: "Jump-Start Rescue",
  tyre: "Tyre Change",
  mechanic: "Mechanic Callout",
};

const EMERGENCY_NUMBER = "10111"; // South African emergency number

export const LiveTracking = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [showSOSDialog, setShowSOSDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Get address and job ID from navigation state
  const pickupAddress = (location.state as { address?: string })?.address || "Your current location";
  const jobId = (location.state as { jobId?: string })?.jobId || null;

  // Fetch active job details
  const { data: activeJob, isLoading: jobLoading } = useQuery({
    queryKey: ["active-job", jobId, user?.id],
    queryFn: async () => {
      if (jobId) {
        const { data } = await supabase
          .from("jobs")
          .select(`
            id,
            status,
            eta_minutes,
            pickup_address,
            drivers:driver_id (
              id,
              user_id,
              rating,
              vehicle_make,
              vehicle_plate,
              profiles:user_id (full_name, phone, avatar_url)
            )
          `)
          .eq("id", jobId)
          .single();
        return data;
      }
      
      // If no jobId, try to find most recent active job for user
      if (user?.id) {
        const { data } = await supabase
          .from("jobs")
          .select(`
            id,
            status,
            eta_minutes,
            pickup_address,
            drivers:driver_id (
              id,
              user_id,
              rating,
              vehicle_make,
              vehicle_plate,
              profiles:user_id (full_name, phone, avatar_url)
            )
          `)
          .eq("customer_id", user.id)
          .in("status", ["pending", "accepted", "dispatched", "arrived", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        return data;
      }
      return null;
    },
    enabled: !!jobId || !!user?.id,
    refetchInterval: 5000, // Poll for updates
  });

  const driver = activeJob?.drivers as any;
  const driverProfile = driver?.profiles;
  const driverName = driverProfile?.full_name || "Driver";
  const driverUserId = driver?.user_id || "";
  const driverPhone = driverProfile?.phone || "";
  const driverRating = driver?.rating || 0;
  const driverVehicle = driver?.vehicle_make || "Vehicle";
  const driverPlate = driver?.vehicle_plate || "---";
  const driverPhoto = driverProfile?.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face";
  const eta = activeJob?.eta_minutes || 15;
  const actualJobId = activeJob?.id || jobId;

  // Calculate status based on job status
  const getStatusIndex = () => {
    switch (activeJob?.status) {
      case "pending": return 0;
      case "accepted": return 1;
      case "dispatched": return 2;
      case "arrived": return 3;
      case "in_progress": return 3;
      case "completed": return 4;
      default: return 0;
    }
  };
  const currentStatus = getStatusIndex();

  // Subscribe to secure messaging
  const {
    messages,
    unreadCount,
    sending,
    rateLimited,
    sendMessage,
    setChatOpen,
    blockUser,
  } = useSecureMessaging({
    jobId: actualJobId,
    otherPartyName: driverName,
  });

  // Track chat open state for notification suppression
  useEffect(() => {
    setChatOpen(showChatDialog);
  }, [showChatDialog, setChatOpen]);
  
  // Get the correct service icon and name
  const ServiceIcon = serviceIcons[serviceId || "tyre"] || TyreIcon;
  const serviceName = serviceNames[serviceId || "tyre"] || "Service Request";

  const handleCallDriver = () => {
    setShowCallDialog(true);
  };

  const handleMessageDriver = () => {
    setShowChatDialog(true);
  };

  const handleEmergencySOS = () => {
    setShowSOSDialog(true);
  };

  const confirmEmergencyCall = () => {
    setShowSOSDialog(false);
    window.location.href = `tel:${EMERGENCY_NUMBER}`;
    toast({
      title: "Emergency call",
      description: `Calling ${EMERGENCY_NUMBER}...`,
      variant: "destructive",
    });
  };

  const handleCancelRequest = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = async () => {
    if (actualJobId) {
      await supabase
        .from("jobs")
        .update({ status: "cancelled", cancellation_reason: "Customer cancelled" })
        .eq("id", actualJobId);
    }
    setShowCancelDialog(false);
    toast({
      title: "Request cancelled",
      description: "Your service request has been cancelled.",
    });
    navigate("/");
  };

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Map Placeholder */}
      <div className="relative h-64 bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        
        {/* Simulated Map */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Your location */}
            <motion.div
              className="absolute -left-20 -top-10"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-amber">
                <div className="h-3 w-3 rounded-full bg-primary-foreground" />
              </div>
            </motion.div>

            {/* Driver location */}
            {currentStatus >= 1 && (
              <motion.div
                className="absolute left-16 top-8"
                animate={{ x: [-10, 0], y: [5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-lg border-2 border-primary">
                  <Car className="h-5 w-5 text-primary" />
                </div>
              </motion.div>
            )}

            {/* Path */}
            {currentStatus >= 1 && (
              <svg className="absolute -left-16 -top-6" width="120" height="60">
                <motion.path
                  d="M 10 40 Q 60 10 100 30"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2 }}
                />
              </svg>
            )}
          </div>
        </div>

        {/* ETA Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <Card variant="glass">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                  <p className="text-2xl font-bold text-foreground">{eta} min</p>
                </div>
                <StatusBadge variant="primary" pulse>
                  {statuses[currentStatus].icon} {statuses[currentStatus].label}
                </StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container py-4">
        {/* Status Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between">
            {statuses.slice(0, 4).map((status, index) => (
              <div key={status.key} className="flex items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors ${
                    index <= currentStatus
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStatus ? <Check className="h-3 w-3" /> : index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`h-0.5 w-8 transition-colors md:w-16 ${
                      index < currentStatus ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Driver Card */}
        {currentStatus >= 1 && driver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4"
          >
            <Card variant="elevated">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={driverPhoto}
                      alt={driverName}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-success text-success-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{driverName}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span>{driverRating > 0 ? driverRating.toFixed(1) : "New"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {driverVehicle} • {driverPlate}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 relative" onClick={handleMessageDriver}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                  <Button variant="amber" className="flex-1" onClick={handleCallDriver}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Service Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <Card variant="amber">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <ServiceIcon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{serviceName}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{activeJob?.pickup_address || pickupAddress}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Safety Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4"
        >
          <Card variant="warning" className="border-l-4 border-l-warning">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
                <div>
                  <p className="font-semibold text-foreground">Stay Safe</p>
                  <p className="text-sm text-muted-foreground">
                    Remain in your vehicle with hazards on. Keep doors locked until responder arrives.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* SOS Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button variant="sos" size="lg" className="w-full" onClick={handleEmergencySOS}>
            <AlertTriangle className="mr-2 h-5 w-5" />
            Emergency SOS
          </Button>
        </motion.div>

        {/* Cancel Option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center"
        >
          <Button variant="ghost" className="text-muted-foreground" onClick={handleCancelRequest}>
            <X className="mr-2 h-4 w-4" />
            Cancel Request
          </Button>
        </motion.div>
      </div>

      {/* Emergency SOS Confirmation Dialog */}
      <AlertDialog open={showSOSDialog} onOpenChange={setShowSOSDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Emergency SOS
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will call the emergency services ({EMERGENCY_NUMBER}). Only use this in a real emergency situation where your safety is at risk.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEmergencyCall}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Phone className="mr-2 h-4 w-4" />
              Call {EMERGENCY_NUMBER}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Request Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your service request? A responder may already be on their way.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Secure Chat Dialog */}
      {driver && (
        <SecureChatDialog
          open={showChatDialog}
          onOpenChange={setShowChatDialog}
          otherPartyName={driverName}
          otherPartyId={driverUserId}
          otherPartyType="driver"
          messages={messages}
          sending={sending}
          rateLimited={rateLimited}
          onSendMessage={sendMessage}
          onCallClick={() => {
            setShowChatDialog(false);
            setShowCallDialog(true);
          }}
          onReportClick={() => {
            setShowChatDialog(false);
            setShowReportDialog(true);
          }}
          onBlockClick={() => blockUser(driverUserId)}
          currentUserId={user?.id}
        />
      )}

      {/* Secure Call Dialog */}
      {actualJobId && driver && (
        <SecureCallDialog
          open={showCallDialog}
          onOpenChange={setShowCallDialog}
          jobId={actualJobId}
          receiverId={driverUserId}
          receiverType="driver"
          receiverName={driverName}
          receiverPhone={driverPhone}
        />
      )}

      {/* Report Abuse Dialog */}
      {driver && (
        <ReportAbuseDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          jobId={actualJobId || undefined}
          reportedId={driverUserId}
          reportedType="driver"
          reportedName={driverName}
        />
      )}
    </div>
  );
};

export default LiveTracking;
