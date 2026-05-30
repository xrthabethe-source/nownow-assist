import LegalPage from "./legal/LegalPage";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  openSupportWhatsApp,
} from "@/lib/contact";

export default function Contact() {
  return (
    <LegalPage title="Contact Us">
      <p>We're here to help. The fastest way to reach us is on WhatsApp.</p>

      <div className="not-prose mt-6 space-y-3">
        <Button size="lg" className="w-full justify-start gap-3" onClick={() => openSupportWhatsApp()}>
          <MessageCircle className="h-5 w-5" />
          WhatsApp: {SUPPORT_PHONE_DISPLAY}
        </Button>
        <Button variant="outline" size="lg" className="w-full justify-start gap-3" asChild>
          <a href={`tel:${SUPPORT_PHONE_TEL}`}>
            <Phone className="h-5 w-5" />
            Call: {SUPPORT_PHONE_DISPLAY}
          </a>
        </Button>
        <Button variant="outline" size="lg" className="w-full justify-start gap-3" asChild>
          <a href={`mailto:${SUPPORT_EMAIL}`}>
            <Mail className="h-5 w-5" />
            Email: {SUPPORT_EMAIL}
          </a>
        </Button>
      </div>

      <h2>Service area</h2>
      <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Now launching in Centurion, Gauteng. Expanding across South Africa soon.</p>
    </LegalPage>
  );
}
