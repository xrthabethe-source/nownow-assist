import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/shared/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Car, MapPin, CreditCard, Bell, Shield, LogOut, ChevronRight, Camera, Phone, Mail } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const CustomerProfile = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-amber pb-16 pt-8">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/10" />
        <div className="container relative text-center">
          <div className="relative mx-auto mb-4 inline-block">
            <div className="h-24 w-24 rounded-3xl bg-card shadow-lg">
              <div className="flex h-full w-full items-center justify-center rounded-3xl bg-muted">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <button className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-md">
              <Camera className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">John Doe</h1>
          <p className="text-sm text-primary-foreground/80">+27 82 123 4567</p>
        </div>
      </header>

      {/* Profile Content */}
      <div className="container -mt-8 space-y-4">
        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Full Name</label>
                <Input defaultValue="John Doe" className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <Input defaultValue="john@example.com" className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Phone</label>
                <Input defaultValue="+27 82 123 4567" className="mt-1" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Saved Vehicles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="interactive">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Saved Vehicles</p>
                    <p className="text-sm text-muted-foreground">1 vehicle saved</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card variant="interactive">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Payment Methods</p>
                    <p className="text-sm text-muted-foreground">•••• 4242</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <Card variant="default">
            <CardContent className="p-0">
              <button className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span>Notifications</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="border-t border-border" />
              <button className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>Privacy & Security</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button variant="destructive" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </motion.div>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground">
          Now-Now Assist v1.0.0
        </p>
      </div>

      <BottomNav type="customer" />
    </div>
  );
};

export default CustomerProfile;
