// Centralised business contact details for Now-Now Assist (Centurion launch).
export const SUPPORT_PHONE_DISPLAY = "+27 65 663 6685";
export const SUPPORT_PHONE_TEL = "+27656636685";
export const SUPPORT_WHATSAPP_NUMBER = "27656636685";
export const SUPPORT_EMAIL = "nownowassist@gmail.com";
export const SUPPORT_WHATSAPP_DEFAULT_MESSAGE =
  "Hi Now-Now Assist, I need roadside help.\n\nService:\nLocation:\nCar:\nIssue:";
export const SUPPORT_WHATSAPP_BUTTON_LABEL = "Request Help on WhatsApp";

export const buildWhatsAppUrl = (message: string = SUPPORT_WHATSAPP_DEFAULT_MESSAGE) =>
  `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const SUPPORT_WHATSAPP_URL = buildWhatsAppUrl();

export const openSupportWhatsApp = (message?: string) => {
  const url = buildWhatsAppUrl(message);
  try {
    // Use a real anchor click so sandboxed iframes (Lovable preview) and mobile
    // browsers treat it as a user-initiated navigation instead of a blocked popup.
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    // Fallback: top-level navigation
    window.top ? (window.top.location.href = url) : (window.location.href = url);
  }
};
