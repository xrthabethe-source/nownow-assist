import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/shared/BottomNav";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Car, CreditCard, Bell, Shield, LogOut, ChevronRight, Camera, FileText, Clock, Settings2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { useVehicles } from "@/hooks/useVehicles";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { VehiclesDialog } from "@/components/customer/VehiclesDialog";
import { PaymentMethodsDialog } from "@/components/customer/PaymentMethodsDialog";
import { NotificationsDialog } from "@/components/customer/NotificationsDialog";
import { PrivacySecurityDialog } from "@/components/customer/PrivacySecurityDialog";
import { LegalDialog } from "@/components/customer/LegalDialog";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export const CustomerProfile = () => {
  const { signOut, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDriverProfile = location.pathname.startsWith("/driver");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPhoto, uploading } = useProfilePhoto();
  const { vehicles } = useVehicles();
  const { paymentMethods } = usePaymentMethods();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [vehiclesDialogOpen, setVehiclesDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [legalDialogOpen, setLegalDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          email: user.email || data.email || "",
          phone: data.phone || "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { url } = await uploadPhoto(file);
    if (url && profile) {
      setProfile({ ...profile, avatar_url: url });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-amber pb-16 pt-8">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/10" />
        
        {/* Role Switcher in top right */}
        <div className="absolute top-4 right-4 z-10">
          <RoleSwitcher variant="default" className="bg-white/20 border-white/30 text-white hover:bg-white/30" />
        </div>
        
        <div className="container relative text-center">
          <div className="relative mx-auto mb-4 inline-block">
            <div className="h-24 w-24 rounded-3xl bg-card shadow-lg overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-3xl bg-muted">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <button 
              onClick={handlePhotoClick}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-md disabled:opacity-50"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Camera className="h-4 w-4 text-primary-foreground" />
              )}
            </button>
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">
            {profile?.full_name || "Your Name"}
          </h1>
          <p className="text-sm text-primary-foreground/80">
            {user?.email || profile?.phone}
          </p>
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
                <Input 
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1" 
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <Input 
                  value={formData.email}
                  disabled
                  className="mt-1 opacity-60" 
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Phone</label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+27 82 123 4567"
                  className="mt-1" 
                />
              </div>
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="w-full"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Saved Vehicles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setVehiclesDialogOpen(true)}
          className="cursor-pointer"
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
                    <p className="text-sm text-muted-foreground">
                      {vehicles.length === 0
                        ? "No vehicles saved" 
                        : `${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} saved`}
                    </p>
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
          onClick={() => setPaymentDialogOpen(true)}
          className="cursor-pointer"
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
                    <p className="text-sm text-muted-foreground">
                      {paymentMethods.length === 0 
                        ? "No cards saved" 
                        : paymentMethods[0].card_brand
                          ? `${paymentMethods[0].card_brand} •••• ${paymentMethods[0].card_last_four}`
                          : `•••• ${paymentMethods[0].card_last_four}`}
                    </p>
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
              {/* Admin Panel Link - Only visible to admins */}
              {role === 'admin' && (
                <>
                  <button 
                    onClick={() => navigate("/admin")}
                    className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50 bg-primary/5"
                  >
                    <div className="flex items-center gap-3">
                      <Settings2 className="h-5 w-5 text-primary" />
                      <span className="font-medium text-primary">Admin Panel</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </button>
                  <div className="border-t border-border" />
                </>
              )}
              <button 
                onClick={() => setNotificationsDialogOpen(true)}
                className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span>Notifications</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="border-t border-border" />
              <button 
                onClick={() => navigate(isDriverProfile ? "/driver/earnings" : "/customer/history")}
                className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{isDriverProfile ? "Job History" : "Previous Assists"}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="border-t border-border" />
              <button 
                onClick={() => setPaymentDialogOpen(true)}
                className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span>Payment History</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="border-t border-border" />
              <button 
                onClick={() => setPrivacyDialogOpen(true)}
                className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>Privacy & Security</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="border-t border-border" />
              <button 
                onClick={() => setLegalDialogOpen(true)}
                className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span>Legal</span>
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

      {/* Dialogs */}
      <VehiclesDialog 
        open={vehiclesDialogOpen} 
        onOpenChange={setVehiclesDialogOpen} 
      />
      <PaymentMethodsDialog 
        open={paymentDialogOpen} 
        onOpenChange={setPaymentDialogOpen} 
      />
      <NotificationsDialog 
        open={notificationsDialogOpen} 
        onOpenChange={setNotificationsDialogOpen} 
      />
      <PrivacySecurityDialog 
        open={privacyDialogOpen} 
        onOpenChange={setPrivacyDialogOpen} 
      />
      <LegalDialog 
        open={legalDialogOpen} 
        onOpenChange={setLegalDialogOpen} 
      />

      <BottomNav type={isDriverProfile ? "driver" : "customer"} />
    </div>
  );
};

export default CustomerProfile;
