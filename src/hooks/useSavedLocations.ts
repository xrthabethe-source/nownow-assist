import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface SavedLocation {
  id: string;
  user_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useSavedLocations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["saved-locations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_locations")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavedLocation[];
    },
    enabled: !!user?.id,
  });
}

export function useSaveLocation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (location: {
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      is_default?: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // If setting as default, unset other defaults first
      if (location.is_default) {
        await supabase
          .from("saved_locations")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { data, error } = await supabase
        .from("saved_locations")
        .insert({
          user_id: user.id,
          name: location.name,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          is_default: location.is_default || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
      toast.success("Location saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save location: " + error.message);
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationId: string) => {
      const { error } = await supabase
        .from("saved_locations")
        .delete()
        .eq("id", locationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
      toast.success("Location deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete location: " + error.message);
    },
  });
}

export function useSetDefaultLocation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (locationId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Unset all defaults first
      await supabase
        .from("saved_locations")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Set new default
      const { error } = await supabase
        .from("saved_locations")
        .update({ is_default: true })
        .eq("id", locationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
      toast.success("Default location updated");
    },
  });
}
