// Centralised business contact details for Now-Now Assist (Centurion launch).
export const SUPPORT_PHONE_DISPLAY = "+27 61 327 8392";
export const SUPPORT_PHONE_TEL = "+27613278392";
export const SUPPORT_WHATSAPP_NUMBER = "27613278392";
export const SUPPORT_EMAIL = "nownowassist@gmail.com";
export const SUPPORT_WHATSAPP_DEFAULT_MESSAGE =
  "Hi Now-Now Assist, I need roadside help";

export const buildWhatsAppUrl = (message: string = SUPPORT_WHATSAPP_DEFAULT_MESSAGE) =>
  `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const openSupportWhatsApp = (message?: string) => {
  window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
};
