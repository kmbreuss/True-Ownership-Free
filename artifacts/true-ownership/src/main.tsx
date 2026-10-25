import { createRoot } from "react-dom/client";
import { AuthProvider } from "./lib/auth-context";
import App from "./App";
import { DevPreviewBanner } from "./DevPreviewBanner";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    {import.meta.env.DEV && <DevPreviewBanner />}
    <App />
  </AuthProvider>,
);
