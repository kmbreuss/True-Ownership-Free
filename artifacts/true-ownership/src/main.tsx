import { createRoot } from "react-dom/client";
import { AuthProvider } from "./lib/auth-context";
import App from "./free/FreeApp";
import "./index.css";
import { PhoneReadability } from "./components/PhoneReadability";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
    <PhoneReadability />
  </AuthProvider>,
);
