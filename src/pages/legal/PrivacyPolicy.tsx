import LegalPage from "./LegalPage";
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/lib/contact";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="May 2026">
      <p>Now-Now Assist ("we", "us") respects your privacy. This policy explains what information we collect when you use our WhatsApp service, mobile app or website, and how we use it.</p>
      <h2>Information we collect</h2>
      <ul>
        <li>Name, phone number and email address you provide when requesting help or registering.</li>
        <li>Your location (GPS or shared address) so we can dispatch a responder.</li>
        <li>Details of your service request and communications with our team and responders.</li>
        <li>Basic device and usage information for security and quality purposes.</li>
      </ul>
      <h2>How we use your information</h2>
      <ul>
        <li>To dispatch a verified responder to your location.</li>
        <li>To contact you about your request via WhatsApp, SMS, call or email.</li>
        <li>To process payments and prevent fraud.</li>
        <li>To improve the service and comply with legal obligations.</li>
      </ul>
      <h2>Sharing</h2>
      <p>We only share the minimum information needed with the responder assigned to your job (typically name, contact number and location). We do not sell your personal information.</p>
      <h2>Your rights (POPIA)</h2>
      <p>You may request access to, correction or deletion of your personal information at any time by contacting us at <a className="text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or {SUPPORT_PHONE_DISPLAY}.</p>
      <h2>Contact</h2>
      <p>Questions about this policy? Email <a className="text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    </LegalPage>
  );
}
