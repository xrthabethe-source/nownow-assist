import LegalPage from "./legal/LegalPage";

export default function About() {
  return (
    <LegalPage title="About Now-Now Assist">
      <p>Now-Now Assist is a Centurion-born roadside assistance service for South African drivers who want help, fast, without monthly memberships or complicated apps.</p>
      <h2>Our mission</h2>
      <p>"Stuck on the road? We'll be there, now-now." We connect drivers in trouble with verified local responders – through the simplest channel possible: WhatsApp.</p>
      <h2>What makes us different</h2>
      <ul>
        <li>WhatsApp-first: no app to download to get help.</li>
        <li>Local focus: launching in Centurion, expanding to greater Gauteng.</li>
        <li>Verified responders only.</li>
        <li>No membership fees – pay only when you need help.</li>
      </ul>
      <h2>Want to join as a responder?</h2>
      <p>Visit our <a className="text-primary underline" href="/driver/signup">driver sign-up page</a> to apply.</p>
    </LegalPage>
  );
}
