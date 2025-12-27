import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TyreIcon } from "@/components/icons/ServiceIcons";
import {
  Navigation,
  Phone,
  MessageCircle,
  Camera,
  Check,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  ChevronRight,
  Car,
  FileText,
  IdCard,
  X,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isValidCoordinate } from "@/lib/validations";
import { toast } from "sonner";

const mockJob = {
  id: "JOB-001",
  service: "Tyre Change",
  customer: {
    name: "John M.",
    phone: "+27 82 123 4567",
    rating: 4.8,
  },
  location: "123 Main Street, Sandton",
  coordinates: { lat: -26.1076, lng: 28.0567 },
  payout: "R280",
  eta: 8,
};

const stages = [
  { key: "accepted", label: "Accepted", action: "Navigate" },
  { key: "on_way", label: "On My Way", action: "I've Arrived" },
  { key: "arrived", label: "Arrived", action: "Start Job" },
  { key: "in_progress", label: "In Progress", action: "Complete Job" },
  { key: "completed", label: "Completed", action: null },
];

// Navigation app options
const navApps = [
  {
    id: "google",
    name: "Google Maps",
    icon: "🗺️",
    getUrl: (lat: number, lng: number) =>
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
  },
  {
    id: "waze",
    name: "Waze",
    icon: "🚗",
    getUrl: (lat: number, lng: number) =>
      `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
  },
];

// Security photo types required on arrival
const securityPhotos = [
  { id: "vehicle", label: "Vehicle Photo", icon: Car, description: "Take a clear photo of the customer's vehicle" },
  { id: "registration", label: "Registration Number", icon: FileText, description: "Capture the vehicle registration plate" },
  { id: "driver_id", label: "Your ID Badge", icon: IdCard, description: "Photo of your driver identification" },
];

export const ActiveJob = () => {
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState(1);
  const [showNavPicker, setShowNavPicker] = useState(false);
  const [preferredNav, setPreferredNav] = useState<string | null>(null);
  const [showSecurityPhotos, setShowSecurityPhotos] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, boolean>>({});
  const [showPhotoCapture, setShowPhotoCapture] = useState<string | null>(null);

  const allSecurityPhotosUploaded = securityPhotos.every((photo) => uploadedPhotos[photo.id]);

  const handleNavigation = (appId: string) => {
    setPreferredNav(appId);
    const app = navApps.find((a) => a.id === appId);
    if (app) {
      const { lat, lng } = mockJob.coordinates;
      
      // Validate coordinates before navigation
      if (!isValidCoordinate(lat, lng)) {
        toast.error('Invalid location coordinates');
        setShowNavPicker(false);
        return;
      }
      
      const url = app.getUrl(lat, lng);
      
      // Validate URL is HTTPS and open with security flags
      if (url.startsWith('https://')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Invalid navigation URL');
      }
    }
    setShowNavPicker(false);
  };

  const handlePhotoCapture = (photoId: string) => {
    // Simulate photo capture
    setUploadedPhotos((prev) => ({ ...prev, [photoId]: true }));
    setShowPhotoCapture(null);
  };

  const handleNextStage = () => {
    // If arriving (stage 2), show security photos first
    if (currentStage === 1) {
      setShowSecurityPhotos(true);
      setCurrentStage(currentStage + 1);
      return;
    }

    // Can't proceed from arrived stage until all photos are uploaded
    if (currentStage === 2 && !allSecurityPhotosUploaded) {
      return;
    }

    if (currentStage < stages.length - 1) {
      setShowSecurityPhotos(false);
      setCurrentStage(currentStage + 1);
    } else {
      navigate("/driver");
    }
  };

  return (
    <div className="min-h-screen bg-background dark">
      {/* Map Area */}
      <div className="relative h-56 bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        {/* Simulated Navigation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-amber"
            >
              <Navigation className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <p className="text-lg font-bold text-foreground">{mockJob.eta} min</p>
            <p className="text-sm text-muted-foreground">to destination</p>
          </div>
        </div>

        {/* Navigation Button */}
        <Button
          variant="amber"
          size="lg"
          className="absolute bottom-4 left-4 right-4"
          onClick={() => setShowNavPicker(true)}
        >
          <Navigation className="mr-2 h-5 w-5" />
          {preferredNav
            ? `Open in ${navApps.find((a) => a.id === preferredNav)?.name}`
            : "Choose Navigation App"}
        </Button>
      </div>

      <div className="container py-4 space-y-4 pb-24">
        {/* Progress Steps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {stages.map((stage, index) => (
              <div key={stage.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      index <= currentStage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < currentStage ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className="mt-1 text-[10px] text-muted-foreground whitespace-nowrap">
                    {stage.label}
                  </span>
                </div>
                {index < stages.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 w-6 transition-colors ${
                      index < currentStage ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Job Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="amber">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <TyreIcon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">{mockJob.id}</span>
                    <StatusBadge variant="active" pulse>
                      {stages[currentStage].label}
                    </StatusBadge>
                  </div>
                  <p className="font-semibold text-foreground">{mockJob.service}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{mockJob.payout}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Photos Section - Shown on Arrival */}
        <AnimatePresence>
          {showSecurityPhotos && currentStage === 2 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card variant="default" className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Security Check-In</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    For security purposes, please capture the following photos before starting the job:
                  </p>
                  <div className="space-y-3">
                    {securityPhotos.map((photo) => {
                      const Icon = photo.icon;
                      const isUploaded = uploadedPhotos[photo.id];
                      return (
                        <motion.button
                          key={photo.id}
                          onClick={() => !isUploaded && setShowPhotoCapture(photo.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            isUploaded
                              ? "border-green-500/30 bg-green-500/10"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              isUploaded ? "bg-green-500/20" : "bg-primary/10"
                            }`}
                          >
                            {isUploaded ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Icon className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`font-medium ${isUploaded ? "text-green-500" : "text-foreground"}`}>
                              {photo.label}
                            </p>
                            <p className="text-xs text-muted-foreground">{photo.description}</p>
                          </div>
                          {!isUploaded && <Camera className="h-5 w-5 text-muted-foreground" />}
                        </motion.button>
                      );
                    })}
                  </div>
                  {!allSecurityPhotosUploaded && (
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      Complete all photos to proceed
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customer Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card variant="default">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{mockJob.customer.name}</p>
                  <p className="text-sm text-muted-foreground">★ {mockJob.customer.rating}</p>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{mockJob.location}</span>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>
                <Button variant="outline" className="flex-1">
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Photo (shown during job in progress) */}
        {currentStage === 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card variant="interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Camera className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Completion Photo</p>
                      <p className="text-sm text-muted-foreground">Required to complete job</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Report Issue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button variant="ghost" className="w-full text-muted-foreground">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report an Issue
          </Button>
        </motion.div>
      </div>

      {/* Action Button */}
      {stages[currentStage].action && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="fixed bottom-4 left-4 right-4"
        >
          <Button
            variant="amber"
            size="xl"
            className="w-full"
            onClick={handleNextStage}
            disabled={currentStage === 2 && !allSecurityPhotosUploaded}
          >
            {currentStage === 2 && !allSecurityPhotosUploaded
              ? "Complete Security Photos First"
              : stages[currentStage].action}
          </Button>
        </motion.div>
      )}

      {/* Navigation App Picker Modal */}
      <AnimatePresence>
        {showNavPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowNavPicker(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Choose Navigation App</h3>
                <button
                  onClick={() => setShowNavPicker(false)}
                  className="rounded-full p-2 hover:bg-muted"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                {navApps.map((app) => (
                  <motion.button
                    key={app.id}
                    onClick={() => handleNavigation(app.id)}
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-background p-4 transition-all hover:border-primary hover:bg-primary/5"
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-3xl">{app.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground">{app.name}</p>
                      <p className="text-sm text-muted-foreground">Open directions in {app.name}</p>
                    </div>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {securityPhotos.find((p) => p.id === showPhotoCapture)?.label}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {securityPhotos.find((p) => p.id === showPhotoCapture)?.description}
                </p>
              </div>

              {/* Simulated Camera View */}
              <div className="mb-6 aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center">
                <div className="text-center">
                  <Camera className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">Camera Preview</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPhotoCapture(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="amber"
                  className="flex-1"
                  onClick={() => handlePhotoCapture(showPhotoCapture)}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActiveJob;
