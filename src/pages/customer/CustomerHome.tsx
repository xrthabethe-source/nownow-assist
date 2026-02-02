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
import { MapPin, Clock, Loader2, RefreshCw, Bookmark, BookmarkPlus, Edit2, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const services = [
  { id: "fuel", name: "Fuel Rescue", icon: FuelIcon, price: "R349", eta: "15-25 min", description: "We bring fuel to get you moving now", featured: true },
  { id: "jumpstart", name: "Jump-Start Rescue", icon: BatteryIcon, price: "R199", eta: "10-20 min", description: "Flat battery? We'll jump-start your vehicle so you can get moving again. Basic jump-start only." },
  { id: "tyre", name: "Tyre Change", icon: TyreIcon, price: "R249", eta: "15-25 min", description: "Safe tyre change assistance" },
  { id: "mechanic", name: "Call a Mechanic", icon: MechanicIcon, price: "R149", eta: "Varies", description: "Connect with a local mechanic", isMechanic: true },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const CustomerHome = () => {
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
  const { data: savedLocations, isLoading: isLoadingSavedLocations } = useSavedLocations();

  // Debug toggle: set to false once we've diagnosed the issue
  const DEBUG_LOCATION = true;
  const debug = (...args: unknown[]) => {
    if (!DEBUG_LOCATION) return;
    // eslint-disable-next-line no-console
    console.log(`[location][${new Date().toISOString()}]`, ...args);
  };

  const reverseGeocode = async (
    lat: number,
    lon: number
  ): Promise<{ location: string | null; displayName: string | null }> => {
    debug("reverseGeocode:start", { lat, lon });
    try {
      const { data, error } = await supabase.functions.invoke("reverse-geocode", {
        body: { lat, lon },
      });

      debug("reverseGeocode:response", {
        hasError: !!error,
        error: error ? { message: (error as any)?.message, name: (error as any)?.name } : null,
        data,
      });

      if (error) {
        console.error("Reverse geocode error:", error);
        return { location: null, displayName: null };
      }
      const location = data?.location && data.location.length > 0 ? data.location : null;
      const displayName = data?.display_name || null;

      debug("reverseGeocode:parsed", { location, displayName });
      return { location, displayName };
    } catch (err) {
      console.error("Reverse geocode exception:", err);
      debug("reverseGeocode:exception", err);
      return { location: null, displayName: null };
    }
  };

  const toShortPinnedAddress = (value: string) => {
    // Keep it Uber-style short: remove ward/municipality/postcode/country noise.
    const parts = value
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !/\bward\b/i.test(p))
      .filter((p) => !/\bmunicipality\b/i.test(p))
      .filter((p) => !/\bmetropolitan\b/i.test(p))
      .filter((p) => !/^\d{4,6}$/.test(p));

    return parts.slice(0, 2).join(", ");
  };

  const fetchLocation = () => {
    debug("fetchLocation:called");
    if (!navigator.geolocation) {
      debug("fetchLocation:no-geolocation-api");
      setLocation("");
      setIsLocating(false);
      setLocationError("GPS not supported. Enter your street.");
      setIsEditing(true);
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setIsFromSaved(false);
    setIsEditing(false);

    debug("fetchLocation:requesting-geolocation", {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        debug("fetchLocation:geolocation:success", {
          coords: {
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          },
          timestamp: position.timestamp,
        });

        setCoordinates({ lat: latitude, lng: longitude });

        const { location: streetName, displayName } = await reverseGeocode(latitude, longitude);

        debug("fetchLocation:reverseGeocode:result", { streetName, displayName });

        // Prefer our short backend `location` (street-ish). Only use display_name as a short fallback.
        if (streetName) {
          debug("fetchLocation:state:update", { action: "setLocation", value: streetName });
          setLocation(streetName);
          setIsLocating(false);
        } else if (displayName) {
          const short = toShortPinnedAddress(displayName);
          debug("fetchLocation:state:update", { action: "setLocation", value: short });
          setLocation(short);
          setIsLocating(false);
        } else {
          // No address found at all
          debug("fetchLocation:no-address-found", { displayName, streetName });
          setLocation("");
          setLocationError("Location not found. Enter your street.");
          setIsEditing(true);
          setIsLocating(false);
        }
      },
      (error) => {
        debug("fetchLocation:geolocation:error", {
          code: error.code,
          message: error.message,
        });
        setIsLocating(false);
        setIsEditing(true);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocation("");
            setLocationError("Location denied. Enter your street.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocation("");
            setLocationError("Can't detect location. Enter your street.");
            break;
          case error.TIMEOUT:
            setLocation("");
            setLocationError("Location timed out. Enter your street.");
            break;
          default:
            setLocation("");
            setLocationError("Enter your street name.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Load default saved location or detect GPS - only run once after saved locations load
  useEffect(() => {
    // Wait for saved locations query to complete before initializing
    debug("init:effect", {
      isLoadingSavedLocations,
      hasInitialized,
      savedLocationsCount: savedLocations?.length ?? null,
    });

    if (isLoadingSavedLocations || hasInitialized) return;
    
    setHasInitialized(true);
    
    const defaultLocation = savedLocations?.find((loc) => loc.is_default);
    if (defaultLocation) {
      debug("init:defaultLocation:found", {
        id: defaultLocation.id,
        name: defaultLocation.name,
        is_default: defaultLocation.is_default,
      });
      setLocation(defaultLocation.address);
      setCoordinates({ lat: Number(defaultLocation.latitude), lng: Number(defaultLocation.longitude) });
      setIsLocating(false);
      setIsFromSaved(true);
    } else {
      debug("init:defaultLocation:none", { savedLocationsCount: savedLocations?.length ?? 0 });
      fetchLocation();
    }
  }, [savedLocations, isLoadingSavedLocations, hasInitialized]);

  const handleSavedLocationSelect = (savedLoc: SavedLocation) => {
    setLocation(savedLoc.address);
    setCoordinates({ lat: Number(savedLoc.latitude), lng: Number(savedLoc.longitude) });
    setIsFromSaved(true);
    setLocationError(null);
    setInputError(null);
    setIsEditing(false);
  };

  const handleServiceSelect = (serviceId: string) => {
    // Validate location before proceeding
    if (!location.trim()) {
      setInputError("Please enter a street name before requesting service");
      setIsEditing(true);
      return;
    }
    setSelectedService(serviceId);
    navigate(`/customer/request/${serviceId}`);
  };

  const handleEditClick = () => {
    setManualInput(location);
    setIsEditing(true);
    setInputError(null);
  };

  const handleManualInputChange = (value: string) => {
    setManualInput(value);
    // Clear error when typing
    if (inputError) setInputError(null);
  };

  const handleManualSubmit = () => {
    const validation = validateStreetInput(manualInput);
    
    if (!validation.isValid) {
      setInputError(validation.error || "Invalid street name");
      return;
    }

    setLocation(manualInput.trim());
    setIsEditing(false);
    setInputError(null);
    setLocationError(null);
    setIsFromSaved(false);
    // Clear coordinates since this is manual entry
    setCoordinates(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setManualInput("");
    setInputError(null);
  };

  const handleMapPickerConfirm = (lat: number, lng: number, address: string) => {
    setCoordinates({ lat, lng });
    setLocation(address);
    setLocationError(null);
    setInputError(null);
    setIsFromSaved(false);
  };

  const canSaveLocation = coordinates && !isLocating && !locationError && !isFromSaved && location;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Deep Trust Blue */}
      <header className="sticky top-0 z-40 border-b border-border bg-primary/95 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <Logo size="lg" />
          <RoleSwitcher variant="compact" />
        </div>
      </header>

      {/* Location Card */}
      <div className="container py-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="amber" className="overflow-hidden">
            <CardContent className="p-4">
              {isEditing ? (
                // Manual input mode
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Enter street name or nearest street
                    </span>
                  </div>
                  <Input
                    value={manualInput}
                    onChange={(e) => handleManualInputChange(e.target.value)}
                    placeholder="e.g., Church Street, Corner of Jan Smuts and Beyers Naudé"
                    className={inputError ? "border-destructive" : ""}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleManualSubmit();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    autoFocus
                  />
                  {inputError && (
                    <p className="text-xs text-destructive">{inputError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleManualSubmit}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Confirm
                    </Button>
                    {location && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                // Display mode with map preview
                <div className="space-y-3">
                  {/* Map preview - only show when we have coordinates */}
                  {coordinates && !isLocating && (
                    <LocationMapPreview
                      lat={coordinates.lat}
                      lng={coordinates.lng}
                      onClick={() => setShowMapPicker(true)}
                    />
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shrink-0">
                      {isLocating ? (
                        <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
                      ) : isFromSaved ? (
                        <Bookmark className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
                      ) : (
                        <MapPin className="h-6 w-6 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Your Location</p>
                      <p className="font-semibold text-foreground line-clamp-2">
                        {location || "Enter your street name"}
                      </p>
                      {locationError && (
                        <p className="text-xs text-destructive">{locationError}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      {coordinates && !isLocating && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMapPicker(true)}
                          className="gap-1.5"
                        >
                          <MapPin className="h-4 w-4" />
                          Adjust Pin
                        </Button>
                      )}
                      {!isLocating && location && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEditClick}
                          className="gap-1.5"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <LocationSelector onSelect={handleSavedLocationSelect} />
                      {canSaveLocation && (
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          onClick={() => setShowSaveDialog(true)}
                          title="Save this location"
                        >
                          <BookmarkPlus className="h-5 w-5 text-primary" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        onClick={fetchLocation}
                        disabled={isLocating}
                        title="Detect via GPS"
                      >
                        <RefreshCw className={`h-5 w-5 text-primary ${isLocating ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Save Location Dialog */}
      {coordinates && (
        <SaveLocationDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          address={location}
          latitude={coordinates.lat}
          longitude={coordinates.lng}
        />
      )}

      {/* Full-screen Map Picker */}
      {coordinates && (
        <LocationMapPicker
          open={showMapPicker}
          onOpenChange={setShowMapPicker}
          initialLat={coordinates.lat}
          initialLng={coordinates.lng}
          onConfirm={handleMapPickerConfirm}
        />
      )}

      {/* Services Grid */}
      <div className="container py-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <h2 className="text-2xl font-bold text-white">How can we help?</h2>
          <p className="text-white/70">Select a service to get started</p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          {services.map((service) => (
            <motion.div key={service.id} variants={item}>
              <Card
                variant="default"
                className={`h-full cursor-pointer hover:border-primary/50 transition-all ${service.featured ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleServiceSelect(service.id)}
              >
                <CardContent className="flex flex-col items-center p-4 text-center">
                  {service.featured && (
                    <span className="mb-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                      MOST POPULAR
                    </span>
                  )}
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${service.isMechanic ? 'bg-muted' : 'bg-primary/20'}`}>
                    <service.icon className={`h-7 w-7 ${service.isMechanic ? 'text-white' : 'text-white'}`} />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">{service.name}</h3>
                  <p className="text-lg font-bold text-primary-foreground">{service.price}</p>
                  {service.isMechanic && (
                    <p className="mt-1 text-[10px] text-muted-foreground">Connection fee only</p>
                  )}
                  <div className="mt-2 flex items-center gap-1 text-xs text-white/70">
                    <Clock className="h-3 w-3" />
                    <span>{service.eta}</span>
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
          <h3 className="font-semibold text-white">Recent Activity</h3>
          <Button variant="ghost" size="sm" className="text-white" onClick={() => navigate('/customer/history')}>
            View All
          </Button>
        </div>
        <Card 
          variant="default" 
          className="cursor-pointer hover:border-primary/50 transition-all"
          onClick={() => navigate('/customer/history')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <TyreIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Tyre Change</p>
                <p className="text-sm text-muted-foreground">Dec 10, 2025 • R350</p>
              </div>
              <StatusBadge variant="success">Completed</StatusBadge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Card */}
      <div className="container py-4">
        <Card variant="amber" className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/30">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h4 className="font-semibold text-white">Stay Safe</h4>
                <p className="text-sm text-white/70">
                  If stranded, stay in your vehicle with hazards on. Our responder will find you.
                </p>
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
