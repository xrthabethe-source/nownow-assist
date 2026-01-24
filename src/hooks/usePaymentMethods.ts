import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface PaymentMethod {
  id: string;
  user_id: string;
  card_last_four: string;
  card_brand: string | null;
  cardholder_name: string | null;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodInput {
  card_last_four: string;
  card_brand?: string;
  cardholder_name?: string;
  expiry_month: number;
  expiry_year: number;
  is_default?: boolean;
}

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPaymentMethods = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPaymentMethods((data as PaymentMethod[]) || []);
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async (paymentMethod: PaymentMethodInput) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .insert({
          user_id: user.id,
          card_last_four: paymentMethod.card_last_four,
          card_brand: paymentMethod.card_brand || null,
          cardholder_name: paymentMethod.cardholder_name || null,
          expiry_month: paymentMethod.expiry_month,
          expiry_year: paymentMethod.expiry_year,
          is_default: paymentMethod.is_default || false,
        })
        .select()
        .single();

      if (error) throw error;
      
      setPaymentMethods((prev) => [data as PaymentMethod, ...prev]);
      toast({
        title: "Card added",
        description: "Your payment method has been saved successfully.",
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

  const deletePaymentMethod = async (id: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
      toast({
        title: "Card removed",
        description: "Your payment method has been removed.",
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
    fetchPaymentMethods();
  }, [user]);

  return {
    paymentMethods,
    loading,
    addPaymentMethod,
    deletePaymentMethod,
    refetch: fetchPaymentMethods,
  };
};
