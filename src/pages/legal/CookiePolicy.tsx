import LegalPage from "./LegalPage";

export default function CookiePolicy() {
  return (
    <LegalPage title="Cookie Policy" updated="May 2026">
      <p>This policy explains how Now-Now Assist uses cookies and similar technologies on our website and web app.</p>
      <h2>What are cookies?</h2>
      <p>Cookies are small text files placed on your device by websites you visit. They help sites work properly and provide a better user experience.</p>
      <h2>How we use cookies</h2>
      <ul>
        <li><strong>Essential cookies</strong> – required for login, sessions and security.</li>
        <li><strong>Functional cookies</strong> – remember your preferences (e.g. saved locations).</li>
        <li><strong>Analytics cookies</strong> – help us understand how the site is used so we can improve it.</li>
      </ul>
      <h2>Managing cookies</h2>
      <p>You can disable cookies in your browser settings, but parts of the service (such as staying signed in) may not work correctly.</p>
    </LegalPage>
  );
}
