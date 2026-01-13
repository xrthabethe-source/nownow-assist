import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Save,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

interface GeneralSettings {
  app_name: string;
  support_email: string;
  support_phone: string;
}

interface NotificationSettings {
  push_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
}

interface SafetySettings {
  emergency_contact: string;
  safety_message: string;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*");

      if (error) throw error;

      const settingsMap: Record<string, any> = {};
      data.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      return settingsMap;
    },
  });

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    app_name: "Now-Now Assist",
    support_email: "support@nownow.co.za",
    support_phone: "+27 800 NOW NOW",
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    push_enabled: true,
    sms_enabled: true,
    email_enabled: true,
  });

  const [safetySettings, setSafetySettings] = useState<SafetySettings>({
    emergency_contact: "112",
    safety_message: "Your safety is our priority. All drivers are verified and tracked.",
  });

  useEffect(() => {
    if (settings) {
      if (settings.general) setGeneralSettings(settings.general);
      if (settings.notifications) setNotificationSettings(settings.notifications);
      if (settings.safety) setSafetySettings(settings.safety);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("app_settings")
        .update({ value })
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-app-settings"] });
    },
    onError: (error) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });

  const handleSaveGeneral = () => {
    updateSettingsMutation.mutate({ key: "general", value: generalSettings });
  };

  const handleSaveNotifications = () => {
    updateSettingsMutation.mutate({ key: "notifications", value: notificationSettings });
  };

  const handleSaveSafety = () => {
    updateSettingsMutation.mutate({ key: "safety", value: safetySettings });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure app settings and preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Safety
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    General Settings
                  </CardTitle>
                  <CardDescription>
                    Configure basic app information and branding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="app-name">App Name</Label>
                    <Input
                      id="app-name"
                      value={generalSettings.app_name}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, app_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      value={generalSettings.support_email}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, support_email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-phone">Support Phone</Label>
                    <Input
                      id="support-phone"
                      value={generalSettings.support_phone}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, support_phone: e.target.value })
                      }
                    />
                  </div>

                  <Button onClick={handleSaveGeneral} disabled={updateSettingsMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how notifications are sent to users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send push notifications to mobile devices
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.push_enabled}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, push_enabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send SMS alerts for important updates
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.sms_enabled}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, sms_enabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications for receipts and updates
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_enabled}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, email_enabled: checked })
                      }
                    />
                  </div>

                  <Button onClick={handleSaveNotifications} disabled={updateSettingsMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Safety Settings */}
          <TabsContent value="safety">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Safety Settings
                  </CardTitle>
                  <CardDescription>
                    Configure safety features and emergency contacts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="emergency-contact">Emergency Contact Number</Label>
                    <Input
                      id="emergency-contact"
                      value={safetySettings.emergency_contact}
                      onChange={(e) =>
                        setSafetySettings({ ...safetySettings, emergency_contact: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      This number will be shown to users in emergency situations
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="safety-message">Safety Message</Label>
                    <Textarea
                      id="safety-message"
                      rows={4}
                      value={safetySettings.safety_message}
                      onChange={(e) =>
                        setSafetySettings({ ...safetySettings, safety_message: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      This message is displayed to users about safety measures
                    </p>
                  </div>

                  <Button onClick={handleSaveSafety} disabled={updateSettingsMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
