import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/shared/Logo";
import { TyreIcon, BatteryIcon, FuelIcon, MechanicIcon } from "@/components/icons/ServiceIcons";
import { BottomNav } from "@/components/shared/BottomNav";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { SaveLocationDialog } from "@/components/customer/SaveLocationDialog";
import { LocationSelector } from "@/components/customer/LocationSelector";
import { LocationMapPreview } from "@/components/customer/LocationMapPreview";
import { LocationMapPicker } from "@/components/customer/LocationMapPicker";
import { useSavedLocations, SavedLocation } from "@/hooks/useSavedLocations";
import { supabase } from "@/integrations/supabase/client";
import { validateStreetInput } from "@/lib/streetValidation";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerJobs } from "@/hooks/useJobs";
import { MapPin, Clock, Loader2, RefreshCw, Bookmark, BookmarkPlus, Edit2, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";

const services = [
  { id: "fuel", name: "Fuel Rescue", icon: FuelIcon, price: "R349", eta: "15-25 min", description: "We bring fuel to get you moving now", featured: true },
  { id: "jumpstart", name: "Jump-Start Rescue", icon: BatteryIcon, price: "R199", eta: "10-20 min", description: "Flat battery? We'll jump-start your vehicle so you can get moving again. Basic jump-start only." },
  { id: "tyre", name: "Tyre Change", icon: TyreIcon, price: "R249", eta: "15-25 min", description: "Safe tyre change assistance" },
  { id: "mechanic", name: "Call a Mechanic", icon: MechanicIcon, price: "R149", eta: "Varies", description: "Connect with a local mechanic", isMechanic: true },
];

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Fuel Rescue": FuelIcon, "Jump-Start Rescue": BatteryIcon, "Jump-Start": BatteryIcon,
  "Tyre Change": TyreIcon, "Call a Mechanic": MechanicIcon,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const CustomerHome = () => {
  const { user } = useAuth();
  const { data: recentJobs } = useCustomerJobs();
  const [location, setLocation] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isFromSaved, setIsFromSaved] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: savedLocations, isLoading: isLoadingSavedLocations } = useSavedLocations();

  // Handle payment return from PayFast
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      toast.success("Payment successful! Your responder will be dispatched shortly.");
      setSearchParams({}, { replace: true });
    } else if (paymentStatus === "cancelled") {
      toast.error("Payment was cancelled. Your request has not been submitted.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const DEBUG_LOCATION = true;
  const debug = (...args: unknown[]) => {
    if (!DEBUG_LOCATION) return;
    console.log(`[location][${new Date().toISOString()}]`, ...args);
  };

  const reverseGeocode = async (lat: number, lon: number): Promise<{ location: string | null; displayName: string | null }> => {
    debug("reverseGeocode:start", { lat, lon });
    try {
      const { data, error } = await supabase.functions.invoke("reverse-geocode", { body: { lat, lon } });
      debug("reverseGeocode:response", { hasError: !!error, data });
      if (error) { console.error("Reverse geocode error:", error); return { location: null, displayName: null }; }
      const location = data?.location && data.location.length > 0 ? data.location : null;
      const displayName = data?.display_name || null;
      return { location, displayName };
    } catch (err) { console.error("Reverse geocode exception:", err); return { location: null, displayName: null }; }
  };

  const toShortPinnedAddress = (value: string) => {
    const parts = value.split(",").map((p) => p.trim()).filter(Boolean)
      .filter((p) => !/\bward\b/i.test(p)).filter((p) => !/\bmunicipality\b/i.test(p))
      .filter((p) => !/\bmetropolitan\b/i.test(p)).filter((p) => !/^\d{4,6}$/.test(p));
    return parts.slice(0, 2).join(", ");
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) { setLocation(""); setIsLocating(false); setLocationError("GPS not supported. Enter your street."); setIsEditing(true); return; }
    setIsLocating(true); setLocationError(null); setIsFromSaved(false); setIsEditing(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        const { location: streetName, displayName } = await reverseGeocode(latitude, longitude);
        if (streetName) { setLocation(streetName); setIsLocating(false); }
        else if (displayName) { setLocation(toShortPinnedAddress(displayName)); setIsLocating(false); }
        else { setLocation(""); setLocationError("Location not found. Enter your street."); setIsEditing(true); setIsLocating(false); }
      },
      (error) => {
        setIsLocating(false); setIsEditing(true);
        switch (error.code) {
          case error.PERMISSION_DENIED: setLocation(""); setLocationError("Location denied. Enter your street."); break;
          case error.POSITION_UNAVAILABLE: setLocation(""); setLocationError("Can't detect location. Enter your street."); break;
          case error.TIMEOUT: setLocation(""); setLocationError("Location timed out. Enter your street."); break;
          default: setLocation(""); setLocationError("Enter your street name.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (isLoadingSavedLocations || hasInitialized) return;
    setHasInitialized(true);
    const defaultLocation = savedLocations?.find((loc) => loc.is_default);
    if (defaultLocation) {
      setLocation(defaultLocation.address);
      setCoordinates({ lat: Number(defaultLocation.latitude), lng: Number(defaultLocation.longitude) });
      setIsLocating(false); setIsFromSaved(true);
    } else { fetchLocation(); }
  }, [savedLocations, isLoadingSavedLocations, hasInitialized]);

  const handleSavedLocationSelect = (savedLoc: SavedLocation) => {
    setLocation(savedLoc.address); setCoordinates({ lat: Number(savedLoc.latitude), lng: Number(savedLoc.longitude) });
    setIsFromSaved(true); setLocationError(null); setInputError(null); setIsEditing(false);
  };

  const handleServiceSelect = (serviceId: string) => {
    if (!location.trim()) { setInputError("Please enter a street name before requesting service"); setIsEditing(true); return; }
    setSelectedService(serviceId); navigate(`/customer/request/${serviceId}`);
  };

  const handleEditClick = () => { setManualInput(location); setIsEditing(true); setInputError(null); };
  const handleManualInputChange = (value: string) => { setManualInput(value); if (inputError) setInputError(null); };

  const handleManualSubmit = () => {
    const validation = validateStreetInput(manualInput);
    if (!validation.isValid) { setInputError(validation.error || "Invalid street name"); return; }
    setLocation(manualInput.trim()); setIsEditing(false); setInputError(null); setLocationError(null); setIsFromSaved(false); setCoordinates(null);
  };

  const handleCancelEdit = () => { setIsEditing(false); setManualInput(""); setInputError(null); };

  const handleMapPickerConfirm = (lat: number, lng: number, address: string) => {
    setCoordinates({ lat, lng }); setLocation(address); setLocationError(null); setInputError(null); setIsFromSaved(false);
  };

  const canSaveLocation = coordinates && !isLocating && !locationError && !isFromSaved && location;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container flex items-center justify-center relative py-4">
          <div className="absolute left-4"><RoleSwitcher variant="compact" /></div>
          <Logo size="xl" />
        </div>
      </header>

      {/* Location Card */}
      <div className="container py-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card variant="default" className="overflow-hidden border-primary/20">
            <CardContent className="p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-muted-foreground">Enter street name or nearest street</span>
                  </div>
                  <Input
                    value={manualInput} onChange={(e) => handleManualInputChange(e.target.value)}
                    placeholder="e.g., Church Street, Corner of Jan Smuts and Beyers Naudé"
                    className={inputError ? "border-destructive" : ""}
                    onKeyDown={(e) => { if (e.key === "Enter") handleManualSubmit(); if (e.key === "Escape") handleCancelEdit(); }}
                    autoFocus
                  />
                  {inputError && <p className="text-xs text-destructive">{inputError}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleManualSubmit} className="flex-1"><Check className="h-4 w-4 mr-1" />Confirm</Button>
                    {location && <Button size="sm" variant="outline" onClick={handleCancelEdit}><X className="h-4 w-4 mr-1" />Cancel</Button>}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {coordinates && !isLocating && (
                    <LocationMapPreview lat={coordinates.lat} lng={coordinates.lng} onClick={() => setShowMapPicker(true)} />
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shrink-0">
                      {isLocating ? <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" /> :
                       isFromSaved ? <Bookmark className="h-6 w-6 text-primary-foreground fill-primary-foreground" /> :
                       <MapPin className="h-6 w-6 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Your Location</p>
                      <p className="font-semibold text-foreground line-clamp-2">{location || "Enter your street name"}</p>
                      {locationError && <p className="text-xs text-destructive">{locationError}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      {coordinates && !isLocating && (
                        <Button variant="outline" size="sm" onClick={() => setShowMapPicker(true)} className="gap-1.5 border-secondary/20 text-secondary hover:bg-secondary/5 hover:border-secondary/40"><MapPin className="h-4 w-4" />Adjust Pin</Button>
                      )}
                      {!isLocating && location && (
                        <Button variant="ghost" size="sm" onClick={handleEditClick} className="gap-1.5 text-secondary hover:bg-secondary/10"><Edit2 className="h-4 w-4" />Edit</Button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <LocationSelector onSelect={handleSavedLocationSelect} />
                      {canSaveLocation && (
                        <Button variant="ghost" size="icon-sm" onClick={() => setShowSaveDialog(true)} title="Save this location"><BookmarkPlus className="h-5 w-5 text-secondary" /></Button>
                      )}
                      <Button variant="ghost" size="icon-sm" onClick={fetchLocation} disabled={isLocating} title="Detect via GPS">
                        <RefreshCw className={`h-5 w-5 text-secondary ${isLocating ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {coordinates && <SaveLocationDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} address={location} latitude={coordinates.lat} longitude={coordinates.lng} />}
      {coordinates && <LocationMapPicker open={showMapPicker} onOpenChange={setShowMapPicker} initialLat={coordinates.lat} initialLng={coordinates.lng} onConfirm={handleMapPickerConfirm} />}

      {/* Services Grid */}
      <div className="container py-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">How can we help?</h2>
          <p className="text-muted-foreground">Select a service to get started</p>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
          {services.map((service) => (
            <motion.div key={service.id} variants={item}>
              <Card
                variant="default"
                className={`h-full cursor-pointer hover:border-primary/40 hover:shadow-md transition-all ${service.featured ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleServiceSelect(service.id)}
              >
                <CardContent className="flex flex-col items-center p-4 text-center">
                  {service.featured && (
                    <span className="mb-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">MOST POPULAR</span>
                  )}
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                    <service.icon className="h-7 w-7 text-secondary" />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">{service.name}</h3>
                  <p className="text-lg font-bold text-accent">{service.price}</p>
                  {service.isMechanic && <p className="mt-1 text-[10px] text-muted-foreground">Connection fee only</p>}
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /><span>{service.eta}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="container py-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/customer/history')}>View All</Button>
        </div>
        {recentJobs && recentJobs.length > 0 ? (
          recentJobs.slice(0, 3).map((job: any) => {
            const statusVariant = job.status === "completed" ? "success" : job.status === "cancelled" ? "destructive" : "warning";
            const ServiceIcon = serviceIcons[job.services?.name] || TyreIcon;
            return (
              <Card key={job.id} variant="default" className="cursor-pointer hover:shadow-md transition-all mb-2" onClick={() => navigate('/customer/history')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <ServiceIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{job.services?.name || "Service"}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(job.created_at), "MMM d, yyyy")} • R{job.final_price || job.estimated_price || 0}</p>
                    </div>
                    <StatusBadge variant={statusVariant}>{job.status === "completed" ? "Completed" : job.status === "cancelled" ? "Cancelled" : "Active"}</StatusBadge>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card variant="default">
            <CardContent className="p-4 text-center text-muted-foreground">
              <p>No recent activity yet. Request a service to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Safety Card */}
      <div className="container py-4">
        <Card variant="amber" className="border-l-4 border-l-accent">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Stay Safe</h4>
                <p className="text-sm text-muted-foreground">If stranded, stay in your vehicle with hazards on. Our responder will find you.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav type="customer" />
    </div>
  );
};

export default CustomerHome;
