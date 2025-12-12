import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { TyreIcon, BatteryIcon, FuelIcon, PumpIcon, WrenchIcon, MapPinIcon } from "@/components/icons/ServiceIcons";
import { BottomNav } from "@/components/shared/BottomNav";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MapPin, Navigation, Clock, Star, ChevronRight, Phone } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const services = [
  { id: "tyre", name: "Change a Tyre", icon: TyreIcon, price: "R350", eta: "15-25 min" },
  { id: "battery", name: "Jump-start Battery", icon: BatteryIcon, price: "R250", eta: "10-20 min" },
  { id: "fuel", name: "Fuel Delivery", icon: FuelIcon, price: "R180", eta: "15-30 min" },
  { id: "inflate", name: "Inflate Tyre", icon: PumpIcon, price: "R150", eta: "10-20 min" },
  { id: "other", name: "Other Help", icon: WrenchIcon, price: "From R200", eta: "20-40 min" },
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
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    navigate(`/customer/request/${serviceId}`);
  };

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
                  <MapPin className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Your Location</p>
                  <p className="font-semibold text-foreground">123 Main Street, Sandton</p>
                </div>
                <Button variant="ghost" size="icon-sm">
                  <Navigation className="h-5 w-5 text-primary" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
                className="h-full"
                onClick={() => handleServiceSelect(service.id)}
              >
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <service.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">{service.name}</h3>
                  <p className="text-lg font-bold text-primary">{service.price}</p>
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
