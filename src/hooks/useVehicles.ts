import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string | null;
  registration_number: string;
  color: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleInput {
  make: string;
  model?: string;
  registration_number: string;
  color?: string;
  is_default?: boolean;
}

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVehicles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles((data as Vehicle[]) || []);
    } catch (error: any) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async (vehicle: VehicleInput) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .insert({
          user_id: user.id,
          make: vehicle.make,
          model: vehicle.model || null,
          registration_number: vehicle.registration_number,
          color: vehicle.color || null,
          is_default: vehicle.is_default || false,
        })
        .select()
        .single();

      if (error) throw error;
      
      setVehicles((prev) => [data as Vehicle, ...prev]);
      toast({
        title: "Vehicle added",
        description: "Your vehicle has been saved successfully.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const updateVehicle = async (id: string, vehicle: Partial<VehicleInput>) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .update(vehicle)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      
      setVehicles((prev) =>
        prev.map((v) => (v.id === id ? (data as Vehicle) : v))
      );
      toast({
        title: "Vehicle updated",
        description: "Your vehicle has been updated successfully.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast({
        title: "Vehicle deleted",
        description: "Your vehicle has been removed.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  return {
    vehicles,
    loading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    refetch: fetchVehicles,
  };
};
