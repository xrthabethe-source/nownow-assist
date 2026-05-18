import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Zap,
  Save,
  RefreshCw,
  Fuel,
} from "lucide-react";
import { motion } from "framer-motion";

interface FuelPricesConfig {
  diesel: number;
  ulp93: number;
  ulp95: number;
  service_fee: number;
  included_litres: number;
  currency: string;
}

interface PricingConfig {
  minimum_fare: number;
  surge_enabled: boolean;
  max_surge_multiplier: number;
}

export default function AdminPricing() {
  const queryClient = useQueryClient();
  
  const { data: pricingSettings, isLoading } = useQuery({
    queryKey: ["admin-pricing-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "pricing")
        .maybeSingle();

      if (error) throw error;
      const defaultConfig: PricingConfig = {
        minimum_fare: 100,
        surge_enabled: true,
        max_surge_multiplier: 3.0,
      };
      return data?.value ? (data.value as unknown as PricingConfig) : defaultConfig;
    },
  });

  const { data: services } = useQuery({
    queryKey: ["admin-services-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const defaultFuel: FuelPricesConfig = {
    diesel: 22.5,
    ulp93: 23.4,
    ulp95: 23.7,
    service_fee: 229,
    included_litres: 5,
    currency: "R",
  };

  const { data: fuelPrices } = useQuery({
    queryKey: ["admin-fuel-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "fuel_prices")
        .maybeSingle();
      if (error) throw error;
      return data?.value ? (data.value as unknown as FuelPricesConfig) : defaultFuel;
    },
  });

  const [config, setConfig] = useState<PricingConfig>({
    minimum_fare: 100,
    surge_enabled: true,
    max_surge_multiplier: 3.0,
  });
  const [fuel, setFuel] = useState<FuelPricesConfig>(defaultFuel);

  const [surgeValues, setSurgeValues] = useState<Record<string, number>>({});

  // Update local state when data loads
  useEffect(() => {
    if (pricingSettings) setConfig(pricingSettings);
  }, [pricingSettings]);
  useEffect(() => {
    if (fuelPrices) setFuel(fuelPrices);
  }, [fuelPrices]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newConfig: PricingConfig) => {
      const { error } = await supabase
        .from("app_settings")
        .update({ value: JSON.parse(JSON.stringify(newConfig)) })
        .eq("key", "pricing");

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pricing settings updated");
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-settings"] });
    },
    onError: (error) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });

  const updateSurgeMutation = useMutation({
    mutationFn: async ({ serviceId, surge }: { serviceId: string; surge: number }) => {
      const { error } = await supabase
        .from("services")
        .update({ surge_multiplier: surge })
        .eq("id", serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Surge pricing updated");
      queryClient.invalidateQueries({ queryKey: ["admin-services-pricing"] });
    },
    onError: (error) => {
      toast.error("Failed to update surge: " + error.message);
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(config);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pricing Control</h1>
            <p className="text-muted-foreground">Manage base prices, surge pricing, and fare rules</p>
          </div>
          <Button onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Global Settings */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Global Pricing Rules
                </CardTitle>
                <CardDescription>
                  Configure minimum fare and global pricing settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="min-fare">Minimum Fare (R)</Label>
                  <Input
                    id="min-fare"
                    type="number"
                    value={config.minimum_fare}
                    onChange={(e) =>
                      setConfig({ ...config, minimum_fare: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    The minimum amount charged for any service request
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-warning" />
                  Surge Pricing
                </CardTitle>
                <CardDescription>
                  Configure dynamic pricing during peak demand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Surge Pricing</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically increase prices during high demand
                    </p>
                  </div>
                  <Switch
                    checked={config.surge_enabled}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, surge_enabled: checked })
                    }
                  />
                </div>

                {config.surge_enabled && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Maximum Surge Multiplier</Label>
                      <span className="text-2xl font-bold text-warning">
                        {config.max_surge_multiplier.toFixed(1)}x
                      </span>
                    </div>
                    <Slider
                      value={[config.max_surge_multiplier]}
                      onValueChange={([value]) =>
                        setConfig({ ...config, max_surge_multiplier: value })
                      }
                      min={1}
                      max={5}
                      step={0.5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum price multiplier during peak hours
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Service-specific Surge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Service Surge Multipliers
              </CardTitle>
              <CardDescription>
                Set individual surge multipliers for each service
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services?.map((service) => (
                    <Card key={service.id} variant="outline">
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="font-medium">{service.name}</span>
                          <span className={`text-lg font-bold ${
                            (service.surge_multiplier || 1) > 1 ? "text-warning" : "text-muted-foreground"
                          }`}>
                            {(service.surge_multiplier || 1).toFixed(1)}x
                          </span>
                        </div>
                        <Slider
                          value={[surgeValues[service.id] ?? service.surge_multiplier ?? 1]}
                          onValueChange={([value]) =>
                            setSurgeValues({ ...surgeValues, [service.id]: value })
                          }
                          onValueCommit={([value]) =>
                            updateSurgeMutation.mutate({ serviceId: service.id, surge: value })
                          }
                          min={1}
                          max={config.max_surge_multiplier}
                          step={0.1}
                        />
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                          <span>Base: R{service.base_price}</span>
                          <span>
                            Surge: R{(service.base_price * (surgeValues[service.id] ?? service.surge_multiplier ?? 1)).toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Commission Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Platform Commission
              </CardTitle>
              <CardDescription>
                Default commission structure for driver payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-muted p-4 text-center">
                  <p className="text-3xl font-bold text-primary">80%</p>
                  <p className="text-sm text-muted-foreground">Default Driver Payout</p>
                </div>
                <div className="rounded-xl bg-muted p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">20%</p>
                  <p className="text-sm text-muted-foreground">Platform Commission</p>
                </div>
                <div className="rounded-xl bg-muted p-4 text-center">
                  <p className="text-3xl font-bold text-success">50-95%</p>
                  <p className="text-sm text-muted-foreground">Adjustable Range</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Individual driver payout percentages can be adjusted in the Drivers Management section.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
