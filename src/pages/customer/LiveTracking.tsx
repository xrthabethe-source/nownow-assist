import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TyreIcon } from "@/components/icons/ServiceIcons";
import { Phone, MessageCircle, AlertTriangle, Star, Car, Navigation, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const mockDriver = {
  name: "Samuel K.",
  rating: 4.9,
  vehicle: "Toyota Hilux",
  plate: "CA 123-456",
  phone: "+27 82 123 4567",
  photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  eta: 12,
};

const statuses = [
  { key: "finding", label: "Finding a responder...", icon: "🔍" },
  { key: "matched", label: "Responder found!", icon: "✓" },
  { key: "on_way", label: "On the way", icon: "🚗" },
  { key: "arriving", label: "Almost there", icon: "📍" },
  { key: "arrived", label: "Responder arrived", icon: "🎉" },
];

export const LiveTracking = () => {
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState(0);
  const [eta, setEta] = useState(mockDriver.eta);

  useEffect(() => {
    // Simulate status progression
    const timer1 = setTimeout(() => setCurrentStatus(1), 2000);
    const timer2 = setTimeout(() => setCurrentStatus(2), 4000);

    // Simulate ETA countdown
    const etaInterval = setInterval(() => {
      setEta((prev) => Math.max(0, prev - 1));
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearInterval(etaInterval);
    };
  }, []);

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
            <motion.div
              className="absolute left-16 top-8"
              animate={{ x: [-10, 0], y: [5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-lg border-2 border-primary">
                <Car className="h-5 w-5 text-primary" />
              </div>
            </motion.div>

            {/* Path */}
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
        {currentStatus >= 1 && (
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
                      src={mockDriver.photo}
                      alt={mockDriver.name}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-success text-success-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{mockDriver.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span>{mockDriver.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {mockDriver.vehicle} • {mockDriver.plate}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                  <Button variant="amber" className="flex-1">
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
                  <TyreIcon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Tyre Change</p>
                  <p className="text-sm text-muted-foreground">123 Main Street, Sandton</p>
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
          <Button variant="sos" size="lg" className="w-full">
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
          <Button variant="ghost" className="text-muted-foreground">
            <X className="mr-2 h-4 w-4" />
            Cancel Request
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveTracking;
