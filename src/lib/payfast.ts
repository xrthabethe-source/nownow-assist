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
 * Redirects user to PayFast payment page.
 * Uses window.open as primary method to avoid iframe restrictions,
 * falls back to form POST for published site.
 */
export const redirectToPayfast = (paymentUrl: string, paymentData: Record<string, string>) => {
  // Build the form and submit it
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;
  form.style.display = "none";

  Object.entries(paymentData).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });

  // Detect if we're in an iframe
  const isInIframe = window.self !== window.top;

  if (isInIframe) {
    // In iframe (Lovable preview): open in new tab
    form.target = "_blank";
  }
  // On published site: form submits in same window (default behavior)

  document.body.appendChild(form);
  form.submit();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(form);
  }, 1000);
};
