import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TyreIcon, BatteryIcon, FuelIcon, DiagnosticsIcon, MechanicIcon } from "@/components/icons/ServiceIcons";
import { ArrowLeft, MapPin, Clock, CreditCard, Shield, ChevronRight, Check, User, Phone, Users, AlertCircle, AlertTriangle, RefreshCw, Edit2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { friendDetailsSchema } from "@/lib/validations";
import { toast } from "sonner";
import { useCreateJob } from "@/hooks/useJobs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { validateStreetInput } from "@/lib/streetValidation";
// Payment is handled by Payfast - no in-app card collection needed
import { useSavedLocations, SavedLocation } from "@/hooks/useSavedLocations";
import { LocationSelector } from "@/components/customer/LocationSelector";
import { useConnectivity } from "@/hooks/useConnectivity";
import { addPendingDraft } from "@/lib/offlineStorage";
import { cacheCurrentLocation } from "@/hooks/useOfflineCache";
import { WhatsAppFallback } from "@/components/shared/WhatsAppFallback";
import { initiatePayfastPayment, redirectToPayfast } from "@/lib/payfast";

const services: Record<string, any> = {
  fuel: { 
    name: "Fuel Rescue", 
    icon: FuelIcon, 
    price: 349, 
    eta: "15-25 min", 
    description: "We bring fuel to get you moving now",
    includes: "Up to 5 litres of fuel included"
  },
  jumpstart: { 
    name: "Jump-Start", 
    icon: BatteryIcon, 
    price: 199, 
    eta: "10-20 min", 
    description: "Quick emergency restart service" 
  },
  tyre: { 
    name: "Tyre Change", 
    icon: TyreIcon, 
    price: 249, 
    eta: "15-25 min", 
    description: "Safe tyre change using your spare wheel" 
  },
  diagnostics: { 
    name: "Battery Boost + Diagnostics", 
    icon: DiagnosticsIcon, 
    price: 299, 
    eta: "15-25 min", 
    description: "Battery boost and basic electrical check" 
  },
  mechanic: { 
    name: "Call a Mechanic", 
    icon: MechanicIcon, 
    price: 149, 
    eta: "Varies", 
    description: "Connect with a local mechanic",
    isMechanic: true,
    platformFeeLabel: "Connection fee"
  },
};

const steps = ["Service", "Location", "Confirm"];

export const ServiceRequest = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [requestForOther, setRequestForOther] = useState(false);
  const [mechanicAcknowledged, setMechanicAcknowledged] = useState(false);
  const [friendDetails, setFriendDetails] = useState({
    name: "",
    phone: "",
    location: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fuelType, setFuelType] = useState<"Diesel" | "ULP 93" | "ULP 95" | "">("");
  const [showWhatsAppFallback, setShowWhatsAppFallback] = useState(false);
  const submissionTimerRef = useRef<ReturnType<typeof setTimeout>>();
  
  // Connectivity
  const { isOffline, isWeak } = useConnectivity();
  
  // Location state (same as home page)
  const [location, setLocation] = useState<string>("Detecting location...");
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  // Payment is handled externally by Payfast
  
  
  const createJobMutation = useCreateJob();
  
  // Fetch service from database if available
  const { data: dbService } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("name", serviceId === "fuel" ? "Fuel Rescue" : 
            serviceId === "jumpstart" ? "Jump-Start" :
            serviceId === "tyre" ? "Tyre Change" :
            serviceId === "diagnostics" ? "Battery Boost + Diagnostics" :
            "Call a Mechanic")
        .single();
      return data;
    },
  });

  const service = services[serviceId || "fuel"];
  const ServiceIcon = service?.icon || FuelIcon;
  const isMechanicService = service?.isMechanic === true;
  const isFuelService = serviceId === "fuel";
  
  // Use database price if available
  const actualPrice = dbService?.base_price || service?.price;

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocation("Location unavailable");
      setIsLoadingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        
        try {
          const { data, error } = await supabase.functions.invoke("reverse-geocode", {
            body: { lat: latitude, lon: longitude },
          });
          
          if (error) throw error;
          setLocation(data?.location || "Current location detected");
        } catch (err) {
          console.error("Geocoding error:", err);
          setLocation("Current location detected");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocation("Location unavailable");
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualLocationSubmit = () => {
    const validation = validateStreetInput(manualLocation);
    if (!validation.isValid) {
      setLocationError(validation.error || "Invalid location");
      return;
    }
    setLocation(manualLocation);
    setIsEditingLocation(false);
    setManualLocation("");
    setLocationError(null);
  };

  const handleSavedLocationSelect = (savedLocation: SavedLocation) => {
    setLocation(savedLocation.address);
    if (savedLocation.latitude && savedLocation.longitude) {
      setCoordinates({ lat: savedLocation.latitude, lng: savedLocation.longitude });
    }
  };

  const validateFriendDetails = () => {
    if (!requestForOther) return true;
    
    const result = friendDetailsSchema.safeParse(friendDetails);
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        errors[path] = err.message;
      });
      setFieldErrors(errors);
      return false;
    }
    
    setFieldErrors({});
    return true;
  };

  const handleConfirm = async () => {
    // Validate location
    if (!location || location === "Detecting location..." || location === "Location unavailable") {
      toast.error("Please set your location first");
      return;
    }
    
    // Validate friend details if requesting for someone else
    if (!validateFriendDetails()) {
      toast.error("Please fix the errors in friend's details");
      return;
    }
    
    // For mechanic service, require acknowledgment
    if (isMechanicService && !mechanicAcknowledged) {
      toast.error("Please acknowledge the terms to continue");
      return;
    }

    const pickupAddr = requestForOther ? friendDetails.location : location;
    const lat = coordinates?.lat || -26.1076;
    const lng = coordinates?.lng || 28.0567;
    const notes = requestForOther ? `Request for: ${friendDetails.name}, Phone: ${friendDetails.phone}` : undefined;

    // Cache location for offline use
    cacheCurrentLocation(pickupAddr, lat, lng);

    // ── Offline path: save draft locally ──
    if (isOffline || isWeak) {
      addPendingDraft({
        serviceId: dbService?.id || serviceId || 'unknown',
        serviceName: service?.name || 'Service',
        pickupAddress: pickupAddr,
        pickupLat: lat,
        pickupLng: lng,
        estimatedPrice: actualPrice,
        etaMinutes: dbService?.eta_minutes || 20,
        notes,
      });
      toast.success("Request saved! It will be submitted automatically when you're back online.");
      navigate(`/customer/home`);
      return;
    }
    
    // ── Online path: submit with 20s timeout for WhatsApp fallback ──
    setIsProcessing(true);
    setShowWhatsAppFallback(false);

    // Start 20-second WhatsApp fallback timer
    submissionTimerRef.current = setTimeout(() => {
      setShowWhatsAppFallback(true);
    }, 20000);
    
    try {
      let jobId: string | undefined;
      
      // Create the job first (pending payment)
      if (dbService?.id) {
        const result = await createJobMutation.mutateAsync({
          serviceId: dbService.id,
          pickupAddress: pickupAddr,
          pickupLat: lat,
          pickupLng: lng,
          estimatedPrice: actualPrice,
          etaMinutes: dbService.eta_minutes || 20,
          notes,
        });
        jobId = result?.id;
      }

      // Initiate Payfast payment
      const origin = window.location.origin;
      const payfast = await initiatePayfastPayment({
        amount: actualPrice,
        itemName: service?.name || "Roadside Assistance",
        jobId,
        returnUrl: `${origin}/customer/tracking/${serviceId}?payment=success`,
        cancelUrl: `${origin}/customer/home?payment=cancelled`,
      });
      
      if (submissionTimerRef.current) clearTimeout(submissionTimerRef.current);
      
      // Redirect to Payfast payment page
      toast.success("Redirecting to payment...");
      redirectToPayfast(payfast.payment_url, payfast.payment_data);
      
    } catch (error) {
      console.error("Failed to create job:", error);
      
      // On failure, save as offline draft for auto-retry
      addPendingDraft({
        serviceId: dbService?.id || serviceId || 'unknown',
        serviceName: service?.name || 'Service',
        pickupAddress: pickupAddr,
        pickupLat: lat,
        pickupLng: lng,
        estimatedPrice: actualPrice,
        etaMinutes: dbService?.eta_minutes || 20,
        notes,
      });
      toast.error("Request saved locally. We'll retry when your connection improves.");
      setShowWhatsAppFallback(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (submissionTimerRef.current) clearTimeout(submissionTimerRef.current);
    };
  }, []);

  const handleFriendDetailChange = (field: string, value: string) => {
    setFriendDetails({ ...friendDetails, [field]: value });
    // Clear error for this field when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container flex items-center gap-4 py-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">Request Service</h1>
            <p className="text-sm text-muted-foreground">{service?.name}</p>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className="mt-1 text-xs text-muted-foreground">{step}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-8 transition-colors md:w-16 ${
                    index < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="container py-4">
        {/* Service Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-4 border-secondary/30 bg-secondary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                  <ServiceIcon className="h-7 w-7 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{service?.name}</h3>
                  <p className="text-sm text-muted-foreground">{service?.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">R{actualPrice}</p>
                  <p className="text-sm text-muted-foreground">{service?.eta}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Request For Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4"
        >
          <div className="flex gap-2">
            <Button
              variant={!requestForOther ? "amber" : "outline"}
              className={`flex-1 ${requestForOther ? "text-primary-foreground" : ""}`}
              onClick={() => {
                setRequestForOther(false);
                setFieldErrors({});
              }}
            >
              <User className="mr-2 h-4 w-4" />
              For Me
            </Button>
            <Button
              variant={requestForOther ? "amber" : "outline"}
              className={`flex-1 ${!requestForOther ? "text-primary-foreground" : ""}`}
              onClick={() => setRequestForOther(true)}
            >
              <Users className="mr-2 h-4 w-4" />
              For Someone Else
            </Button>
          </div>
        </motion.div>

        {/* Friend Details (when requesting for someone else) */}
        {requestForOther && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <Card variant="default" className="border-2 border-primary/20">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">Friend's Details</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Name</label>
                    <Input
                      placeholder="Enter friend's name"
                      value={friendDetails.name}
                      onChange={(e) => handleFriendDetailChange('name', e.target.value)}
                      maxLength={100}
                      className={fieldErrors.name ? 'border-destructive' : ''}
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Phone Number</label>
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 items-center rounded-lg bg-muted px-3 text-sm text-muted-foreground">
                        +27
                      </div>
                      <Input
                        placeholder="Enter phone number"
                        value={friendDetails.phone}
                        onChange={(e) => {
                          // Only allow numeric input
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          handleFriendDetailChange('phone', numericValue);
                        }}
                        maxLength={10}
                        className={fieldErrors.phone ? 'border-destructive' : ''}
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Location</label>
                    <div className="relative">
                      <Input
                        placeholder="Enter address or drop pin"
                        value={friendDetails.location}
                        onChange={(e) => handleFriendDetailChange('location', e.target.value)}
                        maxLength={200}
                        className={`pr-10 ${fieldErrors.location ? 'border-destructive' : ''}`}
                      />
                      <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    {fieldErrors.location && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.location}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your friend will receive an SMS with the responder's details
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="interactive" className="mb-4">
            <CardContent className="p-4">
              {isEditingLocation ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Enter Street Name</p>
                    <LocationSelector onSelect={handleSavedLocationSelect} />
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter street name or nearest street where you need assistance"
                      value={manualLocation}
                      onChange={(e) => {
                        setManualLocation(e.target.value);
                        setLocationError(null);
                      }}
                      className={locationError ? "border-destructive" : ""}
                    />
                    {locationError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {locationError}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setIsEditingLocation(false);
                        setManualLocation("");
                        setLocationError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="amber"
                      size="sm"
                      className="flex-1"
                      onClick={handleManualLocationSubmit}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                    <MapPin className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Pickup Location</p>
                    <p className="font-semibold text-foreground">
                      {isLoadingLocation ? "Detecting..." : location}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={detectLocation}
                      disabled={isLoadingLocation}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingLocation ? "animate-spin" : ""}`} />
                    </Button>
                    {!isLoadingLocation && location !== "Detecting location..." && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setIsEditingLocation(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ETA Estimate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card variant="default" className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <Clock className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                  <p className="font-semibold text-foreground">{service?.eta}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment via Payfast */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="default" className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <CreditCard className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Payment</p>
                  <p className="font-semibold text-foreground">Secure checkout via Payfast</p>
                  <p className="text-xs text-muted-foreground">You'll enter card details on Payfast's secure page</p>
                </div>
                <Shield className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mechanic Disclaimer - Only for mechanic service */}
        {isMechanicService && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card variant="warning" className="mb-4 border-l-4 border-l-warning">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-warning shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Important Information</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Now-Now Assist is a connection service only</li>
                      <li>• We are not responsible for repairs or workmanship</li>
                      <li>• Payment to the mechanic is separate from this fee</li>
                      <li>• Now-Now Assist is not liable for outcomes of repairs</li>
                    </ul>
                    <div className="pt-2">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="mechanic-terms"
                          checked={mechanicAcknowledged}
                          onCheckedChange={(checked) => setMechanicAcknowledged(checked === true)}
                          className="mt-0.5"
                        />
                        <label 
                          htmlFor="mechanic-terms" 
                          className="text-sm font-medium cursor-pointer leading-snug"
                        >
                          I understand that Now-Now Assist is only connecting me to a mechanic
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Safety Notice - Only for non-mechanic services */}
        {!isMechanicService && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card variant="success" className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium text-foreground">Your safety matters</p>
                    <p className="text-sm text-muted-foreground">
                      All responders are verified and tracked in real-time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Price Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="space-y-2 rounded-2xl bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {isMechanicService ? "Connection Fee" : "Service"}
              </span>
              <span className="font-medium">R{actualPrice}</span>
            </div>
            {isMechanicService && (
              <p className="text-xs text-muted-foreground italic">
                Repair costs are paid directly to the mechanic
              </p>
            )}
            <div className="border-t border-border pt-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">R{actualPrice}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Confirm Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Button
            variant="amber"
            size="xl"
            className="w-full"
            onClick={handleConfirm}
            disabled={isProcessing || (isMechanicService && !mechanicAcknowledged)}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <motion.div
                  className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                {isMechanicService ? "Finding mechanic..." : "Processing..."}
              </span>
            ) : isMechanicService ? (
              `Find Me a Mechanic – R${actualPrice}`
            ) : (
              `Confirm & Pay R${actualPrice}`
            )}
          </Button>

          <WhatsAppFallback
            visible={showWhatsAppFallback}
            serviceName={service?.name}
            location={location}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ServiceRequest;
