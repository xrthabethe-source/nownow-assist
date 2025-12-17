import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TyreIcon, BatteryIcon, FuelIcon, PumpIcon, WrenchIcon } from "@/components/icons/ServiceIcons";
import { ArrowLeft, MapPin, Clock, CreditCard, Shield, ChevronRight, Check, User, Phone, Users } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

const services: Record<string, any> = {
  tyre: { name: "Change a Tyre", icon: TyreIcon, price: 350, eta: "15-25 min", description: "Professional tyre change service" },
  battery: { name: "Jump-start Battery", icon: BatteryIcon, price: 250, eta: "10-20 min", description: "Quick battery jump-start" },
  fuel: { name: "Fuel Delivery", icon: FuelIcon, price: 180, eta: "15-30 min", description: "5-10L fuel delivery" },
  inflate: { name: "Inflate Tyre", icon: PumpIcon, price: 150, eta: "10-20 min", description: "Tyre inflation service" },
  other: { name: "Other Help", icon: WrenchIcon, price: 200, eta: "20-40 min", description: "General roadside assistance" },
};

const steps = ["Service", "Location", "Payment", "Confirm"];

export const ServiceRequest = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [requestForOther, setRequestForOther] = useState(false);
  const [friendDetails, setFriendDetails] = useState({
    name: "",
    phone: "",
    location: "",
  });

  const service = services[serviceId || "tyre"];
  const ServiceIcon = service?.icon || TyreIcon;

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      navigate("/customer/tracking");
    }, 1500);
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
          <Card variant="amber" className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                  <ServiceIcon className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{service?.name}</h3>
                  <p className="text-sm text-muted-foreground">{service?.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">R{service?.price}</p>
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
              className="flex-1"
              onClick={() => setRequestForOther(false)}
            >
              <User className="mr-2 h-4 w-4" />
              For Me
            </Button>
            <Button
              variant={requestForOther ? "amber" : "outline"}
              className="flex-1"
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
                      onChange={(e) => setFriendDetails({ ...friendDetails, name: e.target.value })}
                    />
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
                        onChange={(e) => setFriendDetails({ ...friendDetails, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Location</label>
                    <div className="relative">
                      <Input
                        placeholder="Enter address or drop pin"
                        value={friendDetails.location}
                        onChange={(e) => setFriendDetails({ ...friendDetails, location: e.target.value })}
                        className="pr-10"
                      />
                      <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
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
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <MapPin className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Pickup Location</p>
                  <p className="font-semibold text-foreground">123 Main Street, Sandton</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
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
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                  <p className="font-semibold text-foreground">{service?.eta}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="interactive" className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <CreditCard className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-semibold text-foreground">•••• 4242</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Safety Notice */}
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

        {/* Price Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="space-y-2 rounded-2xl bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Fee</span>
              <span className="font-medium">R{service?.price}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Fee</span>
              <span className="font-medium">R0</span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">R{service?.price}</span>
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
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <motion.div
                  className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Processing...
              </span>
            ) : (
              `Confirm & Pay R${service?.price}`
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default ServiceRequest;
