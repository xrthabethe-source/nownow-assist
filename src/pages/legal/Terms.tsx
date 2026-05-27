import LegalPage from "./LegalPage";
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/lib/contact";

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="May 2026">
      <p>By using Now-Now Assist (via WhatsApp, our website or mobile app) you agree to these terms.</p>
      <h2>Our service</h2>
      <p>Now-Now Assist connects customers in the Centurion area with independent verified responders for roadside assistance such as tyre changes, jump-starts, fuel delivery and minor repairs.</p>
      <h2>Pricing and payment</h2>
      <p>Pricing for each service is communicated before dispatch. Payment is due once help has been provided, via the payment methods we make available from time to time.</p>
      <h2>Responsibilities</h2>
      <ul>
        <li>You must provide accurate location and vehicle information.</li>
        <li>You must keep yourself and the responder safe at the scene.</li>
        <li>Responders are independent service providers; Now-Now Assist is not liable for their conduct or work beyond the scope of our verification.</li>
      </ul>
      <h2>Limitation of liability</h2>
      <p>To the maximum extent allowed by law, our liability is limited to the amount you paid for the specific service request giving rise to the claim.</p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time. Continued use of the service after changes means you accept the updated terms.</p>
      <h2>Contact</h2>
      <p>Questions? Email <a className="text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or call {SUPPORT_PHONE_DISPLAY}.</p>
    </LegalPage>
  );
}
