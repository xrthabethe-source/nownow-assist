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
  window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
};
