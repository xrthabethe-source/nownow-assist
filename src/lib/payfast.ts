import { supabase } from "@/integrations/supabase/client";

interface PayfastPaymentParams {
  amount: number;
  itemName: string;
  jobId?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

interface PayfastResponse {
  payment_url: string;
  payment_data: Record<string, string>;
  sandbox: boolean;
}

export const initiatePayfastPayment = async ({
  amount,
  itemName,
  jobId,
  returnUrl,
  cancelUrl,
}: PayfastPaymentParams): Promise<PayfastResponse> => {
  const { data, error } = await supabase.functions.invoke("payfast-payment", {
    body: {
      amount,
      item_name: itemName,
      job_id: jobId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data as PayfastResponse;
};

/**
 * Redirects user to Payfast payment page by submitting a form
 */
export const redirectToPayfast = (paymentUrl: string, paymentData: Record<string, string>) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;
  form.style.display = "none";
  form.target = "_top"; // Break out of iframe

  Object.entries(paymentData).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};
