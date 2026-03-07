import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";

// Initialize Sentry error tracking (requires VITE_SENTRY_DSN env var)
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
