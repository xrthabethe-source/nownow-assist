import { motion } from "framer-motion";
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
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const mockJob = {
  id: "JOB-001",
  service: "Tyre Change",
  customer: {
    name: "John M.",
    phone: "+27 82 123 4567",
    rating: 4.8,
  },
  location: "123 Main Street, Sandton",
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

export const ActiveJob = () => {
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState(1);

  const handleNextStage = () => {
    if (currentStage < stages.length - 1) {
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

        {/* Open Maps Button */}
        <Button
          variant="amber"
          size="lg"
          className="absolute bottom-4 left-4 right-4"
        >
          <Navigation className="mr-2 h-5 w-5" />
          Open in Google Maps
        </Button>
      </div>

      <div className="container py-4 space-y-4">
        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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

        {/* Photo Upload (shown during job) */}
        {currentStage >= 2 && currentStage < 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card variant="interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Camera className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {currentStage === 2 ? "Arrival Photo" : "Completion Photo"}
                      </p>
                      <p className="text-sm text-muted-foreground">Required to proceed</p>
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
            >
              {stages[currentStage].action}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ActiveJob;
