import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Lock, Eye, Smartphone, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PrivacySecurityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacySecurityDialog = ({ open, onOpenChange }: PrivacySecurityDialogProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    biometricLogin: true,
    locationSharing: true,
    dataAnalytics: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast({
      title: "Setting Updated",
      description: "Your privacy preference has been saved.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy & Security
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add extra security to your account</p>
              </div>
            </div>
            <Switch 
              checked={settings.twoFactorAuth}
              onCheckedChange={() => handleToggle("twoFactorAuth")}
            />
          </div>

          {/* Biometric Login */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Biometric Login</p>
                <p className="text-xs text-muted-foreground">Use fingerprint or face to sign in</p>
              </div>
            </div>
            <Switch 
              checked={settings.biometricLogin}
              onCheckedChange={() => handleToggle("biometricLogin")}
            />
          </div>

          {/* Location Sharing */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Location Sharing</p>
                <p className="text-xs text-muted-foreground">Share location during active assists</p>
              </div>
            </div>
            <Switch 
              checked={settings.locationSharing}
              onCheckedChange={() => handleToggle("locationSharing")}
            />
          </div>

          {/* Data Analytics */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Analytics & Personalization</p>
                <p className="text-xs text-muted-foreground">Help us improve with usage data</p>
              </div>
            </div>
            <Switch 
              checked={settings.dataAnalytics}
              onCheckedChange={() => handleToggle("dataAnalytics")}
            />
          </div>

          {/* Delete Account */}
          <div className="pt-4 border-t border-border">
            <Button variant="destructive" className="w-full" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete My Account
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              This will permanently delete your account and all data
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
