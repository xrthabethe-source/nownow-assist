import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { TyreIcon, BatteryIcon, FuelIcon, PumpIcon, MechanicIcon, DiagnosticsIcon } from "@/components/icons/ServiceIcons";
import { BottomNav } from "@/components/shared/BottomNav";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SaveLocationDialog } from "@/components/customer/SaveLocationDialog";
import { LocationSelector } from "@/components/customer/LocationSelector";
import { useSavedLocations, SavedLocation } from "@/hooks/useSavedLocations";
import { MapPin, Clock, Phone, Loader2, RefreshCw, Bookmark, BookmarkPlus } from "lucide-react";
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
  const [location, setLocation] = useState("Detecting your location...");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isFromSaved, setIsFromSaved] = useState(false);
  const navigate = useNavigate();
  const { data: savedLocations } = useSavedLocations();

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocation("Location not supported");
      setIsLocating(false);
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setIsFromSaved(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'User-Agent': 'NowNowAssist/1.0' } }
          );
          const data = await response.json();
          
          if (data.address) {
            const { road, house_number, suburb, city, town, village } = data.address;
            const streetNumber = house_number || "";
            const streetName = road || "Unknown Street";
            const area = suburb || city || town || village || "";
            const fullStreet = streetNumber ? `${streetNumber} ${streetName}` : streetName;
            setLocation(`${fullStreet}${area ? `, ${area}` : ""}`);
          } else {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocation("Location access denied");
            setLocationError("Please enable location access");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocation("Location unavailable");
            setLocationError("Unable to determine your location");
            break;
          case error.TIMEOUT:
            setLocation("Location timeout");
            setLocationError("Location request timed out");
            break;
          default:
            setLocation("Location error");
            setLocationError("An unknown error occurred");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Load default saved location or detect GPS
  useEffect(() => {
    const defaultLocation = savedLocations?.find((loc) => loc.is_default);
    if (defaultLocation) {
      setLocation(defaultLocation.address);
      setCoordinates({ lat: Number(defaultLocation.latitude), lng: Number(defaultLocation.longitude) });
      setIsLocating(false);
      setIsFromSaved(true);
    } else {
      fetchLocation();
    }
  }, [savedLocations]);

  const handleSavedLocationSelect = (savedLoc: SavedLocation) => {
    setLocation(savedLoc.address);
    setCoordinates({ lat: Number(savedLoc.latitude), lng: Number(savedLoc.longitude) });
    setIsFromSaved(true);
    setLocationError(null);
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    navigate(`/customer/request/${serviceId}`);
  };

  const canSaveLocation = coordinates && !isLocating && !locationError && !isFromSaved;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <Logo size="sm" />
          <Button variant="ghost" size="icon-sm" className="rounded-full">
            <Phone className="h-5 w-5" />
          </Button>
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
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
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
                  <p className="font-semibold text-foreground truncate">{location}</p>
                  {locationError && (
                    <p className="text-xs text-destructive">{locationError}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
                    title="Refresh location"
                  >
                    <RefreshCw className={`h-5 w-5 text-primary ${isLocating ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
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

      {/* Services Grid */}
      <div className="container py-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <h2 className="text-2xl font-bold text-foreground">How can we help?</h2>
          <p className="text-muted-foreground">Select a service to get started</p>
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
                variant="interactive"
                className={`h-full ${service.featured ? 'ring-2 ring-primary' : ''} ${service.isMechanic ? 'bg-muted/50' : ''}`}
                onClick={() => handleServiceSelect(service.id)}
              >
                <CardContent className="flex flex-col items-center p-4 text-center">
                  {service.featured && (
                    <span className="mb-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      MOST POPULAR
                    </span>
                  )}
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${service.isMechanic ? 'bg-secondary/20' : 'bg-primary/10'}`}>
                    <service.icon className={`h-7 w-7 ${service.isMechanic ? 'text-secondary-foreground' : 'text-primary'}`} />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">{service.name}</h3>
                  <p className="text-lg font-bold text-primary">{service.price}</p>
                  {service.isMechanic && (
                    <p className="mt-1 text-[10px] text-muted-foreground">Connection fee only</p>
                  )}
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
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
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
          <Button variant="link" size="sm" className="text-primary">
            View All
          </Button>
        </div>
        <Card variant="default">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <TyreIcon className="h-5 w-5 text-success" />
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
        <Card variant="warning" className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Stay Safe</h4>
                <p className="text-sm text-muted-foreground">
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
