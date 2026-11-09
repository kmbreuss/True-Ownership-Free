import { createRoot } from "react-dom/client";
import { AuthProvider } from "./lib/auth-context";
import App from "./App";
import { DevPreviewBanner } from "./DevPreviewBanner";
import "./index.css";
import { PhoneReadability } from "./components/PhoneReadability";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    {import.meta.env.DEV && <DevPreviewBanner />}
    <App />
    <PhoneReadability />
  </AuthProvider>,
);
